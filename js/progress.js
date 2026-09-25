// progress.js - פוקדולרים, ניסיון המאמן, דרגות, תגים, רצף ימים וסטטיסטיקה לפי נושא

import { update, getState } from './storage.js';
import { TOPICS } from './topics.js';
import { todayKey, daysBetweenKeys } from './util.js';

/* ============================ דרגות המאמן ============================ */

export const RANKS = [
  { id: 'rookie', name: 'מְאַמֵּן מַתְחִיל', xp: 0 },
  { id: 'trainer', name: 'מְאַמֵּן', xp: 120 },
  { id: 'veteran', name: 'מְאַמֵּן מְנֻסֶּה', xp: 400 },
  { id: 'master', name: 'מָאסְטֶר פּוֹקִימוֹן', xp: 900 },
  { id: 'champion', name: 'אַלּוּף פּוֹקִימוֹן', xp: 1800 },
];

export function rankIndexFor(xp) {
  let idx = 0;
  for (let i = 0; i < RANKS.length; i++) if (xp >= RANKS[i].xp) idx = i;
  return idx;
}

export function rankFor(xp) {
  return RANKS[rankIndexFor(xp)];
}

export function nextRankFor(xp) {
  const i = rankIndexFor(xp);
  return i < RANKS.length - 1 ? RANKS[i + 1] : null;
}

/* ============================ תגמולים ============================ */

export const REWARDS = {
  firstTry: 10,      // פוקדולרים על תשובה נכונה בניסיון ראשון
  secondTry: 5,      // חצי על ניסיון שני
  hintCost: 2,
  xpFirstTry: 12,
  xpSecondTry: 6,
  xpEffort: 3,       // גם מי שטעה פעמיים מקבל נקודות על המאמץ
  perfectBonus: 15,
  badgeBonus: 25,
  streakBonusPerDay: 3,
  streakBonusMax: 21,
};

export function coins() {
  return getState().player.coins;
}

export function addCoins(n) {
  update((s) => {
    s.player.coins = Math.max(0, s.player.coins + n);
  });
  return coins();
}

/** הוספת ניסיון למאמן. מחזירה מידע על עליית דרגה */
export function addXp(n) {
  const before = getState().player.xp;
  let after = before;
  update((s) => {
    s.player.xp += n;
    after = s.player.xp;
  });
  const oldIdx = rankIndexFor(before);
  const newIdx = rankIndexFor(after);
  return { xp: after, leveledUp: newIdx > oldIdx, rank: RANKS[newIdx] };
}

/* ============================ נושאים פתוחים ============================ */

/** הנושאים שההורה פתח ושיש להם שאלות */
export function enabledTopics() {
  const list = getState().settings.enabledTopics || [];
  return list.filter((id) => TOPICS[id] && TOPICS[id].ready);
}

export function isTopicEnabled(id) {
  return enabledTopics().includes(id);
}

export function setTopicEnabled(id, on) {
  update((s) => {
    const set = new Set(s.settings.enabledTopics);
    if (on) set.add(id); else set.delete(id);
    s.settings.enabledTopics = Object.keys(TOPICS).filter((t) => set.has(t));
  });
}

/* ============================ סטטיסטיקה ============================ */

/**
 * רישום תשובה.
 * @param {string} topic מזהה הנושא
 * @param {'first'|'second'|'fail'} outcome
 */
export function recordAnswer(topic, outcome) {
  update((s) => {
    const t = s.stats.byTopic[topic] || (s.stats.byTopic[topic] = { answered: 0, correct: 0, firstTry: 0, wrong: 0 });
    t.answered += 1;
    s.stats.totals.answered += 1;
    if (outcome === 'first') {
      t.correct += 1; t.firstTry += 1;
      s.stats.totals.correct += 1; s.stats.totals.firstTry += 1;
    } else if (outcome === 'second') {
      t.correct += 1; t.wrong += 1;
      s.stats.totals.correct += 1; s.stats.totals.wrong += 1;
    } else {
      t.wrong += 1;
      s.stats.totals.wrong += 1;
    }
  });
}

