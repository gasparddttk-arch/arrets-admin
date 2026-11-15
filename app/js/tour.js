// La tour du Palais : une pièce par chambre, du hall (première chambre) à la Cour de cassation (toujours au sommet).
// Les lampes de chaque pièce (positions relatives à l'image) portent la lumière quand la chambre est gagnée.
export const PIECES = ['hall', 'bibliotheque', 'amphi', 'avocat', 'greffe', 'vestiaire', 'instruction', 'scelles', 'audience', 'delibere', 'procureur', 'buvette', 'conseil'];
export const SOMMET = 'cassation';
export const LAMPES = {"amphi": [[0.706, 0.296], [0.9, 0.392], [0.29, 0.476]], "audience": [[0.506, 0.304], [0.705, 0.296], [0.291, 0.462]], "avocat": [[0.705, 0.296], [0.281, 0.485]], "bibliotheque": [[0.567, 0.235], [0.646, 0.686]], "buvette": [[0.704, 0.297], [0.099, 0.389], [0.356, 0.36]], "cassation": [[0.286, 0.239], [0.117, 0.372], [0.686, 0.288], [0.291, 0.457], [0.882, 0.395], [0.073, 0.379], [0.209, 0.186]], "conseil": [[0.705, 0.295], [0.895, 0.457], [0.332, 0.425], [0.506, 0.324], [0.1, 0.421]], "delibere": [[0.711, 0.298], [0.509, 0.328], [0.28, 0.448], [0.407, 0.12]], "greffe": [[0.703, 0.296], [0.341, 0.565], [0.506, 0.244]], "hall": [[0.497, 0.272], [0.098, 0.405], [0.898, 0.406]], "instruction": [[0.693, 0.294], [0.477, 0.335], [0.787, 0.365]], "procureur": [[0.706, 0.297], [0.512, 0.333], [0.416, 0.668]], "scelles": [[0.693, 0.427], [0.407, 0.71]], "vestiaire": [[0.702, 0.3], [0.899, 0.386], [0.503, 0.239], [0.279, 0.461]]};
// Ce qui bouge en plus dans certaines pièces : le feu de la cheminée, la vapeur du café (positions en %).
export const EFFETS = {
  conseil: [['feu', 30.8, 45.5]],
  buvette: [['vapeur', 36.5, 22]],
  avocat: [['vapeur', 41.6, 31]],
};
// La pièce de chaque étage : les premières de la liste, la Cour de cassation en haut.
export const pieceDe = (i, n) => (i === n - 1 ? SOMMET : PIECES[i % PIECES.length]);
