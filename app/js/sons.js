// Identité sonore : tout est synthétisé, donc disponible hors ligne, sans fichier à télécharger.
// Bois, cire et cloches dans une gamme pentatonique de ré, avec une signature de quatre notes.
import { etat } from './state.js';

const GAMME = [587.33, 659.25, 739.99, 880, 987.77, 1174.66, 1318.51, 1479.98, 1760, 1975.53, 2349.32];
const SIGNATURE = [587.33, 880, 987.77, 1479.98]; // ré, la, si, fa dièse : le motif du Palais.
const PARTIELS = [[1, 1, 1], [2.01, 0.42, 0.7], [2.76, 0.26, 0.5], [5.4, 0.1, 0.3], [8.93, 0.04, 0.16]];

let ctx = null;
let bus = null;

function reponseSalle(c) {
  const duree = 1.6; const n = Math.floor(c.sampleRate * duree);
  const b = c.createBuffer(2, n, c.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = b.getChannelData(ch); let bas = 0;
    for (let i = 0; i < n; i++) {
      const t = i / n;
      bas += (Math.random() * 2 - 1 - bas) * (0.5 - 0.42 * t);
      d[i] = bas * (1 - t) ** 3.2;
    }
  }
  return b;
}

let bruitBlanc = null;
function montage(c) {
  const sortie = c.createDynamicsCompressor();
  sortie.threshold.value = -16; sortie.ratio.value = 5; sortie.attack.value = 0.002; sortie.release.value = 0.18;
  const maitre = c.createGain(); maitre.gain.value = 0.9;
  sortie.connect(maitre); maitre.connect(c.destination);
  const salle = c.createConvolver(); salle.buffer = reponseSalle(c);
  const envoi = c.createGain(); envoi.gain.value = 0.3;
  envoi.connect(salle); salle.connect(sortie);
  if (!bruitBlanc || bruitBlanc.sampleRate !== c.sampleRate) {
    bruitBlanc = c.createBuffer(1, c.sampleRate, c.sampleRate);
    const d = bruitBlanc.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  return { c, sortie, envoi };
}

function sortir(b, noeud, salle = 0.5) {
  noeud.connect(b.sortie);
  if (salle) { const g = b.c.createGain(); g.gain.value = salle; noeud.connect(g); g.connect(b.envoi); }
}

function env(b, t, pic, attaque, duree) {
  const g = b.c.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(Math.max(pic, 0.0002), t + attaque);
  g.gain.exponentialRampToValueAtTime(0.0001, t + duree);
  return g;
}

function osc(b, type, f, t, fin, g, f2 = null) {
  const o = b.c.createOscillator(); o.type = type; o.frequency.setValueAtTime(f, t);
  if (f2) o.frequency.exponentialRampToValueAtTime(f2, fin);
  o.connect(g); o.start(t); o.stop(fin + 0.02);
}

function cloche(b, f, t, duree = 1.1, vol = 0.14, salle = 0.8) {
  for (const [r, a, d] of PARTIELS) {
    if (f * r > 16000) continue;
    const g = env(b, t, vol * a, 0.004, duree * d);
    osc(b, 'sine', f * r, t, t + duree * d, g);
    sortir(b, g, salle);
  }
}

function pince(b, f, t, duree = 0.32, vol = 0.2, salle = 0.4) {
  const g = env(b, t, vol, 0.003, duree);
  osc(b, 'sine', f, t, t + duree, g);
  sortir(b, g, salle);
  const g2 = env(b, t, vol * 0.3, 0.002, duree * 0.3);
  osc(b, 'triangle', f * 2, t, t + duree * 0.3, g2);
  sortir(b, g2, salle * 0.5);
}

function bruit(b, t, duree, vol, type, f1, f2, q = 1, salle = 0.25) {
  const s = b.c.createBufferSource(); s.buffer = bruitBlanc; s.loop = true;
  const fi = b.c.createBiquadFilter(); fi.type = type; fi.Q.value = q;
  fi.frequency.setValueAtTime(f1, t); fi.frequency.exponentialRampToValueAtTime(f2, t + duree);
  const g = env(b, t, vol, Math.min(0.03, duree * 0.3), duree);
  s.connect(fi); fi.connect(g); sortir(b, g, salle);
  s.start(t, Math.random() * 0.8); s.stop(t + duree + 0.02);
}

function bois(b, f, t, vol = 0.3, duree = 0.09, salle = 0.3) {
  const g = env(b, t, vol, 0.001, duree);
  osc(b, 'triangle', f * 1.5, t, t + duree, g, f);
  sortir(b, g, salle);
  bruit(b, t, 0.03, vol * 0.5, 'bandpass', f * 3, f * 2, 3, salle * 0.5);
}

function cire(b, t, vol = 0.55) {
  const g = env(b, t, vol, 0.002, 0.34);
  osc(b, 'sine', 170, t, t + 0.34, g, 46);
  sortir(b, g, 0.35);
  bruit(b, t, 0.07, vol * 0.55, 'lowpass', 1400, 300, 0.7, 0.3);
  bruit(b, t + 0.04, 0.2, vol * 0.1, 'highpass', 3200, 5200, 0.7, 0.1);
}

const accord = (b, f, t, duree, vol) => { for (const r of [1, 1.5, 2, 2.5198]) cloche(b, f * r, t, duree, vol); };

// Tenue rose : une boîte à musique, plus aiguë et scintillante.
const ton = (rose) => (rose ? 1.1225 : 1);
function scintille(b, t, n = 6, vol = 0.045) {
  for (let i = 0; i < n; i++) cloche(b, GAMME[6 + (i * 3) % 5] * 2, t + i * 0.045, 0.5, vol, 0.9);
}

const SONS = {
  tap(b, t, _o, rose) {
    if (rose) pince(b, 2349.32, t, 0.09, 0.05, 0.2); else bois(b, 1650, t, 0.09, 0.035, 0.12);
  },
  // Début de séance : une montée franche, jamais confondue avec un simple bouton.
  lancement(b, t, _o, rose) {
    const k = ton(rose);
    bruit(b, t, 0.34, 0.14, 'bandpass', 300, 3600, 1, 0.4);
    const g = env(b, t, 0.3, 0.012, 0.42); osc(b, 'sine', 73.42, t, t + 0.42, g, 146.83); sortir(b, g, 0.5);
    SIGNATURE.forEach((f, i) => pince(b, f * k, t + 0.1 + i * 0.075, 0.42, 0.17, 0.6));
    cloche(b, 1760 * k, t + 0.4, 0.9, 0.09);
    if (rose) scintille(b, t + 0.4, 5);
  },
  // Épreuve suivante : une page tournée, deux notes.
  epreuve(b, t, _o, rose) {
    const k = ton(rose);
    bruit(b, t, 0.13, 0.14, 'bandpass', 700, 3200, 1.1, 0.25);
    pince(b, 880 * k, t + 0.09, 0.26, 0.16, 0.5); pince(b, 1174.66 * k, t + 0.17, 0.4, 0.17, 0.6);
  },
  // Épreuve validée, sans être parfaite : un coup de tampon et une note qui se pose.
  valide(b, t, _o, rose) {
    const k = ton(rose);
    bois(b, 340, t, 0.34, 0.09, 0.4);
    cloche(b, 880 * k, t + 0.07, 0.8, 0.1); cloche(b, 1318.51 * k, t + 0.16, 0.9, 0.1);
  },
  // Dunk shot : le filet qui claque, et le ballon qui rebondit sur l'arceau.
  panier(b, t, { niveau = 0 }, rose) {
    const k = ton(rose); const i = Math.min(niveau, GAMME.length - 2);
    bruit(b, t, 0.16, 0.2, 'highpass', 2400, 5200, 0.8, 0.3);
    pince(b, GAMME[i] * k, t + 0.04, 0.3, 0.2); pince(b, GAMME[i + 1] * 1.5 * k, t + 0.1, 0.42, 0.17);
  },
  dunk(b, t, _o, rose) {
    const k = ton(rose);
    bois(b, 140, t, 0.6, 0.14, 0.8);
    bruit(b, t + 0.02, 0.3, 0.2, 'highpass', 1800, 6000, 0.8, 0.5);
    SIGNATURE.forEach((f, i) => cloche(b, f * k, t + 0.08 + i * 0.07, 1, 0.11));
    if (rose) scintille(b, t + 0.3, 6);
  },
  rebond(b, t) {
    bois(b, 520, t, 0.3, 0.1, 0.4);
    [0.18, 0.33, 0.44].forEach((d, i) => bois(b, 180, t + d, 0.24 - i * 0.06, 0.08, 0.2));
  },
  carte(b, t) { bruit(b, t, 0.11, 0.13, 'bandpass', 800, 3000, 1.2, 0.2); bois(b, 720, t + 0.07, 0.12, 0.05, 0.2); },
  retour(b, t) { bruit(b, t, 0.1, 0.17, 'bandpass', 2600, 700, 1.2, 0.15); },
  ecart(b, t) { bruit(b, t, 0.14, 0.11, 'bandpass', 1500, 320, 0.9, 0.2); bois(b, 300, t + 0.1, 0.13, 0.06, 0.2); },
  ok(b, t, { niveau = 0 }, rose) {
    const k = ton(rose); const i = Math.min(niveau, GAMME.length - 2);
    pince(b, GAMME[i] * k, t, 0.34, 0.2); pince(b, GAMME[i + 1] * 1.5 * k, t + 0.075, 0.5, 0.17);
    cloche(b, GAMME[i] * 2 * k, t + 0.075, 0.6, 0.05);
    if (rose) scintille(b, t + 0.1, 3);
  },
  ko(b, t, _o, rose) {
    if (rose) { SONS.bebew(b, t); return; }
    bois(b, 240, t, 0.26, 0.11, 0.3); pince(b, 196, t + 0.02, 0.24, 0.13, 0.3); pince(b, 146.83, t + 0.13, 0.36, 0.15, 0.4);
  },
  bebew(b, t) {
    const g1 = env(b, t, 0.16, 0.006, 0.12); osc(b, 'triangle', 880, t, t + 0.12, g1, 830); sortir(b, g1, 0.3);
    const g2 = env(b, t + 0.14, 0.18, 0.008, 0.36); osc(b, 'triangle', 830, t + 0.14, t + 0.5, g2, 277); sortir(b, g2, 0.4);
  },
  combo(b, t, { niveau = 5 }, rose) {
    const k = ton(rose); const base = niveau >= 10 ? 3 : 0;
    [0, 1, 2, 3, 4].forEach((n, i) => pince(b, GAMME[base + n] * k, t + i * 0.06, 0.3, 0.16));
    cloche(b, GAMME[base + 5] * k, t + 0.3, 1, 0.13);
    if (rose) scintille(b, t + 0.28, 5);
  },
  parfait(b, t) { SIGNATURE.forEach((f, i) => cloche(b, f, t + i * 0.1, 0.9, 0.12)); },
  slay(b, t) {
    for (let i = 0; i < 11; i++) pince(b, GAMME[i] * 1.1225, t + i * 0.038, 0.22, 0.13, 0.5);
    accord(b, GAMME[5] * 1.1225, t + 0.44, 1.5, 0.07);
    scintille(b, t + 0.44, 8, 0.05);
    bruit(b, t, 0.5, 0.05, 'highpass', 2000, 9000, 0.7, 0.5);
  },
  sceau(b, t, _o, rose) {
    cire(b, t);
    cloche(b, 146.83, t, 1.3, 0.13, 0.7);
    SIGNATURE.forEach((f, i) => cloche(b, f * ton(rose), t + 0.14 + i * 0.09, 0.9, 0.06));
  },
  marteau(b, t) {
    bois(b, 190, t, 0.62, 0.16, 0.9);
    const g = env(b, t, 0.38, 0.002, 0.3); osc(b, 'sine', 110, t, t + 0.3, g, 52); sortir(b, g, 0.8);
  },
  audience(b, t) {
    [0, 0.34, 0.68].forEach((d, i) => { bois(b, 170 + i * 12, t + d, 0.42 + i * 0.1, 0.14, 0.9); });
    const g = env(b, t + 0.68, 0.06, 0.2, 1.4); osc(b, 'sine', 146.83, t + 0.68, t + 2.1, g); sortir(b, g, 0.8);
  },
  jeton(b, t) { cloche(b, 3520, t, 0.4, 0.08, 0.4); cloche(b, 4698.6, t + 0.055, 0.5, 0.08, 0.4); },
  coffre(b, t, _o, rose) {
    bois(b, 260, t, 0.3, 0.12, 0.5);
    for (let i = 0; i < 9; i++) cloche(b, 3000 + (i * 947) % 2400, t + 0.12 + i * 0.05, 0.3, 0.035, 0.4);
    accord(b, 587.33 * ton(rose), t + 0.56, 1.3, 0.06);
  },
  grade(b, t, _o, rose) {
    const k = ton(rose);
    SIGNATURE.forEach((f, i) => { cloche(b, f * k, t + i * 0.15, 1.2, 0.12); pince(b, (f * k) / 2, t + i * 0.15, 0.4, 0.09); });
    accord(b, 587.33 * k, t + 0.6, 1.8, 0.075);
    const g = env(b, t + 0.6, 0.14, 0.01, 1.4); osc(b, 'sine', 146.83 * k, t + 0.6, t + 2, g); sortir(b, g, 0.7);
    if (rose) scintille(b, t + 0.6, 8);
  },
  deblocage(b, t, _o, rose) {
    bruit(b, t, 0.42, 0.1, 'bandpass', 500, 4200, 1.1, 0.5);
    accord(b, 587.33 * ton(rose), t + 0.36, 1.3, 0.07);
  },
  tic(b, t) { bois(b, 2100, t, 0.1, 0.03, 0.1); },
};

export function reveillerAudio() {
  try {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      ctx = new AC({ latencyHint: 'interactive' });
      bus = montage(ctx);
    }
    if (ctx.state !== 'running') ctx.resume();
  } catch { ctx = null; }
}

