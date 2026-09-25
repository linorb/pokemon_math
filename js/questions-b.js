// questions-b.js - גנרטורי השאלות של שלב ב': שאר הנושאים בתכנית כיתה ב'
// (מספרים באותיות, חיבור במאונך, כפל וחילוק, קפיצות, סוגריים, שאלות כפל, ישר המספרים,
//  חצי ורבע, דיאגרמות, אורך ומשקל, שטח והיקף, שעון, גופים, שיקוף והזזה).
// כל טקסט שהילד/ה קורא/ת מנוקד. פונים לילד/ה בלשון רבים.

import { ri, pick, shuffle, fmt } from './util.js';
import { Q, P, opt, choiceOptions, PEOPLE, g, ltrIsolate, SHEKELS, YES, NO } from './qhelpers.js';

const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
const sum = (arr) => arr.reduce((s, x) => s + x, 0);
/** "4 + 4 + 4 = 12" */
const repeatAdd = (k, n) => `${Array(n).fill(k).join(' + ')} = ${k * n}`;

const EASY_FIRST = [3, 0.6, 0.3];
const LATER = [0.25, 1, 1];
const ADVANCED = [0, 0.4, 1.2];

/* ============================ א. מספרים באותיות (א-ל) ============================ */

const LETTER_VALUES = [['א', 1], ['ב', 2], ['ג', 3], ['ד', 4], ['ה', 5], ['ו', 6], ['ז', 7], ['ח', 8], ['ט', 9], ['י', 10], ['כ', 20], ['ל', 30]];
const LETTER_OF = Object.fromEntries(LETTER_VALUES.map(([l, v]) => [v, l]));
const GERESH = '׳';
const GERSHAYIM = '״';

/** האותיות של המספר (בלי גרש): 15 -> ['ט', 'ו'] */
function hebLetters(n) {
  if (n === 15) return ['ט', 'ו'];
  if (n === 16) return ['ט', 'ז'];
  const t = Math.floor(n / 10) * 10;
  const u = n % 10;
  return [t ? LETTER_OF[t] : '', u ? LETTER_OF[u] : ''].filter(Boolean);
}

/** מספר באותיות עבריות, עם גרש או גרשיים: 5 -> ה׳, 23 -> כ״ג, 15 -> ט״ו */
export function hebNum(n) {
  const ls = hebLetters(n);
  return ls.length === 1 ? ls[0] + GERESH : ls[0] + GERSHAYIM + ls[1];
}

const letterValue = (l) => LETTER_VALUES.find(([x]) => x === l)[1];
const HEB_HINT = 'כָּל אוֹת שָׁוָה מִסְפָּר: א׳ עַד ט׳ הֵם 1 עַד 9, י׳ = 10, כ׳ = 20, ל׳ = 30. מְחַבְּרִים אֶת הָאוֹתִיּוֹת.';
const TU_NOTE = 'אֶת 15 כּוֹתְבִים ט״ו (9 + 6), וְאֶת 16 כּוֹתְבִים ט״ז (9 + 7).';

function hebSteps(n) {
  const ls = hebLetters(n);
  if (ls.length === 1) return [`${ls[0]}${GERESH} שָׁוָה ${n}.`];
  const [a, b] = ls.map(letterValue);
  const steps = [`הָאוֹת ${ls[0]}${GERESH} שָׁוָה ${a}, וְהָאוֹת ${ls[1]}${GERESH} שָׁוָה ${b}.`, `${a} + ${b} = ${n}.`];
  if (n === 15 || n === 16) steps.push(`שִׂימוּ לֵב: ${TU_NOTE}`);
  return steps;
}

function hebRange(level) {
  if (level === 0) return ri(1, 10);
  if (level === 1) return Math.random() < 0.25 ? pick([15, 16]) : ri(11, 30);
  return Math.random() < 0.35 ? pick([15, 16]) : ri(11, 39);
}

function genHebRead(level = 0) {
  const n = hebRange(level);
  return Q({
    type: 'heb_read',
    topic: 'hebrew_nums',
    instruction: 'אֵיזֶה מִסְפָּר כָּתוּב בָּאוֹתִיּוֹת?',
    expr: hebNum(n),
    exprRtl: true,
    answer: n,
    hint: n === 15 || n === 16 ? TU_NOTE : HEB_HINT,
    steps: hebSteps(n),
  });
}

/** מסיחים בכתיב אותיות: שכנים, ובמקרה של 15/16 - הכתיב האסור י״ה / י״ו */
function hebDistractors(n, max = 39) {
  const near = [n - 1, n + 1, n + 10, n - 10, n + 2].filter((x) => x >= 1 && x <= max && x !== n).map(hebNum);
  const wrong = n === 15 ? ['י' + GERSHAYIM + 'ה'] : n === 16 ? ['י' + GERSHAYIM + 'ו'] : [];
  return [...wrong, ...shuffle(near)].slice(0, 3);
}

function genHebWrite(level = 0) {
  const n = hebRange(level);
  return Q({
    type: 'heb_write',
    topic: 'hebrew_nums',
    ui: 'choice',
    instruction: `אֵיךְ כּוֹתְבִים אֶת הַמִּסְפָּר ${n} בְּאוֹתִיּוֹת?`,
    options: choiceOptions(hebNum(n), hebDistractors(n)),
    answer: hebNum(n),
    hint: n === 15 || n === 16 ? TU_NOTE : 'מְפָרְקִים אֶת הַמִּסְפָּר לַעֲשָׂרוֹת וְלִיחִידוֹת, וְכוֹתְבִים אוֹת לְכָל חֵלֶק. הָאוֹת הַגְּדוֹלָה בָּאָה רִאשׁוֹנָה.',
    steps: [...hebSteps(n), `לָכֵן כּוֹתְבִים ${hebNum(n)}.`],
  });
}

function genHebDate(level = 0) {
  let day;
  let delta;
  if (level === 0) { day = ri(1, 9); delta = 1; }
  else if (level === 1) { delta = pick([1, -1]); day = delta > 0 ? pick([14, 15, ri(10, 28)]) : pick([16, 17, ri(11, 29)]); }
  else { delta = pick([7, 7, 1, -1, 2]); day = ri(Math.max(1, 1 - delta), Math.min(30, 30 - delta)); }
  const res = day + delta;
  const when = { 1: 'מָחָר', [-1]: 'אֶתְמוֹל', 2: 'מָחֳרָתַיִם', 7: 'בְּעוֹד שָׁבוּעַ' }[delta];
  const verb = delta > 0 ? 'יִהְיֶה' : 'הָיָה';
  return Q({
    type: 'heb_date',
    topic: 'hebrew_nums',
    ui: 'choice',
    instruction: `זֶה הַתַּאֲרִיךְ שֶׁל הַיּוֹם בַּלּוּחַ הָעִבְרִי. אֵיזֶה תַּאֲרִיךְ ${verb} ${when}?`,
    expr: `${hebNum(day)} בַּחֹדֶשׁ`,
    exprRtl: true,
    options: choiceOptions(hebNum(res), hebDistractors(res, 30)),
    answer: hebNum(res),
    hint: `קֹדֶם מְתַרְגְּמִים אֶת הַתַּאֲרִיךְ לְמִסְפָּר, וְאָז ${delta > 0 ? 'מוֹסִיפִים' : 'מוֹרִידִים'} ${Math.abs(delta)}.`,
    steps: [
      `${hebNum(day)} = ${day}.`,
      `${day} ${delta > 0 ? '+' : '-'} ${Math.abs(delta)} = ${res}.`,
      `${res} כּוֹתְבִים ${hebNum(res)}.`,
    ],
  });
}

/* ============================ ב. חיבור וחיסור במאונך ============================ */

const PLACE_NAMES = ['הַיְּחִידוֹת', 'הָעֲשָׂרוֹת', 'הַמֵּאוֹת'];
const digit = (n, i) => Math.floor(n / 10 ** i) % 10;
const len = (n) => String(n).length;

function addColumnSteps(a, b) {
  const steps = [];
  let carry = 0;
  const cols = Math.max(len(a), len(b));
  for (let i = 0; i < cols; i++) {
    const da = digit(a, i);
    const db = digit(b, i);
    const s = da + db + carry;
    let text = `עַמּוּדַת ${PLACE_NAMES[i]}: `;
    if (i >= len(b)) text += carry ? `${da} + 1 = ${s}.` : `מוֹרִידִים אֶת הַ-${da} כְּמוֹ שֶׁהוּא.`;
    else text += carry ? `${da} + ${db} + 1 = ${s}.` : `${da} + ${db} = ${s}.`;
    if (s >= 10) text += ` כּוֹתְבִים ${s % 10}, וְאֶת הָ-1 מַעֲבִירִים לְעַמּוּדַת ${PLACE_NAMES[i + 1]}.`;
    steps.push(text);
    carry = s >= 10 ? 1 : 0;
  }
  steps.push(`הַתְּשׁוּבָה: ${a} + ${b} = ${a + b}.`);
  return steps;
}

function subColumnSteps(a, b) {
  const steps = [];
  let borrow = 0;
  for (let i = 0; i < len(a); i++) {
    const orig = digit(a, i);
    const da = orig - borrow;
    const db = digit(b, i);
    let text = `עַמּוּדַת ${PLACE_NAMES[i]}: `;
    if (borrow) text += `(אַחֲרֵי שֶׁלָּקַחְנוּ 1, נִשְׁאַר כָּאן ${da}) `;
    borrow = 0;
    if (da < db) {
      text += `${da} קָטָן מִ-${db}, וְלָכֵן לוֹקְחִים 1 מֵעַמּוּדַת ${PLACE_NAMES[i + 1]}: ${da} + 10 = ${da + 10}, וְ-${da + 10} - ${db} = ${da + 10 - db}.`;
      borrow = 1;
    } else if (i >= len(b)) {
      text += `מוֹרִידִים אֶת הַ-${da} כְּמוֹ שֶׁהוּא.`;
    } else {
      text += `${da} - ${db} = ${da - db}.`;
    }
    steps.push(text);
  }
  steps.push(`הַתְּשׁוּבָה: ${a} - ${b} = ${a - b}.`);
  return steps;
}

const VERT_HINT_ADD = 'מַתְחִילִים מִיָּמִין - מֵעַמּוּדַת הַיְּחִידוֹת. אִם יוֹצֵא 10 אוֹ יוֹתֵר, כּוֹתְבִים רַק אֶת הַיְּחִידוֹת, וְאֶת הָעֲשֶׂרֶת מַעֲבִירִים לָעַמּוּדָה הַבָּאָה.';
const VERT_HINT_SUB = 'מַתְחִילִים מִיָּמִין - מֵעַמּוּדַת הַיְּחִידוֹת. אִם הַסִּפְרָה לְמַעְלָה קְטַנָּה מֵהַסִּפְרָה לְמַטָּה, לוֹקְחִים 1 מֵהָעַמּוּדָה הַבָּאָה (וְהִיא שָׁוָה 10 בָּעַמּוּדָה שֶׁלָּנוּ).';

function genVertAdd(level = 0) {
  let a, b;
  if (level === 0) {
    const ta = ri(1, 7); const tb = ri(1, 8 - ta); const ua = ri(0, 8); const ub = ri(0, 9 - ua);
    a = ta * 10 + ua; b = tb * 10 + ub;
  } else if (level === 1) {
    const ta = ri(1, 7); const tb = ri(1, 8 - ta); const ua = ri(1, 9); const ub = ri(10 - ua, 9);
    a = ta * 10 + ua; b = tb * 10 + ub;
  } else {
    a = ri(105, 689);
    b = Math.random() < 0.5 ? ri(15, 99) : ri(105, 899 - a);
    if (a + b > 999) b = ri(15, 999 - a);
  }
  return Q({
    type: 'vert_add',
    topic: 'vertical',
    ui: 'vertical',
    instruction: 'פִּתְרוּ בִּמְאֻנָּךְ:',
    vertical: { a, b, op: '+' },
    expr: `${a} + ${b} = ?`,
    answer: a + b,
    hint: VERT_HINT_ADD,
    steps: addColumnSteps(a, b),
  });
}

function genVertSub(level = 0) {
  let a, b;
  if (level === 0) {
    const ta = ri(2, 9); const tb = ri(1, ta - 1); const ua = ri(1, 9); const ub = ri(0, ua);
    a = ta * 10 + ua; b = tb * 10 + ub;
  } else if (level === 1) {
    const ta = ri(3, 9); const tb = ri(1, ta - 2); const ua = ri(0, 8); const ub = ri(ua + 1, 9);
    a = ta * 10 + ua; b = tb * 10 + ub;
  } else {
    // תלת-ספרתי: פריטה אחת או שתיים, בלי אפס בעשרות (כדי שלא תהיה פריטה כפולה)
    const h = ri(2, 9); const t = ri(1, 9); const u = ri(0, 9);
    a = h * 100 + t * 10 + u;
    b = Math.random() < 0.5 ? ri(12, 99) : ri(101, a - 11);
    if (b >= a) b = ri(12, 99);
  }
  return Q({
    type: 'vert_sub',
    topic: 'vertical',
    ui: 'vertical',
    instruction: 'פִּתְרוּ בִּמְאֻנָּךְ:',
    vertical: { a, b, op: '-' },
    expr: `${a} - ${b} = ?`,
    answer: a - b,
    hint: VERT_HINT_SUB,
    steps: subColumnSteps(a, b),
  });
}

/** ספרה חסרה בתרגיל במאונך */
function genVertMissing(level = 1) {
  const ta = ri(1, 6); const tb = ri(1, 8 - ta);
  const ua = ri(0, 9); const ub = ri(0, 9);
  const a = ta * 10 + ua; const b = tb * 10 + ub;
  const res = a + b;
  const row = pick(['a', 'b']);
  const place = level >= 2 ? pick([0, 1]) : 0;
  const n = row === 'a' ? a : b;
  const ans = digit(n, place);
  const carry = ua + ub >= 10 ? 1 : 0;
  const other = row === 'a' ? b : a;
  const steps = place === 0
    ? [`בְּעַמּוּדַת הַיְּחִידוֹת: ${ans} + ${digit(other, 0)} = ${ans + digit(other, 0)}, וְכָךְ מְקַבְּלִים ${digit(res, 0)} בַּיְּחִידוֹת.`]
    : [
      carry ? `בְּעַמּוּדַת הַיְּחִידוֹת: ${ua} + ${ub} = ${ua + ub}, וְעוֹבֵר 1 לָעֲשָׂרוֹת.` : `בְּעַמּוּדַת הַיְּחִידוֹת: ${ua} + ${ub} = ${ua + ub}, בְּלִי מַעֲבָר.`,
      carry ? `בְּעַמּוּדַת הָעֲשָׂרוֹת: ${ans} + ${digit(other, 1)} + 1 = ${ans + digit(other, 1) + 1}.` : `בְּעַמּוּדַת הָעֲשָׂרוֹת: ${ans} + ${digit(other, 1)} = ${ans + digit(other, 1)}.`,
    ];
  steps.push(`הַסִּפְרָה הַחֲסֵרָה הִיא ${ans}: ${a} + ${b} = ${res}.`);
  return Q({
    type: 'vert_missing',
    topic: 'vertical',
    ui: 'vertical',
    instruction: 'אֵיזוֹ סִפְרָה חֲסֵרָה בַּתַּרְגִּיל?',
    vertical: { a, b, op: '+', result: res, hide: { row, place } },
    answer: ans,
    hint: place === 0
      ? 'בּוֹדְקִים אֶת עַמּוּדַת הַיְּחִידוֹת: אֵיזוֹ סִפְרָה צָרִיךְ לְהוֹסִיף כְּדֵי לְקַבֵּל אֶת הַסִּפְרָה בַּתּוֹצָאָה?'
      : 'קֹדֶם פּוֹתְרִים אֶת עַמּוּדַת הַיְּחִידוֹת וּבוֹדְקִים אִם עוֹבֵר 1 לָעֲשָׂרוֹת. אַחַר כָּךְ מְחַפְּשִׂים אֶת הַסִּפְרָה בָּעֲשָׂרוֹת.',
    steps,
  });
}

/* ============================ ב. כפל וחילוק ============================ */

function multFactors(level) {
  if (level === 0) return Math.random() < 0.3 ? [pick([2, 5, 10]), ri(1, 5)] : [ri(1, 5), ri(1, 5)];
  if (level === 1) return Math.random() < 0.25 ? [pick([2, 5, 10]), ri(2, 9)] : [ri(2, 6), ri(2, 6)];
  return [ri(2, 10), ri(2, 10)];
}

