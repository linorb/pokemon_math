// pokemon.js - האוסף של המאמן: תפיסה, מלווה, ניסיון, רמות, התפתחות, ביצים וכדורים.
// אין כאן DOM - כל הלוגיקה נבדקת אוטומטית ב-tests/test-modules.mjs.

import { update, getState } from './storage.js';
import { SPECIES, RARITY, STONES, species, baseSpecies } from './pokedex.js';
import { uid, todayKey, weightedPick, clamp } from './util.js';

/* ============================ רמות ============================ */

export const XP_PER_LEVEL = 30;
export const MAX_LEVEL = 50;
/** ממתק שמקבלים כשתופסים פוקימון שכבר יש באוסף */
export const CANDY_XP = 20;

export function levelOf(xp) {
  return Math.min(MAX_LEVEL, 1 + Math.floor(Math.max(0, xp) / XP_PER_LEVEL));
}

export function xpForLevel(level) {
  return (clamp(level, 1, MAX_LEVEL) - 1) * XP_PER_LEVEL;
}

/** התקדמות בתוך הרמה הנוכחית - לפס הניסיון */
export function levelProgress(xp) {
  const level = levelOf(xp);
  if (level >= MAX_LEVEL) return { level, into: XP_PER_LEVEL, need: XP_PER_LEVEL, pct: 100 };
  const into = xp - xpForLevel(level);
  return { level, into, need: XP_PER_LEVEL, pct: Math.round((into / XP_PER_LEVEL) * 100) };
}

/* ============================ האוסף ============================ */

export function ownedList() {
  return getState().pokemon.owned;
}

export function findOwned(id) {
  return getState().pokemon.owned.find((o) => o.uid === id) || null;
}

export function partner() {
  const pk = getState().pokemon;
  return pk.owned.find((o) => o.uid === pk.partnerUid) || pk.owned[0] || null;
}

/** האם המין נמצא עכשיו באוסף */
export function ownsSpecies(id) {
  return getState().pokemon.owned.some((o) => o.species === id);
}

/** האם המין היה אי פעם באוסף (גם אם התפתח מאז) */
export function hasCaught(id) {
  return getState().pokemon.caught.includes(id);
}

export function hasSeen(id) {
  const pk = getState().pokemon;
  return pk.seen.includes(id) || pk.caught.includes(id);
}

export function markSeen(id) {
  update((s) => {
    if (!s.pokemon.seen.includes(id)) s.pokemon.seen.push(id);
  });
}

/** הוספת פוקימון לאוסף. מחזיר את הרשומה החדשה */
export function addPokemon(speciesId, opts = {}) {
  if (!species(speciesId)) return null;
  const entry = { uid: uid(), species: speciesId, xp: opts.xp || 0, caughtAt: todayKey() };
  update((s) => {
    s.pokemon.owned.push(entry);
    if (!s.pokemon.caught.includes(speciesId)) s.pokemon.caught.push(speciesId);
    if (!s.pokemon.seen.includes(speciesId)) s.pokemon.seen.push(speciesId);
    if (opts.partner || !s.pokemon.partnerUid) s.pokemon.partnerUid = entry.uid;
  });
  return entry;
}

export function setPartner(id) {
  update((s) => {
    if (s.pokemon.owned.some((o) => o.uid === id)) s.pokemon.partnerUid = id;
  });
}

/**
 * ניסיון לפוקימון. מחזיר מה השתנה, כדי שהמסכים יוכלו לחגוג:
 * { levelBefore, levelAfter, leveledUp, becameReady }
 */
export function addXpTo(id, n) {
  const before = findOwned(id);
  if (!before) return null;
  const readyBefore = canEvolve(id);
  const levelBefore = levelOf(before.xp);
  update((s) => {
    const o = s.pokemon.owned.find((x) => x.uid === id);
    if (o) o.xp = Math.min(xpForLevel(MAX_LEVEL), o.xp + n);
  });
  const after = findOwned(id);
  const levelAfter = levelOf(after.xp);
  return {
    uid: id,
    species: after.species,
    levelBefore,
    levelAfter,
    leveledUp: levelAfter > levelBefore,
    becameReady: !readyBefore && canEvolve(id),
  };
}