// « ambient » laisse la musique continuer et respecte le mode silencieux de l'iPhone.
export function appliquerSession() {
  try { if (navigator.audioSession) navigator.audioSession.type = etat.reglages.sonSilencieux ? 'playback' : 'ambient'; } catch { /* selon le navigateur */ }
}

const estRose = () => document.documentElement.dataset.theme === 'rose';

export function son(nom, o = {}) {
  if (!etat.reglages.son) return;
  if (!ctx) reveillerAudio();
  if (!ctx) return;
  try {
    if (ctx.state !== 'running') ctx.resume();
    SONS[nom]?.(bus, ctx.currentTime + 0.006 + (o.retard || 0), o, estRose());
  } catch { /* le son reste facultatif */ }
}

// Rendu hors temps réel, pour contrôler le niveau de chaque son sans enceinte.
export async function rendreSon(nom, o = {}, rose = false, duree = 3.5) {
  // Le compresseur met quelques dizaines de millisecondes à s'établir : on joue le son après lui.
  const debut = 0.5;
  const c = new OfflineAudioContext(2, 44100 * (duree + debut), 44100);
  SONS[nom](montage(c), debut, o, rose);
  const r = await c.startRendering();
  const d = r.getChannelData(0); let pic = 0; let somme = 0; let fin = 0;
  for (let i = 0; i < d.length; i++) { const v = Math.abs(d[i]); if (v > pic) pic = v; somme += v * v; if (v > 0.003) fin = i; }
  return { nom, rose, pic: +pic.toFixed(3), rms: +Math.sqrt(somme / d.length).toFixed(4), fin: +(fin / 44100 - debut).toFixed(2) };
}
export const NOMS_SONS = Object.keys(SONS);

// iPhone : aucune vibration pour le web, mais un interrupteur natif donne un petit retour tactile.
export function vibrer(motif = 12) {
  if (!etat.reglages.vibration) return;
  try {
    if (navigator.userActivation && !navigator.userActivation.isActive) return;
    if (navigator.vibrate) { navigator.vibrate(motif); return; }
    const l = document.createElement('label'); l.setAttribute('aria-hidden', 'true'); l.style.display = 'none';
    const i = document.createElement('input'); i.type = 'checkbox'; i.setAttribute('switch', '');
    l.append(i); document.head.append(l); l.click(); l.remove();
  } catch { /* facultatif */ }
}
