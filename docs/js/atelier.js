// L'ATELIER DU CAS PRATIQUE : on construit sa copie comme en TD.
// 1. Les faits : surligner ce qui compte, puis qualifier. 2. Les problèmes : choisir les vrais, bien posés, dans l'ordre.
// 3. Un syllogisme par problème : la règle, chaque condition branchée sur un fait, l'exception, la conclusion,
// qui sert de prémisse au problème suivant. 4. Le conseil au client. 5. La copie rédigée, corrigée en rouge.
import { h, duree } from './ui.js';
import { son, vibrer } from './sons.js';
import { finEpreuve, barrePied, continuer, repere } from './games.js';
import { melange } from './engine.js';

const attendre = (ms) => new Promise((r) => setTimeout(r, duree(ms)));
const ROMAINS = ['I', 'II', 'III', 'IV'];
const AUCUN = '__aucun'; const INCONNU = '__inconnu';

// Une question à choix, rendue comme une option de QCM ; renvoie l'option choisie une fois corrigée.
function choisir(parent, options, { surOk, surKo } = {}) {
  return new Promise((ok) => {
    let fait = false;
    const boutons = options.map((o) => h('button', { class: 'option at-option', 'data-ok': repere(!!o.ok), onClick: async () => {
      if (fait) return; fait = true;
      boutons.forEach((b, i) => { b.disabled = true; if (options[i].ok) b.classList.add('juste'); else if (options[i] === o) b.classList.add('faux'); });
      son(o.ok ? 'ok' : 'ko'); vibrer(o.ok ? 10 : [20, 40, 20]);
      (o.ok ? surOk : surKo)?.(o);
      ok(o);
    } }, h('span', { class: 'option-marque', 'aria-hidden': 'true' }), h('span', { class: 'option-t' }, o.t, o.ref ? h('small', { class: 'at-ref' }, o.ref) : null)));
    parent.append(h('div', { class: 'options at-options' }, boutons));
  });
}
const suite = (parent, label = 'Continuer') => new Promise((ok) => parent.append(barrePied(continuer(label, ok))));
const note = (txt, cls = '') => h('p', { class: `at-note ${cls}` }, txt);

