// Les visuels dessinés en code : sceaux, lauriers, icônes, salle d'audience.
import { h, svg } from './ui.js';

// Contour de cire : un cercle festonné, comme un cachet pressé à la main.
const CIRE = (() => {
  const p = [];
  for (let i = 0; i < 200; i++) {
    const a = (i / 200) * Math.PI * 2;
    const r = 44.5 + 2.7 * Math.cos(a * 11);
    p.push(`${(50 + r * Math.cos(a)).toFixed(2)} ${(50 + r * Math.sin(a)).toFixed(2)}`);
  }
  return `M${p.join('L')}Z`;
})();

function feuilles(rayon = 54, ep = 2.5, long = 6.8) {
  let d = '';
  for (let i = 0; i < 13; i++) {
    const deg = 100 + i * 12.2; const r = (deg * Math.PI) / 180;
    const x = 60 + rayon * Math.cos(r); const y = 60 + rayon * Math.sin(r);
    const taille = long - i * 0.17;
    d += `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="${ep}" ry="${taille.toFixed(1)}" transform="rotate(${deg + 24} ${x.toFixed(1)} ${y.toFixed(1)})"/>`;
    d += `<ellipse cx="${(120 - x).toFixed(1)}" cy="${y.toFixed(1)}" rx="${ep}" ry="${taille.toFixed(1)}" transform="rotate(${-(deg + 24)} ${(120 - x).toFixed(1)} ${y.toFixed(1)})"/>`;
  }
  return d;
}

export function sceau(n, { taille = 150, lauriers = true, eteint = false, legende = '' } = {}) {
  const chiffres = String(n).length;
  const fs = chiffres >= 3 ? 33 : chiffres === 2 ? 42 : 50;
  return svg(`<svg class="sceau" viewBox="0 0 120 120" width="${taille}" height="${taille}" role="img" aria-label="${legende || `Série de ${n} jours`}">
    ${lauriers ? `<g fill="url(#gOr)">${feuilles()}</g>` : ''}
    <g transform="translate(14 14) scale(.92)">
      <path d="${CIRE}" fill="#000" opacity=".28" transform="translate(0 2.500)"/>
      <path d="${CIRE}" fill="url(#${eteint ? 'gEteint' : 'gCire'})"/>
      <path d="${CIRE}" fill="none" stroke="#fff" stroke-opacity=".34" stroke-width="1.100" transform="translate(50 50) scale(.84) translate(-50 -50)"/>
      <text x="50" y="${50 + fs * 0.34}" text-anchor="middle" font-family="EB Garamond, Georgia, serif" font-weight="700" font-size="${fs}" fill="#fff">${n}</text>
    </g></svg>`);
}

export const petitSceau = (etatJour, lettre) => h('span', { class: `jour-sceau ${etatJour || ''}`, 'aria-label': lettre }, lettre);

// Grand laurier : deux branches ouvertes vers le haut, aux feuilles bien détachées.
function branches() {
  let d = '';
  for (let i = 0; i < 7; i++) {
    const deg = 106 + i * 21; const r = (deg * Math.PI) / 180;
    const x = 60 + 43 * Math.cos(r); const y = 60 + 43 * Math.sin(r);
    const long = 14.5 - i * 0.75; const large = 6.2 - i * 0.28;
    const incl = deg + 36;
    const feuille = (cx, sens) => `<path transform="translate(${cx.toFixed(1)} ${y.toFixed(1)}) rotate(${sens * incl})" d="M0 ${-long}C${large} ${-long * 0.45} ${large} ${long * 0.45} 0 ${long}C${-large} ${long * 0.45} ${-large} ${-long * 0.45} 0 ${-long}Z"/>`;
    d += feuille(x, 1) + feuille(120 - x, -1);
  }
  return d;
}
export const laurier = (taille = 40) => svg(`<svg class="laurier" viewBox="0 0 120 120" width="${taille}" height="${taille}" aria-hidden="true"><path d="M60 106C30 104 15 82 15 60c0-14 6-26 16-35M60 106c30-2 45-24 45-46 0-14-6-26-16-35" fill="none" stroke="url(#gOr)" stroke-width="1.800"/><g fill="url(#gOr)">${branches()}</g></svg>`);

