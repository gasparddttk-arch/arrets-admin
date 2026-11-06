# Fabrique les skins du hibou depuis scripts/sources/skins/ : détourage, retouche du Survêt,
# et trois images du 6-7 qui partagent exactement le même corps.
from pathlib import Path
import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from scipy import ndimage as ni

RACINE = Path(__file__).resolve().parent.parent
SRC = RACINE / 'scripts/sources/skins'
SORTIE = RACINE / 'app/img/skins'
SORTIE.mkdir(parents=True, exist_ok=True)
FINAL = 800

# Fonds enfermés dans le dessin, à vider : le blanc le plus proche de chaque point. Coordonnées sur les sources, en 2048.
TROUS = {
    'bosslady': [(1115, 1246), (685, 1288)],
    'nana': [(1524, 1361), (609, 1181)],
    'loco': [(522, 1179)],
    'noel': [(520, 622), (512, 1474), (550, 794)],
    '67-droite': [(949, 305)],
    '67-gauche': [(844, 317), (1170, 283)],
    '67-deux': [(951, 305)],
}


# Le bonnet de Noël est presque aussi blanc que le fond.
SEUIL = {'noel': 252}


def lire(nom):
    return np.array(Image.open(SRC / f'{nom}.jpg').convert('RGB')).astype(np.float32)


def alpha_de(a, nom):
    blanc = a.min(axis=2) >= SEUIL.get(nom, 236)
    l, _ = ni.label(blanc)
    bords = set(np.unique(l[0])) | set(np.unique(l[-1])) | set(np.unique(l[:, 0])) | set(np.unique(l[:, -1]))
    bords.discard(0)
    fond = np.isin(l, list(bords))
    ys, xs = np.nonzero(blanc & ~fond)
    for x, y in TROUS.get(nom, []):
        i = np.argmin((xs - x) ** 2 + (ys - y) ** 2)
        fond |= l == l[ys[i], xs[i]]
    plein = ni.binary_erosion(~fond, iterations=4 if nom in SEUIL else 2)
    return ni.gaussian_filter(plein.astype(np.float32), 0.9)


def ecrire(rgb, alpha, nom):
    o = np.dstack([np.clip(rgb, 0, 255), np.clip(alpha, 0, 1) * 255]).astype(np.uint8)
    im = Image.fromarray(o, 'RGBA').convert('RGBa').resize((FINAL, FINAL), Image.LANCZOS).convert('RGBA')
    im.save(SORTIE / f'{nom}.webp', quality=84, alpha_quality=90, method=6)


def combler(a, x1, y1, x2, y2):
    """Remplace un rectangle par un dégradé tiré de ses quatre bords."""
    h, w = y2 - y1, x2 - x1
    bande = 4
    g = a[y1:y2, x1 - bande:x1].mean(axis=1)
    d = a[y1:y2, x2:x2 + bande].mean(axis=1)
    t = a[y1 - bande:y1, x1:x2].mean(axis=0)
    b = a[y2:y2 + bande, x1:x2].mean(axis=0)
    u = np.linspace(0, 1, w)[None, :, None]
    v = np.linspace(0, 1, h)[:, None, None]
    horiz = g[:, None, :] * (1 - u) + d[:, None, :] * u
    vert = t[None, :, :] * (1 - v) + b[None, :, :] * v
    a[y1:y2, x1:x2] = (horiz + vert) / 2


def poser(a, dessin, gauche, haut):
    """Colle une image RGBA sur le tableau."""
    d = np.array(dessin).astype(np.float32)
    h, w = d.shape[:2]
    m = d[..., 3:4] / 255
    z = a[haut:haut + h, gauche:gauche + w]
    a[haut:haut + h, gauche:gauche + w] = z * (1 - m) + d[..., :3] * m


def ecusson(cote=84, k=6):
    """Petit hibou brodé, là où était le crocodile."""
    s = cote * k
    forme = Image.new('L', (s, s), 0)
    d = ImageDraw.Draw(forme)
    c = s / 2
    d.ellipse((c - s * .33, s * .2, c + s * .33, s * .9), fill=255)
    d.polygon([(c - s * .32, s * .46), (c - s * .3, s * .1), (c - s * .08, s * .26)], fill=255)
    d.polygon([(c + s * .32, s * .46), (c + s * .3, s * .1), (c + s * .08, s * .26)], fill=255)
    tour = forme.filter(ImageFilter.MaxFilter(2 * k * 2 + 1))
    o = Image.new('RGBA', (s, s), (0, 0, 0, 0))
    o.paste((250, 250, 244, 255), mask=tour)
    o.paste((20, 74, 46, 255), mask=forme)
    d = ImageDraw.Draw(o)
    for sens in (-1, 1):
        x = c + sens * s * .135
        y = s * .47
        r = s * .115
        d.ellipse((x - r, y - r, x + r, y + r), fill=(250, 250, 244, 255))
        r2 = s * .05
        d.ellipse((x - r2, y - r2, x + r2, y + r2), fill=(18, 40, 30, 255))
    d.polygon([(c - s * .05, s * .56), (c + s * .05, s * .56), (c, s * .66)], fill=(240, 170, 60, 255))
    for rang in (.72, .79):
        for dx in (-.14, -.05, .05, .14):
            x = c + dx * s
            d.line((x - s * .025, s * rang, x, s * (rang + .03), x + s * .025, s * rang), fill=(120, 170, 130, 255), width=k)
    return o.resize((cote, cote), Image.LANCZOS)


