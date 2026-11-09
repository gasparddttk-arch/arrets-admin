// Les exercices de Vers l'examen sans choix proposés : on produit sa réponse, puis on se compare au corrigé.
import { h } from './ui.js';
import { son } from './sons.js';
import { melange, roundPlan } from './engine.js';
import { qcm, barrePied, continuer, bandeauArret, repere } from './games.js';

const prendre = (liste, dus, deja) => {
  const frais = liste.filter((x) => !deja.has(x.id));
  const base = frais.length ? frais : liste;
  const du = base.find((x) => dus.includes(x.id));
  const x = du || base[Math.floor(Math.random() * base.length)];
  if (x) deja.add(x.id);
  return x;
};
const dans = (zones) => (x) => x.zones.some((z) => zones.includes(z));
const apportDe = (a, zones) => a.ap[a.zones.find((z) => zones.includes(z)) ?? a.zones[0]] || Object.values(a.ap)[0];

// LES ÉPREUVES, tirées du contenu existant.
export function roundExamen(ix, type, zones, dus, deja) {
  const arrets = ix.arrets.filter((a) => dans(zones)(a) && !a.nf && Object.keys(a.ap).length);
  // L1 : Notion flash, la définition à écrire de mémoire.
  if (type === 'flash' && ix.matiere === 'intro') {
    const n = prendre(ix.articles.filter(dans(zones)), dus, deja); if (!n) return null;
    return { type, notion: true, id: n.id, nom: n.nom, an: '', ref: n.etiquette, attendu: n.regle, complement: n.ex ? `Exemple du cours : ${n.ex}` : n.pg };
  }
  if (type === 'flash') {
    const a = prendre(arrets, dus, deja); if (!a) return null;
    return { type, id: a.id, nom: a.court || a.nom, an: a.an, ref: a.ref, attendu: apportDe(a, zones), complement: a.po };
  }
  if (type === 'plaide') {
    const avecQ = arrets.filter((a) => a.q && a.s);
    const questions = (ix.questions || []).filter(dans(zones)).map((q, i) => ({ ...q, id: `q-${i}-${q.q.length}` }));
    const deQuestion = ix.matiere === 'oblig' && questions.length && (!avecQ.length || Math.random() < 0.5);
    if (deQuestion) { const q = prendre(questions, [], deja); return { type, carte: null, contexte: 'Question de cours', question: q.q, attendu: q.bonne }; }
    const a = prendre(avecQ, dus, deja); if (!a) return null;
    return { type, carte: a.id, contexte: `${a.court || a.nom}, ${a.an}`, question: a.q, attendu: a.s };
  }
  if (type === 'trous') {
    const articles = (ix.articles || []).filter((a) => dans(zones)(a) && a.regle && a.regle.split(' ').length >= 10);
    const a = prendre(articles, dus, deja); if (!a) return null;
    const mots = a.regle.split(' ');
    const candidats = mots.map((m, i) => ({ m: m.replace(/[,.;:]$/, ''), i })).filter(({ m, i }) => i > 1 && m.length >= 6 && /^[a-zà-ÿ'’-]+$/i.test(m));
    const trous = melange(candidats, Math.random).slice(0, Math.min(3, candidats.length)).sort((x, y) => x.i - y.i);
    if (trous.length < 2) return null;
    const autres = (ix.articles || []).filter((b) => b !== a && b.regle).flatMap((b) => b.regle.split(' ').map((m) => m.replace(/[,.;:]$/, '')).filter((m) => m.length >= 6 && /^[a-zà-ÿ'’-]+$/i.test(m)));
    const leurres = melange([...new Set(autres)].filter((m) => !trous.some((t) => t.m === m)), Math.random).slice(0, 2);
    return { type, id: a.id, nom: a.nom, titre: a.titre, mots, trous: trous.map((t) => ({ i: t.i, m: t.m })), etiquettes: melange([...trous.map((t) => t.m), ...leurres], Math.random) };
  }
  if (type === 'express') {
    const sujets = (ix.sujets || []).filter((s) => s.type === 'C' && s.arret && Object.keys(s.arret.just || {}).length && dans(zones)(s));
    const s = prendre(sujets.length ? sujets : (ix.sujets || []).filter((x) => x.type === 'C' && x.arret), [], deja); if (!s) return null;
    const [partie, j] = melange(Object.entries(s.arret.just), Math.random)[0];
    return { type, sujet: s, partie, j, plan: roundPlan(ix, s) };
  }
  if (type === 'syllogisme') {
    const tous = (ix.syllogismes || []).filter((x) => !x.carte || ix.parId.has(x.carte));
    const s = prendre(tous.filter(dans(zones)).length ? tous.filter(dans(zones)) : tous, dus, deja); if (!s) return null;
    const pieces = melange([['majeure', 0], ['majeure', 1], ['mineure', 0], ['mineure', 1], ['conclusion', 0], ['conclusion', 1]].map(([k, i]) => ({ k, ok: i === 0, t: s[k][i] })), Math.random);
    return { type, id: s.id, carte: s.carte, pieces };
  }
  if (type === 'casnu') {
    const c = prendre((ix.cas || []).filter(dans(zones)).length ? ix.cas.filter(dans(zones)) : (ix.cas || []), dus, deja); if (!c) return null;
    const etapes = c.etapes.filter((e) => e.label !== 'Méthode').map((e) => ({ q: e.q, options: melange([{ t: e.t, ok: true, w: e.w }, ...e.x.map((x) => ({ t: x.t, ok: false, w: x.w }))], Math.random), w: e.w }));
    return { type, id: c.id, titre: c.titre, enonce: c.c, liens: c.liens || [], etapes };
  }
  return null;
}

// Écrire, puis se noter honnêtement face au corrigé.
function autoNote(zone, { surtitre, entete, question, attendu, complement }) {
  return new Promise((fini) => {
    const reponse = h('textarea', { class: 'code reponse-libre', rows: 4, placeholder: 'Ta réponse, en quelques mots. Tu peux aussi répondre de tête.', 'aria-label': 'Ta réponse' });
    const corps = h('div', { class: 'ecran-corps' }, h('p', { class: 'surtitre' }, surtitre), entete || null, h('h2', { class: 'question' }, question), reponse);
    const pied = barrePied(continuer('Voir le corrigé', () => {
      son('carte'); reponse.readOnly = true;
      corps.append(h('div', { class: 'corrige-libre' }, h('b', {}, 'Le corrigé'), h('p', {}, attendu), complement ? h('small', {}, complement) : null),
        h('p', { class: 'aide' }, 'Compare honnêtement : l’idée compte plus que les mots.'));
      pied.replaceChildren(h('div', { class: 'auto-note' },
        [['ok', 'Je l’avais', 1], ['moitie', 'À moitié', 0.5], ['rate', 'Raté', 0]].map(([k, l, v]) => h('button', { class: k === 'ok' ? 'cta' : 'bouton-fantome', 'data-note': repere(k), onClick: () => fini(v) }, l))));
      corps.lastChild.scrollIntoView?.({ behavior: 'smooth', block: 'center' });
    }));
    zone.replaceChildren(h('div', { class: 'ecran libre' }, corps, pied));
    window.scrollTo(0, 0);
  });
}

export async function jouerFlash(zone, ctx, r) {
  const v = await autoNote(zone, { surtitre: r.notion ? 'Notion flash' : 'Arrêt flash', entete: h('p', { class: 'flash-arret' }, h('b', {}, r.nom), r.an ? ` ${r.an}` : '', h('small', {}, r.ref || '')), question: r.notion ? 'Sa définition, en quelques mots ?' : 'Son apport, en quelques mots ?', attendu: r.attendu, complement: r.complement });
  ctx.noter(r.id, v === 1); ctx.gain(Math.round(18 * v)); ctx.fin({ score: v, parfait: v === 1 });
}
export async function jouerPlaide(zone, ctx, r) {
  const v = await autoNote(zone, { surtitre: `Plaide : ${r.contexte}`, question: r.question, attendu: r.attendu });
  if (r.carte) ctx.noter(r.carte, v === 1);
  ctx.gain(Math.round(22 * v)); ctx.fin({ score: v, parfait: v === 1 });
}

// Article à trous : on remplit les trous dans l'ordre, en touchant les mots.
export async function jouerTrous(zone, ctx, r) {
  const remplis = r.trous.map(() => null);
  await new Promise((suite) => {
    const rendre = () => {
      let k = 0;
      const texte = r.mots.map((m, i) => {
        const t = r.trous.findIndex((x) => x.i === i);
        if (t < 0) return `${m} `;
        k++;
        const fin = m.match(/[,.;:]$/)?.[0] || '';
        return [h('button', { class: `trou${remplis[t] ? ' plein' : ''}${remplis.indexOf(null) === t ? ' cible' : ''}`, 'data-t': repere(t), 'data-m': repere(r.trous[t].m), onClick: () => { if (remplis[t]) { remplis[t] = null; son('retour'); rendre(); } } }, remplis[t] || `(${k})`), `${fin} `];
      });
      const utilises = remplis.filter(Boolean);
      const complet = !remplis.includes(null);
      zone.replaceChildren(h('div', { class: 'ecran trous' },
        h('div', { class: 'ecran-corps' }, h('p', { class: 'surtitre' }, `Article à trous : ${r.nom}`), h('h2', { class: 'question' }, r.titre),
          h('p', { class: 'article-trous' }, texte), h('p', { class: 'aide' }, complet ? 'Touche un mot placé pour le retirer, puis vérifie.' : 'Touche les mots dans l’ordre des trous.')),
        h('div', { class: 'dock' },
          h('div', { class: 'etiquettes' }, r.etiquettes.map((m) => h('button', { class: 'etiquette-mot', disabled: utilises.filter((x) => x === m).length >= r.etiquettes.filter((x) => x === m).length, 'data-mot': repere(m), onClick: () => { const t = remplis.indexOf(null); if (t < 0) return; remplis[t] = m; son('carte'); rendre(); } }, m))),
          complet ? barrePied(continuer('Vérifier', suite)) : null)));
    };
    rendre(); window.scrollTo(0, 0);
  });
  const justes = r.trous.filter((t, i) => remplis[i] === t.m).length;
  const score = justes / r.trous.length;
  await new Promise((suite) => {
    zone.replaceChildren(h('div', { class: 'ecran trous' }, h('div', { class: 'ecran-corps' },
      h('p', { class: 'surtitre' }, r.nom), h('h2', { class: 'question' }, score === 1 ? 'Article complet' : `${justes} trou${justes > 1 ? 's' : ''} sur ${r.trous.length}`),
      h('p', { class: 'article-trous' }, r.mots.map((m, i) => { const t = r.trous.findIndex((x) => x.i === i); if (t < 0) return `${m} `; const fin = m.match(/[,.;:]$/)?.[0] || ''; return [h('mark', { class: remplis[t] === r.trous[t].m ? 'juste' : 'faux' }, r.trous[t].m), `${fin} `]; }))),
    barrePied(continuer('Continuer', suite))));
  });
  ctx.noter(r.id, score === 1); ctx.gain(Math.round(20 * score)); ctx.fin({ score, parfait: score === 1 });
}

// Commentaire express : la phrase qui porte une partie, puis le bon plan.
export async function jouerExpress(zone, ctx, r) {
  const s = r.sujet;
  const r1 = await qcm(zone, ctx, { surtitre: 'Commentaire express', avant: bandeauArret(s), question: `${s.titre} : quelle phrase de l’arrêt justifie la partie « ${s.bon[r.partie].t} » ?`, options: melange([{ t: r.j.bon, ok: true }, ...r.j.faux.map((t) => ({ t, ok: false }))], Math.random), pourquoiBon: r.j.pourquoi, classe: 'express' });
  const titre = (p) => `I. ${p['1']}  II. ${p['2']}`;
  const r2 = await qcm(zone, ctx, { surtitre: 'Commentaire express', question: 'Quel plan retiens-tu ?', options: r.plan.plans.map((p) => ({ t: titre(p.plan), ok: p.ok, w: p.pourquoi || '' })), pourquoiBon: 'Le plan qui suit la logique de l’arrêt.', classe: 'express' });
  for (const k of ['1a', '1b', '2a', '2b']) for (const id of s.bon[k].ids || []) ctx.noter(id, r1.ok && r2.ok);
  const score = ((r1.ok ? 1 : 0) + (r2.ok ? 1 : 0)) / 2;
  ctx.gain(Math.round(28 * score)); ctx.fin({ score, parfait: score === 1 });
}

// Syllogisme : trois cases (majeure, mineure, conclusion) et six pièces, dont trois leurres.
const CASES_SYLLO = [['majeure', 'Majeure : la règle'], ['mineure', 'Mineure : les faits'], ['conclusion', 'Conclusion']];
export async function jouerSyllogisme(zone, ctx, r) {
  const place = { majeure: null, mineure: null, conclusion: null };
  await new Promise((suite) => {
    const rendre = () => {
      const libre = CASES_SYLLO.find(([k]) => !place[k])?.[0];
      const complet = !libre;
      const utilisees = new Set(Object.values(place));
      zone.replaceChildren(h('div', { class: 'ecran syllogisme' },
        h('div', { class: 'ecran-corps' }, h('p', { class: 'surtitre' }, 'Syllogisme'), h('h2', { class: 'question' }, 'Assemble un raisonnement juste'),
          h('ol', { class: 'cases-syllo' }, CASES_SYLLO.map(([k, nom]) => h('li', {}, h('span', { class: 'etiquette' }, nom),
            h('button', { class: `case-syllo${place[k] ? ' pleine' : ''}${libre === k ? ' cible' : ''}`, 'data-k': repere(k), onClick: () => { if (place[k]) { place[k] = null; son('retour'); rendre(); } } }, place[k] ? place[k].t : 'Touche une pièce ci-dessous'))))),
        h('div', { class: 'dock' },
          h('div', { class: 'pieces-syllo' }, r.pieces.filter((p) => !utilisees.has(p)).map((p) => h('button', { class: 'piece-syllo', 'data-k': repere(p.k), 'data-ok': repere(p.ok), onClick: () => { if (!libre) return; place[libre] = p; son('carte'); rendre(); } }, p.t))),
          complet ? barrePied(continuer('Vérifier', suite)) : null)));
    };
    rendre(); window.scrollTo(0, 0);
  });
  const bons = CASES_SYLLO.filter(([k]) => place[k].k === k && place[k].ok).length;
  const score = bons / 3;
  await new Promise((suite) => {
    zone.replaceChildren(h('div', { class: 'ecran syllogisme' }, h('div', { class: 'ecran-corps' },
      h('p', { class: 'surtitre' }, 'Syllogisme'), h('h2', { class: 'question' }, bons === 3 ? 'Raisonnement juste' : `${bons} pièce${bons > 1 ? 's' : ''} sur 3 à sa place`),
      h('ol', { class: 'cases-syllo corrige' }, CASES_SYLLO.map(([k, nom]) => {
        const bon = r.pieces.find((p) => p.k === k && p.ok); const juste = place[k] === bon;
        return h('li', { class: juste ? 'juste' : 'faux' }, h('span', { class: 'etiquette' }, nom), h('p', {}, bon.t), juste ? null : h('small', {}, `Tu avais mis : ${place[k].t}`));
      }))), barrePied(continuer('Continuer', suite))));
    window.scrollTo(0, 0);
  });
  if (r.carte) ctx.noter(r.carte, score === 1);
  ctx.gain(Math.round(24 * score)); ctx.fin({ score, parfait: score === 1 });
}

// Cas nu : le même cas pratique, sans les étapes nommées ni l'explication avant la fin.
export async function jouerCasNu(zone, ctx, r) {
  const reponses = [];
  for (const [i, e] of r.etapes.entries()) {
    const choix = await new Promise((fini) => {
      zone.replaceChildren(h('div', { class: 'ecran qcm casnu' }, h('div', { class: 'ecran-corps' },
        h('p', { class: 'surtitre' }, `Cas nu : ${r.titre}, ${i + 1} sur ${r.etapes.length}`),
        h('details', { class: 'rappel-dossier', open: i === 0 }, h('summary', {}, 'Le cas'), h('p', {}, r.enonce)),
        h('h2', { class: 'question' }, e.q),
        h('div', { class: 'options' }, e.options.map((o) => h('button', { class: 'option', 'data-ok': repere(!!o.ok), onClick: () => { son('carte'); fini(o); } }, h('span', { class: 'option-t' }, o.t)))))));
      window.scrollTo(0, 0);
    });
    reponses.push({ e, choix });
  }
  const justes = reponses.filter((x) => x.choix.ok).length;
  const score = justes / reponses.length;
  await new Promise((suite) => {
    zone.replaceChildren(h('div', { class: 'ecran casnu' }, h('div', { class: 'ecran-corps' },
      h('p', { class: 'surtitre' }, `Cas nu : ${r.titre}`), h('h2', { class: 'question' }, `${justes} réponse${justes > 1 ? 's' : ''} juste${justes > 1 ? 's' : ''} sur ${reponses.length}`),
      h('ol', { class: 'cases-syllo corrige' }, reponses.map(({ e, choix }) => h('li', { class: choix.ok ? 'juste' : 'faux' },
        h('span', { class: 'etiquette' }, e.q), h('p', {}, e.options.find((o) => o.ok).t), choix.ok ? null : h('small', {}, `Tu avais répondu : ${choix.t}`), h('small', {}, e.w))))),
      barrePied(continuer('Continuer', suite))));
    window.scrollTo(0, 0);
  });
  for (const id of r.liens) ctx.noter(id, score === 1);
  ctx.gain(Math.round(40 * score) + (score === 1 ? 8 : 0)); ctx.fin({ score, parfait: score === 1 });
}
