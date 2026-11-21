import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { randomUUID, randomInt } from 'node:crypto';
import { extname, join, normalize, resolve } from 'node:path';
import { SCENARIOS, getScenario, correctSpots, isPickable, publicScenario } from './scenarios.mjs';

const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ'; // no I/L/O: easy to read out loud
const MAX_PLAYERS = 60;
const MAX_AGE_MS = 48 * 3600 * 1000;

class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

const shuffle = (a) => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = randomInt(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };

// Random scenarios, preferring ones not in `exclude` (already played); refills
// with played ones once everything has been seen.
export function pickScenarios(count, exclude = []) {
  const want = Math.min(Math.max(Math.round(Number(count)) || 10, 1), SCENARIOS.length);
  const seen = new Set(Array.isArray(exclude) ? exclude.map(String) : []);
  const ids = SCENARIOS.map((s) => s.id);
  return [...shuffle(ids.filter((id) => !seen.has(id))), ...shuffle(ids.filter((id) => seen.has(id)))].slice(0, want);
}

export function createApp(db, { publicDir } = {}) {
  const q = {
    game: db.prepare('SELECT * FROM games WHERE code = ?'),
    insertGame: db.prepare('INSERT INTO games (code, scenario_ids, history, created_at) VALUES (?, ?, ?, ?)'),
    setNext: db.prepare('UPDATE games SET next_code = ? WHERE code = ?'),
    hostOf: db.prepare('SELECT * FROM players WHERE game_code = ? AND is_host = 1'),
    setStatus: db.prepare('UPDATE games SET status = ? WHERE code = ?'),
    players: db.prepare('SELECT id, nickname, is_host FROM players WHERE game_code = ? ORDER BY id'),
    playerByToken: db.prepare('SELECT * FROM players WHERE game_code = ? AND token = ?'),
    playerByName: db.prepare('SELECT * FROM players WHERE game_code = ? AND nickname = ? COLLATE NOCASE'),
    insertPlayer: db.prepare('INSERT INTO players (game_code, nickname, token, is_host, joined_at) VALUES (?, ?, ?, ?, ?)'),
    answers: db.prepare('SELECT player_id, scenario_id, spot FROM answers WHERE game_code = ?'),
    insertAnswer: db.prepare('INSERT OR IGNORE INTO answers (game_code, player_id, scenario_id, spot, answered_at) VALUES (?, ?, ?, ?, ?)'),
    purge: db.prepare('DELETE FROM games WHERE created_at < ?'),
  };

  const cleanName = (n) => {
    const s = String(n ?? '').replace(/\s+/g, ' ').trim().slice(0, 20);
    if (!s) throw new HttpError(400, 'Pick a nickname');
    return s;
  };

  function getGame(code) {
    const g = q.game.get(String(code).toUpperCase());
    if (!g) throw new HttpError(404, 'Game not found');
    return g;
  }

  function newCode() {
    for (;;) {
      const c = Array.from({ length: 4 }, () => CODE_ALPHABET[randomInt(CODE_ALPHABET.length)]).join('');
      if (!q.game.get(c)) return c;
    }
  }

  function addPlayer(code, nickname, isHost) {
    if (q.players.all(code).length >= MAX_PLAYERS) throw new HttpError(409, 'Game is full');
    if (q.playerByName.get(code, nickname)) throw new HttpError(409, 'That nickname is taken in this game');
    const token = randomUUID();
    const r = q.insertPlayer.run(code, nickname, token, isHost ? 1 : 0, Date.now());
    return { playerId: Number(r.lastInsertRowid), token };
  }

  function newGame(hostNickname, count, exclude = [], history = []) {
    const ids = pickScenarios(count, [...history, ...(Array.isArray(exclude) ? exclude : [])]);
    q.purge.run(Date.now() - MAX_AGE_MS);
    const c = newCode();
    q.insertGame.run(c, JSON.stringify(ids), JSON.stringify([...new Set([...history, ...ids])]), Date.now());
    return { code: c, ...addPlayer(c, hostNickname, true) };
  }

  function state(game, me) {
    const players = q.players.all(game.code);
    const answers = q.answers.all(game.code);
    const ids = JSON.parse(game.scenario_ids);
    const answered = new Map();
    for (const a of answers) answered.set(a.player_id, (answered.get(a.player_id) ?? 0) + 1);

    const out = {
      code: game.code,
      status: game.status,
      total: ids.length,
      players: players.map((p) => ({ id: p.id, nickname: p.nickname, isHost: !!p.is_host, answered: answered.get(p.id) ?? 0 })),
      you: me ? { id: me.id, nickname: me.nickname, isHost: !!me.is_host } : null,
    };
    if (!me) return out; // anonymous visitor: only enough to show a join form
    if (game.next_code) out.next = game.next_code;

    out.scenarios = ids.map((id) => publicScenario(getScenario(id)));
    out.myAnswers = Object.fromEntries(answers.filter((a) => a.player_id === me.id).map((a) => [a.scenario_id, a.spot]));

    if (game.status === 'revealed') {
      out.results = ids.map((id) => {
        const s = getScenario(id);
        const votes = {};
        for (const a of answers) if (a.scenario_id === id) (votes[a.spot] ??= []).push(a.player_id);
        return { scenarioId: id, correct: correctSpots(s), explanation: s.explanation, votes };
      });
      const score = {};
      for (const r of out.results) for (const sp of r.correct) for (const pid of r.votes[sp] ?? []) score[pid] = (score[pid] ?? 0) + 1;
      out.scores = Object.fromEntries(players.map((p) => [p.id, score[p.id] ?? 0]));
    }
    return out;
  }

  const auth = (game, req) => {
    const token = req.headers['x-token'];
    return token ? q.playerByToken.get(game.code, String(token)) ?? null : null;
  };
  const requireHost = (me) => { if (!me?.is_host) throw new HttpError(403, 'Only the organizer can do that'); };

  // ---- API -----------------------------------------------------------------
  async function api(req, url, body) {
    const m = url.pathname.match(/^\/api\/games(?:\/([A-Za-z]{4}))?(?:\/(join|answers|start|reveal|again))?$/);
    if (!m) throw new HttpError(404, 'Not found');
    const [, code, action] = m;

    if (!code) {
      if (req.method !== 'POST') throw new HttpError(405, 'Method not allowed');
      const nickname = cleanName(body.nickname);
      return newGame(nickname, body.scenarioCount, body.exclude);
    }

    const game = getGame(code);
    const me = auth(game, req);

    if (!action) {
      if (req.method !== 'GET') throw new HttpError(405, 'Method not allowed');
      return state(game, me);
    }
    if (req.method !== 'POST') throw new HttpError(405, 'Method not allowed');

    switch (action) {
      case 'join': {
        if (me) return { code: game.code, playerId: me.id, token: me.token };
        if (game.status === 'revealed') throw new HttpError(409, 'This game is already over');
        return { code: game.code, ...addPlayer(game.code, cleanName(body.nickname), false) };
      }
      case 'start':
        requireHost(me);
        if (game.status === 'lobby') q.setStatus.run('playing', game.code);
        return state(getGame(code), me);
      case 'reveal':
        requireHost(me);
        if (game.status !== 'revealed') q.setStatus.run('revealed', game.code);
        return state(getGame(code), me);
      case 'again': { // organizer starts a new round for the same group, with new situations
        requireHost(me);
        if (game.status !== 'revealed') throw new HttpError(409, 'Reveal the results first');
        if (game.next_code) {
          const host = q.hostOf.get(game.next_code);
          if (host) return { code: game.next_code, playerId: host.id, token: host.token };
        }
        const r = newGame(me.nickname, JSON.parse(game.scenario_ids).length, body.exclude, JSON.parse(game.history ?? '[]'));
        q.setNext.run(r.code, game.code);
        return r;
      }
      case 'answers': {
        if (!me) throw new HttpError(401, 'Join the game first');
        if (game.status !== 'playing') throw new HttpError(409, 'The game is not accepting answers');
        const s = getScenario(String(body.scenarioId));
        if (!s || !JSON.parse(game.scenario_ids).includes(s.id)) throw new HttpError(400, 'Unknown scenario');
        const spot = Number(body.spot);
        if (!Number.isInteger(spot) || !isPickable(s, spot)) throw new HttpError(400, 'You cannot pick that spot');
        q.insertAnswer.run(game.code, me.id, s.id, spot, Date.now()); // first answer wins
        return state(game, me);
      }
    }
  }

  // ---- static --------------------------------------------------------------
  const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon' };
  const root = publicDir ? resolve(publicDir) : null;

  async function serveStatic(res, pathname) {
    if (!root) throw new HttpError(404, 'Not found');
    const isPage = pathname === '/' || /^\/g\/[A-Za-z]{4}\/?$/.test(pathname);
    const file = isPage ? 'index.html' : normalize(pathname).replace(/^(\.\.[/\\])+/, '').slice(1);
    const full = join(root, file);
    if (!full.startsWith(root)) throw new HttpError(404, 'Not found');
    try {
      const data = await readFile(full);
      res.writeHead(200, { 'content-type': MIME[extname(full)] ?? 'application/octet-stream', 'cache-control': 'no-cache' });
      res.end(data);
    } catch { throw new HttpError(404, 'Not found'); }
  }

  const send = (res, status, data) => {
    res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
    res.end(JSON.stringify(data));
  };

  return createServer(async (req, res) => {
    try {
      const url = new URL(req.url, 'http://x');
      if (url.pathname === '/healthz') { res.end('ok'); return; }
      if (url.pathname.startsWith('/api/')) {
        let raw = '';
        for await (const chunk of req) { raw += chunk; if (raw.length > 50_000) throw new HttpError(413, 'Too large'); }
        let body = {};
        if (raw) { try { body = JSON.parse(raw); } catch { throw new HttpError(400, 'Invalid JSON'); } }
        return send(res, 200, await api(req, url, body));
      }
      await serveStatic(res, url.pathname);
    } catch (e) {
      if (!(e instanceof HttpError)) console.error(e);
      const status = e instanceof HttpError ? e.status : 500;
      send(res, status, { error: e instanceof HttpError ? e.message : 'Server error' });
    }
  });
}
