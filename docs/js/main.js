// Point d'entrée : écrans, séances, récompenses.
import { h, icone, sceau, son, reveillerAudio, confettis, toast, petitSceau } from './ui.js';
import {
  etat, charger, sauver, jour, rang, RANGS, verifierSerie, validerJour, relever, prixForclusion, noter, niveau, aRevoir,
  zonesOuvertes, ouvrirSuivante, evaluerTrophees, BOUTIQUE, THEMES, INSIGNES, DECORS, TROPHEES, TITRES_CARTE, exporter, importer, fixerDecalage,
} from './state.js';
import { indexer, composerDefi, composerBoss, tirerRound, jumeaux, melange } from './engine.js';
import { JEUX, NOMS_MODES, continuer } from './games.js';
import { activerRappel, etatRappel, testerNotification, estInstallee, abonnementActuel } from './notif.js';
import { cloudActif, inscrireAbonnement, copierEnLigne, codeRecuperation, restaurerEnLigne } from './cloud.js';

let ix = null;
const racine = document.getElementById('app');
const onglets = document.getElementById('onglets');
let ongletCourant = 'palais';

const fmt = (n) => n.toLocaleString('fr-FR');
const pluriel = (n, s, p = s + 's') => `${fmt(n)} ${n > 1 ? p : s}`;

function montrer(...enfants) {
  racine.replaceChildren(...enfants.filter(Boolean));
  window.scrollTo(0, 0);
}

function appliquerTheme() { document.documentElement.dataset.theme = etat.theme; }

function barreHaut() {
  const r = rang();
  return h('header', { class: 'haut' },
    h('button', { class: 'haut-rang', onClick: () => aller('profil') }, h('span', {}, etat.insigne !== 'aucun' ? icone(etat.insigne, 17) : null, r.nom),
      h('span', { class: 'jauge', 'aria-hidden': 'true' }, h('i', { style: `width:${Math.round(r.part * 100)}%` }))),
    h('button', { class: 'haut-jetons', onClick: () => aller('boutique'), 'aria-label': `${etat.jetons} jetons de présence` }, h('i', { class: 'jeton' }), fmt(etat.jetons)));
}

function afficherOnglets(vis) {
  onglets.hidden = !vis;
  if (!vis) return;
  const defs = [['palais', 'Palais'], ['carte', 'Chambres'], ['arrets', 'Arrêts'], ['boutique', 'Boutique'], ['profil', 'Profil']];
  onglets.replaceChildren(...defs.map(([id, l]) => h('button', {
    class: `onglet ${ongletCourant === id ? 'actif' : ''}`, 'aria-current': ongletCourant === id ? 'page' : null,
    onClick: () => { son('tap'); aller(id); },
  }, icone(id === 'arrets' ? 'arrets' : id, 22), h('span', {}, l))));
}

function aller(id, p) {
  ongletCourant = id;
  afficherOnglets(true);
  ({ palais: accueil, carte, arrets: collection, boutique, profil }[id])(p);
}

// PALAIS -----------------------------------------------------------------------
function semaine() {
  const j = jour(); const lettres = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
  const cases = [];
  for (let d = j - 6; d <= j; d++) {
    const dow = new Date(d * 864e5).getUTCDay();
    const v = etat.jours[d];
    cases.push(petitSceau(v === 1 ? 'tamponne' : v === 's' ? 'sursis' : v === 'f' ? 'sursis' : d === j ? 'aujourdhui' : '', lettres[dow]));
  }
  return h('div', { class: 'semaine', 'aria-label': 'Sept derniers jours' }, cases);
}

