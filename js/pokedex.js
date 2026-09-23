// pokedex.js - נתוני הפוקימונים: שם בעברית, סוג, נדירות ושרשרת התפתחות.
// המספר (id) הוא המספר הרשמי בפוקידקס, והוא משמש גם לטעינת התמונה (ראו art.js).

/** צבע לכל סוג - לרקע כרטיס ולעיגול החלופי כשהתמונה לא נטענת */
export const TYPES = {
  grass: { name: 'עשב', color: '#5fbd58' },
  fire: { name: 'אש', color: '#ff8a3d' },
  water: { name: 'מים', color: '#4d90d5' },
  electric: { name: 'חשמל', color: '#f4d23c' },
  normal: { name: 'רגיל', color: '#a0a29f' },
  bug: { name: 'חרק', color: '#92bc2c' },
  flying: { name: 'מעופף', color: '#8fa8dd' },
  fairy: { name: 'פיה', color: '#ec8fe6' },
  psychic: { name: 'על-חושי', color: '#f97176' },
  fighting: { name: 'לוחם', color: '#d3425f' },
  rock: { name: 'סלע', color: '#c9bb8a' },
  ghost: { name: 'רוח', color: '#7773d4' },
  dragon: { name: 'דרקון', color: '#0c69c8' },
  ice: { name: 'קרח', color: '#74cec0' },
};

/** אבני התפתחות */
export const STONES = {
  fire_stone: { name: 'אבן אש', icon: '🔥' },
  water_stone: { name: 'אבן מים', icon: '💧' },
  thunder_stone: { name: 'אבן ברק', icon: '⚡' },
  leaf_stone: { name: 'אבן עלה', icon: '🍃' },
  moon_stone: { name: 'אבן ירח', icon: '🌙' },
};

/** נדירות: קובעת מתי הפוקימון יכול להופיע בטבע ובאיזו ביצה */
export const RARITY = {
  common: { name: 'נפוץ', minRank: 0, weight: 10 },
  uncommon: { name: 'לא נפוץ', minRank: 0, weight: 4 },
  rare: { name: 'נדיר', minRank: 2, weight: 2 },
  legend: { name: 'אגדי', minRank: 4, weight: 1 },
};

/**
 * evo: רשימת התפתחויות אפשריות.
 *   { to, level } - מתפתח כשמגיע לרמה
 *   { to, stone } - מתפתח עם אבן (בכל רמה)
 * rarity קיימת רק לפוקימון בסיס (שלב ראשון) - רק הם מופיעים בטבע ובביצים.
 */
