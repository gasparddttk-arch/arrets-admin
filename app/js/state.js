// Progression : enregistrée sur le téléphone, avec une copie de secours et un export.
const CLE = 'arrets-admin.v1';

export const RANGS = [
  { xp: 0, nom: 'Auditeur de 2e classe' },
  { xp: 300, nom: 'Auditeur de 1re classe' },
  { xp: 900, nom: 'Maître des requêtes' },
  { xp: 2000, nom: 'Conseiller d’État' },
  { xp: 4000, nom: 'Président de chambre' },
  { xp: 7000, nom: 'Président de section' },
  { xp: 11000, nom: 'Président adjoint du contentieux' },
  { xp: 16000, nom: 'Vice-président du Conseil d’État' },
];

export const ETAPES_SERIE = [7, 30, 100];
export const INTERVALLES = [0, 1, 2, 4, 9, 21, 45];
export const TITRES_CARTE = ['Inconnu', 'Brouillon', 'Note', 'Conclusions', 'Délibéré', 'Grand arrêt'];

export const TROPHEES = [
  { id: 'premier', nom: 'Première audience', txt: 'Terminer une séance' },
  { id: 'sansfaute', nom: 'Sans faute', txt: 'Finir une séance à 100 %' },
  { id: 'combo10', nom: 'Dix de suite', txt: 'Enchaîner dix bonnes réponses' },
  { id: 'serie7', nom: 'Une semaine de séances', txt: 'Tenir une série de 7 jours' },
  { id: 'serie30', nom: 'Un mois de séances', txt: 'Tenir une série de 30 jours' },
  { id: 'serie100', nom: 'Cent jours au Palais', txt: 'Tenir une série de 100 jours' },
  { id: 'carte10', nom: 'Dix conclusions', txt: 'Monter 10 arrêts au niveau Conclusions' },
  { id: 'grand10', nom: 'Dix grands arrêts', txt: 'Monter 10 arrêts au niveau Grand arrêt' },
  { id: 'grand50', nom: 'Le recueil', txt: 'Monter 50 arrêts au niveau Grand arrêt' },
  { id: 'jumeaux', nom: 'Faux jumeaux démasqués', txt: 'Maîtriser toute une famille de faux jumeaux' },
  { id: 'boss1', nom: 'Audience solennelle', txt: 'Gagner une audience solennelle' },
  { id: 'bossParfait', nom: 'Chambre sans faute', txt: 'Gagner une audience sans perdre une vie' },
  { id: 'bossTous', nom: 'Toutes les chambres', txt: 'Gagner les neuf audiences du cours' },
  { id: 'juge10', nom: 'Dix décisions', txt: 'Juger dix affaires sans erreur' },
  { id: 'plan5', nom: 'Le bon œil', txt: 'Réussir cinq fois Le bon plan' },
  { id: 'archi5', nom: 'Maître d’œuvre', txt: 'Réussir cinq fois Architecte' },
  { id: 'vp', nom: 'Vice-président', txt: 'Atteindre le dernier grade' },
];

export const BOUTIQUE = [
  { id: 'sursis', nom: 'Sursis', prix: 60, txt: 'Protège ta série un jour sans jouer. Cinq au maximum.', max: 5 },
  { id: 'recusation', nom: 'Récusation', prix: 15, txt: 'Retire une mauvaise réponse d’une question.' },
  { id: 'indice', nom: 'Note du rapporteur', prix: 10, txt: 'Affiche un indice sur la question.' },
  { id: 'prorogation', nom: 'Prorogation', prix: 10, txt: 'Ajoute 15 secondes en mode Paires.' },
  { id: 'passe', nom: 'Passe-droit', prix: 200, txt: 'Ouvre la prochaine chambre sans gagner l’audience.' },
];

// Chaque tenue change l'habillage de toute l'appli. Une nouvelle tenue s'ajoute ici et dans le CSS.
export const THEMES = [
  { id: 'palais', nom: 'Bleu', prix: 0, txt: 'Le bleu du Palais, l’or et la cire' },
  { id: 'rose', nom: 'Rose', prix: 200, txt: 'Le chat juge, les canettes de Ratio, et Slay Diva' },
];
const ANCIENNES_TENUES = { tapis: 150, robe: 150, pourpre: 300 };

