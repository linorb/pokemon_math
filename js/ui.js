// ui.js - תשתית ממשק: מסכים, חלוניות, הודעות, מקלדת מספרים, מסך הבית, פוקידקס, פוקימרט ומסך הורים

import { getState, update, isStorageAvailable } from './storage.js';
import { CATALOG, SECTIONS as SHOP_SECTIONS, canBuy, buy, countOf } from './shop.js';
import {
  rankFor, nextRankFor, badgeCount, hasBadge, enabledTopics, setTopicEnabled, lightningBest,
} from './progress.js';
import {
  partner, ownedList, findOwned, levelOf, levelProgress, canEvolve, evolutionOptions, evolve,
  setPartner, useRareCandy, hasCaught, hasSeen, readyToEvolve, nameOf,
} from './pokemon.js';
import { SPECIES, DEX_ORDER, TYPES, STARTERS } from './pokedex.js';
import { pokemonImg, itemArt, eggSvg } from './art.js';
import { fmt, esc, hebDate } from './util.js';
import { TOPICS, REGION_ORDER, SECTIONS } from './topics.js';

export const $ = (sel) => document.querySelector(sel);
export const $$ = (sel) => Array.from(document.querySelectorAll(sel));

const GAME_TITLE = 'פוקימון חשבון';

/* ============================ ניהול מסכים ============================ */

const SCREEN_TITLES = {
  onboarding: GAME_TITLE,
  home: GAME_TITLE,
  map: 'מפת המכונים',
  battle: 'קרב',
  catch: 'תפיסה!',
  summary: 'סיכום הקרב',
  shop: 'פוקימרט',
  pokedex: 'פוקידקס',
  settings: 'מסך הורים',
  lightning: 'מתקפת ברק',
};

let currentScreen = null;
const backTargets = {
  shop: 'home', pokedex: 'home', settings: 'home', summary: 'home',
  battle: 'home', map: 'home', lightning: 'home',
};

export function showScreen(name) {
  $$('.screen').forEach((s) => { s.hidden = true; });
  const el = document.getElementById(`screen-${name}`);
  if (el) el.hidden = false;
  currentScreen = name;

  const bar = $('#topbar');
  bar.hidden = name === 'onboarding';
  $('#topbar-title').textContent = SCREEN_TITLES[name] || GAME_TITLE;
  $('#btn-back').hidden = !backTargets[name];
  window.scrollTo({ top: 0 });
  updateHUD();
}

export function getCurrentScreen() {
  return currentScreen;
}

export function backTarget() {
  return backTargets[currentScreen] || 'home';
}

/* ============================ HUD ============================ */

let lastCoins = null;
let lastXp = null;

/** הבהוב קצר כשהמספר בסרגל העליון משתנה */
function pulse(el) {
  if (!el) return;
  el.classList.remove('chip-pop');
  void el.offsetWidth;
  el.classList.add('chip-pop');
}

export function updateHUD() {
  const s = getState();
  const c = $('#hud-coins');
  const x = $('#hud-xp');
  if (c) {
    if (lastCoins !== null && s.player.coins !== lastCoins) pulse(c.parentElement);
    c.textContent = fmt(s.player.coins);
    lastCoins = s.player.coins;
  }
  if (x) {
    if (lastXp !== null && s.player.xp !== lastXp) pulse(x.parentElement);
    x.textContent = fmt(s.player.xp);
    lastXp = s.player.xp;
  }
}

/* ============================ הודעות וחלוניות ============================ */

let toastTimer = null;

export function toast(msg, ms = 2400) {
  const t = $('#toast');
  t.textContent = msg;
  t.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.hidden = true; }, ms);
}

/**
 * חלונית אישור / הודעה / קלט טקסט.
 * מחזירה Promise: true/false, או מחרוזת כאשר withInput=true.
 */