/** פתרון בשלבים לתרגיל כפל: חיבור חוזר, או פירוק ל-5 ועוד */
function multSteps(a, b) {
  const p = a * b;
  if (b <= 5) return [`${a} × ${b} זֶה ${b} פְּעָמִים ${a}: ${repeatAdd(a, b)}.`, `${a} × ${b} = ${p}.`];
  if (a <= 5) return [`${a} × ${b} = ${b} × ${a}, כִּי בְּכֶפֶל אֶפְשָׁר לְהַחְלִיף אֶת הַסֵּדֶר.`, `${b} × ${a} זֶה ${a} פְּעָמִים ${b}: ${repeatAdd(b, a)}.`];
  if (b === 10) return [`כְּשֶׁכּוֹפְלִים בְּ-10, מוֹסִיפִים 0 בַּסּוֹף: ${a} × 10 = ${p}.`];
  return [
    `מְפָרְקִים: ${b} = 5 + ${b - 5}.`,
    `${a} × 5 = ${a * 5}, וְ-${a} × ${b - 5} = ${a * (b - 5)}.`,
    `${a * 5} + ${a * (b - 5)} = ${p}, וְלָכֵן ${a} × ${b} = ${p}.`,
  ];
}

function genMultGroups(level = 0) {
  const groups = ri(2, level === 0 ? 4 : 6);
  const each = ri(2, level === 0 ? 5 : 6);
  const total = groups * each;
  return Q({
    type: 'mult_groups',
    topic: 'mult_div',
    figure: { kind: 'groups', groups, each },
    instruction: `יֵשׁ ${groups} קְבוּצוֹת, וּבְכָל קְבוּצָה ${each} פּוֹקָדוֹרִים. כַּמָּה פּוֹקָדוֹרִים יֵשׁ בְּסַךְ הַכֹּל?`,
    answer: total,
    hint: `אֶפְשָׁר לִסְפֹּר בִּקְפִיצוֹת שֶׁל ${each}: קְבוּצָה אַחַר קְבוּצָה.`,
    steps: [`${repeatAdd(each, groups)}.`, `כְּלוֹמַר ${groups} × ${each} = ${total}.`],
  });
}

function genMultArray(level = 0) {
  const rows = ri(2, level === 0 ? 3 : 5);
  const cols = ri(2, level === 0 ? 5 : 8);
  const total = rows * cols;
  return Q({
    type: 'mult_array',
    topic: 'mult_div',
    figure: { kind: 'array', rows, cols },
    instruction: 'כַּמָּה פּוֹקָדוֹרִים יֵשׁ בַּמַּעֲרָךְ?',
    answer: total,
    hint: 'סוֹפְרִים כַּמָּה שׁוּרוֹת יֵשׁ, וְכַמָּה פּוֹקָדוֹרִים יֵשׁ בְּכָל שׁוּרָה.',
    steps: [`יֵשׁ ${rows} שׁוּרוֹת, וּבְכָל שׁוּרָה ${cols} פּוֹקָדוֹרִים.`, `${repeatAdd(cols, rows)}.`, `כְּלוֹמַר ${rows} × ${cols} = ${total}.`],
  });
}

function genMultFact(level = 0) {
  const [a, b] = multFactors(level);
  return Q({
    type: 'mult_fact',
    topic: 'mult_div',
    expr: `${a} × ${b} = ?`,
    answer: a * b,
    hint: `${a} × ${b} זֶה ${b} פְּעָמִים ${a}. אֶפְשָׁר לִסְפֹּר בִּקְפִיצוֹת שֶׁל ${a}.`,
    steps: multSteps(a, b),
  });
}

function genDivFact(level = 1) {
  const [a, b] = multFactors(Math.max(1, level));
  const p = a * b;
  return Q({
    type: 'div_fact',
    topic: 'mult_div',
    expr: `${p} : ${a} = ?`,
    answer: b,
    hint: `חוֹשְׁבִים עַל כֶּפֶל: אֵיזֶה מִסְפָּר כָּפוּל ${a} נוֹתֵן ${p}?`,
    steps: [`${a} × ${b} = ${p}.`, `לָכֵן ${p} : ${a} = ${b}.`],
  });
}

function genMultMissing(level = 1) {
  const [a, b] = multFactors(level);
  const p = a * b;
  const first = Math.random() < 0.5;
  return Q({
    type: 'mult_missing',
    topic: 'mult_div',
    instruction: 'אֵיזֶה מִסְפָּר חָסֵר?',
    expr: first ? `? × ${b} = ${p}` : `${a} × ? = ${p}`,
    answer: first ? a : b,
    hint: `סוֹפְרִים בִּקְפִיצוֹת שֶׁל ${first ? b : a} עַד שֶׁמַּגִּיעִים לְ-${p}. כַּמָּה קְפִיצוֹת הָיוּ?`,
    steps: [`${a} × ${b} = ${p}.`, `הַמִּסְפָּר הֶחָסֵר הוּא ${first ? a : b}.`],
  });
}

function genMultZeroOne(level = 0) {
  const n = level === 2 ? ri(11, 99) : ri(2, 10);
  const form = pick(level === 0 ? ['n×1', '1×n', 'n×0', '0×n'] : ['n×1', 'n×0', '0×n', 'n:1', 'n:n', '0:n']);
  const table = {
    'n×1': [`${n} × 1 = ?`, n, 'כָּל מִסְפָּר כָּפוּל 1 נִשְׁאָר אוֹתוֹ מִסְפָּר.'],
    '1×n': [`1 × ${n} = ?`, n, 'כָּל מִסְפָּר כָּפוּל 1 נִשְׁאָר אוֹתוֹ מִסְפָּר.'],
    'n×0': [`${n} × 0 = ?`, 0, 'כָּל מִסְפָּר כָּפוּל 0 שָׁוֶה 0: אֶפֶס פְּעָמִים - אֵין כְּלוּם.'],
    '0×n': [`0 × ${n} = ?`, 0, `${n} פְּעָמִים 0 - זֶה עֲדַיִן 0.`],
    'n:1': [`${n} : 1 = ?`, n, 'כְּשֶׁמְּחַלְּקִים לְקְבוּצָה אַחַת - הַכֹּל נִשְׁאָר בָּהּ.'],
    'n:n': [`${n} : ${n} = ?`, 1, 'מִסְפָּר לְחַלֵּק לְעַצְמוֹ שָׁוֶה 1.'],
    '0:n': [`0 : ${n} = ?`, 0, 'כְּשֶׁאֵין מָה לְחַלֵּק, כָּל אֶחָד מְקַבֵּל 0.'],
  };
  const [expr, ans, why] = table[form];
  return Q({
    type: 'mult_zero_one',
    topic: 'mult_div',
    expr,
    answer: ans,
    hint: form.includes('0') ? 'מָה קוֹרֶה כְּשֶׁיֵּשׁ 0 בְּתַרְגִּיל כֶּפֶל אוֹ חִלּוּק?' : 'מָה קוֹרֶה כְּשֶׁכּוֹפְלִים אוֹ מְחַלְּקִים בְּ-1, אוֹ מְחַלְּקִים מִסְפָּר בְּעַצְמוֹ?',
    steps: [why, expr.replace('?', String(ans))],
  });
}

/* ============================ ב. קפיצות של 2, 5 ו-10 ============================ */

function genSkipSeq(level = 0) {
  const step = level === 0 ? pick([2, 10]) : pick([2, 5, 10, 5]);
  const len6 = 6;
  let start;
  if (level === 0) start = step * ri(0, 4);
  else if (level === 1) start = step * ri(0, Math.floor(60 / step));
  else start = Math.random() < 0.5 ? ri(1, 9) + step * ri(0, 6) : step * ri(10, Math.floor(900 / step));
  const down = level >= 1 && Math.random() < 0.3;
  const s = down ? -step : step;
  const first = down ? start + step * (len6 - 1) : start;
  const values = Array.from({ length: len6 }, (_, i) => first + s * i);
  const blanks = shuffle([2, 3, 4, 5]).slice(0, level === 0 ? 1 : 2).sort((x, y) => x - y);
  return Q({
    type: 'skip_seq',
    topic: 'divisibility',
    ui: 'numberline_fill',
    stones: values.map((v, i) => ({ value: v, blank: blanks.includes(i) })),
    instruction: `קִפְצוּ ${down ? 'אֲחוֹרָה' : 'קָדִימָה'} בִּקְפִיצוֹת שֶׁל ${step} וְהַשְׁלִימוּ:`,
    answer: blanks.map((i) => values[i]),
    answerText: blanks.map((i) => fmt(values[i])).join(', '),
    hint: `בְּכָל קְפִיצָה ${down ? 'מוֹרִידִים' : 'מוֹסִיפִים'} ${step}.`,
    steps: [`${fmt(values[0])} ${down ? '-' : '+'} ${step} = ${fmt(values[1])}, וְכָךְ הָלְאָה.`, `הַסִּדְרָה: ${values.map(fmt).join(', ')}.`],
  });
}

function genJumps(level = 0) {
  const step = level === 0 ? pick([2, 10]) : pick([2, 5, 10]);
  const maxK = level === 0 ? 8 : 10;
  const k = ri(2, maxK);
  const target = step * k;
  const hop = Array.from({ length: Math.min(k, 5) + 1 }, (_, i) => step * i);
  const list = k <= 5 ? hop.join(', ') : `${hop.join(', ')}, ..., ${target}`;
  const story = Math.random() < 0.5
    ? `פּוֹלִיוָג קוֹפֵץ עַל יְשַׁר הַמִּסְפָּרִים מִ-0, בִּקְפִיצוֹת שֶׁל [[${step}]]. כַּמָּה קְפִיצוֹת הוּא צָרִיךְ כְּדֵי לְהַגִּיעַ לְ-[[${target}]]?`
    : `כַּמָּה פְּעָמִים [[${step}]] נִכְנָס בְּ-[[${target}]]?`;
  return Q({
    type: 'jumps',
    topic: 'divisibility',
    ui: 'mission',
    instruction: 'חִידַת קְפִיצוֹת:',
    story,
    answer: k,
    hint: `סוֹפְרִים בִּקְפִיצוֹת שֶׁל ${step} מִ-0 עַד ${target}, וְסוֹפְרִים כַּמָּה קְפִיצוֹת הָיוּ.`,
    steps: [`סוֹפְרִים: ${list}.`, `הָיוּ ${k} קְפִיצוֹת, כִּי ${k} × ${step} = ${target}.`],
  });
}

const DIV_RULE = {
  2: 'בִּקְפִיצוֹת שֶׁל 2 מִ-0 מַגִּיעִים רַק לְמִסְפָּרִים זוּגִיִּים: סִפְרַת הַיְּחִידוֹת הִיא 0, 2, 4, 6 אוֹ 8.',
  5: 'בִּקְפִיצוֹת שֶׁל 5 מִ-0 מַגִּיעִים רַק לְמִסְפָּרִים שֶׁנִּגְמָרִים בְּ-0 אוֹ בְּ-5.',
  10: 'בִּקְפִיצוֹת שֶׁל 10 מִ-0 מַגִּיעִים רַק לְמִסְפָּרִים שֶׁנִּגְמָרִים בְּ-0.',
};
const divides = (step, n) => n % step === 0;

function genDivSign(level = 0) {
  const step = level === 0 ? pick([2, 10]) : pick([2, 5, 10]);
  const max = level === 0 ? 50 : level === 1 ? 100 : 999;
  let correct = step * ri(2, Math.floor(max / step));
  if (level === 2 && correct < 100) correct += 100 * ri(1, 8);
  const wrongs = new Set();
  let guard = 0;
  while (wrongs.size < 3 && guard++ < 100) {
    let w = ri(11, max);
    if (step === 10 && Math.random() < 0.5) w = Math.floor(w / 10) * 10 + 5;      // מלכודת: נגמר ב-5
    if (step === 5 && Math.random() < 0.4) w = Math.floor(w / 10) * 10 + pick([2, 4, 6, 8]);
    if (!divides(step, w) && w <= max) wrongs.add(w);
  }
  return Q({
    type: 'div_sign',
    topic: 'divisibility',
    ui: 'choice',
    instruction: `לְאֵיזֶה מִסְפָּר אֶפְשָׁר לְהַגִּיעַ מִ-0 בִּקְפִיצוֹת שֶׁל ${step}?`,
    options: choiceOptions(fmt(correct), [...wrongs].map(fmt), true),
    answer: fmt(correct),
    hint: 'מִסְתַּכְּלִים עַל סִפְרַת הַיְּחִידוֹת שֶׁל כָּל מִסְפָּר.',
    steps: [DIV_RULE[step], `${fmt(correct)} נִגְמָר בְּ-${correct % 10}, וְלָכֵן מַגִּיעִים אֵלָיו.`],
  });
}

function genLandOn(level = 1) {
  const step = pick(level === 0 ? [2, 10] : [2, 5, 10]);
  const yes = Math.random() < 0.5;
  const max = level === 2 ? 990 : 100;
  let n = step * ri(3, Math.floor(max / step));
  if (!yes) n += step === 2 ? 1 : pick(step === 5 ? [1, 2, 3, 4] : [3, 5, 7]);
  return Q({
    type: 'land_on',
    topic: 'divisibility',
    ui: 'choice',
    noShuffle: true,
    instruction: `הַאִם קוֹפְצִים מִ-0 בִּקְפִיצוֹת שֶׁל ${step} מַגִּיעִים בְּדִיּוּק לְ-${fmt(n)}?`,
    options: [opt(YES, yes), opt(NO, !yes)],
    answer: yes ? YES : NO,
    hint: 'אֵין צֹרֶךְ לִקְפֹּץ אֶת כָּל הַדֶּרֶךְ. מִסְתַּכְּלִים עַל סִפְרַת הַיְּחִידוֹת.',
    steps: [DIV_RULE[step], `${fmt(n)} נִגְמָר בְּ-${n % 10}, וְלָכֵן ${yes ? 'מַגִּיעִים אֵלָיו' : 'לֹא מַגִּיעִים אֵלָיו'}.`],
  });
}

/* ============================ ב. סוגריים ============================ */

/** חישוב של שני מספרים */
const calc = (x, op, y) => (op === '+' ? x + y : op === '-' ? x - y : op === '×' ? x * y : x / y);

/** תרגיל עם סוגריים: (a op1 b) op2 c  או  a op1 (b op2 c) */
function parenExpr(a, op1, b, op2, c, leftFirst) {
  if (leftFirst) {
    const inner = calc(a, op1, b);
    return { text: `(${a} ${op1} ${b}) ${op2} ${c}`, inner: `${a} ${op1} ${b}`, iv: inner, rest: `${inner} ${op2} ${c}`, value: calc(inner, op2, c) };
  }
  const inner = calc(b, op2, c);
  return { text: `${a} ${op1} (${b} ${op2} ${c})`, inner: `${b} ${op2} ${c}`, iv: inner, rest: `${a} ${op1} ${inner}`, value: calc(a, op1, inner) };
}

function parenCase(level) {
  for (let guard = 0; guard < 50; guard++) {
    let a, b, c, op1, op2, leftFirst;
    if (level === 0) {
      [op1, op2] = pick([['+', '+'], ['+', '-'], ['-', '+'], ['-', '-']]);
      a = ri(5, 20); b = ri(2, 10); c = ri(1, 9);
      leftFirst = Math.random() < 0.5;
    } else if (level === 1) {
      [op1, op2, leftFirst] = pick([['×', '+', true], ['+', '×', false], ['×', '-', true], ['-', '-', false], ['+', '+', false]]);
      a = ri(2, 9); b = ri(2, 6); c = ri(1, 9);
      if (op1 === '-') { a = ri(12, 30); b = ri(6, 10); c = ri(1, 5); }
    } else {
      [op1, op2, leftFirst] = pick([['+', '×', true], ['-', '×', true], ['×', '+', false], ['-', '-', false], ['×', '-', false], ['×', '+', true]]);
      a = ri(2, 12); b = ri(2, 9); c = ri(2, 6);
      if (op1 === '-' && !leftFirst) { a = ri(15, 40); b = ri(6, 15); c = ri(1, 5); }
    }
    const e = parenExpr(a, op1, b, op2, c, leftFirst);
    if (e.iv >= 0 && e.value >= 0 && e.value <= 100 && Number.isInteger(e.value)) return { ...e, a, b, c, op1, op2, leftFirst };
  }
  return { ...parenExpr(5, '×', 2, '+', 3, true), a: 5, b: 2, c: 3, op1: '×', op2: '+', leftFirst: true };
}

const PAREN_HINT = 'קֹדֶם פּוֹתְרִים אֶת מָה שֶׁבְּתוֹךְ הַסּוֹגְרַיִם, וְרַק אַחַר כָּךְ אֶת הַשְּׁאָר.';

