// main.js - נקודת הכניסה: יצירת מאמן, ניווט בין המסכים, גיבוי ושחזור

import {
  update, hasProfile, resetAll, exportText, importText, downloadBackup, isStorageAvailable,
} from './storage.js';
import {
  $, showScreen, backTarget, getCurrentScreen, updateHUD, toast, modal, renderHome,
  renderShop, renderPokedex, renderStarterPicker, renderCharacterPicker, renderWardrobe,
  refreshStorageWarning, answerInput, renderParentStats, stopSpeaking,
} from './ui.js';
import { startBattle, bindBattleButtons, isBattleActive, abandonBattle } from './battle.js';
import { renderMap } from './map.js';
import { openLightning, stopLightning } from './lightning.js';
import { addPokemon, nameOf } from './pokemon.js';
import { STARTERS } from './pokedex.js';
import { CHARACTERS } from './trainer.js';

/* ============================ יצירת מאמן ============================ */

let onbStarter = null;
let onbChar = CHARACTERS[0].id;

function pickChar(id) {
  onbChar = id;
  renderCharacterPicker(onbChar, pickChar);
}

function pickStarter(id) {
  onbStarter = id;
  renderStarterPicker(onbStarter, pickStarter);
}

function initOnboarding() {
  renderCharacterPicker(onbChar, pickChar);
  renderStarterPicker(onbStarter, pickStarter);

  $('#btn-start').addEventListener('click', () => {
    const name = $('#inp-trainer').value.trim();
    const err = $('#onb-error');
    if (!name) {
      err.textContent = 'צָרִיךְ לִכְתֹּב שֵׁם 🙂';
      err.hidden = false;
      $('#inp-trainer').focus();
      return;
    }
    if (!STARTERS.includes(onbStarter)) {
      err.textContent = 'בַּחֲרוּ אֶת הַפּוֹקִימוֹן הָרִאשׁוֹן שֶׁלָּכֶם ⚡';
      err.hidden = false;
      return;
    }
    err.hidden = true;
    update((s) => {
      s.player.name = name;
      s.trainer.character = onbChar;
      s.player.coins = 30; // מתנת פתיחה - מספיק לסופרדור ראשון
    });
    addPokemon(onbStarter, { partner: true });
    goHome();
    toast(`בְּרוּכִים הַבָּאִים, ${name}! ${nameOf(onbStarter)} מוּכָן לָצֵאת לַדֶּרֶךְ ⚡`);
  });
}

/* ============================ ניווט ============================ */

function goHome() {
  renderHome(openPokedex);
  showScreen('home');
}

function openPokedex(uid = null) {
  renderPokedex(uid);
  showScreen('pokedex');
}

function openWardrobe() {
  renderWardrobe();
  showScreen('wardrobe');
}

function openShop() {
  renderShop();
  showScreen('shop');
}

/**
 * שער הכניסה למסך ההורים: לחיצה ארוכה של 3 שניות.
 * פשוט מספיק למבוגר, ולא משהו שילד ילחץ עליו בטעות באמצע משחק.
 */
const HOLD_MS = 3000;

function initParentGate() {
  const btn = $('#btn-settings');
  const fill = $('#hold-fill');
  let timer = null;
  let start = 0;
  let raf = null;

  const stop = () => {
    clearTimeout(timer);
    cancelAnimationFrame(raf);
    timer = null;
    fill.style.width = '0%';
  };

  const tick = () => {
    const p = Math.min(1, (Date.now() - start) / HOLD_MS);
    fill.style.width = `${p * 100}%`;
    if (p < 1) raf = requestAnimationFrame(tick);
  };

  const begin = (e) => {
    if (timer) return;
    e.preventDefault();
    start = Date.now();
    raf = requestAnimationFrame(tick);
    timer = setTimeout(() => {
      stop();
      openParent();
    }, HOLD_MS);
  };

  btn.addEventListener('pointerdown', begin);
  ['pointerup', 'pointerleave', 'pointercancel'].forEach((ev) => btn.addEventListener(ev, stop));
  // מקלדת: רווח/אנטר פותחים ישירות, כי אין בהם "לחיצה ארוכה"
  btn.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openParent(); }
  });
}

function openParent() {
  renderParentStats();
  refreshStorageWarning();
  showScreen('settings');
}

function openMap() {
  renderMap((topic) => startBattle({ topic }));
  showScreen('map');
}

