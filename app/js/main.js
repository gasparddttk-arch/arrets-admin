// Point d'entrée : écrans, séances, récompenses.
import { h, toast, confettis, estRose, bebew, slayDiva, effets } from './ui.js';
import { icone, sceau, petitSceau, laurier, medaille } from './visuels.js';
import { chouette, portes, reagir, plumes, codeEnvole, adjuge, precharger, POSE_MODE, TENUES, SKINS, hibouSkin, skinPorte, danser, DUREE_DANSE } from './chouette.js';
import { son, reveillerAudio, surveillerAudio, appliquerSession, vibrer, rendreSon, NOMS_SONS } from './sons.js';
import { remplacerEtat, ajouterSemaine, changerEquipe,
  SCEAU_REUSSITE, SCEAU_FICHES, PRIME_MAITRISE, etat, M, charger, sauver, jour, lundi, rang, rangGeneral, verifierSerie, validerJour, relever, prixForclusion, noter, niveau, aRevoir,
  zonesOuvertes, zonesDuJour, ouvrirSuivante, ouvrirApres, evaluerTrophees, BOUTIQUE, THEMES, INSIGNES, DECORS, TROPHEES, TITRES_CARTE, exporter, importer, fixerDecalage, rembourse,
  MATIERES, matiereDe, RANGS_GENERAL, PLAFOND_JOUR, PIECES_EPREUVE, PRIX_DUNK, gainsDuJour, crediter,
} from './state.js';
import { indexer, composerDefi, composerBoss, tirerRound, jumeaux, melange } from './engine.js';
import { JEUX, NOMS_MODES, NOMS_MODES_OBLIG, continuer } from './games.js';
import { jouerCas, jouerRemede, jouerFrise } from './jeux-oblig.js';
import { lancerDunk } from './dunk.js';
import { activerRappel, etatRappel, testerNotification, estInstallee, abonnementActuel } from './notif.js';
import { cloudActif, inscrireAbonnement } from './cloud.js';
import { SUPABASE_URL } from './config.js';
import { connecte, retourConnexion, completerUtilisateur, synchroniser, envoyerProgression, envoyerSignalements, recevoirCadeauxCompte, connexionGoogle, envoyerCode, verifierCode, deconnexion, lireProfil, changerPseudo, estAdmin, adminComptes, adminJetons, adminStatut, adminSignalements, adminTraiter, adminReglage, adminChangerReglage, monProfil, reglerProfil, mesAmis, mesBloques, demanderAmi, repondreAmi, retirerAmi, bloquer, mesDefis, creerDefi, lireDefi, repondreDefi, refuserDefi, mesNotifications, toutLu, annoncerDefiJour, inscrireAppareil, resume as monResume } from './compte.js';
import { images, chargerImages, preparerImage, enregistrerImage, retirerImage } from './images.js';

const TOUS_JEUX = { ...JEUX, cas: jouerCas, remede: jouerRemede, frise: jouerFrise };
let ix = null; // Le contenu de la matière ouverte.
const CONTENUS = {};
const PAR_EQUIPE = {};
const racine = document.getElementById('app');
const onglets = document.getElementById('onglets');
let ongletCourant = 'palais';

const fmt = (n) => n.toLocaleString('fr-FR');
const pluriel = (n, s, p = s + 's') => `${fmt(n)} ${n > 1 ? p : s}`;
const monnaie = (n) => pluriel(n, estRose() ? 'canette' : 'jeton');
const estOblig = () => etat.matiere === 'oblig';
const nomsModes = () => (estOblig() ? NOMS_MODES_OBLIG : NOMS_MODES);

function montrer(...enfants) {
  racine.replaceChildren(...enfants.filter(Boolean));
  window.scrollTo(0, 0);
}

function appliquerTheme() {
  const r = document.documentElement;
  r.dataset.theme = etat.theme;
  r.dataset.effets = effets() ? 'oui' : 'non';
  if (images.jeton) r.style.setProperty('--jeton-image', `url("${images.jeton}")`);
  else r.style.removeProperty('--jeton-image');
  document.querySelector('meta[name="theme-color"]').setAttribute('content', etat.theme === 'rose' ? '#C2466E' : '#0C1A47');
}

function barreHaut() {
  const r = rang();
  return h('header', { class: 'haut' },
    h('button', { class: 'haut-rang', onClick: () => aller('profil'), 'aria-label': `${r.nom}, voir le profil` },
      h('span', { class: 'haut-ligne' }, h('span', { class: 'haut-nom' }, etat.insigne !== 'aucun' ? icone(etat.insigne, 16) : null, r.nom), laurier(36)),
      h('span', { class: 'jauge', 'aria-hidden': 'true' }, h('i', { style: `transform:scaleX(${r.part.toFixed(3)})` }))),
    connecte() ? h('button', { class: 'haut-amis', onClick: () => aller('amis'), 'aria-label': nonLus ? `Amis, ${pluriel(nonLus, 'nouvelle')}` : 'Amis' }, icone('equipe', 26), nonLus ? h('span', { class: 'pastille' }, nonLus > 9 ? '9+' : String(nonLus)) : null) : null,
    h('button', { class: 'haut-jetons', onClick: () => aller('boutique'), 'aria-label': monnaie(etat.jetons) }, h('i', { class: 'jeton' }), fmt(etat.jetons)));
}
let nonLus = 0;
async function compterNouvelles() {
  try { nonLus = (await mesNotifications()).filter((n) => !n.lu).length; } catch { return; }
  const b = document.querySelector('.haut-amis');
  if (b) b.replaceWith(barreHaut().querySelector('.haut-amis') || '');
}

// ÉCRAN DE CHOIX -----------------------------------------------------------------
function ouvrirMatiere(id) {
  etat.matiere = id; ix = CONTENUS[id]; filtre = { texte: '', zone: 0, type: 'arrets' };
  sauver(); son('carte'); vibrer(8);
  aller('palais');
}

// Le groupe se choisit une fois. Il décide du cours et des exercices de droit des obligations.
const indexerObligations = () => { CONTENUS.oblig = indexer(PAR_EQUIPE[etat.equipe], etat.equipe); CONTENUS.oblig.vus = () => (etat.oblig.exos ||= {}); };
function rejoindreEquipe(n) {
  changerEquipe(n); indexerObligations(); filtre = { texte: '', zone: 0, type: 'arrets' };
  if (etat.matiere === 'oblig') ix = CONTENUS.oblig;
}
function apresRestauration() {
  appliquerTheme(); indexerObligations(); ix = CONTENUS[etat.matiere];
}

function choisirEquipe() {
  afficherOnglets(false);
  const choix = (n, detail) => h('button', { class: 'porte porte-equipe', 'data-equipe': n, onClick: () => { son('carte'); vibrer(8); rejoindreEquipe(n); matieres(); } },
    h('span', { class: 'porte-icone' }, icone('balance', 34)),
    h('span', { class: 'porte-txt' }, h('b', {}, `Équipe ${n}`), detail ? h('small', {}, detail) : null));
  montrer(h('section', { class: 'choix' },
    h('div', { class: 'choix-tete' }, h('h1', {}, 'Quelle est ton équipe ?'), chouette('debout', { taille: 128, vivante: true, classe: 'chouette-guide' })),
    h('p', { class: 'page-sous' }, 'Tu ne verras que le cours et les exercices de ton équipe en droit des obligations. Tu pourras changer dans Profil.'),
    h('div', { class: 'portes' }, choix(1, 'Cours du Pr Molfessis'), choix(2, null))));
}

function matieres() {
  afficherOnglets(false);
  const g = rangGeneral(); const s = etat.serie;
  const guide = chouette('debout', { taille: 128, vivante: true, classe: 'chouette-guide' });
  const porte = (m) => {
    const r = rang(m.id); const gagnes = gainsDuJour(m.id);
    return h('button', { class: `porte porte-${m.id}`, 'data-matiere': m.id, onPointerdown: () => { guide.dataset.vers = m.id; }, onClick: () => ouvrirMatiere(m.id) },
      h('span', { class: 'porte-icone' }, icone(m.id === 'admin' ? 'palais' : 'balance', 34)),
      h('span', { class: 'porte-txt' },
        h('b', {}, m.nom),
        h('small', {}, m.id === 'oblig' ? `${m.institution}, équipe ${etat.equipe}` : m.institution),
        h('span', { class: 'porte-rang' }, r.nom),
        h('span', { class: 'jauge', 'aria-hidden': 'true' }, h('i', { style: `transform:scaleX(${r.part.toFixed(3)})` })),
        h('small', { class: 'porte-gain' }, gagnes >= PLAFOND_JOUR ? `Plafond atteint : ${monnaie(PLAFOND_JOUR)} aujourd’hui` : `${fmt(gagnes)} sur ${monnaie(PLAFOND_JOUR)} aujourd’hui`)));
  };
  montrer(
    h('header', { class: 'haut haut-general' },
      h('span', { class: 'haut-rang' },
        h('span', { class: 'haut-ligne' }, h('span', { class: 'haut-nom' }, g.nom), laurier(36)),
        h('span', { class: 'jauge', 'aria-hidden': 'true' }, h('i', { style: `transform:scaleX(${g.part.toFixed(3)})` }))),
      h('span', { class: 'haut-jetons' }, h('i', { class: 'jeton' }), fmt(etat.jetons))),
    h('section', { class: 'choix' },
      h('div', { class: 'choix-tete' }, h('h1', {}, 'Que révises-tu aujourd’hui ?'), guide),
      h('p', { class: 'page-sous' }, s.n ? `${pluriel(s.n, 'jour')} de série. Une séance dans l’une ou l’autre matière la garde.` : 'Termine une séance pour poser ton premier sceau.'),
      h('div', { class: 'portes' }, MATIERES.map(porte))));
}

function afficherOnglets(vis) {
  onglets.hidden = !vis;
  if (!vis) return;
  const defs = [['palais', 'Palais'], ['carte', 'Chambres'], ['arrets', 'Arrêts'], ['boutique', 'Boutique'], ['profil', 'Profil']];
  onglets.replaceChildren(...defs.map(([id, l]) => h('button', {
    class: `onglet ${ongletCourant === id ? 'actif' : ''}`, 'aria-current': ongletCourant === id ? 'page' : null,
    onClick: () => { son('tap'); aller(id); },
  }, icone(id, 23), h('span', {}, l))));
}

function aller(id, p) {
  ongletCourant = id === 'role' || id === 'examen' ? 'palais' : id;
  afficherOnglets(true);
  if (id === 'admin') ongletCourant = 'profil';
  if (id === 'amis') ongletCourant = 'palais';
  ({ palais: accueil, carte, arrets: collection, boutique, profil, role: ecranRole, examen: ecranExamen, admin: ecranAdmin, amis: ecranAmis }[id])(p);
}

// PALAIS -----------------------------------------------------------------------
function semaine() {
  const j = jour(); const lettres = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
  const cases = [];
  for (let d = j - 6; d <= j; d++) {
    const dow = new Date(d * 864e5).getUTCDay();
    const v = etat.jours[d];
    const classe = v === 1 ? 'tamponne' : v === 's' || v === 'f' ? 'sursis' : '';
    cases.push(petitSceau(`${classe} ${d === j ? 'aujourdhui' : ''}`, lettres[dow]));
  }
  return h('div', { class: 'semaine', 'aria-label': 'Sept derniers jours' }, cases);
}

// Le centre de l'accueil : la chouette, ou ton image si tu en as choisi une, et le sceau de la série.
function figureSerie(s, fait) {
  const etincelles = [1, 2, 3].map((i) => h('i', { class: `etincelle e${i}`, 'aria-hidden': 'true' }));
  const j = jour(); const c = etat.chouette;
  const reveil = c.reveil !== j && new Date().getHours() < 12;
  const retour = !reveil && c.seance !== null && j - c.seance >= 3 && c.retour !== j;
  if (reveil) c.reveil = j;
  if (retour) c.retour = j;
  if (reveil || retour) sauver();
  const skin = skinPorte();
  const anime = SKINS.find((x) => x.id === skin)?.anime;
  const bete = skin ? hibouSkin(skin, { classe: 'sur-accueil', danse: true })
    : chouette(retour ? 'serment' : 'debout', { taille: 236, vivante: true, classe: `sur-accueil ${reveil ? 'reveil' : ''}` });
  let enScene = bete;
  const reagirTape = () => {
    if (!effets()) return;
    c.tapes++;
    son('tap');
    const dixieme = c.tapes % 10 === 0;
    const pose = dixieme ? 'tribune' : 'clin';
    const geste = dixieme ? 'pirouette' : anime ? '' : 'saute';
    const copie = skin ? hibouSkin(skin, { classe: `sur-accueil ${geste}`, danse: true })
      : chouette(pose, { taille: 236, classe: `sur-accueil ${geste}` });
    enScene.replaceWith(copie); enScene = copie;
    if (dixieme) { plumes(24); son('deblocage'); }
    setTimeout(() => { if (enScene === copie) { copie.replaceWith(bete); enScene = bete; } }, anime ? DUREE_DANSE : dixieme ? 1500 : 800);
  };
  return h('div', { class: 'figure-chouette', onClick: reagirTape },
    h('span', { class: 'aura', 'aria-hidden': 'true' }), bete,
    retour ? h('p', { class: 'bulle bulle-accueil' }, 'Content de te revoir') : null,
    h('span', { class: 'mini-sceau' }, sceau(s.n, { taille: 62, lauriers: false, eteint: !fait && s.n === 0 })), etincelles);
}

