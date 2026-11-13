// Le suivi d'usage : quelques étapes du parcours (ouverture, installation, connexion, séances),
// pour voir où l'on décroche. Rien d'autre : ni ce qui est répondu, ni la navigation fine.
// Les étapes attendent sur le téléphone et partent par lots ; hors ligne, elles patientent.
import { envoyerEvenements } from './compte.js';

const CLE = 'gdroit-suivi';
const CLE_APPAREIL = 'gdroit-appareil';

function lire(cle) { try { return localStorage.getItem(cle); } catch { return null; } }
function ecrire(cle, v) { try { localStorage.setItem(cle, v); } catch { /* stockage bloqué */ } }

export function appareil() {
  let id = lire(CLE_APPAREIL);
  if (!id) {
    id = (crypto.randomUUID?.() || `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`).slice(0, 40);
    ecrire(CLE_APPAREIL, id);
  }
  return id;
}

let file = [];
try { file = JSON.parse(lire(CLE)) || []; } catch { file = []; }
let minuteur = null; let envoi = false;

export function noter(t, d = {}) {
  if (new URLSearchParams(location.search).has('test')) return;
  file.push({ t, d, q: new Date().toISOString() });
  if (file.length > 150) file = file.slice(-150);
  ecrire(CLE, JSON.stringify(file));
  clearTimeout(minuteur);
  minuteur = setTimeout(vider, t === 'ouverture' ? 4000 : 8000);
}

export async function vider() {
  if (envoi || !file.length || navigator.onLine === false) return;
  envoi = true;
  const lot = file.slice(0, 40);
  try {
    await envoyerEvenements(appareil(), lot);
    file = file.slice(lot.length); ecrire(CLE, JSON.stringify(file));
  } catch { /* on réessaiera */ }
  envoi = false;
  if (file.length) minuteur = setTimeout(vider, 3000);
}

// Ce que le téléphone dit de lui-même : système, navigateur, appli installée ou non.
export function contexte() {
  const ua = navigator.userAgent;
  const ios = /iPhone|iPad|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const android = /Android/.test(ua);
  const os = ios ? 'iOS' : android ? 'Android' : /Mac/.test(ua) ? 'Mac' : /Windows/.test(ua) ? 'Windows' : 'autre';
  const inapp = /Instagram|FBAN|FBAV|Snapchat|LinkedInApp|TikTok|musical_ly|Line\/|WhatsApp/i.test(ua);
  const nav = inapp ? 'dans une appli' : /CriOS/.test(ua) ? 'Chrome' : /FxiOS|Firefox/.test(ua) ? 'Firefox' : /EdgiOS|EdgA|Edg\//.test(ua) ? 'Edge'
    : /SamsungBrowser/.test(ua) ? 'Samsung' : /OPR|OPiOS/.test(ua) ? 'Opera' : ios ? (/Safari/.test(ua) ? 'Safari' : 'autre') : /Chrome/.test(ua) ? 'Chrome' : /Safari/.test(ua) ? 'Safari' : 'autre';
  return { os, nav, inapp, ios, android };
}

if (typeof window !== 'undefined') {
  addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') vider(); });
  addEventListener('online', () => vider());
}
