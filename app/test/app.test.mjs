import test from 'node:test';
import assert from 'node:assert/strict';
import { openDb } from '../src/db.mjs';
import { createApp, pickScenarios } from '../src/app.mjs';
import { LEVELS } from '../src/scenarios.mjs';
import { SCENARIOS, correctSpots, isPickable, localize } from '../src/scenarios.mjs';
import { ES } from '../src/scenarios.es.mjs';
import { awkward, jokeFor, renderScene } from '../public/scene.js';
import { JOKE_LISTS } from '../public/i18n.js';

test('every scenario has a valid, pickable, non-empty correct answer', () => {
  for (const s of SCENARIOS) {
    const c = correctSpots(s);
    assert.ok(c.length > 0, s.id);
    for (const i of c) assert.ok(isPickable(s, i), `${s.id}:${i}`);
  }
});

test('scenario pack: enough, unique ids, explanations, valid tags and dividers', () => {
  assert.ok(SCENARIOS.length >= 50, `only ${SCENARIOS.length} scenarios`);
  assert.equal(new Set(SCENARIOS.map((s) => s.id)).size, SCENARIOS.length);
  for (const s of SCENARIOS) {
    assert.ok(s.title && s.explanation, s.id);
    assert.ok(s.spots.length >= 3 && s.spots.length <= 7, s.id);
    for (const i of Object.keys(s.occupied)) assert.ok(['urinal', 'low', 'dirty', 'stall'].includes(s.spots[i]), `${s.id}: guy on ${s.spots[i]}`);
    for (const d of s.dividers ?? []) assert.ok(d >= 0 && d < s.spots.length - 1, `${s.id}: divider ${d}`);
  }
});

test('pickScenarios prefers unplayed scenarios, then refills', () => {
  const all = SCENARIOS.map((s) => s.id);
  const played = all.slice(0, all.length - 5);
  const five = pickScenarios(5, played);
  assert.deepEqual([...five].sort(), all.slice(-5).sort());
  const ten = pickScenarios(10, played);
  assert.equal(new Set(ten).size, 10);
  assert.ok(all.slice(-5).every((id) => ten.includes(id)));
  assert.equal(pickScenarios(999).length, all.length);
  assert.equal(pickScenarios('junk', 'junk').length, 10);
});

test('full game flow: create, join, answer, reveal; nothing leaks before reveal', async () => {
  const server = createApp(openDb(':memory:'));
  await new Promise((r) => server.listen(0, r));
  const base = `http://127.0.0.1:${server.address().port}`;
  const call = async (path, { method = 'GET', body, token } = {}) => {
    const r = await fetch(base + path, { method, headers: { 'content-type': 'application/json', ...(token && { 'x-token': token }) }, body: body && JSON.stringify(body) });
    return { status: r.status, json: await r.json() };
  };
  try {
    const host = (await call('/api/games', { method: 'POST', body: { nickname: 'Host', scenarioCount: 3 } })).json;
    const bob = (await call(`/api/games/${host.code}/join`, { method: 'POST', body: { nickname: 'Bob' } })).json;
    assert.equal((await call(`/api/games/${host.code}/join`, { method: 'POST', body: { nickname: 'bob' } })).status, 409);

    // Answers are refused until the game starts, and only the organizer can start.
    let st = (await call(`/api/games/${host.code}`, { token: bob.token })).json;
    assert.equal(st.scenarios.length, 3);
    const sc = st.scenarios[0];
    const free = sc.spots.findIndex((k, i) => ['urinal', 'low', 'dirty', 'stall'].includes(k) && !(i in sc.occupied));
    assert.ok(free >= 0);
    assert.equal((await call(`/api/games/${host.code}/answers`, { method: 'POST', token: bob.token, body: { scenarioId: sc.id, spot: free } })).status, 409);
    assert.equal((await call(`/api/games/${host.code}/start`, { method: 'POST', token: bob.token })).status, 403);
    await call(`/api/games/${host.code}/start`, { method: 'POST', token: host.token });

    assert.equal((await call(`/api/games/${host.code}/answers`, { method: 'POST', token: bob.token, body: { scenarioId: sc.id, spot: free } })).status, 200);
    const occ = Number(Object.keys(sc.occupied)[0] ?? -1);
    if (occ >= 0) assert.equal((await call(`/api/games/${host.code}/answers`, { method: 'POST', token: bob.token, body: { scenarioId: sc.id, spot: occ } })).status, 400);

    st = (await call(`/api/games/${host.code}`, { token: bob.token })).json;
    assert.equal(st.results, undefined);
    assert.equal(JSON.stringify(st).includes('explanation'), false);
    assert.equal((await call(`/api/games/${host.code}`)).json.scenarios, undefined);

    await call(`/api/games/${host.code}/reveal`, { method: 'POST', token: host.token });
    st = (await call(`/api/games/${host.code}`, { token: bob.token })).json;
    assert.equal(st.status, 'revealed');
    assert.equal(st.results.length, 3);
    assert.ok(st.results.find((r) => r.scenarioId === sc.id).votes[free].includes(bob.playerId));
  } finally { server.close(); }
});

