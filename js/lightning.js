// lightning.js - מיני משחק "מתקפת ברק": עובדות חיבור וחיסור (או כפל) בלחץ זמן, עם שיא אישי.
// זהו המקום היחיד במשחק שבו יש טיימר.

import { ri, pick, shuffle, fmt } from './util.js';
import { $, showScreen, toast, updateHUD, celebrateLevelUp } from './ui.js';
import { addCoins, addXp, recordAnswer, saveLightningBest, lightningBest } from './progress.js';
import { addPartnerXp } from './pokemon.js';
import { pokemonImg } from './art.js';
import { TOPICS } from './topics.js';
import { getState } from './storage.js';

const GAME_SECONDS = 60;

const MODES = {
  easy: { name: 'חִבּוּר וְחִסּוּר עַד 10', topic: 'add_sub' },
  normal: { name: 'חִבּוּר וְחִסּוּר עַד 20', topic: 'add_sub' },
  mult: { name: 'לוּחַ הַכֶּפֶל עַד 6×6', topic: 'mult_div' },
};

let game = null;
let timer = null;

/* ============================ שאלות ============================ */

function nextFact(mode) {
  let a, b, op, answer;
  if (mode === 'mult') {
    a = ri(1, 6); b = ri(1, 6); op = '×'; answer = a * b;
  } else {
    const max = mode === 'easy' ? 10 : 20;
    if (Math.random() < 0.5) {
      answer = ri(2, max); a = ri(1, answer - 1); b = answer - a; op = '+';
    } else {
      a = ri(2, max); b = ri(1, a - 1); op = '-'; answer = a - b;
    }
  }

  const candidates = new Set([answer]);
  const tries = [answer + 1, answer - 1, answer + 2, answer - 2, answer + 10, answer - 10, answer + a, answer - b];
  for (const c of shuffle(tries)) {
    if (c >= 0 && c !== answer && candidates.size < 4) candidates.add(c);
  }
  while (candidates.size < 4) candidates.add(answer + ri(3, 9));

  return { a, b, op, answer, choices: shuffle([...candidates]) };
}

/* ============================ ציור ============================ */

function drawIntro() {
  const multOpen = (getState().settings.enabledTopics || []).includes('mult_div') && TOPICS.mult_div.ready;
  $('#lightning-body').innerHTML = `
    <div class="card lightning-card">
      <div class="lightning-art">${pokemonImg(25, { cls: 'pk-lg bob' })}</div>
      <div class="lightning-title">⚡ מִתְקֶפֶת בָּרָק</div>
      <p class="subtitle">${GAME_SECONDS} שְׁנִיּוֹת. כַּמָּה תַּרְגִּילִים תַּסְפִּיקוּ לִפְתֹּר?</p>
      <div class="best-row">🏆 שִׂיאִים: קַל <span class="num">${fmt(lightningBest('easy'))}</span> · רָגִיל <span class="num">${fmt(lightningBest('normal'))}</span>${multOpen ? ` · כֶּפֶל <span class="num">${fmt(lightningBest('mult'))}</span>` : ''}</div>
      <button class="btn btn-secondary btn-xl" type="button" data-mode="easy">🐣 ${MODES.easy.name}</button>
      <button class="btn btn-primary btn-xl" type="button" data-mode="normal">⚡ ${MODES.normal.name}</button>
      ${multOpen ? `<button class="btn btn-lightning btn-xl" type="button" data-mode="mult">✖️ ${MODES.mult.name}</button>` : ''}
      <p class="small-note">כָּל תְּשׁוּבָה נְכוֹנָה = פּוֹקָדוֹלָר וְנִסָּיוֹן. טָעוּת לֹא מוֹרִידָה כְּלוּם.</p>
    </div>`;
  $('#lightning-body').querySelectorAll('[data-mode]').forEach((b) => {
    b.onclick = () => start(b.dataset.mode);
  });
}

function drawGame(flash = '') {
  const q = game.q;
  $('#lightning-body').innerHTML = `
    <div class="lightning-hud">
      <div class="chip-box">⚡ <span class="num">${fmt(game.score)}</span></div>
      <div class="timer-bar"><div class="timer-fill" style="width:${(game.left / GAME_SECONDS) * 100}%"></div></div>
      <div class="chip-box">⏱ <span class="num" id="lightning-sec">${Math.ceil(game.left)}</span></div>
    </div>
    ${game.combo >= 3 ? `<div class="combo">🔥 רֶצֶף שֶׁל ${fmt(game.combo)}!</div>` : ''}
    <div class="card lightning-card ${flash}">
      <div class="expr expr-big" dir="ltr">${fmt(q.a)} ${q.op} ${fmt(q.b)} = ?</div>
      <div class="bolt-choices">
        ${q.choices.map((c) => `<button class="bolt-btn" type="button" data-v="${c}">${fmt(c)}</button>`).join('')}
      </div>
    </div>`;

  $('#lightning-body').querySelectorAll('[data-v]').forEach((b) => {
    b.onclick = () => answer(Number(b.dataset.v));
  });
}

