// בדיקות אוטומטיות למנוע השאלות.
// הרצה (עם Node): node tests/test-generators.mjs

import {
  GENERATORS, PROGRAM_QUESTIONS, buildBattle, TOPICS, REGION_ORDER, makeByType, greedyMoney, openTopics,
} from '../js/questions.js';
import { SUPPORTED_UIS } from '../js/qui.js';
import { fmt, parseNum, wrapMath, esc, speakMath } from '../js/util.js';
import { defaultSave } from '../js/storage.js';

let pass = 0;
const failures = [];

function check(name, cond, detail = '') {
  if (cond) { pass += 1; } else { failures.push(`${name}${detail ? ' :: ' + detail : ''}`); }
}

/** בדיקה שנכשלת רק פעם אחת לכל שם (כדי שלולאה של 200 הרצות לא תציף את הפלט) */
const seenFail = new Set();
function checkOnce(name, cond, detail = '') {
  if (cond) { pass += 1; return; }
  if (seenFail.has(name)) return;
  seenFail.add(name);
  failures.push(`${name}${detail ? ' :: ' + detail : ''}`);
}

/* ---------- עזרים ---------- */

const n = (s) => Number(String(s).replace(/,/g, ''));

/** חישוב שרשרת חיבור וחיסור משמאל לימין: "12 + 5 - 3" */
function evalChain(text) {
  const clean = String(text).replace(/,/g, '').replace(/[⁦-⁩]/g, '').trim();
  if (!/^\d+(\s*[+\-]\s*\d+)*$/.test(clean)) return NaN;
  const tokens = clean.match(/\d+|[+\-]/g);
  let v = Number(tokens[0]);
  for (let i = 1; i < tokens.length; i += 2) v = tokens[i] === '+' ? v + Number(tokens[i + 1]) : v - Number(tokens[i + 1]);
  return v;
}

/** כל התרגילים "a + b - c = d" שמופיעים בטקסט - האם הם נכונים? */
function wrongEquations(text) {
  const bad = [];
  // שני הצדדים יכולים להיות תרגיל: "74 - 14 = 54 + 6"
  const re = /(\d[\d,]*(?:\s*[+\-]\s*\d[\d,]*)+)\s*=\s*(\d[\d,]*(?:\s*[+\-]\s*\d[\d,]*)*)/g;
  for (const m of String(text).replace(/[⁦-⁩]/g, '').matchAll(re)) {
    if (evalChain(m[1]) !== evalChain(m[2])) bad.push(m[0]);
  }
  return bad;
}

/** המספרים בטקסט (כולל בתוך [[ ]]) */
const numbersIn = (text) => Array.from(String(text).matchAll(/\d[\d,]*/g)).map((m) => n(m[0]));

/* ---------- 1. עזרי מספרים והקראה ---------- */

check('fmt: 1000 -> 1,000', fmt(1000) === '1,000');
check('parseNum(fmt(x)) === x', [0, 7, 999, 1000].every((x) => parseNum(fmt(x)) === x));
check('speakMath: חיבור', speakMath('23 + 4 = ?') === '23 ועוד 4 שווה כמה', speakMath('23 + 4 = ?'));
check('speakMath: מספר חסר בהתחלה', speakMath('? + 3 = 25') === 'כמה ועוד 3 שווה 25', speakMath('? + 3 = 25'));
check('speakMath: חיסור עם חסר', speakMath('35 - ? = 30') === '35 פחות כמה שווה 30', speakMath('35 - ? = 30'));
check('speakMath: שאלה בעברית נשארת', speakMath('כמה שקלים יש ליוסי?') === 'כמה שקלים יש ליוסי?', speakMath('כמה שקלים יש ליוסי?'));
check('speakMath: מקף בעברית נשאר', speakMath('הגדול ב-10 מ-84') === 'הגדול ב-10 מ-84', speakMath('הגדול ב-10 מ-84'));
check('speakMath: ק"ג', speakMath('[[3]] ק"ג תפוחים').includes('3 קילוגרם'));
check('wrapMath: תרגיל בתוך משפט נעטף', wrapMath(esc('בדיקה: 5 + 8 = 13.')).includes('>5 + 8 = 13<'));
check('בדיקת העזר: תרגיל שגוי מזוהה', wrongEquations('3 + 4 = 8').length === 1 && wrongEquations('3 + 4 + 5 = 12').length === 0);

