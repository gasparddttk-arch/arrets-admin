// Les cinq modes de jeu. Chaque mode dessine son écran dans `zone` et appelle ctx.fin(resultat).
import { h, icone, son, toast } from './ui.js';
import { etat, sauver } from './state.js';
import { jumeaux, melange, CASES } from './engine.js';

const NOM_CASE = { 1: 'I', '1a': 'A', '1b': 'B', 2: 'II', '2a': 'A', '2b': 'B' };
const nomArret = (a) => h('cite', {}, a.nom);

// Bouton de confirmation placé dans la zone du pouce.
export const continuer = (label, action, attrs = {}) => h('button', { class: 'cta', onClick: action, ...attrs }, label);
const barrePied = (...b) => h('div', { class: 'pied' }, ...b);

function barreJokers(ctx, { recuser, indice, prolonger }) {
  if (ctx.boss) return null;
  const inv = etat.inv; const items = [];
  const bouton = (id, nom, action) => {
    if (!inv[id]) return;
    const b = h('button', { class: 'joker', 'aria-label': `${nom}, ${inv[id]} restants`, onClick: () => {
      if (!inv[id] || b.disabled) return;
      inv[id]--; sauver(); son('jeton'); action(); b.disabled = true;
      const c = b.querySelector('b'); if (c) c.textContent = inv[id];
    } }, icone(id, 18), h('span', {}, nom), h('b', {}, inv[id]));
    items.push(b);
  };
  if (recuser) bouton('recusation', 'Récusation', recuser);
  if (indice) bouton('indice', 'Note du rapporteur', indice);
  if (prolonger) bouton('prorogation', 'Prorogation', prolonger);
  return items.length ? h('div', { class: 'jokers' }, items) : null;
}

// Question à choix : après la réponse, chaque proposition affiche sa justification.
function qcm(zone, ctx, { question, options, pourquoiBon, indice, surtitre, id, apresRendu }) {
  return new Promise((fini) => {
    let repondu = false;
    const bloc = h('div', { class: 'qcm' });
    const lignes = options.map((o) => {
      const b = h('button', { class: 'option', onClick: () => choisir(o, b) }, h('span', { class: 'option-t' }, o.t));
      o.el = b; return b;
    });
    const noteIndice = h('p', { class: 'indice', hidden: true }, indice || '');
    function choisir(o, b) {
      if (repondu) return;
      repondu = true;
      ctx.combo(o.ok); son(o.ok ? 'ok' : 'ko');
      b.classList.add('choisi');
      for (const x of options) {
        x.el.disabled = true;
        x.el.classList.add(x.ok ? 'juste' : 'faux');
        const txt = x.ok ? pourquoiBon : x.w;
        if (txt) x.el.append(h('span', { class: 'option-w' }, txt));
      }
      bloc.querySelector('.jokers')?.remove();
      const pied = barrePied(continuer('Continuer', () => fini({ ok: o.ok, choix: o })));
      bloc.append(pied);
      pied.querySelector('button').focus({ preventScroll: true });
      pied.scrollIntoView({ block: 'end', behavior: 'smooth' });
    }
    const jokers = barreJokers(ctx, {
      recuser: () => {
        const faux = options.filter((o) => !o.ok && !o.el.classList.contains('retire'));
        if (faux.length > 1) { const f = faux[Math.floor(Math.random() * faux.length)]; f.el.classList.add('retire'); f.el.disabled = true; }
      },
      indice: indice ? () => { noteIndice.hidden = false; } : null,
    });
    bloc.append(
      surtitre ? h('p', { class: 'surtitre' }, surtitre) : null,
      h('h2', { class: question.length > 90 ? 'question longue' : 'question' }, question),
      noteIndice, jokers, h('div', { class: 'options' }, lignes),
    );
    zone.replaceChildren(bloc);
    apresRendu?.(bloc); void id;
  });
}

// La fiche de révélation, qui suit chaque épreuve : c'est là que l'arrêt devient familier.
export function revelation(a, ix, { zoneId } = {}) {
  const z = zoneId ?? a.zones[0];
  const jum = jumeaux(ix, a.id).slice(0, 3);
  return h('article', { class: 'revelation' },
    h('div', { class: 'revelation-tete' },
      h('span', { class: 'annee' }, a.an),
      h('div', {}, h('h3', {}, a.nom), h('p', { class: 'ref' }, a.ref))),
    h('p', { class: 'apport' }, a.ap[z] || Object.values(a.ap)[0]),
    h('p', { class: 'histoire' }, a.h),
    jum.length ? h('div', { class: 'jumeaux' },
      h('h4', {}, 'À ne pas confondre avec'),
      h('ul', {}, jum.map((j) => h('li', {}, h('b', {}, `${ix.parId.get(j.id).nom} (${ix.parId.get(j.id).an})`), ' ', j.k)))) : null,
  );
}