export const INSIGNES = [
  { id: 'aucun', nom: 'Sans insigne', prix: 0, txt: 'La sobriété de l’auditeur' },
  { id: 'plume', nom: 'La plume', prix: 80, txt: 'Pour les rapporteurs' },
  { id: 'balance', nom: 'La balance', prix: 80, txt: 'Pour ceux qui pèsent leurs moyens' },
  { id: 'colonne', nom: 'La colonne', prix: 120, txt: 'Pour les bâtisseurs de plans' },
  { id: 'laurier', nom: 'Le laurier', prix: 250, txt: 'Pour les grands arrêts' },
];

export const DECORS = [
  { id: 'aucun', nom: 'Bureau nu', prix: 0, txt: 'Rien que le sceau' },
  { id: 'arcades', nom: 'Les galeries', prix: 100, txt: 'Les arcades du Palais-Royal' },
  { id: 'jardin', nom: 'Le jardin', prix: 100, txt: 'Les tilleuls taillés du jardin' },
  { id: 'buren', nom: 'Les colonnes', prix: 180, txt: 'La cour d’honneur, à deux pas du Conseil' },
];

let decalage = 0;
export const fixerDecalage = (n) => { decalage = n; };

// Le jour change à minuit, heure de Paris, où que soit le téléphone.
export function jour(d = new Date()) {
  const s = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Paris', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
  const [a, m, j] = s.split('-').map(Number);
  return Math.floor(Date.UTC(a, m - 1, j) / 864e5) + decalage;
}

function etatInitial() {
  return {
    v: 1, cree: jour(), xp: 0, jetons: 30,
    serie: { n: 0, dernier: null, record: 0 },
    jours: {}, rompue: null, coffres: {},
    arrets: {},
    zones: { ouvertes: [1, 2], gagnees: [], parfaites: [] },
    inv: { sursis: 1, recusation: 2, indice: 2, prorogation: 2, passe: 0 },
    themes: ['palais'], theme: 'palais',
    insignes: ['aucun'], insigne: 'aucun',
    decors: ['aucun'], decor: 'aucun',
    enCours: null,
    trophees: {},
    stats: { seances: 0, parfaites: 0, comboMax: 0, juge: 0, plan: 0, archi: 0 },
    reglages: { son: true, toutOuvert: false, effets: true, vibration: true, sonSilencieux: false },
    defi: { jour: null, fini: false },
    cloud: { code: null, dernier: null },
  };
}

function fusion(base, x) {
  const o = { ...base, ...x };
  for (const k of ['serie', 'zones', 'inv', 'stats', 'reglages', 'defi', 'cloud']) o[k] = { ...base[k], ...(x[k] || {}) };
  return o;
}

export let etat = etatInitial();
export let rembourse = 0;
export const remplacerEtat = (e) => { etat = fusion(etatInitial(), e); migrer(); sauver(); };

// Les anciennes tenues disparaissent : ce qu'elles ont coûté revient en jetons.
export function migrer() {
  if ((etat.m || 0) >= 2) return 0;
  let rendu = 0;
  for (const t of etat.themes) rendu += ANCIENNES_TENUES[t] || 0;
  etat.themes = etat.themes.filter((t) => !ANCIENNES_TENUES[t]);
  if (!etat.themes.includes(etat.theme)) etat.theme = 'palais';
  etat.jetons += rendu;
  etat.m = 2;
  return rendu;
}

// Copie de secours dans IndexedDB, utilisée si localStorage revient vide.
function idb() {
  return new Promise((ok, ko) => {
    const r = indexedDB.open('arrets-admin', 1);
    r.onupgradeneeded = () => r.result.createObjectStore('kv');
    r.onsuccess = () => ok(r.result); r.onerror = () => ko(r.error);
  });
}
async function ecrireSecours(val) {
  try { const db = await idb(); const t = db.transaction('kv', 'readwrite'); t.objectStore('kv').put(val, CLE); db.close(); } catch { /* copie facultative */ }
}
async function lireSecours() {
  try {
    const db = await idb();
    return await new Promise((ok) => { const r = db.transaction('kv').objectStore('kv').get(CLE); r.onsuccess = () => { db.close(); ok(r.result); }; r.onerror = () => { db.close(); ok(null); }; });
  } catch { return null; }
}

