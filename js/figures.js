// figures.js - ציורי SVG לשאלות: שעון, גופים, מצולעים, סרגל, מאזניים, לוח משבצות,
// קבוצות, מערך, ישר מספרים, דיאגרמת עמודות וצורות של חצי ורבע.
// כל הפונקציות מחזירות מחרוזת HTML (בלי DOM), כדי שאפשר יהיה לבדוק אותן אוטומטית.
// אין בציורים מאפייני id, כי כמה ציורים יכולים להופיע יחד באותו דף.

import { fmt, esc } from './util.js';
import { pairsSvg } from './art.js';

const f2 = (x) => Number(x.toFixed(2));
const INK = '#1b2a3a';

/** פוקדור קטן בתוך ציור */
function miniBall(cx, cy, r) {
  return `<g>
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="#fff" stroke="${INK}" stroke-width="${f2(r * 0.16)}"/>
    <path d="M${f2(cx - r)} ${cy}a${r} ${r} 0 0 1 ${2 * r} 0z" fill="#e3350d" stroke="${INK}" stroke-width="${f2(r * 0.16)}"/>
    <circle cx="${cx}" cy="${cy}" r="${f2(r * 0.32)}" fill="#fff" stroke="${INK}" stroke-width="${f2(r * 0.14)}"/>
  </g>`;
}

/* ============================ שעון ============================ */

/** שעון מחוגים. h = 1-12, m = 0/15/30/45 */
export function clockSvg(h, m, cls = '') {
  let marks = '';
  for (let i = 0; i < 60; i++) {
    const a = (i * 6 * Math.PI) / 180;
    const r1 = i % 5 === 0 ? 80 : 85;
    marks += `<line x1="${f2(100 + r1 * Math.sin(a))}" y1="${f2(100 - r1 * Math.cos(a))}" x2="${f2(100 + 90 * Math.sin(a))}" y2="${f2(100 - 90 * Math.cos(a))}" stroke="${INK}" stroke-width="${i % 5 === 0 ? 3 : 1.2}"/>`;
  }
  let nums = '';
  for (let i = 1; i <= 12; i++) {
    const a = (i * 30 * Math.PI) / 180;
    nums += `<text x="${f2(100 + 66 * Math.sin(a))}" y="${f2(100 - 66 * Math.cos(a) + 7)}" text-anchor="middle" font-size="20" font-weight="700" fill="${INK}" font-family="Arial">${i}</text>`;
  }
  const ha = (((h % 12) + m / 60) * 30 * Math.PI) / 180;
  const ma = (m * 6 * Math.PI) / 180;
  const hand = (a, len, w, color) => `<line x1="100" y1="100" x2="${f2(100 + len * Math.sin(a))}" y2="${f2(100 - len * Math.cos(a))}" stroke="${color}" stroke-width="${w}" stroke-linecap="round"/>`;
  return `<svg class="clock-svg ${cls}" viewBox="0 0 200 200" role="img" aria-label="שעון">
    <circle cx="100" cy="100" r="94" fill="#fdf8ea" stroke="#e3350d" stroke-width="7"/>
    ${marks}${nums}
    ${hand(ha, 46, 8, INK)}
    ${hand(ma, 72, 5, '#2f6fd0')}
    <circle cx="100" cy="100" r="7" fill="#e3350d" stroke="${INK}" stroke-width="2"/>
  </svg>`;
}

/* ============================ גופים ============================ */

const FACE = ['rgba(89,169,255,.55)', 'rgba(89,169,255,.35)', 'rgba(89,169,255,.75)'];
const EDGE = `stroke="#e8f2ff" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"`;
const HIDDEN = `stroke="#e8f2ff" stroke-width="2" stroke-dasharray="6 5" opacity=".75"`;

const line = (a, b, attrs = EDGE) => `<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" ${attrs} fill="none"/>`;
const poly = (pts, fill) => `<polygon points="${pts.map((p) => p.join(',')).join(' ')}" fill="${fill}" stroke="none"/>`;

/** תיבה או קובייה: חזית w×h, עומק (dx, dy) */
function prism(x, y, w, h, dx, dy) {
  const A = [x, y + h], B = [x + w, y + h], C = [x + w, y], D = [x, y];
  const E = [x + dx, y + h - dy], F = [x + w + dx, y + h - dy], G = [x + w + dx, y - dy], H = [x + dx, y - dy];
  return poly([A, B, C, D], FACE[0]) + poly([D, C, G, H], FACE[2]) + poly([B, F, G, C], FACE[1])
    + line(E, H, HIDDEN) + line(E, F, HIDDEN) + line(E, A, HIDDEN)
    + [line(A, B), line(B, C), line(C, D), line(D, A), line(D, H), line(C, G), line(H, G), line(G, F), line(B, F)].join('');
}