function accueil() {
  const s = etat.serie; const j = jour();
  const fait = s.dernier === j;
  const zones = zonesOuvertes(ix);
  const dus = aRevoir(ix, zones).filter((id) => etat.arrets[id]).length;
  const rompue = etat.rompue;
  const blocRupture = rompue ? h('div', { class: 'rupture' },
    h('p', {}, `Ta série de ${pluriel(rompue.n, 'jour')} est tombée. Un relevé de forclusion peut la rétablir jusqu’à demain soir.`),
    h('button', { class: 'bouton-or', disabled: etat.jetons < prixForclusion(), onClick: () => { if (relever()) { son('sceau'); toast('Série rétablie.'); accueil(); } } },
      `Rétablir pour ${prixForclusion()} jetons`)) : null;

  const lignes = Object.entries(NOMS_MODES).map(([m, [nom, txt]]) => h('button', { class: 'role-ligne', onClick: () => { son('tap'); lancerMode(m); } },
    icone(m, 26), h('span', {}, h('b', {}, nom), h('small', {}, txt))));

  // Sur iPhone, Safari et l'icône de l'écran d'accueil ont chacun leur stockage.
  const aInstaller = /iPhone|iPad|iPod/.test(navigator.userAgent) && !estInstallee()
    ? h('section', { class: 'installer' },
      h('h2', {}, 'Installe l’appli avant de jouer'),
      h('p', {}, 'Une séance faite dans Safari ne suivrait pas dans l’icône : ta série repartirait de zéro.'),
      guideInstallation())
    : null;

  montrer(
    barreHaut(),
    aInstaller,
    h('section', { class: 'tribune', 'data-decor': etat.decor },
      sceau(s.n, { taille: 148, eteint: !fait && s.n === 0 }),
      h('p', { class: 'serie-txt' }, s.n === 0 ? 'Aucune série en cours' : `${pluriel(s.n, 'jour')} de série`),
      h('p', { class: 'serie-sous' }, fait ? 'Séance du jour validée. Reviens demain.' : s.n ? 'Termine une séance aujourd’hui pour la garder.' : 'Termine une séance pour poser ton premier sceau.'),
      semaine(), blocRupture),
    h('div', { class: 'actions' },
      etat.enCours ? h('div', { class: 'reprise' },
        h('button', { class: 'bouton-or', onClick: () => lancer({ reprise: etat.enCours }) }, `Reprendre : ${etat.enCours.titre}, épreuve ${etat.enCours.i + 1} sur ${etat.enCours.rounds.length}`),
        h('button', { class: 'bouton-lien', onClick: () => { etat.enCours = null; sauver(); accueil(); } }, 'Abandonner cette séance')) : null,
      h('button', { class: 'cta', onClick: lancerDefi }, 'Défi du jour'),
      h('p', { class: 'cta-sous' }, dus ? `5 épreuves, ${pluriel(dus, 'arrêt')} à revoir` : '5 épreuves, environ 5 minutes'),
      h('button', { class: 'bouton-lien', onClick: lancerExpress }, 'Juste trois minutes')),
    h('section', { class: 'role' }, h('h2', {}, 'Rôle des épreuves'), lignes),
  );
}

function lancerDefi() {
  const zones = zonesOuvertes(ix);
  lancer({ type: 'defi', titre: 'Défi du jour', rounds: composerDefi(ix, zones, aRevoir(ix, zones)) });
}
function lancerExpress() {
  const zones = zonesOuvertes(ix); const dus = aRevoir(ix, zones);
  const deja = new Set();
  lancer({ type: 'express', titre: 'Trois minutes', rounds: ['paires', 'puzzle', 'paires'].map((t) => tirerRound(ix, t, zones, dus, Math.random, deja)) });
}
function lancerMode(m) {
  const zones = zonesOuvertes(ix); const dus = aRevoir(ix, zones);
  const n = m === 'paires' ? 3 : 2;
  const deja = new Set();
  lancer({ type: 'mode', titre: NOMS_MODES[m][0], rounds: Array.from({ length: n }, () => tirerRound(ix, m, zones, dus, Math.random, deja)) });
}

