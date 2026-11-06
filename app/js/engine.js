// Logique pure, sans DOM : tirage, distracteurs, composition des séances.
// Utilisée par l'appli et par les contrôles automatiques.
const dansZones = (zones) => (x) => x.zones.some((z) => zones.includes(z));

export function creerRng(seed = Date.now()) {
  let s = seed >>> 0;
  return () => { s |= 0; s = (s + 0x6d2b79f5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
export const melange = (a, rng = Math.random) => { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
export const choix = (a, rng = Math.random) => a[Math.floor(rng() * a.length)];

export function indexer(c, equipe = 2) {
  // « Meyet (1992) » : le nom court évite d'écrire l'année deux fois, ou de la souffler.
  for (const a of c.arrets) a.court = a.nom.replace(/\s*\(\d{4}\)$/, '');
  const articles = c.articles || [];
  for (const a of articles) a.court = a.nom;
  const cartes = [...c.arrets, ...articles];
  const parId = new Map(cartes.map((a) => [a.id, a]));
  const familles = c.familles || [];
  const famillesDe = new Map();
  for (const f of familles) for (const m of f.m) {
    if (!famillesDe.has(m.id)) famillesDe.set(m.id, []);
    famillesDe.get(m.id).push(f);
  }
  // Une équipe ne voit que le contenu commun et le sien.
  const garde = (x) => !x.eq || x.eq === 'c' || x.eq === String(equipe);
  return { ...c, matiere: c.matiere || 'admin', familles, juges: c.juges || [], articles, cartes, parId, famillesDe,
    cas: (c.cas || []).filter(garde), remedes: (c.remedes || []).filter(garde), frises: (c.frises || []).filter(garde),
    qualifs: c.qualifs || [], questions: c.questions || [] };
}

// Faux jumeaux : les arrêts qui partagent une famille.
export function jumeaux(ix, id) {
  const out = new Map();
  for (const f of ix.famillesDe.get(id) || []) for (const m of f.m) if (m.id !== id && !out.has(m.id)) out.set(m.id, { id: m.id, k: m.k, f });
  return [...out.values()];
}

// Choisit des textes de longueur proche de la référence, avec au moins un plus long
// quand c'est possible, pour que la bonne réponse ne soit pas repérable à sa taille.
export function prochesEnLongueur(ref, pool, n, rng = Math.random) {
  const L = ref.length;
  const notes = pool.map((p) => ({ p, d: Math.abs(p.t.length - L) + rng() * 18 })).sort((a, b) => a.d - b.d);
  const retenus = notes.slice(0, Math.max(n + 3, 6)).map((x) => x.p);
  const pris = melange(retenus, rng).slice(0, n);
  const plusLong = pris.some((p) => p.t.length > L);
  if (!plusLong) {
    const candidat = retenus.find((p) => p.t.length > L && !pris.includes(p));
    if (candidat) pris[pris.length - 1] = candidat;
  }
  const plusCourt = pris.some((p) => p.t.length < L);
  if (!plusCourt && pris.length > 1) {
    const candidat = retenus.find((p) => p.t.length < L && !pris.includes(p));
    if (candidat) pris[0] = candidat;
  }
  return pris;
}

function voisins(ix, a) {
  const jum = jumeaux(ix, a.id).map((j) => ix.parId.get(j.id));
  const zone = ix.arrets.filter((b) => b.id !== a.id && b.zones.some((z) => a.zones.includes(z)) && !jum.includes(b));
  return { jum, zone };
}

// Problème de droit : la vraie question, plus trois formulations plausibles.
export function optionsProbleme(ix, a, rng = Math.random) {
  const faits = a.x.map((x) => ({ t: x.t, w: x.w }));
  const { jum, zone } = voisins(ix, a);
  const venu = (b) => ({ t: b.q, w: `C'est le problème de ${b.court} (${b.an}).`.replace(/'/g, '’') });
  const pool = [...jum.filter((b) => b.q).map(venu)];
  const reste = zone.filter((b) => b.q).map(venu);
  const n = 3 - Math.min(faits.length, 2);
  let pris = melange(faits, rng).slice(0, 2);
  const complement = pool.length >= n ? pool : [...pool, ...reste];
  pris = [...pris, ...prochesEnLongueur(a.q, complement, n, rng)];
  return melange([{ t: a.q, ok: true }, ...pris.map((p) => ({ ...p, ok: false }))], rng);
}

// Blocs du puzzle : les quatre vraies pièces et deux pièces venues d'arrêts voisins.
export const CHAMPS = [['f', 'Faits'], ['pr', 'Procédure'], ['s', 'Solution'], ['po', 'Portée']];
export function blocsPuzzle(ix, a, rng = Math.random) {
  const vrais = CHAMPS.map(([k, l]) => ({ k, l, t: a[k], de: a.id }));
  const { jum, zone } = voisins(ix, a);
  const cand = [...jum, ...melange(zone, rng)].filter((b) => !b.nf);
  const pieges = [];
  const nombre = 1 + Math.floor(rng() * 3);
  const champs = melange(CHAMPS.map(([k]) => k), rng);
  for (const k of champs) {
    if (pieges.length === nombre) break;
    const pool = cand.filter((b) => b[k] && !pieges.some((p) => p.de === b.id)).slice(0, 6).map((b) => ({ t: b[k], k, de: b.id }));
    if (pool.length) pieges.push(prochesEnLongueur(a[k], pool, 1, rng)[0]);
  }
  return { slots: CHAMPS.map(([k, l]) => ({ k, l })), blocs: melange([...vrais, ...pieges], rng) };
}

export function optionsArret(ix, a, rng = Math.random) {
  const { jum, zone } = voisins(ix, a);
  const pool = melange(jum, rng).concat(melange(zone, rng));
  return melange([a, ...pool.slice(0, 3)], rng);
}

// Pairs pour le mode Paires.
export function grillePaires(ix, zones, rng = Math.random, taille = 4, variante = 'apport', dus = []) {
  const zoneOk = (a) => a.zones.some((z) => zones.includes(z));
  const familles = ix.familles.filter((f) => f.m.filter((m) => zoneOk(ix.parId.get(m.id))).length >= 2);
  const prioritaire = dus.find((id) => zoneOk(ix.parId.get(id)));
  let base = [];
  if (variante === 'jumeaux' || variante === 'apport') {
    const f = prioritaire ? (ix.famillesDe.get(prioritaire) || []).find((x) => familles.includes(x)) : null;
    const fam = f || choix(familles.length ? familles : ix.familles, rng);
    base = melange(fam.m.map((m) => m.id).filter((id) => zoneOk(ix.parId.get(id))), rng);
    if (variante === 'jumeaux') {
      const lignes = base.slice(0, taille).map((id) => ({ id, nom: ix.parId.get(id).nom, an: ix.parId.get(id).an, t: fam.m.find((m) => m.id === id).k }));
      return { variante, famille: fam, lignes };
    }
  }
  const pool = melange(ix.arrets.filter(zoneOk), rng);
  const ids = [...new Set([...(prioritaire ? [prioritaire] : []), ...base, ...pool.map((a) => a.id)])].slice(0, taille);
  const lignes = ids.map((id) => {
    const a = ix.parId.get(id);
    const z = a.zones.find((x) => zones.includes(x)) ?? a.zones[0];
    return { id, nom: a.nom, an: a.an, t: variante === 'annee' ? String(a.an) : a.ap[z] };
  });
  if (variante === 'annee') {
    // Ni deux fois la même année, ni deux fois le même nom (les GISTI, les Meyet).
    const annees = new Set(); const noms = new Set(); const uniques = [];
    const prendre = (a) => {
      if (uniques.length >= taille || annees.has(a.an) || noms.has(a.court)) return;
      annees.add(a.an); noms.add(a.court);
      uniques.push({ id: a.id, nom: a.court, an: a.an, t: String(a.an) });
    };
    for (const l of lignes) prendre(ix.parId.get(l.id));
    for (const a of pool) prendre(a);
    return { variante, lignes: uniques };
  }
  return { variante, lignes };
}

// Le juge, c'est toi.
export function casJuge(ix, id, rng = Math.random) {
  const j = ix.juges.find((x) => x.id === id);
  return {
    id, c: j.c,
    decisions: melange(j.d.map((t, i) => ({ t, ok: i === 0 })), rng),
    raisons: melange([{ t: j.r, ok: true }, ...j.rx.map((r) => ({ ...r, ok: false }))], rng),
  };
}

// Le bon plan : le plan modèle parmi deux plans défectueux, puis les diagnostics.
export function planOf(s) { return { 1: s.bon[1], '1a': s.bon['1a'].t, '1b': s.bon['1b'].t, 2: s.bon[2], '2a': s.bon['2a'].t, '2b': s.bon['2b'].t }; }
export function roundPlan(ix, s, rng = Math.random) {
  const plans = melange([{ plan: planOf(s), ok: true }, ...s.mauvais.map((m) => ({ plan: m.plan, ok: false, code: m.code, pourquoi: m.pourquoi }))], rng);
  const codes = Object.keys(ix.defauts).filter((c) => s.type === 'C' || !['COMPROC', 'PRETEXTE'].includes(c));
  const diagnostics = s.mauvais.map((m) => {
    const faux = melange(codes.filter((c) => c !== m.code), rng).slice(0, 3);
    return { plan: m.plan, code: m.code, pourquoi: m.pourquoi,
      options: melange([m.code, ...faux], rng).map((c) => ({ code: c, l: ix.defauts[c].l, t: ix.defauts[c].t, ok: c === m.code })) };
  });
  return { sujet: s, plans, diagnostics };
}

// Architecte : titres à placer, leurres, arrêts à classer.
export const CASES = ['1', '1a', '1b', '2', '2a', '2b'];
export function roundArchitecte(ix, s, rng = Math.random) {
  const vrai = planOf(s);
  const nombre = 1 + Math.floor(rng() * 3);
  const leurres = melange(s.mauvais.flatMap((m) => ['1a', '1b', '2a', '2b'].map((k) => m.plan[k])), rng).slice(0, nombre);
  const titres = melange([...CASES.map((c) => ({ t: vrai[c], c })), ...leurres.map((t) => ({ t, c: null }))], rng);
  const placements = ['1a', '1b', '2a', '2b'].flatMap((c) => s.bon[c].ids.map((id) => ({ id, c })));
  return { sujet: s, titres, placements: melange(placements, rng) };
}

// Séances.
export const dispo = (ix, zones) => ({
  arrets: ix.arrets.filter((a) => a.zones.some((z) => zones.includes(z))),
  puzzle: ix.arrets.filter((a) => !a.nf && a.zones.some((z) => zones.includes(z))),
  juges: ix.juges.filter((j) => ix.parId.get(j.id).zones.some((z) => zones.includes(z))),
  sujets: ix.sujets.filter((s) => s.zones.some((z) => zones.includes(z))),
});

// DROIT DES OBLIGATIONS -----------------------------------------------------------
// Qualifier les faits : quatre faits, quatre notions différentes de la même famille.
export function grilleQualif(f, rng = Math.random, taille = 4) {
  const vues = new Set(); const lignes = [];
  for (const m of melange(f.m, rng)) {
    if (vues.has(m.n) || lignes.length === taille) continue;
    vues.add(m.n); lignes.push({ id: `q${lignes.length}`, nom: m.n, t: m.t, a: m.a, w: m.w, carte: m.carte });
  }
  return { variante: 'qualif', titre: f.titre, lignes };
}

export function roundRemede(x, rng = Math.random) {
  return {
    id: x.id, c: x.c, liens: x.liens,
    decisions: melange([{ t: x.d, ok: true }, ...x.dx.map((o) => ({ ...o, ok: false }))], rng),
    raisons: melange([{ t: x.r, ok: true }, ...x.rx.map((o) => ({ ...o, ok: false }))], rng),
  };
}

export function roundFrise(x, rng = Math.random) {
  const etapes = x.e.map((e, i) => ({ ...e, rang: i }));
  const bonne = etapes[x.r - 1];
  return {
    id: x.id, titre: x.titre, p: x.p, q: x.q,
    etapes: melange(etapes, rng),
    options: melange(etapes.map((e) => ({ t: e.n, ok: e === bonne, w: e.ch })), rng),
    pourquoiBon: bonne.ch,
  };
}

// Les fiches qu'un exercice fait travailler.
const fichesDe = (t, x) => (t === 'qualif' ? x.m.map((m) => m.carte) : t === 'frise' ? x.e.map((e) => e.carte).filter(Boolean) : x.liens || []);

function tirerOblig(ix, type, zones, dus, rng, deja) {
  const dans = dansZones(zones);
  const listes = { qualif: ix.qualifs.filter(dans), cas: ix.cas.filter(dans), remede: ix.remedes.filter(dans), frise: ix.frises.filter(dans), plan: ix.sujets.filter(dans) };
  const t = listes[type]?.length ? type : ['qualif', 'cas', 'remede', 'frise', 'plan'].find((k) => listes[k].length);
  const frais = listes[t].filter((x) => !deja.has(x.id));
  // D'abord ce qui touche les fiches dues, puis ce qu'on n'a pas vu depuis le plus longtemps.
  const vus = ix.vus?.() ?? {};
  const rangs = new Map(dus.map((id, i) => [id, i]));
  const priorite = (x) => Math.min(Infinity, ...fichesDe(t, x).filter((id) => rangs.has(id)).map((id) => rangs.get(id)));
  const tries = melange(frais.length ? frais : listes[t], rng).sort((a, b) => priorite(a) - priorite(b) || (vus[a.id] || 0) - (vus[b.id] || 0));
  const pris = choix(tries.slice(0, 3).filter((x) => priorite(x) === priorite(tries[0]) && (vus[x.id] || 0) === (vus[tries[0].id] || 0)), rng);
  deja.add(pris.id); vus[pris.id] = Date.now();
  switch (t) {
    case 'qualif': return { type: t, grille: grilleQualif(pris, rng) };
    case 'cas': return { type: t, id: pris.id };
    case 'remede': return { type: t, ...roundRemede(pris, rng) };
    case 'frise': return { type: t, ...roundFrise(pris, rng) };
    default: return { type: 'plan', ...roundPlan(ix, pris, rng) };
  }
}

// DUNK SHOT ------------------------------------------------------------------------
// Une liste de questions rapides pour les chambres ouvertes. n : niveau de difficulté, de 1 à 3.
export function questionsDunk(ix, zones, rng = Math.random) {
  const dans = dansZones(zones);
  const travaux = new Set(ix.zones.filter((z) => z.travaux).map((z) => z.id));
  const tag = (x) => (x.zones.every((z) => travaux.has(z)) ? 'En travaux' : null);
  const out = [];
  const ajoute = (n, q, bonne, faux, x) => { if (faux.length >= 2) out.push({ n, q, bonne, faux: faux.slice(0, 3), carte: x.id, tag: tag(x) }); };
  const arrets = ix.arrets.filter(dans);
  const apport = (a) => a.ap[a.zones.find((z) => zones.includes(z)) ?? a.zones[0]] || Object.values(a.ap)[0];
  for (const a of arrets) {
    const proches = arrets.filter((b) => b !== a && b.zones.some((z) => a.zones.includes(z)));
    const voisins = proches.length >= 3 ? proches : arrets.filter((b) => b !== a);
    const au = melange(voisins, rng);
    ajoute(1, `Quel arrêt a dit : ${apport(a).charAt(0).toLowerCase()}${apport(a).slice(1)} ?`, a.court, [...new Set(au.map((b) => b.court))].filter((c) => c !== a.court), a);
    const refs = prochesEnLongueur(apport(a), voisins.map((b) => ({ t: apport(b) })).filter((p) => p.t !== apport(a)), 3, rng).map((p) => p.t);
    ajoute(2, `Que retenir de ${a.court} (${a.an}) ?`, apport(a), refs, a);
    const annees = [...new Set(au.map((b) => b.an))].filter((v) => v !== a.an);
    ajoute(3, `En quelle année : ${a.court} ?`, String(a.an), annees.map(String), a);
  }
  const articles = ix.articles.filter(dans);
  for (const a of articles) {
    const proches = articles.filter((b) => b !== a && b.zones.some((z) => a.zones.includes(z)));
    const voisins = melange(proches.length >= 3 ? proches : articles.filter((b) => b !== a), rng);
    ajoute(1, `Que règle l’${a.nom.replace('Art.', 'article')} ?`, a.titre, voisins.map((b) => b.titre).filter((t) => t !== a.titre), a);
    ajoute(2, `Quel article ? ${a.titre}`, a.nom, voisins.map((b) => b.nom), a);
    ajoute(3, `Quel article ? ${a.regle}`, a.nom, voisins.map((b) => b.nom), a);
  }
  for (const x of ix.questions.filter(dans)) out.push({ n: x.n, q: x.q, bonne: x.bonne, faux: x.faux, carte: null, tag: tag(x) });
  return melange(out, rng);
}

// La question suivante : le niveau monte avec les paniers, les fiches à revoir passent devant.
export function tirerDunk(liste, tir, dus, deja, rng = Math.random) {
  const plafond = tir < 5 ? 1 : tir < 12 ? 2 : 3;
  const plancher = tir < 12 ? 1 : 2;
  const pool = liste.filter((x) => x.n <= plafond && x.n >= plancher);
  const frais = pool.filter((x) => !deja.has(x));
  const base = frais.length ? frais : (pool.length ? pool : liste);
  const du = base.filter((x) => x.carte && dus.has(x.carte));
  const q = choix(du.length ? du : base, rng);
  deja.add(q);
  return { ...q, options: melange([{ t: q.bonne, ok: true }, ...q.faux.map((t) => ({ t, ok: false }))], rng) };
}

export function tirerRound(ix, type, zones, dus, rng = Math.random, deja = new Set()) {
  if (ix.matiere === 'oblig') return tirerOblig(ix, type, zones, dus, rng, deja);
  const d = dispo(ix, zones);
  const prendre = (liste) => {
    const frais = liste.filter((x) => !deja.has(x.id));
    const base = frais.length ? frais : liste;
    const parId = new Map(base.map((x) => [x.id, x]));
    const du = dus.find((id) => parId.has(id));
    const pris = du ? parId.get(du) : choix(base, rng);
    deja.add(pris.id);
    return pris;
  };
  if (type === 'juge' && !d.juges.length) type = 'puzzle';
  if ((type === 'plan' || type === 'architecte') && !d.sujets.length) type = 'puzzle';
  if (type === 'puzzle' && !d.puzzle.length) type = 'paires';
  switch (type) {
    case 'paires': return { type, grille: grillePaires(ix, zones, rng, 4, choix(['apport', 'apport', 'jumeaux', 'annee'], rng), dus.filter((id) => !deja.has(id))) };
    case 'puzzle': { const a = prendre(d.puzzle); return { type, id: a.id, ...blocsPuzzle(ix, a, rng), problemes: optionsProbleme(ix, a, rng), noms: optionsArret(ix, a, rng).map((x) => ({ id: x.id, nom: x.court, an: x.an })) }; }
    case 'juge': { const j = prendre(d.juges); return { type, ...casJuge(ix, j.id, rng) }; }
    case 'plan': { const s = prendre(d.sujets); return { type, ...roundPlan(ix, s, rng) }; }
    case 'architecte': { const s = prendre(d.sujets); return { type, ...roundArchitecte(ix, s, rng) }; }
    default: throw new Error('mode inconnu ' + type);
  }
}

export function composerDefi(ix, zones, dus, rng = Math.random) {
  const deja = new Set();
  if (ix.matiere === 'oblig') {
    const milieu = melange(['cas', choix(['remede', 'frise'], rng), choix(['remede', 'frise', 'plan'], rng)], rng);
    return ['qualif', ...milieu, 'qualif'].map((t) => tirerRound(ix, t, zones, dus, rng, deja));
  }
  const ordre = melange(['puzzle', 'juge', choix(['plan', 'architecte'], rng)], rng);
  return ['paires', ...ordre, 'paires'].map((t) => tirerRound(ix, t, zones, dus, rng, deja));
}

// Audience solennelle : les cinq modes, plus une épreuve au hasard.
export function composerBoss(ix, zone, rng = Math.random) {
  const deja = new Set();
  if (ix.matiere === 'oblig') return melange(['qualif', 'cas', 'remede', 'frise', 'plan', 'cas'], rng).map((t) => tirerRound(ix, t, [zone], [], rng, deja));
  const types = melange(['paires', 'puzzle', 'juge', 'plan', 'architecte', choix(['puzzle', 'juge'], rng)], rng);
  return types.map((t) => tirerRound(ix, t, [zone], [], rng, deja));
}