export async function jouerAtelier(zone, ctx, round, ix) {
  const cas = ix.ateliers.find((c) => c.id === round.id);
  const ids = Object.keys(cas.faits);
  const etapes = ['Les faits', 'Les problèmes', ...cas.problemes.map((_, i) => `Problème ${ROMAINS[i]}`), 'Le conseil', 'La copie'];
  // Ce que l'étudiant a fait, pour la copie et le barème.
  const r = { surligne: new Set(), qualif: {}, ordre: [], syllo: {}, conseil: null };
  const pts = { faits: [0, 0], qualif: [0, 0], problemes: [0, 0], regles: [0, 0], mineures: [0, 0], conclusions: [0, 0] };
  const marquer = (k, ok, poids = 1) => { pts[k][1] += poids; if (ok) pts[k][0] += poids; ctx.combo(ok); };

  const ecran = h('div', { class: 'ecran atelier' });
  const rail = h('ol', { class: 'at-rail', 'aria-label': 'Étapes de la copie' }, etapes.map((e) => h('li', {}, e)));
  const corps = h('div', { class: 'ecran-corps' });
  ecran.append(h('p', { class: 'surtitre' }, 'L’atelier du cas pratique'), rail, corps);
  zone.replaceChildren(ecran);
  const etape = (i, titre) => {
    [...rail.children].forEach((li, k) => { li.className = k < i ? 'fait' : k === i ? 'courant' : ''; });
    corps.replaceChildren(h('h2', { class: 'question' }, titre));
    window.scrollTo(0, 0);
  };
  const dossier = () => h('details', { class: 'at-rappel' }, h('summary', {}, 'Relire le cas'),
    h('p', {}, cas.enonce.map((s) => (typeof s === 'string' ? s : s.t))), h('p', { class: 'at-question' }, cas.question));

  // 1. LES FAITS ------------------------------------------------------------------------------
  etape(0, cas.titre);
  const segs = cas.enonce.map((s) => {
    if (typeof s === 'string') return s;
    const el = h('span', { class: 'at-seg', role: 'button', tabindex: '0', 'data-utile': repere(!!s.f), onClick: () => {
      if (el.classList.contains('fige')) return;
      el.classList.toggle('surligne'); son('tap'); vibrer(5);
    } }, s.t);
    s.el = el; return el;
  });
  corps.append(h('p', { class: 'at-consigne' }, 'Surligne les faits qui comptent juridiquement. Les détails sans portée juridique coûtent des points.'),
    h('article', { class: 'at-dossier' }, h('p', {}, segs), h('p', { class: 'at-question' }, cas.question)));
  await suite(corps, 'J’ai surligné');
  corps.querySelector('.pied')?.remove();
  for (const s of cas.enonce) {
    if (typeof s === 'string') continue;
    s.el.classList.add('fige');
    const pris = s.el.classList.contains('surligne');
    if (s.f) { marquer('faits', pris); if (pris) r.surligne.add(s.f); else s.el.classList.add('oublie'); } else if (pris) { marquer('faits', false); s.el.classList.add('bruit'); }
  }
  const oublis = ids.filter((f) => !r.surligne.has(f)).length; const bruits = cas.enonce.filter((s) => s.b && s.el.classList.contains('surligne')).length;
  corps.append(note(oublis || bruits ? `${oublis ? `${oublis} fait${oublis > 1 ? 's' : ''} utile${oublis > 1 ? 's' : ''} oublié${oublis > 1 ? 's' : ''} (en pointillé)` : ''}${oublis && bruits ? ' ; ' : ''}${bruits ? `${bruits} détail${bruits > 1 ? 's' : ''} sans portée (barré${bruits > 1 ? 's' : ''})` : ''}.` : 'Tri parfait : tous les faits utiles, aucun détail.', oublis || bruits ? 'faux' : 'juste'));
  await suite(corps, 'Qualifier les faits');

  // Qualifier chaque fait : la compétence la plus notée.
  for (const [i, f] of ids.entries()) {
    const [bonne, leurres, pourquoi] = cas.faits[f];
    const texte = cas.enonce.find((s) => s.f === f).t;
    etape(0, `Qualifier : fait ${i + 1} sur ${ids.length}`);
    corps.append(h('blockquote', { class: 'at-fait' }, texte), h('p', { class: 'at-consigne' }, 'Juridiquement, c’est…'));
    const o = await choisir(corps, melange([{ t: bonne, ok: true }, ...leurres.map((t) => ({ t, ok: false }))], Math.random));
    r.qualif[f] = o.t; marquer('qualif', o.ok);
    corps.append(note(pourquoi, o.ok ? 'juste' : 'faux'));
    await suite(corps, i + 1 < ids.length ? 'Fait suivant' : 'Poser les problèmes');
  }

  // 2. LES PROBLÈMES ----------------------------------------------------------------------------
  etape(1, 'Les problèmes de droit');
  const n = cas.problemes.length;
  const cartes = melange([
    ...cas.problemes.map((p) => ({ t: p.t, sorte: 'vrai', p: p.id })),
    ...cas.problemes.map((p) => ({ t: p.factuel, sorte: 'factuel', p: p.id })),
    ...cas.faux.map(([t, pourquoi]) => ({ t, sorte: 'faux', pourquoi })),
  ], Math.random);
  const cases = h('ol', { class: 'at-plan' });
  const pile = h('div', { class: 'at-pile' });
  const choix = [];
  const rendrePlan = () => {
    cases.replaceChildren(...Array.from({ length: n }, (_, i) => h('li', { class: choix[i] ? 'plein' : i === choix.length ? 'cible' : '' },
      h('b', {}, ROMAINS[i]), choix[i] ? h('button', { class: 'at-carte-p', onClick: () => { choix.splice(i, 1); son('retour'); rendrePlan(); } }, choix[i].t) : h('span', {}, i === choix.length ? 'Touche un problème ci-dessous' : ''))));
    pile.replaceChildren(...cartes.filter((c) => !choix.includes(c)).map((c) => h('button', { class: 'at-carte-p', 'data-p': repere(c.sorte === 'vrai' ? `${c.p}` : 'non'), onClick: () => { if (choix.length >= n) return; choix.push(c); son('carte'); vibrer(6); rendrePlan(); } }, c.t)));
    valider.disabled = choix.length < n;
  };
  const valider = continuer('Vérifier mon plan', () => fini());
  let fini;
  corps.append(h('p', { class: 'at-consigne' }, n > 1 ? `Garde les ${n} vrais problèmes, posés en termes juridiques, dans l’ordre où il faut les traiter.` : 'Garde le vrai problème, posé en termes juridiques.'),
    cases, pile, barrePied(valider));
  rendrePlan();
  await new Promise((ok) => { fini = ok; });
  corps.querySelector('.pied')?.remove(); pile.remove();
  cases.replaceChildren(...cas.problemes.map((p, i) => {
    const c = choix[i];
    const ok = c.sorte === 'vrai' && c.p === p.id;
    const moitie = c.sorte === 'factuel' && c.p === p.id;
    marquer('problemes', ok); if (moitie) pts.problemes[0] += 0.5;
    const pourquoi = ok ? null : moitie ? 'Bonne question, mais posée en fait : un problème de droit se formule en termes juridiques.'
      : c.sorte === 'faux' ? c.pourquoi : c.sorte === 'vrai' ? 'Bon problème, mauvaise place : on traite d’abord la question dont dépend la suivante.' : 'Question factuelle, et pas à cette place.';
    r.ordre.push({ c, ok, pourquoi });
    return h('li', { class: ok ? 'juste' : 'faux' }, h('b', {}, ROMAINS[i]), h('span', {}, p.t), ok ? null : h('small', {}, `Tu avais mis : ${c.t} ${pourquoi}`));
  }));
  await suite(corps, 'Construire le premier syllogisme');

  // 3. UN SYLLOGISME PAR PROBLÈME -------------------------------------------------------------
  let acquis = null;
  for (const [i, p] of cas.problemes.entries()) {
    const s = cas.syllo[p.id];
    const res = { regle: null, conds: [], exc: null, concl: null };
    r.syllo[p.id] = res;
    // La majeure : la règle, parmi des faux jumeaux.
    etape(2 + i, `${ROMAINS[i]}. ${p.t}`);
    if (acquis) corps.append(h('p', { class: 'at-acquis' }, h('b', {}, 'Acquis : '), acquis));
    corps.append(dossier(), h('p', { class: 'at-consigne' }, 'La majeure : quelle règle s’applique ?'));
    const [art, texte, carte] = s.regle;
    const o = await choisir(corps, melange([{ t: texte, ref: art, ok: true }, ...s.leurres.map(([a, t, w]) => ({ t, ref: a, w, ok: false }))], Math.random));
    res.regle = o; marquer('regles', o.ok);
    if (carte && ix.parId?.has(carte)) ctx.noter(carte, o.ok);
    corps.append(note(o.ok ? `Oui : ${art}.` : `${o.w} La règle est l’${art.replace(/^Art\./, 'article')}.`, o.ok ? 'juste' : 'faux'));
    await suite(corps, 'Décomposer la règle');

    // La mineure : chaque condition reçoit son fait.
    etape(2 + i, `${ROMAINS[i]}. La mineure`);
    corps.append(h('p', { class: 'at-regle' }, h('b', {}, `${art} `), texte));
    const lignes = s.conditions.map(([t, f, etat]) => {
      const auto = !f && etat === 'oui';
      return { t, f, etat, auto, el: h('li', { class: `at-cond${auto ? ' acquise' : ''}` }, h('span', { class: 'at-engrenage', 'aria-hidden': 'true' }), h('span', { class: 'at-cond-t' }, t),
        h('span', { class: 'at-prise' }, auto ? (i > 0 ? 'Acquis plus haut' : 'Posé par la loi') : '…')) };
    });
    const machine = h('div', { class: 'at-machine' }, h('ol', { class: 'at-conds' }, lignes.map((l) => l.el)), h('p', { class: 'at-sortie' }, 'La règle s’applique-t-elle ?'));
    const plateau = h('div', { class: 'at-plateau' });
    const msg = note('');
    corps.append(h('p', { class: 'at-consigne' }, 'Branche sur chaque condition le fait qualifié qui la remplit, ou dis qu’aucun ne la remplit, ou que le cas ne le dit pas.'), machine, msg, plateau);
    for (const l of lignes) {
      if (l.auto) { res.conds.push({ l, ok: true, auto: true }); continue; }
      l.el.classList.add('cible');
      const pris = await new Promise((ok) => {
        const jeton = (val, label, cls = '') => h('button', { class: `at-jeton ${cls}`, 'data-val': val, 'data-ok': repere(val === (l.etat === 'oui' ? l.f : l.etat === 'non' ? AUCUN : INCONNU)), onClick: () => ok(val) }, label);
        plateau.replaceChildren(...ids.map((f) => jeton(f, cas.faits[f][0])), jeton(AUCUN, 'Aucun fait ne la remplit', 'special'), jeton(INCONNU, 'Le cas ne le dit pas', 'special'));
      });
      const attendu = l.etat === 'oui' ? l.f : l.etat === 'non' ? AUCUN : INCONNU;
      const ok = pris === attendu;
      marquer('mineures', ok);
      res.conds.push({ l, ok, pris });
      l.el.classList.remove('cible');
      l.el.classList.add(l.etat === 'oui' ? 'remplie' : l.etat === 'non' ? 'bloquee' : 'doute', ok ? 'juste' : 'faux');
      l.el.querySelector('.at-prise').textContent = l.etat === 'oui' ? cas.faits[l.f][0] : l.etat === 'non' ? 'Non remplie' : 'Le cas ne le dit pas';
      const phrase = s.conditions.find((c) => c[0] === l.t)[3];
      msg.textContent = ok ? phrase : `Non. ${phrase}`; msg.className = `at-note ${ok ? 'juste' : 'faux'}`;
      son(ok ? 'ok' : 'ko'); vibrer(ok ? 10 : [20, 40, 20]);
      await attendre(ok ? 650 : 1500);
    }
    plateau.remove();
    const bloquee = s.conditions.some((c) => c[2] === 'non'); const doute = s.conditions.some((c) => c[2] === 'hypo');
    const sortie = machine.querySelector('.at-sortie');
    sortie.textContent = bloquee ? 'Une condition manque : la machine cale.' : doute ? 'Une condition dépend d’un fait inconnu : il faut raisonner par hypothèse.' : 'Toutes les conditions sont réunies : la machine tourne.';
    machine.classList.add(bloquee ? 'cale' : doute ? 'hesite' : 'tourne');
    await suite(corps, s.exception ? 'Vérifier l’exception' : doute ? 'Raisonner par hypothèse' : 'Conclure');

    // L'exception : elle peut renverser ou limiter la solution.
    if (s.exception) {
      etape(2 + i, `${ROMAINS[i]}. L’exception`);
      const [t, joue, phrase] = s.exception;
      corps.append(h('p', { class: 'at-regle' }, h('b', {}, 'Exception : '), t), h('p', { class: 'at-consigne' }, 'Joue-t-elle ici ?'));
      const e = await choisir(corps, [{ t: 'Oui, elle joue', ok: joue }, { t: 'Non, elle ne joue pas', ok: !joue }]);
      res.exc = e; marquer('mineures', e.ok);
      corps.append(note(phrase, e.ok ? 'juste' : 'faux'));
      await suite(corps, doute ? 'Raisonner par hypothèse' : 'Conclure');
    }
    // Les faits lacunaires : deux branches.
    if (doute) {
      etape(2 + i, `${ROMAINS[i]}. Raisonner par hypothèse`);
      corps.append(h('p', { class: 'at-consigne' }, 'Les faits ne permettent pas de trancher : la copie envisage les deux hypothèses.'),
        h('div', { class: 'at-branches' }, h('div', { class: 'at-branche' }, h('b', {}, 'Première hypothèse'), h('p', {}, s.si)), h('div', { class: 'at-branche' }, h('b', {}, 'Seconde hypothèse'), h('p', {}, s.sinon))));
      await suite(corps, 'Conclure');
    }
    // La conclusion, qui devient une prémisse.
    etape(2 + i, `${ROMAINS[i]}. La conclusion`);
    corps.append(h('p', { class: 'at-consigne' }, 'Dès lors…'));
    const [bonne, ...autres] = s.conclusion;
    const c = await choisir(corps, melange([{ t: bonne, ok: true }, ...autres.map((t) => ({ t, ok: false }))], Math.random));
    res.concl = c; marquer('conclusions', c.ok);
    acquis = bonne;
    if (!c.ok) corps.append(note(`La bonne conclusion, qui servira pour la suite : ${bonne}`, 'faux'));
    await suite(corps, i + 1 < n ? 'Problème suivant' : 'Conseiller le client');
  }

  // 4. LE CONSEIL -------------------------------------------------------------------------------
  etape(2 + n, 'Le conseil au client');
  corps.append(dossier(), h('p', { class: 'at-question' }, cas.question), h('p', { class: 'at-consigne' }, 'Quelle action, contre qui, pour obtenir quoi ?'));
  const [bonConseil, ...autresConseils] = cas.conseil;
  r.conseil = await choisir(corps, melange([{ t: bonConseil, ok: true }, ...autresConseils.map((t) => ({ t, ok: false }))], Math.random));
  marquer('conclusions', r.conseil.ok, 2);
  await suite(corps, 'Voir ma copie');

  // 5. LA COPIE ---------------------------------------------------------------------------------
  etape(3 + n, 'Ta copie, corrigée');
  const barre = (mien, juste) => (mien === juste ? h('span', {}, juste) : h('span', {}, h('s', { class: 'at-rouge' }, mien), ' ', h('span', { class: 'at-correction' }, juste)));
  const copie = h('article', { class: 'at-copie' },
    h('h3', {}, 'Les faits qualifiés'),
    h('ul', {}, ids.map((f) => h('li', {}, h('i', {}, `${cas.enonce.find((s) => s.f === f).t} : `), barre(r.qualif[f], cas.faits[f][0])))),
    h('h3', {}, n > 1 ? 'Les problèmes de droit' : 'Le problème de droit'),
    h('ol', {}, cas.problemes.map((p, i) => h('li', {}, r.ordre[i].ok ? p.t : [h('s', { class: 'at-rouge' }, r.ordre[i].c.t), ' ', h('span', { class: 'at-correction' }, p.t)]))),
    cas.problemes.map((p, i) => {
      const s = cas.syllo[p.id]; const x = r.syllo[p.id];
      return h('section', {},
        h('h3', {}, `${ROMAINS[i]}. ${p.t}`),
        h('p', {}, h('b', {}, 'Règle. '), x.regle.ok ? `${s.regle[0]} : ${s.regle[1]}` : [h('s', { class: 'at-rouge' }, x.regle.ref), ' ', h('span', { class: 'at-correction' }, `${s.regle[0]} : ${s.regle[1]}`)]),
        h('p', {}, h('b', {}, 'En l’espèce. '), s.conditions.map((c, k) => h('span', { class: x.conds[k]?.ok === false ? 'at-correction' : '' }, `${c[3]} `)),
          s.exception ? h('span', { class: x.exc?.ok === false ? 'at-correction' : '' }, s.exception[2]) : null),
        s.si ? h('p', {}, h('b', {}, 'Hypothèses. '), `${s.si} ${s.sinon}`) : null,
        h('p', {}, h('b', {}, 'Dès lors. '), barre(x.concl.t, s.conclusion[0])));
    }),
    h('h3', {}, 'Conseil'),
    h('p', {}, barre(r.conseil.t, cas.conseil[0])));
  const NOMS = { faits: 'Tri des faits', qualif: 'Qualification', problemes: 'Problèmes de droit', regles: 'Majeures', mineures: 'Mineures et exceptions', conclusions: 'Conclusions et conseil' };
  const fmt = (x) => String(Math.round(x * 10) / 10).replace('.', ',');
  const bareme = h('dl', { class: 'at-bareme' }, Object.entries(pts).filter(([, [, sur]]) => sur).map(([k, [a, sur]]) => h('div', { class: a === sur ? 'plein' : '' }, h('dt', {}, NOMS[k]), h('dd', {}, `${fmt(a)} sur ${fmt(sur)}`))));
  // Les mineures et la qualification comptent double : c'est là que se gagne le cas pratique.
  const poids = { faits: 1, qualif: 2, problemes: 1.5, regles: 1.5, mineures: 2, conclusions: 1.5 };
  let tot = 0; let max = 0;
  for (const [k, [a, sur]] of Object.entries(pts)) if (sur) { tot += (a / sur) * poids[k]; max += poids[k]; }
  const score = max ? tot / max : 0;
  const parfait = Object.values(pts).every(([a, sur]) => a === sur);
  corps.append(bareme, copie);
  await suite(corps, 'Terminer');
  ctx.gain(Math.round(60 * score) + (parfait ? 15 : 0));
  finEpreuve(zone, ctx, { score, parfait },
    h('p', { class: 'surtitre' }, parfait ? 'Copie sans rature.' : `Ta copie vaut ${Math.round(score * 100)} % des points.`),
    h('article', { class: 'revelation' }, h('h3', {}, cas.titre), h('p', { class: 'apport' }, cas.conseil[0])));
}
