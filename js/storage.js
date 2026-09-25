// storage.js - שמירת התקדמות ב-localStorage, כולל גרסאות, מיגרציה וגיבוי

import { DEFAULT_TOPICS, TOPICS } from './topics.js';
import { CHARACTERS, EMPTY_WEAR, wearById } from './trainer.js';

const STORAGE_KEY = 'pokemonMath.save.v1';
export const CURRENT_SCHEMA_VERSION = 2;

/** האם ה-localStorage זמין בפועל (יכול להיחסם במצב פרטי / הגדרות דפדפן) */
let storageAvailable = detectStorage();
/** עותק בזיכרון - מאפשר למשחק לעבוד גם כשאין אחסון */
let state = null;

function detectStorage() {
  try {
    const k = '__pm_test__';
    window.localStorage.setItem(k, '1');
    window.localStorage.removeItem(k);
    return true;
  } catch (e) {
    return false;
  }
}

export function isStorageAvailable() {
  return storageAvailable;
}

export function defaultSave() {
  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    createdAt: new Date().toISOString(),
    player: {
      name: '',
      coins: 0,             // פוקדולרים
      xp: 0,                // ניסיון המאמן
    },
    trainer: {
      character: CHARACTERS[0].id,  // הדמות שנבחרה
      equipped: { ...EMPTY_WEAR },  // מה המאמן לובש עכשיו
      owned: [],                    // בגדים ואביזרים שנקנו
    },
    pokemon: {
      owned: [],            // [{ uid, species, xp, caughtAt }]
      partnerUid: null,     // הפוקימון שמלווה בקרבות
      caught: [],           // כל המינים שהיו אי פעם באוסף (לפוקידקס)
      seen: [],             // מינים שנראו בקרב
    },
    items: {
      great_ball: 0,
      ultra_ball: 0,
      fire_stone: 0,
      water_stone: 0,
      thunder_stone: 0,
      leaf_stone: 0,
      moon_stone: 0,
      rare_candy: 0,
    },
    badges: {},             // topicId -> מפתח יום שבו התקבל התג
    stats: {
      sessions: 0,
      lastPlayed: null,     // מפתח יום "2026-09-22"
      streakDays: 0,
      bestStreakDays: 0,
      perfectBattles: 0,
      totals: { correct: 0, firstTry: 0, wrong: 0, answered: 0 },
      byTopic: {},          // topicId -> { correct, firstTry, wrong, answered }
    },
    reviewQueue: [],        // [{ type, topic, addedAt }]
    records: {
      lightningBest: 0,
      lightningBestEasy: 0,
      lightningBestMult: 0,
    },
    settings: {
      enabledTopics: DEFAULT_TOPICS.slice(),
    },
  };
}

/** מיזוג ערכי ברירת מחדל לתוך אובייקט קיים - כך שתוספות עתידיות לא ישברו שמירות ישנות */
function mergeDefaults(target, defaults) {
  if (target === null || typeof target !== 'object' || Array.isArray(target)) {
    return target === undefined ? defaults : target;
  }
  const out = Array.isArray(defaults) ? target : { ...defaults, ...target };
  for (const key of Object.keys(defaults)) {
    const d = defaults[key];
    if (d && typeof d === 'object' && !Array.isArray(d)) {
      out[key] = mergeDefaults(target[key], d);
    } else if (target[key] === undefined) {
      out[key] = d;
    }
  }
  return out;
}

/**
 * מיגרציה של שמירה ישנה לגרסה הנוכחית.
 * כל שלב מטפל במעבר מגרסה אחת לבאה, וכך התקדמות קיימת לא נמחקת בעדכונים.
 */