test('play again: organizer starts a new round, players follow, situations do not repeat', async () => {
  const server = createApp(openDb(':memory:'));
  await new Promise((r) => server.listen(0, r));
  const base = `http://127.0.0.1:${server.address().port}`;
  const call = async (path, { method = 'GET', body, token } = {}) => {
    const r = await fetch(base + path, { method, headers: { 'content-type': 'application/json', ...(token && { 'x-token': token }) }, body: body && JSON.stringify(body) });
    return { status: r.status, json: await r.json() };
  };
  try {
    const host = (await call('/api/games', { method: 'POST', body: { nickname: 'Host', scenarioCount: 10 } })).json;
    const bob = (await call(`/api/games/${host.code}/join`, { method: 'POST', body: { nickname: 'Bob' } })).json;
    await call(`/api/games/${host.code}/start`, { method: 'POST', token: host.token });
    assert.equal((await call(`/api/games/${host.code}/again`, { method: 'POST', token: host.token })).status, 409);
    await call(`/api/games/${host.code}/reveal`, { method: 'POST', token: host.token });
    assert.equal((await call(`/api/games/${host.code}/again`, { method: 'POST', token: bob.token })).status, 403);

    const round2 = (await call(`/api/games/${host.code}/again`, { method: 'POST', token: host.token, body: { scenarioCount: 15 } })).json;
    assert.notEqual(round2.code, host.code);
    const again = (await call(`/api/games/${host.code}/again`, { method: 'POST', token: host.token })).json;
    assert.deepEqual(again, round2, 'idempotent');

    const old = (await call(`/api/games/${host.code}`, { token: bob.token })).json;
    assert.equal(old.next, round2.code);
    assert.equal((await call(`/api/games/${host.code}`)).json.next, undefined, 'outsiders do not see it');

    const bob2 = (await call(`/api/games/${round2.code}/join`, { method: 'POST', body: { nickname: 'Bob' } })).json;
    const st2 = (await call(`/api/games/${round2.code}`, { token: bob2.token })).json;
    assert.equal(st2.status, 'lobby');
    assert.equal(st2.you.isHost, false);
    assert.equal(st2.players.find((p) => p.isHost).nickname, 'Host');
    const firstIds = new Set(old.scenarios.map((x) => x.id));
    assert.equal(st2.scenarios.length, 15, 'organizer chose 15 for round 2');
    assert.ok(st2.scenarios.every((x) => !firstIds.has(x.id)), 'round 2 repeats a situation');
  } finally { server.close(); }
});

test('every scenario is translated to Spanish (titles, context, tags, speech bubbles)', () => {
  for (const sc of SCENARIOS) {
    const es = ES[sc.id];
    assert.ok(es?.title && es.explanation, `${sc.id}: missing ES text`);
    assert.equal(!!es.context, !!sc.context, `${sc.id}: context`);
    for (const [i, p] of Object.entries(sc.occupied)) {
      if (typeof p !== 'object') continue;
      const l = localize(sc, 'es').occupied[i];
      if (p.tag) assert.ok(es.people?.[i]?.tag, `${sc.id}: tag ${i}`);
      if (p.say) assert.ok(es.people?.[i]?.say, `${sc.id}: say ${i}`);
      assert.equal(l.pose, p.pose, `${sc.id}: pose kept`);
    }
    for (const i of Object.keys(es.people ?? {})) assert.ok(typeof sc.occupied[i] === 'object', `${sc.id}: ES people ${i} has no English twin`);
  }
  assert.equal(Object.keys(ES).length, SCENARIOS.length);
});

