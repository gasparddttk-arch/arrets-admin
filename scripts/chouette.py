# Fabrique les images de la chouette depuis scripts/sources/chouette/ :
# poses détourées, livre rose, robe rouge, accessoires, et les repères des yeux pour app/js/chouette-reperes.js.
import json
from pathlib import Path
import numpy as np
from PIL import Image
from scipy import ndimage as ni

RACINE = Path(__file__).resolve().parent.parent
SRC = RACINE / 'scripts/sources/chouette'
SORTIE = RACINE / 'app/img/chouette'
SORTIE.mkdir(parents=True, exist_ok=True)
for f in SORTIE.glob('*.webp'):
    f.unlink()

COTE = 1400  # côté des sources
FINAL = 640  # côté des images publiées
ECHELLE = COTE / 1000
POSES = ['debout', 'clin', 'tribune', 'reflexion', 'piles', 'marteau', 'notes', 'tableau', 'serment', 'lunettes', 'balance', 'echelle', 'assise', 'pause']
# Fonds enfermés dans le dessin, à vider. Coordonnées sur 1000.
TROUS = {
    'echelle': [(510, 701), (610, 765), (408, 776), (511, 779), (413, 708), (512, 823), (441, 816)],
    'balance': [(144, 618), (184, 618), (199, 563)],
    'tableau': [(700, 627)],
}
ROSE = np.array([0xC2, 0x46, 0x6E], float)
ROUGE = np.array([0xA8, 0x1E, 0x2E], float)


def lire(nom):
    return np.array(Image.open(SRC / f'{nom}.jpg').convert('RGB')).astype(np.float32)


def fond(a):
    blanc = a.min(axis=2) >= 238
    l, _ = ni.label(blanc)
    bords = set(np.unique(l[0])) | set(np.unique(l[-1])) | set(np.unique(l[:, 0])) | set(np.unique(l[:, -1]))
    bords.discard(0)
    return blanc, l, np.isin(l, list(bords))


def alpha_de(masque_fond):
    plein = ni.binary_erosion(~masque_fond, iterations=2)
    return ni.gaussian_filter(plein.astype(np.float32), 0.9)


def ecrire(rgb, alpha, nom, cote=FINAL, q=82):
    o = np.dstack([np.clip(rgb, 0, 255), np.clip(alpha, 0, 1) * 255]).astype(np.uint8)
    im = Image.fromarray(o, 'RGBA').convert('RGBa').resize((cote, cote) if isinstance(cote, int) else cote, Image.LANCZOS).convert('RGBA')
    im.save(SORTIE / f'{nom}.webp', quality=q, alpha_quality=90, method=6)


def teinte(a):
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    return r, g, b, a.max(axis=2), a.min(axis=2)


