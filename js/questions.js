// questions.js - מנוע השאלות לכיתה ב': כל סוג שאלה הוא גנרטור שמייצר מספרים חדשים בכל פעם.
// כל שאלה מחזירה: נוסח, תשובה נכונה, רמז, ופתרון מלא בשלבים.
// הנושאים והדוגמאות לקוחים מתכנית הלימודים במתמטיקה של משרד החינוך לכיתה ב'.

import { ri, pick, shuffle, weightedPick, fmt } from './util.js';
import { TOPICS, REGION_ORDER } from './topics.js';

export { TOPICS, REGION_ORDER };

/* ============================ עזרים ============================ */

let seq = 0;

/** בניית אובייקט שאלה אחיד */
function Q(o) {
  seq += 1;
  return {
    qid: `q${seq}`,
    ui: 'numeric',
    unit: '',
    instruction: 'פתרו את התרגיל:',
    expr: '',
    story: '',
    source: 'generated',
    ...o,
  };
}

/** אפשרות בחירה. ltr = סימן או תרגיל שחייבים להיות משמאל לימין */
const opt = (text, correct = false, ltr = false) => ({ text: String(text), correct, ltr });

/** אפשרויות בחירה מעורבבות: תשובה נכונה אחת + מסיחים ייחודיים */
function choiceOptions(correct, wrongs, ltr = false) {
  const seen = new Set([String(correct)]);
  const list = [opt(correct, true, ltr)];
  for (const w of wrongs) {
    const t = String(w);
    if (!seen.has(t)) { seen.add(t); list.push(opt(t, false, ltr)); }
  }
  return shuffle(list);
}

const PEOPLE = [
  { n: 'נועה', g: 'f' }, { n: 'איתי', g: 'm' }, { n: 'מאיה', g: 'f' }, { n: 'יונתן', g: 'm' },
  { n: 'תמר', g: 'f' }, { n: 'אורי', g: 'm' }, { n: 'שירה', g: 'f' }, { n: 'דניאל', g: 'm' },
  { n: 'רוני', g: 'f' }, { n: 'עומר', g: 'm' },
];

function twoPeople() {
  const [a, b] = shuffle(PEOPLE);
  return [a, b];
}

/** בחירת מילה לפי מין: g(p, 'קנה', 'קנתה') */
const g = (p, m, f) => (p.g === 'f' ? f : m);

const THINGS = [
  { name: 'קלפי פוקימון', one: 'קלף' },
  { name: 'מדבקות', one: 'מדבקה' },
  { name: 'גולות', one: 'גולה' },
  { name: 'סוכריות', one: 'סוכרייה' },
  { name: 'פוקדורים', one: 'פוקדור' },
];

/**
 * בידוד משמאל לימין בתוך משפט עברי (LRI ... PDI).
 * בלי זה הדפדפן "הופך" את הסימנים < ו-> כשהם בתוך טקסט מימין לשמאל.
 */
const ltrIsolate = (s) => `⁦${s}⁩`;

const digitsOf = (n) => ({ h: Math.floor(n / 100), t: Math.floor(n / 10) % 10, u: n % 10 });
const isEven = (n) => n % 2 === 0;

/* ============================ א. מספרים עד 1,000 ============================ */

/* --- קוביות: כמה יש כאן? --- */
function genPvRead(level = 0) {
  let h = 0, t, u;
  if (level === 0) {
    t = ri(1, 9); u = ri(0, 9);
  } else {
    h = ri(1, 9); t = ri(0, 9); u = ri(0, 9);
    if (level === 2 && Math.random() < 0.5) { if (Math.random() < 0.5) t = 0; else u = 0; }
  }
  const ans = h * 100 + t * 10 + u;
  const steps = [];
  if (h) steps.push(`${fmt(h)} לוחות של מאה = ${fmt(h * 100)}.`);
  steps.push(t ? `${fmt(t)} מוטות של עשר = ${fmt(t * 10)}.` : 'אין מוטות של עשר, ולכן ספרת העשרות היא 0.');
  steps.push(u ? `${fmt(u)} קוביות בודדות = ${fmt(u)}.` : 'אין קוביות בודדות, ולכן ספרת היחידות היא 0.');
  steps.push(`ביחד: ${fmt(ans)}.`);
  return Q({
    type: 'pv_read',
    topic: 'numbers',
    ui: 'place_value',
    blocks: { h, t, u },
    instruction: 'כמה קוביות יש כאן? כתבו את המספר:',
    answer: ans,
    hint: 'כל לוח גדול הוא 100, כל מוט הוא 10, וכל קובייה קטנה היא 1. סופרים קודם את הגדולים.',
    steps,
  });
}

/* --- ספרת העשרות / היחידות / המאות, וערך הספרה --- */
const PLACES = [
  { key: 'u', name: 'היחידות', value: 1 },
  { key: 't', name: 'העשרות', value: 10 },
  { key: 'h', name: 'המאות', value: 100 },
];

function genPvDigit(level = 0) {
  if (level === 2 && Math.random() < 0.5) {
    // מה הערך של הספרה? (ספרות שונות, כדי שלא יהיה ספק על איזו ספרה מדובר)
    const [a, b, c] = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    const n = a * 100 + b * 10 + c;
    const place = pick(PLACES);
    const d = digitsOf(n)[place.key];
    return Q({
      type: 'pv_digit',
      topic: 'numbers',
      instruction: `מה הערך של הספרה ${d} במספר ${fmt(n)}?`,
      expr: fmt(n),
      answer: d * place.value,
      hint: 'בודקים באיזה מקום הספרה נמצאת: מאות, עשרות או יחידות.',
      steps: [
        `${fmt(n)} = ${fmt(a * 100)} + ${fmt(b * 10)} + ${fmt(c)}.`,
        `הספרה ${d} נמצאת במקום של ${place.name}, ולכן הערך שלה הוא ${fmt(d * place.value)}.`,
      ],
    });
  }

  const n = level === 0 ? ri(10, 99) : ri(100, 999);
  const places = level === 0 ? PLACES.slice(0, 2) : PLACES;
  const place = pick(places);
  const d = digitsOf(n);
  const ans = d[place.key];
  const parts = level === 0
    ? `${fmt(n)} = ${fmt(d.t)} עשרות ו-${fmt(d.u)} יחידות.`
    : `${fmt(n)} = ${fmt(d.h)} מאות, ${fmt(d.t)} עשרות ו-${fmt(d.u)} יחידות.`;
  const steps = [parts, `ספרת ${place.name} היא ${fmt(ans)}.`];
  if (ans === 0) steps.push('האפס שומר את המקום: הוא אומר שאין כאן בודדים מהסוג הזה.');
  return Q({
    type: 'pv_digit',
    topic: 'numbers',
    instruction: `מה ספרת ${place.name} במספר?`,
    expr: fmt(n),
    answer: ans,
    hint: level === 0
      ? 'במספר דו-ספרתי: הספרה השמאלית היא העשרות והימנית היא היחידות.'
      : 'במספר תלת-ספרתי: הספרה השמאלית היא המאות, האמצעית היא העשרות והימנית היא היחידות.',
    steps,
  });
}

/* --- בניית מספר ממאות, עשרות ויחידות --- */
function genPvCompose(level = 0) {
  let h = 0, t, u;
  if (level === 0) { t = ri(1, 9); u = ri(0, 9); } else { h = ri(1, 9); t = ri(0, 9); u = ri(0, 9); }
  if (level === 2 && Math.random() < 0.6) t = 0; // המלכודת של שומר המקום: 3 מאות ו-5 יחידות
  const ans = h * 100 + t * 10 + u;
  const parts = [];
  if (h) parts.push(`${fmt(h)} מאות`);
  if (t || level < 2) parts.push(`${fmt(t)} עשרות`);
  if (u || parts.length < 2) parts.push(`${fmt(u)} יחידות`);
  const text = parts.length > 1 ? `${parts.slice(0, -1).join(', ')} ו-${parts[parts.length - 1]}` : parts[0];
  return Q({
    type: 'pv_compose',
    topic: 'numbers',
    instruction: 'איזה מספר זה?',
    expr: text,
    exprRtl: true,
    answer: ans,
    hint: 'כותבים את ספרת המאות, אחריה את ספרת העשרות ובסוף את ספרת היחידות. אם חסר משהו - כותבים 0 במקומו.',
    steps: [
      h ? `מאות: ${fmt(h)}, עשרות: ${fmt(t)}, יחידות: ${fmt(u)}.` : `עשרות: ${fmt(t)}, יחידות: ${fmt(u)}.`,
      `המספר הוא ${fmt(ans)}.`,
    ],
  });
}

