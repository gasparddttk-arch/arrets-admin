// Point d'entrée : écrans, séances, récompenses.
import { h, svg, toast, confettis, estRose, bebew, slayDiva, effets } from './ui.js';
import { icone, sceau, petitSceau, laurier, medaille } from './visuels.js';
import { chouette, portes, reagir, plumes, codeEnvole, adjuge, precharger, POSE_MODE, TENUES, SKINS, hibouSkin, skinPorte, danser, DUREE_DANSE } from './chouette.js';
import { son, reveillerAudio, surveillerAudio, appliquerSession, vibrer, rendreSon, NOMS_SONS } from './sons.js';
import { remplacerEtat, choisirAnnee, ajouterSemaine, gagnerAppel, erreursOuvertes, carnetVisible, changerEquipe,
  SCEAU_REUSSITE, SCEAU_FICHES, PRIME_MAITRISE, etat, M, charger, sauver, jour, lundi, rang, rangGeneral, verifierSerie, validerJour, relever, prixForclusion, noter, niveau, aRevoir,
  zonesOuvertes, zonesDuJour, ouvrirSuivante, ouvrirApres, evaluerTrophees, BOUTIQUE, THEMES, INSIGNES, DECORS, TROPHEES, TITRES_CARTE, fixerDecalage, rembourse,
  MATIERES, matiereDe, RANGS_GENERAL, PLAFOND_JOUR, PIECES_EPREUVE, PRIX_DUNK, gainsDuJour, crediter,
} from './state.js';
import { indexer, questionsDunk, composerDefi, composerBoss, tirerRound, jumeaux, melange, typesIntro, roundPlan, tirerAtelier } from './engine.js';
import { JEUX, NOMS_MODES, NOMS_MODES_OBLIG, NOMS_MODES_INTRO, NOMS_MODES_CONSTIT, continuer, qcm } from './games.js';
import { jouerPouvoirs, jouerNuancier, jouerPlume } from './jeux-constit.js';
import { jouerAtelier } from './atelier.js';
import { jouerTri, jouerMot, jouerRangement, jouerQuiADit, jouerScanner, jouerMemory } from './jeux-l1.js';
import { preparerLexique, souligner } from './lexique.js';
import { roundExamen, jouerFlash, jouerPlaide, jouerTrous, jouerExpress, jouerSyllogisme, jouerCasNu } from './examen.js';
import { jouerCas, jouerRemede, jouerFrise } from './jeux-oblig.js';
import { lancerDunk } from './dunk.js';
import { activerRappel, etatRappel, estInstallee, abonnementActuel } from './notif.js';
import { SUPABASE_URL } from './config.js';
import { connecte, retourConnexion, completerUtilisateur, synchroniser, envoyerProgression, envoyerSignalements, recevoirCadeauxCompte, connexionGoogle, envoyerCode, verifierCode, deconnexion, lireProfil, changerPseudo, estAdmin, adminComptes, adminJetons, adminStatut, adminSignalements, adminTraiter, adminReglage, adminChangerReglage, adminNotifier, monProfil, reglerProfil, mesAmis, mesBloques, demanderAmi, repondreAmi, retirerAmi, bloquer, mesDefis, creerDefi, lireDefi, repondreDefi, refuserDefi, mesNotifications, toutLu, annoncerDefiJour, inscrireAppareil, resume as monResume, envoyerRetour, definirNommeur, adminQuota, adminChangerQuota, adminRetours, adminTraiterRetour } from './compte.js';
import { images, chargerImages, preparerImage, enregistrerImage, retirerImage } from './images.js';

const TOUS_JEUX = { ...JEUX, atelier: jouerAtelier, pouvoirs: jouerPouvoirs, nuancier: jouerNuancier, plume: jouerPlume, cas: jouerCas, remede: jouerRemede, frise: jouerFrise, appel: jouerAppel, flash: jouerFlash, plaide: jouerPlaide, trous: jouerTrous, express: jouerExpress, syllogisme: jouerSyllogisme, casnu: jouerCasNu,
  tri: jouerTri, mot: jouerMot, rangement: jouerRangement, quiadit: jouerQuiADit, scanner: jouerScanner, memory: jouerMemory };

// FAIRE APPEL : chaque fiche ratée revient sous une autre forme, une question rapide.
async function jouerAppel(zone, ctx, r) {
  const res = await qcm(zone, ctx, { surtitre: `En appel : ${r.nom}`, question: r.q, options: r.options.map((o) => ({ ...o })), pourquoiBon: r.pourquoi, classe: 'appel' });
  ctx.noter(r.carte, res.ok);
  if (res.ok) gagnerAppel(r.carte);
  ctx.gain(res.ok ? 6 : 0);
  ctx.fin({ score: res.ok ? 1 : 0, parfait: res.ok });
}
function roundsAppel(ids) {
  const toutes = questionsDunk(ix, ix.zones.map((z) => z.id));
  const out = [];
  for (const id of ids) {
    const qs = toutes.filter((q) => q.carte === id).sort((a, b) => a.n - b.n);
    const q = qs[Math.floor(Math.random() * Math.min(qs.length, 2))];
    if (!q) continue;
    const a = ix.parId.get(id);
    out.push({ type: 'appel', carte: id, nom: a.article ? a.nom : a.court, q: q.q, pourquoi: a.article ? a.titre : `${a.court}, ${a.an}`,
      options: [{ t: q.bonne, ok: true }, ...q.faux.map((t) => ({ t, ok: false }))].sort(() => Math.random() - 0.5) });
    if (out.length >= 5) break;
  }
  return out;
}
function faireAppel(ids) {
  const rounds = roundsAppel(ids);
  if (!rounds.length) return toast('Rien à rejouer en appel pour l’instant.');
  lancer({ type: 'appel', titre: 'Faire appel', rounds });
}
let ix = null; // Le contenu de la matière ouverte.
const CONTENUS = {};
const PAR_EQUIPE = {};
const ADMIN_PAR_EQUIPE = {};
const INTRO_PAR_EQUIPE = {};
const indexerIntro = () => { CONTENUS.intro = INTRO_PAR_EQUIPE[etat.equipeL1] ||= indexer(INTRO_PAR_EQUIPE.brut[etat.equipeL1] || INTRO_PAR_EQUIPE.brut[3]); };
const racine = document.getElementById('app');
// Les termes juridiques soulignés : chaque nouvel écran est relu, avec le lexique de la matière ouverte.
let lexiquePret = null; let relecture = 0;
new MutationObserver(() => {
  if (relecture) return;
  relecture = requestAnimationFrame(() => {
    relecture = 0;
    if (!ix) return;
    if (lexiquePret !== ix.lexique) { preparerLexique(ix.lexique); lexiquePret = ix.lexique; }
    souligner(racine);
  });
}).observe(racine, { childList: true, subtree: true });
const onglets = document.getElementById('onglets');
let ongletCourant = 'palais';

const fmt = (n) => n.toLocaleString('fr-FR');
const pluriel = (n, s, p = s + 's') => `${fmt(n)} ${n > 1 ? p : s}`;
const monnaie = (n) => pluriel(n, estRose() ? 'canette' : 'jeton');
const estOblig = () => etat.matiere === 'oblig';
const estIntro = () => etat.matiere === 'intro';
const estConstit = () => etat.matiere === 'constit';
// La L1 : introduction au droit et droit constitutionnel partagent leurs écrans (notions, jeux, chambres).
const estL1 = () => estIntro() || estConstit();
const ETIQUETTE_CONSTIT = 'cours de l’équipe 2';
const nomsModes = () => (estConstit() ? NOMS_MODES_CONSTIT : estIntro() ? NOMS_MODES_INTRO : estOblig() ? NOMS_MODES_OBLIG : NOMS_MODES);
// Le nom des fiches selon la matière : arrêts en administratif, fiches en obligations, notions en L1.
const motFiche = () => (estL1() ? 'notion' : estOblig() ? 'fiche' : 'arrêt');
// Les chambres d'un exercice choisi : tout le cours ouvert en obligations et en L1, le parcours du jour en administratif.
const zonesCours = () => (estOblig() || estL1() ? ix.zones.filter((z) => !z.travaux).map((z) => z.id) : zonesDuJour(ix));
const matieresAnnee = () => MATIERES.filter((m) => (m.annee || 'L2') === (etat.annee === 'L1' ? 'L1' : 'L2') && (m.id !== 'intro' || introOuverte()));

function montrer(...enfants) {
  racine.replaceChildren(...enfants.filter(Boolean));
  window.scrollTo(0, 0);
}

function appliquerTheme() {
  const r = document.documentElement;
  r.dataset.theme = etat.theme;
  r.dataset.decor = etat.decor || 'aucun';
  r.dataset.effets = effets() ? 'oui' : 'non';
  if (images.jeton) r.style.setProperty('--jeton-image', `url("${images.jeton}")`);
  else r.style.removeProperty('--jeton-image');
  document.querySelector('meta[name="theme-color"]').setAttribute('content', { rose: '#FFE3EA', pastel: '#F4F1FA', verre: '#060A1C' }[etat.theme] || '#0A0E22');
}

