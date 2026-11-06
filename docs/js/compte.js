// Le compte : connexion obligatoire (Google ou code par email), profil et copie en ligne de la progression.
// Tout passe par l'API de Supabase, sans bibliothèque : la session est gardée sur le téléphone.
import { SUPABASE_URL, SUPABASE_CLE } from './config.js';
import { etat, sauver, remplacerEtat } from './state.js';

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

// Google : on part sur la page de Google, qui revient ici avec la session dans l'adresse.
export function connexionGoogle() {
  location.assign(`${SUPABASE_URL}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(ici())}`);
}
export function retourConnexion() {
  const p = new URLSearchParams(location.hash.slice(1));
  if (p.get('error_description')) { history.replaceState(null, '', ici() + location.search); throw new Error('Connexion annulée ou refusée.'); }
  if (!p.get('access_token')) return false;
  history.replaceState(null, '', ici() + location.search);
  garder({ access_token: p.get('access_token'), refresh_token: p.get('refresh_token'), expire: Date.now() + (+p.get('expires_in') || 3600) * 1000, user: null });
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
  try { const t = session?.access_token; if (t) await fetch(`${SUPABASE_URL}/auth/v1/logout`, { method: 'POST', headers: { apikey: SUPABASE_CLE, Authorization: `Bearer ${t}` } }); } catch { /* sans réseau */ }
  garder(null);
}

// PROFIL ------------------------------------------------------------------------------
export async function lireProfil() {
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
  return { ...reste, oblig: { ...etat.oblig, enCours: null } };
}
const poids = (e) => (e?.xp || 0) + (e?.oblig?.xp || 0) + (e?.stats?.seances || 0);

let envoi = null;
export async function envoyerProgression() {
  if (!connecte() || !session.user || navigator.onLine === false) return false;
  if (envoi) return envoi;
  envoi = (async () => {
    try {
      const maj = new Date().toISOString();
      await api('progressions?on_conflict=id', { method: 'POST', corps: { id: session.user.id, donnees: aEnvoyer(), maj }, prefer: 'resolution=merge-duplicates,return=minimal' });
      etat.compte = { ...etat.compte, sync: Date.parse(maj) }; sauver();
      return true;
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
    if (!local) choix = 'distant';
    else if (memeCompte && majDistante > (etat.compte.sync || 0)) choix = (etat.modifie || 0) > (etat.compte.sync || 0) ? (poids(distant.donnees) > poids(etat) ? 'distant' : 'local') : 'distant';
    else if (!memeCompte) choix = poids(distant.donnees) > poids(etat) ? 'distant' : 'local';
  }
  if (delai.depasse) return 'trop-tard';
  const pseudo = etat.compte?.pseudo;
  if (choix === 'distant') remplacerEtat({ ...distant.donnees, enCours: null });
  etat.compte = { id, email: session.user.email, pseudo, sync: choix === 'distant' ? Date.parse(distant.maj) : etat.compte?.sync || 0 };
  sauver();
  if (choix === 'local') await envoyerProgression();
  return choix === 'distant' ? 'en-ligne' : 'telephone';
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
    etat.jetons += total; sauver();
    return total;
  } catch { return 0; }
}
