// qui.js - רכיבי הממשק של סוגי השאלות השונים.
// כל רכיב מקבל שאלה + ctx, מצייר את עצמו, ומחזיר פסק דין:
//   { status: 'correct' | 'wrong' | 'incomplete' | 'progress', message?, bonus? }

import { fmt, esc, wrapMath } from './util.js';
import { baseTenBlocks, moneySvg, ballSvg } from './art.js';
import { figureSvg, fracShape, gridSvg } from './figures.js';

/* ============================ עזרי ציור ============================ */

function exprBox(q) {
  const body = esc(q.expr)
    .replace(/\?/g, '<span class="blank">?</span>')
    .replace(/▢/g, '<span class="blank-box"></span>');
  const dir = q.exprRtl ? 'rtl' : 'ltr';
  // תרגיל ארוך (למשל השוואה עם סוגריים) - בגופן קטן יותר, כדי שייכנס ברוחב של טלפון
  const long = !q.exprRtl && q.expr.length > 17 ? ' expr-long' : '';
  const cls = q.exprRtl ? 'expr expr-big expr-rtl' : `expr expr-big${long}`;
  return `<div class="${cls}" dir="${dir}">${body}</div>`;
}

function givenBox(q) {
  return q.given ? `<div class="given-box">✔ <span class="mathrun" dir="ltr">${esc(q.given)}</span></div>` : '';
}

function missionCard(q) {
  const story = esc(q.story).replace(/\[\[(.+?)\]\]/g, '<span class="key-num">$1</span>');
  return `
    <div class="mission-card">
      <div>${story}</div>
    </div>`;
}

function instructionLine(q) {
  return q.instruction ? `<div class="q-text">${wrapMath(esc(q.instruction))}</div>` : '';
}

/** ציור לשאלה (שעון, גוף, סרגל, דיאגרמה...) */
function figureHtml(q) {
  const fig = q.figure || (q.chart ? { kind: 'chart', ...q.chart } : null);
  if (!fig) return '';
  return `<div class="figure fig-${fig.kind}">${figureSvg(fig)}</div>`;
}

/** תשובה מספרית מהמקלדת */
function keypadVerdict(q, ctx) {
  const v = ctx.keypad.value();
  if (v === null) return { status: 'incomplete', message: 'כִּתְבוּ תְּשׁוּבָה, וְאָז לַחֲצוּ עַל בְּדִיקָה 🙂' };
  return v === q.answer ? { status: 'correct' } : { status: 'wrong' };
}

/* ============================ 1. תשובה מספרית / משימה ============================ */

function numericUI(q, ctx) {
  return {
    usesKeypad: true,
    usesSubmit: true,
    mount(host) {
      host.innerHTML = instructionLine(q) + givenBox(q) + figureHtml(q)
        + (q.ui === 'mission' ? missionCard(q) : q.expr ? exprBox(q) : '');
    },
    submit() { return keypadVerdict(q, ctx); },
    lock() { ctx.keypad.setEnabled(false); },
  };
}

/* ============================ 2. קוביות עשרות ויחידות ============================ */

function placeValueUI(q, ctx) {
  return {
    usesKeypad: true,
    usesSubmit: true,
    mount(host) {
      host.innerHTML = `${instructionLine(q)}
        ${baseTenBlocks(q.blocks)}
        <div class="bt-legend">
          <span><span class="lg lg-h"></span> מֵאָה</span>
          <span><span class="lg lg-t"></span> עֶשֶׂר</span>
          <span><span class="lg lg-u"></span> אֶחָד</span>
        </div>`;
    },
    submit() { return keypadVerdict(q, ctx); },
    lock() { ctx.keypad.setEnabled(false); },
  };
}

/* ============================ 3. שאלת בחירה ============================ */