const SOLID_DRAW = {
  cube: () => prism(35, 55, 70, 70, 32, 30),
  box: () => prism(18, 70, 100, 55, 32, 28),
  cylinder: () => `
    <path d="M35 32 L35 112 A45 14 0 0 0 125 112 L125 32 Z" fill="${FACE[0]}"/>
    <ellipse cx="80" cy="32" rx="45" ry="14" fill="${FACE[2]}" ${EDGE}/>
    <path d="M35 112 A45 14 0 0 0 125 112" fill="none" ${EDGE}/>
    <path d="M35 112 A45 14 0 0 1 125 112" fill="none" ${HIDDEN}/>
    ${line([35, 32], [35, 112])}${line([125, 32], [125, 112])}`,
  cone: () => `
    <path d="M80 14 L30 114 A50 15 0 0 0 130 114 Z" fill="${FACE[0]}"/>
    <path d="M30 114 A50 15 0 0 0 130 114" fill="none" ${EDGE}/>
    <path d="M30 114 A50 15 0 0 1 130 114" fill="none" ${HIDDEN}/>
    ${line([80, 14], [30, 114])}${line([80, 14], [130, 114])}`,
  pyramid: () => {
    const A = [28, 118], B = [108, 118], C = [136, 94], D = [56, 94], E = [80, 16];
    return poly([E, A, B], FACE[0]) + poly([E, B, C], FACE[1])
      + line(A, D, HIDDEN) + line(D, C, HIDDEN) + line(E, D, HIDDEN)
      + [line(A, B), line(B, C), line(E, A), line(E, B), line(E, C)].join('');
  },
  sphere: () => `
    <circle cx="80" cy="70" r="56" fill="${FACE[0]}" ${EDGE}/>
    <path d="M24 70 A56 16 0 0 0 136 70" fill="none" ${EDGE} opacity=".8"/>
    <path d="M24 70 A56 16 0 0 1 136 70" fill="none" ${HIDDEN}/>
    <ellipse cx="60" cy="46" rx="16" ry="9" fill="#fff" opacity=".35" transform="rotate(-30 60 46)"/>`,
};

export const SOLID_KINDS = Object.keys(SOLID_DRAW);

export function solidSvg(kind, cls = '') {
  const draw = SOLID_DRAW[kind];
  if (!draw) return '';
  return `<svg class="solid-svg ${cls}" viewBox="0 0 160 140" role="img" aria-label="גוף">${draw()}</svg>`;
}

/* ============================ מצולעים ============================ */