export function modal({ title, body, okText = 'אישור', cancelText = 'ביטול', withInput = false, inputValue = '', hideCancel = false }) {
  return new Promise((resolve) => {
    const box = $('#modal');
    $('#modal-title').textContent = title || '';
    $('#modal-body').innerHTML = body || '';
    const input = $('#modal-input');
    input.hidden = !withInput;
    input.value = inputValue;
    const ok = $('#modal-ok');
    const cancel = $('#modal-cancel');
    ok.textContent = okText;
    cancel.textContent = cancelText;
    cancel.hidden = hideCancel;
    box.hidden = false;
    if (withInput) setTimeout(() => input.focus(), 50);

    const done = (val) => {
      box.hidden = true;
      ok.removeEventListener('click', onOk);
      cancel.removeEventListener('click', onCancel);
      resolve(val);
    };
    const onOk = () => done(withInput ? input.value : true);
    const onCancel = () => done(withInput ? null : false);
    ok.addEventListener('click', onOk);
    cancel.addEventListener('click', onCancel);
  });
}

/** חגיגה קצרה במרכז המסך (עליית דרגה, תג חדש, שיא) */
export function celebrateLevelUp(text, icon = '⭐') {
  const el = $('#levelup');
  $('#levelup-star').textContent = icon;
  $('#levelup-text').textContent = text;
  el.hidden = false;
  setTimeout(() => { el.hidden = true; }, 2400);
}

/**
 * חלון חגיגה גדול עם תמונה (התפתחות, בקיעה מביצה).
 * stages: [{ html, ms }] - מוצגים בזה אחר זה, והאחרון נשאר עם כפתור סגירה.
 */
export function showOverlay(stages, closeText = 'מעולה!') {
  return new Promise((resolve) => {
    const box = $('#overlay');
    const body = $('#overlay-body');
    const btn = $('#overlay-close');
    box.hidden = false;
    btn.hidden = true;
    btn.textContent = closeText;
    let i = 0;
    const next = () => {
      body.innerHTML = stages[i].html;
      if (i === stages.length - 1) {
        btn.hidden = false;
        btn.focus();
        return;
      }
      const ms = stages[i].ms || 1500;
      i += 1;
      setTimeout(next, ms);
    };
    btn.onclick = () => { box.hidden = true; body.innerHTML = ''; resolve(); };
    next();
  });
}

/** אנימציית התפתחות: הבזקים ואז הפוקימון החדש */
export function evolveAnimation(fromId, toId) {
  const from = nameOf(fromId);
  const to = nameOf(toId);
  return showOverlay([
    { html: `<div class="ov-title">מה קורה?! ${esc(from)} מתפתח!</div><div class="ov-art evo-flash">${pokemonImg(fromId, { cls: 'pk-xl' })}</div>`, ms: 2600 },
    { html: `<div class="ov-title">מזל טוב! 🎉</div><div class="ov-art evo-reveal">${pokemonImg(toId, { cls: 'pk-xl' })}</div>
      <div class="ov-text">${esc(from)} התפתח ל<strong>${esc(to)}</strong>!</div>` },
  ]);
}

/** אנימציית בקיעה מביצה */
export function hatchAnimation(eggId, speciesId) {
  return showOverlay([
    { html: `<div class="ov-title">הביצה זזה...</div><div class="ov-art egg-wobble">${eggSvg(eggId, 'egg-big')}</div>`, ms: 2200 },
    { html: `<div class="ov-title">בקע פוקימון! 🎉</div><div class="ov-art evo-reveal">${pokemonImg(speciesId, { cls: 'pk-xl' })}</div>
      <div class="ov-text"><strong>${esc(nameOf(speciesId))}</strong> הצטרף לאוסף שלך!</div>` },
  ]);
}

/* ============================ הקראה ============================ */

export function canSpeak() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

/** האם מנוע ההקראה מכיר קול עברי (אם לא - לא נקריא אוטומטית, כדי שלא יקריא בג'יבריש) */
export function hasHebrewVoice() {
  if (!canSpeak()) return false;
  const voices = window.speechSynthesis.getVoices();
  // בחלק מהדפדפנים רשימת הקולות נטענת מאוחר - אם היא ריקה מנסים בכל זאת
  return !voices.length || voices.some((v) => /^he|^iw/i.test(v.lang));
}

