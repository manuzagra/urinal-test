// Draws a bathroom scenario as SVG. Pure function: (scenario, options) -> string.
//   options.mine     spot index picked by the player being shown (blue marker)
//   options.mineLabel label under that marker (default YOU)
//   options.correct  [spot indexes] highlighted green (results)
//   options.votes    { spot: count }  vote bars (results)
//   options.total    number of voters (for percentages)
//   options.pickable true => free spots are clickable (data-spot)
//   options.speech   [{ at: spotIndex, text }] comic speech bubbles (results jokes), 1 or 2, left to right
// Spot kinds: urinal | low (kid height) | dirty | stall | broken | sink (decoration)
// occupied[i]: a pose string, or { pose, tag, say } (tag = name label, say = speech bubble)
// dividers: [i, ...] = a privacy panel between spot i and i+1
const SPOT_W = 130, LEFT = 64, FLOOR = 272;

const SHIRTS = ['#e4572e', '#2a9d8f', '#f4a261', '#6a4c93', '#3a86ff', '#8ac926', '#ff6b9d', '#5b6770'];
const PANTS = ['#355070', '#3d405b', '#2b2d42', '#5c4d3c', '#46494c'];
const HAIRS = ['#2b1d0e', '#6b4423', '#d9a441', '#111', '#a8421c'];
const SKINS = ['#f1c27d', '#e0a370', '#c68642', '#8d5524', '#ffdbac'];
const INK = '#1d232b';

const cx = (i) => LEFT + SPOT_W / 2 + i * SPOT_W;
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function urinal(x) {
  return `<g transform="translate(${x},0)">
    <rect x="-4" y="40" width="8" height="34" fill="#c9d1d8" stroke="${INK}" stroke-width="2.5"/>
    <rect x="-14" y="30" width="28" height="14" rx="4" fill="#dfe5ea" stroke="${INK}" stroke-width="2.5"/>
    <circle cx="20" cy="38" r="5" fill="#c9d1d8" stroke="${INK}" stroke-width="2"/>
    <path d="M-38 78 Q-42 205 0 222 Q42 205 38 78 Q0 66 -38 78Z" fill="#fff" stroke="${INK}" stroke-width="3.5"/>
    <path d="M-25 96 Q-27 186 0 199 Q27 186 25 96Z" fill="#e9eff3" stroke="${INK}" stroke-width="2.5"/>
    <ellipse cx="0" cy="190" rx="11" ry="6" fill="#fff" stroke="${INK}" stroke-width="2.5"/>
    <ellipse cx="0" cy="190" rx="5" ry="2.5" fill="${INK}"/>
  </g>`;
}

function stall(x) {
  return `<g transform="translate(${x},0)">
    <rect x="-48" y="52" width="96" height="${FLOOR - 52}" rx="4" fill="#b9d3c6" stroke="${INK}" stroke-width="3.5"/>
    <rect x="-48" y="${FLOOR - 22}" width="96" height="22" fill="#cfdcd5"/>
    <rect x="-36" y="68" width="72" height="150" rx="3" fill="#a6c4b5" stroke="${INK}" stroke-width="2"/>
    <circle cx="26" cy="150" r="5" fill="#e8c14a" stroke="${INK}" stroke-width="2"/>
    <text x="0" y="112" text-anchor="middle" font-size="22" font-weight="800" fill="${INK}" font-family="system-ui,sans-serif">WC</text>
  </g>`;
}

function broken(x) {
  return `${urinal(x)}<g transform="translate(${x},150) rotate(-12)">
    <rect x="-52" y="-13" width="104" height="26" fill="#f5c518" stroke="${INK}" stroke-width="2.5"/>
    <text x="0" y="6" text-anchor="middle" font-size="12" font-weight="800" fill="${INK}" font-family="system-ui,sans-serif">OUT OF ORDER</text></g>`;
}

function low(x) {
  return `<g transform="translate(${x},70) scale(.72)">${urinal(0)}</g>`;
}

function dirty(x) {
  const fly = (fx, fy) => `<g transform="translate(${fx},${fy})"><ellipse rx="3.5" ry="2.5" fill="${INK}"/><ellipse cx="-2" cy="-3" rx="3" ry="2" fill="#fff" opacity=".8"/><ellipse cx="2" cy="-3" rx="3" ry="2" fill="#fff" opacity=".8"/></g>`;
  return `${urinal(x)}<g transform="translate(${x},0)">
    <path d="M-25 160 Q-27 186 0 199 Q27 186 25 160 Q0 168 -25 160Z" fill="#e3c23a" opacity=".85"/>
    <ellipse cx="4" cy="${FLOOR + 14}" rx="46" ry="9" fill="#e3c23a" opacity=".75"/>
    ${fly(-30, 120)}${fly(28, 104)}${fly(10, 236)}
    <path d="M-12 70 q-6 -8 0 -16 q6 -8 0 -16 M12 70 q-6 -8 0 -16 q6 -8 0 -16" fill="none" stroke="#8cae3c" stroke-width="3" stroke-linecap="round"/></g>`;
}

