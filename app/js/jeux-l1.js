// Les jeux de la L1 (introduction au droit). Chacun emprunte le geste d'un jeu connu :
// le tri à la Tinder, le mot à la Wordle, le rangement à la Tetris, Qui a dit ?, le scanner, Memory.
import { h, effets, duree } from './ui.js';
import { icone } from './visuels.js';
import { son, vibrer } from './sons.js';
import { finEpreuve, barrePied, continuer, repere } from './games.js';

const attendre = (ms) => new Promise((r) => setTimeout(r, duree(ms)));
const plurielS = (n, s) => `${n} ${s}${n > 1 ? 's' : ''}`;

// LE TRI DU GREFFE ---------------------------------------------------------------------------
// Une carte ; on la jette vers un des bords. Le tampon tombe, la carte s'envole.
// En L1 : droit, morale, religion, convenance.
const BORDS = { d: ['Droit', 'haut'], m: ['Morale', 'droite'], r: ['Religion', 'bas'], c: ['Convenance', 'gauche'] };
const parCote = Object.fromEntries(Object.entries(BORDS).map(([k, [, cote]]) => [cote, k]));
export function jouerTri(zone, ctx, round) {
  return new Promise((fini) => {
    let i = 0; let bons = 0; let rate = false;
    const pile = h('div', { class: 'tri-pile' });
    const consigneBase = round.consigne || 'Jette la carte vers le bon bord.';
    const consigne = h('p', { class: 'tri-consigne' }, consigneBase);
    const compteur = h('span', { class: 'tri-compte' });
    const boutons = Object.entries(BORDS).map(([k, [nom, cote]]) => h('button', { class: `tri-bord tri-${cote}`, 'data-bord': k, onClick: () => jeter(k) }, nom));
    const terrain = h('div', { class: 'tri-terrain' }, boutons, pile);
    const ecran = h('div', { class: 'ecran tri' }, h('div', { class: 'ecran-corps' }, h('p', { class: 'surtitre' }, round.titre || 'Le tri du greffe', ' ', compteur), consigne), terrain);
    zone.replaceChildren(ecran);
    let carte = null; let occupe = false;

    function suivante() {
      if (i >= round.cartes.length) return conclure();
      rate = false;
      compteur.textContent = `${i + 1} sur ${round.cartes.length}`;
      const c = round.cartes[i];
      carte = h('article', { class: 'tri-carte', 'data-bon': repere(c.k) }, h('p', {}, c.t), h('span', { class: 'tri-tampon', 'aria-hidden': 'true' }));
      pile.replaceChildren(carte);
      consigne.textContent = consigneBase;
      consigne.classList.remove('explique');
      brancher(carte);
    }
    function brancher(el) {
      let x0 = 0; let y0 = 0; let dx = 0; let dy = 0; let tient = false;
      el.addEventListener('pointerdown', (e) => { if (occupe) return; tient = true; x0 = e.clientX; y0 = e.clientY; el.setPointerCapture(e.pointerId); el.classList.add('tenue'); });
      el.addEventListener('pointermove', (e) => {
        if (!tient) return;
        dx = e.clientX - x0; dy = e.clientY - y0;
        el.style.transform = `translate(${dx}px, ${dy}px) rotate(${dx / 14}deg)`;
        const k = direction(dx, dy, 40);
        for (const b of boutons) b.classList.toggle('vise', b.dataset.bord === k);
      });
      const lacher = () => {
        if (!tient) return; tient = false; el.classList.remove('tenue');
        for (const b of boutons) b.classList.remove('vise');
        const k = direction(dx, dy, 80);
        dx = 0; dy = 0;
        if (k) jeter(k); else el.style.transform = '';
      };
      el.addEventListener('pointerup', lacher);
      el.addEventListener('pointercancel', lacher);
    }
    const direction = (dx, dy, seuil) => (Math.max(Math.abs(dx), Math.abs(dy)) < seuil ? null
      : parCote[Math.abs(dy) > Math.abs(dx) ? (dy < 0 ? 'haut' : 'bas') : (dx > 0 ? 'droite' : 'gauche')] || null);

    async function jeter(k) {
      if (occupe || !carte) return;
      const c = round.cartes[i];
      occupe = true;
      const tampon = carte.querySelector('.tri-tampon');
      if (String(k) === String(c.k)) {
        if (!rate) bons++;
        ctx.combo(!rate);
        tampon.textContent = BORDS[k][0];
        carte.classList.add('tamponnee');
        son('marteau'); vibrer(14);
        const enTest = typeof location !== 'undefined' && new URLSearchParams(location.search).has('test');
        await attendre(enTest ? 20 : 420);
        carte.classList.add(`vole-${BORDS[k][1]}`);
        await attendre(enTest ? 20 : 380);
        i++; occupe = false; suivante();
      } else {
        if (!rate) ctx.combo(false);
        rate = true;
        son('ko'); vibrer([20, 40, 20]);
        carte.style.transform = '';
        carte.classList.remove('tremble'); void carte.offsetWidth; carte.classList.add('tremble');
        const nom = BORDS[k][0];
        consigne.textContent = `Pas ${nom.toLowerCase() === 'droit' ? 'du droit' : `la ${nom.toLowerCase()}`}. ${c.w}`;
        consigne.classList.add('explique');
        for (const b of boutons) b.classList.toggle('indique', b.dataset.bord === String(c.k));
        await attendre(500);
        occupe = false;
      }
    }
    function conclure() {
      for (const b of boutons) b.classList.remove('indique');
      const n = round.cartes.length; const score = bons / n;
      ctx.gain(Math.round(30 * score) + (bons === n ? 8 : 0));
      fini();
      finEpreuve(zone, ctx, { score, parfait: bons === n },
        h('p', { class: 'surtitre' }, bons === n ? 'Tout est rangé du premier coup.' : `${plurielS(bons, 'carte')} sur ${n} du premier coup.`),
        h('article', { class: 'revelation' }, h('h3', {}, 'Ce qui fait le droit'),
          h('p', { class: 'apport' }, 'La morale, la religion et les convenances règlent aussi nos conduites. Ce qui distingue le droit, c’est la sanction organisée par l’autorité publique.')));
    }
    suivante();
  });
}