/* --- השלמת סדרה (קפיצות על אבנים) --- */
function genSequence(level = 0) {
  let step;
  let start;
  const len = 6;
  if (level === 0) {
    step = pick([1, 2, 10, 10, 5]);
    start = ri(1, 100 - step * (len - 1));
  } else if (level === 1) {
    step = pick([10, 10, 5, -10, -1, 2]);
    const span = Math.abs(step) * (len - 1);
    start = step > 0 ? ri(1, 200 - span) : ri(span + 1, 200);
  } else {
    step = pick([100, 50, -100, 10, 10, -10]);
    const span = Math.abs(step) * (len - 1);
    start = step > 0 ? ri(1, 999 - span) : ri(span + 1, 999);
    if (Math.abs(step) === 10) {
      // חוצים מאה: 385, 395, 405...
      const base = ri(1, 8) * 100;
      start = step > 0 ? base + ri(6, 9) * 10 - 20 + ri(0, 9) : base + ri(1, 4) * 10 + 20 + ri(0, 9);
    }
  }
  const values = Array.from({ length: len }, (_, i) => start + step * i);
  const blanksCount = level === 0 ? 1 : 2;
  const blankIdx = shuffle([2, 3, 4, 5]).slice(0, blanksCount).sort((a, b) => a - b);
  const stones = values.map((v, i) => ({ value: v, blank: blankIdx.includes(i) }));
  const verb = step > 0 ? 'מוסיפים' : 'מורידים';
  return Q({
    type: 'sequence',
    topic: 'numbers',
    ui: 'numberline_fill',
    stones,
    instruction: 'השלימו את הסדרה:',
    answer: blankIdx.map((i) => values[i]),
    answerText: blankIdx.map((i) => fmt(values[i])).join(', '),
    hint: `בדקו כמה משתנה בין שני המספרים הראשונים: ${fmt(values[0])} ואחריו ${fmt(values[1])}.`,
    steps: [
      `בכל קפיצה ${verb} ${fmt(Math.abs(step))}.`,
      `הסדרה: ${values.map(fmt).join(', ')}.`,
    ],
  });
}

/* --- השכנים: הגדול ב-1, הקטן ב-10... --- */
function genNeighbors(level = 0) {
  const steps = level === 0 ? [1, 1, 10] : level === 1 ? [1, 10, 10] : [1, 10, 100];
  const d = pick(steps);
  const bigger = Math.random() < 0.55;
  const max = level === 0 ? 100 : level === 1 ? 500 : 1000;
  // לפעמים בכוונה ליד מעבר עשרת/מאה: 99 ועוד 1
  let n;
  if (Math.random() < 0.35) {
    const round = d === 100 ? 1000 : d === 10 ? 100 * ri(1, Math.floor(max / 100)) : 10 * ri(2, Math.floor(max / 10));
    n = bigger ? round - d : round;
  } else {
    n = ri(d + 1, max - d);
  }
  n = Math.max(d, Math.min(max - d, n));
  const ans = bigger ? n + d : n - d;
  const word = bigger ? 'הגדול' : 'הקטן';
  let text = `המספר ${word} ב-${fmt(d)} מ-${fmt(n)}`;
  if (d === 1 && level === 0 && Math.random() < 0.5) text = bigger ? `המספר העוקב ל-${fmt(n)}` : `המספר הקודם ל-${fmt(n)}`;
  return Q({
    type: 'neighbors',
    topic: 'numbers',
    instruction: 'איזה מספר זה?',
    expr: text,
    exprRtl: true,
    answer: ans,
    hint: d === 1
      ? (bigger ? 'המספר העוקב בא מיד אחרי המספר בספירה.' : 'המספר הקודם בא מיד לפני המספר בספירה.')
      : `${bigger ? 'מוסיפים' : 'מורידים'} ${fmt(d)}. שימו לב איזו ספרה משתנה.`,
    steps: [`${fmt(n)} ${bigger ? '+' : '-'} ${fmt(d)} = ${fmt(ans)}.`],
  });
}

/* --- שינוי ומחיקה של ספרה (375) --- */
function genDigitChange(level = 1) {
  const h = ri(1, 9);
  const t = ri(1, 7);
  const u = ri(1, 9);
  const n = h * 100 + t * 10 + u;
  const kind = pick(level >= 2 ? ['grow', 'result', 'delete'] : ['grow', 'result']);
  if (kind === 'delete') {
    const ans = h * 10 + u;
    return Q({
      type: 'digit_change',
      topic: 'numbers',
      ui: 'mission',
      instruction: 'חידת ספרות:',
      story: `במספר [[${fmt(n)}]] מחקו את ספרת העשרות. איזה מספר התקבל?`,
      answer: ans,
      hint: `ספרת העשרות של ${fmt(n)} היא ${t}. מה נשאר כשמוחקים אותה?`,
      steps: [`ספרת העשרות היא ${t}.`, `בלי ה-${t} נשארות הספרות ${h} ו-${u}, כלומר ${fmt(ans)}.`],
    });
  }
  const nt = ri(t + 1, 9);
  const m = h * 100 + nt * 10 + u;
  if (kind === 'result') {
    return Q({
      type: 'digit_change',
      topic: 'numbers',
      ui: 'mission',
      instruction: 'חידת ספרות:',
      story: `במספר [[${fmt(n)}]] שינו את ספרת העשרות ל-[[${nt}]]. איזה מספר התקבל?`,
      answer: m,
      hint: 'רק ספרת העשרות מתחלפת. המאות והיחידות נשארות במקום.',
      steps: [`ספרת העשרות ${t} הופכת ל-${nt}.`, `המספר החדש: ${fmt(m)}.`],
    });
  }
  return Q({
    type: 'digit_change',
    topic: 'numbers',
    ui: 'mission',
    instruction: 'חידת ספרות:',
    story: `במספר [[${fmt(n)}]] שינו את ספרת העשרות ל-[[${nt}]]. בכמה גדל המספר?`,
    answer: m - n,
    hint: `ספרת העשרות גדלה מ-${t} ל-${nt}. כל עשרת שווה 10.`,
    steps: [
      `המספר החדש הוא ${fmt(m)}.`,
      `ספרת העשרות גדלה ב-${nt - t}, כלומר ב-${nt - t} עשרות.`,
      `${fmt(m)} - ${fmt(n)} = ${fmt(m - n)}.`,
    ],
  });
}

/* --- מי הכי גדול / הכי קטן --- */
function genOrderPick(level = 0) {
  let nums;
  if (level === 0) {
    const a = ri(1, 9); let b = ri(1, 9); if (b === a) b = (a % 9) + 1;
    nums = [a * 10 + b, b * 10 + a, ri(10, 99), ri(10, 99)];
  } else if (level === 1) {
    const [a, b, c] = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]).slice(0, 3);
    nums = [a * 100 + b * 10 + c, a * 100 + c * 10 + b, b * 100 + a * 10 + c, c * 10 + a];
  } else {
    // מלכודות של אפס: 407, 470, 47, 704
    const [a, c] = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]).slice(0, 2);
    nums = [a * 100 + c, a * 100 + c * 10, a * 10 + c, c * 100 + a];
  }
  nums = [...new Set(nums)].slice(0, 4);
  const biggest = Math.random() < 0.6;
  const target = biggest ? Math.max(...nums) : Math.min(...nums);
  return Q({
    type: 'order_pick',
    topic: 'numbers',
    ui: 'choice',
    instruction: biggest ? 'איזה מספר הכי גדול?' : 'איזה מספר הכי קטן?',
    options: choiceOptions(fmt(target), nums.filter((x) => x !== target).map(fmt), true),
    answer: fmt(target),
    hint: 'קודם בודקים כמה ספרות יש בכל מספר. אם יש אותו מספר ספרות - משווים את הספרה השמאלית, אחר כך את הבאה.',
    steps: [
      `מסדרים מהקטן לגדול: ${[...nums].sort((a, b) => a - b).map(fmt).join(', ')}.`,
      `${biggest ? 'הכי גדול' : 'הכי קטן'}: ${fmt(target)}.`,
    ],
  });
}

/* --- מספר שנמצא בין --- */
function genBetween(level = 0) {
  const max = level === 0 ? 100 : 1000;
  const gap = level === 0 ? ri(4, 12) : ri(5, 40);
  const lo = ri(1, max - gap - 2);
  const hi = lo + gap;
  const inside = ri(lo + 1, hi - 1);
  // בלי הגבולות עצמם - כדי שלא יהיה ויכוח אם 90 נמצא "בין 90 ל-101"
  const wrongs = shuffle([lo - ri(1, 5), hi + ri(1, 5), hi + ri(6, 15), lo - ri(6, 15)]).filter((x) => x > 0);
  return Q({
    type: 'between',
    topic: 'numbers',
    ui: 'choice',
    instruction: `איזה מספר נמצא בין ${fmt(lo)} ל-${fmt(hi)}?`,
    options: choiceOptions(fmt(inside), wrongs.slice(0, 3).map(fmt), true),
    answer: fmt(inside),
    hint: `צריך מספר שגדול מ-${fmt(lo)} וגם קטן מ-${fmt(hi)}.`,
    steps: [
      `${fmt(inside)} גדול מ-${fmt(lo)}.`,
      `${fmt(inside)} קטן מ-${fmt(hi)}, ולכן הוא נמצא ביניהם.`,
    ],
  });
}

/* ============================ א. זוגי ואי-זוגי ============================ */

const EVEN_WORD = (n) => (isEven(n) ? 'זוגי' : 'אי-זוגי');

function genEoWhich(level = 0) {
  const n = level === 0 ? ri(2, 20) : level === 1 ? ri(21, 99) : ri(100, 999);
  const even = isEven(n);
  const u = n % 10;
  return Q({
    type: 'eo_which',
    topic: 'even_odd',
    ui: 'choice',
    noShuffle: true,
    figure: level === 0 ? { kind: 'pairs', n } : null,
    instruction: level === 0 ? `האם ${n} זוגי או אי-זוגי? (אפשר לספור זוגות)` : `האם ${fmt(n)} זוגי או אי-זוגי?`,
    options: [opt('זוגי', even), opt('אי-זוגי', !even)],
    answer: EVEN_WORD(n),
    hint: 'מספר זוגי אפשר לסדר בזוגות בלי שיישאר אחד לבד. אפשר גם להסתכל רק על ספרת היחידות: 0, 2, 4, 6, 8 - זוגי.',
    steps: level === 0
      ? [`מסדרים ${n} בזוגות: ${even ? 'כולם מסתדרים בזוגות' : 'נשאר אחד לבד'}.`, `לכן ${n} הוא ${EVEN_WORD(n)}.`]
      : [`ספרת היחידות של ${fmt(n)} היא ${u}.`, `${u} ${isEven(u) ? 'זוגית' : 'אי-זוגית'}, ולכן ${fmt(n)} הוא ${EVEN_WORD(n)}.`],
  });
}