function genParenEval(level = 0) {
  const e = parenCase(level);
  return Q({
    type: 'paren_eval',
    topic: 'parens',
    expr: `${e.text} = ?`,
    answer: e.value,
    hint: PAREN_HINT,
    steps: [`קֹדֶם הַסּוֹגְרַיִם: ${e.inner} = ${e.iv}.`, `אַחַר כָּךְ: ${e.rest} = ${e.value}.`],
  });
}

/** איפה לשים סוגריים כדי לקבל תוצאה מסוימת */
function genParenPlace(level = 1) {
  for (let guard = 0; guard < 60; guard++) {
    const [op1, op2] = pick(level >= 2 ? [['-', '-'], ['+', '×'], ['×', '+'], ['-', '×']] : [['-', '-'], ['+', '×'], ['×', '+']]);
    const a = op1 === '-' ? ri(12, 30) : ri(2, 9);
    const b = op1 === '-' && op2 === '-' ? ri(5, 11) : ri(2, 6);
    const c = op2 === '-' ? ri(1, 4) : ri(2, 5);
    const L = parenExpr(a, op1, b, op2, c, true);
    const R = parenExpr(a, op1, b, op2, c, false);
    const ok = (e) => e.iv >= 0 && e.value >= 0 && e.value <= 100 && Number.isInteger(e.value);
    if (!ok(L) || !ok(R) || L.value === R.value) continue;
    const right = Math.random() < 0.5 ? L : R;
    const wrong = right === L ? R : L;
    return Q({
      type: 'paren_place',
      topic: 'parens',
      ui: 'choice',
      instruction: `אֵיפֹה צָרִיךְ לָשִׂים סוֹגְרַיִם, כְּדֵי שֶׁהַתּוֹצָאָה תִּהְיֶה ${right.value}?`,
      options: shuffle([opt(right.text, true, true), opt(wrong.text, false, true)]),
      answer: right.text,
      hint: 'בּוֹדְקִים כָּל אֶפְשָׁרוּת: פּוֹתְרִים קֹדֶם אֶת הַסּוֹגְרַיִם, וּבוֹדְקִים מָה יוֹצֵא.',
      steps: [
        `${right.text} = ${right.rest} = ${right.value} ✔`,
        `${wrong.text} = ${wrong.rest} = ${wrong.value} ✘`,
      ],
    });
  }
  return genParenEval(level);
}

/** השוואה בין שני תרגילים עם סוגריים במקומות שונים */
function genParenCompare(level = 1) {
  const [op1, op2] = pick([['+', '+'], ['-', '-'], ['-', '+'], ['+', '-']]);
  const a = ri(15, 40); const b = ri(4, 12); const c = ri(1, 3);
  const L = parenExpr(a, op1, b, op2, c, true);
  const R = parenExpr(a, op1, b, op2, c, false);
  const sign = L.value < R.value ? '<' : L.value > R.value ? '>' : '=';
  return Q({
    type: 'paren_compare',
    topic: 'parens',
    ui: 'choice',
    noShuffle: true,
    instruction: 'אֵיזֶה סִימָן מַתְאִים בִּמְקוֹם הָרִבּוּעַ?',
    expr: `${L.text} ▢ ${R.text}`,
    options: [opt('<', sign === '<', true), opt('=', sign === '=', true), opt('>', sign === '>', true)],
    answer: sign,
    hint: 'פּוֹתְרִים כָּל צַד לְחוּד - קֹדֶם אֶת הַסּוֹגְרַיִם.',
    steps: [`${L.text} = ${L.rest} = ${L.value}.`, `${R.text} = ${R.rest} = ${R.value}.`, `לָכֵן: ${ltrIsolate(`${L.value} ${sign} ${R.value}`)}`],
  });
}

/* ============================ ב. שאלות כפל וחילוק ============================ */

const PARTS = [
  { one: 'כִּסֵּא', many: 'כִּסְאוֹת', k: 4, part: 'רַגְלַיִם' },
  { one: 'שֻׁלְחָן', many: 'שֻׁלְחָנוֹת', k: 4, part: 'רַגְלַיִם' },
  { one: 'כֶּלֶב', many: 'כְּלָבִים', k: 4, part: 'רַגְלַיִם' },
  { one: 'תַּרְנְגֹלֶת', many: 'תַּרְנְגוֹלוֹת', k: 2, part: 'רַגְלַיִם' },
  { one: 'חִפּוּשִׁית', many: 'חִפּוּשִׁיּוֹת', k: 6, part: 'רַגְלַיִם' },
  { one: 'עַכָּבִישׁ', many: 'עַכָּבִישִׁים', k: 8, part: 'רַגְלַיִם' },
  { one: 'יָד', many: 'יָדַיִם', k: 5, part: 'אֶצְבָּעוֹת' },
  { one: 'מְכוֹנִית', many: 'מְכוֹנִיּוֹת', k: 4, part: 'גַּלְגַּלִּים' },
  { one: 'תְּלַת-אוֹפַן', many: 'תְּלַת-אוֹפַנִּים', k: 3, part: 'גַּלְגַּלִּים' },
];

function genWmGroups(level = 0) {
  if (Math.random() < 0.5) {
    const it = pick(level === 0 ? PARTS.filter((x) => x.k <= 5) : PARTS);
    const n = ri(2, Math.min(level === 0 ? 5 : 10, Math.floor(100 / it.k)));
    return Q({
      type: 'wm_groups', topic: 'word_mult', ui: 'mission', instruction: 'מְשִׂימַת כֶּפֶל:', unit: it.part,
      story: `לְכָל ${it.one} יֵשׁ [[${it.k}]] ${it.part}. כַּמָּה ${it.part} יֵשׁ לְ-[[${n}]] ${it.many}?`,
      answer: n * it.k,
      hint: `סוֹפְרִים בִּקְפִיצוֹת שֶׁל ${it.k}, פַּעַם אַחַת לְכָל ${it.one}.`,
      steps: n <= 6 ? [`${repeatAdd(it.k, n)}.`, `כְּלוֹמַר ${n} × ${it.k} = ${n * it.k}.`] : [`${n} × ${it.k} = ${n * it.k}.`],
    });
  }
  const k = ri(2, level === 0 ? 5 : 10);
  const n = ri(2, level === 0 ? 5 : Math.min(10, Math.floor(100 / k)));
  return Q({
    type: 'wm_groups', topic: 'word_mult', ui: 'mission', instruction: 'מְשִׂימַת כֶּפֶל:', unit: 'פּוֹקָדוֹרִים',
    story: `בְּכָל קֻפְסָה יֵשׁ [[${k}]] פּוֹקָדוֹרִים. כַּמָּה פּוֹקָדוֹרִים יֵשׁ בְּ-[[${n}]] קֻפְסָאוֹת?`,
    answer: n * k,
    hint: `${n} קֻפְסָאוֹת, וּבְכָל אַחַת ${k}: זֶה ${n} פְּעָמִים ${k}.`,
    steps: n <= 6 ? [`${repeatAdd(k, n)}.`, `כְּלוֹמַר ${n} × ${k} = ${n * k}.`] : [`${n} × ${k} = ${n * k}.`],
  });
}

const SHARE_THINGS = ['סֻכָּרִיּוֹת', 'מַדְבֵּקוֹת', 'קְלָפֵי פּוֹקִימוֹן', 'גֻּלּוֹת'];

function genWmShare(level = 1) {
  const kids = ri(2, level === 0 ? 4 : 6);
  const each = ri(2, level === 0 ? 5 : 9);
  const total = kids * each;
  const th = pick(SHARE_THINGS);
  return Q({
    type: 'wm_share', topic: 'word_mult', ui: 'mission', instruction: 'מְשִׂימַת חֲלֻקָּה:', unit: th,
    story: `מְחַלְּקִים [[${total}]] ${th} שָׁוֶה בְּשָׁוֶה בֵּין [[${kids}]] יְלָדִים. כַּמָּה ${th} יְקַבֵּל כָּל יֶלֶד?`,
    answer: each,
    hint: `אֵיזֶה מִסְפָּר כָּפוּל ${kids} נוֹתֵן ${total}? אֶפְשָׁר גַּם "לְחַלֵּק" אַחַת-אַחַת לְכָל יֶלֶד.`,
    steps: [`${total} : ${kids} = ${each}.`, `בְּדִיקָה: ${kids} × ${each} = ${total} ✔`],
  });
}

function genWmContain(level = 1) {
  const p = pick(PEOPLE);
  const per = ri(2, level === 0 ? 5 : 10);
  const packs = ri(2, level === 0 ? 5 : Math.min(10, Math.floor(100 / per)));
  const total = per * packs;
  return Q({
    type: 'wm_contain', topic: 'word_mult', ui: 'mission', instruction: 'מְשִׂימַת חֲלֻקָּה:', unit: 'חֲפִיסוֹת',
    story: `לְ${p.n} יֵשׁ [[${total}]] קְלָפֵי פּוֹקִימוֹן. ${g(p, 'הוּא שָׂם', 'הִיא שָׂמָה')} [[${per}]] קְלָפִים בְּכָל חֲפִיסָה. כַּמָּה חֲפִיסוֹת ${g(p, 'הוּא מִלֵּא', 'הִיא מִלְּאָה')}?`,
    answer: packs,
    hint: `כַּמָּה פְּעָמִים ${per} נִכְנָס בְּ-${total}? אֶפְשָׁר לִסְפֹּר בִּקְפִיצוֹת שֶׁל ${per}.`,
    steps: [`${total} : ${per} = ${packs}.`, `בְּדִיקָה: ${packs} × ${per} = ${total} ✔`],
  });
}

function genWmBuy(level = 1) {
  const price = pick(level === 0 ? [2, 5, 10] : [2, 3, 4, 5, 6, 10]);
  const n = ri(2, Math.min(10, Math.floor(100 / price)));
  const total = price * n;
  if (level === 0 || Math.random() < 0.5) {
    return Q({
      type: 'wm_buy', topic: 'word_mult', ui: 'mission', instruction: 'בַּחֲנוּת:', unit: SHEKELS,
      story: `כַּרְטִיס לְמִשְׂחַק פּוֹקִימוֹן עוֹלֶה [[${price}]] שְׁקָלִים. כַּמָּה עוֹלִים [[${n}]] כַּרְטִיסִים?`,
      answer: total,
      hint: `כָּל כַּרְטִיס עוֹלֶה ${price}. מְחַבְּרִים ${price} שׁוּב וָשׁוּב, ${n} פְּעָמִים.`,
      steps: [`${n} × ${price} = ${total}.`, `${n} כַּרְטִיסִים עוֹלִים ${total} שְׁקָלִים.`],
    });
  }
  return Q({
    type: 'wm_buy', topic: 'word_mult', ui: 'mission', instruction: 'בַּחֲנוּת:', unit: 'כַּרְטִיסִים',
    story: `כַּרְטִיס לְמִשְׂחַק פּוֹקִימוֹן עוֹלֶה [[${price}]] שְׁקָלִים. כַּמָּה כַּרְטִיסִים אֶפְשָׁר לִקְנוֹת בְּ-[[${total}]] שְׁקָלִים?`,
    answer: n,
    hint: `כַּמָּה פְּעָמִים ${price} נִכְנָס בְּ-${total}?`,
    steps: [`${total} : ${price} = ${n}.`, `בְּדִיקָה: ${n} × ${price} = ${total} ✔`],
  });
}

/* ============================ ג. ישר המספרים ============================ */

function axisSetup(level) {
  if (level === 0) return { from: 0, step: 1, count: 11, labels: [0, 5, 10] };
  if (level === 1) return pick([{ from: 0, step: 10, count: 11, labels: [0, 5, 10] }, { from: 0, step: 5, count: 11, labels: [0, 2, 4, 6, 8, 10] }]);
  return pick([
    { from: 0, step: 100, count: 11, labels: [0, 5, 10] },
    { from: 100 * ri(1, 8), step: 10, count: 11, labels: [0, 10] },
    { from: 0, step: 50, count: 11, labels: [0, 2, 4, 6, 8, 10] },
  ]);
}

function genNlLocate(level = 0) {
  const ax = axisSetup(level);
  const idx = pick(range(1, ax.count - 2).filter((i) => !ax.labels.includes(i)));
  const target = ax.from + idx * ax.step;
  return Q({
    type: 'nl_locate',
    topic: 'numberline',
    ui: 'numberline_locate',
    instruction: 'לַחֲצוּ עַל הַשְּׁנָתָה הַנְּכוֹנָה בַּיָּשָׁר.',
    stones: Array.from({ length: ax.count }, (_, i) => ({ value: ax.from + i * ax.step, blank: !ax.labels.includes(i) })),
    target,
    correctIndex: idx,
    answer: target,
    hint: `כָּל שְׁנָתָה הִיא קְפִיצָה שֶׁל ${ax.step}. מַתְחִילִים מִמִּסְפָּר כָּתוּב קָרוֹב, וְסוֹפְרִים קְפִיצוֹת.`,
    steps: [`בֵּין שְׁנָתָה לִשְׁנָתָה יֵשׁ ${ax.step}.`, `${fmt(target)} נִמְצָא ${idx} קְפִיצוֹת אַחֲרֵי ${fmt(ax.from)}.`],
  });
}

function genNlRead(level = 0) {
  const ax = axisSetup(level);
  const idx = pick(range(1, ax.count - 2).filter((i) => !ax.labels.includes(i)));
  const val = ax.from + idx * ax.step;
  const near = ax.labels.reduce((best, l) => (Math.abs(l - idx) < Math.abs(best - idx) ? l : best), ax.labels[0]);
  const nearVal = ax.from + near * ax.step;
  const d = idx - near;
  const walk = Array.from({ length: Math.abs(d) + 1 }, (_, i) => fmt(nearVal + Math.sign(d) * i * ax.step)).join(', ');
  return Q({
    type: 'nl_read',
    topic: 'numberline',
    figure: { kind: 'axis', ...ax, mark: idx },
    instruction: 'אֵיזֶה מִסְפָּר מְסֻמָּן בְּפוֹקָדוֹר?',
    answer: val,
    hint: `כָּל שְׁנָתָה הִיא קְפִיצָה שֶׁל ${ax.step}. מַתְחִילִים מֵהַמִּסְפָּר הַכָּתוּב הַקָּרוֹב וְסוֹפְרִים.`,
    steps: [`בֵּין שְׁנָתָה לִשְׁנָתָה יֵשׁ ${ax.step}.`, `סוֹפְרִים מִ-${fmt(nearVal)}: ${walk}.`, `הַמִּסְפָּר הַמְּסֻמָּן: ${fmt(val)}.`],
  });
}