function sink(x) {
  return `<g transform="translate(${x},0)">
    <rect x="-36" y="40" width="72" height="62" rx="6" fill="#bfe3f2" stroke="${INK}" stroke-width="3"/>
    <path d="M-24 52 l14 -6 M-24 64 l28 -12" stroke="#fff" stroke-width="3" opacity=".7"/>
    <rect x="-4" y="108" width="8" height="18" fill="#c9d1d8" stroke="${INK}" stroke-width="2.5"/>
    <path d="M-46 126 H46 Q42 160 0 162 Q-42 160 -46 126Z" fill="#fff" stroke="${INK}" stroke-width="3.5"/>
    <rect x="-7" y="160" width="14" height="${FLOOR - 160}" fill="#dfe5ea" stroke="${INK}" stroke-width="2.5"/></g>`;
}

function occupiedStall(x, seed) {
  return `${stall(x)}<g transform="translate(${x},0)">
    <rect x="12" y="140" width="26" height="12" rx="3" fill="#e63946" stroke="${INK}" stroke-width="2"/>
    <ellipse cx="-14" cy="${FLOOR - 5}" rx="12" ry="6" fill="#222"/><ellipse cx="14" cy="${FLOOR - 5}" rx="12" ry="6" fill="#222"/>
    <rect x="-22" y="${FLOOR - 24}" width="44" height="12" rx="3" fill="${PANTS[seed % PANTS.length]}"/></g>`;
}

function divider(x) {
  return `<rect x="${x - 5}" y="84" width="10" height="150" rx="3" fill="#c8d6df" stroke="${INK}" stroke-width="2.5"/>`;
}

// Text inside the scene is scaled with the number of spots (k), so that it stays
// readable (~12px) on a phone where a 7-urinal scene is shrunk to ~370px wide.
const FONT = 'font-family="system-ui,sans-serif"';
const textW = (t, px) => [...String(t)].length * px * 0.6 + px * 1.2;
function pill(x, y, text, k, { fill, color, max = Infinity, stroke = '' }) {
  let fs = 13 * k;
  const h = fs * 1.6;
  if (textW(text, fs) > max) fs = Math.max(fs * 0.75, max / ([...text].length * 0.6 + 1.2)); // shrink long names...
  const fit = Math.floor((max / fs - 1.2) / 0.6);
  if ([...text].length > fit) text = [...text].slice(0, fit - 1).join('') + '…'; // ...then cut them
  const w = Math.min(max, textW(text, fs));
  return `<g><rect x="${x - w / 2}" y="${y}" width="${w}" height="${h}" rx="${h / 2}" fill="${fill}" ${stroke}/>
    <text x="${x}" y="${y + h / 2 + fs * 0.36}" text-anchor="middle" font-size="${fs}" font-weight="800" fill="${color}" ${FONT}>${esc(text)}</text></g>`;
}
const tag = (x, text, k) => pill(x, -15 * k - 6, text, k, { fill: '#ffd23f', color: INK, stroke: `stroke="${INK}" stroke-width="2"` });
function bubble(x, text, k, { flip, kid, W }) {
  const fs = 13 * k, h = fs * 1.7, w = textW(text, fs);
  const headTop = kid ? FLOOR - 174 * 0.72 - 16 : 76;
  const y = headTop - h - 10;
  let bx = flip ? x - 10 - w : x + 10;
  bx = Math.max(4, Math.min(W - w - 4, bx));
  const tx = flip ? x - 12 : x + 12;
  return `<g><path d="M${tx - 10} ${y + h - 2} L${x} ${headTop} L${tx + 10} ${y + h - 2}" fill="#fff" stroke="${INK}" stroke-width="2"/>
    <rect x="${bx}" y="${y}" width="${w}" height="${h}" rx="${h / 2.4}" fill="#fff" stroke="${INK}" stroke-width="2"/>
    <rect x="${tx - 9}" y="${y + h - 5}" width="18" height="5" fill="#fff"/>
    <text x="${bx + w / 2}" y="${y + h * 0.68}" text-anchor="middle" font-size="${fs}" font-weight="700" fill="${INK}" ${FONT}>${esc(text)}</text></g>`;
}