const I = {
  palais: '<path d="M3 10 12 4l9 6M5 10v9M9.500 10v9M14.500 10v9M19 10v9M3 20h18"/>',
  carte: '<path d="M6 21c0-4 4-4 6-6s6-2 6-6a3 3 0 1 0-6 0"/><circle cx="6" cy="21" r="1"/><circle cx="15" cy="9" r="1"/>',
  arrets: '<path d="M5 4h11l3 3v13H5zM9 10h6M9 14h6"/>',
  boutique: '<circle cx="12" cy="12" r="8.500"/><path d="M12 7.500v9M9.500 9.500h3.700a1.800 1.800 0 0 1 0 3.600h-2.400a1.800 1.800 0 0 0 0 3.500h3.700"/>',
  profil: '<circle cx="12" cy="8" r="4"/><path d="M4.500 21c1-5 4-7 7.500-7s6.500 2 7.500 7"/>',
  paires: '<rect x="3.500" y="6" width="9.500" height="13.500" rx="1.800" transform="rotate(-9 8 12)"/><rect x="10.500" y="4.500" width="9.500" height="13.500" rx="1.800" transform="rotate(8 15 11)"/><path d="M13.500 12.500a2.200 2.200 0 0 1 3.100 0M15 10.500a2.200 2.200 0 0 0-3.100 0"/>',
  puzzle: '<path d="M5 8h4a2.300 2.300 0 1 1 4 0h5v4a2.300 2.300 0 1 0 0 4v4H5z"/>',
  juge: '<path d="M12 3v18M6 21h12M4 7h16M7 7l-3 7a3.500 3.500 0 0 0 6 0zM17 7l-3 7a3.500 3.500 0 0 0 6 0z"/>',
  plan: '<path d="M5 5h14M9 10h10M9 14h10M5 19h14"/><path d="M5 10v4"/>',
  architecte: '<path d="M4 20h16M6 20V9M12 20V9M18 20V9M3 9h18L12 3z"/>',
  cas: '<path d="M6 3h9l4 4v14H6zM15 3v4h4M9 12h7M9 16h5"/><path d="m9 8 1.200 1.200L12.500 7"/>',
  qualif: '<path d="M4 7h7M4 12h7M4 17h7"/><path d="M14 7c3 0 3 5 6 5M14 17c3 0 3-5 6-5"/>',
  remede: '<path d="M12 3 5 6v6c0 4 3 7 7 9 4-2 7-5 7-9V6z"/><path d="M12 9v6M9 12h6"/>',
  frise: '<path d="M3 12h18"/><circle cx="6.500" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="17.500" cy="12" r="2"/><path d="M6.500 8V5M12 19v-3M17.500 8V5"/>',
  dunk: '<circle cx="12" cy="12" r="8.500"/><path d="M3.500 12h17M12 3.500v17M6 6c3 3 3 9 0 12M18 6c-3 3-3 9 0 12"/>',
  travaux: '<path d="m12 4 9 16H3zM12 10v4M12 17v.500"/>',
  equipe: '<circle cx="9" cy="9" r="3.500"/><circle cx="17" cy="10" r="2.800"/><path d="M3 20c.6-4 3-6 6-6s5.400 2 6 6M16 14.500c2.600 0 4.400 1.800 5 5"/>',
  matieres: '<path d="M7 4 3 8l4 4M3 8h13M17 12l4 4-4 4M21 16H8"/>',
  fermer: '<path d="m6 6 12 12M18 6 6 18"/>',
  retour: '<path d="M15 5 8 12l7 7"/>',
  cadenas: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  coeur: '<path d="M12 20S4 15 4 9a4 4 0 0 1 8-1 4 4 0 0 1 8 1c0 6-8 11-8 11z" fill="currentColor"/>',
  defi: '<path d="M12 3v6l4 2"/><circle cx="12" cy="12" r="9"/>',
  sursis: '<path d="M12 3 5 6v6c0 4 3 7 7 9 4-2 7-5 7-9V6z"/>',
  recusation: '<circle cx="12" cy="12" r="8.500"/><path d="m6 6 12 12"/>',
  indice: '<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3 11c.8.6 1 1.300 1 2h4c0-.7.2-1.400 1-2a6 6 0 0 0-3-11z"/>',
  prorogation: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l3 2M9 2h6"/>',
  passe: '<circle cx="8" cy="12" r="4"/><path d="M12 12h9M18 12v3M21 12v2"/>',
  plume: '<path d="M20 4c-7 0-13 5-14 13l-2 3 3-1c8-1 13-7 13-15zM7 17 15 9"/>',
  balance: '<path d="M12 3v18M6 21h12M4 7h16M7 7l-3 7a3.500 3.500 0 0 0 6 0zM17 7l-3 7a3.500 3.500 0 0 0 6 0z"/>',
  colonne: '<path d="M6 21h12M8 21V8M16 21V8M12 21V8M5 8h14M6 5h12"/>',
  laurier: '<path d="M12 21c-5-2-8-6-8-12M12 21c5-2 8-6 8-12M6 11l-3-1M7 15l-3 1M18 11l3-1M17 15l3 1M12 4v4"/>',
  reprendre: '<path d="M8 5v14l11-7z"/>',
  loupe: '<circle cx="11" cy="11" r="6.500"/><path d="m16 16 4.500 4.500"/>',
  note: '<path d="M6 3h9l4 4v14H6zM15 3v4h4M9 12h7M9 16h7"/>',
  crayon: '<path d="M4 20l1-4L16 5l3 3L8 19zM14 7l3 3"/>',
  juste: '<path d="m5 13 4.500 4.500L19 7"/>',
  faux: '<path d="m6.500 6.500 11 11M17.500 6.500l-11 11"/>',
  chevron: '<path d="m6 9 6 6 6-6"/>',
  ecarter: '<path d="M5 7h14M9 7V4h6v3M7 7l1 13h8l1-13"/>',
  plusTard: '<path d="M5 12a7 7 0 1 1 2.200 5.100M5 12l-2-2.500M5 12l2.500-2"/>',
  image: '<rect x="3.500" y="5" width="17" height="14" rx="2"/><circle cx="9" cy="10" r="1.700"/><path d="m4 17 5-4 3.500 2.500L16 12l4.500 4"/>',
  son: '<path d="M4 10v4h4l5 4V6L8 10zM16 9a4 4 0 0 1 0 6M18.500 6.500a8 8 0 0 1 0 11"/>',
};
export const icone = (nom, taille = 24) => svg(`<svg class="ic" viewBox="0 0 24 24" width="${taille}" height="${taille}" fill="none" stroke="currentColor" stroke-width="1.700" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${I[nom] || ''}</svg>`);

