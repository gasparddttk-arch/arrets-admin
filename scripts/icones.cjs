// Génère les icônes de l'appli à partir d'un dessin vectoriel.
const { chromium } = require('playwright');
const fs = require('fs'); const path = require('path');
const CIRE = 'M50 3c7-1 10 3 16 5 7 2 13 1 17 7 4 5 2 11 5 16 3 6 9 9 9 17s-5 12-7 18c-2 7 0 13-5 18-5 5-12 3-18 6-6 3-9 8-17 8s-11-5-17-8c-6-3-13-1-18-6-5-5-3-11-5-18C8 60 3 56 3 48s6-11 9-17c3-5 1-11 5-16 4-6 10-5 17-7 6-2 9-6 16-5z';
const police = fs.readFileSync(path.join(__dirname, '../node_modules/@fontsource/bodoni-moda/files/bodoni-moda-latin-700-normal.woff2')).toString('base64');
function page(echelle) {
  let f = '';
  for (let i = 0; i < 13; i++) {
    const deg = 102 + i * 12; const r = deg * Math.PI / 180;
    const x = 60 + 54 * Math.cos(r); const y = 60 + 54 * Math.sin(r); const t = 6.6 - i * 0.16;
    f += `<ellipse cx="${x}" cy="${y}" rx="2.3" ry="${t}" transform="rotate(${deg + 22} ${x} ${y})"/><ellipse cx="${120 - x}" cy="${y}" rx="2.3" ry="${t}" transform="rotate(${-(deg + 22)} ${120 - x} ${y})"/>`;
  }
  return `<!doctype html><style>@font-face{font-family:B;src:url(data:font/woff2;base64,${police})}html,body{margin:0;background:#0E1B45}</style>
  <svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 120 120">
    <rect width="120" height="120" fill="#0E1B45"/>
    <g transform="translate(60 60) scale(${echelle}) translate(-60 -60)">
      <g fill="#E3BD62">${f}</g>
      <g transform="translate(14 14) scale(.92)"><path d="${CIRE}" fill="#B51F2E"/>
      <path d="${CIRE}" fill="none" stroke="rgba(255,255,255,.22)" stroke-width="1.2" transform="translate(50 50) scale(.84) translate(-50 -50)"/>
      <text x="50" y="67" text-anchor="middle" font-family="B" font-weight="700" font-size="50" fill="#fff">A</text></g>
    </g></svg>`;
}
(async () => {
  const b = await chromium.launch();
  const dir = path.join(__dirname, '../app/icons'); fs.mkdirSync(dir, { recursive: true });
  for (const [nom, taille, ech] of [['apple-touch-icon', 180, 0.96], ['icon-192', 192, 0.96], ['icon-512', 512, 0.96], ['icon-maskable', 512, 0.76]]) {
    const p = await b.newPage({ viewport: { width: 1024, height: 1024 }, deviceScaleFactor: taille / 1024 });
    await p.setContent(page(ech)); await p.evaluate(() => document.fonts.ready);
    await p.waitForTimeout(150);
    await p.screenshot({ path: path.join(dir, nom + '.png') });
    await p.close();
  }
  await b.close();
})();
