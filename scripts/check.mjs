// Contrôle du contenu : références, champs obligatoires et règles anti-devinette.
import { lireContenu } from './parse.mjs';
import { indexer, creerRng, optionsProbleme, blocsPuzzle, casJuge, roundPlan, planOf, roundArchitecte, grillePaires, composerDefi, composerBoss } from '../app/js/engine.js';

const c = indexer(lireContenu());
const erreurs = []; const notes = [];
const err = (m) => erreurs.push(m);
const ids = new Set(c.arrets.map((a) => a.id));
if (ids.size !== c.arrets.length) err('identifiants en double');

const carte = c.arrets.filter((a) => !a.zones.includes(10));
notes.push(`${carte.length} arrêts de la carte, ${c.arrets.length} au total, ${c.familles.length} familles, ${c.juges.length} cas du juge, ${c.sujets.length} sujets`);
if (carte.length !== 100) err(`attendu 100 arrêts sur la carte, trouvé ${carte.length}`);

for (const a of c.arrets) {
  for (const k of ['h', 'q', 's', 'po']) if (!a[k]) err(`${a.id} : champ ${k} manquant`);
  if (!a.nf) for (const k of ['f', 'pr']) if (!a[k]) err(`${a.id} : champ ${k} manquant`);
  for (const z of a.zones) if (!a.ap[z]) err(`${a.id} : apport manquant pour la zone ${z}`);
  if (a.imp === 3 && a.x.length < 2) err(`${a.id} : deux faux problèmes attendus`);
  if (!c.famillesDe.has(a.id)) err(`${a.id} : aucune famille de jumeaux`);
}
for (const f of c.familles) for (const m of f.m) if (!ids.has(m.id)) err(`famille ${f.id} : ${m.id} inconnu`);
for (const j of c.juges) {
  if (!ids.has(j.id)) err(`juge : ${j.id} inconnu`);
  if (c.parId.get(j.id)?.nf) err(`juge : ${j.id} a des faits non confirmés`);
  if (j.d?.length !== 3) err(`juge ${j.id} : 3 décisions attendues`);
  if (j.rx.length !== 3) err(`juge ${j.id} : 3 mauvais raisonnements attendus`);
  if (j.rx.some((r) => !r.w)) err(`juge ${j.id} : explication manquante`);
}
for (const s of c.sujets) {
  for (const k of ['1a', '1b', '2a', '2b']) for (const id of s.bon[k].ids) if (!ids.has(id)) err(`sujet ${s.id} : ${id} inconnu`);
  if (s.mauvais.length !== 2) err(`sujet ${s.id} : 2 mauvais plans attendus`);
  for (const m of s.mauvais) if (!c.defauts[m.code]) err(`sujet ${s.id} : défaut ${m.code} inconnu`);
  for (const z of s.zones) if (!c.zones.find((x) => x.id === z)) err(`sujet ${s.id} : zone ${z}`);
}

// Règle : la bonne réponse n'est pas repérable à sa longueur.
function rang(opts, estBonne) {
  const tri = [...opts].sort((a, b) => b.t.length - a.t.length);
  return tri.findIndex(estBonne);
}
function stats(nom, tirages, seuil = 0.42) {
  const n = tirages.length; const compte = new Map();
  let ecart = 0; let pire = 0;
  for (const { opts } of tirages) {
    const r = rang(opts, (o) => o.ok); compte.set(r, (compte.get(r) || 0) + 1);
    const L = opts.map((o) => o.t.length); const ratio = Math.max(...L) / Math.min(...L);
    ecart += ratio; pire = Math.max(pire, ratio);
  }
  const part = (compte.get(0) || 0) / n; const k = tirages[0].opts.length;
  const court = (compte.get(k - 1) || 0) / n;
  notes.push(`${nom} : bonne réponse la plus longue ${(part * 100).toFixed(0)} %, la plus courte ${(court * 100).toFixed(0)} % (hasard ${(100 / k).toFixed(0)} %), écart moyen ×${(ecart / n).toFixed(2)}, pire ×${pire.toFixed(2)}`);
  if (part > seuil) err(`${nom} : la bonne réponse est trop souvent la plus longue (${(part * 100).toFixed(0)} %)`);
  if (court > seuil) err(`${nom} : la bonne réponse est trop souvent la plus courte (${(court * 100).toFixed(0)} %)`);
  return part;
}
const rng = creerRng(42);
const pb = []; for (const a of c.arrets.filter((x) => !x.nf)) for (let i = 0; i < 30; i++) pb.push({ a, opts: optionsProbleme(c, a, rng) });
stats('Problèmes de droit', pb);
const crafted = c.arrets.filter((a) => a.imp === 3);
const pb3 = []; for (const a of crafted) for (let i = 0; i < 30; i++) pb3.push({ opts: optionsProbleme(c, a, rng) });
stats('Problèmes de droit, arrêts 3/3', pb3);
stats('Décisions du juge', c.juges.map((j) => ({ opts: j.d.map((t, i) => ({ t, ok: i === 0 })) })), 0.5);
stats('Raisonnements du juge', c.juges.map((j) => ({ opts: [{ t: j.r, ok: true }, ...j.rx.map((r) => ({ t: r.t, ok: false }))] })), 0.34);
const taille = (p) => Object.values(p).join(' ');
stats('Bon plan', c.sujets.map((s) => ({ opts: [{ t: taille(planOf(s)), ok: true }, ...s.mauvais.map((m) => ({ t: taille(m.plan), ok: false }))] })), 0.5);

