// questions.js - מנוע השאלות לכיתה ב': כל סוג שאלה הוא גנרטור שמייצר מספרים חדשים בכל פעם.
// כל שאלה מחזירה: נוסח, תשובה נכונה, רמז, ופתרון מלא בשלבים.
// הנושאים והדוגמאות לקוחים מתכנית הלימודים במתמטיקה של משרד החינוך לכיתה ב'.
// כל טקסט שהילד/ה קורא/ת מנוקד. פונים לילד/ה בלשון רבים (פִּתְרוּ, לַחֲצוּ), כדי שהניקוד יתאים לכולם.

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
    instruction: 'פִּתְרוּ אֶת הַתַּרְגִּיל:',
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
  { n: 'נוֹעָה', g: 'f' }, { n: 'אִיתַי', g: 'm' }, { n: 'מַאיָה', g: 'f' }, { n: 'יוֹנָתָן', g: 'm' },
  { n: 'תָּמָר', g: 'f' }, { n: 'אוּרִי', g: 'm' }, { n: 'שִׁירָה', g: 'f' }, { n: 'דָּנִיֵּאל', g: 'm' },
  { n: 'רוֹנִי', g: 'f' }, { n: 'עוֹמֶר', g: 'm' },
];

function twoPeople() {
  const [a, b] = shuffle(PEOPLE);
  return [a, b];
}

/** בחירת מילה לפי מין: g(p, 'קָנָה', 'קָנְתָה') */
const g = (p, m, f) => (p.g === 'f' ? f : m);

const THINGS = ['קְלָפֵי פּוֹקִימוֹן', 'מַדְבֵּקוֹת', 'גֻּלּוֹת', 'סֻכָּרִיּוֹת', 'פּוֹקָדוֹרִים'];

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
  if (h) steps.push(`${fmt(h)} לוּחוֹת שֶׁל מֵאָה = ${fmt(h * 100)}.`);
  steps.push(t ? `${fmt(t)} מוֹטוֹת שֶׁל עֶשֶׂר = ${fmt(t * 10)}.` : 'אֵין מוֹטוֹת שֶׁל עֶשֶׂר, וְלָכֵן סִפְרַת הָעֲשָׂרוֹת הִיא 0.');
  steps.push(u ? `${fmt(u)} קֻבִּיּוֹת בּוֹדְדוֹת = ${fmt(u)}.` : 'אֵין קֻבִּיּוֹת בּוֹדְדוֹת, וְלָכֵן סִפְרַת הַיְּחִידוֹת הִיא 0.');
  steps.push(`בְּיַחַד: ${fmt(ans)}.`);
  return Q({
    type: 'pv_read',
    topic: 'numbers',
    ui: 'place_value',
    blocks: { h, t, u },
    instruction: 'כַּמָּה קֻבִּיּוֹת יֵשׁ כָּאן? כִּתְבוּ אֶת הַמִּסְפָּר:',
    answer: ans,
    hint: 'כָּל לוּחַ גָּדוֹל הוּא 100, כָּל מוֹט הוּא 10, וְכָל קֻבִּיָּה קְטַנָּה הִיא 1. סוֹפְרִים קֹדֶם אֶת הַגְּדוֹלִים.',
    steps,
  });
}

