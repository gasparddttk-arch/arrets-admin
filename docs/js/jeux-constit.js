// Les jeux propres au droit constitutionnel.
// L'architecte des pouvoirs : on relie les organes d'un régime, flèche par flèche.
// Le nuancier des États : on place chaque État sur une bande, de l'unitaire à la confédération.
// La plume du constituant : on rétablit un article, puis on scelle sa source.
import { h, effets, duree } from './ui.js';
import { son, vibrer } from './sons.js';
import { finEpreuve, barrePied, continuer, repere } from './games.js';

const attendre = (ms) => new Promise((r) => setTimeout(r, duree(ms)));
const NS = 'http://www.w3.org/2000/svg';
const s = (tag, attrs = {}) => { const el = document.createElementNS(NS, tag); for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v); return el; };
const pluriel = (n, mot) => `${n} ${mot}${n > 1 ? 's' : ''}`;
const cibles = (a) => (Array.isArray(a) ? a : [a]);

// L'ARCHITECTE DES POUVOIRS ------------------------------------------------------------------
// Les organes sont posés en cercle, le peuple en bas. Une flèche courbe par lien, légendée par son verbe.
function placer(organes) {
  const n = organes.length;
  return Object.fromEntries(organes.map(([id], i) => {
    const a = Math.PI / 2 + (i * 2 * Math.PI) / n;
    return [id, { x: 50 + 37 * Math.cos(a), y: 50 + 36 * Math.sin(a) }];
  }));
}
// Le bord d'une pastille, vu comme une ellipse : la flèche part et arrive au bord, pas au centre.
function bord(p, vers, rx = 13, ry = 6.5) {
  const dx = vers.x - p.x; const dy = vers.y - p.y;
  const t = 1 / Math.sqrt((dx / rx) ** 2 + (dy / ry) ** 2);
  return { x: p.x + dx * t, y: p.y + dy * t };
}
function trace(pos, de, a, rang) {
  const A = pos[de]; const B = pos[a];
  const dx = B.x - A.x; const dy = B.y - A.y; const l = Math.hypot(dx, dy) || 1;
  const courbe = 7 + rang * 9;
  const c = { x: (A.x + B.x) / 2 - (dy / l) * courbe, y: (A.y + B.y) / 2 + (dx / l) * courbe };
  const p0 = bord(A, c); const p1 = bord(B, c);
  const milieu = { x: 0.25 * p0.x + 0.5 * c.x + 0.25 * p1.x, y: 0.25 * p0.y + 0.5 * c.y + 0.25 * p1.y };
  return { d: `M${p0.x.toFixed(2)} ${p0.y.toFixed(2)} Q${c.x.toFixed(2)} ${c.y.toFixed(2)} ${p1.x.toFixed(2)} ${p1.y.toFixed(2)}`, milieu };
}

function plan(regime, types) {
  const pos = placer(regime.organes);
  const toile = s('svg', { class: 'ar-toile', viewBox: '0 0 100 100', 'aria-hidden': 'true' });
  const defs = s('defs');
  for (const [id, cls] of [['ar-pointe', 'ar-pointe'], ['ar-pointe-faux', 'ar-pointe faux']]) {
    const m = s('marker', { id, viewBox: '0 0 10 10', refX: '8.5', refY: '5', markerWidth: '3.4', markerHeight: '3.4', orient: 'auto-start-reverse' });
    m.append(s('path', { d: 'M0 0L10 5L0 10z', class: cls })); defs.append(m);
  }
  toile.append(defs);
  const calque = h('div', { class: 'ar-etiquettes', 'aria-hidden': 'true' });
  const organes = Object.fromEntries(regime.organes.map(([id, nom]) => [id, h('button', { class: 'ar-organe', 'data-id': id, style: `left:${pos[id].x}%;top:${pos[id].y}%` }, nom)]));
  const scene = h('div', { class: 'ar-scene' }, toile, calque, Object.values(organes));
  const rangs = new Map();
  // Dessine une flèche ; renvoie ses éléments pour l'animer ou l'effacer.
  function fleche(de, a, type, classe) {
    const cle = `${de}>${a}`; const rang = rangs.get(cle) || 0; rangs.set(cle, rang + 1);
    const { d, milieu } = trace(pos, de, a, rang);
    const chemin = s('path', { d, class: `ar-fleche ${classe}`, 'marker-end': `url(#${classe === 'faux' ? 'ar-pointe-faux' : 'ar-pointe'})` });
    toile.append(chemin);
    const etiquette = h('span', { class: `ar-verbe ${classe}`, style: `left:${milieu.x}%;top:${milieu.y}%` }, types[type]);
    calque.append(etiquette);
    if (effets()) {
      const lg = chemin.getTotalLength ? chemin.getTotalLength() : 60;
      chemin.style.strokeDasharray = lg; chemin.style.strokeDashoffset = lg;
      requestAnimationFrame(() => { chemin.style.transition = 'stroke-dashoffset .45s cubic-bezier(.3,.7,.3,1)'; chemin.style.strokeDashoffset = 0; });
    }
    return { chemin, etiquette, cle };
  }
  return { scene, organes, fleche, rangs };
}