function genEoPick(level = 0) {
  const max = level === 0 ? 30 : level === 1 ? 99 : 999;
  const wantEven = Math.random() < 0.5;
  const make = (even) => { let x = ri(2, max); if (isEven(x) !== even) x += x < max ? 1 : -1; return x; };
  const correct = make(wantEven);
  const wrongs = [];
  while (wrongs.length < 3) {
    const w = make(!wantEven);
    if (!wrongs.includes(w)) wrongs.push(w);
  }
  return Q({
    type: 'eo_pick',
    topic: 'even_odd',
    ui: 'choice',
    instruction: wantEven ? 'איזה מהמספרים זוגי?' : 'איזה מהמספרים אי-זוגי?',
    options: choiceOptions(fmt(correct), wrongs.map(fmt), true),
    answer: fmt(correct),
    hint: 'מסתכלים על ספרת היחידות של כל מספר. זוגי נגמר ב-0, 2, 4, 6 או 8.',
    steps: [
      `ספרת היחידות של ${fmt(correct)} היא ${correct % 10}.`,
      `לכן ${fmt(correct)} הוא ${EVEN_WORD(correct)}, וכל השאר ${wantEven ? 'אי-זוגיים' : 'זוגיים'}.`,
    ],
  });
}

/** כל הסידורים של הספרות (בלי 0 בהתחלה) */
function perms(ds) {
  if (ds.length === 1) return [ds];
  const out = [];
  ds.forEach((d, i) => {
    for (const rest of perms([...ds.slice(0, i), ...ds.slice(i + 1)])) out.push([d, ...rest]);
  });
  return out;
}

function genEoBuild(level = 0) {
  const odds = shuffle([1, 3, 5, 7, 9]);
  const evenDigit = pick(level === 0 ? [2, 4, 6, 8] : [0, 2, 4, 6, 8]);
  const digits = level === 0 ? [odds[0], evenDigit] : [odds[0], odds[1], evenDigit];
  const all = [...new Set(perms(digits).filter((p) => p[0] !== 0).map((p) => Number(p.join(''))))];
  const evens = shuffle(all.filter(isEven));
  const oddsN = shuffle(all.filter((x) => !isEven(x)));
  const correct = evens[0];
  const list = digits.map(String).join(', ');
  return Q({
    type: 'eo_build',
    topic: 'even_odd',
    ui: 'choice',
    instruction: `איזה מספר זוגי אפשר לבנות מהספרות ${list}? (כל ספרה פעם אחת)`,
    options: choiceOptions(fmt(correct), oddsN.slice(0, 3).map(fmt), true),
    answer: fmt(correct),
    hint: `מספר זוגי נגמר בספרה זוגית. איזו ספרה זוגית יש כאן?`,
    steps: [
      `הספרה הזוגית היא ${evenDigit}, ולכן היא צריכה להיות בסוף (במקום היחידות).`,
      `${fmt(correct)} נגמר ב-${evenDigit}, ולכן הוא זוגי.`,
    ],
  });
}

function genEoNext(level = 0) {
  const wantEven = Math.random() < 0.5;
  const after = Math.random() < 0.6;
  const n = level === 0 ? ri(3, 40) : ri(41, level === 1 ? 199 : 999);
  let ans = after ? n + 1 : n - 1;
  if (isEven(ans) !== wantEven) ans = after ? ans + 1 : ans - 1;
  const kind = wantEven ? 'הזוגי' : 'האי-זוגי';
  return Q({
    type: 'eo_next',
    topic: 'even_odd',
    instruction: 'איזה מספר זה?',
    expr: `המספר ${kind} ש${after ? 'בא אחרי' : 'בא לפני'} ${fmt(n)}`,
    exprRtl: true,
    answer: ans,
    hint: `סופרים ${after ? 'קדימה' : 'אחורה'} מ-${fmt(n)} ועוצרים במספר ה${wantEven ? 'זוגי' : 'אי-זוגי'} הראשון.`,
    steps: [
      `סופרים ${after ? 'קדימה' : 'אחורה'}: ${after ? `${fmt(n + 1)}, ${fmt(n + 2)}` : `${fmt(n - 1)}, ${fmt(n - 2)}`}...`,
      `המספר ${kind} הראשון הוא ${fmt(ans)}.`,
    ],
  });
}

function genConsecSum(level = 1) {
  const k = level === 0 ? ri(3, 12) : ri(8, 49);
  const sum = 2 * k + 1;
  return Q({
    type: 'consec_sum',
    topic: 'even_odd',
    ui: 'mission',
    instruction: 'חידת מספרים עוקבים:',
    story: `שני מספרים עוקבים (אחד בא מיד אחרי השני) ביחד הם [[${fmt(sum)}]]. מה המספר הקטן מביניהם?`,
    answer: k,
    hint: 'שני מספרים עוקבים קרובים מאוד זה לזה. נסו מספר שקרוב לחצי של הסכום, ובדקו.',
    steps: [`${fmt(k)} ו-${fmt(k + 1)} הם מספרים עוקבים.`, `${fmt(k)} + ${fmt(k + 1)} = ${fmt(sum)} ✔`],
  });
}

function genEoRule(level = 1) {
  const kind = pick(['ee', 'oo', 'eo']);
  const mk = (even) => { const x = ri(11, 89); return isEven(x) === even ? x : x + 1; };
  const a = mk(kind !== 'oo');
  const b = mk(kind === 'ee');
  const even = isEven(a + b);
  const why = kind === 'ee' ? 'זוגי ועוד זוגי - כל הזוגות נשארים זוגות.'
    : kind === 'oo' ? 'לכל אחד מהם נשאר אחד לבד, ושני הבודדים יוצרים ביחד עוד זוג.'
      : 'לאחד מהם נשאר אחד לבד, ואין לו בן זוג.';
  return Q({
    type: 'eo_rule',
    topic: 'even_odd',
    ui: 'choice',
    noShuffle: true,
    instruction: 'בלי לחשב: האם התוצאה זוגית או אי-זוגית?',
    expr: `${a} + ${b}`,
    options: [opt('זוגי', even), opt('אי-זוגי', !even)],
    answer: EVEN_WORD(a + b),
    hint: 'בודקים אם כל אחד מהמספרים זוגי או אי-זוגי. מה קורה לזוגות כשמחברים?',
    steps: [
      `${a} הוא ${EVEN_WORD(a)}, ו-${b} הוא ${EVEN_WORD(b)}.`,
      why,
      `ובאמת: ${a} + ${b} = ${a + b}, מספר ${EVEN_WORD(a + b)}.`,
    ],
  });
}

/* ============================ ב1. חיבור וחיסור במאוזן ============================ */

function genFacts20() {
  if (Math.random() < 0.55) {
    const a = ri(2, 9);
    const b = ri(2, 9);
    const ans = a + b;
    const big = Math.max(a, b);
    const small = Math.min(a, b);
    const toTen = 10 - big;
    return Q({
      type: 'facts20',
      topic: 'add_sub',
      expr: `${a} + ${b} = ?`,
      answer: ans,
      hint: ans > 10 ? `משלימים קודם ל-10: ${big} + ${toTen} = 10, ואז מוסיפים את מה שנשאר.` : `מתחילים מ-${big} וסופרים עוד ${small}.`,
      steps: ans > 10
        ? [`מפרקים את ${small} ל-${toTen} ו-${small - toTen}.`, `${big} + ${toTen} = 10.`, `10 + ${small - toTen} = ${ans}.`]
        : [`מתחילים מ-${big} וסופרים עוד ${small}.`, `${a} + ${b} = ${ans}.`],
    });
  }
  const c = ri(6, 20);
  const b = ri(2, Math.min(9, c - 1));
  const ans = c - b;
  const cross = c > 10 && b > c - 10;
  return Q({
    type: 'facts20',
    topic: 'add_sub',
    expr: `${c} - ${b} = ?`,
    answer: ans,
    hint: `אפשר לחשוב על חיבור: כמה צריך להוסיף ל-${b} כדי להגיע ל-${c}?`,
    steps: cross
      ? [`מפרקים את ${b} ל-${c - 10} ו-${b - (c - 10)}.`, `${c} - ${c - 10} = 10.`, `10 - ${b - (c - 10)} = ${ans}.`]
      : [`${c} - ${b} = ${ans}.`, `בדיקה: ${ans} + ${b} = ${c}.`],
  });
}