// SÉANCE ------------------------------------------------------------------------
function lancer({ rounds, titre, type, zone, reprise }) {
  afficherOnglets(false);
  const S = reprise
    ? { ...reprise, rounds: JSON.parse(JSON.stringify(reprise.rounds)), touches: new Map(reprise.touches), nettoyer: [] }
    : { rounds, titre, type, zone, i: 0, xp: 0, jetons: 0, combo: 0, comboMax: 0, vies: type === 'boss' ? 3 : null, scores: [], touches: new Map(), nettoyer: [], parfaites: 0 };
  ({ type, titre, zone } = S);
  // Copie intacte des épreuves : c'est elle qui sert à reprendre après une coupure.
  const copie = JSON.stringify(S.rounds);
  function memoriser() {
    const { nettoyer, ...reste } = S; void nettoyer;
    etat.enCours = { ...reste, rounds: JSON.parse(copie), touches: [...S.touches] };
    sauver();
  }
  const pips = h('div', { class: 'pips', role: 'img' });
  const compteur = h('div', { class: 'combo', 'aria-live': 'polite' });
  const vies = h('div', { class: 'vies' });
  const scene = h('main', { class: 'scene' });
  const quitter = h('button', { class: 'quitter', 'aria-label': 'Quitter la séance', onClick: () => demanderQuitter() }, icone('fermer', 22));
  const entete = h('header', { class: 'entete-seance' }, quitter, pips, S.vies !== null ? vies : compteur);

  function demanderQuitter() {
    const voile = h('div', { class: 'voile' }, h('div', { class: 'boite', role: 'dialog', 'aria-label': 'Quitter la séance' },
      h('p', {}, 'Quitter maintenant ? Cette séance ne comptera pas pour ta série.'),
      h('div', { class: 'boite-actions' },
        h('button', { class: 'bouton-lien sombre', onClick: () => voile.remove() }, 'Continuer la séance'),
        h('button', { class: 'bouton-or', onClick: () => { voile.remove(); S.nettoyer.forEach((f) => f()); etat.enCours = null; sauver(); aller('palais'); } }, 'Quitter'))));
    document.body.append(voile);
  }

  function majEntete() {
    pips.setAttribute('aria-label', `Épreuve ${S.i + 1} sur ${S.rounds.length}`);
    pips.replaceChildren(...S.rounds.map((_, k) => h('i', { class: k < S.i ? 'fait' : k === S.i ? 'en-cours' : '' })));
    compteur.textContent = S.combo >= 2 ? `${S.combo} de suite` : '';
    compteur.classList.toggle('chaud', S.combo >= 5);
    if (S.vies !== null) vies.replaceChildren(...[0, 1, 2].map((k) => h('span', { class: k < S.vies ? 'vie' : 'vie perdue' }, icone('coeur', 16))));
  }

  const ctx = {
    boss: type === 'boss',
    combo(ok) {
      S.combo = ok ? S.combo + 1 : 0;
      S.comboMax = Math.max(S.comboMax, S.combo);
      if (S.combo === 5 || S.combo === 10) son('combo');
      majEntete();
    },
    noter(id, ok, conf) {
      noter(id, ok, conf);
      const t = S.touches.get(id) || { ok: 0, ko: 0 };
      t[ok ? 'ok' : 'ko']++; S.touches.set(id, t);
    },
    gain(xp, j) {
      const m = S.combo >= 10 ? 3 : S.combo >= 5 ? 2 : 1;
      S.xp += xp * m; S.jetons += j;
    },
    touche: () => false,
    nettoyage: (f) => S.nettoyer.push(f),
    fin(res) {
      S.nettoyer.forEach((f) => f()); S.nettoyer = [];
      S.scores.push(res.score); if (res.parfait) S.parfaites++;
      if (S.vies !== null && res.score < 0.6) S.vies--;
      S.i++;
      if (S.vies === 0) return finir(false);
      if (S.i >= S.rounds.length) return finir(true);
      memoriser();
      suivant();
    },
  };

  function suivant() {
    majEntete();
    const r = S.rounds[S.i];
    window.scrollTo(0, 0);
    Promise.resolve(JEUX[r.type](scene, ctx, r, ix)).catch((e) => {
      console.error(e);
      scene.replaceChildren(h('div', { class: 'erreur' }, h('p', {}, 'Cette épreuve n’a pas pu s’afficher. Passe à la suivante.'), continuer('Continuer', () => ctx.fin({ score: 0, parfait: false }))));
    });
  }

  function finir(reussi) { etat.enCours = null; resultats(S, reussi); }
  montrer(entete, scene);
  memoriser();
  suivant();
}

function resultats(S, reussi) {
  setTimeout(copierEnLigne, 1500);
  const avant = rang();
  const moyenne = S.scores.reduce((a, b) => a + b, 0) / (S.scores.length || 1);
  etat.stats.seances++;
  etat.stats.comboMax = Math.max(etat.stats.comboMax, S.comboMax);
  const parfaite = S.parfaites === S.rounds.length && reussi;
  if (parfaite) etat.stats.parfaites++;
  let bonus = 0;
  if (S.type === 'defi' && etat.defi.jour !== jour()) { bonus = 15; etat.defi = { jour: jour(), fini: true }; }
  etat.xp += S.xp; etat.jetons += S.jetons + bonus;

  let textBoss = null;
  if (S.type === 'boss') {
    if (reussi) {
      const premier = !etat.zones.gagnees.includes(S.zone);
      if (premier) {
        etat.zones.gagnees.push(S.zone);
        if (!etat.zones.ouvertes.includes(S.zone + 1) && S.zone < 9) etat.zones.ouvertes.push(S.zone + 1);
        etat.jetons += 40;
      }
      if (S.vies === 3 && !etat.zones.parfaites.includes(S.zone)) etat.zones.parfaites.push(S.zone);
      textBoss = premier ? 'Audience gagnée. La chambre suivante s’ouvre, et 40 jetons te reviennent.' : 'Audience gagnée une nouvelle fois.';
    } else textBoss = 'Audience perdue. Révise cette chambre, puis réessaie.';
  }
  const v = reussi || S.type !== 'boss' ? validerJour() : { nouveau: false, n: etat.serie.n };
  sauver();
  const apres = rang();
  const nouveaux = evaluerTrophees(ix);
  sauver();

  const aRevoirListe = [...S.touches.entries()].filter(([, t]) => t.ko > 0).map(([id]) => ix.parId.get(id));
  const zoneSceau = h('div', { class: 'tampon' });
  const pourcent = Math.round(moyenne * 100);

  const contenu = h('main', { class: 'resultats' },
    zoneSceau,
    h('h1', {}, S.type === 'boss' ? (reussi ? 'Audience gagnée' : 'Audience perdue') : pourcent === 100 ? 'Sans faute' : pourcent >= 70 ? 'Bien jugé' : 'À réviser'),
    textBoss ? h('p', { class: 'res-texte' }, textBoss) : null,
    h('dl', { class: 'res-chiffres' },
      h('div', {}, h('dt', {}, 'Réussite'), h('dd', {}, `${pourcent} %`)),
      h('div', {}, h('dt', {}, 'Expérience'), h('dd', {}, `+${fmt(S.xp)}`)),
      h('div', {}, h('dt', {}, 'Jetons'), h('dd', {}, `+${fmt(S.jetons + bonus)}`))),
    v.coffre ? h('p', { class: 'res-coffre' }, `Coffre de série : ${v.etape ?? v.coffre.etape} jours tenus, ${v.coffre.jetons} jetons et ${pluriel(v.coffre.sursis, 'sursis', 'sursis')}.`) : null,
    apres.i > avant.i ? h('div', { class: 'decret' }, h('p', {}, 'Par décret, tu es nommé'), h('strong', {}, apres.nom)) : null,
    nouveaux.length ? h('ul', { class: 'res-trophees' }, nouveaux.map((t) => h('li', {}, h('b', {}, t.nom), ' ', t.txt))) : null,
    aRevoirListe.length ? h('section', { class: 'res-revoir' }, h('h2', {}, 'À revoir'),
      h('ul', {}, aRevoirListe.slice(0, 6).map((a) => h('li', {}, h('button', { onClick: () => { afficherOnglets(true); ongletCourant = 'arrets'; fiche(a.id); } }, h('b', {}, a.court), ` ${a.an}`))))) : null,
    h('div', { class: 'pied' },
      continuer('Retour au Palais', () => aller('palais')),
      S.type === 'boss' && !reussi ? h('button', { class: 'bouton-lien', onClick: () => lancerBoss(S.zone) }, 'Retenter l’audience') : null),
  );
  montrer(contenu);

  // Le moment fort : le sceau du jour s'abat sur le registre.
  if (v.nouveau) {
    const s = sceau(v.n, { taille: 132 });
    zoneSceau.append(s);
    s.classList.add('frappe');
    setTimeout(() => son('sceau'), 330);
    if (apres.i > avant.i || parfaite || v.coffre) setTimeout(() => { confettis(); son('grade'); }, 700);
  } else {
    zoneSceau.append(sceau(etat.serie.n, { taille: 96, lauriers: false, eteint: etat.serie.n === 0 }));
    if (apres.i > avant.i || parfaite) { confettis(); son('grade'); }
  }
}

