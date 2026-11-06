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

// Chaque matière a sa carrière. La carrière générale additionne les deux.
export const RANGS_OBLIG = [
  { xp: 0, nom: 'Auditeur à la Cour de cassation' },
  { xp: 300, nom: 'Conseiller référendaire' },
  { xp: 900, nom: 'Avocat général référendaire' },
  { xp: 2000, nom: 'Conseiller à la Cour de cassation' },
  { xp: 4000, nom: 'Doyen de chambre' },
  { xp: 7000, nom: 'Président de chambre' },
  { xp: 11000, nom: 'Procureur général' },
  { xp: 16000, nom: 'Premier président' },
];
export const RANGS_GENERAL = [
  { xp: 0, nom: 'Étudiant' },
  { xp: 600, nom: 'Licencié en droit' },
  { xp: 1800, nom: 'Diplômé de master' },
  { xp: 4000, nom: 'Docteur en droit' },
  { xp: 8000, nom: 'Maître de conférences' },
  { xp: 14000, nom: 'Professeur agrégé' },
  { xp: 22000, nom: 'Doyen de la faculté' },
];
export const MATIERES = [
  { id: 'admin', nom: 'Droit administratif', institution: 'Conseil d’État', rangs: RANGS },
  { id: 'oblig', nom: 'Droit des obligations', institution: 'Cour de cassation', rangs: RANGS_OBLIG },
];
export const matiereDe = (id) => MATIERES.find((m) => m.id === id);

// Pièces : au plus 2 par épreuve, soit 10 pour une séance de cinq minutes, et 30 par jour et par matière.
export const PLAFOND_JOUR = 30;
export const PIECES_EPREUVE = 2;
export const PRIX_DUNK = { cinq: 100, infini: 300 };

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
  { id: 'vp', nom: 'Vice-président', txt: 'Atteindre le dernier grade du Conseil d’État' },
  { id: 'cas10', nom: 'Dix jugements', txt: 'Résoudre dix cas pratiques sans erreur' },
  { id: 'frise5', nom: 'Le sens de l’histoire', txt: 'Réussir cinq frises sans erreur' },
  { id: 'art30', nom: 'Code en poche', txt: 'Monter 30 articles au niveau Conclusions' },
  { id: 'pp', nom: 'Premier président', txt: 'Atteindre le dernier grade de la Cour de cassation' },
  { id: 'deux', nom: 'Deux matières', txt: 'Gagner des pièces dans les deux matières le même jour' },
  { id: 'dunk5', nom: 'Premier dunk', txt: 'Réussir 5 paniers de suite' },
  { id: 'dunk25', nom: 'Dans la raquette', txt: 'Réussir 25 paniers de suite' },
  { id: 'doyen', nom: 'Doyen', txt: 'Atteindre le dernier grade de la carrière générale' },
];

export const BOUTIQUE = [
  { id: 'sursis', nom: 'Sursis', prix: 60, txt: 'Protège ta série un jour sans jouer. Cinq au maximum.', max: 5 },
  { id: 'recusation', nom: 'Récusation', prix: 15, txt: 'Retire une mauvaise réponse d’une question.' },
  { id: 'indice', nom: 'Note du rapporteur', prix: 10, txt: 'Affiche un indice sur la question.' },
  { id: 'prorogation', nom: 'Prorogation', prix: 10, txt: 'Ajoute 15 secondes quand il faut relier.' },
  { id: 'passe', nom: 'Passe-droit', prix: 200, txt: 'Ouvre la prochaine chambre sans gagner l’audience.' },
];

