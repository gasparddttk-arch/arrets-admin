// Fusion de deux progressions qui ont avancé chacune de leur côté (deux téléphones, un même compte).
// On part de la dernière version commune (base) : ce qu'un seul côté a changé est gardé tel quel ;
// quand les deux ont changé la même valeur, les compteurs additionnent leurs écarts, les records gardent
// le plus haut, les collections (tenues, chambres gagnées…) se réunissent, et pour le reste le côté
// modifié le plus récemment l'emporte.

// Compteurs : chaque côté ajoute (ou retire) sa part. Les jetons dépensés sur un téléphone restent dépensés.
const ADDITIFS = [
  /^xp$/, /^jetons$/, /^(oblig|intro|constit)\.xp$/,
  /^stats\.[a-zA-Z]+$/, /^inv\.[a-zA-Z]+$/, /^dunk\.(parties|paniers)$/,
];
// Records : le plus haut des deux.
const MAXIMUMS = [/^serie\.record$/, /^dunk\.record$/];
// Collections : la réunion des deux.
const ENSEMBLES = [
  /^(themes|insignes|decors)$/, /^chouette\.(tenues|skins)$/,
  /^((oblig|intro|constit)\.)?zones\.(ouvertes|gagnees|parfaites)$/,
  /^((oblig|intro|constit)\.)?parEquipe\.\w+\.zones\.(ouvertes|gagnees|parfaites)$/, /^adminParEquipe\.\w+\.zones\.(ouvertes|gagnees|parfaites)$/,
];

const egal = (a, b) => a === b || JSON.stringify(a) === JSON.stringify(b);
const objet = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const suit = (motifs, chemin) => motifs.some((m) => m.test(chemin));

function fusionner(base, local, distant, chemin, localPlusRecent) {
  if (egal(local, distant)) return local;
  if (egal(local, base)) return distant;
  if (egal(distant, base)) return local;
  // Les deux côtés ont changé cette valeur.
  if (objet(local) && objet(distant)) {
    const b = objet(base) ? base : {};
    const o = {};
    for (const k of new Set([...Object.keys(local), ...Object.keys(distant)])) {
      const v = fusionner(b[k], local[k], distant[k], chemin ? `${chemin}.${k}` : k, localPlusRecent);
      if (v !== undefined) o[k] = v;
    }
    return o;
  }
  if (typeof local === 'number' && typeof distant === 'number') {
    if (suit(ADDITIFS, chemin)) { const b = typeof base === 'number' ? base : 0; return Math.max(0, b + (local - b) + (distant - b)); }
    if (suit(MAXIMUMS, chemin)) return Math.max(local, distant);
  }
  if (Array.isArray(local) && Array.isArray(distant) && suit(ENSEMBLES, chemin)) {
    const vus = new Set(); const o = [];
    for (const v of [...local, ...distant]) { const c = JSON.stringify(v); if (!vus.has(c)) { vus.add(c); o.push(v); } }
    return o;
  }
  return localPlusRecent ? local : distant;
}

// base : dernière version commune ; local, distant : les deux versions actuelles (sans compte ni séance en cours).
export function fusionner3(base, local, distant) {
  const localPlusRecent = (local?.modifie || 0) >= (distant?.modifie || 0);
  const o = fusionner(base, local, distant, '', localPlusRecent);
  o.modifie = Math.max(local?.modifie || 0, distant?.modifie || 0);
  return o;
}