/* ---------- 2. כל גנרטור בכל רמה ---------- */

const RUNS = 200;

function validateQuestion(q, label) {
  checkOnce(`${label}: יש סוג ונושא מוכר`, Boolean(q.type) && Boolean(TOPICS[q.topic]), `${q.type}/${q.topic}`);
  checkOnce(`${label}: רכיב ממשק קיים`, SUPPORTED_UIS.includes(q.ui), q.ui);
  checkOnce(`${label}: יש רמז`, typeof q.hint === 'string' && q.hint.length > 5);
  checkOnce(`${label}: יש פתרון בשלבים`, Array.isArray(q.steps) && q.steps.length > 0 && q.steps.every((s) => typeof s === 'string' && s.length));

  const allText = [q.instruction, q.expr, q.story, q.given, q.hint, ...(q.steps || [])].join(' ');
  const bad = wrongEquations([q.given, q.hint, ...(q.steps || [])].join(' | '));
  checkOnce(`${label}: כל התרגילים ברמז ובפתרון נכונים`, bad.length === 0, `${bad.join(' ; ')} [${q.expr || q.story}]`);
  checkOnce(`${label}: מספרים עד 1,000`, numbersIn(allText).every((x) => x <= 1000), allText.slice(0, 120));

  if (['numeric', 'mission', 'place_value', 'money'].includes(q.ui)) {
    checkOnce(`${label}: תשובה מספר שלם בין 0 ל-1,000`, Number.isInteger(q.answer) && q.answer >= 0 && q.answer <= 1000, String(q.answer));
  }

  // תרגיל "... = ?" - מחשבים בעצמנו
  if (q.expr && /=\s*\?$/.test(q.expr) && !q.expr.includes('×')) {
    const left = q.expr.replace(/=\s*\?$/, '');
    checkOnce(`${label}: התשובה תואמת את התרגיל`, evalChain(left) === q.answer, `${q.expr} -> ${q.answer}`);
  }
  // משוואה עם מספר חסר: מציבים את התשובה ובודקים ששני הצדדים שווים
  if (q.expr && q.expr.includes('?') && /=/.test(q.expr) && !/=\s*\?$/.test(q.expr)) {
    const [l, r] = q.expr.replace('?', String(q.answer)).split('=');
    checkOnce(`${label}: הצבת התשובה במשוואה`, evalChain(l) === evalChain(r), `${q.expr} -> ${q.answer}`);
  }
  if (q.given) {
    const [l, r] = q.given.split('=');
    checkOnce(`${label}: התרגיל הפתור נכון`, evalChain(l) === evalChain(r), q.given);
  }

  if (q.ui === 'place_value') {
    const { h, t, u } = q.blocks;
    checkOnce(`${label}: הקוביות מרכיבות את התשובה`, h * 100 + t * 10 + u === q.answer && t <= 9 && u <= 9 && h <= 9);
  }

  if (q.ui === 'choice') {
    const correct = q.options.filter((o) => o.correct);
    checkOnce(`${label}: בדיוק תשובה נכונה אחת`, correct.length === 1, q.options.map((o) => o.text).join('|'));
    checkOnce(`${label}: אין אפשרויות כפולות`, new Set(q.options.map((o) => o.text)).size === q.options.length);
    checkOnce(`${label}: לפחות 2 אפשרויות`, q.options.length >= 2);
    checkOnce(`${label}: התשובה היא האפשרות הנכונה`, correct[0] && correct[0].text === String(q.answer), `${q.answer} / ${correct[0] && correct[0].text}`);
  }

  if (q.ui === 'money') {
    checkOnce(`${label}: סכום הכסף = התשובה`, q.target === q.answer && q.values.includes(1));
    checkOnce(`${label}: אפשר להרכיב את הסכום`, Array.isArray(greedyMoney(q.target, q.values)));
    checkOnce(`${label}: סכום חיובי`, q.target > 0);
  }

  if (q.ui === 'numberline_fill') {
    const vals = q.stones.map((s) => s.value);
    const step = vals[1] - vals[0];
    checkOnce(`${label}: הסדרה בקפיצות שוות`, step !== 0 && vals.every((v, i) => i === 0 || v - vals[i - 1] === step), vals.join(','));
    const blanks = q.stones.filter((s) => s.blank).map((s) => s.value);
    checkOnce(`${label}: יש אבנים חסרות והן התשובה`, blanks.length > 0 && JSON.stringify(blanks) === JSON.stringify(q.answer));
    checkOnce(`${label}: שני המספרים הראשונים גלויים`, !q.stones[0].blank && !q.stones[1].blank);
    checkOnce(`${label}: כל המספרים בין 0 ל-1,000`, vals.every((v) => v >= 0 && v <= 1000), vals.join(','));
  }

  // בדיקות עצמאיות לפי סוג
  switch (q.type) {
    case 'pv_digit': {
      if (q.instruction.includes('הערך')) {
        const [d, num] = numbersIn(q.instruction);
        const s = String(num);
        const pos = s.indexOf(String(d));
        checkOnce(`${label}: ערך הספרה`, pos >= 0 && d * 10 ** (s.length - 1 - pos) === q.answer, `${q.instruction} -> ${q.answer}`);
        break;
      }
      const num = n(q.expr);
      const place = q.instruction.includes('המאות') ? 100 : q.instruction.includes('העשרות') ? 10 : 1;
      checkOnce(`${label}: ספרה במקום`, Math.floor(num / place) % 10 === q.answer, `${q.instruction} ${q.expr} -> ${q.answer}`);
      break;
    }
    case 'pv_compose': {
      const get = (word) => { const m = q.expr.match(new RegExp(`(\\d+) ${word}`)); return m ? Number(m[1]) : 0; };
      checkOnce(`${label}: הרכבת מספר`, get('מאות') * 100 + get('עשרות') * 10 + get('יחידות') === q.answer, `${q.expr} -> ${q.answer}`);
      break;
    }
    case 'neighbors': {
      const m = q.expr.match(/(הגדול|הקטן) ב-([\d,]+) מ-([\d,]+)/);
      const m2 = q.expr.match(/(העוקב|הקודם) ל-([\d,]+)/);
      const exp = m ? (m[1] === 'הגדול' ? n(m[3]) + n(m[2]) : n(m[3]) - n(m[2]))
        : m2 ? (m2[1] === 'העוקב' ? n(m2[2]) + 1 : n(m2[2]) - 1) : NaN;
      checkOnce(`${label}: שכן נכון`, exp === q.answer, `${q.expr} -> ${q.answer}`);
      break;
    }
    case 'digit_change': {
      const [num, nt] = numbersIn(q.story);
      const h = Math.floor(num / 100); const u = num % 10; const t = Math.floor(num / 10) % 10;
      let exp;
      if (q.story.includes('מחקו')) exp = h * 10 + u;
      else if (q.story.includes('בכמה גדל')) exp = (nt - t) * 10;
      else exp = h * 100 + nt * 10 + u;
      checkOnce(`${label}: שינוי ספרה`, exp === q.answer, `${q.story} -> ${q.answer}`);
      break;
    }
    case 'order_pick': {
      const vals = q.options.map((o) => n(o.text));
      const exp = q.instruction.includes('גדול') ? Math.max(...vals) : Math.min(...vals);
      checkOnce(`${label}: הכי גדול/קטן`, n(q.answer) === exp);
      break;
    }
    case 'between': {
      const [lo, hi] = numbersIn(q.instruction);
      const inside = q.options.filter((o) => n(o.text) > lo && n(o.text) < hi);
      checkOnce(`${label}: רק אפשרות אחת בטווח והיא הנכונה`, inside.length === 1 && inside[0].correct, q.options.map((o) => o.text).join(','));
      break;
    }
    case 'eo_which': {
      const [num] = numbersIn(q.instruction);
      checkOnce(`${label}: זוגיות`, q.answer === (num % 2 === 0 ? 'זוגי' : 'אי-זוגי'));
      break;
    }
    case 'eo_pick': {
      const wantEven = !q.instruction.includes('אי-זוגי');
      const ok = q.options.every((o) => ((n(o.text) % 2 === 0) === wantEven) === o.correct);
      checkOnce(`${label}: רק אפשרות אחת מתאימה`, ok, q.options.map((o) => o.text).join(','));
      break;
    }
    case 'eo_build': {
      const digits = numbersIn(q.instruction.split('?')[0]).map(String).sort().join('');
      const ok = q.options.every((o) => o.text.split('').sort().join('') === digits && o.text[0] !== '0')
        && q.options.every((o) => (n(o.text) % 2 === 0) === o.correct);
      checkOnce(`${label}: בנוי מהספרות, והנכון הוא היחיד הזוגי`, ok, `${digits}: ${q.options.map((o) => o.text).join(',')}`);
      break;
    }
    case 'eo_next': {
      const [num] = numbersIn(q.expr);
      const wantEven = !q.expr.includes('האי-זוגי');
      const dir = q.expr.includes('אחרי') ? 1 : -1;
      let exp = num + dir;
      if ((exp % 2 === 0) !== wantEven) exp += dir;
      checkOnce(`${label}: הזוגי/אי-זוגי הבא`, exp === q.answer, `${q.expr} -> ${q.answer}`);
      break;
    }
    case 'consec_sum': {
      const [sum] = numbersIn(q.story);
      checkOnce(`${label}: עוקבים`, q.answer + (q.answer + 1) === sum);
      break;
    }
    case 'eo_rule': {
      const v = evalChain(q.expr);
      checkOnce(`${label}: זוגיות הסכום`, q.answer === (v % 2 === 0 ? 'זוגי' : 'אי-זוגי'));
      break;
    }
    case 'estimate': {
      const v = evalChain(q.expr);
      const exp = v > 100 ? 'גדול מ-100' : v < 100 ? 'קטן מ-100' : 'שווה ל-100';
      checkOnce(`${label}: אומדן`, q.answer === exp, `${q.expr}=${v} -> ${q.answer}`);
      break;
    }
    case 'compare_exprs':
    case 'order3': {
      const exprOpts = q.options.filter((o) => /\d/.test(o.text));
      const vals = exprOpts.map((o) => evalChain(o.text));
      const biggest = !q.instruction.includes('הכי קטנה');
      const target = biggest ? Math.max(...vals) : Math.min(...vals);
      const winners = exprOpts.filter((o, i) => vals[i] === target);
      const expText = winners.length > 1 ? 'התוצאות שוות' : winners[0].text;
      checkOnce(`${label}: השוואת תרגילים`, q.answer === expText, `${vals.join(',')} -> ${q.answer}`);
      break;
    }
    case 'compare_sign': {
      const [l, r] = q.expr.split('▢');
      const lv = evalChain(l); const rv = evalChain(r);
      const exp = lv < rv ? '<' : lv > rv ? '>' : '=';
      checkOnce(`${label}: סימן השוואה`, q.answer === exp, `${q.expr} -> ${q.answer}`);
      break;
    }
    case 'word_sum_known': {
      const [sum, a] = numbersIn(q.story);
      checkOnce(`${label}: המספר השני`, sum - a === q.answer);
      break;
    }
    case 'word_collect': {
      const nums = numbersIn(q.story);
      checkOnce(`${label}: איסוף`, nums.reduce((s, x) => s + x, 0) === q.answer, q.story);
      break;
    }
    case 'word_multi': {
      const [a, b, c] = numbersIn(q.story);
      checkOnce(`${label}: שני שלבים`, a + b - c === q.answer && q.answer >= 0);
      break;
    }
    case 'money_change': {
      const nums = numbersIn(q.ui === 'money' ? q.instruction : q.story);
      checkOnce(`${label}: עודף`, Math.max(...nums) - Math.min(...nums) === q.answer, `${nums} -> ${q.answer}`);
      break;
    }
    default:
      break;
  }
}