// Comic speech bubbles: wrapped text above the wall, tail down to the speaker's head.
const COMIC_FONT = `font-family="'Comic Sans MS','Chalkboard SE','Comic Neue',system-ui,sans-serif"`;
function wrap(text, maxChars) {
  const lines = [];
  for (const word of String(text).split(/\s+/)) {
    const last = lines.at(-1);
    if (last !== undefined && [...(last + ' ' + word)].length <= maxChars) lines[lines.length - 1] = last + ' ' + word;
    else lines.push(word);
  }
  return lines;
}
function comics(speech, s, k, W, bottom) {
  const fs = 12.5 * k, charW = fs * 0.56, pad = fs * 0.8, two = speech.length > 1;
  const pose = (i) => { const o = s.occupied[i]; return typeof o === 'object' && o ? o.pose : o; };
  const boxes = speech.map(({ at, text }, j) => {
    const maxW = two ? W / 2 - 10 : Math.min(W - 12, Math.max(SPOT_W * 3.2, W * 0.62));
    const lines = wrap(text, Math.max(8, Math.floor((maxW - 2 * pad) / charW)));
    const w = Math.max(...lines.map((l) => [...l].length)) * charW + 2 * pad, h = lines.length * fs * 1.25 + pad * 1.3;
    const x = cx(at), lo = two && j === 1 ? W / 2 + 4 : 6, hi = two && j === 0 ? W / 2 - 4 - w : W - 6 - w;
    const bx = Math.max(lo, Math.min(hi, x - w / 2));
    const headTop = pose(at) === 'kid' ? FLOOR - 174 * 0.72 - 22 : 74;
    return { x, lines, w, h, bx, headTop };
  });
  const top = Math.max(...boxes.map((b) => b.h));
  let svg = '';
  for (const b of boxes) {
    const by = bottom - b.h, tx = Math.max(b.bx + 18, Math.min(b.bx + b.w - 18, b.x)), tw = 7 * k;
    svg += `<g class="comic">
      <path d="M${tx - tw} ${by + b.h - 3} L${b.x} ${b.headTop} L${tx + tw} ${by + b.h - 3}Z" fill="#fff" stroke="${INK}" stroke-width="${1.2 * k}" stroke-linejoin="round"/>
      <rect x="${b.bx}" y="${by}" width="${b.w}" height="${b.h}" rx="${fs * 0.9}" fill="#fff" stroke="${INK}" stroke-width="${1.4 * k}"/>
      <rect x="${tx - tw + 1.2 * k}" y="${by + b.h - 3 * k}" width="${2 * tw - 2.4 * k}" height="${3.2 * k}" fill="#fff"/>
      ${b.lines.map((l, i) => `<text x="${b.bx + b.w / 2}" y="${by + pad * 0.65 + fs * (i + 0.95) * 1.25 - fs * 0.25}" text-anchor="middle" font-size="${fs}" font-weight="700" fill="${INK}" ${COMIC_FONT}>${esc(l)}</text>`).join('')}
    </g>`;
  }
  return { svg, height: top };
}

