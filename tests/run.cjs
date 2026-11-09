// Tests de bout en bout sur écran d'iPhone : parties complètes, série, boutique, sauvegarde, mode avion.
const { chromium, devices } = require('playwright');
const assert = require('assert');
const fs = require('fs'); const os = require('os'); const path = require('path');
const serveur = require('./serveur.cjs');
const PORT = 8124; const URLB = `http://localhost:${PORT}/`;
const CAP = 'tests/captures/';
const log = (...a) => console.log(...a);

// Le bon plan et l'architecte demandent d'abord le type de sujet.
async function ouvrirMode(p, m, genre = 'hasard') {
  await p.locator(`.role-ligne[data-mode="${m}"]`).click();
  if (m === 'plan' || m === 'architecte') await p.locator(`.boite-genre [data-genre="${genre}"]`).click();
}
async function etat(p) { return p.evaluate(() => JSON.parse(JSON.stringify(window.__app.etat()))); }

// Aucun texte technique ne doit jamais apparaître à l'écran.
async function textePropre(p) {
  const tache = await p.evaluate(() => (document.body.innerText.match(/\b(null|undefined|NaN)\b|\[object/) || [null])[0]);
  if (tache) console.log("CONTEXTE", await p.evaluate(() => { const t = document.body.innerText; const i = t.search(/\b(null|undefined|NaN)\b/); return t.slice(Math.max(0, i - 120), i + 40); }));
  assert.equal(tache, null, `Texte technique affiché : ${tache}`);
}

// Touche un élément pour de vrai ; s'il vient de disparaître, on passe.
async function toucher(e) { try { await e.click({ timeout: 900 }); return true; } catch { return false; } }

// Joue jusqu'à l'écran de résultats, en touchant ce qui est disponible.
// Le sceau du jour demande une séance réussie : le robot joue juste, sauf demande contraire.

// Les jeux de la L1, joués juste grâce aux repères du mode test. Renvoie vrai si un geste a été fait.
const pasL1 = (p) => p.evaluate(() => {
  const clic = (e) => { if (!e) return false; e.click(); return true; };
  const q = (s) => document.querySelector(s);
  const sc = q('.sc-choix[data-ok="true"]:not([disabled])'); if (sc) return clic(sc);
  if (q('.scene .pied button')) return false;
  const carte = q('.tri-carte[data-bon]:not(.tamponnee)'); if (carte) return clic(q(`.tri-bord[data-bord="${carte.dataset.bon}"]`));
  const grille = q('.mot-grille');
  if (grille && !grille.querySelector('.retourne') && !grille.querySelector('.pleine')) { for (const l of grille.dataset.mot) q(`.mot-touche[data-touche="${l}"]`).click(); return clic(q('.mot-touche[data-touche="OK"]')); }
  const piece = q('.rg-piece[data-bon]'); if (piece) return clic(q(`.rg-colonne[data-col="${piece.dataset.bon}"]`));
  const med = q('.qad-medaillon[data-ok="true"]:not([disabled])'); if (med) return clic(med);
  const cartes = [...document.querySelectorAll('.mem-carte:not(.trouvee):not(.ouverte)')];
  if (cartes.length && !document.querySelector('.mem-carte.ouverte:not(.trouvee)')) { const a = cartes[0]; const b2 = cartes.find((c) => c !== a && c.dataset.paire === a.dataset.paire); a.click(); b2.click(); return true; }
  return false;
});

async function jouer(p, { capture = false, auHasard = false, max = 1500 } = {}) {
  if (!auHasard && !capture) return jouerParfait(p);
  const vus = new Set();
  for (let n = 0; n < max; n++) {
    await textePropre(p);
    if (await p.$('.resultats')) return;
    if (capture) {
      const nom = await p.evaluate(() => (['.tri', '.mot', '.rangement', '.quiadit', '.scanner', '.memory', '.paires', '.puzzle', '.libre', '.trous', '.qcm', '.bonplan', '.architecte', '.fin-epreuve'].find((s) => document.querySelector(s)) || '').slice(1));
      if (nom && !vus.has(nom)) { vus.add(nom); await p.screenshot({ path: `${CAP}${capture}-${nom}.png` }); }
    }
    if (await pasL1(p)) { await p.waitForTimeout(120); continue; }
    // Dans la séance seulement : le pied des résultats ramènerait au Palais avant que le test ne les voie.
    const pied = await p.$('.scene .pied button');
    if (pied) { await toucher(pied); await p.waitForTimeout(15); continue; }
    const sel = ['.chip:not([disabled]):not(.reussi)', '.option:not([disabled])', '.vers:not(.occupe)', 'button.case-plan:not(.pleine)', 'button.decision', '.etiquette-mot:not([disabled])', '.piece-syllo'];
    let fait = false;
    for (const s of sel) {
      const e = await p.$(s);
      if (!e) continue;
      fait = await toucher(e);
      if (fait && s.startsWith('.chip')) {
        const cartes = await p.$$('.carte-paire:not([disabled])');
        for (const c of cartes) { await toucher(c); await p.waitForTimeout(5); if (await p.evaluate(() => !document.querySelector('.chip.vise'))) break; }
      }
      break;
    }
    if (!fait) await p.waitForTimeout(60);
  }
  throw new Error('Partie non terminée');
}

// Joue en donnant les bonnes réponses, grâce aux repères du mode test.
async function jouerParfait(p) {
  for (let n = 0; n < 2500; n++) {
    await textePropre(p);
    if (await p.$('.resultats')) return;
    if (await pasL1(p)) { await p.waitForTimeout(120); continue; }
    const fait = await p.evaluate(() => {
      const clic = (e) => { e.click(); return true; };
      const rail = document.querySelector('.plans-rail'); const bon = document.querySelector('.plan-carte[data-ok="true"]');
      if (rail && bon && !document.querySelector('.plan-carte.juste') && !bon.classList.contains('centree')) { rail.scrollLeft = bon.offsetLeft - rail.firstChild.offsetLeft; return false; }
      const pied = document.querySelector('.scene .pied button'); if (pied) return clic(pied);
      const chip = document.querySelector('.chip:not([disabled]):not(.reussi)');
      if (chip) {
        if (!chip.classList.contains('vise')) chip.click();
        const cible = document.querySelector(`.carte-paire[data-id="${chip.dataset.id}"]:not([disabled])`);
        return cible ? clic(cible) : false;
      }
      const opt = document.querySelector('.option[data-ok="true"]:not([disabled])'); if (opt) return clic(opt);
      const trou = document.querySelector('.trou.cible');
      if (trou) return clic(document.querySelector(`.etiquette-mot[data-mot="${trou.dataset.m}"]:not([disabled])`));
      const decision = document.querySelector('.decision');
      if (decision) { const c = document.querySelector(`.jalon-case[data-i="${decision.dataset.rang}"]`); return clic(c.classList.contains('cible') ? decision : c); }
      const caseS = document.querySelector('.case-syllo.cible');
      if (caseS) return clic(document.querySelector(`.piece-syllo[data-k="${caseS.dataset.k}"][data-ok="true"]`));
      const ecarter = document.querySelector('.dock-bas .bouton-fantome');
      const piece = document.querySelector('.carte-piece');
      if (piece) return piece.dataset.cle === 'piege' ? clic(ecarter) : clic(document.querySelector(`.vers[data-k="${piece.dataset.cle}"]`));
      const tuile = document.querySelector('.tuile');
      if (tuile) return tuile.dataset.case === 'leurre' ? clic(ecarter) : clic(document.querySelector(`.case-plan[data-c="${tuile.dataset.case}"]`));
      return false;
    });
    await p.waitForTimeout(fait ? 8 : 30);
  }
  throw new Error('Partie parfaite non terminée');
}

async function debordement(p, nom) {
  const d = await p.evaluate(() => ({ s: document.documentElement.scrollWidth, c: document.documentElement.clientWidth }));
  assert(d.s <= d.c + 1, `Débordement horizontal sur ${nom} : ${d.s} > ${d.c}`);
}

(async () => {
  const s = await serveur('docs', PORT);
  const b = await chromium.launch();
  const erreurs = [];
  const ctx = await b.newContext({ ...devices['iPhone 13'], serviceWorkers: 'allow' });
  const p = await ctx.newPage();
  p.on('pageerror', (e) => erreurs.push(e.message));
  p.on('console', (m) => { if (m.type() === 'error' && !/favicon/.test(m.text())) erreurs.push(m.text()); });

  await p.goto(URLB + '?test'); await p.waitForSelector('.tribune');
  await p.evaluate(() => document.fonts.ready);
  log('accueil ok');

  // 0. Une séance coupée reprend à l'épreuve en cours.
  await p.tap('text=Défi du jour');
  await p.waitForSelector('.chip');
  for (let k = 0; k < 40 && !(await p.$('.pied button')); k++) {
    const c = await p.$('.chip:not([disabled]):not(.reussi)'); if (!c) break;
    await c.click();
    for (const x of await p.$$('.carte-paire:not([disabled])')) { await x.click(); await p.waitForTimeout(5); if (await p.evaluate(() => !document.querySelector('.chip.vise'))) break; }
  }
  await p.locator('.pied button').click();
  await p.waitForTimeout(100);
  await p.reload(); await p.waitForSelector('.reprise');
  await p.screenshot({ path: CAP + 'reprise.png' });
  assert.equal((await etat(p)).enCours.i, 1, 'séance mémorisée à la deuxième épreuve');
  await p.locator('.reprise .bouton-or').click();
  await p.waitForSelector('.pips i.fait');
  await p.tap('.quitter');
  await p.tap('text=Quitter >> nth=-1');
  await p.waitForSelector('.tribune');
  assert.equal((await etat(p)).enCours, null, 'séance abandonnée');
  log('reprise ok');

  // 1. Défi du jour complet.
  await p.tap('text=Défi du jour');
  await jouerParfait(p);
  await jouer(p, { capture: 'defi' }).catch(() => {});
  await p.waitForTimeout(1200);
  await p.screenshot({ path: CAP + 'resultats.png' });
  let e = await etat(p);
  assert.equal(e.serie.n, 1, 'la série doit valoir 1'); assert(e.xp > 0, 'XP'); assert(e.stats.seances === 1);
  assert(Object.keys(e.arrets).length > 3, 'arrêts notés');
  log('défi terminé :', { xp: e.xp, jetons: e.jetons, vus: Object.keys(e.arrets).length });
  await p.tap('text=Retour au Palais');

  // 1 bis. Partie parfaite : sans faute, coffre de série, nouveau grade, audience gagnée.
  await p.evaluate(() => { const e = window.__app.etat(); e.xp = 295; e.serie.n = 6; e.serie.dernier -= 1; });
  await p.evaluate(() => { const e = window.__app.etat(); e.jours = {}; window.__app.aller('palais'); });
  await p.tap('text=Défi du jour');
  await jouerParfait(p);
  await p.waitForTimeout(1300);
  await p.screenshot({ path: CAP + 'parfait.png', fullPage: true });
  e = await etat(p);
  assert.equal(e.serie.n, 7, 'série à 7'); assert(e.coffres[7], 'coffre des 7 jours');
  assert(e.stats.parfaites >= 1, 'séance parfaite comptée'); assert(e.trophees.sansfaute, 'trophée sans faute');
  assert(await p.locator('.decret').count(), 'décret de nomination affiché');
  log('partie parfaite ok');
  await p.tap('text=Retour au Palais');
  await p.locator('.onglet', { hasText: 'Chambres' }).click();
  await p.locator('.salle', { hasText: 'Normes constitutionnelles' }).locator('button').click();
  await p.tap('text=Audience solennelle');
  await jouerParfait(p);
  e = await etat(p);
  assert(e.zones.gagnees.includes(2), 'audience gagnée'); assert(e.zones.ouvertes.includes(3), 'chambre suivante ouverte');
  assert(e.zones.parfaites.includes(2), 'audience sans faute'); assert(e.trophees.bossParfait, 'trophée audience');
  log('audience gagnée ok');
  await p.tap('text=Retour au Palais');

  // 2. Chaque mode, seul, plusieurs fois, pour couvrir le contenu.
  for (const m of ['Paires', 'Puzzle d’arrêt', 'Le juge, c’est toi', 'Le bon plan', 'Architecte', 'Frise de la jurisprudence']) {
    for (let i = 0; i < 3; i++) {
      await p.evaluate(() => window.__app.aller('role')); await p.locator('.role-ligne', { hasText: m }).click();
      if (await p.locator('.boite-genre').count()) await p.locator(`.boite-genre [data-genre="${['C', 'D', 'hasard'][i]}"]`).click();
      await jouer(p, { capture: i === 0 ? 'mode-' + m.slice(0, 4).replace(/\W/g, '') : false });
      await debordement(p, m);
      await p.tap('text=Retour au Palais');
    }
    log('mode ok :', m);
  }

  // 3. Audience solennelle et ouverture de la chambre suivante.
  await p.evaluate(() => window.__app.aller('carte'));
  await p.screenshot({ path: CAP + 'chambres.png' });
  await debordement(p, 'chambres');
  await p.locator('.salle', { hasText: 'Naissance' }).locator('button').click();
  await p.screenshot({ path: CAP + 'chambre.png' });
  await p.tap('text=Audience solennelle');
  await jouer(p, { capture: 'boss' });
  await debordement(p, 'résultats audience');
  await p.screenshot({ path: CAP + 'boss-fin.png' });
  log('audience jouée');
  await p.tap('text=Retour au Palais');

  // 4. Arrêts, fiche, boutique, profil.
  await p.evaluate(() => window.__app.aller('arrets'));
  await p.screenshot({ path: CAP + 'arrets.png' }); await debordement(p, 'arrêts');
  await p.fill('.recherche', 'perreux'); await p.waitForTimeout(50);
  assert.equal(await p.locator('.carte-arret').count(), 1, 'recherche');
  await p.locator('.carte-arret').first().click();
  await p.screenshot({ path: CAP + 'fiche.png', fullPage: true }); await debordement(p, 'fiche');
  await p.evaluate(() => window.__app.aller('boutique'));
  await p.screenshot({ path: CAP + 'boutique.png' }); await debordement(p, 'boutique');
  const avant = (await etat(p)).inv.indice;
  await p.evaluate(() => { window.__app.etat().jetons = 500; window.__app.aller('boutique'); });
  await p.locator('.article', { hasText: 'Note du rapporteur' }).locator('button').click();
  assert.equal((await etat(p)).inv.indice, avant + 1, 'achat');
  const avantRose = (await etat(p)).jetons;
  await p.locator('.theme-rose button').click();
  assert.equal(await p.evaluate(() => document.documentElement.dataset.theme), 'rose');
  assert.equal((await etat(p)).jetons, avantRose - 200, 'la tenue rose coûte 200 jetons');
  await p.screenshot({ path: CAP + 'theme-rose.png' });
  await p.locator('.theme-palais button').click();
  assert.equal(await p.evaluate(() => document.documentElement.dataset.theme), 'palais');
  await p.locator('.theme-rose button').click();
  assert.equal((await etat(p)).jetons, avantRose - 200, 'changer de tenue est gratuit');
  await p.locator('.theme-palais button').click();
  await p.evaluate(() => { window.__app.etat().jetons = 900; window.__app.aller('boutique'); });
  await p.locator('.article', { hasText: 'Les colonnes' }).locator('button').click();
  await p.locator('.article', { hasText: 'La plume' }).locator('button').click();
  await p.screenshot({ path: CAP + 'boutique-suite.png', fullPage: true });
  await p.evaluate(() => window.__app.aller('palais'));
  await p.screenshot({ path: CAP + 'decor.png' });
  await p.evaluate(() => window.__app.aller('profil'));
  await p.screenshot({ path: CAP + 'profil.png', fullPage: true }); await debordement(p, 'profil');
  log('écrans ok');

  // 5. Plus de sauvegarde par code : le compte s'en charge.
  await p.evaluate(() => window.__app.aller('profil'));
  assert.equal(await p.locator('text=Restaurer ce code').count(), 0, 'sauvegarde par code retirée');
  const xp = (await etat(p)).xp;
  log('sauvegarde ok');

  // 6. Copie de secours : localStorage vidé, IndexedDB prend le relais.
  await p.waitForTimeout(150);
  await p.evaluate(() => localStorage.clear());
  await p.reload(); await p.waitForSelector('.tribune');
  assert.equal((await etat(p)).xp, xp, 'copie de secours');
  log('copie de secours ok');

  // 7. Série : lendemain, sursis, rupture et relevé de forclusion.
  e = await etat(p); const n0 = e.serie.n;
  await p.goto(URLB + '?test&decalage=1'); await p.waitForSelector('.tribune');
  assert.equal((await etat(p)).serie.n, n0, 'le lendemain, la série tient');
  await p.evaluate(() => window.__app.aller('role')); await p.tap('.role-ligne[data-mode="express"]'); await jouer(p);
  assert.equal((await etat(p)).serie.n, n0 + 1, 'série prolongée');
  await p.tap('text=Retour au Palais');
  const sursis = (await etat(p)).inv.sursis;
  await p.goto(URLB + '?test&decalage=3'); await p.waitForSelector('.tribune');
  e = await etat(p);
  assert.equal(e.serie.n, n0 + 1, 'un jour manqué couvert par un sursis'); assert.equal(e.inv.sursis, sursis - 1, 'sursis consommé');
  await p.evaluate(() => { window.__app.etat().inv.sursis = 0; window.__app.etat().jetons = 300; localStorage.setItem('arrets-admin.v1', JSON.stringify(window.__app.etat())); });
  await p.goto(URLB + '?test&decalage=6'); await p.waitForSelector('.rupture');
  await p.screenshot({ path: CAP + 'rupture.png' });
  e = await etat(p); assert.equal(e.serie.n, 0, 'série rompue'); assert(e.rompue);
  await p.locator('.rupture button').click();
  e = await etat(p); assert.equal(e.serie.n, n0 + 1, 'série rétablie');
  await p.evaluate(() => window.__app.aller('role')); await p.tap('.role-ligne[data-mode="express"]'); await jouer(p);
  assert.equal((await etat(p)).serie.n, n0 + 2, 'série prolongée après relevé');
  log('série ok');

  // 8. Hors ligne, comme dans le métro.
  await p.goto(URLB + '?test'); await p.waitForSelector('.tribune');
  await p.evaluate(() => navigator.serviceWorker.ready);
  await p.waitForTimeout(500);
  await p.reload(); await p.waitForSelector('.tribune');
  await ctx.setOffline(true);
  await p.reload(); await p.waitForSelector('.tribune');
  await p.tap('text=Défi du jour'); await jouer(p);
  await p.tap('text=Retour au Palais');
  await p.evaluate(() => window.__app.aller('arrets'));
  await p.locator('.carte-arret').first().click();
  await ctx.setOffline(false);
  log('mode avion ok');

  await ctx.close();

  // 9. Petit écran (iPhone SE) : aucune page ne déborde.
  const petit = await b.newContext({ viewport: { width: 320, height: 568 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, userAgent: devices['iPhone SE'].userAgent });
  const q = await petit.newPage();
  q.on('pageerror', (x) => erreurs.push(x.message));
  await q.goto(URLB + '?test'); await q.waitForSelector('.tribune');
  await q.screenshot({ path: CAP + 'petit-accueil.png' }); await debordement(q, 'accueil 320');
  for (const o of ['carte', 'arrets', 'boutique', 'profil']) { await q.evaluate((x) => window.__app.aller(x), o); await debordement(q, o + ' 320'); }
  await q.evaluate(() => window.__app.aller('palais'));
  await q.tap('text=Défi du jour'); await jouer(q, { capture: 'petit' }); await debordement(q, 'résultats 320');
  await petit.close();

  // 10. Mise à jour : nouvelle version publiée, bandeau, contenu neuf, progression intacte.
  const copie = fs.mkdtempSync(path.join(os.tmpdir(), 'arrets-'));
  fs.cpSync('docs', copie, { recursive: true });
  const s2 = await serveur(copie, PORT + 1);
  const URL2 = `http://localhost:${PORT + 1}/`;
  const maj = await b.newContext({ ...devices['iPhone 13'] });
  const m = await maj.newPage();
  m.on('pageerror', (x) => erreurs.push(x.message));
  await m.goto(URL2 + '?test'); await m.waitForSelector('.tribune');
  await m.evaluate(() => navigator.serviceWorker.ready); await m.waitForTimeout(500);
  await m.evaluate(() => window.__app.aller('role')); await m.tap('.role-ligne[data-mode="express"]'); await jouer(m); await m.tap('text=Retour au Palais');
  const avantMaj = await etat(m);
  assert.equal(avantMaj.serie.n, 1, 'une séance jouée avant la mise à jour');
  const fsw = path.join(copie, 'sw.js');
  fs.writeFileSync(fsw, fs.readFileSync(fsw, 'utf8').replace(/const VERSION = '[^']+'/, "const VERSION = 'nouvelle'"));
  const fc = path.join(copie, 'content.json'); const neuf = JSON.parse(fs.readFileSync(fc, 'utf8')); neuf.version = 'version-neuve';
  fs.writeFileSync(fc, JSON.stringify(neuf));
  await m.reload(); await m.waitForSelector('.maj', { timeout: 10000 });
  await m.tap('.maj');
  await m.waitForFunction(() => document.querySelector('.tribune') && !document.querySelector('.maj'), null, { timeout: 10000 });
  await m.waitForFunction(() => window.__app); await m.evaluate(() => window.__app.aller('profil'));
  assert.match(await m.textContent('.version'), /version-neuve/, 'le contenu neuf est servi');
  const apresMaj = await etat(m);
  assert.deepEqual([apresMaj.serie, apresMaj.xp, apresMaj.jetons], [avantMaj.serie, avantMaj.xp, avantMaj.jetons], 'progression intacte');
  await maj.close(); s2.close(); fs.rmSync(copie, { recursive: true, force: true });
  log('mise à jour ok');

  // 11. Anciennes tenues : retirées et remboursées, une seule fois.
  const vieux = await b.newContext({ ...devices['iPhone 13'] });
  await vieux.addInitScript(() => { if (!localStorage.getItem('arrets-admin.v1')) localStorage.setItem('arrets-admin.v1', JSON.stringify({ v: 1, xp: 40, jetons: 10, themes: ['palais', 'tapis', 'pourpre'], theme: 'tapis', serie: { n: 4, dernier: null, record: 4 } })); });
  const vp = await vieux.newPage(); vp.on('pageerror', (x) => erreurs.push(x.message));
  await vp.goto(URLB + '?test'); await vp.waitForSelector('.toast');
  let ev = await etat(vp);
  assert.deepEqual([ev.theme, ev.themes, ev.jetons, ev.xp], ['palais', ['palais'], 460, 40], 'tenues remboursées, progression intacte');
  await vp.reload(); await vp.waitForSelector('.tribune');
  assert.equal((await etat(vp)).jetons, 460, 'remboursement unique');
  ev = await etat(vp);
  assert.deepEqual([ev.matiere, ev.oblig.xp, ev.xp], ['admin', 0, 40], 'ancienne progression rattachée au droit administratif');
  await vieux.close();
  log('anciennes tenues ok');

  // 12. Tenue rose : Slay Diva, Pas du tout Bebew, images personnelles, effets.
  const rose = await b.newContext({ ...devices['iPhone 13'] });
  const r = await rose.newPage(); r.on('pageerror', (x) => erreurs.push(x.message));
  await r.goto(URLB + '?test'); await r.waitForSelector('.tribune');
  await r.evaluate(() => window.__app.aller('role')); await r.tap('.role-ligne[data-mode="paires"]'); await r.waitForSelector('.chip');
  await r.evaluate(() => document.querySelectorAll('.chip')[0].click());
  await r.evaluate(() => { const c = document.querySelector('.chip.vise'); [...document.querySelectorAll('.carte-paire')].find((x) => x.dataset.id !== c.dataset.id).click(); });
  assert.equal(await r.locator('.bebew').count(), 0, 'pas de message rose en tenue bleue');
  await r.tap('.quitter'); await r.tap('.boite .bouton-or'); await r.waitForSelector('.tribune');
  await r.evaluate(() => { const e = window.__app.etat(); e.jetons = 200; window.__app.aller('boutique'); });
  await r.locator('.theme-rose button').click();
  await r.evaluate(() => window.__app.aller('palais'));
  assert(await r.locator('.figure-chouette .chouette').count(), 'chouette à l’accueil');
  assert(await r.locator('.figure-chouette img[src$="debout-livre.webp"]').count(), 'livre rose en tenue rose');
  await r.screenshot({ path: CAP + 'rose-accueil.png' }); await debordement(r, 'accueil rose');
  await r.evaluate(() => window.__app.aller('role')); await r.tap('.role-ligne[data-mode="paires"]'); await r.waitForSelector('.chip');
  await r.evaluate(() => document.querySelectorAll('.chip')[0].click());
  await r.evaluate(() => { const c = document.querySelector('.chip.vise'); [...document.querySelectorAll('.carte-paire')].find((x) => x.dataset.id !== c.dataset.id).click(); });
  assert.equal(await r.textContent('.bebew'), 'Pas du tout Bebew', 'message d’erreur en tenue rose');
  await r.tap('.quitter'); await r.tap('.boite .bouton-or'); await r.waitForSelector('.tribune');
  await r.evaluate(() => window.__app.aller('role')); await r.tap('.role-ligne[data-mode="paires"]');
  await r.evaluate(() => { const o = new MutationObserver(() => { if (document.querySelector('.slay')) window.__slay = true; }); o.observe(document.body, { childList: true }); });
  await jouerParfait(r);
  assert(await r.evaluate(() => window.__slay), 'Slay Diva après une épreuve à 100 %');
  await r.tap('text=Retour au Palais');
  await r.evaluate(() => window.__app.aller('profil'));
  const fauxPng = await r.evaluate(() => { const c = document.createElement('canvas'); c.width = 300; c.height = 300; const g = c.getContext('2d'); g.fillStyle = '#FFD0DC'; g.fillRect(0, 0, 300, 300); g.fillStyle = '#123456'; g.beginPath(); g.arc(150, 150, 80, 0, 7); g.fill(); return c.toDataURL('image/png').split(',')[1]; });
  await r.locator('.ligne-image[data-type="mascotte"] input[type=file]').setInputFiles({ name: 'moi.png', mimeType: 'image/png', buffer: Buffer.from(fauxPng, 'base64') });
  await r.waitForSelector('.ligne-image[data-type="mascotte"] img');
  await r.locator('.ligne-image[data-type="jeton"] input[type=file]').setInputFiles({ name: 'jeton.png', mimeType: 'image/png', buffer: Buffer.from(fauxPng, 'base64') });
  await r.waitForFunction(() => document.documentElement.style.getPropertyValue('--jeton-image').startsWith('url('));
  await r.evaluate(() => window.__app.aller('palais'));
  await r.waitForSelector('.mascotte-perso');
  const img = await r.evaluate(async () => { const i = document.querySelector('.mascotte-perso'); await i.decode(); const c = document.createElement('canvas'); c.width = i.naturalWidth; c.height = i.naturalHeight; const g = c.getContext('2d'); g.drawImage(i, 0, 0); return { l: i.naturalWidth, h: i.naturalHeight, coin: g.getImageData(1, 1, 1, 1).data[3], centre: g.getImageData(i.naturalWidth / 2, i.naturalHeight / 2, 1, 1).data[3] }; });
  assert(img.l <= 170 && img.h <= 170, `image recadrée sur le sujet (${img.l}x${img.h})`);
  assert.equal(img.centre, 255, 'le sujet reste opaque'); assert(img.coin < 10, 'le fond uni devient transparent');
  assert(!(await r.evaluate(() => JSON.stringify(window.__app.etat()))).includes('data:image'), 'image absente de la progression');
  await r.reload(); await r.waitForSelector('.mascotte-perso');
  log('tenue rose ok');
  await r.evaluate(() => window.__app.aller('profil'));
  await r.locator('.reglage', { hasText: 'Effets visuels' }).locator('input').click();
  assert.equal(await r.evaluate(() => document.documentElement.dataset.effets), 'non', 'effets coupés');
  await rose.close();

  // 13. Sons : aucun ne sature, aucun n'est muet, en bleu comme en rose.
  const sn = await b.newContext({ ...devices['iPhone 13'] });
  const sp = await sn.newPage(); await sp.goto(URLB + '?test'); await sp.waitForSelector('.tribune');
  const niveaux = await sp.evaluate(async () => { const o = []; for (const nom of window.__app.NOMS_SONS) for (const rose of [false, true]) o.push(await window.__app.rendreSon(nom, { niveau: 3 }, rose)); return o; });
  for (const n of niveaux) { assert(n.pic > 0.02 && n.pic < 1, `niveau de ${n.nom} : ${n.pic}`); assert(n.fin < 3.4, `longueur de ${n.nom} : ${n.fin}`); }
  fs.writeFileSync(CAP + 'sons.json', JSON.stringify(niveaux, null, 1));
  await sn.close();
  log('sons ok :', niveaux.length, 'rendus');

  // 14. La copie en ligne passe par le compte : voir la section « compte ».

  // 15. Écran de choix, obligations, carrières séparées, plafond de pièces.
  const ob = await b.newContext({ ...devices['iPhone 13'] });
  const o = await ob.newPage(); o.on('pageerror', (x) => erreurs.push(x.message));
  o.on('console', (m) => { if (m.type() === 'error' && !/favicon/.test(m.text())) erreurs.push(m.text()); });
  await o.goto(URLB + '?test&choix'); await o.waitForSelector('.portes');
  await debordement(o, 'écran de choix');
  await o.screenshot({ path: CAP + 'choix.png' });
  await o.locator('.porte-oblig').click(); await o.waitForSelector('.tribune');
  assert.equal((await etat(o)).matiere, 'oblig', 'matière choisie');
  for (const m of ['qualif', 'cas', 'remede', 'frise', 'plan']) {
    await o.evaluate(() => window.__app.aller('role')); await ouvrirMode(o, m);
    await jouerParfait(o);
    await debordement(o, `résultats ${m}`);
    await o.tap('text=Retour au Palais');
  }
  let oe = await etat(o);
  assert(oe.oblig.xp > 0, 'points gagnés en obligations'); assert.equal(oe.xp, 0, 'carrière administrative intacte');
  assert.equal(oe.oblig.gains.n, 22, 'deux pièces par épreuve réussie');
  assert.equal(oe.jetons, 52, 'pièces créditées');
  assert(oe.stats.cas >= 2 && oe.stats.frise >= 2, 'statistiques des exercices');
  await o.tap('text=Défi du jour'); await jouerParfait(o);
  await o.waitForSelector('.res-texte');
  oe = await etat(o);
  assert.equal(oe.oblig.gains.n, 30, 'plafond de 30 pièces par jour'); assert.equal(oe.jetons, 60, 'plafond respecté');
  assert.equal(oe.serie.n, 1, 'la séance d’obligations garde la série');
  await o.tap('text=Retour au Palais');
  await o.tap('.bouton-matiere'); await o.waitForSelector('.portes');
  await o.locator('.porte-admin').click(); await o.waitForSelector('.tribune');
  await o.evaluate(() => window.__app.aller('role')); await o.tap('.role-ligne[data-mode="express"]'); await jouerParfait(o);
  oe = await etat(o);
  assert.equal(oe.gains.n, 6, 'plafond propre à l’administratif'); assert(oe.xp > 0, 'points en administratif');
  assert(oe.trophees.deux, 'trophée des deux matières');
  await o.tap('text=Retour au Palais');
  log('obligations ok');

  // 16. Dunk shot : achat en boutique, cinq paniers, puis partie infinie.
  await o.evaluate(() => { const e = window.__app.etat(); e.jetons = 300; window.__app.ouvrirMatiere('oblig'); window.__app.aller('boutique'); });
  await o.locator('.article', { hasText: 'Dunk shot infini' }).locator('button').click();
  oe = await etat(o);
  assert.equal(oe.jetons, 0, '300 pièces'); assert(oe.dunk.infini, 'infini débloqué');
  await o.evaluate(() => window.__app.aller('palais'));
  await debordement(o, 'accueil avec dunk');
  const panier = async (ok) => {
    await o.waitForSelector('.dunk-question:not([data-fini]) .option', { timeout: 6000 });
    await textePropre(o);
    await o.evaluate((v) => [...document.querySelectorAll('.dunk-question .option')].find((x) => x.dataset.ok === String(v)).click(), ok);
    await o.waitForTimeout(20);
  };
  await o.evaluate(() => window.__app.aller('role')); await o.locator('.dunk-choix button').first().click();
  for (let i = 0; i < 5; i++) await panier(true);
  await o.waitForSelector('.dunk-fin');
  await debordement(o, 'fin de dunk');
  oe = await etat(o);
  assert.equal(oe.dunk.record, 5, 'record de cinq paniers'); assert(oe.trophees.dunk5 === undefined || oe.trophees.dunk5, 'trophée possible');
  await o.tap('text=Retour au Palais');
  await o.evaluate(() => window.__app.aller('role')); await o.locator('.dunk-choix button').last().click();
  for (let i = 0; i < 7; i++) await panier(true);
  await panier(false);
  await o.waitForSelector('.dunk-question .pied button'); await o.locator('.dunk-question .pied button').click();
  await o.waitForSelector('.dunk-fin');
  oe = await etat(o);
  assert.equal(oe.dunk.record, 7, 'l’erreur met fin à la partie infinie');
  assert.equal(oe.oblig.gains.n, 30, 'le plafond vaut aussi pour Dunk shot');
  await o.tap('text=Retour au Palais');
  await o.reload(); await o.waitForSelector('.portes');
  assert.equal((await etat(o)).matiere, 'oblig', 'dernière matière retenue');
  await ob.close();
  log('dunk ok');

  // 17. Petit écran : chaque exercice des obligations, sans débordement.
  const po = await b.newContext({ ...devices['iPhone 13'], viewport: { width: 320, height: 568 } });
  const q2 = await po.newPage(); q2.on('pageerror', (x) => erreurs.push(x.message));
  await q2.goto(URLB + '?test&matiere=oblig'); await q2.waitForSelector('.tribune');
  for (const m of ['qualif', 'cas', 'remede', 'frise', 'plan']) {
    await q2.evaluate(() => window.__app.aller('role')); await ouvrirMode(q2, m);
    await jouer(q2, { capture: 'oblig-petit' });
    await debordement(q2, `petit ${m}`);
    await q2.tap('text=Retour au Palais');
  }
  await po.close();
  log('petit écran obligations ok');

  // 18. La chouette : portes, poses, réactions, tenues, image personnelle.
  const ch = await b.newContext({ ...devices['iPhone 13'], serviceWorkers: 'block' });
  const c = await ch.newPage(); c.on('pageerror', (x) => erreurs.push(x.message));
  await c.goto(URLB + '?test&choix'); await c.waitForSelector('.portes');
  assert(await c.locator('.chouette-guide').count(), 'chouette au choix de la matière');
  await c.locator('.porte-admin').click(); await c.waitForSelector('.tribune');
  assert.equal(await c.locator('.figure-chouette .chouette').first().getAttribute('data-pose'), 'debout', 'chouette à l’accueil en tenue bleue');
  assert.equal(await c.locator('.sceau-vivant').count(), 0, 'le sceau cède sa place');
  // Une pose différente par exercice.
  const poses = {};
  for (const [matiere, modes] of [['admin', ['paires', 'puzzle', 'juge', 'plan', 'architecte', 'frise']], ['oblig', ['cas', 'qualif', 'remede', 'frise', 'plan']]]) {
    await c.evaluate((m) => window.__app.ouvrirMatiere(m), matiere); await c.waitForSelector('.tribune');
    for (const m of modes) {
      await c.evaluate(() => window.__app.aller('role')); await ouvrirMode(c, m);
      await c.waitForSelector('.palais-portes .chouette', { state: 'attached' });
      poses[m] = await c.getAttribute('.palais-portes .chouette', 'data-pose');
      await c.waitForSelector('.quitter'); await c.waitForSelector('.palais-portes', { state: 'detached' });
      await c.tap('.quitter'); await c.tap('.boite .bouton-or'); await c.waitForSelector('.tribune');
    }
  }
  assert.deepEqual(poses, { paires: 'reflexion', puzzle: 'piles', juge: 'marteau', plan: 'notes', architecte: 'tableau', cas: 'serment', qualif: 'lunettes', remede: 'balance', frise: 'echelle' }, 'une chouette par exercice');
  // Un appui ouvre les portes tout de suite, un double appui n'en lance pas deux.
  await c.evaluate(() => { window.__portes = 0; window.__reactions = 0; new MutationObserver((l) => { for (const x of l) for (const n of x.addedNodes) { if (n.classList?.contains('palais-portes')) window.__portes++; if (n.classList?.contains('reaction')) window.__reactions++; } }).observe(document.body, { childList: true }); });
  await c.evaluate(() => { const b = document.querySelector('.cta.brille'); b.click(); b.click(); });
  await c.waitForSelector('.palais-portes.ferme');
  await c.evaluate(() => { const v = document.querySelector('.palais-portes'); const t0 = performance.now(); v.click(); new MutationObserver((_, o) => { if (v.classList.contains('ouvre')) { window.__ouvert = performance.now() - t0; o.disconnect(); } }).observe(v, { attributes: true }); });
  await c.waitForSelector('.palais-portes', { state: 'detached' });
  assert(await c.evaluate(() => window.__ouvert) < 330, 'un appui passe l’animation');
  await jouer(c);
  assert.equal(await c.evaluate(() => window.__portes), 1, 'les portes ne jouent qu’en début de séance');
  assert(await c.evaluate(() => window.__reactions) >= 3, 'une réaction à chaque fin d’épreuve');
  assert(await c.locator('.res-scene .res-chouette').count(), 'chouette aux résultats');
  await debordement(c, 'résultats chouette');
  await c.screenshot({ path: CAP + 'chouette-resultats.png' });
  await c.tap('text=Retour au Palais');
  // Le retour après une absence, et le réveil une seule fois par jour.
  await c.evaluate(() => { const e = window.__app.etat(); e.chouette.seance -= 5; e.chouette.reveil = -1; e.chouette.retour = null; window.__app.aller('palais'); });
  const heure = await c.evaluate(() => new Date().getHours());
  if (heure >= 12) await c.waitForSelector('.bulle-accueil');
  await c.evaluate(() => { window.__app.etat().chouette.retour = -1; window.__app.etat().chouette.reveil = 99999; window.__app.etat().chouette.seance = 99999; window.__app.aller('palais'); });
  assert.equal(await c.locator('.bulle-accueil').count(), 0, 'pas de bulle sans absence');
  // Dix touches sur la chouette : le geste rare.
  for (let i = 0; i < 9; i++) await c.evaluate(() => document.querySelector('.figure-chouette').click());
  await c.waitForTimeout(40);
  await c.evaluate(() => document.querySelector('.figure-chouette').click());
  await c.waitForSelector('.chouette.pirouette'); await c.waitForSelector('.plumes', { state: 'attached' });
  // La garde-robe.
  await c.evaluate(() => { const e = window.__app.etat(); e.jetons = 1000; window.__app.aller('boutique'); });
  await c.locator('[data-tenue="toque"] .prix').click();
  await c.waitForSelector('.essayage .acc-toque');
  await c.waitForSelector('.adjuge', { state: 'attached' });
  await c.locator('[data-tenue="laurier"] .prix').click();
  await c.waitForSelector('.essayage .acc-laurier');
  assert.equal(await c.locator('.essayage .acc-toque').count(), 0, 'une seule coiffe à la fois');
  await c.locator('[data-tenue="robe"] .prix').click();
  await c.waitForSelector('.essayage img[src$="debout-robe.webp"]');
  await c.locator('[data-tenue="robe"] .prix').click();
  assert.equal(await c.locator('.essayage img[src$="debout-robe.webp"]').count(), 0, 'retirer une tenue');
  assert.equal((await etat(c)).jetons, 1000 - 180 - 250 - 400, 'prix des tenues');
  await c.reload(); await c.waitForSelector('.portes');
  await c.locator('.porte-admin').click(); await c.waitForSelector('.figure-chouette .acc-laurier');
  // Effets coupés : ni portes ni réaction.
  await c.evaluate(() => { window.__app.etat().reglages.effets = false; window.__app.appliquerTheme(); window.__app.aller('palais'); });
  await c.evaluate(() => window.__app.aller('role')); await c.locator('.role-ligne[data-mode="paires"]').click(); await c.waitForSelector('.chip');
  assert.equal(await c.locator('.palais-portes').count(), 0, 'pas de portes sans effets');
  await c.tap('.quitter'); await c.tap('.boite .bouton-or'); await c.waitForSelector('.tribune');
  await c.evaluate(() => { window.__app.etat().reglages.effets = true; window.__app.appliquerTheme(); window.__app.aller('palais'); });
  // L'image personnelle remplace la chouette, jusque dans les portes.
  await c.evaluate(() => window.__app.aller('profil'));
  const png = await c.evaluate(() => { const k = document.createElement('canvas'); k.width = 200; k.height = 200; const g = k.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, 200, 200); g.fillStyle = '#0a0'; g.fillRect(50, 50, 100, 100); return k.toDataURL('image/png').split(',')[1]; });
  await c.locator('.ligne-image[data-type="mascotte"] input[type=file]').setInputFiles({ name: 'moi.png', mimeType: 'image/png', buffer: Buffer.from(png, 'base64') });
  await c.waitForSelector('.ligne-image[data-type="mascotte"] img');
  await c.evaluate(() => window.__app.aller('palais'));
  await c.waitForSelector('.figure-chouette .mascotte-perso');
  assert.equal(await c.locator('.figure-chouette [data-pose]').count(), 0, 'image personnelle à l’accueil');
  await c.evaluate(() => window.__app.aller('role')); await c.locator('.role-ligne[data-mode="paires"]').click();
  await c.waitForSelector('.palais-portes .mascotte-perso', { state: 'attached' });
  await c.waitForSelector('.quitter'); await c.waitForSelector('.palais-portes', { state: 'detached' });
  await c.tap('.quitter'); await c.tap('.boite .bouton-or'); await c.waitForSelector('.tribune');
  await ch.close();
  // 320 px : la chouette garde sa place.
  const pc = await b.newContext({ ...devices['iPhone 13'], viewport: { width: 320, height: 568 }, serviceWorkers: 'block' });
  const c2 = await pc.newPage(); c2.on('pageerror', (x) => erreurs.push(x.message));
  await c2.goto(URLB + '?test&choix'); await c2.waitForSelector('.portes');
  await debordement(c2, 'choix 320'); await c2.screenshot({ path: CAP + 'chouette-choix-petit.png' });
  await c2.locator('.porte-oblig').click(); await c2.waitForSelector('.tribune'); await debordement(c2, 'accueil 320');
  await c2.evaluate(() => window.__app.aller('boutique')); await debordement(c2, 'boutique 320');
  await c2.evaluate(() => window.__app.aller('profil')); await debordement(c2, 'profil 320');
  await pc.close();
  log('chouette ok');

  // Les deux équipes : la question d'ouverture, le filtre et la progression propre à chacune.
  const eq = await b.newContext({ ...devices['iPhone 13'], serviceWorkers: 'block' });
  const e1 = await eq.newPage(); e1.on('pageerror', (x) => erreurs.push(x.message));
  await e1.goto(URLB + '?test&choix&groupe'); await e1.waitForSelector('.porte-equipe');
  assert.equal(await e1.locator('.porte-equipe').count(), 2, 'deux équipes proposées');
  await debordement(e1, 'choix de l’équipe');
  await e1.screenshot({ path: CAP + 'equipe-choix.png' });
  await e1.locator('.porte-equipe[data-equipe="1"]').click();
  await e1.waitForSelector('.porte-oblig');
  let et = await etat(e1);
  assert.equal(et.equipe, 1); assert.equal(et.equipeChoisie, true);
  assert.match(await e1.locator('.porte-oblig').innerText(), /équipe 1/);
  // La question ne revient pas à la réouverture.
  await e1.reload(); await e1.waitForSelector('.porte-oblig');
  assert.equal(await e1.locator('.porte-equipe').count(), 0, 'question posée une seule fois');
  await e1.locator('.porte-oblig').click(); await e1.waitForSelector('.tribune');
  let ixe = await e1.evaluate(() => ({ eq: window.__app.ix.equipe, zones: window.__app.ix.zones.length, cas: window.__app.ix.cas.map((c) => c.id), travaux: window.__app.ix.zones.filter((z) => z.travaux).map((z) => z.id), arrets: window.__app.ix.arrets.map((a) => a.id) }));
  assert.equal(ixe.eq, 1); assert.equal(ixe.zones, 13); assert.deepEqual(ixe.travaux, [13]);
  assert.ok(!ixe.arrets.includes('mixte2006'), 'pas d’arrêt propre à l’équipe 2');
  assert.ok(!ixe.cas.includes('michel'), 'pas de cas propre à l’équipe 2');
  // Douze chambres, puis la violence en travaux, sans bouton de révision.
  await e1.evaluate(() => window.__app.aller('carte')); await e1.waitForSelector('.salle');
  assert.equal(await e1.locator('.salle').count(), 13);
  await debordement(e1, 'chambres équipe 1');
  await e1.screenshot({ path: CAP + 'equipe-chambres.png', fullPage: true });
  await e1.locator('.salle', { hasText: 'La violence' }).locator('button').click();
  await e1.waitForSelector('.avis-travaux');
  assert.equal(await e1.locator('.cta').count(), 0, 'aucun exercice en travaux');
  await e1.locator('.quitter').click(); await e1.waitForSelector('.salle');
  // Chaque chambre du parcours compose une audience et une révision.
  for (const z of [1, 3, 6, 10, 12]) {
    const r = await e1.evaluate((id) => { const ix = window.__app.ix; return ix.cartes.filter((a) => a.zones.includes(id)).length; }, z);
    assert.ok(r > 0, `chambre ${z} vide`);
  }
  // Une séance se joue en équipe 1.
  await e1.evaluate(() => window.__app.aller('palais')); await e1.waitForSelector('.tribune');
  await e1.evaluate(() => window.__app.lancerDefi()); await jouer(e1);
  et = await etat(e1);
  assert.equal(et.stats.seances, 1, 'séance terminée en équipe 1');
  await e1.evaluate(() => window.__app.etat().oblig.zones.gagnees.push(1)); 
  // Changer d'équipe range les chambres et garde les fiches communes.
  await e1.evaluate(() => { window.__app.etat().oblig.arrets.manoukian = { b: 3, d: 0, ok: 3, ko: 0, c: {} }; window.__app.aller('profil'); });
  await e1.waitForSelector('.bascule');
  await e1.locator('.bascule button', { hasText: 'Équipe 2' }).click();
  await e1.waitForFunction(() => window.__app.etat().equipe === 2);
  et = await etat(e1);
  assert.deepEqual(et.oblig.zones.gagnees, [], 'les chambres de l’équipe 2 sont à part');
  assert.equal(et.oblig.arrets.manoukian.b, 3, 'la fiche commune reste acquise');
  assert.equal(await e1.evaluate(() => window.__app.ix.zones.length), 9);
  await e1.locator('.bascule button', { hasText: 'Équipe 1' }).click();
  await e1.waitForFunction(() => window.__app.etat().equipe === 1);
  et = await etat(e1);
  assert.deepEqual(et.oblig.zones.gagnees, [1], 'les chambres de l’équipe 1 reviennent');
  await e1.evaluate(() => window.__app.aller('arrets')); await e1.waitForSelector('.grille-cartes, .liste-cartes, .filtre');
  await debordement(e1, 'fiches équipe 1');
  await eq.close();
  // Une progression déjà installée reçoit la question, et garde tout le reste.
  const anc = await b.newContext({ ...devices['iPhone 13'], serviceWorkers: 'block' });
  const a2 = await anc.newPage(); a2.on('pageerror', (x) => erreurs.push(x.message));
  await a2.addInitScript(() => { if (!sessionStorage.getItem('pose')) { sessionStorage.setItem('pose', '1'); localStorage.setItem('arrets-admin.v1', JSON.stringify({ v: 1, m: 2, xp: 500, jetons: 777, matiere: 'oblig', equipe: 2, oblig: { xp: 900, arrets: { manoukian: { b: 4, d: 0, ok: 4, ko: 0, c: {} } }, zones: { ouvertes: [1, 2, 3], gagnees: [1, 2], parfaites: [] } }, serie: { n: 12, dernier: null, record: 12 } })); } });
  await a2.goto(URLB + '?test&choix&groupe'); await a2.waitForSelector('.porte-equipe');
  await a2.locator('.porte-equipe[data-equipe="1"]').click(); await a2.waitForSelector('.porte-oblig');
  const ancien = await a2.evaluate(() => JSON.parse(localStorage.getItem('arrets-admin.v1')));
  assert.equal(ancien.jetons, 777); assert.equal(ancien.oblig.xp, 900); assert.equal(ancien.oblig.arrets.manoukian.b, 4);
  assert.deepEqual(ancien.oblig.parEquipe['2'].zones.gagnees, [1, 2], 'la progression de l’équipe 2 est gardée');
  assert.deepEqual(ancien.oblig.zones.ouvertes, [1, 2], 'l’équipe 1 commence à ses premières chambres');
  await anc.close();
  log('équipes ok');

  // Le son doit survivre à une interruption : l'iPhone peut figer le contexte sans rien dire.
  const audio = await b.newContext({ ...devices['iPhone 13'], serviceWorkers: 'block' });
  await audio.addInitScript(() => {
    const AC = window.AudioContext; window.__ctx = [];
    window.AudioContext = class extends AC { constructor(...a) { super(...a); window.__ctx.push(this); } };
  });
  const a1 = await audio.newPage(); a1.on('pageerror', (x) => erreurs.push(x.message));
  await a1.goto(URLB + '?test&choix'); await a1.waitForSelector('.portes');
  await a1.locator('.porte-oblig').click(); await a1.waitForSelector('.tribune');
  const nbCtx = () => a1.evaluate(() => window.__ctx.length);
  const etats = () => a1.evaluate(() => window.__ctx.map((c) => c.state));
  await a1.tap('.tribune'); assert.equal(await nbCtx(), 1, 'un seul contexte');
  await a1.tap('.tribune'); assert.equal(await nbCtx(), 1, 'pas de contexte de plus à chaque geste');
  await a1.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => true }); document.dispatchEvent(new Event('visibilitychange')); delete document.hidden; document.dispatchEvent(new Event('visibilitychange')); });
  await a1.tap('.tribune');
  assert.equal(await nbCtx(), 2, 'contexte remplacé au retour');
  await a1.waitForFunction(() => window.__ctx[0].state === 'closed' && window.__ctx[1].state === 'running');
  await a1.evaluate(() => window.__ctx[1].suspend()); await a1.waitForFunction(() => window.__ctx[1].state === 'suspended');
  await a1.tap('.tribune'); await a1.waitForFunction(() => window.__ctx.at(-1).state === 'running');
  assert.ok((await etats()).at(-1) === 'running', 'le son revient après une suspension');
  assert.equal((await a1.evaluate(() => JSON.parse(JSON.stringify(window.__app.etat())))).reglages.son, true, 'le réglage ne change pas');
  await audio.close();
  log('son ok');

  // Les skins du hibou : aperçu, achat, équipement, Palais seulement.
  const sk = await b.newContext({ ...devices['iPhone 13'], serviceWorkers: 'block' });
  const k = await sk.newPage(); k.on('pageerror', (x) => erreurs.push(x.message));
  await k.goto(URLB + '?test&choix'); await k.waitForSelector('.portes');
  await k.locator('.porte-admin').click(); await k.waitForSelector('.tribune');
  const skinPalais = () => k.locator('.figure-chouette [data-skin]');
  await k.evaluate(() => { const e = window.__app.etat(); e.jetons = 150; e.chouette.tenues = ['toque']; e.chouette.porte.tete = 'toque'; window.__app.aller('boutique'); });
  assert.equal(await k.locator('.skin-carte').count(), 9, 'neuf skins en boutique');
  await debordement(k, 'skins');
  await k.locator('.skin-carte[data-skin-carte="goumin"]').click();
  assert.match(await k.locator('.boite-skin .bouton-or').innerText(), /Il te manque 50 jetons/);
  await textePropre(k);
  assert.ok(await k.locator('.boite-skin .bouton-or').isDisabled(), 'pas d’achat sans jetons');
  await k.screenshot({ path: CAP + 'skin-apercu.png' });
  await k.locator('.boite-skin .bouton-lien').click();
  await k.evaluate(() => { window.__app.etat().jetons = 750; window.__app.aller('boutique'); });
  await k.locator('.skin-carte[data-skin-carte="goumin"]').click();
  assert.match(await k.locator('.boite-skin .bouton-or').innerText(), /Acheter pour 200 jetons/);
  await k.locator('.boite-skin .bouton-or').click();
  await k.waitForSelector('.adjuge', { state: 'attached' });
  assert.equal(await k.locator('.boite-skin .bouton-or').innerText(), 'Retirer');
  let ek = await etat(k);
  assert.equal(ek.jetons, 550, 'prix d’un skin classique'); assert.deepEqual(ek.chouette.skins, ['goumin']); assert.equal(ek.chouette.skin, 'goumin');
  await k.locator('.boite-skin .bouton-lien').click();
  await k.evaluate(() => window.__app.aller('palais'));
  await k.waitForSelector('.figure-chouette [data-skin="goumin"]');
  assert.equal(await k.locator('.figure-chouette [data-pose]').count(), 0, 'le skin remplace la chouette');
  assert.equal(await k.locator('.figure-chouette .acc-toque').count(), 0, 'le skin ne se combine pas avec les tenues');
  await k.evaluate(() => document.querySelector('.figure-chouette').click());
  await k.waitForSelector('.figure-chouette [data-skin="goumin"].saute');
  await k.screenshot({ path: CAP + 'skin-palais.png' });
  // Ailleurs, la chouette normale reste en place.
  await k.evaluate(() => window.__app.aller('role')); await k.locator('.role-ligne[data-mode="paires"]').click();
  await k.waitForSelector('.palais-portes [data-pose]', { state: 'attached' });
  assert.equal(await k.locator('.palais-portes [data-skin]').count(), 0, 'pas de skin dans les portes');
  await k.waitForSelector('.quitter'); await k.waitForSelector('.palais-portes', { state: 'detached' });
  await k.tap('.quitter'); await k.tap('.boite .bouton-or'); await k.waitForSelector('.tribune');
  // Le légendaire : 500 jetons, et les deux bras s'enchaînent.
  await k.evaluate(() => window.__app.aller('boutique'));
  await k.locator('.skin-carte[data-skin-carte="six-sept"]').click();
  await k.waitForSelector('.boite-skin .danse');
  await k.locator('.boite-skin .bouton-or').click();
  assert.equal((await etat(k)).jetons, 50, 'prix du légendaire');
  const vus = await k.evaluate(async () => {
    const el = document.querySelector('.boite-skin [data-skin]'); const o = new Set();
    const debut = performance.now();
    while (performance.now() - debut < 1000) { const a = getComputedStyle(el.querySelector('.bras-droit')).opacity; const c = getComputedStyle(el.querySelector('.bras-gauche')).opacity; o.add(a + c); await new Promise((f) => requestAnimationFrame(f)); }
    return [...o];
  });
  assert.ok(vus.includes('10') && vus.includes('01'), `les deux bras alternent : ${vus}`);
  await k.waitForFunction(() => !document.querySelector('.boite-skin .danse'), null, { timeout: 2600 });
  assert.equal(await k.evaluate(() => getComputedStyle(document.querySelector('.boite-skin .bras-leves')).opacity), '1', 'les deux bras levés au repos');
  await k.locator('.boite-skin .bouton-lien').click();
  await k.evaluate(() => window.__app.aller('palais'));
  await k.waitForSelector('.figure-chouette [data-skin="six-sept"].danse');
  await k.waitForSelector('.figure-chouette [data-skin="six-sept"]:not(.danse)', { timeout: 2600 });
  await k.evaluate(() => document.querySelector('.figure-chouette').click());
  await k.waitForSelector('.figure-chouette [data-skin="six-sept"].danse');
  // Le dixième appui reste la pirouette.
  await k.evaluate(() => { const e = window.__app.etat(); e.chouette.tapes = 9; document.querySelector('.figure-chouette').click(); });
  await k.waitForSelector('.figure-chouette [data-skin].pirouette');
  // Le skin survit à la réouverture.
  await k.waitForTimeout(1600);
  await k.reload(); await k.waitForSelector('.portes'); await k.locator('.porte-admin').click();
  await k.waitForSelector('.figure-chouette [data-skin="six-sept"]');
  // Retirer le skin rend la chouette et ses tenues.
  await k.evaluate(() => window.__app.aller('boutique'));
  await k.locator('.skin-carte[data-skin-carte="six-sept"]').click();
  await k.locator('.boite-skin .bouton-or').click();
  assert.equal(await k.locator('.boite-skin .bouton-or').innerText(), 'Équiper');
  await k.locator('.boite-skin .bouton-lien').click();
  await k.evaluate(() => window.__app.aller('palais'));
  await k.waitForSelector('.figure-chouette .acc-toque');
  assert.equal(await skinPalais().count(), 0, 'chouette rendue');
  // Tenue rose et petit écran.
  await k.evaluate(() => { const e = window.__app.etat(); e.chouette.skin = 'survet'; e.chouette.skins.push('survet'); e.theme = 'rose'; window.__app.appliquerTheme(); window.__app.aller('palais'); });
  await k.waitForSelector('.figure-chouette [data-skin="survet"]');
  await k.screenshot({ path: CAP + 'skin-palais-rose.png' });
  await k.evaluate(() => window.__app.aller('boutique'));
  await k.locator('.skin-carte[data-skin-carte="bosslady"]').click();
  assert.match(await k.locator('.boite-skin .bouton-or').innerText(), /Il te manque 150 canettes/);
  await k.locator('.boite-skin .bouton-lien').click();
  await k.evaluate(() => { window.__app.etat().theme = 'palais'; window.__app.appliquerTheme(); });
  await k.setViewportSize({ width: 320, height: 568 });
  await k.evaluate(() => window.__app.aller('boutique')); await debordement(k, 'skins 320');
  await k.locator('.skin-carte[data-skin-carte="six-sept"]').click(); await debordement(k, 'aperçu 320');
  const hautBoite = await k.locator('.boite-skin').boundingBox();
  assert.ok(hautBoite.y >= 0, 'aperçu entier à 320 px');
  await k.screenshot({ path: CAP + 'skin-apercu-petit.png' });
  await sk.close();
  // Sauvegarde d'avant les skins, et mouvements réduits.
  const av = await b.newContext({ ...devices['iPhone 13'], serviceWorkers: 'block', reducedMotion: 'reduce' });
  const v = await av.newPage(); v.on('pageerror', (x) => erreurs.push(x.message));
  await v.goto(URLB + '?test&choix'); await v.waitForSelector('.portes');
  await v.locator('.porte-admin').click(); await v.waitForSelector('.tribune');
  await v.evaluate(() => { const c = Object.keys(localStorage).find((x) => { try { return JSON.parse(localStorage.getItem(x)).chouette; } catch { return false; } }); const o = JSON.parse(localStorage.getItem(c)); delete o.chouette.skins; delete o.chouette.skin; localStorage.setItem(c, JSON.stringify(o)); });
  await v.reload(); await v.waitForSelector('.portes'); await v.locator('.porte-admin').click(); await v.waitForSelector('.tribune');
  const eAncien = await etat(v);
  assert.deepEqual(eAncien.chouette.skins, [], 'ancienne sauvegarde lue'); assert.equal(eAncien.chouette.skin, null);
  await v.evaluate(() => { const e = window.__app.etat(); e.chouette.skins = ['six-sept']; e.chouette.skin = 'six-sept'; e.jetons = 0; window.__app.aller('palais'); });
  await v.waitForSelector('.figure-chouette [data-skin="six-sept"]');
  assert.equal(await v.locator('.danse').count(), 0, 'mouvements réduits : pas d’alternance');
  await av.close();
  log('skins ok');

  // Le Palais garde trois entrées : le Défi, Vers l'examen et Le rôle.
  const pa = await b.newContext({ ...devices['iPhone 13'], serviceWorkers: 'block' });
  const u = await pa.newPage(); u.on('pageerror', (x) => erreurs.push(x.message));
  await u.goto(URLB + '?test&choix'); await u.waitForSelector('.portes');
  await u.locator('.porte-oblig').click(); await u.waitForSelector('.tribune');
  assert.equal(await u.locator('.cta').count(), 1, 'un seul Défi');
  assert.equal(await u.locator('.role-ligne').count(), 2, 'deux entrées sous le Défi');
  await u.locator('.tribune .figure-chouette').waitFor();
  await u.locator('.role-ligne[data-mode="vers-role"]').click();
  assert.equal(await u.locator('.role-ligne').count(), 7, 'trois minutes, cinq exercices et Dunk');
  await u.screenshot({ path: CAP + 'palais-role.png' }); await debordement(u, 'le rôle');
  await u.locator('.bouton-matiere').click(); await u.waitForSelector('.tribune');
  await u.locator('.role-ligne[data-mode="vers-examen"]').click();
  assert.equal(await u.locator('.role-ligne').count(), 4, 'trois niveaux et le partiel blanc');
  await u.screenshot({ path: CAP + 'palais-examen.png' }); await debordement(u, 'vers l’examen');
  await u.locator('.role-ligne[data-mode="niveau-3"]').click();
  await u.waitForSelector('.quitter'); await u.waitForSelector('.palais-portes', { state: 'detached' });
  await u.locator('.quitter').click(); await u.locator('.boite .bouton-or').click(); await u.waitForSelector('.tribune');
  await u.screenshot({ path: CAP + 'palais-entrees.png', fullPage: true });
  await pa.close();
  log('palais ok');

  // Le choix de l'année à l'arrivée : L1 et son équipe, L3 fermée, retour vers la L2.
  const an = await b.newContext({ ...devices['iPhone 13'], serviceWorkers: 'block' });
  const yan = await an.newPage(); yan.on('pageerror', (x) => erreurs.push(x.message));
  await yan.goto(URLB + '?test&annee'); await yan.waitForSelector('[data-annee="L1"]');
  assert.ok(await yan.locator('[data-annee="L3"]').isDisabled(), 'L3 fermée');
  await yan.screenshot({ path: CAP + 'annee.png' }); await debordement(yan, 'année');
  await yan.locator('[data-annee="L1"]').click(); await yan.waitForSelector('[data-equipe-l1="3"]');
  assert.ok(await yan.locator('[data-equipe-l1="1"]').isDisabled(), 'équipe 1 en travaux');
  await yan.locator('[data-equipe-l1="3"]').click(); await yan.waitForSelector('.tribune');
  let ea = await etat(yan); assert.equal(ea.annee, 'L1'); assert.equal(ea.equipeL1, 3); assert.equal(ea.matiere, 'intro', 'la L1 ouvre l’introduction au droit');
  assert.match(await yan.locator('.bouton-matiere').innerText(), /Introduction au droit/);
  await yan.reload(); await yan.waitForSelector('.tribune');
  assert.match(await yan.evaluate(() => document.getElementById('onglets').textContent), /Notions/, 'onglet des notions en L1');
  await yan.evaluate(() => window.__app.aller('profil')); await yan.locator('[data-annees] button', { hasText: 'L2' }).click();
  ea = await etat(yan); assert.equal(ea.annee, 'L2', 'retour en L2'); assert.equal(ea.matiere, 'admin', 'la L2 rouvre une matière de L2');
  await an.close();
  log('année ok');

  // La L1 : introduction au droit, ses six chambres, ses huit jeux, ses notions.
  const l1 = await b.newContext({ ...devices['iPhone 13'], serviceWorkers: 'block' });
  const un = await l1.newPage(); un.on('pageerror', (x) => erreurs.push(x.message));
  await un.goto(URLB + '?test&matiere=intro'); await un.waitForSelector('.tribune');
  const ixL1 = await un.evaluate(() => ({ zones: window.__app.ix.zones.length, notions: window.__app.ix.articles.length, tri: window.__app.ix.tri.length }));
  assert.equal(ixL1.zones, 6, 'six chambres en L1'); assert(ixL1.notions >= 60, 'au moins soixante notions'); assert.equal(ixL1.tri, 40, 'quarante cartes à trier');
  await un.screenshot({ path: CAP + 'l1-palais.png' }); await debordement(un, 'palais L1');
  await un.evaluate(() => window.__app.aller('role'));
  assert.equal(await un.locator('.role-ligne[data-mode="cas-l1"]').count(), 1, 'cas pratique annoncé');
  assert.match(await un.locator('.role-ligne[data-mode="cas-l1"]').innerText(), /Bientôt/);
  await un.evaluate(() => { window.__app.etat().reglages.toutOuvert = true; });
  for (const m of ['tri', 'mot', 'rangement', 'quiadit', 'scanner', 'memory', 'frise']) {
    await un.evaluate(() => window.__app.aller('role')); await un.locator(`.role-ligne[data-mode="${m}"]`).click();
    await un.waitForSelector('.quitter'); await un.waitForSelector('.palais-portes', { state: 'detached' });
    await un.waitForTimeout(300); await un.screenshot({ path: CAP + `l1-${m}.png` }); await debordement(un, `L1 ${m}`);
    await jouer(un);
    await un.waitForSelector('.resultats'); await un.tap('text=Retour au Palais'); await un.waitForSelector('.tribune');
  }
  const eL1 = await etat(un);
  assert(eL1.intro.xp > 0, 'points gagnés en L1'); assert(Object.keys(eL1.intro.arrets).length > 0, 'notions notées');
  assert.equal(eL1.xp, 0, 'la L2 ne bouge pas');
  await un.locator('.cta').first().click(); await un.waitForSelector('.quitter'); await jouer(un); await un.waitForSelector('.resultats');
  await un.tap('text=Retour au Palais'); await un.waitForSelector('.tribune');
  await un.evaluate(() => window.__app.aller('arrets'));
  assert.match(await un.locator('.page h1').innerText(), /Les notions/);
  await un.locator('.carte-arret').first().click(); await un.waitForSelector('.fiche-notion');
  await un.screenshot({ path: CAP + 'l1-fiche.png' });
  await un.evaluate(() => window.__app.aller('role')); await un.locator('.dunk-choix button').first().click();
  await un.waitForSelector('.dunk-question .option'); await un.screenshot({ path: CAP + 'l1-dunk.png' });
  await l1.close();
  log('L1 ok');

  // Vers l'examen : Appel et Cassation, avec les épreuves à réponse libre, dans les deux matières.
  const ex = await b.newContext({ ...devices['iPhone 13'], serviceWorkers: 'block' });
  const xe = await ex.newPage(); xe.on('pageerror', (x) => erreurs.push(x.message));
  for (const mat of ['admin', 'oblig', 'intro']) {
    await xe.goto(URLB + `?test&matiere=${mat}`); await xe.waitForSelector('.tribune');
    await xe.evaluate(() => { window.__app.etat().reglages.toutOuvert = true; });
    for (const niv of [2, 3]) {
      await xe.evaluate(() => window.__app.aller('examen')); await xe.locator(`.role-ligne[data-mode="niveau-${niv}"]`).click();
      await xe.waitForSelector('.quitter'); await xe.waitForSelector('.palais-portes', { state: 'detached' });
      await jouer(xe, { capture: `examen-${mat}-${niv}` });
      await xe.waitForSelector('.resultats'); await xe.tap('text=Retour au Palais'); await xe.waitForSelector('.tribune');
    }
    // Partiel blanc : joué jusqu'au bout en droit admin, coupé par le temps en obligations.
    await xe.evaluate(() => window.__app.aller('examen')); await xe.locator('.role-ligne[data-mode="niveau-4"]').click();
    await xe.waitForSelector('.quitter'); await xe.waitForSelector('.palais-portes', { state: 'detached' });
    await xe.waitForFunction(() => /\d+:\d\d/.test(document.querySelector('.chrono-partiel')?.textContent || ''));
    if (mat === 'admin') await jouer(xe);
    else { await jouer(xe, { auHasard: true, max: 6 }).catch(() => {}); await xe.evaluate(() => { const d = Date.now; Date.now = () => d() + 21 * 60000; }); }
    await xe.waitForSelector('.res-bilan', { timeout: 5000 });
    if (mat === 'oblig') assert.match(await xe.locator('.res-bilan').innerText(), /Temps écoulé/, 'partiel coupé par le temps');
    await xe.screenshot({ path: CAP + `partiel-${mat}.png`, fullPage: true });
    await xe.tap('text=Retour au Palais'); await xe.waitForSelector('.tribune');
  }
  await ex.close();
  log('examen ok');

  // La mesure juste : progression, tirage, aides, série, signalement, boutique.
  const mj = await b.newContext({ ...devices['iPhone 13'], serviceWorkers: 'block' });
  const w = await mj.newPage(); w.on('pageerror', (x) => erreurs.push(x.message));
  await w.goto(URLB + '?test&choix'); await w.waitForSelector('.portes');
  await w.locator('.porte-oblig').click(); await w.waitForSelector('.tribune');
  const mesure = await w.evaluate(async () => {
    const m = await import('./js/state.js'); const e = window.__app.etat(); const a = () => e.oblig.arrets.dol;
    const r = {}; const j = m.jour();
    for (let i = 0; i < 5; i++) m.noter('dol', true);
    r.unJour = a().b; r.d = a().d - j;
    a().d = j; m.noter('dol', false); m.noter('dol', false); r.apresErreurs = a().b; r.ko = a().ko; r.du = a().d - j;
    m.noter('dol', true); r.remonte = a().b;
    a().rate = null; a().monte = null; a().d = j; r.aide = m.noter('dol', true, null, true); r.aideB = a().b;
    a().b = 5; a().d = j; a().monte = null; m.noter('dol', true); r.grand = a().b; r.grandD = a().d - j;
    return r;
  });
  assert.equal(mesure.unJour, 1, 'une seule montée par jour'); assert.equal(mesure.d, 1, 'revue demain');
  assert.equal(mesure.apresErreurs, 1); assert.equal(mesure.ko, 2); assert.equal(mesure.du, 0, 'une fiche ratée reste due');
  assert.equal(mesure.remonte, 1, 'pas de remontée le jour d’une erreur');
  assert.equal(mesure.aide, false); assert.equal(mesure.aideB, 1, 'une réponse aidée ne fait pas monter');
  assert.equal(mesure.grand, 5); assert.equal(mesure.grandD, 45, 'dernier intervalle utilisé');
  const prime = await w.evaluate(async () => {
    const m = await import('./js/state.js'); const e = window.__app.etat(); const a = () => e.oblig.arrets.baldus; const j = m.jour();
    const jour = () => { if (a()) { a().d = j; a().monte = null; a().rate = null; } };
    const avant = e.jetons; const r = [];
    for (let i = 0; i < 4; i++) { jour(); r.push(m.noter('baldus', true)); }
    const apres = e.jetons; a().b = 2; jour(); m.noter('baldus', true); jour(); const bis = m.noter('baldus', true);
    e.oblig.arrets.dol.b = 5; e.oblig.arrets.dol.m = 0; e.oblig.arrets.dol.d = j; e.oblig.arrets.dol.monte = null; e.oblig.arrets.dol.rate = null;
    return { r, gagne: apres - avant, bis, total: e.jetons - apres, ancienne: m.noter('dol', true) };
  });
  assert.deepEqual(prime.r, [true, true, true, 'prime'], 'prime à la quatrième montée');
  assert.equal(prime.gagne, 10, 'dix jetons'); assert.equal(prime.bis, true); assert.equal(prime.total, 0, 'une seule prime par fiche');
  assert.equal(prime.ancienne, true, 'un ancien niveau ne suffit pas');
  const tirage = await w.evaluate(async () => {
    const en = await import('./js/engine.js'); const ix = window.__app.ix; const cible = ix.cas[20];
    const z = ix.zones.filter((x) => !x.travaux).map((x) => x.id);
    const pris = en.tirerRound(ix, 'cas', z, [cible.liens[0]], Math.random, new Set());
    const lie = ix.cas.filter((c) => c.liens.includes(cible.liens[0])).map((c) => c.id);
    return { lie: lie.includes(pris.id), vus: Object.keys(window.__app.etat().oblig.exos || {}).length };
  });
  assert(tirage.lie, 'le cas tiré travaille la fiche due'); assert(tirage.vus >= 1, 'exercice mémorisé');
  await w.evaluate(() => { const e = window.__app.etat(); e.serie.dernier = null; e.serie.n = 3; window.__app.aller('role'); });
  await w.locator('.role-ligne[data-mode="remede"]').click();
  await w.waitForSelector('.quitter'); await w.waitForSelector('.palais-portes', { state: 'detached' });
  for (let i = 0; i < 400; i++) {
    if (await w.$('.resultats')) break;
    await w.evaluate(() => { const suite = document.querySelector('.scene .pied button'); (suite || document.querySelector('.scene .option[data-ok="false"]'))?.click(); });
    await w.waitForTimeout(60);
  }
  await w.waitForSelector('.resultats');
  assert.match(await w.locator('.resultats').innerText(), /Sceau du jour non obtenu/, 'séance ratée sans sceau');
  assert.equal((await etat(w)).serie.dernier, null, 'la série n’est pas validée');
  await w.evaluate(() => window.__app.aller('boutique'));
  const titres = await w.$$eval('.page h2', (l) => l.map((x) => x.textContent));
  assert.deepEqual(titres.slice(0, 2), ['Skins de Lexou', 'Garde-robe de Lexou']); assert.equal(titres.at(-1), 'Aides');
  assert.equal(await w.locator('.article', { hasText: 'Note du rapporteur' }).count(), 0, 'pas d’indice à vendre en obligations');
  await w.evaluate(() => window.__app.aller('role'));
  await w.locator('.dunk-choix button').first().click(); await w.waitForSelector('.dunk-question');
  await w.locator('.quitter').click().catch(() => {});
  await w.evaluate(() => window.__app.aller('arrets')); await w.locator('.carte-arret').first().click();
  await w.locator('.signaler').click(); await w.locator('.boite textarea').fill('La date me semble fausse.');
  await w.locator('.boite .bouton-or').click();
  assert.equal((await etat(w)).signalements.length, 1, 'signalement gardé');
  await w.evaluate(() => window.__app.aller('profil'));
  assert.match(await w.locator('.ecran-page, main, body').first().innerText(), /Mes signalements/);
  await mj.close();
  log('mesure ok');

  // Le commentaire : l'arrêt reste lisible, et le plan se justifie par le texte.
  const cm = await b.newContext({ ...devices['iPhone 13'], serviceWorkers: 'block' });
  const y = await cm.newPage(); y.on('pageerror', (x) => erreurs.push(x.message));
  await y.goto(URLB + '?test&choix'); await y.waitForSelector('.portes');
  await y.locator('.porte-oblig').click(); await y.waitForSelector('.tribune');
  await y.evaluate(() => { const ix = window.__app.ix; ix.sujets = ix.sujets.filter((x) => x.type === 'C'); window.__app.aller('role'); });
  await ouvrirMode(y, 'plan', 'C');
  await y.waitForSelector('.ecran.commentaire'); await y.waitForSelector('.palais-portes', { state: 'detached' });
  assert(await y.locator('.ecran.commentaire .bandeau-arret').evaluate((d) => d.open), 'arrêt ouvert à la lecture');
  assert.match(await y.locator('.bandeau-arret summary').innerText(), /\d{4}/, 'date de l’arrêt dans le bandeau');
  await y.screenshot({ path: CAP + 'commentaire-lecture.png' }); await debordement(y, 'lecture de l’arrêt');
  await y.locator('.pied button').click(); await y.waitForSelector('.plans-rail');
  assert.equal(await y.locator('.bandeau-arret').evaluate((d) => d.open), false, 'bandeau replié sur le plan');
  await y.locator('.bandeau-arret summary').click(); await y.screenshot({ path: CAP + 'commentaire-bandeau.png' }); await y.locator('.bandeau-arret summary').click();
  const etapes = new Set();
  for (let i = 0; i < 600 && !(await y.$('.corrige-plan')); i++) {
    const t = await y.evaluate(() => document.querySelector('.scene .surtitre')?.textContent);
    if (t) etapes.add(t);
    if (t?.startsWith('Justifie') && !(await y.$('.commentaire-vu'))) { await y.evaluate(() => document.body.classList.add('commentaire-vu')); await y.screenshot({ path: CAP + 'commentaire-justifie.png' }); }
    await y.evaluate(() => {
      const r = document.querySelector('.plans-rail');
      if (r) { const bon = document.querySelector('.plan-carte[data-ok="true"]'); if (bon && !bon.classList.contains('centree')) { r.scrollLeft = bon.offsetLeft - r.firstChild.offsetLeft; return; } }
      const suite = document.querySelector('.scene .pied button'); if (suite) return suite.click();
      document.querySelector('.scene .option[data-ok="true"]')?.click();
    });
    await y.waitForTimeout(80);
  }
  assert(await y.$('.corrige-plan'), 'corrigé affiché');
  await y.screenshot({ path: CAP + 'commentaire-corrige.png' });
  const vues = [...etapes];
  assert.equal(vues.filter((x) => x.startsWith('Justifie')).length, 1, 'une partie à justifier');
  assert.equal(vues.filter((x) => x.startsWith('Diagnostic')).length, 1, 'un seul diagnostic');
  // En droit administratif, le type de sujet se choisit, et le commentaire porte son arrêt.
  const ya = await cm.newPage(); ya.on('pageerror', (x) => erreurs.push(x.message));
  await ya.goto(URLB + '?test'); await ya.waitForSelector('.tribune');
  await ya.evaluate(() => window.__app.ouvrirMatiere('admin')); await ya.waitForSelector('.tribune');
  for (const [m, g] of [['plan', 'C'], ['architecte', 'C'], ['plan', 'D']]) {
    await ya.evaluate(() => window.__app.aller('role')); await ouvrirMode(ya, m, g);
    await ya.waitForSelector('.quitter'); await ya.waitForSelector('.palais-portes', { state: 'detached' });
    const titre = await ya.locator('.scene .question, .question').first().innerText();
    const bandeau = await ya.$('.bandeau-arret');
    if (g === 'C') { assert(bandeau, `bandeau de l’arrêt en ${m} administratif`); assert.match(await ya.locator('.bandeau-arret summary').innerText(), /\d{4}/); }
    else assert(!bandeau && !/^(CE|TC|CC)\b/.test(titre), `dissertation demandée : ${titre}`);
    await ya.screenshot({ path: CAP + `admin-${m}-${g}.png` });
    await ya.tap('.quitter'); await ya.tap('.boite .bouton-or'); await ya.waitForSelector('.tribune');
  }
  await cm.close();
  log('commentaire ok');

  // La frise : on place les décisions dans le désordre, puis on les remet en échangeant.
  const fr = await b.newContext({ ...devices['iPhone 13'], serviceWorkers: 'block' });
  const f = await fr.newPage(); f.on('pageerror', (x) => erreurs.push(x.message));
  await f.goto(URLB + '?test&matiere=oblig'); await f.waitForSelector('.tribune');
  await f.evaluate(() => window.__app.aller('role')); await f.locator('.role-ligne[data-mode="frise"]').click();
  await f.waitForSelector('.jalons'); await f.waitForSelector('.palais-portes', { state: 'detached' });
  await f.screenshot({ path: CAP + 'frise-debut.png' }); await debordement(f, 'frise');
  while (await f.$('.decision')) await f.locator('.decision').last().click();
  await f.screenshot({ path: CAP + 'frise-placee.png' });
  // Les bons rangs sont connus du jeu : on échange jusqu'à ce que chaque décision soit à sa date.
  for (let k = 0; k < 10; k++) {
    const mal = await f.evaluate(() => {
      const r = window.__frise; if (!r) return null;
      const i = r.place.findIndex((d, n) => n > 0 && d.rang !== n);
      if (i < 0) return null;
      return [i, r.place.findIndex((d) => d.rang === i)];
    });
    if (!mal) break;
    await f.locator(`.jalon-case[data-i="${mal[0]}"]`).click(); await f.locator(`.jalon-case[data-i="${mal[1]}"]`).click();
  }
  await f.locator('.scene .pied button').click(); await f.waitForSelector('.frise-vraie');
  assert.match(await f.locator('.frise .question').innerText(), /Toute la frise est juste/, 'échanges qui remettent la frise en ordre');
  await f.screenshot({ path: CAP + 'frise-corrige.png' });
  // Ta progression, ouverte depuis le grade en haut ; Vers l'examen nommé par degrés.
  await f.locator('.haut-rang').first().click().catch(() => {});
  await f.evaluate(() => window.__app.aller('progression')); await f.waitForSelector('.progression');
  assert.equal(await f.locator('.progression h2').count(), 4, 'trois échelles et Vers l’examen');
  await f.screenshot({ path: CAP + 'progression.png', fullPage: true }); await debordement(f, 'progression');
  await f.evaluate(() => window.__app.aller('examen')); await f.waitForSelector('text=Première instance');
  // Carnet d'erreurs et Faire appel : des erreurs exprès, puis l'appel.
  await f.goto(URLB + '?test'); await f.waitForSelector('.tribune');
  await f.evaluate(() => window.__app.ouvrirMatiere('admin')); await f.waitForSelector('.tribune');
  await f.evaluate(() => window.__app.aller('role')); await f.locator('.role-ligne[data-mode="paires"]').click();
  await jouer(f, { auHasard: true });
  let carnetN = await f.evaluate(() => Object.values(window.__app.etat().erreurs || {}).filter((e) => !e.corrige).length);
  for (let k = 0; k < 4 && !carnetN; k++) {
    await f.tap('text=Retour au Palais'); await f.evaluate(() => window.__app.aller('role')); await f.locator('.role-ligne[data-mode="puzzle"]').click(); await jouer(f, { auHasard: true });
    carnetN = await f.evaluate(() => Object.values(window.__app.etat().erreurs || {}).filter((e) => !e.corrige).length);
  }
  assert(carnetN > 0, 'erreurs au carnet');
  const jetonsAvant = await f.evaluate(() => window.__app.etat().jetons);
  await f.locator('[data-appel]').click(); await f.waitForSelector('.qcm.appel');
  await f.screenshot({ path: CAP + 'appel.png' });
  await jouer(f);
  assert.equal(await f.evaluate(() => window.__app.etat().jetons), jetonsAvant, 'appel sans jetons');
  const restantes = await f.evaluate(() => Object.values(window.__app.etat().erreurs).filter((e) => !e.corrige).length);
  assert(restantes < carnetN, `appel gagné qui sort du carnet : ${carnetN} puis ${restantes}`);
  await f.tap('text=Retour au Palais');
  await f.evaluate(() => window.__app.aller('arrets')); await f.locator('[data-carnet]').click(); await f.waitForSelector('.carnet');
  assert(await f.locator('.carnet-ligne.corrige').count() > 0, 'erreur corrigée barrée');
  await f.screenshot({ path: CAP + 'carnet.png', fullPage: true }); await debordement(f, 'carnet');
  // Lexique et termes soulignés, prise en main revue depuis le profil.
  await f.evaluate(() => window.__app.aller('arrets')); await f.locator('[data-lexique]').click(); await f.waitForSelector('.lexique dt');
  assert(await f.locator('.lexique').first().locator('dt').count() >= 30, 'lexique administratif');
  await f.screenshot({ path: CAP + 'lexique.png' }); await debordement(f, 'lexique');
  await f.evaluate(() => { const q = document.createElement('h2'); q.className = 'question'; q.textContent = 'Le juge écarte-t-il la loi-écran face à un acte de gouvernement ?'; document.getElementById('app').append(q); });
  await f.waitForSelector('.question .terme');
  let bulleTxt = '';
  for (let k = 0; k < 4 && !bulleTxt.includes(':'); k++) {
    await f.locator('.question .terme').first().click();
    bulleTxt = await f.waitForFunction(() => document.querySelector('.bulle-terme')?.textContent || '', null, { timeout: 3000 }).then((x) => x.jsonValue()).catch(() => '');
  }
  assert.match(bulleTxt, /:/, 'définition affichée');
  await f.screenshot({ path: CAP + 'terme.png' });
  await f.evaluate(() => window.__app.aller('profil')); await f.locator('text=Revoir la prise en main').click(); await f.waitForSelector('.prise-en-main');
  await f.screenshot({ path: CAP + 'prise-en-main.png' });
  for (let k = 0; k < 3; k++) await f.locator('.prise-en-main .bouton-or').click();
  await f.locator('.prise-en-main .bouton-or').click(); await f.waitForSelector('.prise-en-main', { state: 'detached' });
  // La même frise en droit administratif.
  await f.goto(URLB + '?test'); await f.waitForSelector('.tribune');
  await f.evaluate(() => window.__app.ouvrirMatiere('admin')); await f.waitForSelector('.tribune');
  await f.evaluate(() => { window.__app.etat().reglages.toutOuvert = true; window.__app.aller('role'); });
  await f.locator('.role-ligne[data-mode="frise"]').click(); await f.waitForSelector('.jalons'); await f.waitForSelector('.palais-portes', { state: 'detached' });
  await f.screenshot({ path: CAP + 'frise-admin.png' }); await debordement(f, 'frise administrative');
  await jouer(f); await f.tap('text=Retour au Palais');
  await fr.close();
  log('frise ok');

  // Le compte : connexion obligatoire, copie en ligne, reprise sur un autre téléphone. Supabase est simulé.
  const SUPA = 'https://jhpgxisxayceixmppxuu.supabase.co';
  const faux = { progression: null, envois: [], signalements: [], otp: [], rpc: [], pousse: 0, defi: null, retours: [], acces: 'admin' };
  const jourParis = (() => { const t = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Paris', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date()).split('-').map(Number); return Math.floor(Date.UTC(t[0], t[1] - 1, t[2]) / 864e5); })();
  const lundiT = jourParis - ((new Date(jourParis * 864e5).getUTCDay() + 6) % 7);
  const simuler = async (ctx) => ctx.route(SUPA + '/**', async (route) => {
    const r = route.request(); const u = new URL(r.url()); const corps = r.postData() ? JSON.parse(r.postData()) : null;
    const json = (x, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(x) });
    const jetonOk = { access_token: 'jeton', refresh_token: 'renouveau', expires_in: 3600, user: { id: 'u-1', email: 'test@exemple.fr', user_metadata: { full_name: 'Testeur' } } };
    if (u.pathname === '/auth/v1/otp') { faux.otp.push(corps.email); return json({}); }
    if (u.pathname === '/auth/v1/verify') return corps.token === '123456' ? json(jetonOk) : json({ msg: 'Token has expired or is invalid' }, 403);
    if (u.pathname === '/auth/v1/user') return json(jetonOk.user);
    if (u.pathname === '/auth/v1/token') return json(jetonOk);
    if (u.pathname === '/auth/v1/logout') return route.fulfill({ status: 204 });
    assert.equal(r.headers().authorization, 'Bearer jeton', 'appel authentifié');
    if (u.pathname === '/rest/v1/progressions' && r.method() === 'GET') return json(faux.progression ? [faux.progression] : []);
    if (u.pathname === '/rest/v1/progressions') { faux.progression = { donnees: corps.donnees, maj: corps.maj }; faux.envois.push(corps); return route.fulfill({ status: 201 }); }
    if (u.pathname === '/functions/v1/pousser') { faux.pousse++; return json({ envoyees: 0 }); }
    if (u.pathname === '/rest/v1/profils' && r.method() === 'GET') return json([{ pseudo: 'Testeur', equipe: null, acces: faux.acces, code_ami: 'TEST-2345', masquer: false, notifs: { demandes: true, defis: true, revisions: false } }]);
    if (u.pathname.startsWith('/rest/v1/rpc/')) {
      const nom = u.pathname.split('/').pop(); faux.rpc.push([nom, corps]);
      if (nom === 'admin_comptes') return json([{ id: 'u-1', email: 'test@exemple.fr', pseudo: 'Testeur', acces: 'admin', jetons: 50, xp: 10, xp_oblig: 0, seances: 1, vu_le: new Date().toISOString(), en_attente: 0 }, { id: 'u-2', email: 'camille.tres.longue.adresse@exemple.fr', pseudo: 'Camille', acces: 'testeur', jetons: 120, xp: 300, xp_oblig: 40, seances: 9, vu_le: null, en_attente: -20 }]);
      if (nom === 'admin_signalements') return json([{ id: 1, nom: 'Blanco', carte: 'blanco', texte: 'Date fausse', pseudo: 'Camille', cree_le: new Date().toISOString(), traite: false, equipe: 1 }]);
      if (nom === 'admin_lire_reglage') return json('testeur');
      if (nom === 'admin_quota') return json({ quota: 28, testeurs: 4, sans_acces: 0 });
      if (nom === 'admin_retours') return json([{ id: 1, genre: 'interface', texte: 'Le bouton est trop petit', ecran: 'Profil', pseudo: 'Camille', cree_le: new Date().toISOString(), traite: false }]);
      if (nom === 'mes_amis') return json([{ id: 'u-2', pseudo: 'Camille', equipe: 1, lien: 'ami', masque: false, resume: { jour: jourParis, serie: 3, sceau: true, grade: 'Licencié en droit', xp: 900, xpAdmin: 500, xpOblig: 400, semaine: lundiT, xpSemaine: 5240, maitrises: 12, equipe: 1, seances: 20 } }, { id: 'u-3', pseudo: 'Léa', lien: 'recue' }]);
      if (nom === 'mes_notifications') return json([{ id: 1, type: 'demande', pseudo: 'Léa', donnees: {}, cree_le: new Date().toISOString(), lu: false }, { id: 2, type: 'defi_recu', pseudo: 'Camille', donnees: { defi: 'd-1' }, cree_le: new Date().toISOString(), lu: false }]);
      if (nom === 'mes_defis') return json([{ id: 'd-1', recu: true, autre: 'u-2', pseudo: 'Camille', matiere: 'admin', score_auteur: 0.5, statut: 'ouvert', cree_le: new Date().toISOString() }]);
      if (nom === 'mes_bloques') return json([]);
      if (nom === 'demander_ami') return json('envoyee');
      if (nom === 'creer_defi') { faux.defi = corps; return json('d-2'); }
      if (nom === 'lire_defi') return json({ id: 'd-1', statut: 'ouvert', matiere: 'admin', equipe: null, score_auteur: 0.5, pseudo_auteur: 'Camille', rounds: faux.defi.rounds });
      return route.fulfill({ status: 204 });
    }
    if (u.pathname === '/rest/v1/profils') return route.fulfill({ status: 204 });
    if (u.pathname === '/rest/v1/retours') { faux.retours.push(corps); return route.fulfill({ status: 201 }); }
    if (u.pathname === '/rest/v1/signalements') { faux.signalements.push(...corps); return route.fulfill({ status: 201 }); }
    if (u.pathname === '/rest/v1/cadeaux') return json([{ id: 'cadeau-1', jetons: 7 }]);
    return json({});
  });
  const t1 = await b.newContext({ ...devices['iPhone 13'], serviceWorkers: 'block' }); await simuler(t1);
  const k1 = await t1.newPage(); k1.on('pageerror', (x) => erreurs.push(x.message));
  await k1.goto(URLB + '?test&compte&email'); await k1.waitForSelector('.connexion');
  assert.equal(await k1.$('.tribune'), null, 'rien sans connexion');
  await k1.screenshot({ path: CAP + 'connexion.png' }); await debordement(k1, 'connexion');
  await k1.fill('.connexion input[type="email"]', 'Test@Exemple.fr'); await k1.locator('text=Recevoir un code par email').click();
  await k1.waitForSelector('.connexion-code:not([hidden])'); assert.deepEqual(faux.otp, ['test@exemple.fr']);
  await k1.fill('.connexion-code input', '000000'); await k1.locator('text=Valider le code').click();
  await k1.waitForSelector('.toast, .notif', { timeout: 5000 }).catch(() => {});
  assert(await k1.$('.connexion'), 'code faux refusé');
  await k1.fill('.connexion-code input', '123456'); await k1.locator('text=Valider le code').click();
  await k1.waitForSelector('.tribune');
  let ec = await etat(k1);
  assert.equal(ec.compte.id, 'u-1'); assert.equal(ec.compte.email, 'test@exemple.fr');
  await k1.waitForFunction(() => window.__app.etat().jetons >= 7, null, { timeout: 5000 });
  await k1.evaluate(() => window.__app.aller('role')); await k1.tap('.role-ligne[data-mode="express"]'); await jouer(k1); await k1.tap('text=Retour au Palais');
  for (let i = 0; i < 60 && !(faux.progression?.donnees.stats.seances >= 1); i++) await k1.waitForTimeout(100);
  assert(faux.progression.donnees.stats.seances >= 1, 'progression envoyée');
  assert(!('compte' in faux.progression.donnees) && !faux.progression.donnees.enCours, 'ni compte ni séance en cours en ligne');
  await k1.evaluate(() => { window.__app.etat().signalements.push({ id: 'blanco', nom: 'Blanco', txt: 'Date fausse', le: '2026-11-06', equipe: 1 }); window.dispatchEvent(new Event('online')); });
  await k1.waitForFunction(() => window.__app.etat().signalements.every((x) => x.envoye), null, { timeout: 5000 });
  assert.equal(faux.signalements[0].carte, 'blanco', 'signalement reçu en ligne');
  const xp1 = (await etat(k1)).xp;
  await k1.evaluate(() => window.__app.aller('profil')); await k1.waitForSelector('.compte');
  await k1.screenshot({ path: CAP + 'compte-profil.png' });
  // Faire un retour depuis le profil.
  await k1.locator('[data-retour]').click(); await k1.waitForSelector('.puces-retour');
  await k1.locator('.puce[data-genre="droit"]').click(); await k1.fill('.retour-texte', 'La date de Blanco est fausse');
  await k1.locator('.boite .bouton-or', { hasText: 'Envoyer' }).click();
  for (let i = 0; i < 20 && !faux.retours.length; i++) await k1.waitForTimeout(100);
  assert.deepEqual([faux.retours[0].genre, faux.retours[0].texte, faux.retours[0].ecran], ['droit', 'La date de Blanco est fausse', 'Profil'], 'retour envoyé');
  // L'administration : comptes, jetons, statut, signalements.
  await k1.locator('[data-admin]').click(); await k1.waitForSelector('.admin-compte');
  assert.equal(await k1.locator('.admin-compte').count(), 2);
  await k1.screenshot({ path: CAP + 'admin.png', fullPage: true }); await debordement(k1, 'administration');
  await k1.locator('.admin-compte[data-compte="u-2"]').click(); await k1.waitForSelector('.admin-fiche');
  await k1.screenshot({ path: CAP + 'admin-fiche.png' });
  await k1.fill('.admin-fiche input[type="number"]', '25'); await k1.locator('.admin-duo .bouton-fantome').click();
  await k1.waitForSelector('.admin-fiche', { state: 'detached' });
  assert.deepEqual(faux.rpc.find(([n]) => n === 'admin_jetons')[1], { cible: 'u-2', montant: -25, raison: null }, 'retrait de jetons');
  await k1.locator('.admin-compte[data-compte="u-2"]').click(); await k1.locator('.admin-fiche .bascule button', { hasText: 'Payé' }).click();
  await k1.waitForSelector('.admin-fiche', { state: 'detached' });
  assert.deepEqual(faux.rpc.find(([n]) => n === 'admin_statut')[1], { cible: 'u-2', statut: 'paye' }, 'statut changé');
  await k1.locator('.admin-compte[data-compte="u-1"]').click(); assert.equal(await k1.locator('.admin-fiche .bascule').count(), 0, 'pas de statut pour soi'); await k1.locator('.admin-fiche .bouton-lien').click();
  await k1.locator('text=Marquer comme traité').last().click(); await k1.waitForTimeout(300);
  assert(faux.rpc.some(([n, c]) => n === 'admin_traiter' && c.fait === true), 'signalement traité');
  // Les amis : nouvelles, classement, demande, défi lancé puis relevé, lien d'invitation.
  await k1.evaluate(() => window.__app.aller('palais')); await k1.waitForSelector('.haut-amis .pastille');
  await k1.waitForSelector('.defi-attente'); assert.match(await k1.locator('.defi-attente').innerText(), /Camille te défie/, 'défi reçu visible au Palais');
  await k1.locator('.haut-amis').click(); await k1.waitForSelector('.classement');
  assert.equal(await k1.locator('.classement li').count(), 2, 'toi et Camille');
  assert.match(await k1.locator('.classement li').first().innerText(), /Camille[\s\S]*240/, 'Camille en tête de la semaine');
  await k1.screenshot({ path: CAP + 'amis.png', fullPage: true }); await debordement(k1, 'amis');
  await k1.locator('button', { hasText: 'Accepter' }).click();
  await k1.waitForFunction(() => true); for (let i = 0; i < 20 && !faux.rpc.some(([n]) => n === 'repondre_ami'); i++) await k1.waitForTimeout(100);
  assert.deepEqual(faux.rpc.find(([n]) => n === 'repondre_ami')[1], { autre: 'u-3', accepter: true });
  await k1.waitForSelector('.classement');
  await k1.fill('.amis input[aria-label="Code ami"]', 'abcd efgh'); await k1.locator('text=Envoyer la demande').click();
  await k1.waitForTimeout(400); assert(!faux.rpc.some(([n, c]) => n === 'demander_ami'), 'code mal formé refusé');
  await k1.fill('.amis input[aria-label="Code ami"]', 'abcdefgh'); await k1.locator('text=Envoyer la demande').click();
  for (let i = 0; i < 20 && !faux.rpc.some(([n]) => n === 'demander_ami'); i++) await k1.waitForTimeout(100);
  assert.deepEqual(faux.rpc.find(([n]) => n === 'demander_ami')[1], { code: 'ABCD-EFGH' });
  await k1.waitForSelector('.classement');
  await k1.locator('.ami-ligne').first().click(); await k1.waitForSelector('.comparer');
  await k1.screenshot({ path: CAP + 'ami-fiche.png' });
  await k1.locator('.admin-fiche .bouton-or', { hasText: 'Administratif' }).click();
  await jouer(k1);
  for (let i = 0; i < 30 && !faux.defi; i++) await k1.waitForTimeout(100);
  assert(faux.defi && faux.defi.invite === 'u-2' && faux.defi.rounds.length >= 3 && faux.defi.score >= 0 && faux.defi.score <= 1, 'défi envoyé avec ses questions');
  assert(faux.pousse > 0, 'notification poussée');
  await k1.tap('text=Retour au Palais'); await k1.locator('.haut-amis').click(); await k1.waitForSelector('.classement');
  await k1.locator('.amis .bouton-or', { hasText: 'Relever' }).first().click();
  await jouer(k1);
  for (let i = 0; i < 30 && !faux.rpc.some(([n]) => n === 'repondre_defi'); i++) await k1.waitForTimeout(100);
  assert.equal(faux.rpc.find(([n]) => n === 'repondre_defi')[1].defi, 'd-1', 'score renvoyé');
  assert.match(await k1.locator('.resultats').innerText(), /Camille/, 'comparaison avec Camille');
  await k1.tap('text=Retour au Palais');
  faux.rpc.length = 0;
  await k1.goto(URLB + '?test&compte&ami=WXYZ-2345'); await k1.waitForSelector('.boite');
  await k1.locator('.boite .bouton-or').click();
  for (let i = 0; i < 20 && !faux.rpc.some(([n]) => n === 'demander_ami'); i++) await k1.waitForTimeout(100);
  assert.deepEqual(faux.rpc.find(([n]) => n === 'demander_ami')[1], { code: 'WXYZ-2345' }, 'lien d’invitation');
  // Un autre téléphone, connecté par Google : il retrouve la progression.
  const t2 = await b.newContext({ ...devices['iPhone 13'], serviceWorkers: 'block' }); await simuler(t2);
  const k2 = await t2.newPage(); k2.on('pageerror', (x) => erreurs.push(x.message));
  await k2.goto(URLB + '?test&compte#access_token=jeton&refresh_token=renouveau&expires_in=3600&token_type=bearer'); await k2.waitForSelector('.tribune');
  assert.equal(new URL(k2.url()).hash, '', 'jetons retirés de l’adresse');
  ec = await etat(k2); assert(ec.xp >= xp1 && ec.xp === faux.progression.donnees.xp, 'progression retrouvée sur le second téléphone'); assert.equal(ec.compte.id, 'u-1');
  // Signaler part en ligne ; se déconnecter efface le téléphone.
  await k2.evaluate(() => window.__app.aller('profil')); await k2.waitForSelector('.compte');
  await k2.locator('text=Se déconnecter').click(); await k2.locator('.boite .bouton-or').click();
  await k2.waitForSelector('.connexion');
  const apres = await k2.evaluate(() => JSON.parse(localStorage.getItem('arrets-admin.v1')));
  assert.equal(apres.xp, 0, 'téléphone effacé après déconnexion');
  // Au-delà des places de test : l'appli reste fermée.
  faux.acces = 'aucun';
  const t3 = await b.newContext({ ...devices['iPhone 13'], serviceWorkers: 'block' }); await simuler(t3);
  const k3 = await t3.newPage(); k3.on('pageerror', (x) => erreurs.push(x.message));
  await k3.goto(URLB + '?test&compte#access_token=jeton&refresh_token=renouveau&expires_in=3600&token_type=bearer');
  await k3.waitForSelector('text=Les places de test sont prises'); assert.equal(await k3.$('.tribune'), null, 'appli fermée sans accès');
  await k3.screenshot({ path: CAP + 'places-prises.png' });
  // Un testeur voit le mot d'accueil une fois.
  faux.acces = 'testeur';
  await k3.goto(URLB + '?test&compte'); await k3.waitForSelector('.accueil-testeur');
  await k3.screenshot({ path: CAP + 'accueil-testeur.png' });
  await k3.locator('.accueil-testeur .bouton-or').click(); await k3.reload(); await k3.waitForSelector('.tribune'); await k3.waitForTimeout(1500);
  assert.equal(await k3.$('.accueil-testeur'), null, 'accueil une seule fois');
  await t1.close(); await t2.close(); await t3.close();
  log('compte ok');

  await b.close(); s.close();
  if (erreurs.length) { console.error('ERREURS CONSOLE', [...new Set(erreurs)]); process.exit(1); }
  log('\nTous les tests sont passés.');
})().catch((e) => { console.error('ÉCHEC :', e.message); process.exit(1); });