function initNav() {
  $('#btn-back').addEventListener('click', async () => {
    // יציאה מקרב באמצע - שואלים קודם
    if (getCurrentScreen() === 'battle' && isBattleActive()) {
      const ok = await modal({
        title: 'לָצֵאת מֵהַקְּרָב?',
        body: 'הַתְּשׁוּבוֹת שֶׁכְּבָר עֲנִיתֶם עֲלֵיהֶן נִשְׁמְרוּ, וְהַפּוֹקָדוֹלָרִים נִשְׁאָרִים. אֲבָל הַפּוֹקִימוֹן הַבָּר יִבְרַח.',
        okText: 'יְצִיאָה מֵהַקְּרָב',
        cancelText: 'מַמְשִׁיכִים בַּקְּרָב',
      });
      if (!ok) return;
      abandonBattle();
      goHome();
      return;
    }
    if (getCurrentScreen() === 'lightning') stopLightning();
    stopSpeaking();

    const t = backTarget();
    if (t === 'home') goHome();
    else showScreen(t);
  });

  $('#btn-battle').addEventListener('click', openMap);
  $('#btn-lightning').addEventListener('click', () => openLightning());
  $('#btn-shop').addEventListener('click', openShop);
  $('#btn-pokedex').addEventListener('click', () => openPokedex());
  $('#btn-wardrobe').addEventListener('click', openWardrobe);
  $('#home-trainer').addEventListener('click', openWardrobe);

  initParentGate();

  $('#btn-summary-home').addEventListener('click', goHome);
  $('#btn-summary-dex').addEventListener('click', () => openPokedex());
}

/* ============================ גיבוי ושחזור ============================ */

function initBackup() {
  $('#btn-export').addEventListener('click', () => {
    try {
      downloadBackup();
      toast('קובץ הגיבוי ירד למחשב ✔');
    } catch (e) {
      toast('לא הצלחנו להוריד קובץ. נסו את הגיבוי כטקסט.');
    }
  });

  $('#btn-import').addEventListener('click', () => $('#file-import').click());

  $('#file-import').addEventListener('change', (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const ok = await modal({
        title: 'שחזור מגיבוי',
        body: 'השחזור יחליף את ההתקדמות הנוכחית בזו שבקובץ. להמשיך?',
        okText: 'שחזור',
      });
      if (!ok) { e.target.value = ''; return; }
      const res = importText(String(reader.result));
      if (res.ok) {
        toast('ההתקדמות שוחזרה בהצלחה ✔');
        updateHUD();
        goHome();
      } else {
        toast(res.error);
      }
      e.target.value = '';
    };
    reader.onerror = () => toast('לא הצלחנו לקרוא את הקובץ.');
    reader.readAsText(file);
  });

  $('#btn-copy-save').addEventListener('click', async () => {
    const ta = $('#save-text');
    ta.value = exportText();
    ta.hidden = false;
    $('#save-text-actions').hidden = true;
    ta.select();
    try {
      await navigator.clipboard.writeText(ta.value);
      toast('הגיבוי הועתק. הדביקו אותו במקום בטוח 📋');
    } catch (e) {
      toast('סמנו את הטקסט והעתיקו ידנית (Ctrl+C)');
    }
  });

  $('#btn-paste-save').addEventListener('click', () => {
    const ta = $('#save-text');
    ta.value = '';
    ta.hidden = false;
    ta.placeholder = 'הדביקו כאן את טקסט הגיבוי';
    $('#save-text-actions').hidden = false;
    ta.focus();
  });

  $('#btn-paste-cancel').addEventListener('click', () => {
    $('#save-text').hidden = true;
    $('#save-text-actions').hidden = true;
  });

  $('#btn-paste-apply').addEventListener('click', async () => {
    const text = $('#save-text').value.trim();
    if (!text) { toast('אין טקסט לשחזור.'); return; }
    const ok = await modal({
      title: 'שחזור מטקסט',
      body: 'השחזור יחליף את ההתקדמות הנוכחית. להמשיך?',
      okText: 'שחזור',
    });
    if (!ok) return;
    const res = importText(text);
    if (res.ok) {
      $('#save-text').hidden = true;
      $('#save-text-actions').hidden = true;
      toast('ההתקדמות שוחזרה בהצלחה ✔');
      updateHUD();
      goHome();
    } else {
      toast(res.error);
    }
  });

  $('#btn-reset').addEventListener('click', async () => {
    const ok = await modal({
      title: 'איפוס ההתקדמות',
      body: 'כל הפוקדולרים, הפוקימונים וההתקדמות יימחקו לצמיתות. האם אתם בטוחים?<br><strong>מומלץ לעשות גיבוי לפני!</strong>',
      okText: 'כן, למחוק הכל',
      cancelText: 'ביטול',
    });
    if (!ok) return;
    resetAll();
    updateHUD();
    toast('ההתקדמות אופסה.');
    location.reload();
  });
}

/* ============================ הפעלה ============================ */

function boot() {
  answerInput.init();
  bindBattleButtons();
  initNav();
  initBackup();
  initOnboarding();
  refreshStorageWarning();
  updateHUD();

  // בחלק מהדפדפנים רשימת הקולות להקראה נטענת רק אחרי הקריאה הראשונה, ומגיעה באירוע voiceschanged
  if ('speechSynthesis' in window) {
    window.speechSynthesis.getVoices();
    window.speechSynthesis.addEventListener?.('voiceschanged', () => window.speechSynthesis.getVoices());
  }

  if (hasProfile()) {
    goHome();
  } else {
    showScreen('onboarding');
  }

  if (!isStorageAvailable()) {
    console.warn('[pokemon-math] localStorage לא זמין - ההתקדמות תישמר רק בזיכרון.');
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