/* --- דו-ספרתי וחד-ספרתי: 23+4, 45+9, 30-7, 72-6 --- */
function genAdd2d1d(level = 0) {
  const regroup = level === 0 ? false : level === 1 ? Math.random() < 0.5 : Math.random() < 0.75;
  if (Math.random() < 0.5) {
    let a, b;
    if (!regroup) { a = ri(1, 8) * 10 + ri(0, 8); b = ri(1, 9 - (a % 10)); } else {
      const u = ri(1, 9); b = ri(Math.max(2, 10 - u), 9); a = ri(1, 8) * 10 + u;
    }
    const ans = a + b;
    const tens = a - (a % 10);
    const u = a % 10;
    const need = 10 - u;
    let steps;
    if (!regroup) {
      steps = [`${a} = ${tens} + ${u}.`, `${u} + ${b} = ${u + b}.`, `${tens} + ${u + b} = ${ans}.`];
    } else if (b === need) {
      steps = [`${u} + ${b} = 10, כלומר עוד עשרת שלמה.`, `${a} + ${b} = ${ans}.`];
    } else {
      steps = [`משלימים לעשרת הבאה: ${a} + ${need} = ${a + need}.`, `מתוך ${b} נשארו עוד ${b - need}.`, `${a + need} + ${b - need} = ${ans}.`];
    }
    return Q({
      type: 'add_2d1d', topic: 'add_sub', expr: `${a} + ${b} = ?`, answer: ans,
      hint: regroup ? `משלימים קודם לעשרת הבאה (${a + need}), ואז מוסיפים את מה שנשאר.` : 'מחברים את היחידות ליחידות. העשרות נשארות.',
      steps,
    });
  }
  let a, b;
  if (!regroup) { a = ri(1, 9) * 10 + ri(1, 9); b = ri(1, a % 10); } else {
    const u = ri(0, 8); a = ri(2, 9) * 10 + u; b = ri(u + 1, 9);
  }
  const ans = a - b;
  const u = a % 10;
  const tens = a - u;
  let steps;
  if (!regroup) {
    steps = [`${a} = ${tens} + ${u}.`, `${u} - ${b} = ${u - b}.`, `${tens} + ${u - b} = ${ans}.`];
  } else if (u === 0) {
    steps = [`${a} - 10 = ${a - 10}.`, `הורדנו ${10 - b} יותר מדי, ולכן מחזירים: ${a - 10} + ${10 - b} = ${ans}.`];
  } else {
    steps = [`קודם יורדים לעשרת השלמה: ${a} - ${u} = ${tens}.`, `מתוך ${b} נשארו עוד ${b - u} להוריד.`, `${tens} - ${b - u} = ${ans}.`];
  }
  let hint = 'מורידים את היחידות מהיחידות. העשרות נשארות.';
  if (regroup) {
    hint = u === 0
      ? `אפשר להוריד 10 ואז להחזיר את מה שהורדנו יותר מדי.`
      : `קודם מורידים ${u} כדי להגיע ל-${tens}, ואז את השאר.`;
  }
  return Q({
    type: 'add_2d1d', topic: 'add_sub', expr: `${a} - ${b} = ?`, answer: ans, hint, steps,
  });
}

/* --- שני מספרים דו-ספרתיים: 17+12, 26+34, 70-18, 85-19 --- */
function genAdd2d2d(level = 1) {
  const regroup = level === 0 ? false : level === 1 ? Math.random() < 0.45 : Math.random() < 0.75;
  if (Math.random() < 0.5) {
    let ta, tb, ua, ub;
    if (!regroup) {
      ta = ri(1, 7); tb = ri(1, 8 - ta); ua = ri(0, 8); ub = ri(0, 9 - ua);
    } else {
      ta = ri(1, 6); tb = ri(1, 7 - ta); ua = ri(1, 9); ub = ri(10 - ua, 9);
    }
    const a = ta * 10 + ua;
    const b = tb * 10 + ub;
    const ans = a + b;
    const steps = [`מוסיפים את העשרות: ${a} + ${tb * 10} = ${a + tb * 10}.`];
    if (ub) steps.push(`מוסיפים את היחידות: ${a + tb * 10} + ${ub} = ${ans}.`);
    return Q({
      type: 'add_2d2d', topic: 'add_sub', expr: `${a} + ${b} = ?`, answer: ans,
      hint: `מפרקים את ${b} לעשרות ויחידות: ${tb * 10} ו-${ub}. קודם מוסיפים את העשרות, אחר כך את היחידות.`,
      steps,
    });
  }
  let ta, tb, ua, ub;
  if (!regroup) {
    ta = ri(2, 9); tb = ri(1, ta - 1); ua = ri(1, 9); ub = ri(0, ua);
  } else {
    ta = ri(3, 9); tb = ri(1, ta - 2); ua = ri(0, 8); ub = ri(ua + 1, 9);
  }
  const a = ta * 10 + ua;
  const b = tb * 10 + ub;
  const ans = a - b;
  const steps = [`מורידים את העשרות: ${a} - ${tb * 10} = ${a - tb * 10}.`];
  if (ub) steps.push(`מורידים את היחידות: ${a - tb * 10} - ${ub} = ${ans}.`);
  return Q({
    type: 'add_2d2d', topic: 'add_sub', expr: `${a} - ${b} = ?`, answer: ans,
    hint: `מפרקים את ${b} לעשרות ויחידות: ${tb * 10} ו-${ub}. קודם מורידים את העשרות, אחר כך את היחידות.`,
    steps,
  });
}

/* --- עשרות שלמות ומאות שלמות --- */
function genTens(level = 0) {
  const unit = level === 2 && Math.random() < 0.6 ? 100 : 10;
  const word = unit === 100 ? 'מאות' : 'עשרות';
  let a = ri(1, 9) * unit;
  let b = ri(1, 9) * unit;
  let add = Math.random() < 0.5;
  if (add && a + b > unit * 10) add = false;
  if (!add && b > a) [a, b] = [b, a];
  const ans = add ? a + b : a - b;
  const op = add ? '+' : '-';
  return Q({
    type: 'tens', topic: 'add_sub', expr: `${fmt(a)} ${op} ${fmt(b)} = ?`, answer: ans,
    hint: `חושבים על ${word}: ${a / unit} ${word} ${add ? 'ועוד' : 'פחות'} ${b / unit} ${word}.`,
    steps: [
      `${a / unit} ${word} ${add ? 'ועוד' : 'פחות'} ${b / unit} ${word} = ${ans / unit} ${word}.`,
      `${fmt(a)} ${op} ${fmt(b)} = ${fmt(ans)}.`,
    ],
  });
}

/* --- חיבור וחיסור בעל פה של תלת-ספרתיים: 240+300, 240+35 --- */
function genMental3(level = 2) {
  const h = ri(1, 7);
  const t = ri(1, 5);
  const base = h * 100 + t * 10;
  const kind = pick(level >= 2 ? ['h', 't', 'tu', 'subH', 'subT'] : ['h', 't', 'subH']);
  let other, ans, op = '+', why;
  if (kind === 'h') { other = ri(1, 9 - h) * 100; ans = base + other; why = 'מוסיפים מאות למאות.'; }
  else if (kind === 't') { other = ri(1, 9 - t) * 10; ans = base + other; why = 'מוסיפים עשרות לעשרות.'; }
  else if (kind === 'tu') { other = ri(1, 9 - t) * 10 + ri(1, 9); ans = base + other; why = 'מוסיפים עשרות לעשרות ויחידות ליחידות.'; }
  else if (kind === 'subH') { other = ri(1, h) * 100; ans = base - other; op = '-'; why = 'מורידים מאות מהמאות.'; }
  else { other = ri(1, t) * 10; ans = base - other; op = '-'; why = 'מורידים עשרות מהעשרות.'; }
  return Q({
    type: 'mental3', topic: 'add_sub', expr: `${fmt(base)} ${op} ${fmt(other)} = ?`, answer: ans,
    hint: 'חושבים לפי ערך המקום: מאות עם מאות, עשרות עם עשרות, יחידות עם יחידות.',
    steps: [why, `${fmt(base)} ${op} ${fmt(other)} = ${fmt(ans)}.`],
  });
}

/* ============================ ב1. המספר החסר ============================ */

function genMissAdd(level = 0) {
  const max = level === 0 ? 20 : 100;
  const forms = level === 0 ? ['xb', 'ax', 'ax-'] : ['xb', 'ax', 'ax-', 'x-b', 'c=xb'];
  const form = pick(forms);
  let expr, x, check, hint;
  if (form === 'xb' || form === 'ax' || form === 'c=xb') {
    const c = ri(level === 0 ? 5 : 20, max);
    const b = ri(1, c - 1);
    x = c - b;
    if (form === 'xb') expr = `? + ${b} = ${c}`;
    else if (form === 'ax') expr = `${b} + ? = ${c}`;
    else expr = `${c} = ? + ${b}`;
    check = `${x} + ${b} = ${c}`;
    hint = `איזה מספר ועוד ${b} נותן ${c}? אפשר לנסות מספר ולבדוק, או לחשב ${c} - ${b}.`;
  } else if (form === 'ax-') {
    const a = ri(level === 0 ? 5 : 20, max);
    x = ri(1, a - 1);
    const d = a - x;
    expr = `${a} - ? = ${d}`;
    check = `${a} - ${x} = ${d}`;
    hint = `כמה צריך להוריד מ-${a} כדי להגיע ל-${d}? אפשר לספור מ-${d} עד ${a}.`;
  } else {
    const b = ri(2, 9);
    x = ri(b + 5, max);
    const d = x - b;
    expr = `? - ${b} = ${d}`;
    check = `${x} - ${b} = ${d}`;
    hint = `הורידו ${b} ונשאר ${d}. כדי למצוא מה היה בהתחלה - מחזירים את מה שהורידו.`;
  }
  return Q({
    type: 'miss_add',
    topic: 'missing',
    instruction: 'איזה מספר חסר?',
    expr,
    answer: x,
    hint,
    steps: [`המספר החסר הוא ${x}.`, `בדיקה: ${check} ✔`],
  });
}