export function speak(text) {
  if (!canSpeak() || !text) return false;
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'he-IL';
    const voice = window.speechSynthesis.getVoices().find((v) => /^he|^iw/i.test(v.lang));
    if (voice) u.voice = voice;
    u.rate = 0.9;
    window.speechSynthesis.speak(u);
    return true;
  } catch (e) {
    return false;
  }
}

export function stopSpeaking() {
  if (canSpeak()) try { window.speechSynthesis.cancel(); } catch (e) { /* לא חשוב */ }
}

/* ============================ מקלדת מספרים ============================ */

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'clear', '0', 'back'];

export const answerInput = {
  raw: '',
  enabled: true,

  init() {
    const pad = $('#keypad');
    pad.innerHTML = KEYS.map((k) => {
      if (k === 'clear') return `<button class="key util" type="button" data-key="clear" aria-label="ניקוי">נקה</button>`;
      if (k === 'back') return `<button class="key util" type="button" data-key="back" aria-label="מחיקה">⌫</button>`;
      return `<button class="key" type="button" data-key="${k}">${k}</button>`;
    }).join('');
    pad.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-key]');
      if (!btn) return;
      this.press(btn.dataset.key);
    });
    document.addEventListener('keydown', (e) => {
      if (document.getElementById('screen-battle').hidden) return;
      if (e.target && ['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;
      if (/^[0-9]$/.test(e.key)) { this.press(e.key); e.preventDefault(); }
      else if (e.key === 'Backspace') { this.press('back'); e.preventDefault(); }
      else if (e.key === 'Delete') { this.press('clear'); e.preventDefault(); }
      else if (e.key === 'Enter') {
        e.preventDefault();
        const next = $('#btn-next');
        if (!next.hidden) next.click();
        else if (!$('#btn-submit').hidden) $('#btn-submit').click();
      }
    });
  },

  press(k) {
    if (!this.enabled || $('#keypad').hidden) return;
    if (k === 'clear') this.raw = '';
    else if (k === 'back') this.raw = this.raw.slice(0, -1);
    else if (this.raw.length < 6) this.raw = (this.raw === '0' ? '' : this.raw) + k;
    this.render();
  },

  render() {
    const d = $('#answer-display');
    d.classList.remove('wrong', 'right');
    d.innerHTML = this.raw === ''
      ? '<span class="placeholder">?</span>'
      : esc(fmt(Number(this.raw)));
  },

  reset(unit = '') {
    this.raw = '';
    this.enabled = true;
    this.render();
    $('#answer-unit').textContent = unit || '';
  },

  value() {
    return this.raw === '' ? null : Number(this.raw);
  },

  markWrong() { $('#answer-display').classList.add('wrong'); },
  markRight() { $('#answer-display').classList.add('right'); },
  setEnabled(v) { this.enabled = v; },
};

/* ============================ רכיבים קטנים ============================ */

function xpBar(xp) {
  const p = levelProgress(xp);
  return `<div class="xp-bar" title="ניסיון"><div class="xp-fill" style="width:${p.pct}%"></div></div>`;
}

function typeChip(speciesId) {
  const sp = SPECIES[speciesId];
  const t = sp && TYPES[sp.type];
  return t ? `<span class="type-chip" style="--type:${t.color}">${esc(t.name)}</span>` : '';
}

/* ============================ פתיחה: בחירת פוקימון ראשון ============================ */

export function renderStarterPicker(selected, onPick) {
  const row = $('#starter-picker');
  row.innerHTML = STARTERS.map((id) => `
    <button class="starter-btn" type="button" data-starter="${id}" aria-pressed="${id === selected}">
      ${pokemonImg(id, { cls: 'pk-md' })}
      <span class="starter-name">${esc(nameOf(id))}</span>
    </button>`).join('');
  row.onclick = (e) => {
    const btn = e.target.closest('[data-starter]');
    if (!btn) return;
    onPick(Number(btn.dataset.starter));
  };
}

/* ============================ מסך הבית ============================ */

