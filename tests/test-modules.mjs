// בדיקת תקינות של כל המודולים: טעינה, נתוני הפוקידקס, האוסף (תפיסה, התפתחות, ביצים), החנות והשמירה.
// הרצה (עם Node): node tests/test-modules.mjs

let pass = 0;
const failures = [];
const check = (name, cond, detail = '') => {
  if (cond) pass += 1; else failures.push(`${name}${detail ? ' :: ' + detail : ''}`);
};

/* ---------- סביבת דפדפן מדומה מינימלית ---------- */
const store = new Map();
const noop = () => {};
const fakeEl = {
  innerHTML: '', textContent: '', hidden: false, style: {}, value: '', dataset: {},
  classList: { add: noop, remove: noop, toggle: noop }, addEventListener: noop, focus: noop, select: noop,
  querySelector: () => null, querySelectorAll: () => [], scrollIntoView: noop,
};
globalThis.window = {
  localStorage: {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
  },
  scrollTo: noop,
};
globalThis.document = {
  readyState: 'loading',
  addEventListener: noop,
  querySelector: () => fakeEl,
  querySelectorAll: () => [],
  getElementById: () => fakeEl,
  createElement: () => ({ ...fakeEl, click: noop, remove: noop }),
  body: { appendChild: noop },
};

/* ---------- ייבוא כל המודולים ---------- */
const mods = {};
for (const name of ['util', 'topics', 'storage', 'progress', 'pokedex', 'pokemon', 'shop', 'art',
  'questions', 'qui', 'ui', 'battle', 'map', 'lightning', 'main']) {
  try {
    mods[name] = await import(`../js/${name}.js`);
    check(`נטען המודול ${name}.js`, true);
  } catch (e) {
    check(`נטען המודול ${name}.js`, false, e.message);
  }
}

const storage = mods.storage;
const pk = mods.pokemon;
const { SPECIES, STARTERS, STONES, RARITY, DEX_ORDER, TYPES, evolvesFrom, chainRoot, baseSpecies } = mods.pokedex;

/* ---------- פוקידקס ---------- */
{
  const all = Object.values(SPECIES);
  check('יש לפחות 50 פוקימונים', all.length >= 50, String(all.length));
  check('אין מספרים כפולים', new Set(DEX_ORDER).size === DEX_ORDER.length);
  check('לכל פוקימון שם בעברית וסוג מוכר', all.every((s) => /[א-ת]/.test(s.name) && TYPES[s.type]),
    all.filter((s) => !TYPES[s.type]).map((s) => s.id).join(','));
  check('כל התפתחות מובילה לפוקימון קיים', all.every((s) => s.evo.every((e) => SPECIES[e.to])));
  check('כל התפתחות היא ברמה או באבן מוכרת', all.every((s) => s.evo.every((e) => (e.level > 0) !== Boolean(e.stone) && (!e.stone || STONES[e.stone]))));
  check('לכל פוקימון שאינו בסיס יש ממי להתפתח', all.filter((s) => !s.rarity).every((s) => evolvesFrom(s.id) !== null),
    all.filter((s) => !s.rarity && evolvesFrom(s.id) === null).map((s) => s.id).join(','));
  check('פוקימון בסיס לא מתפתח ממשהו אחר', baseSpecies().every((s) => evolvesFrom(s.id) === null));
  check('נדירות מוכרת לכל פוקימון בסיס', baseSpecies().every((s) => RARITY[s.rarity]));
  check('ארבעה פוקימוני פתיחה קיימים', STARTERS.length === 4 && STARTERS.every((id) => SPECIES[id]));
  check('שורש השרשרת של צ\'אריזארד הוא צ\'רמנדר', chainRoot(6) === 4);
  check('איווי מתפתח לשלושה עם אבנים', SPECIES[133].evo.length === 3 && SPECIES[133].evo.every((e) => e.stone));
  check('יש פוקימונים לכל דרגת נדירות', Object.keys(RARITY).every((r) => baseSpecies().some((s) => s.rarity === r)));
}

