// Le compte : connexion obligatoire (Google ou code par email), profil et copie en ligne de la progression.
// Tout passe par l'API de Supabase, sans bibliothèque : la session est gardée sur le téléphone.
import { SUPABASE_URL, SUPABASE_CLE } from './config.js';
import { etat, sauver, remplacerEtat, jour, lundi, rangGeneral, M } from './state.js';
import { fusionner3 } from './fusion.js';

const CLE_SESSION = 'gdroit-session';
const ici = () => location.origin + location.pathname;

let session = null;
try { session = JSON.parse(localStorage.getItem(CLE_SESSION)); } catch { session = null; }
const garder = (s) => { session = s; try { if (s) localStorage.setItem(CLE_SESSION, JSON.stringify(s)); else localStorage.removeItem(CLE_SESSION); } catch { /* stockage bloqué */ } };

export const connecte = () => Boolean(session?.refresh_token);
export const utilisateur = () => session?.user || null;

function depuisReponse(r) {
  if (!r.access_token) throw new Error('Connexion refusée.');
  return { access_token: r.access_token, refresh_token: r.refresh_token, expire: Date.now() + (r.expires_in || 3600) * 1000, user: r.user ? { id: r.user.id, email: r.user.email, nom: r.user.user_metadata?.full_name || r.user.user_metadata?.name || null } : session?.user };
}

async function auth(chemin, corps) {
  const r = await fetch(`${SUPABASE_URL}/auth/v1/${chemin}`, { method: 'POST', headers: { apikey: SUPABASE_CLE, 'Content-Type': 'application/json' }, body: JSON.stringify(corps) });
  const t = await r.json().catch(() => ({}));
  if (!r.ok) {
    const m = t.msg || t.error_description || t.message || '';
    if (/rate|limit/i.test(m) || r.status === 429) throw new Error('Trop d’essais. Réessaie dans quelques minutes.');
    if (/expired|invalid/i.test(m)) throw new Error('Code faux ou expiré.');
    throw new Error('Service indisponible pour le moment.');
  }
  return t;
}

// Le jeton dure une heure : on le renouvelle en silence, et hors ligne on garde l'ancien.
async function jeton() {
  if (!session) throw new Error('Non connecté.');
  if (Date.now() < session.expire - 60000) return session.access_token;
  try { garder(depuisReponse(await auth('token?grant_type=refresh_token', { refresh_token: session.refresh_token }))); } catch (e) {
    if (/Code faux/.test(e.message)) { garder(null); throw new Error('Session expirée, reconnecte-toi.'); }
    throw e;
  }
  return session.access_token;
}

