// בדיקות אוטומטיות למנוע השאלות.
// הרצה (עם Node): node tests/test-generators.mjs

import {
  GENERATORS, PROGRAM_QUESTIONS, buildBattle, TOPICS, REGION_ORDER, makeByType, greedyMoney, openTopics,
} from '../js/questions.js';
import { SUPPORTED_UIS } from '../js/qui.js';
import { figureSvg } from '../js/figures.js';
import { fmt, parseNum, wrapMath, esc, speakMath, stripNiqqud } from '../js/util.js';
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
/** טקסט בלי ניקוד - כדי להשוות מילים */
const S = (s) => stripNiqqud(String(s ?? ''));

/**
 * חישוב תרגיל עם + - × : וסוגריים, לפי סדר פעולות: "(5 × 2) + 3".
 * מחזיר NaN אם הטקסט הוא לא תרגיל תקין.
 */
function evalChain(text) {
  const s = String(text).replace(/,/g, '').replace(/[⁦-⁩]/g, '').replace(/−/g, '-').trim();
  if (!/^[\d\s+\-×:()]+$/.test(s) || !/\d/.test(s)) return NaN;
  const toks = s.match(/\d+|[+\-×:()]/g);
  let i = 0;
  const prim = () => {
    const t = toks[i];
    if (t === '(') { i += 1; const v = sumExpr(); if (toks[i] !== ')') throw new Error('('); i += 1; return v; }
    if (t === '-') { i += 1; return -prim(); }
    if (/^\d+$/.test(t || '')) { i += 1; return Number(t); }
    throw new Error('token');
  };
  const term = () => {
    let v = prim();
    while (toks[i] === '×' || toks[i] === ':') { const op = toks[i++]; const r = prim(); v = op === '×' ? v * r : v / r; }
    return v;
  };
  function sumExpr() {
    let v = term();
    while (toks[i] === '+' || toks[i] === '-') { const op = toks[i++]; const r = term(); v = op === '+' ? v + r : v - r; }
    return v;
  }
  try { const v = sumExpr(); return i === toks.length ? v : NaN; } catch { return NaN; }
}

/** כל השוויונות שמופיעים בטקסט ("a + b = c", "(5 × 2) + 3 = 10 + 3 = 13") - האם הם נכונים? */
function wrongEquations(text) {
  const bad = [];
  const clean = String(text).replace(/[⁦-⁩]/g, '');
  for (const m of clean.matchAll(/[\d,()+\-×:=\s]+/g)) {
    let run = m[0];
    // מקף שצמוד למילה בעברית ("בְּ-10") הוא לא סימן מינוס
    if (run.startsWith('-') && m.index > 0 && /[א-ת֑-ׇ]/.test(clean[m.index - 1])) run = run.slice(1);
    // אחרי התרגיל בא ישר טקסט ("76 = 7 עשרות") - החלק האחרון הוא לא מספר לבד
    const prose = /\s$/.test(m[0]) && /[א-ת]/.test(clean[m.index + m[0].length] || '');
    // נקודתיים של פיסוק ("התשובה 10: 8 + 2") מפרידות, בניגוד לסימן חילוק שמוקף ברווחים ("20 : 4")
    const pieces = run.split(/,\s|;\s|(?<!\s):\s/);
    pieces.forEach((piece, pi) => {
      if (!piece.includes('=')) return;
      const parts = piece.split('=').map((p) => p.replace(/^[\s:,]+|[\s:,]+$/g, ''));
      if (prose && pi === pieces.length - 1) parts.pop();
      if (parts.length < 2 || parts.some((p) => !/\d/.test(p))) return;
      const vals = parts.map(evalChain);
      if (vals.some((v) => Number.isNaN(v))) return;
      if (vals.some((v) => v !== vals[0])) bad.push(piece.trim());
    });
  }
  return bad;
}

/* --- בדיקות עצמאיות לשלב ב' --- */