for (const gen of GENERATORS) {
  for (let level = 0; level <= 2; level++) {
    for (let i = 0; i < RUNS; i++) {
      let q;
      try {
        q = gen.gen(level);
      } catch (e) {
        checkOnce(`${gen.type} רמה ${level}: לא קורס`, false, e.message);
        continue;
      }
      checkOnce(`${gen.type}: הסוג תואם לרשימה`, q.type === gen.type && q.topic === gen.topic, `${q.type}/${q.topic}`);
      validateQuestion(q, `${gen.type} רמה ${level}`);
    }
  }
}
check(`כל ${GENERATORS.length} הגנרטורים רצו ${RUNS} פעמים בכל רמה`, true);

/* ---------- 3. דוגמאות מתוך התכנית ---------- */

for (const f of PROGRAM_QUESTIONS) {
  const q = f();
  validateQuestion(q, `תכנית ${q.type}`);
  check(`תכנית ${q.type}: מקור מסומן`, q.source === 'program');
  check(`תכנית ${q.type}: אפשר לשחזר לפי סוג`, makeByType(q.type).type === q.type);
}
check('אין סוגי שאלות כפולים', new Set([...GENERATORS.map((g) => g.type), ...PROGRAM_QUESTIONS.map((f) => f().type)]).size
  === GENERATORS.length + PROGRAM_QUESTIONS.length);

