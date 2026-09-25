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

/**
 * מה מקריאים: רק את ההוראה, ובשאלות מילוליות גם את הסיפור.
 * את התרגיל והמספרים עצמם לא מקריאים - אותם הילד/ה קורא/ת לבד.
 */
export function speechFor(q) {
  if (q.speech) return q.speech;
  const parts = [q.instruction];
  if (q.story) parts.push(q.story);
  return parts.filter(Boolean).map(speakMath).join('. ');
}

function readQuestion() {
  if (!battle) return;
  if (!hasHebrewVoice()) {
    toast('בַּמַּכְשִׁיר הַזֶּה אֵין קוֹל עִבְרִי לְהַקְרָאָה 🔇');
    return;
  }
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
    `שְׁאֵלָה ${battle.index + 1} מִתּוֹךְ ${battle.questions.length}`,
    topicName,
    q.source === 'program' ? 'מִתּוֹךְ הַתָּכְנִית' : '',
    q.fromReview ? 'חֲזָרָה 🔁' : '',
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

const PRAISE_FIRST = ['מְצֻיָּן!', 'כָּל הַכָּבוֹד!', 'בּוּל!', 'אַלּוּפִים!', 'מְדֻיָּק!', 'פְּגִיעָה יְשִׁירָה!'];
const PRAISE_SECOND = ['יָפֶה מְאוֹד, הִצְלַחְתֶּם!', 'כָּל הַכָּבוֹד עַל הַהַתְמָדָה!', 'זְהוּ, תְּפַסְתֶּם אֶת זֶה!'];
const ENCOURAGE = ['כִּמְעַט! נְנַסֶּה שׁוּב עִם רֶמֶז.', 'לֹא נוֹרָא בִּכְלָל - יֵשׁ עוֹד נִסָּיוֹן.', 'זֶה קוֹרֶה לְכֻלָּם. הִנֵּה רֶמֶז קָטָן.'];

function pickOf(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function handleVerdict(v) {
  if (!battle || battle.finished) return;
  const q = battle.questions[battle.index];

  if (v.status === 'incomplete') {
    toast(v.message || 'עוֹד לֹא סִיַּמְנוּ כָּאן 🙂');
    return;
  }

  // התקדמות בתוך השאלה (אבן נוספת וכדומה)
  if (v.status === 'progress') {
    showFeedback('good', v.message || 'יֹפִי!', '');
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
    }
    recordAnswer(q.topic, outcome);
    battle.topics.add(q.topic);
    if (q.fromReview) clearFromReview(q.type);
    if (lvl.leveledUp) battle.levelUps.push(lvl.rank.name);
    updateHUD();

    const praise = outcome === 'first' ? pickOf(PRAISE_FIRST) : pickOf(PRAISE_SECOND);
    const extra = bonus ? ` (כּוֹלֵל בּוֹנוּס שֶׁל ${fmt(bonus)})` : '';
    showFeedback('good', `${praise} 🎉`, `
      ${v.message ? `<div>${esc(v.message)}</div>` : ''}
      <div>קִבַּלְתֶּם <span class="num">${fmt(coins)}</span> פּוֹקָדוֹלָרִים${esc(extra)}.</div>`);
    endOfQuestion();
    return;
  }

  // תשובה לא נכונה
  battle.errors += 1;
  answerInput.markWrong();

  if (battle.errors === 1) {
    showFeedback('hint', v.message || pickOf(ENCOURAGE),
      `${hintHtml(q)}<div class="fb-extra">נַסּוּ שׁוּב - טָעוּת לֹא עוֹלָה פּוֹקָדוֹלָרִים.</div>`);
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
  showFeedback('solve', 'בּוֹאוּ נִפְתֹּר אֶת זֶה יַחַד, שָׁלָב אַחַר שָׁלָב:',
    `${stepsHtml(q.steps)}<div class="fb-extra">הַתְּשׁוּבָה הַנְּכוֹנָה: <span class="mathrun" dir="ltr">${esc(answerText)}</span>. הַשְּׁאֵלָה הַזֹּאת תַּחֲזֹר בַּקְּרָב הַבָּא, כְּדֵי לְהִתְאַמֵּן עָלֶיהָ שׁוּב. 💪</div>`);
  endOfQuestion();
}

function endOfQuestion() {
  if (battle.component && battle.component.lock) battle.component.lock();
  answerInput.setEnabled(false);
  renderPips();
  $('#btn-submit').hidden = true;
  $('#btn-next').hidden = false;
  $('#btn-next').textContent = battle.index === battle.questions.length - 1 ? 'לִתְפֹּס אֶת הַפּוֹקִימוֹן! ←' : 'הַמְשֵׁךְ ←';
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
    toast('אֵין מַסְפִּיק פּוֹקָדוֹלָרִים לְרֶמֶז. נַסּוּ לִפְתֹּר - גַּם טָעוּת לֹא עוֹלָה כְּלוּם!');
    return;
  }
  addCoins(-REWARDS.hintCost);
  battle.hintsBought += 1;
  battle.hintShown = true;
  updateHUD();
  $('#btn-hint').disabled = true;
  showFeedback('hint', 'רֶמֶז:', hintHtml(q));
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
          <span class="small-note">${count === Infinity ? 'בְּלִי הַגְבָּלָה' : `יֵשׁ לָכֶם ${fmt(count)}`}</span>
        </button>`;
    }).join('');
    const chosenPct = Math.round(chanceOf(battle.ball) * 100);
    body = `
      <div class="catch-title">${esc(name)} הַבָּר ${fainted ? 'הִתְעַלֵּף!' : 'נֶחֱלַשׁ!'}</div>
      <div class="catch-stage">
        <div class="catch-wild ${fainted ? 'fainted' : ''}">${pokemonImg(wild, { cls: 'pk-xl' })}</div>
      </div>
      <div class="catch-meter">
        <div class="small-note">סִכּוּי לִתְפֹּס</div>
        <div class="meter"><div class="meter-fill" style="width:${chosenPct}%"></div></div>
        ${chosenPct >= 100
    ? '<div class="meter-note">בֶּטַח תּוֹפְסִים! ✨</div>'
    : '<div class="small-note">כְּכָל שֶׁעוֹנִים נָכוֹן יוֹתֵר בַּקְּרָב - קַל יוֹתֵר לִתְפֹּס. סוּפֶּרְדוֹר עוֹזֵר!</div>'}
      </div>
      <div class="ball-row">${balls}</div>
      <button class="btn btn-primary btn-xl" type="button" id="btn-throw">זוֹרְקִים ${esc(BALLS[battle.ball].name)}!</button>`;
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
    if (!caught) text = `אוֹי! ${esc(name)} בָּרַח... בַּפַּעַם הַבָּאָה נִתְפֹּס! 💨`;
    else if (result.duplicate) text = `נִתְפַּס! כְּבָר יֵשׁ לָכֶם ${esc(name)}, אָז הוּא הָפַךְ לְמַמְתָּק: +${fmt(CANDY_XP)} נִסָּיוֹן לְ${esc(nameOf(partner().species))} 🍬`;
    else text = `נִתְפַּס! <strong>${esc(name)}</strong> הִצְטָרֵף לָאֹסֶף שֶׁלָּכֶם! ${result.isNew ? '(חָדָשׁ בַּפּוֹקִידֶקְס!)' : ''}`;
    body = `
      <div class="catch-title">${caught ? 'יֵשׁ!!! 🎉' : 'כִּמְעַט...'}</div>
      <div class="catch-stage">
        ${caught
    ? `<div class="thrown-ball caught">${ballSvg(battle.ball)}<span class="stars">✨</span></div>`
    : `<div class="catch-wild escaped">${pokemonImg(wild, { cls: 'pk-xl' })}</div>`}
      </div>
      <div class="catch-text">${text}</div>
      <button class="btn btn-primary btn-xl" type="button" id="btn-catch-next">לְסִכּוּם הַקְּרָב ←</button>`;
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
  const days = battle.streakInfo.streak === 1 ? 'יוֹם אֶחָד' : `${fmt(battle.streakInfo.streak)} יָמִים`;
  const value = (v) => (/[֐-׿]/.test(v) ? `<span>${esc(v)}</span>` : `<span class="num">${esc(v)}</span>`);
  const p = partner();
  const pName = nameOf(p.species);
  const res = battle.catchResult || { caught: false };

  $('#summary-title').textContent = res.caught ? 'נִצָּחוֹן וּתְפִיסָה! 🏆' : 'סוֹף הַקְּרָב';
  $('#summary-art').innerHTML = res.caught && !res.duplicate
    ? pokemonImg(battle.wildId, { cls: 'pk-lg' })
    : pokemonImg(p.species, { cls: 'pk-lg' });
  $('#summary-art').classList.toggle('victory-pop', Boolean(res.caught));

  const rows = [
    ['תְּשׁוּבוֹת נְכוֹנוֹת', `${fmt(battle.correct)} מִתּוֹךְ ${fmt(total)}`],
    ['נָכוֹן בַּנִּסָּיוֹן הָרִאשׁוֹן', `${fmt(firstTry)}`],
    ['פּוֹקָדוֹלָרִים מֵהַקְּרָב', `₽ ${fmt(battle.coins)}`],
    [`נִסָּיוֹן לְ${pName}`, `+${fmt(battle.partnerXp)}`],
  ];
  if (battle.hintsBought > 0) rows.push(['רְמָזִים שֶׁנִּקְנוּ', `₽ -${fmt(battle.hintsBought * REWARDS.hintCost)}`]);

  const bonusRows = [];
  if (battle.perfect) bonusRows.push([`בּוֹנוּס קְרָב מֻשְׁלָם! ${fmt(total)} מִתּוֹךְ ${fmt(total)}`, `₽ +${fmt(REWARDS.perfectBonus)}`]);
  if (battle.streakBonus > 0) bonusRows.push([`בּוֹנוּס רֶצֶף אִימוּנִים - ${days}`, `₽ +${fmt(battle.streakBonus)}`]);
  for (const t of battle.badges) bonusRows.push([`🏅 תָּג חָדָשׁ: ${TOPICS[t].gym}`, `₽ +${fmt(REWARDS.badgeBonus)}`]);
  if (battle.partnerLevel) bonusRows.push([`${pName} עָלָה לְרָמָה ${fmt(battle.partnerLevel)}!`, '⬆️']);

  $('#summary-list').innerHTML = [
    ...rows.map(([k, v]) => `<li><span>${esc(k)}</span>${value(v)}</li>`),
    ...bonusRows.map(([k, v]) => `<li class="bonus"><span>${esc(k)}</span>${value(v)}</li>`),
    `<li><span>סַךְ הַפּוֹקָדוֹלָרִים שֶׁלָּכֶם</span><span class="num">₽ ${fmt(s.player.coins)}</span></li>`,
  ].join('');

  const ready = canEvolve(p.uid);
  $('#summary-evolve').hidden = !ready;
  if (ready) $('#summary-evolve').innerHTML = `✨ ${esc(pName)} מוּכָן לְהִתְפַּתֵּחַ! הִכָּנְסוּ לַפּוֹקִידֶקְס.`;
  $('#btn-summary-dex').classList.toggle('btn-glow', ready);

  showScreen('summary');

  const celebrations = [];
  if (battle.badges.length) celebrations.push([`קִבַּלְתֶּם אֶת הַתָּג שֶׁל ${TOPICS[battle.badges[0]].gym}!`, '🏅']);
  if (battle.levelUps.length) celebrations.push([`עֲלִיתֶם לְדַרְגַּת ${battle.levelUps[battle.levelUps.length - 1]}!`, '⭐']);
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
    levelUps: [],
    topics: new Set(),
    component: null,
    finished: false,
    ball: 'poke_ball',
    streakInfo: touchDailyStreak(),
  };

  $('#wild-name').innerHTML = `${esc(nameOf(wildId))} <span class="wild-tag">פּוֹקִימוֹן בַּר</span>`;
  $('#wild-art').className = 'wild-art';
  $('#wild-art').innerHTML = pokemonImg(wildId, { cls: 'pk-lg' });
  setHp(battle.hp);

  $('#battle-partner').innerHTML = `${pokemonImg(p.species, { cls: 'pk-md flip' })}
    <div class="partner-label">${esc(nameOf(p.species))} · רָמָה <span class="num">${fmt(levelOf(p.xp))}</span></div>`;

  showScreen('battle');
  $('#topbar-title').textContent = topic && TOPICS[topic] ? TOPICS[topic].gym : 'קְרָב פְּרָאִי';
  renderQuestion();

  if (battle.streakInfo.isNewDay && battle.streakInfo.streak > 1) {
    toast(`🔥 רֶצֶף שֶׁל ${battle.streakInfo.streak} יָמִים! בּוֹנוּס בְּסוֹף הַקְּרָב.`);
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
