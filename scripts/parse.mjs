// Lit les fichiers de contenu (format texte) et produit un objet JSON typographié.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const D = (f) => readFileSync(join('content', f), 'utf8');

// Typographie française : apostrophes courbes et espaces insécables.
export function typo(t) {
  return t
    .replace(/'/g, '’')
    .replace(/\s+([:;?!»])/g, ' $1')
    .replace(/«\s+/g, '« ')
    .replace(/(\d) (\d{3})\b/g, '$1 $2')
    .replace(/\b(n°|art\.|al\.|§) (\d)/g, '$1 $2');
}

export const ZONES = [
  { id: 1, titre: 'Naissance du droit administratif', lieu: 'Introduction, les origines' },
  { id: 2, titre: 'Normes constitutionnelles', lieu: 'Préambule, PFRLR, loi-écran' },
  { id: 3, titre: 'Traités : notion et place', lieu: 'Normativité, Constitution, article 55' },
  { id: 4, titre: 'Traités et actes administratifs', lieu: 'Droit originaire, règlements, directives' },
  { id: 5, titre: 'Traités et lois', lieu: 'Des palliatifs à Nicolo, puis ses suites' },
  { id: 6, titre: 'Loi et règlement', lieu: 'Articles 34 et 37, ordonnances, article 16' },
  { id: 7, titre: 'Pouvoir réglementaire', lieu: 'Titulaires, lignes directrices, hiérarchie' },
  { id: 8, titre: 'Normes jurisprudentielles', lieu: 'Auteurs, méthode, contenu, autorité des PGD' },
  { id: 9, titre: "L'administration et ses juges", lieu: 'Juge naturel, liens fonctionnels, juridiction' },
  { id: 10, titre: 'Bonus TD', lieu: 'Arrêts des fiches 2 et 3 absents de la carte' },
].map((z) => ({ ...z, titre: typo(z.titre) }));

export const DEFAUTS = {
  RECIT: ['Question de cours', 'Le plan récite le cours sans défendre de thèse.'],
  CHRONO: ['Plan chronologique', 'Le plan raconte des périodes au lieu de démontrer.'],
  BANAL: ['Division banale', 'Le plan juxtapose des catégories sans problématique.'],
  NIVEAU: ['Distinction bancale', 'Les deux parties ne se situent pas au même niveau.'],
  DESCR: ['Intitulés descriptifs', 'Les titres nomment un thème sans énoncer une idée.'],
  HORS: ['Hors sujet', 'Le plan traite une question voisine du sujet posé.'],
  REDITE: ['Redite', 'Les deux parties finissent par dire la même chose.'],
  CONTRESENS: ['Contresens', 'Le plan repose sur une erreur de droit.'],
  DESEQ: ['Plan déséquilibré', 'Une partie porte le devoir, et l’autre reste vide.'],
  COMPROC: ['Découpage interdit', 'Les parties reprennent procédure, solution ou portée.'],
  PRETEXTE: ['Arrêt prétexte', 'Le texte disparaît derrière le cours récité.'],
};

function parseArrets(fichiers = ['arrets-1.txt', 'arrets-2.txt', 'arrets-3.txt']) {
  const out = [];
  for (const file of fichiers) {
    let cur = null;
    for (const raw of D(file).split('\n')) {
      const l = raw.trim();
      if (!l || l.startsWith('#')) continue;
      if (l.startsWith('@')) {
        const [id, nom, ref, juge, an, imp, zones] = l.slice(1).split('|').map((s) => s.trim());
        cur = { id, nom: typo(nom), ref: typo(ref), juge, an: +an, imp: +imp,
          zones: zones.split(',').map(Number), ap: {}, x: [] };
        out.push(cur);
        continue;
      }
      const m = l.match(/^([a-z]+\d*): ?(.*)$/);
      if (!m) throw new Error(`Ligne illisible dans ${file} : ${l}`);
      const [, k, v] = m;
      if (k === 'ap') for (const z of cur.zones) cur.ap[z] = typo(v);
      else if (/^ap\d+$/.test(k)) cur.ap[k.slice(2)] = typo(v);
      else if (k === 'x') { const [t, w] = v.split('||').map((s) => s.trim()); cur.x.push({ t: typo(t), w: typo(w) }); }
      else if (k === 'nf') cur.nf = 1;
      else cur[k] = typo(v);
    }
  }
  for (const a of out) {
    a.formation = /Ass\./.test(a.ref) ? 'Assemblée' : /Sect\./.test(a.ref) ? 'Section'
      : /ch\. mixte/.test(a.ref) ? 'Chambre mixte' : /1re civ/.test(a.ref) ? '1re chambre civile' : '';
  }
  return out;
}

function parseFamilles() {
  const out = []; let cur = null;
  for (const raw of D('familles.txt').split('\n')) {
    const l = raw.trim();
    if (!l || l.startsWith('#')) continue;
    if (l.startsWith('%')) { const [id, titre] = l.slice(1).split('|').map((s) => s.trim()); cur = { id, titre: typo(titre), m: [] }; out.push(cur); continue; }
    if (l.startsWith('p:')) cur.p = typo(l.slice(2).trim());
    else if (l.startsWith('m:')) { const [id, k] = l.slice(2).split(' = ').map((s) => s.trim()); cur.m.push({ id, k: typo(k) }); }
    else throw new Error('familles : ' + l);
  }
  return out;
}

function parseJuges() {
  const out = []; let cur = null;
  for (const raw of D('juge.txt').split('\n')) {
    const l = raw.trim();
    if (!l || l.startsWith('#')) continue;
    if (l.startsWith('%')) { cur = { id: l.slice(1).trim(), rx: [] }; out.push(cur); continue; }
    if (l.startsWith('c:')) cur.c = typo(l.slice(2).trim());
    else if (l.startsWith('d:')) cur.d = l.slice(2).split(' | ').map((s) => typo(s.trim()));
    else if (l.startsWith('rx:')) { const [t, w] = l.slice(3).split('||').map((s) => s.trim()); cur.rx.push({ t: typo(t), w: typo(w) }); }
    else if (l.startsWith('r:')) cur.r = typo(l.slice(2).trim());
    else throw new Error('juge : ' + l);
  }
  return out;
}

function parseSujets(fichier = 'sujets.txt') {
  const out = []; let cur = null;
  const titreIds = (v) => { const [t, ids = ''] = v.split('|').map((s) => s.trim()); return { t: typo(t), ids: ids ? ids.split(',').map((s) => s.trim()) : [] }; };
  for (const raw of D(fichier).split('\n')) {
    const l = raw.trim();
    if (!l || l.startsWith('#')) continue;
    if (l.startsWith('&')) {
      const [id, type, titre, zones] = l.slice(1).split('|').map((s) => s.trim());
      cur = { id, type, titre: typo(titre), zones: zones.split(',').map(Number), bon: {}, mauvais: [] };
      out.push(cur); continue;
    }
    const m = l.match(/^(pb|m|b|1a|1b|2a|2b|1|2):\s?(.*)$/);
    if (!m) throw new Error('sujets : ' + l);
    const [, k, v] = m;
    if (k === 'pb') cur.pb = typo(v);
    else if (k === 'm') cur.m = typo(v);
    else if (k === '1' || k === '2') cur.bon[k] = typo(v);
    else if (k === 'b') {
      const [code, pourquoi, a, aa, ab, b, ba, bb] = v.split('||').map((s) => s.trim());
      if (!bb) throw new Error('plan incomplet : ' + v);
      cur.mauvais.push({ code, pourquoi: typo(pourquoi), plan: { 1: typo(a), '1a': typo(aa), '1b': typo(ab), 2: typo(b), '2a': typo(ba), '2b': typo(bb) } });
    } else cur.bon[k] = titreIds(v);
  }
  return out;
}

// DROIT DES OBLIGATIONS -----------------------------------------------------------
const lignes = (f) => D(f).split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('#'));
const cases = (l) => l.split('|').map((s) => s.trim());
const paire = (l) => l.split('||').map((s) => typo(s.trim()));
const listeZones = (s) => s.split(',').map(Number);
const liens = (s) => s.split(',').map((x) => x.trim()).filter(Boolean);