/* ---------- 4. נושאים ---------- */

check('כל נושא מוכן מופיע בסדר המפה', Object.keys(TOPICS).every((id) => REGION_ORDER.includes(id)));
for (const id of REGION_ORDER) {
  const hasGen = GENERATORS.some((g) => g.topic === id);
  check(`נושא ${id}: "מוכן" רק אם יש לו שאלות`, TOPICS[id].ready === hasGen, `ready=${TOPICS[id].ready}, gens=${hasGen}`);
}
check('נושאי ברירת המחדל מוכנים', REGION_ORDER.filter((id) => TOPICS[id].defaultOn).every((id) => TOPICS[id].ready));

/* ---------- 5. בניית קרב ---------- */

{
  const save = defaultSave();
  for (let i = 0; i < 50; i++) {
    const b = buildBattle(save, { count: 5 });
    checkOnce('קרב פראי: 5 שאלות', b.length === 5);
    checkOnce('קרב פראי: רק נושאים פתוחים', b.every((q) => save.settings.enabledTopics.includes(q.topic)), b.map((q) => q.topic).join(','));
  }

  const only = { ...defaultSave(), settings: { ...defaultSave().settings, enabledTopics: ['even_odd'] } };
  for (let i = 0; i < 30; i++) {
    checkOnce('נושא יחיד פתוח: כל השאלות ממנו', buildBattle(only, { count: 5 }).every((q) => q.topic === 'even_odd'));
  }

  for (const topic of REGION_ORDER.filter((id) => TOPICS[id].ready)) {
    const b = buildBattle(save, { count: 5, topic });
    check(`קרב במכון ${topic}: כל השאלות מהנושא`, b.length === 5 && b.every((q) => q.topic === topic));
  }

  const withReview = { ...defaultSave(), reviewQueue: [{ type: 'facts20', topic: 'add_sub' }] };
  let found = false;
  for (let i = 0; i < 10 && !found; i++) found = buildBattle(withReview, { count: 5 }).some((q) => q.fromReview && q.type === 'facts20');
  check('שאלה מתור החזרה חוזרת בקרב', found);

  const closedReview = { ...defaultSave(), reviewQueue: [{ type: 'facts20', topic: 'add_sub' }] };
  closedReview.settings.enabledTopics = ['numbers'];
  check('שאלת חזרה מנושא סגור לא מופיעה', buildBattle(closedReview, { count: 5 }).every((q) => q.topic === 'numbers'));

  const none = { ...defaultSave() };
  none.settings.enabledTopics = [];
  check('בלי נושאים פתוחים - חוזרים לברירת המחדל', openTopics(none).length > 0 && buildBattle(none, { count: 5 }).length === 5);

  // הרמה עולה עם הדיוק - ברמה 2 מופיעות שאלות מתקדמות
  const adv = defaultSave();
  adv.stats.byTopic.add_sub = { answered: 40, correct: 38, firstTry: 36, wrong: 4 };
  let sawAdvanced = false;
  for (let i = 0; i < 40 && !sawAdvanced; i++) sawAdvanced = buildBattle(adv, { count: 5, topic: 'add_sub' }).some((q) => q.type === 'mental3' || q.type === 'add_2d2d');
  check('ברמה מתקדמת מופיעות שאלות קשות יותר', sawAdvanced);
}

/* ---------- 6. כסף ---------- */

check('פירוק 35 שקלים', JSON.stringify(greedyMoney(35, [1, 2, 5, 10, 20])) === JSON.stringify([20, 10, 5]));
check('פירוק 0 שקלים', JSON.stringify(greedyMoney(0, [1, 2])) === '[]');

/* ---------- סיכום ---------- */
console.log(`\n✔ עברו: ${pass}`);
if (failures.length) {
  console.log(`✘ נכשלו: ${failures.length}`);
  failures.forEach((f) => console.log('   - ' + f));
  process.exitCode = 1;
} else {
  console.log('כל הבדיקות עברו בהצלחה.');
}
