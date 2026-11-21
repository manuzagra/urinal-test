import { renderScene, awkward, jokeFor } from '/scene.js';
import { LANGS, setLang, getLang, t, pick } from '/i18n.js';

const $app = document.getElementById('app');
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const store = {
  get: (k) => { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } },
  set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
};

async function api(path, { method = 'GET', body, token } = {}) {
  const r = await fetch(path, { method, headers: { 'content-type': 'application/json', ...(token && { 'x-token': token }) }, body: body && JSON.stringify(body) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) {
    const key = 'err.' + j.code, msg = t(key);
    throw Object.assign(new Error(msg !== key ? msg : j.error || t('err.generic')), { status: r.status });
  }
  return j;
}

function toast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg; el.classList.add('show');
  clearTimeout(toast.t); toast.t = setTimeout(() => el.classList.remove('show'), 1800);
}

// Scenario ids this browser has already played, so new games avoid repeats.
function rememberSeen(ids) {
  const seen = store.get('urinal:seen') ?? [];
  if (ids.every((id) => seen.includes(id))) return;
  store.set('urinal:seen', [...seen.filter((id) => !ids.includes(id)), ...ids].slice(-300));
}

const spotLabel = (sc, k) => t({ stall: 'spot.stall', low: 'spot.low' }[sc.spots[k]] ?? 'spot.urinal', { n: Number(k) + 1 });
const COUNTS = [3, 5, 10, 15, 20, 30];
const countOptions = (sel) => COUNTS.map((n) => `<option value="${n}"${n === sel ? ' selected' : ''}>${t(n <= 3 ? 'count.quick' : n >= 20 ? 'count.long' : 'count.n', { n })}</option>`).join('');
const DIFFS = ['easy', 'medium', 'hard', 'mixed'];
const levelOptions = (sel) => DIFFS.map((l) => `<option value="${l}"${l === sel ? ' selected' : ''}>${t('level.' + l)}</option>`).join('');
const levelBadge = (sc) => (sc.level ? `<span class="lvl ${sc.level}">${t('level.' + sc.level)}</span>` : '');
const context = (sc) => (sc.context ? `<p class="context">📍 ${esc(sc.context)}</p>` : '');
const hash = (str) => { let h = 7; for (const c of String(str)) h = (h * 31 + c.charCodeAt(0)) | 0; return h; };

setLang(store.get('urinal:lang') ?? 'es');
const m = location.pathname.match(/^\/g\/([A-Za-z]{4})/);
m ? gameScreen(m[1].toUpperCase()) : homeScreen();

// ---------------------------------------------------------------- home
function homeScreen() {
  document.title = t('app.name');
  const lastName = store.get('urinal:name') ?? '';
  $app.innerHTML = `
    <div class="hero"><div class="big">🚽</div><h1>${t('app.name')}</h1>
      <p class="muted">${t('home.tagline')}</p></div>
    <form class="card" id="create">
      <h2>${t('home.create')}</h2>
      <label>${t('home.nickname')}</label><input name="nickname" maxlength="20" value="${esc(lastName)}" placeholder="${t('home.placeholder')}" required autocomplete="off">
      <label>${t('home.count')}</label>
      <select name="count">${countOptions(10)}</select>
      <p class="muted small">${t('home.countHint')}</p>
      <label>${t('home.level')}</label>
      <select name="level" id="level">${levelOptions(store.get('urinal:level') ?? 'mixed')}</select>
      <p class="muted small" id="levelHint">${t('level.hint.' + (store.get('urinal:level') ?? 'mixed'))}</p>
      <label>${t('home.lang')}</label>
      <select name="lang" id="lang">${Object.entries(LANGS).map(([k, v]) => `<option value="${k}"${k === getLang() ? ' selected' : ''}>${v}</option>`).join('')}</select>
      <p class="err"></p><button>${t('home.createBtn')}</button>
    </form>
    <form class="card" id="join">
      <h2>${t('home.join')}</h2>
      <label>${t('home.code')}</label><input name="code" maxlength="4" style="text-transform:uppercase" required autocomplete="off">
      <label>${t('home.nickname')}</label><input name="nickname" maxlength="20" value="${esc(lastName)}" placeholder="${t('home.placeholder')}" required autocomplete="off">
      <p class="err"></p><button class="secondary">${t('home.joinBtn')}</button>
    </form>`;

  $app.querySelector('#level').addEventListener('change', (e) => { store.set('urinal:level', e.target.value); $app.querySelector('#levelHint').textContent = t('level.hint.' + e.target.value); });
  $app.querySelector('#lang').addEventListener('change', (e) => { store.set('urinal:lang', e.target.value); setLang(e.target.value); homeScreen(); });
  const run = (form, fn) => form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const err = form.querySelector('.err'); err.textContent = '';
    const f = Object.fromEntries(new FormData(form));
    store.set('urinal:name', f.nickname);
    try { await fn(f); } catch (x) { err.textContent = x.message; }
  });
  run($app.querySelector('#create'), async (f) => {
    const r = await api('/api/games', { method: 'POST', body: { nickname: f.nickname, scenarioCount: Number(f.count), lang: f.lang, level: f.level, exclude: store.get('urinal:seen') ?? [] } });
    store.set('urinal:' + r.code, { token: r.token });
    location.href = '/g/' + r.code;
  });
  run($app.querySelector('#join'), async (f) => {
    const code = f.code.toUpperCase();
    const r = await api(`/api/games/${code}/join`, { method: 'POST', body: { nickname: f.nickname } });
    store.set('urinal:' + code, { token: r.token });
    location.href = '/g/' + code;
  });
}