/** מצולע עם n צלעות. rot = סיבוב במעלות. הקדקודים מסומנים בנקודות */
export function polygonSvg(n, rot = 0, cls = '') {
  const pts = Array.from({ length: n }, (_, i) => {
    const a = ((rot - 90 + (i * 360) / n) * Math.PI) / 180;
    return [f2(80 + 58 * Math.cos(a)), f2(75 + 58 * Math.sin(a))];
  });
  const dots = pts.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="5" fill="#ffd23f" stroke="${INK}" stroke-width="1.5"/>`).join('');
  return `<svg class="polygon-svg ${cls}" viewBox="0 0 160 150" role="img" aria-label="מצולע">
    <polygon points="${pts.map((p) => p.join(',')).join(' ')}" fill="rgba(95,208,139,.45)" stroke="#e8f2ff" stroke-width="4" stroke-linejoin="round"/>
    ${dots}
  </svg>`;
}

/* ============================ סרגל ============================ */

/** סרגל של max ס"מ, ועליו עיפרון מ-start עד end */
export function rulerSvg({ max = 12, start = 0, end = 7, thing = 'pencil' }, cls = '') {
  const S = 34;               // פיקסלים לס"מ
  const X0 = 20;
  const W = X0 * 2 + max * S;
  const x = (cm) => X0 + cm * S;
  let ticks = '';
  for (let i = 0; i <= max * 2; i++) {
    const cm = i / 2;
    const whole = i % 2 === 0;
    ticks += `<line x1="${x(cm)}" y1="78" x2="${x(cm)}" y2="${whole ? 98 : 90}" stroke="${INK}" stroke-width="${whole ? 2 : 1.2}"/>`;
    if (whole) ticks += `<text x="${x(cm)}" y="118" text-anchor="middle" font-size="16" font-weight="700" fill="${INK}" font-family="Arial">${cm}</text>`;
  }
  const len = end - start;
  const body = thing === 'crayon' ? '#5fd08b' : '#ffb13b';
  const obj = `
    <rect x="${x(start)}" y="40" width="${f2(len * S - 26)}" height="22" rx="3" fill="${body}" stroke="${INK}" stroke-width="2"/>
    <rect x="${x(start)}" y="40" width="12" height="22" rx="2" fill="#f28ab2" stroke="${INK}" stroke-width="2"/>
    <polygon points="${f2(x(end) - 26)},40 ${x(end)},51 ${f2(x(end) - 26)},62" fill="#f3d9a4" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>
    <polygon points="${f2(x(end) - 8)},47.6 ${x(end)},51 ${f2(x(end) - 8)},54.4" fill="${INK}"/>
    <line x1="${x(start)}" y1="64" x2="${x(start)}" y2="80" stroke="#e3350d" stroke-width="2" stroke-dasharray="3 3"/>
    <line x1="${x(end)}" y1="56" x2="${x(end)}" y2="80" stroke="#e3350d" stroke-width="2" stroke-dasharray="3 3"/>`;
  return `<svg class="ruler-svg ${cls}" viewBox="0 0 ${W} 130" dir="ltr" role="img" aria-label="סרגל">
    <rect x="4" y="76" width="${W - 8}" height="50" rx="6" fill="#ffe27a" stroke="${INK}" stroke-width="2"/>
    ${ticks}${obj}
  </svg>`;
}

/* ============================ מאזני כפות ============================ */

/** פריטים בכף: 'cube' = קובייה, אחרת אמוג'י */
function panItems(items, cx, baseY) {
  let out = '';
  const cubes = items.filter((i) => i === 'cube');
  const others = items.filter((i) => i !== 'cube');
  // קוביות: עד 5 בשורה, מלמטה למעלה
  cubes.forEach((_, i) => {
    const row = Math.floor(i / 5);
    const inRow = Math.min(5, cubes.length - row * 5);
    const col = i % 5;
    const x = cx - (inRow * 17) / 2 + col * 17;
    out += `<rect x="${f2(x)}" y="${f2(baseY - 16 - row * 17)}" width="15" height="15" rx="2" fill="#ffd23f" stroke="#6b4a00" stroke-width="1.5"/>`;
  });
  const shift = cubes.length ? Math.ceil(cubes.length / 5) * 17 : 0;
  others.forEach((e, i) => {
    const x = cx + (i - (others.length - 1) / 2) * 34;
    out += `<text x="${f2(x)}" y="${f2(baseY - 4 - shift)}" text-anchor="middle" font-size="30">${esc(e)}</text>`;
  });
  return out;
}

/** מאזני כפות. tilt: 1 = שמאל למטה, -1 = ימין למטה, 0 = מאוזן */
export function balanceSvg({ left = [], right = [], tilt = 0 }, cls = '') {
  const a = (tilt * 11 * Math.PI) / 180;
  const L = 108;
  const lx = f2(150 - L * Math.cos(a)); const ly = f2(62 + L * Math.sin(a));
  const rx = f2(150 + L * Math.cos(a)); const ry = f2(62 - L * Math.sin(a));
  const pan = (x, y, items) => `
    <line x1="${x}" y1="${y}" x2="${f2(x - 40)}" y2="${f2(y + 62)}" stroke="#cfd8e3" stroke-width="2"/>
    <line x1="${x}" y1="${y}" x2="${f2(x + 40)}" y2="${f2(y + 62)}" stroke="#cfd8e3" stroke-width="2"/>
    ${panItems(items, x, y + 62)}
    <path d="M${f2(x - 50)} ${f2(y + 62)} Q${x} ${f2(y + 88)} ${f2(x + 50)} ${f2(y + 62)} Z" fill="#9fb3c8" stroke="#e8f2ff" stroke-width="2.5"/>`;
  return `<svg class="balance-svg ${cls}" viewBox="-12 0 324 200" role="img" aria-label="מאזני כפות">
    <path d="M150 62 L126 190 L174 190 Z" fill="#6c7f95" stroke="#e8f2ff" stroke-width="2.5" stroke-linejoin="round"/>
    <rect x="104" y="186" width="92" height="10" rx="4" fill="#6c7f95" stroke="#e8f2ff" stroke-width="2"/>
    <line x1="${lx}" y1="${ly}" x2="${rx}" y2="${ry}" stroke="#e8f2ff" stroke-width="7" stroke-linecap="round"/>
    <circle cx="150" cy="62" r="8" fill="#ffd23f" stroke="${INK}" stroke-width="2"/>
    ${pan(lx, ly, left)}${pan(rx, ry, right)}
  </svg>`;
}

/* ============================ לוח משבצות ============================ */

export const GRID_COLORS = { blue: '#59a9ff', yellow: '#ffd23f', green: '#5fd08b', red: '#ff7a6e', ghost: 'rgba(255,210,63,.35)' };
const CELL = 30;

/**
 * לוח משבצות w×h. shapes: [{ cells: [[x, y], ...], color }].
 * mirror: מספר העמודה שלפניה עובר קו המראה (אנכי). interactive: המשבצות לחיצות (data-cell="x,y").
 */
export function gridSvg({ w, h, shapes = [], mirror = null, interactive = false }, cls = '') {
  const W = w * CELL + 4; const H = h * CELL + 4;
  let cells = '';
  const colorAt = new Map();
  for (const s of shapes) for (const [x, y] of s.cells) colorAt.set(`${x},${y}`, GRID_COLORS[s.color] || s.color);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const c = colorAt.get(`${x},${y}`);
      const attrs = interactive ? ` data-cell="${x},${y}" class="grid-cell"` : '';
      cells += `<rect x="${2 + x * CELL}" y="${2 + y * CELL}" width="${CELL}" height="${CELL}" fill="${c || 'rgba(255,255,255,.05)'}" stroke="rgba(255,255,255,.28)" stroke-width="1"${attrs}/>`;
    }
  }
  // קו חיצוני לכל צורה - כדי שיהיה קל לראות את ההיקף
  let outline = '';
  for (const s of shapes) {
    const set = new Set(s.cells.map(([x, y]) => `${x},${y}`));
    for (const [x, y] of s.cells) {
      const X = 2 + x * CELL; const Y = 2 + y * CELL;
      if (!set.has(`${x},${y - 1}`)) outline += `M${X} ${Y}h${CELL}`;
      if (!set.has(`${x},${y + 1}`)) outline += `M${X} ${Y + CELL}h${CELL}`;
      if (!set.has(`${x - 1},${y}`)) outline += `M${X} ${Y}v${CELL}`;
      if (!set.has(`${x + 1},${y}`)) outline += `M${X + CELL} ${Y}v${CELL}`;
    }
  }
  const mir = mirror === null ? '' : `<line x1="${2 + mirror * CELL}" y1="0" x2="${2 + mirror * CELL}" y2="${H}" stroke="#ff6b5e" stroke-width="4" stroke-dasharray="8 5"/>`;
  return `<svg class="grid-svg ${cls}" viewBox="0 0 ${W} ${H}" dir="ltr" role="img" aria-label="לוח משבצות" style="max-width:${Math.min(W * 1.4, 520)}px">
    ${cells}<path d="${outline}" stroke="#0b2240" stroke-width="3" fill="none" stroke-linecap="square" pointer-events="none"/>${mir}
  </svg>`;
}

/* ============================ קבוצות ומערך ============================ */

/** n קבוצות, בכל אחת k פוקדורים */
export function groupsSvg({ groups, each }, cls = '') {
  const perRow = Math.min(each, 5);
  const bw = perRow * 22 + 12;
  const bh = Math.ceil(each / 5) * 22 + 12;
  const cols = Math.min(groups, 4);
  const W = cols * (bw + 12) + 4;
  const H = Math.ceil(groups / cols) * (bh + 12) + 4;
  let out = '';
  for (let gi = 0; gi < groups; gi++) {
    const gx = 4 + (gi % cols) * (bw + 12);
    const gy = 4 + Math.floor(gi / cols) * (bh + 12);
    out += `<rect x="${gx}" y="${gy}" width="${bw}" height="${bh}" rx="10" fill="rgba(255,255,255,.08)" stroke="rgba(255,210,63,.7)" stroke-width="2.5"/>`;
    for (let i = 0; i < each; i++) {
      out += miniBall(gx + 17 + (i % 5) * 22, gy + 17 + Math.floor(i / 5) * 22, 9);
    }
  }
  return `<svg class="groups-svg ${cls}" viewBox="0 0 ${W} ${H}" dir="ltr" role="img" aria-label="קבוצות" style="max-width:${Math.min(W * 1.5, 520)}px">${out}</svg>`;
}

/** מערך: rows שורות ו-cols עמודות של נקודות */
export function arraySvg({ rows, cols }, cls = '') {
  const W = cols * 28 + 8; const H = rows * 28 + 8;
  let dots = '';
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) dots += miniBall(18 + c * 28, 18 + r * 28, 10);
  return `<svg class="array-svg ${cls}" viewBox="0 0 ${W} ${H}" dir="ltr" role="img" aria-label="מערך" style="max-width:${Math.min(W * 1.5, 480)}px">${dots}</svg>`;
}

/* ============================ ישר המספרים ============================ */

/**
 * ישר מספרים סטטי: count שנתות מ-from בקפיצות של step.
 * labels = אילו שנתות מסומנות במספר. mark = השנתה שמעליה עומד פוקדור.
 */
export function axisSvg({ from, step, count, labels, mark }, cls = '') {
  const G = 46; const X0 = 26;
  const W = X0 * 2 + (count - 1) * G;
  let out = `<line x1="8" y1="60" x2="${W - 8}" y2="60" stroke="#e8f2ff" stroke-width="3"/>
    <path d="M${W - 8} 60l-10-6v12z M8 60l10-6v12z" fill="#e8f2ff"/>`;
  for (let i = 0; i < count; i++) {
    const x = X0 + i * G;
    const v = from + i * step;
    out += `<line x1="${x}" y1="50" x2="${x}" y2="70" stroke="#e8f2ff" stroke-width="${labels.includes(i) ? 3 : 2}"/>`;
    if (labels.includes(i)) out += `<text x="${x}" y="92" text-anchor="middle" font-size="17" font-weight="700" fill="#e8f2ff" font-family="Arial">${esc(fmt(v))}</text>`;
    if (i === mark) out += miniBall(x, 30, 12) + `<line x1="${x}" y1="43" x2="${x}" y2="52" stroke="#ffd23f" stroke-width="3"/>`;
  }
  return `<svg class="axis-svg ${cls}" viewBox="0 0 ${W} 104" dir="ltr" role="img" aria-label="ישר מספרים" style="max-width:${Math.min(W * 1.3, 620)}px">${out}</svg>`;
}

/* ============================ דיאגרמת עמודות ============================ */

const BAR_COLORS = ['#59a9ff', '#ffd23f', '#ff7a6e', '#5fd08b', '#b98cff'];

/** הציר בצד ימין והעמודה הראשונה מימין - כמו בקריאה בעברית */
export function chartSvg({ labels, values, unit }) {
  const W = 360, H = 240, TOP = 18, BOTTOM = 200, LEFT = 10, RIGHT = 318;
  const top = Math.max(...values);
  const axisMax = top <= 10 ? 10 : top <= 20 ? 20 : Math.ceil(top / 10) * 10;
  const step = axisMax <= 20 ? 1 : 5;
  const y = (v) => BOTTOM - (v / axisMax) * (BOTTOM - TOP);

  let grid = '';
  for (let v = 0; v <= axisMax; v += step) {
    const major = v % (step * 2) === 0;
    grid += `<line class="ch-grid ${major ? 'major' : ''}" x1="${LEFT}" x2="${RIGHT}" y1="${f2(y(v))}" y2="${f2(y(v))}"/>`;
    if (major) grid += `<text class="ch-tick" x="${RIGHT + 8}" y="${f2(y(v) + 5)}">${fmt(v)}</text>`;
  }

  const n = values.length;
  const slot = (RIGHT - LEFT) / n;
  const bw = Math.min(56, slot * 0.62);
  const bars = values.map((v, i) => {
    const cx = RIGHT - slot * (i + 0.5);
    return `
      <rect x="${f2(cx - bw / 2)}" y="${f2(y(v))}" width="${f2(bw)}" height="${f2(BOTTOM - y(v))}" rx="5" fill="${BAR_COLORS[i % BAR_COLORS.length]}"/>
      <text class="ch-label" x="${f2(cx)}" y="${BOTTOM + 22}">${esc(labels[i])}</text>`;
  }).join('');

  return `<div class="chart-unit">${esc(unit)}</div>
    <svg class="bar-chart-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(`דיאגרמת עמודות: ${unit}`)}">
      ${grid}
      <line class="ch-axis" x1="${RIGHT}" x2="${RIGHT}" y1="${TOP - 6}" y2="${BOTTOM}"/>
      <line class="ch-axis" x1="${LEFT}" x2="${RIGHT}" y1="${BOTTOM}" y2="${BOTTOM}"/>
      ${bars}
    </svg>`;
}

/* ============================ חצי ורבע ============================ */

/** צורה אחת מחולקת לחלקים שווים. filled = מערך בוליאני, offset = מאיזה מקום בו מתחילה הצורה */
export function fracShape(kind, parts, filled, offset = 0, interactive = false) {
  const cells = [];
  const fillOf = (i) => (filled[offset + i] ? 'var(--gold)' : 'rgba(255,255,255,.1)');
  const extra = (i) => (interactive ? ` data-part="${offset + i}" class="frac-part"` : '');

  if (kind === 'pizza') {
    for (let i = 0; i < parts; i++) {
      const a0 = (-90 + (i * 360) / parts) * (Math.PI / 180);
      const a1 = (-90 + ((i + 1) * 360) / parts) * (Math.PI / 180);
      const x0 = 50 + 44 * Math.cos(a0); const y0 = 50 + 44 * Math.sin(a0);
      const x1 = 50 + 44 * Math.cos(a1); const y1 = 50 + 44 * Math.sin(a1);
      const d = parts === 1
        ? 'M50 6 A44 44 0 1 1 49.9 6 Z'
        : `M50 50 L${f2(x0)} ${f2(y0)} A44 44 0 0 1 ${f2(x1)} ${f2(y1)} Z`;
      cells.push(`<path d="${d}" fill="${fillOf(i)}" stroke="#0d2340" stroke-width="2"${extra(i)}/>`);
    }
  } else if (kind === 'square' && parts === 4) {
    // ריבוע שמחולק ל-4 ריבועים קטנים
    for (let i = 0; i < 4; i++) {
      cells.push(`<rect x="${6 + (i % 2) * 44}" y="${6 + Math.floor(i / 2) * 44}" width="44" height="44" fill="${fillOf(i)}" stroke="#0d2340" stroke-width="2"${extra(i)}/>`);
    }
  } else {
    const w = 96 / parts;
    for (let i = 0; i < parts; i++) {
      cells.push(`<rect x="${f2(2 + i * w)}" y="18" width="${f2(w)}" height="64" rx="2" fill="${fillOf(i)}" stroke="#0d2340" stroke-width="2"${extra(i)}/>`);
    }
  }
  return `<svg class="frac-shape" viewBox="0 0 100 100">${cells.join('')}</svg>`;
}

/* ============================ בחירת ציור לפי סוג ============================ */

/** ציור לשאלה לפי q.figure (או לאפשרות בחירה לפי o.art) */
export function figureSvg(fig) {
  if (!fig) return '';
  switch (fig.kind) {
    case 'pairs': return pairsSvg(fig.n);
    case 'clock': return clockSvg(fig.h, fig.m);
    case 'solid': return solidSvg(fig.name);
    case 'polygon': return polygonSvg(fig.sides, fig.rot || 0);
    case 'ruler': return rulerSvg(fig);
    case 'balance': return balanceSvg(fig);
    case 'grid': return gridSvg(fig);
    case 'groups': return groupsSvg(fig);
    case 'array': return arraySvg(fig);
    case 'axis': return axisSvg(fig);
    case 'chart': return chartSvg(fig);
    case 'multi': return `<div class="fig-multi">${fig.items.map((f) => `<div>${figureSvg(f)}</div>`).join('')}</div>`;
    case 'fraction': {
      const filled = Array.from({ length: fig.shapes * fig.parts }, (_, i) => i < fig.filled);
      return `<div class="frac-shapes">${Array.from({ length: fig.shapes }, (_, s) =>
        `<div class="frac-shape-wrap">${fracShape(fig.shapeKind, fig.parts, filled, s * fig.parts)}</div>`).join('')}</div>`;
    }
    default: return '';
  }
}

export const FIGURE_KINDS = ['pairs', 'clock', 'solid', 'polygon', 'ruler', 'balance', 'grid', 'groups', 'array', 'axis', 'chart', 'fraction', 'multi'];
