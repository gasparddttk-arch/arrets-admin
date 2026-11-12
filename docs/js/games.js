// Les cinq modes de jeu. Chaque mode dessine son écran dans `zone` et appelle ctx.fin(resultat).
import { h, toast, duree, lien, effets } from './ui.js';
import { icone, marteau, salleAudience } from './visuels.js';
import { son, vibrer } from './sons.js';
import { etat, sauver } from './state.js';
import { jumeaux, melange, CASES } from './engine.js';

const NOM_CASE = { 1: 'I', '1a': 'A', '1b': 'B', 2: 'II', '2a': 'A', '2b': 'B' };
const TYPE = { D: 'Dissertation', C: 'Commentaire' };
// Repères réservés aux tests automatiques : rien n'apparaît dans l'appli normale.
export const repere = (v) => (window.__app ? String(v) : null);

// Bouton principal, toujours sous le pouce.
export const continuer = (label, action, attrs = {}) => h('button', { class: 'cta', onClick: action, ...attrs }, label);
export const barrePied = (...b) => h('div', { class: 'pied' }, ...b);
export const fantome = (nom, label, action, attrs = {}) => h('button', { class: 'bouton-fantome', onClick: action, ...attrs }, icone(nom, 18), label);

function barreJokers(ctx, { recuser, indice, prolonger }) {
  if (ctx.boss) return null;
  const inv = etat.inv; const items = [];
  const bouton = (id, nom, action) => {
    if (!inv[id]) return;
    const b = h('button', { class: 'joker', 'aria-label': `${nom}, ${inv[id]} restants`, onClick: () => {
      if (!inv[id] || b.disabled) return;
      inv[id]--; sauver(); son('jeton'); vibrer(8); action(); b.disabled = true;
      if (id !== 'prorogation') ctx.aide?.();
      const c = b.querySelector('b'); if (c) c.textContent = inv[id];
    } }, icone(id, 18), h('span', {}, nom), h('b', {}, inv[id]));
    items.push(b);
  };
  if (recuser) bouton('recusation', 'Récusation', recuser);
  if (indice) bouton('indice', 'Note du rapporteur', indice);
  if (prolonger) bouton('prorogation', 'Prorogation', prolonger);
  return items.length ? h('div', { class: 'jokers' }, items) : null;
}

// Question à choix. Après la réponse, la bonne proposition et la tienne s'expliquent seules ;
// les autres gardent leur explication, à déplier d'un geste.
export function qcm(zone, ctx, { question, options, pourquoiBon, indice, surtitre, avant, classe = '', dossier = false, frappe = false, sousQuestion = null }) {
  return new Promise((fini) => {
    let repondu = false;
    const ecran = h('div', { class: `ecran qcm ${classe}` });
    const lignes = options.map((o) => {
      o.el = h('button', { class: 'option', 'data-ok': repere(!!o.ok), onClick: () => (repondu ? deplier(o) : choisir(o)) },
        h('span', { class: 'option-marque', 'aria-hidden': 'true' }), h('span', { class: 'option-t' }, o.t));
      return o.el;
    });
    const liste = h('div', { class: 'options' }, lignes);
    const noteIndice = h('p', { class: 'indice', hidden: true }, indice || '');
    const coup = frappe ? marteau() : null;

    function deplier(o) {
      const w = o.el.querySelector('.option-w');
      if (!w) return;
      son('tap');
      o.el.classList.toggle('deplie', w.classList.toggle('ferme') === false);
    }
    function conclure(o) {
      ctx.combo(o.ok);
      liste.classList.add('repondu');
      for (const x of options) {
        x.el.classList.add(x.ok ? 'juste' : 'faux');
        x.el.querySelector('.option-marque').append(icone(x.ok ? 'juste' : 'faux', 15));
        const txt = x.ok ? pourquoiBon : x.w;
        if (!txt) { x.el.disabled = true; continue; }
        const ouvert = x.ok || x === o;
        x.el.append(h('span', { class: `option-w ${ouvert ? '' : 'ferme'}` }, txt));
        if (!ouvert) x.el.append(h('span', { class: 'option-voir', 'aria-hidden': 'true' }, icone('chevron', 16)));
      }
      ecran.querySelector('.jokers')?.remove();
      ecran.append(barrePied(continuer('Continuer', () => fini({ ok: o.ok, choix: o }))));
      // La bonne réponse reste visible au-dessus du bouton, même sur un petit écran.
      options.find((x) => x.ok)?.el.scrollIntoView({ block: 'nearest', behavior: effets() ? 'smooth' : 'auto' });
    }
    function choisir(o) {
      if (repondu) return;
      repondu = true;
      o.el.classList.add('choisi');
      if (frappe) {
        coup.classList.add('frappe-marteau');
        son('marteau'); vibrer(18);
        setTimeout(() => conclure(o), duree(300));
      } else conclure(o);
    }
    const jokers = barreJokers(ctx, {
      recuser: () => {
        const faux = options.filter((o) => !o.ok && !o.el.classList.contains('retire'));
        if (faux.length > 1) { const f = faux[Math.floor(Math.random() * faux.length)]; f.el.classList.add('retire'); f.el.disabled = true; }
      },
      indice: indice ? () => { noteIndice.hidden = false; } : null,
    });
    const enonce = dossier
      ? [h('article', { class: 'dossier-carte' }, surtitre ? h('p', { class: 'dossier-titre' }, surtitre) : null, h('p', { class: 'dossier-texte' }, question), coup),
        sousQuestion ? h('h2', { class: 'question sous-dossier' }, sousQuestion) : null]
      : [surtitre ? h('p', { class: 'surtitre' }, surtitre) : null, avant, h('h2', { class: 'question' }, question)];
    ecran.append(...[h('div', { class: 'ecran-corps' }, enonce, noteIndice), jokers, liste].filter(Boolean));
    zone.replaceChildren(ecran);
    window.scrollTo(0, 0);
  });
}

