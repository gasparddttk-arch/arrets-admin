// Petits outils d'interface : création d'éléments, sons, sceaux, icônes, confettis.
import { etat } from './state.js';

export function h(tag, attrs = {}, ...enfants) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v === null || v === undefined || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'style') el.style.cssText = v;
    else if (k.startsWith('on')) el.addEventListener(k.slice(2).toLowerCase(), v);
    else if (k === 'html') el.innerHTML = v;
    else el.setAttribute(k, v === true ? '' : v);
  }
  ajouter(el, enfants);
  return el;
}
function ajouter(el, enfants) {
  for (const e of enfants.flat(Infinity)) {
    if (e === null || e === undefined || e === false) continue;
    el.append(e.nodeType ? e : document.createTextNode(String(e)));
  }
}
export const svg = (markup) => { const t = document.createElement('template'); t.innerHTML = markup.trim(); return t.content.firstChild; };

// Sons synthétisés : aucun fichier à télécharger, donc disponibles hors ligne.
let ctxAudio = null;
export function reveillerAudio() {
  try {
    ctxAudio = ctxAudio || new (window.AudioContext || window.webkitAudioContext)();
    if (ctxAudio.state === 'suspended') ctxAudio.resume();
  } catch { ctxAudio = null; }
}
function note(f, t, d, type = 'sine', v = 0.12) {
  const o = ctxAudio.createOscillator(); const g = ctxAudio.createGain();
  o.type = type; o.frequency.value = f;
  g.gain.setValueAtTime(0, ctxAudio.currentTime + t);
  g.gain.linearRampToValueAtTime(v, ctxAudio.currentTime + t + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0008, ctxAudio.currentTime + t + d);
  o.connect(g).connect(ctxAudio.destination);
  o.start(ctxAudio.currentTime + t); o.stop(ctxAudio.currentTime + t + d + 0.03);
}
export function son(nom) {
  if (!etat.reglages.son || !ctxAudio) return;
  try {
    if (nom === 'tap') note(660, 0, 0.05, 'triangle', 0.05);
    if (nom === 'ok') { note(587, 0, 0.14, 'triangle'); note(880, 0.07, 0.2, 'triangle'); }
    if (nom === 'ko') { note(196, 0, 0.2, 'sawtooth', 0.05); note(147, 0.08, 0.26, 'sawtooth', 0.05); }
    if (nom === 'combo') { [659, 784, 988, 1319].forEach((f, i) => note(f, i * 0.055, 0.17, 'triangle', 0.09)); }
    if (nom === 'sceau') { note(92, 0, 0.3, 'sine', 0.42); note(61, 0.02, 0.42, 'sine', 0.42); note(1500, 0.01, 0.03, 'square', 0.03); }
    if (nom === 'grade') { [523, 659, 784, 1047, 1319].forEach((f, i) => note(f, i * 0.09, 0.42, 'triangle', 0.1)); }
    if (nom === 'jeton') { note(1760, 0, 0.09, 'sine', 0.06); note(2349, 0.05, 0.14, 'sine', 0.06); }
  } catch { /* le son reste facultatif */ }
}

// Sceau de cire : forme irrégulière dessinée à la main, entourée de lauriers.
const CIRE = 'M50 3c7-1 10 3 16 5 7 2 13 1 17 7 4 5 2 11 5 16 3 6 9 9 9 17s-5 12-7 18c-2 7 0 13-5 18-5 5-12 3-18 6-6 3-9 8-17 8s-11-5-17-8c-6-3-13-1-18-6-5-5-3-11-5-18C8 60 3 56 3 48s6-11 9-17c3-5 1-11 5-16 4-6 10-5 17-7 6-2 9-6 16-5z';
function feuilles() {
  let d = '';
  for (let i = 0; i < 13; i++) {
    const deg = 102 + i * 12; const r = deg * Math.PI / 180;
    const x = 60 + 54 * Math.cos(r); const y = 60 + 54 * Math.sin(r);
    const taille = 6.6 - i * 0.16;
    d += `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="2.3" ry="${taille.toFixed(1)}" transform="rotate(${deg + 22} ${x.toFixed(1)} ${y.toFixed(1)})"/>`;
    d += `<ellipse cx="${(120 - x).toFixed(1)}" cy="${y.toFixed(1)}" rx="2.3" ry="${taille.toFixed(1)}" transform="rotate(${-(deg + 22)} ${(120 - x).toFixed(1)} ${y.toFixed(1)})"/>`;
  }
  return d;
}
export function sceau(n, { taille = 150, lauriers = true, eteint = false, legende = '' } = {}) {
  const couleur = eteint ? 'var(--eteint)' : 'var(--cire)';
  const chiffres = String(n).length;
  const fs = chiffres >= 3 ? 30 : chiffres === 2 ? 38 : 44;
  return svg(`<svg class="sceau" viewBox="0 0 120 120" width="${taille}" height="${taille}" role="img" aria-label="${legende || 'Série de ' + n + ' jours'}">
    ${lauriers ? `<g fill="var(--or)" opacity=".92">${feuilles()}</g>` : ''}
    <g transform="translate(14 14) scale(.92)">
      <path d="${CIRE}" fill="${couleur}"/>
      <path d="${CIRE}" fill="none" stroke="rgba(255,255,255,.2)" stroke-width="1.2" transform="translate(50 50) scale(.84) translate(-50 -50)"/>
      <text x="50" y="${50 + fs * 0.35}" text-anchor="middle" font-family="Bodoni Moda, serif" font-weight="700" font-size="${fs}" fill="#fff">${n}</text>
    </g></svg>`);
}
export const petitSceau = (etatJour, lettre) => h('span', { class: `jour-sceau ${etatJour || ''}`, 'aria-label': lettre }, lettre);