function barreHaut() {
  const r = rang();
  return h('header', { class: 'haut' },
    h('button', { class: 'haut-rang', onClick: () => aller('progression'), 'aria-label': `${r.nom}${r.suivant ? `, encore ${fmt(r.suivant.xp - r.xp)} points avant ${r.suivant.nom}` : ''}. Voir ta progression` },
      h('span', { class: 'haut-ligne' }, h('span', { class: 'haut-nom' }, etat.insigne !== 'aucun' ? icone(etat.insigne, 16) : null, r.nom), laurier(36)),
      h('span', { class: 'jauge', 'aria-hidden': 'true' }, h('i', { style: `transform:scaleX(${r.part.toFixed(3)})` }))),
    connecte() ? h('button', { class: 'haut-amis', onClick: () => aller('amis'), 'aria-label': nonLus ? `Amis, ${pluriel(nonLus, 'nouvelle')}` : 'Amis' }, icone('equipe', 26), nonLus ? h('span', { class: 'pastille' }, nonLus > 9 ? '9+' : String(nonLus)) : null) : null,
    h('button', { class: 'haut-jetons', onClick: () => aller('boutique'), 'aria-label': monnaie(etat.jetons) }, h('i', { class: 'jeton' }), fmt(etat.jetons)));
}
let nonLus = 0; let defisEnAttente = [];
async function compterNouvelles() {
  try {
    const [n, d] = await Promise.all([mesNotifications(), mesDefis()]);
    nonLus = n.filter((x) => !x.lu).length;
    const avant = defisEnAttente.length;
    defisEnAttente = d.filter((x) => x.recu && x.statut === 'ouvert');
    if (defisEnAttente.length !== avant && document.querySelector('.tribune')) accueil();
  } catch { return; }
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
// Le choix vaut pour toute la L2 : droit des obligations et droit administratif.
const indexerObligations = () => { CONTENUS.oblig = indexer(PAR_EQUIPE[etat.equipe], etat.equipe); CONTENUS.oblig.vus = () => (etat.oblig.exos ||= {}); };
const indexerAdmin = () => { CONTENUS.admin = ADMIN_PAR_EQUIPE[etat.equipe] ||= indexer(ADMIN_PAR_EQUIPE.brut[etat.equipe]); };
function rejoindreEquipe(n) {
  changerEquipe(n); indexerObligations(); indexerAdmin(); filtre = { texte: '', zone: 0, type: 'arrets' };
  if (etat.matiere === 'oblig' || etat.matiere === 'admin') ix = CONTENUS[etat.matiere];
}
const PROFS = { 1: 'Obligations : Pr Molfessis', 2: 'Administratif : Pr Plessix' };

// L'année se choisit une fois, à l'arrivée. La L3 n'a pas encore de cours.
// Le droit constitutionnel (cours de l'équipe 2) est ouvert à toute la L1 ; l'introduction suit les équipes 2 et 3.
const EQUIPES_L1 = [{ n: 1, pret: true, intro: false, detail: 'Droit constitutionnel' }, { n: 2, pret: true, intro: true, detail: 'Introduction au droit et droit constitutionnel' }, { n: 3, pret: true, intro: true, detail: 'Introduction au droit et droit constitutionnel' }];
const equipeL1Prete = (n) => EQUIPES_L1.some((e) => e.n === n && e.pret);
const introOuverte = () => EQUIPES_L1.some((e) => e.n === etat.equipeL1 && e.intro);
function ecranAnnee() {
  afficherOnglets(false);
  const carte = (a, txt, pret, action) => h('button', { class: `porte porte-annee${pret ? '' : ' en-travaux'}`, 'data-annee': a, disabled: !pret, 'aria-disabled': pret ? null : 'true', onClick: () => { if (!pret) return; son('carte'); vibrer(8); action(); } },
    h('span', { class: 'porte-icone porte-annee-n' }, a),
    h('span', { class: 'porte-txt' }, h('b', {}, a === 'L1' ? 'Première année' : a === 'L2' ? 'Deuxième année' : 'Troisième année'), h('small', {}, txt)));
  montrer(h('section', { class: 'choix' },
    h('div', { class: 'choix-tete' }, h('h1', {}, 'Tu es en…'), chouette('debout', { taille: 128, vivante: true, classe: 'chouette-guide' })),
    h('p', { class: 'page-sous' }, 'Gdroit te montre les cours et les exercices de ton année. Tu pourras changer dans Profil.'),
    h('div', { class: 'portes' },
      carte('L1', 'Introduction au droit', true, ecranEquipeL1),
      carte('L2', 'Droit administratif et droit des obligations', true, () => { choisirAnnee('L2'); if (etat.equipeChoisie) matieres(); else choisirEquipe(); }),
      carte('L3', 'Bientôt', false, null))));
}

function ecranEquipeL1() {
  afficherOnglets(false);
  const choix = (e) => h('button', { class: `porte porte-equipe${e.pret ? '' : ' en-travaux'}`, 'data-equipe-l1': e.n, disabled: !e.pret, onClick: () => { if (!e.pret) return; son('carte'); vibrer(8); choisirAnnee('L1', e.n); accueilL1(); } },
    h('span', { class: 'porte-icone' }, icone('balance', 34)),
    h('span', { class: 'porte-txt' }, h('b', {}, `Équipe ${e.n}`), h('small', {}, e.pret ? e.detail : 'En travaux')));
  montrer(h('section', { class: 'choix' },
    h('div', { class: 'choix-tete' }, h('h1', {}, 'Quelle est ton équipe ?'), chouette('debout', { taille: 128, vivante: true, classe: 'chouette-guide' })),
    h('p', { class: 'page-sous' }, 'Le droit constitutionnel est ouvert à toute la L1. L’introduction au droit suit les cours des équipes 2 et 3.'),
    h('div', { class: 'portes' }, EQUIPES_L1.map(choix)),
    h('button', { class: 'bouton-lien', onClick: ecranAnnee }, 'Changer d’année')));
}

// La L1 a deux matières : l'introduction au droit (selon l'équipe) et le droit constitutionnel.
function accueilL1() {
  if (!equipeL1Prete(etat.equipeL1)) { ecranEquipeL1(); return; }
  indexerIntro();
  if (!matieresAnnee().some((m) => m.id === etat.matiere)) { etat.matiere = matieresAnnee()[0].id; sauver(); }
  filtre = { texte: '', zone: 0, type: 'arrets' };
  ix = CONTENUS[etat.matiere];
  matieres();
}

function choisirEquipe() {
  afficherOnglets(false);
  const choix = (n, detail) => h('button', { class: 'porte porte-equipe', 'data-equipe': n, onClick: () => { son('carte'); vibrer(8); rejoindreEquipe(n); matieres(); } },
    h('span', { class: 'porte-icone' }, icone('balance', 34)),
    h('span', { class: 'porte-txt' }, h('b', {}, `Équipe ${n}`), detail ? h('small', {}, detail) : null));
  montrer(h('section', { class: 'choix' },
    h('div', { class: 'choix-tete' }, h('h1', {}, 'Quelle est ton équipe ?'), chouette('debout', { taille: 128, vivante: true, classe: 'chouette-guide' })),
    h('p', { class: 'page-sous' }, 'Tu ne verras que le cours et les exercices de ton équipe, en droit administratif comme en droit des obligations. Tu pourras changer dans Profil.'),
    h('div', { class: 'portes' }, choix(1, PROFS[1]), choix(2, PROFS[2]))));
}

function matieres() {
  afficherOnglets(false);
  const g = rangGeneral(); const s = etat.serie;
  const guide = chouette('debout', { taille: 128, vivante: true, classe: 'chouette-guide' });
  const porte = (m) => {
    const r = rang(m.id); const gagnes = gainsDuJour(m.id);
    return h('button', { class: `porte porte-${m.id}`, 'data-matiere': m.id, onPointerdown: () => { guide.dataset.vers = m.id; }, onClick: () => ouvrirMatiere(m.id) },
      h('span', { class: 'porte-icone' }, icone(m.id === 'admin' ? 'palais' : m.id === 'constit' ? 'colonne' : 'balance', 34)),
      h('span', { class: 'porte-txt' },
        h('b', {}, m.nom),
        h('small', {}, m.id === 'oblig' || m.id === 'admin' ? `${m.institution}, équipe ${etat.equipe}` : m.id === 'intro' ? `${m.institution}, équipe ${etat.equipeL1}` : m.id === 'constit' ? `${m.institution}, ${ETIQUETTE_CONSTIT}` : m.institution),
        h('span', { class: 'porte-rang' }, r.nom),
        h('span', { class: 'jauge', 'aria-hidden': 'true' }, h('i', { style: `transform:scaleX(${r.part.toFixed(3)})` })),
        h('small', { class: 'porte-gain' }, gagnes >= PLAFOND_JOUR ? `Plafond atteint : ${monnaie(PLAFOND_JOUR)} aujourd’hui` : `${fmt(gagnes)} sur ${monnaie(PLAFOND_JOUR)} aujourd’hui`)));
  };
  montrer(
    h('header', { class: 'haut haut-general' },
      h('span', { class: 'haut-rang' }, h('span', { class: 'haut-ligne' }, h('span', { class: 'haut-nom' }, 'Gdroit'))),
      h('span', { class: 'haut-jetons' }, h('i', { class: 'jeton' }), fmt(etat.jetons))),
    h('section', { class: 'choix' },
      h('div', { class: 'choix-tete' }, h('h1', {}, 'Que révises-tu aujourd’hui ?'), guide),
      h('p', { class: 'page-sous' }, s.n ? `${pluriel(s.n, 'jour')} de série. Une séance dans l’une ou l’autre matière la garde.` : 'Termine une séance pour poser ton premier sceau.'),
      h('div', { class: 'portes' }, matieresAnnee().map(porte))));
}

function afficherOnglets(vis) {
  onglets.hidden = !vis;
  if (!vis) return;
  const defs = [['palais', 'Palais'], ['carte', 'Chambres'], ['arrets', estL1() ? 'Notions' : 'Arrêts'], ['boutique', 'Boutique'], ['profil', 'Profil']];
  onglets.replaceChildren(...defs.map(([id, l]) => h('button', {
    class: `onglet ${ongletCourant === id ? 'actif' : ''}`, 'aria-current': ongletCourant === id ? 'page' : null,
    onClick: () => { son('tap'); aller(id); },
  }, icone(id, 23), h('span', {}, l))));
}

function aller(id, p) {
  ongletCourant = id === 'role' || id === 'examen' ? 'palais' : id;
  afficherOnglets(true);
  if (id === 'admin' || id === 'progression') ongletCourant = 'profil';
  if (id === 'carnet' || id === 'lexique') ongletCourant = 'arrets';
  if (id === 'amis') ongletCourant = 'palais';
  ({ palais: accueil, carte, arrets: collection, boutique, profil, role: ecranRole, examen: ecranExamen, admin: ecranAdmin, amis: ecranAmis, progression: ecranProgression, carnet: ecranCarnet, lexique: ecranLexique }[id])(p);
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
    h('button', { class: 'bouton-matiere', onClick: () => { son('retour'); matieres(); } }, icone('matieres', 18), matiereDe(etat.matiere).nom, estConstit() ? '' : estIntro() ? `, équipe ${etat.equipeL1}` : `, équipe ${etat.equipe}`),
    aInstaller,
    h('section', { class: 'tribune', 'data-decor': etat.decor },
      h('div', { class: 'serie-bloc' },
        h('span', { class: 'serie-etiquette' }, 'Ta série'),
        h('p', { class: 'serie-txt' }, h('b', { class: 'serie-nombre' }, String(s.n)), s.n === 1 ? ' jour' : ' jours'),
        h('p', { class: 'serie-sous' }, fait ? 'Sceau posé. Reviens demain.' : s.n ? 'Une séance aujourd’hui la garde.' : 'Une séance pose ton premier sceau.'),
        semaine()),
      figureSerie(s, fait),
      etat.decor === 'jardin' ? [1, 2, 3].map((i) => h('i', { class: `feuille f${i}`, 'aria-hidden': 'true' })) : null,
      etat.decor === 'buren' ? h('span', { class: 'colonnes-buren', 'aria-hidden': 'true' }, [70, 40, 100, 55, 85].map((v, i) => h('i', { style: `height:${v}%;--i:${i}` }))) : null),
    blocRupture,
    h('div', { class: 'actions' },
      encours ? h('div', { class: 'reprise' },
        h('button', { class: 'bouton-or', onClick: () => lancer({ reprise: encours }) }, `Reprendre : ${encours.titre}, épreuve ${encours.i + 1} sur ${encours.rounds.length}`),
        h('button', { class: 'bouton-lien', onClick: () => { M().enCours = null; sauver(); accueil(); } }, 'Abandonner cette séance')) : null,
      defisEnAttente.length ? h('div', { class: 'defis-attente' }, defisEnAttente.slice(0, 2).map((d) => h('button', { class: 'bouton-or defi-attente', onClick: () => releverDefi(d.id) },
        `${d.pseudo || 'Un ami'} te défie : bats ses ${pct(d.score_auteur)}`))) : null,
      h('button', { class: 'cta brille', onClick: lancerDefi },
        h('span', { class: 'cta-txt' }, h('b', {}, 'Défi du jour'), h('small', { class: 'cta-sous' }, dus ? `5 épreuves, ${pluriel(dus, motFiche())} à revoir` : '5 épreuves, environ 5 minutes')),
        h('span', { class: 'cta-jouer', 'aria-hidden': 'true' }, svg('<svg viewBox="0 0 24 24" width="24" height="24"><path d="M8 5v14l11-7z" fill="currentColor"/></svg>'))),
      ),
    h('section', { class: 'role role-duo' },
      ligneEntree('vers-examen', 'balance', 'Vers l’examen', 'Trois degrés et un partiel blanc', () => aller('examen'), 0),
      ligneEntree('vers-role', 'plan', 'Le rôle', 'Choisis ton exercice', () => aller('role'), 2.2)),
  );
}

const ICONE_MODE = { atelier: 'note', pouvoirs: 'reseau', nuancier: 'nuancier', plume: 'sceau', tri: 'ecarter', mot: 'crayon', rangement: 'colonne', quiadit: 'plume', scanner: 'loupe', memory: 'paires' };
const ligneEntree = (mode, ic, nom, txt, action, d) => h('button', { class: 'role-ligne', 'data-mode': mode, style: `--d:${d}s`, onClick: action },
  h('span', { class: 'role-icone' }, icone(ic, 28)), h('span', { class: 'role-txt' }, h('b', {}, nom), h('small', {}, txt)));
const retourPalais = () => h('button', { class: 'bouton-matiere', onClick: () => { son('retour'); aller('palais'); } }, icone('retour', 18), 'Retour au Palais');