// CHAMBRES ------------------------------------------------------------------------
function progressionZone(z) {
  const liste = ix.arrets.filter((a) => a.zones.includes(z));
  const acquis = liste.filter((a) => niveau(a.id) >= 3).length;
  return { total: liste.length, acquis, part: acquis / liste.length };
}

function carte() {
  const ouvertes = zonesOuvertes(ix);
  const salles = ix.zones.map((z) => {
    const p = progressionZone(z.id);
    const ouvert = ouvertes.includes(z.id); const gagne = etat.zones.gagnees.includes(z.id);
    return h('li', { class: `salle ${ouvert ? '' : 'fermee'} ${gagne ? 'gagnee' : ''}` },
      h('button', { onClick: () => { son('tap'); if (ouvert) chambre(z.id); else chambreFermee(z); }, 'aria-label': `${z.titre}, ${p.acquis} arrêts acquis sur ${p.total}${ouvert ? '' : ', fermée'}` },
        h('span', { class: 'salle-marque' }, ouvert ? (gagne ? '✓' : z.id === 10 ? '+' : z.id) : icone('cadenas', 18)),
        h('span', { class: 'salle-txt' }, h('b', {}, z.titre), h('small', {}, z.lieu),
          h('span', { class: 'jauge', 'aria-hidden': 'true' }, h('i', { style: `width:${Math.round(p.part * 100)}%` }))),
        h('span', { class: 'salle-compte' }, `${p.acquis}/${p.total}`)));
  });
  montrer(barreHaut(), h('section', { class: 'page' }, h('h1', {}, 'Les chambres'),
    h('p', { class: 'page-sous' }, 'Chaque chambre suit ton cours. Gagne son audience solennelle pour ouvrir la suivante, ou ouvre tout dans ton profil.'),
    h('ol', { class: 'enfilade' }, salles)));
}

function chambreFermee(z) {
  const voile = h('div', { class: 'voile', onClick: (e) => { if (e.target === voile) voile.remove(); } }, h('div', { class: 'boite' },
    h('p', {}, `« ${z.titre} » s’ouvre quand tu gagnes l’audience précédente.`),
    h('div', { class: 'boite-actions' },
      etat.inv.passe > 0 ? h('button', { class: 'bouton-or', onClick: () => { etat.inv.passe--; const n = ouvrirSuivante(); voile.remove(); toast(`Chambre ${n} ouverte.`); carte(); } }, `Utiliser un passe-droit (${etat.inv.passe})`)
        : h('button', { class: 'bouton-or', onClick: () => { voile.remove(); aller('boutique'); } }, 'Voir la boutique'),
      h('button', { class: 'bouton-lien sombre', onClick: () => voile.remove() }, 'Fermer'))));
  document.body.append(voile);
}