reperes = {}
for nom in POSES:
    a = lire(nom)
    blanc, l, f = fond(a)
    for x, y in TROUS.get(nom, []):
        i = l[int(y * ECHELLE), int(x * ECHELLE)]
        if i:
            f |= l == i
    al = alpha_de(f)
    ecrire(a, al, nom)

    # Les yeux : deux grandes zones blanches enfermées, à la même hauteur.
    tailles = ni.sum(blanc & ~f, l, range(1, l.max() + 1))
    yeux = []
    mini = 3500 * ECHELLE ** 2
    for i, s in enumerate(tailles, 1):
        if s >= mini:
            ys, xs = np.where(l == i)
            if ys.mean() < 500 * ECHELLE and xs.max() - xs.min() < 170 * ECHELLE:
                yeux.append({'x': round(float(xs.mean()) / ECHELLE), 'y': round(float(ys.mean()) / ECHELLE), 'rx': round(float(xs.max() - xs.min()) / 2 / ECHELLE), 'ry': round(float(ys.max() - ys.min()) / 2 / ECHELLE)})
    yeux.sort(key=lambda e: e['x'])
    # Plumage autour de l'œil, pour la paupière.
    e = yeux[0]
    px = a[int(e['y'] * ECHELLE), int((e['x'] - e['rx'] - 12) * ECHELLE)]
    repere = {'yeux': yeux, 'peau': '#%02x%02x%02x' % tuple(int(v) for v in px)}

    r, g, b, ma, mi = teinte(a)
    plein = al > 0.5
    # Le livre bleu devient rose ; le blanc du titre et les pages ne bougent pas.
    bleu = (b - r > 14) & (b >= g) & plein
    if bleu.sum() > 2000:
        v = ma / max(np.median(ma[bleu]), 1)
        rose = np.clip(ROSE[None, None, :] * v[..., None], 0, 255)
        force = np.clip((b - r - 6) / 24, 0, 1)
        sortie = a + (rose - a) * force[..., None]
        zone = ni.gaussian_filter(ni.binary_dilation(bleu, iterations=2).astype(np.float32), 0.8)
        ecrire(sortie, np.minimum(zone, al), f'{nom}-livre', q=78)
        repere['livre'] = 1

    # La robe devient rouge : seul le tissu sombre, sans les yeux ni les traits fins.
    sombre = (ma < 100) & (ma - mi < 26) & ~(b - r > 8) & plein
    for o in yeux:
        yy, xx = np.ogrid[:COTE, :COTE]
        sombre &= ((xx - o['x'] * ECHELLE) / ((o['rx'] + 6) * ECHELLE)) ** 2 + ((yy - o['y'] * ECHELLE) / ((o['ry'] + 6) * ECHELLE)) ** 2 > 1
    if nom == 'tableau':  # le chevalet est sombre lui aussi
        sombre[int(620 * ECHELLE):, int(500 * ECHELLE):] = False
        sombre[:, int(600 * ECHELLE):] = False
    if nom == 'lunettes':  # la monture aussi
        sombre[int(250 * ECHELLE):int(445 * ECHELLE), int(320 * ECHELLE):int(700 * ECHELLE)] = False
    if nom == 'clin':  # l'œil fermé aussi
        sombre[int(290 * ECHELLE):int(410 * ECHELLE), int(330 * ECHELLE):int(480 * ECHELLE)] = False
    ouvert = ni.binary_opening(sombre, iterations=5)
    ll, n = ni.label(ouvert)
    robe = np.zeros_like(sombre)
    if n:
        ts = ni.sum(ouvert, ll, range(1, n + 1))
        robe = np.isin(ll, [i + 1 for i, t in enumerate(ts) if t > 300 * ECHELLE ** 2])
    robe = ni.binary_dilation(robe, iterations=7) & sombre | ni.binary_dilation(robe, iterations=3) & (ma < 150) & (ma - mi < 40)
    lum = a.mean(axis=2)
    ref = max(np.median(lum[robe]), 1)
    rouge = ROUGE[None, None, :] * (lum / ref)[..., None] ** 1.25
    zone = ni.gaussian_filter(robe.astype(np.float32), 0.9)
    ecrire(rouge, np.minimum(zone, al), f'{nom}-robe', q=78)
    reperes[nom] = repere
    print(nom, yeux and len(yeux), repere['peau'], 'bleu', int(bleu.sum()), 'robe', int(robe.sum()))

# Accessoires, recadrés au plus juste.
def accessoire(nom, largeur, regler=None, hauteur=None):
    a = lire(nom)
    blanc, l, f = fond(a)
    al = alpha_de(f)
    if regler:
        a, al = regler(a, al, blanc, l)
    ys, xs = np.where(al > 0.05)
    h0, h1, g0, g1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    a, al = a[h0:h1, g0:g1], al[h0:h1, g0:g1]
    H = hauteur or round(largeur * a.shape[0] / a.shape[1])
    ecrire(a, al, f'acc-{nom}', (largeur, H), q=84)
    return round(H / largeur, 3)


def lunettes(a, al, blanc, l):
    # Les verres sont vides, et les branches vues à travers disparaissent.
    tailles = ni.sum(blanc, l, range(1, l.max() + 1))
    h, w = al.shape
    yy, xx = np.ogrid[:h, :w]
    for x, y in ((286, 496), (709, 496)):
        i = l[int(y * ECHELLE), int(x * ECHELLE)]
        ys, xs = np.where(l == i)
        cx, cy = (xs.min() + xs.max()) / 2, (ys.min() + ys.max()) / 2
        r = max(xs.max() - xs.min(), ys.max() - ys.min()) / 2 - 1
        al[(xx - cx) ** 2 + (yy - cy) ** 2 < r ** 2] = 0
    # La moitié droite, abîmée sur la source, reprend la gauche.
    m = w // 2
    a[:, m:] = a[:, :m][:, ::-1][:, :w - m]
    al[:, m:] = al[:, :m][:, ::-1][:, :w - m]
    return a, al


rapports = {
    'toque': accessoire('toque', 360, hauteur=190),
    'lun_acc': accessoire('lun_acc', 360, lunettes),
    'laurier': accessoire('laurier', 420),
    'epitoge': accessoire('epitoge', 200),
}

(RACINE / 'app/js/chouette-reperes.js').write_text(
    "// Fichier créé par scripts/chouette.py : position des yeux et couleur du plumage, sur une image de 1000 de côté.\n"
    f"export const REPERES = {json.dumps(reperes, ensure_ascii=False)};\n"
    f"export const RAPPORTS = {json.dumps(rapports)};\n", encoding='utf8')
total = sum(f.stat().st_size for f in SORTIE.glob('*.webp'))
print(len(list(SORTIE.glob('*.webp'))), 'images,', total // 1024, 'Ko')