/** מספרים שליליים: מדחום ומעלית (בחירה, כי במקלדת אין מינוס) */
function genNlNegative(level = 1) {
  const kind = pick(['temp', 'lift', 'axis']);
  if (kind === 'axis') {
    const idx = pick([0, 1, 2, 3, 4, 6, 7, 8, 9, 10].filter((i) => i !== 5 && i !== 0 && i !== 10));
    const val = idx - 5;
    const wrongs = [-val, val + 1, val - 1].filter((w) => w !== val && w >= -6 && w <= 6);
    return Q({
      type: 'nl_negative', topic: 'numberline', ui: 'choice',
      figure: { kind: 'axis', from: -5, step: 1, count: 11, labels: [0, 5, 10], mark: idx },
      instruction: 'אֵיזֶה מִסְפָּר מְסֻמָּן בְּפוֹקָדוֹר?',
      options: choiceOptions(String(val), wrongs.map(String), true),
      answer: String(val),
      hint: 'מִשְּׂמֹאל לָאֶפֶס נִמְצָאִים הַמִּסְפָּרִים הַשְּׁלִילִיִּים: 1-, 2-, 3-... סוֹפְרִים מֵהָאֶפֶס.',
      steps: [`הַפּוֹקָדוֹר נִמְצָא ${Math.abs(val)} שְׁנָתוֹת ${val < 0 ? 'מִשְּׂמֹאל' : 'מִיָּמִין'} לָאֶפֶס.`, `לָכֵן הַמִּסְפָּר הוּא ${ltrIsolate(String(val))}.`],
    });
  }
  const start = ri(1, 6);
  const drop = ri(start + 1, start + 5);
  const res = start - drop;
  const wrongs = [-res, res - 1, res + 1, start + drop];
  if (kind === 'temp') {
    return Q({
      type: 'nl_negative', topic: 'numberline', ui: 'choice',
      instruction: 'מְשִׂימַת מַדְחֹם:',
      story: `בָּעֶרֶב הַמַּדְחֹם הֶרְאָה [[${start}]] מַעֲלוֹת. בַּלַּיְלָה הַטֶּמְפֶּרָטוּרָה יָרְדָה בְּ-[[${drop}]] מַעֲלוֹת. כַּמָּה מַעֲלוֹת הָיוּ בַּלַּיְלָה?`,
      options: choiceOptions(String(res), wrongs.map(String), true),
      answer: String(res),
      hint: `יוֹרְדִים ${drop} צְעָדִים מִ-${start}: קֹדֶם עַד 0, וְאַחַר כָּךְ מִתַּחַת לָאֶפֶס.`,
      steps: [`מִ-${start} יוֹרְדִים ${start} מַעֲלוֹת עַד 0.`, `נִשְׁאֲרוּ עוֹד ${drop - start} מַעֲלוֹת לָרֶדֶת, מִתַּחַת לָאֶפֶס.`, `הַתְּשׁוּבָה: ${ltrIsolate(String(res))} מַעֲלוֹת (${Math.abs(res)} מַעֲלוֹת מִתַּחַת לָאֶפֶס).`],
    });
  }
  return Q({
    type: 'nl_negative', topic: 'numberline', ui: 'choice',
    instruction: 'מְשִׂימַת מַעֲלִית:',
    story: `הַמַּעֲלִית הָיְתָה בְּקוֹמָה [[${start}]]. הִיא יָרְדָה [[${drop}]] קוֹמוֹת, אֶל הַחֲנָיָה שֶׁמִּתַּחַת לָאֲדָמָה. לְאֵיזוֹ קוֹמָה הִיא הִגִּיעָה?`,
    options: choiceOptions(String(res), wrongs.map(String), true),
    answer: String(res),
    hint: `יוֹרְדִים ${drop} קוֹמוֹת מִ-${start}: קֹדֶם עַד קוֹמַת הַכְּנִיסָה (0), וְאַחַר כָּךְ מִתַּחַת לָהּ.`,
    steps: [`מִקּוֹמָה ${start} יוֹרְדִים ${start} קוֹמוֹת עַד קוֹמָה 0.`, `נִשְׁאֲרוּ עוֹד ${drop - start} קוֹמוֹת - מִתַּחַת לָאֲדָמָה.`, `הַתְּשׁוּבָה: קוֹמָה ${ltrIsolate(String(res))}.`],
  });
}

/* ============================ ג. חצי ורבע ============================ */

const FRAC_WORD = { half: 'חֵצִי', quarter: 'רֶבַע', twoQuarters: 'שְׁנֵי רְבָעִים', threeQuarters: 'שְׁלוֹשָׁה רְבָעִים', whole: 'שָׁלֵם' };

function genFracColor(level = 0) {
  const shapeKind = pick(['pizza', 'bar', 'square']);
  let parts = pick(level === 0 ? [2, 4] : [4, 8]);
  if (shapeKind === 'square') parts = 4;
  const kinds = level === 0 ? ['half', 'quarter'] : level === 1 ? ['half', 'quarter', 'twoQuarters'] : ['quarter', 'twoQuarters', 'threeQuarters', 'half'];
  let kind = pick(kinds);
  if (parts === 2) kind = 'half';
  const frac = { half: 1 / 2, quarter: 1 / 4, twoQuarters: 2 / 4, threeQuarters: 3 / 4 }[kind];
  const target = parts * frac;
  return Q({
    type: 'frac_color',
    topic: 'fractions',
    ui: 'frac_color',
    shapes: 1,
    parts,
    shapeKind,
    target,
    instruction: `צִבְעוּ ${FRAC_WORD[kind]} מֵהַצּוּרָה (לַחֲצוּ עַל הַחֲלָקִים):`,
    answer: target,
    answerText: `${target} חֲלָקִים מִתּוֹךְ ${parts}`,
    hint: kind === 'half' ? 'חֵצִי - מְחַלְּקִים לִשְׁנֵי חֲלָקִים שָׁוִים, וְצוֹבְעִים אֶחָד מֵהֶם.'
      : kind === 'quarter' ? 'רֶבַע - מְחַלְּקִים לְאַרְבָּעָה חֲלָקִים שָׁוִים, וְצוֹבְעִים אֶחָד מֵהֶם.'
        : 'רֶבַע הוּא חֵלֶק אֶחָד מִתּוֹךְ אַרְבָּעָה חֲלָקִים שָׁוִים. כַּמָּה רְבָעִים צָרִיךְ?',
    steps: [`הַצּוּרָה מְחֻלֶּקֶת לְ-${parts} חֲלָקִים שָׁוִים.`, `${FRAC_WORD[kind]} מִתּוֹךְ ${parts} חֲלָקִים זֶה ${target} חֲלָקִים.`],
  });
}

function genFracOf(level = 0) {
  const quarter = level >= 1 && Math.random() < 0.5;
  let n;
  if (!quarter) n = level === 0 ? 2 * ri(1, 10) : level === 1 ? 2 * ri(5, 25) : pick([100, 2 * ri(10, 50)]);
  else n = level === 1 ? 4 * ri(1, 10) : pick([100, 4 * ri(5, 25)]);
  const ans = quarter ? n / 4 : n / 2;
  return Q({
    type: 'frac_of',
    topic: 'fractions',
    instruction: 'כַּמָּה זֶה?',
    expr: `${quarter ? 'רֶבַע' : 'חֲצִי'} שֶׁל ${n}`,
    exprRtl: true,
    answer: ans,
    hint: quarter ? 'רֶבַע זֶה חֲצִי שֶׁל חֲצִי. מְחַשְּׁבִים חֲצִי, וְאָז שׁוּב חֲצִי.' : 'חֲצִי - מְחַלְּקִים לִשְׁנֵי חֲלָקִים שָׁוִים: אֵיזֶה מִסְפָּר וְעוֹד אוֹתוֹ מִסְפָּר נוֹתֵן אֶת הַכֹּל?',
    steps: quarter
      ? [`חֲצִי שֶׁל ${n} הוּא ${n / 2}, כִּי ${n / 2} + ${n / 2} = ${n}.`, `חֲצִי שֶׁל ${n / 2} הוּא ${ans}, כִּי ${ans} + ${ans} = ${n / 2}.`, `לָכֵן רֶבַע שֶׁל ${n} הוּא ${ans}.`]
      : [`${ans} + ${ans} = ${n}.`, `לָכֵן חֲצִי שֶׁל ${n} הוּא ${ans}.`],
  });
}

function genFracName(level = 0) {
  const parts = pick(level === 0 ? [2, 4] : [4, 8]);
  const kinds = level === 2 ? ['half', 'quarter', 'threeQuarters', 'whole'] : ['half', 'quarter', 'whole'];
  let kind = pick(kinds);
  if (parts === 2 && kind === 'quarter') kind = 'half';
  const filled = parts * { half: 1 / 2, quarter: 1 / 4, threeQuarters: 3 / 4, whole: 1 }[kind];
  const optionKinds = level === 2 ? ['half', 'quarter', 'threeQuarters', 'whole'] : ['half', 'quarter', 'whole'];
  return Q({
    type: 'frac_name',
    topic: 'fractions',
    ui: 'choice',
    noShuffle: true,
    figure: { kind: 'fraction', shapes: 1, parts, filled, shapeKind: pick(['pizza', 'bar']) },
    instruction: 'אֵיזֶה חֵלֶק מֵהַצּוּרָה צָבוּעַ?',
    options: optionKinds.map((k) => opt(FRAC_WORD[k], k === kind)),
    answer: FRAC_WORD[kind],
    hint: 'סוֹפְרִים לְכַמָּה חֲלָקִים שָׁוִים הַצּוּרָה מְחֻלֶּקֶת, וְכַמָּה מֵהֶם צְבוּעִים.',
    steps: [`הַצּוּרָה מְחֻלֶּקֶת לְ-${parts} חֲלָקִים שָׁוִים, וּ-${filled} מֵהֶם צְבוּעִים.`, `זֶה ${FRAC_WORD[kind]}.`],
  });
}

function genFracFacts(level = 0) {
  const facts = [
    ['כַּמָּה חֲצָאִים יֵשׁ בְּשָׁלֵם אֶחָד?', 2, 'שָׁלֵם אֶחָד מְחַלְּקִים לִשְׁנֵי חֲצָאִים שָׁוִים.'],
    ['כַּמָּה רְבָעִים יֵשׁ בְּשָׁלֵם אֶחָד?', 4, 'שָׁלֵם אֶחָד מְחַלְּקִים לְאַרְבָּעָה רְבָעִים שָׁוִים.'],
    ['כַּמָּה רְבָעִים יֵשׁ בַּחֲצִי?', 2, 'שְׁנֵי רְבָעִים הֵם חֲצִי.'],
  ];
  if (level >= 1) facts.push(['כַּמָּה חֲצָאִים יֵשׁ בִּשְׁנֵי שְׁלֵמִים?', 4, 'בְּכָל שָׁלֵם יֵשׁ 2 חֲצָאִים: 2 + 2 = 4.'], ['כַּמָּה רְבָעִים יֵשׁ בִּשְׁנֵי שְׁלֵמִים?', 8, 'בְּכָל שָׁלֵם יֵשׁ 4 רְבָעִים: 4 + 4 = 8.']);
  if (level >= 2) facts.push(['כַּמָּה חֲצָאִים יֵשׁ בִּשְׁלוֹשָׁה שְׁלֵמִים?', 6, 'בְּכָל שָׁלֵם יֵשׁ 2 חֲצָאִים: 2 + 2 + 2 = 6.'], ['כַּמָּה רְבָעִים יֵשׁ בְּשָׁלֵם וָחֵצִי?', 6, 'בְּשָׁלֵם יֵשׁ 4 רְבָעִים, וּבַחֲצִי יֵשׁ 2: 4 + 2 = 6.']);
  const [text, ans, why] = pick(facts);
  return Q({
    type: 'frac_facts',
    topic: 'fractions',
    figure: { kind: 'fraction', shapes: 1, parts: 4, filled: 0, shapeKind: 'pizza' },
    instruction: text,
    answer: ans,
    hint: 'אֶפְשָׁר לְהִסְתַּכֵּל עַל הַפִּיצָה: הִיא מְחֻלֶּקֶת לְאַרְבָּעָה רְבָעִים.',
    steps: [why, `הַתְּשׁוּבָה: ${ans}.`],
  });
}

/* ============================ ד. דיאגרמות ============================ */

const DATASETS = [
  {
    unit: 'הַצֶּבַע הָאָהוּב עַל הַיְּלָדִים בַּכִּתָּה (מִסְפַּר יְלָדִים)',
    labels: ['כָּחֹל', 'אָדֹם', 'יָרֹק', 'צָהֹב'],
    ask: (l) => `כַּמָּה יְלָדִים בָּחֲרוּ בַּצֶּבַע ${l}?`,
    most: 'אֵיזֶה צֶבַע בָּחֲרוּ הֲכִי הַרְבֵּה יְלָדִים?',
    least: 'אֵיזֶה צֶבַע בָּחֲרוּ הֲכִי מְעַט יְלָדִים?',
    total: 'כַּמָּה יְלָדִים בָּחֲרוּ צֶבַע בְּסַךְ הַכֹּל?',
  },
  {
    unit: 'יְמֵי הֻלֶּדֶת בַּכִּתָּה לְפִי עוֹנוֹת (מִסְפַּר יְלָדִים)',
    labels: ['סְתָו', 'חֹרֶף', 'אָבִיב', 'קַיִץ'],
    ask: (l) => `כַּמָּה יְלָדִים נוֹלְדוּ בְּעוֹנַת ${l}?`,
    most: 'בְּאֵיזוֹ עוֹנָה נוֹלְדוּ הֲכִי הַרְבֵּה יְלָדִים?',
    least: 'בְּאֵיזוֹ עוֹנָה נוֹלְדוּ הֲכִי מְעַט יְלָדִים?',
    total: 'כַּמָּה יְלָדִים יֵשׁ בַּכִּתָּה בְּסַךְ הַכֹּל?',
  },
  {
    unit: 'פּוֹקִימוֹנִים שֶׁנִּתְפְּסוּ הַשָּׁבוּעַ, לְפִי סוּג',
    labels: ['אֵשׁ', 'מַיִם', 'עֵשֶׂב', 'חַשְׁמַל'],
    ask: (l) => `כַּמָּה פּוֹקִימוֹנִים מִסּוּג ${l} נִתְפְּסוּ?`,
    most: 'מֵאֵיזֶה סוּג נִתְפְּסוּ הֲכִי הַרְבֵּה פּוֹקִימוֹנִים?',
    least: 'מֵאֵיזֶה סוּג נִתְפְּסוּ הֲכִי מְעַט פּוֹקִימוֹנִים?',
    total: 'כַּמָּה פּוֹקִימוֹנִים נִתְפְּסוּ בְּסַךְ הַכֹּל?',
  },
  {
    unit: 'הַפְּרִי הָאָהוּב עַל הַיְּלָדִים (מִסְפַּר קוֹלוֹת)',
    labels: ['תַּפּוּחַ', 'בָּנָנָה', 'עֲנָבִים', 'תּוּת'],
    ask: (l) => `כַּמָּה קוֹלוֹת קִבֵּל הַפְּרִי ${l}?`,
    most: 'אֵיזֶה פְּרִי קִבֵּל הֲכִי הַרְבֵּה קוֹלוֹת?',
    least: 'אֵיזֶה פְּרִי קִבֵּל הֲכִי מְעַט קוֹלוֹת?',
    total: 'כַּמָּה קוֹלוֹת הָיוּ בְּסַךְ הַכֹּל?',
  },
];

/** נתונים לדיאגרמה: ערכים שונים זה מזה */
function makeChart(level) {
  const d = pick(DATASETS);
  const pool = level === 0 ? range(1, 10) : level === 1 ? range(2, 20) : range(1, 10).map((x) => x * 5);
  const values = shuffle(pool).slice(0, 4);
  return { d, chart: { kind: 'chart', labels: d.labels, values, unit: d.unit } };
}

const CHART_HINT = 'מִסְתַּכְּלִים עַל רֹאשׁ הָעַמּוּדָה, וְהוֹלְכִים יָשָׁר יָמִינָה עַד הַמִּסְפָּרִים שֶׁבַּצַּד.';

function genDataRead(level = 0) {
  const { d, chart } = makeChart(level);
  const i = ri(0, 3);
  return Q({
    type: 'data_read', topic: 'data', figure: chart,
    instruction: d.ask(d.labels[i]),
    answer: chart.values[i],
    hint: CHART_HINT,
    steps: [`הָעַמּוּדָה שֶׁל "${d.labels[i]}" מַגִּיעָה עַד ${chart.values[i]}.`],
  });
}

function genDataMost(level = 0) {
  const { d, chart } = makeChart(level);
  const most = Math.random() < 0.6;
  const target = most ? Math.max(...chart.values) : Math.min(...chart.values);
  const i = chart.values.indexOf(target);
  return Q({
    type: 'data_most', topic: 'data', ui: 'choice', noShuffle: true, figure: chart,
    instruction: most ? d.most : d.least,
    options: d.labels.map((l, k) => opt(l, k === i)),
    answer: d.labels[i],
    hint: most ? 'מְחַפְּשִׂים אֶת הָעַמּוּדָה הַגְּבוֹהָה בְּיוֹתֵר.' : 'מְחַפְּשִׂים אֶת הָעַמּוּדָה הַנְּמוּכָה בְּיוֹתֵר.',
    steps: [`הָעַמּוּדָה הֲכִי ${most ? 'גְּבוֹהָה' : 'נְמוּכָה'} הִיא שֶׁל "${d.labels[i]}" (${target}).`],
  });
}

function genDataDiff(level = 1) {
  const { d, chart } = makeChart(level);
  const [i, j] = shuffle([0, 1, 2, 3]).slice(0, 2).sort((x, y) => chart.values[y] - chart.values[x]);
  const [vi, vj] = [chart.values[i], chart.values[j]];
  return Q({
    type: 'data_diff', topic: 'data', figure: chart,
    instruction: `בְּכַמָּה הָעַמּוּדָה שֶׁל "${d.labels[i]}" גְּבוֹהָה יוֹתֵר מֵהָעַמּוּדָה שֶׁל "${d.labels[j]}"?`,
    answer: vi - vj,
    hint: 'קוֹרְאִים אֶת הַמִּסְפָּר שֶׁל כָּל עַמּוּדָה, וּמְחַשְּׁבִים כַּמָּה חָסֵר לַקְּטַנָּה כְּדֵי לְהַגִּיעַ לַגְּדוֹלָה.',
    steps: [`"${d.labels[i]}": ${vi}, "${d.labels[j]}": ${vj}.`, `${vi} - ${vj} = ${vi - vj}.`],
  });
}