function genInverse(level = 0) {
  const max = level === 0 ? 20 : 100;
  const a = ri(2, Math.floor(max / 2));
  const b = ri(2, max - a);
  const c = a + b;
  const kind = pick(['c-b', 'c-a', 'b+a']);
  let expr, ans;
  if (kind === 'c-b') { expr = `${c} - ${b} = ?`; ans = a; }
  else if (kind === 'c-a') { expr = `${c} - ${a} = ?`; ans = b; }
  else { expr = `${b} + ${a} = ?`; ans = c; }
  return Q({
    type: 'inverse',
    topic: 'missing',
    instruction: 'בעזרת התרגיל הפתור - בלי לחשב מחדש:',
    given: `${a} + ${b} = ${c}`,
    expr,
    answer: ans,
    hint: kind === 'b+a'
      ? 'בחיבור אפשר להחליף את הסדר - התוצאה לא משתנה.'
      : 'חיבור וחיסור הם פעולות הפוכות: מה שמוסיפים, אפשר גם להוריד בחזרה.',
    steps: kind === 'b+a'
      ? [`${a} + ${b} = ${c}, והחלפת הסדר לא משנה את התוצאה.`, `${b} + ${a} = ${c}.`]
      : [`${a} + ${b} = ${c}.`, `לכן ${expr.replace('?', String(ans))}.`],
  });
}

function genZero(level = 0) {
  const n = level === 0 ? ri(2, 50) : ri(51, 999);
  const form = pick(['n+0', '0+n', 'n-0', 'n-n']);
  const expr = { 'n+0': `${fmt(n)} + 0 = ?`, '0+n': `0 + ${fmt(n)} = ?`, 'n-0': `${fmt(n)} - 0 = ?`, 'n-n': `${fmt(n)} - ${fmt(n)} = ?` }[form];
  const ans = form === 'n-n' ? 0 : n;
  return Q({
    type: 'zero',
    topic: 'missing',
    expr,
    answer: ans,
    hint: form === 'n-n' ? 'מורידים את כל מה שיש. מה נשאר?' : 'כשמוסיפים או מורידים 0 - לא משתנה כלום.',
    steps: [form === 'n-n' ? 'מספר פחות עצמו שווה 0.' : 'הוספה או הורדה של 0 לא משנה את המספר.', expr.replace('?', fmt(ans))],
  });
}

function genCancel(level = 1) {
  const a = ri(5, level === 0 ? 20 : 99);
  const b = ri(2, level === 0 ? 9 : 30);
  const addFirst = Math.random() < 0.5 || b > a;
  const expr = addFirst ? `${a} + ${b} - ${b} = ?` : `${a} - ${b} + ${b} = ?`;
  return Q({
    type: 'cancel',
    topic: 'missing',
    instruction: 'פתרו בדרך הקצרה:',
    expr,
    answer: a,
    hint: `${addFirst ? 'מוסיפים' : 'מורידים'} ${b} ואז ${addFirst ? 'מורידים' : 'מוסיפים'} אותו בחזרה. לאן חוזרים?`,
    steps: [
      `${addFirst ? `+ ${b} ואחריו - ${b}` : `- ${b} ואחריו + ${b}`} מבטלים זה את זה.`,
      `לכן התוצאה היא המספר שהתחלנו ממנו: ${a}.`,
    ],
  });
}

/* ============================ ב1. אומדן והשוואה ============================ */

const REL3 = (v, target) => (v > target ? 'גדול' : v < target ? 'קטן' : 'שווה');

function genEstimate(level = 0) {
  const target = 100;
  let expr, val;
  if (level === 0) {
    const a = ri(2, 8) * 10; const b = ri(2, 8) * 10;
    expr = `${a} + ${b}`; val = a + b;
  } else if (level === 1) {
    const a = ri(25, 75); const b = ri(25, 75);
    expr = `${a} + ${b}`; val = a + b;
  } else if (Math.random() < 0.5) {
    const a = ri(110, 190); const b = ri(15, 95);
    expr = `${a} - ${b}`; val = a - b;
  } else {
    const a = ri(20, 45); const b = ri(20, 45); const c = ri(10, 40);
    expr = `${a} + ${b} + ${c}`; val = a + b + c;
  }
  const rel = REL3(val, target);
  return Q({
    type: 'estimate',
    topic: 'insight',
    ui: 'choice',
    noShuffle: true,
    instruction: `האם התוצאה גדולה מ-100, קטנה מ-100 או שווה ל-100?`,
    expr,
    options: [opt('גדול מ-100', rel === 'גדול'), opt('שווה ל-100', rel === 'שווה'), opt('קטן מ-100', rel === 'קטן')],
    answer: rel === 'שווה' ? 'שווה ל-100' : `${rel} מ-100`,
    hint: 'אפשר לעגל לעשרות ולהעריך. למשל: 50 ועוד 50 הם בדיוק 100.',
    steps: [`${expr} = ${fmt(val)}.`, rel === 'שווה' ? 'התוצאה שווה בדיוק ל-100.' : `${fmt(val)} ${rel} מ-100.`],
  });
}

function genCompareExprs(level = 0) {
  const kinds = level === 0 ? ['addSame'] : level === 1 ? ['addSame', 'subSame', 'swap'] : ['addSame', 'subSame', 'near', 'swap'];
  const kind = pick(kinds);
  let e1, e2, v1, v2, why;
  if (kind === 'addSame') {
    const n = level === 0 ? ri(3, 12) : ri(20, 80);
    const x = ri(1, level === 0 ? 8 : 15); let y = ri(1, level === 0 ? 8 : 15); if (y === x) y = x + 2;
    e1 = `${n} + ${x}`; e2 = `${n} + ${y}`; v1 = n + x; v2 = n + y;
    why = `בשני התרגילים מתחילים מ-${n}. מי שמוסיף יותר - מקבל יותר.`;
  } else if (kind === 'subSame') {
    const n = ri(40, 120);
    const x = ri(5, 20); let y = ri(5, 20); if (y === x) y = x + 2;
    e1 = `${n} - ${x}`; e2 = `${n} - ${y}`; v1 = n - x; v2 = n - y;
    why = `בשני התרגילים מתחילים מ-${n}. מי שמוריד פחות - נשאר לו יותר.`;
  } else if (kind === 'near') {
    const a = ri(1, 7) * 10 + ri(6, 9); const b = ri(1, 7) * 10 + ri(6, 9);
    const ra = Math.ceil(a / 10) * 10; const rb = Math.ceil(b / 10) * 10;
    [e1, e2, v1, v2] = Math.random() < 0.5 ? [`${a} + ${b}`, `${ra} + ${rb}`, a + b, ra + rb] : [`${ra} + ${rb}`, `${a} + ${b}`, ra + rb, a + b];
    why = `${ra} גדול מ-${a}, ו-${rb} גדול מ-${b}, ולכן ${ra} + ${rb} גדול יותר.`;
  } else {
    const a = ri(12, 35); const b = ri(36, 60);
    [e1, e2] = shuffle([`${a} + ${b}`, `${b} + ${a}`]); v1 = v2 = a + b;
    why = 'אותם מספרים בסדר אחר - בחיבור התוצאה לא משתנה.';
  }
  const best = v1 > v2 ? 0 : v2 > v1 ? 1 : 2;
  return Q({
    type: 'compare_exprs',
    topic: 'insight',
    ui: 'choice',
    noShuffle: true,
    instruction: 'בלי לפתור: באיזה תרגיל התוצאה גדולה יותר?',
    options: [opt(e1, best === 0, true), opt(e2, best === 1, true), opt('התוצאות שוות', best === 2)],
    answer: best === 2 ? 'התוצאות שוות' : best === 0 ? e1 : e2,
    hint: 'מחפשים מה דומה בשני התרגילים ומה שונה. מה שונה - משנה את התוצאה.',
    steps: [why, `(בדיקה: ${e1} = ${v1}, ${e2} = ${v2}.)`],
  });
}

function genCompareSign(level = 0) {
  let left, right, lv, rv;
  if (level === 0) {
    const a = ri(1, 9); const b = ri(0, 9);
    lv = a * 10 + b;
    rv = Math.random() < 0.5 && b > 0 ? b * 10 + a : Math.random() < 0.2 ? lv : ri(10, 99);
    left = String(lv); right = String(rv);
  } else if (level === 1) {
    const n = ri(20, 80); const x = ri(2, 15);
    lv = n + x; left = `${n} + ${x}`;
    rv = pick([lv, Math.ceil(lv / 10) * 10, lv - ri(1, 5), lv + ri(1, 5)]);
    right = String(rv);
  } else {
    const a = ri(20, 60); const b = ri(5, 20);
    lv = a + b; left = `${a} + ${b}`;
    if (Math.random() < 0.3) {
      right = `${b} + ${a}`; rv = lv;
    } else {
      rv = lv + pick([-3, -2, -1, 0, 1, 2, 3]);
      const d = ri(5, 20);
      right = `${rv + d} - ${d}`;
    }
  }
  if (Math.random() < 0.5) { [left, right, lv, rv] = [right, left, rv, lv]; }
  const sign = lv < rv ? '<' : lv > rv ? '>' : '=';
  const words = sign === '<' ? 'קטן מ' : sign === '>' ? 'גדול מ' : 'שווה ל';
  return Q({
    type: 'compare_sign',
    topic: 'insight',
    ui: 'choice',
    noShuffle: true,
    instruction: 'איזה סימן מתאים במקום הריבוע?',
    expr: `${left} ▢ ${right}`,
    options: [opt('<', sign === '<', true), opt('=', sign === '=', true), opt('>', sign === '>', true)],
    answer: sign,
    hint: 'הפה של הסימנים < ו-> תמיד פתוח לכיוון המספר הגדול יותר.',
    steps: [
      `בצד השמאלי: ${fmt(lv)}. בצד הימני: ${fmt(rv)}.`,
      `${fmt(lv)} ${words}-${fmt(rv)}, ולכן: ${ltrIsolate(`${left} ${sign} ${right}`)}`,
    ],
  });
}