function lancerBoss(z) { lancer({ type: 'boss', titre: 'Audience solennelle', zone: z, rounds: composerBoss(ix, z) }); }
function reviserZone(z) {
  const dus = aRevoir(ix, [z]);
  const types = melange(['paires', 'puzzle', 'juge', 'plan'], Math.random);
  const deja = new Set();
  lancer({ type: 'zone', titre: 'Révision', zone: z, rounds: ['paires', types.find((t) => t !== 'paires'), 'paires'].map((t) => tirerRound(ix, t, [z], dus, Math.random, deja)) });
}

function chambre(zid) {
  const z = ix.zones.find((x) => x.id === zid);
  const p = progressionZone(zid);
  const liste = ix.arrets.filter((a) => a.zones.includes(zid)).sort((a, b) => a.an - b.an);
  montrer(
    h('header', { class: 'haut-simple' }, h('button', { class: 'quitter', 'aria-label': 'Retour', onClick: () => aller('carte') }, icone('retour', 22)), h('span', {}, `${p.acquis} acquis sur ${p.total}`)),
    h('section', { class: 'page' }, h('h1', {}, z.titre), h('p', { class: 'page-sous' }, z.lieu),
      h('div', { class: 'actions gauche' },
        h('button', { class: 'cta', onClick: () => reviserZone(zid) }, 'Réviser cette chambre'),
        zid !== 10 ? h('button', { class: 'bouton-lien', onClick: () => lancerBoss(zid) }, etat.zones.gagnees.includes(zid) ? 'Rejouer l’audience solennelle' : 'Audience solennelle : 6 épreuves, 3 vies, sans joker') : null),
      h('ul', { class: 'liste-arrets' }, liste.map(ligneArret))));
}

const etoiles = (b) => h('span', { class: 'niveau', 'aria-label': TITRES_CARTE[b] }, TITRES_CARTE[b]);
const ligneArret = (a) => h('li', {}, h('button', { class: `ligne-arret n${niveau(a.id)}`, onClick: () => fiche(a.id) },
  h('span', { class: 'an' }, a.an), h('span', { class: 'nm' }, a.court), etoiles(niveau(a.id))));

// ARRÊTS ----------------------------------------------------------------------------
let filtre = { texte: '', zone: 0 };
function collection() {
  const champ = h('input', { type: 'search', class: 'recherche', placeholder: 'Chercher un arrêt ou une année', value: filtre.texte, 'aria-label': 'Chercher un arrêt', onInput: (e) => { filtre.texte = e.target.value; rendre(); } });
  const zonesBtns = [{ id: 0, titre: 'Tous' }, ...ix.zones].map((z) => h('button', { class: `filtre ${filtre.zone === z.id ? 'actif' : ''}`, onClick: () => { filtre.zone = z.id; collection(); } }, z.id ? `${z.id === 10 ? 'Bonus' : z.id}` : 'Tous'));
  const grille = h('ul', { class: 'grille-cartes' });
  const norm = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  function rendre() {
    const q = norm(filtre.texte);
    const res = ix.arrets.filter((a) => (!filtre.zone || a.zones.includes(filtre.zone)) && (!q || norm(`${a.nom} ${a.an} ${Object.values(a.ap).join(' ')}`).includes(q))).sort((a, b) => a.an - b.an);
    grille.replaceChildren(...(res.length ? res.map((a) => h('li', {}, h('button', { class: `carte-arret n${niveau(a.id)}`, onClick: () => fiche(a.id) },
      h('span', { class: 'carte-an' }, a.an), h('b', {}, a.court), etoiles(niveau(a.id))))) : [h('li', { class: 'vide' }, 'Aucun arrêt ne correspond à cette recherche.')]));
  }
  const acquis = Object.values(etat.arrets).filter((a) => a.b >= 5).length;
  montrer(barreHaut(), h('section', { class: 'page' }, h('h1', {}, 'Les arrêts'),
    h('p', { class: 'page-sous' }, `${pluriel(acquis, 'grand arrêt')} sur ${ix.arrets.length}. Chaque carte monte de niveau quand tu réussis.`),
    champ, h('div', { class: 'filtres' }, zonesBtns), grille));
  rendre();
}