export function jouerPouvoirs(zone, ctx, round) {
  return round.mode === 'reconnaitre' ? reconnaitre(zone, ctx, round) : construire(zone, ctx, round);
}

function construire(zone, ctx, round) {
  return new Promise((fini) => {
    const r = round.regime; const types = round.types;
    const { scene, organes, fleche, rangs } = plan(r, types);
    const trouves = new Set(); let erreurs = 0; let source = null; let occupe = false;
    const total = r.liens.length;
    const restants = () => r.liens.map((l, i) => i).filter((i) => !trouves.has(i));
    // Les verbes à placer, comptés : le joueur sait ce qu'il cherche, pas où.
    const verbes = h('div', { class: 'ar-verbes' });
    const majVerbes = () => {
      const compte = {};
      for (const i of restants()) compte[r.liens[i][2]] = (compte[r.liens[i][2]] || 0) + 1;
      verbes.replaceChildren(...[...new Set(r.liens.map((l) => l[2]))].map((t) => h('span', { class: `ar-puce ${compte[t] ? '' : 'faite'}` }, types[t], compte[t] > 1 ? h('b', {}, `×${compte[t]}`) : null)));
    };
    const note = h('p', { class: 'ar-note', 'aria-live': 'polite' }, 'Touche un organe, puis celui qu’il vise.');
    const compteur = h('span', { class: 'tri-compte' });
    const majCompteur = () => { compteur.textContent = `${trouves.size} sur ${total}`; };
    const menu = h('div', { class: 'ar-menu', hidden: true });
    const ecran = h('div', { class: 'ecran pouvoirs' },
      h('div', { class: 'ecran-corps' }, h('p', { class: 'surtitre' }, 'L’architecte des pouvoirs ', compteur), h('h2', { class: 'question' }, r.nom), verbes),
      scene, note, menu);
    if (window.__app) ecran.dataset.reste = JSON.stringify(restants().map((i) => [r.liens[i][0], cibles(r.liens[i][1])[0], r.liens[i][2]]));
    zone.replaceChildren(ecran);
    majVerbes(); majCompteur();

    const viser = (id) => { for (const [k, b] of Object.entries(organes)) { b.classList.toggle('source', k === source); b.classList.toggle('cible-possible', !!source && k !== source); } if (id) organes[id].classList.add('touche'); };
    for (const [id, b] of Object.entries(organes)) b.addEventListener('click', () => toucher(id));
    function toucher(id) {
      if (occupe) return;
      son('tap'); vibrer(6);
      if (!source || source === id) { source = source === id ? null : id; menu.hidden = true; viser(); note.textContent = source ? `${organes[source].textContent}… puis qui ?` : 'Touche un organe, puis celui qu’il vise.'; return; }
      const de = source; const a = id;
      viser(a);
      note.textContent = `${organes[de].textContent} → ${organes[a].textContent} : quel pouvoir ?`;
      menu.replaceChildren(h('p', { class: 'ar-menu-titre' }, `${organes[de].textContent} … ${organes[a].textContent}`),
        h('div', { class: 'ar-menu-choix' }, round.verbes.map((t) => h('button', { class: 'ar-choix', 'data-type': t, onClick: () => poser(de, a, t) }, types[t]))),
        h('button', { class: 'bouton-lien', onClick: () => { menu.hidden = true; source = null; viser(); for (const b of Object.values(organes)) b.classList.remove('touche'); } }, 'Annuler'));
      menu.hidden = false;
    }
    async function poser(de, a, t) {
      if (occupe) return; occupe = true;
      menu.hidden = true; source = null; viser();
      for (const b of Object.values(organes)) b.classList.remove('touche');
      const i = r.liens.findIndex((l) => l[0] === de && cibles(l[1]).includes(a) && l[2] === t);
      if (i >= 0 && trouves.has(i)) { note.textContent = 'Ce lien est déjà posé.'; occupe = false; return; }
      if (i >= 0) {
        trouves.add(i); ctx.combo(true);
        son('ok'); vibrer(12);
        const f = fleche(de, a, t, 'juste');
        f.chemin.classList.add('pose');
        note.textContent = r.liens[i][3];
        note.classList.remove('faux'); note.classList.add('juste');
        majVerbes(); majCompteur();
        if (window.__app) ecran.dataset.reste = JSON.stringify(restants().map((k) => [r.liens[k][0], cibles(r.liens[k][1])[0], r.liens[k][2]]));
        await attendre(350);
        occupe = false;
        if (trouves.size === total) conclure();
        return;
      }
      erreurs++; ctx.combo(false);
      son('ko'); vibrer([20, 40, 20]);
      const piege = r.pieges.find((p) => p[0] === de && p[1] === a && p[2] === t);
      const f = fleche(de, a, t, 'faux');
      note.textContent = piege ? piege[3] : `${organes[de].textContent} « ${types[t]} » ${organes[a].textContent.toLowerCase()} : ce lien n’existe pas dans ce régime.`;
      note.classList.remove('juste'); note.classList.add('faux');
      scene.classList.remove('secoue'); void scene.offsetWidth; scene.classList.add('secoue');
      await attendre(900);
      f.chemin.classList.add('brise'); f.etiquette.classList.add('brise');
      await attendre(450);
      f.chemin.remove(); f.etiquette.remove();
      rangs.set(f.cle, Math.max(0, (rangs.get(f.cle) || 1) - 1));
      occupe = false;
      if (erreurs === 3 && trouves.size < total) note.append(' ', h('button', { class: 'bouton-lien', onClick: reveler }, 'Voir les liens qui manquent'));
    }
    async function reveler() {
      occupe = true;
      for (const i of restants()) { const l = r.liens[i]; fleche(l[0], cibles(l[1])[0], l[2], 'revele'); await attendre(180); }
      conclure(true);
    }
    async function conclure(revele = false) {
      occupe = true;
      const trouvesAvant = trouves.size;
      // Le pouvoir arrête le pouvoir : toutes les flèches s'allument, l'une après l'autre.
      scene.classList.add('acheve');
      await attendre(900);
      const score = revele ? (trouvesAvant / total) * 0.6 : Math.max(0.4, 1 - erreurs * 0.12);
      const parfait = !revele && erreurs === 0;
      const ficheId = round.carte || r.carte || r.id;
      if (ficheId) ctx.noter(ficheId, parfait);
      ctx.gain(Math.round(32 * score) + (parfait ? 8 : 0));
      fini();
      finEpreuve(zone, ctx, { score, parfait },
        h('p', { class: 'surtitre' }, parfait ? 'Toutes les flèches du premier coup.' : revele ? `${trouvesAvant} lien${trouvesAvant > 1 ? 's' : ''} trouvé${trouvesAvant > 1 ? 's' : ''} sur ${total}.` : `${pluriel(erreurs, 'fausse flèche')} en chemin.`),
        h('article', { class: 'revelation' }, h('h3', {}, `${r.nom} : ${r.famille.toLowerCase()}`),
          h('ul', { class: 'ar-recap' }, r.liens.map((l) => h('li', {}, h('b', {}, `${nom(r, l[0])} ${types[l[2]]} ${cibles(l[1]).map((x) => nom(r, x).toLowerCase()).join(' et ')}.`), ' ', l[3])))));
    }
  });
}
const nom = (r, id) => r.organes.find((o) => o[0] === id)[1];

