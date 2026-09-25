// map.js - מפת המכונים: כל נושא בתכנית הוא מכון, עם כוכבי התקדמות ותג למי ששולט בו

import { TOPICS, REGION_ORDER } from './topics.js';
import { regionStars, accuracyByTopic, reviewCount, enabledTopics, hasBadge } from './progress.js';
import { $, toast } from './ui.js';
import { fmt, esc } from './util.js';

function starsHtml(n) {
  return Array.from({ length: 3 }, (_, i) => `<span class="star ${i < n ? 'on' : ''}">★</span>`).join('');
}

/**
 * ציור המפה.
 * @param {(topicId:string|null)=>void} onPick נקרא עם מזהה נושא, או null לקרב פראי
 */
export function renderMap(onPick) {
  const acc = accuracyByTopic();
  const queued = reviewCount();
  const open = enabledTopics();

  const card = (id) => {
    const t = TOPICS[id];
    const isOpen = open.includes(id);
    if (!isOpen) {
      return `
        <button class="region-card locked" type="button" data-locked="${id}">
          <span class="region-icon">🔒</span>
          <span class="region-name">${esc(t.gym)}</span>
          <span class="region-topic">${esc(t.name)}</span>
          <span class="region-acc">${t.ready ? 'יִפָּתַח כְּשֶׁתִּלְמְדוּ אֶת זֶה בַּכִּתָּה' : 'בְּקָרוֹב'}</span>
        </button>`;
    }
    const stars = regionStars(id);
    const a = acc[id];
    const line = a === null || a === undefined
      ? 'עוֹד לֹא בִּקַּרְתֶּם כָּאן'
      : `דִּיּוּק: <span class="num">${fmt(a)}%</span>`;
    return `
      <button class="region-card ${hasBadge(id) ? 'mastered' : ''}" type="button" data-topic="${id}">
        ${hasBadge(id) ? '<span class="badge-mark" title="יש לכם את התג!">🏅</span>' : ''}
        <span class="region-icon">${t.icon}</span>
        <span class="region-name">${esc(t.gym)}</span>
        <span class="region-topic">${esc(t.name)}</span>
        <span class="region-stars">${starsHtml(stars)}</span>
        <span class="region-acc">${line}</span>
      </button>`;
  };

  const openCards = REGION_ORDER.filter((id) => open.includes(id)).map(card).join('');
  const lockedCards = REGION_ORDER.filter((id) => !open.includes(id)).map(card).join('');

  $('#map-body').innerHTML = `
    <button class="btn btn-primary btn-xl mixed-btn" type="button" data-topic="">
      <span class="btn-emoji">🌿</span> קְרָב פְּרָאִי - כָּל הַנּוֹשְׂאִים
    </button>
    <div class="mixed-note">
      בִּקְרָב פְּרָאִי מַגִּיעוֹת יוֹתֵר שְׁאֵלוֹת מֵהַנּוֹשְׂאִים הַקָּשִׁים${queued === 1 ? ', וְגַם שְׁאֵלָה אַחַת לַחֲזָרָה 🔁' : queued ? `, וְגַם ${fmt(queued)} שְׁאֵלוֹת לַחֲזָרָה 🔁` : ''}.
    </div>
    <div class="region-grid">${openCards}</div>
    ${lockedCards ? `<h3 class="locked-title">מְכוֹנִים נְעוּלִים</h3><div class="region-grid">${lockedCards}</div>` : ''}`;

  $('#map-body').onclick = (e) => {
    const locked = e.target.closest('[data-locked]');
    if (locked) {
      const t = TOPICS[locked.dataset.locked];
      toast(t.ready ? `${t.gym} עוֹד נָעוּל. מְבֻגָּר יָכוֹל לִפְתֹּחַ אוֹתוֹ בְּמָסָךְ הַהוֹרִים 🔒` : `${t.gym} יַגִּיעַ בְּקָרוֹב! 🚧`);
      return;
    }
    const btn = e.target.closest('[data-topic]');
    if (!btn) return;
    onPick(btn.dataset.topic || null);
  };
}
