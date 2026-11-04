# Arrêts

Appli installable pour réviser les arrêts de droit administratif en jouant, sans réseau.

- `content/` : le contenu, en texte simple (arrêts, faux jumeaux, cas du juge, sujets).
- `app/` : le code de l'appli.
- `docs/` : la version publiée, générée par `npm run build`. GitHub Pages sert ce dossier.
- `scripts/check.mjs` : le contrôle du contenu et des règles anti-devinette.
- `tests/run.cjs` : les tests sur écran d'iPhone, mode avion compris.

Ajouter des arrêts : compléter `content/`, puis lancer `npm run check`, `npm run build` et `npm test`. La progression se conserve, car elle dépend des identifiants d'arrêts.
