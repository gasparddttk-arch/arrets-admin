// Lexou animé, image par image : chaque animation est une planche WebP détourée (10 images par ligne).
// Une simple image, donc rien que Safari puisse bloquer (pas de lecture automatique, pas de mode économie d'énergie).
// Tant que la planche n'est pas chargée, ou si elle ne peut pas l'être (hors ligne), la chouette fixe reste affichée.
import { h } from './ui.js';

const DOSSIER = 'img/lexou/';
const COLONNES = 10;
const IPS = 12;
export const ANIMATIONS = {
  lecture: { l: 174, h: 274, images: 120, boucle: true },
  plume: { l: 262, h: 268, images: 120, boucle: true },
  victoire: { l: 309, h: 277, images: 120, boucle: false },
};

// taille : le côté du carré occupé par la chouette fixe, que l'animation reprend exactement.
// repli : la chouette fixe, affichée jusqu'au chargement.
export function lexouAnime(nom, { taille = 210, repli, classe = '' } = {}) {
  const def = ANIMATIONS[nom];
  // Même place que la chouette fixe : sa silhouette va de 12 % à 89 % de la hauteur du carré (planches recadrées au plus juste).
  let hauteur = Math.round(taille * 0.78);
  let largeur = Math.round(hauteur * def.l / def.h);
  if (largeur > taille) { largeur = taille; hauteur = Math.round(taille * def.h / def.l); }
  const lignes = Math.ceil(def.images / COLONNES);
  const film = h('div', { class: 'lexou-film', 'aria-hidden': 'true',
    style: `width:${largeur}px;height:${hauteur}px;background-image:url(${DOSSIER}${nom}.webp);background-size:${largeur * COLONNES}px ${hauteur * lignes}px` });
  const boite = h('div', { class: `lexou-anime ${classe}`, style: `--taille:${taille}px`, role: 'img', 'aria-label': 'Lexou' }, repli || null, film);

  const img = new Image();
  img.decoding = 'async';
  img.onload = () => {
    boite.classList.add('pret');
    let i = 0;
    let t0 = null;
    let absent = null;
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
      i = def.boucle ? n % def.images : Math.min(n, def.images - 1);
      film.style.backgroundPosition = `${-(i % COLONNES) * largeur}px ${-Math.floor(i / COLONNES) * hauteur}px`;
      if (def.boucle || n < def.images - 1) requestAnimationFrame(tic);
    };
    requestAnimationFrame(tic);
  };
  img.src = `${DOSSIER}${nom}.webp`;
  return boite;
}