export async function charger() {
  let brut = null;
  try { brut = localStorage.getItem(CLE); } catch { /* stockage indisponible */ }
  if (!brut) brut = await lireSecours();
  if (brut) { try { etat = fusion(etatInitial(), JSON.parse(brut)); } catch { etat = etatInitial(); } }
  if ((etat.m || 0) < 2) { rembourse = migrer(); if (brut) sauver(); }
  try { await navigator.storage?.persist?.(); } catch { /* facultatif */ }
  return etat;
}

export function sauver() {
  const brut = JSON.stringify(etat);
  try { localStorage.setItem(CLE, brut); } catch { /* stockage plein ou bloqué */ }
  ecrireSecours(brut);
}

// Les images personnelles restent sur le téléphone : elles n'entrent ni dans l'état ni dans les sauvegardes.
export async function lireImage(cle) {
  try {
    const db = await idb();
    return await new Promise((ok) => { const r = db.transaction('kv').objectStore('kv').get(cle); r.onsuccess = () => { db.close(); ok(r.result || null); }; r.onerror = () => { db.close(); ok(null); }; });
  } catch { return null; }
}
export async function ecrireImage(cle, val) {
  const db = await idb();
  await new Promise((ok, ko) => {
    const t = db.transaction('kv', 'readwrite');
    if (val === null) t.objectStore('kv').delete(cle); else t.objectStore('kv').put(val, cle);
    t.oncomplete = ok; t.onerror = () => ko(t.error);
  });
  db.close();
}

export const exporter = () => btoa(unescape(encodeURIComponent(JSON.stringify(etat))));
export function importer(code) {
  const e = JSON.parse(decodeURIComponent(escape(atob(code.trim()))));
  if (!e || e.v !== 1) throw new Error('Code illisible');
  remplacerEtat(e);
}

// Série.
export function verifierSerie() {
  const j = jour(); const s = etat.serie;
  if (etat.rompue && j - etat.rompue.jour > 1) { etat.rompue = null; sauver(); }
  if (!s.n || s.dernier === null) return null;
  const ecart = j - s.dernier;
  if (ecart <= 1) return null;
  const manques = ecart - 1;
  if (etat.inv.sursis >= manques) {
    etat.inv.sursis -= manques;
    for (let d = s.dernier + 1; d < j; d++) etat.jours[d] = 's';
    s.dernier = j - 1; sauver();
    return { type: 'sursis', n: manques };
  }
  etat.rompue = { n: s.n, jour: j };
  s.n = 0; s.dernier = null; sauver();
  return { type: 'rompue', n: etat.rompue.n };
}

export const prixForclusion = () => 80 + 4 * (etat.rompue?.n || 0);
export function relever() {
  const r = etat.rompue; const prix = prixForclusion();
  if (!r || etat.jetons < prix) return false;
  etat.jetons -= prix;
  etat.serie.n = r.n; etat.serie.dernier = jour() - 1; etat.jours[jour() - 1] = 'f';
  etat.rompue = null; sauver();
  return true;
}

export function validerJour() {
  const j = jour(); const s = etat.serie;
  if (s.dernier === j) return { nouveau: false, n: s.n };
  s.n = s.dernier === j - 1 ? s.n + 1 : 1;
  s.dernier = j; s.record = Math.max(s.record, s.n);
  etat.jours[j] = 1;
  let coffre = null;
  for (const e of ETAPES_SERIE) if (s.n === e && !etat.coffres[e]) { etat.coffres[e] = true; coffre = { etape: e, jetons: e * 5, sursis: e >= 30 ? 2 : 1 }; }
  if (coffre) { etat.jetons += coffre.jetons; etat.inv.sursis = Math.min(5, etat.inv.sursis + coffre.sursis); }
  sauver();
  return { nouveau: true, n: s.n, coffre };
}