// Blocs du puzzle : les pièges doivent ressembler aux vraies pièces.
let ratioMax = 0; let total = 0; let somme = 0;
for (const a of c.arrets.filter((x) => !x.nf)) for (let i = 0; i < 5; i++) {
  const { blocs } = blocsPuzzle(c, a, rng);
  if (blocs.length < 5 || blocs.length > 7) err(`${a.id} : ${blocs.length} blocs de puzzle`);
  const L = blocs.map((b) => b.t.length); const r = Math.max(...L) / Math.min(...L); ratioMax = Math.max(ratioMax, r); somme += r; total++;
}
notes.push(`Puzzle : écart moyen ×${(somme / total).toFixed(2)}, pire ×${ratioMax.toFixed(2)}`);

// Position de la bonne réponse : elle doit tomber partout à parts égales.
{
  const pos = [0, 0, 0, 0]; let n = 0;
  for (const a of c.arrets.filter((x) => !x.nf)) for (let i = 0; i < 40; i++) { pos[optionsProbleme(c, a, rng).findIndex((o) => o.ok)]++; n++; }
  const parts = pos.map((x) => x / n);
  notes.push(`Position de la bonne réponse : ${parts.map((x) => (x * 100).toFixed(1) + ' %').join(', ')}`);
  if (parts.some((x) => Math.abs(x - 0.25) > 0.02)) err('position de la bonne réponse mal répartie');
}

// Génération de séances : aucune ne doit planter, quelles que soient les zones.
for (let i = 0; i < 400; i++) {
  const zones = c.zones.map((z) => z.id).filter(() => rng() > 0.5); if (!zones.length) zones.push(1);
  composerDefi(c, zones, [], rng);
  for (const z of zones) composerBoss(c, z, rng);
}
for (const s of c.sujets) roundPlan(c, s, rng), roundArchitecte(c, s, rng);
for (const v of ['apport', 'annee', 'jumeaux']) for (let i = 0; i < 300; i++) {
  const z = [1 + Math.floor(rng() * 10)]; const g = grillePaires(c, z, rng, 4, v);
  if (g.lignes.length < 2) err(`grille trop petite (${v}, zone ${z})`);
  if (new Set(g.lignes.map((l) => l.id)).size !== g.lignes.length) err('doublon dans une grille');
}

console.log(notes.join('\n'));
// Paires, variante année : le nom ne doit ni souffler l'année ni se répéter.
for (let i = 0; i < 600; i++) {
  const zs = [...new Set(c.arrets.flatMap((a) => a.zones))];
  const g = grillePaires(c, zs, Math.random, 4 + (i % 2), 'annee');
  const noms = g.lignes.map((l) => l.nom);
  if (noms.some((n) => /\(\d{4}\)/.test(n))) err(`année soufflée dans une grille : ${noms.join(', ')}`);
  if (new Set(noms).size !== noms.length) err(`nom répété dans une grille : ${noms.join(', ')}`);
  if (new Set(g.lignes.map((l) => l.an)).size !== noms.length) err('année répétée dans une grille');
}

if (erreurs.length) { console.error(`\n${erreurs.length} erreur(s) :\n- ` + [...new Set(erreurs)].slice(0, 60).join('\n- ')); process.exit(1); }
console.log('\nContenu valide.');