function drawEnd(isRecord) {
  const coins = game.score;
  const xp = game.score * 2;
  $('#lightning-body').innerHTML = `
    <div class="card lightning-card">
      <div class="lightning-title">${isRecord ? '🏆 שִׂיא חָדָשׁ!' : '⚡ סוֹף הַסִּבּוּב'}</div>
      <div class="big-score num">${fmt(game.score)}</div>
      <p class="subtitle">תַּרְגִּילִים נְכוֹנִים בְּ-${GAME_SECONDS} שְׁנִיּוֹת (${MODES[game.mode].name})</p>
      <ul class="summary-list">
        <li><span>הַשִּׂיא שֶׁלָּכֶם</span><span class="num">🏆 ${fmt(lightningBest(game.mode))}</span></li>
        <li><span>פּוֹקָדוֹלָרִים</span><span class="num">₽ +${fmt(coins)}</span></li>
        <li><span>נִסָּיוֹן</span><span class="num">⭐ +${fmt(xp)}</span></li>
        <li><span>הָרֶצֶף הֲכִי אָרֹךְ</span><span class="num">🔥 ${fmt(game.bestCombo)}</span></li>
      </ul>
      <button class="btn btn-primary btn-xl" type="button" id="btn-lightning-again">עוֹד סִבּוּב!</button>
    </div>`;
  const mode = game.mode;
  $('#btn-lightning-again').onclick = () => start(mode);
}

/* ============================ לוגיקה ============================ */

function answer(v) {
  if (!game || game.over) return;
  const topic = MODES[game.mode].topic;
  if (v === game.q.answer) {
    game.score += 1;
    game.combo += 1;
    game.bestCombo = Math.max(game.bestCombo, game.combo);
    recordAnswer(topic, 'first');
    game.q = nextFact(game.mode);
    drawGame('flash-good');
    setTimeout(() => { if (game && !game.over) drawGame(); }, 160);
  } else {
    game.combo = 0;
    recordAnswer(topic, 'fail');
    const { a, b, op, answer: right } = game.q;
    drawGame('flash-bad');
    toast(`${fmt(a)} ${op} ${fmt(b)} = ${fmt(right)}`, 1200);
    game.q = nextFact(game.mode);
    setTimeout(() => { if (game && !game.over) drawGame(); }, 500);
  }
}

function tick() {
  if (!game || game.over) return;
  game.left -= 0.1;
  if (game.left <= 0) {
    finish();
    return;
  }
  const fill = document.querySelector('.timer-fill');
  if (fill) fill.style.width = `${(game.left / GAME_SECONDS) * 100}%`;
  const t = document.getElementById('lightning-sec');
  if (t) t.textContent = fmt(Math.ceil(game.left));
}

function finish() {
  game.over = true;
  clearInterval(timer);
  timer = null;

  const isRecord = saveLightningBest(game.score, game.mode);
  addCoins(game.score);
  const lvl = addXp(game.score * 2);
  addPartnerXp(game.score * 2);
  updateHUD();

  drawEnd(isRecord);
  if (isRecord && game.score > 0) celebrateLevelUp(`שִׂיא חָדָשׁ: ${fmt(game.score)}!`, '🏆');
  else if (lvl.leveledUp) celebrateLevelUp(`עֲלִיתֶם לְדַרְגַּת ${lvl.rank.name}!`);
}

function start(mode = 'normal') {
  stopLightning();
  game = { mode, score: 0, combo: 0, bestCombo: 0, left: GAME_SECONDS, over: false, q: nextFact(mode) };
  drawGame();
  timer = setInterval(tick, 100);
}

/* ============================ ממשק חיצוני ============================ */

export function openLightning() {
  stopLightning();
  showScreen('lightning');
  drawIntro();
}

/** עצירת הטיימר - נקרא ביציאה מהמסך */
export function stopLightning() {
  if (timer) { clearInterval(timer); timer = null; }
  if (game) game.over = true;
  game = null;
}

export function isLightningRunning() {
  return Boolean(game && !game.over);
}

// לבדיקות
export { nextFact };
