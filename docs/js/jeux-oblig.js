// Les exercices du droit des obligations : le cas pratique, le remède, la frise.
import { h } from './ui.js';
import { icone, salleAudience } from './visuels.js';
import { son, vibrer } from './sons.js';
import { etat } from './state.js';
import { melange } from './engine.js';
import { qcm, finEpreuve, ouverture, barrePied, continuer, repere, fantome } from './games.js';

const noms = (ix, liens) => liens.map((id) => ix.parId.get(id)).filter(Boolean)
  .map((a) => (a.article ? a.nom : `${a.court}, ${a.an}`)).join(' · ');

// LE JUGE DU CAS PRATIQUE : le dossier, la méthode pas à pas, puis le jugement -------------
export async function jouerCas(zone, ctx, round, ix) {
  const x = ix.cas.find((c) => c.id === round.id);
  ctx.decor(salleAudience());
  zone.classList.add('en-audience');
  ouverture();
  let bons = 0;
  const n = x.etapes.length;
  for (let i = 0; i < n; i++) {
    const e = x.etapes[i];
    const options = melange([{ t: e.t, ok: true }, ...e.x.map((o) => ({ ...o, ok: false }))]);
    const titre = `Étape ${i + 1} sur ${n} : ${e.label}`;
    const r = await qcm(zone, ctx, i === 0
      ? { dossier: true, surtitre: x.source === 'Création' ? `Cas d’entraînement : ${x.titre}` : x.titre, question: x.c, sousQuestion: `${e.label} : ${e.q}`, options, pourquoiBon: e.w, classe: 'cas' }
      : { surtitre: titre, question: e.q, options, pourquoiBon: e.w, classe: 'cas', frappe: i === n - 1,
        avant: h('details', { class: 'rappel-dossier' }, h('summary', {}, 'Relire le dossier', icone('chevron', 16)), h('p', {}, x.c)) });
    if (r.ok) bons++;
  }
  const ok = bons === n;
  const score = bons / n;
  for (const id of x.liens) ctx.noter(id, ok);
  if (ok) etat.stats.cas++;
  ctx.gain(Math.round(34 * score) + (ok ? 8 : 0));
  finEpreuve(zone, ctx, { score, parfait: ok },
    h('p', { class: 'surtitre' }, ok ? 'Jugement sans faute.' : bons === 0 ? `Aucune étape sur ${n} réussie.` : `${bons} étape${bons > 1 ? 's' : ''} sur ${n} réussie${bons > 1 ? 's' : ''}.`),
    h('article', { class: 'revelation jugement' },
      h('h3', {}, 'Le jugement à retenir'), h('p', { class: 'apport' }, x.v),
      x.liens.length ? h('p', { class: 'ref' }, noms(ix, x.liens)) : null));
}

// QUEL REMÈDE ? : la voie à suivre, puis ce qui la justifie --------------------------------
export async function jouerRemede(zone, ctx, round, ix) {
  const situation = h('article', { class: 'situation' }, h('p', {}, round.c));
  const r1 = await qcm(zone, ctx, {
    surtitre: 'La situation', avant: situation, question: 'Que conseilles-tu ?', options: round.decisions.map((o) => ({ ...o })),
    pourquoiBon: 'C’est la voie à suivre.', classe: 'remede',
  });
  const bon = round.decisions.find((d) => d.ok).t;
  const r2 = await qcm(zone, ctx, {
    surtitre: 'La justification', avant: h('p', { class: 'rappel-decision' }, bon), question: 'Sur quoi te fondes-tu ?', options: round.raisons.map((o) => ({ ...o })),
    pourquoiBon: noms(ix, round.liens), classe: 'remede',
  });
  const ok = r1.ok && r2.ok;
  const score = (r1.ok ? 0.5 : 0) + (r2.ok ? 0.5 : 0);
  for (const id of round.liens) ctx.noter(id, ok);
  ctx.gain(Math.round(24 * score) + (ok ? 6 : 0));
  ctx.fin({ score, parfait: ok });
}

// FRISE DE LA JURISPRUDENCE : on place les étapes, puis on dit ce qui change ---------------
export async function jouerFrise(zone, ctx, round) {
  const n = round.etapes.length;
  const place = Array(n).fill(null);
  let pile = round.etapes.map((e) => ({ ...e }));
  await new Promise((suite) => {
    function rendre() {
      const carte = pile[0];
      const cases = place.map((e, i) => h('button', {
        class: `case-frise ${e ? 'pleine' : ''} ${carte && !e ? 'cible' : ''}`, 'data-i': repere(i),
        'aria-label': e ? `Étape ${i + 1} : ${e.n}` : `Étape ${i + 1}, vide`,
        onClick: () => {
          if (carte) { pile.shift(); if (e) pile.push(e); place[i] = carte; son('carte'); vibrer(8); } else if (e) { place[i] = null; pile.unshift(e); son('retour'); }
          rendre();
        },
      }, h('span', { class: 'case-rang' }, i + 1), e ? h('span', { class: 'case-t' }, h('b', {}, e.n), h('small', {}, e.t)) : h('span', { class: 'vide' }, 'À placer')));
      zone.replaceChildren(h('div', { class: 'ecran frise' },
        h('div', { class: 'ecran-corps' }, h('p', { class: 'surtitre' }, round.titre), h('h2', { class: 'question' }, 'Remets ces étapes dans l’ordre'),
          h('div', { class: 'frise-rail' }, cases)),
        h('div', { class: 'dock' },
          carte ? h('article', { class: 'tuile tuile-frise', 'data-rang': repere(carte.rang) }, h('b', {}, carte.n), h('span', {}, carte.t)) : null,
          carte && pile.length > 1 ? h('div', { class: 'dock-bas seul' }, fantome('plusTard', 'Plus tard', () => { pile.push(pile.shift()); son('carte'); rendre(); })) : null,
          !carte ? barrePied(continuer('Vérifier la frise', suite)) : null)));
    }
    rendre();
    window.scrollTo(0, 0);
  });
  const justes = place.filter((e, i) => e.rang === i).length;
  const tout = justes === n;
  ctx.combo(tout);
  const ordre = [...place].sort((a, b) => a.rang - b.rang);
  await new Promise((suite) => {
    zone.replaceChildren(h('div', { class: 'ecran frise' },
      h('p', { class: 'surtitre' }, round.p),
      h('h2', { class: 'question' }, justes === 0 ? `Aucune étape sur ${n} à sa place` : justes === 1 ? `1 étape sur ${n} à sa place` : `${justes} étapes sur ${n} à leur place`),
      h('ol', { class: 'frise-vraie' }, ordre.map((e) => h('li', { class: place[e.rang]?.rang === e.rang ? 'juste' : 'faux' },
        h('span', { class: 'frise-an' }, e.an), h('span', {}, h('b', {}, e.n), h('small', {}, e.ch))))),
      barrePied(continuer('Dernière question', suite))));
    window.scrollTo(0, 0);
  });
  const r = await qcm(zone, ctx, { surtitre: round.titre, question: round.q, options: round.options.map((o) => ({ ...o })), pourquoiBon: round.pourquoiBon, classe: 'frise-q' });
  const ok = tout && r.ok;
  const score = (justes / n) * 0.7 + (r.ok ? 0.3 : 0);
  for (const e of round.etapes) if (e.carte) ctx.noter(e.carte, ok || place[e.rang]?.rang === e.rang);
  if (ok) etat.stats.frise++;
  ctx.gain(Math.round(30 * score) + (ok ? 8 : 0));
  ctx.fin({ score, parfait: ok });
}