export function addPartnerXp(n) {
  const p = partner();
  return p ? addXpTo(p.uid, n) : null;
}

/* ============================ התפתחות ============================ */

/**
 * האפשרויות להתפתחות של פוקימון מסוים, כולל האם אפשר עכשיו ולמה לא.
 * [{ to, name, method: 'level'|'stone', level?, stone?, stoneName?, ready, reason }]
 */
export function evolutionOptions(id) {
  const o = findOwned(id);
  if (!o) return [];
  const sp = species(o.species);
  const items = getState().items;
  const lvl = levelOf(o.xp);
  return (sp.evo || []).map((e) => {
    const target = species(e.to);
    if (e.stone) {
      const stone = STONES[e.stone];
      const have = items[e.stone] || 0;
      return {
        to: e.to, name: target.name, method: 'stone', stone: e.stone, stoneName: stone.name,
        ready: have > 0,
        reason: have > 0 ? `יֵשׁ לָכֶם ${stone.name}` : `צָרִיךְ ${stone.name} - אֶפְשָׁר לִקְנוֹת בַּפּוֹקִימַרְט`,
      };
    }
    const left = e.level - lvl;
    return {
      to: e.to, name: target.name, method: 'level', level: e.level,
      ready: lvl >= e.level,
      reason: lvl >= e.level ? 'מוּכָן לְהִתְפַּתֵּחַ!'
        : `מִתְפַּתֵּחַ בְּרָמָה ${e.level} (${left === 1 ? 'עוֹד רָמָה אַחַת' : `עוֹד ${left} רָמוֹת`})`,
    };
  });
}

export function canEvolve(id) {
  return evolutionOptions(id).some((opt) => opt.ready);
}

/** כל הפוקימונים באוסף שמוכנים להתפתח עכשיו */
export function readyToEvolve() {
  return getState().pokemon.owned.filter((o) => canEvolve(o.uid));
}

/** התפתחות. אבן התפתחות נצרכת. מחזיר { ok, from, to, reason } */
export function evolve(id, to) {
  const opt = evolutionOptions(id).find((x) => x.to === to);
  if (!opt) return { ok: false, reason: 'הַפּוֹקִימוֹן הַזֶּה לֹא מִתְפַּתֵּחַ לְכָאן.' };
  if (!opt.ready) return { ok: false, reason: opt.reason };
  const from = findOwned(id).species;
  update((s) => {
    const o = s.pokemon.owned.find((x) => x.uid === id);
    o.species = to;
    if (opt.stone) s.items[opt.stone] = Math.max(0, (s.items[opt.stone] || 0) - 1);
    if (!s.pokemon.caught.includes(to)) s.pokemon.caught.push(to);
    if (!s.pokemon.seen.includes(to)) s.pokemon.seen.push(to);
  });
  return { ok: true, from, to };
}

/** סוכרייה נדירה: רמה אחת למעלה */
export function useRareCandy(id) {
  if (!findOwned(id)) return { ok: false, reason: 'הַפּוֹקִימוֹן לֹא נִמְצָא.' };
  if ((getState().items.rare_candy || 0) < 1) return { ok: false, reason: 'אֵין לָכֶם סֻכָּרִיָּה נְדִירָה.' };
  if (levelOf(findOwned(id).xp) >= MAX_LEVEL) return { ok: false, reason: 'הַפּוֹקִימוֹן כְּבָר בָּרָמָה הַגְּבוֹהָה בְּיוֹתֵר.' };
  update((s) => { s.items.rare_candy -= 1; });
  const o = findOwned(id);
  // קופצים בדיוק לתחילת הרמה הבאה
  return { ok: true, ...addXpTo(id, xpForLevel(levelOf(o.xp) + 1) - o.xp) };
}

/* ============================ פוקימון בר ============================ */

/** פוקימוני הבסיס שיכולים להופיע בדרגה הזו */
export function wildPool(rankIdx) {
  return baseSpecies().filter((s) => RARITY[s.rarity].minRank <= rankIdx);
}

