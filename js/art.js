// art.js - ציורים: תמונות הפוקימונים, כדורים, ביצים, והמחשות לשאלות (קוביות, כסף, זוגות).
//
// תמונות הפוקימונים לא שמורות בפרויקט - הן נטענות בזמן המשחק מהמאגר הפתוח PokeAPI.
// אם אין אינטרנט, מוצג עיגול בצבע הסוג עם שם הפוקימון, והמשחק ממשיך לעבוד.

import { SPECIES, TYPES } from './pokedex.js';
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

/** ציור לפריט בחנות / במלאי */
export function itemArt(item) {
  if (!item) return '';
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

const NOTE_COLORS = { 20: '#e8716a', 50: '#5fbd8b', 100: '#f0a33a' };

/** מטבע או שטר של שקלים */
export function moneySvg(v) {
  if (v >= 20) {
    return `<svg class="money-svg note" viewBox="0 0 120 64" aria-label="${v} שקלים">
      <rect x="2" y="2" width="116" height="60" rx="8" fill="${NOTE_COLORS[v] || '#8cb'}" stroke="#333" stroke-width="3"/>
      <rect x="10" y="10" width="100" height="44" rx="6" fill="none" stroke="rgba(255,255,255,.7)" stroke-width="2"/>
      <text x="60" y="44" text-anchor="middle" font-size="30" font-weight="900" fill="#fff" stroke="#333" stroke-width="1">${v}</text>
    </svg>`;
  }
  const gold = v === 10;
  return `<svg class="money-svg coin c${v}" viewBox="0 0 64 64" aria-label="${v} שקלים">
    <circle cx="32" cy="32" r="29" fill="${gold ? '#f2c94c' : '#d6dbe0'}" stroke="#555" stroke-width="3"/>
    ${gold ? '<circle cx="32" cy="32" r="21" fill="#d6dbe0" stroke="#888" stroke-width="2"/>' : ''}
    <text x="32" y="42" text-anchor="middle" font-size="${v === 10 ? 24 : 28}" font-weight="900" fill="#333">${v}</text>
  </svg>`;
}

/* ============================ זוגות (זוגי ואי-זוגי) ============================ */

/** נקודות מסודרות בזוגות: שתי שורות. במספר אי-זוגי נשארת נקודה אחת בלי זוג */
export function pairsSvg(n) {
  const cols = Math.ceil(n / 2);
  const W = cols * 26 + 8;
  let dots = '';
  for (let i = 0; i < n; i++) {
    const col = Math.floor(i / 2);
    const row = i % 2;
    const lonely = n % 2 === 1 && i === n - 1;
    dots += `<circle cx="${col * 26 + 17}" cy="${row * 26 + 17}" r="10" class="${lonely ? 'lonely' : ''}"/>`;
  }
  return `<svg class="pairs-svg" viewBox="0 0 ${W} 60" style="max-width:${Math.min(W * 1.6, 520)}px" dir="ltr">${dots}</svg>`;
}
