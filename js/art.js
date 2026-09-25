// art.js - ציורים: תמונות הפוקימונים, כדורים, ביצים, והמחשות לשאלות (קוביות, כסף, זוגות).
//
// תמונות הפוקימונים לא שמורות בפרויקט - הן נטענות בזמן המשחק מהמאגר הפתוח PokeAPI.
// אם אין אינטרנט, מוצג עיגול בצבע הסוג עם שם הפוקימון, והמשחק ממשיך לעבוד.

import { SPECIES, TYPES } from './pokedex.js';
import { renderTrainer } from './trainer.js';
import { esc } from './util.js';

const SPRITE_BASE = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/';

export function spriteUrl(id) {
  return `${SPRITE_BASE}${Number(id)}.png`;
}

/**
 * תמונת פוקימון.
 * opts.silhouette - צללית שחורה (פוקימון שעוד לא נתפס)
 * opts.unknown - גם בלי שם (פוקימון שעוד לא נראה)
 * opts.cls - מחלקות נוספות (גודל, היפוך)
 */
export function pokemonImg(id, opts = {}) {
  const sp = SPECIES[id];
  const name = sp ? sp.name : '?';
  const color = sp && TYPES[sp.type] ? TYPES[sp.type].color : '#888';
  const label = opts.unknown ? '?' : name;
  const cls = ['pk-img', opts.silhouette ? 'silhouette' : '', opts.cls || ''].filter(Boolean).join(' ');
  return `<span class="${cls}" style="--type:${color}" data-name="${esc(label)}">`
    + `<img src="${spriteUrl(id)}" alt="${esc(label)}" loading="lazy" draggable="false" `
    + `onerror="this.parentElement.classList.add('noimg')"></span>`;
}

/* ============================ כדורים ============================ */

const BALL_COLORS = {
  poke_ball: { top: '#e3350d', mark: null },
  great_ball: { top: '#3b6fd8', mark: '#e3350d' },
  ultra_ball: { top: '#2b2b2b', mark: '#f4d23c' },
};

export function ballSvg(kind = 'poke_ball', cls = '') {
  const c = BALL_COLORS[kind] || BALL_COLORS.poke_ball;
  const marks = !c.mark ? '' : kind === 'ultra_ball'
    ? `<path d="M28 8v30M72 8v30" stroke="${c.mark}" stroke-width="9" stroke-linecap="round"/>`
    : `<path d="M22 24q10-12 18-14M78 24q-10-12-18-14" stroke="${c.mark}" stroke-width="7" fill="none" stroke-linecap="round"/>`;
  return `<svg class="ball-svg ${cls}" viewBox="0 0 100 100" aria-hidden="true">
    <circle cx="50" cy="50" r="46" fill="#fff" stroke="#222" stroke-width="5"/>
    <path d="M4 50a46 46 0 0 1 92 0z" fill="${c.top}" stroke="#222" stroke-width="5"/>
    ${marks}
    <path d="M4 50h92" stroke="#222" stroke-width="6"/>
    <circle cx="50" cy="50" r="13" fill="#fff" stroke="#222" stroke-width="6"/>
    <circle cx="50" cy="50" r="5" fill="#fff" stroke="#bbb" stroke-width="2"/>
  </svg>`;
}

/* ============================ ביצים ============================ */

const EGG_COLORS = {
  egg_common: { base: '#fff4dc', spot: '#7cc576' },
  egg_uncommon: { base: '#fff4dc', spot: '#4d90d5' },
  egg_rare: { base: '#fffbe8', spot: '#f4c430' },
  egg_legend: { base: '#e6dcff', spot: '#b57bff' },
};

export function eggSvg(kind = 'egg_common', cls = '') {
  const c = EGG_COLORS[kind] || EGG_COLORS.egg_common;
  const sparkle = kind === 'egg_rare' || kind === 'egg_legend'
    ? '<path d="M78 18l3 7 7 3-7 3-3 7-3-7-7-3 7-3z" fill="#fff6a8"/>' : '';
  return `<svg class="egg-svg ${cls}" viewBox="0 0 100 110" aria-hidden="true">
    <path d="M50 6C26 6 10 44 10 68c0 22 18 38 40 38s40-16 40-38C90 44 74 6 50 6z" fill="${c.base}" stroke="#333" stroke-width="4"/>
    <ellipse cx="36" cy="44" rx="9" ry="12" fill="${c.spot}"/>
    <ellipse cx="64" cy="66" rx="12" ry="10" fill="${c.spot}"/>
    <ellipse cx="38" cy="84" rx="7" ry="6" fill="${c.spot}"/>
    <ellipse cx="62" cy="32" rx="5" ry="6" fill="${c.spot}"/>
    ${sparkle}
  </svg>`;
}

