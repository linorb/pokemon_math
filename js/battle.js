// battle.js - לולאת הקרב: 5 שאלות מול פוקימון בר, פוקדולרים, רמזים ופתרון מלא,
// ובסוף - ניסיון לתפוס את הפוקימון.

import { buildBattle, TOPICS } from './questions.js';
import { getState } from './storage.js';
import { createQuestionUI } from './qui.js';
import {
  $, showScreen, toast, answerInput, updateHUD, speak, stopSpeaking, canSpeak, hasHebrewVoice,
  celebrateLevelUp,
} from './ui.js';
import {
  REWARDS, addCoins, addXp, recordAnswer, pushToReview, clearFromReview, touchDailyStreak,
  bumpSessions, markPerfect, rankIndexFor, awardBadgeIfEarned,
} from './progress.js';
import {
  partner, pickWild, addPartnerXp, catchChance, throwBall, ballCount, BALLS, nameOf, markSeen,
  canEvolve, levelOf, CANDY_XP,
} from './pokemon.js';
import { SPECIES } from './pokedex.js';
import { pokemonImg, ballSvg } from './art.js';
import { fmt, esc, wrapMath, speakMath } from './util.js';

const QUESTIONS_PER_BATTLE = 5;
const MAX_HP = 100;
const DAMAGE_FIRST = 22;   // 5 תשובות נכונות בניסיון ראשון = הפוקימון הבר מתעלף
const DAMAGE_SECOND = 14;

let battle = null;

/* ============================ משוב ============================ */

function showFeedback(kind, title, html) {
  const fb = $('#q-feedback');
  fb.className = `q-feedback ${kind}`;
  fb.innerHTML = `<span class="fb-title">${esc(title)}</span>${html}`;
  fb.hidden = false;
}

function hideFeedback() {
  const fb = $('#q-feedback');
  fb.hidden = true;
  fb.innerHTML = '';
}

function stepsHtml(steps) {
  return `<ol>${steps.map((s) => `<li>${wrapMath(esc(s))}</li>`).join('')}</ol>`;
}

function hintHtml(q) {
  return `<div>💡 ${wrapMath(esc(q.hint))}</div>`;
}

/* ============================ הקראה ============================ */

/** הנוסח המדובר של השאלה */
export function speechFor(q) {
  if (q.speech) return q.speech;
  const parts = [q.instruction];
  if (q.given) parts.push(`ידוע ש ${q.given}`);
  if (q.story) parts.push(q.story);
  if (q.expr) parts.push(q.expr);
  if (q.ui === 'choice' && q.options.every((o) => !/[<>=]/.test(o.text)) && q.options.length > 2) {
    parts.push(`האפשרויות: ${q.options.map((o) => o.text).join(', ')}`);
  }
  return parts.filter(Boolean).map(speakMath).join('. ');
}

function readQuestion() {
  if (!battle) return;
  speak(speechFor(battle.questions[battle.index]));
}

/* ============================ ציור השאלה ============================ */

function setKeypadVisible(show) {
  $('#answer-row').hidden = !show;
  $('#keypad').hidden = !show;
}

function questionContext() {
  return {
    keypad: answerInput,
    speak,
    toast,
    setKeypad: setKeypadVisible,
    verdict: (v) => handleVerdict(v),
  };
}

function renderQuestion() {
  const q = battle.questions[battle.index];
  battle.errors = 0;
  battle.hintShown = false;

  const topicName = TOPICS[q.topic] ? TOPICS[q.topic].name : '';
  const tags = [
    `שאלה ${battle.index + 1} מתוך ${battle.questions.length}`,
    topicName,
    q.source === 'program' ? 'מתוך התכנית' : '',
    q.fromReview ? 'חזרה 🔁' : '',
  ].filter(Boolean);
  $('#q-topic').textContent = tags.join(' · ');
  $('#btn-read-q').hidden = !canSpeak();

  hideFeedback();
  answerInput.reset(q.unit);

  battle.component = createQuestionUI(q, questionContext());
  battle.component.mount($('#q-body'));

  setKeypadVisible(battle.component.usesKeypad);
  $('#btn-submit').hidden = !battle.component.usesSubmit;
  $('#btn-submit').disabled = false;
  $('#btn-next').hidden = true;
  $('#btn-hint').disabled = false;

  renderPips();

  if (getState().settings.autoRead && hasHebrewVoice()) {
    setTimeout(() => { if (battle && battle.questions[battle.index] === q) readQuestion(); }, 350);
  }
}

