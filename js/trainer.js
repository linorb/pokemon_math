// trainer.js - דמות המאמן: דמויות לבחירה, בגדים ואביזרים, וציור שכבתי ב-SVG.
// אין כאן מזהי SVG (id), כדי שאפשר יהיה לצייר כמה דמויות באותו דף בלי התנגשויות.

/* ============================ דמויות ============================ */

/** כל דמות: צבע עור, תסרוקת, ובגדי הבסיס שלה (כשאין פריט במקום) */
export const CHARACTERS = [
  { id: 'c1', skin: '#f6d2b3', hair: 'short', hairColor: '#6b3e1f', shirt: '#3b82f6', pants: 'shorts', pantsColor: '#1e3a8a' },
  { id: 'c2', skin: '#f6d2b3', hair: 'ponytail', hairColor: '#3b2314', shirt: '#f472b6', pants: 'skirt', pantsColor: '#7c3aed' },
  { id: 'c3', skin: '#8d5a3b', hair: 'curly', hairColor: '#1f1a17', shirt: '#22c55e', pants: 'shorts', pantsColor: '#a16207' },
  { id: 'c4', skin: '#8d5a3b', hair: 'puffs', hairColor: '#1f1a17', shirt: '#facc15', pants: 'skirt', pantsColor: '#0f766e' },
  { id: 'c5', skin: '#dba67c', hair: 'spiky', hairColor: '#f2c94c', shirt: '#ef4444', pants: 'shorts', pantsColor: '#334155' },
  { id: 'c6', skin: '#e3ae88', hair: 'long', hairColor: '#b8430f', shirt: '#14b8a6', pants: 'shorts', pantsColor: '#1e40af' },
  { id: 'c7', skin: '#f3c9a6', hair: 'spiky', hairColor: '#1c1c1c', shirt: '#f97316', pants: 'shorts', pantsColor: '#14532d' },
  { id: 'c8', skin: '#f8dcc4', hair: 'long', hairColor: '#e8c268', shirt: '#a855f7', pants: 'skirt', pantsColor: '#db2777' },
];

export function characterById(id) {
  return CHARACTERS.find((c) => c.id === id) || CHARACTERS[0];
}

/* ============================ פריטים ============================ */

export const WEAR_SLOTS = [
  { id: 'hat', name: 'כּוֹבַע' },
  { id: 'glasses', name: 'מִשְׁקָפַיִם' },
  { id: 'shirt', name: 'חֻלְצָה' },
  { id: 'pants', name: 'מִכְנָסַיִם' },
  { id: 'shoes', name: 'נַעֲלַיִם' },
  { id: 'belt', name: 'חֲגוֹרָה' },
  { id: 'backpack', name: 'תִּיק גַּב' },
];

export const EMPTY_WEAR = Object.fromEntries(WEAR_SLOTS.map((s) => [s.id, null]));

