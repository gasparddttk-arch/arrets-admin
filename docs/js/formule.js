// LA FORMULE : lire la formule du juge, en déduire le squelette et le plan.
// Tâche K de TACHES.md.
import { h, banc } from './ui.js';
import { continuer, barrePied, finEpreuve, repere } from './games.js';
import { son, vibrer } from './sons.js';
import { melange } from './engine.js';

export async function jouerFormule(zone, ctx, round, ix) {
  const f = round.formule || (ix?.formules || []).find((x) => x.id === round.id);
  if (!f) throw new Error(`Formule introuvable : ${round.id}`);
  const types = round.types || ix?.typesFormules || {};
  const entiere = Boolean(round.entiere);

  const etapes = entiere ? ['Lire', 'Choisir', 'Remplir'] : ['Lire', 'Choisir'];
  const ecran = h('div', { class: 'ecran formule' });
  const rail = h('ol', { class: 'at-rail', 'aria-label': 'Étapes' }, etapes.map((e) => h('li', {}, e)));
  const corps = h('div', { class: 'ecran-corps' });
  ecran.append(h('p', { class: 'surtitre' }, 'La formule'), rail, corps);
  zone.replaceChildren(ecran);

  const majEtape = (idx, titre) => {
    [...rail.children].forEach((li, k) => { li.className = k < idx ? 'fait' : k === idx ? 'courant' : ''; });
    corps.replaceChildren(h('h2', { class: 'question' }, titre));
    window.scrollTo(0, 0);
  };

  let juste1 = false;
  let juste2 = false;

  // -------------------------------------------------------------
  // ÉTAPE 1 : LIRE
  // -------------------------------------------------------------
  await new Promise((suite) => {
    majEtape(0, 'Que révèle cette formule ?');

    const ref = h('p', { class: 'formule-ref' }, f.ref);
    const extrait = h('blockquote', { class: 'formule-extrait' },
      f.extrait[0],
      h('mark', { class: 'formule-mise' }, f.extrait[1]),
      f.extrait[2]
    );

    const typeBon = f.type;
    const pieges = f.pieges;
    const optionsRaw = [
      { key: typeBon, nom: types[typeBon]?.nom || typeBon, ok: true },
      ...pieges.map((p) => ({ key: p, nom: types[p]?.nom || p, ok: false })),
    ];
    const optionsMelangees = melange(optionsRaw, Math.random);

    const zoneReponse = h('div', { class: 'options' });
    const zoneExplication = h('div', { class: 'formule-explication', hidden: true });

    let bonBouton = null;
    optionsMelangees.forEach((opt) => {
      const btn = h('button', {
        class: 'option',
        'data-ok': repere(opt.ok),
        onClick: () => {
          if (zoneReponse.querySelector('button[disabled]')) return;
          juste1 = opt.ok;
          zoneReponse.querySelectorAll('.option').forEach((b) => {
            b.disabled = true;
            if (b === bonBouton) b.classList.add('juste');
            else if (b === btn) b.classList.add('faux');
          });

          if (juste1) {
            son('ok'); vibrer(10); ctx.combo(true);
          } else {
            son('ko'); vibrer([20, 40, 20]); ctx.combo(false);
          }
          ctx.noter(f.arret, juste1);

          zoneExplication.hidden = false;
          zoneExplication.replaceChildren(
            h('p', { class: 'formule-signe' }, types[typeBon]?.signe || ''),
            h('p', { class: 'formule-lecture' }, f.lecture || '')
          );

          ecran.append(barrePied(continuer('Continuer', suite)));
        },
      }, opt.nom);
      if (opt.ok) bonBouton = btn;
      zoneReponse.append(btn);
    });

    corps.append(ref, extrait, zoneReponse, zoneExplication);
  });

  document.querySelector('.scene .pied')?.remove();

  // -------------------------------------------------------------
  // ÉTAPE 2 : CHOISIR
  // -------------------------------------------------------------
  await new Promise((suite) => {
    majEtape(1, 'Quel squelette de plan ?');

    const typeBon = f.type;
    const pieges = f.pieges;
    const cartesRaw = [
      { key: typeBon, squ: types[typeBon]?.squelette, nom: types[typeBon]?.nom, ok: true },
      ...pieges.map((p) => ({ key: p, squ: types[p]?.squelette, nom: types[p]?.nom, ok: false })),
    ];
    const cartesMelangees = melange(cartesRaw, Math.random);

    const zoneCartes = h('div', { class: 'formule-squelettes' });

    let bonBouton = null;
    cartesMelangees.forEach((c) => {
      const nomEl = h('p', { class: 'formule-type-nom', hidden: true }, c.nom);
      const btn = h('button', {
        class: 'option formule-carte',
        'data-ok': repere(c.ok),
        onClick: () => {
          if (zoneCartes.querySelector('button[disabled]')) return;
          juste2 = c.ok;
          zoneCartes.querySelectorAll('.formule-carte').forEach((b) => {
            b.disabled = true;
            if (b === bonBouton) b.classList.add('juste');
            else if (b === btn) b.classList.add('faux');
          });

          zoneCartes.querySelectorAll('.formule-type-nom').forEach((el) => { el.hidden = false; });

          if (juste2) {
            son('ok'); vibrer(10); ctx.combo(true);
          } else {
            son('ko'); vibrer([20, 40, 20]); ctx.combo(false);
          }

          ecran.append(barrePied(continuer('Continuer', suite)));
        },
      },
        h('div', { class: 'formule-squelette-ligne' }, h('b', {}, 'I. '), c.squ?.I || ''),
        h('div', { class: 'formule-squelette-ligne' }, h('b', {}, 'II. '), c.squ?.II || '')
      );
      if (c.ok) bonBouton = btn;
      zoneCartes.append(h('div', { class: 'formule-carte-wrap' }, btn, nomEl));
    });

    corps.append(zoneCartes);
  });

  document.querySelector('.scene .pied')?.remove();

  // -------------------------------------------------------------
  // ÉTAPE 3 : REMPLIR (si entière)
  // -------------------------------------------------------------
  let partMorceaux = 1;
  if (entiere) {
    await new Promise((suite) => {
      majEtape(2, 'Remplir');

      const bonSqu = types[f.type]?.squelette || { I: 'Partie I', II: 'Partie II' };
      const cases = [
        { k: 'I', l: 'Partie I', placeholder: bonSqu.I, attributs: { 'data-k': 'I' } },
        { k: 'II', l: 'Partie II', placeholder: bonSqu.II, attributs: { 'data-k': 'II' } },
      ];

      const pieces = melange(f.morceaux.map((m, idx) => ({
        ...m,
        _id: `m_${idx}`,
        attributs: {
          'data-cle': repere(m.case || 'piege'),
          'data-case': repere(m.case || 'leurre'),
        },
      })), Math.random);

      let valider;
      let placeCourante = {};

      const composant = banc({
        pieces,
        cases,
        ecart: true,
        onChangement: ({ place, complet }) => {
          placeCourante = place;
          if (valider) valider.disabled = !complet;
        },
      });

      valider = continuer('Vérifier', () => {
        const iBon = placeCourante['I']?.case === 'I';
        const iiBon = placeCourante['II']?.case === 'II';
        const bons = (iBon ? 1 : 0) + (iiBon ? 1 : 0);
        partMorceaux = bons / 2;

        valider.remove();

        const leurresPlaces = [placeCourante['I'], placeCourante['II']].filter((p) => p && p.w);
        const explics = leurresPlaces.map((l) => h('p', { class: 'aide-claire' }, `« ${l.t} » : ${l.w}`));

        const modelePlan = h('div', { class: 'formule-modele' },
          h('h3', {}, 'Le plan de cet arrêt'),
          h('p', {}, h('b', {}, 'I. '), f.modele.I),
          h('p', {}, h('b', {}, 'II. '), f.modele.II)
        );

        corps.append(...explics, modelePlan);
        ecran.append(barrePied(continuer('Continuer', suite)));
      }, { disabled: true });

      corps.append(composant.el);
      ecran.append(barrePied(valider));
    });

    document.querySelector('.scene .pied')?.remove();
  }

  // -------------------------------------------------------------
  // CALCUL FINAL ET ÉCRAN DE FIN
  // -------------------------------------------------------------
  let score;
  let parfait;
  if (!entiere) {
    score = (juste1 ? 0.5 : 0) + (juste2 ? 0.5 : 0);
    parfait = juste1 && juste2;
  } else {
    score = (juste1 ? 0.3 : 0) + (juste2 ? 0.3 : 0) + 0.4 * partMorceaux;
    score = Math.round(score * 1000) / 1000;
    parfait = juste1 && juste2 && partMorceaux === 1;
  }

  const xp = entiere ? (parfait ? 40 : Math.round(30 * score)) : (parfait ? 20 : Math.round(15 * score));
  ctx.gain(xp);

  finEpreuve(zone, ctx, { score, parfait },
    h('p', { class: 'surtitre' }, parfait ? 'Formule maîtrisée.' : 'La formule'),
    h('article', { class: 'revelation' },
      h('h3', {}, f.ref),
      h('p', { class: 'apport' }, f.lecture),
      h('div', { class: 'formule-modele-fin' },
        h('h4', {}, 'Le plan de cet arrêt'),
        h('p', {}, h('b', {}, 'I. '), f.modele.I),
        h('p', {}, h('b', {}, 'II. '), f.modele.II))));
}