// LE MOT DU JURISTE ---------------------------------------------------------------------------
// Six essais pour trouver le mot d'une définition du cours. Les tuiles se retournent une à une.
const CLAVIER = ['AZERTYUIOP', 'QSDFGHJKLM', 'WXCVBN'];
export function noterMot(essai, mot) {
  const res = Array(mot.length).fill('absent');
  const reste = {};
  for (let k = 0; k < mot.length; k++) { if (essai[k] === mot[k]) res[k] = 'place'; else reste[mot[k]] = (reste[mot[k]] || 0) + 1; }
  for (let k = 0; k < mot.length; k++) if (res[k] !== 'place' && reste[essai[k]]) { res[k] = 'present'; reste[essai[k]]--; }
  return res;
}
export function jouerMot(zone, ctx, round) {
  return new Promise((fini) => {
    const L = round.mot.length; const ESSAIS = 6;
    let ligne = 0; let saisie = ''; let fin = false; let occupe = false;
    const grille = h('div', { class: 'mot-grille', style: `--n:${L}`, 'data-mot': repere(round.mot) },
      Array.from({ length: ESSAIS }, () => h('div', { class: 'mot-ligne' }, Array.from({ length: L }, () => h('span', { class: 'mot-tuile' })))));
    const touches = {};
    const touche = (l, large = false) => {
      const b = h('button', { class: `mot-touche ${large ? 'large' : ''}`, 'data-touche': l, onClick: () => frappe(l) }, l === 'EFF' ? icone('retour', 18) : l === 'OK' ? 'Valider' : l);
      if (l.length === 1) touches[l] = b;
      return b;
    };
    const clavier = h('div', { class: 'mot-clavier' }, CLAVIER.map((r, k) => h('div', { class: 'mot-rangee' }, k === 2 ? touche('OK', true) : null, [...r].map((l) => touche(l)), k === 2 ? touche('EFF', true) : null)));
    const aide = h('p', { class: 'mot-aide' }, `${L} lettres, sans accent.`);
    const ecran = h('div', { class: 'ecran mot' }, h('div', { class: 'ecran-corps' },
      h('p', { class: 'surtitre' }, 'Le mot du juriste'), h('h2', { class: 'question mot-def' }, round.indice), aide, grille), clavier);
    zone.replaceChildren(ecran);
    const physique = (e) => {
      if (e.metaKey || e.ctrlKey) return;
      if (e.key === 'Enter') frappe('OK'); else if (e.key === 'Backspace') frappe('EFF');
      else { const l = e.key.normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase(); if (/^[A-Z]$/.test(l)) frappe(l); }
    };
    document.addEventListener('keydown', physique);
    const tuiles = () => [...grille.children[ligne].children];
    function afficher() { tuiles().forEach((t, k) => { t.textContent = saisie[k] || ''; t.classList.toggle('pleine', !!saisie[k]); }); }
    async function frappe(l) {
      if (fin || occupe) return;
      if (l === 'EFF') { saisie = saisie.slice(0, -1); son('tap'); return afficher(); }
      if (l === 'OK') {
        if (saisie.length < L) { grille.children[ligne].classList.remove('secoue'); void grille.offsetWidth; grille.children[ligne].classList.add('secoue'); aide.textContent = `Il faut ${L} lettres.`; son('ko'); return; }
        occupe = true;
        const res = noterMot(saisie, round.mot);
        const ts = tuiles();
        for (let k = 0; k < L; k++) {
          ts[k].classList.add('retourne', res[k]);
          son('tic');
          const t = touches[saisie[k]];
          if (t && !t.classList.contains('place')) { t.classList.remove('present', 'absent'); t.classList.add(res[k] === 'place' ? 'place' : t.classList.contains('present') && res[k] === 'absent' ? 'present' : res[k]); }
          await attendre(effets() ? 230 : 0);
        }
        const gagne = saisie === round.mot;
        ligne++; saisie = ''; occupe = false;
        if (gagne || ligne >= ESSAIS) conclure(gagne);
        else aide.textContent = `Encore ${ESSAIS - ligne} essai${ESSAIS - ligne > 1 ? 's' : ''}.`;
        return;
      }
      if (saisie.length >= L) return;
      saisie += l; son('tap'); afficher();
    }
    function conclure(gagne) {
      fin = true;
      document.removeEventListener('keydown', physique);
      ctx.combo(gagne);
      if (round.id) ctx.noter(round.id, gagne && ligne <= 4);
      const score = gagne ? Math.max(0.4, 1 - (ligne - 1) * 0.12) : 0;
      ctx.gain(gagne ? Math.round(30 * score) + (ligne <= 2 ? 8 : 0) : 0);
      if (gagne) { son('valide'); grille.children[ligne - 1].classList.add('danse'); }
      setTimeout(() => {
        fini();
        finEpreuve(zone, ctx, { score, parfait: gagne && ligne <= 2 },
          h('p', { class: 'surtitre' }, gagne ? `Trouvé en ${plurielS(ligne, 'essai')}.` : `Le mot était ${round.mot}.`),
          h('article', { class: 'revelation' }, h('h3', {}, round.nom), h('p', { class: 'apport' }, round.def)));
      }, duree(gagne ? 900 : 400));
    }
  });
}

