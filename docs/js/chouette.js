// La chouette : ses poses, ses tenues, et les moments où elle paraît.
// Elle arrive avant ou après une question, jamais pendant, et un appui passe toujours l'animation.
import { h, svg, effets, attendre, estRose } from './ui.js';
import { etat } from './state.js';
import { images } from './images.js';
import { REPERES, RAPPORTS } from './chouette-reperes.js';

// Une pose par exercice, pour varier le plus possible.
export const POSE_MODE = {
  defi: 'tribune', express: 'pause', zone: 'assise', boss: 'marteau', reprise: 'debout', dunk: 'clin',
  paires: 'reflexion', puzzle: 'piles', juge: 'marteau', plan: 'notes', architecte: 'tableau',
  cas: 'serment', qualif: 'lunettes', remede: 'balance', frise: 'echelle',
};

export const TENUES = [
  { id: 'lunettes', nom: 'Lunettes rondes', prix: 120, place: 'visage', txt: 'Pour relire les attendus de près' },
  { id: 'toque', nom: 'Toque d’avocat', prix: 180, place: 'tete', txt: 'La coiffe de l’audience' },
  { id: 'laurier', nom: 'Couronne de laurier', prix: 250, place: 'tete', txt: 'Pour les grands arrêts' },
  { id: 'epitoge', nom: 'Épitoge à hermine', prix: 250, place: 'buste', txt: 'Sur l’épaule gauche, comme à la barre' },
  { id: 'robe', nom: 'Robe rouge', prix: 400, place: 'robe', txt: 'Celle des conseillers à la Cour de cassation' },
];

// Les skins remplacent la chouette au Palais et dans l'aperçu de la boutique, nulle part ailleurs.
export const SKINS = [
  { id: 'six-sept', nom: 'Hibou 6-7', prix: 500, legendaire: true, anime: true, txt: 'Six, sept, six, sept. Le seul skin qui bouge.' },
  { id: 'goumin', nom: 'Goumin', prix: 200, txt: 'Il garde la photo. Il garde aussi la moitié du cœur.' },
  { id: 'survet', nom: 'Le Survêt', prix: 200, txt: 'Survêt, chaîne et baskets à bulles.' },
  { id: 'bosslady', nom: 'Boss Lady', prix: 200, txt: 'Les paillettes d’abord, le plan en deux parties ensuite.' },
  { id: 'loco', nom: 'Hibou Loco', prix: 200, txt: 'Il a relu tout le cours en une nuit.' },
  { id: 'nana', nom: 'Sexy Nana', prix: 200, txt: 'Lunettes noires, sac à main, aucune question.' },
  { id: 'alcoolique', nom: 'Hibou Alcoolique', prix: 200, txt: 'Une canette après le partiel. Puis une autre.' },
  { id: 'tung', nom: 'Tung Tung Lexou', prix: 200, txt: 'Tung, tung, tung. Lexou sort de son tronc pour réviser.' },
  { id: 'noel', nom: 'Noël', prix: 200, txt: 'Les guirlandes aux yeux, et les partiels à la rentrée.' },
];

const DOSSIER = 'img/chouette/';
const calque = (nom, classe = '') => h('img', { class: `calque ${classe}`, src: `${DOSSIER}${nom}.webp`, alt: '', draggable: 'false', decoding: 'async' });
const YEUX_DEFAUT = REPERES.debout.yeux;
const yeuxDe = (pose) => (REPERES[pose].yeux.length === 2 ? REPERES[pose].yeux : YEUX_DEFAUT);

// Place un accessoire à partir des yeux : il suit la tête quelle que soit la pose.
function repereTete(pose) {
  const [a, b] = yeuxDe(pose);
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, e: (b.x - a.x) / 206 };
}
const pc = (v) => `${(v / 10).toFixed(2)}%`;
function accessoire(pose, id) {
  const { x, y, e } = repereTete(pose);
  const cadre = (fichier, largeur, gauche, haut) => {
    const el = calque(`acc-${fichier}`, `acc acc-${id}`);
    el.style.cssText = `left:${pc(gauche)};top:${pc(haut)};width:${pc(largeur)}`;
    return el;
  };
  if (id === 'toque') { const l = 330 * e; return cadre('toque', l, x - l / 2, y - 134 * e - l * RAPPORTS.toque); }
  if (id === 'lunettes') { const l = 397 * e; return cadre('lun_acc', l, x - l / 2, y - (l * RAPPORTS.lun_acc) / 2 - 1 * e); }
  if (id === 'laurier') { const l = 640 * e; return cadre('laurier', l, x - l / 2, y - 327 * e); }
  const b = EPITOGE[pose]; if (!b) return null;
  const l = (b[2] ?? 104) * e;
  const el = cadre('epitoge', l, x + b[0] * e, y + b[1] * e);
  if (b[3]) el.style.transform = `rotate(${b[3]}deg)`;
  return el;
}
// Décalage depuis les yeux, largeur, inclinaison. Pose absente : l'épitoge serait cachée.
const EPITOGE = {
  debout: [96, 104, 118, -7], clin: [96, 104, 118, -7], reflexion: [96, 104, 118, -7], lunettes: [96, 104, 118, -7],
  balance: [96, 104, 118, -7], serment: [92, 112, 112, 2], assise: [96, 104, 118, -7], pause: [104, 104, 118, -7],
  piles: [112, 102, 108, -9], marteau: [112, 96, 104, -9], notes: [116, 92, 100, -9], tribune: [98, 112, 104, 0], tableau: [84, 128, 112, -4],
};

