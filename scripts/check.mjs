// Contrôle du contenu : références, champs obligatoires et règles anti-devinette.
import { lireContenu, lireObligations, lireObligations1, lireAdmin2 } from './parse.mjs';
import { indexer, creerRng, optionsProbleme, blocsPuzzle, casJuge, roundPlan, planOf, roundArchitecte, grillePaires, composerDefi, composerBoss, questionsDunk, tirerDunk } from '../app/js/engine.js';

const erreurs = [];
// Droit administratif : les deux équipes passent les mêmes contrôles (l'équipe 1 a en plus sa carte de 100 arrêts et ses histoires).
function controlerAdmin(c, equipe) {
const notes = [`DROIT ADMINISTRATIF, ÉQUIPE ${equipe}`];
const err = (m) => erreurs.push(equipe === 1 ? m : `admin, équipe ${equipe} : ${m}`);
for (const s of c.sujets) verifierArret(s, err);
// Frises du droit administratif : années dans l'ordre, fiches existantes, question valide.
const idsCartes = new Set(c.arrets.map((a) => a.id));
for (const f of c.frises || []) {
  const ans = f.e.map((e) => e.an);
  if (ans.some((a, i) => i && a < ans[i - 1])) err(`frise ${f.id} : années à revoir`);
  if (f.e.length < 4 || !f.p || !f.q || !(f.r >= 1 && f.r <= f.e.length)) err(`frise ${f.id} : incomplète`);
  if (new Set(f.e.map((e) => e.t)).size !== f.e.length) err(`frise ${f.id} : deux décisions identiques`);
  f.e.forEach((e) => { if (!e.carte || !idsCartes.has(e.carte)) err(`frise ${f.id} : fiche inconnue ${e.carte}`); if (!e.ch || !e.t) err(`frise ${f.id} : étape incomplète`); });
}
const ids = new Set(c.arrets.map((a) => a.id));
if (ids.size !== c.arrets.length) err('identifiants en double');

const carte = c.arrets.filter((a) => !a.zones.includes(10));
notes.push(`${carte.length} arrêts de la carte, ${c.arrets.length} au total, ${c.familles.length} familles, ${c.juges.length} cas du juge, ${c.sujets.length} sujets`);
if (equipe === 1 && carte.length !== 100) err(`attendu 100 arrêts sur la carte, trouvé ${carte.length}`);

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
  const z = [1 + Math.floor(rng() * c.zones.length)]; const g = grillePaires(c, z, rng, 4, v);
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
}
controlerAdmin(indexer(lireContenu()), 1);
controlerAdmin(indexer(lireAdmin2()), 2);