function fiche(id) {
  const a = ix.parId.get(id); const st = etat.arrets[id];
  const conf = st ? Object.entries(st.c).sort((x, y) => y[1] - x[1]).slice(0, 3) : [];
  const champs = a.nf ? [['Ce qu’il faut retenir', a.s], ['Portée', a.po]] : [['Faits', a.f], ['Procédure', a.pr], ['Problème de droit', a.q], ['Solution', a.s], ['Portée', a.po]];
  const jum = jumeaux(ix, id);
  montrer(
    h('header', { class: 'haut-simple' }, h('button', { class: 'quitter', 'aria-label': 'Retour', onClick: () => aller(ongletCourant) }, icone('retour', 22)), etoiles(niveau(id))),
    h('article', { class: 'fiche' },
      h('div', { class: 'revelation-tete' }, h('span', { class: 'annee' }, a.an), h('div', {}, h('h1', {}, a.court), h('p', { class: 'ref' }, a.ref))),
      Object.entries(a.ap).map(([, t]) => h('p', { class: 'apport' }, t)).filter((_, i, l) => l.findIndex((x) => x.textContent === _.textContent) === i),
      h('h2', {}, 'Son histoire'), h('p', { class: 'histoire' }, a.h),
      a.nf ? h('p', { class: 'note-nf' }, 'Faits de l’espèce non vérifiés : cette fiche s’en tient à la règle du cours.') : null,
      h('h2', {}, 'La fiche'),
      champs.map(([l, t]) => h('div', { class: 'rubrique' }, h('h3', {}, l), h('p', {}, t))),
      conf.length ? h('div', { class: 'confusions' }, h('h2', {}, 'Tu le confonds avec'), h('ul', {}, conf.map(([c, n]) => h('li', {}, h('button', { onClick: () => fiche(c) }, ix.parId.get(c).nom), ` ${n} fois`)))) : null,
      jum.length ? h('div', { class: 'jumeaux' }, h('h2', {}, 'Ses faux jumeaux'), h('ul', {}, jum.map((j) => h('li', {}, h('button', { onClick: () => fiche(j.id) }, `${ix.parId.get(j.id).court} (${ix.parId.get(j.id).an})`), ' ', j.k)))) : null,
    ));
}

// BOUTIQUE ---------------------------------------------------------------------------
function acheter(item) {
  if (etat.jetons < item.prix) return toast('Pas assez de jetons.');
  if (item.max && etat.inv[item.id] >= item.max) return toast(`${item.max} au maximum.`);
  etat.jetons -= item.prix; etat.inv[item.id] = (etat.inv[item.id] || 0) + 1;
  sauver(); son('jeton'); boutique();
}
function boutique() {
  const objets = BOUTIQUE.map((b) => h('li', { class: 'article' },
    icone(b.id, 26),
    h('div', {}, h('b', {}, b.nom), h('p', {}, b.txt), h('small', {}, `En stock : ${etat.inv[b.id] || 0}`)),
    h('button', { class: 'prix', disabled: etat.jetons < b.prix, onClick: () => acheter(b), 'aria-label': `Acheter ${b.nom} pour ${b.prix} jetons` }, h('i', { class: 'jeton' }), b.prix)));
  const themes = THEMES.map((t) => {
    const a = etat.themes.includes(t.id); const actif = etat.theme === t.id;
    return h('li', { class: `article theme-${t.id}` },
      h('span', { class: 'pastille' }),
      h('div', {}, h('b', {}, t.nom), h('p', {}, t.txt)),
      a ? h('button', { class: `prix ${actif ? 'actif' : ''}`, disabled: actif, onClick: () => { etat.theme = t.id; appliquerTheme(); sauver(); boutique(); } }, actif ? 'Porté' : 'Porter')
        : h('button', { class: 'prix', disabled: etat.jetons < t.prix, onClick: () => { etat.jetons -= t.prix; etat.themes.push(t.id); etat.theme = t.id; appliquerTheme(); sauver(); son('jeton'); boutique(); } }, h('i', { class: 'jeton' }), t.prix));
  });
  const collectionObjets = (liste, cle, cleListe, visuel) => liste.map((t) => {
    const a = etat[cleListe].includes(t.id); const actif = etat[cle] === t.id;
    return h('li', { class: 'article' }, visuel(t), h('div', {}, h('b', {}, t.nom), h('p', {}, t.txt)),
      a ? h('button', { class: `prix ${actif ? 'actif' : ''}`, disabled: actif, onClick: () => { etat[cle] = t.id; sauver(); boutique(); } }, actif ? 'Choisi' : 'Choisir')
        : h('button', { class: 'prix', disabled: etat.jetons < t.prix, onClick: () => { etat.jetons -= t.prix; etat[cleListe].push(t.id); etat[cle] = t.id; sauver(); son('jeton'); boutique(); } }, h('i', { class: 'jeton' }), t.prix));
  });
  const insignes = collectionObjets(INSIGNES, 'insigne', 'insignes', (t) => (t.id === 'aucun' ? h('span', { class: 'pastille vide-p' }) : icone(t.id, 26)));
  const decors = collectionObjets(DECORS, 'decor', 'decors', (t) => h('span', { class: `pastille decor-${t.id}` }));
  montrer(barreHaut(), h('section', { class: 'page' }, h('h1', {}, 'La boutique'),
    h('p', { class: 'page-sous' }, 'Tes jetons de présence se gagnent en finissant des épreuves.'),
    h('ul', { class: 'articles' }, objets), h('h2', {}, 'Tenues'), h('ul', { class: 'articles' }, themes),
    h('h2', {}, 'Insignes'), h('ul', { class: 'articles' }, insignes),
    h('h2', {}, 'Décors du Palais'), h('ul', { class: 'articles' }, decors)));
}

