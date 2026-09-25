// qui.js - רכיבי הממשק של סוגי השאלות השונים.
// כל רכיב מקבל שאלה + ctx, מצייר את עצמו, ומחזיר פסק דין:
//   { status: 'correct' | 'wrong' | 'incomplete' | 'progress', message?, bonus? }

import { fmt, esc, wrapMath } from './util.js';
import { baseTenBlocks, moneySvg, pairsSvg, ballSvg } from './art.js';

/* ============================ עזרי ציור ============================ */

function exprBox(q) {
  const body = esc(q.expr)
    .replace(/\?/g, '<span class="blank">?</span>')
    .replace(/▢/g, '<span class="blank-box"></span>');
  const dir = q.exprRtl ? 'rtl' : 'ltr';
  const cls = q.exprRtl ? 'expr expr-big expr-rtl' : 'expr expr-big';
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
      host.innerHTML = instructionLine(q) + givenBox(q)
        + (q.ui === 'mission' ? missionCard(q) : exprBox(q));
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

function figureHtml(q) {
  if (!q.figure) return '';
  if (q.figure.kind === 'pairs') return `<div class="figure">${pairsSvg(q.figure.n)}</div>`;
  if (q.figure.kind === 'fraction') {
    const f = q.figure;
    const filled = Array.from({ length: f.shapes * f.parts }, (_, i) => i < f.filled);
    const shapes = Array.from({ length: f.shapes }, (_, s) =>
      `<div class="frac-shape-wrap">${fracShape(f.shapeKind, f.parts, filled, s * f.parts, false)}</div>`).join('');
    return `<div class="frac-shapes">${shapes}</div>`;
  }
  return '';
}

function choiceUI(q, ctx) {
  let picked = -1;
  let host = null;
  let locked = false;
  // אפשרויות קצרות (מספרים, סימנים, "זוגי") - כפתורים גדולים בשורה. ארוכות - אחת מתחת לשנייה.
  const short = q.options.every((o) => o.text.length <= 14);

  function optionLabel(o) {
    return o.ltr ? `<span class="mathrun" dir="ltr">${esc(o.text)}</span>` : wrapMath(esc(o.text));
  }

  function draw() {
    host.innerHTML = `${instructionLine(q)}
      ${q.story ? missionCard(q) : ''}
      ${q.expr ? exprBox(q) : ''}
      ${figureHtml(q)}
      <div class="${short ? 'choice-grid' : 'choice-list'} n${q.options.length}">${q.options.map((o, i) => `
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

/* ============================ ציור שברים (חצי ורבע) ============================ */

let quiSeq = 0;
const uid = () => `q${++quiSeq}`;

/** צורה אחת מחולקת לחלקים. filled = מערך בוליאני */
function fracShape(kind, parts, filled, offset, interactive) {
  const id = uid();
  const cells = [];
  const fillOf = (i) => (filled[offset + i] ? 'var(--gold)' : 'rgba(255,255,255,.1)');

  if (kind === 'pizza') {
    for (let i = 0; i < parts; i++) {
      const a0 = (-90 + (i * 360) / parts) * (Math.PI / 180);
      const a1 = (-90 + ((i + 1) * 360) / parts) * (Math.PI / 180);
      const x0 = 50 + 44 * Math.cos(a0); const y0 = 50 + 44 * Math.sin(a0);
      const x1 = 50 + 44 * Math.cos(a1); const y1 = 50 + 44 * Math.sin(a1);
      const large = 360 / parts > 180 ? 1 : 0;
      const d = parts === 1
        ? 'M50 6 A44 44 0 1 1 49.9 6 Z'
        : `M50 50 L${x0.toFixed(2)} ${y0.toFixed(2)} A44 44 0 ${large} 1 ${x1.toFixed(2)} ${y1.toFixed(2)} Z`;
      cells.push(`<path d="${d}" fill="${fillOf(i)}" stroke="#0d2340" stroke-width="2"
        ${interactive ? `data-part="${offset + i}" class="frac-part"` : ''}/>`);
    }
    return `<svg class="frac-shape" viewBox="0 0 100 100" data-id="${id}">${cells.join('')}</svg>`;
  }

  const w = 96 / parts;
  for (let i = 0; i < parts; i++) {
    cells.push(`<rect x="${(2 + i * w).toFixed(2)}" y="18" width="${w.toFixed(2)}" height="64" rx="2"
      fill="${fillOf(i)}" stroke="#0d2340" stroke-width="2"
      ${interactive ? `data-part="${offset + i}" class="frac-part"` : ''}/>`);
  }
  return `<svg class="frac-shape" viewBox="0 0 100 100" data-id="${id}">${cells.join('')}</svg>`;
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

/* ============================ 8. דיאגרמת עמודות ============================ */

function chartUI(q, ctx) {
  let host = null;

  // הציר בצד ימין והעמודה הראשונה מימין - כמו בקריאה בעברית.
  const COLORS = ['#59a9ff', '#ffd23f', '#ff7a6e', '#5fd08b', '#b98cff'];
  const W = 360, H = 240, TOP = 18, BOTTOM = 200, LEFT = 10, RIGHT = 318;

  function draw() {
    const { labels, values, unit } = q.chart;
    const axisMax = Math.max(10, Math.ceil(Math.max(...values) / 10) * 10);
    const step = axisMax <= 20 ? 1 : axisMax <= 60 ? 5 : 10;
    const y = (v) => BOTTOM - (v / axisMax) * (BOTTOM - TOP);

    let grid = '';
    for (let v = 0; v <= axisMax; v += step) {
      const major = v % (step * 2) === 0;
      grid += `<line class="ch-grid ${major ? 'major' : ''}" x1="${LEFT}" x2="${RIGHT}" y1="${y(v)}" y2="${y(v)}"/>`;
      if (major) grid += `<text class="ch-tick" x="${RIGHT + 8}" y="${y(v) + 5}">${fmt(v)}</text>`;
    }

    const n = values.length;
    const slot = (RIGHT - LEFT) / n;
    const bw = Math.min(56, slot * 0.62);
    const bars = values.map((v, i) => {
      const cx = RIGHT - slot * (i + 0.5);
      return `
        <rect x="${cx - bw / 2}" y="${y(v)}" width="${bw}" height="${BOTTOM - y(v)}" rx="5" fill="${COLORS[i % COLORS.length]}"/>
        <text class="ch-label" x="${cx}" y="${BOTTOM + 22}">${esc(labels[i])}</text>`;
    }).join('');

    host.innerHTML = `${instructionLine(q)}
      <div class="chart-unit">${esc(unit)}</div>
      <svg class="bar-chart-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(`דיאגרמת עמודות: ${unit}`)}">
        ${grid}
        <line class="ch-axis" x1="${RIGHT}" x2="${RIGHT}" y1="${TOP - 6}" y2="${BOTTOM}"/>
        <line class="ch-axis" x1="${LEFT}" x2="${RIGHT}" y1="${BOTTOM}" y2="${BOTTOM}"/>
        ${bars}
      </svg>`;
  }

  return {
    usesKeypad: true,
    usesSubmit: true,
    mount(el) { host = el; draw(); },
    submit() { return keypadVerdict(q, ctx); },
    lock() { ctx.keypad.setEnabled(false); },
  };
}

/* ============================ בחירת הרכיב ============================ */

const REGISTRY = {
  numeric: numericUI,
  mission: numericUI,
  place_value: placeValueUI,
  choice: choiceUI,
  money: moneyUI,
  numberline_fill: numberLineFillUI,
  numberline_locate: numberLineLocateUI,
  frac_color: fracColorUI,
  chart: chartUI,
};

export function createQuestionUI(q, ctx) {
  const factory = REGISTRY[q.ui] || numericUI;
  return factory(q, ctx);
}

export const SUPPORTED_UIS = Object.keys(REGISTRY);