function choiceUI(q, ctx) {
  let picked = -1;
  let host = null;
  let locked = false;
  const withArt = q.options.some((o) => o.art);
  // אפשרויות קצרות (מספרים, סימנים, "זוגי") - כפתורים גדולים בשורה. ארוכות - אחת מתחת לשנייה.
  const short = withArt || q.options.every((o) => o.text.length <= 14);

  function optionLabel(o) {
    const text = o.ltr ? `<span class="mathrun" dir="ltr">${esc(o.text)}</span>` : wrapMath(esc(o.text));
    if (!o.art) return text;
    return `<span class="opt-art">${figureSvg(o.art)}</span>${o.artOnly ? '' : `<span class="opt-caption">${text}</span>`}`;
  }

  function draw() {
    host.innerHTML = `${instructionLine(q)}
      ${q.story ? missionCard(q) : ''}
      ${q.expr ? exprBox(q) : ''}
      ${figureHtml(q)}
      <div class="${short ? 'choice-grid' : 'choice-list'} n${q.options.length} ${withArt ? 'with-art' : ''}">${q.options.map((o, i) => `
        <button class="choice-btn ${picked === i ? 'chosen' : ''}" type="button" data-o="${i}" ${locked ? 'disabled' : ''}>${optionLabel(o)}</button>`).join('')}
      </div>`;
    host.querySelectorAll('[data-o]').forEach((b) => {
      b.onclick = () => { if (!locked) { picked = Number(b.dataset.o); draw(); } };
    });
  }

  return {
    usesKeypad: false,
    usesSubmit: true,
    mount(el) { host = el; draw(); },
    submit() {
      if (picked < 0) return { status: 'incomplete', message: 'בַּחֲרוּ תְּשׁוּבָה 🙂' };
      return q.options[picked].correct ? { status: 'correct' } : { status: 'wrong' };
    },
    lock() {
      locked = true;
      picked = q.options.findIndex((o) => o.correct);
      draw();
    },
  };
}

/* ============================ 4. כסף: לשלם סכום מדויק ============================ */

function moneyUI(q, ctx) {
  let chosen = [];
  let host = null;
  let locked = false;

  function draw() {
    const tray = q.values.map((v) => `
      <button class="money-btn" type="button" data-add="${v}" ${locked ? 'disabled' : ''} aria-label="${v} שקלים">${moneySvg(v)}</button>`).join('');
    const sorted = chosen.map((v, i) => ({ v, i })).sort((a, b) => b.v - a.v);
    const pile = sorted.map(({ v, i }) => `
      <button class="money-btn in-pile" type="button" data-remove="${i}" ${locked ? 'disabled' : ''} aria-label="הסרת ${v} שקלים">${moneySvg(v)}</button>`).join('');

    host.innerHTML = `${instructionLine(q)}
      <div class="money-tray">${tray}</div>
      <div class="money-pile ${chosen.length ? '' : 'empty'}">
        ${pile || '<span class="nl-note">לַחֲצוּ עַל מַטְבֵּעַ אוֹ עַל שְׁטָר, כְּדֵי לְהָנִיחַ אוֹתוֹ כָּאן</span>'}
      </div>
      ${chosen.length && !locked ? '<div class="nl-note">לְחִיצָה עַל מַטְבֵּעַ כָּאן מַחְזִירָה אוֹתוֹ.</div>' : ''}`;

    host.querySelectorAll('[data-add]').forEach((b) => {
      b.onclick = () => { if (!locked && chosen.length < 20) { chosen.push(Number(b.dataset.add)); draw(); } };
    });
    host.querySelectorAll('[data-remove]').forEach((b) => {
      b.onclick = () => { if (!locked) { chosen.splice(Number(b.dataset.remove), 1); draw(); } };
    });
  }

  return {
    usesKeypad: false,
    usesSubmit: true,
    mount(el) { host = el; draw(); },
    submit() {
      const sum = chosen.reduce((a, b) => a + b, 0);
      if (!chosen.length) return { status: 'incomplete', message: 'לַחֲצוּ עַל מַטְבְּעוֹת וּשְׁטָרוֹת כְּדֵי לְשַׁלֵּם 🪙' };
      if (sum < q.target) return { status: 'incomplete', message: 'עוֹד לֹא הִגַּעְתֶּם לַסְּכוּם. סִפְרוּ שׁוּב וְהוֹסִיפוּ 🙂' };
      if (sum > q.target) return { status: 'wrong', message: `זֶה יוֹתֵר מִדַּי - יָצָא ${sum} שְׁקָלִים.` };
      return { status: 'correct' };
    },
    lock() {
      locked = true;
      const sum = chosen.reduce((a, b) => a + b, 0);
      if (sum !== q.target) {
        // מציגים דרך נכונה אחת: מהגדול לקטן
        chosen = [];
        let left = q.target;
        for (const v of [...q.values].sort((a, b) => b - a)) {
          while (left >= v) { chosen.push(v); left -= v; }
        }
      }
      draw();
    },
  };
}