/** הוספת שאלה שנענתה לא נכון לתור החזרה (יחזור בקרב עתידי עם מספרים אחרים) */
export function pushToReview(question) {
  update((s) => {
    s.reviewQueue = s.reviewQueue.filter((r) => r.type !== question.type);
    s.reviewQueue.push({ type: question.type, topic: question.topic, addedAt: todayKey() });
    if (s.reviewQueue.length > 30) s.reviewQueue.shift();
  });
}

/** הסרה מתור החזרה אחרי שהנושא נפתר נכון */
export function clearFromReview(type) {
  update((s) => {
    s.reviewQueue = s.reviewQueue.filter((r) => r.type !== type);
  });
}

export function reviewCount() {
  return getState().reviewQueue.length;
}

/**
 * כוכבים למכון במפה (0-3), לפי כמות תרגול ודיוק בניסיון ראשון.
 */
export function regionStars(topicId) {
  const t = getState().stats.byTopic[topicId];
  if (!t || !t.answered) return 0;
  const acc = t.firstTry / t.answered;
  if (t.answered >= 15 && acc >= 0.8) return 3;
  if (t.answered >= 8 && acc >= 0.6) return 2;
  return 1;
}

/** דיוק לפי נושא, באחוזים */
export function accuracyByTopic() {
  const s = getState();
  const out = {};
  for (const [id, t] of Object.entries(s.stats.byTopic)) {
    out[id] = t.answered ? Math.round((t.firstTry / t.answered) * 100) : null;
  }
  return out;
}

/* ============================ תגי מכונים ============================ */

export function hasBadge(topicId) {
  return Boolean(getState().badges[topicId]);
}

export function badgeCount() {
  return Object.keys(getState().badges).length;
}

/** מעניק תג אם המכון הגיע ל-3 כוכבים. מחזיר true אם זה תג חדש */
export function awardBadgeIfEarned(topicId) {
  if (!topicId || !TOPICS[topicId] || hasBadge(topicId) || regionStars(topicId) < 3) return false;
  update((s) => { s.badges[topicId] = todayKey(); });
  return true;
}

/* ============================ שיאים ============================ */

const LIGHTNING_KEYS = { normal: 'lightningBest', easy: 'lightningBestEasy', mult: 'lightningBestMult' };

/** שיא אישי במשחק "מתקפת ברק" לפי רמה. מחזיר true אם נשבר שיא */
export function saveLightningBest(score, mode = 'normal') {
  const key = LIGHTNING_KEYS[mode] || LIGHTNING_KEYS.normal;
  let isRecord = false;
  update((s) => {
    if (score > (s.records[key] || 0)) {
      s.records[key] = score;
      isRecord = true;
    }
  });
  return isRecord;
}

export function lightningBest(mode = 'normal') {
  return getState().records[LIGHTNING_KEYS[mode] || LIGHTNING_KEYS.normal] || 0;
}

/* ============================ רצף ימים ============================ */

/**
 * עדכון רצף הימים בתחילת קרב. מחזיר { streak, isNewDay, bonus }
 */
export function touchDailyStreak() {
  const today = todayKey();
  let result = { streak: 0, isNewDay: false, bonus: 0 };
  update((s) => {
    const last = s.stats.lastPlayed;
    if (last === today) {
      result = { streak: s.stats.streakDays, isNewDay: false, bonus: 0 };
      return;
    }
    const gap = daysBetweenKeys(last, today);
    s.stats.streakDays = gap === 1 ? s.stats.streakDays + 1 : 1;
    s.stats.bestStreakDays = Math.max(s.stats.bestStreakDays, s.stats.streakDays);
    s.stats.lastPlayed = today;
    const bonus = Math.min(REWARDS.streakBonusMax, s.stats.streakDays * REWARDS.streakBonusPerDay);
    result = { streak: s.stats.streakDays, isNewDay: true, bonus };
  });
  return result;
}

export function bumpSessions() {
  update((s) => { s.stats.sessions += 1; });
}

export function markPerfect() {
  update((s) => { s.stats.perfectBattles += 1; });
}
