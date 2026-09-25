// util.js - פונקציות עזר כלליות (ללא תלות ב-DOM כדי שניתן יהיה לבדוק אותן אוטומטית)

/** מספר שלם אקראי בין a ל-b (כולל) */
export function ri(a, b) {
  return a + Math.floor(Math.random() * (b - a + 1));
}

/** בחירת איבר אקראי מתוך מערך */
export function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** ערבוב מערך (מחזיר עותק חדש) */
export function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** בחירה אקראית ממערך, עם משקלים */
export function weightedPick(items, weightOf) {
  const weights = items.map((it) => Math.max(0.0001, weightOf(it)));
  const total = weights.reduce((s, w) => s + w, 0);
  let r = Math.random() * total;
  for (let i = 0; i < items.length; i++) {
    r -= weights[i];
    if (r <= 0) return items[i];
  }
  return items[items.length - 1];
}

/** פורמט מספר עם מפרידי אלפים: 9184 -> "9,184" */
export function fmt(n) {
  if (n === null || n === undefined || Number.isNaN(n)) return '';
  const neg = n < 0;
  const s = Math.abs(n).toString();
  const parts = s.split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return (neg ? '-' : '') + parts.join('.');
}

/** המרת מחרוזת שהוקלדה למספר ("9,184" -> 9184). מחזיר null אם ריק/לא תקין */
export function parseNum(s) {
  if (typeof s !== 'string') s = String(s ?? '');
  const clean = s.replace(/[,\s‏‎]/g, '');
  if (clean === '' || clean === '-') return null;
  if (!/^-?\d+$/.test(clean)) return null;
  return Number(clean);
}

export function clamp(n, lo, hi) {
  return Math.min(hi, Math.max(lo, n));
}

/** מפתח יום מקומי: "2026-09-22" */
export function todayKey(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** הפרש בימים בין שני מפתחות יום */
export function daysBetweenKeys(a, b) {
  if (!a || !b) return Infinity;
  const pa = a.split('-').map(Number);
  const pb = b.split('-').map(Number);
  const da = Date.UTC(pa[0], pa[1] - 1, pa[2]);
  const db = Date.UTC(pb[0], pb[1] - 1, pb[2]);
  return Math.round((db - da) / 86400000);
}

/** תאריך בעברית לתצוגה */
export function hebDate(key) {
  if (!key) return '—';
  const [y, m, d] = key.split('-');
  return `${Number(d)}.${Number(m)}.${y}`;
}

export function uid() {
  return Math.random().toString(36).slice(2, 10);
}

/**
 * עוטף כל ביטוי חשבוני בתוך משפט עברי ב-span עם dir="ltr",
 * כדי שתרגילים כמו "5 + 8 × 5 = 45" לא יתהפכו בתוך טקסט מימין לשמאל.
 * הקלט חייב להיות טקסט שכבר עבר esc().
 */
const MATH_RUN = /[\d(][\d,\s()+\-−×÷:=]*[\d)]/g;

export function wrapMath(escapedText) {
  return String(escapedText ?? '').replace(MATH_RUN, (m) => {
    if (!/[+\-−×÷:=]/.test(m)) return m;              // מספר בודד - לא צריך עטיפה
    const trailing = m.match(/[\s]+$/);                // לא בולעים רווח בסוף
    const core = trailing ? m.slice(0, -trailing[0].length) : m;
    return `<span class="mathrun" dir="ltr">${core}</span>${trailing ? trailing[0] : ''}`;
  });
}

/**
 * הסרת ניקוד וטעמים. משמש להקראה (מנועי הקראה מתבלבלים מניקוד)
 * ולבדיקות אוטומטיות שמשוות טקסט.
 */
export function stripNiqqud(text) {
  return String(text ?? '').replace(/[֑-ׇ]/g, '');
}

/**
 * הפיכת תרגיל לנוסח מדובר עבור ההקראה: "23 + 4 = ?" -> "23 ועוד 4 שווה כמה".
 * בלי זה מנוע ההקראה אומר "פלוס" או מדלג על הסימנים.
 */
export function speakMath(text) {
  return stripNiqqud(String(text ?? ''))
    .replace(/\[\[|\]\]/g, '')
    .replace(/[⁦-⁩]/g, '')
    .replace(/ק"ג/g, 'קילוגרם')
    // סימן שאלה שהוא "מקום ריק" בתרגיל (ולא סוף של שאלה בעברית)
    .replace(/(^|[=+\-−×:]\s*)\?/g, '$1כמה')
    .replace(/\?(?=\s*[=+\-−×:])/g, 'כמה')
    .replace(/\s*\+\s*/g, ' ועוד ')
    .replace(/(\d|כמה)\s*[-−]\s*(?=\d|כמה)/g, '$1 פחות ')
    .replace(/\s*×\s*/g, ' כפול ')
    .replace(/(\d|כמה)\s*:\s*(?=\d|כמה)/g, '$1 לחלק ל ')
    .replace(/\s*=\s*/g, ' שווה ')
    .replace(/▢/g, ',')
    .replace(/\s+/g, ' ')
    .trim();
}

/** הגנה בסיסית מפני הזרקת HTML בטקסט שהילד מקליד */
export function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}