/* ============================ 5. ישר המספרים - השלמה ============================ */

function numberLineFillUI(q, ctx) {
  const blanks = q.stones.map((s, i) => (s.blank ? i : -1)).filter((i) => i >= 0);
  let pos = 0;                       // איזו אבן חסרה ממלאים עכשיו
  const filled = new Set();
  let host = null;

  function draw() {
    const stones = q.stones.map((s, i) => {
      const isBlank = s.blank && !filled.has(i);
      const active = isBlank && i === blanks[pos];
      const label = isBlank ? '?' : fmt(s.value);
      return `
        <div class="nl-cell">
          <div class="nl-hero-slot">${active ? `<span class="nl-hero">${ballSvg('poke_ball')}</span>` : ''}</div>
          <div class="stone ${isBlank ? 'blank' : 'filled'} ${active ? 'active' : ''}">${label}</div>
        </div>`;
    }).join('<div class="nl-gap"></div>');

    host.innerHTML = `${instructionLine(q)}
      <div class="nl-track" dir="ltr">${stones}</div>
      <div class="nl-note">כִּתְבוּ אֶת הַמִּסְפָּר שֶׁל הָאֶבֶן שֶׁעָלֶיהָ הַפּוֹקָדוֹר.</div>`;
  }

  return {
    usesKeypad: true,
    usesSubmit: true,
    mount(el) { host = el; draw(); },
    submit() {
      const v = ctx.keypad.value();
      if (v === null) return { status: 'incomplete', message: 'כִּתְבוּ אֶת הַמִּסְפָּר שֶׁל הָאֶבֶן הַמְּסֻמֶּנֶת 🙂' };
      const idx = blanks[pos];
      if (v !== q.stones[idx].value) return { status: 'wrong' };

      filled.add(idx);
      pos += 1;
      draw();
      if (pos >= blanks.length) return { status: 'correct' };
      ctx.keypad.reset(q.unit);
      return { status: 'progress', message: 'יֹפִי! עַכְשָׁו הָאֶבֶן הַבָּאָה ⚡' };
    },
    lock() {
      blanks.forEach((i) => filled.add(i));
      draw();
      ctx.keypad.setEnabled(false);
    },
  };
}

/* ============================ 6. ישר המספרים - איתור מיקום ============================ */

function numberLineLocateUI(q, ctx) {
  let chosen = -1;
  let host = null;

  function draw() {
    const ticks = q.stones.map((s, i) => `
      <button class="nl-tick ${chosen === i ? 'chosen' : ''}" type="button" data-i="${i}">
        <span class="nl-hero-slot">${chosen === i ? `<span class="nl-hero">${ballSvg('poke_ball')}</span>` : ''}</span>
        <span class="nl-mark"></span>
        <span class="nl-label">${s.blank ? '' : fmt(s.value)}</span>
      </button>`).join('');

    host.innerHTML = `${instructionLine(q)}
      <div class="nl-target">אֵיפֹה נִמְצָא <span class="num">${fmt(q.target)}</span>?</div>
      <div class="nl-axis" dir="ltr">${ticks}</div>`;

    host.querySelectorAll('[data-i]').forEach((b) => {
      b.onclick = () => { chosen = Number(b.dataset.i); draw(); };
    });
  }

  return {
    usesKeypad: false,
    usesSubmit: true,
    mount(el) { host = el; draw(); },
    submit() {
      if (chosen < 0) return { status: 'incomplete', message: 'בַּחֲרוּ מָקוֹם עַל הַיָּשָׁר 🙂' };
      return chosen === q.correctIndex ? { status: 'correct' } : { status: 'wrong' };
    },
    lock() {
      chosen = q.correctIndex;
      draw();
      host.querySelectorAll('[data-i]').forEach((b) => { b.disabled = true; });
    },
  };
}

