# Fabrique les icônes de l'appli depuis scripts/sources/chouette.jpg.
from pathlib import Path
from PIL import Image

RACINE = Path(__file__).resolve().parent.parent
source = Image.open(RACINE / 'scripts/sources/chouette.jpg').convert('RGB')
# Le fond de la source est presque blanc : on le ramène à un blanc uni.
source = source.point(lambda v: min(255, round(v * 255 / 248)))
CENTRE = (965, 914)

def icone(cote_source, taille, nom):
    x, y = CENTRE
    m = cote_source // 2
    image = source.crop((x - m, y - m, x + m, y + m)).resize((taille, taille), Image.LANCZOS)
    image.save(RACINE / 'app/icons' / nom, optimize=True)

icone(1340, 180, 'apple-touch-icon.png')
icone(1340, 192, 'icon-192.png')
icone(1340, 512, 'icon-512.png')
icone(1600, 512, 'icon-maskable.png')  # marge pour la zone sûre des icônes adaptatives