function reconnaitre(zone, ctx, round) {
  return new Promise((fini) => {
    const r = round.regime; const types = round.types;
    const { scene, fleche } = plan(r, types);
    scene.classList.add('fige');
    const options = round.options.map((o) => h('button', { class: 'option', 'data-ok': repere(o.id === r.id), onClick: () => choisir(o) }, h('span', { class: 'option-marque', 'aria-hidden': 'true' }), h('span', { class: 'option-t' }, o.nom)));
    const ecran = h('div', { class: 'ecran pouvoirs' },
      h('div', { class: 'ecran-corps' }, h('p', { class: 'surtitre' }, 'L’architecte des pouvoirs'), h('h2', { class: 'question' }, 'Quel régime dessine ce schéma ?')),
      scene, h('div', { class: 'options' }, options));
    zone.replaceChildren(ecran);
    (async () => { for (const l of r.liens) { fleche(l[0], cibles(l[1])[0], l[2], 'juste'); await attendre(140); } })();
    let fait = false;
    async function choisir(o) {
      if (fait) return; fait = true;
      const ok = o.id === r.id;
      ctx.combo(ok); son(ok ? 'ok' : 'ko'); vibrer(ok ? 10 : [20, 40, 20]);
      const ficheId = round.carte || r.carte || r.id;
      if (ficheId) ctx.noter(ficheId, ok);
      options.forEach((b, j) => { b.disabled = true; if (round.options[j].id === r.id) b.classList.add('juste'); else if (round.options[j] === o) b.classList.add('faux'); });
      await attendre(800);
      ctx.gain(ok ? 26 : 4);
      fini();
      finEpreuve(zone, ctx, { score: ok ? 1 : 0, parfait: ok },
        h('p', { class: 'surtitre' }, ok ? 'Bien vu.' : `C’était : ${r.nom}.`),
        h('article', { class: 'revelation' }, h('h3', {}, `${r.nom} : ${r.famille.toLowerCase()}`),
          h('ul', { class: 'ar-recap' }, r.liens.map((l) => h('li', {}, h('b', {}, `${nom(r, l[0])} ${types[l[2]]} ${cibles(l[1]).map((x) => nom(r, x).toLowerCase()).join(' et ')}.`), ' ', l[3])))));
    }
  });
}