function genOrder3(level = 2) {
  const base = ri(2, 9) * 100 + ri(0, 9);
  const [a, b, c] = shuffle([ri(11, 39), ri(40, 69), ri(70, 99)]);
  const exprs = [`${fmt(base)} + ${a}`, `${b} + ${fmt(base)}`, `${fmt(base)} + ${c}`];
  const vals = [base + a, base + b, base + c];
  const biggest = Math.random() < 0.5;
  const idx = vals.indexOf(biggest ? Math.max(...vals) : Math.min(...vals));
  return Q({
    type: 'order3',
    topic: 'insight',
    ui: 'choice',
    instruction: `בלי לפתור: באיזה תרגיל התוצאה ${biggest ? 'הכי גדולה' : 'הכי קטנה'}?`,
    options: shuffle(exprs.map((e, i) => opt(e, i === idx, true))),
    answer: exprs[idx],
    hint: `בכל התרגילים מוסיפים ל-${fmt(base)}. משווים רק את המספר השני.`,
    steps: [`המספרים שמוסיפים: ${[a, b, c].join(', ')}.`, `${biggest ? 'הכי גדול' : 'הכי קטן'} מביניהם נמצא בתרגיל ${exprs[idx]}.`],
  });
}

/* ============================ ב3. שאלות חיבור וחיסור, כסף ועודף ============================ */

function genWordCompare(level = 0) {
  const max = level === 0 ? 20 : 90;
  const [p1, p2] = twoPeople();
  const th = pick(THINGS);
  const kind = pick(level === 0 ? ['more', 'less', 'diff'] : level === 1 ? ['more', 'less', 'diff'] : ['diff', 'more', 'reverse']);
  const a = ri(5, max - 10);
  const d = ri(2, level === 0 ? 8 : 25);
  if (kind === 'more' || kind === 'less') {
    const more = kind === 'more';
    const b = more ? a + d : Math.max(1, a - d);
    const dd = more ? d : a - b;
    return Q({
      type: 'word_compare', topic: 'word_add', ui: 'mission', instruction: 'משימה:', unit: th.name,
      story: `ל${p1.n} יש [[${a}]] ${th.name}. ל${p2.n} יש [[${dd}]] ${th.name} ${more ? 'יותר' : 'פחות'}. כמה ${th.name} יש ל${p2.n}?`,
      answer: b,
      hint: more ? `ל${p2.n} יש כמו ל${p1.n}, ועוד ${dd}.` : `ל${p2.n} יש כמו ל${p1.n}, בלי ${dd}.`,
      steps: [`${a} ${more ? '+' : '-'} ${dd} = ${b}.`, `ל${p2.n} יש ${b} ${th.name}.`],
    });
  }
  if (kind === 'diff') {
    const b = a + d;
    return Q({
      type: 'word_compare', topic: 'word_add', ui: 'mission', instruction: 'משימה:', unit: th.name,
      story: `ל${p1.n} יש [[${a}]] ${th.name}, ול${p2.n} יש [[${b}]] ${th.name}. כמה ${th.name} יש ל${p2.n} יותר מאשר ל${p1.n}?`,
      answer: d,
      hint: `כמה צריך להוסיף ל-${a} כדי להגיע ל-${b}?`,
      steps: [`${b} - ${a} = ${d}.`, `ל${p2.n} יש ${d} ${th.name} יותר.`],
    });
  }
  const b = a + d;
  return Q({
    type: 'word_compare', topic: 'word_add', ui: 'mission', instruction: 'משימה:', unit: th.name,
    story: `ל${p1.n} יש [[${b}]] ${th.name}. זה [[${d}]] יותר ממה שיש ל${p2.n}. כמה ${th.name} יש ל${p2.n}?`,
    answer: a,
    hint: `ל${p1.n} יש יותר. אז ל${p2.n} יש פחות - בדיוק ${d} פחות.`,
    steps: [`ל${p2.n} יש ${d} פחות מאשר ל${p1.n}.`, `${b} - ${d} = ${a}.`],
  });
}

function genWordCollect(level = 0) {
  const p = pick(PEOPLE);
  const max = level === 0 ? 6 : 30;
  const [a, b, c] = [ri(2, max), ri(2, max), ri(2, max)];
  const sum = a + b + c;
  const story = Math.random() < 0.5
    ? `${p.n} ${g(p, 'קנה', 'קנתה')} [[${a}]] ק"ג תפוחים, [[${b}]] ק"ג אגסים ו-[[${c}]] ק"ג בננות. כמה ק"ג פירות ${g(p, 'קנה', 'קנתה')} ${p.n}?`
    : `בבוקר ${g(p, 'תפס', 'תפסה')} ${p.n} [[${a}]] פוקימונים, בצהריים [[${b}]] ובערב [[${c}]]. כמה פוקימונים ${g(p, 'תפס', 'תפסה')} ${p.n} ביום הזה?`;
  return Q({
    type: 'word_collect', topic: 'word_add', ui: 'mission', instruction: 'משימה:',
    story,
    answer: sum,
    hint: 'שואלים על הכול ביחד - מחברים את כל החלקים.',
    steps: [`${a} + ${b} = ${a + b}.`, `${a + b} + ${c} = ${sum}.`],
  });
}

function genWordMulti(level = 1) {
  const p = pick(PEOPLE);
  const start = ri(10, level === 0 ? 20 : 40);
  const got = ri(5, level === 0 ? 10 : 30);
  const spent = ri(3, start + got - 2);
  const left = start + got - spent;
  return Q({
    type: 'word_multi', topic: 'word_add', ui: 'mission', instruction: 'משימה בשני שלבים:', unit: 'שקלים',
    story: `ל${p.n} היו [[${start}]] שקלים. ${g(p, 'הוא קיבל', 'היא קיבלה')} מסבתא עוד [[${got}]] שקלים, ו${g(p, 'קנה', 'קנתה')} קלפי פוקימון ב-[[${spent}]] שקלים. כמה שקלים נשארו ל${p.n}?`,
    answer: left,
    hint: `קודם מחשבים כמה היו ל${p.n} אחרי המתנה, ורק אחר כך מורידים את מה ש${g(p, 'הוא קנה', 'היא קנתה')}.`,
    steps: [`אחרי המתנה: ${start} + ${got} = ${start + got}.`, `אחרי הקנייה: ${start + got} - ${spent} = ${left}.`],
  });
}

function genWordSumKnown(level = 0) {
  const sum = level === 0 ? ri(8, 20) : ri(25, 100);
  const a = ri(2, sum - 2);
  return Q({
    type: 'word_sum_known', topic: 'word_add', ui: 'mission', instruction: 'חידה:',
    story: `סכום של שני מספרים הוא [[${sum}]]. אחד מהם הוא [[${a}]]. מהו המספר השני?`,
    answer: sum - a,
    hint: `איזה מספר ועוד ${a} נותן ${sum}?`,
    steps: [`${sum} - ${a} = ${sum - a}.`, `בדיקה: ${a} + ${sum - a} = ${sum} ✔`],
  });
}

/** פירוק סכום לשטרות ומטבעות, מהגדול לקטן */
export function greedyMoney(amount, values) {
  const out = [];
  let left = amount;
  for (const v of [...values].sort((a, b) => b - a)) {
    while (left >= v) { out.push(v); left -= v; }
  }
  return left === 0 ? out : null;
}

function moneyValues(level) {
  return level === 0 ? [1, 2, 5, 10] : [1, 2, 5, 10, 20, 50];
}

function genMoneyPay(level = 0) {
  const values = moneyValues(level);
  const target = level === 0 ? ri(3, 20) : ri(11, level === 1 ? 60 : 100);
  const plan = greedyMoney(target, values);
  return Q({
    type: 'money_pay', topic: 'word_add', ui: 'money',
    instruction: `לחצו על מטבעות ושטרות כדי לשלם בדיוק ${target} שקלים:`,
    values,
    target,
    answer: target,
    answerText: `${target} שקלים, למשל: ${plan.join(' + ')}`,
    hint: 'מתחילים מהשטר או מהמטבע הגדול ביותר שלא עובר את הסכום, ואז משלימים בקטנים.',
    steps: [`אפשר לשלם כך: ${plan.join(' + ')} = ${target}.`, 'יש עוד דרכים נכונות - העיקר שהסכום יהיה מדויק.'],
  });
}