// La fiche de révélation, qui suit chaque épreuve : c'est là que l'arrêt devient familier.
export function revelation(a, ix, { zoneId } = {}) {
  const z = zoneId ?? a.zones[0];
  const jum = jumeaux(ix, a.id).slice(0, 3);
  return h('article', { class: 'revelation' },
    h('div', { class: 'revelation-tete' },
      h('span', { class: 'annee' }, a.an),
      h('div', {}, h('h3', {}, a.court), h('p', { class: 'ref' }, a.ref))),
    h('p', { class: 'apport' }, a.ap[z] || Object.values(a.ap)[0]),
    a.h ? h('p', { class: 'histoire' }, a.h) : null,
    jum.length ? h('div', { class: 'jumeaux' },
      h('h4', {}, 'À ne pas confondre avec'),
      h('ul', {}, jum.map((j) => h('li', {}, h('b', {}, `${ix.parId.get(j.id).court}, ${ix.parId.get(j.id).an}`), ' ', j.k)))) : null,
  );
}
export const finEpreuve = (zone, ctx, res, ...contenu) => {
  zone.replaceChildren(h('div', { class: 'ecran fin-epreuve' }, h('div', { class: 'ecran-corps' }, contenu), barrePied(continuer('Continuer', () => ctx.fin(res)))));
  window.scrollTo(0, 0);
};