function accueil() {
  const s = etat.serie; const j = jour();
  const fait = s.dernier === j;
  const zones = zonesOuvertes(ix);
  const dus = aRevoir(ix, zones).filter((id) => M().arrets[id]).length;
  const rompue = etat.rompue;
  const blocRupture = rompue ? h('div', { class: 'rupture' },
    h('p', {}, `Ta série de ${pluriel(rompue.n, 'jour')} est tombée. Un relevé de forclusion peut la rétablir jusqu’à demain soir.`),
    h('button', { class: 'bouton-or', disabled: etat.jetons < prixForclusion(), onClick: () => { if (relever()) { son('sceau'); vibrer(20); toast('Série rétablie.'); accueil(); } } },
      `Rétablir pour ${monnaie(prixForclusion())}`)) : null;

  // Sur iPhone, Safari et l'icône de l'écran d'accueil ont chacun leur stockage.
  const aInstaller = /iPhone|iPad|iPod/.test(navigator.userAgent) && !estInstallee()
    ? h('section', { class: 'installer' },
      h('h2', {}, 'Installe l’appli avant de jouer'),
      h('p', {}, 'Une séance faite dans Safari ne suivrait pas dans l’icône : ta série repartirait de zéro.'),
      guideInstallation())
    : null;

  const encours = M().enCours;
  montrer(
    barreHaut(),
    h('button', { class: 'bouton-matiere', onClick: () => { son('retour'); matieres(); } }, icone('matieres', 18), matiereDe(etat.matiere).nom, estOblig() ? `, équipe ${etat.equipe}` : null),
    aInstaller,
    h('section', { class: 'tribune', 'data-decor': etat.decor },
      figureSerie(s, fait),
      h('p', { class: 'serie-txt' }, s.n === 0 ? 'Aucune série en cours' : `${pluriel(s.n, 'jour')} de série`),
      h('p', { class: 'serie-sous' }, fait ? 'Séance du jour validée. Reviens demain.' : s.n ? 'Termine une séance aujourd’hui pour la garder.' : 'Termine une séance pour poser ton premier sceau.'),
      semaine(), blocRupture),
    h('div', { class: 'actions' },
      encours ? h('div', { class: 'reprise' },
        h('button', { class: 'bouton-or', onClick: () => lancer({ reprise: encours }) }, `Reprendre : ${encours.titre}, épreuve ${encours.i + 1} sur ${encours.rounds.length}`),
        h('button', { class: 'bouton-lien', onClick: () => { M().enCours = null; sauver(); accueil(); } }, 'Abandonner cette séance')) : null,
      h('button', { class: 'cta brille', onClick: lancerDefi }, 'Défi du jour'),
      h('p', { class: 'cta-sous' }, dus ? `5 épreuves, ${pluriel(dus, estOblig() ? 'fiche' : 'arrêt')} à revoir` : '5 épreuves, environ 5 minutes'),
      ),
    h('section', { class: 'role' },
      ligneEntree('vers-examen', 'balance', 'Vers l’examen', 'Trois niveaux, si tu veux te tester', () => aller('examen'), 0),
      ligneEntree('vers-role', 'plan', 'Le rôle', 'Choisis ton exercice', () => aller('role'), 2.2)),
  );
}

const ligneEntree = (mode, ic, nom, txt, action, d) => h('button', { class: 'role-ligne', 'data-mode': mode, style: `--d:${d}s`, onClick: action },
  h('span', { class: 'role-icone' }, icone(ic, 28)), h('span', { class: 'role-txt' }, h('b', {}, nom), h('small', {}, txt)));
const retourPalais = () => h('button', { class: 'bouton-matiere', onClick: () => { son('retour'); aller('palais'); } }, icone('retour', 18), 'Retour au Palais');

// Le rôle : la liste des exercices, à part du Palais.
function ecranRole() {
  const lignes = Object.entries(nomsModes()).map(([m, [nom, txt]], i) => ligneEntree(m, m, nom, txt, () => (m === 'plan' || m === 'architecte' ? choixGenre(m) : lancerMode(m)), i * 2.2));
  montrer(barreHaut(), retourPalais(), h('section', { class: 'role' }, h('h1', {}, 'Le rôle'),
    h('p', { class: 'page-sous' }, 'Choisis ton exercice.'),
    ligneEntree('express', 'prorogation', 'Trois minutes', 'Trois épreuves rapides', lancerExpress, 0),
    lignes, blocDunk()));
}

// Vers l'examen : un enchaînement facultatif, sans rappel ni compte à rebours.
const NIVEAUX_EXAMEN = [
  { nom: 'Niveau 1', txt: 'Trois épreuves pour se mettre en route', oblig: ['qualif', 'remede', 'frise'], admin: ['paires', 'puzzle', 'paires'] },
  { nom: 'Niveau 2', txt: 'Quatre épreuves sur les cas et les plans', oblig: ['cas', 'remede', 'cas', 'plan'], admin: ['puzzle', 'juge', 'plan', 'juge'] },
  { nom: 'Niveau 3', txt: 'Six épreuves pour te la mettre vraiment', oblig: ['cas', 'plan', 'cas', 'frise', 'cas', 'plan'], admin: ['juge', 'architecte', 'puzzle', 'plan', 'juge', 'architecte'] },
];
function lancerExamen(i) {
  const n = NIVEAUX_EXAMEN[i];
  const zones = estOblig() ? ix.zones.filter((z) => !z.travaux).map((z) => z.id) : zonesDuJour(ix);
  const dus = aRevoir(ix, zones); const deja = new Set();
  const types = estOblig() ? n.oblig : n.admin;
  lancer({ type: 'examen', long: i === 2, titre: `Vers l’examen, ${n.nom.toLowerCase()}`, rounds: types.map((t) => tirerRound(ix, t, zones, dus, Math.random, deja)) });
}
function ecranExamen() {
  montrer(barreHaut(), retourPalais(), h('section', { class: 'role' }, h('h1', {}, 'Vers l’examen'),
    h('p', { class: 'page-sous' }, 'Quand tu as envie de te tester. Plus le niveau monte, plus ça se corse.'),
    NIVEAUX_EXAMEN.map((n, i) => ligneEntree(`niveau-${i + 1}`, 'balance', n.nom, n.txt, () => lancerExamen(i), i * 2.2))));
}

// Le mini-jeu, à part des épreuves : il se débloque en boutique.
function blocDunk() {
  const d = etat.dunk;
  // Les obligations puisent dans tout le cours, chapitres en travaux compris.
  const jouer = (mode) => {
    const zones = estOblig() ? ix.zones.map((z) => z.id) : zonesOuvertes(ix);
    if (document.querySelector('.palais-portes')) return;
    const p = portes({ pose: POSE_MODE.dunk, titre: 'Dunk shot', sonFerme: () => son('porte') });
    p.pret.then(() => {
      afficherOnglets(false);
      lancerDunk({ ix, zones, dus: aRevoir(ix, zones).filter((id) => M().arrets[id]), mode, montrer, nom: estRose() ? 'Canettes' : 'Jetons', sortir: () => aller('palais') });
      p.ouvrir();
    });
  };
  const entete = h('span', { class: 'role-icone' }, icone('dunk', 28));
  return h('div', { class: 'role-ligne dunk-bloc', 'data-mode': 'dunk' },
    entete, h('span', { class: 'role-txt' }, h('b', {}, 'Dunk shot'), h('small', {}, d.record ? `Record : ${pluriel(d.record, 'panier')}` : 'Articles, arrêts, cours : un panier par bonne réponse'),
      h('span', { class: 'dunk-choix' },
        h('button', { class: 'bouton-fantome', onClick: () => jouer('cinq') }, '5 paniers'),
        d.infini ? h('button', { class: 'bouton-fantome', onClick: () => jouer('infini') }, 'Infini') : h('button', { class: 'bouton-fantome', onClick: () => aller('boutique') }, icone('cadenas', 16), 'Infini'))));
}

function lancerDefi() {
  const zones = zonesDuJour(ix);
  lancer({ type: 'defi', titre: 'Défi du jour', rounds: composerDefi(ix, zones, aRevoir(ix, zones)) });
}
function lancerExpress() {
  const zones = zonesDuJour(ix); const dus = aRevoir(ix, zones);
  const deja = new Set();
  const types = estOblig() ? ['qualif', 'remede', 'qualif'] : ['paires', 'puzzle', 'paires'];
  lancer({ type: 'express', titre: 'Trois minutes', rounds: types.map((t) => tirerRound(ix, t, zones, dus, Math.random, deja)) });
}
// Le bon plan et l'architecte : commentaire d'arrêt, dissertation ou au hasard.
const GENRES = [['C', 'Commentaire d’arrêt'], ['D', 'Dissertation'], [null, 'Au hasard']];
function choixGenre(m) {
  const voile = h('div', { class: 'voile', onClick: (e) => { if (e.target === voile) voile.remove(); } }, h('div', { class: 'boite boite-genre', role: 'dialog', 'aria-label': 'Type de sujet' },
    h('h2', {}, nomsModes()[m][0]), h('p', {}, 'Sur quel type de sujet ?'),
    h('div', { class: 'boite-actions' },
      GENRES.map(([g, nom]) => h('button', { class: g ? 'bouton-or' : 'bouton-fantome', 'data-genre': g || 'hasard', onClick: () => { voile.remove(); lancerMode(m, g); } }, nom)),
      h('button', { class: 'bouton-lien', onClick: () => voile.remove() }, 'Fermer'))));
  document.body.append(voile);
}
function lancerMode(m, genre = null) {
  // En obligations, un exercice choisi puise dans tout le cours : les chambres rythment le défi et les audiences.
  let zones = estOblig() ? ix.zones.filter((z) => !z.travaux).map((z) => z.id) : zonesDuJour(ix);
  let source = ix;
  if (genre) {
    // Un type choisi puise dans toutes les chambres ouvertes, pour toujours trouver un sujet.
    const ouvertes = estOblig() ? zones : zonesOuvertes(ix);
    const sujets = ix.sujets.filter((s) => s.type === genre && s.zones.some((z) => ouvertes.includes(z)));
    if (sujets.length) { source = { ...ix, sujets }; zones = ouvertes; }
  }
  const dus = aRevoir(ix, zones);
  const n = m === 'paires' || m === 'qualif' ? 3 : 2;
  const deja = new Set();
  const titre = nomsModes()[m][0] + (genre && source !== ix ? (genre === 'C' ? ', commentaire' : ', dissertation') : '');
  lancer({ type: 'mode', mode: m, titre, rounds: Array.from({ length: n }, () => tirerRound(source, m, zones, dus, Math.random, deja)) });
}