// LE GRAND RANGEMENT ---------------------------------------------------------------------------
// Les disciplines tombent ; on les envoie dans leur colonne. Le droit pénal, mixte, rebondit ailleurs.
// En L2, round.colonnes vient du cours : des articles et des arrêts tombent vers leurs parties du cours.
const COLONNES = [['p', 'Droit public'], ['x', 'Mixte'], ['v', 'Droit privé']];
export function jouerRangement(zone, ctx, round) {
  return new Promise((fini) => {
    const l2 = Array.isArray(round.colonnes);
    // En L2, il faut le temps de lire un article ou un arrêt : la chute est plus lente.
    let i = 0; let bons = 0; let rate = false; let piece = null; let anim = null; let depart = 0; let duree0 = l2 ? 9500 : 7000; let fini_ = false;
    const plancher = l2 ? 5200 : 3200;
    const colonnes = l2 ? round.colonnes.map((c) => [String(c.k), c.nom]) : COLONNES;
    const nomDe = Object.fromEntries(colonnes);
    const tas = {}; const remplis = {};
    const cols = colonnes.map(([k, nom]) => {
      tas[k] = h('div', { class: 'rg-tas' }); remplis[k] = 0;
      return h('button', { class: 'rg-colonne', 'data-col': k, 'aria-label': `Ranger dans : ${nom}`, onClick: () => envoyer(k) }, tas[k], h('span', { class: 'rg-nom' }, nom));
    });
    const ciel = h('div', { class: 'rg-ciel' });
    const note = h('p', { class: 'rg-note' }, 'Touche la colonne où ranger la pièce.');
    const puits = h('div', { class: 'rg-puits' }, ciel, h('div', { class: 'rg-colonnes' }, cols));
    const ecran = h('div', { class: `ecran rangement${l2 ? ' rg-l2' : ''}` }, h('div', { class: 'ecran-corps' }, h('p', { class: 'surtitre' }, round.titre || 'Le grand rangement'), note), puits);
    zone.replaceChildren(ecran);

    function lancerPiece() {
      if (i >= round.pieces.length) return conclure();
      rate = false;
      const p = round.pieces[i];
      piece = h('div', { class: 'rg-piece', 'data-bon': repere(String(p.k)) }, p.t, p.s ? h('small', {}, p.s) : null);
      ciel.replaceChildren(piece);
      depart = performance.now();
      const tomber = (t) => {
        if (fini_ || !piece) return;
        const part = Math.min(1, (t - depart) / duree(duree0));
        piece.style.transform = `translate(-50%, ${part * (ciel.clientHeight - piece.offsetHeight)}px)`;
        if (part >= 1) { manque(); return; }
        anim = requestAnimationFrame(tomber);
      };
      anim = requestAnimationFrame(tomber);
    }
    function poser(k, juste) {
      const p = round.pieces[i];
      cancelAnimationFrame(anim);
      piece.remove(); piece = null;
      const bloc = h('span', { class: `rg-bloc ${juste ? '' : 'corrige'}` }, p.t);
      tas[k].append(bloc);
      remplis[k]++;
      // Trois pièces justes dans une colonne : elle s'illumine et descend d'un cran.
      if (remplis[k] % 3 === 0) {
        const col = cols.find((c) => c.dataset.col === k);
        col.classList.remove('illumine'); void col.offsetWidth; col.classList.add('illumine');
        son('combo');
        setTimeout(() => { [...tas[k].children].slice(0, 3).forEach((b) => b.remove()); }, duree(500));
      }
      note.textContent = p.w; note.classList.add('explique');
      if (l2 && p.carte) ctx.noter(p.carte, juste);
      i++; duree0 = Math.max(plancher, duree0 - 380);
      setTimeout(lancerPiece, duree(juste ? 350 : 900));
    }
    function envoyer(k) {
      if (!piece || fini_) return;
      const p = round.pieces[i];
      if (String(k) === String(p.k)) {
        if (!rate) bons++;
        ctx.combo(!rate); son('valide'); vibrer(10);
        poser(k, !rate);
      } else {
        if (!rate) ctx.combo(false);
        rate = true; son('rebond'); vibrer([20, 30, 20]);
        piece.classList.remove('rebondit'); void piece.offsetWidth; piece.classList.add('rebondit');
        depart = performance.now() - duree(duree0) * 0.15;
        note.textContent = 'Pas dans cette colonne.'; note.classList.remove('explique');
      }
    }
    function manque() {
      if (!rate) ctx.combo(false);
      rate = true; son('ko');
      poser(String(round.pieces[i].k), false);
    }
    function conclure() {
      fini_ = true;
      const n = round.pieces.length; const score = bons / n;
      ctx.gain(Math.round(30 * score) + (bons === n ? 8 : 0));
      fini();
      finEpreuve(zone, ctx, { score, parfait: bons === n },
        h('p', { class: 'surtitre' }, bons === n ? 'Tout est rangé du premier coup.' : `${plurielS(bons, 'pièce')} sur ${n} rangées du premier coup.`),
        l2 ? h('article', { class: 'revelation' }, h('h3', {}, 'Le rangement'),
          h('ul', { class: 'mem-recap' }, round.pieces.map((p) => h('li', {}, h('b', {}, p.t), ` : ${nomDe[String(p.k)]}. ${p.w}`)))) :
        h('article', { class: 'revelation' }, h('h3', {}, 'La carte du droit'),
          h('p', { class: 'apport' }, 'Le droit public organise les pouvoirs publics et leurs rapports avec les personnes privées ; le droit privé règle les rapports entre personnes privées. Le droit pénal, mixte, est rattaché au droit privé en France.')));
    }
    lancerPiece();
  });
}