// PAIRES -------------------------------------------------------------------
export function jouerPaires(zone, ctx, round, ix) {
  const g = round.grille; const lignes = g.lignes;
  const duree = (g.variante === 'annee' ? 34 : 50);
  let restant = duree; let actif = null; let finis = 0; let erreurs = 0; let arrete = false; let minuteur;
  const noms = melange(lignes, Math.random); const textes = melange(lignes, Math.random);
  const barre = h('div', { class: 'temps', role: 'timer', 'aria-label': 'Temps restant' }, h('i'));
  const consigne = g.variante === 'annee' ? 'Associe chaque arrêt à son année'
    : g.variante === 'jumeaux' ? `Faux jumeaux : ${g.famille.titre}` : 'Associe chaque arrêt à son apport';

  const chipsNoms = noms.map((l) => { const b = h('button', { class: 'chip', onClick: () => viser(l, b) }, l.nom); l.elN = b; return b; });
  const cartes = textes.map((l) => { const b = h('button', { class: `carte-paire ${g.variante === 'annee' ? 'annee-carte' : ''}`, onClick: () => tenter(l, b) }, l.t); l.elT = b; return b; });

  function viser(l, b) {
    if (arrete || l.fait) return;
    son('tap'); chipsNoms.forEach((c) => c.classList.remove('vise'));
    actif = l; b.classList.add('vise');
  }
  function tenter(l, b) {
    if (arrete || l.fait) return;
    if (!actif) { b.classList.add('secoue'); setTimeout(() => b.classList.remove('secoue'), 300); toast('Choisis d’abord un arrêt.'); return; }
    if (l === actif) {
      l.fait = true; finis++;
      ctx.combo(true); son('ok'); ctx.noter(l.id, !l.rate);
      l.elN.classList.add('reussi'); l.elN.classList.remove('vise'); b.classList.add('reussi');
      l.elN.disabled = true; b.disabled = true;
      b.prepend(h('span', { class: 'carte-nom' }, `${l.nom}, ${ix.parId.get(l.id).ref}`));
      actif = null;
      if (finis === lignes.length) terminer();
    } else {
      erreurs++; actif.rate = true;
      ctx.combo(false); son('ko'); ctx.noter(actif.id, false, l.id);
      b.classList.add('secoue'); actif.elN.classList.add('secoue');
      const a = actif.elN; setTimeout(() => { b.classList.remove('secoue'); a.classList.remove('secoue'); }, 340);
      if (ctx.touche()) terminer();
    }
  }
  function tick() {
    restant -= 0.1; barre.firstChild.style.width = `${Math.max(0, restant / duree * 100)}%`;
    if (restant <= 8) barre.classList.add('urgent');
    if (restant <= 0) terminer(true);
  }
  function terminer(tempsEcoule) {
    if (arrete) return;
    arrete = true; clearInterval(minuteur);
    const manques = lignes.filter((l) => !l.fait);
    for (const l of manques) { ctx.noter(l.id, false); l.elT.classList.add('manque'); l.elT.prepend(h('span', { class: 'carte-nom' }, `${l.nom}, ${ix.parId.get(l.id).ref}`)); l.elN.disabled = true; l.elT.disabled = true; }
    const score = Math.max(0, (finis - erreurs * 0.5) / lignes.length);
    const parfait = finis === lignes.length && !erreurs;
    ctx.gain(finis * 5 + (parfait ? 10 : 0), finis + (parfait ? 3 : 0));
    if (tempsEcoule) toast('Temps écoulé.');
    const piege = g.famille ? h('p', { class: 'piege' }, g.famille.p) : null;
    zone.querySelector('.paires').append(piege, barrePied(continuer('Continuer', () => ctx.fin({ score, parfait }))));
    zone.querySelector('.pied button').scrollIntoView({ block: 'end', behavior: 'smooth' });
  }
  const jokers = barreJokers(ctx, { prolonger: () => { restant = Math.min(duree + 15, restant + 15); barre.classList.remove('urgent'); } });
  zone.replaceChildren(h('div', { class: 'paires' },
    h('h2', { class: 'question' }, consigne), barre, jokers,
    h('div', { class: 'chips' }, chipsNoms),
    h('div', { class: `cartes-paires ${g.variante === 'annee' ? 'grille-annees' : ''}` }, cartes)));
  minuteur = setInterval(tick, 100);
  ctx.nettoyage(() => clearInterval(minuteur));
}

