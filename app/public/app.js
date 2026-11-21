import { renderScene } from '/scene.js';

const $app = document.getElementById('app');
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const store = {
  get: (k) => { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } },
  set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
};

async function api(path, { method = 'GET', body, token } = {}) {
  const r = await fetch(path, { method, headers: { 'content-type': 'application/json', ...(token && { 'x-token': token }) }, body: body && JSON.stringify(body) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw Object.assign(new Error(j.error || 'Something went wrong'), { status: r.status });
  return j;
}

function toast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg; t.classList.add('show');
  clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('show'), 1800);
}

const m = location.pathname.match(/^\/g\/([A-Za-z]{4})/);
m ? gameScreen(m[1].toUpperCase()) : homeScreen();

// ---------------------------------------------------------------- home
function homeScreen() {
  const lastName = store.get('urinal:name') ?? '';
  $app.innerHTML = `
    <div class="hero"><div class="big">🚽</div><h1>The Urinal Test</h1>
      <p class="muted">Where would <em>you</em> pee? Play with your friends, then compare.</p></div>
    <form class="card" id="create">
      <h2>Organize a game</h2>
      <label>Your nickname</label><input name="nickname" maxlength="20" value="${esc(lastName)}" required autocomplete="off">
      <label>Number of situations</label>
      <select name="count"><option value="5">5 (quick)</option><option value="10" selected>10 (all)</option></select>
      <p class="err"></p><button>Create game</button>
    </form>
    <form class="card" id="join">
      <h2>Join a game</h2>
      <label>Game code</label><input name="code" maxlength="4" style="text-transform:uppercase" required autocomplete="off">
      <label>Your nickname</label><input name="nickname" maxlength="20" value="${esc(lastName)}" required autocomplete="off">
      <p class="err"></p><button class="secondary">Join</button>
    </form>`;

  const run = (form, fn) => form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const err = form.querySelector('.err'); err.textContent = '';
    const f = Object.fromEntries(new FormData(form));
    store.set('urinal:name', f.nickname);
    try { await fn(f); } catch (x) { err.textContent = x.message; }
  });
  run($app.querySelector('#create'), async (f) => {
    const r = await api('/api/games', { method: 'POST', body: { nickname: f.nickname, scenarioCount: Number(f.count) } });
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
  let st = null, lastKey = '', lastRestKey = '', idx = null, busy = false;
  const token = () => store.get('urinal:' + code)?.token;

  const apply = (s) => {
    const key = JSON.stringify(s);
    if (key === lastKey) return;
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
  };
  const poll = async () => {
    try { apply(await api(`/api/games/${code}`, { token: token() })); }
    catch (e) {
      if (e.status === 404) {
        $app.innerHTML = `<div class="card center"><h2>Game not found</h2><p class="muted">It may have expired.</p><a href="/"><button>Home</button></a></div>`;
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

  const header = () => `<div class="row between"><b>🚽 Urinal Test</b><span class="muted">Game <b>${code}</b> · ${esc(st.you.nickname)}</span></div>`;
  const hostBar = () => {
    if (!st.you?.isHost) return '';
    if (st.status === 'lobby') return `<div class="hostbar row between"><span>${st.players.length} player(s) in</span><button data-act="start">Start game</button></div>`;
    const done = st.players.filter((p) => p.answered === st.total).length;
    return `<div class="hostbar row between"><span><b>${done}/${st.players.length}</b> finished</span><button data-act="reveal">Reveal results</button></div>`;
  };

  function joinView() {
    $app.innerHTML = `<div class="hero"><div class="big">🚽</div><h1>Join game ${code}</h1>
      <p class="muted">${st.players.length} player(s) waiting${st.status !== 'lobby' ? ' · game in progress' : ''}</p></div>
      <form class="card" id="j"><label>Your nickname</label><input name="nickname" maxlength="20" value="${esc(store.get('urinal:name') ?? '')}" required autocomplete="off">
      <p class="err"></p><button>Join</button></form>`;
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
      <div class="card center"><h2>Invite your friends</h2>
        <div class="code">${code}</div>
        <p class="muted small" style="word-break:break-all">${esc(link())}</p>
        <div class="row" style="justify-content:center"><button data-act="copy">Copy link</button>${navigator.share ? '<button class="secondary" data-act="share">Share…</button>' : ''}</div></div>
      <div class="card"><h3>Players (${st.players.length})</h3>${st.players.map((p) => `<span class="chip${p.isHost ? ' host' : ''}${p.id === st.you.id ? ' me' : ''}">${esc(p.nickname)}</span>`).join('')}</div>
      ${st.you.isHost ? '' : '<p class="muted center">Waiting for the organizer to start…</p>'}${hostBar()}`;
  }

  function playView() {
    if (idx === null) idx = firstUnanswered();
    idx = Math.min(Math.max(idx, 0), st.total - 1);
    const sc = st.scenarios[idx];
    const mine = st.myAnswers[sc.id];
    const answered = Object.keys(st.myAnswers).length;
    $app.innerHTML = `${header()}
      <div class="card">
        <div class="row between"><h2>${idx + 1}. ${esc(sc.title)}</h2><span class="muted">${answered}/${st.total} answered</span></div>
        <div class="progress"><i style="width:${(100 * answered) / st.total}%"></i></div>
        <p class="muted" style="margin:.2em 0 .8em">${mine === undefined ? 'You came in from the left. <b>Tap where you would pee.</b>' : 'Answer locked ✓'}</p>
        ${renderScene(sc, { mine, pickable: mine === undefined })}
        <div class="dots">${st.scenarios.map((s, i) => `<button data-go="${i}" class="${s.id in st.myAnswers ? 'done' : ''} ${i === idx ? 'cur' : ''}">${i + 1}</button>`).join('')}</div>
        <div class="row between"><button class="secondary" data-go="${idx - 1}" ${idx === 0 ? 'disabled' : ''}>← Back</button>
          <button class="secondary" data-go="${idx + 1}" ${idx === st.total - 1 ? 'disabled' : ''}>Next →</button></div>
      </div>${hostBar()}`;
  }

  function waitingView() {
    $app.innerHTML = `${header()}
      <div class="card center"><div class="hero" style="padding:8px"><div class="big">✅</div><h2>All done!</h2>
        <p class="muted">${st.you.isHost ? 'Reveal the results when everybody is ready.' : 'Waiting for the organizer to reveal the results…'}</p></div></div>
      <div class="card"><h3>Who has finished</h3><table class="board">${st.players.map((p) => `<tr><td>${esc(p.nickname)}${p.isHost ? ' 👑' : ''}</td><td>${p.answered}/${st.total}${p.answered === st.total ? ' ✅' : ''}</td></tr>`).join('')}</table>
      <p><button class="secondary" data-go="0">Review my answers</button></p></div>${hostBar()}`;
  }

  function resultsView() {
    const name = Object.fromEntries(st.players.map((p) => [p.id, p.nickname]));
    const ranked = [...st.players].sort((a, b) => st.scores[b.id] - st.scores[a.id] || a.nickname.localeCompare(b.nickname));
    const cards = st.results.map((r, i) => {
      const sc = st.scenarios.find((s) => s.id === r.scenarioId);
      const counts = Object.fromEntries(Object.entries(r.votes).map(([k, v]) => [k, v.length]));
      const voters = Object.values(counts).reduce((a, b) => a + b, 0);
      const top = Math.max(0, ...Object.values(counts));
      const mine = st.myAnswers[sc.id];
      const label = (k) => (sc.spots[k] === 'stall' ? 'the stall' : `urinal ${Number(k) + 1}`);
      const popular = Object.keys(counts).filter((k) => counts[k] === top && top > 0).map(label).join(' / ') || '—';
      const verdict = mine === undefined ? '<span class="muted">You did not answer</span>' : r.correct.includes(mine) ? '<span class="ok">You got it ✓</span>' : '<span class="bad">Not this one ✗</span>';
      const who = Object.entries(r.votes).sort(([a], [b]) => a - b).map(([k, ids]) => `<div class="small"><b>${label(k)}</b>: ${ids.map((id) => esc(name[id])).join(', ')}</div>`).join('');
      return `<div class="card"><div class="row between"><h2>${i + 1}. ${esc(sc.title)}</h2>${verdict}</div>
        ${renderScene(sc, { mine, correct: r.correct, votes: counts, total: voters })}
        <p style="margin:.8em 0 .2em">✅ <b>Correct:</b> ${r.correct.map(label).join(' / ')} &nbsp; 👥 <b>Most picked:</b> ${popular}</p>
        <p class="muted small" style="margin:.2em 0">${esc(r.explanation)}</p>${who}</div>`;
    }).join('');
    $app.innerHTML = `${header()}
      <div class="card"><h2>🏆 Results</h2><table class="board">${ranked.map((p, i) => `<tr><td>${['🥇', '🥈', '🥉'][i] ?? i + 1 + '.'} ${esc(p.nickname)}${p.id === st.you.id ? ' (you)' : ''}</td><td>${st.scores[p.id]}/${st.total}</td></tr>`).join('')}</table></div>
      ${cards}<p class="center"><a href="/"><button class="secondary">New game</button></a></p>`;
  }

  // one delegated click handler for every screen
  $app.addEventListener('click', async (e) => {
    const t = e.target;
    const go = t.closest('[data-go]');
    if (go && !go.disabled) { idx = Number(go.dataset.go); return render(); }
    const a = t.closest('[data-act]')?.dataset.act;
    if (a === 'copy') { try { await navigator.clipboard.writeText(link()); toast('Link copied!'); } catch { prompt('Copy this link:', link()); } }
    else if (a === 'share') navigator.share({ title: 'Urinal Test', text: 'Play the urinal test with us!', url: link() }).catch(() => {});
    else if (a === 'start') act('start');
    else if (a === 'reveal') {
      const pending = st.players.filter((p) => p.answered < st.total).length;
      if (!pending || confirm(`${pending} player(s) have not finished. Reveal anyway?`)) act('reveal');
    }
    const spot = t.closest('[data-spot]');
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