/* --- ספרת העשרות / היחידות / המאות, וערך הספרה --- */
const PLACES = [
  { key: 'u', name: 'הַיְּחִידוֹת', value: 1 },
  { key: 't', name: 'הָעֲשָׂרוֹת', value: 10 },
  { key: 'h', name: 'הַמֵּאוֹת', value: 100 },
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
      instruction: `מָה הָעֵרֶךְ שֶׁל הַסִּפְרָה ${d} בַּמִּסְפָּר ${fmt(n)}?`,
      expr: fmt(n),
      answer: d * place.value,
      hint: 'בּוֹדְקִים בְּאֵיזֶה מָקוֹם הַסִּפְרָה נִמְצֵאת: מֵאוֹת, עֲשָׂרוֹת אוֹ יְחִידוֹת.',
      steps: [
        `${fmt(n)} = ${fmt(a * 100)} + ${fmt(b * 10)} + ${fmt(c)}.`,
        `הַסִּפְרָה ${d} נִמְצֵאת בַּמָּקוֹם שֶׁל ${place.name}, וְלָכֵן הָעֵרֶךְ שֶׁלָּהּ הוּא ${fmt(d * place.value)}.`,
      ],
    });
  }

  const n = level === 0 ? ri(10, 99) : ri(100, 999);
  const places = level === 0 ? PLACES.slice(0, 2) : PLACES;
  const place = pick(places);
  const d = digitsOf(n);
  const ans = d[place.key];
  const parts = level === 0
    ? `${fmt(n)} = ${fmt(d.t)} עֲשָׂרוֹת וְ-${fmt(d.u)} יְחִידוֹת.`
    : `${fmt(n)} = ${fmt(d.h)} מֵאוֹת, ${fmt(d.t)} עֲשָׂרוֹת וְ-${fmt(d.u)} יְחִידוֹת.`;
  const steps = [parts, `סִפְרַת ${place.name} הִיא ${fmt(ans)}.`];
  if (ans === 0) steps.push('הָאֶפֶס שׁוֹמֵר עַל הַמָּקוֹם: הוּא אוֹמֵר שֶׁאֵין כָּאן בּוֹדְדִים מֵהַסּוּג הַזֶּה.');
  return Q({
    type: 'pv_digit',
    topic: 'numbers',
    instruction: `מָה סִפְרַת ${place.name} בַּמִּסְפָּר?`,
    expr: fmt(n),
    answer: ans,
    hint: level === 0
      ? 'בְּמִסְפָּר דּוּ-סִפְרָתִי: הַסִּפְרָה הַשְּׂמָאלִית הִיא הָעֲשָׂרוֹת, וְהַיְּמָנִית הִיא הַיְּחִידוֹת.'
      : 'בְּמִסְפָּר תְּלַת-סִפְרָתִי: הַסִּפְרָה הַשְּׂמָאלִית הִיא הַמֵּאוֹת, הָאֶמְצָעִית הִיא הָעֲשָׂרוֹת, וְהַיְּמָנִית הִיא הַיְּחִידוֹת.',
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
  if (h) parts.push(`${fmt(h)} מֵאוֹת`);
  if (t || level < 2) parts.push(`${fmt(t)} עֲשָׂרוֹת`);
  if (u || parts.length < 2) parts.push(`${fmt(u)} יְחִידוֹת`);
  const text = parts.length > 1 ? `${parts.slice(0, -1).join(', ')} וְ-${parts[parts.length - 1]}` : parts[0];
  return Q({
    type: 'pv_compose',
    topic: 'numbers',
    instruction: 'אֵיזֶה מִסְפָּר זֶה?',
    expr: text,
    exprRtl: true,
    answer: ans,
    hint: 'כּוֹתְבִים אֶת סִפְרַת הַמֵּאוֹת, אַחֲרֶיהָ אֶת סִפְרַת הָעֲשָׂרוֹת, וּבַסּוֹף אֶת סִפְרַת הַיְּחִידוֹת. אִם חָסֵר מַשֶּׁהוּ - כּוֹתְבִים 0 בִּמְקוֹמוֹ.',
    steps: [
      h ? `מֵאוֹת: ${fmt(h)}, עֲשָׂרוֹת: ${fmt(t)}, יְחִידוֹת: ${fmt(u)}.` : `עֲשָׂרוֹת: ${fmt(t)}, יְחִידוֹת: ${fmt(u)}.`,
      `הַמִּסְפָּר הוּא ${fmt(ans)}.`,
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
  const verb = step > 0 ? 'מוֹסִיפִים' : 'מוֹרִידִים';
  return Q({
    type: 'sequence',
    topic: 'numbers',
    ui: 'numberline_fill',
    stones,
    instruction: 'הַשְׁלִימוּ אֶת הַסִּדְרָה:',
    answer: blankIdx.map((i) => values[i]),
    answerText: blankIdx.map((i) => fmt(values[i])).join(', '),
    hint: `בִּדְקוּ כַּמָּה מִשְׁתַּנֶּה בֵּין שְׁנֵי הַמִּסְפָּרִים הָרִאשׁוֹנִים: ${fmt(values[0])} וְאַחֲרָיו ${fmt(values[1])}.`,
    steps: [
      `בְּכָל קְפִיצָה ${verb} ${fmt(Math.abs(step))}.`,
      `הַסִּדְרָה: ${values.map(fmt).join(', ')}.`,
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
  const word = bigger ? 'הַגָּדוֹל' : 'הַקָּטָן';
  let text = `הַמִּסְפָּר ${word} בְּ-${fmt(d)} מִ-${fmt(n)}`;
  if (d === 1 && level === 0 && Math.random() < 0.5) text = bigger ? `הַמִּסְפָּר הָעוֹקֵב לְ-${fmt(n)}` : `הַמִּסְפָּר הַקּוֹדֵם לְ-${fmt(n)}`;
  return Q({
    type: 'neighbors',
    topic: 'numbers',
    instruction: 'אֵיזֶה מִסְפָּר זֶה?',
    expr: text,
    exprRtl: true,
    answer: ans,
    hint: d === 1
      ? (bigger ? 'הַמִּסְפָּר הָעוֹקֵב בָּא מִיָּד אַחֲרֵי הַמִּסְפָּר בַּסְּפִירָה.' : 'הַמִּסְפָּר הַקּוֹדֵם בָּא מִיָּד לִפְנֵי הַמִּסְפָּר בַּסְּפִירָה.')
      : `${bigger ? 'מוֹסִיפִים' : 'מוֹרִידִים'} ${fmt(d)}. שִׂימוּ לֵב אֵיזוֹ סִפְרָה מִשְׁתַּנָּה.`,
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
      instruction: 'חִידַת סְפָרוֹת:',
      story: `בַּמִּסְפָּר [[${fmt(n)}]] מָחֲקוּ אֶת סִפְרַת הָעֲשָׂרוֹת. אֵיזֶה מִסְפָּר הִתְקַבֵּל?`,
      answer: ans,
      hint: `סִפְרַת הָעֲשָׂרוֹת שֶׁל ${fmt(n)} הִיא ${t}. מָה נִשְׁאָר כְּשֶׁמּוֹחֲקִים אוֹתָהּ?`,
      steps: [`סִפְרַת הָעֲשָׂרוֹת הִיא ${t}.`, `בְּלִי הַ-${t} נִשְׁאָרוֹת הַסְּפָרוֹת ${h} וְ-${u}, כְּלוֹמַר ${fmt(ans)}.`],
    });
  }
  const nt = ri(t + 1, 9);
  const m = h * 100 + nt * 10 + u;
  if (kind === 'result') {
    return Q({
      type: 'digit_change',
      topic: 'numbers',
      ui: 'mission',
      instruction: 'חִידַת סְפָרוֹת:',
      story: `בַּמִּסְפָּר [[${fmt(n)}]] שִׁנּוּ אֶת סִפְרַת הָעֲשָׂרוֹת לְ-[[${nt}]]. אֵיזֶה מִסְפָּר הִתְקַבֵּל?`,
      answer: m,
      hint: 'רַק סִפְרַת הָעֲשָׂרוֹת מִתְחַלֶּפֶת. הַמֵּאוֹת וְהַיְּחִידוֹת נִשְׁאָרוֹת בִּמְקוֹמָן.',
      steps: [`סִפְרַת הָעֲשָׂרוֹת ${t} הוֹפֶכֶת לְ-${nt}.`, `הַמִּסְפָּר הֶחָדָשׁ: ${fmt(m)}.`],
    });
  }
  return Q({
    type: 'digit_change',
    topic: 'numbers',
    ui: 'mission',
    instruction: 'חִידַת סְפָרוֹת:',
    story: `בַּמִּסְפָּר [[${fmt(n)}]] שִׁנּוּ אֶת סִפְרַת הָעֲשָׂרוֹת לְ-[[${nt}]]. בְּכַמָּה גָּדַל הַמִּסְפָּר?`,
    answer: m - n,
    hint: `סִפְרַת הָעֲשָׂרוֹת גָּדְלָה מִ-${t} לְ-${nt}. כָּל עֲשֶׂרֶת שָׁוָה 10.`,
    steps: [
      `הַמִּסְפָּר הֶחָדָשׁ הוּא ${fmt(m)}.`,
      `סִפְרַת הָעֲשָׂרוֹת גָּדְלָה בְּ-${nt - t}, כְּלוֹמַר בְּ-${nt - t} עֲשָׂרוֹת.`,
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
    instruction: biggest ? 'אֵיזֶה מִסְפָּר הֲכִי גָּדוֹל?' : 'אֵיזֶה מִסְפָּר הֲכִי קָטָן?',
    options: choiceOptions(fmt(target), nums.filter((x) => x !== target).map(fmt), true),
    answer: fmt(target),
    hint: 'קֹדֶם בּוֹדְקִים כַּמָּה סְפָרוֹת יֵשׁ בְּכָל מִסְפָּר. אִם יֵשׁ אוֹתוֹ מִסְפַּר סְפָרוֹת - מַשְׁוִים אֶת הַסִּפְרָה הַשְּׂמָאלִית, וְאַחַר כָּךְ אֶת הַבָּאָה.',
    steps: [
      `מְסַדְּרִים מֵהַקָּטָן לַגָּדוֹל: ${[...nums].sort((a, b) => a - b).map(fmt).join(', ')}.`,
      `${biggest ? 'הֲכִי גָּדוֹל' : 'הֲכִי קָטָן'}: ${fmt(target)}.`,
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
    instruction: `אֵיזֶה מִסְפָּר נִמְצָא בֵּין ${fmt(lo)} לְ-${fmt(hi)}?`,
    options: choiceOptions(fmt(inside), wrongs.slice(0, 3).map(fmt), true),
    answer: fmt(inside),
    hint: `צָרִיךְ מִסְפָּר שֶׁגָּדוֹל מִ-${fmt(lo)}, וְגַם קָטָן מִ-${fmt(hi)}.`,
    steps: [
      `${fmt(inside)} גָּדוֹל מִ-${fmt(lo)}.`,
      `${fmt(inside)} קָטָן מִ-${fmt(hi)}, וְלָכֵן הוּא נִמְצָא בֵּינֵיהֶם.`,
    ],
  });
}

/* ============================ א. זוגי ואי-זוגי ============================ */

const EVEN_WORD = (n) => (isEven(n) ? 'זוּגִי' : 'אִי-זוּגִי');

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
    instruction: level === 0 ? `הַאִם ${n} זוּגִי אוֹ אִי-זוּגִי? (אֶפְשָׁר לִסְפֹּר זוּגוֹת)` : `הַאִם ${fmt(n)} זוּגִי אוֹ אִי-זוּגִי?`,
    options: [opt('זוּגִי', even), opt('אִי-זוּגִי', !even)],
    answer: EVEN_WORD(n),
    hint: 'מִסְפָּר זוּגִי אֶפְשָׁר לְסַדֵּר בְּזוּגוֹת, בְּלִי שֶׁיִּשָּׁאֵר אֶחָד לְבַד. אֶפְשָׁר גַּם לְהִסְתַּכֵּל רַק עַל סִפְרַת הַיְּחִידוֹת: 0, 2, 4, 6, 8 - זוּגִי.',
    steps: level === 0
      ? [`מְסַדְּרִים ${n} בְּזוּגוֹת: ${even ? 'כֻּלָּם מִסְתַּדְּרִים בְּזוּגוֹת' : 'נִשְׁאָר אֶחָד לְבַד'}.`, `לָכֵן ${n} הוּא ${EVEN_WORD(n)}.`]
      : [`סִפְרַת הַיְּחִידוֹת שֶׁל ${fmt(n)} הִיא ${u}.`, `${u} ${isEven(u) ? 'זוּגִית' : 'אִי-זוּגִית'}, וְלָכֵן ${fmt(n)} הוּא ${EVEN_WORD(n)}.`],
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
    instruction: wantEven ? 'אֵיזֶה מֵהַמִּסְפָּרִים זוּגִי?' : 'אֵיזֶה מֵהַמִּסְפָּרִים אִי-זוּגִי?',
    options: choiceOptions(fmt(correct), wrongs.map(fmt), true),
    answer: fmt(correct),
    hint: 'מִסְתַּכְּלִים עַל סִפְרַת הַיְּחִידוֹת שֶׁל כָּל מִסְפָּר. מִסְפָּר זוּגִי נִגְמָר בְּ-0, 2, 4, 6 אוֹ 8.',
    steps: [
      `סִפְרַת הַיְּחִידוֹת שֶׁל ${fmt(correct)} הִיא ${correct % 10}.`,
      `לָכֵן ${fmt(correct)} הוּא ${EVEN_WORD(correct)}, וְכָל הַשְּׁאָר ${wantEven ? 'אִי-זוּגִיִּים' : 'זוּגִיִּים'}.`,
    ],
  });
}

/** כל הסידורים של הספרות */
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
    instruction: `אֵיזֶה מִסְפָּר זוּגִי אֶפְשָׁר לִבְנוֹת מֵהַסְּפָרוֹת ${list}? (כָּל סִפְרָה פַּעַם אַחַת)`,
    options: choiceOptions(fmt(correct), oddsN.slice(0, 3).map(fmt), true),
    answer: fmt(correct),
    hint: 'מִסְפָּר זוּגִי נִגְמָר בְּסִפְרָה זוּגִית. אֵיזוֹ סִפְרָה זוּגִית יֵשׁ כָּאן?',
    steps: [
      `הַסִּפְרָה הַזּוּגִית הִיא ${evenDigit}, וְלָכֵן הִיא צְרִיכָה לִהְיוֹת בַּסּוֹף (בִּמְקוֹם הַיְּחִידוֹת).`,
      `${fmt(correct)} נִגְמָר בְּ-${evenDigit}, וְלָכֵן הוּא זוּגִי.`,
    ],
  });
}

function genEoNext(level = 0) {
  const wantEven = Math.random() < 0.5;
  const after = Math.random() < 0.6;
  const n = level === 0 ? ri(3, 40) : ri(41, level === 1 ? 199 : 999);
  let ans = after ? n + 1 : n - 1;
  if (isEven(ans) !== wantEven) ans = after ? ans + 1 : ans - 1;
  const kind = wantEven ? 'הַזּוּגִי' : 'הָאִי-זוּגִי';
  const dir = after ? 'קָדִימָה' : 'אֲחוֹרָה';
  return Q({
    type: 'eo_next',
    topic: 'even_odd',
    instruction: 'אֵיזֶה מִסְפָּר זֶה?',
    expr: `הַמִּסְפָּר ${kind} שֶׁבָּא ${after ? 'אַחֲרֵי' : 'לִפְנֵי'} ${fmt(n)}`,
    exprRtl: true,
    answer: ans,
    hint: `סוֹפְרִים ${dir} מִ-${fmt(n)}, וְעוֹצְרִים בַּמִּסְפָּר ${kind} הָרִאשׁוֹן.`,
    steps: [
      `סוֹפְרִים ${dir}: ${after ? `${fmt(n + 1)}, ${fmt(n + 2)}` : `${fmt(n - 1)}, ${fmt(n - 2)}`}...`,
      `הַמִּסְפָּר ${kind} הָרִאשׁוֹן הוּא ${fmt(ans)}.`,
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
    instruction: 'חִידַת מִסְפָּרִים עוֹקְבִים:',
    story: `שְׁנֵי מִסְפָּרִים עוֹקְבִים (אֶחָד בָּא מִיָּד אַחֲרֵי הַשֵּׁנִי) בְּיַחַד הֵם [[${fmt(sum)}]]. מָה הַמִּסְפָּר הַקָּטָן מִבֵּינֵיהֶם?`,
    answer: k,
    hint: 'שְׁנֵי מִסְפָּרִים עוֹקְבִים קְרוֹבִים מְאוֹד זֶה לָזֶה. נַסּוּ מִסְפָּר שֶׁקָּרוֹב לַחֲצִי שֶׁל הַסְּכוּם, וּבִדְקוּ.',
    steps: [`${fmt(k)} וְ-${fmt(k + 1)} הֵם מִסְפָּרִים עוֹקְבִים.`, `${fmt(k)} + ${fmt(k + 1)} = ${fmt(sum)} ✔`],
  });
}

function genEoRule(level = 1) {
  const kind = pick(['ee', 'oo', 'eo']);
  const mk = (even) => { const x = ri(11, 89); return isEven(x) === even ? x : x + 1; };
  const a = mk(kind !== 'oo');
  const b = mk(kind === 'ee');
  const even = isEven(a + b);
  const why = kind === 'ee' ? 'זוּגִי וְעוֹד זוּגִי - כָּל הַזּוּגוֹת נִשְׁאָרִים זוּגוֹת.'
    : kind === 'oo' ? 'לְכָל אֶחָד מֵהֶם נִשְׁאָר אֶחָד לְבַד, וּשְׁנֵי הַבּוֹדְדִים יוֹצְרִים בְּיַחַד עוֹד זוּג.'
      : 'לְאֶחָד מֵהֶם נִשְׁאָר אֶחָד לְבַד, וְאֵין לוֹ בֶּן זוּג.';
  return Q({
    type: 'eo_rule',
    topic: 'even_odd',
    ui: 'choice',
    noShuffle: true,
    instruction: 'בְּלִי לְחַשֵּׁב: הַאִם הַתּוֹצָאָה זוּגִית אוֹ אִי-זוּגִית?',
    expr: `${a} + ${b}`,
    options: [opt('זוּגִי', even), opt('אִי-זוּגִי', !even)],
    answer: EVEN_WORD(a + b),
    hint: 'בּוֹדְקִים אִם כָּל אֶחָד מֵהַמִּסְפָּרִים זוּגִי אוֹ אִי-זוּגִי. מָה קוֹרֶה לַזּוּגוֹת כְּשֶׁמְּחַבְּרִים?',
    steps: [
      `${a} הוּא ${EVEN_WORD(a)}, וְ-${b} הוּא ${EVEN_WORD(b)}.`,
      why,
      `וּבֶאֱמֶת: ${a} + ${b} = ${a + b}, מִסְפָּר ${EVEN_WORD(a + b)}.`,
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
      hint: ans > 10 ? `מַשְׁלִימִים קֹדֶם לְ-10: ${big} + ${toTen} = 10, וְאָז מוֹסִיפִים אֶת מָה שֶׁנִּשְׁאַר.` : `מַתְחִילִים מִ-${big} וְסוֹפְרִים עוֹד ${small}.`,
      steps: ans > 10
        ? [`מְפָרְקִים אֶת ${small} לְ-${toTen} וְ-${small - toTen}.`, `${big} + ${toTen} = 10.`, `10 + ${small - toTen} = ${ans}.`]
        : [`מַתְחִילִים מִ-${big} וְסוֹפְרִים עוֹד ${small}.`, `${a} + ${b} = ${ans}.`],
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
    hint: `אֶפְשָׁר לַחְשֹׁב עַל חִבּוּר: כַּמָּה צָרִיךְ לְהוֹסִיף לְ-${b} כְּדֵי לְהַגִּיעַ לְ-${c}?`,
    steps: cross
      ? [`מְפָרְקִים אֶת ${b} לְ-${c - 10} וְ-${b - (c - 10)}.`, `${c} - ${c - 10} = 10.`, `10 - ${b - (c - 10)} = ${ans}.`]
      : [`${c} - ${b} = ${ans}.`, `בְּדִיקָה: ${ans} + ${b} = ${c}.`],
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
      steps = [`${u} + ${b} = 10, כְּלוֹמַר עוֹד עֲשֶׂרֶת שְׁלֵמָה.`, `${a} + ${b} = ${ans}.`];
    } else {
      steps = [`מַשְׁלִימִים לָעֲשֶׂרֶת הַבָּאָה: ${a} + ${need} = ${a + need}.`, `מִתּוֹךְ ${b} נִשְׁאֲרוּ עוֹד ${b - need}.`, `${a + need} + ${b - need} = ${ans}.`];
    }
    return Q({
      type: 'add_2d1d', topic: 'add_sub', expr: `${a} + ${b} = ?`, answer: ans,
      hint: regroup ? `מַשְׁלִימִים קֹדֶם לָעֲשֶׂרֶת הַבָּאָה (${a + need}), וְאָז מוֹסִיפִים אֶת מָה שֶׁנִּשְׁאַר.` : 'מְחַבְּרִים אֶת הַיְּחִידוֹת לַיְּחִידוֹת. הָעֲשָׂרוֹת נִשְׁאָרוֹת.',
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
    steps = [`${a} - 10 = ${a - 10}.`, `הוֹרַדְנוּ ${10 - b} יוֹתֵר מִדַּי, וְלָכֵן מַחְזִירִים: ${a - 10} + ${10 - b} = ${ans}.`];
  } else {
    steps = [`קֹדֶם יוֹרְדִים לָעֲשֶׂרֶת הַשְּׁלֵמָה: ${a} - ${u} = ${tens}.`, `מִתּוֹךְ ${b} נִשְׁאֲרוּ עוֹד ${b - u} לְהוֹרִיד.`, `${tens} - ${b - u} = ${ans}.`];
  }
  let hint = 'מוֹרִידִים אֶת הַיְּחִידוֹת מֵהַיְּחִידוֹת. הָעֲשָׂרוֹת נִשְׁאָרוֹת.';
  if (regroup) {
    hint = u === 0
      ? 'אֶפְשָׁר לְהוֹרִיד 10, וְאָז לְהַחְזִיר אֶת מָה שֶׁהוֹרַדְנוּ יוֹתֵר מִדַּי.'
      : `קֹדֶם מוֹרִידִים ${u} כְּדֵי לְהַגִּיעַ לְ-${tens}, וְאָז אֶת הַשְּׁאָר.`;
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
    const steps = [`מוֹסִיפִים אֶת הָעֲשָׂרוֹת: ${a} + ${tb * 10} = ${a + tb * 10}.`];
    if (ub) steps.push(`מוֹסִיפִים אֶת הַיְּחִידוֹת: ${a + tb * 10} + ${ub} = ${ans}.`);
    return Q({
      type: 'add_2d2d', topic: 'add_sub', expr: `${a} + ${b} = ?`, answer: ans,
      hint: `מְפָרְקִים אֶת ${b} לַעֲשָׂרוֹת וְלִיחִידוֹת: ${tb * 10} וְ-${ub}. קֹדֶם מוֹסִיפִים אֶת הָעֲשָׂרוֹת, וְאַחַר כָּךְ אֶת הַיְּחִידוֹת.`,
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
  const steps = [`מוֹרִידִים אֶת הָעֲשָׂרוֹת: ${a} - ${tb * 10} = ${a - tb * 10}.`];
  if (ub) steps.push(`מוֹרִידִים אֶת הַיְּחִידוֹת: ${a - tb * 10} - ${ub} = ${ans}.`);
  return Q({
    type: 'add_2d2d', topic: 'add_sub', expr: `${a} - ${b} = ?`, answer: ans,
    hint: `מְפָרְקִים אֶת ${b} לַעֲשָׂרוֹת וְלִיחִידוֹת: ${tb * 10} וְ-${ub}. קֹדֶם מוֹרִידִים אֶת הָעֲשָׂרוֹת, וְאַחַר כָּךְ אֶת הַיְּחִידוֹת.`,
    steps,
  });
}

/* --- עשרות שלמות ומאות שלמות --- */
function genTens(level = 0) {
  const unit = level === 2 && Math.random() < 0.6 ? 100 : 10;
  const word = unit === 100 ? 'מֵאוֹת' : 'עֲשָׂרוֹת';
  let a = ri(1, 9) * unit;
  let b = ri(1, 9) * unit;
  let add = Math.random() < 0.5;
  if (add && a + b > unit * 10) add = false;
  if (!add && b > a) [a, b] = [b, a];
  const ans = add ? a + b : a - b;
  const op = add ? '+' : '-';
  const opWord = add ? 'וְעוֹד' : 'פָּחוֹת';
  return Q({
    type: 'tens', topic: 'add_sub', expr: `${fmt(a)} ${op} ${fmt(b)} = ?`, answer: ans,
    hint: `חוֹשְׁבִים עַל ${word}: ${a / unit} ${word} ${opWord} ${b / unit} ${word}.`,
    steps: [
      `${a / unit} ${word} ${opWord} ${b / unit} ${word} = ${ans / unit} ${word}.`,
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
  if (kind === 'h') { other = ri(1, 9 - h) * 100; ans = base + other; why = 'מוֹסִיפִים מֵאוֹת לַמֵּאוֹת.'; }
  else if (kind === 't') { other = ri(1, 9 - t) * 10; ans = base + other; why = 'מוֹסִיפִים עֲשָׂרוֹת לָעֲשָׂרוֹת.'; }
  else if (kind === 'tu') { other = ri(1, 9 - t) * 10 + ri(1, 9); ans = base + other; why = 'מוֹסִיפִים עֲשָׂרוֹת לָעֲשָׂרוֹת, וִיחִידוֹת לַיְּחִידוֹת.'; }
  else if (kind === 'subH') { other = ri(1, h) * 100; ans = base - other; op = '-'; why = 'מוֹרִידִים מֵאוֹת מֵהַמֵּאוֹת.'; }
  else { other = ri(1, t) * 10; ans = base - other; op = '-'; why = 'מוֹרִידִים עֲשָׂרוֹת מֵהָעֲשָׂרוֹת.'; }
  return Q({
    type: 'mental3', topic: 'add_sub', expr: `${fmt(base)} ${op} ${fmt(other)} = ?`, answer: ans,
    hint: 'חוֹשְׁבִים לְפִי עֵרֶךְ הַמָּקוֹם: מֵאוֹת עִם מֵאוֹת, עֲשָׂרוֹת עִם עֲשָׂרוֹת, יְחִידוֹת עִם יְחִידוֹת.',
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
    hint = `אֵיזֶה מִסְפָּר וְעוֹד ${b} נוֹתֵן ${c}? אֶפְשָׁר לְנַסּוֹת מִסְפָּר וְלִבְדֹּק, אוֹ לְחַשֵּׁב ${c} - ${b}.`;
  } else if (form === 'ax-') {
    const a = ri(level === 0 ? 5 : 20, max);
    x = ri(1, a - 1);
    const d = a - x;
    expr = `${a} - ? = ${d}`;
    check = `${a} - ${x} = ${d}`;
    hint = `כַּמָּה צָרִיךְ לְהוֹרִיד מִ-${a} כְּדֵי לְהַגִּיעַ לְ-${d}? אֶפְשָׁר לִסְפֹּר מִ-${d} עַד ${a}.`;
  } else {
    const b = ri(2, 9);
    x = ri(b + 5, max);
    const d = x - b;
    expr = `? - ${b} = ${d}`;
    check = `${x} - ${b} = ${d}`;
    hint = `הוֹרִידוּ ${b} וְנִשְׁאַר ${d}. כְּדֵי לִמְצֹא מָה הָיָה בַּהַתְחָלָה - מַחְזִירִים אֶת מָה שֶׁהוֹרִידוּ.`;
  }
  return Q({
    type: 'miss_add',
    topic: 'missing',
    instruction: 'אֵיזֶה מִסְפָּר חָסֵר?',
    expr,
    answer: x,
    hint,
    steps: [`הַמִּסְפָּר הֶחָסֵר הוּא ${x}.`, `בְּדִיקָה: ${check} ✔`],
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
    instruction: 'בְּעֶזְרַת הַתַּרְגִּיל הַפָּתוּר - בְּלִי לְחַשֵּׁב מֵחָדָשׁ:',
    given: `${a} + ${b} = ${c}`,
    expr,
    answer: ans,
    hint: kind === 'b+a'
      ? 'בְּחִבּוּר אֶפְשָׁר לְהַחְלִיף אֶת הַסֵּדֶר - הַתּוֹצָאָה לֹא מִשְׁתַּנָּה.'
      : 'חִבּוּר וְחִסּוּר הֵם פְּעֻלּוֹת הֲפוּכוֹת: אֶת מָה שֶׁמּוֹסִיפִים, אֶפְשָׁר גַּם לְהוֹרִיד בַּחֲזָרָה.',
    steps: kind === 'b+a'
      ? [`${a} + ${b} = ${c}, וְהַחְלָפַת הַסֵּדֶר לֹא מְשַׁנָּה אֶת הַתּוֹצָאָה.`, `${b} + ${a} = ${c}.`]
      : [`${a} + ${b} = ${c}.`, `לָכֵן ${expr.replace('?', String(ans))}.`],
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
    hint: form === 'n-n' ? 'מוֹרִידִים אֶת כָּל מָה שֶׁיֵּשׁ. מָה נִשְׁאָר?' : 'כְּשֶׁמּוֹסִיפִים אוֹ מוֹרִידִים 0 - שׁוּם דָּבָר לֹא מִשְׁתַּנֶּה.',
    steps: [form === 'n-n' ? 'מִסְפָּר פָּחוֹת עַצְמוֹ שָׁוֶה 0.' : 'הוֹסָפָה אוֹ הוֹרָדָה שֶׁל 0 לֹא מְשַׁנָּה אֶת הַמִּסְפָּר.', expr.replace('?', fmt(ans))],
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
    instruction: 'פִּתְרוּ בַּדֶּרֶךְ הַקְּצָרָה:',
    expr,
    answer: a,
    hint: `${addFirst ? 'מוֹסִיפִים' : 'מוֹרִידִים'} ${b}, וְאָז ${addFirst ? 'מוֹרִידִים' : 'מוֹסִיפִים'} אוֹתוֹ בַּחֲזָרָה. לְאָן חוֹזְרִים?`,
    steps: [
      `${addFirst ? `+ ${b} וְאַחֲרָיו - ${b}` : `- ${b} וְאַחֲרָיו + ${b}`} מְבַטְּלִים זֶה אֶת זֶה.`,
      `לָכֵן הַתּוֹצָאָה הִיא הַמִּסְפָּר שֶׁהִתְחַלְנוּ מִמֶּנּוּ: ${a}.`,
    ],
  });
}

/* ============================ ב1. אומדן והשוואה ============================ */

const BIG = 'גָּדוֹל מִ-100';
const SAME = 'שָׁוֶה לְ-100';
const SMALL = 'קָטָן מִ-100';

function genEstimate(level = 0) {
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
  const rel = val > 100 ? BIG : val < 100 ? SMALL : SAME;
  return Q({
    type: 'estimate',
    topic: 'insight',
    ui: 'choice',
    noShuffle: true,
    instruction: 'הַאִם הַתּוֹצָאָה גְּדוֹלָה מִ-100, קְטַנָּה מִ-100 אוֹ שָׁוָה לְ-100?',
    expr,
    options: [opt(BIG, rel === BIG), opt(SAME, rel === SAME), opt(SMALL, rel === SMALL)],
    answer: rel,
    hint: 'אֶפְשָׁר לְעַגֵּל לַעֲשָׂרוֹת וּלְהַעֲרִיךְ. לְמָשָׁל: 50 וְעוֹד 50 הֵם בְּדִיּוּק 100.',
    steps: [`${expr} = ${fmt(val)}.`, rel === SAME ? 'הַתּוֹצָאָה שָׁוָה בְּדִיּוּק לְ-100.' : `${fmt(val)} ${rel}.`],
  });
}

const EQUAL_RESULTS = 'הַתּוֹצָאוֹת שָׁווֹת';

function genCompareExprs(level = 0) {
  const kinds = level === 0 ? ['addSame'] : level === 1 ? ['addSame', 'subSame', 'swap'] : ['addSame', 'subSame', 'near', 'swap'];
  const kind = pick(kinds);
  let e1, e2, v1, v2, why;
  if (kind === 'addSame') {
    const n = level === 0 ? ri(3, 12) : ri(20, 80);
    const x = ri(1, level === 0 ? 8 : 15); let y = ri(1, level === 0 ? 8 : 15); if (y === x) y = x + 2;
    e1 = `${n} + ${x}`; e2 = `${n} + ${y}`; v1 = n + x; v2 = n + y;
    why = `בִּשְׁנֵי הַתַּרְגִּילִים מַתְחִילִים מִ-${n}. מִי שֶׁמּוֹסִיף יוֹתֵר - מְקַבֵּל יוֹתֵר.`;
  } else if (kind === 'subSame') {
    const n = ri(40, 120);
    const x = ri(5, 20); let y = ri(5, 20); if (y === x) y = x + 2;
    e1 = `${n} - ${x}`; e2 = `${n} - ${y}`; v1 = n - x; v2 = n - y;
    why = `בִּשְׁנֵי הַתַּרְגִּילִים מַתְחִילִים מִ-${n}. מִי שֶׁמּוֹרִיד פָּחוֹת - נִשְׁאָר לוֹ יוֹתֵר.`;
  } else if (kind === 'near') {
    const a = ri(1, 7) * 10 + ri(6, 9); const b = ri(1, 7) * 10 + ri(6, 9);
    const ra = Math.ceil(a / 10) * 10; const rb = Math.ceil(b / 10) * 10;
    [e1, e2, v1, v2] = Math.random() < 0.5 ? [`${a} + ${b}`, `${ra} + ${rb}`, a + b, ra + rb] : [`${ra} + ${rb}`, `${a} + ${b}`, ra + rb, a + b];
    why = `${ra} גָּדוֹל מִ-${a}, וְ-${rb} גָּדוֹל מִ-${b}, וְלָכֵן ${ra} + ${rb} גָּדוֹל יוֹתֵר.`;
  } else {
    const a = ri(12, 35); const b = ri(36, 60);
    [e1, e2] = shuffle([`${a} + ${b}`, `${b} + ${a}`]); v1 = v2 = a + b;
    why = 'אוֹתָם מִסְפָּרִים בְּסֵדֶר אַחֵר - בְּחִבּוּר הַתּוֹצָאָה לֹא מִשְׁתַּנָּה.';
  }
  const best = v1 > v2 ? 0 : v2 > v1 ? 1 : 2;
  return Q({
    type: 'compare_exprs',
    topic: 'insight',
    ui: 'choice',
    noShuffle: true,
    instruction: 'בְּלִי לִפְתֹּר: בְּאֵיזֶה תַּרְגִּיל הַתּוֹצָאָה גְּדוֹלָה יוֹתֵר?',
    options: [opt(e1, best === 0, true), opt(e2, best === 1, true), opt(EQUAL_RESULTS, best === 2)],
    answer: best === 2 ? EQUAL_RESULTS : best === 0 ? e1 : e2,
    hint: 'מְחַפְּשִׂים מָה דּוֹמֶה בִּשְׁנֵי הַתַּרְגִּילִים וּמָה שׁוֹנֶה. מָה שֶׁשּׁוֹנֶה - מְשַׁנֶּה אֶת הַתּוֹצָאָה.',
    steps: [why, `(בְּדִיקָה: ${e1} = ${v1}, ${e2} = ${v2}.)`],
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
  const words = sign === '<' ? 'קָטָן מִ' : sign === '>' ? 'גָּדוֹל מִ' : 'שָׁוֶה לְ';
  return Q({
    type: 'compare_sign',
    topic: 'insight',
    ui: 'choice',
    noShuffle: true,
    instruction: 'אֵיזֶה סִימָן מַתְאִים בִּמְקוֹם הָרִבּוּעַ?',
    expr: `${left} ▢ ${right}`,
    options: [opt('<', sign === '<', true), opt('=', sign === '=', true), opt('>', sign === '>', true)],
    answer: sign,
    hint: `הַפֶּה שֶׁל הַסִּימָנִים ${ltrIsolate('<')} וְ-${ltrIsolate('>')} תָּמִיד פָּתוּחַ לְכִוּוּן הַמִּסְפָּר הַגָּדוֹל יוֹתֵר.`,
    steps: [
      `בַּצַּד הַשְּׂמָאלִי: ${fmt(lv)}. בַּצַּד הַיְּמָנִי: ${fmt(rv)}.`,
      `${fmt(lv)} ${words}-${fmt(rv)}, וְלָכֵן: ${ltrIsolate(`${left} ${sign} ${right}`)}`,
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
    instruction: `בְּלִי לִפְתֹּר: בְּאֵיזֶה תַּרְגִּיל הַתּוֹצָאָה ${biggest ? 'הֲכִי גְּדוֹלָה' : 'הֲכִי קְטַנָּה'}?`,
    options: shuffle(exprs.map((e, i) => opt(e, i === idx, true))),
    answer: exprs[idx],
    hint: `בְּכָל הַתַּרְגִּילִים מוֹסִיפִים לְ-${fmt(base)}. מַשְׁוִים רַק אֶת הַמִּסְפָּר הַשֵּׁנִי.`,
    steps: [`הַמִּסְפָּרִים שֶׁמּוֹסִיפִים: ${[a, b, c].join(', ')}.`, `${biggest ? 'הֲכִי גָּדוֹל' : 'הֲכִי קָטָן'} מִבֵּינֵיהֶם נִמְצָא בַּתַּרְגִּיל ${exprs[idx]}.`],
  });
}

/* ============================ ב3. שאלות חיבור וחיסור, כסף ועודף ============================ */

const MISSION = 'מְשִׂימָה:';
const SHEKELS = 'שְׁקָלִים';

function genWordCompare(level = 0) {
  const max = level === 0 ? 20 : 90;
  const [p1, p2] = twoPeople();
  const th = pick(THINGS);
  const kind = pick(level < 2 ? ['more', 'less', 'diff'] : ['diff', 'more', 'reverse']);
  const a = ri(5, max - 10);
  const d = ri(2, level === 0 ? 8 : 25);
  if (kind === 'more' || kind === 'less') {
    const more = kind === 'more';
    const b = more ? a + d : Math.max(1, a - d);
    const dd = more ? d : a - b;
    return Q({
      type: 'word_compare', topic: 'word_add', ui: 'mission', instruction: MISSION, unit: th,
      story: `לְ${p1.n} יֵשׁ [[${a}]] ${th}. לְ${p2.n} יֵשׁ [[${dd}]] ${th} ${more ? 'יוֹתֵר' : 'פָּחוֹת'}. כַּמָּה ${th} יֵשׁ לְ${p2.n}?`,
      answer: b,
      hint: more ? `לְ${p2.n} יֵשׁ כְּמוֹ לְ${p1.n}, וְעוֹד ${dd}.` : `לְ${p2.n} יֵשׁ כְּמוֹ לְ${p1.n}, בְּלִי ${dd}.`,
      steps: [`${a} ${more ? '+' : '-'} ${dd} = ${b}.`, `לְ${p2.n} יֵשׁ ${b} ${th}.`],
    });
  }
  if (kind === 'diff') {
    const b = a + d;
    return Q({
      type: 'word_compare', topic: 'word_add', ui: 'mission', instruction: MISSION, unit: th,
      story: `לְ${p1.n} יֵשׁ [[${a}]] ${th}, וּלְ${p2.n} יֵשׁ [[${b}]] ${th}. כַּמָּה ${th} יֵשׁ לְ${p2.n} יוֹתֵר מֵאֲשֶׁר לְ${p1.n}?`,
      answer: d,
      hint: `כַּמָּה צָרִיךְ לְהוֹסִיף לְ-${a} כְּדֵי לְהַגִּיעַ לְ-${b}?`,
      steps: [`${b} - ${a} = ${d}.`, `לְ${p2.n} יֵשׁ ${d} ${th} יוֹתֵר.`],
    });
  }
  const b = a + d;
  return Q({
    type: 'word_compare', topic: 'word_add', ui: 'mission', instruction: MISSION, unit: th,
    story: `לְ${p1.n} יֵשׁ [[${b}]] ${th}. זֶה [[${d}]] יוֹתֵר מִמָּה שֶׁיֵּשׁ לְ${p2.n}. כַּמָּה ${th} יֵשׁ לְ${p2.n}?`,
    answer: a,
    hint: `לְ${p1.n} יֵשׁ יוֹתֵר. אָז לְ${p2.n} יֵשׁ פָּחוֹת - בְּדִיּוּק ${d} פָּחוֹת.`,
    steps: [`לְ${p2.n} יֵשׁ ${d} פָּחוֹת מֵאֲשֶׁר לְ${p1.n}.`, `${b} - ${d} = ${a}.`],
  });
}

function genWordCollect(level = 0) {
  const p = pick(PEOPLE);
  const max = level === 0 ? 6 : 30;
  const [a, b, c] = [ri(2, max), ri(2, max), ri(2, max)];
  const sum = a + b + c;
  const bought = g(p, 'קָנָה', 'קָנְתָה');
  const caught = g(p, 'תָּפַס', 'תָּפְסָה');
  const story = Math.random() < 0.5
    ? `${p.n} ${bought} [[${a}]] ק"ג תַּפּוּחִים, [[${b}]] ק"ג אַגָּסִים וְ-[[${c}]] ק"ג בָּנָנוֹת. כַּמָּה ק"ג פֵּרוֹת ${bought} ${p.n}?`
    : `בַּבֹּקֶר ${caught} ${p.n} [[${a}]] פּוֹקִימוֹנִים, בַּצָּהֳרַיִם [[${b}]] וּבָעֶרֶב [[${c}]]. כַּמָּה פּוֹקִימוֹנִים ${caught} ${p.n} בַּיּוֹם הַזֶּה?`;
  return Q({
    type: 'word_collect', topic: 'word_add', ui: 'mission', instruction: MISSION,
    story,
    answer: sum,
    hint: 'שׁוֹאֲלִים עַל הַכֹּל בְּיַחַד - מְחַבְּרִים אֶת כָּל הַחֲלָקִים.',
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
    type: 'word_multi', topic: 'word_add', ui: 'mission', instruction: 'מְשִׂימָה בִּשְׁנֵי שְׁלַבִּים:', unit: SHEKELS,
    story: `לְ${p.n} הָיוּ [[${start}]] שְׁקָלִים. ${g(p, 'הוּא קִבֵּל', 'הִיא קִבְּלָה')} מִסַּבְתָּא עוֹד [[${got}]] שְׁקָלִים, וְ${g(p, 'קָנָה', 'קָנְתָה')} קְלָפֵי פּוֹקִימוֹן בְּ-[[${spent}]] שְׁקָלִים. כַּמָּה שְׁקָלִים נִשְׁאֲרוּ לְ${p.n}?`,
    answer: left,
    hint: `קֹדֶם מְחַשְּׁבִים כַּמָּה הָיוּ לְ${p.n} אַחֲרֵי הַמַּתָּנָה, וְרַק אַחַר כָּךְ מוֹרִידִים אֶת מָה שֶׁ${g(p, 'הוּא קָנָה', 'הִיא קָנְתָה')}.`,
    steps: [`אַחֲרֵי הַמַּתָּנָה: ${start} + ${got} = ${start + got}.`, `אַחֲרֵי הַקְּנִיָּה: ${start + got} - ${spent} = ${left}.`],
  });
}

function genWordSumKnown(level = 0) {
  const sum = level === 0 ? ri(8, 20) : ri(25, 100);
  const a = ri(2, sum - 2);
  return Q({
    type: 'word_sum_known', topic: 'word_add', ui: 'mission', instruction: 'חִידָה:',
    story: `הַסְּכוּם שֶׁל שְׁנֵי מִסְפָּרִים הוּא [[${sum}]]. אֶחָד מֵהֶם הוּא [[${a}]]. מָהוּ הַמִּסְפָּר הַשֵּׁנִי?`,
    answer: sum - a,
    hint: `אֵיזֶה מִסְפָּר וְעוֹד ${a} נוֹתֵן ${sum}?`,
    steps: [`${sum} - ${a} = ${sum - a}.`, `בְּדִיקָה: ${a} + ${sum - a} = ${sum} ✔`],
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
    instruction: `לַחֲצוּ עַל מַטְבְּעוֹת וּשְׁטָרוֹת, כְּדֵי לְשַׁלֵּם בְּדִיּוּק ${target} שְׁקָלִים:`,
    values,
    target,
    answer: target,
    answerText: `${target} שְׁקָלִים, לְמָשָׁל: ${plan.join(' + ')}`,
    hint: 'מַתְחִילִים מֵהַשְּׁטָר אוֹ מֵהַמַּטְבֵּעַ הַגָּדוֹל בְּיוֹתֵר שֶׁלֹּא עוֹבֵר אֶת הַסְּכוּם, וְאָז מַשְׁלִימִים בַּקְּטַנִּים.',
    steps: [`אֶפְשָׁר לְשַׁלֵּם כָּךְ: ${plan.join(' + ')} = ${target}.`, 'יֵשׁ עוֹד דְּרָכִים נְכוֹנוֹת - הָעִקָּר שֶׁהַסְּכוּם יִהְיֶה מְדֻיָּק.'],
  });
}

function genMoneyChange(level = 0) {
  const paid = level === 0 ? pick([10, 20]) : pick([50, 100]);
  const price = level === 0 ? ri(2, paid - 1) : level === 1 ? ri(1, paid / 10 - 1) * 10 : ri(11, paid - 3);
  const change = paid - price;
  const p = pick(PEOPLE);
  if (level === 0 || Math.random() < 0.5) {
    return Q({
      type: 'money_change', topic: 'word_add', ui: 'mission', instruction: 'בַּחֲנוּת:', unit: SHEKELS,
      story: `${p.n} ${g(p, 'קָנָה', 'קָנְתָה')} מַמְתַּקִּים בְּ-[[${price}]] שְׁקָלִים, וְ${g(p, 'שִׁלֵּם', 'שִׁלְּמָה')} בְּ-[[${paid}]] שְׁקָלִים. כַּמָּה עֹדֶף ${g(p, 'יְקַבֵּל', 'תְּקַבֵּל')}?`,
      answer: change,
      hint: `כַּמָּה צָרִיךְ לְהוֹסִיף לְ-${price} כְּדֵי לְהַגִּיעַ לְ-${paid}?`,
      steps: [`${paid} - ${price} = ${change}.`, `הָעֹדֶף: ${change} שְׁקָלִים.`],
    });
  }
  const plan = greedyMoney(change, moneyValues(level));
  return Q({
    type: 'money_change', topic: 'word_add', ui: 'money',
    instruction: `קָנוּ מַמְתַּקִּים בְּ-${price} שְׁקָלִים, וְשִׁלְּמוּ ${paid} שְׁקָלִים. הַרְכִּיבוּ אֶת הָעֹדֶף מֵהַמַּטְבְּעוֹת וּמֵהַשְּׁטָרוֹת:`,
    values: moneyValues(level),
    target: change,
    answer: change,
    answerText: `${change} שְׁקָלִים, לְמָשָׁל: ${plan.join(' + ')}`,
    hint: `קֹדֶם מְחַשְּׁבִים אֶת הָעֹדֶף: ${paid} פָּחוֹת ${price}.`,
    steps: [`${paid} - ${price} = ${change}.`, `אֶפְשָׁר לְהַחְזִיר כָּךְ: ${plan.join(' + ')}.`],
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
    type: 'prog_375_grow', topic: 'numbers', ui: 'mission', minLevel: 1, instruction: 'חִידַת סְפָרוֹת:',
    story: 'בַּמִּסְפָּר [[375]] שִׁנּוּ אֶת סִפְרַת הָעֲשָׂרוֹת לְ-[[8]]. בְּכַמָּה גָּדַל הַמִּסְפָּר?', answer: 10,
    hint: 'סִפְרַת הָעֲשָׂרוֹת גָּדְלָה מִ-7 לְ-8, כְּלוֹמַר בַּעֲשֶׂרֶת אַחַת.',
    steps: ['הַמִּסְפָּר הֶחָדָשׁ הוּא 385.', '385 - 375 = 10.'],
  }),
  () => P({
    type: 'prog_375_delete', topic: 'numbers', ui: 'mission', minLevel: 2, instruction: 'חִידַת סְפָרוֹת:',
    story: 'בַּמִּסְפָּר [[375]] מָחֲקוּ אֶת סִפְרַת הָעֲשָׂרוֹת. אֵיזֶה מִסְפָּר הִתְקַבֵּל?', answer: 35,
    hint: 'סִפְרַת הָעֲשָׂרוֹת הִיא 7. מָה נִשְׁאָר בִּלְעָדֶיהָ?',
    steps: ['מוֹחֲקִים אֶת הַ-7.', 'נִשְׁאָרוֹת הַסְּפָרוֹת 3 וְ-5, כְּלוֹמַר 35.'],
  }),
  () => P({
    type: 'prog_seq_11', topic: 'numbers', ui: 'numberline_fill', instruction: 'צְרוּ סִדְרָה עַל יְדֵי הוֹסָפַת 10:',
    stones: [{ value: 11 }, { value: 21 }, { value: 31 }, { value: 41, blank: true }, { value: 51, blank: true }],
    answer: [41, 51], answerText: '41, 51',
    hint: 'בְּכָל צַעַד מוֹסִיפִים 10: סִפְרַת הָעֲשָׂרוֹת גְּדֵלָה בְּ-1.',
    steps: ['31 + 10 = 41.', '41 + 10 = 51.'],
  }),
  () => P({
    type: 'prog_between', topic: 'numbers', ui: 'choice', instruction: 'אֵיזֶה מִסְפָּר נִמְצָא בֵּין 90 לְ-101?',
    options: shuffle([opt('95', true, true), opt('89', false, true), opt('102', false, true), opt('110', false, true)]),
    answer: '95', hint: 'צָרִיךְ מִסְפָּר שֶׁגָּדוֹל מִ-90, וְגַם קָטָן מִ-101.',
    steps: ['95 גָּדוֹל מִ-90.', '95 קָטָן מִ-101.'],
  }),
  () => P({
    type: 'prog_734', topic: 'even_odd', ui: 'choice', minLevel: 1,
    instruction: 'אֵיזֶה מִסְפָּר זוּגִי אֶפְשָׁר לִבְנוֹת מֵהַסְּפָרוֹת 7, 3, 4?',
    options: shuffle([opt('734', true, true), opt('743', false, true), opt('473', false, true), opt('347', false, true)]),
    answer: '734', hint: 'מִסְפָּר זוּגִי נִגְמָר בְּסִפְרָה זוּגִית. אֵיזוֹ סִפְרָה זוּגִית יֵשׁ כָּאן?',
    steps: ['הַסִּפְרָה הַזּוּגִית הִיא 4.', '734 נִגְמָר בְּ-4, וְלָכֵן הוּא זוּגִי.'],
  }),
  () => P({
    type: 'prog_17_12', topic: 'add_sub', expr: '17 + 12 = ?', answer: 29,
    hint: 'קֹדֶם מוֹסִיפִים 10, וְאַחַר כָּךְ עוֹד 2.', steps: ['17 + 10 = 27.', '27 + 2 = 29.'],
  }),
  () => P({
    type: 'prog_26_34', topic: 'add_sub', minLevel: 1, expr: '26 + 34 = ?', answer: 60,
    hint: 'מְפָרְקִים אֶת 34 לְ-30 וְ-4.', steps: ['26 + 30 = 56.', '56 + 4 = 60.'],
  }),
  () => P({
    type: 'prog_70_18', topic: 'add_sub', minLevel: 1, expr: '70 - 18 = ?', answer: 52,
    hint: 'מְפָרְקִים אֶת 18 לְ-10 וְ-8.', steps: ['70 - 10 = 60.', '60 - 8 = 52.'],
  }),
  () => P({
    type: 'prog_85_19', topic: 'add_sub', minLevel: 2, expr: '85 - 19 = ?', answer: 66,
    hint: '19 זֶה כִּמְעַט 20. אֶפְשָׁר לְהוֹרִיד 20 וּלְהַחְזִיר 1.', steps: ['85 - 20 = 65.', 'הוֹרַדְנוּ 1 יוֹתֵר מִדַּי, וּמַחְזִירִים: 65 + 1 = 66.'],
  }),
  () => P({
    type: 'prog_240_35', topic: 'add_sub', minLevel: 2, expr: '240 + 35 = ?', answer: 275,
    hint: 'עֲשָׂרוֹת עִם עֲשָׂרוֹת, יְחִידוֹת עִם יְחִידוֹת.', steps: ['240 + 30 = 270.', '270 + 5 = 275.'],
  }),
  () => P({
    type: 'prog_36_14', topic: 'missing', ui: 'choice', noShuffle: true, minLevel: 1,
    instruction: 'יָדוּעַ שֶׁ-36 + 14 = 50. הַאִם נָכוֹן שֶׁ-14 + 37 = 51?',
    options: [opt('כֵּן, נָכוֹן', true), opt('לֹא נָכוֹן', false)],
    answer: 'כֵּן, נָכוֹן', hint: '37 גָּדוֹל בְּ-1 מִ-36. מָה קוֹרֶה לַתּוֹצָאָה?',
    steps: ['14 + 36 = 50.', '37 הוּא אֶחָד יוֹתֵר מִ-36, וְלָכֵן הַתּוֹצָאָה גְּדֵלָה בְּ-1: 51.'],
  }),
  () => P({
    type: 'prog_70_50', topic: 'insight', ui: 'choice', noShuffle: true,
    instruction: 'הַאִם הַתּוֹצָאָה גְּדוֹלָה מִ-100, קְטַנָּה מִ-100 אוֹ שָׁוָה לְ-100?', expr: '70 + 50',
    options: [opt(BIG, true), opt(SAME), opt(SMALL)],
    answer: BIG, hint: '50 וְעוֹד 50 זֶה 100. וְ-70 גָּדוֹל מִ-50.',
    steps: ['70 + 50 = 120.', '120 גָּדוֹל מִ-100.'],
  }),
  () => P({
    type: 'prog_107', topic: 'insight', ui: 'choice', noShuffle: true, minLevel: 1,
    instruction: 'בְּלִי לִפְתֹּר: בְּאֵיזֶה תַּרְגִּיל הַתּוֹצָאָה גְּדוֹלָה יוֹתֵר?',
    options: [opt('107 - 13', true, true), opt('107 - 15', false, true), opt(EQUAL_RESULTS)],
    answer: '107 - 13', hint: 'בִּשְׁנֵיהֶם מַתְחִילִים מִ-107. מִי מוֹרִיד פָּחוֹת?',
    steps: ['מִי שֶׁמּוֹרִיד פָּחוֹת - נִשְׁאָר לוֹ יוֹתֵר.', '13 קָטָן מִ-15, וְלָכֵן בַּתַּרְגִּיל 107 - 13 הַתּוֹצָאָה גְּדוֹלָה יוֹתֵר.'],
  }),
  () => P({
    type: 'prog_dani', topic: 'word_add', ui: 'mission', instruction: MISSION, unit: SHEKELS,
    story: 'לְדָנִי יֵשׁ [[7]] שְׁקָלִים. לְיוֹסִי יֵשׁ [[3]] שְׁקָלִים יוֹתֵר. כַּמָּה שְׁקָלִים יֵשׁ לְיוֹסִי?', answer: 10,
    hint: 'לְיוֹסִי יֵשׁ כְּמוֹ לְדָנִי, וְעוֹד 3.', steps: ['7 + 3 = 10.'],
  }),
  () => P({
    type: 'prog_fruit', topic: 'word_add', ui: 'mission', instruction: MISSION,
    story: 'אִמָּא קָנְתָה [[3]] ק"ג תַּפּוּחִים, [[5]] ק"ג אַגָּסִים וְ-[[4]] ק"ג בָּנָנוֹת. כַּמָּה ק"ג פֵּרוֹת הִיא קָנְתָה?', answer: 12,
    hint: 'מְחַבְּרִים אֶת כָּל הַפֵּרוֹת.', steps: ['3 + 5 = 8.', '8 + 4 = 12.'],
  }),
  () => P({
    type: 'prog_oded', topic: 'word_add', ui: 'mission', minLevel: 1, instruction: 'מְשִׂימָה בִּשְׁנֵי שְׁלַבִּים:', unit: SHEKELS,
    story: 'לְעוֹדֵד הָיוּ [[15]] שְׁקָלִים. הוּא קִבֵּל מֵאָבִיו עוֹד [[20]] שְׁקָלִים, וְקָנָה מַמְתַּקִּים בְּ-[[8]] שְׁקָלִים. כַּמָּה שְׁקָלִים נִשְׁאֲרוּ לוֹ?', answer: 27,
    hint: 'קֹדֶם מְחַשְּׁבִים כַּמָּה הָיוּ לוֹ אַחֲרֵי הַמַּתָּנָה.', steps: ['15 + 20 = 35.', '35 - 8 = 27.'],
  }),
  () => P({
    type: 'prog_sum40', topic: 'word_add', ui: 'mission', instruction: 'חִידָה:',
    story: 'הַסְּכוּם שֶׁל שְׁנֵי מִסְפָּרִים הוּא [[40]]. אֶחָד מֵהֶם הוּא [[22]]. מָהוּ הַמִּסְפָּר הַשֵּׁנִי?', answer: 18,
    hint: 'אֵיזֶה מִסְפָּר וְעוֹד 22 נוֹתֵן 40?', steps: ['40 - 22 = 18.', 'בְּדִיקָה: 22 + 18 = 40 ✔'],
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