def plume(long=74, larg=30, angle=33, miroir=False, k=6):
    """Une plume claire sur le flanc de la basket."""
    L, l = long * k, larg * k
    cote = int(long * 1.25) * k
    o = Image.new('RGBA', (cote, cote), (0, 0, 0, 0))
    d = ImageDraw.Draw(o)
    cx, cy = cote / 2, cote / 2
    bord = []
    for t in np.linspace(0, 1, 40):
        bord.append((cx - L / 2 + L * t, cy - l / 2 * np.sin(np.pi * t ** .8)))
    for t in np.linspace(1, 0, 40):
        bord.append((cx - L / 2 + L * t, cy + l / 2 * np.sin(np.pi * t ** .8)))
    d.polygon(bord, fill=(244, 246, 250, 255), outline=(52, 92, 150, 255), width=k + 2)
    d.line((cx - L * .68, cy, cx + L * .46, cy), fill=(52, 92, 150, 255), width=k + 2)
    for t in (.3, .45, .6):
        x = cx - L / 2 + L * t
        for sens in (-1, 1):
            d.line((x, cy, x + L * .08, cy + sens * l * .34), fill=(140, 165, 200, 255), width=k)
    o = o.rotate(angle, resample=Image.BICUBIC)
    if miroir:
        o = o.transpose(Image.FLIP_LEFT_RIGHT)
    return o.resize((cote // k, cote // k), Image.LANCZOS)


def retirer_gris(a, x1, y1, x2, y2):
    """Efface ce qui n'est pas bleu dans le cadre, en reprenant le dessin autour."""
    z = a[y1:y2, x1:x2]
    m = (z[..., 2] - z[..., 0]) < 34
    m = ni.binary_dilation(m, iterations=5)
    u = np.clip(z, 0, 255).astype(np.uint8)
    r = cv2.inpaint(u, (m * 255).astype(np.uint8), 5, cv2.INPAINT_TELEA)
    a[y1:y2, x1:x2] = r.astype(np.float32)


def survet():
    a = lire('survet')
    alpha = alpha_de(a, 'survet')
    combler(a, 1178, 1096, 1298, 1178)
    poser(a, ecusson(), 1194, 1094)
    retirer_gris(a, 815, 1672, 900, 1738)
    retirer_gris(a, 1186, 1670, 1264, 1734)
    p = plume()
    poser(a, p, 856 - p.width // 2, 1704 - p.height // 2)
    p = plume(miroir=True)
    poser(a, p, 1224 - p.width // 2, 1702 - p.height // 2)
    ecrire(a, alpha, 'survet')


def ajuster(source, modele, sur):
    """Ramène les couleurs de source sur celles de modele, sur les zones communes."""
    return source + np.median((modele - source)[sur], axis=0)


def bras(base, autre):
    """Pose sur base les seules zones qui changent vraiment dans autre : les bras."""
    ecart = np.abs(base - autre).max(axis=2)
    gros = ni.binary_opening(ecart > 46, iterations=3)
    l, n = ni.label(gros)
    tailles = ni.sum(gros, l, range(1, n + 1))
    garde = np.isin(l, [i + 1 for i, t in enumerate(tailles) if t > 2500])
    garde = ni.binary_closing(ni.binary_dilation(garde, iterations=12), iterations=10)
    return ni.gaussian_filter(garde.astype(np.float32), 5)


def six_sept():
    a = lire('67-droite')
    aa = alpha_de(a, '67-droite')
    ecrire(a, aa, '67-droite')
    for nom, sortie in (('67-gauche', '67-gauche'), ('67-deux', '67-deux')):
        b = lire(nom)
        ab = alpha_de(b, nom)
        commun = (aa > .99) & (ab > .99) & (np.abs(a - b).max(axis=2) < 40)
        b = ajuster(b, a, commun)
        m = bras(a * aa[..., None] + 255 * (1 - aa[..., None]), b * ab[..., None] + 255 * (1 - ab[..., None]))
        rgb = a * (1 - m[..., None]) + b * m[..., None]
        # Là où le fond d'une image est le bras de l'autre, on garde les couleurs franches.
        rgb = np.where((aa[..., None] < .5) & (ab[..., None] >= .5), b, rgb)
        rgb = np.where((ab[..., None] < .5) & (aa[..., None] >= .5), a, rgb)
        al = aa * (1 - m) + ab * m
        ecrire(rgb, al, sortie)


for nom in ('goumin', 'bosslady', 'loco', 'nana', 'alcoolique', 'tung', 'noel'):
    x = lire(nom)
    ecrire(x, alpha_de(x, nom), nom)
survet()
six_sept()