function genDataTotal(level = 1) {
  const { d, chart } = makeChart(Math.min(level, 1));
  return Q({
    type: 'data_total', topic: 'data', figure: chart,
    instruction: d.total,
    answer: sum(chart.values),
    hint: 'קוֹרְאִים אֶת הַמִּסְפָּר שֶׁל כָּל עַמּוּדָה, וּמְחַבְּרִים אֶת כֻּלָּם.',
    steps: [`${chart.values.join(' + ')} = ${sum(chart.values)}.`],
  });
}

/* ============================ ה. אורך ומשקל ============================ */

const SMALL_THINGS = ['עִפָּרוֹן', 'מַחַק', 'מַסְרֵק', 'כַּפִּית', 'מַפְתֵּחַ', 'מַחְבֶּרֶת', 'אֶצְבַּע', 'נַעַל'];
const BIG_THINGS = ['מִגְרַשׁ כַּדּוּרֶגֶל', 'בְּרֵכַת שְׂחִיָּה', 'רְחוֹב', 'רַכֶּבֶת', 'מִסְדְּרוֹן בְּבֵית הַסֵּפֶר', 'חֶדֶר הַכִּתָּה'];
const CM = 'סֶנְטִימֶטְרִים';
const METERS = 'מֶטְרִים';

function genUnitPick() {
  const small = Math.random() < 0.5;
  const thing = pick(small ? SMALL_THINGS : BIG_THINGS);
  return Q({
    type: 'unit_pick',
    topic: 'measure',
    ui: 'choice',
    noShuffle: true,
    instruction: `בְּאֵיזוֹ יְחִידָה נוֹחַ לִמְדֹּד אֶת הָאֹרֶךְ שֶׁל ${thing}?`,
    options: [opt(CM, small), opt(METERS, !small)],
    answer: small ? CM : METERS,
    hint: 'סֶנְטִימֶטֶר הוּא קָטָן - בְּעֶרֶךְ הָרֹחַב שֶׁל אֶצְבַּע. מֶטֶר הוּא גָּדוֹל - בְּעֶרֶךְ צַעַד גָּדוֹל.',
    steps: [small ? 'זֶה דָּבָר קָטָן, וְלָכֵן מוֹדְדִים אוֹתוֹ בְּסֶנְטִימֶטְרִים.' : 'זֶה דָּבָר אָרֹךְ מְאוֹד, וְלָכֵן מוֹדְדִים אוֹתוֹ בְּמֶטְרִים.', 'בְּמֶטֶר אֶחָד יֵשׁ 100 סֶנְטִימֶטְרִים.'],
  });
}

function genRulerRead(level = 0) {
  const start = level === 0 ? 0 : level === 1 ? pick([0, 0, 1, 2]) : ri(1, 5);
  const length = ri(3, 12 - start);
  const end = start + length;
  const thing = pick(['pencil', 'crayon']);
  const name = thing === 'pencil' ? 'הָעִפָּרוֹן' : 'הַצִּבְעוֹנִי';
  const steps = [`${name} מַתְחִיל בְּ-${start} וְנִגְמָר בְּ-${end}.`];
  if (start > 0) steps.push(`${end} - ${start} = ${length}.`);
  steps.push(`הָאֹרֶךְ: ${length} ס"מ.`);
  return Q({
    type: 'ruler_read',
    topic: 'measure',
    figure: { kind: 'ruler', max: 12, start, end, thing },
    instruction: `מָה הָאֹרֶךְ שֶׁל ${name}?`,
    unit: 'ס"מ',
    answer: length,
    hint: start === 0 ? `${name} מַתְחִיל בְּ-0. בְּאֵיזֶה מִסְפָּר הוּא נִגְמָר?` : `${name} לֹא מַתְחִיל בְּ-0! סִפְרוּ כַּמָּה סֶנְטִימֶטְרִים יֵשׁ מֵהַהַתְחָלָה שֶׁלּוֹ עַד הַסּוֹף שֶׁלּוֹ.`,
    steps,
  });
}

const WEIGHT_THINGS = [
  { e: '🍉', n: 'הָאֲבַטִּיחַ' }, { e: '🍎', n: 'הַתַּפּוּחַ' }, { e: '🧸', n: 'הַדֻּבִּי' }, { e: '⚽', n: 'הַכַּדּוּר' },
  { e: '📕', n: 'הַסֵּפֶר' }, { e: '🍌', n: 'הַבָּנָנָה' }, { e: '🎒', n: 'הַתִּיק' }, { e: '🥕', n: 'הַגֶּזֶר' },
];
const SAME_WEIGHT = 'שׁוֹקְלִים אוֹתוֹ דָּבָר';

function genBalanceCompare(level = 0) {
  const [A, B, C] = shuffle(WEIGHT_THINGS);
  if (level === 2 && Math.random() < 0.6) {
    // שתי מאזניים: A כבד מ-B, ו-B כבד מ-C. מי הכי כבד?
    const heaviest = Math.random() < 0.5;
    return Q({
      type: 'balance_compare', topic: 'measure', ui: 'choice',
      figure: { kind: 'multi', items: [{ kind: 'balance', left: [A.e], right: [B.e], tilt: 1 }, { kind: 'balance', left: [B.e], right: [C.e], tilt: 1 }] },
      instruction: heaviest ? 'מָה הֲכִי כָּבֵד?' : 'מָה הֲכִי קַל?',
      options: shuffle([opt(A.n, heaviest), opt(B.n), opt(C.n, !heaviest)]),
      answer: heaviest ? A.n : C.n,
      hint: 'בְּכָל מֹאזְנַיִם, הַכַּף שֶׁיּוֹרֶדֶת לְמַטָּה הִיא הַכְּבֵדָה. מַשְׁוִים דֶּרֶךְ הַחֵפֶץ שֶׁמּוֹפִיעַ בִּשְׁנֵי הַמֹּאזְנַיִם.',
      steps: [`${A.n} כָּבֵד מִ${B.n}.`, `${B.n} כָּבֵד מִ${C.n}.`, `לָכֵן ${heaviest ? `${A.n} הֲכִי כָּבֵד` : `${C.n} הֲכִי קַל`}.`],
    });
  }
  const tilt = level === 0 ? pick([1, -1]) : pick([1, -1, 0]);
  const heavy = tilt === 1 ? A : B;
  const opts = [opt(A.n, tilt === 1), opt(B.n, tilt === -1)];
  if (level > 0) opts.push(opt(SAME_WEIGHT, tilt === 0));
  return Q({
    type: 'balance_compare', topic: 'measure', ui: 'choice', noShuffle: true,
    figure: { kind: 'balance', left: [A.e], right: [B.e], tilt },
    instruction: 'מָה כָּבֵד יוֹתֵר?',
    options: opts,
    answer: tilt === 0 ? SAME_WEIGHT : heavy.n,
    hint: 'הַכַּף הַכְּבֵדָה יוֹרֶדֶת לְמַטָּה. כְּשֶׁהַמֹּאזְנַיִם יְשָׁרִים - הַמִּשְׁקָל שָׁוֶה.',
    steps: [tilt === 0 ? 'הַמֹּאזְנַיִם מְאֻזָּנִים, וְלָכֵן הַמִּשְׁקָל שָׁוֶה.' : `הַכַּף שֶׁל ${heavy.n} יָרְדָה לְמַטָּה, וְלָכֵן ${heavy.n} כָּבֵד יוֹתֵר.`],
  });
}

function genBalanceCount(level = 0) {
  const T = pick(WEIGHT_THINGS);
  if (level === 0) {
    const k = ri(2, 9);
    return Q({
      type: 'balance_count', topic: 'measure',
      figure: { kind: 'balance', left: [T.e], right: Array(k).fill('cube'), tilt: 0 },
      instruction: `הַמֹּאזְנַיִם מְאֻזָּנִים. כַּמָּה קֻבִּיּוֹת שׁוֹקֵל ${T.n}?`,
      answer: k,
      hint: 'כְּשֶׁהַמֹּאזְנַיִם יְשָׁרִים, שְׁנֵי הַצְּדָדִים שׁוֹקְלִים אוֹתוֹ דָּבָר. סִפְרוּ אֶת הַקֻּבִּיּוֹת.',
      steps: [`בַּכַּף הַשְּׁנִיָּה יֵשׁ ${k} קֻבִּיּוֹת, וְהַמֹּאזְנַיִם מְאֻזָּנִים.`, `לָכֵן ${T.n} שׁוֹקֵל ${k} קֻבִּיּוֹת.`],
    });
  }
  if (level === 1 || Math.random() < 0.5) {
    const each = ri(2, 5);
    return Q({
      type: 'balance_count', topic: 'measure',
      figure: { kind: 'balance', left: [T.e, T.e], right: Array(each * 2).fill('cube'), tilt: 0 },
      instruction: `הַמֹּאזְנַיִם מְאֻזָּנִים. כַּמָּה קֻבִּיּוֹת שׁוֹקֵל ${T.n} אֶחָד?`,
      answer: each,
      hint: `שְׁנֵי ${T.e} שׁוֹקְלִים כְּמוֹ ${each * 2} קֻבִּיּוֹת. כַּמָּה שׁוֹקֵל אֶחָד?`,
      steps: [`${each * 2} קֻבִּיּוֹת מְחַלְּקִים לִשְׁנַיִם: ${each} + ${each} = ${each * 2}.`, `לָכֵן ${T.n} אֶחָד שׁוֹקֵל ${each} קֻבִּיּוֹת.`],
    });
  }
  const w = ri(2, 6); const extra = ri(1, 3);
  return Q({
    type: 'balance_count', topic: 'measure',
    figure: { kind: 'balance', left: [T.e, ...Array(extra).fill('cube')], right: Array(w + extra).fill('cube'), tilt: 0 },
    instruction: `הַמֹּאזְנַיִם מְאֻזָּנִים. כַּמָּה קֻבִּיּוֹת שׁוֹקֵל ${T.n}?`,
    answer: w,
    hint: `לְיַד ${T.e} יֵשׁ גַּם ${extra} קֻבִּיּוֹת. מָה קוֹרֶה אִם מוֹרִידִים ${extra} קֻבִּיּוֹת מִכָּל צַד?`,
    steps: [`בַּצַּד הַשֵּׁנִי יֵשׁ ${w + extra} קֻבִּיּוֹת.`, `מוֹרִידִים ${extra} קֻבִּיּוֹת מִשְּׁנֵי הַצְּדָדִים: ${w + extra} - ${extra} = ${w}.`, `לָכֵן ${T.n} שׁוֹקֵל ${w} קֻבִּיּוֹת.`],
  });
}

function genLengthWord(level = 0) {
  const [p1, p2] = shuffle(PEOPLE).slice(0, 2);
  if (level < 2 || Math.random() < 0.5) {
    const a = ri(5, level === 0 ? 15 : 40); const d = ri(2, level === 0 ? 6 : 20);
    return Q({
      type: 'length_word', topic: 'measure', ui: 'mission', instruction: 'מְשִׂימַת אֹרֶךְ:', unit: 'ס"מ',
      story: `הַסֶּרֶט שֶׁל ${p1.n} אָרֹךְ [[${a}]] ס"מ. הַסֶּרֶט שֶׁל ${p2.n} אָרֹךְ [[${a + d}]] ס"מ. בְּכַמָּה ס"מ הַסֶּרֶט שֶׁל ${p2.n} אָרֹךְ יוֹתֵר?`,
      answer: d,
      hint: `כַּמָּה צָרִיךְ לְהוֹסִיף לְ-${a} כְּדֵי לְהַגִּיעַ לְ-${a + d}?`,
      steps: [`${a + d} - ${a} = ${d}.`, `הַסֶּרֶט שֶׁל ${p2.n} אָרֹךְ יוֹתֵר בְּ-${d} ס"מ.`],
    });
  }
  const cut = ri(1, 9) * 10;
  return Q({
    type: 'length_word', topic: 'measure', ui: 'mission', instruction: 'מְשִׂימַת אֹרֶךְ:', unit: 'ס"מ',
    story: `לְ${p1.n} הָיָה חֶבֶל בְּאֹרֶךְ מֶטֶר אֶחָד. ${g(p1, 'הוּא חָתַךְ', 'הִיא חָתְכָה')} מִמֶּנּוּ [[${cut}]] ס"מ. כַּמָּה ס"מ נִשְׁאֲרוּ?`,
    answer: 100 - cut,
    hint: 'בְּמֶטֶר אֶחָד יֵשׁ 100 סֶנְטִימֶטְרִים.',
    steps: ['מֶטֶר אֶחָד הוּא 100 ס"מ.', `100 - ${cut} = ${100 - cut}.`],
  });
}

/* ============================ ה. שטח והיקף ============================ */

const key = (x, y) => `${x},${y}`;

/** צורה מחוברת של size משבצות, בתוך מלבן w×h */
function randomShape(w, h, size) {
  const cells = new Set([key(ri(0, w - 1), ri(0, h - 1))]);
  let guard = 0;
  while (cells.size < size && guard++ < 1000) {
    const [x, y] = pick([...cells]).split(',').map(Number);
    const [dx, dy] = pick([[1, 0], [-1, 0], [0, 1], [0, -1]]);
    const nx = x + dx; const ny = y + dy;
    if (nx >= 0 && nx < w && ny >= 0 && ny < h) cells.add(key(nx, ny));
  }
  return [...cells].map((s) => s.split(',').map(Number));
}

const rect = (x0, y0, w, h) => {
  const cells = [];
  for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) cells.push([x, y]);
  return cells;
};

/** היקף = מספר צלעות המשבצות שאין להן שכנה בצורה */
export function perimeterOf(cells) {
  const set = new Set(cells.map(([x, y]) => key(x, y)));
  let p = 0;
  for (const [x, y] of cells) for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (!set.has(key(x + dx, y + dy))) p += 1;
  return p;
}

const shift = (cells, dx, dy) => cells.map(([x, y]) => [x + dx, y + dy]);

function genArea(level = 0) {
  if (level === 2 || (level === 0 && Math.random() < 0.6)) {
    const w = ri(2, level === 0 ? 4 : 8); const h = ri(2, level === 0 ? 3 : 5);
    const steps = level === 2
      ? [`יֵשׁ ${h} שׁוּרוֹת, וּבְכָל שׁוּרָה ${w} מִשְׁבָּצוֹת.`, `${h} × ${w} = ${w * h}.`]
      : [`יֵשׁ ${h} שׁוּרוֹת, וּבְכָל שׁוּרָה ${w} מִשְׁבָּצוֹת.`, `${repeatAdd(w, h)}.`];
    return Q({
      type: 'area', topic: 'area', unit: 'מִשְׁבָּצוֹת',
      figure: { kind: 'grid', w: w + 2, h: h + 2, shapes: [{ cells: rect(1, 1, w, h), color: 'blue' }] },
      instruction: 'מָה הַשֶּׁטַח שֶׁל הַמַּלְבֵּן? (כַּמָּה מִשְׁבָּצוֹת יֵשׁ בּוֹ)',
      answer: w * h,
      hint: level === 2 ? 'אֶפְשָׁר לִכְפֹּל: מִסְפַּר הַשּׁוּרוֹת כָּפוּל מִסְפַּר הַמִּשְׁבָּצוֹת בְּכָל שׁוּרָה.' : 'סוֹפְרִים אֶת הַמִּשְׁבָּצוֹת שׁוּרָה אַחַר שׁוּרָה.',
      steps,
    });
  }
  const size = level === 0 ? ri(4, 7) : ri(7, 13);
  const cells = randomShape(5, 4, size);
  const rows = [...new Set(cells.map(([, y]) => y))].sort((a, b) => a - b);
  const counts = rows.map((r) => cells.filter(([, y]) => y === r).length);
  return Q({
    type: 'area', topic: 'area', unit: 'מִשְׁבָּצוֹת',
    figure: { kind: 'grid', w: 7, h: 6, shapes: [{ cells: shift(cells, 1, 1), color: 'blue' }] },
    instruction: 'מָה הַשֶּׁטַח שֶׁל הַצּוּרָה? (כַּמָּה מִשְׁבָּצוֹת יֵשׁ בָּהּ)',
    answer: cells.length,
    hint: 'סוֹפְרִים אֶת הַמִּשְׁבָּצוֹת הַצְּבוּעוֹת שׁוּרָה אַחַר שׁוּרָה, וּמְחַבְּרִים.',
    steps: counts.length > 1 ? [`בְּכָל שׁוּרָה: ${counts.join(', ')}.`, `${counts.join(' + ')} = ${cells.length}.`] : [`יֵשׁ ${cells.length} מִשְׁבָּצוֹת.`],
  });
}