export const ZONES_OBLIG = [
  { id: 1, titre: 'Le contrat et ses classifications', lieu: 'Sources, définition, grandes distinctions' },
  { id: 2, titre: 'Les négociations', lieu: 'Bonne foi, information, confidentialité' },
  { id: 3, titre: 'Offre et acceptation', lieu: 'Rencontre des volontés, silence, contrat en ligne' },
  { id: 4, titre: 'Les avant-contrats', lieu: 'Pacte de préférence, promesses' },
  { id: 5, titre: "L'erreur et le dol", lieu: 'Validité, vices du consentement' },
  { id: 6, titre: 'Violence et capacité', lieu: 'Violence, abus de dépendance, incapacités' },
  { id: 7, titre: 'Le contenu du contrat', lieu: 'Ordre public, prestation, prix' },
  { id: 8, titre: 'Inexécution et sanctions', lieu: 'Exercices généraux, en attendant le cours', travaux: true },
  { id: 9, titre: 'La responsabilité civile', lieu: 'Exercices généraux, en attendant le cours', travaux: true },
].map((z) => ({ ...z, titre: typo(z.titre) }));

const labelArticle = (n) => (/^1242-/.test(n) ? `Art. 1242 al. ${n.slice(5)}` : `Art. ${n}`);
function parseArticles() {
  return lignes('oblig/articles.txt').map((l) => {
    const [num, zones, imp, titre, regle] = cases(l);
    if (!regle) throw new Error('article incomplet : ' + l);
    const z = listeZones(zones);
    return { id: `a${num}`, num, nom: labelArticle(num), zones: z, imp: +imp, titre: typo(titre), regle: typo(regle), ap: Object.fromEntries(z.map((k) => [k, typo(regle)])), article: 1 };
  });
}

