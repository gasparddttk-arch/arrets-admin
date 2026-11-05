// Images personnelles de la tenue rose : elles restent sur le téléphone, jamais dans une sauvegarde.
import { lireImage, ecrireImage } from './state.js';

export const images = { mascotte: null, jeton: null };
const TAILLES = { mascotte: 720, jeton: 200 };
const cle = (type) => `image-${type}`;

function chargerFichier(fichier) {
  return new Promise((ok, ko) => {
    const url = URL.createObjectURL(fichier);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); ok(img); };
    img.onerror = () => { URL.revokeObjectURL(url); ko(new Error('Cette image n’a pas pu être lue.')); };
    img.src = url;
  });
}

// Fond uni : il devient transparent à partir des bords, pour que l'image se pose sur l'appli.
function detourer(d, l, h) {
  const px = d.data;
  const coins = [0, (l - 1) * 4, (h - 1) * l * 4, ((h - 1) * l + l - 1) * 4].map((i) => [px[i], px[i + 1], px[i + 2], px[i + 3]]);
  if (coins.some((c) => c[3] < 250)) return;
  const ref = coins.reduce((s, c) => [s[0] + c[0] / 4, s[1] + c[1] / 4, s[2] + c[2] / 4], [0, 0, 0]);
  const ecart = (i) => Math.hypot(px[i] - ref[0], px[i + 1] - ref[1], px[i + 2] - ref[2]);
  if (coins.some((c) => Math.hypot(c[0] - ref[0], c[1] - ref[1], c[2] - ref[2]) > 38)) return;
  const vu = new Uint8Array(l * h); const file = [];
  const pousser = (x, y) => { const k = y * l + x; if (!vu[k] && ecart(k * 4) < 46) { vu[k] = 1; file.push(k); } };
  for (let x = 0; x < l; x++) { pousser(x, 0); pousser(x, h - 1); }
  for (let y = 0; y < h; y++) { pousser(0, y); pousser(l - 1, y); }
  while (file.length) {
    const k = file.pop(); const x = k % l; const y = (k - x) / l;
    px[k * 4 + 3] = 0;
    if (x > 0) pousser(x - 1, y);
    if (x < l - 1) pousser(x + 1, y);
    if (y > 0) pousser(x, y - 1);
    if (y < h - 1) pousser(x, y + 1);
  }
}

function recadrer(c, g, l, h) {
  const px = g.getImageData(0, 0, l, h).data;
  let x0 = l; let y0 = h; let x1 = -1; let y1 = -1;
  for (let y = 0; y < h; y++) for (let x = 0; x < l; x++) if (px[(y * l + x) * 4 + 3] > 16) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  if (x1 < x0) return c;
  const sortie = document.createElement('canvas');
  sortie.width = x1 - x0 + 1; sortie.height = y1 - y0 + 1;
  sortie.getContext('2d').drawImage(c, -x0, -y0);
  return sortie;
}

export async function preparerImage(fichier, type) {
  const img = await chargerFichier(fichier);
  const max = TAILLES[type];
  const k = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
  const l = Math.max(1, Math.round(img.naturalWidth * k)); const h = Math.max(1, Math.round(img.naturalHeight * k));
  const c = document.createElement('canvas'); c.width = l; c.height = h;
  const g = c.getContext('2d', { willReadFrequently: true });
  g.drawImage(img, 0, 0, l, h);
  const d = g.getImageData(0, 0, l, h);
  detourer(d, l, h);
  g.putImageData(d, 0, 0);
  return recadrer(c, g, l, h).toDataURL('image/png');
}

export async function chargerImages() {
  for (const type of Object.keys(images)) images[type] = await lireImage(cle(type));
}
export async function enregistrerImage(type, dataUrl) {
  await ecrireImage(cle(type), dataUrl);
  images[type] = dataUrl;
}
export const retirerImage = (type) => enregistrerImage(type, null);