// LE NUANCIER DES ÉTATS --------------------------------------------------------------------------
// Une bande en dégradé ; chaque jeton se pose dessus, au doigt ou d'un toucher sur la bonne zone.
export function jouerNuancier(zone, ctx, round) {
  return new Promise((fini) => {
    const n = round.nuances.length;
    let i = 0; let points = 0; let exacts = 0; let occupe = false;
    const zones = round.nuances.map((nm, k) => h('button', { class: 'nu-zone', 'data-k': k, 'aria-label': nm, onClick: () => poser(k) }, h('span', {}, nm.replace(/^État /, '').replace(/^./, (c) => c.toUpperCase()))));
    const bande = h('div', { class: 'nu-bande' }, zones);
    const epingles = h('div', { class: 'nu-epingles', 'aria-hidden': 'true' });
    const pile = h('div', { class: 'nu-pile' });
    const consigne = h('p', { class: 'nu-consigne', 'aria-live': 'polite' }, 'Glisse le jeton sur la bande, ou touche la bonne zone.');
    const compteur = h('span', { class: 'tri-compte' });
    const ecran = h('div', { class: 'ecran nuancier' },
      h('div', { class: 'ecran-corps' }, h('p', { class: 'surtitre' }, 'Le nuancier des États ', compteur),
        h('div', { class: 'nu-axe' }, h('span', {}, 'Un seul centre'), h('span', {}, 'Des États associés'))),
      pile, h('div', { class: 'nu-cadre' }, epingles, bande), consigne);
    zone.replaceChildren(ecran);
    let jeton = null;

    function suivant() {
      if (i >= round.jetons.length) return conclure();
      compteur.textContent = `${i + 1} sur ${round.jetons.length}`;
      const j = round.jetons[i];
      jeton = h('article', { class: 'nu-jeton', 'data-bon': repere(j.k) }, h('p', {}, j.t));
      pile.replaceChildren(jeton);
      consigne.textContent = 'Glisse le jeton sur la bande, ou touche la bonne zone.';
      consigne.className = 'nu-consigne';
      for (const z of zones) z.classList.remove('indique', 'vise');
      brancher(jeton);
    }
    const zoneSous = (x) => { const b = bande.getBoundingClientRect(); if (x < b.left || x > b.right) return null; return Math.min(n - 1, Math.floor(((x - b.left) / b.width) * n)); };
    function brancher(el) {
      let x0 = 0; let y0 = 0; let tient = false; let k = null;
      el.addEventListener('pointerdown', (e) => { if (occupe) return; tient = true; x0 = e.clientX; y0 = e.clientY; el.setPointerCapture(e.pointerId); el.classList.add('tenue'); });
      el.addEventListener('pointermove', (e) => {
        if (!tient) return;
        el.style.transform = `translate(${e.clientX - x0}px, ${e.clientY - y0}px) scale(.9)`;
        const b = bande.getBoundingClientRect();
        k = e.clientY > b.top - 60 && e.clientY < b.bottom + 40 ? zoneSous(e.clientX) : null;
        zones.forEach((z, q) => z.classList.toggle('vise', q === k));
      });
      const lacher = () => { if (!tient) return; tient = false; el.classList.remove('tenue'); for (const z of zones) z.classList.remove('vise'); if (k !== null) poser(k); else el.style.transform = ''; k = null; };
      el.addEventListener('pointerup', lacher); el.addEventListener('pointercancel', lacher);
    }
    async function poser(k) {
      if (occupe || !jeton) return; occupe = true;
      const j = round.jetons[i];
      const ecart = Math.abs(k - j.k);
      const etat = ecart === 0 ? 'juste' : ecart === 1 ? 'proche' : 'faux';
      points += ecart === 0 ? 1 : ecart === 1 ? 0.5 : 0;
      if (ecart === 0) exacts++;
      ctx.combo(ecart === 0);
      const ficheId = j.carte || j.id;
      if (ficheId) ctx.noter(ficheId, ecart === 0);
      son(ecart === 0 ? 'ok' : 'ko'); vibrer(ecart === 0 ? 12 : [20, 40, 20]);
      // Le jeton fond dans la bande ; une épingle marque l'endroit, à la bonne place.
      const zb = zones[k].getBoundingClientRect(); const jb = jeton.getBoundingClientRect();
      jeton.style.transition = `transform ${duree(320)}ms cubic-bezier(.3,.7,.3,1), opacity ${duree(320)}ms`;
      jeton.style.transform = `translate(${zb.left + zb.width / 2 - (jb.left + jb.width / 2)}px, ${zb.top - (jb.top + jb.height / 2)}px) scale(.2)`;
      jeton.style.opacity = '0';
      const deja = epingles.querySelectorAll(`[data-k="${k}"]`).length;
      epingles.append(h('span', { class: `nu-epingle ${etat}`, 'data-k': k, style: `--x:${((k + 0.5) / n) * 100}%; --r:${deja}` }, h('i', {})));
      zones[j.k].classList.add('indique');
      consigne.textContent = `${ecart === 0 ? 'Oui.' : ecart === 1 ? `Presque : ${round.nuances[j.k]}.` : `Non : ${round.nuances[j.k]}.`} ${j.w}`;
      consigne.className = `nu-consigne ${etat}`;
      await attendre(ecart === 0 ? 900 : 1700);
      i++; occupe = false; suivant();
    }
    function conclure() {
      const tot = round.jetons.length; const score = points / tot;
      ctx.gain(Math.round(30 * score) + (exacts === tot ? 8 : 0));
      fini();
      finEpreuve(zone, ctx, { score, parfait: exacts === tot },
        h('p', { class: 'surtitre' }, exacts === tot ? 'Tout le nuancier est juste.' : `${exacts} sur ${tot} à la bonne nuance.`),
        h('article', { class: 'revelation' }, h('h3', {}, 'De l’unitaire à la confédération'),
          h('p', { class: 'apport' }, 'L’État unitaire peut se décentraliser ; l’État régional garantit l’autonomie de ses régions ; l’État fédéral superpose deux ordres juridiques ; la confédération laisse ses membres libres d’en sortir.')));
    }
    suivant();
  });
}