function genPerimeter(level = 1) {
  if (level < 2 || Math.random() < 0.6) {
    const w = ri(1, level === 0 ? 3 : 6); const h = ri(1, level === 0 ? 3 : 4);
    const p = 2 * (w + h);
    return Q({
      type: 'perimeter', topic: 'area', unit: 'צְלָעוֹת',
      figure: { kind: 'grid', w: w + 2, h: h + 2, shapes: [{ cells: rect(1, 1, w, h), color: 'yellow' }] },
      instruction: 'מָה הַהֶקֵּף שֶׁל הַמַּלְבֵּן? (כַּמָּה צַלְעוֹת מִשְׁבָּצָה יֵשׁ מִסָּבִיב לוֹ)',
      answer: p,
      hint: 'הוֹלְכִים מִסָּבִיב לַצּוּרָה וְסוֹפְרִים כָּל צֶלַע שֶׁל מִשְׁבֶּצֶת בַּקַּו הַחִיצוֹנִי.',
      steps: [`לְמַעְלָה ${w}, בַּצַּד ${h}, לְמַטָּה ${w}, וּבַצַּד הַשֵּׁנִי ${h}.`, `${w} + ${h} + ${w} + ${h} = ${p}.`],
    });
  }
  const cells = randomShape(4, 3, ri(4, 8));
  const p = perimeterOf(cells);
  return Q({
    type: 'perimeter', topic: 'area', unit: 'צְלָעוֹת',
    figure: { kind: 'grid', w: 6, h: 5, shapes: [{ cells: shift(cells, 1, 1), color: 'yellow' }] },
    instruction: 'מָה הַהֶקֵּף שֶׁל הַצּוּרָה? (כַּמָּה צַלְעוֹת מִשְׁבָּצָה יֵשׁ מִסָּבִיב לָהּ)',
    answer: p,
    hint: 'מַתְחִילִים בְּפִנָּה אַחַת, הוֹלְכִים לְאֹרֶךְ הַקַּו הַחִיצוֹנִי, וְסוֹפְרִים כָּל צֶלַע עַד שֶׁחוֹזְרִים לַהַתְחָלָה.',
    steps: [`סוֹפְרִים אֶת הַצְּלָעוֹת בַּקַּו הַחִיצוֹנִי: יֵשׁ ${p}.`],
  });
}

const SAME_AREA_PAIRS = [[[6, 1], [3, 2]], [[8, 1], [4, 2]], [[4, 1], [2, 2]], [[6, 2], [4, 3]], [[8, 2], [4, 4]], [[9, 1], [3, 3]]];
const SAME_PERIM_PAIRS = [[[3, 3], [4, 2]], [[5, 1], [3, 3]], [[5, 1], [4, 2]], [[4, 4], [6, 2]], [[5, 3], [6, 2]]];
const BLUE = 'הַכְּחֻלָּה';
const YELLOW = 'הַצְּהֻבָּה';

function genAreaCompare(level = 1) {
  const askArea = level < 2 || Math.random() < 0.5;
  let pair;
  const r = Math.random();
  if (r < 0.4) pair = pick(askArea ? SAME_AREA_PAIRS : SAME_PERIM_PAIRS);
  else if (r < 0.7) pair = pick(askArea ? SAME_PERIM_PAIRS : SAME_AREA_PAIRS);
  else pair = [[ri(1, 5), ri(1, 4)], [ri(1, 5), ri(1, 4)]];
  pair = shuffle(pair);
  const [[w1, h1], [w2, h2]] = pair;
  const measure = (w, h) => (askArea ? w * h : 2 * (w + h));
  const m1 = measure(w1, h1); const m2 = measure(w2, h2);
  const same = askArea ? 'לִשְׁתֵּיהֶן אוֹתוֹ שֶׁטַח' : 'לִשְׁתֵּיהֶן אוֹתוֹ הֶקֵּף';
  const ans = m1 > m2 ? BLUE : m2 > m1 ? YELLOW : same;
  const word = askArea ? 'שֶׁטַח' : 'הֶקֵּף';
  const H = Math.max(h1, h2) + 2;
  return Q({
    type: 'area_compare', topic: 'area', ui: 'choice', noShuffle: true,
    figure: { kind: 'grid', w: w1 + w2 + 3, h: H, shapes: [{ cells: rect(1, 1, w1, h1), color: 'blue' }, { cells: rect(w1 + 2, 1, w2, h2), color: 'yellow' }] },
    instruction: `לְאֵיזוֹ צוּרָה יֵשׁ ${word} גָּדוֹל יוֹתֵר?`,
    options: [opt(BLUE, ans === BLUE), opt(YELLOW, ans === YELLOW), opt(same, ans === same)],
    answer: ans,
    hint: askArea ? 'שֶׁטַח = כַּמָּה מִשְׁבָּצוֹת יֵשׁ בְּתוֹךְ הַצּוּרָה.' : 'הֶקֵּף = כַּמָּה צַלְעוֹת מִשְׁבָּצָה יֵשׁ מִסָּבִיב לַצּוּרָה.',
    steps: [
      `${askArea ? 'הַשֶּׁטַח' : 'הַהֶקֵּף'} שֶׁל ${BLUE}: ${m1}.`,
      `${askArea ? 'הַשֶּׁטַח' : 'הַהֶקֵּף'} שֶׁל ${YELLOW}: ${m2}.`,
      m1 === m2 ? `${same}.` : `לָכֵן לַצּוּרָה ${ans} יֵשׁ ${word} גָּדוֹל יוֹתֵר.`,
    ],
  });
}

/* ============================ ה. שעון וזמן ============================ */

const HOURS = ['', 'אַחַת', 'שְׁתַּיִם', 'שָׁלוֹשׁ', 'אַרְבַּע', 'חָמֵשׁ', 'שֵׁשׁ', 'שֶׁבַע', 'שְׁמוֹנֶה', 'תֵּשַׁע', 'עֶשֶׂר', 'אַחַת עֶשְׂרֵה', 'שְׁתֵּים עֶשְׂרֵה'];
const TO_HOURS = ['', 'לְאַחַת', 'לִשְׁתַּיִם', 'לְשָׁלוֹשׁ', 'לְאַרְבַּע', 'לְחָמֵשׁ', 'לְשֵׁשׁ', 'לְשֶׁבַע', 'לִשְׁמוֹנֶה', 'לְתֵשַׁע', 'לְעֶשֶׂר', 'לְאַחַת עֶשְׂרֵה', 'לִשְׁתֵּים עֶשְׂרֵה'];
const nextHour = (h) => (h % 12) + 1;
const prevHour = (h) => ((h + 10) % 12) + 1;

/** השעה במילים: 3:30 -> "שָׁלוֹשׁ וָחֵצִי", 3:45 -> "רֶבַע לְאַרְבַּע" */
export function timeWords(h, m) {
  if (m === 0) return HOURS[h];
  if (m === 30) return `${HOURS[h]} וָחֵצִי`;
  if (m === 15) return `${HOURS[h]} וָרֶבַע`;
  return `רֶבַע ${TO_HOURS[nextHour(h)]}`;
}

export const digital = (h, m) => `${h}:${String(m).padStart(2, '0')}`;

/** הוספת דקות לשעה (בשעון של 12 שעות) */
function addMinutes(h, m, mins) {
  const total = ((h % 12) * 60 + m + mins) % 720;
  const nh = Math.floor(total / 60);
  return [nh === 0 ? 12 : nh, total % 60];
}

function clockMinutes(level) {
  return level === 0 ? 0 : level === 1 ? pick([0, 30]) : pick([0, 15, 30, 45]);
}

function clockDistractors(h, m, level) {
  const list = [[nextHour(h), m], [prevHour(h), m]];
  if (m === 30) list.unshift([nextHour(h), 30]);
  if (level >= 1) list.push([h, m === 30 ? 0 : 30]);
  if (level >= 2) {
    list.push([h, (m + 15) % 60], [h, (m + 45) % 60]);
    if (m === 0 && [3, 6, 9].includes(h)) list.push([12, h * 5]);      // טעות נפוצה: מחליפים בין המחוג הקצר לארוך
  }
  return shuffle(list.filter(([hh, mm]) => !(hh === h && mm === m)));
}

function clockSteps(h, m) {
  const hourPos = m === 0 ? `עַל ${h}` : m === 45 ? `קְצָת לִפְנֵי ${nextHour(h)}` : `בֵּין ${h} לְ-${nextHour(h)}`;
  const minPos = { 0: 'עַל 12', 15: 'עַל 3 (רֶבַע סִבּוּב)', 30: 'עַל 6 (חֲצִי סִבּוּב)', 45: 'עַל 9 (שְׁלוֹשָׁה רִבְעֵי סִבּוּב)' }[m];
  return [`הַמָּחוֹג הַקָּצָר ${hourPos}.`, `הַמָּחוֹג הָאָרֹךְ ${minPos}.`, `הַשָּׁעָה: ${timeWords(h, m)} (${digital(h, m)}).`];
}

const CLOCK_HINT = 'הַמָּחוֹג הַקָּצָר מַרְאֶה אֶת הַשָּׁעָה, וְהַמָּחוֹג הָאָרֹךְ (הַכָּחֹל) מַרְאֶה אֶת הַדַּקּוֹת. כְּשֶׁהַמָּחוֹג הָאָרֹךְ עַל 12, זוֹ שָׁעָה עֲגֻלָּה.';

function genClockRead(level = 0) {
  const h = ri(1, 12);
  const m = clockMinutes(level);
  const words = timeWords(h, m);
  const wrongs = clockDistractors(h, m, level).map(([hh, mm]) => timeWords(hh, mm));
  return Q({
    type: 'clock_read',
    topic: 'time',
    ui: 'choice',
    figure: { kind: 'clock', h, m },
    instruction: 'מָה הַשָּׁעָה?',
    options: choiceOptions(words, wrongs.slice(0, 3)),
    answer: words,
    hint: CLOCK_HINT,
    steps: clockSteps(h, m),
  });
}

function genClockPick(level = 0) {
  const h = ri(1, 12);
  const m = clockMinutes(level);
  const wrongs = [];
  for (const [hh, mm] of clockDistractors(h, m, level)) {
    if (!wrongs.some(([a, b]) => a === hh && b === mm)) wrongs.push([hh, mm]);
  }
  const all = shuffle([[h, m, true], ...wrongs.slice(0, 2).map(([a, b]) => [a, b, false])]);
  return Q({
    type: 'clock_pick',
    topic: 'time',
    ui: 'choice',
    instruction: `בְּאֵיזֶה שָׁעוֹן הַשָּׁעָה ${timeWords(h, m)}?`,
    // בלי הטקסט על הכפתור - אחרת השעה הדיגיטלית מסגירה את התשובה
    options: all.map(([a, b, ok]) => ({ ...opt(digital(a, b), ok, true, { kind: 'clock', h: a, m: b }), artOnly: true })),
    answer: digital(h, m),
    answerText: `${digital(h, m)}`,
    hint: CLOCK_HINT,
    steps: clockSteps(h, m),
  });
}

const DURATION = { 30: 'חֲצִי שָׁעָה', 60: 'שָׁעָה', 90: 'שָׁעָה וָחֵצִי', 120: 'שְׁעָתַיִם', 150: 'שְׁעָתַיִם וָחֵצִי', 180: 'שָׁלוֹשׁ שָׁעוֹת', 210: 'שָׁלוֹשׁ שָׁעוֹת וָחֵצִי' };
const EVENTS = ['הַסֶּרֶט', 'הַמִּשְׂחָק', 'הַטִּיּוּל', 'הַחוּג'];

function genDuration(level = 1) {
  const mins = pick(level === 0 ? [30, 60, 120] : level === 1 ? [30, 60, 90, 120] : [60, 90, 120, 150, 180]);
  let h = ri(1, 12);
  let m = level === 0 ? 0 : pick([0, 30]);
  if (level === 2 && Math.random() < 0.5) { h = pick([10, 11, 12]); m = pick([0, 30]); }       // חוצים את 12
  const [eh, em] = addMinutes(h, m, mins);
  const ev = pick(EVENTS);
  const findEnd = level >= 1 && Math.random() < 0.5;
  if (findEnd) {
    const endWords = timeWords(eh, em);
    const wrongs = [addMinutes(h, m, mins + 30), addMinutes(h, m, mins - 30), addMinutes(h, m, mins + 60), [h, m]].map(([a, b]) => timeWords(a, b));
    return Q({
      type: 'duration', topic: 'time', ui: 'choice',
      instruction: 'מְשִׂימַת זְמַן:',
      story: `${ev} הִתְחִיל בַּשָּׁעָה ${timeWords(h, m)}, וְנִמְשַׁךְ ${DURATION[mins]}. בְּאֵיזוֹ שָׁעָה הוּא נִגְמַר?`,
      options: choiceOptions(endWords, wrongs.slice(0, 3)),
      answer: endWords,
      hint: 'מַתְחִילִים מִשְּׁעַת הַהַתְחָלָה, וּמוֹסִיפִים חֲצִי שָׁעָה אַחַר חֲצִי שָׁעָה.',
      steps: [`מַתְחִילִים בְּ-${digital(h, m)}, וּמוֹסִיפִים ${DURATION[mins]}.`, `מַגִּיעִים לְ-${digital(eh, em)}: ${endWords}.`],
    });
  }
  const opts = Object.keys(DURATION).map(Number).filter((x) => Math.abs(x - mins) <= 60 && x !== mins);
  return Q({
    type: 'duration', topic: 'time', ui: 'choice',
    instruction: 'מְשִׂימַת זְמַן:',
    story: `${ev} הִתְחִיל בַּשָּׁעָה ${timeWords(h, m)}, וְנִגְמַר בַּשָּׁעָה ${timeWords(eh, em)}. כַּמָּה זְמַן הוּא נִמְשַׁךְ?`,
    options: choiceOptions(DURATION[mins], shuffle(opts).slice(0, 3).map((x) => DURATION[x])),
    answer: DURATION[mins],
    hint: 'סוֹפְרִים חֲצָאֵי שָׁעוֹת מִשְּׁעַת הַהַתְחָלָה עַד שְׁעַת הַסִּיּוּם.',
    steps: [`מִ-${digital(h, m)} עַד ${digital(eh, em)} עוֹבְרִים ${mins / 30} חֲצָאֵי שָׁעָה.`, `זֶה ${DURATION[mins]}.`],
  });
}

function genTimeFacts(level = 0) {
  const facts = [
    ['כַּמָּה דַּקּוֹת יֵשׁ בְּשָׁעָה אַחַת?', 60, 'בְּשָׁעָה יֵשׁ 60 דַּקּוֹת: הַמָּחוֹג הָאָרֹךְ עוֹשֶׂה סִבּוּב שָׁלֵם.'],
    ['כַּמָּה דַּקּוֹת יֵשׁ בַּחֲצִי שָׁעָה?', 30, 'חֲצִי מִ-60 דַּקּוֹת: 30 + 30 = 60.'],
    ['כַּמָּה חֲצָאֵי שָׁעָה יֵשׁ בְּשָׁעָה אַחַת?', 2, 'שָׁעָה הִיא שְׁנֵי חֲצָאֵי שָׁעָה.'],
    ['כַּמָּה יָמִים יֵשׁ בְּשָׁבוּעַ?', 7, 'רִאשׁוֹן, שֵׁנִי, שְׁלִישִׁי, רְבִיעִי, חֲמִישִׁי, שִׁשִּׁי וְשַׁבָּת - 7 יָמִים.'],
  ];
  if (level >= 1) facts.push(['כַּמָּה דַּקּוֹת יֵשׁ בְּרֶבַע שָׁעָה?', 15, 'רֶבַע מִ-60 דַּקּוֹת: 15 + 15 + 15 + 15 = 60.'], ['כַּמָּה רִבְעֵי שָׁעָה יֵשׁ בְּשָׁעָה אַחַת?', 4, 'שָׁעָה הִיא אַרְבָּעָה רִבְעֵי שָׁעָה.'], ['כַּמָּה שָׁעוֹת יֵשׁ בִּיְמָמָה?', 24, 'בִּיְמָמָה יֵשׁ 24 שָׁעוֹת: 12 בַּיּוֹם וְ-12 בַּלַּיְלָה.']);
  if (level >= 2) facts.push(['כַּמָּה דַּקּוֹת יֵשׁ בִּשְׁעָתַיִם?', 120, 'בְּכָל שָׁעָה 60 דַּקּוֹת: 60 + 60 = 120.'], ['כַּמָּה דַּקּוֹת יֵשׁ בְּשָׁעָה וָחֵצִי?', 90, 'שָׁעָה הִיא 60 דַּקּוֹת, וַחֲצִי שָׁעָה הִיא 30: 60 + 30 = 90.']);
  const [text, ans, why] = pick(facts);
  return Q({
    type: 'time_facts',
    topic: 'time',
    instruction: text,
    answer: ans,
    hint: 'חִשְׁבוּ עַל הַשָּׁעוֹן: הַמָּחוֹג הָאָרֹךְ עוֹשֶׂה סִבּוּב שָׁלֵם בְּ-60 דַּקּוֹת.',
    steps: [why],
  });
}