function renderPips() {
  $('#battle-progress').innerHTML = battle.questions.map((_, i) => {
    const r = battle.results[i];
    let cls = 'pip';
    if (r === 'first') cls += ' good';
    else if (r === 'second') cls += ' half';
    else if (r === 'fail') cls += ' bad';
    if (i === battle.index) cls += ' current';
    return `<div class="${cls}"></div>`;
  }).join('');
}

/* ============================ אנימציות ============================ */

function attackAnimation(damage) {
  const hero = $('#battle-partner');
  const art = $('#wild-art');
  hero.classList.add('attack-anim');
  setTimeout(() => art.classList.add('shake-anim'), 180);
  setTimeout(() => {
    hero.classList.remove('attack-anim');
    art.classList.remove('shake-anim');
  }, 700);

  const pop = $('#damage-pop');
  pop.textContent = `-${fmt(damage)}`;
  pop.hidden = true;
  void pop.offsetWidth;
  pop.hidden = false;
  setTimeout(() => { pop.hidden = true; }, 1000);
}

function setHp(hp) {
  const fill = $('#hp-fill');
  const pct = Math.max(0, (hp / MAX_HP) * 100);
  fill.style.width = `${pct}%`;
  fill.classList.toggle('mid', pct <= 55 && pct > 25);
  fill.classList.toggle('low', pct <= 25);
}

/* ============================ פסק דין ============================ */

const PRAISE_FIRST = ['מצוין!', 'כל הכבוד!', 'בול!', 'אלוף!', 'מדויק!', 'פגיעה ישירה!'];
const PRAISE_SECOND = ['יפה מאוד, הצלחת!', 'כל הכבוד על ההתמדה!', 'זהו, תפסת את זה!'];
const ENCOURAGE = ['כמעט! ננסה שוב עם רמז.', 'לא נורא בכלל - יש עוד ניסיון.', 'זה קורה לכולם. הנה רמז קטן.'];