// Grades.
export function rang(xp = etat.xp) {
  let i = 0;
  RANGS.forEach((r, k) => { if (xp >= r.xp) i = k; });
  const suivant = RANGS[i + 1];
  return { i, nom: RANGS[i].nom, suivant, part: suivant ? (xp - RANGS[i].xp) / (suivant.xp - RANGS[i].xp) : 1 };
}

// Répétition espacée : chaque arrêt monte d'une boîte quand il est réussi, et redescend quand il est raté.
export function noter(id, ok, confonduAvec = null) {
  const a = etat.arrets[id] || (etat.arrets[id] = { b: 0, d: jour(), ok: 0, ko: 0, c: {} });
  if (ok) { a.ok++; a.b = Math.min(5, a.b + 1); } else { a.ko++; a.b = Math.max(a.b === 0 ? 0 : 1, a.b - 2); }
  a.d = jour() + (ok ? INTERVALLES[a.b] : 0);
  if (!ok && confonduAvec && confonduAvec !== id) a.c[confonduAvec] = (a.c[confonduAvec] || 0) + 1;
}
export const niveau = (id) => etat.arrets[id]?.b || 0;

// Arrêts à revoir aujourd'hui, les plus fragiles d'abord, puis les arrêts jamais vus.
export function aRevoir(ix, zones) {
  const j = jour();
  const dansZones = (a) => a.zones.some((z) => zones.includes(z));
  const dus = ix.arrets.filter((a) => dansZones(a) && etat.arrets[a.id] && etat.arrets[a.id].d <= j)
    .sort((a, b) => etat.arrets[a.id].b - etat.arrets[b.id].b || (etat.arrets[b.id].ko - etat.arrets[a.id].ko));
  const neufs = ix.arrets.filter((a) => dansZones(a) && !etat.arrets[a.id]).sort((a, b) => b.imp - a.imp);
  return [...dus, ...neufs].map((a) => a.id);
}

// Le bonus TD rejoint le parcours dès que la troisième chambre est ouverte.
export const zonesOuvertes = (ix) => {
  if (etat.reglages.toutOuvert) return ix.zones.map((z) => z.id);
  const o = etat.zones.ouvertes;
  return o.length >= 3 ? [...new Set([...o, 10])] : [...o];
};

export function ouvrirSuivante() {
  const o = etat.zones.ouvertes; const m = Math.max(...o);
  if (m < 9) o.push(m + 1);
  sauver(); return m + 1;
}

export function evaluerTrophees(ix) {
  const t = etat.trophees; const nouveaux = [];
  const gagne = (id) => { if (!t[id]) { t[id] = jour(); nouveaux.push(TROPHEES.find((x) => x.id === id)); } };
  const s = etat.stats; const vals = Object.values(etat.arrets);
  if (s.seances >= 1) gagne('premier');
  if (s.parfaites >= 1) gagne('sansfaute');
  if (s.comboMax >= 10) gagne('combo10');
  for (const e of ETAPES_SERIE) if (etat.serie.record >= e) gagne('serie' + e);
  if (vals.filter((a) => a.b >= 3).length >= 10) gagne('carte10');
  const grands = vals.filter((a) => a.b >= 5).length;
  if (grands >= 10) gagne('grand10');
  if (grands >= 50) gagne('grand50');
  if (ix.familles.some((f) => f.m.every((m) => niveau(m.id) >= 4))) gagne('jumeaux');
  if (etat.zones.gagnees.length >= 1) gagne('boss1');
  if ((etat.zones.parfaites || []).length >= 1) gagne('bossParfait');
  if ([1, 2, 3, 4, 5, 6, 7, 8, 9].every((z) => etat.zones.gagnees.includes(z))) gagne('bossTous');
  if (s.juge >= 10) gagne('juge10');
  if (s.plan >= 5) gagne('plan5');
  if (s.archi >= 5) gagne('archi5');
  if (rang().i === RANGS.length - 1) gagne('vp');
  return nouveaux;
}