/** בחירת פוקימון בר - פוקימון שעוד אין באוסף מופיע פי 2 יותר */
export function pickWild(rankIdx) {
  const pool = wildPool(rankIdx);
  return weightedPick(pool, (s) => RARITY[s.rarity].weight * (ownsSpecies(s.id) ? 1 : 2)).id;
}

/* ============================ תפיסה ============================ */

export const BALLS = {
  poke_ball: { id: 'poke_ball', name: 'פּוֹקָדוֹר', bonus: 0 },
  great_ball: { id: 'great_ball', name: 'סוּפֶּרְדוֹר', bonus: 0.2 },
  ultra_ball: { id: 'ultra_ball', name: 'אוּלְטְרָדוֹר', bonus: 1 },
};

/**
 * סיכוי התפיסה לפי הקרב:
 * 5 מתוך 5 נכונות - תמיד, 4 - 80%, 3 - 60%, פחות - 30%.
 * פוקימון שהתעלף נתפס תמיד. סופרדור מוסיף 20%, ואולטרדור תופס תמיד.
 */
export function catchChance({ correct, total, fainted = false, ball = 'poke_ball', rarity = 'common' }) {
  if (ball === 'ultra_ball') return 1;
  let chance;
  if (fainted || correct >= total) chance = 1;
  else if (correct === total - 1) chance = 0.8;
  else if (correct === total - 2) chance = 0.6;
  else chance = 0.3;
  if (rarity === 'legend') chance -= 0.25;
  else if (rarity === 'rare') chance -= 0.1;
  chance += (BALLS[ball] || BALLS.poke_ball).bonus;
  return clamp(Math.round(chance * 100) / 100, 0.1, 1);
}

/** כמה כדורים יש מכל סוג (פוקדור רגיל - בלי הגבלה) */
export function ballCount(ball) {
  if (ball === 'poke_ball') return Infinity;
  return getState().items[ball] || 0;
}

/**
 * זריקת כדור. roll = מספר אקראי בין 0 ל-1 (אפשר להעביר לבדיקות).
 * מחזיר { caught, isNew, duplicate, entry?, candy? }
 */
export function throwBall(wildId, chance, ball = 'poke_ball', roll = Math.random()) {
  if (ball !== 'poke_ball') {
    if (ballCount(ball) < 1) return { caught: false, error: 'אֵין לָכֶם כַּדּוּר כָּזֶה.' };
    update((s) => { s.items[ball] -= 1; });
  }
  markSeen(wildId);
  if (roll >= chance) return { caught: false };

  if (ownsSpecies(wildId)) {
    // כבר יש כזה באוסף - הופך לממתק שנותן ניסיון למלווה
    return { caught: true, duplicate: true, isNew: false, candy: addPartnerXp(CANDY_XP) };
  }
  const isNew = !hasCaught(wildId);
  const entry = addPokemon(wildId);
  return { caught: true, duplicate: false, isNew, entry };
}

/* ============================ ביצים ============================ */

/**
 * פוקימונים שיכולים לבקוע מביצה בנדירויות האלה (רק כאלה שעוד אין באוסף).
 * הדרגה הנדרשת לכל ביצה נבדקת בחנות, לא כאן.
 */
export function eggPool(rarities) {
  return baseSpecies().filter((s) => rarities.includes(s.rarity) && !ownsSpecies(s.id));
}

/** בקיעת ביצה. מחזיר את הרשומה החדשה, או null אם אין מה לבקוע */
export function hatchEgg(rarities) {
  const pool = eggPool(rarities);
  if (!pool.length) return null;
  // פוקימון שמעולם לא היה באוסף - פי 3 סיכוי
  const sp = weightedPick(pool, (s) => (hasCaught(s.id) ? 1 : 3));
  return addPokemon(sp.id);
}

/** שם הפוקימון לתצוגה */
export function nameOf(speciesId) {
  const sp = SPECIES[speciesId];
  return sp ? sp.name : '???';
}