function genMoneyChange(level = 0) {
  const paid = level === 0 ? pick([10, 20]) : pick([50, 100]);
  const price = level === 0 ? ri(2, paid - 1) : level === 1 ? ri(1, paid / 10 - 1) * 10 : ri(11, paid - 3);
  const change = paid - price;
  const p = pick(PEOPLE);
  if (level === 0 || Math.random() < 0.5) {
    return Q({
      type: 'money_change', topic: 'word_add', ui: 'mission', instruction: 'בחנות:', unit: 'שקלים',
      story: `${p.n} ${g(p, 'קנה', 'קנתה')} ממתקים ב-[[${price}]] שקלים ו${g(p, 'שילם', 'שילמה')} ב-[[${paid}]] שקלים. כמה עודף ${g(p, 'יקבל', 'תקבל')}?`,
      answer: change,
      hint: `כמה צריך להוסיף ל-${price} כדי להגיע ל-${paid}?`,
      steps: [`${paid} - ${price} = ${change}.`, `העודף: ${change} שקלים.`],
    });
  }
  const plan = greedyMoney(change, moneyValues(level));
  return Q({
    type: 'money_change', topic: 'word_add', ui: 'money',
    instruction: `קנו ממתקים ב-${price} שקלים ושילמו ${paid} שקלים. הרכיבו את העודף מהמטבעות והשטרות:`,
    values: moneyValues(level),
    target: change,
    answer: change,
    answerText: `${change} שקלים, למשל: ${plan.join(' + ')}`,
    hint: `קודם מחשבים את העודף: ${paid} פחות ${price}.`,
    steps: [`${paid} - ${price} = ${change}.`, `אפשר להחזיר כך: ${plan.join(' + ')}.`],
  });
}

/* ============================ רשימת הגנרטורים ============================ */
// כל גנרטור מקבל את רמת הנושא (0-2, ראו topicLevel) ומתאים לה את המספרים.
// levelWeights: [מתחילים, ביניים, מתקדמים] - מכפיל משקל לכל רמה.
const EASY_FIRST = [3, 0.6, 0.3];
const LATER = [0.25, 1, 1];
const ADVANCED = [0, 0.4, 1.2];

export const GENERATORS = [
  // א. מספרים עד 1,000
  { type: 'pv_read', topic: 'numbers', weight: 1.3, gen: genPvRead },
  { type: 'pv_digit', topic: 'numbers', weight: 1, gen: genPvDigit },
  { type: 'pv_compose', topic: 'numbers', weight: 1, gen: genPvCompose },
  { type: 'sequence', topic: 'numbers', weight: 1.2, gen: genSequence },
  { type: 'neighbors', topic: 'numbers', weight: 1, gen: genNeighbors },
  { type: 'order_pick', topic: 'numbers', weight: 0.8, gen: genOrderPick },
  { type: 'between', topic: 'numbers', weight: 0.7, gen: genBetween },
  { type: 'digit_change', topic: 'numbers', weight: 0.9, levelWeights: ADVANCED, gen: genDigitChange },

  // א. זוגי ואי-זוגי
  { type: 'eo_which', topic: 'even_odd', weight: 1.3, levelWeights: [3, 1, 0.7], gen: genEoWhich },
  { type: 'eo_pick', topic: 'even_odd', weight: 1, gen: genEoPick },
  { type: 'eo_next', topic: 'even_odd', weight: 1, gen: genEoNext },
  { type: 'eo_build', topic: 'even_odd', weight: 1, levelWeights: [0.6, 1, 1], gen: genEoBuild },
  { type: 'eo_rule', topic: 'even_odd', weight: 0.8, levelWeights: ADVANCED, gen: genEoRule },
  { type: 'consec_sum', topic: 'even_odd', weight: 0.8, levelWeights: ADVANCED, gen: genConsecSum },

  // ב. חיבור וחיסור במאוזן
  { type: 'facts20', topic: 'add_sub', weight: 1.4, levelWeights: [3, 0.8, 0.4], gen: genFacts20 },
  { type: 'add_2d1d', topic: 'add_sub', weight: 1.3, levelWeights: [2, 1, 0.6], gen: genAdd2d1d },
  { type: 'add_2d2d', topic: 'add_sub', weight: 1.3, levelWeights: [0.4, 1.2, 1.6], gen: genAdd2d2d },
  { type: 'tens', topic: 'add_sub', weight: 1, levelWeights: [1.2, 1, 0.6], gen: genTens },
  { type: 'mental3', topic: 'add_sub', weight: 1, levelWeights: ADVANCED, gen: genMental3 },

  // ב. המספר החסר
  { type: 'miss_add', topic: 'missing', weight: 1.6, gen: genMissAdd },
  { type: 'inverse', topic: 'missing', weight: 1.2, gen: genInverse },
  { type: 'zero', topic: 'missing', weight: 0.6, levelWeights: EASY_FIRST, gen: genZero },
  { type: 'cancel', topic: 'missing', weight: 0.8, levelWeights: LATER, gen: genCancel },

  // ב. אומדן והשוואה
  { type: 'estimate', topic: 'insight', weight: 1.2, gen: genEstimate },
  { type: 'compare_exprs', topic: 'insight', weight: 1.2, gen: genCompareExprs },
  { type: 'compare_sign', topic: 'insight', weight: 1.2, gen: genCompareSign },
  { type: 'order3', topic: 'insight', weight: 0.8, levelWeights: ADVANCED, gen: genOrder3 },

  // ב. שאלות חיבור וחיסור, כסף ועודף
  { type: 'word_compare', topic: 'word_add', weight: 1.2, gen: genWordCompare },
  { type: 'word_collect', topic: 'word_add', weight: 1, gen: genWordCollect },
  { type: 'word_multi', topic: 'word_add', weight: 0.9, levelWeights: LATER, gen: genWordMulti },
  { type: 'word_sum_known', topic: 'word_add', weight: 0.8, gen: genWordSumKnown },
  { type: 'money_pay', topic: 'word_add', weight: 1.1, gen: genMoneyPay },
  { type: 'money_change', topic: 'word_add', weight: 1, gen: genMoneyChange },
];

export function generateByType(type, level = 1) {
  const g2 = GENERATORS.find((x) => x.type === type);
  return g2 ? g2.gen(level) : pick(GENERATORS).gen(level);
}

/* ============================ דוגמאות מתוך תכנית הלימודים ============================ */
// שאלות קבועות, בנוסח הדוגמאות שבתכנית משרד החינוך לכיתה ב'.

function P(o) {
  return Q({ source: 'program', ...o });
}

