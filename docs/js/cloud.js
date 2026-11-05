// Stockage en ligne facultatif : liste des rappels et copie automatique de la progression.
import { SUPABASE_URL, SUPABASE_CLE } from './config.js';
import { etat, sauver, jour, remplacerEtat } from './state.js';

const enLocal = ['localhost', '127.0.0.1'].includes(location.hostname);
// En développement, rien ne part vers la vraie base, sauf test explicite (?cloud).
export const cloudActif = () => Boolean(SUPABASE_URL) && (!enLocal || new URLSearchParams(location.search).has('cloud'));

async function appel(nom, corps) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${nom}`, {
    method: 'POST',
    headers: { apikey: SUPABASE_CLE, 'Content-Type': 'application/json' },
    body: JSON.stringify(corps),
  });
  if (!r.ok) throw new Error(`Service indisponible (${r.status})`);
  const t = await r.text();
  return t ? JSON.parse(t) : null;
}

export const inscrireAbonnement = (abonnement) => appel('inscrire_abonne', { abonnement });

// Le code de récupération est tiré au hasard sur le téléphone : il sert seul de clé.
function codeCloud() {
  if (!etat.cloud.code) {
    const o = crypto.getRandomValues(new Uint8Array(15));
    const a = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let c = ''; let bits = 0; let v = 0;
    for (const x of o) { v = (v << 8) | x; bits += 8; while (bits >= 5) { bits -= 5; c += a[(v >> bits) & 31]; } v &= 255; }
    etat.cloud.code = c.padEnd(24, 'A').match(/.{6}/g).join('-');
    sauver();
  }
  return etat.cloud.code;
}
export const codeRecuperation = () => (cloudActif() ? codeCloud() : null);
const normaliser = (c) => c.trim().toUpperCase().replace(/[^A-Z0-9]/g, '').replace(/(.{6})(?=.)/g, '$1-');

let enCours = false;
export async function copierEnLigne() {
  if (!cloudActif() || enCours || !etat.stats.seances || navigator.onLine === false) return false;
  enCours = true;
  try {
    const code = codeCloud();
    const { enCours: seance, ...reste } = etat; void seance;
    reste.oblig = { ...etat.oblig, enCours: null };
    await appel('ecrire_sauvegarde', { code, donnees: JSON.stringify(reste) });
    etat.cloud.dernier = jour(); sauver();
    return true;
  } catch { return false; } finally { enCours = false; }
}

// Un cadeau vise un seul téléphone, par son code. Son identifiant empêche de le recevoir deux fois.
export async function recevoirCadeaux() {
  if (!cloudActif() || !etat.cloud.code || navigator.onLine === false) return 0;
  try {
    const liste = await appel('lire_cadeaux', { code: etat.cloud.code });
    const nouveaux = (Array.isArray(liste) ? liste : []).filter((c) => !etat.cadeaux.includes(c.id));
    if (!nouveaux.length) return 0;
    let total = 0;
    for (const c of nouveaux) { total += c.jetons; etat.cadeaux.push(c.id); }
    etat.jetons += total;
    sauver();
    return total;
  } catch { return 0; }
}

export async function restaurerEnLigne(saisi) {
  const code = normaliser(saisi);
  const brut = await appel('lire_sauvegarde', { code });
  if (!brut) throw new Error('Aucune sauvegarde pour ce code.');
  const e = JSON.parse(brut);
  e.cloud = { ...e.cloud, code };
  remplacerEtat(e);
}