// PUZZLE -------------------------------------------------------------------
export async function jouerPuzzle(zone, ctx, round, ix) {
  const a = ix.parId.get(round.id);
  const place = {}; let idx = 0;
  const blocs = round.blocs.map((b) => ({ ...b }));
  await new Promise((suite) => {
    const rendre = () => {
      const fente = round.slots.map((s, i) => {
        const b = place[s.k];
        return h('button', {
          class: `fente ${i === idx && !b ? 'active' : ''} ${b ? 'pleine' : ''}`,
          'aria-label': b ? `${s.l} rempli, toucher pour retirer` : `${s.l} vide`,
          onClick: () => { if (b) delete place[s.k]; idx = i; rendre(); },
        }, h('span', {}, s.l), b ? h('small', {}, `${b.t.slice(0, 48)}…`) : null);
      });
      const libres = blocs.filter((b) => !Object.values(place).includes(b));
      const liste = libres.map((b) => h('button', { class: 'bloc', onClick: () => {
        son('tap');
        place[round.slots[idx].k] = b;
        const suivant = round.slots.findIndex((s) => !place[s.k]);
        idx = suivant === -1 ? idx : suivant;
        rendre();
      } }, b.t));
      const complet = round.slots.every((s) => place[s.k]);
      zone.replaceChildren(h('div', { class: 'puzzle' },
        h('h2', { class: 'question' }, `Pose la pièce «\u00a0${round.slots[idx].l}\u00a0»`),
        h('p', { class: 'aide' }, 'Reconstitue l’arrêt. Certaines pièces viennent d’un autre arrêt.'),
        h('div', { class: 'fentes' }, fente),
        h('div', { class: 'blocs' }, liste),
        complet ? barrePied(continuer('Vérifier', suite)) : null));
    };
    rendre();
  });
  let bons = 0;
  const lignes = round.slots.map((s) => {
    const b = place[s.k]; const ok = b.de === a.id && b.k === s.k;
    if (ok) bons++;
    ctx.combo(ok);
    const origine = !ok && b.de !== a.id ? ix.parId.get(b.de) : null;
    if (origine) ctx.noter(a.id, false, origine.id);
    return h('div', { class: `verif ${ok ? 'juste' : 'faux'}` },
      h('h4', {}, s.l), h('p', {}, b.t),
      !ok ? h('p', { class: 'option-w' }, origine ? `Cette pièce vient de ${origine.nom} (${origine.an}).` : 'Bonne affaire, mauvaise rubrique.') : null,
      !ok ? h('p', { class: 'option-bon' }, a[s.k]) : null);
  });
  son(bons === 4 ? 'ok' : 'ko');
  await new Promise((suite) => {
    zone.replaceChildren(h('div', { class: 'puzzle' },
      h('h2', { class: 'question' }, `${bons} pièce${bons > 1 ? 's' : ''} sur 4 en place`), lignes,
      barrePied(continuer('Passer au problème de droit', suite))));
    zone.scrollTop = 0; window.scrollTo(0, 0);
  });
  const r1 = await qcm(zone, ctx, { surtitre: 'Vu ces faits et cette solution', question: 'Quel était le problème de droit ?', options: round.problemes.map((o) => ({ ...o })), pourquoiBon: 'C’est la question que l’arrêt tranche.', indice: a.h.split('. ')[0] + '.' });
  const r2 = await qcm(zone, ctx, { surtitre: 'Dernière pièce', question: 'De quel arrêt s’agit-il ?', options: round.noms.map((n) => ({ t: `${n.nom}, ${n.an}`, ok: n.id === a.id, id: n.id })), pourquoiBon: a.ap[a.zones[0]] });
  if (!r2.ok) ctx.noter(a.id, false, r2.choix.id);
  const ok = bons === 4 && r1.ok && r2.ok;
  ctx.noter(a.id, ok || (bons >= 3 && r2.ok));
  const score = (bons / 4) * 0.5 + (r1.ok ? 0.3 : 0) + (r2.ok ? 0.2 : 0);
  ctx.gain(Math.round(30 * score) + (ok ? 10 : 0), Math.round(6 * score) + (ok ? 2 : 0));
  zone.replaceChildren(h('div', { class: 'fin-epreuve' }, revelation(a, ix), barrePied(continuer('Continuer', () => ctx.fin({ score, parfait: ok })))));
  window.scrollTo(0, 0);
}