// QUI A DIT ? ------------------------------------------------------------------------------------
// La bulle se tape à la machine ; le bon auteur hoche la tête, les autres se retournent.
const initiales = (nom) => nom.replace(/\(.*\)/, '').split(/[\s-]+/).filter((m) => /^[A-ZÀ-Ý]/.test(m)).map((m) => m[0]).slice(0, 2).join('');
export function jouerQuiADit(zone, ctx, round) {
  return new Promise((fini) => {
    let k = 0; let bons = 0;
    const tour = () => {
      const c = round.tours[k];
      const bulle = h('p', { class: 'qad-bulle-txt' });
      const medaillons = c.choix.map((x, j) => h('button', { class: 'qad-medaillon', style: `--j:${j}`, 'data-ok': repere(x.a === c.a), onClick: () => choisir(x) },
        h('span', { class: 'qad-portrait', 'aria-hidden': 'true' }, h('span', { class: 'qad-face' }, initiales(x.nom)), h('span', { class: 'qad-dos' })), h('span', { class: 'qad-nom' }, x.nom)));
      const ecran = h('div', { class: 'ecran quiadit' }, h('div', { class: 'ecran-corps' },
        h('p', { class: 'surtitre' }, `Qui a dit ? ${k + 1} sur ${round.tours.length}`),
        h('div', { class: 'qad-bulle' }, c.ctx ? h('small', { class: 'qad-ctx' }, c.ctx) : null, bulle),
        h('div', { class: 'qad-medaillons' }, medaillons)));
      zone.replaceChildren(ecran);
      // La machine à écrire : rapide, et instantanée sans effets.
      const txt = `« ${c.t} »`; let n = 0;
      const taper = () => { if (!effets()) { bulle.textContent = txt; return; } n += 2; bulle.textContent = txt.slice(0, n); if (n < txt.length) setTimeout(taper, 18); };
      taper();
      let repondu = false;
      async function choisir(x) {
        if (repondu) return; repondu = true;
        bulle.textContent = txt;
        const ok = x.a === c.a;
        if (ok) bons++;
        ctx.combo(ok); son(ok ? 'ok' : 'ko'); vibrer(ok ? 10 : [20, 40, 20]);
        medaillons.forEach((m, j) => { const bon = c.choix[j].a === c.a; m.disabled = true; m.classList.add(bon ? 'hoche' : 'retourne'); if (m === medaillons[c.choix.indexOf(x)] && !ok) m.classList.add('choisi-faux'); });
        await attendre(700);
        ecran.append(h('p', { class: `qad-verdict ${ok ? 'juste' : 'faux'}` }, ok ? `Oui, ${c.nom}.` : `Non : c’est ${c.nom}.`),
          barrePied(continuer(k + 1 < round.tours.length ? 'Citation suivante' : 'Continuer', () => { k++; if (k < round.tours.length) tour(); else conclure(); })));
      }
    };
    function conclure() {
      const n = round.tours.length; const score = n ? bons / n : 0;
      ctx.gain(Math.round(30 * score) + (bons === n ? 6 : 0));
      fini();
      finEpreuve(zone, ctx, { score, parfait: bons === n },
        h('p', { class: 'surtitre' }, `${plurielS(bons, 'auteur')} reconnu${bons > 1 ? 's' : ''} sur ${n}.`),
        h('article', { class: 'revelation' }, h('h3', {}, 'Les voix du cours'), h('ul', { class: 'qad-recap' }, round.tours.map((c) => h('li', {}, h('b', {}, c.nom), ` : « ${c.t} »`)))));
    }
    if (!round.tours.length) { fini(); ctx.fin({ score: 1, parfait: true }); return; }
    tour();
  });
}

