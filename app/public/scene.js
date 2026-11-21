// Draws a bathroom scenario as SVG. Pure function: (scenario, options) -> string.
//   options.mine     spot index the viewer picked (blue marker)
//   options.correct  [spot indexes] highlighted green (results)
//   options.votes    { spot: count }  vote bars (results)
//   options.total    number of voters (for percentages)
//   options.pickable true => free spots are clickable (data-spot)
const SPOT_W = 130, LEFT = 64, FLOOR = 272, H = 346;

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
  const g = `<g transform="translate(${x},${FLOOR}) scale(${scale})">
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
  const votes = o.votes ?? {};
  const maxVotes = Math.max(1, ...Object.values(votes));
  let parts = '';

  s.spots.forEach((kind, i) => {
    const x = cx(i);
    const occ = s.occupied[i];
    const isCorrect = o.correct?.includes(i);
    const isMine = o.mine === i;
    const free = kind === 'urinal' || kind === 'stall';
    const pickable = o.pickable && free && !occ;

    parts += `<g class="spot${pickable ? ' pickable' : ''}" data-spot="${pickable ? i : ''}">`;
    if (isCorrect) parts += `<rect x="${x - 60}" y="40" width="120" height="${FLOOR - 28}" rx="16" fill="#2ecc71" fill-opacity=".22" stroke="#2ecc71" stroke-width="5"/>`;
    if (pickable) parts += `<rect class="hl" x="${x - 60}" y="40" width="120" height="${FLOOR - 28}" rx="16" fill="#ffd23f" fill-opacity=".28" stroke="#ffd23f" stroke-width="4"/>`;
    parts += kind === 'stall' ? stall(x) : kind === 'broken' ? broken(x) : urinal(x);
    if (occ) parts += guy(x, occ, i * 5 + n);
    if (isMine && !occ && kind !== 'broken') parts += guy(x, 'standing', 3, { ghost: true });
    if (pickable) parts += `<rect x="${x - 62}" y="40" width="124" height="${FLOOR - 24}" fill="transparent"/>`;
    parts += '</g>';

    // numbering under the floor
    parts += `<text x="${x}" y="${H - 4}" text-anchor="middle" font-size="13" fill="#9aa7b2" font-family="system-ui,sans-serif">${kind === 'stall' ? 'stall' : i + 1}</text>`;
    if (isMine) parts += `<g><rect x="${x - 26}" y="${FLOOR + 28}" width="52" height="20" rx="10" fill="#1e90ff"/><text x="${x}" y="${FLOOR + 42}" text-anchor="middle" font-size="12" font-weight="800" fill="#fff" font-family="system-ui,sans-serif">YOU</text></g>`;
    if (isCorrect) parts += `<g><circle cx="${x + 48}" cy="52" r="16" fill="#2ecc71" stroke="#fff" stroke-width="3"/><path d="M${x + 40} 52 l6 6 l11 -12" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></g>`;
    if (o.votes && free && !occ) {
      const v = votes[i] ?? 0, pct = o.total ? Math.round((100 * v) / o.total) : 0;
      parts += `<g>
        <text x="${x}" y="22" text-anchor="middle" font-size="20" font-weight="800" fill="#fff" font-family="system-ui,sans-serif" stroke="${INK}" stroke-width="4" paint-order="stroke">${v}</text>
        <rect x="${x - 18}" y="30" width="36" height="5" rx="2.5" fill="#00000033"/><rect x="${x - 18}" y="30" width="${Math.round(36 * v / maxVotes)}" height="5" rx="2.5" fill="#ffd23f"/>
        <text x="${x}" y="${FLOOR + 22}" text-anchor="middle" font-size="14" font-weight="700" fill="#fff" font-family="system-ui,sans-serif" stroke="${INK}" stroke-width="3" paint-order="stroke">${pct}%</text></g>`;
    }
  });

  return `<svg class="scene" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${esc(s.title)}">
    <defs>
      <pattern id="tiles" width="46" height="46" patternUnits="userSpaceOnUse"><rect width="46" height="46" fill="#dbe7ee"/><path d="M0 0H46V46" fill="none" stroke="#bccbd6" stroke-width="2"/></pattern>
      <pattern id="floor" width="40" height="40" patternUnits="userSpaceOnUse"><rect width="40" height="40" fill="#7e8c96"/><rect width="20" height="20" fill="#8e9ba5"/><rect x="20" y="20" width="20" height="20" fill="#8e9ba5"/></pattern>
    </defs>
    <rect width="${W}" height="${FLOOR}" fill="url(#tiles)"/>
    <rect y="${FLOOR - 4}" width="${W}" height="8" fill="#5f6d77"/>
    <rect y="${FLOOR + 4}" width="${W}" height="${H - FLOOR - 4}" fill="url(#floor)"/>
    <rect y="${FLOOR - 70}" width="${W}" height="3" fill="#b2c2ce"/>
    <g>
      <rect x="6" y="70" width="46" height="${FLOOR - 70}" rx="3" fill="#a9724a" stroke="${INK}" stroke-width="3"/>
      <circle cx="42" cy="${FLOOR / 2 + 30}" r="4" fill="#e8c14a"/>
      <path d="M12 52 h24 m-8 -8 l8 8 l-8 8" fill="none" stroke="#1e90ff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
    </g>
    ${parts}
  </svg>`;
}
