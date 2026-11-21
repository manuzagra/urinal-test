import test from 'node:test';
import assert from 'node:assert/strict';
import { openDb } from '../src/db.mjs';
import { createApp, pickScenarios } from '../src/app.mjs';
import { SCENARIOS, correctSpots, isPickable } from '../src/scenarios.mjs';

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
    const free = sc.spots.findIndex((k, i) => k === 'urinal' && !(i in sc.occupied));
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