function parseCas() {
  const out = []; let cur = null; let etape = null;
  for (const l of lignes('oblig/cas.txt')) {
    if (l.startsWith('%')) {
      const [id, titre, zones, eq, source] = cases(l.slice(1));
      cur = { id, titre: typo(titre), zones: listeZones(zones), eq, source, etapes: [], liens: [] }; out.push(cur); continue;
    }
    const m = l.match(/^([a-z]): ?(.*)$/);
    if (!m) throw new Error('cas : ' + l);
    const [, k, v] = m;
    if (k === 'c') cur.c = typo(v);
    else if (k === 'v') cur.v = typo(v);
    else if (k === 'a') cur.liens = liens(v);
    else if (k === 's') {
      const [label, q, t, w] = paire(v);
      if (!w) throw new Error('étape incomplète : ' + l);
      etape = { label, q, t, w, x: [] }; cur.etapes.push(etape);
    } else if (k === 'x') {
      const [t, w] = paire(v);
      if (!w) throw new Error('mauvaise réponse sans explication : ' + l);
      etape.x.push({ t, w });
    } else throw new Error('cas : ' + l);
  }
  return out;
}

function parseQualifs() {
  const out = []; let cur = null;
  for (const l of lignes('oblig/qualif.txt')) {
    if (l.startsWith('%')) { const [id, titre, zones] = cases(l.slice(1)); cur = { id, titre: typo(titre), zones: listeZones(zones), m: [] }; out.push(cur); continue; }
    if (!l.startsWith('m:')) throw new Error('qualif : ' + l);
    const [n, a, t, w] = cases(l.slice(2));
    if (!w) throw new Error('qualif incomplète : ' + l);
    cur.m.push({ n: typo(n), a: typo(a), t: typo(t), w: typo(w), carte: `a${a.match(/\d+(-\d+)?/)[0]}` });
  }
  return out;
}

function parseRemedes() {
  const out = []; let cur = null;
  for (const l of lignes('oblig/remedes.txt')) {
    if (l.startsWith('%')) { const [id, zones, eq] = cases(l.slice(1)); cur = { id, zones: listeZones(zones), eq, dx: [], rx: [], liens: [] }; out.push(cur); continue; }
    const m = l.match(/^(c|d|dx|r|rx|a): ?(.*)$/);
    if (!m) throw new Error('remède : ' + l);
    const [, k, v] = m;
    if (k === 'a') cur.liens = liens(v);
    else if (k === 'dx' || k === 'rx') { const [t, w] = paire(v); if (!w) throw new Error('explication manquante : ' + l); cur[k].push({ t, w }); } else cur[k] = typo(v);
  }
  return out;
}

function parseFrises() {
  const out = []; let cur = null;
  for (const l of lignes('oblig/frises.txt')) {
    if (l.startsWith('%')) { const [id, titre, zones, eq] = cases(l.slice(1)); cur = { id, titre: typo(titre), zones: listeZones(zones), eq, e: [] }; out.push(cur); continue; }
    const m = l.match(/^(p|e|q): ?(.*)$/);
    if (!m) throw new Error('frise : ' + l);
    const [, k, v] = m;
    if (k === 'p') cur.p = typo(v);
    else if (k === 'e') { const [an, n, t, ch, carte] = cases(v); cur.e.push({ an: +an, n: typo(n), t: typo(t), ch: typo(ch), carte: carte || null }); } else { const [q, r] = cases(v); cur.q = typo(q); cur.r = +r; }
  }
  return out;
}

function parseQuestions() {
  return lignes('oblig/questions.txt').map((l) => {
    const i = l.indexOf('|'); const j = l.indexOf('|', i + 1);
    const [q, bonne, ...faux] = paire(l.slice(j + 1));
    if (faux.length < 2) throw new Error('question incomplète : ' + l);
    return { zones: listeZones(l.slice(0, i).trim()), n: +l.slice(i + 1, j).trim(), q, bonne, faux };
  });
}

export function lireObligations() {
  return {
    matiere: 'oblig',
    zones: ZONES_OBLIG,
    arrets: parseArrets(['oblig/arrets.txt']),
    articles: parseArticles(),
    familles: [], juges: [],
    cas: parseCas(), qualifs: parseQualifs(), remedes: parseRemedes(), frises: parseFrises(), questions: parseQuestions(),
    sujets: parseSujets('oblig/sujets.txt'),
    defauts: Object.fromEntries(Object.entries(DEFAUTS).map(([k, [l, t]]) => [k, { l, t }])),
  };
}

export function lireContenu() {
  return {
    matiere: 'admin',
    zones: ZONES,
    arrets: parseArrets(),
    familles: parseFamilles(),
    juges: parseJuges(),
    sujets: parseSujets(),
    defauts: Object.fromEntries(Object.entries(DEFAUTS).map(([k, [l, t]]) => [k, { l, t }])),
  };
}