// AU SCANNER ----------------------------------------------------------------------------------------
// Un texte passe au scanner. Est-ce une règle de droit ? Sinon, qu'est-ce qui lui manque ?
// Puis le rayon balaie la feuille et les trois éléments de la définition classique s'allument.
const CRITERES = [['conduite', 'Une règle de conduite', 'Il dit ce qui doit être'], ['generale', 'Générale et impersonnelle', 'Il vise tout le monde, pas une personne'], ['sanction', 'Sanctionnée par l’autorité publique', 'L’État le fait respecter']];
const MANQUES = [['conduite', 'Il décrit ce qui est : ce n’est pas une règle de conduite'], ['generale', 'Il vise une personne nommée : c’est une décision'], ['sanction', 'Aucune autorité publique ne le fait respecter']];
export function jouerScanner(zone, ctx, round) {
  return new Promise((fini) => {
    let k = 0; let points = 0;
    const texte = () => {
      const x = round.textes[k];
      const feuille = h('article', { class: 'sc-feuille' }, h('small', {}, x.src), h('p', {}, x.t), h('i', { class: 'sc-rayon', 'aria-hidden': 'true' }));
      const question = h('h2', { class: 'question sc-question' }, 'Est-ce une règle de droit ?');
      const choix = h('div', { class: 'sc-choix-liste' });
      const corps = h('div', { class: 'ecran-corps' }, h('p', { class: 'surtitre' }, `Au scanner : ${k + 1} sur ${round.textes.length}`), feuille, question, choix);
      const ecran = h('div', { class: 'ecran scanner' }, corps);
      zone.replaceChildren(ecran);
      const bouton = (label, ok, action, classe = '') => h('button', { class: `sc-choix ${classe}`, 'data-ok': repere(ok), onClick: action }, label);
      // Première question : du droit, ou pas.
      choix.replaceChildren(
        bouton('Oui, c’est du droit', x.manque === null, () => repondre(null), 'oui'),
        bouton('Non, ce n’est pas du droit', x.manque !== null, () => deuxieme(), 'non'));
      function deuxieme() {
        son('tap');
        question.textContent = 'Qu’est-ce qui lui manque ?';
        choix.replaceChildren(...MANQUES.map(([m, label]) => bouton(label, x.manque === m, () => repondre(m))));
      }
      async function repondre(m) {
        for (const b of choix.querySelectorAll('button')) b.disabled = true;
        const verdictJuste = (m === null) === (x.manque === null);
        const manqueJuste = m === x.manque;
        const score = manqueJuste ? 1 : verdictJuste ? 0.5 : 0;
        points += score;
        ctx.combo(manqueJuste);
        choix.remove();
        question.textContent = 'Le scanner';
        feuille.classList.add('balaye');
        son('tic');
        await attendre(effets() ? 750 : 0);
        // Les trois éléments, un par un : vert s'il est rempli, rouge s'il manque, gris s'il n'a plus de sens.
        const lignes = CRITERES.map(([c, nom, aide]) => h('div', { class: 'sc-temoin', 'data-critere': c }, h('i', { class: 'sc-voyant', 'aria-hidden': 'true' }), h('span', {}, h('b', {}, nom), h('small', {}, aide))));
        corps.append(h('div', { class: 'sc-temoins' }, lignes));
        for (const [i, [c]] of CRITERES.entries()) {
          await attendre(effets() ? 260 : 0);
          const etat_ = x.manque === c ? 'manque' : x.manque === 'conduite' ? 'sans-objet' : 'rempli';
          lignes[i].classList.add(etat_);
          if (etat_ !== 'sans-objet') son(etat_ === 'rempli' ? 'ok' : 'ko');
        }
        const droit = x.manque === null;
        const bilan = manqueJuste ? 'Bien vu.' : verdictJuste ? 'Bon verdict, mais ce n’est pas cet élément qui manque.' : 'Ce n’est pas le bon verdict.';
        corps.append(h('div', { class: `sc-verdict ${droit ? 'droit' : 'pas'}` }, h('b', {}, droit ? 'Du droit' : 'Pas une règle de droit'), h('p', {}, x.w), h('small', { class: 'sc-bilan' }, bilan)));
        ecran.append(barrePied(continuer(k + 1 < round.textes.length ? 'Texte suivant' : 'Continuer', () => { k++; if (k < round.textes.length) texte(); else conclure(); })));
      }
    };
    function conclure() {
      const n = round.textes.length; const score = points / n;
      ctx.gain(Math.round(30 * score) + (score === 1 ? 6 : 0));
      fini();
      finEpreuve(zone, ctx, { score, parfait: score === 1 },
        h('p', { class: 'surtitre' }, score === 1 ? 'Tous les textes bien jugés.' : `${Math.round(score * 100)} % de bonnes analyses.`),
        h('article', { class: 'revelation' }, h('h3', {}, 'La définition classique'),
          h('p', { class: 'apport' }, 'Une règle de conduite en société, générale et impersonnelle, dont le respect est imposé par l’autorité publique. Il manque un élément ? Ce n’est pas une règle de droit.')));
    }
    texte();
  });
}

