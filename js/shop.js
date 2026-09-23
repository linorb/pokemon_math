// shop.js - הפוקימרט: כדורים, אבני התפתחות, סוכריות וביצי פוקימון

import { getState, update } from './storage.js';
import { rankIndexFor, RANKS } from './progress.js';
import { STONES, SPECIES } from './pokedex.js';
import { eggPool, hatchEgg } from './pokemon.js';

export const SECTIONS = [
  { id: 'balls', name: 'כדורים' },
  { id: 'stones', name: 'אבני התפתחות' },
  { id: 'eggs', name: 'ביצי פוקימון' },
  { id: 'other', name: 'עוד' },
];

/** אילו פוקימונים מתפתחים עם כל אבן - לתיאור בחנות */
function stoneUsers(stoneId) {
  return Object.values(SPECIES)
    .filter((sp) => (sp.evo || []).some((e) => e.stone === stoneId))
    .map((sp) => sp.name);
}

/** minRank = אינדקס דרגת המאמן המינימלית (ראו RANKS ב-progress.js) */
export const CATALOG = [
  { id: 'great_ball', kind: 'item', section: 'balls', name: 'סופרדור', price: 30, minRank: 0, desc: 'עוד 20% סיכוי לתפוס' },
  { id: 'ultra_ball', kind: 'item', section: 'balls', name: 'אולטרדור', price: 90, minRank: 1, desc: 'תופס תמיד!' },

  ...Object.entries(STONES).map(([id, st]) => ({
    id, kind: 'item', section: 'stones', name: st.name, price: 150, minRank: 0, icon: st.icon,
    desc: `מפתחת: ${stoneUsers(id).join(', ')}`,
  })),

  { id: 'egg_common', kind: 'egg', section: 'eggs', name: 'ביצה רגילה', price: 100, minRank: 0, rarities: ['common'], desc: 'בוקע פוקימון נפוץ' },
  { id: 'egg_uncommon', kind: 'egg', section: 'eggs', name: 'ביצה מנוקדת', price: 220, minRank: 1, rarities: ['uncommon'], desc: 'בוקע פוקימון לא נפוץ' },
  { id: 'egg_rare', kind: 'egg', section: 'eggs', name: 'ביצה נוצצת', price: 450, minRank: 2, rarities: ['rare'], desc: 'בוקע פוקימון נדיר' },
  { id: 'egg_legend', kind: 'egg', section: 'eggs', name: 'ביצת אגדה', price: 900, minRank: 4, rarities: ['legend'], desc: 'בוקע פוקימון אגדי!' },

  { id: 'rare_candy', kind: 'item', section: 'other', name: 'סוכרייה נדירה', price: 60, minRank: 0, desc: 'עלייה של רמה אחת לפוקימון' },
];

export function itemById(id) {
  return CATALOG.find((i) => i.id === id) || null;
}

/** כמה יש מפריט (לביצים - תמיד 0, כי הן בוקעות מיד) */
export function countOf(id) {
  return getState().items[id] || 0;
}

/** האם ניתן לקנות עכשיו. מחזיר { ok, reason } */
export function canBuy(id) {
  const item = itemById(id);
  if (!item) return { ok: false, reason: 'הפריט לא נמצא.' };
  const s = getState();
  if (rankIndexFor(s.player.xp) < item.minRank) {
    return { ok: false, reason: `צריך להגיע לדרגת ${RANKS[item.minRank].name}.` };
  }
  if (item.kind === 'egg' && !eggPool(item.rarities).length) {
    return { ok: false, reason: 'כבר יש לך את כל הפוקימונים שבוקעים מהביצה הזו!' };
  }
  if (s.player.coins < item.price) {
    return { ok: false, reason: `חסרים ${item.price - s.player.coins} פוקדולרים.` };
  }
  return { ok: true };
}

/** קנייה. ביצה בוקעת מיד. מחזיר { ok, item, hatched? } */
export function buy(id) {
  const check = canBuy(id);
  if (!check.ok) return check;
  const item = itemById(id);
  update((s) => {
    s.player.coins -= item.price;
    if (item.kind === 'item') s.items[item.id] = (s.items[item.id] || 0) + 1;
  });
  if (item.kind === 'egg') return { ok: true, item, hatched: hatchEgg(item.rarities) };
  return { ok: true, item };
}