// PAIRES -------------------------------------------------------------------
export function jouerPaires(zone, ctx, round, ix) {
  const g = round.grille; const lignes = g.lignes.map((l) => ({ ...l }));
  const qualif = g.variante === 'qualif';
  const duree0 = g.variante === 'annee' ? 34 : qualif ? 75 : 50;
  let restant = duree0; let nomVise = null; let texteVise = null; let finis = 0; let erreurs = 0; let arrete = false; let minuteur; let dernierTic = 99;
  const noms = melange(lignes, Math.random); const textes = melange(lignes, Math.random);
  const barre = h('div', { class: 'temps', role: 'timer', 'aria-label': 'Temps restant' }, h('i'));
  const consigne = g.variante === 'annee' ? 'Relie chaque arrêt à son année'
    : g.variante === 'jumeaux' ? g.famille.titre : qualif ? 'Relie chaque fait à sa qualification' : 'Relie chaque arrêt à son apport';
  // En obligations, la carte retournée donne le texte plutôt que la référence de l'arrêt.
  const etiquette = (l) => (qualif ? `${l.nom}, ${l.a}` : `${ix.parId.get(l.id).court}, ${ix.parId.get(l.id).ref}`);
  const fiche = (l) => (qualif ? l.carte : l.id);

  const chipsNoms = noms.map((l) => { l.elN = h('button', { class: `chip${Math.max(...l.nom.split(/\s+/).map((m) => m.length)) >= 12 ? ' mot-long' : ''}`, 'data-id': repere(l.id), onClick: () => viserNom(l) }, l.nom); return l.elN; });
  const cartes = textes.map((l) => { l.elT = h('button', { class: `carte-paire ${g.variante === 'annee' ? 'annee-carte' : ''}`, 'data-id': repere(l.id), onClick: () => viserTexte(l) }, l.t); return l.elT; });

  function viserNom(l) {
    if (arrete || l.fait) return;
    son('tap'); chipsNoms.forEach((c) => c.classList.remove('vise'));
    nomVise = l; l.elN.classList.add('vise');
    essayer();
  }
  function viserTexte(l) {
    if (arrete || l.fait) return;
    son('tap'); cartes.forEach((c) => c.classList.remove('vise'));
    texteVise = l; l.elT.classList.add('vise');
    essayer();
  }
  function essayer() {
    if (!nomVise || !texteVise) return;
    const n = nomVise; const t = texteVise;
    t.elT.classList.remove('vise'); texteVise = null;
    if (n === t) {
      n.fait = true; finis++;
      lien(n.elN, n.elT);
      ctx.combo(true); ctx.noter(fiche(n), !n.rate);
      n.elN.classList.remove('vise'); n.elN.classList.add('reussi'); n.elT.classList.add('reussi');
      n.elN.disabled = true; n.elT.disabled = true;
      n.elT.prepend(h('span', { class: 'carte-nom' }, etiquette(n)));
      nomVise = null;
      if (finis === lignes.length) terminer();
    } else {
      erreurs++; n.rate = true;
      ctx.combo(false); if (qualif) ctx.noter(fiche(n), false); else ctx.noter(n.id, false, t.id);
      t.elT.classList.add('secoue'); n.elN.classList.add('secoue');
      setTimeout(() => { t.elT.classList.remove('secoue'); n.elN.classList.remove('secoue'); }, 340);
      if (ctx.touche()) terminer();
    }
  }
  function tick() {
    restant -= 0.1; barre.firstChild.style.transform = `scaleX(${Math.max(0, restant / duree0)})`;
    if (restant <= 8) barre.classList.add('urgent');
    if (restant <= 5 && restant > 0 && Math.ceil(restant) !== dernierTic) { dernierTic = Math.ceil(restant); son('tic'); }
    if (restant <= 0) terminer(true);
  }
  function terminer(tempsEcoule) {
    if (arrete) return;
    arrete = true; clearInterval(minuteur);
    const manques = lignes.filter((l) => !l.fait);
    for (const l of manques) {
      ctx.noter(fiche(l), false); l.elT.classList.add('manque');
      l.elT.prepend(h('span', { class: 'carte-nom' }, etiquette(l)));
      l.elN.disabled = true; l.elT.disabled = true;
    }
    const score = Math.max(0, (finis - erreurs * 0.5) / lignes.length);
    const parfait = finis === lignes.length && !erreurs;
    ctx.gain(finis * 5 + (parfait ? 10 : 0), finis + (parfait ? 3 : 0));
    if (tempsEcoule) { toast('Temps écoulé.'); son('tic'); }
    const piege = qualif ? h('ul', { class: 'raisons' }, lignes.map((l) => h('li', {}, h('b', {}, l.nom), ' ', l.w)))
      : g.famille ? h('p', { class: 'piege' }, g.famille.p) : null;
    zone.querySelector('.paires').append(...[piege, barrePied(continuer('Continuer', () => ctx.fin({ score, parfait })))].filter(Boolean));
  }
  const jokers = barreJokers(ctx, { prolonger: () => { restant = Math.min(duree0 + 15, restant + 15); barre.classList.remove('urgent'); dernierTic = 99; } });
  zone.replaceChildren(h('div', { class: 'ecran paires' },
    h('h2', { class: 'question' }, consigne), barre, jokers,
    h('div', { class: 'chips' }, chipsNoms),
    h('div', { class: `cartes-paires ${g.variante === 'annee' ? 'grille-annees' : ''}` }, cartes)));
  minuteur = setInterval(tick, 100);
  ctx.nettoyage(() => clearInterval(minuteur));
}