function pickOf(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function handleVerdict(v) {
  if (!battle || battle.finished) return;
  const q = battle.questions[battle.index];

  if (v.status === 'incomplete') {
    toast(v.message || 'עוד לא סיימנו כאן 🙂');
    return;
  }

  // התקדמות בתוך השאלה (אבן נוספת וכדומה)
  if (v.status === 'progress') {
    showFeedback('good', v.message || 'יופי!', '');
    return;
  }

  if (v.status === 'correct') {
    const outcome = battle.errors === 0 ? 'first' : 'second';
    const base = outcome === 'first' ? REWARDS.firstTry : REWARDS.secondTry;
    const bonus = v.bonus || 0;
    const coins = base + bonus;
    const xp = outcome === 'first' ? REWARDS.xpFirstTry : REWARDS.xpSecondTry;
    const damage = outcome === 'first' ? DAMAGE_FIRST : DAMAGE_SECOND;

    battle.results[battle.index] = outcome;
    battle.coins += coins;
    battle.xp += xp;
    battle.hp = Math.max(0, battle.hp - damage);

    answerInput.markRight();
    attackAnimation(damage);
    setHp(battle.hp);
    if (battle.hp <= 0) $('#wild-art').classList.add('fainted');

    addCoins(coins);
    const lvl = addXp(xp);
    const pxp = addPartnerXp(xp);
    if (pxp) {
      battle.partnerXp += xp;
      if (pxp.leveledUp) battle.partnerLevel = pxp.levelAfter;
      if (pxp.becameReady) battle.partnerReady = true;
    }
    recordAnswer(q.topic, outcome);
    battle.topics.add(q.topic);
    if (q.fromReview) clearFromReview(q.type);
    if (lvl.leveledUp) battle.levelUps.push(lvl.rank.name);
    updateHUD();

    const praise = outcome === 'first' ? pickOf(PRAISE_FIRST) : pickOf(PRAISE_SECOND);
    const extra = bonus ? ` (כולל בונוס של ${fmt(bonus)})` : '';
    showFeedback('good', `${praise} 🎉`, `
      ${v.message ? `<div>${esc(v.message)}</div>` : ''}
      <div>קיבלת <span class="num">${fmt(coins)}</span> פוקדולרים${esc(extra)}.</div>`);
    endOfQuestion();
    return;
  }

  // תשובה לא נכונה
  battle.errors += 1;
  answerInput.markWrong();

  if (battle.errors === 1) {
    showFeedback('hint', v.message || pickOf(ENCOURAGE),
      `${hintHtml(q)}<div class="fb-extra">נסו שוב - טעות לא עולה פוקדולרים.</div>`);
    battle.hintShown = true;
    $('#btn-hint').disabled = true;
    return;
  }

  battle.results[battle.index] = 'fail';
  recordAnswer(q.topic, 'fail');
  battle.topics.add(q.topic);
  pushToReview(q);
  const lvl = addXp(REWARDS.xpEffort);
  if (lvl.leveledUp) battle.levelUps.push(lvl.rank.name);
  battle.xp += REWARDS.xpEffort;
  updateHUD();

  const answerText = q.answerText || (typeof q.answer === 'number' ? fmt(q.answer) : String(q.answer));
  showFeedback('solve', 'בואו נפתור את זה יחד, שלב אחר שלב:',
    `${stepsHtml(q.steps)}<div class="fb-extra">התשובה הנכונה: <span class="mathrun" dir="ltr">${esc(answerText)}</span>. השאלה הזו תחזור בקרב הבא כדי להתאמן עליה שוב. 💪</div>`);
  endOfQuestion();
}

function endOfQuestion() {
  if (battle.component && battle.component.lock) battle.component.lock();
  answerInput.setEnabled(false);
  renderPips();
  $('#btn-submit').hidden = true;
  $('#btn-next').hidden = false;
  $('#btn-next').textContent = battle.index === battle.questions.length - 1 ? 'לתפוס את הפוקימון! ←' : 'המשך ←';
  $('#btn-hint').disabled = true;
  $('#btn-next').focus();
}

function onSubmit() {
  if (!battle || !battle.component) return;
  handleVerdict(battle.component.submit());
}

function onHint() {
  const q = battle.questions[battle.index];
  const s = getState();
  if (battle.hintShown) return;
  if (s.player.coins < REWARDS.hintCost) {
    toast('אין מספיק פוקדולרים לרמז. נסו לפתור - גם טעות לא עולה כלום!');
    return;
  }
  addCoins(-REWARDS.hintCost);
  battle.hintsBought += 1;
  battle.hintShown = true;
  updateHUD();
  $('#btn-hint').disabled = true;
  showFeedback('hint', 'רמז:', hintHtml(q));
}

function onNext() {
  if (!battle) return;
  stopSpeaking();
  battle.index += 1;
  if (battle.index >= battle.questions.length) {
    finishBattle();
    return;
  }
  renderQuestion();
}

/* ============================ סיום הקרב ============================ */

function finishBattle() {
  battle.finished = true;
  const firstTry = battle.results.filter((r) => r === 'first').length;
  const second = battle.results.filter((r) => r === 'second').length;
  const total = battle.questions.length;
  battle.correct = firstTry + second;
  battle.perfect = firstTry === total;

  battle.bonus = 0;
  if (battle.perfect) {
    battle.bonus += REWARDS.perfectBonus;
    markPerfect();
  }
  battle.streakBonus = battle.streakInfo.isNewDay ? battle.streakInfo.bonus : 0;
  battle.bonus += battle.streakBonus;

  // תגים: מכון שהגיע ל-3 כוכבים
  battle.badges = [...battle.topics].filter((t) => awardBadgeIfEarned(t));
  battle.badgeBonus = battle.badges.length * REWARDS.badgeBonus;
  battle.bonus += battle.badgeBonus;

  if (battle.bonus > 0) addCoins(battle.bonus);
  bumpSessions();
  updateHUD();
  renderCatch();
}

/* ============================ תפיסה ============================ */

function renderCatch(stage = 'ready', result = null) {
  const wild = battle.wildId;
  const name = nameOf(wild);
  const sp = SPECIES[wild];
  const fainted = battle.hp <= 0;
  const chanceOf = (ball) => catchChance({
    correct: battle.correct, total: battle.questions.length, fainted, ball, rarity: sp.rarity,
  });

  let body;
  if (stage === 'ready') {
    const balls = Object.values(BALLS).map((b) => {
      const count = ballCount(b.id);
      const disabled = count < 1;
      return `
        <button class="ball-choice ${battle.ball === b.id ? 'chosen' : ''}" type="button" data-ball="${b.id}" ${disabled ? 'disabled' : ''}>
          ${ballSvg(b.id)}
          <span>${esc(b.name)}</span>
          <span class="small-note">${count === Infinity ? 'בלי הגבלה' : `יש לך ${fmt(count)}`}</span>
        </button>`;
    }).join('');
    const chosenPct = Math.round(chanceOf(battle.ball) * 100);
    body = `
      <div class="catch-title">${fainted ? `${esc(name)} הבר התעלף!` : `${esc(name)} הבר נחלש!`}</div>
      <div class="catch-stage">
        <div class="catch-wild ${fainted ? 'fainted' : ''}">${pokemonImg(wild, { cls: 'pk-xl' })}</div>
      </div>
      <div class="catch-meter">
        <div class="small-note">סיכוי לתפוס</div>
        <div class="meter"><div class="meter-fill" style="width:${chosenPct}%"></div></div>
        ${chosenPct >= 100
    ? '<div class="meter-note">בטוח תופסים! ✨</div>'
    : '<div class="small-note">ככל שעונים נכון יותר בקרב - קל יותר לתפוס. סופרדור עוזר!</div>'}
      </div>
      <div class="ball-row">${balls}</div>
      <button class="btn btn-primary btn-xl" type="button" id="btn-throw">זורקים ${esc(BALLS[battle.ball].name)}!</button>`;
  } else if (stage === 'throwing') {
    body = `
      <div class="catch-title">...</div>
      <div class="catch-stage">
        <div class="catch-wild captured">${pokemonImg(wild, { cls: 'pk-xl' })}</div>
        <div class="thrown-ball wobble">${ballSvg(battle.ball)}</div>
      </div>`;
  } else {
    const caught = result.caught;
    let text;
    if (!caught) text = `אוי! ${esc(name)} ברח... בפעם הבאה נתפוס! 💨`;
    else if (result.duplicate) text = `נתפס! כבר יש לך ${esc(name)}, אז הוא הפך לממתק: +${fmt(CANDY_XP)} ניסיון ל${esc(nameOf(partner().species))} 🍬`;
    else text = `נתפס! <strong>${esc(name)}</strong> הצטרף לאוסף שלך! ${result.isNew ? '(חדש בפוקידקס!)' : ''}`;
    body = `
      <div class="catch-title">${caught ? 'יש!!! 🎉' : 'כמעט...'}</div>
      <div class="catch-stage">
        ${caught
    ? `<div class="thrown-ball caught">${ballSvg(battle.ball)}<span class="stars">✨</span></div>`
    : `<div class="catch-wild escaped">${pokemonImg(wild, { cls: 'pk-xl' })}</div>`}
      </div>
      <div class="catch-text">${text}</div>
      <button class="btn btn-primary btn-xl" type="button" id="btn-catch-next">לסיכום הקרב ←</button>`;
  }

  $('#catch-body').innerHTML = body;
  showScreen('catch');

  if (stage === 'ready') {
    $('#catch-body').querySelectorAll('[data-ball]').forEach((b) => {
      b.onclick = () => { battle.ball = b.dataset.ball; renderCatch('ready'); };
    });
    $('#btn-throw').onclick = () => {
      const chance = chanceOf(battle.ball);
      renderCatch('throwing');
      setTimeout(() => {
        const res = throwBall(wild, chance, battle.ball);
        if (res.error) { toast(res.error); renderCatch('ready'); return; }
        battle.catchResult = res;
        if (res.candy) {
          battle.partnerXp += CANDY_XP;
          if (res.candy.leveledUp) battle.partnerLevel = res.candy.levelAfter;
          if (res.candy.becameReady) battle.partnerReady = true;
        }
        renderCatch('done', res);
      }, 2300);
    };
  } else if (stage === 'done') {
    $('#btn-catch-next').onclick = showSummary;
  }
}

/* ============================ סיכום ============================ */

function showSummary() {
  const s = getState();
  const total = battle.questions.length;
  const firstTry = battle.results.filter((r) => r === 'first').length;
  const days = battle.streakInfo.streak === 1 ? 'יום אחד' : `${fmt(battle.streakInfo.streak)} ימים`;
  const value = (v) => (/[֐-׿]/.test(v) ? `<span>${esc(v)}</span>` : `<span class="num">${esc(v)}</span>`);
  const p = partner();
  const res = battle.catchResult || { caught: false };

  $('#summary-title').textContent = res.caught ? 'ניצחון ותפיסה! 🏆' : 'סוף הקרב';
  $('#summary-art').innerHTML = res.caught && !res.duplicate
    ? pokemonImg(battle.wildId, { cls: 'pk-lg' })
    : pokemonImg(p.species, { cls: 'pk-lg' });
  $('#summary-art').classList.toggle('victory-pop', Boolean(res.caught));

  const rows = [
    ['תשובות נכונות', `${fmt(battle.correct)} מתוך ${fmt(total)}`],
    ['נכון בניסיון ראשון', `${fmt(firstTry)}`],
    ['פוקדולרים מהקרב', `₽ ${fmt(battle.coins)}`],
    [`ניסיון ל${nameOf(p.species)}`, `+${fmt(battle.partnerXp)}`],
  ];
  if (battle.hintsBought > 0) rows.push(['רמזים שנקנו', `₽ -${fmt(battle.hintsBought * REWARDS.hintCost)}`]);

  const bonusRows = [];
  if (battle.perfect) bonusRows.push([`בונוס קרב מושלם! ${fmt(total)} מתוך ${fmt(total)}`, `₽ +${fmt(REWARDS.perfectBonus)}`]);
  if (battle.streakBonus > 0) bonusRows.push([`בונוס רצף אימונים - ${days}`, `₽ +${fmt(battle.streakBonus)}`]);
  for (const t of battle.badges) bonusRows.push([`🏅 תג חדש: ${TOPICS[t].gym}`, `₽ +${fmt(REWARDS.badgeBonus)}`]);
  if (battle.partnerLevel) bonusRows.push([`${nameOf(p.species)} עלה לרמה ${fmt(battle.partnerLevel)}!`, '⬆️']);

  $('#summary-list').innerHTML = [
    ...rows.map(([k, v]) => `<li><span>${esc(k)}</span>${value(v)}</li>`),
    ...bonusRows.map(([k, v]) => `<li class="bonus"><span>${esc(k)}</span>${value(v)}</li>`),
    `<li><span>סך הפוקדולרים שלך</span><span class="num">₽ ${fmt(s.player.coins)}</span></li>`,
  ].join('');

  const ready = canEvolve(p.uid);
  $('#summary-evolve').hidden = !ready;
  if (ready) $('#summary-evolve').innerHTML = `✨ ${esc(nameOf(p.species))} מוכן להתפתח! היכנסו לפוקידקס.`;
  $('#btn-summary-dex').classList.toggle('btn-glow', ready);

  showScreen('summary');

  const celebrations = [];
  if (battle.badges.length) celebrations.push([`קיבלת את ${TOPICS[battle.badges[0]].gym}!`, '🏅']);
  if (battle.levelUps.length) celebrations.push([`עלית לדרגת ${battle.levelUps[battle.levelUps.length - 1]}!`, '⭐']);
  celebrations.forEach(([text, icon], i) => setTimeout(() => celebrateLevelUp(text, icon), 400 + i * 2600));

  battle = null;
}

/* ============================ התחלה ויציאה ============================ */

export function startBattle(options = {}) {
  const s = getState();
  const topic = options.topic || null;
  const p = partner();
  const wildId = pickWild(rankIndexFor(s.player.xp));
  markSeen(wildId);

  battle = {
    topic,
    questions: buildBattle(s, { count: QUESTIONS_PER_BATTLE, topic }),
    wildId,
    hp: MAX_HP,
    index: 0,
    errors: 0,
    hintShown: false,
    hintsBought: 0,
    results: [],
    coins: 0,
    xp: 0,
    partnerXp: 0,
    partnerLevel: 0,
    partnerReady: false,
    levelUps: [],
    topics: new Set(),
    component: null,
    finished: false,
    ball: 'poke_ball',
    streakInfo: touchDailyStreak(),
  };

  $('#wild-name').innerHTML = `${esc(nameOf(wildId))} <span class="wild-tag">פוקימון בר</span>`;
  $('#wild-art').className = 'wild-art';
  $('#wild-art').innerHTML = pokemonImg(wildId, { cls: 'pk-lg' });
  setHp(battle.hp);

  $('#battle-partner').innerHTML = `${pokemonImg(p.species, { cls: 'pk-md flip' })}
    <div class="partner-label">${esc(nameOf(p.species))} · רמה <span class="num">${fmt(levelOf(p.xp))}</span></div>`;

  showScreen('battle');
  $('#topbar-title').textContent = topic && TOPICS[topic] ? TOPICS[topic].gym : 'קרב פראי';
  renderQuestion();

  if (battle.streakInfo.isNewDay && battle.streakInfo.streak > 1) {
    toast(`🔥 רצף של ${battle.streakInfo.streak} ימים! בונוס בסוף הקרב.`);
  }
}

/** האם יש קרב פעיל שעדיין לא הסתיים */
export function isBattleActive() {
  return Boolean(battle && !battle.finished);
}

/** יציאה מהקרב באמצע - מה שנענה כבר נשמר */
export function abandonBattle() {
  stopSpeaking();
  if (battle) battle.finished = true;
  battle = null;
}

export function bindBattleButtons() {
  $('#btn-submit').addEventListener('click', onSubmit);
  $('#btn-next').addEventListener('click', onNext);
  $('#btn-hint').addEventListener('click', onHint);
  $('#btn-read-q').addEventListener('click', readQuestion);
}