// LE JUGE, C'EST TOI ---------------------------------------------------------
export async function jouerJuge(zone, ctx, round, ix) {
  const a = ix.parId.get(round.id);
  const entete = (t) => h('div', { class: 'dossier' }, h('p', {}, t));
  const r1 = await qcm(zone, ctx, {
    surtitre: 'Le dossier', question: round.c, options: round.decisions.map((o) => ({ ...o })),
    pourquoiBon: 'C’est ce que le juge a décidé.',
    indice: jumeaux(ix, a.id)[0]?.f.p,
  });
  const r2 = await qcm(zone, ctx, {
    surtitre: 'Ta motivation', question: 'Pourquoi cette solution ?', options: round.raisons.map((o) => ({ ...o })),
    pourquoiBon: 'C’est le raisonnement de l’arrêt.', indice: a.ap[a.zones[0]],
    apresRendu: (b) => b.prepend(entete(round.decisions.find((d) => d.ok).t)),
  });
  const ok = r1.ok && r2.ok;
  ctx.noter(a.id, ok);
  if (ok) etat.stats.juge++;
  const score = (r1.ok ? 0.5 : 0) + (r2.ok ? 0.5 : 0);
  ctx.gain(Math.round(26 * score) + (ok ? 6 : 0), Math.round(5 * score) + (ok ? 2 : 0));
  zone.replaceChildren(h('div', { class: 'fin-epreuve' },
    h('p', { class: 'surtitre' }, ok ? 'Tu as jugé comme le Conseil.' : 'La vraie décision'),
    revelation(a, ix), barrePied(continuer('Continuer', () => ctx.fin({ score, parfait: ok })))));
  window.scrollTo(0, 0);
}

// LE BON PLAN ------------------------------------------------------------------
const feuillePlan = (p, extra = {}) => h(extra.tag || 'div', { class: `feuille-plan ${extra.class || ''}`, ...extra.attrs },
  h('p', { class: 'p1' }, h('b', {}, 'I. '), p[1]),
  h('p', { class: 'p2' }, h('b', {}, 'A. '), p['1a']),
  h('p', { class: 'p2' }, h('b', {}, 'B. '), p['1b']),
  h('p', { class: 'p1' }, h('b', {}, 'II. '), p[2]),
  h('p', { class: 'p2' }, h('b', {}, 'A. '), p['2a']),
  h('p', { class: 'p2' }, h('b', {}, 'B. '), p['2b']));

const TYPE = { D: 'Dissertation', C: 'Commentaire' };

export async function jouerPlan(zone, ctx, round) {
  const s = round.sujet;
  const choixPlan = await new Promise((suite) => {
    let fait = false;
    const plans = round.plans.map((p) => {
      const b = feuillePlan(p.plan, { tag: 'button', attrs: { onClick: () => {
        if (fait) return; fait = true;
        ctx.combo(p.ok); son(p.ok ? 'ok' : 'ko');
        b.classList.add('choisi');
        round.plans.forEach((x) => { x.el.classList.add(x.ok ? 'juste' : 'faux'); x.el.disabled = true; });
        zone.querySelector('.bonplan').append(
          h('p', { class: `verdict ${p.ok ? 'juste' : 'faux'}` }, p.ok ? 'Bien vu. ' : 'Ce n’était pas le plus judicieux. ', s.m),
          barrePied(continuer('Diagnostiquer les autres plans', () => suite(p))));
        zone.querySelector('.pied button').scrollIntoView({ block: 'end', behavior: 'smooth' });
      } } });
      p.el = b; return b;
    });
    zone.replaceChildren(h('div', { class: 'bonplan' },
      h('p', { class: 'surtitre' }, TYPE[s.type]), h('h2', { class: 'question' }, s.titre),
      h('p', { class: 'aide' }, s.pb),
      plans));
    window.scrollTo(0, 0);
  });
  let diagBons = 0; let i = 0;
  for (const d of round.diagnostics) {
    i++;
    const r = await qcm(zone, ctx, {
      surtitre: `Diagnostic ${i} sur ${round.diagnostics.length}`, question: 'Quel est le vrai défaut de ce plan ?',
      options: d.options.map((o) => ({ t: o.l, ok: o.ok, w: o.t + ' Ce n’est pas le problème ici.' })), pourquoiBon: d.pourquoi,
      apresRendu: (b) => b.insertBefore(feuillePlan(d.plan), b.querySelector('.options')),
    });
    if (r.ok) diagBons++;
    window.scrollTo(0, 0);
  }
  const ok = choixPlan.ok && diagBons === round.diagnostics.length;
  if (ok) etat.stats.plan++;
  const score = (choixPlan.ok ? 0.4 : 0) + 0.6 * (diagBons / round.diagnostics.length);
  ctx.gain(Math.round(32 * score) + (ok ? 8 : 0), Math.round(7 * score) + (ok ? 2 : 0));
  ctx.fin({ score, parfait: ok });
}