/** minRank = אינדקס דרגת המאמן המינימלית (0-4) */
export const WEAR = [
  // כובעים
  { id: 'hat_red', slot: 'hat', name: 'כּוֹבַע מְאַמֵּן אָדֹם', price: 60, minRank: 0, look: { kind: 'cap', color: '#e3350d', emblem: '#fff' } },
  { id: 'hat_blue', slot: 'hat', name: 'כּוֹבַע מְאַמֵּן כָּחֹל', price: 60, minRank: 0, look: { kind: 'cap', color: '#2563eb', emblem: '#facc15' } },
  { id: 'hat_beanie', slot: 'hat', name: 'כּוֹבַע גֶּרֶב', price: 80, minRank: 0, look: { kind: 'beanie', color: '#16a34a' } },
  { id: 'hat_straw', slot: 'hat', name: 'כּוֹבַע קַשׁ', price: 120, minRank: 1, look: { kind: 'straw' } },
  { id: 'hat_pika', slot: 'hat', name: 'אָזְנֵי פִּיקָאצ\'וּ', price: 200, minRank: 1, look: { kind: 'ears' } },
  { id: 'hat_crown', slot: 'hat', name: 'כֶּתֶר הָאַלּוּף', price: 600, minRank: 3, look: { kind: 'crown' } },

  // משקפיים
  { id: 'gl_round', slot: 'glasses', name: 'מִשְׁקָפַיִם עֲגֻלִּים', price: 50, minRank: 0, look: { kind: 'round' } },
  { id: 'gl_sun', slot: 'glasses', name: 'מִשְׁקְפֵי שֶׁמֶשׁ', price: 90, minRank: 0, look: { kind: 'sun' } },
  { id: 'gl_star', slot: 'glasses', name: 'מִשְׁקְפֵי כּוֹכָבִים', price: 150, minRank: 1, look: { kind: 'star' } },
  { id: 'gl_goggles', slot: 'glasses', name: 'מִשְׁקְפֵי הַרְפַּתְקָאוֹת', price: 220, minRank: 2, look: { kind: 'goggles' } },

  // חולצות
  { id: 'sh_red', slot: 'shirt', name: 'חֻלְצָה אֲדֻמָּה', price: 50, minRank: 0, look: { kind: 'tee', color: '#dc2626' } },
  { id: 'sh_green', slot: 'shirt', name: 'חֻלְצָה יְרֻקָּה', price: 50, minRank: 0, look: { kind: 'tee', color: '#16a34a' } },
  { id: 'sh_jersey', slot: 'shirt', name: 'חֻלְצַת סְפּוֹרְט', price: 110, minRank: 0, look: { kind: 'jersey', color: '#f59e0b', color2: '#1e3a8a' } },
  { id: 'sh_hoodie', slot: 'shirt', name: 'קַפּוּצ\'וֹן צָהֹב', price: 160, minRank: 1, look: { kind: 'hoodie', color: '#facc15' } },
  { id: 'sh_jacket', slot: 'shirt', name: 'מְעִיל מְאַמְּנִים', price: 260, minRank: 2, look: { kind: 'jacket', color: '#1d4ed8', color2: '#e3350d' } },
  { id: 'sh_gold', slot: 'shirt', name: 'מְעִיל הַזָּהָב', price: 650, minRank: 4, look: { kind: 'jacket', color: '#eab308', color2: '#fff7cc' } },

  // מכנסיים
  { id: 'pa_jeans', slot: 'pants', name: 'גִּ\'ינְס', price: 70, minRank: 0, look: { kind: 'long', color: '#3b5b92' } },
  { id: 'pa_skirt', slot: 'pants', name: 'חֲצָאִית וְרֻדָּה', price: 70, minRank: 0, look: { kind: 'skirt', color: '#ec4899' } },
  { id: 'pa_cargo', slot: 'pants', name: 'מִכְנָסַיִם קְצָרִים יְרֻקִּים', price: 60, minRank: 0, look: { kind: 'shorts', color: '#4d7c0f' } },
  { id: 'pa_sport', slot: 'pants', name: 'מִכְנְסֵי סְפּוֹרְט', price: 130, minRank: 1, look: { kind: 'long', color: '#1f2937', stripe: '#f8fafc' } },

  // נעליים
  { id: 'so_red', slot: 'shoes', name: 'נַעֲלֵי סְפּוֹרְט אֲדֻמּוֹת', price: 60, minRank: 0, look: { color: '#dc2626', sole: '#fff' } },
  { id: 'so_blue', slot: 'shoes', name: 'נַעֲלֵי סְפּוֹרְט כְּחֻלּוֹת', price: 60, minRank: 0, look: { color: '#2563eb', sole: '#fff' } },
  { id: 'so_boots', slot: 'shoes', name: 'מַגָּפַיִם', price: 140, minRank: 1, look: { color: '#7c4a1e', sole: '#3b2412', tall: true } },
  { id: 'so_gold', slot: 'shoes', name: 'נַעֲלֵי זָהָב', price: 500, minRank: 3, look: { color: '#eab308', sole: '#fff7cc' } },

  // חגורות
  { id: 'be_brown', slot: 'belt', name: 'חֲגוֹרַת עוֹר', price: 40, minRank: 0, look: { kind: 'plain', color: '#6b3f1d' } },
  { id: 'be_balls', slot: 'belt', name: 'חֲגוֹרַת פּוֹקָדוֹרִים', price: 180, minRank: 1, look: { kind: 'balls', color: '#1f2937' } },
  { id: 'be_champ', slot: 'belt', name: 'חֲגוֹרַת אַלּוּפִים', price: 450, minRank: 3, look: { kind: 'champ', color: '#b91c1c' } },

  // תיקי גב
  { id: 'bp_yellow', slot: 'backpack', name: 'תִּיק גַּב צָהֹב', price: 90, minRank: 0, look: { kind: 'bag', color: '#facc15' } },
  { id: 'bp_green', slot: 'backpack', name: 'תִּיק גַּב יָרֹק', price: 90, minRank: 0, look: { kind: 'bag', color: '#22c55e' } },
  { id: 'bp_wings', slot: 'backpack', name: 'כְּנָפַיִם זוֹהֲרוֹת', price: 700, minRank: 4, look: { kind: 'wings' } },
];