test('awkward picks: next to a guy, sandwich, kid, and not across a divider or when correct', () => {
  const sc = { spots: ['urinal', 'urinal', 'urinal', 'urinal', 'urinal'], occupied: { 0: 'standing', 2: 'phone', 4: 'kid' } };
  assert.equal(awkward(sc, 1, [3])?.kind, 'sandwich');
  assert.equal(awkward(sc, 3, [1])?.kind, 'kid', 'a kid next to you is never a dick joke');
  assert.equal(awkward(sc, 1, [1]), null, 'correct picks are never roasted');
  assert.equal(awkward({ ...sc, occupied: { 0: 'standing' } }, 1, [4])?.kind, 'roast');
  assert.equal(awkward({ ...sc, occupied: { 0: 'standing' }, dividers: [0] }, 1, [4]), null, 'divider protects you');
  assert.equal(awkward({ spots: ['urinal', 'stall'], occupied: { 1: 'standing' } }, 0, [1]), null, 'guy in a stall sees nothing');
});

test('language: Spanish by default, English on request, kept by play again; errors have codes', async () => {
  const server = createApp(openDb(':memory:'));
  await new Promise((r) => server.listen(0, r));
  const base = `http://127.0.0.1:${server.address().port}`;
  const call = async (path, { method = 'GET', body, token } = {}) => {
    const r = await fetch(base + path, { method, headers: { 'content-type': 'application/json', ...(token && { 'x-token': token }) }, body: body && JSON.stringify(body) });
    return { status: r.status, json: await r.json() };
  };
  try {
    const es = (await call('/api/games', { method: 'POST', body: { nickname: 'A', scenarioCount: 999 } })).json;
    const stEs = (await call(`/api/games/${es.code}`, { token: es.token })).json;
    assert.equal(stEs.lang, 'es');
    assert.equal(stEs.scenarios.find((x) => x.id === 'empty-room').title, 'Baño vacío');
    assert.equal(stEs.scenarios.find((x) => x.id === 'your-boss').occupied[0].tag, 'Tu jefe');

    const en = (await call('/api/games', { method: 'POST', body: { nickname: 'A', scenarioCount: 999, lang: 'en' } })).json;
    const stEn = (await call(`/api/games/${en.code}`, { token: en.token })).json;
    assert.equal(stEn.lang, 'en');
    assert.equal(stEn.scenarios.find((x) => x.id === 'empty-room').title, 'Empty bathroom');
    assert.equal((await call('/api/games', { method: 'POST', body: { nickname: 'A', lang: 'xx' } })).status, 200);

    await call(`/api/games/${en.code}/start`, { method: 'POST', token: en.token });
    await call(`/api/games/${en.code}/reveal`, { method: 'POST', token: en.token });
    const rev = (await call(`/api/games/${en.code}`, { token: en.token })).json;
    assert.match(rev.results.find((x) => x.scenarioId === 'empty-room').explanation, /Nobody/);
    const again = (await call(`/api/games/${en.code}/again`, { method: 'POST', token: en.token, body: { scenarioCount: 3 } })).json;
    assert.equal((await call(`/api/games/${again.code}`, { token: again.token })).json.lang, 'en');
    const hard = (await call('/api/games', { method: 'POST', body: { nickname: 'A', scenarioCount: 5, level: 'hard' } })).json;
    const stHard = (await call(`/api/games/${hard.code}`, { token: hard.token })).json;
    assert.equal(stHard.level, 'hard');
    assert.ok(stHard.scenarios.every((x) => x.level === 'hard'));

    const dup = await call(`/api/games/${es.code}/join`, { method: 'POST', body: { nickname: 'a' } });
    assert.equal(dup.json.code, 'nickname_taken');
  } finally { server.close(); }
});

