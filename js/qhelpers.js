// qhelpers.js - עזרים משותפים לכל גנרטורי השאלות (questions.js ו-questions-b.js).
// כל טקסט שהילד/ה קורא/ת מנוקד. פונים לילד/ה בלשון רבים (פִּתְרוּ, לַחֲצוּ), כדי שהניקוד יתאים לכולם.

import { shuffle } from './util.js';

let seq = 0;

/** בניית אובייקט שאלה אחיד */
export function Q(o) {
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

/** שאלה קבועה מתוך תכנית הלימודים */
export function P(o) {
  return Q({ source: 'program', ...o });
}

/** אפשרות בחירה. ltr = סימן או תרגיל שחייבים להיות משמאל לימין. art = ציור במקום טקסט */
export const opt = (text, correct = false, ltr = false, art = null) => ({ text: String(text), correct, ltr, ...(art ? { art } : {}) });

/** אפשרויות בחירה מעורבבות: תשובה נכונה אחת + מסיחים ייחודיים */
export function choiceOptions(correct, wrongs, ltr = false) {
  const seen = new Set([String(correct)]);
  const list = [opt(correct, true, ltr)];
  for (const w of wrongs) {
    const t = String(w);
    if (!seen.has(t)) { seen.add(t); list.push(opt(t, false, ltr)); }
  }
  return shuffle(list);
}

export const PEOPLE = [
  { n: 'נוֹעָה', g: 'f' }, { n: 'אִיתַי', g: 'm' }, { n: 'מַאיָה', g: 'f' }, { n: 'יוֹנָתָן', g: 'm' },
  { n: 'תָּמָר', g: 'f' }, { n: 'אוּרִי', g: 'm' }, { n: 'שִׁירָה', g: 'f' }, { n: 'דָּנִיֵּאל', g: 'm' },
  { n: 'רוֹנִי', g: 'f' }, { n: 'עוֹמֶר', g: 'm' },
];

export function twoPeople() {
  const [a, b] = shuffle(PEOPLE);
  return [a, b];
}

/** בחירת מילה לפי מין: g(p, 'קָנָה', 'קָנְתָה') */
export const g = (p, m, f) => (p.g === 'f' ? f : m);

export const THINGS = ['קְלָפֵי פּוֹקִימוֹן', 'מַדְבֵּקוֹת', 'גֻּלּוֹת', 'סֻכָּרִיּוֹת', 'פּוֹקָדוֹרִים'];

/**
 * בידוד משמאל לימין בתוך משפט עברי (LRI ... PDI).
 * בלי זה הדפדפן "הופך" את הסימנים < ו-> כשהם בתוך טקסט מימין לשמאל.
 */
export const ltrIsolate = (s) => `⁦${s}⁩`;

export const MISSION = 'מְשִׂימָה:';
export const SHEKELS = 'שְׁקָלִים';

export const YES = 'כֵּן';
export const NO = 'לֹא';