// PROFIL -----------------------------------------------------------------------------
function profil() {
  const r = rang(); const vals = Object.values(etat.arrets);
  const stats = [['Séances', etat.stats.seances], ['Record de série', etat.serie.record], ['Sans faute', etat.stats.parfaites], ['Meilleur enchaînement', etat.stats.comboMax], ['Arrêts vus', vals.length], ['Grands arrêts', vals.filter((a) => a.b >= 5).length]];
  const blocRappel = h('div', { class: 'rappel' });
  async function rendreRappel(code) {
    const e = await etatRappel();
    if (!estInstallee()) {
      blocRappel.replaceChildren(h('p', {}, 'Le rappel de 9 h fonctionne une fois l’appli ajoutée à l’écran d’accueil.'), guideInstallation());
      return;
    }
    if (e === 'refuse') { blocRappel.replaceChildren(h('p', {}, 'Les notifications sont bloquées. Autorise-les dans Réglages, Notifications, Arrêts.')); return; }
    if (cloudActif()) {
      const liste = [];
      if (e === 'actif') liste.push(h('p', {}, 'Rappel activé sur ce téléphone, chaque jour vers 9 h.'), h('button', { class: 'bouton-lien sombre', onClick: async () => { await testerNotification(); toast('Notification envoyée.'); } }, 'Tester sur ce téléphone'));
      else liste.push(h('button', { class: 'bouton-or', onClick: async () => { try { await inscrireAbonnement(JSON.parse(await activerRappel())); toast('Rappel activé.'); rendreRappel(); } catch (err) { toast(err.message); } } }, 'Activer le rappel de 9 h'));
      blocRappel.replaceChildren(...liste);
      return;
    }
    const liste = [];
    if (code) {
      liste.push(h('p', {}, 'Copie ce code et colle-le dans le secret PUSH_SUBSCRIPTION du dépôt.'),
        h('textarea', { class: 'code', readonly: true, rows: 4, 'aria-label': 'Code de notification' }, code),
        h('button', { class: 'bouton-or', onClick: async () => { await navigator.clipboard.writeText(code); toast('Code copié.'); } }, 'Copier le code'));
    }
    liste.push(h('button', { class: 'bouton-or', onClick: async () => { try { rendreRappel(await activerRappel()); } catch (err) { toast(err.message); } } }, e === 'actif' ? 'Afficher le code du rappel' : 'Activer le rappel de 9 h'));
    if (e === 'actif') liste.push(h('button', { class: 'bouton-lien sombre', onClick: async () => { await testerNotification(); toast('Notification envoyée.'); } }, 'Tester sur ce téléphone'));
    blocRappel.replaceChildren(...liste);
  }
  const champSauvegarde = h('textarea', { class: 'code', rows: 3, placeholder: 'Colle ici un code de sauvegarde', 'aria-label': 'Code de sauvegarde' });
  montrer(barreHaut(), h('section', { class: 'page' },
    h('h1', {}, r.nom),
    h('p', { class: 'page-sous' }, r.suivant ? `${fmt(etat.xp)} points. Encore ${fmt(r.suivant.xp - etat.xp)} pour devenir ${r.suivant.nom}.` : 'Dernier grade atteint.'),
    h('span', { class: 'jauge grande', 'aria-hidden': 'true' }, h('i', { style: `width:${Math.round(r.part * 100)}%` })),
    h('ol', { class: 'carriere' }, RANGS.map((x, i) => h('li', { class: i <= r.i ? 'atteint' : '' }, x.nom))),
    h('dl', { class: 'stats' }, stats.map(([l, v]) => h('div', {}, h('dt', {}, l), h('dd', {}, fmt(v))))),
    h('h2', {}, 'Trophées'),
    h('ul', { class: 'trophees' }, TROPHEES.map((t) => h('li', { class: etat.trophees[t.id] ? 'gagne' : '' }, h('b', {}, t.nom), h('small', {}, t.txt)))),
    h('h2', {}, 'Rappel quotidien'), blocRappel,
    h('h2', {}, 'Réglages'),
    h('label', { class: 'reglage' }, h('span', {}, 'Sons'), h('input', { type: 'checkbox', checked: etat.reglages.son, onChange: (e) => { etat.reglages.son = e.target.checked; sauver(); } })),
    h('label', { class: 'reglage' }, h('span', {}, 'Ouvrir toutes les chambres'), h('input', { type: 'checkbox', checked: etat.reglages.toutOuvert, onChange: (e) => { etat.reglages.toutOuvert = e.target.checked; sauver(); } })),
    h('h2', {}, 'Sauvegarde'),
    cloudActif() ? blocCloud() : null,
    h('p', { class: 'aide-claire' }, cloudActif() ? 'Copie manuelle, si tu préfères garder ton propre code.' : 'Ta progression reste sur ce téléphone. Garde une copie de ce code avant de changer d’appareil ou de supprimer l’appli.'),
    h('button', { class: 'bouton-or', onClick: async () => { const c = exporter(); try { await navigator.clipboard.writeText(c); toast('Sauvegarde copiée.'); } catch { champSauvegarde.value = c; toast('Copie le code affiché.'); } } }, 'Copier ma sauvegarde'),
    champSauvegarde,
    h('button', { class: 'bouton-lien', onClick: () => { try { importer(champSauvegarde.value); appliquerTheme(); toast('Progression restaurée.'); aller('palais'); } catch { toast('Ce code de sauvegarde est illisible.'); } } }, 'Restaurer ce code'),
    h('p', { class: 'version' }, `Contenu du ${ix.version}`)));
  rendreRappel();
}