/** ציור לפריט בחנות / במלאי. בגד מוצג על המאמן עצמו (look = הדמות הנוכחית) */
export function itemArt(item, look = null) {
  if (!item) return '';
  if (item.kind === 'wear') {
    return renderTrainer({ character: look && look.character, equipped: { [item.slot]: item.id } }, 'mini');
  }
  if (item.id.endsWith('_ball')) return ballSvg(item.id);
  if (item.kind === 'egg') return eggSvg(item.id);
  if (item.icon) return `<span class="gem-art">${item.icon}</span>`;
  if (item.id === 'rare_candy') return '<span class="gem-art candy">🍬</span>';
  return '';
}

/* ============================ קוביות עשרות ויחידות ============================ */

function hundredSvg() {
  let lines = '';
  for (let i = 1; i < 10; i++) lines += `<path d="M${i * 5} 0v50M0 ${i * 5}h50"/>`;
  return `<svg class="bt bt-h" viewBox="0 0 50 50"><rect width="50" height="50" rx="1.5"/><g>${lines}</g></svg>`;
}

function tenSvg() {
  let lines = '';
  for (let i = 1; i < 10; i++) lines += `<path d="M0 ${i * 5}h5"/>`;
  return `<svg class="bt bt-t" viewBox="0 0 5 50"><rect width="5" height="50" rx=".8"/><g>${lines}</g></svg>`;
}

function oneSvg() {
  return '<svg class="bt bt-u" viewBox="0 0 5 5"><rect width="5" height="5" rx=".8"/></svg>';
}

/** המחשה של מאות, עשרות ויחידות (משמאל לימין, כמו בכתיבת מספר) */
export function baseTenBlocks({ h = 0, t = 0, u = 0 }) {
  const group = (n, fn, cls) => (n > 0
    ? `<div class="bt-group ${cls}">${Array.from({ length: n }, fn).join('')}</div>` : '');
  return `<div class="bt-wrap" dir="ltr">
    ${group(h, hundredSvg, 'g-h')}${group(t, tenSvg, 'g-t')}${group(u, oneSvg, 'g-u')}
  </div>`;
}

/* ============================ כסף ============================ */

export const MONEY = [
  { v: 1, kind: 'coin' }, { v: 2, kind: 'coin' }, { v: 5, kind: 'coin' }, { v: 10, kind: 'coin' },
  { v: 20, kind: 'note' }, { v: 50, kind: 'note' }, { v: 100, kind: 'note' },
];

/** צבעי השטרות (20 אדום, 50 ירוק, 100 כתום, 200 כחול - כמו במציאות) */
const NOTE_COLORS = { 20: '#d95b6a', 50: '#4fae7a', 100: '#e59a3a', 200: '#4a7fd0' };

/** קוטר המטבעות האמיתיים במ"מ - כדי שהגדלים ביניהם יהיו כמו במציאות */
const COIN_MM = { 1: 18, 2: 21.6, 5: 24, 10: 23 };
const PX_PER_MM = 2.7;

const SILVER = '#d3d8de';
const SILVER_RIM = '#8c96a1';
const GOLD = '#e2bd4f';
const GOLD_RIM = '#a8811f';

/** מצולע משוכלל (למטבע 5 שקלים, שיש לו 12 פינות) */
function polygon(n, r, cx = 50, cy = 50, rot = -90) {
  return Array.from({ length: n }, (_, i) => {
    const a = ((rot + (i * 360) / n) * Math.PI) / 180;
    return `${(cx + r * Math.cos(a)).toFixed(2)},${(cy + r * Math.sin(a)).toFixed(2)}`;
  }).join(' ');
}

