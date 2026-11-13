// Petits outils d'interface : création d'éléments, effets, messages.
import { etat } from './state.js';
import { son, vibrer } from './sons.js';

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
  if (!effets() || (typeof location !== 'undefined' && new URLSearchParams(location.search).has('test'))) return;
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
export function slayDiva(figure = null) {
  const t = h('div', { class: 'slay', role: 'status' }, figure, h('strong', {}, 'Slay Diva'));
  document.body.append(t);
  confettis();
  const enTest = typeof location !== 'undefined' && new URLSearchParams(location.search).has('test');
  setTimeout(() => t.remove(), enTest ? 60 : 1250);
  return attendre(enTest ? 60 : duree(900));
}

// BANC DE PIÈCES : glisser ou toucher pour poser les pièces dans leurs cases.
export function banc({
  pieces = [],
  cases = [],
  ecart = true,
  onChangement = null,
} = {}) {
  const place = {};
  const reserve = pieces.map((p, i) => ({ ...p, _id: p._id || p.id || `pc_${i}` }));
  const ecartees = [];
  let selection = null;
  let depart = null;
  let glisse = false;
  let avatar = null;
  let cibleSurvol = null;
  let dernierPointerUp = 0;

  const conteneur = h('div', { class: 'banc-composant' });

  function estComplet() {
    return cases.every((c) => Boolean(place[c.k]));
  }

  function notifier() {
    const complet = estComplet();
    if (onChangement) onChangement({ place, ecartees, complet, selection });
  }

  function onPointerDown(e, piece, provenance, caseK = null) {
    if (e.button !== undefined && e.button !== 0) return;
    depart = {
      x: e.clientX,
      y: e.clientY,
      pointerId: e.pointerId,
      piece,
      provenance,
      caseK,
      element: e.currentTarget,
    };
    glisse = false;
    window.addEventListener('pointermove', onPointerMove, { passive: false });
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerCancel);
  }

  function onPointerMove(e) {
    if (!depart) return;
    const dx = e.clientX - depart.x;
    const dy = e.clientY - depart.y;
    if (!glisse && Math.hypot(dx, dy) > 5) {
      glisse = true;
      depart.element.classList.add('en-glisse');
      avatar = h('div', { class: 'banc-avatar', style: `left:${e.clientX}px;top:${e.clientY}px;` }, depart.piece.t);
      document.body.append(avatar);
    }
    if (glisse) {
      e.preventDefault();
      if (avatar) {
        avatar.style.left = `${e.clientX}px`;
        avatar.style.top = `${e.clientY}px`;
      }
      const sous = document.elementFromPoint(e.clientX, e.clientY);
      const nouvelleCible = sous?.closest('.banc-case, .banc-ecart, .banc-reserve');
      if (cibleSurvol !== nouvelleCible) {
        cibleSurvol?.classList.remove('survol');
        cibleSurvol = nouvelleCible;
        cibleSurvol?.classList.add('survol');
      }
    }
  }

  function onPointerUp(e) {
    if (!depart) return;
    const etaitGlisse = glisse;
    const info = depart;
    dernierPointerUp = Date.now();
    nettoyerGlisse();

    if (etaitGlisse) {
      const sous = document.elementFromPoint(e.clientX, e.clientY);
      const caseCible = sous?.closest('.banc-case');
      const ecartCible = sous?.closest('.banc-ecart');
      const reserveCible = sous?.closest('.banc-reserve');

      if (caseCible) {
        deposerDansCase(info, caseCible.dataset.k);
      } else if (ecartCible) {
        deposerDansEcart(info);
      } else if (reserveCible || info.provenance === 'case') {
        deposerDansReserve(info);
      }
    } else {
      gererClic(info);
    }
  }

  function onPointerCancel() {
    nettoyerGlisse();
  }

  function nettoyerGlisse() {
    depart = null;
    glisse = false;
    if (avatar) {
      avatar.remove();
      avatar = null;
    }
    if (cibleSurvol) {
      cibleSurvol.classList.remove('survol');
      cibleSurvol = null;
    }
    document.querySelectorAll('.banc-piece.en-glisse, .banc-piece-posee.en-glisse').forEach((el) => el.classList.remove('en-glisse'));
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup', onPointerUp);
    window.removeEventListener('pointercancel', onPointerCancel);
  }

  function deposerDansCase(info, targetK) {
    if (!targetK) return;
    const piece = info.piece;
    const occupant = place[targetK];

    if (info.provenance === 'reserve') {
      const idx = reserve.findIndex((p) => p._id === piece._id);
      if (idx >= 0) reserve.splice(idx, 1);
      place[targetK] = piece;
      if (occupant) {
        reserve.push(occupant);
      }
      son('carte'); vibrer(8);
    } else if (info.provenance === 'case') {
      const sourceK = info.caseK;
      if (sourceK === targetK) return;
      if (occupant) {
        place[targetK] = piece;
        place[sourceK] = occupant;
      } else {
        delete place[sourceK];
        place[targetK] = piece;
      }
      son('carte'); vibrer(8);
    }
    selection = null;
    rendre();
  }

  function deposerDansEcart(info) {
    const piece = info.piece;
    if (info.provenance === 'reserve') {
      const idx = reserve.findIndex((p) => p._id === piece._id);
      if (idx >= 0) reserve.splice(idx, 1);
      ecartees.push(piece);
    } else if (info.provenance === 'case') {
      delete place[info.caseK];
      ecartees.push(piece);
    }
    son('ecart'); vibrer(8);
    selection = null;
    rendre();
  }

  function deposerDansReserve(info) {
    const piece = info.piece;
    if (info.provenance === 'case') {
      delete place[info.caseK];
      reserve.push(piece);
      son('retour');
      selection = null;
      rendre();
    }
  }

  function gererClic(info) {
    if (!selection) {
      selection = info;
      son('carte'); vibrer(6);
      rendre();
    } else if (selection.piece._id === info.piece._id) {
      if (info.provenance === 'case') {
        deposerDansReserve(info);
      } else {
        selection = null;
        rendre();
      }
    } else {
      if (info.provenance === 'case') {
        deposerDansCase(selection, info.caseK);
      } else {
        selection = info;
        son('carte'); vibrer(6);
        rendre();
      }
    }
  }

  function onClicCaseVide(targetK) {
    if (selection) {
      deposerDansCase(selection, targetK);
    }
  }

  function onClicEcart() {
    if (selection) {
      deposerDansEcart(selection);
    } else if (ecartees.length > 0) {
      const rep = ecartees.pop();
      reserve.push(rep);
      son('retour');
      toast('Pièce reprise des écartées.');
      rendre();
    }
  }

  function onClicReserve(e) {
    if (e.target.closest('.banc-piece') || e.target.closest('.banc-ecart')) return;
    if (selection && selection.provenance === 'case') {
      deposerDansReserve(selection);
    } else if (selection) {
      selection = null;
      rendre();
    }
  }

  function rendre() {
    const complet = estComplet();
    if (!complet && reserve.length === 0 && ecartees.length > 0) {
      reserve.push(...ecartees);
      ecartees.length = 0;
      toast('Il manque des pièces : celles que tu as écartées reviennent.');
      son('retour');
    }

    const casesElements = cases.map((c) => {
      const p = place[c.k];
      const estSelect = selection && selection.piece === p;
      if (p) {
        const piecePosee = h('div', {
          class: `banc-piece-posee ${estSelect ? 'selectionnee' : ''}`,
          'aria-label': `${c.l} : ${p.t}`,
          onPointerDown: (e) => onPointerDown(e, p, 'case', c.k),
          onClick: (e) => {
            if (Date.now() - dernierPointerUp < 350) return;
            gererClic({ piece: p, provenance: 'case', caseK: c.k });
          },
        }, h('span', {}, p.t));
        return h('div', {
          class: `banc-case pleine ${c.classe || ''} ${estSelect ? 'selectionnee' : ''}`,
          'data-k': c.k,
          role: 'region',
          'aria-label': `${c.l} : ${p.t}`,
          ...(c.attributs || {}),
          onClick: (e) => {
            if (e.target.closest('.banc-piece-posee')) return;
            if (Date.now() - dernierPointerUp < 350) return;
            if (selection && selection.piece._id !== p._id) {
              deposerDansCase(selection, c.k);
            } else {
              gererClic({ piece: p, provenance: 'case', caseK: c.k });
            }
          },
        }, h('b', {}, c.l), piecePosee);
      } else {
        return h('button', {
          type: 'button',
          class: `banc-case vide ${c.classe || ''} ${selection ? 'cible' : ''}`,
          'data-k': c.k,
          'aria-label': `${c.l} : vide, toucher pour poser`,
          onClick: () => onClicCaseVide(c.k),
          ...(c.attributs || {}),
        }, h('b', {}, c.l), h('span', { class: 'vide' }, c.placeholder || 'À placer'));
      }
    });

    const piecesElements = reserve.map((p) => {
      const estSelect = selection && selection.piece === p;
      return h('div', {
        class: `banc-piece ${estSelect ? 'selectionnee' : ''}`,
        role: 'button',
        tabindex: '0',
        'aria-pressed': estSelect ? 'true' : 'false',
        'aria-label': p.t,
        onPointerDown: (e) => onPointerDown(e, p, 'reserve'),
        onClick: (e) => {
          if (Date.now() - dernierPointerUp < 350) return;
          gererClic({ piece: p, provenance: 'reserve' });
        },
        ...(p.attributs || {}),
      }, h('p', {}, p.t));
    });

    let ecartEl = null;
    if (ecart) {
      ecartEl = h('button', {
        type: 'button',
        class: `banc-ecart ${selection ? 'a-selection' : ''}`,
        'data-action': 'ecarter',
        'data-ecart': 'true',
        'aria-label': `Écartées : ${ecartees.length} pièce${ecartees.length > 1 ? 's' : ''}`,
        onClick: onClicEcart,
      },
        h('span', { class: 'banc-ecart-label' }, 'Écartées'),
        ecartees.length > 0 ? h('span', { class: 'banc-ecart-nb' }, String(ecartees.length)) : null
      );
    }

    const casesDiv = h('div', { class: `banc-cases ${selection ? 'a-selection' : ''}` }, casesElements);
    const reserveDiv = h('div', { class: 'banc-reserve', onClick: onClicReserve }, ...piecesElements, ecartEl);
    conteneur.replaceChildren(casesDiv, reserveDiv);

    notifier();
  }

  rendre();

  return {
    el: conteneur,
    place,
    ecartees,
    estComplet,
    rendre,
  };
}