function guy(x, pose, seed, { ghost = false } = {}) {
  const pick = (a, k = 0) => a[(seed * 7 + k * 3) % a.length];
  const shirt = ghost ? '#1e90ff' : pick(SHIRTS), pants = ghost ? '#16457a' : pick(PANTS, 1);
  const hair = pick(HAIRS, 2), skin = pick(SKINS, 3);
  const wide = pose === 'wide';
  const lx = wide ? 26 : 10;
  const arm = (d, w = 12) => `<path d="${d}" fill="none" stroke="${shirt}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
  const hand = (hx, hy) => `<circle cx="${hx}" cy="${hy}" r="6" fill="${skin}"/>`;
  let arms = '', headY = -174, extra = '';

  if (pose === 'phone') {
    arms = arm('M-27 -146 L-36 -112 L-10 -98') + hand(-10, -98) + arm('M27 -146 L44 -126 L38 -178') + hand(38, -180);
    extra = `<rect x="30" y="-206" width="17" height="27" rx="3" fill="#222"/><rect x="32.5" y="-203" width="12" height="20" rx="1.5" fill="#8fe3ff"/>`;
  } else if (pose === 'leaning') {
    headY = -164;
    arms = arm('M-27 -146 L-32 -200', 12) + arm('M27 -146 L32 -200', 12)
      + `<path d="M-34 -204 L34 -204" stroke="${skin}" stroke-width="11" stroke-linecap="round"/>`;
  } else if (pose === 'hips') {
    arms = arm('M-27 -146 L-50 -118 L-28 -92') + hand(-28, -92) + arm('M27 -146 L50 -118 L28 -92') + hand(28, -92);
  } else {
    arms = arm('M-27 -146 L-36 -112 L-10 -98') + hand(-10, -98) + arm('M27 -146 L36 -112 L10 -98') + hand(10, -98);
  }

  const scale = pose === 'kid' ? 0.72 : 1;
  const tilt = pose === 'drunk' ? ' rotate(-9)' : '';
  // drunk: seen from behind, so no face; wobble lines next to him instead
  if (pose === 'drunk') extra = `<path d="M-46 -150 q-8 10 0 20 q8 10 0 20 M46 -150 q8 10 0 20 q-8 10 0 20" fill="none" stroke="#e76f51" stroke-width="3" stroke-linecap="round"/>`;
  const g = `<g transform="translate(${x},${FLOOR}) scale(${scale})${tilt}">
    <path d="M${-lx - 9} -4 L-19 -72 L-2 -72 L${-lx + 7} -4Z" fill="${pants}"/>
    <path d="M${lx + 9} -4 L19 -72 L2 -72 L${lx - 7} -4Z" fill="${pants}"/>
    <ellipse cx="${-lx}" cy="-3" rx="12" ry="6" fill="#222"/><ellipse cx="${lx}" cy="-3" rx="12" ry="6" fill="#222"/>
    <rect x="-27" y="-154" width="54" height="86" rx="13" fill="${shirt}"/>
    <rect x="-27" y="-76" width="54" height="9" fill="${pants}" opacity=".9"/>
    ${arms}
    <rect x="-6" y="-166" width="12" height="16" fill="${skin}"/>
    <circle cx="-20" cy="${headY}" r="5" fill="${skin}"/><circle cx="20" cy="${headY}" r="5" fill="${skin}"/>
    <circle cx="0" cy="${headY}" r="20.5" fill="${hair}"/>
    ${extra}
  </g>`;
  return ghost ? `<g opacity=".6">${g}</g>` : g;
}

export function renderScene(s, o = {}) {
  const n = s.spots.length;
  const W = LEFT + n * SPOT_W + 16;
  const k = Math.max(1.4, n * 0.36);
  const TOP = Math.round(17 * k + 12), BOTTOM = FLOOR + Math.round(8 + 22 * k + 18 * k);
  const votes = o.votes ?? {};
  const maxVotes = Math.max(1, ...Object.values(votes));
  let parts = '';

  s.spots.forEach((kind, i) => {
    const x = cx(i);
    const raw = s.occupied[i];
    const occ = typeof raw === 'object' && raw ? raw.pose ?? 'standing' : raw;
    const isCorrect = o.correct?.includes(i);
    const isMine = o.mine === i;
    const free = kind === 'urinal' || kind === 'stall' || kind === 'low' || kind === 'dirty';
    const pickable = o.pickable && free && !occ;

    parts += `<g class="spot${pickable ? ' pickable' : ''}" data-spot="${pickable ? i : ''}">`;
    if (isCorrect) parts += `<rect x="${x - 60}" y="40" width="120" height="${FLOOR - 28}" rx="16" fill="#2ecc71" fill-opacity=".22" stroke="#2ecc71" stroke-width="5"/>`;
    if (pickable) parts += `<rect class="hl" x="${x - 60}" y="40" width="120" height="${FLOOR - 28}" rx="16" fill="#ffd23f" fill-opacity=".28" stroke="#ffd23f" stroke-width="4"/>`;
    const draw = { stall, broken, low, dirty, sink, urinal }[kind] ?? urinal;
    parts += kind === 'stall' && occ ? occupiedStall(x, i + n) : draw(x);
    if (occ && kind !== 'stall') parts += guy(x, occ, i * 5 + n);
    if (isMine && !occ && free) parts += guy(x, 'standing', 3, { ghost: true });
    if (pickable) parts += `<rect x="${x - 62}" y="40" width="124" height="${FLOOR - 24}" fill="transparent"/>`;
    parts += '</g>';

    // spot number at the bottom, "you"/name marker above it
    if (kind !== 'sink') parts += `<text x="${x}" y="${BOTTOM - 8}" text-anchor="middle" font-size="${13 * k}" font-weight="700" fill="#e3eaef" ${FONT}>${kind === 'stall' ? 'WC' : i + 1}</text>`;
    if (isMine) parts += pill(x, FLOOR + 8, String(o.mineLabel ?? 'you').toUpperCase(), k, { fill: '#1e90ff', color: '#fff', max: SPOT_W - 4 });
    if (isCorrect) { const r = 11 * Math.min(k, 2); parts += `<g transform="translate(${x + 60 - r * 0.7},${48 + r * 0.3})"><circle r="${r}" fill="#2ecc71" stroke="#fff" stroke-width="3"/><path d="M${-r * 0.45} 0 l${r * 0.35} ${r * 0.35} l${r * 0.6} ${-r * 0.65}" fill="none" stroke="#fff" stroke-width="${r / 4}" stroke-linecap="round" stroke-linejoin="round"/></g>`; }
    if (o.votes && free && !occ) {
      const v = votes[i] ?? 0, bw = SPOT_W * 0.6;
      parts += `<g>
        <text x="${x}" y="${-8 - 4 * k}" text-anchor="middle" font-size="${17 * k}" font-weight="800" fill="#fff" ${FONT} stroke="${INK}" stroke-width="${2 + k * 1.5}" paint-order="stroke">${v}</text>
        <rect x="${x - bw / 2}" y="${-6 - k}" width="${bw}" height="${3 * k}" rx="${1.5 * k}" fill="#00000033"/><rect x="${x - bw / 2}" y="${-6 - k}" width="${Math.round(bw * v / maxVotes)}" height="${3 * k}" rx="${1.5 * k}" fill="#ffd23f"/></g>`;
    }
  });

  for (const d of s.dividers ?? []) parts += divider(LEFT + (d + 1) * SPOT_W);
  // results jokes: the neighbours talk in comic bubbles above the wall (the scene grows taller)
  let top = TOP;
  const speakers = (o.speech ?? []).map((sp) => sp.at);
  if (o.speech?.length) {
    const c = comics(o.speech, s, k, W, -TOP - 4);
    parts += c.svg;
    top = TOP + 4 + c.height + 8;
  }
  s.spots.forEach((kind, i) => {
    const raw = s.occupied[i];
    if (!raw || kind === 'stall') return;
    const p = typeof raw === 'object' ? raw : { pose: raw };
    if (p.tag) parts += tag(cx(i), p.tag, k);
    if (p.say && !speakers.includes(i)) parts += bubble(cx(i), p.say, k, { flip: i >= n / 2, kid: p.pose === 'kid', W });
  });

  return `<svg class="scene" viewBox="0 ${-top} ${W} ${top + BOTTOM}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${esc(s.title)}">
    <defs>
      <pattern id="tiles" width="46" height="46" patternUnits="userSpaceOnUse"><rect width="46" height="46" fill="#dbe7ee"/><path d="M0 0H46V46" fill="none" stroke="#bccbd6" stroke-width="2"/></pattern>
      <pattern id="floor" width="40" height="40" patternUnits="userSpaceOnUse"><rect width="40" height="40" fill="#7e8c96"/><rect width="20" height="20" fill="#8e9ba5"/><rect x="20" y="20" width="20" height="20" fill="#8e9ba5"/></pattern>
    </defs>
    <rect y="${-top}" width="${W}" height="${FLOOR + top}" fill="url(#tiles)"/>
    <rect y="${FLOOR - 4}" width="${W}" height="8" fill="#5f6d77"/>
    <rect y="${FLOOR + 4}" width="${W}" height="${BOTTOM - FLOOR - 4}" fill="url(#floor)"/>
    <rect y="${FLOOR - 70}" width="${W}" height="3" fill="#b2c2ce"/>
    <g>
      <rect x="6" y="70" width="46" height="${FLOOR - 70}" rx="3" fill="#a9724a" stroke="${INK}" stroke-width="3"/>
      <circle cx="42" cy="${FLOOR / 2 + 30}" r="4" fill="#e8c14a"/>
      <path d="M12 52 h24 m-8 -8 l8 8 l-8 8" fill="none" stroke="#1e90ff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
    </g>
    ${parts}
  </svg>`;
}

// How embarrassing a pick is: a wrong pick right next to a guy at a urinal (no divider between).
// 'kid' when a neighbour is a kid (never a dick joke there), 'sandwich' for two neighbours.
export function awkward(sc, spot, correct) {
  if (spot === undefined || correct.includes(spot) || sc.spots[spot] === 'stall') return null;
  const divs = sc.dividers ?? [];
  const pose = (j) => { const o = sc.occupied[j]; return typeof o === 'object' && o ? o.pose ?? 'standing' : o; };
  const near = [spot - 1, spot + 1].filter((j) => pose(j) && sc.spots[j] !== 'stall' && !divs.includes(Math.min(j, spot)));
  if (!near.length) return null;
  return { kind: near.some((j) => pose(j) === 'kid') ? 'kid' : near.length > 1 ? 'sandwich' : 'roast', near };
}