function paupieres(pose) {
  const r = REPERES[pose];
  if (r.yeux.length !== 2 || pose === 'lunettes') return null;
  const dessin = r.yeux.map((o) => `<ellipse cx="${o.x}" cy="${o.y}" rx="${o.rx + 5}" ry="${o.ry + 5}" fill="${r.peau}"/><path d="M${o.x - o.rx * 0.72} ${o.y + 8}q${o.rx * 0.72} ${-o.ry * 0.62} ${o.rx * 1.44} 0" fill="none" stroke="#45403b" stroke-width="${Math.max(9, o.rx * 0.17)}" stroke-linecap="round"/>`).join('');
  return svg(`<svg class="paupieres" viewBox="0 0 1000 1000" aria-hidden="true">${dessin}</svg>`);
}

// Fait cligner la chouette tant qu'elle est à l'écran.
function faireCligner(el) {
  const pas = () => {
    if (!el.isConnected) return;
    el.classList.add('cligne');
    setTimeout(() => { el.classList.remove('cligne'); setTimeout(pas, 3200 + Math.random() * 5200); }, 150);
  };
  setTimeout(pas, 1400 + Math.random() * 2600);
}

export function chouette(pose = 'debout', { taille = 180, tenue = true, porte = null, vivante = false, classe = '', alt = 'Lexou en robe' } = {}) {
  const style = `--taille:${taille}px`;
  if (images.mascotte) return h('div', { class: `chouette perso ${classe}`, style }, h('img', { class: 'mascotte-perso', src: images.mascotte, alt: 'Ta mascotte', draggable: 'false' }));
  const r = REPERES[pose];
  const habits = porte || (tenue ? etat.chouette.porte : {});
  const el = h('div', { class: `chouette pose-${pose} ${classe}`, style, role: 'img', 'aria-label': alt, 'data-pose': pose },
    habits.tete === 'laurier' ? accessoire(pose, 'laurier') : null,
    calque(pose),
    habits.robe === 'robe' ? calque(`${pose}-robe`) : null,
    r.livre && estRose() ? calque(`${pose}-livre`) : null,
    paupieres(pose),
    habits.buste === 'epitoge' ? accessoire(pose, 'epitoge') : null,
    habits.tete === 'toque' ? accessoire(pose, 'toque') : null,
    habits.visage === 'lunettes' && pose !== 'lunettes' ? accessoire(pose, 'lunettes') : null);
  if (vivante && effets()) faireCligner(el);
  return el;
}

const imageSkin = (nom, classe = '') => h('img', { class: `calque ${classe}`, src: `img/skins/${nom}.webp`, alt: '', draggable: 'false', decoding: 'sync' });

// Le skin porté au Palais. L'image personnelle choisie dans Profil garde la priorité.
export function skinPorte() {
  const c = etat.chouette;
  return !images.mascotte && c.skins.includes(c.skin) && SKINS.some((s) => s.id === c.skin) ? c.skin : null;
}

export function hibouSkin(id, { taille = 236, classe = '', danse = false } = {}) {
  const s = SKINS.find((x) => x.id === id);
  const el = h('div', { class: `chouette skin ${classe}`, style: `--taille:${taille}px`, role: 'img', 'aria-label': s.nom, 'data-skin': id },
    s.anime ? [imageSkin('67-gauche', 'bras-gauche'), imageSkin('67-droite', 'bras-droit'), imageSkin('67-deux', 'bras-leves')] : imageSkin(id));
  if (s.anime && danse) danser(el);
  return el;
}

// Trois allers-retours, puis les deux bras levés.
export const DUREE_DANSE = 2000;
export function danser(el) {
  if (!effets()) return;
  clearTimeout(el.finDanse);
  el.classList.remove('danse');
  void el.offsetWidth;
  el.classList.add('danse');
  el.finDanse = setTimeout(() => el.classList.remove('danse'), DUREE_DANSE);
}