export function renderHome(onEvolveClick) {
  const s = getState();
  const p = partner();
  if (p) {
    const lvl = levelOf(p.xp);
    $('#home-partner').innerHTML = pokemonImg(p.species, { cls: 'pk-xl bob' });
    $('#home-partner-name').innerHTML = `${esc(nameOf(p.species))} <span class="lvl-tag">רמה <span class="num">${fmt(lvl)}</span></span>`;
    $('#home-partner-xp').innerHTML = xpBar(p.xp);
  }

  const ready = readyToEvolve();
  const evoBtn = $('#btn-home-evolve');
  if (ready.length) {
    const first = ready.find((o) => p && o.uid === p.uid) || ready[0];
    evoBtn.hidden = false;
    evoBtn.innerHTML = `✨ ${esc(nameOf(first.species))} מוכן להתפתח!`;
    evoBtn.onclick = () => onEvolveClick && onEvolveClick(first.uid);
  } else {
    evoBtn.hidden = true;
  }

  $('#home-name').textContent = s.player.name || 'מאמן';
  const rank = rankFor(s.player.xp);
  const next = nextRankFor(s.player.xp);
  $('#home-rank').innerHTML = next
    ? `${esc(rank.name)} · עוד <span class="num">${fmt(next.xp - s.player.xp)}</span> ⭐ לדרגת ${esc(next.name)}`
    : `${esc(rank.name)} - הדרגה הגבוהה ביותר! 🏆`;

  const streak = s.stats.streakDays;
  $('#home-streak').textContent = streak > 0
    ? `🔥 רצף של ${streak} ${streak === 1 ? 'יום' : 'ימים'} של אימון!`
    : 'מתחילים רצף אימונים חדש היום!';
  $('#home-progress').innerHTML =
    `באוסף: <span class="num">${fmt(ownedList().length)}</span> פוקימונים · תגים: <span class="num">${fmt(badgeCount())}</span> 🏅`;
}

/* ============================ פוקידקס ============================ */

let dexSelected = null;