// Le rôle : la liste des exercices, à part du Palais.
function ecranRole() {
  const lignes = Object.entries(nomsModes()).map(([m, [nom, txt]], i) => ligneEntree(m, ICONE_MODE[m] || m, nom, txt, () => (m === 'plan' || m === 'architecte' ? choixGenre(m) : m === 'atelier' ? choixNiveauAtelier() : lancerMode(m)), i * 2.2));
  // En L1, le cas pratique attend la suite du cours (sources du droit, jurisprudence).
  const casL1 = estIntro() ? h('div', { class: 'role-ligne en-travaux', 'data-mode': 'cas-l1', 'aria-disabled': 'true' }, h('span', { class: 'role-icone' }, icone('cas', 28)),
    h('span', { class: 'role-txt' }, h('b', {}, 'Cas pratique'), h('small', {}, 'Bientôt, avec la suite du cours'))) : null;
  montrer(barreHaut(), retourPalais(), h('section', { class: 'role' }, h('h1', {}, 'Le rôle'),
    h('p', { class: 'page-sous' }, 'Choisis ton exercice.'),
    ligneEntree('express', 'prorogation', 'Trois minutes', 'Trois épreuves rapides', lancerExpress, 0),
    lignes, casL1, blocDunk()));
}

// Vers l'examen : un enchaînement facultatif, sans rappel ni compte à rebours.
const NIVEAUX_EXAMEN = [
  { nom: 'Première instance', txt: 'Trois épreuves pour se mettre en route', oblig: ['qualif', 'remede', 'frise'], admin: ['paires', 'puzzle', 'frise'], intro: ['tri', 'memory', 'frise'], constit: ['nuancier', 'memory', 'frise'] },
  { nom: 'Appel', txt: 'Cinq épreuves : cas, plans, et des réponses à écrire soi-même', oblig: ['cas', 'flash', 'trous', 'atelier', 'plaide'], admin: ['puzzle', 'juge', 'flash', 'syllogisme', 'plaide'], intro: ['mot', 'flash', 'quiadit', 'plan', 'scanner'], constit: ['pouvoirs', 'flash', 'quiadit', 'plan', 'plume'], txtIntro: 'Cinq épreuves : une définition à écrire, un plan à choisir' },
  { nom: 'Cassation', txt: 'Six épreuves pour te la mettre vraiment', oblig: ['atelier', 'express', 'cas', 'frise', 'plaide', 'plan'], admin: ['juge', 'architecte', 'express', 'frise', 'syllogisme', 'plaide'], intro: ['rangement', 'flash', 'plan', 'quiadit', 'mot', 'flash'], constit: ['pouvoirs', 'flash', 'plan', 'plume', 'nuancier', 'flash'], txtIntro: 'Six épreuves, dont deux définitions à écrire' },
  { nom: 'Partiel blanc', txt: '20 minutes, une dizaine d’épreuves, puis ton bilan par chambre. Un repère, pas une note', partiel: true,
    oblig: ['qualif', 'cas', 'flash', 'atelier', 'trous', 'remede', 'express', 'plaide', 'frise'], admin: ['paires', 'juge', 'flash', 'syllogisme', 'puzzle', 'express', 'plan', 'plaide', 'frise', 'architecte'],
    intro: ['tri', 'mot', 'flash', 'quiadit', 'memory', 'scanner', 'plan', 'rangement', 'flash', 'frise'],
    constit: ['pouvoirs', 'mot', 'flash', 'quiadit', 'memory', 'plume', 'plan', 'nuancier', 'flash', 'frise'] },
];
function lancerExamen(i) {
  const n = NIVEAUX_EXAMEN[i];
  const zones = zonesCours();
  const dus = aRevoir(ix, zones); const deja = new Set();
  const types = estConstit() ? n.constit : estIntro() ? n.intro : estOblig() ? n.oblig : n.admin;
  // Les épreuves à réponse libre viennent du module d'examen ; à défaut de contenu, une épreuve classique les remplace.
  const tirerBase = (t) => (estL1() && t === 'plan' ? { type: 'plan', ...roundPlan(ix, melange(ix.sujets, Math.random)[0]) } : tirerRound(ix, t, zones, dus, Math.random, deja));
  const tirer = (t) => (['flash', 'plaide', 'trous', 'express', 'syllogisme', 'casnu'].includes(t) ? roundExamen(ix, t, zones, dus, deja) || tirerRound(ix, estL1() ? 'memory' : estOblig() ? 'cas' : 'puzzle', zones, dus, Math.random, deja) : tirerBase(t));
  lancer({ type: n.partiel ? 'partiel' : 'examen', long: i >= 2, titre: `Vers l’examen : ${n.nom.toLowerCase()}`, rounds: types.map(tirer) });
}
function ecranExamen() {
  montrer(barreHaut(), retourPalais(), h('section', { class: 'role' }, h('h1', {}, 'Vers l’examen'),
    h('p', { class: 'page-sous' }, 'Quand tu as envie de te tester. Plus le niveau monte, plus ça se corse.'),
    NIVEAUX_EXAMEN.map((n, i) => ligneEntree(`niveau-${i + 1}`, 'balance', n.nom, (estL1() && n.txtIntro) || n.txt, () => lancerExamen(i), i * 2.2))));
}

