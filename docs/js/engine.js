// Logique pure, sans DOM : tirage, distracteurs, composition des séances.
// Utilisée par l'appli et par les contrôles automatiques.
const dansZones = (zones) => (x) => x.zones.some((z) => zones.includes(z));

export function creerRng(seed = Date.now()) {
  let s = seed >>> 0;
  return () => { s |= 0; s = (s + 0x6d2b79f5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
export const melange = (a, rng = Math.random) => { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
export const choix = (a, rng = Math.random) => a[Math.floor(rng() * a.length)];
export const PRODUCTION = ['atelier', 'architecte', 'plaide', 'trous', 'syllogisme', 'casnu', 'formule'];
export const estProduction = (r, matiere = null) => {
  if (!r) return false;
  const t = typeof r === 'string' ? r : r.type;
  if (t === 'formule') return typeof r === 'object' ? Boolean(r.entiere) : true;
  if (PRODUCTION.includes(t)) return true;
  if (matiere === 'constit') return t === 'plume' || t === 'mot';
  if (matiere === 'intro') return t === 'mot';
  return false;
};

export function indexer(c, equipe = 2, dataFormules = null) {
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
  const mFormules = dataFormules?.arrets || c.formules || [];
  const mat = c.matiere || 'admin';
  const formules = mFormules
    .filter((f) => f.matiere === mat && f.equipes?.includes(equipe) && parId.has(f.arret))
    .map((f) => ({ ...f, zones: parId.get(f.arret).zones }));
  const typesFormules = dataFormules?.types || c.typesFormules || {};
  return { ...c, matiere: mat, familles, juges: c.juges || [], articles, cartes, parId, famillesDe,
    cas: (c.cas || []).filter(garde), remedes: (c.remedes || []).filter(garde), frises: (c.frises || []).filter(garde),
    qualifs: c.qualifs || [], questions: c.questions || [], formules, typesFormules };
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
  frises: (ix.frises || []).filter((f) => f.zones.some((z) => zones.includes(z))),
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

// L'atelier du cas pratique : un cas des chambres ouvertes, au niveau demandé si possible.
export function roundTrous(ix, zones, dus = [], deja = new Set(), rng = Math.random) {
  const dans = dansZones(zones);
  const articles = (ix.articles || []).filter((a) => dans(a) && a.regle && a.regle.split(' ').length >= 10);
  const frais = articles.filter((x) => !deja.has(x.id));
  const base = frais.length ? frais : articles;
  const a = choix(base.length ? base : (ix.articles || []).filter((x) => x.regle && x.regle.split(' ').length >= 10), rng);
  if (!a) return null;
  deja.add(a.id);
  const mots = a.regle.split(' ');
  const candidats = mots.map((m, i) => ({ m: m.replace(/[,.;:]$/, ''), i })).filter(({ m, i }) => i > 1 && m.length >= 6 && /^[a-zà-ÿ'’-]+$/i.test(m));
  const trous = melange(candidats, rng).slice(0, Math.min(3, candidats.length)).sort((x, y) => x.i - y.i);
  if (trous.length < 2) return null;
  const autres = (ix.articles || []).filter((b) => b !== a && b.regle).flatMap((b) => b.regle.split(' ').map((m) => m.replace(/[,.;:]$/, '')).filter((m) => m.length >= 6 && /^[a-zà-ÿ'’-]+$/i.test(m)));
  const leurres = melange([...new Set(autres)].filter((m) => !trous.some((t) => t.m === m)), rng).slice(0, 2);
  return { type: 'trous', id: a.id, nom: a.nom, titre: a.titre, mots, trous: trous.map((t) => ({ i: t.i, m: t.m })), etiquettes: melange([...trous.map((t) => t.m), ...leurres], rng) };
}

export function roundPlaide(ix, zones, dus = [], deja = new Set(), rng = Math.random) {
  const dans = dansZones(zones);
  const arrets = (ix.arrets || []).filter((a) => dans(a) && !a.nf && a.q && a.s);
  const questions = (ix.questions || []).filter(dans).map((q, i) => ({ ...q, id: `q-${i}-${q.q.length}` }));
  const deQuestion = ix.matiere === 'oblig' && questions.length && (!arrets.length || rng() < 0.5);
  if (deQuestion) {
    const frais = questions.filter((x) => !deja.has(x.id));
    const q = choix(frais.length ? frais : questions, rng);
    if (q) { deja.add(q.id); return { type: 'plaide', carte: null, contexte: 'Question de cours', question: q.q, attendu: q.bonne }; }
  }
  const frais = arrets.filter((x) => !deja.has(x.id));
  const a = choix(frais.length ? frais : arrets.length ? arrets : (ix.arrets || []).filter((x) => !x.nf && x.q && x.s), rng);
  if (!a) return null;
  deja.add(a.id);
  return { type: 'plaide', carte: a.id, contexte: `${a.court || a.nom}, ${a.an}`, question: a.q, attendu: a.s };
}

export function tirerAtelier(ix, zones, niveau = null, rng = Math.random, deja = new Set()) {
  const tous = ix.ateliers || [];
  const dans = tous.filter(dansZones(zones));
  const base = dans.length ? dans : tous;
  const auNiveau = niveau ? base.filter((c) => c.niveau === niveau) : base;
  const liste = (auNiveau.length ? auNiveau : niveau ? tous.filter((c) => c.niveau === niveau) : base);
  const frais = liste.filter((c) => !deja.has(c.id));
  const pris = choix(frais.length ? frais : liste.length ? liste : tous, rng);
  deja.add(pris.id);
  return { type: 'atelier', id: pris.id };
}
// MEMORY ET TRI EN L2 : deux jeux de la L1, nourris par le cours de L2.
// Memory : un arrêt et ce qu'il dit dans sa famille (administratif), un article et son objet (obligations).
export function roundMemoryL2(ix, zones, dus, rng = Math.random) {
  const dans = dansZones(zones);
  const prio = new Map(dus.map((id, i) => [id, i]));
  const rangDu = (id) => (prio.has(id) ? prio.get(id) : 1e6);
  let paires = [];
  if (ix.matiere === 'oblig') {
    paires = melange(ix.articles.filter((a) => dans(a) && a.titre && a.titre.length <= 70), rng).sort((x, y) => rangDu(x.id) - rangDu(y.id))
      .map((a) => ({ id: a.id, a: a.nom, b: a.titre, carte: a.id }));
  } else {
    const vus = new Set();
    // Une famille posée comme une question (« Qui peut invoquer une directive ? ») a des réponses qui ne se lisent pas seules.
    for (const f of melange(ix.familles.filter((x) => !/\?\s*$/.test(x.titre)), rng)) for (const m of f.m) {
      const a = ix.parId.get(m.id);
      if (!a || !dans(a) || vus.has(a.id) || !m.k || m.k.length > 70 || /^(Oui|Non)\b/.test(m.k)) continue;
      vus.add(a.id); paires.push({ id: a.id, a: `${a.court}, ${a.an}`, b: m.k, carte: a.id });
    }
    paires.sort((x, y) => rangDu(x.id) - rangDu(y.id));
  }
  const textes = new Set(); const garde = [];
  for (const p of paires) { if (textes.has(p.a) || textes.has(p.b)) continue; textes.add(p.a); textes.add(p.b); garde.push(p); if (garde.length === 6) break; }
  if (garde.length < 4) return null;
  return { type: 'memory', paires: melange(garde, rng), consigne: ix.matiere === 'oblig' ? 'Retrouve chaque article et son objet.' : 'Retrouve chaque arrêt et ce qu’il apporte.' };
}
// Le grand rangement : des articles et des arrêts tombent vers trois parties du cours, tirées au hasard à chaque partie.
export function roundRangementL2(ix, zones, rng = Math.random) {
  const cartes = []; const bords = [];
  if (ix.matiere === 'oblig') {
    // Des articles et des arrêts à ranger dans la partie du cours qu'ils règlent : l'information, le dol, l'offre…
    // Les colonnes changent à chaque partie : trois ou quatre chambres tirées au hasard.
    const choisies = melange(zones.filter((z) => ix.cartes.filter((x) => x.zones.includes(z) && (x.imp ?? 2) >= 2).length >= 3), rng).slice(0, 3);
    if (choisies.length < 2) return null;
    const parBord = 3;
    for (const z of choisies) {
      // Une fiche rattachée à deux des chambres choisies serait ambiguë : on l'écarte.
      const propres = ix.cartes.filter((x) => x.zones.includes(z) && (x.imp ?? 2) >= 2 && x.zones.filter((y) => choisies.includes(y)).length === 1);
      const pris = melange(propres, rng).sort((x, y) => (y.imp ?? 2) - (x.imp ?? 2)).slice(0, parBord + 2);
      bords.push({ k: z, nom: ix.zones.find((x) => x.id === z)?.titre || `Chambre ${z}` });
      cartes.push(...melange(pris, rng).slice(0, parBord).map((x) => (x.article
        ? { t: x.nom, s: 'Code civil', k: z, w: `${x.titre}.`, carte: x.id }
        : { t: x.court, s: x.ref, k: z, w: `${x.ap?.[z] || Object.values(x.ap || {})[0] || ''}.`.replace(/\.\.$/, '.'), carte: x.id })));
    }
    if (cartes.length < 5) return null;
    return { type: 'rangement', titre: 'Le grand rangement', colonnes: bords, pieces: melange(cartes, rng) };
  }
  const dans = dansZones(zones);
  const familles = melange(ix.familles.filter((f) => f.titre.length <= 44 && !/\?\s*$/.test(f.titre)), rng);
  const pris = new Set();
  for (const f of familles) {
    if (bords.length === 3) break;
    // Un arrêt rangé dans deux des familles choisies serait ambigu : on l'écarte.
    const membres = f.m.filter((m) => { const a = ix.parId.get(m.id); return a && dans(a) && !pris.has(m.id) && !(ix.famillesDe.get(m.id) || []).some((g) => g !== f && bords.some((b) => b.k === g.id)); });
    if (membres.length < 2) continue;
    bords.push({ k: f.id, nom: f.titre });
    for (const m of melange(membres, rng).slice(0, 3)) { const a = ix.parId.get(m.id); pris.add(a.id); cartes.push({ t: a.court, s: `${a.ref}`, k: f.id, w: m.k, carte: a.id }); }
  }
  // Les familles déjà choisies ne doivent pas contenir les arrêts tirés pour une autre.
  const propres = cartes.filter((c) => !(ix.famillesDe.get(c.carte) || []).some((g) => g.id !== c.k && bords.some((b) => b.k === g.id)));
  if (bords.length < 2 || propres.length < 5) return null;
  return { type: 'rangement', titre: 'Le grand rangement', colonnes: bords, pieces: melange(propres, rng) };
}

function tirerOblig(ix, type, zones, dus, rng, deja, entiere = false) {
  if (type === 'formule') {
    const r = tirerFormule(ix, zones, entiere, rng, deja);
    if (r) return r;
    type = 'qualif';
  }
  if (type === 'trous') { const r = roundTrous(ix, zones, dus, deja, rng); if (r) return r; type = 'qualif'; }
  if (type === 'plaide') { const r = roundPlaide(ix, zones, dus, deja, rng); if (r) return r; type = 'qualif'; }
  if (type === 'atelier' && ix.ateliers?.length) return tirerAtelier(ix, zones, null, rng, deja);
  if (type === 'memory') { const r = roundMemoryL2(ix, zones, dus, rng); if (r) return r; type = 'qualif'; }
  if (type === 'rangement') { const r = roundRangementL2(ix, zones, rng); if (r) return r; type = 'qualif'; }
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
  if (estL1(ix)) return questionsIntro(ix, zones, rng);
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

export function tirerFormule(ix, zones, entiere = false, rng = Math.random, deja = new Set()) {
  const dans = (f) => f.zones.some((z) => zones.includes(z));
  const pool = (ix.formules || []).filter(dans);
  if (!pool.length) return null;
  const frais = pool.filter((f) => !deja.has(f.id));
  const f = choix(frais.length ? frais : pool, rng);
  deja.add(f.id);
  return {
    type: 'formule',
    entiere: Boolean(entiere),
    id: f.id,
    formule: f,
    types: ix.typesFormules,
  };
}

export function tirerRound(ix, type, zones, dus, rng = Math.random, deja = new Set(), entiere = false) {
  if (type === 'formule') {
    const r = tirerFormule(ix, zones, entiere, rng, deja);
    if (r) return r;
    type = ix.matiere === 'oblig' ? 'qualif' : 'paires';
  }
  if (estL1(ix)) return tirerIntro(ix, type, zones, dus, rng, deja);
  if (ix.matiere === 'oblig') return tirerOblig(ix, type, zones, dus, rng, deja, entiere);
  if (type === 'atelier' && ix.ateliers?.length) return tirerAtelier(ix, zones, null, rng, deja);
  if (type === 'trous') { const r = roundTrous(ix, zones, dus, deja, rng); if (r) return r; type = 'paires'; }
  if (type === 'plaide') { const r = roundPlaide(ix, zones, dus, deja, rng); if (r) return r; type = 'paires'; }
  if (type === 'memory') { const r = roundMemoryL2(ix, zones, dus, rng); if (r) return r; type = 'paires'; }
  if (type === 'rangement') { const r = roundRangementL2(ix, zones, rng); if (r) return r; type = 'paires'; }
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
    case 'frise': { const f = prendre(d.frises.length ? d.frises : ix.frises); return { type, ...roundFrise(f, rng) }; }
    default: throw new Error('mode inconnu ' + type);
  }
}

export function composerDefi(ix, zones, dus, rng = Math.random) {
  if (estL1(ix)) return composerDefiIntro(ix, zones, dus, rng);
  const deja = new Set();
  const aFormule = (ix.formules || []).some((f) => f.zones.some((z) => zones.includes(z)));
  if (ix.matiere === 'oblig') {
    const pool = ['remede', 'frise', ...(aFormule ? ['formule'] : [])];
    const milieu = melange(['cas', choix(pool, rng), choix(['remede', 'frise', 'plan'], rng)], rng);
    return ['qualif', ...milieu, choix(['qualif', 'qualif', 'rangement', 'memory'], rng)].map((t) => tirerRound(ix, t, zones, dus, rng, deja));
  }
  const pool = ['plan', ...(aFormule ? ['formule'] : [])];
  const ordre = melange(['puzzle', 'juge', choix(pool, rng)], rng);
  return ['paires', ...ordre, choix(['paires', 'paires', 'rangement', 'memory'], rng)].map((t) => tirerRound(ix, t, zones, dus, rng, deja));
}

// La révision du jour : 3 épreuves sans production, tirées en priorité dans les fiches à rattraper.
export function composerRevision(ix, zones, dus, rng = Math.random) {
  const deja = new Set();
  const types = ix.matiere === 'constit' ? ['mot', 'memory', 'mot']
    : ix.matiere === 'intro' ? ['memory', 'mot', 'memory']
    : ix.matiere === 'oblig' ? ['qualif', 'remede', 'qualif']
    : ['paires', 'juge', 'paires'];
  return types.map((t) => tirerRound(ix, t, zones, dus, rng, deja));
}

// Audience solennelle : les cinq modes, plus une épreuve au hasard.
export function composerBoss(ix, zone, rng = Math.random) {
  if (estL1(ix)) return composerBossIntro(ix, zone, rng);
  const deja = new Set();
  const aFormule = (ix.formules || []).some((f) => f.zones.includes(zone));
  let prodRound = null;
  if (aFormule) {
    prodRound = tirerFormule(ix, [zone], true, rng, deja);
  } else if (ix.matiere === 'oblig') {
    const aAtelier = (ix.ateliers || []).some(dansZones([zone]));
    const aTrous = (ix.articles || []).some((a) => dansZones([zone])(a) && a.regle && a.regle.split(' ').length >= 10);
    if (aAtelier) {
      prodRound = tirerAtelier(ix, [zone], null, rng, deja);
    } else if (aTrous) {
      prodRound = roundTrous(ix, [zone], [], deja, rng);
    } else {
      prodRound = roundPlaide(ix, [zone], [], deja, rng) || roundTrous(ix, [zone], [], deja, rng);
    }
  } else {
    // administratif : architecte, sinon atelier, sinon trous
    const aSujets = (ix.sujets || []).some(dansZones([zone]));
    const aAtelier = (ix.ateliers || []).some(dansZones([zone]));
    const aTrous = (ix.articles || []).some((a) => dansZones([zone])(a) && a.regle && a.regle.split(' ').length >= 10);
    if (aSujets) {
      const s = choix(ix.sujets.filter(dansZones([zone])), rng);
      deja.add(s.id);
      prodRound = { type: 'architecte', ...roundArchitecte(ix, s, rng) };
    } else if (aAtelier) {
      prodRound = tirerAtelier(ix, [zone], null, rng, deja);
    } else if (aTrous) {
      prodRound = roundTrous(ix, [zone], [], deja, rng);
    } else {
      prodRound = roundPlaide(ix, [zone], [], deja, rng) || roundTrous(ix, [zone], [], deja, rng);
    }
  }

  // 5 épreuves de reconnaissance
  let autres = [];
  if (ix.matiere === 'oblig') {
    const pool = ['qualif', 'cas', 'remede', 'frise', 'plan'];
    const dispo = pool.filter((t) => {
      if (t === 'qualif') return (ix.qualifs || []).some(dansZones([zone]));
      if (t === 'cas') return (ix.cas || []).some(dansZones([zone]));
      if (t === 'remede') return (ix.remedes || []).some(dansZones([zone]));
      if (t === 'frise') return (ix.frises || []).some(dansZones([zone]));
      if (t === 'plan') return (ix.sujets || []).some(dansZones([zone]));
      return false;
    });
    const base = dispo.length ? dispo : pool;
    const typesAutres = melange(base, rng).slice(0, 5);
    while (typesAutres.length < 5) typesAutres.push(choix(base, rng));
    autres = typesAutres.map((t) => tirerRound(ix, t, [zone], [], rng, deja));
  } else {
    const d = dispo(ix, [zone]);
    const pool = ['paires', 'puzzle', 'juge', 'plan', 'frise'];
    const dispoAdmin = pool.filter((t) => {
      if (t === 'paires') return true;
      if (t === 'puzzle') return d.puzzle.length > 0;
      if (t === 'juge') return d.juges.length > 0;
      if (t === 'plan') return d.sujets.length > 0;
      if (t === 'frise') return d.frises.length > 0;
      return false;
    });
    const base = dispoAdmin.length ? dispoAdmin : ['paires', 'puzzle', 'juge', 'plan'];
    const typesAutres = melange(base, rng).slice(0, 5);
    while (typesAutres.length < 5) typesAutres.push(choix(base, rng));
    autres = typesAutres.map((t) => tirerRound(ix, t, [zone], [], rng, deja));
  }

  const pos = 1 + Math.floor(rng() * 5);
  return [...autres.slice(0, pos), prodRound, ...autres.slice(pos)];
}

// L1, INTRODUCTION AU DROIT ----------------------------------------------------------------
// Les exercices qu'une chambre peut nourrir. Le tri vient des chambres 1 et 2, le scanner de la 1,
// le rangement de la 4, la frise des 5 et 6 ; le mot, Memory et Qui a dit ? puisent partout.
const estL1 = (ix) => ix.matiere === 'intro' || ix.matiere === 'constit';
export function typesIntro(ix, zones) {
  const z = (ids) => ids.some((i) => zones.includes(i));
  const t = ['memory', 'mot'];
  if (ix.matiere === 'constit') {
    if (ix.regimes.some(dansZones(zones))) t.push('pouvoirs');
    if (z([2])) t.push('nuancier');
    if (ix.textes.some(dansZones(zones))) t.push('plume');
    if (ix.citations.filter(dansZones(zones)).length >= 3) t.push('quiadit');
    if (ix.frises.some(dansZones(zones))) t.push('frise');
    return t;
  }
  if (z([1, 2])) t.push('tri');
  if (z([1])) t.push('scanner');
  if (z([4])) t.push('rangement');
  if (ix.citations.filter(dansZones(zones)).length >= 3) t.push('quiadit');
  if (ix.frises.some(dansZones(zones))) t.push('frise');
  return t;
}
const sansAccent = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase();

export function tirerIntro(ix, type, zones, dus, rng = Math.random, deja = new Set()) {
  const dans = dansZones(zones);
  const dispo = typesIntro(ix, zones);
  if (!dispo.includes(type)) type = choix(dispo.filter((t) => t !== 'frise' && !estProduction(t, ix.matiere)), rng);
  const notions = ix.articles.filter(dans);
  const prendre = (liste) => {
    const frais = liste.filter((x) => !deja.has(x.id));
    const base = frais.length ? frais : liste;
    const du = dus.find((id) => base.some((x) => x.id === id || x.carte === id));
    const pris = du ? base.find((x) => x.id === du || x.carte === du) : choix(base, rng);
    deja.add(pris.id);
    return pris;
  };
  switch (type) {
    case 'tri': {
      const cartes = ix.tri.filter((c) => !deja.has(c.id));
      const parBord = ['d', 'm', 'r', 'c'].map((k) => melange(cartes.filter((c) => c.k === k), rng));
      // Huit cartes, deux par bord au moins quand c'est possible, dans le désordre.
      const pris = melange(parBord.flatMap((l) => l.slice(0, 2)), rng);
      for (const c of pris) deja.add(c.id);
      return { type, cartes: pris };
    }
    case 'mot': {
      const liste = ix.mots.filter(dans);
      const m = prendre(liste.length ? liste : ix.mots);
      const n = m.carte ? ix.parId.get(m.carte) : null;
      return { type, id: m.carte, mot: sansAccent(m.mot), indice: m.indice, nom: n?.nom || m.mot, def: n?.regle || m.indice };
    }
    case 'rangement': {
      const pris = melange(ix.rangement.filter((c) => !deja.has(c.id)), rng);
      const mixte = pris.find((c) => c.k === 'x');
      const liste = melange([...(mixte ? [mixte] : []), ...pris.filter((c) => c !== mixte).slice(0, 9)], rng);
      for (const c of liste) deja.add(c.id);
      return { type, pieces: liste };
    }
    case 'quiadit': {
      const cits = ix.citations.filter(dans);
      const tours = [];
      for (const c of melange(cits.filter((x) => !deja.has(x.id)), rng).slice(0, 3)) {
        deja.add(c.id);
        const autres = melange([...new Set(ix.citations.map((x) => x.a))].filter((a) => a !== c.a), rng).slice(0, 3);
        tours.push({ ...c, choix: melange([c.a, ...autres], rng).map((a) => ({ a, nom: ix.auteurs[a] })) });
      }
      return { type, tours };
    }
    case 'scanner': {
      // Trois textes : un de droit, et deux qui manquent chacun d'un élément différent.
      const libres = melange(ix.scanner.filter((x) => !deja.has(x.id)), rng);
      const droit = libres.find((x) => x.manque === null);
      const autres = melange(['conduite', 'generale', 'sanction'], rng).slice(0, 2).map((m) => libres.find((x) => x.manque === m)).filter(Boolean);
      const pris = melange([droit, ...autres].filter(Boolean), rng);
      for (const x of pris) deja.add(x.id);
      return { type, textes: pris };
    }
    case 'memory': {
      // Six paires : des notions et leur idée courte, parfois un auteur et son idée.
      const base = melange(notions.filter((n) => !deja.has(n.id)), rng);
      const prio = dus.map((id) => base.find((n) => n.id === id)).filter(Boolean).slice(0, 2);
      const idees = melange(ix.idees.filter(dans), rng).slice(0, rng() < 0.5 ? 2 : 0);
      const reste = base.filter((n) => !prio.includes(n)).slice(0, 6 - prio.length - idees.length);
      const paires = [...prio, ...reste].map((n) => ({ id: n.id, a: n.nom, b: n.c, carte: n.id }))
        .concat(idees.map((x, i) => ({ id: `idee-${i}-${x.a}`, a: x.nom, b: x.t, carte: null })));
      for (const p of paires) if (p.carte) deja.add(p.carte);
      return { type, paires: melange(paires, rng) };
    }
    case 'frise': {
      const f = choix(ix.frises.filter(dans).length ? ix.frises.filter(dans) : ix.frises, rng);
      return { type, mot: 'étape', ...roundFrise(f, rng) };
    }
    case 'pouvoirs': {
      // Construire le plus souvent ; parfois reconnaître un schéma tout fait.
      const liste = ix.regimes.filter(dans);
      const r = prendre(liste.length ? liste : ix.regimes);
      const mode = rng() < 0.3 ? 'reconnaitre' : 'construire';
      const propres = [...new Set([...r.liens, ...r.pieges].map((l) => l[2]))];
      const autres = melange(Object.keys(ix.liensTypes).filter((k) => !propres.includes(k)), rng);
      const verbes = Object.keys(ix.liensTypes).filter((k) => propres.includes(k) || autres.slice(0, Math.max(1, 5 - propres.length)).includes(k));
      const options = melange([r, ...melange(ix.regimes.filter((x) => x.id !== r.id), rng).slice(0, 3)], rng).map((x) => ({ id: x.id, nom: x.nom }));
      return { type, id: r.id, mode, regime: r, types: ix.liensTypes, verbes, options };
    }
    case 'nuancier': {
      // Six jetons, au moins un par nuance quand c'est possible.
      const libres = ix.nuancier.filter((x) => !deja.has(x.id));
      const base = libres.length >= 6 ? libres : ix.nuancier;
      const parNuance = ix.nuances.map((_, k) => melange(base.filter((x) => x.k === k), rng));
      const pris = parNuance.map((l) => l[0]).filter(Boolean);
      for (const x of melange(base.filter((y) => !pris.includes(y)), rng)) { if (pris.length >= 6) break; pris.push(x); }
      for (const x of pris) deja.add(x.id);
      return { type, nuances: ix.nuances, jetons: melange(pris, rng) };
    }
    case 'plume': {
      const liste = ix.textes.filter(dans);
      const t = prendre(liste.length ? liste : ix.textes);
      const morceaux = t.morceaux.map((m) => (typeof m === 'string' ? m : { bon: m.bon, options: melange([m.bon, ...m.leurres], rng) }));
      const autres = melange(Object.keys(ix.sources).filter((k) => k !== t.src), rng).slice(0, 3);
      const sources = melange([t.src, ...autres], rng).map((k) => ix.sources[k]);
      return { type, id: t.id, texte: { ...t, morceaux }, sources };
    }
    default: throw new Error('mode inconnu ' + type);
  }
}

export function composerDefiIntro(ix, zones, dus, rng = Math.random) {
  const deja = new Set();
  const dispo = typesIntro(ix, zones).filter((t) => t !== 'plume');
  const jeux = melange(dispo.filter((t) => !['memory', 'mot'].includes(t)), rng);
  const milieu = [jeux[0] || 'mot', 'mot', jeux[1] || 'memory'];
  return ['memory', ...melange(milieu, rng), jeux[2] || 'memory'].map((t) => tirerIntro(ix, t, zones, dus, rng, deja));
}
export function composerBossIntro(ix, zone, rng = Math.random) {
  const deja = new Set();
  const aFormule = (ix.formules || []).some((f) => f.zones.includes(zone));
  let prodRound = null;
  let prodType = null;
  if (aFormule) {
    prodRound = tirerFormule(ix, [zone], true, rng, deja);
    prodType = 'formule';
  } else if (ix.matiere === 'constit') {
    prodType = (ix.textes || []).some(dansZones([zone])) ? 'plume' : 'mot';
    prodRound = tirerIntro(ix, prodType, [zone], [], rng, deja);
  } else {
    prodType = 'mot';
    prodRound = tirerIntro(ix, prodType, [zone], [], rng, deja);
  }
  const dispo = typesIntro(ix, [zone]);
  const poolRec = dispo.filter((t) => t !== 'plume' && t !== 'mot' && t !== 'formule');
  const baseRec = poolRec.length ? poolRec : (ix.matiere === 'constit' ? ['memory', 'pouvoirs', 'nuancier'] : ['memory', 'quiadit', 'rangement']);
  const typesAutres = melange(baseRec, rng).slice(0, 5);
  while (typesAutres.length < 5) typesAutres.push(choix(baseRec, rng));
  const autres = typesAutres.map((t) => tirerIntro(ix, t, [zone], [], rng, deja));
  const pos = 1 + Math.floor(rng() * 5);
  return [...autres.slice(0, pos), prodRound, ...autres.slice(pos)];
}

// Dunk en L1 : la notion d'après sa définition, la définition d'après la notion, l'auteur d'une citation.
export function questionsIntro(ix, zones, rng = Math.random) {
  const dans = dansZones(zones);
  const out = [];
  const notions = ix.articles.filter(dans);
  for (const n of notions) {
    const proches = melange(notions.filter((m) => m !== n), rng);
    const faux = proches.map((m) => m.nom).slice(0, 3);
    if (faux.length >= 2) out.push({ n: 1, q: `Quelle notion ? ${n.c}`, bonne: n.nom, faux, carte: n.id, tag: null });
    const fauxD = prochesEnLongueur(n.regle, proches.map((m) => ({ t: m.regle })), 3, rng).map((p) => p.t);
    if (fauxD.length >= 2) out.push({ n: 2, q: `${n.nom} : c’est…`, bonne: n.regle, faux: fauxD, carte: n.id, tag: null });
  }
  const cits = ix.citations.filter(dans);
  for (const c of cits) {
    const faux = melange([...new Set(ix.citations.map((x) => x.nom))].filter((a) => a !== c.nom), rng).slice(0, 3);
    out.push({ n: 3, q: `Qui a dit : « ${c.t} » ?`, bonne: c.nom, faux, carte: null, tag: null });
  }
  return melange(out, rng);
}