// Chaque tenue change l'habillage de toute l'appli. Une nouvelle tenue s'ajoute ici et dans le CSS.
export const THEMES = [
  { id: 'palais', nom: 'Bleu', prix: 0, txt: 'Le bleu du Palais, l’or et la cire' },
  { id: 'rose', nom: 'Rose', prix: 200, txt: 'Le livre rose de la chouette, les canettes de Ratio, et Slay Diva' },
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

// Les obligations ont leur propre progression ; l'administratif garde la sienne à la racine de l'état,
// ce qui laisse intactes les progressions et les sauvegardes déjà faites.
const zonesVierges = () => ({ ouvertes: [1, 2], gagnees: [], parfaites: [] });
const matiereVierge = () => ({
  xp: 0, arrets: {}, enCours: null, gains: { jour: null, n: 0 },
  zones: zonesVierges(), parEquipe: {},
});

function etatInitial() {
  return {
    v: 1, cree: jour(), xp: 0, jetons: 30,
    matiere: 'admin', equipe: 2, equipeChoisie: false, gains: { jour: null, n: 0 },
    oblig: matiereVierge(),
    dunk: { cinq: false, infini: false, record: 0, parties: 0, paniers: 0 },
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
    stats: { seances: 0, parfaites: 0, comboMax: 0, juge: 0, plan: 0, archi: 0, cas: 0, frise: 0 },
    reglages: { son: true, toutOuvert: false, effets: true, vibration: true, sonSilencieux: false },
    defi: { jour: null, fini: false },
    cloud: { code: null, dernier: null },
    cadeaux: [],
    chouette: { tenues: [], porte: { tete: null, visage: null, buste: null, robe: null }, reveil: null, retour: null, seance: null, tapes: 0 },
  };
}

function fusion(base, x) {
  const o = { ...base, ...x };
  for (const k of ['serie', 'zones', 'inv', 'stats', 'reglages', 'defi', 'cloud', 'gains', 'dunk', 'chouette']) o[k] = { ...base[k], ...(x[k] || {}) };
  const ob = x.oblig || {};
  o.oblig = { ...base.oblig, ...ob, gains: { ...base.oblig.gains, ...(ob.gains || {}) }, zones: { ...base.oblig.zones, ...(ob.zones || {}) } };
  if (!['admin', 'oblig'].includes(o.matiere)) o.matiere = 'admin';
  return o;
}

// Chaque équipe a ses chambres : on range celles qu'on quitte et on retrouve celles qu'on rejoint.
// Les fiches, les pièces, la série et les tenues restent communes.
export function changerEquipe(n) {
  const o = etat.oblig;
  if (n !== etat.equipe) {
    o.parEquipe = { ...o.parEquipe, [etat.equipe]: { zones: o.zones, enCours: o.enCours } };
    const suite = o.parEquipe[n];
    o.zones = suite?.zones || zonesVierges();
    o.enCours = suite?.enCours || null;
    etat.equipe = n;
  }
  etat.equipeChoisie = true;
  sauver();
}

export let etat = etatInitial();
export let rembourse = 0;
// La progression de la matière ouverte, ou de celle demandée.
export const M = (m = etat.matiere) => (m === 'oblig' ? etat.oblig : etat);
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
function palier(liste, xp) {
  let i = 0;
  liste.forEach((r, k) => { if (xp >= r.xp) i = k; });
  const suivant = liste[i + 1];
  return { i, nom: liste[i].nom, suivant, xp, part: suivant ? (xp - liste[i].xp) / (suivant.xp - liste[i].xp) : 1 };
}
export const rang = (m = etat.matiere) => palier(matiereDe(m).rangs, M(m).xp);
export const rangGeneral = () => palier(RANGS_GENERAL, etat.xp + etat.oblig.xp);

// Pièces gagnées aujourd'hui dans une matière, et ce qu'il reste à gagner avant le plafond.
export function gainsDuJour(m = etat.matiere) {
  const g = M(m).gains;
  return g.jour === jour() ? g.n : 0;
}
export function crediter(n, m = etat.matiere) {
  const deja = gainsDuJour(m);
  const accorde = Math.max(0, Math.min(n, PLAFOND_JOUR - deja));
  M(m).gains = { jour: jour(), n: deja + accorde };
  etat.jetons += accorde;
  return accorde;
}

// Répétition espacée : chaque arrêt monte d'une boîte quand il est réussi, et redescend quand il est raté.
export function noter(id, ok, confonduAvec = null) {
  const fiches = M().arrets;
  const a = fiches[id] || (fiches[id] = { b: 0, d: jour(), ok: 0, ko: 0, c: {} });
  if (ok) { a.ok++; a.b = Math.min(5, a.b + 1); } else { a.ko++; a.b = Math.max(a.b === 0 ? 0 : 1, a.b - 2); }
  a.d = jour() + (ok ? INTERVALLES[a.b] : 0);
  if (!ok && confonduAvec && confonduAvec !== id) a.c[confonduAvec] = (a.c[confonduAvec] || 0) + 1;
}
export const niveau = (id) => M().arrets[id]?.b || 0;

// Arrêts à revoir aujourd'hui, les plus fragiles d'abord, puis les arrêts jamais vus.
export function aRevoir(ix, zones) {
  const j = jour(); const fiches = M().arrets;
  const dansZones = (a) => a.zones.some((z) => zones.includes(z));
  const dus = ix.cartes.filter((a) => dansZones(a) && fiches[a.id] && fiches[a.id].d <= j)
    .sort((a, b) => fiches[a.id].b - fiches[b.id].b || (fiches[b.id].ko - fiches[a.id].ko));
  const neufs = ix.cartes.filter((a) => dansZones(a) && !fiches[a.id]).sort((a, b) => b.imp - a.imp);
  return [...dus, ...neufs].map((a) => a.id);
}

// Chapitres en travaux : ouverts dès le début, hors du défi du jour, le temps que le cours y arrive.
// En administratif, le bonus TD rejoint le parcours dès que la troisième chambre est ouverte.
export const zonesOuvertes = (ix) => {
  if (etat.reglages.toutOuvert) return ix.zones.map((z) => z.id);
  const o = M().zones.ouvertes;
  const libres = ix.zones.filter((z) => z.travaux).map((z) => z.id);
  if (ix.matiere === 'admin' && o.length >= 3) libres.push(10);
  return [...new Set([...o, ...libres])];
};
export const zonesDuJour = (ix) => {
  const liste = zonesOuvertes(ix).filter((id) => !ix.zones.find((z) => z.id === id).travaux);
  return liste.length ? liste : [ix.zones[0].id];
};

// Dernière chambre du parcours, sans les chapitres en travaux ni le bonus.
const derniereChambre = (ix) => Math.max(...ix.zones.filter((z) => !z.travaux && !z.bonus).map((z) => z.id));
export function ouvrirSuivante(ix) {
  const o = M().zones.ouvertes; const m = Math.max(...o);
  if (m < derniereChambre(ix)) o.push(m + 1);
  sauver(); return m + 1;
}
export const ouvrirApres = (ix, z) => { const o = M().zones.ouvertes; if (!o.includes(z + 1) && z < derniereChambre(ix)) o.push(z + 1); };

export function evaluerTrophees(ix) {
  const t = etat.trophees; const nouveaux = [];
  const gagne = (id) => { if (!t[id]) { t[id] = jour(); nouveaux.push(TROPHEES.find((x) => x.id === id)); } };
  const s = etat.stats;
  if (s.seances >= 1) gagne('premier');
  if (s.parfaites >= 1) gagne('sansfaute');
  if (s.comboMax >= 10) gagne('combo10');
  for (const e of ETAPES_SERIE) if (etat.serie.record >= e) gagne('serie' + e);
  if (ix.matiere === 'admin') {
    const vals = Object.values(etat.arrets);
    if (vals.filter((a) => a.b >= 3).length >= 10) gagne('carte10');
    const grands = vals.filter((a) => a.b >= 5).length;
    if (grands >= 10) gagne('grand10');
    if (grands >= 50) gagne('grand50');
    if (ix.familles.some((f) => f.m.every((m) => niveau(m.id) >= 4))) gagne('jumeaux');
    if (etat.zones.gagnees.length >= 1) gagne('boss1');
    if ((etat.zones.parfaites || []).length >= 1) gagne('bossParfait');
    if ([1, 2, 3, 4, 5, 6, 7, 8, 9].every((z) => etat.zones.gagnees.includes(z))) gagne('bossTous');
  } else {
    const articles = Object.entries(etat.oblig.arrets).filter(([id, a]) => id.startsWith('a') && /^a\d/.test(id) && a.b >= 3);
    if (articles.length >= 30) gagne('art30');
    if (etat.oblig.zones.gagnees.length >= 1) gagne('boss1');
    if (etat.oblig.zones.parfaites.length >= 1) gagne('bossParfait');
  }
  if (s.juge >= 10) gagne('juge10');
  if (s.plan >= 5) gagne('plan5');
  if (s.archi >= 5) gagne('archi5');
  if (s.cas >= 10) gagne('cas10');
  if (s.frise >= 5) gagne('frise5');
  if (rang('admin').i === RANGS.length - 1) gagne('vp');
  if (rang('oblig').i === RANGS_OBLIG.length - 1) gagne('pp');
  if (rangGeneral().i === RANGS_GENERAL.length - 1) gagne('doyen');
  if (etat.gains.jour === jour() && etat.gains.n > 0 && etat.oblig.gains.jour === jour() && etat.oblig.gains.n > 0) gagne('deux');
  if (etat.dunk.record >= 5) gagne('dunk5');
  if (etat.dunk.record >= 25) gagne('dunk25');
  return nouveaux;
}