// Copie automatique : le code de récupération est la seule chose à garder.
function blocCloud() {
  const code = codeRecuperation();
  const champ = h('input', { class: 'code', placeholder: 'XXXXXX-XXXXXX-XXXXXX-XXXXXX', 'aria-label': 'Code de récupération', autocapitalize: 'characters', autocomplete: 'off' });
  return h('div', { class: 'cloud' },
    h('p', { class: 'aide-claire' }, etat.cloud.dernier === jour() ? 'Copie en ligne à jour.' : etat.cloud.dernier ? 'Copie en ligne faite après ta dernière séance connectée.' : 'Ta progression se copie en ligne après chaque séance.'),
    h('p', { class: 'aide-claire' }, 'Note ce code une fois, hors de l’appli. Lui seul permet de retrouver ta progression sur un autre téléphone. Ne le partage pas.'),
    h('p', { class: 'code-recup' }, code),
    h('button', { class: 'bouton-or', onClick: async () => { try { await navigator.clipboard.writeText(code); toast('Code copié.'); } catch { toast('Recopie le code affiché.'); } } }, 'Copier le code de récupération'),
    champ,
    h('button', { class: 'bouton-lien', onClick: async () => { try { await restaurerEnLigne(champ.value); appliquerTheme(); toast('Progression restaurée.'); aller('palais'); } catch (err) { toast(err.message); } } }, 'Restaurer avec ce code'));
}

function guideInstallation() {
  return h('ol', { class: 'guide' },
    h('li', {}, 'Dans Safari, touche le bouton Partager.'),
    h('li', {}, 'Choisis « Sur l’écran d’accueil », puis Ajouter.'),
    h('li', {}, 'Ouvre l’appli depuis sa nouvelle icône.'));
}

// DÉMARRAGE --------------------------------------------------------------------------
function bandeauMiseAJour(reg) {
  if (document.querySelector('.maj')) return;
  document.body.append(h('button', { class: 'maj', onClick: () => { reg.waiting?.postMessage('activer'); } }, 'Nouvelle version disponible : recharger'));
}

async function demarrer() {
  const params = new URLSearchParams(location.search);
  if (params.has('decalage')) fixerDecalage(+params.get('decalage'));
  const [contenu] = await Promise.all([fetch('content.json').then((r) => r.json()), charger()]);
  ix = indexer(contenu);
  appliquerTheme();
  document.addEventListener('pointerdown', reveillerAudio, { passive: true });
  const evenement = verifierSerie();
  aller('palais');
  if (evenement?.type === 'sursis') toast(`${pluriel(evenement.n, 'sursis', 'sursis')} utilisé${evenement.n > 1 ? 's' : ''} : ta série est sauve.`);
  if (params.has('test')) window.__app = { etat: () => etat, ix, aller, lancerDefi };

  if ('serviceWorker' in navigator) {
    try {
      const reg = await navigator.serviceWorker.register('sw.js');
      if (reg.waiting) bandeauMiseAJour(reg);
      reg.addEventListener('updatefound', () => {
        const n = reg.installing;
        n?.addEventListener('statechange', () => { if (n.state === 'installed' && navigator.serviceWorker.controller) bandeauMiseAJour(reg); });
      });
      let recharge = false;
      if (cloudActif()) {
        abonnementActuel().then((s) => s && inscrireAbonnement(s)).catch(() => {});
        copierEnLigne();
        window.addEventListener('online', copierEnLigne);
      }
      navigator.serviceWorker.addEventListener('controllerchange', () => { if (!recharge && document.querySelector('.maj')) { recharge = true; location.reload(); } });
    } catch (e) { console.warn('Service worker indisponible', e); }
  }
}

demarrer().catch((e) => {
  console.error(e);
  racine.replaceChildren(h('main', { class: 'erreur' }, h('p', {}, 'L’appli n’a pas pu démarrer. Vérifie ta connexion pour la première ouverture, puis recharge.')));
});
