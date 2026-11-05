// Les visuels dessinés en code : sceaux, lauriers, icônes, chat juge, salle d'audience.
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

// Mascotte de la tenue rose : un chat roux en robe de magistrat, dessiné pour cette appli.
export const mascotte = (taille = 190) => svg(`<svg class="mascotte" viewBox="0 0 240 262" width="${taille}" height="${(taille * 262) / 240}" role="img" aria-label="Le chat juge">
  <g class="m-queue"><path d="M66 226c-30 8-52-8-50-34 1-14 18-18 22-6 3 9-7 11-6 21 1 12 16 14 32 8z" fill="#DE9050"/><path d="M19 180c4-7 15-6 19 5l-16 8c-3-3-5-8-3-13z" fill="#B96A31"/></g>
  <path d="M74 150c-18 16-30 50-32 88-1 11 7 20 18 20h120c11 0 19-9 18-20-2-38-14-72-32-88z" fill="url(#gRobe)"/>
  <path d="M92 148l26 44-16 62H60c-3-40 8-84 32-106zM148 148l-26 44 16 62h42c3-40-8-84-32-106z" fill="#fff" fill-opacity=".06"/>
  <path d="M120 164l-17-16-10 8 13 50 14-13 14 13 13-50-10-8z" fill="#FFF8F1"/><path d="M120 193v-24" stroke="#D8C8BC" stroke-width="2"/>
  <g class="m-tete">
    <path d="M60 62 50 12c-1-6 5-9 10-6l44 32zM180 62l10-50c1-6-5-9-10-6l-44 32z" fill="#DE9050"/>
    <path d="M67 50l-7-29 27 20zM173 50l7-29-27 20z" fill="#F8B7B0"/>
    <ellipse cx="120" cy="96" rx="79" ry="64" fill="url(#gFourrure)"/>
    <path d="M120 36v24M100 39l4 21M140 39l-4 21M44 92l20 3M47 110l18-3M196 92l-20 3M193 110l-18-3" stroke="#B96A31" stroke-width="6" stroke-linecap="round"/>
    <ellipse cx="120" cy="125" rx="40" ry="28" fill="#FCE5CF"/>
    <g class="m-yeux">
      <path d="M76 92c7-15 30-15 37 2-9 11-29 11-37-2z" fill="#fff"/><path d="M127 94c7-17 30-17 37-2-8 13-28 13-37 2z" fill="#fff"/>
      <circle cx="95" cy="93" r="11" fill="#3E9B6E"/><circle cx="145" cy="93" r="11" fill="#3E9B6E"/>
      <ellipse cx="95" cy="93" rx="4.500" ry="9.500" fill="#1C2B25"/><ellipse cx="145" cy="93" rx="4.500" ry="9.500" fill="#1C2B25"/>
      <circle cx="99" cy="88" r="3" fill="#fff"/><circle cx="149" cy="88" r="3" fill="#fff"/>
    </g>
    <g class="m-paupieres" fill="#DE9050"><path d="M74 92c7-17 33-17 40 2-9 12-31 12-40-2z"/><path d="M126 94c7-19 33-19 40-2-9 14-31 14-40 2z"/></g>
    <path d="M71 101c2 19 40 19 44 1M125 102c4 18 42 18 44-1M115 102h10" fill="none" stroke="#C78B2B" stroke-width="3.500" stroke-linecap="round"/>
    <path d="M112 118h16l-8 9z" fill="#E4708B"/>
    <path d="M120 127v5c0 8-15 10-20 3M120 132c0 8 15 10 20 3" fill="none" stroke="#7A3B2A" stroke-width="3" stroke-linecap="round"/>
    <path d="M60 122l-34-7M60 134l-34 6M180 122l34-7M180 134l34 6" stroke="#7A3B2A" stroke-opacity=".55" stroke-width="2.200" stroke-linecap="round"/>
  </g>
  <g transform="rotate(-7 120 30)">
    <path d="M84 40l6-37c20-7 42-7 62 0l6 37c-24 7-50 7-74 0z" fill="#3A1830"/>
    <path d="M86 28c22 6 48 6 70 0l2 12c-24 7-50 7-74 0z" fill="#C89A3E"/>
  </g>
  <g class="m-balance">
    <path d="M196 150v82M178 240h36M170 164h52" stroke="#C89A3E" stroke-width="4.500" stroke-linecap="round" fill="none"/>
    <path d="M170 164l-11 26h22zM222 164l-11 26h22z" fill="none" stroke="#C89A3E" stroke-width="2.500"/>
    <path d="M157 190a13 11 0 0 0 26 0zM209 190a13 11 0 0 0 26 0z" fill="#E7BC62"/>
    <ellipse cx="190" cy="218" rx="15" ry="12" fill="#F0B071"/><path d="M180 212v12M188 208v18M197 209v15" stroke="#B96A31" stroke-width="2" stroke-linecap="round"/>
  </g>
</svg>`);

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