const HEB_VAL = { א: 1, ב: 2, ג: 3, ד: 4, ה: 5, ו: 6, ז: 7, ח: 8, ט: 9, י: 10, כ: 20, ל: 30 };
/** קריאת מספר באותיות: "כ״ג" -> 23 */
const parseHeb = (s) => [...String(s).replace(/[׳״'"]/g, '').split(' ')[0]].reduce((t, ch) => t + (HEB_VAL[ch] || 0), 0);
/** הכתיב הנכון (בנפרד מהקוד של המשחק) */
function canonHeb(n) {
  const L = Object.fromEntries(Object.entries(HEB_VAL).map(([k, v]) => [v, k]));
  let ls;
  if (n === 15) ls = 'טו'; else if (n === 16) ls = 'טז';
  else ls = (n >= 10 ? L[Math.floor(n / 10) * 10] : '') + (n % 10 ? L[n % 10] : '');
  return ls.length === 1 ? `${ls}׳` : `${ls[0]}״${ls[1]}`;
}

const HOUR_W = ['', 'אחת', 'שתים', 'שלוש', 'ארבע', 'חמש', 'שש', 'שבע', 'שמונה', 'תשע', 'עשר', 'אחת עשרה', 'שתים עשרה'];
/** השעה במילים (בלי ניקוד), בנפרד מהקוד של המשחק */
function clockWords(h, m) {
  if (m === 0) return HOUR_W[h];
  if (m === 30) return `${HOUR_W[h]} וחצי`;
  if (m === 15) return `${HOUR_W[h]} ורבע`;
  return `רבע ל${HOUR_W[(h % 12) + 1]}`;
}

const cellKey = ([x, y]) => `${x},${y}`;
const cellSet = (cells) => new Set(cells.map(cellKey));
function perimeterOfCells(cells) {
  const set = cellSet(cells);
  let p = 0;
  for (const [x, y] of cells) for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (!set.has(cellKey([x + dx, y + dy]))) p += 1;
  return p;
}
const sameCells = (a, b) => a.length === b.length && [...cellSet(a)].every((k) => cellSet(b).has(k));

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
check('speakMath: מסיר ניקוד', speakMath('פִּתְרוּ אֶת הַתַּרְגִּיל:') === 'פתרו את התרגיל:');
check('הסרת ניקוד', stripNiqqud('שָׁלוֹם') === 'שלום');
check('wrapMath: תרגיל בתוך משפט נעטף', wrapMath(esc('בדיקה: 5 + 8 = 13.')).includes('>5 + 8 = 13<'));
check('בדיקת העזר: תרגיל שגוי מזוהה', wrongEquations('3 + 4 = 8').length === 1 && wrongEquations('3 + 4 + 5 = 12').length === 0);
check('בדיקת העזר: כפל, חילוק וסוגריים', wrongEquations('(5 × 2) + 3 = 10 + 3 = 13.').length === 0
  && wrongEquations('20 : 4 = 6.').length === 1 && wrongEquations('5 + (2 × 3) = 21.').length === 1);
check('בדיקת העזר: נקודתיים של פיסוק ומקף עברי', wrongEquations('התשובה 10: 8 + 2 = 10.').length === 0
  && wrongEquations('מוסיפים בְּ-3 = 3.').length === 0);

/* ---------- 2. כל גנרטור בכל רמה ---------- */

const RUNS = 200;

function validateQuestion(q0, label) {
  let q = q0;
  checkOnce(`${label}: יש סוג ונושא מוכר`, Boolean(q.type) && Boolean(TOPICS[q.topic]), `${q.type}/${q.topic}`);
  checkOnce(`${label}: רכיב ממשק קיים`, SUPPORTED_UIS.includes(q.ui), q.ui);
  checkOnce(`${label}: יש רמז`, typeof q.hint === 'string' && q.hint.length > 5);
  checkOnce(`${label}: יש פתרון בשלבים`, Array.isArray(q.steps) && q.steps.length > 0 && q.steps.every((s) => typeof s === 'string' && s.length));

  // כל טקסט בעברית שהילד/ה קורא/ת - מנוקד
  const hebrewTexts = [q.instruction, q.story, q.hint, q.unit, ...(q.steps || []),
    ...(q.exprRtl ? [q.expr] : []), ...(q.options || []).map((o) => o.text)];
  const unvoweled = hebrewTexts.filter((t) => /[א-ת]{2}/.test(t || '') && !/[֑-ׇ]/.test(t));
  checkOnce(`${label}: כל הטקסט מנוקד`, unvoweled.length === 0, unvoweled.join(' | '));

  const allText = [q.instruction, q.expr, q.story, q.given, q.hint, ...(q.steps || [])].join(' ');
  const bad = wrongEquations([q.given, q.hint, ...(q.steps || [])].join(' | '));
  checkOnce(`${label}: כל התרגילים ברמז ובפתרון נכונים`, bad.length === 0, `${bad.join(' ; ')} [${q.expr || q.story}]`);
  checkOnce(`${label}: מספרים עד 1,000`, numbersIn(allText).every((x) => x <= 1000), allText.slice(0, 120));

  if (['numeric', 'mission', 'place_value', 'money', 'vertical', 'chart'].includes(q.ui)) {
    checkOnce(`${label}: תשובה מספר שלם בין 0 ל-1,000`, Number.isInteger(q.answer) && q.answer >= 0 && q.answer <= 1000, String(q.answer));
  }

  // ציורים: כל ציור (גם באפשרויות הבחירה) מצויר
  if (q.figure) checkOnce(`${label}: הציור מצויר`, figureSvg(q.figure).includes('<svg'), q.figure.kind);
  if (q.options && q.options.some((o) => o.art)) {
    checkOnce(`${label}: ציורי האפשרויות מצוירים`, q.options.every((o) => figureSvg(o.art).includes('<svg')));
  }

  // תרגיל "... = ?" - מחשבים בעצמנו
  if (q.expr && /=\s*\?$/.test(q.expr)) {
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

  // בדיקות עצמאיות לפי סוג (על טקסט בלי ניקוד)
  q = { ...q, instruction: S(q.instruction), story: S(q.story), expr: S(q.expr), answer: typeof q.answer === 'string' ? S(q.answer) : q.answer };
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
      const exp = v > 100 ? 'גדול מ-100' : v < 100 ? 'קטן מ-100' : 'שוה ל-100';
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

    /* ----- שלב ב' ----- */
    case 'heb_read':
      checkOnce(`${label}: קריאת אותיות`, parseHeb(q.expr) === q.answer && canonHeb(q.answer) === q.expr, `${q.expr} -> ${q.answer}`);
      break;
    case 'heb_write': {
      const [num] = numbersIn(q.instruction);
      const ok = q.options.every((o) => (o.text === canonHeb(num)) === o.correct);
      checkOnce(`${label}: כתיב באותיות`, ok && q.answer === canonHeb(num), `${num}: ${q.options.map((o) => o.text).join(',')}`);
      break;
    }
    case 'heb_date': {
      const delta = q.instruction.includes('מחרת') ? 2 : q.instruction.includes('מחר') ? 1 : q.instruction.includes('אתמול') ? -1 : 7;
      const exp = parseHeb(q.expr) + delta;
      checkOnce(`${label}: תאריך עברי`, canonHeb(exp) === q.answer && exp >= 1 && exp <= 30
        && q.options.every((o) => (o.text === canonHeb(exp)) === o.correct), `${q.expr} ${delta} -> ${q.answer}`);
      break;
    }
    case 'vert_add':
    case 'vert_sub': {
      const { a, b, op } = q.vertical;
      checkOnce(`${label}: במאונך`, (op === '+' ? a + b : a - b) === q.answer && q.answer >= 0 && q.answer <= 999, `${a}${op}${b}=${q.answer}`);
      break;
    }
    case 'vert_missing': {
      const { a, b, result, hide } = q.vertical;
      const n0 = hide.row === 'a' ? a : b;
      const p = 10 ** hide.place;
      const fits = [];
      for (let d = 0; d <= 9; d++) {
        const nn = n0 - (Math.floor(n0 / p) % 10) * p + d * p;
        if ((hide.row === 'a' ? nn + b : a + nn) === result && (hide.place === 0 || d > 0)) fits.push(d);
      }
      checkOnce(`${label}: ספרה חסרה - תשובה אחת בלבד`, fits.length === 1 && fits[0] === q.answer, `${a}+${b}=${result} ${JSON.stringify(hide)} -> ${fits}`);
      break;
    }
    case 'mult_groups':
      checkOnce(`${label}: קבוצות`, q.figure.groups * q.figure.each === q.answer);
      break;
    case 'mult_array':
      checkOnce(`${label}: מערך`, q.figure.rows * q.figure.cols === q.answer);
      break;
    case 'skip_seq': {
      const [step] = numbersIn(q.instruction);
      checkOnce(`${label}: קפיצות בגודל הנכון`, Math.abs(q.stones[1].value - q.stones[0].value) === step);
      break;
    }
    case 'jumps': {
      const [step, target] = [...q.story.matchAll(/\[\[(\d+)\]\]/g)].map((m) => Number(m[1]));
      checkOnce(`${label}: כמה קפיצות`, q.answer * step === target, q.story);
      break;
    }
    case 'div_sign': {
      const [step] = numbersIn(q.instruction.replace(/מ-0/, ''));
      checkOnce(`${label}: סימני התחלקות`, q.options.every((o) => (n(o.text) % step === 0) === o.correct), `${step}: ${q.options.map((o) => o.text)}`);
      break;
    }
    case 'land_on': {
      const [, step, num] = numbersIn(q.instruction);
      checkOnce(`${label}: מגיעים או לא`, q.answer === (num % step === 0 ? 'כן' : 'לא'), `${q.instruction} -> ${q.answer}`);
      break;
    }
    case 'paren_place': {
      const [target] = numbersIn(q.instruction);
      checkOnce(`${label}: מקום הסוגריים`, q.options.every((o) => (evalChain(o.text) === target) === o.correct), q.options.map((o) => o.text).join(' | '));
      break;
    }
    case 'paren_compare': {
      const [l, r] = q.expr.split('▢');
      const lv = evalChain(l); const rv = evalChain(r);
      checkOnce(`${label}: השוואה עם סוגריים`, q.answer === (lv < rv ? '<' : lv > rv ? '>' : '='), `${q.expr} -> ${q.answer}`);
      break;
    }
    case 'wm_groups': {
      const [a, b] = numbersIn(q.story);
      checkOnce(`${label}: כפל`, a * b === q.answer, q.story);
      break;
    }
    case 'wm_share':
    case 'wm_contain': {
      const [total, parts] = numbersIn(q.story);
      checkOnce(`${label}: חילוק בלי שארית`, total / parts === q.answer && total % parts === 0, q.story);
      break;
    }
    case 'wm_buy': {
      const [price, x] = numbersIn(q.story);
      const exp = q.story.includes('כמה עולים') ? price * x : x / price;
      checkOnce(`${label}: קנייה`, exp === q.answer && Number.isInteger(exp), q.story);
      break;
    }
    case 'nl_locate':
      checkOnce(`${label}: מיקום בישר`, q.stones[q.correctIndex].value === q.target && q.stones[q.correctIndex].blank);
      break;
    case 'nl_read':
      checkOnce(`${label}: קריאת ישר`, q.figure.from + q.figure.mark * q.figure.step === q.answer && !q.figure.labels.includes(q.figure.mark));
      break;
    case 'nl_negative': {
      const exp = q.figure ? q.figure.from + q.figure.mark * q.figure.step : (() => { const [a, b] = numbersIn(q.story); return a - b; })();
      checkOnce(`${label}: מספרים שליליים`, String(exp) === q.answer && q.options.filter((o) => o.text === String(exp)).length === 1, `${exp} / ${q.answer}`);
      break;
    }
    case 'frac_color': {
      const frac = q.instruction.includes('שלושה רבעים') ? 3 / 4 : q.instruction.includes('שני רבעים') ? 1 / 2 : q.instruction.includes('רבע') ? 1 / 4 : 1 / 2;
      checkOnce(`${label}: צביעה`, q.target === q.parts * frac && Number.isInteger(q.target), `${q.instruction} ${q.parts} -> ${q.target}`);
      break;
    }
    case 'frac_of': {
      const [num] = numbersIn(q.expr);
      checkOnce(`${label}: חצי או רבע של מספר`, q.answer === num / (q.expr.includes('רבע') ? 4 : 2) && Number.isInteger(q.answer), `${q.expr} -> ${q.answer}`);
      break;
    }
    case 'frac_name': {
      const r = q.figure.filled / q.figure.parts;
      const exp = r === 1 ? 'שלם' : r === 0.5 ? 'חצי' : r === 0.25 ? 'רבע' : 'שלושה רבעים';
      checkOnce(`${label}: שם החלק`, q.answer === exp && q.options.filter((o) => o.correct).length === 1, `${r} -> ${q.answer}`);
      break;
    }
    case 'data_read': {
      const i = q.figure.labels.findIndex((l) => q.instruction.includes(S(l)));
      checkOnce(`${label}: קריאת דיאגרמה`, i >= 0 && q.figure.values[i] === q.answer);
      break;
    }
    case 'data_most': {
      const v = q.figure.values;
      const t = q.instruction.includes('מעט') ? Math.min(...v) : Math.max(...v);
      checkOnce(`${label}: הכי הרבה / הכי מעט`, S(q.figure.labels[v.indexOf(t)]) === q.answer && new Set(v).size === v.length);
      break;
    }
    case 'data_diff': {
      const [li, lj] = [...q.instruction.matchAll(/"([^"]+)"/g)].map((m) => m[1]);
      const labs = q.figure.labels.map(S);
      checkOnce(`${label}: הפרש בדיאגרמה`, q.figure.values[labs.indexOf(li)] - q.figure.values[labs.indexOf(lj)] === q.answer && q.answer > 0);
      break;
    }
    case 'data_total':
      checkOnce(`${label}: סך הכל בדיאגרמה`, q.figure.values.reduce((s, x) => s + x, 0) === q.answer);
      break;
    case 'ruler_read':
      checkOnce(`${label}: מדידה בסרגל`, q.figure.end - q.figure.start === q.answer && q.figure.end <= q.figure.max && q.answer >= 3);
      break;
    case 'balance_count': {
      const L = q.figure.left; const R = q.figure.right;
      const things = L.filter((x) => x !== 'cube').length;
      const w = (R.filter((x) => x === 'cube').length - L.filter((x) => x === 'cube').length) / things;
      checkOnce(`${label}: מאזניים`, q.figure.tilt === 0 && w === q.answer && R.every((x) => x === 'cube'), JSON.stringify(q.figure));
      break;
    }
    case 'balance_compare':
      checkOnce(`${label}: מה כבד`, q.options.filter((o) => o.correct).length === 1);
      break;
    case 'length_word': {
      const nums = numbersIn(q.story);
      const exp = q.story.includes('מטר') ? 100 - nums[0] : nums[1] - nums[0];
      checkOnce(`${label}: אורך`, exp === q.answer, q.story);
      break;
    }
    case 'area':
      checkOnce(`${label}: שטח`, q.figure.shapes[0].cells.length === q.answer);
      break;
    case 'perimeter':
      checkOnce(`${label}: היקף`, perimeterOfCells(q.figure.shapes[0].cells) === q.answer);
      break;
    case 'area_compare': {
      const [c1, c2] = q.figure.shapes.map((s) => s.cells);
      const area = q.instruction.includes('שטח');
      const m1 = area ? c1.length : perimeterOfCells(c1); const m2 = area ? c2.length : perimeterOfCells(c2);
      const exp = m1 > m2 ? 'הכחלה' : m2 > m1 ? 'הצהבה' : (area ? 'לשתיהן אותו שטח' : 'לשתיהן אותו הקף');
      checkOnce(`${label}: השוואת שטח/היקף`, q.answer === exp, `${m1}/${m2} -> ${q.answer}`);
      break;
    }
    case 'clock_read': {
      const exp = clockWords(q.figure.h, q.figure.m);
      checkOnce(`${label}: קריאת שעון`, q.answer === exp && q.options.every((o) => (S(o.text) === exp) === o.correct), `${q.figure.h}:${q.figure.m} -> ${q.answer}`);
      break;
    }
    case 'clock_pick': {
      const ok = q.options.every((o) => (q.instruction.endsWith(`${clockWords(o.art.h, o.art.m)}?`)) === o.correct);
      const distinct = new Set(q.options.map((o) => `${o.art.h}:${o.art.m}`)).size === q.options.length;
      checkOnce(`${label}: בחירת שעון`, ok && distinct && q.options.every((o) => o.artOnly), q.instruction);
      break;
    }
    case 'duration':
      checkOnce(`${label}: משך זמן`, q.options.filter((o) => o.correct).length === 1);
      break;
    case 'solid_count': {
      const T = { cube: [6, 8, 12], box: [6, 8, 12], pyramid: [5, 5, 8] }[q.figure.name];
      const exp = q.instruction.includes('פאות') ? T[0] : q.instruction.includes('קדקדים') ? T[1] : T[2];
      checkOnce(`${label}: ספירת גוף`, exp === q.answer, `${q.figure.name}: ${q.instruction} -> ${q.answer}`);
      break;
    }
    case 'shape_sides':
      checkOnce(`${label}: צלעות`, q.figure.sides === q.answer);
      break;
    case 'mirror_complete': {
      const { w, mirror, given } = q.grid;
      const reflected = given.map(([x, y]) => [2 * mirror - 1 - x, y]);
      const other = given.every(([x]) => x < mirror) ? reflected.every(([x]) => x >= mirror) : reflected.every(([x]) => x < mirror);
      checkOnce(`${label}: השלמת שיקוף`, sameCells(reflected, q.target.map((k) => k.split(',').map(Number))) && other && w === 2 * mirror);
      break;
    }
    case 'sym_is': {
      const { cells } = q.figure.shapes[0];
      const set = cellSet(cells);
      const sym = cells.every(([x, y]) => set.has(cellKey([2 * q.figure.mirror - 1 - x, y])));
      checkOnce(`${label}: קו סימטריה`, q.answer === (sym ? 'כן' : 'לא'));
      break;
    }
    case 'move_or_mirror': {
      const [a, b] = q.figure.shapes.map((s) => s.cells);
      const dx = Math.min(...b.map(([x]) => x)) - Math.min(...a.map(([x]) => x));
      const moved = sameCells(a.map(([x, y]) => [x + dx, y]), b);
      checkOnce(`${label}: הזזה או שיקוף`, q.answer === (moved ? 'הזזה' : 'שקוף'), q.answer);
      break;
    }
    case 'shift_count': {
      const [a, b] = q.figure.shapes.map((s) => s.cells);
      const k = q.answer;
      const ok = [[k, 0], [-k, 0], [0, k], [0, -k]].some(([dx, dy]) => sameCells(a.map(([x, y]) => [x + dx, y + dy]), b));
      const overlap = a.some((c) => cellSet(b).has(cellKey(c)));
      checkOnce(`${label}: כמה משבצות הזיזו`, ok && !overlap);
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
check('ט״ו בדוגמה מהתכנית כתוב בגרשיים הנכונים', makeByType('prog_tu').answer === canonHeb(15));
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