// DROIT DES OBLIGATIONS -----------------------------------------------------------
function controlerObligations(ob, equipe) {
  const notesO = []; const err2 = (m) => erreurs.push(`obligations, équipe ${equipe} : ${m}`);
  const idsO = new Set(ob.cartes.map((a) => a.id));
  if (idsO.size !== ob.cartes.length) err2('identifiants en double');
  const lien = (id, ou) => { if (!idsO.has(id)) err2(`${ou} : fiche ${id} inconnue`); };
  const zonesO = new Set(ob.zones.map((z) => z.id));
  for (const a of ob.cartes) for (const z of a.zones) if (!zonesO.has(z)) err2(`${a.id} : chambre ${z}`);
  for (const a of ob.arrets) for (const k of ['q', 's', 'po']) if (!a[k]) err2(`${a.id} : champ ${k} manquant`);
  for (const c of ob.cas) {
    if (c.etapes.length < 2) err2(`cas ${c.id} : trop peu d'étapes`);
    if (!c.c || !c.v) err2(`cas ${c.id} : énoncé ou jugement manquant`);
    for (const e of c.etapes) if (e.x.length < 2) err2(`cas ${c.id}, étape ${e.label} : deux mauvaises réponses attendues`);
    c.liens.forEach((l) => lien(l, `cas ${c.id}`));
  }
  for (const r of ob.remedes) {
    if (r.dx.length !== 2 || r.rx.length !== 2 || !r.d || !r.r || !r.c) err2(`remède ${r.id} incomplet`);
    r.liens.forEach((l) => lien(l, `remède ${r.id}`));
  }
  for (const f of ob.frises) {
    const ans = f.e.map((e) => e.an);
    if (ans.some((a, i) => i && a <= ans[i - 1])) err2(`frise ${f.id} : années à revoir`);
    if (!f.q || !(f.r >= 1 && f.r <= f.e.length)) err2(`frise ${f.id} : question`);
    f.e.forEach((e) => { if (e.carte) lien(e.carte, `frise ${f.id}`); });
  }
  for (const q of ob.qualifs) {
    if (new Set(q.m.map((m) => m.n)).size < 4) err2(`famille ${q.id} : moins de 4 notions`);
    q.m.forEach((m) => lien(m.carte, `famille ${q.id}`));
  }
  for (const s of ob.sujets) {
    verifierArret(s, err2);
    for (const k of ['1a', '1b', '2a', '2b']) s.bon[k].ids.forEach((id) => lien(id, `sujet ${s.id}`));
    if (s.mauvais.length !== 2) err2(`sujet ${s.id} : 2 mauvais plans attendus`);
    for (const m of s.mauvais) if (!ob.defauts[m.code]) err2(`sujet ${s.id} : défaut ${m.code} inconnu`);
  }
  for (const q of ob.questions) if (q.faux.includes(q.bonne)) err2(`question en double : ${q.q}`);
  // Chaque question d'exercice doit pouvoir se résoudre sans se fier à la longueur des réponses.
  const statsO = (nom, opts, seuil) => {
    const places = opts.map((o) => [...o].sort((a, b) => b.t.length - a.t.length).findIndex((x) => x.ok));
    const k = opts[0].length; const long = places.filter((p) => p === 0).length / places.length; const court = places.filter((p) => p === k - 1).length / places.length;
    notesO.push(`${nom} : la plus longue ${(long * 100).toFixed(0)} %, la plus courte ${(court * 100).toFixed(0)} % (hasard ${(100 / k).toFixed(0)} %), ${places.length} questions`);
    if (long > seuil) err2(`${nom} : bonne réponse trop souvent la plus longue (${(long * 100).toFixed(0)} %)`);
    if (court > seuil) err2(`${nom} : bonne réponse trop souvent la plus courte (${(court * 100).toFixed(0)} %)`);
  };
  statsO('Cas pratiques', ob.cas.flatMap((c) => c.etapes.map((e) => [{ t: e.t, ok: true }, ...e.x.map((x) => ({ t: x.t }))])), 0.46);
  statsO('Remèdes', ob.remedes.map((r) => [{ t: r.d, ok: true }, ...r.dx.map((x) => ({ t: x.t }))]), 0.46);
  statsO('Justifications', ob.remedes.map((r) => [{ t: r.r, ok: true }, ...r.rx.map((x) => ({ t: x.t }))]), 0.46);
  statsO('Questions rapides', ob.questions.map((q) => [{ t: q.bonne, ok: true }, ...q.faux.map((t) => ({ t }))]), 0.46);
  // Génération : ni plantage, ni question sans réponse, quelles que soient les chambres.
  // Un chapitre en travaux peut rester vide : il ne compose alors aucune séance.
  const rngO = creerRng(7);
  const zonesPleines = ob.zones.map((z) => z.id).filter((id) => ob.cartes.some((a) => a.zones.includes(id)));
  for (const id of [...new Set(['cas', 'remedes', 'frises', 'qualifs', 'sujets'].flatMap((k) => ob[k].flatMap((x) => x.zones)))]) if (!zonesPleines.includes(id)) err2(`exercice dans la chambre vide ${id}`);
  for (const k of ['cas', 'remedes', 'frises', 'qualifs', 'sujets']) if (new Set(ob[k].map((x) => x.id)).size !== ob[k].length) err2(`identifiant en double dans ${k}`);
  for (let i = 0; i < 300; i++) {
    const zs = zonesPleines.filter(() => rngO() > 0.5); if (!zs.length) zs.push(1);
    for (const r of composerDefi(ob, zs, [], rngO)) if (!r?.type) err2('défi vide');
    for (const z of zs) composerBoss(ob, z, rngO);
    const q = questionsDunk(ob, zs, rngO); const deja = new Set();
    for (let t = 0; t < 30; t++) {
      const x = tirerDunk(q, t, new Set(), deja, rngO);
      if (x.options.filter((o) => o.ok).length !== 1 || new Set(x.options.map((o) => o.t)).size !== x.options.length) err2(`question de dunk mal formée : ${x.q}`);
    }
  }
  console.log(`\nÉquipe ${equipe} : ${ob.arrets.length} arrêts, ${ob.articles.length} articles, ${ob.cas.length} cas, ${ob.qualifs.length} familles, ${ob.remedes.length} remèdes, ${ob.frises.length} frises, ${ob.sujets.length} sujets, ${ob.questions.length} questions`);
  console.log(notesO.join('\n'));
}
controlerObligations(indexer(lireObligations(), 2), 2);
{
  // L'équipe 1 : chaque chambre du parcours doit fournir une audience complète.
  const un = indexer(lireObligations1(), 1);
  controlerObligations(un, 1);
  for (const z of un.zones) {
    const dans = (x) => x.zones.includes(z.id);
    const n = { qualifs: un.qualifs.filter(dans).length, cas: un.cas.filter(dans).length, remedes: un.remedes.filter(dans).length, frises: un.frises.filter(dans).length, sujets: un.sujets.filter(dans).length };
    if (z.travaux) { if (Object.values(n).some(Boolean) || un.cartes.some(dans)) erreurs.push(`équipe 1 : la chambre ${z.id} en travaux doit rester vide`); continue; }
    for (const [k, v] of Object.entries(n)) if (!v) erreurs.push(`équipe 1, chambre ${z.id} : aucun exercice de type ${k}`);
    if (n.cas < 2) erreurs.push(`équipe 1, chambre ${z.id} : deux cas au moins pour l'audience`);
  }
}
{ const a1 = indexer(lireContenu()); if (questionsDunk(a1, a1.zones.map((z) => z.id), Math.random).length < 300) erreurs.push('trop peu de questions de dunk en administratif'); }
{ const a2 = indexer(lireAdmin2()); if (questionsDunk(a2, a2.zones.map((z) => z.id), Math.random).length < 200) erreurs.push('trop peu de questions de dunk en administratif, équipe 2'); }

if (erreurs.length) { console.error(`\n${erreurs.length} erreur(s) :\n- ` + [...new Set(erreurs)].slice(0, 60).join('\n- ')); process.exit(1); }
console.log('\nContenu valide.');

// Un commentaire doit porter son arrêt, et chaque phrase à justifier doit en être tirée mot pour mot.
function verifierArret(s, e) {
  if (s.type === 'C' && !s.arret) e(`${s.id} : commentaire sans arrêt`);
  if (!s.arret) return;
  const texte = s.arret.txt.join(' ');
  if (!s.arret.date || !s.arret.ref || !s.arret.res) e(`${s.id} : date, référence ou résumé manquant`);
  for (const [c, j] of Object.entries(s.arret.just)) {
    if (!s.bon[c]) e(`${s.id} : partie ${c} inconnue`);
    for (const p of [j.bon, ...j.faux]) if (!texte.includes(p)) e(`${s.id} : citation absente du texte : ${p}`);
    if (new Set([j.bon, ...j.faux]).size !== 3) e(`${s.id} : phrases identiques en ${c}`);
  }
  if (Object.keys(s.arret.just).length < 2) e(`${s.id} : moins de deux parties à justifier`);
}
