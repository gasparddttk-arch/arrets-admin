// Les termes juridiques soulignés dans les exercices : un toucher affiche leur définition d'une ligne.
import { h } from './ui.js';

// Les mots trop courants pour être soulignés à chaque question restent dans le lexique sans soulignement.
const TROP_COURANTS = new Set(['contrat', 'obligation', 'erreur', 'offre', 'acceptation', 'violence', 'directive', 'ordonnance', 'service public', 'circulaire', 'inexécution', 'transposition', 'ratification', 'ordre public', 'acte juridique', 'fait juridique', 'nullité']);
// Jamais dans un bouton : toucher une réponse doit répondre, pas ouvrir une définition.
const ZONES = '.question, .option-w, .rappel-decision, .corrige-libre p, .jalon-decision, .frise-vraie p, .frise-vraie small, .aide, .cases-syllo.corrige p, .cases-syllo.corrige small';

let regles = [];
export function preparerLexique(lexique) {
  regles = (lexique || []).filter((x) => !TROP_COURANTS.has(x.t.toLowerCase())).map((x) => {
    const formes = [x.t, ...x.formes].sort((a, b) => b.length - a.length).map((f) => f.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    return { ...x, re: new RegExp(`(^|[^\\p{L}])(${formes.join('|')})(?=$|[^\\p{L}])`, 'iu') };
  });
}

// Souligne la première occurrence de chaque terme dans les textes d'exercice de la zone.
export function souligner(racine) {
  if (!regles.length || !racine) return;
  const vus = new Set(racine.querySelectorAll('.terme').length ? [...racine.querySelectorAll('.terme')].map((e) => e.dataset.t) : []);
  for (const bloc of racine.querySelectorAll(ZONES)) {
    if (bloc.closest('.terme, .bulle-terme') || bloc.dataset.lexique) continue;
    bloc.dataset.lexique = '1';
    const marcheur = document.createTreeWalker(bloc, NodeFilter.SHOW_TEXT);
    const noeuds = []; while (marcheur.nextNode()) noeuds.push(marcheur.currentNode);
    for (const n of noeuds) {
      if (n.parentElement.closest('.terme, button, [role="button"], a, label')) continue;
      for (const r of regles) {
        if (vus.has(r.t)) continue;
        const m = r.re.exec(n.nodeValue);
        if (!m) continue;
        const debut = m.index + m[1].length; const fin = debut + m[2].length;
        const apres = n.splitText(debut); apres.splitText(fin - debut);
        const span = h('span', { class: 'terme', 'data-t': r.t, role: 'button', tabindex: '0', 'aria-label': `${m[2]}, définition` }, apres.nodeValue);
        apres.replaceWith(span); vus.add(r.t);
        break;
      }
    }
  }
}

function bulle(el) {
  document.querySelector('.bulle-terme')?.remove();
  const r = regles.find((x) => x.t === el.dataset.t); if (!r) return;
  const b = h('div', { class: 'bulle-terme', role: 'tooltip' }, h('b', {}, `${r.t.charAt(0).toUpperCase()}${r.t.slice(1)} : `), r.d);
  document.body.append(b);
  const z = el.getBoundingClientRect(); const largeur = Math.min(320, window.innerWidth - 24);
  b.style.width = `${largeur}px`;
  b.style.left = `${Math.max(12, Math.min(z.left, window.innerWidth - largeur - 12))}px`;
  const haut = z.bottom + 8 + b.offsetHeight > window.innerHeight ? z.top - b.offsetHeight - 8 : z.bottom + 8;
  b.style.top = `${Math.max(8, haut)}px`;
}
document.addEventListener('click', (e) => {
  const t = e.target.closest?.('.terme');
  if (t) { e.stopPropagation(); e.preventDefault(); bulle(t); return; }
  document.querySelector('.bulle-terme')?.remove();
}, true);
document.addEventListener('keydown', (e) => { if (e.key === 'Enter' && e.target.classList?.contains('terme')) bulle(e.target); if (e.key === 'Escape') document.querySelector('.bulle-terme')?.remove(); });
document.addEventListener('scroll', () => document.querySelector('.bulle-terme')?.remove(), true);