// Les images arrivent du cache : les décoder d'avance évite tout clignotement à l'ouverture des portes.
export function precharger() {
  const faire = () => Object.keys(REPERES).forEach((p) => { const i = new Image(); i.src = `${DOSSIER}${p}.webp`; i.decode?.().catch(() => {}); });
  if (window.requestIdleCallback) requestIdleCallback(faire, { timeout: 2500 }); else setTimeout(faire, 800);
}

// LES PORTES DU PALAIS ------------------------------------------------------------
// Une seule fois, en début de séance. `pret` se résout portes fermées : c'est le moment de préparer l'écran.
export function portes({ pose = 'debout', titre = '', sonFerme = null }) {
  if (!effets()) return { pret: Promise.resolve(), ouvrir() {} };
  const v = h('div', { class: 'palais-portes', role: 'status', 'aria-label': titre },
    h('div', { class: 'battant gauche' }), h('div', { class: 'battant droite' }),
    h('div', { class: 'portes-centre' }, chouette(pose, { taille: 260 }), titre ? h('p', {}, titre) : null));
  document.body.append(v);
  let passer;
  const appui = new Promise((ok) => { passer = ok; });
  v.addEventListener('click', passer);
  requestAnimationFrame(() => requestAnimationFrame(() => v.classList.add('ferme')));
  const pret = (async () => {
    await attendre(250);
    sonFerme?.();
    await Promise.race([attendre(420), appui]);
  })();
  return {
    pret,
    ouvrir() {
      v.classList.add('ouvre');
      setTimeout(() => v.remove(), 340);
    },
  };
}

// RÉACTIONS ---------------------------------------------------------------------
const PHRASES = {
  bien: ['Bien jugé', 'Moyen fondé', 'Arrêt confirmé', 'Belle motivation'],
  moyen: ['Presque', 'Un point à revoir', 'Relis la fiche, tu y es'],
  rate: ['On y retourne ?', 'Partie remise', 'La prochaine sera la bonne'],
};
const auHasard = (l) => l[Math.floor(Math.random() * l.length)];

// Fin d'une épreuve : le clin d'œil pour une réussite, le livre pour un résultat moyen, la montre pour un échec.
export function reagir(score) {
  if (!effets()) return Promise.resolve();
  const niveau = score >= 0.8 ? 'bien' : score >= 0.4 ? 'moyen' : 'rate';
  const pose = { bien: 'clin', moyen: 'piles', rate: 'pause' }[niveau];
  const v = h('div', { class: `reaction ${niveau}`, role: 'status' },
    h('p', { class: 'bulle' }, auHasard(PHRASES[niveau])),
    chouette(pose, { taille: 230 }));
  document.body.append(v);
  return new Promise((ok) => {
    const fin = () => { v.remove(); ok(); };
    v.addEventListener('click', fin);
    setTimeout(fin, niveau === 'bien' ? 1000 : 800);
  });
}

// Pluie de plumes pour les grandes victoires et les chambres ouvertes.
export function plumes(n = 18) {
  if (!effets()) return;
  const v = h('div', { class: 'plumes', 'aria-hidden': 'true' }, Array.from({ length: n }, () => h('i', {
    style: `left:${(Math.random() * 100).toFixed(1)}%;--d:${(Math.random() * 0.8).toFixed(2)}s;--t:${(1.1 + Math.random() * 0.7).toFixed(2)}s;--r:${Math.round(Math.random() * 360)}deg;--x:${Math.round((Math.random() - 0.5) * 70)}px;--s:${(0.7 + Math.random() * 0.7).toFixed(2)}`,
  })));
  document.body.append(v);
  setTimeout(() => v.remove(), 2800);
}

// Le code qui s'envole depuis la tribune.
export function codeEnvole() {
  return svg('<svg class="code-envole" viewBox="0 0 60 76" aria-hidden="true"><rect x="4" y="4" width="52" height="68" rx="4" fill="var(--livre)"/><rect x="4" y="4" width="9" height="68" rx="3" fill="#000" opacity=".22"/><rect x="18" y="26" width="30" height="4" rx="2" fill="#fff" opacity=".85"/><rect x="18" y="36" width="24" height="4" rx="2" fill="#fff" opacity=".85"/></svg>');
}

// Achat en boutique : un coup de marteau sur le reçu.
export function adjuge() {
  if (!effets()) return;
  document.querySelector('.adjuge')?.remove();
  const v = h('div', { class: 'adjuge', 'aria-hidden': 'true' }, chouette('marteau', { taille: 150 }), h('span', { class: 'cachet' }, 'Adjugé'));
  document.body.append(v);
  setTimeout(() => v.remove(), 950);
}