// Médaille de trophée : le métal dépend du trophée, le cadenas disparaît quand il est gagné.
export const medaille = (metal, gagne) => h('span', { class: `medaille ${metal} ${gagne ? 'gagnee' : ''}`, 'aria-hidden': 'true' }, laurier(52), icone(gagne ? 'juste' : 'cadenas', 20));

// Le marteau du président.
export const marteau = () => svg(`<svg class="marteau" viewBox="0 0 96 86" width="82" height="74" aria-hidden="true">
  <ellipse cx="62" cy="76" rx="30" ry="7" fill="url(#gBanc)" stroke="url(#gOr)" stroke-width="1.500"/>
  <g class="marteau-tete">
    <path d="M38 37 8 67" stroke="url(#gOr)" stroke-width="6" stroke-linecap="round"/>
    <g transform="rotate(45 45 30)"><rect x="24" y="17" width="42" height="27" rx="5" fill="url(#gBanc)" stroke="url(#gOr)" stroke-width="2"/><rect x="32" y="15" width="6" height="31" rx="2" fill="url(#gOr)"/><rect x="52" y="15" width="6" height="31" rx="2" fill="url(#gOr)"/></g>
  </g>
</svg>`);

// La salle d'audience : tribune, colonnes et balance, en silhouettes pour laisser le texte respirer.
export const salleAudience = () => svg(`<svg class="salle-audience" viewBox="0 0 390 300" preserveAspectRatio="xMidYMin slice" aria-hidden="true">
  <rect width="390" height="300" fill="url(#gMur)"/>
  <path d="M195-20 40 300h60L195-20l95 320h60z" fill="#fff" fill-opacity=".035"/>
  <path d="M112 300V112a83 83 0 0 1 166 0v188z" fill="#fff" fill-opacity=".045"/>
  <path d="M0 58 195 6l195 52z" fill="none" stroke="url(#gOr)" stroke-width="1.500" stroke-opacity=".55"/>
  <path d="M0 66h390" stroke="url(#gOr)" stroke-width="1" stroke-opacity=".4"/>
  <g class="colonnes" stroke="url(#gOr)" stroke-opacity=".45" fill="#fff" fill-opacity=".04">
    <path d="M22 86h44v214H22zM16 74h56v12H16zM324 86h44v214h-44zM318 74h56v12h-56z"/>
    <path d="M33 86v214M44 86v214M55 86v214M335 86v214M346 86v214M357 86v214" fill="none"/>
  </g>
  <g stroke="url(#gOr)" fill="none" stroke-linecap="round" stroke-width="2" transform="translate(160 42) scale(1.450)">
    <path d="M24 2v42M12 44h24M6 12h36M6 12 0 28h12zM42 12l-6 16h12z"/>
    <path d="M0 28a6 5 0 0 0 12 0M36 28a6 5 0 0 0 12 0" fill="url(#gOr)" fill-opacity=".5"/>
  </g>
  <g fill="#000" fill-opacity=".28">
    <path d="M108 146v-30c0-8 8-12 16-12s16 4 16 12v30zM250 146v-30c0-8 8-12 16-12s16 4 16 12v30z"/>
    <path d="M172 146v-34c0-8 10-13 23-13s23 5 23 13v34z" fill-opacity=".36"/>
  </g>
  <rect x="0" y="146" width="390" height="154" fill="url(#gBanc)"/>
  <path d="M0 146h390" stroke="url(#gOr)" stroke-width="2.500"/>
  <path d="M0 156h390" stroke="url(#gOr)" stroke-width=".8" stroke-opacity=".5"/>
</svg>`);