// LA PLUME DU CONSTITUANT -----------------------------------------------------------------------
// Un article sur parchemin, des mots manquants ; puis on scelle le texte du sceau de sa source.
export function jouerPlume(zone, ctx, round) {
  return new Promise((fini) => {
    const t = round.texte;
    const trous = t.morceaux.filter((m) => typeof m !== 'string');
    let cur = 0; let bons = 0; let rate = false; let occupe = false;
    const spans = [];
    const feuille = h('article', { class: 'pl-feuille' },
      h('p', { class: 'pl-ref' }, t.ref),
      h('p', { class: 'pl-texte' }, t.morceaux.map((m) => {
        if (typeof m === 'string') return m;
        const sp = h('span', { class: 'pl-trou', 'data-m': repere(m.bon) }, h('span', { class: 'pl-encre' }, m.bon));
        spans.push(sp); return sp;
      })),
      h('span', { class: 'pl-cachet', 'aria-hidden': 'true' }));
    const tuiles = h('div', { class: 'pl-tuiles' });
    const consigne = h('p', { class: 'pl-consigne', 'aria-live': 'polite' }, 'Choisis le mot qui manque.');
    const ecran = h('div', { class: 'ecran plume' }, h('div', { class: 'ecran-corps' }, h('p', { class: 'surtitre' }, 'La plume du constituant')), feuille, consigne, tuiles);
    zone.replaceChildren(ecran);

    function trou() {
      spans.forEach((sp, k) => sp.classList.toggle('cible', k === cur));
      rate = false;
      const m = trous[cur];
      tuiles.replaceChildren(...m.options.map((mot) => h('button', { class: 'pl-tuile', 'data-mot': mot, onClick: (e) => choisir(mot, e.currentTarget) }, mot)));
    }
    async function choisir(mot, bouton) {
      if (occupe) return;
      const m = trous[cur];
      if (mot !== m.bon) {
        if (!rate) ctx.combo(false);
        rate = true; son('ko'); vibrer([20, 40, 20]);
        bouton.disabled = true; bouton.classList.add('faux');
        consigne.textContent = 'Ce n’est pas le mot du texte.';
        return;
      }
      occupe = true;
      if (!rate) { bons++; ctx.combo(true); }
      son('ok'); vibrer(10);
      bouton.classList.add('juste');
      const sp = spans[cur];
      sp.classList.remove('cible'); sp.classList.add('ecrit');
      consigne.textContent = 'Choisis le mot qui manque.';
      await attendre(520);
      cur++; occupe = false;
      if (cur < trous.length) trou(); else sceller();
    }
    // Deuxième temps : quatre sceaux, un seul est celui du texte.
    function sceller() {
      consigne.textContent = 'De quel texte vient cet article ? Appose son sceau.';
      tuiles.replaceChildren(h('div', { class: 'pl-sceaux' }, round.sources.map((src) => h('button', { class: 'pl-sceau', 'data-ok': repere(src.k === t.src), onClick: () => apposer(src) }, h('span', {}, src.nom)))));
    }
    let scelle = false;
    async function apposer(src) {
      if (scelle) return; scelle = true;
      const ok = src.k === t.src;
      ctx.combo(ok); son(ok ? 'marteau' : 'ko'); vibrer(ok ? 16 : [20, 40, 20]);
      const cachet = feuille.querySelector('.pl-cachet');
      cachet.textContent = round.sources.find((x) => x.k === t.src).court;
      cachet.classList.add('pose', ok ? 'juste' : 'faux');
      tuiles.querySelectorAll('.pl-sceau').forEach((b, j) => { b.disabled = true; const k = round.sources[j].k; if (k === t.src) b.classList.add('juste'); else if (round.sources[j] === src) b.classList.add('faux'); });
      consigne.textContent = ok ? 'Le bon sceau.' : `Non : ${round.sources.find((x) => x.k === t.src).nom}.`;
      await attendre(1100);
      const score = (bons / trous.length) * 0.7 + (ok ? 0.3 : 0);
      const parfait = bons === trous.length && ok;
      const ficheId = t.carte || t.id || round.carte || round.id;
      if (ficheId) ctx.noter(ficheId, parfait);
      ctx.gain(Math.round(30 * score) + (parfait ? 6 : 0));
      fini();
      finEpreuve(zone, ctx, { score, parfait },
        h('p', { class: 'surtitre' }, parfait ? 'Texte rétabli et bien scellé.' : `${bons} mot${bons > 1 ? 's' : ''} sur ${trous.length} du premier coup${ok ? ', bon sceau' : ', mauvais sceau'}.`),
        h('article', { class: 'revelation' }, h('h3', {}, `${round.sources.find((x) => x.k === t.src).nom}, ${t.ref.toLowerCase()}`),
          h('p', { class: 'pl-cite' }, t.morceaux.map((m) => (typeof m === 'string' ? m : h('b', {}, m.bon))))));
    }
    trou();
  });
}