export function renderPokedex(selectedUid = null) {
  if (selectedUid !== null) dexSelected = selectedUid;
  const s = getState();
  const mine = ownedList().slice().sort((a, b) => {
    if (a.uid === s.pokemon.partnerUid) return -1;
    if (b.uid === s.pokemon.partnerUid) return 1;
    return b.xp - a.xp;
  });

  $('#dex-mine').innerHTML = mine.map((o) => `
    <button class="dex-card mine ${o.uid === dexSelected ? 'selected' : ''}" type="button" data-uid="${o.uid}">
      ${o.uid === s.pokemon.partnerUid ? '<span class="partner-star" title="המלווה">⭐</span>' : ''}
      ${canEvolve(o.uid) ? '<span class="evo-spark" title="מוכן להתפתח">✨</span>' : ''}
      ${pokemonImg(o.species, { cls: 'pk-md' })}
      <span class="dex-name">${esc(nameOf(o.species))}</span>
      <span class="dex-lvl">רמה <span class="num">${fmt(levelOf(o.xp))}</span></span>
    </button>`).join('');

  const caughtCount = DEX_ORDER.filter((id) => hasCaught(id)).length;
  $('#dex-count').innerHTML = `נתפסו <span class="num">${fmt(caughtCount)}</span> מתוך <span class="num">${fmt(DEX_ORDER.length)}</span>`;
  $('#dex-all').innerHTML = DEX_ORDER.map((id) => {
    const caught = hasCaught(id);
    const seen = hasSeen(id);
    return `
      <div class="dex-card ${caught ? 'caught' : 'missing'}">
        ${pokemonImg(id, { cls: 'pk-sm', silhouette: !caught, unknown: !seen })}
        <span class="dex-name">${caught || seen ? esc(nameOf(id)) : '???'}</span>
      </div>`;
  }).join('');

  $('#dex-mine').onclick = (e) => {
    const btn = e.target.closest('[data-uid]');
    if (!btn) return;
    dexSelected = btn.dataset.uid;
    renderPokedex();
    $('#dex-detail').scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  renderDexDetail();
}

function renderDexDetail() {
  const box = $('#dex-detail');
  const o = dexSelected ? findOwned(dexSelected) : null;
  if (!o) { box.hidden = true; box.innerHTML = ''; return; }
  const s = getState();
  const isPartner = o.uid === s.pokemon.partnerUid;
  const p = levelProgress(o.xp);
  const options = evolutionOptions(o.uid);
  const candies = s.items.rare_candy || 0;

  const evoHtml = options.length
    ? options.map((opt) => (opt.ready
      ? `<button class="btn btn-primary evo-btn" type="button" data-evolve="${opt.to}">
           ✨ התפתחות ל${esc(opt.name)}${opt.stone ? ` (${esc(opt.stoneName)})` : ''}
         </button>`
      : `<div class="evo-locked">🔒 ${esc(opt.name)}: ${esc(opt.reason)}</div>`)).join('')
    : '<div class="small-note">הפוקימון הזה כבר בשלב ההתפתחות האחרון 💪</div>';

  box.hidden = false;
  box.innerHTML = `
    <button class="icon-btn detail-close" type="button" data-close aria-label="סגירה">✕</button>
    <div class="detail-art">${pokemonImg(o.species, { cls: 'pk-xl' })}</div>
    <div class="detail-name">${esc(nameOf(o.species))} ${typeChip(o.species)}</div>
    <div class="detail-lvl">רמה <span class="num">${fmt(p.level)}</span>
      <span class="small-note">(<span class="num">${fmt(p.into)}/${fmt(p.need)}</span> ניסיון לרמה הבאה)</span></div>
    ${xpBar(o.xp)}
    <div class="detail-actions">
      ${isPartner ? '<div class="partner-note">⭐ זה הפוקימון שמלווה אותך בקרבות</div>'
    : '<button class="btn btn-secondary" type="button" data-partner>⭐ בחירה כמלווה בקרבות</button>'}
      ${evoHtml}
      ${candies > 0 ? `<button class="btn btn-ghost" type="button" data-candy>🍬 סוכרייה נדירה (+1 רמה) · יש לך <span class="num">${fmt(candies)}</span></button>` : ''}
    </div>`;

  box.onclick = async (e) => {
    if (e.target.closest('[data-close]')) { dexSelected = null; renderPokedex(); return; }
    if (e.target.closest('[data-partner]')) {
      setPartner(o.uid);
      toast(`${nameOf(o.species)} מלווה אותך עכשיו! ⭐`);
      renderPokedex();
      return;
    }
    if (e.target.closest('[data-candy]')) {
      const r = useRareCandy(o.uid);
      if (!r.ok) { toast(r.reason); return; }
      toast(`${nameOf(o.species)} עלה לרמה ${r.levelAfter}! 🍬`);
      renderPokedex();
      return;
    }
    const evo = e.target.closest('[data-evolve]');
    if (evo) {
      const res = evolve(o.uid, Number(evo.dataset.evolve));
      if (!res.ok) { toast(res.reason); return; }
      await evolveAnimation(res.from, res.to);
      renderPokedex();
    }
  };
}

/* ============================ פוקימרט ============================ */

export function renderShop(onChange) {
  const s = getState();
  const html = SHOP_SECTIONS.map((sec) => {
    const items = CATALOG.filter((i) => i.section === sec.id).map((item) => {
      const check = canBuy(item.id);
      const locked = !check.ok && check.reason.startsWith('צריך להגיע');
      const done = !check.ok && item.kind === 'egg' && check.reason.startsWith('כבר יש');
      let action;
      if (locked) action = `<button class="btn btn-ghost" type="button" disabled>🔒 ${esc(check.reason.replace('צריך להגיע ל', '').replace('.', ''))}</button>`;
      else if (done) action = '<div class="owned-tag">✔ יש לך את כולם!</div>';
      else action = `<button class="btn btn-primary" type="button" data-buy="${item.id}">קנייה</button>`;
      const have = item.kind === 'item' ? countOf(item.id) : 0;
      return `
        <div class="shop-item ${locked ? 'is-locked' : ''}">
          <div class="item-art">${itemArt(item)}</div>
          <div class="item-name">${esc(item.name)}</div>
          <div class="item-desc">${esc(item.desc)}</div>
          ${have ? `<div class="item-have">יש לך: <span class="num">${fmt(have)}</span></div>` : ''}
          <div class="item-price"><span class="pd-icon">₽</span> <span class="num">${fmt(item.price)}</span></div>
          ${action}
        </div>`;
    }).join('');
    return `<h3 class="shop-section">${esc(sec.name)}</h3><div class="shop-grid">${items}</div>`;
  }).join('');

  $('#shop-body').innerHTML = html;
  $('#shop-coins').innerHTML = `יש לך <span class="pd-icon">₽</span> <span class="num">${fmt(s.player.coins)}</span> פוקדולרים`;

  $('#shop-body').onclick = async (e) => {
    const btn = e.target.closest('[data-buy]');
    if (!btn) return;
    const id = btn.dataset.buy;
    const check = canBuy(id);
    if (!check.ok) { toast(check.reason); return; }
    const res = buy(id);
    if (!res.ok) { toast(res.reason); return; }
    updateHUD();
    if (res.hatched) {
      await hatchAnimation(res.item.id, res.hatched.species);
    } else {
      toast(`${res.item.name} נקנה! 🎉`);
    }
    renderShop(onChange);
    if (onChange) onChange();
  };
}

/* ============================ הגדרות ============================ */

export function refreshStorageWarning() {
  const w = $('#storage-warning');
  if (w) w.hidden = isStorageAvailable();
}

/* ============================ מסך הורים ============================ */

function topicToggles() {
  const on = new Set(getState().settings.enabledTopics);
  return SECTIONS.map((sec) => {
    const rows = REGION_ORDER.filter((id) => TOPICS[id].section === sec.id).map((id) => {
      const t = TOPICS[id];
      return `
        <label class="topic-row ${t.ready ? '' : 'soon'}">
          <input type="checkbox" data-topic="${id}" ${on.has(id) && t.ready ? 'checked' : ''} ${t.ready ? '' : 'disabled'}>
          <span class="switch"></span>
          <span class="topic-icon">${t.icon}</span>
          <span class="topic-name">${esc(t.name)}</span>
          ${t.ready ? '' : '<span class="soon-tag">בקרוב</span>'}
        </label>`;
    }).join('');
    return `<div class="topic-section"><div class="topic-sec-name">${esc(sec.name)}</div>${rows}</div>`;
  }).join('');
}

export function renderParentStats() {
  const s = getState();
  const t = s.stats;
  const overall = t.totals.answered
    ? Math.round((t.totals.firstTry / t.totals.answered) * 100)
    : null;

  const rows = REGION_ORDER
    .map((id) => ({ id, name: TOPICS[id].name, ...(t.byTopic[id] || { answered: 0, firstTry: 0 }) }))
    .filter((r) => r.answered > 0)
    .map((r) => ({ ...r, acc: Math.round((r.firstTry / r.answered) * 100) }));

  const practiced = rows.slice().sort((a, b) => b.answered - a.answered);
  const weakest = rows.filter((r) => r.answered >= 3).sort((a, b) => a.acc - b.acc).slice(0, 3);
  const open = enabledTopics();
  const untouched = open.filter((id) => !(t.byTopic[id] && t.byTopic[id].answered));

  const bar = (acc) => {
    const cls = acc >= 80 ? 'good' : acc >= 60 ? 'mid' : 'low';
    return `<div class="acc-bar"><div class="acc-fill ${cls}" style="width:${acc}%"></div></div>`;
  };

  $('#parent-stats').innerHTML = `
    <div class="card">
      <h2 class="title-mid">מסך הורים</h2>
      <p class="subtitle">סיכום ההתקדמות של ${esc(s.player.name || 'המאמן')}</p>

      <div class="parent-grid">
        <div class="parent-tile"><div class="tile-num num">${fmt(t.sessions)}</div><div>קרבות</div></div>
        <div class="parent-tile"><div class="tile-num num">${fmt(t.totals.answered)}</div><div>שאלות</div></div>
        <div class="parent-tile"><div class="tile-num num">${overall === null ? '—' : `${overall}%`}</div><div>דיוק כללי</div></div>
        <div class="parent-tile"><div class="tile-num num">${fmt(t.streakDays)}</div><div>רצף ימים</div></div>
      </div>

      <ul class="summary-list">
        <li><span>שיחק/ה לאחרונה</span><span>${esc(hebDate(t.lastPlayed))}</span></li>
        <li><span>רצף הימים הארוך ביותר</span><span class="num">${fmt(t.bestStreakDays)}</span></li>
        <li><span>קרבות מושלמים (5 מתוך 5)</span><span class="num">${fmt(t.perfectBattles)}</span></li>
        <li><span>פוקימונים באוסף</span><span class="num">${fmt(s.pokemon.owned.length)}</span></li>
        <li><span>תגי מכונים</span><span class="num">${fmt(badgeCount())}</span></li>
        <li><span>שיא במתקפת ברק</span><span class="num">${fmt(lightningBest('normal'))}</span></li>
        <li><span>שאלות שממתינות לחזרה</span><span class="num">${fmt(s.reviewQueue.length)}</span></li>
      </ul>
    </div>

    <div class="card">
      <h3 class="parent-h3">נושאים פתוחים במשחק</h3>
      <p class="small-note">מסמנים את מה שכבר נלמד בכיתה (לפי תכנית הלימודים של משרד החינוך לכיתה ב').
        רק נושאים מסומנים מופיעים במפה ובקרב הפראי.</p>
      <div id="topic-toggles">${topicToggles()}</div>
    </div>

    <div class="card">
      <h3 class="parent-h3">הקראה בקול</h3>
      <label class="topic-row">
        <input type="checkbox" id="chk-autoread" ${s.settings.autoRead ? 'checked' : ''}>
        <span class="switch"></span>
        <span class="topic-name">להקריא כל שאלה אוטומטית</span>
      </label>
      <p class="small-note">כפתור 🔊 להקראה חוזרת מופיע תמיד ליד השאלה. ההקראה משתמשת בקול העברי של הדפדפן
        (ב-Edge ו-Chrome הוא בדרך כלל קיים).</p>
    </div>

    <div class="card">
      <h3 class="parent-h3">דיוק לפי נושא <span class="small-note">(תשובה נכונה בניסיון ראשון)</span></h3>
      ${rows.length ? practiced.map((r) => `
        <div class="acc-row">
          <div class="acc-name">${esc(r.name)}${hasBadge(r.id) ? ' 🏅' : ''}</div>
          ${bar(r.acc)}
          <div class="acc-val num">${r.acc}%</div>
          <div class="acc-count small-note"><span class="num">${fmt(r.answered)}</span> שאלות</div>
        </div>`).join('') : '<p class="small-note">עדיין אין נתונים. אחרי הקרב הראשון יופיע כאן פירוט.</p>'}
    </div>

    ${weakest.length ? `
    <div class="card">
      <h3 class="parent-h3">כדאי לתרגל במיוחד</h3>
      <ol class="weak-list">
        ${weakest.map((r) => `<li><strong>${esc(r.name)}</strong> - דיוק <span class="num">${r.acc}%</span>
          מתוך <span class="num">${fmt(r.answered)}</span> שאלות</li>`).join('')}
      </ol>
      <p class="small-note">אפשר לבחור את המכון המתאים במפה ולתרגל אותו ישירות.</p>
    </div>` : ''}

    ${untouched.length ? `
    <div class="card">
      <h3 class="parent-h3">נושאים פתוחים שעדיין לא תורגלו</h3>
      <p>${untouched.map((id) => esc(TOPICS[id].name)).join(' · ')}</p>
    </div>` : ''}`;

  $('#topic-toggles').onchange = (e) => {
    const box = e.target.closest('[data-topic]');
    if (!box) return;
    const id = box.dataset.topic;
    if (!box.checked && enabledTopics().length <= 1) {
      box.checked = true;
      toast('צריך להשאיר לפחות נושא אחד פתוח.');
      return;
    }
    setTopicEnabled(id, box.checked);
    toast(box.checked ? `${TOPICS[id].name} נפתח במשחק ✔` : `${TOPICS[id].name} נסגר`);
  };

  $('#chk-autoread').onchange = (e) => {
    const on = e.target.checked;
    update((st) => { st.settings.autoRead = on; });
    toast(on ? 'השאלות יוקראו אוטומטית 🔊' : 'ההקראה האוטומטית כבויה');
  };
}