test('jokes: same shape in every language, sandwiches are dialogues, kids never get dick jokes', () => {
  for (const [lang, j] of Object.entries(JOKE_LISTS)) {
    const min = { roast: 25, sandwich: 12, miss: 25, kid: 6, kidMiss: 6, alone: 10, praise: 15 };
    for (const [k, n] of Object.entries(min)) assert.ok(j[k].length >= n, `${lang}: only ${j[k].length} ${k} jokes`);
    for (const [k, list] of Object.entries(j)) assert.equal(new Set(list.map(String)).size, list.length, `${lang}: duplicate ${k} joke`);
    for (const [k, list] of Object.entries(j)) assert.equal(list.length, JOKE_LISTS.es[k].length, `${k}: es/en have different counts`);
    for (const d of j.sandwich) assert.ok(Array.isArray(d) && d.length === 2, `${lang}: sandwich must be [left, right]`);
    assert.ok(j.miss.length >= 5 && j.kidMiss.length && j.alone.length, lang);
    for (const line of [...j.kid, ...j.kidMiss]) assert.doesNotMatch(line, /pito|polla|cacahuete|talla|dick|peanut|size/i, `${lang}: ${line}`);
  }
});

test('scene: comic bubbles make the scene taller and keep the text escaped', () => {
  const sc = { title: 't', spots: ['urinal', 'urinal', 'urinal'], occupied: { 0: 'standing', 2: 'phone' } };
  const plain = renderScene(sc, { mine: 1 });
  const comic = renderScene(sc, { mine: 1, speech: [{ at: 0, text: 'Hola <b>' }, { at: 2, text: '¿Dónde? 🔍' }] });
  const h = (svg) => Number(svg.match(/viewBox="0 [-\d.]+ [\d.]+ ([\d.]+)"/)[1]);
  assert.ok(h(comic) > h(plain));
  assert.equal((comic.match(/class="comic"/g) ?? []).length, 2);
  assert.ok(comic.includes('Hola &lt;b&gt;') && !comic.includes('<b>'));
});

test('every wrong pick gets a joke and a speaker; right picks and no answer get none', () => {
  const sc = { spots: ['urinal', 'urinal', 'urinal', 'urinal', 'urinal', 'stall'], occupied: { 0: 'standing', 5: 'standing' } };
  assert.equal(jokeFor(sc, 4, [4]), null);
  assert.equal(jokeFor(sc, undefined, [4]), null);
  assert.deepEqual(jokeFor(sc, 1, [4]), { kind: 'roast', near: [0] });
  assert.deepEqual(jokeFor(sc, 2, [4]), { kind: 'miss', near: [0] }, 'nearest guy at a urinal, not the one in the stall');
  assert.deepEqual(jokeFor({ ...sc, occupied: { 0: 'kid' } }, 3, [4]), { kind: 'kidMiss', near: [0] });
  assert.deepEqual(jokeFor({ ...sc, occupied: {} }, 2, [0, 4]), { kind: 'alone', near: [2] });
  for (const s2 of SCENARIOS) for (let i = 0; i < s2.spots.length; i++) {
    if (!isPickable(s2, i) || correctSpots(s2).includes(i)) continue;
    const j = jokeFor(s2, i, correctSpots(s2));
    assert.ok(j && j.near.length, `${s2.id}: wrong pick ${i} has no joke`);
  }
});

test('difficulty: every scenario has a level, enough of each, picking respects it', () => {
  for (const sc of SCENARIOS) assert.ok(LEVELS.includes(sc.level), `${sc.id}: no level`);
  for (const l of LEVELS) assert.ok(SCENARIOS.filter((x) => x.level === l).length >= 20, `only a few ${l}`);
  const lvl = (id) => SCENARIOS.find((x) => x.id === id).level;
  for (const l of LEVELS) assert.ok(pickScenarios(20, [], l).every((id) => lvl(id) === l), l);
  const mixed = pickScenarios(9, [], 'mixed').map(lvl);
  for (const l of LEVELS) assert.equal(mixed.filter((x) => x === l).length, 3, 'mixed = same amount of each');
  const all = pickScenarios(30, [], 'hard');
  assert.equal(all.length, 30, 'refills from other levels when the level runs out');
  assert.equal(new Set(all).size, 30);
});
