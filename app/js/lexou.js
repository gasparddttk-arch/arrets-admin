// Lexou animé, image par image : chaque animation tient en quatre planches WebP détourées de 30 images (10 par ligne).
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
};

// taille : le côté du carré occupé par la chouette fixe, que l'animation reprend exactement.
// repli : la chouette fixe, affichée jusqu'au chargement.
export function lexouAnime(nom, { taille = 210, repli, classe = '' } = {}) {
  const def = ANIMATIONS[nom];
  // Même place que la chouette fixe : sa silhouette va de 12 % à 89 % de la hauteur du carré (planches recadrées au plus juste).
  let hauteur = Math.round(taille * 0.78);
  let largeur = Math.round(hauteur * def.l / def.h);
  if (largeur > taille) { largeur = taille; hauteur = Math.round(taille * def.h / def.l); }
  const lignes = PAR_PLANCHE / COLONNES;
  const planches = Math.ceil(def.images / PAR_PLANCHE);
  const url = (k) => `url(${DOSSIER}${nom}-${k}.webp)`;
  const film = h('div', { class: 'lexou-film', 'aria-hidden': 'true',
    style: `width:${largeur}px;height:${hauteur}px;background-size:${largeur * COLONNES}px ${hauteur * lignes}px` });
  const boite = h('div', { class: `lexou-anime ${classe}`, style: `--taille:${taille}px`, role: 'img', 'aria-label': 'Lexou' }, repli || null, film);

  // On attend les quatre planches avant de lancer : pas de trou au passage de l'une à l'autre.
  Promise.all(Array.from({ length: planches }, (_, k) => new Promise((ok, ko) => {
    const img = new Image();
    img.onload = () => (img.decode ? img.decode().catch(() => {}) : Promise.resolve()).then(ok);
    img.onerror = ko;
    img.src = `${DOSSIER}${nom}-${k}.webp`;
  }))).then(() => {
    boite.classList.add('pret');
    let t0 = null;
    let absent = null;
    let planche = -1;
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
      if (k !== planche) { film.style.backgroundImage = url(k); planche = k; }
      film.style.backgroundPosition = `${-(j % COLONNES) * largeur}px ${-Math.floor(j / COLONNES) * hauteur}px`;
      if (def.boucle || n < def.images - 1) requestAnimationFrame(tic);
    };
    requestAnimationFrame(tic);
  }).catch(() => {}); // hors ligne : la chouette fixe reste
  return boite;
}
