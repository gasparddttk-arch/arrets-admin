// Dunk shot : un mini-jeu à part. Chaque bonne réponse envoie le ballon dans le panier suivant,
// et la première erreur ou le temps écoulé met fin à la partie.
import { h, svg, confettis, duree, toast } from './ui.js';
import { icone } from './visuels.js';
import { son, vibrer } from './sons.js';
import { etat, sauver, ajouterSemaine, noter, crediter, M, PLAFOND_JOUR, PRIME_MAITRISE } from './state.js';
import { questionsDunk, tirerDunk } from './engine.js';
import { repere } from './games.js';

// Un panier en deux couches : l'arceau du fond passe derrière le ballon, le filet et l'arceau avant devant.
const panier = (droite, y) => {
  const w = document.createElement('div');
  w.className = `panier ${droite ? 'droite' : 'gauche'}`; w.style.top = `${y}px`;
  w.append(svg('<svg class="panier-fond" viewBox="0 0 96 74" width="96" height="74" aria-hidden="true"><ellipse class="arceau-fond" cx="48" cy="14" rx="34" ry="9"/></svg>'),
    svg('<svg class="panier-avant" viewBox="0 0 96 74" width="96" height="74" aria-hidden="true"><g class="filet"><path d="M16 16 27 62h42l11-46M28 17l10 45M48 18v44M68 17 58 62M19 31h58M23 47h50"/></g><path class="arceau" d="M14 14a34 9 0 0 0 68 0"/></svg>'));
  return w;
};
const ballon = () => svg(`<svg class="ballon" viewBox="0 0 40 40" width="40" height="40" aria-hidden="true">
  <circle cx="20" cy="20" r="18" fill="url(#gBallon)"/>
  <path d="M2 20h36M20 2v36M7 7c6 7 6 19 0 26M33 7c-6 7-6 19 0 26" fill="none" stroke="#3A1608" stroke-opacity=".6" stroke-width="1.600"/>
</svg>`);

const PAS = 104; // Écart vertical entre deux paniers, dans le terrain.
const tempsPour = (q, tir) => {
  const lecture = (q.q.length + Math.max(...q.options.map((o) => o.t.length))) / 18;
  return Math.max(6 + lecture * 0.7, 10 + lecture - tir * 0.3);
};