export function wearById(id) {
  return WEAR.find((w) => w.id === id) || null;
}

/* ============================ ציור ============================ */

const INK = '#2b2118';

/** כהה/בהיר יותר של צבע hex */
export function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  const c = (v) => Math.max(0, Math.min(255, Math.round(v + amt * 255)));
  const r = c((n >> 16) & 255); const g = c((n >> 8) & 255); const b = c(n & 255);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

/* --- שיער --- */

function hairBack(style, color) {
  if (style === 'long') {
    return `<path d="M42 70C40 34 60 28 80 28s40 6 38 42l4 70c-14 8-70 8-84 0z" fill="${color}"/>`;
  }
  if (style === 'ponytail') {
    return `<path d="M112 52c20 6 26 40 16 70-4-16-10-30-22-40z" fill="${color}"/>
      <circle cx="112" cy="50" r="7" fill="#e11d48"/>`;
  }
  if (style === 'puffs') {
    return `<circle cx="42" cy="44" r="17" fill="${color}"/><circle cx="118" cy="44" r="17" fill="${color}"/>`;
  }
  return '';
}

function hairFront(style, color) {
  const hi = shade(color, 0.12);
  switch (style) {
    case 'spiky':
      return `<path d="M43 72 38 46l15 5 1-23 15 13 11-20 10 20 15-13 1 23 15-5-5 26c-6-14-18-20-36-20S49 58 43 72z" fill="${color}"/>
        <path d="M66 44 80 30l8 14" fill="none" stroke="${hi}" stroke-width="2"/>`;
    case 'curly': {
      const pts = [[46, 62], [50, 46], [60, 36], [72, 30], [86, 30], [99, 35], [109, 45], [114, 61], [64, 48], [80, 44], [96, 48]];
      return pts.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="11" fill="${color}"/>`).join('');
    }
    case 'short':
      return `<path d="M43 74c-3-30 14-44 37-44s40 14 37 44c-6-12-14-18-24-19-7 6-18 8-30 5-9 1-16 6-20 14z" fill="${color}"/>
        <path d="M58 40c8-5 18-6 28-4" fill="none" stroke="${hi}" stroke-width="2.5" stroke-linecap="round"/>`;
    case 'long':
    case 'ponytail':
    case 'puffs':
    default: {
      const locks = style === 'long'
        ? `<path d="M43 70c-3 20-2 42 2 58l10-2c-4-18-4-38-2-54z" fill="${color}"/><path d="M117 70c3 20 2 42-2 58l-10-2c4-18 4-38 2-54z" fill="${color}"/>`
        : '';
      return `<path d="M43 76c-4-32 13-46 37-46s41 14 37 46c-5-14-14-22-26-24-8 7-22 9-36 4-6 4-10 10-12 20z" fill="${color}"/>${locks}
        <path d="M60 40c8-5 18-6 28-4" fill="none" stroke="${hi}" stroke-width="2.5" stroke-linecap="round"/>`;
    }
  }
}

/* --- ראש ופנים --- */

function head(skin) {
  const dark = shade(skin, -0.12);
  return `
    <rect x="72" y="100" width="16" height="16" rx="4" fill="${dark}"/>
    <circle cx="44" cy="78" r="7" fill="${skin}"/><circle cx="116" cy="78" r="7" fill="${skin}"/>
    <circle cx="80" cy="72" r="37" fill="${skin}"/>`;
}

function face(hairColor) {
  return `
    <path d="M60 66q7-5 14-1M86 65q7-4 14 1" fill="none" stroke="${shade(hairColor, -0.1)}" stroke-width="3" stroke-linecap="round"/>
    <ellipse cx="67" cy="80" rx="5.5" ry="7" fill="#fff"/><ellipse cx="93" cy="80" rx="5.5" ry="7" fill="#fff"/>
    <ellipse cx="68" cy="81" rx="3.6" ry="4.8" fill="${INK}"/><ellipse cx="92" cy="81" rx="3.6" ry="4.8" fill="${INK}"/>
    <circle cx="69.3" cy="79" r="1.4" fill="#fff"/><circle cx="93.3" cy="79" r="1.4" fill="#fff"/>
    <ellipse cx="58" cy="92" rx="6" ry="3.5" fill="#f87171" opacity=".35"/><ellipse cx="102" cy="92" rx="6" ry="3.5" fill="#f87171" opacity=".35"/>
    <path d="M72 94q8 8 16 0" fill="none" stroke="#8a3b2e" stroke-width="2.6" stroke-linecap="round"/>`;
}

/* --- גוף --- */

const TORSO = 'M50 120q3-8 16-9h28q13 1 16 9l5 56H45z';

function arms(skin, sleeveColor, long) {
  const hand = shade(skin, -0.04);
  const sleeve = long
    ? `<path d="M52 122 41 166M108 122l11 44" stroke="${sleeveColor}" stroke-width="17" stroke-linecap="round"/>`
    : `<path d="M52 122l-5 22M108 122l5 22" stroke="${sleeveColor}" stroke-width="18" stroke-linecap="round"/>`;
  return `
    <path d="M52 122 40 170M108 122l12 48" stroke="${skin}" stroke-width="13" stroke-linecap="round"/>
    ${sleeve}
    <circle cx="40" cy="173" r="8" fill="${hand}"/><circle cx="120" cy="173" r="8" fill="${hand}"/>`;
}

function shirt(look) {
  const c = look.color;
  const dark = shade(c, -0.14);
  const base = `<path d="${TORSO}" fill="${c}"/><path d="M68 111q12 9 24 0" fill="none" stroke="${dark}" stroke-width="3"/>`;
  switch (look.kind) {
    case 'jersey':
      return `${base}<path d="M45 150h70" stroke="${look.color2}" stroke-width="5"/>
        <text x="80" y="142" font-size="22" font-weight="900" text-anchor="middle" fill="${look.color2}" font-family="Arial">7</text>`;
    case 'hoodie':
      return `<path d="M58 112q22 16 44 0l-4 14q-18 8-36 0z" fill="${dark}"/>${base}
        <path d="M60 150h40v16H60z" fill="${dark}" opacity=".5"/>
        <path d="M74 114v14M86 114v14" stroke="#fff" stroke-width="2" stroke-linecap="round"/>`;
    case 'jacket':
      return `${base}<path d="M80 113v63" stroke="${look.color2}" stroke-width="3"/>
        <path d="M66 111l14 14 14-14" fill="none" stroke="${look.color2}" stroke-width="4" stroke-linejoin="round"/>
        <path d="M47 160h66" stroke="${look.color2}" stroke-width="4"/>
        <circle cx="94" cy="132" r="4" fill="${look.color2}"/>`;
    case 'tee':
    default:
      return base;
  }
}

function legs(skin) {
  return `<rect x="55" y="168" width="19" height="64" rx="7" fill="${skin}"/><rect x="86" y="168" width="19" height="64" rx="7" fill="${skin}"/>`;
}

function pants(kind, color, stripe) {
  const dark = shade(color, -0.12);
  if (kind === 'skirt') {
    return `<path d="M50 168h60l12 38H38z" fill="${color}"/>
      <path d="M62 170l-6 36M80 170v36M98 170l6 36" stroke="${dark}" stroke-width="2"/>`;
  }
  if (kind === 'long') {
    const st = stripe ? `<path d="M52 176l2 54M108 176l-2 54" stroke="${stripe}" stroke-width="3"/>` : '';
    return `<path d="M47 168h66l-3 64H86l-6-44-6 44H50z" fill="${color}"/>
      <path d="M80 172v14" stroke="${dark}" stroke-width="2"/>${st}`;
  }
  return `<path d="M47 168h66l2 32H85l-5-14-5 14H45z" fill="${color}"/>
    <path d="M80 172v12" stroke="${dark}" stroke-width="2"/>`;
}

function shoes(look) {
  const { color, sole, tall } = look;
  const top = tall ? 214 : 226;
  const h = tall ? 26 : 14;
  return [48, 84].map((x) => `
    <rect x="${x}" y="${top}" width="30" height="${h}" rx="7" fill="${color}"/>
    <rect x="${x - 2}" y="${top + h - 5}" width="34" height="6" rx="3" fill="${sole}"/>
    ${tall ? '' : `<path d="M${x + 8} ${top + 5}h12" stroke="${sole}" stroke-width="2" stroke-linecap="round"/>`}`).join('');
}

function belt(look) {
  const c = look.color;
  let extra = '';
  if (look.kind === 'balls') {
    extra = [54, 66, 94, 106].map((x) => `
      <circle cx="${x}" cy="172" r="5" fill="#fff" stroke="${INK}" stroke-width="1.2"/>
      <path d="M${x - 5} 172a5 5 0 0 1 10 0z" fill="#e3350d" stroke="${INK}" stroke-width="1.2"/>`).join('');
  }
  const buckle = look.kind === 'champ'
    ? '<ellipse cx="80" cy="172" rx="13" ry="9" fill="#facc15" stroke="#a16207" stroke-width="2"/><path d="M80 166l2 4h4l-3 3 1 4-4-2-4 2 1-4-3-3h4z" fill="#b91c1c"/>'
    : `<rect x="73" y="167" width="14" height="10" rx="2" fill="none" stroke="#e5c07b" stroke-width="2.5"/>`;
  return `<rect x="45" y="167" width="70" height="10" rx="3" fill="${c}"/>${extra}${buckle}`;
}

function backpackBack(look) {
  if (look.kind === 'wings') {
    return `<path d="M60 124C30 96 8 104 4 124c14-2 20 6 18 16 12-6 24-2 30 8 2-10 6-18 8-24z" fill="#e0f2fe" stroke="#7dd3fc" stroke-width="2"/>
      <path d="M100 124c30-28 52-20 56 0-14-2-20 6-18 16-12-6-24-2-30 8-2-10-6-18-8-24z" fill="#e0f2fe" stroke="#7dd3fc" stroke-width="2"/>`;
  }
  return `<rect x="34" y="116" width="92" height="60" rx="16" fill="${shade(look.color, -0.12)}"/>`;
}

function backpackFront(look) {
  if (look.kind === 'wings') return '';
  return `<path d="M62 112l-4 58M98 112l4 58" stroke="${look.color}" stroke-width="7" stroke-linecap="round"/>`;
}

/* --- כובעים ומשקפיים --- */

function hat(look) {
  switch (look.kind) {
    case 'cap':
      return `<path d="M42 60c0-22 16-34 38-34s38 12 38 34z" fill="${look.color}"/>
        <path d="M62 58c0-14 8-24 18-24s18 10 18 24z" fill="${look.emblem}"/>
        <circle cx="80" cy="47" r="5" fill="${look.color}"/>
        <ellipse cx="80" cy="60" rx="42" ry="7" fill="${shade(look.color, -0.18)}"/>`;
    case 'beanie':
      return `<path d="M42 64c0-24 16-38 38-38s38 14 38 38z" fill="${look.color}"/>
        <rect x="40" y="56" width="80" height="13" rx="6" fill="${shade(look.color, -0.15)}"/>
        <circle cx="80" cy="24" r="8" fill="#fff"/>`;
    case 'straw':
      return `<ellipse cx="80" cy="56" rx="54" ry="11" fill="#e9c46a"/>
        <path d="M54 56c0-18 10-28 26-28s26 10 26 28z" fill="#f2d27a"/>
        <path d="M54 50h52" stroke="#dc2626" stroke-width="6"/>`;
    case 'ears':
      return `<path d="M50 50C44 30 40 14 42 4c10 8 18 24 20 40z" fill="#facc15" stroke="${INK}" stroke-width="1.5"/>
        <path d="M42 4c1 8 3 14 6 20l6-4C50 14 46 8 42 4z" fill="${INK}"/>
        <path d="M110 50c6-20 10-36 8-46-10 8-18 24-20 40z" fill="#facc15" stroke="${INK}" stroke-width="1.5"/>
        <path d="M118 4c-1 8-3 14-6 20l-6-4c4-6 8-12 12-16z" fill="${INK}"/>
        <path d="M46 50q34-24 68 0" fill="none" stroke="#f59e0b" stroke-width="5" stroke-linecap="round"/>`;
    case 'crown':
      return `<path d="M52 46l4-26 12 14 12-20 12 20 12-14 4 26z" fill="#facc15" stroke="#a16207" stroke-width="2" stroke-linejoin="round"/>
        <circle cx="80" cy="36" r="4" fill="#dc2626"/><circle cx="64" cy="40" r="3" fill="#2563eb"/><circle cx="96" cy="40" r="3" fill="#16a34a"/>`;
    default:
      return '';
  }
}

function glasses(look) {
  switch (look.kind) {
    case 'round':
      return `<circle cx="67" cy="80" r="10" fill="rgba(255,255,255,.18)" stroke="${INK}" stroke-width="2.5"/>
        <circle cx="93" cy="80" r="10" fill="rgba(255,255,255,.18)" stroke="${INK}" stroke-width="2.5"/>
        <path d="M77 80h6" stroke="${INK}" stroke-width="2.5"/>`;
    case 'sun':
      return `<rect x="55" y="72" width="23" height="15" rx="6" fill="#111827"/>
        <rect x="82" y="72" width="23" height="15" rx="6" fill="#111827"/>
        <path d="M78 77h4M46 76l9-1M114 76l-9-1" stroke="#111827" stroke-width="3"/>
        <path d="M59 76l6 0" stroke="#6b7280" stroke-width="2" stroke-linecap="round"/>`;
    case 'star': {
      const star = (cx, cy) => `<path d="M${cx} ${cy - 11}l3.2 7 7.6.8-5.7 5.1 1.6 7.5-6.7-3.9-6.7 3.9 1.6-7.5-5.7-5.1 7.6-.8z" fill="#f472b6" stroke="#be185d" stroke-width="1.5" stroke-linejoin="round"/>`;
      return `${star(67, 81)}${star(93, 81)}<path d="M76 80h8" stroke="#be185d" stroke-width="2.5"/>`;
    }
    case 'goggles':
      return `<path d="M43 78h74" stroke="#78350f" stroke-width="6"/>
        <circle cx="67" cy="79" r="11" fill="#7dd3fc" stroke="#f97316" stroke-width="4"/>
        <circle cx="93" cy="79" r="11" fill="#7dd3fc" stroke="#f97316" stroke-width="4"/>
        <path d="M62 74l4-3M88 74l4-3" stroke="#fff" stroke-width="2" stroke-linecap="round"/>`;
    default:
      return '';
  }
}

/* --- הדמות השלמה --- */

/**
 * ציור המאמן.
 * @param {{character:string, equipped:object}} t
 * @param {string} cls מחלקות CSS לגודל
 */
export function renderTrainer(t = {}, cls = '') {
  const ch = characterById(t.character);
  const eq = { ...EMPTY_WEAR, ...(t.equipped || {}) };
  const item = (slot) => { const w = eq[slot] && wearById(eq[slot]); return w && w.slot === slot ? w.look : null; };

  const shirtLook = item('shirt') || { kind: 'tee', color: ch.shirt };
  const pantsLook = item('pants') || { kind: ch.pants, color: ch.pantsColor };
  const shoesLook = item('shoes') || { color: '#f8fafc', sole: '#94a3b8' };
  const longSleeves = shirtLook.kind === 'hoodie' || shirtLook.kind === 'jacket';
  const bag = item('backpack');
  const beltLook = item('belt');
  const hatLook = item('hat');
  const glassesLook = item('glasses');

  return `<svg class="trainer-svg ${cls}" viewBox="0 0 160 250" aria-hidden="true">
    <ellipse cx="80" cy="242" rx="46" ry="6" fill="rgba(0,0,0,.25)"/>
    ${bag ? backpackBack(bag) : ''}
    ${hairBack(ch.hair, ch.hairColor)}
    ${legs(ch.skin)}
    ${pants(pantsLook.kind, pantsLook.color, pantsLook.stripe)}
    ${shoes(shoesLook)}
    ${shirt(shirtLook)}
    ${beltLook ? belt(beltLook) : ''}
    ${bag ? backpackFront(bag) : ''}
    ${arms(ch.skin, shirtLook.color, longSleeves)}
    ${head(ch.skin)}
    ${face(ch.hairColor)}
    ${hairFront(ch.hair, ch.hairColor)}
    ${glassesLook ? glasses(glassesLook) : ''}
    ${hatLook ? hat(hatLook) : ''}
  </svg>`;
}