// MEMORY ---------------------------------------------------------------------------------------
// Douze cartes retournées : une notion, sa définition courte. Une paire trouvée s'envole vers le dossier.
export function jouerMemory(zone, ctx, round) {
  return new Promise((fini) => {
    const cartes = round.paires.flatMap((p) => [{ p, t: p.a, cote: 'a' }, { p, t: p.b, cote: 'b' }]).sort(() => Math.random() - 0.5);
    let ouvertes = []; let trouvees = 0; let coups = 0; let bloque = false;
    let enMemorisation = true;
    let reste = 20;
    const erreurs = new Map();
    const dossier = h('span', { class: 'mem-dossier', 'aria-label': 'Paires trouvées' }, icone('note', 22), h('b', {}, '0'));
    const els = cartes.map((c, i) => {
      const repereLettre = String.fromCharCode(65 + i);
      c.repereLettre = repereLettre;
      const el = h('button', { class: `mem-carte cote-${c.cote} ouverte`, 'data-paire': repere(c.p.id), 'aria-label': c.t, onClick: () => retourner(c, el) },
        h('span', { class: 'mem-dos', 'aria-hidden': 'true' }, h('span', { class: 'mem-repere' }, repereLettre)), h('span', { class: 'mem-face' }, c.t));
      c.el = el; return el;
    });
    const reboursEl = h('span', { class: 'mem-rebours' }, `${reste} s`);
    const pretBtn = h('button', { type: 'button', class: 'mem-pret', onClick: finMemorisation }, 'C’est mémorisé');
    const consigne = h('p', { class: 'mem-consigne' },
      h('span', { class: 'mem-consigne-txt' }, 'Mémorise les cartes : elles se retournent dans ', reboursEl, '.'),
      pretBtn);
    const ecran = h('div', { class: 'ecran memory' }, h('div', { class: 'ecran-corps' },
      h('div', { class: 'mem-tete' }, h('p', { class: 'surtitre' }, 'Memory'), dossier),
      consigne,
      h('div', { class: 'mem-grille' }, els)));
    zone.replaceChildren(ecran);

    const interval = setInterval(() => {
      if (!ecran.isConnected) {
        clearInterval(interval);
        return;
      }
      reste--;
      if (reste <= 0) {
        finMemorisation();
      } else {
        reboursEl.textContent = `${reste} s`;
      }
    }, 1000);

    function finMemorisation() {
      clearInterval(interval);
      if (!enMemorisation) return;
      enMemorisation = false;
      if (!ecran.isConnected) return;
      for (const c of cartes) {
        c.el.classList.remove('ouverte');
        c.el.setAttribute('aria-label', `Carte ${c.repereLettre}`);
      }
      consigne.textContent = round.consigne || 'Retrouve chaque notion et sa définition.';
    }

    async function retourner(c, el) {
      if (bloque || enMemorisation || el.classList.contains('ouverte') || el.classList.contains('trouvee')) return;
      el.classList.add('ouverte'); el.setAttribute('aria-label', c.t); son('carte');
      ouvertes.push(c);
      if (ouvertes.length < 2) return;
      coups++;
      const [x, y] = ouvertes; ouvertes = [];
      if (x.p === y.p) {
        trouvees++; son('valide'); vibrer(10); ctx.combo(true);
        await attendre(350);
        for (const z of [x, y]) z.el.classList.add('trouvee');
        dossier.querySelector('b').textContent = String(trouvees);
        dossier.classList.remove('recoit'); void dossier.offsetWidth; dossier.classList.add('recoit');
        if (x.p.carte) ctx.noter(x.p.carte, (erreurs.get(x.p) || 0) < 2);
        if (trouvees === round.paires.length) setTimeout(conclure, duree(500));
      } else {
        bloque = true; son('ecart');
        for (const z of [x, y]) erreurs.set(z.p, (erreurs.get(z.p) || 0) + 1);
        // Le temps de lire les deux cartes : elles restent ouvertes, puis se referment seules, ou d'un toucher.
        consigne.textContent = 'Pas une paire. Lis bien, puis touche l’écran pour continuer.';
        await new Promise((ok) => {
          const t = setTimeout(fermer, 3200);
          const tap = () => fermer();
          function fermer() { clearTimeout(t); ecran.removeEventListener('pointerdown', tap); ok(); }
          setTimeout(() => ecran.addEventListener('pointerdown', tap), 450);
        });
        consigne.textContent = round.consigne || 'Retrouve chaque notion et sa définition.';
        for (const z of [x, y]) { z.el.classList.remove('ouverte'); z.el.setAttribute('aria-label', `Carte ${z.repereLettre}`); }
        await attendre(250);
        bloque = false;
      }
    }
    function conclure() {
      clearInterval(interval);
      const n = round.paires.length;
      const score = Math.max(0.3, Math.min(1, 1 - Math.max(0, coups - n * 1.5) / (n * 2)));
      ctx.gain(Math.round(30 * score) + (coups <= n + 2 ? 8 : 0));
      fini();
      finEpreuve(zone, ctx, { score, parfait: coups <= n + 2 },
        h('p', { class: 'surtitre' }, `${plurielS(n, 'paire')} en ${plurielS(coups, 'coup')}.`),
        h('article', { class: 'revelation' }, h('h3', {}, 'Le dossier'), h('ul', { class: 'mem-recap' }, round.paires.map((p) => h('li', {}, h('b', {}, p.a), ` : ${p.b}`)))));
    }
  });
}