// SÉANCE ------------------------------------------------------------------------
function lancer({ rounds, titre, type, zone, reprise, mode, long = false, defiAmi = null }) {
  if (document.querySelector('.palais-portes')) return;
  const S = reprise
    ? { ...reprise, rounds: JSON.parse(JSON.stringify(reprise.rounds)), touches: new Map(reprise.touches), nettoyer: [] }
    : { rounds, titre, type, zone, long, defiAmi, i: 0, xp: 0, jetons: 0, combo: 0, comboMax: 0, vies: type === 'boss' ? 3 : null, scores: [], touches: new Map(), nettoyer: [], parfaites: 0 };
  ({ type, titre, zone } = S);
  // Copie intacte des épreuves : c'est elle qui sert à reprendre après une coupure.
  const copie = JSON.stringify(S.rounds);
  function memoriser() {
    const { nettoyer, ...reste } = S; void nettoyer;
    M().enCours = { ...reste, rounds: JSON.parse(copie), touches: [...S.touches] };
    sauver();
  }
  const pips = h('div', { class: 'pips', role: 'img' });
  const compteur = h('div', { class: 'combo', 'aria-live': 'polite' });
  const vies = h('div', { class: 'vies' });
  const scene = h('main', { class: 'scene' });
  const decor = h('div', { class: 'decor-seance', 'aria-hidden': 'true' });
  const quitter = h('button', { class: 'quitter', 'aria-label': 'Quitter la séance', onClick: () => demanderQuitter() }, icone('fermer', 22));
  const entete = h('header', { class: 'entete-seance' }, quitter, pips, S.vies !== null ? vies : compteur);

  function demanderQuitter() {
    const voile = h('div', { class: 'voile' }, h('div', { class: 'boite', role: 'dialog', 'aria-label': 'Quitter la séance' },
      h('p', {}, 'Quitter maintenant ? Cette séance ne comptera pas pour ta série.'),
      h('div', { class: 'boite-actions' },
        h('button', { class: 'bouton-lien sombre', onClick: () => voile.remove() }, 'Continuer la séance'),
        h('button', { class: 'bouton-or', onClick: () => { voile.remove(); S.nettoyer.forEach((f) => f()); M().enCours = null; sauver(); aller('palais'); } }, 'Quitter'))));
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
    combo(ok, muet = false) {
      S.combo = ok ? S.combo + 1 : 0;
      S.comboMax = Math.max(S.comboMax, S.combo);
      if (!muet) ctx.sonner(ok);
      majEntete();
    },
    // Le son suit la série : chaque bonne réponse de suite monte d'une note.
    sonner(ok) {
      if (S.combo === 5 || S.combo === 10) son('combo', { niveau: S.combo });
      else son(ok ? 'ok' : 'ko', { niveau: S.combo });
      vibrer(ok ? 10 : [14, 50, 14]);
      if (!ok && estRose()) bebew();
    },
    decor: (el) => decor.replaceChildren(el),
    aide() { S.aide = true; },
    get long() { return S.long; },
    noter(id, ok, conf) {
      const monte = noter(id, ok, conf, S.aide);
      if (monte) S.montees = (S.montees || 0) + 1;
      if (monte === 'prime') (S.primes ||= []).push(id);
      const t = S.touches.get(id) || { ok: 0, ko: 0 };
      t[ok ? 'ok' : 'ko']++; S.touches.set(id, t);
    },
    gain(xp) {
      const m = S.combo >= 10 ? 3 : S.combo >= 5 ? 2 : 1;
      S.xp += xp * m;
    },
    touche: () => false,
    nettoyage: (f) => S.nettoyer.push(f),
    async fin(res) {
      // Un double appui sur Continuer ne doit pas sauter une épreuve.
      if (finEnCours) return;
      finEnCours = true;
      S.nettoyer.forEach((f) => f()); S.nettoyer = [];
      S.scores.push(res.score); if (res.parfait) S.parfaites++;
      // Deux pièces pour une épreuve réussie, une pour une épreuve à moitié réussie.
      S.jetons += res.score >= 0.8 ? PIECES_EPREUVE : res.score >= 0.4 ? 1 : 0;
      if (S.vies !== null && res.score < 0.6) S.vies--;
      S.i++;
      const derniere = S.i >= S.rounds.length || S.vies === 0;
      // Mémorisé avant l'animation : une coupure pendant la réaction ne fait rien perdre.
      if (!derniere) memoriser();
      if (res.parfait) {
        majEntete();
        if (estRose()) { son('slay'); vibrer([20, 60, 20]); await slayDiva(effets() ? chouette('clin', { taille: 210 }) : null); } else { son('parfait'); retardEpreuve = 0.7; if (!derniere) await reagir(res.score); }
      } else if (!derniere) { son('valide'); retardEpreuve = 0.55; await reagir(res.score); }
      if (S.vies === 0) return finir(false);
      if (S.i >= S.rounds.length) return finir(true);
      suivant();
    },
  };

  function suivant() {
    majEntete();
    const r = S.rounds[S.i];
    // Le Juge a son propre lever de rideau : l'audience s'ouvre avec ses trois coups.
    if (r.type !== 'juge' && r.type !== 'cas') son(S.i === 0 ? 'lancement' : 'epreuve', { retard: retardEpreuve });
    retardEpreuve = 0; finEnCours = false; S.aide = false;
    scene.className = 'scene'; scene.replaceChildren(); decor.replaceChildren();
    window.scrollTo(0, 0);
    // Entre deux épreuves, un simple glissement, sans chouette.
    if (S.i > 0 && effets() && scene.animate) scene.animate([{ transform: 'translateX(26px)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 300, easing: 'cubic-bezier(.2,.7,.2,1)' });
    Promise.resolve(TOUS_JEUX[r.type](scene, ctx, r, ix)).catch((e) => {
      console.error(e);
      scene.replaceChildren(h('div', { class: 'erreur' }, h('p', {}, 'Cette épreuve n’a pas pu s’afficher. Passe à la suivante.'), continuer('Continuer', () => ctx.fin({ score: 0, parfait: false }))));
    });
  }

  let retardEpreuve = 0; let finEnCours = false;
  function finir(reussi) { M().enCours = null; resultats(S, reussi); }
  // Les portes ne jouent qu'en début de séance. Le chrono de la première épreuve part à leur ouverture.
  const juridiction = S.rounds[S.i].type === 'juge' || S.rounds[S.i].type === 'cas';
  const p = portes({ pose: POSE_MODE[reprise ? 'reprise' : mode || type] || 'debout', titre: juridiction ? 'L’audience est ouverte' : titre, sonFerme: () => son('porte') });
  p.pret.then(() => {
    afficherOnglets(false);
    montrer(decor, entete, scene);
    memoriser();
    suivant();
    p.ouvrir();
  });
}

function resultats(S, reussi) {
  setTimeout(envoyerProgression, 1500);
  const avant = rang(); const avantGeneral = rangGeneral();
  const moyenne = S.scores.reduce((a, b) => a + b, 0) / (S.scores.length || 1);
  etat.stats.seances++;
  etat.chouette.seance = jour();
  etat.stats.comboMax = Math.max(etat.stats.comboMax, S.comboMax);
  const parfaite = S.parfaites === S.rounds.length && reussi;
  if (parfaite) etat.stats.parfaites++;
  M().xp += S.xp; ajouterSemaine(S.xp);
  const pieces = crediter(S.jetons);
  const ligneAmi = suiteDefiAmi(S, moyenne);
  if (S.type === 'defi') annoncerDefiJour();

  let textBoss = null;
  if (S.type === 'boss') {
    if (reussi) {
      const zm = M().zones;
      const premier = !zm.gagnees.includes(S.zone);
      if (premier) {
        zm.gagnees.push(S.zone);
        ouvrirApres(ix, S.zone);
        etat.jetons += BONUS_AUDIENCE;
      }
      if (S.vies === 3 && !zm.parfaites.includes(S.zone)) zm.parfaites.push(S.zone);
      textBoss = premier ? `Audience gagnée. La chambre suivante s’ouvre, et ${monnaie(BONUS_AUDIENCE)} te reviennent.` : 'Audience gagnée une nouvelle fois.';
    } else textBoss = 'Audience perdue. Révise cette chambre, puis réessaie.';
  }
  const merite = S.type === 'boss' ? reussi : moyenne >= SCEAU_REUSSITE || (S.montees || 0) >= SCEAU_FICHES;
  const sceauManque = !merite && S.type !== 'boss' && etat.serie.dernier !== jour();
  const v = merite ? validerJour() : { nouveau: false, n: etat.serie.n };
  sauver();
  const apres = rang(); const apresGeneral = rangGeneral();
  const nouveaux = evaluerTrophees(ix);
  sauver();

  const aRevoirListe = [...S.touches.entries()].filter(([, t]) => t.ko > 0).map(([id]) => ix.parId.get(id));
  const zoneSceau = h('div', { class: 'tampon' });
  const pourcent = Math.round(moyenne * 100);
  const nouveauGrade = apres.i > avant.i || apresGeneral.i > avantGeneral.i;
  const audienceGagnee = S.type === 'boss' && reussi;
  const grandeVictoire = parfaite || audienceGagnee;
  const palier = v.nouveau && v.n > 0 && v.n % 7 === 0;
  // Une seule chouette, celle du moment le plus fort de la séance.
  const poseFin = nouveauGrade ? 'serment' : grandeVictoire ? 'tribune' : palier ? 'debout' : S.type === 'defi' && reussi ? 'tribune'
    : !reussi || moyenne < 0.4 ? 'pause' : moyenne < 0.8 ? 'piles' : 'clin';
  const figureFin = chouette(poseFin, { taille: 188, classe: `res-chouette ${nouveauGrade || grandeVictoire ? 'grande' : ''}`, vivante: true });
  const nombrePieces = h('dd', {}, `+${fmt(pieces)}`);

  const contenu = h('main', { class: 'resultats' },
    h('div', { class: 'res-scene' }, figureFin, zoneSceau),
    h('h1', {}, S.type === 'boss' ? (reussi ? 'Audience gagnée' : 'Audience perdue') : pourcent === 100 ? 'Sans faute' : pourcent >= 70 ? 'Bien jugé' : 'À réviser'),
    textBoss ? h('p', { class: 'res-texte' }, textBoss) : null,
    ligneAmi,
    h('dl', { class: 'res-chiffres' },
      h('div', {}, h('dt', {}, 'Réussite'), h('dd', {}, `${pourcent} %`)),
      h('div', {}, h('dt', {}, 'Expérience'), h('dd', {}, `+${fmt(S.xp)}`)),
      h('div', {}, h('dt', {}, estRose() ? 'Canettes' : 'Jetons'), nombrePieces)),
    S.primes?.length ? h('p', { class: 'res-coffre' }, `Dossier clos : ${S.primes.map((id) => { const a = ix.parId.get(id); return a.article ? a.nom : a.court; }).join(', ')}. Prime de maîtrise : ${monnaie(S.primes.length * PRIME_MAITRISE)}.`) : null,
    sceauManque ? h('p', { class: 'res-texte' }, `Sceau du jour non obtenu : il faut ${Math.round(SCEAU_REUSSITE * 100)} % de réussite ou ${SCEAU_FICHES} fiches reprises.`) : null,
    pieces < S.jetons ? h('p', { class: 'res-texte' }, `Plafond du jour atteint dans cette matière : ${monnaie(PLAFOND_JOUR)}.`) : null,
    v.coffre ? h('p', { class: 'res-coffre' }, `Coffre de série : ${v.etape ?? v.coffre.etape} jours tenus, ${monnaie(v.coffre.jetons)} et ${pluriel(v.coffre.sursis, 'sursis', 'sursis')}.`) : null,
    apres.i > avant.i ? h('div', { class: 'decret' }, h('p', {}, 'Par décret, tu es nommé'), h('strong', {}, apres.nom)) : null,
    apresGeneral.i > avantGeneral.i ? h('div', { class: 'decret' }, h('p', {}, 'Carrière générale, tu deviens'), h('strong', {}, apresGeneral.nom)) : null,
    nouveaux.length ? h('ul', { class: 'res-trophees' }, nouveaux.map((t) => h('li', {}, medaille(metalDe(t.id), true), h('span', {}, h('b', {}, t.nom), h('small', {}, t.txt))))) : null,
    aRevoirListe.length ? h('section', { class: 'res-revoir' }, h('h2', {}, 'À revoir'),
      h('ul', {}, aRevoirListe.slice(0, 6).map((a) => h('li', {}, h('button', { onClick: () => { afficherOnglets(true); ongletCourant = 'arrets'; fiche(a.id); } }, h('b', {}, a.court), a.an ? ` ${a.an}` : ` ${a.titre}`))))) : null,
    h('div', { class: 'pied' },
      continuer('Retour au Palais', () => aller('palais')),
      S.type === 'boss' && !reussi ? h('button', { class: 'bouton-lien', onClick: () => lancerBoss(S.zone) }, 'Retenter l’audience') : null),
  );
  montrer(contenu);
  if (effets()) {
    if (palier && !nouveauGrade && !grandeVictoire) figureFin.append(h('span', { class: 'chiffre-livre' }, String(v.n)));
    if (poseFin === 'tribune' && !images.mascotte) figureFin.append(codeEnvole());
    if (pieces > 0) {
      const t0 = performance.now();
      requestAnimationFrame(function compter(t) {
        const p = Math.min(1, (t - t0) / 800);
        nombrePieces.textContent = `+${fmt(Math.round(pieces * p))}`;
        if (p < 1) requestAnimationFrame(compter);
      });
    }
  }
  if (grandeVictoire) plumes();

  // Le moment fort : le sceau du jour s'abat sur le registre.
  if (v.nouveau) {
    const s = sceau(v.n, { taille: 132 });
    zoneSceau.append(s);
    s.classList.add('frappe');
    setTimeout(() => son('sceau'), 330);
    if (apres.i > avant.i || parfaite || v.coffre) setTimeout(() => { if (apres.i > avant.i || v.coffre) confettis(); son(v.coffre ? 'coffre' : 'grade'); }, 900);
  } else {
    zoneSceau.append(sceau(etat.serie.n, { taille: 96, lauriers: false, eteint: etat.serie.n === 0 }));
    if (apres.i > avant.i || parfaite) { if (apres.i > avant.i) confettis(); son('grade'); } else son(reussi ? 'valide' : 'ko');
  }
  if (S.type === 'boss' && reussi) setTimeout(() => son('deblocage'), 1300);
}

// CHAMBRES ------------------------------------------------------------------------
function progressionZone(z) {
  const liste = ix.cartes.filter((a) => a.zones.includes(z));
  const acquis = liste.filter((a) => niveau(a.id) >= 3).length;
  return { total: liste.length, acquis, part: acquis / liste.length };
}

// Le chemin du cours : les chambres alternent de part et d'autre d'un fil de lumière.
const LARGEUR = 390; const PAS = 164; const DEPART = 66; const PREMIER_ECART = 216;
const pointSalle = (i) => ({ x: i === 0 ? 195 : i % 2 ? 300 : 90, y: i === 0 ? DEPART : DEPART + PREMIER_ECART + (i - 1) * PAS });

function carte() {
  const ouvertes = zonesOuvertes(ix);
  const gagnees = M().zones.gagnees;
  const parcours = ix.zones.filter((z) => !z.bonus && !z.travaux);
  const enCours = (etat.reglages.toutOuvert ? parcours.find((z) => !gagnees.includes(z.id)) : [...parcours].reverse().find((z) => ouvertes.includes(z.id) && !gagnees.includes(z.id)))?.id;
  const n = ix.zones.length;
  const hauteur = pointSalle(n - 1).y + 110;
  let troncons = ''; let comete = '';
  for (let i = 0; i < n - 1; i++) {
    const a = pointSalle(i); const b = pointSalle(i + 1); const dy = b.y - a.y;
    const d = i === 0 ? `M${a.x} ${a.y}C${a.x + 165} ${a.y + 2},${b.x + 4} ${b.y - 118},${b.x} ${b.y}` : `M${a.x} ${a.y}C${a.x} ${a.y + dy * 0.62},${b.x} ${b.y - dy * 0.62},${b.x} ${b.y}`;
    const parcouru = ouvertes.includes(ix.zones[i + 1].id);
    troncons += `<path class="voie-halo ${parcouru ? '' : 'loin'}" d="${d}"/><path class="voie ${parcouru ? '' : 'loin'}" d="${d}"/>`;
    if (ix.zones[i + 1].id === enCours) comete = `<circle class="comete" r="3.500"><animateMotion dur="4.600s" repeatCount="indefinite" calcMode="spline" keySplines=".4 0 .6 1" keyTimes="0;1" path="${d}"/></circle>`;
  }
  const salles = ix.zones.map((z, i) => {
    const p = progressionZone(z.id); const pt = pointSalle(i);
    const ouvert = ouvertes.includes(z.id); const gagne = gagnees.includes(z.id);
    const cote = i === 0 ? 'dessous' : i % 2 ? 'gauche' : 'droite';
    const marque = !ouvert ? h('span', { class: 'salle-marque' }, icone('cadenas', 30))
      : z.travaux ? h('span', { class: 'salle-marque' }, icone('travaux', 30))
      : z.id === enCours ? h('span', { class: 'salle-marque' }, String(z.id))
        : h('span', { class: 'salle-marque' }, laurier(92), gagne ? icone('juste', 30) : h('span', {}, z.bonus ? '+' : String(z.id)));
    return h('li', { class: `salle ${cote} ${ouvert ? 'ouverte' : 'fermee'} ${gagne ? 'gagnee' : ''} ${z.id === enCours ? 'courante' : ''}`, style: `left:${(pt.x / LARGEUR) * 100}%;top:${pt.y}px` },
      h('button', { onClick: () => { son('tap'); if (ouvert) chambre(z.id); else chambreFermee(z); }, 'aria-label': `${z.titre}, ${p.acquis} arrêts acquis sur ${p.total}${ouvert ? '' : ', fermée'}` },
        marque,
        h('span', { class: 'salle-txt' }, h('b', {}, z.titre), z.travaux ? h('span', { class: 'salle-compte travaux' }, 'En travaux') : ouvert ? h('span', { class: 'salle-compte' }, `${p.acquis}/${p.total}`) : null)));
  });
  const plan = h('div', { class: 'parcours', style: `height:${hauteur}px` },
    h('div', { html: `<svg class="voies" viewBox="0 0 ${LARGEUR} ${hauteur}" preserveAspectRatio="none" aria-hidden="true">${troncons}${effets() ? comete : ''}</svg>` }),
    h('ol', {}, salles));
  montrer(barreHaut(), h('section', { class: 'page page-chambres' }, h('h1', {}, 'Les chambres'),
    h('p', { class: 'page-sous' }, estOblig() ? 'Progression dans l’ordre du cours' : 'Progression dans l’ordre juridictionnel'), plan));
}

function chambreFermee(z) {
  const voile = h('div', { class: 'voile', onClick: (e) => { if (e.target === voile) voile.remove(); } }, h('div', { class: 'boite' },
    h('p', {}, `« ${z.titre} » s’ouvre quand tu gagnes l’audience précédente.`),
    h('div', { class: 'boite-actions' },
      etat.inv.passe > 0 ? h('button', { class: 'bouton-or', onClick: () => { etat.inv.passe--; const n = ouvrirSuivante(ix); voile.remove(); son('deblocage'); plumes(12); toast(`Chambre ${n} ouverte.`); carte(); } }, `Utiliser un passe-droit (${etat.inv.passe})`)
        : h('button', { class: 'bouton-or', onClick: () => { voile.remove(); aller('boutique'); } }, 'Voir la boutique'),
      h('button', { class: 'bouton-lien', onClick: () => voile.remove() }, 'Fermer'))));
  document.body.append(voile);
}

function lancerBoss(z) { lancer({ type: 'boss', titre: 'Audience solennelle', zone: z, rounds: composerBoss(ix, z) }); }
function reviserZone(z) {
  const dus = aRevoir(ix, [z]);
  const deja = new Set();
  const base = estOblig() ? 'qualif' : 'paires';
  const types = melange(estOblig() ? ['cas', 'remede', 'frise'] : ['puzzle', 'juge', 'plan'], Math.random);
  lancer({ type: 'zone', titre: 'Révision', zone: z, rounds: [base, types[0], base].map((t) => tirerRound(ix, t, [z], dus, Math.random, deja)) });
}

// Arrêts par date, articles par numéro.
const ordreFiches = (a, b) => (a.article && b.article ? parseFloat(a.num.replace('-', '.')) - parseFloat(b.num.replace('-', '.')) : a.article ? 1 : b.article ? -1 : a.an - b.an);
const ICONES_NIVEAU = [null, 'note', 'crayon', 'plume', 'balance', 'laurier'];
const niveauTag = (b) => h('span', { class: 'niveau', 'aria-label': TITRES_CARTE[b] }, TITRES_CARTE[b]);
const carteArret = (a) => {
  const b = niveau(a.id);
  return h('li', {}, h('button', { class: `carte-arret n${b}`, onClick: () => fiche(a.id) },
    h('span', { class: 'carte-an' }, a.article ? (a.etiquette || a.num.replace(/^1242-/, '1242 al. ')) : a.an), h('i', { class: 'losange', 'aria-hidden': 'true' }), h('b', {}, a.article ? a.titre : a.court),
    h('span', { class: 'carte-bas' }, niveauTag(b), ICONES_NIVEAU[b] ? icone(ICONES_NIVEAU[b], 20) : null)));
};

function chambre(zid) {
  const z = ix.zones.find((x) => x.id === zid);
  const p = progressionZone(zid);
  const liste = ix.cartes.filter((a) => a.zones.includes(zid)).sort(ordreFiches);
  montrer(
    h('header', { class: 'haut-simple' }, h('button', { class: 'quitter', 'aria-label': 'Retour', onClick: () => aller('carte') }, icone('retour', 22)), h('span', {}, `${p.acquis} acquis sur ${p.total}`)),
    h('section', { class: 'page' }, h('h1', {}, z.titre), h('p', { class: 'page-sous' }, z.lieu),
      z.travaux ? h('p', { class: 'avis-travaux' }, icone('travaux', 20), liste.length ? 'En travaux : ce chapitre n’est pas encore arrivé au cours. Les exercices restent généraux, tirés du Code civil et des grands arrêts.' : 'En travaux : ce chapitre n’est pas encore arrivé au cours. Ses fiches et ses exercices arriveront avec lui.') : null,
      h('div', { class: 'actions gauche' },
        liste.length ? h('button', { class: 'cta', onClick: () => reviserZone(zid) }, 'Réviser cette chambre') : null,
        !z.bonus && !z.travaux ? h('button', { class: 'bouton-lien', onClick: () => lancerBoss(zid) }, M().zones.gagnees.includes(zid) ? 'Rejouer l’audience solennelle' : 'Audience solennelle : 6 épreuves, 3 vies, sans joker') : null),
      h('ul', { class: 'grille-cartes' }, liste.map(carteArret))));
}

// ARRÊTS ----------------------------------------------------------------------------
let filtre = { texte: '', zone: 0, type: 'arrets' };
function collection() {
  const articles = estOblig() && filtre.type === 'articles';
  const champ = h('input', { type: 'search', class: 'recherche', placeholder: articles ? 'Chercher un article ou un mot' : 'Chercher un arrêt ou une année', value: filtre.texte, 'aria-label': 'Chercher', onInput: (e) => { filtre.texte = e.target.value; rendre(); } });
  const zonesBtns = [{ id: 0, titre: 'Tous' }, ...ix.zones].map((z) => h('button', { class: `filtre ${filtre.zone === z.id ? 'actif' : ''}`, onClick: () => { son('tap'); filtre.zone = z.id; collection(); } }, z.id ? `${z.bonus ? 'Bonus' : z.id}` : 'Tous'));
  const grille = h('ul', { class: 'grille-cartes' });
  const norm = (s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  function rendre() {
    const q = norm(filtre.texte);
    const source = articles ? ix.articles : ix.arrets;
    const res = source.filter((a) => (!filtre.zone || a.zones.includes(filtre.zone)) && (!q || norm(`${a.nom} ${a.an ?? ''} ${a.titre ?? ''} ${Object.values(a.ap).join(' ')}`).includes(q))).sort(ordreFiches);
    grille.replaceChildren(...(res.length ? res.map(carteArret) : [h('li', { class: 'vide' }, chouette('echelle', { taille: 150 }), h('p', {}, 'Rien ne correspond à cette recherche.'))]));
  }
  const fiches = M().arrets;
  const acquis = ix.arrets.filter((a) => fiches[a.id]?.b >= 5).length;
  const acquisArticles = ix.articles.filter((a) => fiches[a.id]?.b >= 3).length;
  const bascule = estOblig() ? h('div', { class: 'bascule', role: 'tablist' }, [['arrets', 'Arrêts'], ['articles', 'Articles']].map(([id, l]) => h('button', {
    class: filtre.type === id ? 'actif' : '', role: 'tab', 'aria-selected': filtre.type === id ? 'true' : 'false', onClick: () => { son('tap'); filtre.type = id; collection(); },
  }, l))) : null;
  montrer(barreHaut(), h('section', { class: 'page' }, h('h1', {}, articles ? 'Les articles' : 'Les arrêts'),
    h('p', { class: 'page-sous' }, articles ? `${fmt(acquisArticles)} sur ${ix.articles.length} au niveau Conclusions. Chaque carte monte quand tu réussis.` : `${pluriel(acquis, 'grand arrêt')} sur ${ix.arrets.length}. Chaque carte monte de niveau quand tu réussis.`),
    bascule, h('label', { class: 'cherche' }, icone('loupe', 22), champ), h('div', { class: 'filtres' }, zonesBtns), grille));
  rendre();
}

function fiche(id) {
  const a = ix.parId.get(id); const st = M().arrets[id];
  if (a.article) { ficheArticle(a); return; }
  const conf = st ? Object.entries(st.c).sort((x, y) => y[1] - x[1]).slice(0, 3) : [];
  const champs = (a.nf ? [['Ce qu’il faut retenir', a.s], ['Portée', a.po]] : [['Faits', a.f], ['Procédure', a.pr], ['Problème de droit', a.q], ['Solution', a.s], ['Portée', a.po]]).filter(([, t]) => t);
  const jum = jumeaux(ix, id);
  montrer(
    h('header', { class: 'haut-simple' }, h('button', { class: 'quitter', 'aria-label': 'Retour', onClick: () => aller(ongletCourant) }, icone('retour', 22)), niveauTag(niveau(id))),
    h('article', { class: 'fiche' },
      h('div', { class: 'revelation-tete' }, h('span', { class: 'annee' }, a.an), h('div', {}, h('h1', {}, a.court), h('p', { class: 'ref' }, a.ref))),
      Object.entries(a.ap).map(([, t]) => h('p', { class: 'apport' }, t)).filter((_, i, l) => l.findIndex((x) => x.textContent === _.textContent) === i),
      a.h ? [h('h2', {}, 'Son histoire'), h('p', { class: 'histoire' }, a.h)] : null,
      a.nf ? h('p', { class: 'note-nf' }, 'Faits de l’espèce non vérifiés : cette fiche s’en tient à la règle du cours.') : null,
      h('h2', {}, 'La fiche'),
      champs.map(([l, t]) => h('div', { class: 'rubrique' }, h('h3', {}, l), h('p', {}, t))),
      conf.length ? h('div', { class: 'confusions' }, h('h2', {}, 'Tu le confonds avec'), h('ul', {}, conf.map(([c, n]) => h('li', {}, h('button', { onClick: () => fiche(c) }, ix.parId.get(c).court), ` ${n} fois`)))) : null,
      boutonSignaler(id, `${a.court}, ${a.an}`),
      jum.length ? h('div', { class: 'jumeaux' }, h('h2', {}, 'Ses faux jumeaux'), h('ul', {}, jum.map((j) => h('li', {}, h('button', { onClick: () => fiche(j.id) }, `${ix.parId.get(j.id).court}, ${ix.parId.get(j.id).an}`), ' ', j.k)))) : null,
    ));
}

function ficheArticle(a) {
  const z = ix.zones.find((x) => x.id === a.zones[0]);
  montrer(
    h('header', { class: 'haut-simple' }, h('button', { class: 'quitter', 'aria-label': 'Retour', onClick: () => aller(ongletCourant) }, icone('retour', 22)), niveauTag(niveau(a.id))),
    h('article', { class: 'fiche' },
      h('div', { class: 'revelation-tete' }, h('div', {}, h('h1', {}, a.nom), h('p', { class: 'ref' }, a.titre))),
      h('p', { class: 'apport' }, a.regle),
      h('p', { class: 'aide-claire' }, `Chambre : ${z.titre}. Texte reformulé pour réviser : pour la lettre exacte, reporte-toi au Code civil.`),
      boutonSignaler(a.id, a.nom)));
}

// Signaler une erreur : la remarque reste sur le téléphone, avec la référence de la fiche.
const boutonSignaler = (id, nom) => h('button', { class: 'bouton-lien signaler', onClick: () => signaler(id, nom) }, 'Signaler une erreur');
function signaler(id, nom) {
  const champ = h('textarea', { class: 'code', rows: 4, placeholder: 'Qu’est-ce qui ne va pas ?', 'aria-label': 'Ta remarque' });
  const voile = h('div', { class: 'voile', onClick: (e) => { if (e.target === voile) voile.remove(); } },
    h('div', { class: 'boite', role: 'dialog', 'aria-label': `Signaler une erreur sur ${nom}` },
      h('h2', {}, 'Signaler une erreur'), h('p', {}, nom), champ,
      h('div', { class: 'boite-actions' },
        h('button', { class: 'bouton-or', onClick: () => {
          const txt = champ.value.trim();
          if (!txt) return toast('Écris ta remarque.');
          etat.signalements.push({ id, nom, txt, le: new Date().toISOString().slice(0, 10), equipe: etat.equipe, matiere: etat.matiere });
          sauver(); voile.remove();
          envoyerSignalements().then((n) => toast(n ? 'Signalement envoyé. Merci.' : 'Signalement gardé : il partira à la prochaine connexion.'));
        } }, 'Envoyer'),
        h('button', { class: 'bouton-lien', onClick: () => voile.remove() }, 'Annuler'))));
  document.body.append(voile);
  champ.focus();
}
const texteSignalements = () => etat.signalements.map((s) => `${s.le} | ${s.nom} (${s.id}) | équipe ${s.equipe} : ${s.txt}`).join('\n');
function blocSignalements() {
  if (!etat.signalements.length) return null;
  return [h('h2', {}, 'Mes signalements'),
    h('ul', { class: 'articles' }, etat.signalements.map((s) => h('li', { class: 'article' }, h('div', {}, h('b', {}, s.nom), h('p', {}, s.txt), h('small', {}, s.le))))),
    h('button', { class: 'bouton-or', onClick: async () => { try { await navigator.clipboard.writeText(texteSignalements()); toast('Liste copiée.'); } catch { toast('Copie impossible.'); } } }, 'Copier la liste'),
    h('button', { class: 'bouton-lien', onClick: () => { etat.signalements = []; sauver(); aller('profil'); } }, 'Vider la liste')];
}

// BOUTIQUE ---------------------------------------------------------------------------
function acheter(item) {
  if (etat.jetons < item.prix) return toast(`Pas assez de ${estRose() ? 'canettes' : 'jetons'}.`);
  if (item.max && etat.inv[item.id] >= item.max) return toast(`${item.max} au maximum.`);
  etat.jetons -= item.prix; etat.inv[item.id] = (etat.inv[item.id] || 0) + 1;
  sauver(); son('jeton'); vibrer(10); adjuge(); boutique();
}
const boutonPrix = (prix, action, label) => h('button', { class: 'prix', disabled: etat.jetons < prix, onClick: action, 'aria-label': label }, h('i', { class: 'jeton' }), prix);

function miniJeux() {
  const d = etat.dunk;
  const achat = (cle) => () => { etat.jetons -= PRIX_DUNK[cle]; d[cle] = true; sauver(); son('deblocage'); vibrer(12); adjuge(); boutique(); };
  const ligne = (cle, nom, txt, bloque) => h('li', { class: 'article' },
    h('div', {}, h('b', {}, nom), h('p', {}, txt)),
    d[cle] ? h('button', { class: 'prix actif', disabled: true }, 'Débloqué')
      : bloque ? h('button', { class: 'prix', disabled: true }, icone('cadenas', 16))
        : boutonPrix(PRIX_DUNK[cle], achat(cle), `Débloquer ${nom} pour ${monnaie(PRIX_DUNK[cle])}`));
  return [ligne('infini', 'Dunk shot infini', 'La partie continue jusqu’à ta première erreur, de plus en plus vite.', false)];
}

// La garde-robe : un seul accessoire par place, et l'aperçu montre la chouette telle qu'elle sera.
function gardeRobe() {
  const c = etat.chouette;
  const ligne = (t) => {
    const a = c.tenues.includes(t.id); const portee = c.porte[t.place] === t.id;
    const reafficher = () => { const y = window.scrollY; boutique(); window.scrollTo(0, y); };
    const changer = () => { c.porte[t.place] = portee ? null : t.id; sauver(); son('tap'); vibrer(8); reafficher(); };
    return h('li', { class: 'article', 'data-tenue': t.id },
      h('div', {}, h('b', {}, t.nom), h('p', {}, t.txt)),
      a ? h('button', { class: `prix ${portee ? 'actif' : ''}`, onClick: changer }, portee ? 'Retirer' : 'Porter')
        : boutonPrix(t.prix, () => { etat.jetons -= t.prix; c.tenues.push(t.id); c.porte[t.place] = t.id; sauver(); son('jeton'); vibrer(10); adjuge(); reafficher(); }, `Acheter ${t.nom} pour ${monnaie(t.prix)}`));
  };
  return [
    h('div', { class: 'essayage' }, h('span', { class: 'aura', 'aria-hidden': 'true' }), chouette('debout', { taille: 230, vivante: true })),
    images.mascotte ? h('p', { class: 'aide-claire' }, 'Ton image personnelle remplace Lexou : retire-la dans Profil pour voir ses tenues.') : null,
    skinPorte() ? h('p', { class: 'aide-claire' }, 'Tu portes un skin : retire-le pour retrouver ces tenues au Palais.') : null,
    h('ul', { class: 'articles' }, TENUES.map(ligne)),
  ];
}

// L'aperçu d'un skin : on le voit en grand avant de l'acheter.
function apercuSkin(s, reafficher) {
  const c = etat.chouette;
  const boite = h('div', { class: 'boite boite-skin', role: 'dialog', 'aria-label': `Aperçu : ${s.nom}` });
  const voile = h('div', { class: 'voile', onClick: (e) => { if (e.target === voile) fermer(); } }, boite);
  const fermer = () => { voile.remove(); reafficher(); };
  const acheter = () => { etat.jetons -= s.prix; c.skins.push(s.id); c.skin = s.id; sauver(); son('jeton'); vibrer(10); adjuge(); dessiner(true); };
  const porter = (id) => () => { c.skin = id; sauver(); son('tap'); vibrer(8); dessiner(true); };
  function action() {
    if (c.skin === s.id) return h('button', { class: 'bouton-or', onClick: porter(null) }, 'Retirer');
    if (c.skins.includes(s.id)) return h('button', { class: 'bouton-or', onClick: porter(s.id) }, 'Équiper');
    const manque = s.prix - etat.jetons;
    if (manque > 0) return h('button', { class: 'bouton-or', disabled: true }, `Il te manque ${monnaie(manque)}`);
    return h('button', { class: 'bouton-or', onClick: acheter }, `Acheter pour ${monnaie(s.prix)}`);
  }
  function dessiner(danse) {
    boite.replaceChildren(...[
      h('div', { class: `skin-scene ${s.legendaire ? 'legendaire' : ''}` }, h('span', { class: 'aura', 'aria-hidden': 'true' }), hibouSkin(s.id, { taille: 250, danse })),
      h('h2', {}, s.nom),
      h('small', { class: 'skin-rarete' }, s.legendaire ? 'Légendaire, animé' : 'Classique'),
      h('p', {}, s.txt),
      images.mascotte ? h('p', { class: 'aide-claire' }, 'Ton image personnelle passe avant : retire-la dans Profil pour voir ce skin au Palais.') : null,
      h('div', { class: 'boite-actions' }, action(), h('button', { class: 'bouton-lien', onClick: fermer }, 'Fermer')),
    ].filter(Boolean));
  }
  dessiner(true);
  document.body.append(voile);
}

function skinsDuHibou() {
  const c = etat.chouette;
  const reafficher = () => { const y = window.scrollY; boutique(); window.scrollTo(0, y); };
  const carte = (s) => {
    const achete = c.skins.includes(s.id);
    return h('li', { class: s.legendaire ? 'legendaire' : '' },
      h('button', { class: 'skin-carte', 'data-skin-carte': s.id, 'aria-label': `Voir ${s.nom}`, onClick: () => { son('tap'); apercuSkin(s, reafficher); } },
        hibouSkin(s.id, { taille: s.legendaire ? 148 : 132 }),
        h('span', { class: 'skin-texte' },
          s.legendaire ? h('small', { class: 'skin-rarete' }, 'Légendaire') : null,
          h('b', {}, s.nom),
          c.skin === s.id ? h('small', { class: 'skin-etat' }, 'Porté')
            : achete ? h('small', { class: 'skin-etat' }, 'Acheté')
              : h('span', { class: 'skin-prix' }, h('i', { class: 'jeton' }), s.prix))));
  };
  return [
    h('p', { class: 'aide-claire' }, 'Un skin remplace Lexou au Palais. Appuie pour le voir en grand.'),
    h('ul', { class: 'skins' }, SKINS.map(carte)),
  ];
}

function boutique() {
  const objets = BOUTIQUE.filter((b) => !b.admin || !estOblig()).map((b) => h('li', { class: 'article' },
    h('div', {}, h('b', {}, b.nom), h('p', {}, b.txt), h('small', {}, `En stock : ${etat.inv[b.id] || 0}`)),
    boutonPrix(b.prix, () => acheter(b), `Acheter ${b.nom} pour ${monnaie(b.prix)}`)));
  const themes = THEMES.map((t) => {
    const a = etat.themes.includes(t.id); const actif = etat.theme === t.id;
    const porter = () => { etat.theme = t.id; appliquerTheme(); sauver(); son('deblocage'); vibrer(12); aller('boutique'); };
    return h('li', { class: `article tenue theme-${t.id}` },
      h('span', { class: `apercu apercu-${t.id}`, 'aria-hidden': 'true' }),
      h('div', {}, h('b', {}, t.nom), h('p', {}, t.txt)),
      a ? h('button', { class: `prix ${actif ? 'actif' : ''}`, disabled: actif, onClick: porter }, actif ? 'Portée' : 'Porter')
        : boutonPrix(t.prix, () => { etat.jetons -= t.prix; etat.themes.push(t.id); porter(); }, `Acheter la tenue ${t.nom} pour ${monnaie(t.prix)}`));
  });
  const collectionObjets = (liste, cle, cleListe, visuel) => liste.map((t) => {
    const a = etat[cleListe].includes(t.id); const actif = etat[cle] === t.id;
    return h('li', { class: 'article' }, visuel(t), h('div', {}, h('b', {}, t.nom), h('p', {}, t.txt)),
      a ? h('button', { class: `prix ${actif ? 'actif' : ''}`, disabled: actif, onClick: () => { etat[cle] = t.id; sauver(); son('tap'); boutique(); } }, actif ? 'Choisi' : 'Choisir')
        : boutonPrix(t.prix, () => { etat.jetons -= t.prix; etat[cleListe].push(t.id); etat[cle] = t.id; sauver(); son('jeton'); adjuge(); boutique(); }, `Acheter ${t.nom} pour ${monnaie(t.prix)}`));
  });
  const insignes = collectionObjets(INSIGNES, 'insigne', 'insignes', (t) => (t.id === 'aucun' ? h('span', { class: 'pastille vide-p' }) : icone(t.id, 26)));
  const decors = collectionObjets(DECORS, 'decor', 'decors', (t) => h('span', { class: `pastille decor-${t.id}` }));
  montrer(barreHaut(), h('section', { class: 'page' }, h('h1', {}, 'La boutique'),
    h('p', { class: 'page-sous' }, estRose() ? 'Tes canettes de Ratio se gagnent en finissant des épreuves.' : 'Tes jetons de présence se gagnent en finissant des épreuves.'),
    h('h2', {}, 'Skins de Lexou'), skinsDuHibou(),
    h('h2', {}, 'Garde-robe de Lexou'), gardeRobe(),
    h('h2', {}, 'Couleurs de l’appli'), h('ul', { class: 'articles' }, themes),
    h('h2', {}, 'Décors du Palais'), h('ul', { class: 'articles' }, decors),
    h('h2', {}, 'Insignes'), h('ul', { class: 'articles' }, insignes),
    h('h2', {}, 'Mini-jeux'), h('ul', { class: 'articles' }, miniJeux()),
    h('h2', {}, 'Aides'), h('ul', { class: 'articles' }, objets)));
}

// PROFIL -----------------------------------------------------------------------------
const metalDe = (id) => {
  if (['bossTous', 'vp', 'pp', 'doyen', 'grand50', 'serie100'].includes(id)) return 'or';
  if (['bossParfait', 'jumeaux', 'grand10', 'serie30', 'boss1', 'cas10', 'dunk25'].includes(id)) return 'cire';
  if (['sansfaute', 'combo10', 'serie7', 'carte10', 'frise5', 'art30', 'dunk5'].includes(id)) return 'cuivre';
  return 'argent';
};

function montrerTrophee(t, gagne) {
  son('tap');
  const voile = h('div', { class: 'voile', onClick: (e) => { if (e.target === voile) voile.remove(); } }, h('div', { class: 'boite boite-trophee' },
    medaille(metalDe(t.id), gagne), h('h3', {}, t.nom), h('p', {}, gagne ? `Gagné : ${t.txt.toLowerCase()}.` : `À gagner : ${t.txt.toLowerCase()}.`),
    h('div', { class: 'boite-actions' }, h('button', { class: 'bouton-lien', onClick: () => voile.remove() }, 'Fermer'))));
  document.body.append(voile);
}

const BONUS_AUDIENCE = 15;
const interrupteur = (label, cle, apres) => h('label', { class: 'reglage' }, h('span', {}, label),
  h('input', { type: 'checkbox', role: 'switch', checked: etat.reglages[cle], onChange: (e) => { etat.reglages[cle] = e.target.checked; sauver(); son('tap'); apres?.(); } }));

// Images personnelles : elles remplacent la chouette et la canette, sur ce téléphone seulement.
function blocImages() {
  const ligne = (type, nom, aide, visuel) => {
    const entree = h('input', { type: 'file', accept: 'image/*', class: 'cache-fichier', 'aria-label': `Choisir ${nom}`, onChange: async (e) => {
      const f = e.target.files?.[0]; if (!f) return;
      try { await enregistrerImage(type, await preparerImage(f, type)); appliquerTheme(); son('deblocage'); toast('Image enregistrée sur ce téléphone.'); profil(); } catch (err) { toast(err.message); }
    } });
    return h('div', { class: 'ligne-image', 'data-type': type },
      h('span', { class: 'image-apercu' }, images[type] ? h('img', { src: images[type], alt: '' }) : visuel()),
      h('div', {}, h('b', {}, nom), h('small', {}, aide)),
      h('div', { class: 'image-actions' },
        h('button', { class: 'bouton-fantome', onClick: () => entree.click() }, icone('image', 18), 'Choisir'),
        images[type] ? h('button', { class: 'bouton-lien', onClick: async () => { await retirerImage(type); appliquerTheme(); profil(); } }, 'Retirer') : null),
      entree);
  };
  return h('div', { class: 'images-perso' },
    h('p', { class: 'aide-claire' }, 'Ces images restent sur ce téléphone. Elles ne sont ni publiées ni copiées en ligne.'),
    ligne('mascotte', 'Mascotte', 'Remplace Lexou dans toute l’appli', () => chouette('debout', { taille: 56, tenue: false })),
    etat.themes.includes('rose') ? ligne('jeton', 'Jetons', 'Remplace la canette partout', () => h('img', { src: 'img/canette.svg', alt: '' })) : null);
}

let carriereVue = null;
function profil() {
  const vue = carriereVue || etat.matiere;
  const r = rang(vue); const g = rangGeneral(); const vals = Object.values(M(vue).arrets);
  const stats = [['Séances', etat.stats.seances], ['Record de série', etat.serie.record], ['Sans faute', etat.stats.parfaites], ['Grands arrêts', vals.filter((a) => a.b >= 5).length], ['Meilleur enchaînement', etat.stats.comboMax], [vue === 'oblig' ? 'Fiches vues' : 'Arrêts vus', vals.length], ...(etat.dunk.cinq ? [['Record Dunk shot', etat.dunk.record]] : [])];
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
      if (e === 'actif') liste.push(h('p', {}, 'Rappel activé sur ce téléphone, chaque jour vers 9 h.'), h('button', { class: 'bouton-lien', onClick: async () => { await testerNotification(); toast('Notification envoyée.'); } }, 'Tester sur ce téléphone'));
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
    if (e === 'actif') liste.push(h('button', { class: 'bouton-lien', onClick: async () => { await testerNotification(); toast('Notification envoyée.'); } }, 'Tester sur ce téléphone'));
    blocRappel.replaceChildren(...liste);
  }
  const champSauvegarde = h('textarea', { class: 'code', rows: 3, placeholder: 'Colle ici un code de sauvegarde', 'aria-label': 'Code de sauvegarde' });
  const pct = Math.round(r.part * 100);
  montrer(barreHaut(), h('section', { class: 'page page-profil' },
    h('div', { class: 'profil-tete' }, chouette('assise', { taille: 150, vivante: true })),
    h('h1', {}, r.nom),
    h('div', { class: 'xp', role: 'img', 'aria-label': `${pct} % du grade suivant` }, h('span', {}, 'XP'), h('span', { class: 'xp-rail' }, h('i', { style: `width:${Math.max(pct, 3)}%` }))),
    h('p', { class: 'page-sous xp-txt' }, r.suivant ? `${fmt(r.xp)} points. Encore ${fmt(r.suivant.xp - r.xp)} pour devenir ${r.suivant.nom}.` : 'Dernier grade atteint.'),
    h('div', { class: 'bascule' }, MATIERES.map((m) => h('button', { class: vue === m.id ? 'actif' : '', onClick: () => { son('tap'); carriereVue = m.id; profil(); } }, m.institution))),
    h('ol', { class: 'carriere' }, matiereDe(vue).rangs.map((x, i) => h('li', { class: `${i <= r.i ? 'atteint' : ''} ${i === r.i ? 'actuel' : ''}`, style: `--i:${i}` }, x.nom))),
    h('div', { class: 'general' },
      h('p', {}, 'Carrière générale'), h('strong', {}, g.nom),
      h('span', { class: 'jauge', 'aria-hidden': 'true' }, h('i', { style: `transform:scaleX(${g.part.toFixed(3)})` })),
      h('small', {}, g.suivant ? `${fmt(g.xp)} points cumulés. Encore ${fmt(g.suivant.xp - g.xp)} pour devenir ${g.suivant.nom}.` : `${RANGS_GENERAL.at(-1).nom} : dernier titre atteint.`)),
    h('dl', { class: 'stats' }, stats.map(([l, v]) => h('div', {}, h('dt', {}, l), h('dd', {}, fmt(v))))),
    h('h2', {}, 'Trophées'),
    h('ul', { class: 'trophees' }, TROPHEES.map((t) => { const g = !!etat.trophees[t.id]; return h('li', {}, h('button', { 'aria-label': `${t.nom}, ${g ? 'gagné' : 'à gagner'}`, onClick: () => montrerTrophee(t, g) }, medaille(metalDe(t.id), g))); })),
    h('h2', {}, 'Rappel quotidien'), blocRappel,
    h('h2', {}, 'Images personnelles'), blocImages(),
    h('h2', {}, 'Équipe de droit des obligations'),
    h('div', { class: 'bascule' }, [1, 2].map((n) => h('button', { class: etat.equipe === n ? 'actif' : '', 'aria-pressed': etat.equipe === n ? 'true' : 'false', onClick: () => { if (etat.equipe === n) return; son('tap'); rejoindreEquipe(n); toast(`Équipe ${n} : tes chambres et tes exercices sont prêts.`); profil(); } }, `Équipe ${n}`))),
    h('p', { class: 'aide-claire' }, 'Le droit des obligations suit le cours de ton équipe. Tes pièces, ta série, tes tenues et les fiches communes te suivent.'),
    h('h2', {}, 'Réglages'),
    h('div', { class: 'reglages' },
      interrupteur('Sons', 'son'),
      interrupteur('Sons même en mode silencieux', 'sonSilencieux', appliquerSession),
      interrupteur('Effets visuels', 'effets', appliquerTheme),
      interrupteur('Retour tactile', 'vibration', () => vibrer(16)),
      interrupteur('Ouvrir toutes les chambres', 'toutOuvert')),
    h('button', { class: 'bouton-fantome ecouter', onClick: () => son('grade') }, icone('son', 18), 'Écouter la signature sonore'),
    blocSignalements(),
    h('h2', {}, 'Sauvegarde'),
    connecte() ? blocCompte() : null,
    h('p', { class: 'aide-claire' }, connecte() ? 'Copie manuelle, en plus de celle de ton compte.' : 'Ta progression reste sur ce téléphone. Garde une copie de ce code avant de changer d’appareil ou de supprimer l’appli.'),
    h('button', { class: 'bouton-or', onClick: async () => { const c = exporter(); try { await navigator.clipboard.writeText(c); toast('Sauvegarde copiée.'); } catch { champSauvegarde.value = c; toast('Copie le code affiché.'); } } }, 'Copier ma sauvegarde'),
    champSauvegarde,
    h('button', { class: 'bouton-lien', onClick: () => { try { importer(champSauvegarde.value); apresRestauration(); toast('Progression restaurée.'); aller('palais'); } catch { toast('Ce code de sauvegarde est illisible.'); } } }, 'Restaurer ce code'),
    h('p', { class: 'version' }, `Contenu du ${ix.version}`)));
  rendreRappel();
}

// Le compte : qui est connecté, le pseudo, la déconnexion.
function blocCompte() {
  const c = etat.compte;
  const champ = h('input', { class: 'code', value: c.pseudo || '', maxlength: 40, 'aria-label': 'Pseudo', autocomplete: 'nickname' });
  const dateSync = c.sync ? new Date(c.sync).toLocaleString('fr-FR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }) : null;
  return h('div', { class: 'cloud compte' },
    h('p', { class: 'aide-claire' }, `Connecté : ${c.email || 'compte Gdroit'}.`),
    estAdmin() ? h('button', { class: 'bouton-or', 'data-admin': '', onClick: () => aller('admin') }, 'Administration') : null,
    h('p', { class: 'aide-claire' }, dateSync ? `Progression copiée sur ton compte le ${dateSync}.` : 'Ta progression se copie sur ton compte après chaque séance.'),
    champ,
    h('button', { class: 'bouton-fantome', onClick: async () => { const v = champ.value.trim(); if (!v) return toast('Choisis un pseudo.'); try { await changerPseudo(v); etat.compte.pseudo = v; sauver(); toast('Pseudo enregistré.'); } catch { toast('Pas de connexion. Réessaie plus tard.'); } } }, 'Changer de pseudo'),
    h('button', { class: 'bouton-lien', onClick: () => confirmerDeconnexion() }, 'Se déconnecter'));
}
// AMIS --------------------------------------------------------------------------------
const pct = (x) => `${Math.round((x || 0) * 100)} %`;
const semaineDe = (r) => (r && r.semaine === lundi() ? r.xpSemaine || 0 : 0);
const TEXTE_NOTIF = {
  demande: (n) => `${n.pseudo} veut t’ajouter.`,
  acceptee: (n) => `${n.pseudo} a accepté ta demande.`,
  defi_recu: (n) => `${n.pseudo} te lance un défi.`,
  defi_resultat: (n) => { const a = n.donnees.moi; const b = n.donnees.lui; return b > a ? `${n.pseudo} a battu ton score : ${pct(b)} contre ${pct(a)}.` : b === a ? `Égalité avec ${n.pseudo} : ${pct(b)}.` : `${n.pseudo} n’a pas battu ton score : ${pct(b)} contre ${pct(a)}.`; },
  ami_defi: (n) => `${n.pseudo} a fini son défi du jour.`,
};

async function ecranAmis() {
  const corps = h('div', {}, h('p', { class: 'aide-claire' }, 'Chargement…'));
  montrer(barreHaut(), retourPalais(), h('section', { class: 'page amis' }, h('h1', {}, 'Amis'), h('p', { class: 'page-sous' }, 'Compare ta semaine, lance des défis.'), corps));
  let moi; let liste; let defis; let notifs; let bloques;
  try { [moi, liste, defis, notifs, bloques] = await Promise.all([monProfil(), mesAmis(), mesDefis(), mesNotifications(), mesBloques()]); } catch {
    corps.replaceChildren(h('p', { class: 'aide-claire' }, 'Il faut du réseau pour voir tes amis.')); return;
  }
  if (notifs.some((n) => !n.lu)) { toutLu().catch(() => {}); nonLus = 0; }
  const amis = liste.filter((a) => a.lien === 'ami');
  const recues = liste.filter((a) => a.lien === 'recue');
  const envoyees = liste.filter((a) => a.lien === 'envoyee');
  const recharger = () => ecranAmis();

  // Le classement de la semaine : toi et tes amis, remis à zéro chaque lundi.
  const moiR = monResume();
  const lignes = [{ id: 'moi', pseudo: `${moi.pseudo || 'Toi'} (toi)`, r: moiR }, ...amis.filter((a) => a.resume).map((a) => ({ id: a.id, pseudo: a.pseudo, r: a.resume, ami: a }))]
    .sort((a, b) => semaineDe(b.r) - semaineDe(a.r));
  const classement = h('ol', { class: 'classement' }, lignes.map((l, i) => h('li', { class: l.id === 'moi' ? 'moi' : '' },
    h('button', { disabled: l.id === 'moi', onClick: () => ficheAmi(l.ami) },
      h('span', { class: 'place' }, String(i + 1)),
      h('span', { class: 'qui' }, h('b', {}, l.pseudo), h('small', {}, `Série de ${pluriel(l.r?.serie || 0, 'jour')}${l.r?.sceau && l.r.jour === jour() ? ', sceau posé aujourd’hui' : ''}`)),
      h('span', { class: 'points' }, fmt(semaineDe(l.r)))))));

  const champ = h('input', { class: 'code', placeholder: 'Code ami, par exemple ABCD-EFGH', 'aria-label': 'Code ami', autocapitalize: 'characters', autocomplete: 'off', maxlength: 12 });
  const envoyer = async (code) => {
    const c = (code || champ.value).trim().toUpperCase();
    if (!/^[A-Z2-9]{4}-?[A-Z2-9]{4}$/.test(c)) return toast('Ce code ne ressemble pas à un code ami.');
    const norme = c.includes('-') ? c : `${c.slice(0, 4)}-${c.slice(4)}`;
    try {
      const r = await demanderAmi(norme);
      toast({ envoyee: 'Demande envoyée.', acceptee: 'Vous êtes amis.', deja: 'Vous êtes déjà amis.', soi: 'C’est ton propre code.', inconnu: 'Aucun compte avec ce code.' }[r] || 'Demande envoyée.');
      recharger();
    } catch { toast('Pas de connexion. Réessaie.'); }
  };
  const lien = `${location.origin}${location.pathname}?ami=${moi.code_ami}`;
  const partager = async () => {
    const texte = `Ajoute-moi sur Gdroit pour réviser ensemble : ${lien}`;
    try { if (navigator.share) await navigator.share({ title: 'Gdroit', text: texte }); else { await navigator.clipboard.writeText(texte); toast('Lien copié.'); } } catch { /* partage annulé */ }
  };

  const boiteNotifs = notifs.length ? [h('h2', {}, 'Nouvelles'), h('ul', { class: 'articles notifs' }, notifs.slice(0, 8).map((n) => h('li', { class: `article${n.lu ? '' : ' neuf'}` }, h('div', {},
    h('p', {}, (TEXTE_NOTIF[n.type] || (() => ''))({ ...n, pseudo: n.pseudo || 'Un ami' })),
    h('small', {}, quandCourt(n.cree_le)),
    n.type === 'defi_recu' && defis.some((d) => d.id === n.donnees.defi && d.statut === 'ouvert') ? h('button', { class: 'bouton-lien', onClick: () => releverDefi(n.donnees.defi) }, 'Relever le défi') : null))))] : [];

  const defisRecus = defis.filter((d) => d.recu && d.statut === 'ouvert');
  const autresDefis = defis.filter((d) => !(d.recu && d.statut === 'ouvert')).slice(0, 10);
  const ligneDefi = (d) => {
    const moiS = d.recu ? d.score_invite : d.score_auteur; const luiS = d.recu ? d.score_auteur : d.score_invite;
    const etatTxt = d.statut === 'joue' ? (moiS > luiS ? `Gagné, ${pct(moiS)} contre ${pct(luiS)}` : moiS === luiS ? `Égalité, ${pct(moiS)}` : `Perdu, ${pct(moiS)} contre ${pct(luiS)}`)
      : d.statut === 'refuse' ? 'Refusé' : d.statut === 'expire' ? 'Expiré' : d.recu ? `À toi de battre ${pct(d.score_auteur)}` : `En attente, tu as fait ${pct(d.score_auteur)}`;
    return h('li', { class: 'article' }, h('div', {},
      h('b', {}, `${d.recu ? 'De' : 'Pour'} ${d.pseudo || 'un ami'}`), h('p', {}, etatTxt),
      h('small', {}, `${d.matiere === 'oblig' ? 'Droit des obligations' : 'Droit administratif'}, ${quandCourt(d.cree_le)}`),
      d.recu && d.statut === 'ouvert' ? h('div', { class: 'admin-duo' },
        h('button', { class: 'bouton-or', onClick: () => releverDefi(d.id) }, 'Relever'),
        h('button', { class: 'bouton-fantome', onClick: async () => { await refuserDefi(d.id).catch(() => {}); recharger(); } }, 'Refuser')) : null));
  };

  const demande = (a, recue) => h('li', { class: 'article' }, h('div', {}, h('b', {}, a.pseudo || 'Sans pseudo'), h('p', {}, recue ? 'Veut t’ajouter' : 'Demande envoyée'),
    recue ? h('div', { class: 'admin-duo' },
      h('button', { class: 'bouton-or', onClick: async () => { try { await repondreAmi(a.id, true); toast(`${a.pseudo} est ton ami.`); recharger(); } catch { toast('Pas de connexion.'); } } }, 'Accepter'),
      h('button', { class: 'bouton-fantome', onClick: async () => { await repondreAmi(a.id, false).catch(() => {}); recharger(); } }, 'Refuser'))
      : h('button', { class: 'bouton-lien', onClick: async () => { await retirerAmi(a.id).catch(() => {}); recharger(); } }, 'Annuler la demande')));

  corps.replaceChildren(h('div', {},
    ...boiteNotifs,
    recues.length ? h('h2', {}, 'Demandes reçues') : null, recues.length ? h('ul', { class: 'articles' }, recues.map((a) => demande(a, true))) : null,
    defisRecus.length ? h('h2', {}, 'Défis à relever') : null, defisRecus.length ? h('ul', { class: 'articles' }, defisRecus.map(ligneDefi)) : null,
    h('h2', {}, 'Classement de la semaine'),
    h('p', { class: 'aide-claire' }, 'Les points gagnés depuis lundi. Tout le monde repart de zéro chaque semaine.'),
    classement,
    amis.some((a) => a.masque) ? h('p', { class: 'aide-claire' }, `${amis.filter((a) => a.masque).map((a) => a.pseudo).join(', ')} préfère${amis.filter((a) => a.masque).length > 1 ? 'nt' : ''} garder sa progression pour soi.`) : null,
    h('h2', {}, 'Ajouter un ami'),
    h('p', { class: 'aide-claire' }, 'Ton code ami :'), h('p', { class: 'code-recup code-ami' }, moi.code_ami),
    h('button', { class: 'bouton-or', onClick: partager }, 'Envoyer mon lien d’invitation'),
    champ, h('button', { class: 'bouton-fantome', onClick: () => envoyer() }, 'Envoyer la demande'),
    envoyees.length ? h('ul', { class: 'articles' }, envoyees.map((a) => demande(a, false))) : null,
    amis.length ? h('h2', {}, `Mes amis (${amis.length})`) : null,
    amis.length ? h('ul', { class: 'articles' }, amis.map((a) => h('li', {}, h('button', { class: 'article ami-ligne', onClick: () => ficheAmi(a) }, h('div', {},
      h('b', {}, a.pseudo || 'Sans pseudo'), h('small', {}, a.masque ? 'Progression masquée' : a.resume ? `${a.resume.grade}, ${fmt(a.resume.xp)} points` : 'Pas encore de séance')))))) : null,
    autresDefis.length ? h('h2', {}, 'Derniers défis') : null, autresDefis.length ? h('ul', { class: 'articles' }, autresDefis.map(ligneDefi)) : null,
    h('h2', {}, 'Réglages'), reglagesAmis(moi),
    bloques.length ? h('h2', {}, 'Comptes bloqués') : null,
    bloques.length ? h('ul', { class: 'articles' }, bloques.map((b) => h('li', { class: 'article' }, h('div', {}, h('b', {}, b.pseudo || 'Sans pseudo'),
      h('button', { class: 'bouton-lien', onClick: async () => { await bloquer(b.id, false).catch(() => {}); recharger(); } }, 'Débloquer'))))) : null));
}
function proposerAmi(code) {
  const voile = h('div', { class: 'voile', onClick: (e) => { if (e.target === voile) voile.remove(); } }, h('div', { class: 'boite', role: 'dialog', 'aria-label': 'Invitation' },
    h('p', {}, `Tu as ouvert une invitation (code ${code}). Envoyer une demande d’ami ?`),
    h('div', { class: 'boite-actions' },
      h('button', { class: 'bouton-or', onClick: async () => {
        voile.remove();
        try { const r = await demanderAmi(code); toast({ envoyee: 'Demande envoyée.', acceptee: 'Vous êtes amis.', deja: 'Vous êtes déjà amis.', soi: 'C’est ton propre lien.', inconnu: 'Ce lien ne correspond à aucun compte.' }[r] || 'Demande envoyée.'); } catch { toast('Pas de connexion. Réessaie depuis la page Amis.'); }
        aller('amis');
      } }, 'Envoyer la demande'),
      h('button', { class: 'bouton-lien', onClick: () => voile.remove() }, 'Plus tard'))));
  document.body.append(voile);
}
const quandCourt = (d) => new Date(d).toLocaleString('fr-FR', { weekday: 'long', hour: '2-digit', minute: '2-digit' });

function reglagesAmis(moi) {
  const n = { demandes: true, defis: true, revisions: false, ...(moi.notifs || {}) };
  const bouton = (nom, actif, changer) => h('label', { class: 'reglage' }, h('span', {}, nom),
    h('input', { type: 'checkbox', role: 'switch', checked: actif, onChange: async (e) => {
      const c = e.target; try { await changer(c.checked); son('tap'); } catch { c.checked = !c.checked; toast('Pas de connexion.'); }
    } }));
  const prefs = (cle) => (v) => { n[cle] = v; return reglerProfil({ notifs: n }); };
  return h('div', { class: 'reglages' },
    bouton('Montrer ma progression à mes amis', !moi.masquer, (v) => reglerProfil({ masquer: !v })),
    bouton('Notifier les demandes d’ami', n.demandes, prefs('demandes')),
    bouton('Notifier les défis reçus et leurs résultats', n.defis, prefs('defis')),
    bouton('Notifier quand un ami finit son défi du jour', n.revisions, prefs('revisions')),
    h('p', { class: 'aide-claire' }, 'Au plus une nouvelle par ami et par jour pour les révisions, et rien sur le téléphone entre 22 h et 8 h : tout reste ici.'),
    h('button', { class: 'bouton-fantome', onClick: activerNotifsTelephone }, 'Recevoir ces notifications sur ce téléphone'));
}
async function activerNotifsTelephone() {
  if (!('Notification' in window) || !('PushManager' in window)) return toast(estInstallee() ? 'Ce téléphone ne permet pas les notifications.' : 'Installe d’abord l’appli sur l’écran d’accueil.');
  try { await activerRappel(); const s = await abonnementActuel(); if (!s) throw new Error(); await inscrireAppareil(s); toast('Notifications activées sur ce téléphone.'); } catch (e) { toast(e.message || 'Notifications refusées.'); }
}

function ficheAmi(a) {
  if (!a) return;
  const r = a.resume; const moi = monResume();
  const ligne = (nom, x, y) => h('tr', {}, h('th', {}, nom), h('td', {}, x), h('td', {}, y));
  const memeEquipe = r?.equipe && r.equipe === etat.equipe;
  const voile = h('div', { class: 'voile', onClick: (e) => { if (e.target === voile) voile.remove(); } }, h('div', { class: 'boite admin-fiche', role: 'dialog', 'aria-label': `Fiche de ${a.pseudo}` },
    h('h2', {}, a.pseudo || 'Sans pseudo'),
    r ? h('table', { class: 'comparer' }, h('thead', {}, h('tr', {}, h('th', {}), h('th', {}, 'Toi'), h('th', {}, a.pseudo || 'Ami'))), h('tbody', {},
      ligne('Grade', moi.grade, r.grade),
      ligne('Cette semaine', fmt(semaineDe(moi)), fmt(semaineDe(r))),
      ligne('Série', pluriel(moi.serie, 'jour'), pluriel(r.serie, 'jour')),
      ligne('Points', fmt(moi.xp), fmt(r.xp)),
      ligne('Administratif', fmt(moi.xpAdmin), fmt(r.xpAdmin)),
      ligne('Obligations', fmt(moi.xpOblig), fmt(r.xpOblig)),
      ligne('Fiches maîtrisées', fmt(moi.maitrises), fmt(r.maitrises)),
      ligne('Séances', fmt(moi.seances), fmt(r.seances))))
      : h('p', { class: 'aide-claire' }, a.masque ? 'Cet ami garde sa progression pour lui.' : 'Pas encore de progression à comparer.'),
    h('h3', {}, 'Lancer un défi'),
    h('p', { class: 'aide-claire' }, 'Tu joues un défi, puis ton ami reçoit les mêmes questions et doit battre ton score.'),
    h('div', { class: 'admin-duo' },
      h('button', { class: 'bouton-or', onClick: () => { voile.remove(); lancerDefiAmi(a, 'admin'); } }, 'Administratif'),
      h('button', { class: 'bouton-or', disabled: !memeEquipe, onClick: () => { voile.remove(); lancerDefiAmi(a, 'oblig'); } }, 'Obligations')),
    memeEquipe ? null : h('p', { class: 'aide-claire' }, 'Les obligations se défient entre membres de la même équipe.'),
    h('div', { class: 'boite-actions' },
      h('button', { class: 'bouton-lien', onClick: async () => { voile.remove(); await retirerAmi(a.id).catch(() => {}); toast(`${a.pseudo} n’est plus dans tes amis.`); ecranAmis(); } }, 'Retirer de mes amis'),
      h('button', { class: 'bouton-lien', onClick: async () => { voile.remove(); await bloquer(a.id).catch(() => {}); toast(`${a.pseudo} est bloqué.`); ecranAmis(); } }, 'Bloquer'),
      h('button', { class: 'bouton-lien', onClick: () => voile.remove() }, 'Fermer'))));
  document.body.append(voile);
}

function changerMatiereSilencieux(m) { if (etat.matiere !== m) { etat.matiere = m; ix = CONTENUS[m]; sauver(); } }
function lancerDefiAmi(a, matiere) {
  changerMatiereSilencieux(matiere);
  const zones = zonesDuJour(ix);
  const rounds = composerDefi(ix, zones, aRevoir(ix, zones));
  lancer({ type: 'defi-ami', titre: `Défi pour ${a.pseudo}`, rounds, defiAmi: { cible: a.id, pseudo: a.pseudo, matiere, rounds: JSON.parse(JSON.stringify(rounds)) } });
}
async function releverDefi(id) {
  let d;
  try { d = await lireDefi(id); } catch { return toast('Pas de connexion.'); }
  if (!d || d.statut !== 'ouvert') return toast('Ce défi n’est plus ouvert.');
  if (d.matiere === 'oblig' && d.equipe && d.equipe !== etat.equipe) return toast('Ce défi porte sur le cours de l’autre équipe.');
  changerMatiereSilencieux(d.matiere);
  lancer({ type: 'defi-ami', titre: `Défi de ${d.pseudo_auteur || 'ton ami'}`, rounds: d.rounds, defiAmi: { id: d.id, pseudo: d.pseudo_auteur, score: d.score_auteur } });
}
// En fin de défi : on l'envoie à l'ami, ou on lui renvoie le score.
function suiteDefiAmi(S, moyenne) {
  const d = S.defiAmi; if (!d) return null;
  if (d.cible) {
    creerDefi(d.cible, d.matiere, d.matiere === 'oblig' ? etat.equipe : null, d.rounds, Math.round(moyenne * 1000) / 1000)
      .then(() => toast(`Défi envoyé à ${d.pseudo}.`)).catch(() => toast('Le défi n’a pas pu partir. Vérifie ta connexion.'));
    return h('p', { class: 'res-texte' }, `${d.pseudo} va recevoir les mêmes questions. À lui de battre tes ${pct(moyenne)}.`);
  }
  repondreDefi(d.id, Math.round(moyenne * 1000) / 1000).catch(() => toast('Ton score n’a pas pu partir. Vérifie ta connexion.'));
  const gagne = moyenne > d.score; const egal = Math.round(moyenne * 100) === Math.round(d.score * 100);
  return h('p', { class: 'res-coffre' }, egal ? `Égalité avec ${d.pseudo} : ${pct(moyenne)}.` : gagne ? `Tu bats ${d.pseudo} : ${pct(moyenne)} contre ${pct(d.score)}.` : `${d.pseudo} garde l’avantage : ${pct(d.score)} contre ${pct(moyenne)}.`);
}

// ADMINISTRATION ----------------------------------------------------------------------
// Réservé au compte administrateur : le serveur refuse toute autre personne.
const NOMS_STATUT = { admin: 'Admin', testeur: 'Testeur', paye: 'Payé', aucun: 'Sans accès' };
const quand = (d) => (d ? 'le ' + new Date(d).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'jamais');
async function ecranAdmin() {
  const corps = h('div', { class: 'admin-corps' }, h('p', { class: 'aide-claire' }, 'Chargement…'));
  montrer(barreHaut(), h('button', { class: 'bouton-matiere', onClick: () => aller('profil') }, icone('retour', 18), 'Retour au profil'),
    h('section', { class: 'page admin' }, h('h1', {}, 'Administration'), h('p', { class: 'page-sous' }, 'Visible par toi seul.'), corps));
  let comptes; let signalements; let reglage;
  try { [comptes, signalements, reglage] = await Promise.all([adminComptes(), adminSignalements(), adminReglage()]); } catch {
    corps.replaceChildren(h('p', { class: 'aide-claire' }, 'Impossible de charger les comptes. Vérifie ta connexion.')); return;
  }
  const filtre = h('input', { class: 'code', type: 'search', placeholder: 'Chercher un pseudo ou un email', 'aria-label': 'Chercher un compte' });
  const liste = h('ul', { class: 'articles admin-comptes' });
  const rendreListe = () => {
    const q = filtre.value.trim().toLowerCase();
    liste.replaceChildren(...comptes.filter((c) => !q || `${c.pseudo} ${c.email}`.toLowerCase().includes(q)).map((c) => h('li', {},
      h('button', { class: 'article admin-compte', 'data-compte': c.id, onClick: () => ficheCompte(c) },
        h('div', {},
          h('b', {}, c.pseudo || c.email),
          h('p', {}, `${c.email}`),
          h('small', {}, `${fmt(c.jetons ?? 0)} jetons, ${fmt((c.xp ?? 0) + (c.xp_oblig ?? 0))} points, ${pluriel(c.seances ?? 0, 'séance')}. Vu ${quand(c.vu_le)}.`),
          c.en_attente ? h('small', {}, `En attente : ${c.en_attente > 0 ? '+' : ''}${fmt(c.en_attente)} jetons à la prochaine ouverture.`) : null),
        h('span', { class: `statut statut-${c.acces}` }, NOMS_STATUT[c.acces])))));
  };
  filtre.addEventListener('input', rendreListe); rendreListe();
  const bascule = h('div', { class: 'bascule' }, [['testeur', 'Testeur'], ['aucun', 'Sans accès']].map(([v, nom]) => h('button', { class: reglage === v ? 'actif' : '', 'aria-pressed': String(reglage === v), onClick: async () => {
    if (reglage === v) return;
    try { await adminChangerReglage(v); toast(v === 'aucun' ? 'Les nouveaux comptes arrivent sans accès.' : 'Les nouveaux comptes arrivent en testeurs.'); ecranAdmin(); } catch { toast('Changement refusé.'); }
  } }, nom)));
  const ouverts = signalements.filter((x) => !x.traite);
  const lignesSignal = signalements.map((x) => h('li', { class: `article admin-signal${x.traite ? ' traite' : ''}` }, h('div', {},
    h('b', {}, x.nom || x.carte), h('p', {}, x.texte),
    h('small', {}, `${x.pseudo || x.email || 'compte supprimé'}, ${quand(x.cree_le)}${x.equipe ? `, équipe ${x.equipe}` : ''}`),
    h('button', { class: 'bouton-lien', onClick: async () => { try { await adminTraiter(x.id, !x.traite); ecranAdmin(); } catch { toast('Pas de connexion.'); } } }, x.traite ? 'Rouvrir' : 'Marquer comme traité'))));
  corps.replaceChildren(
    h('h2', {}, 'Nouveaux comptes'),
    h('p', { class: 'aide-claire' }, 'Le statut donné à chaque nouvelle inscription. Passe à « Sans accès » le jour où l’appli devient payante : les comptes existants gardent leur statut.'),
    bascule,
    h('h2', {}, `Comptes (${comptes.length})`), filtre, liste,
    h('h2', {}, `Signalements à traiter (${ouverts.length})`),
    signalements.length ? h('ul', { class: 'articles' }, lignesSignal) : h('p', { class: 'aide-claire' }, 'Aucun signalement pour l’instant.'));
}

function ficheCompte(c) {
  const moi = c.id === etat.compte?.id;
  const montant = h('input', { class: 'code', type: 'number', inputmode: 'numeric', min: 1, max: 100000, placeholder: 'Nombre de jetons', 'aria-label': 'Nombre de jetons' });
  const motif = h('input', { class: 'code', maxlength: 200, placeholder: 'Motif (facultatif)', 'aria-label': 'Motif' });
  const jetons = (signe) => async () => {
    const n = Math.round(+montant.value);
    if (!(n > 0)) return toast('Indique un nombre de jetons.');
    try { await adminJetons(c.id, signe * n, motif.value.trim()); voile.remove(); toast(signe > 0 ? `${monnaie(n)} envoyés à ${c.pseudo || c.email}.` : `${monnaie(n)} retirés à ${c.pseudo || c.email}.`); ecranAdmin(); } catch { toast('Opération refusée.'); }
  };
  const statut = moi ? null : h('div', { class: 'bascule' }, ['testeur', 'paye', 'aucun'].map((v) => h('button', { class: c.acces === v ? 'actif' : '', 'aria-pressed': String(c.acces === v), onClick: async () => {
    if (c.acces === v) return;
    try { await adminStatut(c.id, v); voile.remove(); toast(`${c.pseudo || c.email} : ${NOMS_STATUT[v].toLowerCase()}.`); ecranAdmin(); } catch { toast('Changement refusé.'); }
  } }, NOMS_STATUT[v])));
  const voile = h('div', { class: 'voile', onClick: (e) => { if (e.target === voile) voile.remove(); } }, h('div', { class: 'boite admin-fiche', role: 'dialog', 'aria-label': `Compte de ${c.pseudo || c.email}` },
    h('h2', {}, c.pseudo || c.email), h('p', { class: 'aide-claire' }, c.email),
    h('p', { class: 'aide-claire' }, `Inscrit ${quand(c.cree_le)}. Dernière copie de progression : ${quand(c.maj)}.${c.equipe ? ` Équipe ${c.equipe}.` : ''}`),
    h('h3', {}, 'Jetons'),
    h('p', { class: 'aide-claire' }, `${fmt(c.jetons ?? 0)} à la dernière copie. Le changement s’applique à sa prochaine ouverture de l’appli, sans descendre sous zéro.`),
    montant, motif,
    h('div', { class: 'admin-duo' }, h('button', { class: 'bouton-or', onClick: jetons(1) }, 'Ajouter'), h('button', { class: 'bouton-fantome', onClick: jetons(-1) }, 'Retirer')),
    h('h3', {}, 'Statut'),
    moi ? h('p', { class: 'aide-claire' }, 'Ton compte reste administrateur.') : statut,
    h('div', { class: 'boite-actions' }, h('button', { class: 'bouton-lien', onClick: () => voile.remove() }, 'Fermer'))));
  document.body.append(voile);
}

function confirmerDeconnexion() {
  const voile = h('div', { class: 'voile', onClick: (e) => { if (e.target === voile) voile.remove(); } }, h('div', { class: 'boite', role: 'dialog', 'aria-label': 'Se déconnecter' },
    h('p', {}, 'Ta progression est copiée sur ton compte puis effacée de ce téléphone. Tu la retrouves en te reconnectant.'),
    h('div', { class: 'boite-actions' },
      h('button', { class: 'bouton-or', onClick: async () => { voile.remove(); await deconnexion(); remplacerEtat({}); location.reload(); } }, 'Se déconnecter'),
      h('button', { class: 'bouton-lien', onClick: () => voile.remove() }, 'Annuler'))));
  document.body.append(voile);
}

// CONNEXION ---------------------------------------------------------------------------
const EMAIL_ACTIF = false;
function ecranConnexion(erreur) {
  afficherOnglets(false);
  const email = h('input', { class: 'code', type: 'email', inputmode: 'email', autocomplete: 'email', placeholder: 'ton.adresse@email.fr', 'aria-label': 'Adresse email' });
  const code = h('input', { class: 'code', inputmode: 'numeric', autocomplete: 'one-time-code', placeholder: 'Code reçu par email', 'aria-label': 'Code reçu par email', maxlength: 10 });
  const etape2 = h('div', { class: 'connexion-code', hidden: true }, h('p', { class: 'aide-claire' }, 'Regarde tes emails, y compris les indésirables.'), code,
    h('button', { class: 'bouton-or', onClick: async (e) => {
      if (code.value.replace(/\s/g, '').length < 6) return toast('Tape le code reçu.');
      const bouton = e.currentTarget; bouton.disabled = true;
      try { await verifierCode(email.value, code.value); location.reload(); } catch (err) { toast(err.message); bouton.disabled = false; }
    } }, 'Valider le code'));
  const envoyer = h('button', { class: 'bouton-fantome', onClick: async () => {
    if (!/^\S+@\S+\.\S+$/.test(email.value.trim())) return toast('Adresse email incomplète.');
    envoyer.disabled = true;
    try { await envoyerCode(email.value); etape2.hidden = false; code.focus(); toast('Code envoyé.'); } catch (err) { toast(err.message); } finally { envoyer.disabled = false; }
  } }, 'Recevoir un code par email');
  racine.replaceChildren(h('main', { class: 'connexion' },
    chouette('clin', { taille: 170, tenue: false }),
    h('h1', {}, 'Gdroit'),
    h('p', { class: 'connexion-sous' }, 'Connecte-toi pour retrouver ta progression sur tous tes appareils.'),
    erreur ? h('p', { class: 'connexion-erreur', role: 'alert' }, erreur) : null,
    h('button', { class: 'bouton-or connexion-google', onClick: () => { if (navigator.onLine === false) return toast('Il faut du réseau pour se connecter.'); connexionGoogle(); } }, logoG(), 'Continuer avec Google'),
    // Le code par email attend un service d'envoi (SMTP) : ?email l'affiche pour les tests.
    EMAIL_ACTIF || new URLSearchParams(location.search).has('email') ? [h('p', { class: 'connexion-ou' }, 'ou'), email, envoyer, etape2] : null,
    h('p', { class: 'aide-claire connexion-note' }, etat.stats.seances ? 'La progression déjà sur ce téléphone sera rattachée à ton compte.' : 'Un compte se crée à la première connexion.')));
}
function logoG() {
  const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  s.setAttribute('viewBox', '0 0 48 48'); s.setAttribute('width', '22'); s.setAttribute('height', '22'); s.setAttribute('aria-hidden', 'true');
  s.innerHTML = '<path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.6 5.4 2.7 13.3l7.9 6.2C12.5 13.6 17.8 9.5 24 9.5z"/><path fill="#4285F4" d="M46.1 24.6c0-1.6-.1-3.1-.4-4.6H24v9h12.4c-.5 2.9-2.2 5.3-4.6 6.9l7.4 5.8c4.3-4 6.9-9.9 6.9-17.1z"/><path fill="#FBBC05" d="M10.6 28.5c-.5-1.4-.8-2.9-.8-4.5s.3-3.1.8-4.5l-7.9-6.2C1 16.6 0 20.2 0 24s1 7.4 2.7 10.7l7.9-6.2z"/><path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.4-5.8c-2.1 1.4-4.8 2.2-8.5 2.2-6.2 0-11.5-4.1-13.4-9.8l-7.9 6.2C6.6 42.6 14.6 48 24 48z"/>';
  return s;
}

// Au démarrage, un compte connecté récupère sa progression avant d'ouvrir le Palais.
async function ouvrirCompte(params) {
  const requis = Boolean(SUPABASE_URL) && !(params.has('test') && !params.has('compte'));
  if (!requis) return true;
  let erreur = null;
  try { retourConnexion(); } catch (e) { erreur = e.message; }
  if (!connecte()) { ecranConnexion(erreur); return false; }
  if (navigator.onLine === false) return true;
  racine.replaceChildren(h('div', { class: 'attente' }, chouette('pause', { taille: 210, tenue: false }), h('p', {}, 'Ta progression arrive')));
  const delai = { depasse: false };
  try {
    await completerUtilisateur();
    const r = await Promise.race([synchroniser(delai), new Promise((ok) => setTimeout(() => { delai.depasse = true; ok('delai'); }, 6000))]);
    if (r === 'en-ligne') setTimeout(() => toast('Progression de ton compte récupérée.'), 600);
    lireProfil().catch(() => {});
  } catch (e) {
    if (!connecte()) { ecranConnexion(e.message); return false; }
  }
  return true;
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

// Un téléphone qui peine garde la fluidité : les effets d'ambiance s'arrêtent d'eux-mêmes.
function surveillerFluidite() {
  if (!effets()) return;
  const t0 = performance.now(); let n = 0;
  requestAnimationFrame(function pas(t) {
    n++;
    if (t - t0 < 1600) { requestAnimationFrame(pas); return; }
    if (!document.hidden && n / ((t - t0) / 1000) < 34 && document.documentElement.dataset.effets === 'oui') document.documentElement.dataset.effets = 'leger';
  });
}

async function demarrer() {
  const params = new URLSearchParams(location.search);
  // Un lien d'invitation survit à la connexion : le code attend dans le téléphone.
  if (params.get('ami')) { try { localStorage.setItem('gdroit-ami', params.get('ami')); } catch { /* rien */ } history.replaceState(null, '', location.pathname); }
  // Une ouverture lente : la chouette patiente, montre en main.
  const attente = setTimeout(() => racine.replaceChildren(h('div', { class: 'attente' }, chouette('pause', { taille: 210, tenue: false }), h('p', {}, 'Le Palais ouvre ses portes'))), 700);
  if (params.has('decalage')) fixerDecalage(+params.get('decalage'));
  const [admin, oblig2, oblig1] = await Promise.all([fetch('content.json').then((r) => r.json()), fetch('oblig.json').then((r) => r.json()), fetch('oblig1.json').then((r) => r.json()), charger().then(chargerImages)]);
  clearTimeout(attente);
  if (!(await ouvrirCompte(params))) { enregistrerServiceWorker(); return; }
  // Une ancienne sauvegarde connaît déjà le jour de la dernière séance.
  if (etat.chouette.seance === null) etat.chouette.seance = etat.serie.dernier;
  // ?equipe=1 : les tests ouvrent directement une équipe, sans passer par la question.
  if (params.has('equipe')) changerEquipe(+params.get('equipe'));
  PAR_EQUIPE[1] = oblig1; PAR_EQUIPE[2] = oblig2;
  CONTENUS.admin = indexer(admin); indexerObligations();
  if (params.has('test') && !params.has('choix')) etat.matiere = params.get('matiere') === 'oblig' ? 'oblig' : etat.matiere;
  ix = CONTENUS[etat.matiere];
  appliquerTheme();
  appliquerSession();
  surveillerAudio();
  for (const ev of ['pointerdown', 'pointerup', 'touchend', 'click']) document.addEventListener(ev, reveillerAudio, { passive: true });
  const evenement = verifierSerie();
  // L'appli s'ouvre sur le choix de la matière. Les tests vont droit à la matière demandée.
  if (params.has('test') && !params.has('choix')) aller('palais');
  else if (!etat.equipeChoisie && (!params.has('test') || params.has('groupe'))) choisirEquipe();
  else matieres();
  if (rembourse) toast(`Anciennes tenues retirées : ${fmt(rembourse)} jetons remboursés.`);
  if (evenement?.type === 'sursis') toast(`${pluriel(evenement.n, 'sursis', 'sursis')} utilisé${evenement.n > 1 ? 's' : ''} : ta série est sauve.`);
  if (params.has('test')) window.__app = { etat: () => etat, chouette, TENUES, reagir, resultats, get ix() { return ix; }, aller, ouvrirMatiere, matieres, lancerDefi, rendreSon, NOMS_SONS, appliquerTheme };
  setTimeout(surveillerFluidite, 1200);
  precharger();

  enregistrerServiceWorker();
  if (connecte()) {
    envoyerSignalements();
    compterNouvelles();
    navigator.serviceWorker?.addEventListener('message', (e) => { if (e.data === 'amis') aller('amis'); });
    let invite = null; try { invite = localStorage.getItem('gdroit-ami'); localStorage.removeItem('gdroit-ami'); } catch { /* rien */ }
    if (invite) proposerAmi(invite);
    else if (params.has('amis')) aller('amis');
    window.addEventListener('online', () => { envoyerProgression(); envoyerSignalements(); });
    document.addEventListener('visibilitychange', () => { if (document.hidden) envoyerProgression(); });
    recevoirCadeauxCompte().then((n) => {
      if (!n) return;
      if (document.querySelector('.tribune')) accueil();
      else if (document.querySelector('.porte-oblig')) matieres();
      toast(n > 0 ? `${monnaie(n)} offerts, ils sont dans ta réserve.` : `${monnaie(-n)} retirés de ta réserve.`);
    });
  }
}

async function enregistrerServiceWorker() {
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
      }
      navigator.serviceWorker.addEventListener('controllerchange', () => { if (!recharge && document.querySelector('.maj')) { recharge = true; location.reload(); } });
    } catch (e) { console.warn('Service worker indisponible', e); }
  }
}

demarrer().catch((e) => {
  console.error(e);
  racine.replaceChildren(h('main', { class: 'erreur' }, h('p', {}, 'L’appli n’a pas pu démarrer. Vérifie ta connexion pour la première ouverture, puis recharge.')));
});
