// Petits outils d'interface : création d'éléments, effets, messages.
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

const moinsDeMouvement = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
export const effets = () => etat.reglages.effets && !moinsDeMouvement();
export const estRose = () => document.documentElement.dataset.theme === 'rose';
// Durée d'une animation, réduite à rien quand les effets sont coupés.
export const duree = (ms) => (effets() ? ms : 0);
export const attendre = (ms) => new Promise((ok) => { setTimeout(ok, ms); });

// Pluie de lumière pour les grands moments.
export function confettis() {
  if (!effets()) return;
  const c = h('canvas', { class: 'confettis', 'aria-hidden': 'true' });
  document.body.append(c);
  const r = devicePixelRatio || 1; c.width = innerWidth * r; c.height = innerHeight * r;
  const g = c.getContext('2d'); g.scale(r, r);
  const palette = estRose() ? ['#FFE3CF', '#E8A78F', '#D81B60', '#FFFFFF', '#FF8DB0'] : ['#FBE7AE', '#E6BE60', '#FF9478', '#FFFFFF', '#7FA6FF'];
  const pieces = Array.from({ length: 110 }, () => ({
    x: innerWidth / 2 + (Math.random() - 0.5) * 220, y: innerHeight * 0.3,
    vx: (Math.random() - 0.5) * 9, vy: -Math.random() * 12 - 3, t: Math.random() * 6, w: 3 + Math.random() * 7,
    c: palette[Math.floor(Math.random() * palette.length)],
  }));
  let n = 0;
  (function pas() {
    g.clearRect(0, 0, innerWidth, innerHeight);
    g.globalAlpha = n > 90 ? (130 - n) / 40 : 1;
    for (const p of pieces) {
      p.vy += 0.22; p.vx *= 0.99; p.x += p.vx; p.y += p.vy; p.t += 0.2;
      g.save(); g.translate(p.x, p.y); g.rotate(p.t); g.scale(1, Math.cos(p.t * 1.4));
      g.fillStyle = p.c; g.fillRect(-p.w / 2, -p.w / 3, p.w, p.w / 1.6); g.restore();
    }
    if (++n < 130) requestAnimationFrame(pas); else c.remove();
  })();
}

// Trait de lumière entre deux éléments reliés.
export function lien(a, b) {
  if (!effets()) return;
  const ra = a.getBoundingClientRect(); const rb = b.getBoundingClientRect();
  const x1 = ra.left + ra.width / 2; const y1 = ra.top + ra.height / 2;
  const x2 = rb.left + rb.width / 2; const y2 = rb.top + rb.height / 2;
  const l = h('i', { class: 'lien', 'aria-hidden': 'true', style: `left:${x1}px;top:${y1}px;width:${Math.hypot(x2 - x1, y2 - y1)}px;transform:rotate(${Math.atan2(y2 - y1, x2 - x1)}rad)` });
  document.body.append(l);
  setTimeout(() => l.remove(), 460);
}

let minuteurToast = null;
export function toast(txt) {
  document.querySelector('.toast')?.remove();
  const t = h('div', { class: 'toast', role: 'status' }, txt);
  document.body.append(t);
  clearTimeout(minuteurToast);
  minuteurToast = setTimeout(() => t.remove(), 2600);
}

// Tenue rose : le message d'erreur file sans jamais bloquer le jeu.
export function bebew() {
  document.querySelector('.bebew')?.remove();
  const t = h('div', { class: 'bebew', role: 'status' }, 'Pas du tout Bebew');
  document.body.append(t);
  setTimeout(() => t.remove(), 1300);
}

// Tenue rose : chaque épreuve à 100 % a droit à son grand message.
export function slayDiva() {
  const t = h('div', { class: 'slay', role: 'status' }, h('strong', {}, 'Slay Diva'));
  document.body.append(t);
  confettis();
  setTimeout(() => t.remove(), 1250);
  return attendre(duree(900));
}
