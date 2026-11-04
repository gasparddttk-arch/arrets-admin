// Tests de bout en bout sur écran d'iPhone : parties complètes, série, boutique, sauvegarde, mode avion.
const { chromium, devices } = require('playwright');
const assert = require('assert');
const serveur = require('./serveur.cjs');
const PORT = 8124; const URLB = `http://localhost:${PORT}/`;
const CAP = 'tests/captures/';
const log = (...a) => console.log(...a);

async function etat(p) { return p.evaluate(() => JSON.parse(JSON.stringify(window.__app.etat()))); }

// Joue jusqu'à l'écran de résultats, en touchant ce qui est disponible.
async function jouer(p, { capture = false, bonnes = false } = {}) {
  const vus = new Set();
  for (let n = 0; n < 900; n++) {
    if (await p.$('.resultats')) return;
    if (capture) {
      const nom = await p.evaluate(() => (['.paires', '.puzzle', '.qcm', '.bonplan', '.architecte', '.fin-epreuve'].find((s) => document.querySelector(s)) || '').slice(1));
      if (nom && !vus.has(nom)) { vus.add(nom); await p.screenshot({ path: `${CAP}${capture}-${nom}.png` }); }
    }
    const pied = await p.$('.pied button');
    if (pied) { await pied.click(); await p.waitForTimeout(15); continue; }
    if (bonnes) {
      const c = await p.$('.option:not([disabled])');
      if (c) { await p.evaluate(() => { const o = [...document.querySelectorAll('.option:not([disabled])')]; o[0]?.click(); }); await p.waitForTimeout(10); continue; }
    }
    const sel = ['.chip:not([disabled]):not(.reussi)', '.option:not([disabled])', '.bloc', '.tuile', 'button.feuille-plan:not([disabled])'];
    let fait = false;
    for (const s of sel) {
      const e = await p.$(s);
      if (!e) continue;
      await e.click();
      if (s.startsWith('.chip')) {
        const cartes = await p.$$('.carte-paire:not([disabled])');
        for (const c of cartes) { await c.click(); await p.waitForTimeout(5); if (await p.evaluate(() => !document.querySelector('.chip.vise'))) break; }
      }
      fait = true; break;
    }
    if (!fait) await p.waitForTimeout(60);
  }
  throw new Error('Partie non terminée');
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
  await jouer(p, { capture: 'defi' });
  await p.waitForTimeout(1200);
  await p.screenshot({ path: CAP + 'resultats.png' });
  let e = await etat(p);
  assert.equal(e.serie.n, 1, 'la série doit valoir 1'); assert(e.xp > 0, 'XP'); assert(e.stats.seances === 1);
  assert(Object.keys(e.arrets).length > 3, 'arrêts notés');
  log('défi terminé :', { xp: e.xp, jetons: e.jetons, vus: Object.keys(e.arrets).length });
  await p.tap('text=Retour au Palais');

  // 2. Chaque mode, seul, plusieurs fois, pour couvrir le contenu.
  for (const m of ['Paires', 'Puzzle d’arrêt', 'Le juge, c’est toi', 'Le bon plan', 'Architecte']) {
    for (let i = 0; i < 3; i++) {
      await p.locator('.role-ligne', { hasText: m }).click();
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
  await p.locator('.theme-tapis button').click();
  assert.equal(await p.evaluate(() => document.documentElement.dataset.theme), 'tapis');
  await p.screenshot({ path: CAP + 'theme-tapis.png' });
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

  // 5. Sauvegarde : export puis restauration.
  const code = await p.evaluate(() => { const st = window.__app.etat(); return btoa(unescape(encodeURIComponent(JSON.stringify(st)))); });
  const xp = (await etat(p)).xp;
  await p.evaluate(() => { localStorage.clear(); indexedDB.deleteDatabase('arrets-admin'); });
  await p.waitForTimeout(100);
  await p.goto(URLB + '?test'); await p.waitForSelector('.tribune');
  assert.equal((await etat(p)).xp, 0, 'état vidé');
  await p.evaluate(() => window.__app.aller('profil'));
  await p.fill('textarea.code[placeholder]', code);
  await p.tap('text=Restaurer ce code');
  await p.waitForSelector('.tribune');
  assert.equal((await etat(p)).xp, xp, 'restauration');
  log('sauvegarde ok');

  // 6. Copie de secours : localStorage vidé, IndexedDB prend le relais.
  await p.waitForTimeout(150);
  await p.evaluate(() => localStorage.clear());
  await p.reload(); await p.waitForSelector('.tribune');
  assert.equal((await etat(p)).xp, xp, 'copie de secours');
  log('copie de secours ok');

  // 7. Série : lendemain, sursis, rupture et relevé de forclusion.
  e = await etat(p); assert.equal(e.serie.n, 1);
  await p.goto(URLB + '?test&decalage=1'); await p.waitForSelector('.tribune');
  assert.equal((await etat(p)).serie.n, 1, 'le lendemain, la série tient');
  await p.tap('text=Juste trois minutes'); await jouer(p);
  assert.equal((await etat(p)).serie.n, 2, 'série à 2');
  await p.tap('text=Retour au Palais');
  const sursis = (await etat(p)).inv.sursis;
  await p.goto(URLB + '?test&decalage=3'); await p.waitForSelector('.tribune');
  e = await etat(p);
  assert.equal(e.serie.n, 2, 'un jour manqué couvert par un sursis'); assert.equal(e.inv.sursis, sursis - 1, 'sursis consommé');
  await p.evaluate(() => { window.__app.etat().inv.sursis = 0; window.__app.etat().jetons = 300; localStorage.setItem('arrets-admin.v1', JSON.stringify(window.__app.etat())); });
  await p.goto(URLB + '?test&decalage=6'); await p.waitForSelector('.rupture');
  await p.screenshot({ path: CAP + 'rupture.png' });
  e = await etat(p); assert.equal(e.serie.n, 0, 'série rompue'); assert(e.rompue);
  await p.locator('.rupture button').click();
  e = await etat(p); assert.equal(e.serie.n, 2, 'série rétablie');
  await p.tap('text=Juste trois minutes'); await jouer(p);
  assert.equal((await etat(p)).serie.n, 3, 'série prolongée après relevé');
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

  await b.close(); s.close();
  if (erreurs.length) { console.error('ERREURS CONSOLE', [...new Set(erreurs)]); process.exit(1); }
  log('\nTous les tests sont passés.');
})().catch((e) => { console.error('ÉCHEC :', e.message); process.exit(1); });