// PUZZLE : un paquet de pièces à trier, une carte à la fois ------------------------
export async function jouerPuzzle(zone, ctx, round, ix) {
  const a = ix.parId.get(round.id);
  const place = {};
  let pile = round.blocs.map((b) => ({ ...b }));
  let ecartees = [];
  let anime = false;

  await new Promise((suite) => {
    const envol = (classe, sonNom, apres) => {
      if (anime) return;
      anime = true;
      son(sonNom); vibrer(8);
      zone.querySelector('.carte-piece')?.classList.add(classe);
      setTimeout(() => { anime = false; apres(); rendre(); }, duree(170));
    };
    const poser = (k) => envol('vers-haut', 'carte', () => { const b = pile.shift(); if (place[k]) pile.push(place[k]); place[k] = b; });
    const ecarter = () => envol('vers-bas', 'ecart', () => ecartees.push(pile.shift()));
    const plusTard = () => envol('vers-cote', 'carte', () => pile.push(pile.shift()));
    const retirer = (s) => { const b = place[s.k]; delete place[s.k]; pile.unshift(b); son('retour'); rendre(); };

    function rendre() {
      const complet = round.slots.every((s) => place[s.k]);
      if (!complet && !pile.length) {
        pile = ecartees; ecartees = [];
        toast('Il manque des pièces : celles que tu as écartées reviennent.');
      }
      const mini = h('div', { class: 'fiche-mini' }, round.slots.map((s) => h('button', {
        class: `mini ${place[s.k] ? 'pleine' : ''}`, disabled: !place[s.k],
        'aria-label': place[s.k] ? `${s.l} rempli, toucher pour reprendre la pièce` : `${s.l} vide`,
        onClick: () => retirer(s),
      }, h('i', {}, place[s.k] ? icone('juste', 12) : null), s.l)));

      if (complet) {
        zone.replaceChildren(h('div', { class: 'ecran puzzle' }, mini,
          h('h2', { class: 'question' }, 'Ta fiche est prête'),
          h('p', { class: 'aide' }, 'Touche une pièce pour la reprendre.'),
          h('div', { class: 'revue' }, round.slots.map((s) => h('button', { class: 'revue-ligne', onClick: () => retirer(s) }, h('b', {}, s.l), h('span', {}, place[s.k].t)))),
          barrePied(continuer('Vérifier', suite))));
        return;
      }
      const carte = pile[0];
      zone.replaceChildren(h('div', { class: 'ecran puzzle' }, mini,
        h('div', { class: `paquet ${pile.length > 1 ? 'epais' : ''}` }, h('div', { class: 'pile' },
          h('article', { class: 'carte-piece', 'data-cle': repere(carte.de === a.id ? carte.k : 'piege') }, h('p', {}, carte.t)))),
        h('div', { class: 'dock' },
          h('p', { class: 'dock-titre' }, 'Où va cette pièce\u00a0?'),
          h('div', { class: 'vers-grille' }, round.slots.map((s) => h('button', { class: `vers ${place[s.k] ? 'occupe' : ''}`, 'data-k': s.k, onClick: () => poser(s.k) }, s.l))),
          h('div', { class: 'dock-bas' },
            fantome('ecarter', 'Écarter', ecarter),
            fantome('plusTard', 'Plus tard', plusTard, { disabled: pile.length < 2 })))));
    }
    rendre();
    window.scrollTo(0, 0);
  });

  let bons = 0;
  const lignes = round.slots.map((s) => {
    const b = place[s.k]; const ok = b.de === a.id && b.k === s.k;
    if (ok) bons++;
    ctx.combo(ok, true);
    const origine = !ok && b.de !== a.id ? ix.parId.get(b.de) : null;
    if (origine) ctx.noter(a.id, false, origine.id);
    return h('details', { class: `verif ${ok ? 'juste' : 'faux'}`, open: !ok },
      h('summary', {}, h('span', { class: 'option-marque' }, icone(ok ? 'juste' : 'faux', 15)), s.l, icone('chevron', 16)),
      h('p', {}, b.t),
      !ok ? h('p', { class: 'verif-pourquoi' }, origine ? `Cette pièce vient de ${origine.court}, ${origine.an}.` : 'Bonne affaire, mauvaise rubrique.') : null,
      !ok ? h('p', { class: 'verif-bon' }, a[s.k]) : null);
  });
  ctx.sonner(bons === 4);
  await new Promise((suite) => {
    zone.replaceChildren(h('div', { class: 'ecran puzzle' },
      h('h2', { class: 'question' }, `${bons} pièce${bons > 1 ? 's' : ''} sur 4 en place`),
      h('div', { class: 'verifs' }, lignes),
      barrePied(continuer('Passer au problème de droit', suite))));
    window.scrollTo(0, 0);
  });
  const r1 = await qcm(zone, ctx, { surtitre: 'Vu ces faits et cette solution', question: 'Quel était le problème de droit\u00a0?', options: round.problemes.map((o) => ({ ...o })), pourquoiBon: 'C’est la question que l’arrêt tranche.', indice: a.h ? `${a.h.split('. ')[0]}.` : undefined });
  const r2 = await qcm(zone, ctx, { surtitre: 'Dernière pièce', question: 'De quel arrêt s’agit-il\u00a0?', options: round.noms.map((n) => ({ t: `${n.nom}, ${n.an}`, ok: n.id === a.id, id: n.id })), pourquoiBon: a.ap[a.zones[0]] });
  if (!r2.ok) ctx.noter(a.id, false, r2.choix.id);
  const ok = bons === 4 && r1.ok && r2.ok;
  ctx.noter(a.id, ok || (bons >= 3 && r2.ok));
  const score = (bons / 4) * 0.5 + (r1.ok ? 0.3 : 0) + (r2.ok ? 0.2 : 0);
  ctx.gain(Math.round(30 * score) + (ok ? 10 : 0), Math.round(6 * score) + (ok ? 2 : 0));
  finEpreuve(zone, ctx, { score, parfait: ok }, revelation(a, ix));
}

