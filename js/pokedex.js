// pokedex.js - נתוני הפוקימונים: שם בעברית (מנוקד), סוג, נדירות ושרשרת התפתחות.
// המספר (id) הוא המספר הרשמי בפוקידקס, והוא משמש גם לטעינת התמונה (ראו art.js).

/** צבע לכל סוג - לרקע כרטיס ולעיגול החלופי כשהתמונה לא נטענת */
export const TYPES = {
  grass: { name: 'עֵשֶׂב', color: '#5fbd58' },
  fire: { name: 'אֵשׁ', color: '#ff8a3d' },
  water: { name: 'מַיִם', color: '#4d90d5' },
  electric: { name: 'חַשְׁמַל', color: '#f4d23c' },
  normal: { name: 'רָגִיל', color: '#a0a29f' },
  bug: { name: 'חֶרֶק', color: '#92bc2c' },
  flying: { name: 'מְעוֹפֵף', color: '#8fa8dd' },
  fairy: { name: 'פֵיָה', color: '#ec8fe6' },
  psychic: { name: 'עַל-חוּשִׁי', color: '#f97176' },
  fighting: { name: 'לוֹחֵם', color: '#d3425f' },
  rock: { name: 'סֶלַע', color: '#c9bb8a' },
  ghost: { name: 'רוּחַ', color: '#7773d4' },
  dragon: { name: 'דְּרָקוֹן', color: '#0c69c8' },
  ice: { name: 'קֶרַח', color: '#74cec0' },
};