// ARCHITECTE -------------------------------------------------------------------
export async function jouerArchitecte(zone, ctx, round, ix) {
  const s = round.sujet; const place = {}; let idx = 0;
  const titres = round.titres.map((t) => ({ ...t }));
  await new Promise((suite) => {
    const rendre = () => {
      const lignes = CASES.map((c, i) => {
        const t = place[c];
        return h('button', {
          class: `case-plan ${c.length === 1 ? 'partie' : 'sous'} ${i === idx && !t ? 'active' : ''} ${t ? 'pleine' : ''}`,
          onClick: () => { if (t) delete place[c]; idx = i; rendre(); },
        }, h('b', {}, NOM_CASE[c]), t ? t.t : h('span', { class: 'vide' }, 'À construire'));
      });
      const libres = titres.filter((t) => !Object.values(place).includes(t));
      const complet = CASES.every((c) => place[c]);
      zone.replaceChildren(h('div', { class: 'architecte' },
        h('p', { class: 'surtitre' }, TYPE[s.type]), h('h2', { class: 'question' }, s.titre),
        h('div', { class: 'squelette' }, lignes),
        !complet ? h('p', { class: 'aide' }, 'Certains intitulés sont de trop.') : null,
        h('div', { class: 'tuiles' }, libres.map((t) => h('button', { class: 'tuile', onClick: () => {
          son('tap'); place[CASES[idx]] = t;
          const suivant = CASES.findIndex((c) => !place[c]); idx = suivant === -1 ? idx : suivant; rendre();
        } }, t.t))),
        complet ? barrePied(continuer('Comparer au plan modèle', suite)) : null));
    };
    rendre();
  });
  // A et B peuvent s'inverser au sein d'une partie : seul compte le bon rattachement.
  const bonneCase = (c) => {
    const t = place[c];
    if (!t.c) return false;
    if (c.length === 1) return t.c === c;
    return t.c[0] === c[0] && t.c.length === 2;
  };
  const justes = CASES.filter(bonneCase).length;
  ctx.combo(justes >= 5); son(justes >= 5 ? 'ok' : 'ko');
  await new Promise((suite) => {
    zone.replaceChildren(h('div', { class: 'architecte' },
      h('h2', { class: 'question' }, `${justes} intitulés sur 6 au bon endroit`),
      h('div', { class: 'squelette' }, CASES.map((c) => h('div', { class: `case-plan ${c.length === 1 ? 'partie' : 'sous'} ${bonneCase(c) ? 'juste' : 'faux'}` }, h('b', {}, NOM_CASE[c]), place[c].t))),
      h('h3', { class: 'titre-modele' }, 'Le plan modèle'),
      feuillePlan({ 1: s.bon[1], '1a': s.bon['1a'].t, '1b': s.bon['1b'].t, 2: s.bon[2], '2a': s.bon['2a'].t, '2b': s.bon['2b'].t }),
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
      question: `Où places-tu ${a.nom} (${a.an}) ?`,
      options: ['1a', '1b', '2a', '2b'].map((c) => ({ t: `${c[0] === '1' ? 'I' : 'II'}.${NOM_CASE[c]} ${s.bon[c].t}`, ok: c === p.c, w: null })),
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

export const JEUX = { paires: jouerPaires, puzzle: jouerPuzzle, juge: jouerJuge, plan: jouerPlan, architecte: jouerArchitecte };
export const NOMS_MODES = {
  paires: ['Paires', 'Relier arrêts, apports et années, contre la montre'],
  puzzle: ['Puzzle d’arrêt', 'Reconstituer la fiche, puis trouver le problème de droit'],
  juge: ['Le juge, c’est toi', 'Trancher une affaire et motiver ta décision'],
  plan: ['Le bon plan', 'Choisir le meilleur plan et diagnostiquer les autres'],
  architecte: ['Architecte', 'Construire un plan et y placer les arrêts'],
};
export { nomArret };
