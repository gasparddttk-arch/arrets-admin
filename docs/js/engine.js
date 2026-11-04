// Logique pure, sans DOM : tirage, distracteurs, composition des séances.
// Utilisée par l'appli et par les contrôles automatiques.

export function creerRng(seed = Date.now()) {
  let s = seed >>> 0;
  return () => { s |= 0; s = (s + 0x6d2b79f5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
export const melange = (a, rng = Math.random) => { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
export const choix = (a, rng = Math.random) => a[Math.floor(rng() * a.length)];

export function indexer(c) {
  const parId = new Map(c.arrets.map((a) => [a.id, a]));
  const famillesDe = new Map();
  for (const f of c.familles) for (const m of f.m) {
    if (!famillesDe.has(m.id)) famillesDe.set(m.id, []);
    famillesDe.get(m.id).push(f);
  }
  return { ...c, parId, famillesDe };
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
  const venu = (b) => ({ t: b.q, w: `C'est le problème de ${b.nom} (${b.an}).`.replace(/'/g, '’') });
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
    const vus = new Set(); const uniques = [];
    for (const l of lignes) if (!vus.has(l.an)) { vus.add(l.an); uniques.push(l); }
    for (const a of pool) { if (uniques.length >= taille) break; if (!vus.has(a.an)) { vus.add(a.an); uniques.push({ id: a.id, nom: a.nom, an: a.an, t: String(a.an) }); } }
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

export function tirerRound(ix, type, zones, dus, rng = Math.random, deja = new Set()) {
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
    case 'puzzle': { const a = prendre(d.puzzle); return { type, id: a.id, ...blocsPuzzle(ix, a, rng), problemes: optionsProbleme(ix, a, rng), noms: optionsArret(ix, a, rng).map((x) => ({ id: x.id, nom: x.nom, an: x.an })) }; }
    case 'juge': { const j = prendre(d.juges); return { type, ...casJuge(ix, j.id, rng) }; }
    case 'plan': { const s = prendre(d.sujets); return { type, ...roundPlan(ix, s, rng) }; }
    case 'architecte': { const s = prendre(d.sujets); return { type, ...roundArchitecte(ix, s, rng) }; }
    default: throw new Error('mode inconnu ' + type);
  }
}

export function composerDefi(ix, zones, dus, rng = Math.random) {
  const deja = new Set();
  const ordre = melange(['puzzle', 'juge', choix(['plan', 'architecte'], rng)], rng);
  return ['paires', ...ordre, 'paires'].map((t) => tirerRound(ix, t, zones, dus, rng, deja));
}

// Audience solennelle : les cinq modes, plus une épreuve au hasard.
export function composerBoss(ix, zone, rng = Math.random) {
  const deja = new Set();
  const types = melange(['paires', 'puzzle', 'juge', 'plan', 'architecte', choix(['puzzle', 'juge'], rng)], rng);
  return types.map((t) => tirerRound(ix, t, [zone], [], rng, deja));
}