const LIST = [
  // --- פוקימוני הפתיחה ---
  { id: 1, name: 'בולבזאור', type: 'grass', rarity: 'uncommon', evo: [{ to: 2, level: 8 }] },
  { id: 2, name: 'איביזאור', type: 'grass', evo: [{ to: 3, level: 18 }] },
  { id: 3, name: 'ונוזאור', type: 'grass' },
  { id: 4, name: 'צ\'רמנדר', type: 'fire', rarity: 'uncommon', evo: [{ to: 5, level: 8 }] },
  { id: 5, name: 'צ\'רמיליון', type: 'fire', evo: [{ to: 6, level: 18 }] },
  { id: 6, name: 'צ\'אריזארד', type: 'fire' },
  { id: 7, name: 'סקווירטל', type: 'water', rarity: 'uncommon', evo: [{ to: 8, level: 8 }] },
  { id: 8, name: 'וורטורטל', type: 'water', evo: [{ to: 9, level: 18 }] },
  { id: 9, name: 'בלסטויז', type: 'water' },
  { id: 172, name: 'פיצ\'ו', type: 'electric', rarity: 'uncommon', evo: [{ to: 25, level: 5 }] },
  { id: 25, name: 'פיקאצ\'ו', type: 'electric', evo: [{ to: 26, stone: 'thunder_stone' }] },
  { id: 26, name: 'ראיצ\'ו', type: 'electric' },

  // --- נפוצים ---
  { id: 10, name: 'קטרפי', type: 'bug', rarity: 'common', evo: [{ to: 11, level: 4 }] },
  { id: 11, name: 'מטאפוד', type: 'bug', evo: [{ to: 12, level: 8 }] },
  { id: 12, name: 'באטרפרי', type: 'bug' },
  { id: 16, name: 'פידג\'י', type: 'flying', rarity: 'common', evo: [{ to: 17, level: 8 }] },
  { id: 17, name: 'פידג\'יאוטו', type: 'flying', evo: [{ to: 18, level: 18 }] },
  { id: 18, name: 'פידג\'יאוט', type: 'flying' },
  { id: 19, name: 'ראטאטה', type: 'normal', rarity: 'common', evo: [{ to: 20, level: 10 }] },
  { id: 20, name: 'ראטיקייט', type: 'normal' },
  { id: 43, name: 'אודיש', type: 'grass', rarity: 'common', evo: [{ to: 44, level: 9 }] },
  { id: 44, name: 'גלום', type: 'grass', evo: [{ to: 45, stone: 'leaf_stone' }] },
  { id: 45, name: 'ווילפלום', type: 'grass' },
  { id: 52, name: 'מיאות\'', type: 'normal', rarity: 'common', evo: [{ to: 53, level: 12 }] },
  { id: 53, name: 'פרשן', type: 'normal' },
  { id: 54, name: 'פסיידאק', type: 'water', rarity: 'common', evo: [{ to: 55, level: 12 }] },
  { id: 55, name: 'גולדאק', type: 'water' },
  { id: 60, name: 'פוליוואג', type: 'water', rarity: 'common', evo: [{ to: 61, level: 9 }] },
  { id: 61, name: 'פוליווירל', type: 'water', evo: [{ to: 62, stone: 'water_stone' }] },
  { id: 62, name: 'פוליראת\'', type: 'water' },
  { id: 74, name: 'ג\'אודוד', type: 'rock', rarity: 'common', evo: [{ to: 75, level: 9 }] },
  { id: 75, name: 'גראבלר', type: 'rock', evo: [{ to: 76, level: 19 }] },
  { id: 76, name: 'גולם', type: 'rock' },
  { id: 129, name: 'מג\'יקארפ', type: 'water', rarity: 'common', evo: [{ to: 130, level: 12 }] },
  { id: 130, name: 'גיאראדוס', type: 'water' },
  { id: 174, name: 'איגליבאף', type: 'fairy', rarity: 'common', evo: [{ to: 39, level: 5 }] },
  { id: 39, name: 'ג\'יגליפאף', type: 'fairy', evo: [{ to: 40, stone: 'moon_stone' }] },
  { id: 40, name: 'וויגליטאף', type: 'fairy' },

  // --- לא נפוצים ---
  { id: 173, name: 'קלפה', type: 'fairy', rarity: 'uncommon', evo: [{ to: 35, level: 5 }] },
  { id: 35, name: 'קלפייארי', type: 'fairy', evo: [{ to: 36, stone: 'moon_stone' }] },
  { id: 36, name: 'קלפייבל', type: 'fairy' },
  { id: 37, name: 'וולפיקס', type: 'fire', rarity: 'uncommon', evo: [{ to: 38, stone: 'fire_stone' }] },
  { id: 38, name: 'ניינטיילס', type: 'fire' },
  { id: 58, name: 'גרולית\'', type: 'fire', rarity: 'uncommon', evo: [{ to: 59, stone: 'fire_stone' }] },
  { id: 59, name: 'ארקנין', type: 'fire' },
  { id: 63, name: 'אברה', type: 'psychic', rarity: 'uncommon', evo: [{ to: 64, level: 8 }] },
  { id: 64, name: 'קדברה', type: 'psychic', evo: [{ to: 65, level: 18 }] },
  { id: 65, name: 'אלקזאם', type: 'psychic' },
  { id: 66, name: 'מאצ\'ופ', type: 'fighting', rarity: 'uncommon', evo: [{ to: 67, level: 9 }] },
  { id: 67, name: 'מאצ\'וק', type: 'fighting', evo: [{ to: 68, level: 19 }] },
  { id: 68, name: 'מאצ\'אמפ', type: 'fighting' },
  { id: 92, name: 'גאסטלי', type: 'ghost', rarity: 'uncommon', evo: [{ to: 93, level: 9 }] },
  { id: 93, name: 'הונטר', type: 'ghost', evo: [{ to: 94, level: 19 }] },
  { id: 94, name: 'גנגאר', type: 'ghost' },
  { id: 133, name: 'איווי', type: 'normal', rarity: 'uncommon', evo: [
    { to: 134, stone: 'water_stone' }, { to: 135, stone: 'thunder_stone' }, { to: 136, stone: 'fire_stone' },
  ] },
  { id: 134, name: 'ואפוריון', type: 'water' },
  { id: 135, name: 'ג\'ולטאון', type: 'electric' },
  { id: 136, name: 'פלריון', type: 'fire' },
  { id: 175, name: 'טוגפי', type: 'fairy', rarity: 'uncommon', evo: [{ to: 176, level: 10 }] },
  { id: 176, name: 'טוגטיק', type: 'fairy' },

  // --- נדירים (מדרגת מאמן מנוסה) ---
  { id: 95, name: 'אוניקס', type: 'rock', rarity: 'rare' },
  { id: 131, name: 'לאפרס', type: 'ice', rarity: 'rare' },
  { id: 143, name: 'סנורלקס', type: 'normal', rarity: 'rare' },
  { id: 147, name: 'דרטיני', type: 'dragon', rarity: 'rare', evo: [{ to: 148, level: 12 }] },
  { id: 148, name: 'דרגונייר', type: 'dragon', evo: [{ to: 149, level: 22 }] },
  { id: 149, name: 'דרגונייט', type: 'dragon' },
  { id: 447, name: 'ריולו', type: 'fighting', rarity: 'rare', evo: [{ to: 448, level: 14 }] },
  { id: 448, name: 'לוקריו', type: 'fighting' },

  // --- אגדיים (מדרגת אלוף) ---
  { id: 150, name: 'מיוטו', type: 'psychic', rarity: 'legend' },
  { id: 151, name: 'מיו', type: 'psychic', rarity: 'legend' },
];

export const SPECIES = Object.fromEntries(LIST.map((s) => [s.id, { evo: [], ...s }]));

/** סדר ההצגה בפוקידקס: לפי שרשראות, כמו ברשימה */
export const DEX_ORDER = LIST.map((s) => s.id);

/** פוקימוני הפתיחה שאפשר לבחור ביצירת המאמן */
export const STARTERS = [1, 4, 7, 25];

export function species(id) {
  return SPECIES[id] || null;
}

/** פוקימוני בסיס (רק הם מופיעים בטבע ובביצים) */
export function baseSpecies() {
  return LIST.filter((s) => s.rarity).map((s) => SPECIES[s.id]);
}

/** מאיזה פוקימון מתפתח הפוקימון הזה (או null) */
export function evolvesFrom(id) {
  const from = LIST.find((s) => (s.evo || []).some((e) => e.to === id));
  return from ? from.id : null;
}

/** בסיס השרשרת (למשל 3 -> 1) */
export function chainRoot(id) {
  let cur = id;
  for (let i = 0; i < 5; i++) {
    const prev = evolvesFrom(cur);
    if (!prev) return cur;
    cur = prev;
  }
  return cur;
}