async function api(chemin, { method = 'GET', corps, prefer } = {}) {
  const t = await jeton();
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${chemin}`, {
    method, headers: { apikey: SUPABASE_CLE, Authorization: `Bearer ${t}`, 'Content-Type': 'application/json', ...(prefer ? { Prefer: prefer } : {}) },
    body: corps === undefined ? undefined : JSON.stringify(corps),
  });
  if (!r.ok) throw new Error(`Service indisponible (${r.status})`);
  const txt = await r.text();
  return txt ? JSON.parse(txt) : null;
}

// Google, en flux PKCE : on part sur la page de Google avec un défi tiré au hasard ; au retour, Supabase
// donne un code qui ne s'échange contre une session qu'avec le secret gardé sur ce téléphone.
// Un lien fabriqué par un tiers (avec sa propre session) ne peut donc plus connecter quelqu'un à son compte.
const CLE_PKCE = 'gdroit-pkce';
const b64url = (octets) => btoa(String.fromCharCode(...new Uint8Array(octets))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
export async function connexionGoogle() {
  const verificateur = b64url(crypto.getRandomValues(new Uint8Array(48)));
  const defi = b64url(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verificateur)));
  try { localStorage.setItem(CLE_PKCE, JSON.stringify({ v: verificateur, t: Date.now() })); } catch { /* stockage bloqué */ }
  location.assign(`${SUPABASE_URL}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(ici())}&code_challenge=${defi}&code_challenge_method=s256`);
}
export async function retourConnexion() {
  const q = new URLSearchParams(location.search); const diese = new URLSearchParams(location.hash.slice(1));
  const nettoyer = () => { for (const k of ['code', 'error', 'error_code', 'error_description']) q.delete(k); const r = q.toString(); history.replaceState(null, '', ici() + (r ? `?${r}` : '')); };
  if (q.get('error_description') || diese.get('error_description')) { nettoyer(); throw new Error('Connexion annulée ou refusée.'); }
  // Ancien retour (session dans l'adresse) : refusé, il pourrait venir d'un lien piégé.
  if (diese.get('access_token')) { history.replaceState(null, '', ici() + location.search); throw new Error('Ce lien de connexion n’est plus valable. Reconnecte-toi.'); }
  const code = q.get('code');
  if (!code) return false;
  let pkce = null;
  try { pkce = JSON.parse(localStorage.getItem(CLE_PKCE)); localStorage.removeItem(CLE_PKCE); } catch { pkce = null; }
  nettoyer();
  if (!pkce?.v || Date.now() - pkce.t > 15 * 60000) throw new Error('Connexion commencée ailleurs. Touche à nouveau « Continuer avec Google » ici, ou passe par le code par email.');
  try { garder(depuisReponse(await auth('token?grant_type=pkce', { auth_code: code, code_verifier: pkce.v }))); } catch { throw new Error('La connexion Google n’a pas abouti. Réessaie.'); }
  return true;
}
export async function completerUtilisateur() {
  if (session && !session.user) {
    const t = await jeton();
    const u = await fetch(`${SUPABASE_URL}/auth/v1/user`, { headers: { apikey: SUPABASE_CLE, Authorization: `Bearer ${t}` } }).then((r) => r.json());
    garder({ ...session, user: { id: u.id, email: u.email, nom: u.user_metadata?.full_name || u.user_metadata?.name || null } });
  }
}

// Email : un code à six chiffres, à taper dans l'appli. Un lien ouvrirait Safari, pas l'appli installée.
export const envoyerCode = (email) => auth('otp', { email: email.trim().toLowerCase(), create_user: true });
export async function verifierCode(email, code) {
  garder(depuisReponse(await auth('verify', { type: 'email', email: email.trim().toLowerCase(), token: code.replace(/\s/g, '') })));
}

export async function deconnexion() {
  try { await envoyerProgression(); } catch { /* hors ligne : tant pis */ }
  // Ce téléphone ne doit plus recevoir les notifications de ce compte.
  try {
    const reg = await navigator.serviceWorker?.getRegistration?.();
    const ab = await reg?.pushManager?.getSubscription?.();
    if (ab) { try { await retirerAppareil(ab.endpoint); } catch { /* hors ligne */ } try { await ab.unsubscribe(); } catch { /* rien */ } }
  } catch { /* pas de service worker */ }
  try { const t = session?.access_token; if (t) await fetch(`${SUPABASE_URL}/auth/v1/logout`, { method: 'POST', headers: { apikey: SUPABASE_CLE, Authorization: `Bearer ${t}` } }); } catch { /* sans réseau */ }
  garder(null);
}

// PROFIL ------------------------------------------------------------------------------
export async function lireProfil() {
  api(`profils?id=eq.${session.user.id}`, { method: 'PATCH', corps: { vu_le: new Date().toISOString(), equipe: etat.equipe || null } }).catch(() => {});
  const l = await api(`profils?id=eq.${session.user.id}&select=pseudo,equipe,acces`);
  const p = l?.[0] || null;
  if (p) { etat.compte = { ...etat.compte, pseudo: p.pseudo, acces: p.acces }; sauver(); }
  return p;
}
export const changerPseudo = (pseudo) => api(`profils?id=eq.${session.user.id}`, { method: 'PATCH', corps: { pseudo: pseudo.trim().slice(0, 40) } });

// PROGRESSION -------------------------------------------------------------------------
// Ce qui part en ligne : tout l'état, sauf la séance en cours et ce qui décrit le compte lui-même.
function aEnvoyer() {
  const { enCours, compte, ...reste } = etat; void enCours; void compte;
  return { ...reste, oblig: { ...etat.oblig, enCours: null }, intro: { ...etat.intro, enCours: null }, constit: { ...etat.constit, enCours: null } };
}
// Le nom d'une fiche à revoir, pour le rappel de Lexou : l'appli fournit le nom lisible.
let nommer = () => null;
export function definirNommeur(f) { nommer = f; }
function ficheARevoir() {
  const j = jour();
  const dues = Object.entries(M().arrets || {}).filter(([, a]) => a.b > 0 && a.d <= j).sort((x, y) => x[1].b - y[1].b);
  return dues.length ? nommer(dues[0][0]) : null;
}
// Ce que voient les amis : jamais le détail des fiches.
export function resume() {
  const j = jour(); const s = etat.serie;
  const maitrises = ['admin', 'oblig', 'intro', 'constit'].reduce((n, m) => n + Object.values(M(m).arrets || {}).filter((a) => a.b >= 5).length, 0);
  return {
    jour: j, serie: s.dernier >= j - 1 ? s.n : 0, sceau: s.dernier === j, grade: rangGeneral().nom,
    xp: (etat.xp || 0) + (etat.oblig?.xp || 0) + (etat.intro?.xp || 0) + (etat.constit?.xp || 0), xpAdmin: etat.xp || 0, xpOblig: etat.oblig?.xp || 0, xpIntro: etat.intro?.xp || 0, xpConstit: etat.constit?.xp || 0,
    semaine: lundi(), xpSemaine: etat.semaine?.debut === lundi() ? etat.semaine.xp : 0,
    maitrises, annee: etat.annee || null, equipe: etat.annee === 'L1' ? etat.equipeL1 : etat.equipe || null, seances: etat.stats?.seances || 0, revoir: ficheARevoir(), insigne: etat.insigne || 'aucun',
  };
}
const poids = (e) => (e?.xp || 0) + (e?.oblig?.xp || 0) + (e?.intro?.xp || 0) + (e?.constit?.xp || 0) + (e?.stats?.seances || 0);

// La dernière version commune avec la copie en ligne : elle permet de fusionner deux téléphones
// qui ont avancé chacun de leur côté au lieu d'en écraser un.
const CLE_BASE = 'gdroit-base';
function lireBase() { try { return JSON.parse(localStorage.getItem(CLE_BASE)); } catch { return null; } }
function garderBase(donnees, maj) {
  etat.compte = { ...etat.compte, sync: Date.parse(maj), majDistante: maj };
  try { localStorage.setItem(CLE_BASE, JSON.stringify(donnees)); } catch { localStorage.removeItem?.(CLE_BASE); }
  sauver();
}
// La version en ligne a changé ailleurs : on fusionne, en gardant la séance en cours de ce téléphone.
function fusionnerAvec(distant) {
  const base = lireBase();
  if (!base) return false;
  const encours = { admin: etat.enCours, oblig: etat.oblig?.enCours, intro: etat.intro?.enCours, constit: etat.constit?.enCours };
  const compte = etat.compte;
  const f = fusionner3(base, aEnvoyer(), distant);
  remplacerEtat({ ...f, compte, enCours: encours.admin });
  for (const m of ['oblig', 'intro', 'constit']) if (etat[m]) etat[m].enCours = encours[m] || null;
  sauver();
  return true;
}

let envoi = null;
export async function envoyerProgression() {
  if (!connecte() || !session.user || navigator.onLine === false) return false;
  if (envoi) return envoi;
  envoi = (async () => {
    try {
      const id = session.user.id;
      for (let essai = 0; essai < 2; essai++) {
        const donnees = aEnvoyer();
        const corps = { donnees, resume: resume(), maj: new Date().toISOString() };
        const connue = etat.compte?.majDistante;
        if (!connue) {
          // Premier envoi depuis ce téléphone (ou version d'avant la fusion) : on écrit et on retient la date en ligne.
          const r = await api('progressions?on_conflict=id&select=maj', { method: 'POST', corps: { id, ...corps }, prefer: 'resolution=merge-duplicates,return=representation' });
          garderBase(donnees, r?.[0]?.maj || corps.maj);
          return true;
        }
        // Écriture seulement si la copie en ligne est celle qu'on connaît.
        const r = await api(`progressions?id=eq.${id}&maj=eq.${encodeURIComponent(connue)}&select=maj`, { method: 'PATCH', corps, prefer: 'return=representation' });
        if (r?.length) { garderBase(donnees, r[0].maj); return true; }
        // Elle a changé ailleurs (autre téléphone) : on la relit, on fusionne, puis on réessaie une fois.
        const l = await api(`progressions?id=eq.${id}&select=donnees,maj`);
        const distant = l?.[0];
        if (!distant) { etat.compte = { ...etat.compte, majDistante: null }; continue; }
        if (!fusionnerAvec(distant.donnees)) {
          // Sans version commune, on garde la plus avancée des deux, comme avant.
          if (poids(distant.donnees) > poids(etat)) { remplacerEtat({ ...distant.donnees, compte: etat.compte, enCours: null }); garderBase(distant.donnees, distant.maj); return true; }
        }
        etat.compte = { ...etat.compte, majDistante: distant.maj };
      }
      return false;
    } catch { return false; } finally { envoi = null; }
  })();
  return envoi;
}

// À la connexion : on garde la bonne version entre ce téléphone et la copie en ligne.
// Retourne 'en-ligne' si la copie en ligne a remplacé celle du téléphone.
export async function synchroniser(delai = {}) {
  const id = session.user.id;
  const l = await api(`progressions?id=eq.${id}&select=donnees,maj`);
  const distant = l?.[0];
  const memeCompte = etat.compte?.id === id;
  const local = etat.stats?.seances ? etat : null;
  let choix = 'local';
  if (distant) {
    const majDistante = Date.parse(distant.maj);
    const modifieIci = (etat.modifie || 0) > (etat.compte?.sync || 0);
    if (!local) choix = 'distant';
    else if (memeCompte && majDistante > (etat.compte.sync || 0)) choix = !modifieIci ? 'distant' : lireBase() ? 'fusion' : (poids(distant.donnees) > poids(etat) ? 'distant' : 'local');
    else if (!memeCompte) choix = poids(distant.donnees) > poids(etat) ? 'distant' : 'local';
  }
  if (delai.depasse) return 'trop-tard';
  const pseudo = etat.compte?.pseudo;
  const garde = { id, email: session.user.email, pseudo, acces: etat.compte?.acces || null };
  if (choix === 'fusion') {
    etat.compte = { ...etat.compte, ...garde };
    fusionnerAvec(distant.donnees);
    etat.compte = { ...etat.compte, majDistante: distant.maj };
    sauver();
    await envoyerProgression();
    return 'fusion';
  }
  if (choix === 'distant') {
    remplacerEtat({ ...distant.donnees, enCours: null });
    etat.compte = { ...garde, sync: Date.parse(distant.maj), majDistante: distant.maj };
    garderBase(distant.donnees, distant.maj);
    return 'en-ligne';
  }
  // On garde ce téléphone : s'il s'agit d'un autre compte, la date connue en ligne ne vaut plus.
  etat.compte = { ...garde, sync: memeCompte ? etat.compte?.sync || 0 : 0, majDistante: memeCompte ? etat.compte?.majDistante || null : distant?.maj || null };
  if (!memeCompte) { try { localStorage.removeItem(CLE_BASE); } catch { /* stockage bloqué */ } }
  sauver();
  await envoyerProgression();
  return 'telephone';
}

// SIGNALEMENTS ET CADEAUX -------------------------------------------------------------
export async function envoyerSignalements() {
  const restants = etat.signalements.filter((s) => !s.envoye);
  if (!connecte() || !restants.length || navigator.onLine === false) return 0;
  try {
    await api('signalements', { method: 'POST', corps: restants.map((s) => ({ carte: String(s.id).slice(0, 80), nom: s.nom?.slice(0, 200), texte: s.txt.slice(0, 2000), equipe: s.equipe, matiere: s.matiere || null })), prefer: 'return=minimal' });
    restants.forEach((s) => { s.envoye = true; }); sauver();
    return restants.length;
  } catch { return 0; }
}

export async function recevoirCadeauxCompte() {
  if (!connecte() || navigator.onLine === false) return 0;
  try {
    const liste = await api('cadeaux?select=id,jetons');
    const nouveaux = (liste || []).filter((c) => !etat.cadeaux.includes(c.id));
    if (!nouveaux.length) return 0;
    let total = 0;
    for (const c of nouveaux) { total += c.jetons; etat.cadeaux.push(c.id); }
    // Un retrait ne descend jamais sous zéro.
    etat.jetons = Math.max(0, etat.jetons + total); sauver();
    return total;
  } catch { return 0; }
}

// ADMINISTRATION ----------------------------------------------------------------------
// Chaque fonction vérifie côté serveur que le compte est administrateur.
const rpc = (nom, corps = {}) => api(`rpc/${nom}`, { method: 'POST', corps });
export const estAdmin = () => etat.compte?.acces === 'admin';
export const adminComptes = () => rpc('admin_comptes');
export const adminJetons = (cible, montant, raison) => rpc('admin_jetons', { cible, montant, raison: raison || null });
export const adminStatut = (cible, statut) => rpc('admin_statut', { cible, statut });
export const adminSignalements = () => rpc('admin_signalements');
export const adminTraiter = (signalement, fait) => rpc('admin_traiter', { signalement, fait });
export const adminReglage = () => rpc('admin_lire_reglage');
export const adminChangerReglage = (statut) => rpc('admin_reglage_nouveaux', { statut });
// Réservé à l'administrateur (vérifié par la base) : place de test ouverte, mise à jour. cibles nul = tous les comptes qui ont accès.
export const adminNotifier = async (cibles, genre, donnees = {}) => { const n = await rpc('admin_notifier', { cibles, genre, donnees }); await pousser(); return n; };

// AMIS --------------------------------------------------------------------------------
export const monProfil = async () => (await api(`profils?id=eq.${session.user.id}&select=pseudo,code_ami,masquer,notifs,rappel`))?.[0];
export const reglerProfil = (champs) => api(`profils?id=eq.${session.user.id}`, { method: 'PATCH', corps: champs });
export const mesAmis = () => rpc('mes_amis');
export const mesBloques = () => rpc('mes_bloques');
export const demanderAmi = (code) => rpc('demander_ami', { code }).then((r) => { pousser(); return r; });
export const repondreAmi = (autre, accepter) => rpc('repondre_ami', { autre, accepter }).then(() => pousser());
export const retirerAmi = (autre) => rpc('retirer_ami', { autre });
export const bloquer = (autre, oui = true) => rpc('bloquer', { autre, oui });
export const mesDefis = () => rpc('mes_defis');
export const creerDefi = (invite, matiere, equipe, rounds, score) => rpc('creer_defi', { invite, matiere, equipe, rounds, score }).then((id) => { pousser(); return id; });
export const lireDefi = (defi) => rpc('lire_defi', { defi });
export const repondreDefi = (defi, score) => rpc('repondre_defi', { defi, score }).then(() => pousser());
export const refuserDefi = (defi) => rpc('refuser_defi', { defi });
export const mesNotifications = () => rpc('mes_notifications');
export const toutLu = () => rpc('tout_lu');
export async function annoncerDefiJour() {
  if (!connecte() || navigator.onLine === false) return;
  try { await rpc('annoncer_defi_jour'); pousser(); } catch { /* sans réseau */ }
}
// Les notifications créées partent sur les téléphones des amis.
export async function pousser() {
  try { const t = await jeton(); await fetch(`${SUPABASE_URL}/functions/v1/pousser`, { method: 'POST', headers: { apikey: SUPABASE_CLE, Authorization: `Bearer ${t}` } }); } catch { /* l'appli les montrera à l'ouverture */ }
}
// Le téléphone est rattaché au compte connecté, même s'il l'était à un autre compte avant (fonction serveur).
export const inscrireAppareil = (abonnement) => rpc('inscrire_appareil', { point: abonnement.endpoint, abonnement: abonnement.toJSON ? abonnement.toJSON() : abonnement });
export const retirerAppareil = (point) => api(`appareils?point=eq.${encodeURIComponent(point)}`, { method: 'DELETE', prefer: 'return=minimal' });

// TESTEURS -----------------------------------------------------------------------------
export const envoyerRetour = (genre, texte, ecran) => api('retours', { method: 'POST', corps: { genre, texte: texte.slice(0, 3000), ecran: (ecran || '').slice(0, 200), version: (window.__version || '').slice(0, 40) }, prefer: 'return=minimal' });
export const adminQuota = () => rpc('admin_quota');
export const adminChangerQuota = (n) => rpc('admin_changer_quota', { n });
export const adminRetours = () => rpc('admin_retours');
export const adminEntonnoir = (jours) => rpc('admin_entonnoir', { jours });
export const adminParcours = (cible) => rpc('admin_parcours', { cible });

// Le suivi d'usage : un lot d'étapes, envoyé connecté ou non (l'ouverture précède le compte).
export async function envoyerEvenements(appareil, lot) {
  let t = SUPABASE_CLE;
  if (connecte()) { try { t = await jeton(); } catch { t = SUPABASE_CLE; } }
  const r = await fetch(`${SUPABASE_URL}/rest/v1/rpc/noter_evenements`, {
    method: 'POST', keepalive: true,
    headers: { apikey: SUPABASE_CLE, Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ appareil, lot }),
  });
  if (!r.ok) throw new Error(`Suivi indisponible (${r.status})`);
}
export const adminTraiterRetour = (retour, fait) => rpc('admin_traiter_retour', { retour, fait });

// COURS PARTAGÉS (page partager.html) ------------------------------------------------------
// Les fichiers vont dans un dossier privé au nom du compte ; seul l'administrateur peut les lire.
const TYPES_DEPOT = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', heic: 'image/heic', heif: 'image/heif', webp: 'image/webp', pdf: 'application/pdf', docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' };
export const typeDepot = (f) => (Object.values(TYPES_DEPOT).includes(f.type) ? f.type : TYPES_DEPOT[(f.name.split('.').pop() || '').toLowerCase()] || null);
const nomPropre = (n) => n.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\w.-]+/g, '-').slice(-60) || 'fichier';

export async function deposerCours({ annee, matiere, equipe, fichiers, rappel }, progres = () => {}) {
  const t = await jeton(); const uid = session.user.id; const chemins = [];
  for (const [i, f] of fichiers.entries()) {
    progres(i);
    const nom = `${uid}/${Date.now().toString(36)}-${i}-${nomPropre(f.name)}`;
    const r = await fetch(`${SUPABASE_URL}/storage/v1/object/depots/${nom}`, { method: 'POST', headers: { apikey: SUPABASE_CLE, Authorization: `Bearer ${t}`, 'Content-Type': typeDepot(f), 'x-upsert': 'false' }, body: f });
    if (!r.ok) throw new Error(r.status === 413 ? `${f.name} : 20 Mo au plus par fichier.` : `${f.name} n’a pas pu partir. Réessaie.`);
    chemins.push(nom);
  }
  try { await api('depots', { method: 'POST', corps: { annee, matiere, equipe: equipe || null, fichiers: chemins, accord: true }, prefer: 'return=minimal' }); } catch (e) {
    throw new Error(/54000|400/.test(e.message) ? 'Tu as déjà fait 10 dépôts aujourd’hui. Reviens demain.' : 'Le dépôt n’a pas pu être enregistré. Réessaie.');
  }
  const corps = { rappel, annee, matiere, equipe: equipe || null };
  const maj = await api(`contributeurs?id=eq.${uid}`, { method: 'PATCH', corps: { ...corps, maj: new Date().toISOString() }, prefer: 'return=representation' }).catch(() => null);
  if (!maj?.length) await api('contributeurs', { method: 'POST', corps, prefer: 'return=minimal' }).catch(() => {});
}
// Lien « ne plus recevoir » des e-mails du vendredi : sans connexion.
export async function arreterRappelCours(jetonRappel) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/rpc/arreter_rappel_cours`, { method: 'POST', headers: { apikey: SUPABASE_CLE, Authorization: `Bearer ${SUPABASE_CLE}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ jeton: jetonRappel }) });
  if (!r.ok) throw new Error('Lien invalide.');
}