/* ============================ 7. צביעת חצי / רבע ============================ */

function fracColorUI(q, ctx) {
  const total = q.shapes * q.parts;
  const filled = new Array(total).fill(false);
  let host = null;
  let locked = false;

  function draw() {
    const shapes = Array.from({ length: q.shapes }, (_, s) =>
      `<div class="frac-shape-wrap">${fracShape(q.shapeKind, q.parts, filled, s * q.parts, !locked)}</div>`).join('');
    host.innerHTML = `${instructionLine(q)}
      <div class="frac-shapes">${shapes}</div>`;
    host.querySelectorAll('[data-part]').forEach((el) => {
      el.onclick = () => {
        const i = Number(el.dataset.part);
        filled[i] = !filled[i];
        draw();
      };
    });
  }

  return {
    usesKeypad: false,
    usesSubmit: true,
    mount(el) { host = el; draw(); },
    submit() {
      const count = filled.filter(Boolean).length;
      if (count === 0) return { status: 'incomplete', message: 'לַחֲצוּ עַל הַחֲלָקִים כְּדֵי לִצְבֹּעַ אוֹתָם 🎨' };
      return count === q.target ? { status: 'correct' } : { status: 'wrong' };
    },
    lock() {
      locked = true;
      for (let i = 0; i < total; i++) filled[i] = i < q.target;
      draw();
    },
  };
}

/* ============================ 8. חיבור וחיסור במאונך ============================ */

const digitsOf = (n) => String(n).split('');

/**
 * תרגיל בעמודות (משמאל לימין). מה שמקלידים במקלדת מופיע בתיבות של שורת התוצאה, מימין.
 * במצב "ספרה חסרה" (q.vertical.hide) - התיבה היחידה היא הספרה החסרה.
 */
function verticalUI(q, ctx) {
  const { a, b, op, hide } = q.vertical;
  const result = q.vertical.result ?? (op === '+' ? a + b : a - b);
  const cols = Math.max(String(a).length, String(b).length, String(result).length);
  let host = null;
  let locked = false;
  let raw = '';

  /** מערך באורך cols, מיושר לימין */
  const pad = (arr) => [...Array(Math.max(0, cols - arr.length)).fill(''), ...arr];

  /** נשיאות בחיבור - לתצוגה אחרי הפתרון */
  function carries() {
    const out = Array(cols).fill('');
    if (op !== '+') return out;
    let c = 0;
    for (let i = 0; i < cols; i++) {
      const s = (Math.floor(a / 10 ** i) % 10) + (Math.floor(b / 10 ** i) % 10) + c;
      c = s >= 10 ? 1 : 0;
      if (c && i + 1 < cols) out[cols - 2 - i] = '1';
    }
    return out;
  }

  const cell = (d, extra = '') => `<span class="v-d ${extra}">${esc(d)}</span>`;

  function rowOf(n, rowName) {
    const ds = pad(digitsOf(n));
    return ds.map((d, i) => {
      const place = cols - 1 - i;
      if (hide && hide.row === rowName && hide.place === place) {
        const shown = locked ? String(q.answer) : raw.slice(-1);
        return cell(shown || '?', `v-box ${shown ? '' : 'empty'} ${locked ? 'v-solved' : ''}`);
      }
      return cell(d);
    }).join('');
  }

  function resultRow() {
    if (hide) return pad(digitsOf(result)).map((d) => cell(d)).join('');
    const typed = locked ? digitsOf(result) : raw ? raw.split('') : [];
    const shown = pad(typed.slice(-cols));
    return shown.map((d) => cell(d || '', `v-box ${d ? '' : 'empty'} ${locked ? 'v-solved' : ''}`)).join('');
  }

  function draw() {
    const carryRow = locked && !hide && op === '+' ? carries() : null;
    host.innerHTML = `${instructionLine(q)}
      <div class="vert" dir="ltr" style="--cols:${cols}">
        ${carryRow ? `<div class="v-row v-carry"><span class="v-op"></span>${carryRow.map((c) => cell(c)).join('')}</div>` : ''}
        <div class="v-row"><span class="v-op"></span>${rowOf(a, 'a')}</div>
        <div class="v-row"><span class="v-op">${op === '-' ? '−' : '+'}</span>${rowOf(b, 'b')}</div>
        <div class="v-line"></div>
        <div class="v-row v-res"><span class="v-op"></span>${resultRow()}</div>
      </div>
      <div class="nl-note">${hide ? 'כִּתְבוּ בַּמִּקְלֶדֶת אֶת הַסִּפְרָה הַחֲסֵרָה.' : 'כִּתְבוּ בַּמִּקְלֶדֶת אֶת הַתּוֹצָאָה - הִיא תּוֹפִיעַ בַּתֵּבוֹת.'}</div>`;
  }

  return {
    usesKeypad: true,
    usesSubmit: true,
    mount(el) {
      host = el;
      ctx.keypad.onChange = (r) => { if (!locked) { raw = r; draw(); } };
      draw();
    },
    submit() { return keypadVerdict(q, ctx); },
    lock() {
      locked = true;
      ctx.keypad.setEnabled(false);
      draw();
    },
  };
}