export const PROGRAM_QUESTIONS = [
  () => P({
    type: 'prog_375_grow', topic: 'numbers', ui: 'mission', minLevel: 1, instruction: 'חידת ספרות:',
    story: 'במספר [[375]] שינו את ספרת העשרות ל-[[8]]. בכמה גדל המספר?', answer: 10,
    hint: 'ספרת העשרות גדלה מ-7 ל-8, כלומר בעשרת אחת.',
    steps: ['המספר החדש הוא 385.', '385 - 375 = 10.'],
  }),
  () => P({
    type: 'prog_375_delete', topic: 'numbers', ui: 'mission', minLevel: 2, instruction: 'חידת ספרות:',
    story: 'במספר [[375]] מחקו את ספרת העשרות. איזה מספר התקבל?', answer: 35,
    hint: 'ספרת העשרות היא 7. מה נשאר בלעדיה?',
    steps: ['מוחקים את ה-7.', 'נשארות הספרות 3 ו-5, כלומר 35.'],
  }),
  () => P({
    type: 'prog_seq_11', topic: 'numbers', ui: 'numberline_fill', instruction: 'צרו סדרה על ידי הוספת 10:',
    stones: [{ value: 11 }, { value: 21 }, { value: 31 }, { value: 41, blank: true }, { value: 51, blank: true }],
    answer: [41, 51], answerText: '41, 51',
    hint: 'בכל צעד מוסיפים 10: ספרת העשרות גדלה ב-1.',
    steps: ['31 + 10 = 41.', '41 + 10 = 51.'],
  }),
  () => P({
    type: 'prog_between', topic: 'numbers', ui: 'choice', instruction: 'איזה מספר נמצא בין 90 ל-101?',
    options: shuffle([opt('95', true, true), opt('89', false, true), opt('102', false, true), opt('110', false, true)]),
    answer: '95', hint: 'צריך מספר שגדול מ-90 וגם קטן מ-101.',
    steps: ['95 גדול מ-90.', '95 קטן מ-101.'],
  }),
  () => P({
    type: 'prog_734', topic: 'even_odd', ui: 'choice', minLevel: 1,
    instruction: 'איזה מספר זוגי אפשר לבנות מהספרות 7, 3, 4?',
    options: shuffle([opt('734', true, true), opt('743', false, true), opt('473', false, true), opt('347', false, true)]),
    answer: '734', hint: 'מספר זוגי נגמר בספרה זוגית. איזו ספרה זוגית יש כאן?',
    steps: ['הספרה הזוגית היא 4.', '734 נגמר ב-4, ולכן הוא זוגי.'],
  }),
  () => P({
    type: 'prog_17_12', topic: 'add_sub', expr: '17 + 12 = ?', answer: 29,
    hint: 'קודם מוסיפים 10, ואחר כך עוד 2.', steps: ['17 + 10 = 27.', '27 + 2 = 29.'],
  }),
  () => P({
    type: 'prog_26_34', topic: 'add_sub', minLevel: 1, expr: '26 + 34 = ?', answer: 60,
    hint: 'מפרקים את 34 ל-30 ו-4.', steps: ['26 + 30 = 56.', '56 + 4 = 60.'],
  }),
  () => P({
    type: 'prog_70_18', topic: 'add_sub', minLevel: 1, expr: '70 - 18 = ?', answer: 52,
    hint: 'מפרקים את 18 ל-10 ו-8.', steps: ['70 - 10 = 60.', '60 - 8 = 52.'],
  }),
  () => P({
    type: 'prog_85_19', topic: 'add_sub', minLevel: 2, expr: '85 - 19 = ?', answer: 66,
    hint: '19 זה כמעט 20. אפשר להוריד 20 ולהחזיר 1.', steps: ['85 - 20 = 65.', 'הורדנו 1 יותר מדי, מחזירים: 65 + 1 = 66.'],
  }),
  () => P({
    type: 'prog_240_35', topic: 'add_sub', minLevel: 2, expr: '240 + 35 = ?', answer: 275,
    hint: 'עשרות עם עשרות, יחידות עם יחידות.', steps: ['240 + 30 = 270.', '270 + 5 = 275.'],
  }),
  () => P({
    type: 'prog_36_14', topic: 'missing', ui: 'choice', noShuffle: true, minLevel: 1,
    instruction: 'ידוע ש-36 + 14 = 50. האם נכון ש-14 + 37 = 51?',
    options: [opt('כן, נכון', true), opt('לא נכון', false)],
    answer: 'כן, נכון', hint: '37 גדול ב-1 מ-36. מה קורה לתוצאה?',
    steps: ['14 + 36 = 50.', '37 הוא אחד יותר מ-36, ולכן התוצאה גדלה ב-1: 51.'],
  }),
  () => P({
    type: 'prog_70_50', topic: 'insight', ui: 'choice', noShuffle: true,
    instruction: 'האם התוצאה גדולה מ-100, קטנה מ-100 או שווה ל-100?', expr: '70 + 50',
    options: [opt('גדול מ-100', true), opt('שווה ל-100'), opt('קטן מ-100')],
    answer: 'גדול מ-100', hint: '50 ועוד 50 זה 100. ו-70 גדול מ-50.',
    steps: ['70 + 50 = 120.', '120 גדול מ-100.'],
  }),
  () => P({
    type: 'prog_107', topic: 'insight', ui: 'choice', noShuffle: true, minLevel: 1,
    instruction: 'בלי לפתור: באיזה תרגיל התוצאה גדולה יותר?',
    options: [opt('107 - 13', true, true), opt('107 - 15', false, true), opt('התוצאות שוות')],
    answer: '107 - 13', hint: 'בשניהם מתחילים מ-107. מי מוריד פחות?',
    steps: ['מי שמוריד פחות - נשאר לו יותר.', '13 קטן מ-15, ולכן 107 - 13 גדול יותר.'],
  }),
  () => P({
    type: 'prog_dani', topic: 'word_add', ui: 'mission', instruction: 'משימה:', unit: 'שקלים',
    story: 'לדני [[7]] שקלים. ליוסי [[3]] שקלים יותר. כמה שקלים יש ליוסי?', answer: 10,
    hint: 'ליוסי יש כמו לדני, ועוד 3.', steps: ['7 + 3 = 10.'],
  }),
  () => P({
    type: 'prog_fruit', topic: 'word_add', ui: 'mission', instruction: 'משימה:',
    story: 'אמא קנתה [[3]] ק"ג תפוחים, [[5]] ק"ג אגסים ו-[[4]] ק"ג בננות. כמה ק"ג פירות קנתה?', answer: 12,
    hint: 'מחברים את כל הפירות.', steps: ['3 + 5 = 8.', '8 + 4 = 12.'],
  }),
  () => P({
    type: 'prog_oded', topic: 'word_add', ui: 'mission', minLevel: 1, instruction: 'משימה בשני שלבים:', unit: 'שקלים',
    story: 'לעודד היו [[15]] שקלים. הוא קיבל מאביו עוד [[20]] שקלים וקנה ממתקים ב-[[8]] שקלים. כמה שקלים נשארו לו?', answer: 27,
    hint: 'קודם מחשבים כמה היו לו אחרי המתנה.', steps: ['15 + 20 = 35.', '35 - 8 = 27.'],
  }),
  () => P({
    type: 'prog_sum40', topic: 'word_add', ui: 'mission', instruction: 'חידה:',
    story: 'סכום של שני מספרים הוא [[40]]. אחד מהם הוא [[22]]. מהו המספר השני?', answer: 18,
    hint: 'איזה מספר ועוד 22 נותן 40?', steps: ['40 - 22 = 18.', 'בדיקה: 22 + 18 = 40 ✔'],
  }),
];

export function randomProgramQuestion(topics, stats = null) {
  const pool = PROGRAM_QUESTIONS.filter((f) => {
    const q = f();
    return topics.includes(q.topic) && (q.minLevel || 0) <= topicLevel(stats, q.topic);
  });
  return pool.length ? pick(pool)() : null;
}

/** יצירת שאלה לפי מזהה סוג - מהגנרטורים או מהדוגמאות הקבועות */
export function makeByType(type, level = 1) {
  const g2 = GENERATORS.find((x) => x.type === type);
  if (g2) return g2.gen(level);
  for (const f of PROGRAM_QUESTIONS) {
    const q = f();
    if (q.type === type) return q;
  }
  return null;
}

/* ============================ בניית קרב ============================ */

/** משקל לפי אחוז הטעויות בנושא - נושאים חלשים חוזרים יותר */
function topicWeight(stats, topicId) {
  const t = stats?.byTopic?.[topicId];
  if (!t || !t.answered) return 1;
  const accuracy = t.firstTry / t.answered;
  return 1 + (1 - accuracy) * 1.8;
}

/**
 * רמת הנושא: 0 = מתחילים, 1 = ביניים, 2 = מתקדמים.
 * עולים רמה אחרי מספיק תרגול עם דיוק טוב, ויורדים בחזרה אם הדיוק יורד.
 */
export function topicLevel(stats, topicId) {
  const t = stats?.byTopic?.[topicId];
  if (!t || !t.answered) return 0;
  const acc = t.firstTry / t.answered;
  if (t.answered >= 25 && acc >= 0.8) return 2;
  if (t.answered >= 10 && acc >= 0.75) return 1;
  return 0;
}

function levelWeight(stats, gen) {
  return gen.levelWeights ? gen.levelWeights[topicLevel(stats, gen.topic)] : 1;
}

/** האם זו שאלה מועדפת ברמה הנוכחית (ולכן מותר לחזור עליה באותו קרב) */
function matchesLevel(stats, gen) {
  return Boolean(gen.levelWeights) && levelWeight(stats, gen) >= 1;
}

/** הנושאים הפתוחים לפי ההגדרות (רק כאלה שיש להם שאלות) */
export function openTopics(saveState) {
  const list = saveState?.settings?.enabledTopics || [];
  const open = list.filter((id) => TOPICS[id] && TOPICS[id].ready);
  return open.length ? open : REGION_ORDER.filter((id) => TOPICS[id].defaultOn && TOPICS[id].ready);
}

/**
 * בניית קרב.
 * options: { count, topic }
 *  - topic: קרב במכון מסוים. בלי topic - "קרב פראי" מכל הנושאים הפתוחים,
 *    עם משקל גבוה יותר לנושאים שבהם יש יותר טעויות.
 * שאלות שנענו לא נכון בעבר (תור החזרה) חוזרות עם מספרים חדשים.
 */
export function buildBattle(saveState, options = {}) {
  const opts = typeof options === 'number' ? { count: options } : options;
  const count = opts.count || 5;
  const topic = opts.topic || null;
  const stats = saveState?.stats;
  const topics = topic ? [topic] : openTopics(saveState);
  const questions = [];
  const usedTypes = new Set();

  const pool = GENERATORS.filter((gen) => topics.includes(gen.topic));
  const fallback = pool.length ? pool : GENERATORS.filter((gen) => TOPICS[gen.topic].defaultOn);

  // 1. שאלות מתור החזרה - עד שתיים בקרב
  const queue = Array.isArray(saveState?.reviewQueue) ? saveState.reviewQueue : [];
  const relevant = shuffle(queue.filter((r) => topics.includes(r.topic)));
  for (const entry of relevant.slice(0, 2)) {
    const q = makeByType(entry.type, topicLevel(stats, entry.topic));
    if (q) {
      q.fromReview = true;
      questions.push(q);
      usedTypes.add(q.type);
    }
  }

  // 2. לפעמים דוגמה מתוך התכנית (רק כאלה שמתאימות לרמה הנוכחית)
  if (questions.length < count && Math.random() < 0.5) {
    const pq = randomProgramQuestion(topics, stats);
    if (pq && !usedTypes.has(pq.type)) {
      questions.push(pq);
      usedTypes.add(pq.type);
    }
  }

  // 3. השלמה מהגנרטורים
  while (questions.length < count) {
    let q = null;
    for (let attempt = 0; attempt < 10; attempt++) {
      const gen = weightedPick(fallback, (x) => x.weight * topicWeight(stats, x.topic) * levelWeight(stats, x));
      // שאלה שמתאימה לרמה מותר לחזור עליה, כדי שהגיוון לא ידחוף את הקרב לרמה הלא נכונה
      if (usedTypes.has(gen.type) && !matchesLevel(stats, gen) && attempt < 7) continue;
      usedTypes.add(gen.type);
      q = gen.gen(topicLevel(stats, gen.topic));
      break;
    }
    if (!q) q = fallback[0].gen(topicLevel(stats, fallback[0].topic));
    questions.push(q);
  }

  return shuffle(questions.slice(0, count));
}