/* ============================ ה. גופים וצורות ============================ */

const SOLIDS = {
  cube: { name: 'קֻבִּיָּה', the: 'הַקֻּבִּיָּה', to: 'לַקֻּבִּיָּה', rolls: false, faces: 6, vertices: 8, edges: 12 },
  box: { name: 'תֵּבָה', the: 'הַתֵּבָה', to: 'לַתֵּבָה', rolls: false, faces: 6, vertices: 8, edges: 12 },
  pyramid: { name: 'פִּירָמִידָה', the: 'הַפִּירָמִידָה', to: 'לַפִּירָמִידָה', rolls: false, faces: 5, vertices: 5, edges: 8 },
  cylinder: { name: 'גָּלִיל', the: 'הַגָּלִיל', to: 'לַגָּלִיל', rolls: true },
  cone: { name: 'חָרוּט', the: 'הֶחָרוּט', to: 'לֶחָרוּט', rolls: true },
  sphere: { name: 'כַּדּוּר', the: 'הַכַּדּוּר', to: 'לַכַּדּוּר', rolls: true },
};

const SOLID_ABOUT = {
  cube: 'לַקֻּבִּיָּה 6 פֵּאוֹת, וְכֻלָּן רִבּוּעִים שָׁוִים.',
  box: 'לַתֵּבָה 6 פֵּאוֹת, וְהֵן מַלְבֵּנִים - כְּמוֹ קֻפְסַת נַעֲלַיִם.',
  pyramid: 'לַפִּירָמִידָה יֵשׁ בָּסִיס, וּפֵאוֹת מְשֻׁלָּשׁוֹת שֶׁנִּפְגָּשׁוֹת לְמַעְלָה בְּקָדְקֹד אֶחָד.',
  cylinder: 'לַגָּלִיל שְׁנֵי עִגּוּלִים - לְמַעְלָה וּלְמַטָּה - כְּמוֹ פַּחִית שְׁתִיָּה.',
  cone: 'לֶחָרוּט בָּסִיס עָגֹל וְחֹד לְמַעְלָה - כְּמוֹ גְּבִיעַ גְּלִידָה.',
  sphere: 'הַכַּדּוּר עָגֹל מִכָּל הַצְּדָדִים, וְאֵין לוֹ פֵּאוֹת שְׁטוּחוֹת.',
};

function genSolidName() {
  const kind = pick(Object.keys(SOLIDS));
  const others = shuffle(Object.keys(SOLIDS).filter((k) => k !== kind)).slice(0, 3);
  return Q({
    type: 'solid_name',
    topic: 'solids',
    ui: 'choice',
    figure: { kind: 'solid', name: kind },
    instruction: 'אֵיזֶה גּוּף זֶה?',
    options: choiceOptions(SOLIDS[kind].name, others.map((k) => SOLIDS[k].name)),
    answer: SOLIDS[kind].name,
    hint: 'בִּדְקוּ: יֵשׁ לַגּוּף פֵּאוֹת שְׁטוּחוֹת אוֹ חֲלָקִים עֲגֻלִּים? אֵיזוֹ צוּרָה יֵשׁ לַפֵּאוֹת?',
    steps: [SOLID_ABOUT[kind], `זֶה ${SOLIDS[kind].name}.`],
  });
}

const COUNT_WORDS = {
  faces: { q: 'פֵּאוֹת', hint: 'פֵּאָה הִיא צַד שָׁטוּחַ שֶׁל הַגּוּף. אַל תִּשְׁכְּחוּ אֶת הַפֵּאוֹת שֶׁמֵּאָחוֹר וּלְמַטָּה!' },
  vertices: { q: 'קָדְקֳדִים', hint: 'קָדְקֹד הוּא פִּנָּה שֶׁל הַגּוּף - נְקֻדָּה שֶׁבָּהּ נִפְגָּשִׁים כַּמָּה מִקְצוֹעוֹת.' },
  edges: { q: 'מִקְצוֹעוֹת', hint: 'מִקְצוֹעַ הוּא קַו שֶׁבּוֹ נִפְגָּשׁוֹת שְׁתֵּי פֵּאוֹת. הַקַּוִּים הַמְּקֻוְּקָוִים הֵם מִקְצוֹעוֹת שֶׁמֵּאָחוֹר.' },
};

const COUNT_STEPS = {
  prism: {
    faces: 'לְמַעְלָה 1, לְמַטָּה 1, וְעוֹד 4 מִסָּבִיב: 1 + 1 + 4 = 6.',
    vertices: '4 פִּנּוֹת לְמַעְלָה וְ-4 פִּנּוֹת לְמַטָּה: 4 + 4 = 8.',
    edges: '4 לְמַעְלָה, 4 לְמַטָּה וְ-4 עוֹמְדִים: 4 + 4 + 4 = 12.',
  },
  pyramid: {
    faces: 'בָּסִיס אֶחָד וְעוֹד 4 מְשֻׁלָּשִׁים: 1 + 4 = 5.',
    vertices: '4 פִּנּוֹת בַּבָּסִיס וְעוֹד 1 לְמַעְלָה: 4 + 1 = 5.',
    edges: '4 בַּבָּסִיס וְעוֹד 4 שֶׁעוֹלִים לַקָּדְקֹד: 4 + 4 = 8.',
  },
};

function genSolidCount(level = 1) {
  const kind = pick(['cube', 'box', 'pyramid']);
  const what = pick(level === 0 ? ['faces'] : level === 1 ? ['faces', 'vertices'] : ['faces', 'vertices', 'edges']);
  const sd = SOLIDS[kind];
  return Q({
    type: 'solid_count',
    topic: 'solids',
    figure: { kind: 'solid', name: kind },
    instruction: `כַּמָּה ${COUNT_WORDS[what].q} יֵשׁ ${sd.to}?`,
    answer: sd[what],
    hint: COUNT_WORDS[what].hint,
    steps: [COUNT_STEPS[kind === 'pyramid' ? 'pyramid' : 'prism'][what], `${sd.to} יֵשׁ ${sd[what]} ${COUNT_WORDS[what].q}.`],
  });
}

const SHAPE_NAMES = { square: 'רִבּוּעַ', rect: 'מַלְבֵּן', triangle: 'מְשֻׁלָּשׁ', circle: 'עִגּוּל' };
const FACE_CASES = [
  { solid: 'cube', text: 'אֵיזוֹ צוּרָה יֵשׁ לַפֵּאוֹת שֶׁל הַקֻּבִּיָּה?', shape: 'square', why: 'כָּל הַפֵּאוֹת שֶׁל הַקֻּבִּיָּה הֵן רִבּוּעִים.' },
  { solid: 'box', text: 'אֵיזוֹ צוּרָה יֵשׁ לַפֵּאָה הַקִּדְמִית שֶׁל הַתֵּבָה?', shape: 'rect', why: 'הַפֵּאָה הַקִּדְמִית אֲרֻכָּה וּנְמוּכָה - הִיא מַלְבֵּן.' },
  { solid: 'pyramid', text: 'אֵיזוֹ צוּרָה יֵשׁ לַפֵּאוֹת בַּצְּדָדִים שֶׁל הַפִּירָמִידָה?', shape: 'triangle', why: 'הַפֵּאוֹת בַּצְּדָדִים נִפְגָּשׁוֹת בְּחֹד לְמַעְלָה - הֵן מְשֻׁלָּשִׁים.' },
  { solid: 'cylinder', text: 'אֵיזוֹ צוּרָה יֵשׁ לַפֵּאוֹת הַשְּׁטוּחוֹת שֶׁל הַגָּלִיל?', shape: 'circle', why: 'לְמַעְלָה וּלְמַטָּה יֵשׁ לַגָּלִיל עִגּוּלִים.' },
  { solid: 'cone', text: 'אֵיזוֹ צוּרָה יֵשׁ לַבָּסִיס שֶׁל הֶחָרוּט?', shape: 'circle', why: 'הַבָּסִיס שֶׁל הֶחָרוּט הוּא עִגּוּל.' },
];

function genSolidFace() {
  const c = pick(FACE_CASES);
  return Q({
    type: 'solid_face',
    topic: 'solids',
    ui: 'choice',
    noShuffle: true,
    figure: { kind: 'solid', name: c.solid },
    instruction: c.text,
    options: Object.entries(SHAPE_NAMES).map(([k, n]) => opt(n, k === c.shape)),
    answer: SHAPE_NAMES[c.shape],
    hint: 'דַּמְיְנוּ שֶׁמַּטְבִּיעִים אֶת הַפֵּאָה בְּחוֹל. אֵיזוֹ צוּרָה תִּשָּׁאֵר?',
    steps: [c.why],
  });
}

function genSolidRoll() {
  const canRoll = Math.random() < 0.5;
  const good = shuffle(Object.keys(SOLIDS).filter((k) => SOLIDS[k].rolls === canRoll))[0];
  const bad = shuffle(Object.keys(SOLIDS).filter((k) => SOLIDS[k].rolls !== canRoll)).slice(0, 2);
  const all = shuffle([good, ...bad]);
  return Q({
    type: 'solid_roll',
    topic: 'solids',
    ui: 'choice',
    instruction: canRoll ? 'אֵיזֶה גּוּף יָכוֹל לְהִתְגַּלְגֵּל?' : 'אֵיזֶה גּוּף לֹא יָכוֹל לְהִתְגַּלְגֵּל?',
    options: all.map((k) => opt(SOLIDS[k].name, k === good, false, { kind: 'solid', name: k })),
    answer: SOLIDS[good].name,
    hint: 'גּוּף מִתְגַּלְגֵּל רַק אִם יֵשׁ לוֹ חֵלֶק עָגֹל. גּוּף שֶׁכָּל הַפֵּאוֹת שֶׁלּוֹ שְׁטוּחוֹת - לֹא מִתְגַּלְגֵּל.',
    // הגופים המתגלגלים (גליל, חרוט, כדור) בלשון זכר, והאחרים (קובייה, תיבה, פירמידה) בלשון נקבה
    steps: [canRoll ? `${SOLIDS[good].the} עָגֹל, וְלָכֵן הוּא יָכוֹל לְהִתְגַּלְגֵּל.` : `${SOLIDS[good].to} יֵשׁ רַק פֵּאוֹת שְׁטוּחוֹת, וְלָכֵן הִיא לֹא מִתְגַּלְגֶּלֶת.`],
  });
}

const POLY_NAMES = { 3: 'מְשֻׁלָּשׁ', 4: 'מְרֻבָּע', 5: 'מְחֻמָּשׁ', 6: 'מְשֻׁשֶּׁה', 7: 'מְשֻׁבָּע', 8: 'מְתֻמָּן' };

function genShapeSides(level = 0) {
  const n = ri(3, level === 0 ? 5 : level === 1 ? 6 : 8);
  const sides = Math.random() < 0.5;
  return Q({
    type: 'shape_sides',
    topic: 'solids',
    figure: { kind: 'polygon', sides: n, rot: pick([0, 15, 30, 45]) },
    instruction: sides ? 'כַּמָּה צְלָעוֹת יֵשׁ לַמְּצֻלָּע?' : 'כַּמָּה קָדְקֳדִים יֵשׁ לַמְּצֻלָּע? (הַנְּקֻדּוֹת הַצְּהֻבּוֹת)',
    answer: n,
    hint: sides ? 'צֶלַע הִיא קַו יָשָׁר בַּגְּבוּל שֶׁל הַצּוּרָה. סִמְנוּ בְּאֶצְבַּע אֶת הַצֶּלַע הָרִאשׁוֹנָה, וְסִפְרוּ מִסָּבִיב.' : 'קָדְקֹד הוּא פִּנָּה - הַמָּקוֹם שֶׁבּוֹ שְׁתֵּי צְלָעוֹת נִפְגָּשׁוֹת.',
    steps: [`סוֹפְרִים מִסָּבִיב: יֵשׁ ${n} ${sides ? 'צְלָעוֹת' : 'קָדְקֳדִים'}.`, `לִמְצֻלָּע עִם ${n} צְלָעוֹת קוֹרְאִים ${POLY_NAMES[n]}, וְיֵשׁ לוֹ גַּם ${n} קָדְקֳדִים.`],
  });
}

/* ============================ ה. שיקוף והזזה ============================ */

const normalize = (cells) => {
  const mx = Math.min(...cells.map(([x]) => x)); const my = Math.min(...cells.map(([, y]) => y));
  return cells.map(([x, y]) => key(x - mx, y - my)).sort().join('|');
};
const mirrorX = (cells) => cells.map(([x, y]) => [-x, y]);
const isMirrorSymmetric = (cells) => normalize(cells) === normalize(mirrorX(cells));
const widthOf = (cells) => Math.max(...cells.map(([x]) => x)) - Math.min(...cells.map(([x]) => x)) + 1;
const heightOf = (cells) => Math.max(...cells.map(([, y]) => y)) - Math.min(...cells.map(([, y]) => y)) + 1;

/** השלמת צורה בשיקוף: לוחצים על משבצות בצד השני של הקו */
function genMirrorComplete(level = 0) {
  const halfW = level === 0 ? 3 : level === 1 ? 4 : 5;
  const H = level === 0 ? 4 : level === 1 ? 5 : 6;
  const size = level === 0 ? ri(3, 4) : level === 1 ? ri(4, 6) : ri(6, 9);
  const rightGiven = Math.random() < 0.5;
  let half = randomShape(halfW, H, size);
  // הצורה נוגעת בקו (כמו חצי פרפר) - רוב הפעמים
  if (level < 2 || Math.random() < 0.7) {
    const maxX = Math.max(...half.map(([x]) => x));
    half = shift(half, halfW - 1 - maxX, 0);
  }
  const W = halfW * 2;
  // הצד הנתון: שמאל (x < halfW), או ימין אחרי שיקוף
  const reflect = (cells) => cells.map(([x, y]) => [W - 1 - x, y]);
  const given = rightGiven ? reflect(half) : half;
  const target = reflect(given);
  return Q({
    type: 'mirror_complete',
    topic: 'symmetry',
    ui: 'mirror_grid',
    grid: { w: W, h: H, mirror: halfW, given },
    target: target.map(([x, y]) => key(x, y)).sort(),
    instruction: `הַשְׁלִימוּ אֶת הַצּוּרָה כְּמוֹ בְּמַרְאָה: לַחֲצוּ עַל הַמִּשְׁבָּצוֹת ${rightGiven ? 'מִשְּׂמֹאל' : 'מִיָּמִין'} לַקַּו הָאָדֹם.`,
    answer: target.length,
    answerText: `${target.length} מִשְׁבָּצוֹת - רְאוּ בַּצִּיּוּר`,
    hint: 'לְכָל מִשְׁבֶּצֶת צְבוּעָה יֵשׁ "תְּאוֹמָה" בַּצַּד הַשֵּׁנִי שֶׁל הַקַּו, בְּאוֹתָהּ שׁוּרָה וּבְאוֹתוֹ מֶרְחָק מֵהַקַּו.',
    steps: [
      'מִשְׁבֶּצֶת שֶׁצְּמוּדָה לַקַּו - גַּם הַתְּאוֹמָה שֶׁלָּהּ צְמוּדָה לַקַּו.',
      'מִשְׁבֶּצֶת שֶׁרְחוֹקָה מֵהַקַּו 2 מִשְׁבָּצוֹת - גַּם הַתְּאוֹמָה רְחוֹקָה 2 מִשְׁבָּצוֹת, בַּצַּד הַשֵּׁנִי.',
      `צָרִיךְ לִצְבֹּעַ ${target.length} מִשְׁבָּצוֹת.`,
    ],
  });
}