/* ============================ 9. השלמת צורה בשיקוף ============================ */

function mirrorGridUI(q, ctx) {
  const { w, h, mirror, given } = q.grid;
  const givenSet = new Set(given.map(([x, y]) => `${x},${y}`));
  const leftGiven = given[0][0] < mirror;
  const target = new Set(q.target);
  let picked = new Set();
  let host = null;
  let locked = false;

  const toCells = (set) => [...set].map((s) => s.split(',').map(Number));

  function draw() {
    const shapes = [{ cells: given, color: 'blue' }, { cells: toCells(picked), color: locked ? 'green' : 'yellow' }];
    host.innerHTML = `${instructionLine(q)}
      <div class="figure fig-mirror">${gridSvg({ w, h, shapes, mirror, interactive: !locked })}</div>
      ${locked ? '' : '<div class="nl-note">לְחִיצָה נוֹסֶפֶת עַל מִשְׁבֶּצֶת מוֹחֶקֶת אוֹתָהּ.</div>'}`;
    host.querySelectorAll('[data-cell]').forEach((el) => {
      el.onclick = () => {
        if (locked) return;
        const k = el.dataset.cell;
        const x = Number(k.split(',')[0]);
        if (givenSet.has(k) || (leftGiven ? x < mirror : x >= mirror)) return;
        if (picked.has(k)) picked.delete(k); else picked.add(k);
        draw();
      };
    });
  }

  return {
    usesKeypad: false,
    usesSubmit: true,
    mount(el) { host = el; draw(); },
    submit() {
      if (!picked.size) return { status: 'incomplete', message: 'לַחֲצוּ עַל מִשְׁבָּצוֹת כְּדֵי לִצְבֹּעַ אוֹתָן 🎨' };
      const same = picked.size === target.size && [...picked].every((k) => target.has(k));
      if (same) return { status: 'correct' };
      const missing = [...target].filter((k) => !picked.has(k)).length;
      const extra = [...picked].filter((k) => !target.has(k)).length;
      if (!extra && missing) return { status: 'wrong', message: `כִּמְעַט! חֲסֵרוֹת עוֹד ${missing} מִשְׁבָּצוֹת.` };
      return { status: 'wrong' };
    },
    lock() {
      locked = true;
      picked = new Set(target);
      draw();
    },
  };
}

/* ============================ בחירת הרכיב ============================ */

const REGISTRY = {
  numeric: numericUI,
  mission: numericUI,
  chart: numericUI,
  place_value: placeValueUI,
  choice: choiceUI,
  money: moneyUI,
  numberline_fill: numberLineFillUI,
  numberline_locate: numberLineLocateUI,
  frac_color: fracColorUI,
  vertical: verticalUI,
  mirror_grid: mirrorGridUI,
};

export function createQuestionUI(q, ctx) {
  const factory = REGISTRY[q.ui] || numericUI;
  return factory(q, ctx);
}

export const SUPPORTED_UIS = Object.keys(REGISTRY);
