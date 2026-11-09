// Assemble l'appli publiée dans docs/ : contenu, polices, liste de mise en cache.
import { createHash } from 'node:crypto';
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { lireContenu, lireObligations, lireObligations1, lireIntro } from './parse.mjs';

const SORTIE = 'docs';
rmSync(SORTIE, { recursive: true, force: true });
mkdirSync(SORTIE, { recursive: true });
cpSync('app', SORTIE, { recursive: true });

// Polices : celles du système (New York et SF Pro sur Apple), rien à embarquer.

// Clé publique des notifications (la clé privée reste un secret du dépôt).
const cle = existsSync('rappel/cle-publique.txt') ? readFileSync('rappel/cle-publique.txt', 'utf8').trim() : '';
const supa = existsSync('rappel/supabase.json') ? JSON.parse(readFileSync('rappel/supabase.json', 'utf8')) : { url: '', cle: '' };
writeFileSync(join(SORTIE, 'js/config.js'), `export const CLE_PUBLIQUE_VAPID = ${JSON.stringify(cle)};\nexport const SUPABASE_URL = ${JSON.stringify(supa.url)};\nexport const SUPABASE_CLE = ${JSON.stringify(supa.cle)};\n`);

const contenu = lireContenu();
const date = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long', timeZone: 'Europe/Paris' }).format(new Date());
writeFileSync(join(SORTIE, 'content.json'), JSON.stringify({ ...contenu, version: date }));
writeFileSync(join(SORTIE, 'oblig.json'), JSON.stringify({ ...lireObligations(), version: date }));
writeFileSync(join(SORTIE, 'oblig1.json'), JSON.stringify({ ...lireObligations1(), version: date }));
writeFileSync(join(SORTIE, 'intro.json'), JSON.stringify({ ...(await lireIntro()), version: date }));

const fichiers = [];
(function parcourir(d) {
  for (const f of readdirSync(d)) {
    const p = join(d, f);
    if (statSync(p).isDirectory()) parcourir(p);
    else if (f !== 'sw.js') fichiers.push(relative(SORTIE, p).split('\\').join('/'));
  }
})(SORTIE);
fichiers.sort();

const empreinte = createHash('sha256');
for (const f of [...fichiers, 'sw.js']) empreinte.update(f).update(readFileSync(join(SORTIE, f)));
const version = empreinte.digest('hex').slice(0, 12);
const liste = ['./', ...fichiers.filter((f) => f !== 'index.html')];
const sw = readFileSync(join(SORTIE, 'sw.js'), 'utf8').replace('__VERSION__', version).replace('__FICHIERS__', JSON.stringify(liste));
writeFileSync(join(SORTIE, 'sw.js'), sw);
writeFileSync(join(SORTIE, '.nojekyll'), '');

const taille = fichiers.reduce((s, f) => s + statSync(join(SORTIE, f)).size, 0);
console.log(`docs/ prêt : ${fichiers.length} fichiers, ${(taille / 1024).toFixed(0)} Ko, version ${version}`);