export function lancerDunk({ ix, zones, dus, mode, sortir, montrer, nom }) {
  const liste = questionsDunk(ix, zones);
  const deja = new Set(); const dusSet = new Set(dus);
  const objectif = mode === 'cinq' ? 5 : Infinity;
  let tir = 0; let feu = 0; let fin = false; let minuteur = null;

  const score = h('strong', { class: 'dunk-score' }, '0');
  const sous = h('span', { class: 'dunk-sous' }, mode === 'cinq' ? 'sur 5' : `record ${etat.dunk.record}`);
  const quitter = h('button', { class: 'quitter', 'aria-label': 'Quitter la partie', onClick: () => { arreter(); sortir(); } }, icone('fermer', 22));
  const monde = h('div', { class: 'monde' });
  const terrain = h('div', { class: 'terrain' }, monde);
  const barre = h('div', { class: 'temps', role: 'timer', 'aria-label': 'Temps restant' }, h('i'));
  const zoneQ = h('div', { class: 'dunk-question' });
  const bille = ballon();
  const paniers = [panier(false, 120), panier(true, 120 - PAS)];
  monde.append(...paniers, bille);
  const cote = (n) => n % 2 === 1;
  const positionPanier = (n) => ({ x: terrain.clientWidth * (cote(n) ? 0.76 : 0.24), y: 120 - n * PAS + 2 });
  function poser(n) {
    const p = positionPanier(n);
    bille.style.transform = `translate(${p.x - 20}px, ${p.y - 22}px)`;
  }

  const arreter = () => { fin = true; clearInterval(minuteur); };
  // Le ballon suit une parabole entre deux points du terrain.
  function lancer(de, vers, hauteur, ms) {
    return new Promise((ok) => {
      if (!ms) { bille.style.transform = `translate(${vers.x - 20}px, ${vers.y - 22}px)`; ok(); return; }
      const t0 = performance.now();
      requestAnimationFrame(function pas(t) {
        const k = Math.min(1, (t - t0) / ms);
        const x = de.x + (vers.x - de.x) * k;
        const y = de.y + (vers.y - de.y) * k - hauteur * 4 * k * (1 - k);
        bille.style.transform = `translate3d(${x - 20}px, ${y - 22}px, 0) rotate(${k * 420}deg)`;
        if (k < 1) requestAnimationFrame(pas); else ok();
      });
    });
  }

  async function reussi(vite) {
    clearInterval(minuteur);
    tir++; score.textContent = tir;
    feu = vite ? feu + 1 : 0;
    bille.classList.toggle('en-feu', feu >= 3);
    const dunk = tir % 5 === 0;
    son(dunk ? 'dunk' : 'panier', { niveau: Math.min(tir, 8) }); vibrer(dunk ? [14, 40, 14] : 10);
    // Le panier lance : il se tend vers l'arrière, puis se détend d'un coup.
    const de = positionPanier(tir - 1); const vers = positionPanier(tir);
    const tireur = paniers[tir - 1]; const cible = paniers[tir];
    const sens = cote(tir - 1) ? 1 : -1;
    if (duree(1) && tireur?.animate) {
      tireur.animate([{ transform: 'none' }, { transform: `rotate(${sens * 22}deg) translateY(9px)`, offset: 0.55 }, { transform: `rotate(${sens * -6}deg) translateY(-4px)`, offset: 0.8 }, { transform: 'none' }], { duration: 300, easing: 'ease-out' });
      await lancer(de, { x: de.x, y: de.y + 9 }, 0, 165);
    }
    await lancer({ x: de.x, y: de.y + (duree(1) ? 9 : 0) }, vers, 96, duree(620));
    if (duree(1) && cible?.animate) {
      cible.animate([{ transform: 'none' }, { transform: 'translateY(7px)' }, { transform: 'translateY(-2px)' }, { transform: 'none' }], { duration: 360, easing: 'ease-out' });
      cible.querySelector('.filet')?.animate([{ transform: 'scaleY(1)' }, { transform: 'scaleY(1.35) scaleX(.86)' }, { transform: 'scaleY(.92)' }, { transform: 'scaleY(1)' }], { duration: 420, easing: 'ease-out' });
      await lancer(vers, { x: vers.x, y: vers.y + 16 }, 0, 140);
      await lancer({ x: vers.x, y: vers.y + 16 }, vers, 0, 120);
    }
    monde.style.transform = `translateY(${tir * PAS}px)`;
    const neuf = panier(cote(tir + 1), 120 - (tir + 1) * PAS);
    paniers.push(neuf); monde.insertBefore(neuf, bille);
    [...monde.querySelectorAll('.panier')].slice(0, -3).forEach((p) => p.remove());
    if (dunk) { confettis(); terrain.append(h('p', { class: 'dunk-mot' }, 'Dunk')); setTimeout(() => terrain.querySelector('.dunk-mot')?.remove(), 900); }
    if (tir >= objectif) { setTimeout(() => terminer(true), duree(800)); return; }
    setTimeout(question, duree(dunk ? 500 : 260));
  }

  async function rate(q, choix) {
    clearInterval(minuteur);
    if (fin) return;
    fin = true;
    son('rebond'); vibrer([14, 50, 14]);
    const de = positionPanier(tir); const vers = positionPanier(tir + 1);
    await lancer(de, { x: (de.x + vers.x) / 2, y: vers.y + 40 }, 36, duree(340));
    await lancer({ x: (de.x + vers.x) / 2, y: vers.y + 40 }, { x: de.x, y: 420 }, -30, duree(420));
    for (const b of zoneQ.querySelectorAll('.option')) {
      b.disabled = true;
      const o = q.options[+b.dataset.n];
      b.classList.add(o.ok ? 'juste' : b === choix ? 'faux' : 'efface');
    }
    zoneQ.append(h('div', { class: 'pied' }, h('button', { class: 'cta', onClick: () => terminer(false) }, 'Voir le score')));
  }

  function question() {
    if (fin) return;
    const q = tirerDunk(liste, tir, dusSet, deja);
    const total = tempsPour(q, tir);
    let reste = total; const t0 = performance.now();
    barre.classList.remove('urgent');
    barre.firstChild.style.transform = 'scaleX(1)';
    const repondre = (o, el) => {
      if (fin || el.closest('.dunk-question').dataset.fini) return;
      el.closest('.dunk-question').dataset.fini = '1';
      if (q.carte && noter(q.carte, o.ok) === 'prime') toast(`Dossier clos : prime de maîtrise de ${PRIME_MAITRISE} ${nom.toLowerCase()}.`);
      if (o.ok) { el.classList.add('juste'); reussi(performance.now() - t0 < total * 500); } else { el.classList.add('faux'); rate(q, el); }
    };
    delete zoneQ.dataset.fini;
    zoneQ.replaceChildren(...[
      q.tag ? h('p', { class: 'badge-travaux' }, icone('travaux', 14), q.tag) : null,
      h('p', { class: 'dunk-enonce' }, q.q),
      ...q.options.map((o, i) => { const b = h('button', { class: 'option', 'data-n': i, 'data-ok': repere(o.ok), onClick: () => repondre(o, b) }, h('span', { class: 'option-t' }, o.t)); return b; }),
    ].filter(Boolean));
    clearInterval(minuteur);
    minuteur = setInterval(() => {
      reste = total - (performance.now() - t0) / 1000;
      barre.firstChild.style.transform = `scaleX(${Math.max(0, reste / total)})`;
      if (reste <= 3) barre.classList.add('urgent');
      if (reste <= 0) {
        clearInterval(minuteur);
        zoneQ.dataset.fini = '1';
        rate(q, null);
      }
    }, 100);
  }

  function terminer(gagne) {
    arreter();
    const d = etat.dunk;
    const record = tir > d.record;
    if (record) d.record = tir;
    d.parties++; d.paniers += tir;
    const prevu = Math.floor(tir / 5);
    const obtenu = crediter(prevu);
    M().xp += tir * 3; ajouterSemaine(tir * 3);
    sauver();
    const plafond = obtenu < prevu;
    if (gagne || record) { confettis(); son('grade'); } else son('valide');
    const n = tir;
    montrer(h('main', { class: 'resultats dunk-fin' },
      h('p', { class: 'dunk-total' }, n),
      h('h1', {}, gagne ? 'Cinq paniers, dunk' : record ? 'Nouveau record' : n > 1 ? `${n} paniers` : n === 1 ? 'Un panier' : 'Raté'),
      h('dl', { class: 'res-chiffres' },
        h('div', {}, h('dt', {}, 'Record'), h('dd', {}, d.record)),
        h('div', {}, h('dt', {}, 'Expérience'), h('dd', {}, `+${n * 3}`)),
        h('div', {}, h('dt', {}, nom), h('dd', {}, `+${obtenu}`))),
      plafond ? h('p', { class: 'res-texte' }, `Plafond du jour atteint : ${PLAFOND_JOUR} par matière.`) : null,
      h('div', { class: 'pied' },
        h('button', { class: 'cta', onClick: () => lancerDunk({ ix, zones, dus, mode, sortir, montrer, nom }) }, 'Rejouer'),
        h('button', { class: 'bouton-lien', onClick: sortir }, 'Retour au Palais'))));
  }

  montrer(h('header', { class: 'entete-seance dunk-entete' }, quitter, h('div', { class: 'dunk-compte' }, score, sous)),
    h('main', { class: 'dunk' }, terrain, barre, zoneQ));
  poser(0);
  son('lancement');
  setTimeout(question, duree(300));
}
