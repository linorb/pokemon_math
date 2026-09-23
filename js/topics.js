// topics.js - רשימת הנושאים (המכונים) לפי תכנית הלימודים במתמטיקה לכיתה ב'.
// קובץ נפרד וקטן, כדי שגם storage.js יוכל לדעת מה פתוח כברירת מחדל.

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
  numbers: { id: 'numbers', section: 'A', name: 'מספרים עד 1,000', gym: 'מכון ערך המקום', icon: '🔢', defaultOn: true, ready: true },
  even_odd: { id: 'even_odd', section: 'A', name: 'זוגי ואי-זוגי', gym: 'מכון הזוגות', icon: '👯', defaultOn: true, ready: true },
  hebrew_nums: { id: 'hebrew_nums', section: 'A', name: 'מספרים באותיות (א-ל)', gym: 'מכון האותיות', icon: '🔤', defaultOn: false, ready: false },
  add_sub: { id: 'add_sub', section: 'B', name: 'חיבור וחיסור', gym: 'מכון החיבור', icon: '➕', defaultOn: true, ready: true },
  missing: { id: 'missing', section: 'B', name: 'המספר החסר', gym: 'מכון החידות', icon: '❓', defaultOn: true, ready: true },
  insight: { id: 'insight', section: 'B', name: 'אומדן והשוואה', gym: 'מכון התובנה', icon: '🔮', defaultOn: true, ready: true },
  word_add: { id: 'word_add', section: 'B', name: 'שאלות חיבור וחיסור, כסף ועודף', gym: 'מכון המשימות', icon: '🛍️', defaultOn: true, ready: true },
  vertical: { id: 'vertical', section: 'B', name: 'חיבור וחיסור במאונך', gym: 'מכון העמודות', icon: '🧱', defaultOn: false, ready: false },
  mult_div: { id: 'mult_div', section: 'B', name: 'כפל וחילוק', gym: 'מכון הכפל', icon: '✖️', defaultOn: false, ready: false },
  divisibility: { id: 'divisibility', section: 'B', name: 'קפיצות של 2, 5 ו-10', gym: 'מכון הקפיצות', icon: '🦘', defaultOn: false, ready: false },
  parens: { id: 'parens', section: 'B', name: 'סוגריים', gym: 'מכון הסוגריים', icon: '🫧', defaultOn: false, ready: false },
  word_mult: { id: 'word_mult', section: 'B', name: 'שאלות כפל וחילוק', gym: 'מכון החלוקה', icon: '🍬', defaultOn: false, ready: false },
  numberline: { id: 'numberline', section: 'C', name: 'ישר המספרים', gym: 'מכון הישר', icon: '📏', defaultOn: false, ready: false },
  fractions: { id: 'fractions', section: 'C', name: 'חצי ורבע', gym: 'מכון הפיצה', icon: '🍕', defaultOn: false, ready: false },
  data: { id: 'data', section: 'D', name: 'דיאגרמות', gym: 'מכון הנתונים', icon: '📊', defaultOn: false, ready: false },
  measure: { id: 'measure', section: 'E', name: 'אורך ומשקל', gym: 'מכון המאזניים', icon: '⚖️', defaultOn: false, ready: false },
  area: { id: 'area', section: 'E', name: 'שטח והיקף', gym: 'מכון המשבצות', icon: '🟩', defaultOn: false, ready: false },
  time: { id: 'time', section: 'E', name: 'שעון וזמן', gym: 'מכון השעון', icon: '🕒', defaultOn: false, ready: false },
  solids: { id: 'solids', section: 'E', name: 'גופים וצורות', gym: 'מכון הגופים', icon: '🧊', defaultOn: false, ready: false },
  symmetry: { id: 'symmetry', section: 'E', name: 'שיקוף והזזה', gym: 'מכון המראה', icon: '🪞', defaultOn: false, ready: false },
};

/** סדר המכונים במפה - לפי סדר התכנית */
export const REGION_ORDER = Object.keys(TOPICS);

export const DEFAULT_TOPICS = REGION_ORDER.filter((id) => TOPICS[id].defaultOn);