/* ---------- ציור ---------- */
{
  const { pokemonImg, spriteUrl, ballSvg, eggSvg, itemArt, baseTenBlocks, moneySvg, pairsSvg, MONEY } = mods.art;
  check('כתובת התמונה מ-PokeAPI', spriteUrl(25) === 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/25.png');
  const img = pokemonImg(25);
  check('תמונת פוקימון עם שם וחלופה', img.includes('data-name="פיקאצ&#39;ו"') && img.includes('onerror') && img.includes('loading="lazy"'));
  check('צללית לפוקימון שלא נתפס', pokemonImg(150, { silhouette: true, unknown: true }).includes('silhouette') && pokemonImg(150, { unknown: true }).includes('data-name="?"'));
  check('ציורי כדורים', ['poke_ball', 'great_ball', 'ultra_ball'].every((b) => ballSvg(b).includes('<svg')));
  check('ציורי ביצים', ['egg_common', 'egg_legend'].every((e) => eggSvg(e).includes('<svg')));
  check('קוביות: 3 מאות, 0 עשרות ו-5 יחידות', (() => {
    const html = baseTenBlocks({ h: 3, t: 0, u: 5 });
    return (html.match(/bt-h"/g) || []).length === 3 && !html.includes('bt-t"') && (html.match(/bt-u"/g) || []).length === 5;
  })());
  check('ציור לכל מטבע ושטר', MONEY.every((m) => moneySvg(m.v).includes(`>${m.v}<`)));
  check('זוגות: 7 נקודות, אחת לבד', (pairsSvg(7).match(/<circle/g) || []).length === 7 && (pairsSvg(7).match(/lonely/g) || []).length === 1);
  check('זוגות: 8 בלי בודדת', !pairsSvg(8).includes('lonely'));
  check('לכל פריט בחנות יש ציור', mods.shop.CATALOG.every((i) => itemArt(i).length > 10));
}

/* ---------- דרגות ---------- */
{
  const { RANKS, rankFor, nextRankFor, rankIndexFor } = mods.progress;
  check('חמש דרגות מאמן', RANKS.length === 5 && rankFor(0).name === 'מאמן מתחיל' && rankFor(99999).name === 'אלוף פוקימון');
  check('אין דרגה אחרי אלוף', nextRankFor(99999) === null);
  check('סדר הדרגות עולה', RANKS.every((r, i) => i === 0 || r.xp > RANKS[i - 1].xp));
  check('חישוב אינדקס דרגה', rankIndexFor(119) === 0 && rankIndexFor(120) === 1);
}

/* ---------- רמות וניסיון ---------- */
{
  check('רמה 1 בהתחלה', pk.levelOf(0) === 1);
  check('30 ניסיון = רמה 2', pk.levelOf(29) === 1 && pk.levelOf(30) === 2);
  check('רמה מקסימלית', pk.levelOf(999999) === pk.MAX_LEVEL);
  check('התקדמות בתוך רמה', pk.levelProgress(45).into === 15 && pk.levelProgress(45).pct === 50);
}

/* ---------- האוסף: מלווה, ניסיון והתפתחות ---------- */
{
  storage.resetAll();
  check('בהתחלה אין פרופיל', storage.hasProfile() === false);
  const starter = pk.addPokemon(4, { partner: true });
  storage.update((s) => { s.player.name = 'נועה'; });
  check('יש פרופיל אחרי יצירת מאמן', storage.hasProfile() === true);
  check('צ\'רמנדר הוא המלווה', pk.partner().uid === starter.uid && pk.partner().species === 4);
  check('נרשם בפוקידקס', pk.hasCaught(4) && pk.hasSeen(4));

  check('לא מוכן להתפתח ברמה 1', pk.canEvolve(starter.uid) === false);
  const opt = pk.evolutionOptions(starter.uid)[0];
  check('סיבה ברורה למה עוד לא', opt.method === 'level' && opt.reason.includes('רמה 8'));
  check('אי אפשר להתפתח לפני הזמן', pk.evolve(starter.uid, 5).ok === false);

  const up = pk.addPartnerXp(pk.xpForLevel(8) - 1);
  check('עלייה ברמה מדווחת', up.leveledUp === true && up.levelAfter === 7 && up.becameReady === false);
  const ready = pk.addPartnerXp(1);
  check('"מוכן להתפתח" מדווח פעם אחת', ready.becameReady === true && ready.levelAfter === 8);
  check('מוכן להתפתח', pk.canEvolve(starter.uid) && pk.readyToEvolve().length === 1);
  check('לא אפשר להתפתח לפוקימון אחר', pk.evolve(starter.uid, 6).ok === false);

  const ev = pk.evolve(starter.uid, 5);
  check('התפתחות לצ\'רמיליון', ev.ok && ev.from === 4 && ev.to === 5 && pk.findOwned(starter.uid).species === 5);
  check('הניסיון נשמר אחרי התפתחות', pk.levelOf(pk.findOwned(starter.uid).xp) === 8);
  check('צ\'רמיליון נכנס לפוקידקס', pk.hasCaught(5));
  check('אחרי התפתחות כבר לא מוכן', pk.canEvolve(starter.uid) === false);

  // התפתחות באבן
  const eevee = pk.addPokemon(133);
  check('המלווה לא מתחלף כשמוסיפים פוקימון', pk.partner().uid === starter.uid);
  check('איווי צריך אבן', pk.canEvolve(eevee.uid) === false && pk.evolutionOptions(eevee.uid).every((o) => o.reason.includes('פוקימרט')));
  storage.update((s) => { s.items.fire_stone = 1; });
  check('עם אבן אש - רק פלריון פתוח', pk.evolutionOptions(eevee.uid).filter((o) => o.ready).map((o) => o.to).join() === '136');
  check('אבן מים חסרה - אי אפשר לואפוריון', pk.evolve(eevee.uid, 134).ok === false);
  const fl = pk.evolve(eevee.uid, 136);
  check('התפתחות עם אבן', fl.ok && pk.findOwned(eevee.uid).species === 136);
  check('האבן נצרכה', storage.getState().items.fire_stone === 0);

  // מלווה וסוכרייה
  pk.setPartner(eevee.uid);
  check('החלפת מלווה', pk.partner().uid === eevee.uid);
  pk.setPartner('לא-קיים');
  check('אי אפשר לבחור מלווה שלא קיים', pk.partner().uid === eevee.uid);
  check('סוכרייה בלי מלאי נכשלת', pk.useRareCandy(eevee.uid).ok === false);
  storage.update((s) => { s.items.rare_candy = 1; });
  const candy = pk.useRareCandy(eevee.uid);
  check('סוכרייה נדירה מעלה רמה אחת', candy.ok && candy.levelAfter === 2 && storage.getState().items.rare_candy === 0);
}

/* ---------- תפיסה ---------- */
{
  storage.resetAll();
  const p = pk.addPokemon(25, { partner: true });

  const c = (correct, extra = {}) => pk.catchChance({ correct, total: 5, ...extra });
  check('5 מתוך 5 - תמיד', c(5) === 1);
  check('4 - 80%', c(4) === 0.8);
  check('3 - 60%', c(3) === 0.6);
  check('פחות - 30%', c(1) === 0.3 && c(0) === 0.3);
  check('פוקימון שהתעלף נתפס תמיד', c(2, { fainted: true }) === 1);
  check('סופרדור מוסיף 20%', c(3, { ball: 'great_ball' }) === 0.8);
  check('אולטרדור תופס תמיד', c(0, { ball: 'ultra_ball', rarity: 'legend' }) === 1);
  check('אגדי קשה יותר', c(4, { rarity: 'legend' }) < c(4));
  check('תמיד יש סיכוי כלשהו', c(0, { rarity: 'legend' }) >= 0.1);

  const miss = pk.throwBall(16, 0.3, 'poke_ball', 0.9);
  check('החטאה - לא נתפס, אבל נראה', miss.caught === false && pk.hasSeen(16) && !pk.hasCaught(16));
  const hit = pk.throwBall(16, 0.3, 'poke_ball', 0.1);
  check('תפיסה מוסיפה לאוסף', hit.caught && hit.isNew && pk.ownsSpecies(16));
  const xpBefore = pk.partner().xp;
  const dup = pk.throwBall(16, 1, 'poke_ball', 0);
  check('תפיסה כפולה הופכת לממתק למלווה', dup.caught && dup.duplicate && pk.partner().xp === xpBefore + pk.CANDY_XP);
  check('אין כפילות באוסף', pk.ownedList().filter((o) => o.species === 16).length === 1);

  check('בלי סופרדור אי אפשר לזרוק סופרדור', pk.throwBall(19, 1, 'great_ball', 0).caught === false && !pk.ownsSpecies(19));
  storage.update((s) => { s.items.great_ball = 1; });
  pk.throwBall(19, 1, 'great_ball', 0);
  check('סופרדור נצרך', storage.getState().items.great_ball === 0 && pk.ownsSpecies(19));
  check('פוקדור רגיל בלי הגבלה', pk.ballCount('poke_ball') === Infinity);

  // פוקימון בר לפי דרגה
  const early = new Set(Array.from({ length: 300 }, () => pk.pickWild(0)));
  check('מאמן מתחיל לא פוגש נדירים ואגדיים', [...early].every((id) => ['common', 'uncommon'].includes(SPECIES[id].rarity)));
  check('רק פוקימוני בסיס בטבע', [...early].every((id) => SPECIES[id].rarity));
  const late = new Set(Array.from({ length: 2000 }, () => pk.pickWild(4)));
  check('אלוף יכול לפגוש אגדיים', [...late].some((id) => SPECIES[id].rarity === 'legend'));
  void p;
}

/* ---------- ביצים וחנות ---------- */
{
  storage.resetAll();
  pk.addPokemon(1, { partner: true });
  const shop = mods.shop;

  check('אין פריטים כפולים בחנות', new Set(shop.CATALOG.map((i) => i.id)).size === shop.CATALOG.length);
  check('לכל פריט מחיר, שם ותיאור', shop.CATALOG.every((i) => i.price > 0 && i.name && i.desc));
  check('כל פריט שנקנה נשמר במלאי', shop.CATALOG.filter((i) => i.kind === 'item').every((i) => i.id in storage.defaultSave().items));
  check('אבני ההתפתחות בחנות', Object.keys(STONES).every((id) => shop.itemById(id)));

  check('אי אפשר לקנות בלי פוקדולרים', shop.canBuy('great_ball').ok === false);
  storage.update((s) => { s.player.coins = 5000; });
  check('אפשר לקנות סופרדור', shop.canBuy('great_ball').ok === true);
  check('אולטרדור נעול למאמן מתחיל', shop.canBuy('ultra_ball').ok === false);
  check('ביצת אגדה נעולה', shop.canBuy('egg_legend').reason.includes('אלוף'));

  const r = shop.buy('great_ball');
  check('קנייה מורידה פוקדולרים ומוסיפה למלאי', r.ok && storage.getState().player.coins === 5000 - 30 && shop.countOf('great_ball') === 1);

  const commons = baseSpecies().filter((s) => s.rarity === 'common').length;
  const hatched = [];
  for (let i = 0; i < commons; i++) {
    const res = shop.buy('egg_common');
    if (res.ok && res.hatched) hatched.push(res.hatched.species);
  }
  check('כל הביצים הרגילות בקעו', hatched.length === commons, `${hatched.length}/${commons}`);
  check('ביצים לא בוקעות פוקימון שכבר יש', new Set(hatched).size === hatched.length);
  check('ביצה רגילה בוקעת רק נפוצים', hatched.every((id) => SPECIES[id].rarity === 'common'));
  check('כשיש את כולם - אי אפשר לקנות עוד ביצה', shop.canBuy('egg_common').ok === false && shop.canBuy('egg_common').reason.includes('כבר יש'));

  storage.update((s) => { s.player.xp = 99999; });
  check('באלופים נפתחת ביצת אגדה', shop.canBuy('egg_legend').ok === true);
}

/* ---------- התקדמות, תגים ונושאים ---------- */
{
  const p = mods.progress;
  storage.resetAll();

  p.addCoins(50);
  check('הוספת פוקדולרים', p.coins() === 50);
  p.addCoins(-80);
  check('פוקדולרים לא יורדים מתחת לאפס', p.coins() === 0);

  const up = p.addXp(130);
  check('עליית דרגה מדווחת', up.leveledUp === true && up.rank.name === 'מאמן');

  check('נושאי ברירת מחדל פתוחים', p.enabledTopics().join() === 'numbers,even_odd,add_sub,missing,insight,word_add', p.enabledTopics().join());
  p.setTopicEnabled('even_odd', false);
  check('סגירת נושא', !p.isTopicEnabled('even_odd'));
  p.setTopicEnabled('even_odd', true);
  check('פתיחה מחדש שומרת על סדר התכנית', p.enabledTopics().join() === 'numbers,even_odd,add_sub,missing,insight,word_add');
  p.setTopicEnabled('time', true);
  check('נושא שעוד לא מוכן לא נפתח בפועל', !p.isTopicEnabled('time'));

  check('אין תג בלי תרגול', p.awardBadgeIfEarned('add_sub') === false);
  storage.update((s) => { s.stats.byTopic.add_sub = { answered: 20, correct: 18, firstTry: 17, wrong: 3 }; });
  check('3 כוכבים = תג', p.regionStars('add_sub') === 3 && p.awardBadgeIfEarned('add_sub') === true && p.hasBadge('add_sub'));
  check('תג לא ניתן פעמיים', p.awardBadgeIfEarned('add_sub') === false && p.badgeCount() === 1);

  check('שיאי מתקפת ברק נפרדים לפי רמה', p.saveLightningBest(10, 'easy') && p.lightningBest('easy') === 10 && p.lightningBest('normal') === 0);
  check('תוצאה נמוכה לא דורסת שיא', p.saveLightningBest(4, 'easy') === false);

  p.pushToReview({ type: 'facts20', topic: 'add_sub' });
  p.pushToReview({ type: 'facts20', topic: 'add_sub' });
  check('תור חזרה בלי כפילויות', p.reviewCount() === 1);
  p.clearFromReview('facts20');
  check('יציאה מהתור', p.reviewCount() === 0);

  const streak = p.touchDailyStreak();
  check('רצף יומי מתחיל ב-1', streak.streak === 1 && streak.isNewDay === true);
  check('אותו יום לא מעלה את הרצף', p.touchDailyStreak().isNewDay === false);
}

/* ---------- שמירה ומיגרציה ---------- */
{
  const m = storage.migrate({
    player: { name: 'דני', coins: '-5', xp: 'abc' },
    pokemon: { owned: [{ uid: 'a1', species: '25', xp: 40 }, { bad: true }], partnerUid: 'לא-קיים' },
    items: { great_ball: 2.7 },
    settings: { enabledTopics: ['numbers', 'no_such_topic'] },
  });
  check('מיגרציה מתקנת פוקדולרים וניסיון', m.player.coins === 0 && m.player.xp === 0);
  check('מיגרציה מנקה פוקימונים פגומים', m.pokemon.owned.length === 1 && m.pokemon.owned[0].species === 25);
  check('מיגרציה מתקנת מלווה שלא קיים', m.pokemon.partnerUid === 'a1');
  check('מיגרציה משלימה פריטים חסרים', m.items.great_ball === 2 && m.items.ultra_ball === 0);
  check('מיגרציה מסירה נושאים לא מוכרים', m.settings.enabledTopics.join() === 'numbers');
  check('מיגרציה משלימה הגדרות', m.settings.autoRead === true && Array.isArray(m.reviewQueue));
  check('שמירה ריקה = ברירת מחדל', storage.migrate(null).schemaVersion === storage.CURRENT_SCHEMA_VERSION);

  storage.resetAll();
  pk.addPokemon(7, { partner: true });
  const text = storage.exportText();
  storage.resetAll();
  check('ייבוא גיבוי', storage.importText(text).ok && pk.partner().species === 7);
  check('ייבוא טקסט לא תקין נכשל', storage.importText('{oops').ok === false);
  check('ייבוא גיבוי של משחק אחר נכשל', storage.importText(JSON.stringify({ player: { name: 'x' } })).ok === false);
}

/* ---------- רכיבי הממשק של סוגי השאלות ---------- */
{
  const { createQuestionUI, SUPPORTED_UIS } = mods.qui;
  const { GENERATORS, PROGRAM_QUESTIONS } = mods.questions;
  const ctx = {
    keypad: { value: () => null, setEnabled: noop, reset: noop },
    speak: noop, toast: noop, setKeypad: noop, verdict: noop,
  };

  let ok = true;
  let detail = '';
  const samples = [];
  for (const g of GENERATORS) for (let lvl = 0; lvl <= 2; lvl++) samples.push(g.gen(lvl));
  for (const f of PROGRAM_QUESTIONS) samples.push(f());
  for (const q of samples) {
    try {
      if (!SUPPORTED_UIS.includes(q.ui)) { ok = false; detail = `${q.type}: אין רכיב ${q.ui}`; continue; }
      const c = createQuestionUI(q, ctx);
      const host = { ...fakeEl };
      c.mount(host);
      if (!host.innerHTML || host.innerHTML.length < 10) { ok = false; detail = `${q.type}: לא צויר`; }
      const v = c.submit();
      if (v.status !== 'incomplete') { ok = false; detail = `${q.type}: בלי תשובה צריך להיות "לא הושלם" (${v.status})`; }
      c.lock();
    } catch (e) {
      ok = false;
      detail = `${q.type}: ${e.message}`;
    }
  }
  check(`כל ${samples.length} השאלות לדוגמה נטענות, מציירות ומגיבות`, ok, detail);

  // רכיב מספרי: נכון / לא נכון
  const q = GENERATORS.find((g) => g.type === 'facts20').gen(0);
  const answerCtx = (val) => ({ ...ctx, keypad: { ...ctx.keypad, value: () => val } });
  check('תשובה נכונה מתקבלת', createQuestionUI(q, answerCtx(q.answer)).submit().status === 'correct');
  check('תשובה שגויה נדחית', createQuestionUI(q, answerCtx(q.answer + 1)).submit().status === 'wrong');

  // רכיב בחירה: האפשרויות מסומנות בכיוון משמאל לימין כשצריך
  const sign = GENERATORS.find((g) => g.type === 'compare_sign').gen(1);
  const host = { ...fakeEl };
  createQuestionUI(sign, ctx).mount(host);
  check('סימני < ו-> מוצגים בבידוד LTR', host.innerHTML.includes('dir="ltr">&lt;<') && host.innerHTML.includes('blank-box'));
}

/* ---------- הקראה ---------- */
{
  const { speechFor } = mods.battle;
  const { GENERATORS } = mods.questions;
  const q = GENERATORS.find((g) => g.type === 'facts20').gen(0);
  const s = speechFor(q);
  check('הקראת תרגיל בנוסח מדובר', /שווה כמה$/.test(s) && !s.includes('?') && !s.includes('+'), s);
  const w = GENERATORS.find((g) => g.type === 'word_collect').gen(0);
  check('הקראת משימה בלי סוגריים מרובעים', !speechFor(w).includes('[['), speechFor(w));
}

/* ---------- מתקפת ברק ---------- */
{
  const { nextFact } = mods.lightning;
  let fine = true;
  for (const mode of ['easy', 'normal', 'mult']) {
    for (let i = 0; i < 300; i++) {
      const f = nextFact(mode);
      const exp = f.op === '+' ? f.a + f.b : f.op === '-' ? f.a - f.b : f.a * f.b;
      const max = mode === 'easy' ? 10 : mode === 'normal' ? 20 : 36;
      if (exp !== f.answer || f.answer < 0 || f.answer > max || f.choices.length !== 4
        || !f.choices.includes(f.answer) || new Set(f.choices).size !== 4 || f.choices.some((c) => c < 0)) {
        fine = false;
      }
    }
  }
  check('מתקפת ברק: תשובות נכונות, בטווח, 4 אפשרויות שונות', fine);
}

/* ---------- סיכום ---------- */
console.log(`\n✔ עברו: ${pass}`);
if (failures.length) {
  console.log(`✘ נכשלו: ${failures.length}`);
  failures.forEach((f) => console.log('   - ' + f));
  process.exitCode = 1;
} else {
  console.log('כל הבדיקות עברו בהצלחה.');
}
