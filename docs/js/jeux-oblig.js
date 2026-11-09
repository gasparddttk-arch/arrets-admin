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
  const reussites = [];
  for (let i = 0; i < n; i++) {
    const e = x.etapes[i];
    const options = melange([{ t: e.t, ok: true }, ...e.x.map((o) => ({ ...o, ok: false }))]);
    const titre = `Étape ${i + 1} sur ${n} : ${e.label}`;
    const r = await qcm(zone, ctx, i === 0
      ? { dossier: true, surtitre: x.source === 'Création' ? `Cas d’entraînement : ${x.titre}` : x.titre, question: x.c, sousQuestion: `${e.label} : ${e.q}`, options, pourquoiBon: e.w, classe: 'cas' }
      : { surtitre: titre, question: e.q, options, pourquoiBon: e.w, classe: 'cas', frappe: i === n - 1,
        avant: h('details', { class: 'rappel-dossier' }, h('summary', {}, 'Relire le dossier', icone('chevron', 16)), h('p', {}, x.c)) });
    if (r.ok) bons++;
    reussites.push(r.ok);
  }
  const ok = bons === n;
  const score = bons / n;
  // Chaque fiche suit les étapes qui la citent. Une fiche qu'aucune étape ne cite n'est jamais pénalisée.
  for (const id of x.liens) {
    const c = ix.parId.get(id);
    const cite = (e) => { const t = `${e.q} ${e.t} ${e.w}`; return c?.article ? new RegExp(`(^|[^\\d-])${c.num}(?![\\d-])`).test(t) : t.includes(c?.court); };
    const etapes = x.etapes.map((e, i) => (cite(e) ? i : -1)).filter((i) => i >= 0);
    if (etapes.length) ctx.noter(id, etapes.every((i) => reussites[i]));
    else if (ok) ctx.noter(id, true);
  }
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

// FRISE DE LA JURISPRUDENCE : les années sont posées, on place ce que chaque étape a décidé ------
// La première étape sert de point de départ. Une fois tout placé, on peut échanger deux décisions.
export async function jouerFrise(zone, ctx, round) {
  const mot = round.mot || 'décision';
  const etapes = [...round.etapes].sort((a, b) => a.rang - b.rang);
  const n = etapes.length;
  const place = etapes.map((e, i) => (i === 0 ? e : null));
  let pile = melange(etapes.slice(1), Math.random);
  let cible = 1; let choisie = null;
  const premiereVide = () => place.findIndex((x) => x === null);
  if (window.__app) window.__frise = { place };
  await new Promise((suite) => {
    function rendre() {
      const complet = premiereVide() === -1;
      if (!complet && (cible === null || place[cible])) cible = premiereVide();
      if (complet) cible = null;
      const jalons = etapes.map((e, i) => {
        const d = place[i];
        const depart = i === 0;
        return h('li', { class: `jalon${depart ? ' depart' : ''}` },
          h('span', { class: 'jalon-an' }, e.an),
          h('div', { class: 'jalon-corps' },
            h('b', { class: 'jalon-nom' }, e.n),
            depart ? h('p', { class: 'jalon-decision fixe' }, d.t)
              : h('button', {
                class: `jalon-case${d ? ' pleine' : ''}${cible === i ? ' cible' : ''}${choisie === i ? ' choisie' : ''}`, 'data-i': repere(i),
                'aria-label': d ? `${e.an} : ${d.t}. Touche pour échanger` : `${e.an} : ${mot} à placer`,
                onClick: () => {
                  if (!d) { cible = i; choisie = null; son('tap'); return rendre(); }
                  if (choisie === null) { choisie = i; son('tap'); return rendre(); }
                  if (choisie === i) { pile.unshift(d); place[i] = null; cible = i; choisie = null; son('retour'); return rendre(); }
                  [place[choisie], place[i]] = [place[i], place[choisie]]; choisie = null; son('carte'); vibrer(8); return rendre();
                },
              }, d ? d.t : `Quelle ${mot} ?`)));
      });
      const consigne = complet
        ? (choisie !== null ? `Touche une autre ${mot} pour les échanger, ou la même pour la retirer.` : `Tout est placé. Touche deux ${mot}s pour les échanger, puis vérifie.`)
        : choisie !== null ? `Touche une autre ${mot} placée pour les échanger, ou la même pour la retirer.`
          : round.mot ? `Que se passe-t-il : ${etapes[cible].an} ? Choisis ci-dessous.` : `Que décide-t-on en ${etapes[cible].an} ? Choisis ci-dessous.`;
      zone.replaceChildren(h('div', { class: 'ecran frise' },
        h('div', { class: 'ecran-corps' },
          h('p', { class: 'surtitre' }, round.titre),
          h('h2', { class: 'question' }, `Place chaque ${mot} à sa date`),
          h('p', { class: 'aide frise-consigne' }, consigne),
          h('ol', { class: 'jalons' }, jalons)),
        h('div', { class: 'dock' },
          pile.length ? h('div', { class: 'decisions' }, pile.map((d) => h('button', { class: 'decision', 'data-rang': repere(d.rang), onClick: () => {
            const k = choisie !== null && !complet ? choisie : cible;
            if (k === null || k === undefined) return;
            pile = pile.filter((x) => x !== d);
            if (place[k]) pile.push(place[k]);
            place[k] = d; choisie = null; son('carte'); vibrer(8); rendre();
          } }, d.t))) : null,
          complet ? barrePied(continuer('Vérifier la frise', suite)) : null)));
    }
    rendre();
    window.scrollTo(0, 0);
  });
  const aPlacer = n - 1;
  const justes = place.filter((d, i) => i > 0 && d.rang === i).length;
  const tout = justes === aPlacer;
  ctx.combo(tout);
  await new Promise((suite) => {
    zone.replaceChildren(h('div', { class: 'ecran frise' },
      h('p', { class: 'surtitre' }, round.p),
      h('h2', { class: 'question' }, tout ? 'Toute la frise est juste' : justes === 0 ? `Aucune ${mot} sur ${aPlacer} à sa place` : `${justes} ${mot}${justes > 1 ? 's' : ''} sur ${aPlacer} à sa place`),
      h('ol', { class: 'frise-vraie' }, etapes.map((e, i) => {
        const bon = i === 0 || place[i].rang === i;
        return h('li', { class: bon ? 'juste' : 'faux' },
          h('span', { class: 'frise-an' }, e.an),
          h('span', {}, h('b', {}, e.n), h('p', {}, e.t),
            bon ? null : h('small', { class: 'frise-mis' }, `Tu avais mis : ${place[i].t}`),
            h('small', {}, `Ce que ça change : ${e.ch}`)));
      })),
      barrePied(continuer('Dernière question', suite))));
    window.scrollTo(0, 0);
  });
  const r = await qcm(zone, ctx, { surtitre: round.titre, question: round.q, options: round.options.map((o) => ({ ...o })), pourquoiBon: round.pourquoiBon, classe: 'frise-q' });
  const ok = tout && r.ok;
  const score = (justes / aPlacer) * 0.7 + (r.ok ? 0.3 : 0);
  for (const e of etapes) if (e.carte) ctx.noter(e.carte, ok || place[e.rang]?.rang === e.rang);
  if (ok) etat.stats.frise++;
  ctx.gain(Math.round(30 * score) + (ok ? 8 : 0));
  ctx.fin({ score, parfait: ok });
}