export function migrate(raw) {
  if (!raw || typeof raw !== 'object') return defaultSave();
  let data = { ...raw };
  let v = Number(data.schemaVersion) || 0;

  if (v < 1) {
    data.schemaVersion = 1;
    v = 1;
  }

  if (v < 2) {
    // גרסה 2: דמות מאמן ובגדים. ההקראה כבר לא אוטומטית.
    if (data.settings && typeof data.settings === 'object') {
      data.settings = { ...data.settings };
      delete data.settings.autoRead;
      delete data.settings.readAloud;
    }
    data.schemaVersion = 2;
    v = 2;
  }

  data.schemaVersion = CURRENT_SCHEMA_VERSION;
  data = mergeDefaults(data, defaultSave());

  // ניקוי בסיסי של ערכים לא תקינים
  const p = data.player;
  p.coins = Math.max(0, Math.floor(Number(p.coins) || 0));
  p.xp = Math.max(0, Math.floor(Number(p.xp) || 0));
  if (typeof p.name !== 'string') p.name = '';

  const pk = data.pokemon;
  if (!Array.isArray(pk.owned)) pk.owned = [];
  pk.owned = pk.owned.filter((o) => o && typeof o.uid === 'string' && Number.isFinite(Number(o.species)));
  pk.owned.forEach((o) => { o.species = Number(o.species); o.xp = Math.max(0, Math.floor(Number(o.xp) || 0)); });
  if (!Array.isArray(pk.caught)) pk.caught = [];
  if (!Array.isArray(pk.seen)) pk.seen = [];
  if (!pk.owned.some((o) => o.uid === pk.partnerUid)) pk.partnerUid = pk.owned.length ? pk.owned[0].uid : null;

  for (const k of Object.keys(data.items)) {
    data.items[k] = Math.max(0, Math.floor(Number(data.items[k]) || 0));
  }

  const tr = data.trainer;
  if (!CHARACTERS.some((c) => c.id === tr.character)) tr.character = CHARACTERS[0].id;
  if (!Array.isArray(tr.owned)) tr.owned = [];
  tr.owned = tr.owned.filter((id) => wearById(id));
  for (const slot of Object.keys(EMPTY_WEAR)) {
    const id = tr.equipped[slot];
    const w = id && wearById(id);
    if (!w || w.slot !== slot || !tr.owned.includes(id)) tr.equipped[slot] = null;
  }

  if (!Array.isArray(data.reviewQueue)) data.reviewQueue = [];
  if (!Array.isArray(data.settings.enabledTopics)) data.settings.enabledTopics = DEFAULT_TOPICS.slice();
  data.settings.enabledTopics = data.settings.enabledTopics.filter((id) => TOPICS[id]);

  return data;
}

/** טעינה מהאחסון. תמיד מחזירה אובייקט תקין, גם כשאין שמירה כלל */
export function load() {
  if (state) return state;
  let parsed = null;
  try {
    if (storageAvailable) {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) parsed = JSON.parse(raw);
    }
  } catch (e) {
    console.warn('[storage] טעינה נכשלה, מתחילים שמירה חדשה', e);
    parsed = null;
  }
  state = migrate(parsed);
  return state;
}

/** שמירה. מחזירה true אם נשמר בהצלחה לדיסק */
export function save() {
  if (!state) return false;
  try {
    if (!storageAvailable) return false;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch (e) {
    console.warn('[storage] שמירה נכשלה', e);
    storageAvailable = false;
    return false;
  }
}

/** עדכון + שמירה מיידית (נקרא אחרי כל שאלה) */
export function update(fn) {
  const s = load();
  fn(s);
  save();
  return s;
}

export function getState() {
  return load();
}

/** האם כבר נוצר מאמן */
export function hasProfile() {
  const s = load();
  return Boolean(s.player.name) && s.pokemon.owned.length > 0;
}

export function resetAll() {
  state = defaultSave();
  try {
    if (storageAvailable) window.localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.warn('[storage] איפוס נכשל', e);
  }
  save();
  return state;
}

/** ייצוא כטקסט JSON */
export function exportText() {
  return JSON.stringify(load(), null, 2);
}

/** ייבוא מטקסט. מחזיר { ok, error } */
export function importText(text) {
  let obj;
  try {
    obj = JSON.parse(text);
  } catch (e) {
    return { ok: false, error: 'הטקסט אינו קובץ גיבוי תקין.' };
  }
  if (!obj || typeof obj !== 'object' || !obj.player || !obj.pokemon) {
    return { ok: false, error: 'הקובץ אינו נראה כמו גיבוי של פוקימון חשבון.' };
  }
  state = migrate(obj);
  save();
  return { ok: true };
}

/** הורדת קובץ גיבוי */
export function downloadBackup() {
  const s = load();
  const name = (s.player.name || 'מאמן').replace(/[^\p{L}\p{N}_-]/gu, '');
  const stamp = new Date().toISOString().slice(0, 10);
  const blob = new Blob([exportText()], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `pokemon-math-${name}-${stamp}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
