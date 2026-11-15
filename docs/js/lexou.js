// Lexou animé, image par image : chaque animation tient en trois ou quatre planches WebP détourées de 30 images (10 par ligne).
// Une simple image, donc rien que Safari puisse bloquer (pas de lecture automatique, pas de mode économie d'énergie).
// Tant que la planche n'est pas chargée, ou si elle ne peut pas l'être (hors ligne), la chouette fixe reste affichée.
import { h } from './ui.js';

const DOSSIER = 'img/lexou/';
const COLONNES = 10;
const PAR_PLANCHE = 30;
const IPS = 12;
export const ANIMATIONS = {
  lecture: { l: 260, h: 415, images: 120, boucle: true },
  plume: { l: 396, h: 401, images: 120, boucle: true },
  victoire: { l: 469, h: 420, images: 120, boucle: false },
  // Série perdue : Lexou regarde sa montre, s'énerve, puis colle son bec contre l'écran (cadre fixe, gros plan compris).
  colere: { l: 533, h: 480, images: 90, boucle: false, cadre: true },
};

// Charge et décode toutes les planches d'une animation ; rejette si l'une manque (hors ligne).
// Sert au voile de Lexou en colère, qui doit être prêt d'un coup ; lexouAnime, lui, charge au fil de l'eau.
export function prechargerLexou(nom) {
  const def = ANIMATIONS[nom];
  return Promise.all(Array.from({ length: Math.ceil(def.images / PAR_PLANCHE) }, (_, k) => new Promise((ok, ko) => {
    const img = new Image();
    img.onload = () => (img.decode ? img.decode().catch(() => {}) : Promise.resolve()).then(ok);
    img.onerror = ko;
    img.src = `${DOSSIER}${nom}-${k}.webp`;
  })));
}

// taille : le côté du carré occupé par la chouette fixe, que l'animation reprend exactement.
// repli : la chouette fixe, affichée jusqu'au chargement. fin : appelée quand une animation sans boucle s'achève.
// Une animation à cadre fixe (colere) occupe toute la largeur donnée par taille.
export function lexouAnime(nom, { taille = 210, repli, classe = '', fin } = {}) {
  const def = ANIMATIONS[nom];
  // Même place que la chouette fixe : sa silhouette va de 12 % à 89 % de la hauteur du carré (planches recadrées au plus juste).
  let hauteur = Math.round(taille * 0.78);
  let largeur = Math.round(hauteur * def.l / def.h);
  if (largeur > taille || def.cadre) { largeur = taille; hauteur = Math.round(taille * def.h / def.l); }
  const lignes = PAR_PLANCHE / COLONNES;
  const url = (k) => `url(${DOSSIER}${nom}-${k}.webp)`;
  const film = h('div', { class: 'lexou-film', 'aria-hidden': 'true',
    style: `width:${largeur}px;height:${hauteur}px;background-size:${largeur * COLONNES}px ${hauteur * lignes}px` });
  const boite = h('div', { class: `lexou-anime ${classe}`, style: `--taille:${taille}px`, role: 'img', 'aria-label': 'Lexou' }, repli || null, film);

  // Une planche à la fois : on lance dès la première, et chaque planche charge la suivante pendant qu'elle joue.
  // Au plus deux planches décodées en mémoire (sur iPhone, une planche pèse une vingtaine de Mo une fois décodée).
  const planches = Math.ceil(def.images / PAR_PLANCHE);
  const chargees = new Map(); // k -> { img, pret }
  const charger = (k) => {
    if (chargees.has(k)) return chargees.get(k).promesse;
    const img = new Image(); const e = { img, pret: false };
    e.promesse = new Promise((ok, ko) => {
      img.onload = () => (img.decode ? img.decode().catch(() => {}) : Promise.resolve()).then(() => { e.pret = true; ok(); });
      img.onerror = () => { chargees.delete(k); ko(); };
    });
    img.src = `${DOSSIER}${nom}-${k}.webp`;
    chargees.set(k, e);
    return e.promesse;
  };
  const garder = (k) => { const suivante = (k + 1) % planches; for (const c of chargees.keys()) if (c !== k && c !== suivante) chargees.delete(c); };

  charger(0).then(() => {
    boite.classList.add('pret');
    let t0 = null;
    let absent = null;
    let planche = -1;
    let affichee = -1;
    let attente = null; // début d'une attente de la planche suivante
    const tic = (t) => {
      if (!boite.isConnected) {
        // Retiré un instant (Lexou touché au Palais) : on attend son retour quelques secondes, puis on abandonne.
        absent ??= t;
        if (t - absent < 6000) requestAnimationFrame(tic);
        return;
      }
      absent = null;
      if (t0 === null) t0 = t;
      const n = Math.floor((t - t0) / (1000 / IPS));
      const i = def.boucle ? n % def.images : Math.min(n, def.images - 1);
      const k = Math.floor(i / PAR_PLANCHE); const j = i % PAR_PLANCHE;
      if (k !== planche) {
        if (!chargees.get(k)?.pret) {
          // Planche suivante pas encore prête : on reste sur la dernière image et on décale l'horloge d'autant.
          charger(k).catch(() => {});
          attente ??= t;
          requestAnimationFrame(tic);
          return;
        }
        if (attente !== null) { t0 += t - attente; attente = null; requestAnimationFrame(tic); return; }
        film.style.backgroundImage = url(k); planche = k;
        garder(k);
        if (planches > 1) charger((k + 1) % planches).catch(() => {});
      }
      // On ne touche au style que si l'image a changé (12 images par seconde, pas 60).
      if (i !== affichee) { film.style.backgroundPosition = `${-(j % COLONNES) * largeur}px ${-Math.floor(j / COLONNES) * hauteur}px`; affichee = i; }
      if (def.boucle || n < def.images - 1) requestAnimationFrame(tic);
      else fin?.();
    };
    requestAnimationFrame(tic);
  }).catch(() => {}); // hors ligne : la chouette fixe reste
  return boite;
}