// Le mini-jeu, à part des épreuves : il se débloque en boutique.
function blocDunk() {
  const d = etat.dunk;
  // Les obligations puisent dans tout le cours, chapitres en travaux compris.
  const jouer = (mode) => {
    const zones = estOblig() || estL1() ? ix.zones.filter((z) => !z.travaux).map((z) => z.id) : zonesOuvertes(ix);
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
    entete, h('span', { class: 'role-txt' }, h('b', {}, 'Dunk shot'), h('small', {}, d.record ? `Record : ${pluriel(d.record, 'panier')}` : estL1() ? 'Notions, définitions, citations : un panier par bonne réponse' : 'Articles, arrêts, cours : un panier par bonne réponse'),
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
  const types = estConstit() ? ['pouvoirs', 'mot', 'plume'] : estIntro() ? ['tri', 'mot', 'memory'] : estOblig() ? ['qualif', 'remede', 'qualif'] : ['paires', 'puzzle', 'paires'];
  lancer({ type: 'express', titre: 'Trois minutes', rounds: types.map((t) => tirerRound(ix, t, zones, dus, Math.random, deja)) });
}
// L'atelier : trois niveaux, comme les juridictions.
const NIVEAUX_ATELIER = [[1, 'Première instance', 'Un problème, des faits complets'], [2, 'Appel', 'Deux problèmes enchaînés'], [3, 'Cassation', 'Plusieurs problèmes, des faits lacunaires'], [null, 'Au hasard', 'Un cas des chambres ouvertes']];
function choixNiveauAtelier() {
  const voile = h('div', { class: 'voile', onClick: (e) => { if (e.target === voile) voile.remove(); } }, h('div', { class: 'boite boite-genre', role: 'dialog', 'aria-label': 'Niveau du cas' },
    h('h2', {}, 'L’atelier du cas pratique'), h('p', {}, 'Quel niveau ?'),
    h('div', { class: 'boite-actions' },
      NIVEAUX_ATELIER.map(([n, nom, txt]) => h('button', { class: n ? 'bouton-or at-niveau' : 'bouton-fantome', 'data-niveau': n || 'hasard', onClick: () => { voile.remove(); lancer({ type: 'mode', mode: 'atelier', titre: `L’atelier du cas pratique${n ? `, ${nom.toLowerCase()}` : ''}`, rounds: [tirerAtelier(ix, zonesCours(), n)] }); } }, h('b', {}, nom), h('small', {}, txt))),
      h('button', { class: 'bouton-lien', onClick: () => voile.remove() }, 'Fermer'))));
  document.body.append(voile);
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
  let zones = zonesCours();
  let source = ix;
  if (genre) {
    // Un type choisi puise dans toutes les chambres ouvertes, pour toujours trouver un sujet.
    const ouvertes = estOblig() ? zones : zonesOuvertes(ix);
    const sujets = ix.sujets.filter((s) => s.type === genre && s.zones.some((z) => ouvertes.includes(z)));
    if (sujets.length) { source = { ...ix, sujets }; zones = ouvertes; }
  }
  const dus = aRevoir(ix, zones);
  const n = m === 'paires' || m === 'qualif' ? 3 : estL1() ? (['quiadit', 'scanner', 'pouvoirs', 'nuancier'].includes(m) ? 1 : 2) : 2;
  const deja = new Set();
  const titre = nomsModes()[m][0] + (genre && source !== ix ? (genre === 'C' ? ', commentaire' : ', dissertation') : '');
  lancer({ type: 'mode', mode: m, titre, rounds: Array.from({ length: n }, () => tirerRound(source, m, zones, dus, Math.random, deja)) });
}

// SÉANCE ------------------------------------------------------------------------
const DUREE_PARTIEL = 20 * 60000;
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
  const chrono = h('div', { class: 'chrono-partiel', 'aria-live': 'off' });
  const entete = h('header', { class: 'entete-seance' }, quitter, pips, S.vies !== null ? vies : type === 'partiel' ? chrono : compteur);
  // Partiel blanc : 20 minutes au total, la séance s'arrête net à la fin du temps.
  if (type === 'partiel') {
    S.debut ||= Date.now();
    const tic = setInterval(() => {
      if (!chrono.isConnected && document.querySelector('.resultats, .palais')) { clearInterval(tic); return; }
      const reste = Math.max(0, DUREE_PARTIEL - (Date.now() - S.debut));
      const mn = Math.floor(reste / 60000); const sec = Math.floor((reste % 60000) / 1000);
      chrono.textContent = `${mn}:${String(sec).padStart(2, '0')}`;
      chrono.classList.toggle('presse', reste < 120000);
      if (reste === 0) { clearInterval(tic); S.nettoyer.forEach((f) => f()); S.nettoyer = []; S.tempsEcoule = true; finir(true); }
    }, 1000);
  }

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
      // En appel, des points seulement : rater exprès ne doit rien rapporter.
      if (S.type !== 'appel') S.jetons += res.score >= 0.8 ? PIECES_EPREUVE : res.score >= 0.4 ? 1 : 0;
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
    setTimeout(() => bulleExercice(r.type), 900);
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

// Bilan du partiel blanc : ce qui a été réussi, chambre par chambre, d'après les fiches touchées.
function bilanPartiel(S) {
  const parZone = new Map();
  for (const [id, t] of S.touches) {
    const a = ix.parId.get(id); if (!a) continue;
    const z = a.zones?.[0]; if (z === undefined) continue;
    const c = parZone.get(z) || { ok: 0, ko: 0 }; c.ok += t.ok; c.ko += t.ko; parZone.set(z, c);
  }
  const lignes = [...parZone.entries()].sort((x, y) => x[0] - y[0]);
  const joue = S.scores.length; const total = S.rounds.length;
  return h('section', { class: 'res-bilan' }, h('h2', {}, 'Bilan par chambre'),
    S.tempsEcoule ? h('p', { class: 'res-texte' }, `Temps écoulé : ${joue} épreuve${joue > 1 ? 's' : ''} sur ${total}.`) : null,
    lignes.length ? h('ul', {}, lignes.map(([z, c]) => {
      const p = Math.round((c.ok / (c.ok + c.ko || 1)) * 100);
      const nom = ix.zones.find((x) => x.id === z)?.titre || `Chambre ${z}`;
      return h('li', { class: p >= 70 ? 'solide' : p >= 40 ? 'moyen' : 'fragile' }, h('span', {}, nom), h('b', {}, `${p} %`), h('i', { style: `--p:${p}%` }));
    })) : h('p', { class: 'res-texte' }, 'Pas assez de réponses pour un bilan.'),
    h('p', { class: 'res-texte discret' }, 'Un repère pour savoir où travailler, pas une note.'));
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
    S.type === 'partiel' ? bilanPartiel(S) : null,
    aRevoirListe.length ? h('section', { class: 'res-revoir' }, h('h2', {}, 'À revoir'),
      h('ul', {}, aRevoirListe.slice(0, 6).map((a) => h('li', {}, h('button', { onClick: () => { afficherOnglets(true); ongletCourant = 'arrets'; fiche(a.id); } }, h('b', {}, a.court), a.an ? ` ${a.an}` : ` ${a.titre}`))))) : null,
    h('div', { class: 'pied' },
      S.type !== 'appel' && aRevoirListe.length ? h('button', { class: 'bouton-or', 'data-appel': '', onClick: () => faireAppel(aRevoirListe.map((a) => a.id)) }, 'Faire appel') : null,
      continuer('Retour au Palais', () => aller('palais')),
      S.type === 'boss' && !reussi ? h('button', { class: 'bouton-lien', onClick: () => lancerBoss(S.zone) }, 'Retenter l’audience') : null,
      connecte() ? h('button', { class: 'bouton-lien', onClick: () => faireRetour(`Résultats : ${S.titre}`) }, 'Faire un retour') : null),
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
// Les chambres : un chemin épuré. Les sceaux sur le chemin, les noms alignés à droite, la chambre en cours mise en avant.
const XS = [70, 110]; const H_SALLE = 104; const H_COURANTE = 176;
function carte() {
  const ouvertes = zonesOuvertes(ix);
  const gagnees = M().zones.gagnees;
  const parcours = ix.zones.filter((z) => !z.bonus && !z.travaux);
  const enCours = (etat.reglages.toutOuvert ? parcours.find((z) => !gagnees.includes(z.id)) : [...parcours].reverse().find((z) => ouvertes.includes(z.id) && !gagnees.includes(z.id)))?.id;
  let y = 0;
  const pts = ix.zones.map((z, i) => { const hh = z.id === enCours ? H_COURANTE : H_SALLE; const pt = { x: z.id === enCours ? 128 : XS[i % 2], y: y + hh / 2, top: y, hh }; y += hh; return pt; });
  const hauteur = y + 10;
  const chemin = (jusque) => pts.slice(0, jusque + 1).map((pt, i) => (i === 0 ? `M${pt.x} ${pt.y}` : `C${pts[i - 1].x} ${pts[i - 1].y + (pt.y - pts[i - 1].y) / 2},${pt.x} ${pts[i - 1].y + (pt.y - pts[i - 1].y) / 2},${pt.x} ${pt.y}`)).join('');
  const iCourant = ix.zones.findIndex((z) => z.id === enCours);
  const iDernierOuvert = ix.zones.reduce((m, z, i) => (ouvertes.includes(z.id) ? i : m), 0);
  const voies = `<svg class="voies" width="100%" height="${hauteur}" aria-hidden="true"><path class="voie loin" d="${chemin(pts.length - 1)}"/><path class="voie faite" pathLength="1" d="${chemin(iCourant >= 0 ? iCourant : iDernierOuvert)}"/></svg>`;
  const salles = ix.zones.map((z, i) => {
    const p = progressionZone(z.id); const pt = pts[i];
    const ouvert = ouvertes.includes(z.id); const gagne = gagnees.includes(z.id); const courante = z.id === enCours;
    const etatTxt = z.travaux ? 'En travaux' : !ouvert ? 'Fermée' : gagne ? 'Audience gagnée' : `${p.acquis} ${motFiche()}s sur ${p.total}`;
    const marque = courante
      ? h('span', { class: 'salle-marque', style: `--part:${p.total ? p.acquis / p.total : 0}` }, h('span', {}, String(z.id)))
      : h('span', { class: 'salle-marque' }, !ouvert ? icone('cadenas', 22) : z.travaux ? icone('travaux', 22) : h('span', {}, z.bonus ? '+' : String(z.id)));
    return h('li', { class: `salle ${ouvert ? 'ouverte' : 'fermee'} ${gagne ? 'gagnee' : ''} ${courante ? 'courante' : ''}`, style: `top:${pt.top}px;height:${pt.hh}px;--x:${pt.x}px;--d:${i * 0.06}s` },
      h('button', { onClick: () => { son('tap'); if (ouvert) chambre(z.id); else chambreFermee(z); }, 'aria-label': `${z.titre}, ${etatTxt}` },
        marque,
        h('span', { class: 'salle-txt' }, h('b', {}, z.titre), h('small', { class: 'salle-compte' }, etatTxt),
          courante ? h('span', { class: 'salle-entrer' }, 'Ouvrir la chambre') : null)),
      courante ? chouette('assise', { taille: 80, vivante: true, classe: 'salle-lexou' }) : null);
  });
  const plan = h('div', { class: 'parcours', style: `height:${hauteur}px` }, h('div', { html: voies }), h('ol', {}, salles));
  const audiences = gagnees.filter((id) => parcours.some((z) => z.id === id)).length;
  montrer(barreHaut(), h('section', { class: 'page page-chambres' },
    h('div', { class: 'chambres-tete' }, h('h1', {}, 'Chambres'), h('span', {}, `${audiences} audience${audiences > 1 ? 's' : ''} sur ${parcours.length}`)),
    h('p', { class: 'page-sous' }, estConstit() ? `${matiereDe(etat.matiere).nom}, ${ETIQUETTE_CONSTIT}` : estIntro() ? matiereDe(etat.matiere).nom : `${matiereDe(etat.matiere).nom}, équipe ${etat.equipe}`), plan));
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
  if (estL1()) {
    const dispo = melange(typesIntro(ix, [z]).filter((t) => t !== 'memory'), Math.random);
    lancer({ type: 'zone', titre: 'Révision', zone: z, rounds: ['memory', dispo[0], dispo[1] || 'mot'].map((t) => tirerRound(ix, t, [z], dus, Math.random, deja)) });
    return;
  }
  const base = estOblig() ? 'qualif' : 'paires';
  const types = melange(estOblig() ? ['cas', 'remede', 'frise'] : ['puzzle', 'juge', 'plan'], Math.random);
  lancer({ type: 'zone', titre: 'Révision', zone: z, rounds: [base, types[0], base].map((t) => tirerRound(ix, t, [z], dus, Math.random, deja)) });
}

// Arrêts par date, articles par numéro.
const ordreFiches = (a, b) => (a.article && b.article ? parseFloat(a.num.replace('-', '.')) - parseFloat(b.num.replace('-', '.')) : a.article ? 1 : b.article ? -1 : a.an - b.an);
const ICONES_NIVEAU = [null, 'note', 'crayon', 'plume', 'balance', 'laurier'];
// La maîtrise d'une fiche : cinq points et le nom du palier.
const niveauTag = (b) => h('span', { class: 'niveau', 'aria-label': `Maîtrise : ${TITRES_CARTE[b]}, ${b} sur 5` }, h('span', { class: 'pips-maitrise', 'aria-hidden': 'true' }, [1, 2, 3, 4, 5].map((k) => h('i', { class: k <= b ? 'p' : '' }))), TITRES_CARTE[b]);
const carteArret = (a) => {
  const b = niveau(a.id);
  return h('li', {}, h('button', { class: `carte-arret n${b}`, onClick: () => fiche(a.id) },
    h('span', { class: `carte-an${a.notion ? ' carte-etiquette' : ''}` }, a.article ? (a.etiquette || a.num.replace(/^1242-/, '1242 al. ')) : a.an), h('i', { class: 'losange', 'aria-hidden': 'true' }), h('b', {}, a.article ? a.titre : a.court),
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
  const articles = (estOblig() && filtre.type === 'articles') || estL1();
  const champ = h('input', { type: 'search', class: 'recherche', placeholder: estL1() ? 'Chercher une notion ou un auteur' : articles ? 'Chercher un article ou un mot' : 'Chercher un arrêt ou une année', value: filtre.texte, 'aria-label': 'Chercher', onInput: (e) => { filtre.texte = e.target.value; rendre(); } });
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
  montrer(barreHaut(), h('section', { class: 'page' }, h('h1', {}, estL1() ? 'Les notions' : articles ? 'Les articles' : 'Les arrêts'),
    h('p', { class: 'page-sous' }, estL1() ? `${fmt(acquisArticles)} sur ${ix.articles.length} au niveau Conclusions. Chaque notion monte quand tu la réussis.` : articles ? `${fmt(acquisArticles)} sur ${ix.articles.length} au niveau Conclusions. Chaque carte monte quand tu réussis.` : `${pluriel(acquis, 'grand arrêt')} sur ${ix.arrets.length}. Chaque carte monte de niveau quand tu réussis.`),
    lienCarnet(),
    bascule, h('label', { class: 'cherche' }, icone('loupe', 22), champ), h('div', { class: 'filtres' }, zonesBtns), grille));
  rendre();
}

function lienCarnet() {
  const n = erreursOuvertes().length;
  return h('div', { class: 'entrees-arrets' },
    h('button', { class: 'entree-carnet', 'data-carnet': '', onClick: () => aller('carnet') },
      h('b', {}, 'Carnet d’erreurs'), h('span', {}, n ? pluriel(n, 'erreur ouverte', 'erreurs ouvertes') : 'Aucune erreur ouverte')),
    h('button', { class: 'entree-carnet', 'data-lexique': '', onClick: () => aller('lexique') },
      h('b', {}, 'Lexique'), h('span', {}, `${pluriel((ix.lexique || []).length, 'terme')} expliqués`)));
}

// LE LEXIQUE : les termes juridiques de la matière, et les mots du jeu avec leur effet.
const motsDuJeu = () => [
  ['Défi du jour', 'Une séance courte choisie pour toi. Réussie, elle pose ton sceau et fait grandir ta série.'],
  ['Sceau', `Posé quand le Défi du jour est réussi à ${Math.round(SCEAU_REUSSITE * 100)} %, ou quand ${SCEAU_FICHES} fiches sont reprises.`],
  ['Série', 'Le nombre de jours d’affilée avec au moins une séance, dans l’une ou l’autre matière.'],
  ['Audience', 'Une épreuve qui ouvre la chambre suivante.'],
  ['Le rôle', 'La liste des exercices, à choisir toi-même.'],
  ['Vers l’examen', 'Des séances plus longues, en trois degrés : Première instance, Appel, Cassation. Et un partiel blanc de 20 minutes.'],
  ['Dossier clos', `Une fiche maîtrisée : ${monnaie(PRIME_MAITRISE)} offerts, une seule fois par fiche.`],
  ['Faire appel', 'Rejouer tes erreurs sous une autre forme. Des points, pas de jetons.'],
  ...BOUTIQUE.filter((b) => !b.admin || !estOblig()).map((b) => [b.nom, b.txt]),
];
function ecranLexique() {
  const termes = [...(ix.lexique || [])].sort((a, b) => a.t.localeCompare(b.t, 'fr'));
  const champ = h('input', { type: 'search', class: 'recherche', placeholder: 'Chercher un terme', 'aria-label': 'Chercher un terme' });
  const liste = h('dl', { class: 'lexique' });
  const norm = (x) => x.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const rendre = () => { const q = norm(champ.value); liste.replaceChildren(...termes.filter((t) => !q || norm(`${t.t} ${t.d}`).includes(q)).map((t) => h('div', {}, h('dt', {}, t.t), h('dd', {}, t.d)))); };
  champ.addEventListener('input', rendre);
  montrer(barreHaut(), h('button', { class: 'bouton-matiere', onClick: () => aller('arrets') }, icone('retour', 18), 'Les arrêts'), h('section', { class: 'page' },
    h('h1', {}, 'Lexique'),
    h('p', { class: 'page-sous' }, 'Dans les exercices, ces termes sont soulignés en pointillé : touche-les pour leur définition.'),
    h('label', { class: 'cherche' }, icone('loupe', 22), champ), liste,
    h('h2', {}, 'Les mots du jeu'),
    h('dl', { class: 'lexique' }, motsDuJeu().map(([t, d]) => h('div', {}, h('dt', {}, t), h('dd', {}, d))))));
  rendre();
}

// LE CARNET D'ERREURS : par chambre, les plus fréquentes en haut, jusqu'à leur correction.
function ecranCarnet() {
  const j = jour();
  const liste = carnetVisible().filter((e) => ix.parId.get(e.id)).sort((a, b) => (a.corrige ? 1 : 0) - (b.corrige ? 1 : 0) || b.n - a.n || b.dernier - a.dernier);
  const ouvertes = liste.filter((e) => !e.corrige);
  const parZone = new Map();
  for (const e of ouvertes) { const z = ix.parId.get(e.id).zones[0]; parZone.set(z, (parZone.get(z) || 0) + 1); }
  const zonesTxt = [...parZone.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([z, n]) => `${pluriel(n, 'erreur')} en ${ix.zones.find((x) => x.id === z)?.titre || `chambre ${z}`}`);
  const fiches = M().arrets;
  const ligne = (e) => {
    const a = ix.parId.get(e.id);
    const conf = Object.entries(fiches[e.id]?.c || {}).sort((x, y) => y[1] - x[1])[0];
    const avec = conf && ix.parId.get(conf[0]);
    const quandTxt = j - e.dernier === 0 ? 'aujourd’hui' : j - e.dernier === 1 ? 'hier' : `il y a ${j - e.dernier} jours`;
    const apport = a.article ? a.titre : (a.ap[a.zones[0]] || Object.values(a.ap)[0]);
    return h('li', {}, h('button', { class: `article carnet-ligne${e.corrige ? ' corrige' : ''}`, onClick: () => { ongletCourant = 'arrets'; fiche(e.id); } }, h('div', {},
      h('b', {}, a.article ? a.nom : `${a.court}, ${a.an}`),
      h('p', {}, apport),
      h('small', {}, e.corrige ? 'Corrigée' : `${e.n > 1 ? `Ratée ${e.n} fois` : 'Ratée une fois'}, la dernière ${quandTxt}${avec ? `. Confondue avec ${avec.article ? avec.nom : avec.court}` : ''}.`))));
  };
  montrer(barreHaut(), h('button', { class: 'bouton-matiere', onClick: () => aller('arrets') }, icone('retour', 18), 'Les arrêts'), h('section', { class: 'page carnet' },
    h('h1', {}, 'Carnet d’erreurs'),
    h('p', { class: 'page-sous' }, ouvertes.length ? `${pluriel(ouvertes.length, 'erreur ouverte', 'erreurs ouvertes')}. Une erreur sort du carnet après deux réussites sur deux jours différents, ou un appel gagné.` : 'Aucune erreur ouverte. Celles que tu commettras s’afficheront ici jusqu’à leur correction.'),
    zonesTxt.length ? h('p', { class: 'aide-claire' }, `${zonesTxt.join(', ')}.`) : null,
    ouvertes.length ? h('button', { class: 'cta', 'data-appel-carnet': '', onClick: () => faireAppel(ouvertes.map((e) => e.id)) }, 'Faire appel sur mes erreurs') : null,
    liste.length ? h('ul', { class: 'articles' }, liste.map(ligne)) : chouette('echelle', { taille: 150 })));
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
  if (a.notion) {
    montrer(
      h('header', { class: 'haut-simple' }, h('button', { class: 'quitter', 'aria-label': 'Retour', onClick: () => aller(ongletCourant) }, icone('retour', 22)), niveauTag(niveau(a.id))),
      h('article', { class: 'fiche fiche-notion' },
        h('div', { class: 'revelation-tete' }, h('div', {}, h('h1', {}, a.nom), h('p', { class: 'ref' }, `${a.etiquette}, ${z.titre}`))),
        h('p', { class: 'apport' }, a.regle),
        a.ex ? h('p', { class: 'notion-ex' }, h('b', {}, 'Exemple du cours. '), a.ex) : null,
        a.pg ? h('p', { class: 'notion-piege' }, h('b', {}, 'Le piège. '), a.pg) : null,
        h('p', { class: 'aide-claire' }, 'Tiré de ton cours d’introduction au droit. Une erreur ? Signale-la.'),
        boutonSignaler(a.id, a.nom)));
    return;
  }
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
  // Un sélecteur qui reste en haut : chaque bouton amène à sa section, le rayon visible s'allume.
  const RAYONS = [['skins', 'Skins'], ['garde-robe', 'Garde-robe'], ['tenues', 'Tenues'], ['decors', 'Décors'], ['insignes', 'Insignes'], ['aides', 'Aides']];
  const segments = h('nav', { class: 'segments', 'aria-label': 'Rayons de la boutique' }, RAYONS.map(([id, nom], i) => h('button', { class: i === 0 ? 'actif' : '', 'data-rayon': id, onClick: () => { son('tap'); document.getElementById(`rayon-${id}`)?.scrollIntoView({ behavior: effets() ? 'smooth' : 'auto', block: 'start' }); } }, nom)));
  const rayon = (id, titre, ...contenu) => h('section', { class: 'rayon', id: `rayon-${id}` }, h('h2', {}, titre), contenu);
  montrer(barreHaut(), h('section', { class: 'page page-boutique' }, h('h1', {}, 'La boutique'),
    h('p', { class: 'page-sous' }, estRose() ? 'Tes canettes de Ratio se gagnent en finissant des épreuves.' : 'Tes jetons de présence se gagnent en finissant des épreuves.'),
    segments,
    rayon('skins', 'Skins de Lexou', skinsDuHibou()),
    rayon('garde-robe', 'Garde-robe de Lexou', gardeRobe()),
    rayon('tenues', 'Tenues de l’appli', h('p', { class: 'aide-claire' }, 'Une tenue change les couleurs de toute l’appli, jamais la place des choses.'), h('ul', { class: 'articles' }, themes)),
    rayon('decors', 'Décors du Palais', h('p', { class: 'aide-claire' }, 'Chaque décor change le fond du Palais et un détail de l’interface.'), h('ul', { class: 'articles' }, decors)),
    rayon('insignes', 'Insignes', h('p', { class: 'aide-claire' }, 'À côté de ton grade et au classement de tes amis.'), h('ul', { class: 'articles' }, insignes)),
    rayon('aides', 'Aides', h('ul', { class: 'articles' }, miniJeux()), h('ul', { class: 'articles' }, objets))));
  if ('IntersectionObserver' in window) {
    const obs = new IntersectionObserver((entrees) => { for (const e of entrees) if (e.isIntersecting) { const id = e.target.id.replace('rayon-', ''); segments.querySelectorAll('button').forEach((b) => b.classList.toggle('actif', b.dataset.rayon === id)); } }, { rootMargin: '-30% 0px -60% 0px' });
    document.querySelectorAll('.rayon').forEach((r) => obs.observe(r));
  }
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

// TA PROGRESSION : les trois échelles, et ce qui fait monter chacune.
function ecranProgression() {
  const r = rang(); const g = rangGeneral(); const m = matiereDe(etat.matiere);
  const vals = Object.values(M().arrets);
  const parPalier = [0, 1, 2, 3, 4, 5].map((b) => vals.filter((a) => (a.b || 0) === b).length);
  const echelle = (rangs, actuel) => h('ol', { class: 'carriere' }, rangs.map((x, i) => h('li', { class: `${i <= actuel.i ? 'atteint' : ''} ${i === actuel.i ? 'actuel' : ''}`, style: `--i:${i}` }, x.nom, h('small', {}, `${fmt(x.xp)} points`))));
  montrer(barreHaut(), h('button', { class: 'bouton-matiere', onClick: () => aller('profil') }, icone('retour', 18), 'Profil'), h('section', { class: 'page progression' },
    h('h1', {}, 'Ta progression'),
    h('p', { class: 'page-sous' }, 'Trois mesures, chacune avec son rôle.'),
    h('h2', {}, `Ta carrière : ${m.institution}`),
    h('p', {}, r.suivant ? `${r.nom}, ${fmt(r.xp)} points. Encore ${fmt(r.suivant.xp - r.xp)} avant ${r.suivant.nom}.` : `${r.nom} : sommet atteint.`),
    h('p', { class: 'aide-claire' }, 'Chaque matière a sa carrière. Tu gagnes des points à chaque séance, plus avec une bonne réussite. C’est le grade affiché en haut de l’écran.'),
    echelle(m.rangs, r),
    h('h2', {}, 'La maîtrise de chaque fiche'),
    h('p', { class: 'aide-claire' }, 'Chaque arrêt ou article monte d’un palier quand tu le réussis sans aide un jour où il est à revoir : au plus une fois par jour, et de plus en plus espacé. Une erreur le bloque jusqu’au lendemain.'),
    h('ul', { class: 'paliers' }, TITRES_CARTE.map((t, b) => b === 0 ? null : h('li', {}, niveauTag(b), h('span', {}, pluriel(parPalier[b], 'fiche'))))),
    h('p', { class: 'aide-claire' }, `Au palier Délibéré, après quatre montées sur quatre jours, la fiche est close : ${monnaie(PRIME_MAITRISE)} offerts.`),
    h('h2', {}, 'Ton parcours universitaire'),
    h('p', {}, g.suivant ? `${g.nom}, ${fmt(g.xp)} points dans les deux matières. Encore ${fmt(g.suivant.xp - g.xp)} avant ${g.suivant.nom}.` : `${g.nom} : dernier titre atteint.`),
    echelle(RANGS_GENERAL, g),
    h('h2', {}, 'Vers l’examen'),
    h('p', { class: 'aide-claire' }, 'Trois degrés de difficulté, au choix, sans rien à débloquer : Première instance pour se mettre en route, Appel pour les cas et les plans, Cassation pour les épreuves les plus longues. Le partiel blanc dure 20 minutes et finit par un bilan chambre par chambre.')));
}

let carriereVue = null;
function profil() {
  const vue = carriereVue && matieresAnnee().some((m) => m.id === carriereVue) ? carriereVue : etat.matiere;
  const r = rang(vue); const g = rangGeneral(); const vals = Object.values(M(vue).arrets);
  const stats = [['Séances', etat.stats.seances], ['Record de série', etat.serie.record], ['Sans faute', etat.stats.parfaites], ['Grands arrêts', vals.filter((a) => a.b >= 5).length], ['Meilleur enchaînement', etat.stats.comboMax], [vue === 'oblig' ? 'Fiches vues' : 'Arrêts vus', vals.length], ...(etat.dunk.cinq ? [['Record Dunk shot', etat.dunk.record]] : [])];
  const liste = (vue === 'intro' || vue === 'constit' ? CONTENUS[vue]?.articles : CONTENUS[vue]?.arrets) || []; const fichesVue = M(vue).arrets || {};
  const grands = liste.length ? liste.filter((a) => fichesVue[a.id]?.b >= 5).length : vals.filter((a) => a.b >= 5).length;
  const vus = liste.length ? liste.filter((a) => fichesVue[a.id]).length : vals.length; const totalArrets = liste.length || vals.length;
  const serieDuJour = etat.serie.dernier >= jour() - 1 ? etat.serie.n : 0;
  const blocRappel = h('div', { class: 'rappel' });
  // Le rappel de Lexou : activé ici, à l'heure choisie, envoyé par le serveur.
  async function rendreRappel() {
    if (!connecte()) { blocRappel.replaceChildren(h('p', {}, 'Connecte-toi pour recevoir le rappel de Lexou.')); return; }
    if (!estInstallee()) { blocRappel.replaceChildren(h('p', {}, 'Le rappel fonctionne une fois l’appli ajoutée à l’écran d’accueil.'), guideInstallation()); return; }
    if (await etatRappel() === 'refuse') { blocRappel.replaceChildren(h('p', {}, 'Les notifications sont bloquées. Autorise-les dans Réglages, Notifications, Gdroit.')); return; }
    let prof; try { prof = await monProfil(); } catch { blocRappel.replaceChildren(h('p', {}, 'Il faut du réseau pour régler le rappel.')); return; }
    const r = { actif: false, heure: 9, ...(prof?.rappel || {}) };
    const heure = h('select', { class: 'code', 'aria-label': 'Heure du rappel', onChange: async (e) => { r.heure = +e.target.value; try { await reglerProfil({ rappel: r }); toast(`Rappel à ${r.heure} h.`); } catch { toast('Pas de connexion.'); } } },
      Array.from({ length: 16 }, (_, k) => k + 7).map((hh) => h('option', { value: hh, selected: hh === r.heure }, `${hh} h`)));
    const inter = h('label', { class: 'reglage' }, h('span', {}, 'Rappel de Lexou'), h('input', { type: 'checkbox', role: 'switch', checked: r.actif, onChange: async (e) => {
      const c = e.target;
      try {
        if (c.checked) { await activerRappel(); const ab = await abonnementActuel(); if (!ab) throw new Error('Notifications refusées.'); await inscrireAppareil(ab); }
        r.actif = c.checked; await reglerProfil({ rappel: r }); toast(c.checked ? `Lexou t’écrira vers ${r.heure} h.` : 'Rappel coupé.');
      } catch (err) { c.checked = !c.checked; toast(err.message || 'Pas de connexion.'); }
    } }));
    blocRappel.replaceChildren(inter, h('div', { class: 'rappel-heure' }, h('span', {}, 'Vers'), heure),
      h('p', { class: 'aide-claire' }, 'Un message par jour, jamais quand ton sceau est déjà posé. Après dix jours d’absence, Lexou se calme : une fois par semaine, puis plus rien.'));
  }
  const pct = Math.round(r.part * 100);
  montrer(barreHaut(), h('section', { class: 'page page-profil' },
    h('div', { class: 'profil-tete' }, chouette('assise', { taille: 150, vivante: true })),
    h('h1', {}, r.nom),
    h('div', { class: 'xp', role: 'img', 'aria-label': `${pct} % du grade suivant` }, h('span', {}, 'XP'), h('span', { class: 'xp-rail' }, h('i', { style: `width:${Math.max(pct, 3)}%` }))),
    h('p', { class: 'page-sous xp-txt' }, r.suivant ? `${fmt(r.xp)} points. Encore ${fmt(r.suivant.xp - r.xp)} pour devenir ${r.suivant.nom}.` : 'Dernier grade atteint.'),
    matieresAnnee().length > 1 ? h('div', { class: 'bascule' }, matieresAnnee().map((m) => h('button', { class: vue === m.id ? 'actif' : '', onClick: () => { son('tap'); carriereVue = m.id; profil(); } }, m.institution))) : null,
    h('ol', { class: 'carriere' }, matiereDe(vue).rangs.map((x, i) => h('li', { class: `${i <= r.i ? 'atteint' : ''} ${i === r.i ? 'actuel' : ''}`, style: `--i:${i}` }, x.nom))),
    h('button', { class: 'bouton-fantome', onClick: () => aller('progression') }, 'Comprendre ma progression'),
    h('button', { class: 'bouton-lien', onClick: () => priseEnMain(true) }, 'Revoir la prise en main'),
    h('div', { class: 'general' },
      h('p', {}, 'Carrière générale'), h('strong', {}, g.nom),
      h('span', { class: 'jauge', 'aria-hidden': 'true' }, h('i', { style: `transform:scaleX(${g.part.toFixed(3)})` })),
      h('small', {}, g.suivant ? `${fmt(g.xp)} points cumulés. Encore ${fmt(g.suivant.xp - g.xp)} pour devenir ${g.suivant.nom}.` : `${RANGS_GENERAL.at(-1).nom} : dernier titre atteint.`)),
    h('h2', {}, 'Tes chiffres'),
    h('dl', { class: 'stats-cle' },
      h('div', { class: 'cle-serie' }, h('dd', {}, fmt(serieDuJour)), h('dt', {}, serieDuJour > 1 ? 'jours de série' : 'jour de série')),
      h('div', {}, h('dd', {}, fmt(etat.stats.seances)), h('dt', {}, etat.stats.seances > 1 ? 'séances' : 'séance')),
      h('div', {}, h('dd', {}, fmt(grands)), h('dt', {}, vue === 'intro' || vue === 'constit' ? 'notions sues' : 'grands arrêts'))),
    h('div', { class: 'maitrise', role: 'img', 'aria-label': `${grands} arrêts maîtrisés sur ${totalArrets}` },
      h('span', { class: 'maitrise-ligne' }, h('span', {}, vue === 'intro' || vue === 'constit' ? 'Notions maîtrisées' : 'Arrêts maîtrisés'), h('b', {}, `${grands} sur ${totalArrets}`)),
      h('span', { class: 'maitrise-rail' }, h('i', { class: 'vu', style: `width:${totalArrets ? (vus / totalArrets) * 100 : 0}%` }), h('i', { style: `width:${totalArrets ? (grands / totalArrets) * 100 : 0}%` })),
      h('small', {}, `${fmt(vus)} déjà vus, ${fmt(grands)} sus par cœur.`)),
    h('dl', { class: 'stats' }, stats.filter(([l]) => !['Séances', 'Grands arrêts', 'Arrêts vus', 'Fiches vues'].includes(l)).map(([l, v]) => h('div', {}, h('dt', {}, l), h('dd', {}, fmt(v))))),
    h('details', { class: 'tiroir-trophees' },
      h('summary', {}, h('span', {}, 'Trophées'), h('small', {}, `${TROPHEES.filter((t) => etat.trophees[t.id]).length} sur ${TROPHEES.length}`)),
      h('ul', { class: 'trophees' }, TROPHEES.map((t) => { const g = !!etat.trophees[t.id]; return h('li', {}, h('button', { 'aria-label': `${t.nom}, ${g ? 'gagné' : 'à gagner'}`, onClick: () => montrerTrophee(t, g) }, medaille(metalDe(t.id), g))); }))),
    h('h2', {}, 'Rappel quotidien'), blocRappel,
    h('h2', {}, 'Images personnelles'), blocImages(),
    h('h2', {}, 'Ton année'),
    h('div', { class: 'bascule', 'data-annees': '' }, ['L1', 'L2', 'L3'].map((a) => h('button', { class: etat.annee === a ? 'actif' : '', disabled: a === 'L3', 'aria-pressed': etat.annee === a ? 'true' : 'false', onClick: () => { if (etat.annee === a) return; son('tap'); if (a === 'L1') ecranEquipeL1(); else { choisirAnnee('L2'); if (estL1()) { etat.matiere = 'admin'; ix = CONTENUS.admin; filtre = { texte: '', zone: 0, type: 'arrets' }; sauver(); } carriereVue = null; profil(); } } }, a === 'L3' ? 'L3 bientôt' : a))),
    etat.annee === 'L1' ? [h('h2', {}, 'Ton équipe de L1'),
      h('div', { class: 'bascule', 'data-equipes-l1': '' }, EQUIPES_L1.filter((e) => e.pret).map((e) => h('button', { class: etat.equipeL1 === e.n ? 'actif' : '', 'aria-pressed': etat.equipeL1 === e.n ? 'true' : 'false', onClick: () => { if (etat.equipeL1 === e.n) return; son('tap'); choisirAnnee('L1', e.n); filtre = { texte: '', zone: 0, type: 'arrets' }; indexerIntro(); if (estIntro() && !introOuverte()) { etat.matiere = 'constit'; sauver(); } if (estL1()) ix = CONTENUS[etat.matiere]; toast(`Équipe ${e.n} : tes chambres et tes exercices sont prêts.`); profil(); } }, `Équipe ${e.n}`))),
      h('p', { class: 'aide-claire' }, 'L’introduction au droit suit le cours de ton équipe (2 ou 3). Le droit constitutionnel est le même pour tous. Tes notions communes, tes pièces et ta série te suivent.')] : null,
    etat.annee === 'L1' ? null : h('h2', {}, 'Ton équipe de L2'),
    etat.annee === 'L1' ? null : h('div', { class: 'bascule' }, [1, 2].map((n) => h('button', { class: etat.equipe === n ? 'actif' : '', 'aria-pressed': etat.equipe === n ? 'true' : 'false', onClick: () => { if (etat.equipe === n) return; son('tap'); rejoindreEquipe(n); toast(`Équipe ${n} : tes chambres et tes exercices sont prêts.`); profil(); } }, `Équipe ${n}`))),
    etat.annee === 'L1' ? null : h('p', { class: 'aide-claire' }, 'Le droit administratif et le droit des obligations suivent le cours de ton équipe. Tes pièces, ta série, tes tenues et les fiches communes te suivent.'),
    h('h2', {}, 'Réglages'),
    h('div', { class: 'reglages' },
      interrupteur('Sons', 'son'),
      interrupteur('Sons même en mode silencieux', 'sonSilencieux', appliquerSession),
      interrupteur('Effets visuels', 'effets', appliquerTheme),
      interrupteur('Retour tactile', 'vibration', () => vibrer(16)),
      interrupteur('Ouvrir toutes les chambres', 'toutOuvert')),
    h('button', { class: 'bouton-fantome ecouter', onClick: () => son('grade') }, icone('son', 18), 'Écouter la signature sonore'),
    blocSignalements(),
    h('h2', {}, 'Compte'),
    connecte() ? blocCompte() : h('p', { class: 'aide-claire' }, 'Connecte-toi pour retrouver ta progression sur un autre téléphone.'),
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
    h('button', { class: 'bouton-fantome', 'data-retour': '', onClick: () => faireRetour('Profil') }, 'Faire un retour'),
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
  place_testeur: () => 'Une place s’est libérée : tu as maintenant accès à Gdroit.',
  maj_appli: (n) => n.donnees?.titre || 'Une nouvelle version de Gdroit est disponible.',
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

  const insigneDe = (r) => (r?.insigne && r.insigne !== 'aucun' && INSIGNES.some((t) => t.id === r.insigne) ? h('span', { class: 'insigne-ami' }, icone(r.insigne, 15)) : null);
  // Le classement de la semaine : toi et tes amis, remis à zéro chaque lundi.
  const moiR = monResume();
  const lignes = [{ id: 'moi', pseudo: `${moi.pseudo || 'Toi'} (toi)`, r: moiR }, ...amis.filter((a) => a.resume).map((a) => ({ id: a.id, pseudo: a.pseudo, r: a.resume, ami: a }))]
    .sort((a, b) => semaineDe(b.r) - semaineDe(a.r));
  const classement = h('ol', { class: 'classement' }, lignes.map((l, i) => h('li', { class: l.id === 'moi' ? 'moi' : '' },
    h('button', { disabled: l.id === 'moi', onClick: () => ficheAmi(l.ami) },
      h('span', { class: 'place' }, String(i + 1)),
      h('span', { class: 'qui' }, h('b', {}, insigneDe(l.r), l.pseudo), h('small', {}, `Série de ${pluriel(l.r?.serie || 0, 'jour')}${l.r?.sceau && l.r.jour === jour() ? ', sceau posé aujourd’hui' : ''}`)),
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
    h('p', { class: 'aide-claire' }, `Tu joues d’abord cinq épreuves. À la fin, ${a.pseudo || 'ton ami'} reçoit les mêmes questions et doit battre ton score. Si tu quittes avant la fin, rien n’est envoyé.`),
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
  setTimeout(() => toast(`Va jusqu’au bout : ${a.pseudo} reçoit le défi à la fin, avec ton score à battre.`), 1200);
}
async function releverDefi(id) {
  let d;
  try { d = await lireDefi(id); } catch { return toast('Pas de connexion.'); }
  if (!d || d.statut !== 'ouvert') return toast('Ce défi n’est plus ouvert.');
  if (!['intro', 'constit'].includes(d.matiere) && d.equipe && d.equipe !== etat.equipe) return toast('Ce défi porte sur le cours de l’autre équipe.');
  changerMatiereSilencieux(d.matiere);
  lancer({ type: 'defi-ami', titre: `Défi de ${d.pseudo_auteur || 'ton ami'}`, rounds: d.rounds, defiAmi: { id: d.id, pseudo: d.pseudo_auteur, score: d.score_auteur } });
}
// En fin de défi : on l'envoie à l'ami, ou on lui renvoie le score.
function suiteDefiAmi(S, moyenne) {
  const d = S.defiAmi; if (!d) return null;
  if (d.cible) {
    creerDefi(d.cible, d.matiere, ['intro', 'constit'].includes(d.matiere) ? null : etat.equipe, d.rounds, Math.round(moyenne * 1000) / 1000)
      .then(() => toast(`Défi envoyé à ${d.pseudo}.`)).catch(() => toast('Le défi n’a pas pu partir. Vérifie ta connexion.'));
    return h('p', { class: 'res-texte' }, `${d.pseudo} va recevoir les mêmes questions. À lui de battre tes ${pct(moyenne)}.`);
  }
  defisEnAttente = defisEnAttente.filter((x) => x.id !== d.id);
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
  let comptes; let signalements; let reglage; let quota; let retours;
  try { [comptes, signalements, reglage, quota, retours] = await Promise.all([adminComptes(), adminSignalements(), adminReglage(), adminQuota(), adminRetours()]); } catch {
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
          h('small', {}, `${c.annee ? `${c.annee}${c.annee === 'L1' && c.equipe_l1 ? `, équipe ${c.equipe_l1}` : ''}. ` : ''}${fmt(c.jetons ?? 0)} jetons, ${fmt((c.xp ?? 0) + (c.xp_oblig ?? 0))} points, ${pluriel(c.seances ?? 0, 'séance')}. Vu ${quand(c.vu_le)}.`),
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
  const champQuota = h('input', { class: 'code', type: 'number', inputmode: 'numeric', min: 0, max: 10000, value: quota.quota ?? 28, 'aria-label': 'Nombre de places de test' });
  const NOMS_RETOUR = Object.fromEntries(GENRES_RETOUR);
  const ouvertsR = retours.filter((x) => !x.traite);
  corps.replaceChildren(
    h('h2', {}, 'Places de test'),
    h('p', { class: 'aide-claire' }, `${quota.testeurs} testeurs sur ${quota.quota} places, ${Math.max(0, quota.quota - quota.testeurs)} restantes. ${quota.sans_acces ? `${pluriel(quota.sans_acces, 'compte')} sans accès.` : ''} Au-delà du quota, un nouveau compte arrive sans accès ; tu peux l’ouvrir depuis sa fiche.`),
    champQuota,
    h('button', { class: 'bouton-fantome', onClick: async () => { const n = Math.round(+champQuota.value); if (!(n >= 0)) return toast('Nombre invalide.'); try { await adminChangerQuota(n); toast(`Quota : ${n} testeurs.`); ecranAdmin(); } catch { toast('Changement refusé.'); } } }, 'Changer le quota'),
    quota.sans_acces > 0 && Math.max(0, (quota.quota ?? 0) - (quota.testeurs ?? 0)) > 0 ? h('button', { class: 'bouton-or', onClick: async () => {
      const placesDispos = Math.max(0, (quota.quota ?? 0) - (quota.testeurs ?? 0));
      const enAttente = comptes.filter((c) => c.acces === 'aucun');
      const aOuvrir = enAttente.slice(0, placesDispos);
      if (!aOuvrir.length) return toast('Aucun compte en attente trouvé.');
      const ouverts = [];
      for (const c of aOuvrir) {
        try { await adminStatut(c.id, 'testeur'); ouverts.push(c.id); } catch { /* suivant */ }
      }
      if (ouverts.length) await adminNotifier(ouverts, 'place_testeur').catch(() => toast('Places ouvertes, notification non envoyée.'));
      toast(`${pluriel(ouverts.length, 'place ouverte')} et notifiée${ouverts.length > 1 ? 's' : ''}.`);
      ecranAdmin();
    } }, `Ouvrir ${Math.min(quota.sans_acces, Math.max(0, (quota.quota ?? 0) - (quota.testeurs ?? 0)))} place${Math.min(quota.sans_acces, Math.max(0, (quota.quota ?? 0) - (quota.testeurs ?? 0))) > 1 ? 's' : ''} en attente`) : null,
    h('h2', {}, `Retours des testeurs (${ouvertsR.length})`),
    retours.length ? h('ul', { class: 'articles' }, retours.map((x) => h('li', { class: `article admin-signal${x.traite ? ' traite' : ''}` }, h('div', {},
      h('b', {}, NOMS_RETOUR[x.genre] || x.genre), h('p', {}, x.texte),
      h('small', {}, `${x.pseudo || x.email || 'compte supprimé'}, ${quand(x.cree_le)}${x.ecran ? `, depuis ${x.ecran}` : ''}`),
      h('button', { class: 'bouton-lien', onClick: async () => { try { await adminTraiterRetour(x.id, !x.traite); ecranAdmin(); } catch { toast('Pas de connexion.'); } } }, x.traite ? 'Rouvrir' : 'Marquer comme traité'))))) : h('p', { class: 'aide-claire' }, 'Aucun retour pour l’instant.'),
    h('h2', {}, 'Mise à jour de l’application'),
    h('p', { class: 'aide-claire' }, 'Prévenir tous les testeurs qu’une nouvelle version est disponible.'),
    h('button', { class: 'bouton-fantome', onClick: async (e) => {
      e.currentTarget.disabled = true;
      try { const n = await adminNotifier(null, 'maj_appli', { titre: 'Une nouvelle version est en ligne. Viens voir les nouveautés.' }); toast(n ? `${pluriel(n, 'compte notifié')}.` : 'Tout le monde a déjà été prévenu il y a moins de 10 minutes.'); } catch { toast('Envoi refusé.'); e.currentTarget.disabled = false; }
    } }, 'Notifier les testeurs d’une mise à jour'),
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
    try {
      await adminStatut(c.id, v);
      if (v === 'testeur' && c.acces === 'aucun') adminNotifier([c.id], 'place_testeur').catch(() => {});
      voile.remove();
      toast(`${c.pseudo || c.email} : ${NOMS_STATUT[v].toLowerCase()}${v === 'testeur' && c.acces === 'aucun' ? ' (prévenu)' : ''}.`);
      ecranAdmin();
    } catch { toast('Changement refusé.'); }
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
definirNommeur((id) => { const a = ix?.parId?.get(id); return a ? (a.article ? a.nom : a.court || a.nom) : null; });
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
    await Promise.race([lireProfil(), new Promise((ok) => setTimeout(ok, 4000))]).catch(() => {});
  } catch (e) {
    if (!connecte()) { ecranConnexion(e.message); return false; }
  }
  if (etat.compte?.acces === 'aucun') { ecranPlacesPrises(); return false; }
  return true;
}

// Au-delà des places de test, le compte existe mais l'appli reste fermée.
function ecranPlacesPrises() {
  afficherOnglets(false);
  const conteneurAlerte = h('div', { class: 'places-alerte' });
  etatRappel().then((r) => {
    if (r === 'indisponible') {
      conteneurAlerte.replaceChildren(h('p', { class: 'aide-claire' }, estInstallee() ? 'Ce téléphone ne reçoit pas les notifications.' : 'Pour être prévenu quand une place s’ouvre, ajoute Gdroit à ton écran d’accueil, puis reviens ici.'));
    } else if (r === 'refuse') {
      conteneurAlerte.replaceChildren(h('p', { class: 'aide-claire' }, 'Les notifications sont refusées pour Gdroit. Active-les dans les réglages du téléphone pour être prévenu.'));
    } else if (r === 'actif') {
      conteneurAlerte.replaceChildren(h('p', { class: 'aide-claire' }, 'Tu seras prévenu par notification dès qu’une place s’ouvre.'));
    } else {
      conteneurAlerte.replaceChildren(h('button', { class: 'bouton-fantome', onClick: async () => {
        try {
          await activerRappel();
          const s = await abonnementActuel();
          if (s) await inscrireAppareil(s);
          toast('C’est noté : tu seras prévenu dès qu’une place s’ouvre.');
          conteneurAlerte.replaceChildren(h('p', { class: 'aide-claire' }, 'Tu seras prévenu par notification dès qu’une place s’ouvre.'));
        } catch (err) {
          toast(err.message || 'Notifications refusées.');
        }
      } }, 'Me prévenir dès qu’une place se libère'));
    }
  }).catch(() => {});

  racine.replaceChildren(h('main', { class: 'connexion' },
    chouette('pause', { taille: 170, tenue: false }),
    h('h1', {}, 'Les places de test sont prises'),
    h('p', { class: 'connexion-sous' }, 'Gdroit est en test fermé, et les places sont toutes occupées. Ton compte est bien créé : tu pourras entrer dès l’ouverture.'),
    h('p', { class: 'aide-claire' }, `Connecté : ${etat.compte?.email || 'ton compte'}.`),
    conteneurAlerte,
    h('button', { class: 'bouton-fantome', onClick: () => location.reload() }, 'Réessayer'),
    h('button', { class: 'bouton-lien', onClick: async () => { await deconnexion(); remplacerEtat({}); location.reload(); } }, 'Se déconnecter')));
}

// Après deux jours sans séance, Lexou boude un instant, puis saute de joie.
function retourDeLexou() {
  const dernier = etat.serie?.dernier; if (!dernier || document.querySelector('.voile')) return;
  const absent = jour() - dernier; if (absent < 2) return;
  const figure = h('div', { class: 'retour-lexou-figure' }, chouette('pause', { taille: 150, tenue: false }));
  const texte = h('p', {}, absent >= 7 ? `${pluriel(absent, 'jour')} sans toi. Lexou avait commencé une lettre très triste.` : `${pluriel(absent, 'jour')} sans toi. Lexou faisait semblant que ça allait.`);
  const voile = h('div', { class: 'voile', onClick: (e) => { if (e.target === voile) voile.remove(); } }, h('div', { class: 'boite retour-lexou', role: 'dialog', 'aria-label': 'Lexou' }, figure, texte,
    h('div', { class: 'boite-actions' }, h('button', { class: 'bouton-or', onClick: () => voile.remove() }, 'Je suis là'))));
  document.body.append(voile);
  setTimeout(() => { figure.replaceChildren(chouette('clin', { taille: 150, tenue: false })); figure.classList.add('saute'); texte.textContent = 'Il te pardonne. Allez, une séance ?'; son('parfait'); }, 1600);
}

// PRISE EN MAIN : quatre écrans courts au premier lancement, puis une bulle à la découverte de chaque exercice.
// En mode test, les guides restent muets, sauf demande expresse (?guide).
const guidesMuets = () => { const p = new URLSearchParams(location.search); return p.has('test') && !p.has('guide'); };
const PRISE_EN_MAIN = [
  ['clin', 'Bienvenue sur Gdroit', 'Gdroit complète ton cours, sans pression. Un peu chaque jour suffit : cinq minutes, une séance, et c’est gagné.'],
  ['tribune', 'Le Palais', 'Le Défi du jour pose ton sceau et fait grandir ta série. Vers l’examen et Le rôle sont là quand tu veux plus.'],
  ['echelle', 'Les chambres', 'Une chambre par partie du cours. L’audience d’une chambre ouvre la suivante.'],
  ['lunettes', 'Les fiches', 'Chaque arrêt monte de palier quand tu le réussis sur plusieurs jours. Les termes soulignés en pointillé s’expliquent d’un toucher.'],
];
function priseEnMain(depuisProfil = false) {
  if (!depuisProfil && guidesMuets()) return accueilTesteur();
  let i = 0;
  const contenu = h('div', { class: 'boite prise-en-main', role: 'dialog', 'aria-label': 'Prise en main' });
  const voile = h('div', { class: 'voile' }, contenu);
  const fermer = () => { voile.remove(); etat.reglages.priseEnMain = true; sauver(); if (!depuisProfil) setTimeout(accueilTesteur, 300); };
  const rendre = () => {
    const [pose, titre, texte] = PRISE_EN_MAIN[i];
    const dernier = i === PRISE_EN_MAIN.length - 1;
    contenu.replaceChildren(chouette(pose, { taille: 130, tenue: false }), h('h2', {}, titre), h('p', {}, texte),
      h('div', { class: 'pips-prise', 'aria-label': `Écran ${i + 1} sur ${PRISE_EN_MAIN.length}` }, PRISE_EN_MAIN.map((_, k) => h('i', { class: k === i ? 'actif' : '' }))),
      h('div', { class: 'boite-actions' },
        dernier ? h('button', { class: 'bouton-or', onClick: () => { fermer(); if (!depuisProfil && document.querySelector('.tribune')) lancerDefi(); } }, depuisProfil ? 'Terminer' : 'Faire mon premier défi')
          : h('button', { class: 'bouton-or', onClick: () => { i++; son('tap'); rendre(); } }, 'Suivant'),
        h('button', { class: 'bouton-lien', onClick: fermer }, dernier ? 'Plus tard' : 'Passer')));
  };
  rendre(); document.body.append(voile);
}
const BULLES = {
  paires: 'Touche un élément, puis celui qui va avec. Contre la montre.',
  puzzle: 'Remets chaque bloc de la fiche à sa place, puis trouve le problème de droit.',
  juge: 'Lis l’affaire, tranche, puis choisis ta motivation.',
  plan: 'Choisis le meilleur plan, puis dis ce qui cloche dans les autres.',
  architecte: 'Construis le plan en plaçant les titres, puis range les arrêts dans les bonnes parties.',
  cas: 'Suis la méthode étape par étape : qualification, règle, application, solution.',
  qualif: 'Relie chaque situation à sa qualification.',
  remede: 'Choisis la sanction, puis son fondement.',
  frise: 'Les années sont posées : place chaque décision à sa date. Touche deux décisions pour les échanger.',
  flash: 'Écris l’apport de mémoire, puis compare au corrigé et note-toi honnêtement.',
  plaide: 'Réponds sans choix proposés, puis compare au corrigé.',
  trous: 'Touche les mots dans l’ordre des trous.',
  express: 'Trouve la phrase qui porte une partie, puis le bon plan.',
  syllogisme: 'Pose la règle, les faits, puis la conclusion. Attention : chaque case a son leurre.',
  casnu: 'Le cas sans les étapes nommées : à toi de savoir où tu en es. Le corrigé vient à la fin.',
  appel: 'Tes erreurs reviennent sous une autre forme. Gagne l’appel pour les sortir du carnet.',
};
function bulleExercice(type) {
  const vus = etat.reglages.bullesVues || (etat.reglages.bullesVues = {});
  if (guidesMuets() || !BULLES[type] || vus[type] || !document.querySelector('.scene')) return;
  vus[type] = true; sauver();
  const b = h('div', { class: 'bulle-exercice', role: 'status' }, chouette('clin', { taille: 56, tenue: false }), h('p', {}, BULLES[type]), h('button', { class: 'bouton-lien', onClick: () => b.remove() }, 'Compris'));
  document.body.append(b);
  setTimeout(() => b.remove(), 9000);
}

// Le mot d'accueil des testeurs, une seule fois.
function accueilTesteur() {
  if (etat.compte?.acces !== 'testeur' || etat.reglages.accueilTesteur) { demanderNotifs(); return; }
  etat.reglages.accueilTesteur = true; sauver();
  const voile = h('div', { class: 'voile' }, h('div', { class: 'boite accueil-testeur', role: 'dialog', 'aria-label': 'Bienvenue, testeur' },
    chouette('clin', { taille: 120, tenue: false }),
    h('h2', {}, 'Tu es testeur'),
    h('p', {}, 'Tu fais partie des 28 premiers testeurs de Gdroit. Le but, c’est d’abord de t’amuser en révisant.'),
    h('p', {}, 'Mais tu as aussi un rôle : repérer ce qui cloche. Une erreur de droit, un écran confus, un bouton qui ne marche pas, une idée : touche « Faire un retour », dans ton profil ou en fin de séance. C’est lu par le créateur de l’appli.'),
    h('div', { class: 'boite-actions' }, h('button', { class: 'bouton-or', onClick: () => { voile.remove(); setTimeout(demanderNotifs, 400); } }, 'C’est parti'))));
  document.body.append(voile);
}

// Une fois par téléphone (et une fois pour les comptes déjà là à cette mise à jour) : proposer les notifications.
// Sur iPhone, la demande d'autorisation doit suivre un toucher : d'où la fenêtre et son bouton.
const DEMANDE_NOTIFS = 1;
async function demanderNotifs() {
  if (!connecte() || new URLSearchParams(location.search).has('test')) return;
  if ((etat.reglages.demandeNotifs || 0) >= DEMANDE_NOTIFS) return;
  if (document.querySelector('.voile')) { setTimeout(demanderNotifs, 1500); return; }
  const r = await etatRappel().catch(() => 'indisponible');
  if (r !== 'inactif') return;
  etat.reglages.demandeNotifs = DEMANDE_NOTIFS; sauver();
  const voile = h('div', { class: 'voile' }, h('div', { class: 'boite demande-notifs', role: 'dialog', 'aria-label': 'Activer les notifications' },
    chouette('lunettes', { taille: 110, tenue: false }),
    h('h2', {}, 'Ne rate rien'),
    h('p', {}, 'Gdroit te prévient quand un ami te défie, quand une nouvelle version arrive, ou quand une place de test s’ouvre.'),
    h('p', { class: 'aide-claire' }, 'Le rappel de révision reste éteint : tu l’allumes dans ton profil si tu le veux.'),
    h('div', { class: 'boite-actions' },
      h('button', { class: 'bouton-or', onClick: async (e) => {
        e.currentTarget.disabled = true;
        try { await activerRappel(); const ab = await abonnementActuel(); if (!ab) throw new Error('Notifications refusées.'); await inscrireAppareil(ab); toast('Notifications activées.'); } catch (err) { toast(err.message || 'Notifications refusées.'); }
        voile.remove();
      } }, 'Activer les notifications'),
      h('button', { class: 'bouton-lien', onClick: () => voile.remove() }, 'Plus tard'))));
  document.body.append(voile);
}

// Faire un retour : erreur de droit, interface, bug, idée.
const GENRES_RETOUR = [['droit', 'Erreur de droit'], ['interface', 'Interface'], ['bug', 'Bug'], ['idee', 'Idée'], ['autre', 'Autre']];
function faireRetour(ecran) {
  let genre = null;
  const texte = h('textarea', { class: 'code retour-texte', rows: 5, maxlength: 3000, placeholder: 'Ce que tu as vu, où, et ce qui serait mieux.', 'aria-label': 'Ton retour' });
  const puces = h('div', { class: 'puces-retour', role: 'radiogroup', 'aria-label': 'Type de retour' }, GENRES_RETOUR.map(([v, nom]) => h('button', { class: 'puce', role: 'radio', 'aria-checked': 'false', 'data-genre': v, onClick: (e) => {
    genre = v; puces.querySelectorAll('.puce').forEach((b) => b.setAttribute('aria-checked', String(b === e.currentTarget)));
  } }, nom)));
  const voile = h('div', { class: 'voile', onClick: (e) => { if (e.target === voile) voile.remove(); } }, h('div', { class: 'boite admin-fiche', role: 'dialog', 'aria-label': 'Faire un retour' },
    h('h2', {}, 'Faire un retour'),
    h('p', { class: 'aide-claire' }, 'Lu par le créateur de Gdroit. L’écran où tu es est joint automatiquement.'),
    puces, texte,
    h('div', { class: 'boite-actions' },
      h('button', { class: 'bouton-or', onClick: async (e) => {
        if (!genre) return toast('Choisis le type de retour.');
        if (texte.value.trim().length < 3) return toast('Écris ton retour.');
        const b = e.currentTarget; b.disabled = true;
        try { await envoyerRetour(genre, texte.value.trim(), ecran); voile.remove(); toast('Merci, ton retour est envoyé.'); } catch { b.disabled = false; toast('Pas de connexion. Réessaie.'); }
      } }, 'Envoyer'),
      h('button', { class: 'bouton-lien', onClick: () => voile.remove() }, 'Annuler'))));
  document.body.append(voile); texte.focus();
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
  const [admin, admin2, oblig2, oblig1, intro, intro2, constit] = await Promise.all([fetch('content.json').then((r) => r.json()), fetch('admin2.json').then((r) => r.json()), fetch('oblig.json').then((r) => r.json()), fetch('oblig1.json').then((r) => r.json()), fetch('intro.json').then((r) => r.json()), fetch('intro2.json').then((r) => r.json()), fetch('constit.json').then((r) => r.json()), charger().then(chargerImages)]);
  clearTimeout(attente);
  if (!(await ouvrirCompte(params))) { enregistrerServiceWorker(); return; }
  // Une ancienne sauvegarde connaît déjà le jour de la dernière séance.
  if (etat.chouette.seance === null) etat.chouette.seance = etat.serie.dernier;
  // ?equipe=1 : les tests ouvrent directement une équipe, sans passer par la question.
  if (params.has('equipe')) changerEquipe(+params.get('equipe'));
  PAR_EQUIPE[1] = oblig1; PAR_EQUIPE[2] = oblig2;
  // Les tests gardent l'administratif de l'équipe 1, sauf s'ils demandent une équipe.
  ADMIN_PAR_EQUIPE.brut = { 1: admin, 2: params.has('test') && !params.has('equipe') ? admin : admin2 };
  INTRO_PAR_EQUIPE.brut = { 2: intro2, 3: intro };
  indexerAdmin(); indexerObligations(); indexerIntro(); CONTENUS.constit = indexer(constit);
  if (params.has('test') && !params.has('choix')) etat.matiere = ['oblig', 'intro', 'constit'].includes(params.get('matiere')) ? params.get('matiere') : etat.matiere;
  if (params.has('test') && ['intro', 'constit'].includes(params.get('matiere'))) { etat.annee = 'L1'; etat.equipeL1 = +params.get('l1') || 3; indexerIntro(); }
  // Une matière qui n'est pas de l'année revient à la première de l'année.
  if (etat.annee && !matieresAnnee().some((m) => m.id === etat.matiere)) etat.matiere = matieresAnnee()[0].id;
  ix = CONTENUS[etat.matiere];
  appliquerTheme();
  appliquerSession();
  surveillerAudio();
  for (const ev of ['pointerdown', 'pointerup', 'touchend', 'click']) document.addEventListener(ev, reveillerAudio, { passive: true });
  const evenement = verifierSerie();
  // L'appli s'ouvre sur le choix de la matière. Les tests vont droit à la matière demandée.
  if (params.has('test') && !params.has('annee') && !etat.annee) etat.annee = 'L2';
  if (params.has('test') && !params.has('choix') && !params.has('annee')) aller('palais');
  else if (!etat.annee) ecranAnnee();
  else if (etat.annee === 'L1') accueilL1();
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
    setTimeout(() => (etat.reglages.priseEnMain ? accueilTesteur() : priseEnMain()), 900);
    setTimeout(retourDeLexou, 700);
    navigator.serviceWorker?.addEventListener('message', (e) => { if (e.data === 'amis') aller('amis'); });
    let invite = null; try { invite = localStorage.getItem('gdroit-ami'); localStorage.removeItem('gdroit-ami'); } catch { /* rien */ }
    if (invite) proposerAmi(invite);
    else if (params.has('amis')) aller('amis');
    window.addEventListener('online', () => { envoyerProgression(); envoyerSignalements(); });
    document.addEventListener('visibilitychange', () => { if (document.hidden) envoyerProgression(); else compterNouvelles(); });
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
      // Le téléphone garde son abonnement aux notifications à jour sur le compte.
      if (connecte()) abonnementActuel().then((s) => s && inscrireAppareil(s)).catch(() => {});
      navigator.serviceWorker.addEventListener('controllerchange', () => { if (!recharge && document.querySelector('.maj')) { recharge = true; location.reload(); } });
    } catch (e) { console.warn('Service worker indisponible', e); }
  }
}

demarrer().catch((e) => {
  console.error(e);
  racine.replaceChildren(h('main', { class: 'erreur' }, h('p', {}, 'L’appli n’a pas pu démarrer. Vérifie ta connexion pour la première ouverture, puis recharge.')));
});