// LE JUGE, C'EST TOI : on entre dans la salle d'audience ------------------------------
// Les trois coups : les portes du Palais ont remplacé le lever de rideau.
export function ouverture() { son('audience'); }

export async function jouerJuge(zone, ctx, round, ix) {
  const a = ix.parId.get(round.id);
  ctx.decor(salleAudience());
  zone.classList.add('en-audience');
  ouverture();
  const r1 = await qcm(zone, ctx, {
    dossier: true, frappe: true, surtitre: 'Le dossier', question: round.c, options: round.decisions.map((o) => ({ ...o })),
    pourquoiBon: 'C’est ce que le juge a décidé.',
    indice: jumeaux(ix, a.id)[0]?.f.p,
  });
  const r2 = await qcm(zone, ctx, {
    surtitre: 'Ta motivation', question: 'Pourquoi cette solution\u00a0?', options: round.raisons.map((o) => ({ ...o })),
    pourquoiBon: 'C’est le raisonnement de l’arrêt.', indice: a.ap[a.zones[0]],
    avant: h('p', { class: 'rappel-decision' }, round.decisions.find((d) => d.ok).t),
  });
  const ok = r1.ok && r2.ok;
  ctx.noter(a.id, ok);
  if (ok) etat.stats.juge++;
  const score = (r1.ok ? 0.5 : 0) + (r2.ok ? 0.5 : 0);
  ctx.gain(Math.round(26 * score) + (ok ? 6 : 0), Math.round(5 * score) + (ok ? 2 : 0));
  finEpreuve(zone, ctx, { score, parfait: ok }, h('p', { class: 'surtitre' }, ok ? 'Tu as jugé comme le juge.' : 'La vraie décision'), revelation(a, ix));
}

// LE BON PLAN : un plan par carte, à faire glisser -----------------------------------
const feuillePlan = (p, classe = '', attrs = {}) => h('div', { class: `feuille-plan ${classe}`, ...attrs },
  h('p', { class: 'p1' }, h('b', {}, 'I'), p[1]),
  h('p', { class: 'p2' }, h('b', {}, 'A'), p['1a']),
  h('p', { class: 'p2' }, h('b', {}, 'B'), p['1b']),
  h('p', { class: 'p1' }, h('b', {}, 'II'), p[2]),
  h('p', { class: 'p2' }, h('b', {}, 'A'), p['2a']),
  h('p', { class: 'p2' }, h('b', {}, 'B'), p['2b']));

// Le bandeau de l'arrêt : le texte reste à portée de main pendant tout le commentaire.
export function bandeauArret(s, ouvert = false) {
  const a = s.arret;
  return h('details', { class: 'bandeau-arret', open: ouvert },
    h('summary', {}, h('span', {}, h('b', {}, 'Lire l’arrêt'), h('small', {}, `${a.ref}, ${a.date}`)), icone('chevron', 18)),
    h('div', { class: 'bandeau-texte' },
      h('p', { class: 'bandeau-resume' }, a.res),
      a.txt.map((t) => h('blockquote', {}, t)),
      h('small', {}, `Version courte. Faits résumés, citations reprises de ${a.source.charAt(0).toLowerCase()}${a.source.slice(1)}.`)));
}
const NOM_PARTIE = { '1a': 'I.A', '1b': 'I.B', '2a': 'II.A', '2b': 'II.B' };