const I = {
  palais: '<path d="M3 10 12 4l9 6M5 10v9M9.5 10v9M14.5 10v9M19 10v9M3 20h18"/>',
  carte: '<path d="M6 21c0-4 4-4 6-6s6-2 6-6a3 3 0 1 0-6 0"/><circle cx="6" cy="21" r="1"/><circle cx="15" cy="9" r="1"/>',
  arrets: '<path d="M5 4h11l3 3v13H5zM9 10h6M9 14h6"/>',
  boutique: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5v9M9.5 9.5h3.7a1.8 1.8 0 0 1 0 3.6h-2.4a1.8 1.8 0 0 0 0 3.5h3.7"/>',
  profil: '<circle cx="12" cy="8" r="4"/><path d="M4.5 21c1-5 4-7 7.5-7s6.500 2 7.500 7"/>',
  paires: '<circle cx="6" cy="7" r="2.500"/><circle cx="18" cy="17" r="2.500"/><path d="M8.500 7c6 0 1 10 7 10"/>',
  puzzle: '<path d="M5 8h4a2.300 2.300 0 1 1 4 0h5v4a2.300 2.300 0 1 0 0 4v4H5z"/>',
  juge: '<path d="M12 3v18M6 21h12M4 7h16M7 7l-3 7a3.500 3.500 0 0 0 6 0zM17 7l-3 7a3.500 3.500 0 0 0 6 0z"/>',
  plan: '<path d="M5 5h14M9 10h10M9 14h10M5 19h14"/><path d="M5 10v4"/>',
  architecte: '<path d="M4 20h16M6 20V9M12 20V9M18 20V9M3 9h18L12 3z"/>',
  fermer: '<path d="m6 6 12 12M18 6 6 18"/>',
  retour: '<path d="M15 5 8 12l7 7"/>',
  cadenas: '<rect x="5" y="11" width="14" height="9" rx="1"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
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
};
export const icone = (nom, taille = 24) => svg(`<svg class="ic" viewBox="0 0 24 24" width="${taille}" height="${taille}" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${I[nom] || ''}</svg>`);

// Feuilles d'or pour les grands moments.
export function confettis() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const c = h('canvas', { class: 'confettis', 'aria-hidden': 'true' });
  document.body.append(c);
  const r = devicePixelRatio || 1; c.width = innerWidth * r; c.height = innerHeight * r;
  const g = c.getContext('2d'); g.scale(r, r);
  const pieces = Array.from({ length: 90 }, () => ({
    x: innerWidth / 2 + (Math.random() - 0.5) * 160, y: innerHeight * 0.34,
    vx: (Math.random() - 0.5) * 8, vy: -Math.random() * 11 - 3, t: Math.random() * 6, w: 4 + Math.random() * 7,
    c: ['#E3BD62', '#F4DD9B', '#B51F2E', '#FFFFFF'][Math.floor(Math.random() * 4)],
  }));
  let n = 0;
  (function pas() {
    g.clearRect(0, 0, innerWidth, innerHeight);
    for (const p of pieces) {
      p.vy += 0.24; p.x += p.vx; p.y += p.vy; p.t += 0.2;
      g.save(); g.translate(p.x, p.y); g.rotate(p.t); g.scale(1, Math.cos(p.t * 1.4));
      g.fillStyle = p.c; g.fillRect(-p.w / 2, -p.w / 3, p.w, p.w / 1.6); g.restore();
    }
    if (++n < 120) requestAnimationFrame(pas); else c.remove();
  })();
}

let minuteurToast = null;
export function toast(txt) {
  document.querySelector('.toast')?.remove();
  const t = h('div', { class: 'toast', role: 'status' }, txt);
  document.body.append(t);
  clearTimeout(minuteurToast);
  minuteurToast = setTimeout(() => t.remove(), 2600);
}
