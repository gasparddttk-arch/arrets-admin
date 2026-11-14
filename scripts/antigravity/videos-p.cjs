#!/usr/bin/env node
// scripts/antigravity/videos-p.cjs
// Enregistre 5 vidéos des animations pour validation par Gaspard (Tâche P).
const path = require('path');
const fs = require('fs');
const globalModules = path.resolve(process.execPath, '../../lib/node_modules');
if (fs.existsSync(globalModules) && !module.paths.includes(globalModules)) {
  module.paths.push(globalModules);
}
const { chromium, devices } = require('playwright');
const serveur = require('../../tests/serveur.cjs');

const DOSSIER_VIDEOS = path.resolve(__dirname, '../../.antigravity/videos');
fs.mkdirSync(DOSSIER_VIDEOS, { recursive: true });

const PORT = 8188;
const URL = `http://localhost:${PORT}/?test&anim`;

async function tourner(nomFichier, scenario) {
  console.log(`Enregistrement de ${nomFichier}...`);
  const tmpDir = path.join(DOSSIER_VIDEOS, `tmp_${Date.now()}_${Math.random().toString(36).slice(2)}`);
  fs.mkdirSync(tmpDir, { recursive: true });

  const browser = await chromium.launch();
  const context = await browser.newContext({
    ...devices['iPhone 13'],
    locale: 'fr-FR',
    recordVideo: {
      dir: tmpDir,
      size: { width: 390, height: 844 },
    },
  });
  const page = await context.newPage();

  try {
    await scenario(page);
    await page.waitForTimeout(600);
  } finally {
    const video = page.video();
    await page.close();
    await context.close();
    await browser.close();

    if (video) {
      const src = await video.path();
      const dest = path.join(DOSSIER_VIDEOS, nomFichier);
      if (fs.existsSync(dest)) fs.unlinkSync(dest);
      fs.renameSync(src, dest);
      console.log(`  -> ${nomFichier} enregistré (${(fs.statSync(dest).size / 1024).toFixed(1)} Ko).`);
    }
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}

async function main() {
  const srv = await serveur('docs', PORT);
  console.log(`Serveur vidéo démarré sur le port ${PORT}.`);

  try {
    // P1 : Passages d'écran
    // (Palais → Défi du jour → retour, puis Palais → onglet Fiches → Boutique → Profil)
    await tourner('P1-passages.webm', async (page) => {
      await page.goto(URL);
      await page.waitForSelector('.tribune');
      await page.waitForTimeout(1000);

      // Palais -> Défi du jour
      await page.locator('.cta.brille').click();
      await page.waitForSelector('.scene, .entete-seance');
      await page.waitForTimeout(1200);

      // Quitter la séance -> Retour au Palais
      await page.locator('.quitter').click();
      await page.waitForSelector('.boite');
      await page.waitForTimeout(400);
      await page.locator('.boite-actions button:has-text("Quitter")').click();
      await page.waitForSelector('.tribune');
      await page.waitForTimeout(1200);

      // Onglet Fiches (Arrêts)
      await page.locator('.onglet:has-text("Arrêts")').click();
      await page.waitForSelector('.page');
      await page.waitForTimeout(1000);

      // Onglet Boutique
      await page.locator('.onglet:has-text("Boutique")').click();
      await page.waitForSelector('.page-boutique');
      await page.waitForTimeout(1000);

      // Onglet Profil
      await page.locator('.onglet:has-text("Profil")').click();
      await page.waitForSelector('.page-profil');
      await page.waitForTimeout(1200);
    });

    // P2 : Entre deux épreuves
    // (l'épreuve suivante entre comme une carte posée sur la table, pips saute)
    await tourner('P2-epreuves.webm', async (page) => {
      await page.goto(URL);
      await page.waitForSelector('.tribune');
      await page.locator('.cta.brille').click();
      await page.waitForSelector('.scene > *');
      await page.waitForTimeout(600);

      // Jouer la première épreuve jusqu'à la transition vers la 2e
      for (let n = 0; n < 100; n++) {
        if (await page.evaluate(() => document.querySelectorAll('.pips i.fait').length >= 1)) break;
        await page.evaluate(() => {
          const clic = (e) => { e.click(); return true; };
          const memPret = document.querySelector('.mem-pret'); if (memPret) return clic(memPret);
          const pied = document.querySelector('.scene .pied button:not([disabled])'); if (pied) return clic(pied);
          const chip = document.querySelector('.chip:not([disabled]):not(.reussi)');
          if (chip) {
            if (!chip.classList.contains('vise')) chip.click();
            const cible = document.querySelector(`.carte-paire[data-id="${chip.dataset.id}"]:not([disabled])`);
            return cible ? clic(cible) : false;
          }
          const opt = document.querySelector('.option[data-ok="true"]:not([disabled])'); if (opt) return clic(opt);
          const c = document.querySelector('.decision'); if (c) return clic(c);
        });
        await page.waitForTimeout(200);
      }

      // Observer la transition de l'épreuve suivante qui entre comme une carte posée sur la table
      await page.waitForTimeout(2200);
    });

    // P3 : Écran de résultats
    // (titre tombe et rebondit, 3 cases en cascade, nombres défilent 0 -> valeur)
    await tourner('P3-resultats.webm', async (page) => {
      await page.goto(URL);
      await page.waitForSelector('.tribune');
      await page.evaluate(() => {
        window.__app.resultats({
          rounds: [1, 2, 3, 4, 5],
          scores: [1, 1, 1, 1, 1],
          parfaites: 5,
          xp: 150,
          jetons: 4,
          type: 'defi',
          touches: new Map(),
        }, true);
      });
      await page.waitForSelector('.resultats');
      await page.waitForTimeout(2500);
    });

    // P4 : Ouverture du Palais
    // (bandeau descend, carte série monte avec rebond, sceaux apparaissent, chouette saute, cascade des entrées)
    await tourner('P4-palais.webm', async (page) => {
      await page.goto(URL);
      await page.waitForSelector('.tribune');
      await page.waitForTimeout(3000);
    });

    // P5 : Barre d'onglets
    // (la pastille glisse d'un onglet à l'autre, l'icône touchée fait un rebond)
    await tourner('P5-onglets.webm', async (page) => {
      await page.goto(URL);
      await page.waitForSelector('.tribune');
      await page.waitForTimeout(800);

      await page.locator('.onglet:has-text("Chambres")').click();
      await page.waitForTimeout(1000);

      await page.locator('.onglet:has-text("Arrêts")').click();
      await page.waitForTimeout(1000);

      await page.locator('.onglet:has-text("Boutique")').click();
      await page.waitForTimeout(1000);

      await page.locator('.onglet:has-text("Profil")').click();
      await page.waitForTimeout(1000);

      await page.locator('.onglet:has-text("Palais")').click();
      await page.waitForTimeout(1200);
    });

    console.log('Toutes les vidéos ont été générées avec succès !');
  } finally {
    srv.close();
  }
}

main().catch((err) => {
  console.error('Erreur enregistrement vidéos :', err);
  process.exit(1);
});