export async function jouerPlan(zone, ctx, round) {
  const s = round.sujet;
  const bandeau = s.arret ? bandeauArret(s) : null;
  if (s.arret) {
    await new Promise((suite) => {
      zone.replaceChildren(h('div', { class: 'ecran commentaire' },
        h('div', { class: 'ecran-corps' }, h('p', { class: 'surtitre' }, TYPE[s.type]), h('h2', { class: 'question' }, s.titre), bandeauArret(s, true)),
        barrePied(continuer('Voir les plans', suite))));
      window.scrollTo(0, 0);
    });
  }
  const choixPlan = await new Promise((suite) => {
    let fait = false;
    const cartes = round.plans.map((p, i) => { p.el = feuillePlan(p.plan, 'plan-carte', { 'data-ok': repere(!!p.ok), 'aria-label': `Plan ${i + 1}` }); return p.el; });
    const rail = h('div', { class: 'plans-rail' }, cartes);
    const pas = () => cartes[1].offsetLeft - cartes[0].offsetLeft;
    const index = () => Math.max(0, Math.min(cartes.length - 1, Math.round(rail.scrollLeft / pas())));
    const allerA = (i) => { son('tap'); rail.scrollTo({ left: pas() * i, behavior: 'smooth' }); };
    const points = h('div', { class: 'points' }, cartes.map((_, i) => h('button', { 'aria-label': `Voir le plan ${i + 1}`, onClick: () => allerA(i) }, h('i'))));
    const bouton = continuer('Retenir le plan 1', () => retenir());
    const pied = barrePied(bouton);
    function maj() {
      const k = index();
      [...points.children].forEach((p, i) => p.classList.toggle('actif', i === k));
      cartes.forEach((c, i) => c.classList.toggle('centree', i === k));
      if (!fait) bouton.textContent = `Retenir le plan ${k + 1}`;
    }
    function retenir() {
      if (fait) return;
      fait = true;
      const p = round.plans[index()];
      ctx.combo(p.ok);
      p.el.classList.add('choisi');
      round.plans.forEach((x) => x.el.classList.add(x.ok ? 'juste' : 'faux'));
      pied.replaceChildren(h('p', { class: `verdict ${p.ok ? 'juste' : 'faux'}` }, p.ok ? 'Bien vu. ' : 'Ce n’était pas le plus judicieux. ', s.m),
        continuer('Diagnostiquer les plans', () => suite(p)));
      if (!p.ok) rail.scrollTo({ left: pas() * round.plans.findIndex((x) => x.ok), behavior: 'smooth' });
    }
    rail.addEventListener('scroll', maj, { passive: true });
    zone.replaceChildren(h('div', { class: 'ecran bonplan' },
      h('div', { class: 'ecran-corps' }, bandeau, h('p', { class: 'surtitre' }, TYPE[s.type]), h('h2', { class: 'question' }, s.titre), h('p', { class: 'aide' }, s.pb)),
      rail, points, pied));
    maj();
    window.scrollTo(0, 0);
  });
  // Justifier une partie du bon plan par une phrase de l'arrêt : une seule, deux en version longue.
  const parties = s.arret ? melange(Object.keys(s.arret.just)).slice(0, ctx.long ? 2 : 1) : [];
  let justesBonnes = 0;
  for (const c of parties) {
    const j = s.arret.just[c];
    const r = await qcm(zone, ctx, {
      classe: 'diagnostic', surtitre: `Justifie le ${NOM_PARTIE[c]}`, question: `Quelle phrase de l’arrêt fonde « ${s.bon[c].t} » ?`,
      options: melange([{ t: j.bon, ok: true }, ...j.faux.map((t) => ({ t, ok: false, w: 'Cette phrase ne fonde pas cette partie.' }))]),
      pourquoiBon: j.w, avant: bandeauArret(s),
    });
    if (r.ok) justesBonnes++;
  }
  const diagnostics = s.arret && !ctx.long ? round.diagnostics.slice(0, 1) : round.diagnostics;
  let diagBons = 0; let i = 0;
  for (const d of diagnostics) {
    i++;
    const r = await qcm(zone, ctx, {
      classe: 'diagnostic', surtitre: `Diagnostic ${i} sur ${diagnostics.length}`, question: 'Quel est le vrai défaut de ce plan\u00a0?',
      options: d.options.map((o) => ({ t: o.l, ok: o.ok, w: `${o.t} Ce n’est pas le problème ici.` })), pourquoiBon: d.pourquoi,
      avant: feuillePlan(d.plan, 'plan-rappel'),
    });
    if (r.ok) diagBons++;
  }
  const ok = choixPlan.ok && diagBons === diagnostics.length && justesBonnes === parties.length;
  if (ok) etat.stats.plan++;
  const score = s.arret
    ? (choixPlan.ok ? 0.4 : 0) + 0.3 * (justesBonnes / parties.length) + 0.3 * (diagBons / diagnostics.length)
    : (choixPlan.ok ? 0.4 : 0) + 0.6 * (diagBons / diagnostics.length);
  ctx.gain(Math.round(32 * score) + (ok ? 8 : 0), Math.round(7 * score) + (ok ? 2 : 0));
  if (!s.arret) { ctx.fin({ score, parfait: ok }); return; }
  finEpreuve(zone, ctx, { score, parfait: ok },
    h('p', { class: 'surtitre' }, ok ? 'Commentaire sans faute.' : 'Le corrigé'),
    h('article', { class: 'revelation corrige-plan' },
      h('h3', {}, 'Le plan et ses appuis'),
      Object.entries(s.arret.just).map(([c, j]) => h('div', { class: 'rubrique' }, h('h3', {}, `${NOM_PARTIE[c]}. ${s.bon[c].t}`), h('blockquote', {}, j.bon)))));
}