// ---------------------------------------------------------------- game
function gameScreen(code) {
  let st = null, lastKey = '', lastRestKey = '', idx = null, busy = false, following = false, viewing = null;
  const token = () => store.get('urinal:' + code)?.token;

  const apply = (s) => {
    const key = JSON.stringify(s);
    if (key === lastKey) return;
    if (s.lang && s.lang !== getLang()) { setLang(s.lang); lastRestKey = ''; } // the game's language wins
    document.title = `${t('app.short')} · ${code}`;
    if (s.scenarios) rememberSeen(s.scenarios.map((x) => x.id));
    // While playing, other people's progress must not re-render the scene
    // under the player's finger (it would swallow a tap): patch the host bar only.
    const { players, ...rest } = s;
    const restKey = JSON.stringify(rest);
    const stillAnswering = s.scenarios && !s.scenarios.every((x) => x.id in s.myAnswers);
    if (st && stillAnswering && s.status === 'playing' && st.status === 'playing' && restKey === lastRestKey) {
      lastKey = key; st = s;
      const bar = $app.querySelector('.hostbar');
      if (bar) bar.outerHTML = hostBar();
      return;
    }
    lastKey = key; lastRestKey = restKey; st = s; render();
    if (s.next && s.you) followTo(s.next);
  };

  // The organizer started another round: everybody moves to its lobby with the same nickname.
  async function followTo(next) {
    if (following) return;
    following = true;
    try {
      if (!store.get('urinal:' + next)?.token) {
        const r = st.you.isHost
          ? await api(`/api/games/${code}/again`, { method: 'POST', token: token() })
          : await api(`/api/games/${next}/join`, { method: 'POST', body: { nickname: st.you.nickname } });
        store.set('urinal:' + next, { token: r.token });
      }
    } catch { /* e.g. nickname taken: the join form on the next page handles it */ }
    location.href = '/g/' + next;
  }
  const poll = async () => {
    try { apply(await api(`/api/games/${code}`, { token: token() })); }
    catch (e) {
      if (e.status === 404) {
        $app.innerHTML = `<div class="card center"><h2>${t('game.notFound')}</h2><p class="muted">${t('game.expired')}</p><a href="/"><button>${t('game.home')}</button></a></div>`;
        return;
      }
    }
    setTimeout(poll, 1500);
  };
  poll();

  const act = async (path, body) => {
    try { apply(await api(`/api/games/${code}/${path}`, { method: 'POST', token: token(), body })); }
    catch (e) { toast(e.message); }
  };

  const firstUnanswered = () => Math.max(0, st.scenarios.findIndex((s) => !(s.id in st.myAnswers)));
  const finished = () => st.scenarios.every((s) => s.id in st.myAnswers);
  const link = () => `${location.origin}/g/${code}`;

  function render() {
    if (!st) return;
    if (!st.you) return joinView();
    if (st.status === 'lobby') return lobbyView();
    if (st.status === 'playing') return finished() && idx === null ? waitingView() : playView();
    return resultsView();
  }

  const header = () => `<div class="row between"><b>🚽 ${t('app.short')}</b><span class="muted">${t('game.label')} <b>${code}</b> · ${esc(st.you.nickname)}</span></div>`;
  const hostBar = () => {
    if (!st.you?.isHost) return '';
    if (st.status === 'lobby') return `<div class="hostbar row between"><span>${t('host.in', { n: st.players.length })}</span><button data-act="start">${t('host.start')}</button></div>`;
    const done = st.players.filter((p) => p.answered === st.total).length;
    return `<div class="hostbar row between"><span>${t('host.finished', { done, n: st.players.length })}</span><button data-act="reveal">${t('host.reveal')}</button></div>`;
  };

  function joinView() {
    $app.innerHTML = `<div class="hero"><div class="big">🚽</div><h1>${t('join.title', { code })}</h1>
      <p class="muted">${t('join.waiting', { n: st.players.length })}${st.status !== 'lobby' ? t('join.inProgress') : ''}</p></div>
      <form class="card" id="j"><label>${t('home.nickname')}</label><input name="nickname" maxlength="20" value="${esc(store.get('urinal:name') ?? '')}" placeholder="${t('home.placeholder')}" required autocomplete="off">
      <p class="err"></p><button>${t('join.btn')}</button></form>`;
    $app.querySelector('#j').addEventListener('submit', async (e) => {
      e.preventDefault();
      const nickname = new FormData(e.target).get('nickname');
      store.set('urinal:name', nickname);
      try {
        const r = await api(`/api/games/${code}/join`, { method: 'POST', body: { nickname } });
        store.set('urinal:' + code, { token: r.token });
        apply(await api(`/api/games/${code}`, { token: r.token }));
      } catch (x) { e.target.querySelector('.err').textContent = x.message; }
    });
  }

  function lobbyView() {
    $app.innerHTML = `${header()}
      <div class="card center"><h2>${t('lobby.invite')}</h2>
        <div class="code">${code}</div>
        <p class="muted small" style="word-break:break-all">${esc(link())}</p>
        <div class="row" style="justify-content:center"><button data-act="copy">${t('lobby.copy')}</button>${navigator.share ? `<button class="secondary" data-act="share">${t('lobby.share')}</button>` : ''}</div></div>
      <div class="card"><h3>${t('lobby.players', { n: st.players.length })}</h3>${st.players.map((p) => `<span class="chip${p.isHost ? ' host' : ''}${p.id === st.you.id ? ' me' : ''}">${esc(p.nickname)}</span>`).join('')}</div>
      ${st.you.isHost ? '' : `<p class="muted center">${t('lobby.waiting')}</p>`}${hostBar()}`;
  }

  function playView() {
    if (idx === null) idx = firstUnanswered();
    idx = Math.min(Math.max(idx, 0), st.total - 1);
    const sc = st.scenarios[idx];
    const mine = st.myAnswers[sc.id];
    const answered = Object.keys(st.myAnswers).length;
    $app.innerHTML = `${header()}
      <div class="card">
        <div class="row between"><h2>${idx + 1}. ${esc(sc.title)}</h2><span class="muted">${t('play.answered', { n: answered, total: st.total })}</span></div>
        <div class="progress"><i style="width:${(100 * answered) / st.total}%"></i></div>
        ${levelBadge(sc)}${context(sc)}
        <p class="muted" style="margin:.2em 0 .8em">${mine === undefined ? t('play.hint') : t('play.locked')}</p>
        ${renderScene(sc, { mine, mineLabel: t('who.you'), pickable: mine === undefined })}
        <div class="dots">${st.scenarios.map((s, i) => `<button data-go="${i}" class="${s.id in st.myAnswers ? 'done' : ''} ${i === idx ? 'cur' : ''}">${i + 1}</button>`).join('')}</div>
        <div class="nav"><button class="secondary" data-go="${idx - 1}" ${idx === 0 ? 'disabled' : ''}>${t('play.back')}</button>
          <button class="secondary" data-go="${idx + 1}" ${idx === st.total - 1 ? 'disabled' : ''}>${t('play.next')}</button></div>
      </div>${hostBar()}`;
  }

  function waitingView() {
    $app.innerHTML = `${header()}
      <div class="card center"><div class="hero" style="padding:8px"><div class="big">✅</div><h2>${t('wait.title')}</h2>
        <p class="muted">${st.you.isHost ? t('wait.host') : t('wait.player')}</p></div></div>
      <div class="card"><h3>${t('wait.who')}</h3><table class="board">${st.players.map((p) => `<tr><td>${esc(p.nickname)}${p.isHost ? ' 👑' : ''}</td><td>${p.answered}/${st.total}${p.answered === st.total ? ' ✅' : ''}</td></tr>`).join('')}</table>
      <p><button class="secondary" data-go="0">${t('wait.review')}</button></p></div>${hostBar()}`;
  }

  function resultsView() {
    const name = Object.fromEntries(st.players.map((p) => [p.id, p.nickname]));
    if (!(viewing in name)) viewing = st.you.id;
    const isMe = viewing === st.you.id;
    const who = isMe ? t('res.you') : esc(name[viewing]);
    const ranked = [...st.players].sort((a, b) => st.scores[b.id] - st.scores[a.id] || a.nickname.localeCompare(b.nickname));
    const medal = (p) => { const better = ranked.filter((q) => st.scores[q.id] > st.scores[p.id]).length; return ['🥇', '🥈', '🥉'][better] ?? `${better + 1}.`; };
    const pickOf = (r, pid) => { for (const [k, ids] of Object.entries(r.votes)) if (ids.includes(pid)) return Number(k); return undefined; };
    const scOf = (r) => st.scenarios.find((s) => s.id === r.scenarioId);

    // awards: best score, and the one who stood right next to people the most
    const flashes = Object.fromEntries(st.players.map((p) => [p.id, st.results.filter((r) => awkward(scOf(r), pickOf(r, p.id), r.correct)).length]));
    const topScore = st.scores[ranked[0]?.id] ?? 0;
    const masters = ranked.filter((p) => topScore > 0 && st.scores[p.id] === topScore);
    const maxFlash = Math.max(0, ...Object.values(flashes));
    const flashers = st.players.filter((p) => maxFlash > 0 && flashes[p.id] === maxFlash);
    const names = (ps) => ps.map((p) => `<b>${esc(p.nickname)}</b>`).join(', ');
    const awards = `<div class="card awards"><h3>${t('res.awards')}</h3>
      ${masters.length ? `<div>${t('award.master')}: ${names(masters)}</div>` : ''}
      <div>${flashers.length ? `${t('award.flasher')}: ${names(flashers)} <span class="muted small">(${t('award.flasherN', { n: maxFlash })})</span>` : t('award.none')}</div></div>`;

    // jokes rotate per viewed player and game, so a page never repeats one before the list runs out
    const used = {}, base = Math.abs(hash(code + ':' + viewing)); // new round, new starting joke
    const nextJoke = (kind, vars) => pick(kind, base + (used[kind] = (used[kind] ?? -1) + 1), vars);
    const cards = st.results.map((r, i) => {
      const sc = scOf(r);
      const counts = Object.fromEntries(Object.entries(r.votes).map(([k, v]) => [k, v.length]));
      const voters = Object.values(counts).reduce((a, b) => a + b, 0);
      const top = Math.max(0, ...Object.values(counts));
      const p = pickOf(r, viewing);
      const label = (k) => spotLabel(sc, k);
      const popular = Object.keys(counts).filter((k) => counts[k] === top && top > 0).map(label).join(' / ') || '—';
      const good = p !== undefined && r.correct.includes(p);
      const verdict = p === undefined ? `<span class="muted">${t('res.noAnswer', { who })}</span>`
        : good ? `<span class="ok">${t('res.gotIt', { who })}</span>` : `<span class="bad">${t('res.wrong', { who })}</span>`;
      const aw = jokeFor(sc, p, r.correct); // a joke for every wrong pick
      // very wrong: the neighbours roast you in comic bubbles (the kid only tells you off)
      let speech = [];
      if (aw) {
        const line = nextJoke(aw.kind, { who: name[viewing] });
        const kidAt = aw.near.find((j) => (sc.occupied[j]?.pose ?? sc.occupied[j]) === 'kid');
        speech = aw.kind === 'sandwich' ? aw.near.map((at, j) => ({ at, text: line[j] }))
          : [{ at: aw.kind === 'kid' ? kidAt : aw.near[0], text: line }];
      }
      const joke = good ? `<p class="praise">${nextJoke('praise')}</p>` : '';
      const whoPicked = Object.entries(r.votes).sort(([a], [b]) => a - b).map(([k, ids]) => `<div class="small"><b>${label(k)}</b>${r.correct.includes(Number(k)) ? ' ✅' : ''}: ${ids
        .map((id) => `<button class="name${id === viewing ? ' sel' : ''}" data-view="${id}">${esc(name[id])}</button>`).join(' ')}</div>`).join('');
      return `<div class="card"><div class="row between"><h2>${i + 1}. ${esc(sc.title)}</h2>${verdict}</div>
        ${levelBadge(sc)}${context(sc)}
        ${renderScene(sc, { mine: p, mineLabel: isMe ? t('who.you') : name[viewing], correct: r.correct, votes: counts, total: voters, speech })}
        ${joke}
        <div class="facts"><div>✅ <b>${t('res.correct')}:</b> ${r.correct.map(label).join(' / ')}</div><div>👥 <b>${t('res.popular')}:</b> ${popular}</div></div>
        <p class="muted small" style="margin:.2em 0">${esc(r.explanation)}</p>${whoPicked}</div>`;
    }).join('');

    $app.innerHTML = `${header()}
      <div class="card"><h2>${t('res.title')}</h2><p class="muted small" style="margin:0 0 .4em">${t('res.tapHint')}</p>
        <table class="board">${ranked.map((p) => `<tr class="pick${p.id === viewing ? ' sel' : ''}" data-view="${p.id}"><td>${medal(p)} ${esc(p.nickname)}${p.id === st.you.id ? t('res.youSuffix') : ''}</td><td>${st.scores[p.id]}/${st.total}</td></tr>`).join('')}</table></div>
      ${awards}
      <div class="viewing"><span class="muted small">${t('res.showing')}</span>${ranked.map((p) => `<button class="name${p.id === viewing ? ' sel' : ''}" data-view="${p.id}">${p.id === st.you.id ? t('res.you') : esc(p.nickname)}</button>`).join('')}</div>
      ${st.you.isHost ? '' : `<p class="muted center">${t('res.follow')}</p>`}
      ${cards}<p class="center"><a href="/"><button class="secondary">${t('res.newGame')}</button></a></p>
      ${st.you.isHost ? `<div class="hostbar row between"><span>${t('res.again')}</span><select id="againCount">${countOptions(COUNTS.includes(st.total) ? st.total : 10)}</select><select id="againLevel">${levelOptions(st.level ?? 'mixed')}</select><button data-act="again">${t('res.againBtn')}</button></div>` : ''}`;
  }

  // one delegated click handler for every screen
  $app.addEventListener('click', async (e) => {
    const el = e.target;
    const view = el.closest('[data-view]');
    if (view) { viewing = Number(view.dataset.view); return render(); }
    const go = el.closest('[data-go]');
    if (go && !go.disabled) { idx = Number(go.dataset.go); return render(); }
    const a = el.closest('[data-act]')?.dataset.act;
    if (a === 'copy') { try { await navigator.clipboard.writeText(link()); toast(t('lobby.copied')); } catch { prompt(t('lobby.copyPrompt'), link()); } }
    else if (a === 'share') navigator.share({ title: t('app.name'), text: t('lobby.shareText'), url: link() }).catch(() => {});
    else if (a === 'start') act('start');
    else if (a === 'again') {
      try {
        const scenarioCount = Number($app.querySelector('#againCount')?.value) || st.total;
        const level = $app.querySelector('#againLevel')?.value;
        const r = await api(`/api/games/${code}/again`, { method: 'POST', token: token(), body: { scenarioCount, level, exclude: store.get('urinal:seen') ?? [] } });
        store.set('urinal:' + r.code, { token: r.token });
        location.href = '/g/' + r.code;
      } catch (x) { toast(x.message); }
    }
    else if (a === 'reveal') {
      const pending = st.players.filter((p) => p.answered < st.total).length;
      if (!pending || confirm(t('host.confirmPending', { n: pending }))) act('reveal');
    }
    const spot = el.closest('[data-spot]');
    if (spot && spot.dataset.spot !== '' && !busy && st?.status === 'playing') {
      busy = true;
      const sc = st.scenarios[idx];
      await act('answers', { scenarioId: sc.id, spot: Number(spot.dataset.spot) });
      setTimeout(() => {
        busy = false;
        if (st.status !== 'playing') return;
        const next = st.scenarios.findIndex((s, i) => i > idx && !(s.id in st.myAnswers));
        const any = st.scenarios.findIndex((s) => !(s.id in st.myAnswers));
        idx = next >= 0 ? next : any >= 0 ? any : null;
        render();
      }, 650);
    }
  });
}
