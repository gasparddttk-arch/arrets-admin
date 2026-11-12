# Guide de collaboration Claude (Architecte) & Antigravity (Exécutant)

## Rôles respectifs
- **Claude (Architecte / Pédagogue)** :
  - Conception pédagogique, rigueur juridique (Assas L1/L2), ton sobre, choix des jeux.
  - Rédaction des spécifications et consignes de code pour Antigravity.
  - Spécification des contenus (cours, arrêts, notions, quiz).
- **Antigravity (Agent d'exécution local)** :
  - Modification directe des fichiers sur la machine de Gaspard.
  - Validation du contenu (`npm run check`).
  - Compilation et mise à jour du Service Worker (`npm run build`).
  - Tests automatisés (Playwright).
  - Gestion des branches Git et déploiements vers GitHub Pages.

---

## Règles de développement et d'architecture
1. **Stack technique** :
   - Vanilla JS (ES Modules). Le DOM est exclusivement construit via la fonction `h()` (`app/js/ui.js`).
   - Un seul fichier CSS : `app/css/app.css` (tokens déclarés dans `:root`).
   - Pas de framework, pas de dépendances superflues.
   - Ton de l'interface : sobre, précis, sans tournures artificielles ou style « IA ».
2. **Contenu & Données** :
   - L2 : Fichiers texte dans `content/` parsés par `scripts/parse.mjs`.
   - L1 : `content/intro.mjs` (objets JS transformés en `intro.json` par `lireIntro()`).
3. **Sécurité et Secrets** :
   - Ne jamais committer de secrets ou clés privées dans Git.
   - Les modifications en base de données Supabase nécessitent la validation explicite de Gaspard.

---

## Format d'une consigne Claude pour Antigravity
Lorsque Claude souhaite faire exécuter une tâche à Antigravity, il peut formuler son brief ainsi :

```markdown
### [TÂCHE] Titre court de la tâche
- **Fichiers concernés** : ex. `content/intro.mjs`, `app/js/jeux-l1.js`
- **Objectif** : Ce qu'il faut accomplir
- **Détails de modification** :
  - Remplacer X par Y / Ajouter la fonction Z
- **Contraintes** :
  - Conserver le style Vanilla JS / h()
- **Validation attendue** :
  - `npm run check` et `npm run build` sans erreur.
```

Antigravity prendra ce bloc, exécutera les modifications sur les fichiers réels, validera le build et livrera le résultat prêt pour test.