function coinText(v, color = '#3d4550') {
  return `<text x="50" y="${v === 10 ? 56 : 58}" text-anchor="middle" font-size="${v === 10 ? 30 : 38}" font-weight="900" fill="${color}" font-family="Arial">${v}</text>
    <text x="50" y="${v === 10 ? 74 : 80}" text-anchor="middle" font-size="${v === 10 ? 13 : 15}" font-weight="700" fill="${color}" font-family="Arial">₪</text>`;
}

/**
 * מטבע או שטר של שקלים, בצבעים ובגדלים של המטבעות האמיתיים:
 * 1 - עיגול כסוף קטן, 2 - עיגול כסוף גדול יותר, 5 - כסוף עם 12 פינות,
 * 10 - דו-מתכתי: טבעת כסופה ומרכז זהוב.
 */
export function moneySvg(v) {
  if (v >= 20) {
    const c = NOTE_COLORS[v] || '#8cb';
    return `<svg class="money-svg note" viewBox="0 0 120 64" aria-label="${v} שקלים">
      <rect x="2" y="2" width="116" height="60" rx="6" fill="${c}" stroke="#333" stroke-width="2.5"/>
      <rect x="9" y="9" width="102" height="46" rx="4" fill="none" stroke="rgba(255,255,255,.55)" stroke-width="2"/>
      <circle cx="30" cy="32" r="14" fill="rgba(255,255,255,.3)"/>
      <text x="80" y="42" text-anchor="middle" font-size="28" font-weight="900" fill="#fff" stroke="rgba(0,0,0,.35)" stroke-width="1" font-family="Arial">${v}</text>
      <text x="30" y="38" text-anchor="middle" font-size="16" font-weight="700" fill="#fff" font-family="Arial">₪</text>
    </svg>`;
  }
  const size = Math.round((COIN_MM[v] || 20) * PX_PER_MM);
  const shine = '<ellipse cx="36" cy="30" rx="18" ry="10" fill="#fff" opacity=".35" transform="rotate(-30 36 30)"/>';
  let body;
  if (v === 5) {
    body = `<polygon points="${polygon(12, 47)}" fill="${SILVER}" stroke="${SILVER_RIM}" stroke-width="3" stroke-linejoin="round"/>
      <circle cx="50" cy="50" r="37" fill="none" stroke="${SILVER_RIM}" stroke-width="1.5" opacity=".7"/>`;
  } else if (v === 10) {
    body = `<circle cx="50" cy="50" r="47" fill="${SILVER}" stroke="${SILVER_RIM}" stroke-width="3"/>
      <circle cx="50" cy="50" r="33" fill="${GOLD}" stroke="${GOLD_RIM}" stroke-width="2.5"/>`;
  } else {
    body = `<circle cx="50" cy="50" r="47" fill="${SILVER}" stroke="${SILVER_RIM}" stroke-width="3"/>
      <circle cx="50" cy="50" r="39" fill="none" stroke="${SILVER_RIM}" stroke-width="1.5" opacity=".7"/>`;
  }
  return `<svg class="money-svg coin c${v}" viewBox="0 0 100 100" style="--d:${size}px" aria-label="${v} שקלים">
    ${body}${shine}${coinText(v, v === 10 ? '#5c4510' : '#3d4550')}
  </svg>`;
}

/* ============================ זוגות (זוגי ואי-זוגי) ============================ */

/**
 * נקודות מסודרות בזוגות: שתי שורות. במספר אי-זוגי נשארת נקודה אחת בלי זוג.
 * כל הנקודות באותו צבע - הילד/ה צריך/ה לגלות בעצמו/ה אם נשארה נקודה לבד.
 */
export function pairsSvg(n) {
  const cols = Math.ceil(n / 2);
  const W = cols * 26 + 8;
  let dots = '';
  for (let i = 0; i < n; i++) {
    const col = Math.floor(i / 2);
    const row = i % 2;
    dots += `<circle cx="${col * 26 + 17}" cy="${row * 26 + 17}" r="10"/>`;
  }
  return `<svg class="pairs-svg" viewBox="0 0 ${W} 60" style="max-width:${Math.min(W * 1.6, 520)}px" dir="ltr">${dots}</svg>`;
}
