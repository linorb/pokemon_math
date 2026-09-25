// shop.js - הפוקימרט: כדורים, אבני התפתחות, סוכריות, ביצי פוקימון, ובגדים ואביזרים למאמן

import { getState, update } from './storage.js';
import { rankIndexFor, RANKS } from './progress.js';
import { STONES, SPECIES } from './pokedex.js';
import { eggPool, hatchEgg } from './pokemon.js';
import { WEAR, WEAR_SLOTS, CHARACTERS, wearById } from './trainer.js';

export const SECTIONS = [
  { id: 'balls', name: 'כַּדּוּרִים' },
  { id: 'stones', name: 'אַבְנֵי הִתְפַּתְּחוּת' },
  { id: 'eggs', name: 'בֵּיצֵי פּוֹקִימוֹן' },
  { id: 'other', name: 'סֻכָּרִיּוֹת' },
  { id: 'wear', name: 'בְּגָדִים וַאֲבִיזָרִים לַמְּאַמֵּן' },
];

/** אילו פוקימונים מתפתחים עם כל אבן - לתיאור בחנות */
function stoneUsers(stoneId) {
  return Object.values(SPECIES)
    .filter((sp) => (sp.evo || []).some((e) => e.stone === stoneId))
    .map((sp) => sp.name);
}

const SLOT_NAMES = Object.fromEntries(WEAR_SLOTS.map((s) => [s.id, s.name]));

/** minRank = אינדקס דרגת המאמן המינימלית (ראו RANKS ב-progress.js) */
export const CATALOG = [
  ...WEAR.map((w) => ({
    id: w.id, kind: 'wear', section: 'wear', slot: w.slot, name: w.name, price: w.price, minRank: w.minRank,
    desc: SLOT_NAMES[w.slot],
  })),

  { id: 'great_ball', kind: 'item', section: 'balls', name: 'סוּפֶּרְדוֹר', price: 30, minRank: 0, desc: 'עוֹד 20% סִכּוּי לִתְפֹּס' },
  { id: 'ultra_ball', kind: 'item', section: 'balls', name: 'אוּלְטְרָדוֹר', price: 90, minRank: 1, desc: 'תּוֹפֵס תָּמִיד!' },

  ...Object.entries(STONES).map(([id, st]) => ({
    id, kind: 'item', section: 'stones', name: st.name, price: 150, minRank: 0, icon: st.icon,
    desc: `מְפַתַּחַת: ${stoneUsers(id).join(', ')}`,
  })),

  { id: 'egg_common', kind: 'egg', section: 'eggs', name: 'בֵּיצָה רְגִילָה', price: 100, minRank: 0, rarities: ['common'], desc: 'בּוֹקֵעַ פּוֹקִימוֹן נָפוֹץ' },
  { id: 'egg_uncommon', kind: 'egg', section: 'eggs', name: 'בֵּיצָה מְנֻקֶּדֶת', price: 220, minRank: 1, rarities: ['uncommon'], desc: 'בּוֹקֵעַ פּוֹקִימוֹן לֹא נָפוֹץ' },
  { id: 'egg_rare', kind: 'egg', section: 'eggs', name: 'בֵּיצָה נוֹצֶצֶת', price: 450, minRank: 2, rarities: ['rare'], desc: 'בּוֹקֵעַ פּוֹקִימוֹן נָדִיר' },
  { id: 'egg_legend', kind: 'egg', section: 'eggs', name: 'בֵּיצַת אַגָּדָה', price: 900, minRank: 4, rarities: ['legend'], desc: 'בּוֹקֵעַ פּוֹקִימוֹן אַגָּדִי!' },

  { id: 'rare_candy', kind: 'item', section: 'other', name: 'סֻכָּרִיָּה נְדִירָה', price: 60, minRank: 0, desc: 'עוֹד רָמָה אַחַת לְפּוֹקִימוֹן' },
];

export function itemById(id) {
  return CATALOG.find((i) => i.id === id) || null;
}

/** כמה יש מפריט (לביצים - תמיד 0, כי הן בוקעות מיד) */
export function countOf(id) {
  return getState().items[id] || 0;
}

/** האם הבגד כבר נקנה */
export function ownsWear(id) {
  return getState().trainer.owned.includes(id);
}

/**
 * האם ניתן לקנות עכשיו. מחזיר { ok, code?, reason? }
 * code: 'rank' | 'coins' | 'owned' | 'egg_done' | 'missing'
 */
export function canBuy(id) {
  const item = itemById(id);
  if (!item) return { ok: false, code: 'missing', reason: 'הַפְּרִיט לֹא נִמְצָא.' };
  const s = getState();
  if (item.kind === 'wear' && ownsWear(id)) {
    return { ok: false, code: 'owned', reason: 'כְּבָר יֵשׁ לָכֶם אֶת זֶה.' };
  }
  if (rankIndexFor(s.player.xp) < item.minRank) {
    return { ok: false, code: 'rank', reason: `צָרִיךְ לְהַגִּיעַ לְדַרְגַּת ${RANKS[item.minRank].name}.` };
  }
  if (item.kind === 'egg' && !eggPool(item.rarities).length) {
    return { ok: false, code: 'egg_done', reason: 'כְּבָר יֵשׁ לָכֶם אֶת כָּל הַפּוֹקִימוֹנִים שֶׁבּוֹקְעִים מֵהַבֵּיצָה הַזֹּאת!' };
  }
  if (s.player.coins < item.price) {
    const miss = item.price - s.player.coins;
    return { ok: false, code: 'coins', reason: `חֲסֵרִים ${miss} פּוֹקָדוֹלָרִים.` };
  }
  return { ok: true };
}

/** קנייה. ביצה בוקעת מיד, ובגד נלבש מיד. מחזיר { ok, item, hatched? } */
export function buy(id) {
  const check = canBuy(id);
  if (!check.ok) return check;
  const item = itemById(id);
  update((s) => {
    s.player.coins -= item.price;
    if (item.kind === 'item') s.items[item.id] = (s.items[item.id] || 0) + 1;
    if (item.kind === 'wear') {
      s.trainer.owned.push(item.id);
      s.trainer.equipped[item.slot] = item.id;
    }
  });
  if (item.kind === 'egg') return { ok: true, item, hatched: hatchEgg(item.rarities) };
  return { ok: true, item };
}

/* ============================ המאמן: לבוש ודמות ============================ */

/** לבישה או הורדה (id = null) של פריט */
export function equipWear(slot, id) {
  update((s) => {
    if (id) {
      const w = wearById(id);
      if (!w || w.slot !== slot || !s.trainer.owned.includes(id)) return;
    }
    s.trainer.equipped[slot] = id || null;
  });
}

export function setCharacter(id) {
  if (!CHARACTERS.some((c) => c.id === id)) return;
  update((s) => { s.trainer.character = id; });
}

export function trainerLook() {
  const t = getState().trainer;
  return { character: t.character, equipped: { ...t.equipped } };
}
