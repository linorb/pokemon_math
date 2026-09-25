// topics.js - רשימת הנושאים (המכונים) לפי תכנית הלימודים במתמטיקה לכיתה ב'.
// קובץ נפרד וקטן, כדי שגם storage.js יוכל לדעת מה פתוח כברירת מחדל.
// השמות מנוקדים, כי הילד/ה קורא/ת אותם במפה.

/** פרקי התכנית של משרד החינוך - לקיבוץ הנושאים במסך ההורים */
export const SECTIONS = [
  { id: 'A', name: 'א. המספרים הטבעיים עד 1,000' },
  { id: 'B', name: 'ב. פעולות החשבון עד 100' },
  { id: 'C', name: 'ג. הרחבת תחום המספרים' },
  { id: 'D', name: 'ד. חקר נתונים' },
  { id: 'E', name: 'ה. מדידות וגאומטרייה' },
];

/**
 * defaultOn - פתוח מתחילת השנה (לפני שההורה פתח נושאים נוספים).
 * ready - יש לנושא שאלות במשחק. נושא שעוד לא מוכן מוצג במסך ההורים כ"בקרוב".
 */
export const TOPICS = {
  numbers: { id: 'numbers', section: 'A', name: 'מִסְפָּרִים עַד 1,000', gym: 'מְכוֹן עֵרֶךְ הַמָּקוֹם', icon: '🔢', defaultOn: true, ready: true },
  even_odd: { id: 'even_odd', section: 'A', name: 'זוּגִי וְאִי-זוּגִי', gym: 'מְכוֹן הַזּוּגוֹת', icon: '👯', defaultOn: true, ready: true },
  hebrew_nums: { id: 'hebrew_nums', section: 'A', name: 'מִסְפָּרִים בְּאוֹתִיּוֹת (א-ל)', gym: 'מְכוֹן הָאוֹתִיּוֹת', icon: '🔤', defaultOn: false, ready: false },
  add_sub: { id: 'add_sub', section: 'B', name: 'חִבּוּר וְחִסּוּר', gym: 'מְכוֹן הַחִבּוּר', icon: '➕', defaultOn: true, ready: true },
  missing: { id: 'missing', section: 'B', name: 'הַמִּסְפָּר הֶחָסֵר', gym: 'מְכוֹן הַחִידוֹת', icon: '❓', defaultOn: true, ready: true },
  insight: { id: 'insight', section: 'B', name: 'אֻמְדָּן וְהַשְׁוָאָה', gym: 'מְכוֹן הַתּוֹבָנָה', icon: '🔮', defaultOn: true, ready: true },
  word_add: { id: 'word_add', section: 'B', name: 'שְׁאֵלוֹת חִבּוּר וְחִסּוּר, כֶּסֶף וְעֹדֶף', gym: 'מְכוֹן הַמְּשִׂימוֹת', icon: '🛍️', defaultOn: true, ready: true },
  vertical: { id: 'vertical', section: 'B', name: 'חִבּוּר וְחִסּוּר בִּמְאֻנָּךְ', gym: 'מְכוֹן הָעַמּוּדוֹת', icon: '🧱', defaultOn: false, ready: false },
  mult_div: { id: 'mult_div', section: 'B', name: 'כֶּפֶל וְחִלּוּק', gym: 'מְכוֹן הַכֶּפֶל', icon: '✖️', defaultOn: false, ready: false },
  divisibility: { id: 'divisibility', section: 'B', name: 'קְפִיצוֹת שֶׁל 2, 5 וְ-10', gym: 'מְכוֹן הַקְּפִיצוֹת', icon: '🦘', defaultOn: false, ready: false },
  parens: { id: 'parens', section: 'B', name: 'סוֹגְרַיִם', gym: 'מְכוֹן הַסּוֹגְרַיִם', icon: '🫧', defaultOn: false, ready: false },
  word_mult: { id: 'word_mult', section: 'B', name: 'שְׁאֵלוֹת כֶּפֶל וְחִלּוּק', gym: 'מְכוֹן הַחֲלֻקָּה', icon: '🍬', defaultOn: false, ready: false },
  numberline: { id: 'numberline', section: 'C', name: 'יְשַׁר הַמִּסְפָּרִים', gym: 'מְכוֹן הַיָּשָׁר', icon: '📏', defaultOn: false, ready: false },
  fractions: { id: 'fractions', section: 'C', name: 'חֵצִי וָרֶבַע', gym: 'מְכוֹן הַפִּיצָה', icon: '🍕', defaultOn: false, ready: false },
  data: { id: 'data', section: 'D', name: 'דִּיאַגְרָמוֹת', gym: 'מְכוֹן הַנְּתוּנִים', icon: '📊', defaultOn: false, ready: false },
  measure: { id: 'measure', section: 'E', name: 'אֹרֶךְ וּמִשְׁקָל', gym: 'מְכוֹן הַמֹּאזְנַיִם', icon: '⚖️', defaultOn: false, ready: false },
  area: { id: 'area', section: 'E', name: 'שֶׁטַח וְהֶקֵּף', gym: 'מְכוֹן הַמִּשְׁבָּצוֹת', icon: '🟩', defaultOn: false, ready: false },
  time: { id: 'time', section: 'E', name: 'שָׁעוֹן וּזְמַן', gym: 'מְכוֹן הַשָּׁעוֹן', icon: '🕒', defaultOn: false, ready: false },
  solids: { id: 'solids', section: 'E', name: 'גּוּפִים וְצוּרוֹת', gym: 'מְכוֹן הַגּוּפִים', icon: '🧊', defaultOn: false, ready: false },
  symmetry: { id: 'symmetry', section: 'E', name: 'שִׁקּוּף וַהֲזָזָה', gym: 'מְכוֹן הַמַּרְאָה', icon: '🪞', defaultOn: false, ready: false },
};

/** סדר המכונים במפה - לפי סדר התכנית */
export const REGION_ORDER = Object.keys(TOPICS);

export const DEFAULT_TOPICS = REGION_ORDER.filter((id) => TOPICS[id].defaultOn);