// ARCHITECTE : le plan se construit sous les yeux, un intitulé à la fois -----------------
export async function jouerArchitecte(zone, ctx, round, ix) {
  const s = round.sujet; const place = {};
  const bandeau = s.arret ? bandeauArret(s) : null;
  let pile = round.titres.map((t) => ({ ...t }));
  let ecartes = [];
  await new Promise((suite) => {
    function rendre() {
      const complet = CASES.every((c) => place[c]);
      if (!complet && !pile.length) {
        pile = ecartes; ecartes = [];
        toast('Il manque des intitulés : ceux que tu as écartés reviennent.');
      }
      const tuile = pile[0];
      const lignes = CASES.map((c) => {
        const t = place[c];
        return h('button', {
          class: `case-plan ${c.length === 1 ? 'partie' : 'sous'} ${t ? 'pleine' : ''} ${tuile && !t ? 'cible' : ''}`, 'data-c': repere(c),
          'aria-label': `${NOM_CASE[c]} : ${t ? t.t : 'vide'}`,
          onClick: () => {
            if (tuile) { pile.shift(); if (t) pile.push(t); place[c] = tuile; son('carte'); vibrer(8); } else if (t) { delete place[c]; pile.unshift(t); son('retour'); }
            rendre();
          },
        }, h('b', {}, NOM_CASE[c]), t ? h('span', {}, t.t) : h('span', { class: 'vide' }, 'À construire'));
      });
      const ecarter = () => { ecartes.push(pile.shift()); son('ecart'); vibrer(8); rendre(); };
      const plusTard = () => { pile.push(pile.shift()); son('carte'); rendre(); };
      zone.replaceChildren(h('div', { class: 'ecran architecte' },
        h('div', { class: 'ecran-corps' }, bandeau, h('p', { class: 'surtitre' }, TYPE[s.type]), h('h2', { class: 'question' }, s.titre), h('div', { class: 'squelette' }, lignes)),
        h('div', { class: 'dock' },
          tuile ? h('article', { class: 'tuile', 'data-case': repere(tuile.c || 'leurre') }, tuile.t) : null,
          tuile ? h('div', { class: 'dock-bas' }, fantome('ecarter', 'Écarter', ecarter), fantome('plusTard', 'Plus tard', plusTard, { disabled: pile.length < 2 })) : null,
          complet ? barrePied(continuer('Comparer au plan modèle', suite)) : null)));
    }
    rendre();
    window.scrollTo(0, 0);
  });
  // A et B peuvent s'inverser au sein d'une partie : seul compte le bon rattachement.
  const bonneCase = (c) => {
    const t = place[c];
    if (!t.c) return false;
    if (c.length === 1) return t.c === c;
    return t.c[0] === c[0] && t.c.length === 2;
  };
  const justes = CASES.filter(bonneCase).length;
  ctx.combo(justes >= 5);
  await new Promise((suite) => {
    zone.replaceChildren(h('div', { class: 'ecran architecte' },
      h('h2', { class: 'question' }, `${justes} intitulés sur 6 au bon endroit`),
      h('div', { class: 'squelette' }, CASES.map((c) => h('div', { class: `case-plan ${c.length === 1 ? 'partie' : 'sous'} ${bonneCase(c) ? 'juste' : 'faux'}` }, h('b', {}, NOM_CASE[c]), h('span', {}, place[c].t)))),
      h('details', { class: 'pli', open: justes < 6 }, h('summary', {}, 'Le plan modèle', icone('chevron', 16)),
        feuillePlan({ 1: s.bon[1], '1a': s.bon['1a'].t, '1b': s.bon['1b'].t, 2: s.bon[2], '2a': s.bon['2a'].t, '2b': s.bon['2b'].t })),
      h('p', { class: 'verdict' }, s.m),
      barrePied(continuer(round.placements.length ? 'Placer les arrêts' : 'Continuer', suite))));
    window.scrollTo(0, 0);
  });
  let arretsBons = 0;
  const places = round.placements.slice(0, 6);
  for (let i = 0; i < places.length; i++) {
    const p = places[i]; const a = ix.parId.get(p.id);
    const z = a.zones.find((x) => s.zones.includes(x)) ?? a.zones[0];
    const r = await qcm(zone, ctx, {
      surtitre: `Arrêt ${i + 1} sur ${places.length}`,
      question: `Où places-tu ${a.court}, ${a.an}\u00a0?`,
      options: ['1a', '1b', '2a', '2b'].map((c) => ({ t: `${c[0] === '1' ? 'I' : 'II'}.${NOM_CASE[c]}  ${s.bon[c].t}`, ok: c === p.c, w: null })),
      pourquoiBon: a.ap[z],
    });
    ctx.noter(a.id, r.ok);
    if (r.ok) arretsBons++;
  }
  const partArrets = places.length ? arretsBons / places.length : 1;
  const score = (justes / 6) * 0.5 + partArrets * 0.5;
  const ok = justes === 6 && partArrets === 1;
  if (ok) etat.stats.archi++;
  ctx.gain(Math.round(42 * score) + (ok ? 10 : 0), Math.round(9 * score) + (ok ? 3 : 0));
  ctx.fin({ score, parfait: ok });
}