function genSymIs(level = 0) {
  const yes = Math.random() < 0.5;
  const halfW = level === 0 ? 3 : 4;
  const H = level === 0 ? 4 : 5;
  let cells;
  if (yes) {
    let half = randomShape(halfW, H, ri(3, level === 0 ? 4 : 6));
    const maxX = Math.max(...half.map(([x]) => x));
    half = shift(half, halfW - 1 - maxX, 0);
    cells = [...half, ...half.map(([x, y]) => [2 * halfW - 1 - x, y])];
  } else {
    // צורה שחוצה את הקו אבל לא סימטרית סביבו
    for (let guard = 0; guard < 100; guard++) {
      const c = shift(randomShape(4, H, ri(4, 7)), halfW - 2, 0);
      const set = new Set(c.map(([x, y]) => key(x, y)));
      const symmetric = c.every(([x, y]) => set.has(key(2 * halfW - 1 - x, y)));
      const crosses = c.some(([x]) => x < halfW) && c.some(([x]) => x >= halfW);
      if (!symmetric && crosses) { cells = c; break; }
    }
    if (!cells) cells = [[halfW - 1, 0], [halfW, 0], [halfW, 1]];
  }
  return Q({
    type: 'sym_is',
    topic: 'symmetry',
    ui: 'choice',
    noShuffle: true,
    figure: { kind: 'grid', w: halfW * 2, h: H, shapes: [{ cells, color: 'green' }], mirror: halfW },
    instruction: 'הַאִם הַקַּו הָאָדֹם הוּא קַו סִימֶטְרִיָּה שֶׁל הַצּוּרָה?',
    options: [opt(YES, yes), opt(NO, !yes)],
    answer: yes ? YES : NO,
    hint: 'דַּמְיְנוּ שֶׁמְּקַפְּלִים אֶת הַדַּף עַל הַקַּו הָאָדֹם. הַאִם שְׁנֵי הַחֲלָקִים שֶׁל הַצּוּרָה נוֹפְלִים בְּדִיּוּק זֶה עַל זֶה?',
    steps: [yes ? 'כְּשֶׁמְּקַפְּלִים עַל הַקַּו, כָּל מִשְׁבֶּצֶת נוֹפֶלֶת עַל הַתְּאוֹמָה שֶׁלָּהּ.' : 'כְּשֶׁמְּקַפְּלִים עַל הַקַּו, יֵשׁ מִשְׁבָּצוֹת שֶׁאֵין לָהֶן תְּאוֹמָה בַּצַּד הַשֵּׁנִי.',
      yes ? 'לָכֵן זֶה קַו סִימֶטְרִיָּה.' : 'לָכֵן זֶה לֹא קַו סִימֶטְרִיָּה.'],
  });
}

/** צורה לא סימטרית (כדי שאפשר יהיה להבדיל בין הזזה לשיקוף) */
function asymmetricShape(w, h, size) {
  for (let guard = 0; guard < 200; guard++) {
    const c = randomShape(w, h, size);
    if (!isMirrorSymmetric(c)) {
      const mx = Math.min(...c.map(([x]) => x)); const my = Math.min(...c.map(([, y]) => y));
      return shift(c, -mx, -my);
    }
  }
  return [[0, 0], [1, 0], [0, 1], [0, 2]];
}

const MOVE = 'הֲזָזָה';
const MIRROR = 'שִׁקּוּף';

function genMoveOrMirror(level = 0) {
  const shape = asymmetricShape(3, 3, ri(3, level === 0 ? 4 : 5));
  const sw = widthOf(shape); const sh = heightOf(shape);
  const isMove = Math.random() < 0.5;
  const gap = ri(1, 2);
  let image;
  if (isMove) image = shift(shape, sw + gap * 2, 0);
  else {
    const line = sw + gap;                // הקו בין העמודות line-1 ו-line
    image = shape.map(([x, y]) => [2 * line - 1 - x, y]);
  }
  const W = sw * 2 + gap * 2 + 2;
  return Q({
    type: 'move_or_mirror',
    topic: 'symmetry',
    ui: 'choice',
    noShuffle: true,
    figure: { kind: 'grid', w: W, h: sh + 2, shapes: [{ cells: shift(shape, 1, 1), color: 'blue' }, { cells: shift(image, 1, 1), color: 'yellow' }] },
    instruction: 'אֵיךְ הַצּוּרָה הַכְּחֻלָּה הָפְכָה לַצְּהֻבָּה: בַּהֲזָזָה אוֹ בְּשִׁקּוּף?',
    options: [opt(MOVE, isMove), opt(MIRROR, !isMove)],
    answer: isMove ? MOVE : MIRROR,
    hint: 'בַּהֲזָזָה הַצּוּרָה רַק זָזָה, וְהִיא נִרְאֵית בְּדִיּוּק אוֹתוֹ דָּבָר. בְּשִׁקּוּף הִיא הֲפוּכָה - כְּמוֹ בְּמַרְאָה.',
    steps: [isMove ? 'הַצּוּרָה הַצְּהֻבָּה נִרְאֵית בְּדִיּוּק כְּמוֹ הַכְּחֻלָּה, רַק בְּמָקוֹם אַחֵר.' : 'הַצּוּרָה הַצְּהֻבָּה הֲפוּכָה: מָה שֶׁהָיָה מִשְּׂמֹאל עָבַר לְיָמִין.', `לָכֵן זֶה ${isMove ? MOVE : MIRROR}.`],
  });
}

const DIRS = {
  right: { word: 'יָמִינָה', dx: 1, dy: 0 },
  left: { word: 'שְׂמֹאלָה', dx: -1, dy: 0 },
  down: { word: 'לְמַטָּה', dx: 0, dy: 1 },
  up: { word: 'לְמַעְלָה', dx: 0, dy: -1 },
};

function genShiftCount(level = 0) {
  const shape = asymmetricShape(3, 2, ri(3, 4));
  const dirKey = pick(level === 0 ? ['right'] : level === 1 ? ['right', 'left'] : ['right', 'left', 'up', 'down']);
  const dir = DIRS[dirKey];
  const along = dir.dx ? widthOf(shape) : heightOf(shape);
  const k = ri(along + 1, along + (dir.dx ? 4 : 2));
  const moved = shift(shape, dir.dx * k, dir.dy * k);
  const all = [...shape, ...moved];
  const mx = Math.min(...all.map(([x]) => x)); const my = Math.min(...all.map(([, y]) => y));
  const W = widthOf(all) + 2; const H = heightOf(all) + 2;
  return Q({
    type: 'shift_count',
    topic: 'symmetry',
    figure: { kind: 'grid', w: W, h: H, shapes: [{ cells: shift(shape, 1 - mx, 1 - my), color: 'blue' }, { cells: shift(moved, 1 - mx, 1 - my), color: 'yellow' }] },
    instruction: `הִזִּיזוּ אֶת הַצּוּרָה הַכְּחֻלָּה ${dir.word}, וְהִיא הִגִּיעָה לַמָּקוֹם הַצָּהֹב. בְּכַמָּה מִשְׁבָּצוֹת הִזִּיזוּ אוֹתָהּ?`,
    answer: k,
    unit: 'מִשְׁבָּצוֹת',
    hint: 'בַּחֲרוּ מִשְׁבֶּצֶת אַחַת בַּצּוּרָה הַכְּחֻלָּה, מִצְאוּ אֶת הַמִּשְׁבֶּצֶת הַמַּתְאִימָה בַּצְּהֻבָּה, וְסִפְרוּ כַּמָּה צְעָדִים יֵשׁ בֵּינֵיהֶן.',
    steps: [`כָּל מִשְׁבֶּצֶת בַּצּוּרָה זָזָה ${k} מִשְׁבָּצוֹת ${dir.word}.`, `לְמָשָׁל, הַפִּנָּה ${dir.dx ? 'הַשְּׂמָאלִית' : 'הָעֶלְיוֹנָה'} שֶׁל הַצּוּרָה זָזָה ${k} צְעָדִים.`],
  });
}

/* ============================ רשימת הגנרטורים ============================ */

export const GENERATORS_B = [
  // א. מספרים באותיות
  { type: 'heb_read', topic: 'hebrew_nums', weight: 1.3, gen: genHebRead },
  { type: 'heb_write', topic: 'hebrew_nums', weight: 1.2, gen: genHebWrite },
  { type: 'heb_date', topic: 'hebrew_nums', weight: 1, gen: genHebDate },

  // ב. חיבור וחיסור במאונך
  { type: 'vert_add', topic: 'vertical', weight: 1.4, gen: genVertAdd },
  { type: 'vert_sub', topic: 'vertical', weight: 1.4, gen: genVertSub },
  { type: 'vert_missing', topic: 'vertical', weight: 0.7, levelWeights: ADVANCED, gen: genVertMissing },

  // ב. כפל וחילוק
  { type: 'mult_groups', topic: 'mult_div', weight: 1, levelWeights: [2.5, 0.8, 0.3], gen: genMultGroups },
  { type: 'mult_array', topic: 'mult_div', weight: 1, levelWeights: [2, 1, 0.4], gen: genMultArray },
  { type: 'mult_fact', topic: 'mult_div', weight: 1.4, levelWeights: [1, 1.2, 1.6], gen: genMultFact },
  { type: 'div_fact', topic: 'mult_div', weight: 1.1, levelWeights: LATER, gen: genDivFact },
  { type: 'mult_missing', topic: 'mult_div', weight: 0.9, levelWeights: LATER, gen: genMultMissing },
  { type: 'mult_zero_one', topic: 'mult_div', weight: 0.6, gen: genMultZeroOne },

  // ב. קפיצות
  { type: 'skip_seq', topic: 'divisibility', weight: 1.3, gen: genSkipSeq },
  { type: 'jumps', topic: 'divisibility', weight: 1.1, gen: genJumps },
  { type: 'div_sign', topic: 'divisibility', weight: 1, gen: genDivSign },
  { type: 'land_on', topic: 'divisibility', weight: 0.8, levelWeights: LATER, gen: genLandOn },

  // ב. סוגריים
  { type: 'paren_eval', topic: 'parens', weight: 1.6, gen: genParenEval },
  { type: 'paren_place', topic: 'parens', weight: 0.9, levelWeights: LATER, gen: genParenPlace },
  { type: 'paren_compare', topic: 'parens', weight: 0.8, levelWeights: LATER, gen: genParenCompare },

  // ב. שאלות כפל וחילוק
  { type: 'wm_groups', topic: 'word_mult', weight: 1.4, levelWeights: [2, 1, 0.8], gen: genWmGroups },
  { type: 'wm_share', topic: 'word_mult', weight: 1.1, gen: genWmShare },
  { type: 'wm_contain', topic: 'word_mult', weight: 1, levelWeights: LATER, gen: genWmContain },
  { type: 'wm_buy', topic: 'word_mult', weight: 1, gen: genWmBuy },

  // ג. ישר המספרים
  { type: 'nl_locate', topic: 'numberline', weight: 1.2, gen: genNlLocate },
  { type: 'nl_read', topic: 'numberline', weight: 1.2, gen: genNlRead },
  { type: 'nl_negative', topic: 'numberline', weight: 0.9, levelWeights: LATER, gen: genNlNegative },

  // ג. חצי ורבע
  { type: 'frac_color', topic: 'fractions', weight: 1.3, gen: genFracColor },
  { type: 'frac_of', topic: 'fractions', weight: 1.2, gen: genFracOf },
  { type: 'frac_name', topic: 'fractions', weight: 1, gen: genFracName },
  { type: 'frac_facts', topic: 'fractions', weight: 0.8, gen: genFracFacts },

  // ד. דיאגרמות
  { type: 'data_read', topic: 'data', weight: 1.4, levelWeights: EASY_FIRST, gen: genDataRead },
  { type: 'data_most', topic: 'data', weight: 1.1, gen: genDataMost },
  { type: 'data_diff', topic: 'data', weight: 1, levelWeights: LATER, gen: genDataDiff },
  { type: 'data_total', topic: 'data', weight: 0.8, levelWeights: LATER, gen: genDataTotal },

  // ה. אורך ומשקל
  { type: 'unit_pick', topic: 'measure', weight: 1, gen: genUnitPick },
  { type: 'ruler_read', topic: 'measure', weight: 1.3, gen: genRulerRead },
  { type: 'balance_compare', topic: 'measure', weight: 1.1, gen: genBalanceCompare },
  { type: 'balance_count', topic: 'measure', weight: 1, gen: genBalanceCount },
  { type: 'length_word', topic: 'measure', weight: 0.9, gen: genLengthWord },

  // ה. שטח והיקף
  { type: 'area', topic: 'area', weight: 1.5, gen: genArea },
  { type: 'perimeter', topic: 'area', weight: 1.1, levelWeights: [0.5, 1, 1], gen: genPerimeter },
  { type: 'area_compare', topic: 'area', weight: 1, levelWeights: LATER, gen: genAreaCompare },

  // ה. שעון וזמן
  { type: 'clock_read', topic: 'time', weight: 1.5, gen: genClockRead },
  { type: 'clock_pick', topic: 'time', weight: 1.1, gen: genClockPick },
  { type: 'duration', topic: 'time', weight: 1, levelWeights: LATER, gen: genDuration },
  { type: 'time_facts', topic: 'time', weight: 0.7, gen: genTimeFacts },

  // ה. גופים וצורות
  { type: 'solid_name', topic: 'solids', weight: 1.3, gen: genSolidName },
  { type: 'solid_count', topic: 'solids', weight: 1.1, levelWeights: [0.6, 1, 1.2], gen: genSolidCount },
  { type: 'solid_face', topic: 'solids', weight: 1, gen: genSolidFace },
  { type: 'solid_roll', topic: 'solids', weight: 0.8, gen: genSolidRoll },
  { type: 'shape_sides', topic: 'solids', weight: 1, gen: genShapeSides },

  // ה. שיקוף והזזה
  { type: 'mirror_complete', topic: 'symmetry', weight: 1.5, gen: genMirrorComplete },
  { type: 'sym_is', topic: 'symmetry', weight: 1.1, gen: genSymIs },
  { type: 'move_or_mirror', topic: 'symmetry', weight: 1, gen: genMoveOrMirror },
  { type: 'shift_count', topic: 'symmetry', weight: 1, gen: genShiftCount },
];

/* ============================ דוגמאות מתוך התכנית ============================ */

export const PROGRAM_B = [
  () => P({
    type: 'prog_tu', topic: 'hebrew_nums', ui: 'choice', instruction: 'אֵיךְ כּוֹתְבִים אֶת הַמִּסְפָּר 15 בְּאוֹתִיּוֹת?',
    options: shuffle([opt('ט״ו', true), opt('י״ה'), opt('י״ד'), opt('ט״ז')]),
    answer: 'ט״ו', hint: TU_NOTE, steps: ['9 + 6 = 15.', 'לָכֵן כּוֹתְבִים ט״ו.'],
  }),
  () => P({
    type: 'prog_5x2_3', topic: 'parens', expr: '(5 × 2) + 3 = ?', answer: 13,
    hint: PAREN_HINT, steps: ['קֹדֶם הַסּוֹגְרַיִם: 5 × 2 = 10.', 'אַחַר כָּךְ: 10 + 3 = 13.'],
  }),
  () => P({
    type: 'prog_3_4_5', topic: 'parens', expr: '3 + (4 + 5) = ?', answer: 12,
    hint: PAREN_HINT, steps: ['קֹדֶם הַסּוֹגְרַיִם: 4 + 5 = 9.', 'אַחַר כָּךְ: 3 + 9 = 12.'],
  }),
  () => P({
    type: 'prog_hands', topic: 'word_mult', ui: 'mission', minLevel: 1, instruction: 'מְשִׂימַת כֶּפֶל:', unit: 'אֶצְבָּעוֹת',
    story: 'לְכָל יֶלֶד יֵשׁ [[2]] יָדַיִם, וּבְכָל יָד [[5]] אֶצְבָּעוֹת. כַּמָּה אֶצְבָּעוֹת יֵשׁ לְ-[[3]] יְלָדִים?', answer: 30,
    hint: 'קֹדֶם מְחַשְּׁבִים כַּמָּה יָדַיִם יֵשׁ לִשְׁלוֹשָׁה יְלָדִים.',
    steps: ['3 × 2 = 6 יָדַיִם.', '6 × 5 = 30 אֶצְבָּעוֹת.'],
  }),
  () => P({
    type: 'prog_35_5', topic: 'divisibility', ui: 'mission', instruction: 'חִידַת קְפִיצוֹת:',
    story: 'כַּמָּה פְּעָמִים [[5]] נִכְנָס בְּ-[[35]]?', answer: 7,
    hint: 'סוֹפְרִים בִּקְפִיצוֹת שֶׁל 5 עַד 35.', steps: ['5, 10, 15, 20, 25, 30, 35.', 'הָיוּ 7 קְפִיצוֹת, כִּי 7 × 5 = 35.'],
  }),
  () => P({
    type: 'prog_half_10', topic: 'fractions', instruction: 'כַּמָּה זֶה?', expr: 'חֲצִי שֶׁל 10', exprRtl: true, answer: 5,
    hint: 'אֵיזֶה מִסְפָּר וְעוֹד אוֹתוֹ מִסְפָּר נוֹתֵן 10?', steps: ['5 + 5 = 10.', 'לָכֵן חֲצִי שֶׁל 10 הוּא 5.'],
  }),
];