/** אבני התפתחות */
export const STONES = {
  fire_stone: { name: 'אֶבֶן אֵשׁ', icon: '🔥' },
  water_stone: { name: 'אֶבֶן מַיִם', icon: '💧' },
  thunder_stone: { name: 'אֶבֶן בָּרָק', icon: '⚡' },
  leaf_stone: { name: 'אֶבֶן עָלֶה', icon: '🍃' },
  moon_stone: { name: 'אֶבֶן יָרֵחַ', icon: '🌙' },
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
  { id: 1, name: 'בּוּלְבָּזָאוּר', type: 'grass', rarity: 'uncommon', evo: [{ to: 2, level: 8 }] },
  { id: 2, name: 'אִיבִיזָאוּר', type: 'grass', evo: [{ to: 3, level: 18 }] },
  { id: 3, name: 'וֶנוּזָאוּר', type: 'grass' },
  { id: 4, name: 'צַ\'רְמַנְדֶּר', type: 'fire', rarity: 'uncommon', evo: [{ to: 5, level: 8 }] },
  { id: 5, name: 'צַ\'רְמִילְיוֹן', type: 'fire', evo: [{ to: 6, level: 18 }] },
  { id: 6, name: 'צַ\'רִיזַארְד', type: 'fire' },
  { id: 7, name: 'סְקְוִירְטֶל', type: 'water', rarity: 'uncommon', evo: [{ to: 8, level: 8 }] },
  { id: 8, name: 'וָוֹרְטוֹרְטֶל', type: 'water', evo: [{ to: 9, level: 18 }] },
  { id: 9, name: 'בְּלַסְטוֹיְז', type: 'water' },
  { id: 172, name: 'פִּיצ\'וּ', type: 'electric', rarity: 'uncommon', evo: [{ to: 25, level: 5 }] },
  { id: 25, name: 'פִּיקָאצ\'וּ', type: 'electric', evo: [{ to: 26, stone: 'thunder_stone' }] },
  { id: 26, name: 'רַאיצ\'וּ', type: 'electric' },

  // --- נפוצים ---
  { id: 10, name: 'קָטֶרְפִּי', type: 'bug', rarity: 'common', evo: [{ to: 11, level: 4 }] },
  { id: 11, name: 'מֶטָאפּוֹד', type: 'bug', evo: [{ to: 12, level: 8 }] },
  { id: 12, name: 'בַּטֶרְפְרִי', type: 'bug' },
  { id: 16, name: 'פִּידְג\'י', type: 'flying', rarity: 'common', evo: [{ to: 17, level: 8 }] },
  { id: 17, name: 'פִּידְג\'יאוֹטוֹ', type: 'flying', evo: [{ to: 18, level: 18 }] },
  { id: 18, name: 'פִּידְג\'יאוֹט', type: 'flying' },
  { id: 19, name: 'רָטָטָה', type: 'normal', rarity: 'common', evo: [{ to: 20, level: 10 }] },
  { id: 20, name: 'רָטִיקֵייט', type: 'normal' },
  { id: 43, name: 'אוֹדִישׁ', type: 'grass', rarity: 'common', evo: [{ to: 44, level: 9 }] },
  { id: 44, name: 'גְּלוּם', type: 'grass', evo: [{ to: 45, stone: 'leaf_stone' }] },
  { id: 45, name: 'וִילְפְּלוּם', type: 'grass' },
  { id: 52, name: 'מְיָאוּת\'', type: 'normal', rarity: 'common', evo: [{ to: 53, level: 12 }] },
  { id: 53, name: 'פֶּרְשֶׁן', type: 'normal' },
  { id: 54, name: 'פְּסַיְדָאק', type: 'water', rarity: 'common', evo: [{ to: 55, level: 12 }] },
  { id: 55, name: 'גּוֹלְדָאק', type: 'water' },
  { id: 60, name: 'פּוֹלִיוָג', type: 'water', rarity: 'common', evo: [{ to: 61, level: 9 }] },
  { id: 61, name: 'פּוֹלִיוִירְל', type: 'water', evo: [{ to: 62, stone: 'water_stone' }] },
  { id: 62, name: 'פּוֹלִירָאת\'', type: 'water' },
  { id: 74, name: 'גֶ\'אוֹדוּד', type: 'rock', rarity: 'common', evo: [{ to: 75, level: 9 }] },
  { id: 75, name: 'גְּרָאבְּלֶר', type: 'rock', evo: [{ to: 76, level: 19 }] },
  { id: 76, name: 'גּוֹלֶם', type: 'rock' },
  { id: 129, name: 'מָגִ\'יקַארְפּ', type: 'water', rarity: 'common', evo: [{ to: 130, level: 12 }] },
  { id: 130, name: 'גְּיָארָדוֹס', type: 'water' },
  { id: 174, name: 'אִיגְלִיבָּאף', type: 'fairy', rarity: 'common', evo: [{ to: 39, level: 5 }] },
  { id: 39, name: 'גִ\'יגְלִיפָאף', type: 'fairy', evo: [{ to: 40, stone: 'moon_stone' }] },
  { id: 40, name: 'וִיגְלִיטָאף', type: 'fairy' },

  // --- לא נפוצים ---
  { id: 173, name: 'קְלֶפָּה', type: 'fairy', rarity: 'uncommon', evo: [{ to: 35, level: 5 }] },
  { id: 35, name: 'קְלֶפֶיְרִי', type: 'fairy', evo: [{ to: 36, stone: 'moon_stone' }] },
  { id: 36, name: 'קְלֶפֵייבֶּל', type: 'fairy' },
  { id: 37, name: 'וּלְפִּיקְס', type: 'fire', rarity: 'uncommon', evo: [{ to: 38, stone: 'fire_stone' }] },
  { id: 38, name: 'נַיְנְטֵיילְס', type: 'fire' },
  { id: 58, name: 'גְּרוֹלִית\'', type: 'fire', rarity: 'uncommon', evo: [{ to: 59, stone: 'fire_stone' }] },
  { id: 59, name: 'אַרְקָנִין', type: 'fire' },
  { id: 63, name: 'אַבְּרָה', type: 'psychic', rarity: 'uncommon', evo: [{ to: 64, level: 8 }] },
  { id: 64, name: 'קַדַבְּרָה', type: 'psychic', evo: [{ to: 65, level: 18 }] },
  { id: 65, name: 'אַלַקָזָאם', type: 'psychic' },
  { id: 66, name: 'מַאצ\'וֹפּ', type: 'fighting', rarity: 'uncommon', evo: [{ to: 67, level: 9 }] },
  { id: 67, name: 'מַאצ\'וֹק', type: 'fighting', evo: [{ to: 68, level: 19 }] },
  { id: 68, name: 'מַאצ\'אמְפּ', type: 'fighting' },
  { id: 92, name: 'גַּאסְטְלִי', type: 'ghost', rarity: 'uncommon', evo: [{ to: 93, level: 9 }] },
  { id: 93, name: 'הוֹנְטֶר', type: 'ghost', evo: [{ to: 94, level: 19 }] },
  { id: 94, name: 'גֶּנְגָּאר', type: 'ghost' },
  { id: 133, name: 'אִיוִי', type: 'normal', rarity: 'uncommon', evo: [
    { to: 134, stone: 'water_stone' }, { to: 135, stone: 'thunder_stone' }, { to: 136, stone: 'fire_stone' },
  ] },
  { id: 134, name: 'וָאפּוֹרְיוֹן', type: 'water' },
  { id: 135, name: 'ג\'וֹלְטֵאוֹן', type: 'electric' },
  { id: 136, name: 'פְלֵרְיוֹן', type: 'fire' },
  { id: 175, name: 'טוֹגֶפִּי', type: 'fairy', rarity: 'uncommon', evo: [{ to: 176, level: 10 }] },
  { id: 176, name: 'טוֹגֶטִיק', type: 'fairy' },

  // --- נדירים (מדרגת מאמן מנוסה) ---
  { id: 95, name: 'אוֹנִיקְס', type: 'rock', rarity: 'rare' },
  { id: 131, name: 'לַאפְּרָס', type: 'ice', rarity: 'rare' },
  { id: 143, name: 'סְנוֹרְלַקְס', type: 'normal', rarity: 'rare' },
  { id: 147, name: 'דְּרָטִינִי', type: 'dragon', rarity: 'rare', evo: [{ to: 148, level: 12 }] },
  { id: 148, name: 'דְּרָגוֹנֵייר', type: 'dragon', evo: [{ to: 149, level: 22 }] },
  { id: 149, name: 'דְּרָגוֹנַייט', type: 'dragon' },
  { id: 447, name: 'רִיאוֹלוּ', type: 'fighting', rarity: 'rare', evo: [{ to: 448, level: 14 }] },
  { id: 448, name: 'לוּקַרְיוֹ', type: 'fighting' },

  // --- אגדיים (מדרגת אלוף) ---
  { id: 150, name: 'מְיוּטוּ', type: 'psychic', rarity: 'legend' },
  { id: 151, name: 'מְיוּ', type: 'psychic', rarity: 'legend' },
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