export const JEUX = { paires: jouerPaires, puzzle: jouerPuzzle, juge: jouerJuge, plan: jouerPlan, architecte: jouerArchitecte, qualif: jouerPaires };
export const NOMS_MODES = {
  atelier: ['L’atelier du cas pratique', 'Construire sa copie : faits, problèmes, syllogismes, conseil'],
  paires: ['Paires', 'Relier arrêts, apports et années, contre la montre'],
  puzzle: ['Puzzle d’arrêt', 'Reconstituer la fiche, puis trouver le problème de droit'],
  juge: ['Le juge, c’est toi', 'Trancher une affaire et motiver ta décision'],
  plan: ['Le bon plan', 'Choisir le meilleur plan et diagnostiquer les autres'],
  architecte: ['Architecte', 'Construire un plan et y placer les arrêts'],
  frise: ['Frise de la jurisprudence', 'Placer chaque décision à sa date'],
};
export const NOMS_MODES_OBLIG = {
  atelier: ['L’atelier du cas pratique', 'Construire sa copie : faits, problèmes, syllogismes, conseil'],
  cas: ['Le juge du cas pratique', 'Suivre la méthode, étape par étape, jusqu’au jugement'],
  qualif: ['Qualifier les faits', 'Relier des faits à la bonne notion, contre la montre'],
  remede: ['Quel remède ?', 'Choisir la sanction, puis ce qui la justifie'],
  frise: ['Frise de la jurisprudence', 'Placer chaque décision à sa date'],
  plan: ['Le bon plan', 'Choisir le meilleur plan et diagnostiquer les autres'],
};
export const NOMS_MODES_CONSTIT = {
  pouvoirs: ['L’architecte des pouvoirs', 'Relier les organes : qui élit, nomme, renverse, dissout'],
  nuancier: ['Le nuancier des États', 'De l’État unitaire à la confédération, chaque État à sa nuance'],
  plume: ['La plume du constituant', 'Rétablir un article, puis le sceller de sa source'],
  mot: ['Le mot du juriste', 'Six essais pour trouver le mot d’une définition'],
  quiadit: ['Qui a dit ?', 'Une citation de la plaquette, quatre auteurs'],
  memory: ['Memory', 'Retrouver chaque notion et sa définition'],
  frise: ['La frise', 'De la Grande Charte à 1830, chaque étape à sa date'],
};
export const NOMS_MODES_INTRO = {
  tri: ['Le tri du greffe', 'Droit, morale, religion ou convenance : jette la carte du bon côté'],
  mot: ['Le mot du juriste', 'Six essais pour trouver le mot d’une définition'],
  rangement: ['Le grand rangement', 'Ranger les disciplines avant qu’elles touchent le sol'],
  quiadit: ['Qui a dit ?', 'Une citation du cours, quatre auteurs'],
  scanner: ['Au scanner', 'Ce texte est-il une règle de droit ?'],
  memory: ['Memory', 'Retrouver chaque notion et sa définition'],
  frise: ['La frise', 'Du droit romain à 2008, chaque étape à sa date'],
};
