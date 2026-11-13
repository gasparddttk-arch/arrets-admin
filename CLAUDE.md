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
   - Tout ce qui est réservé à l'admin se vérifie côté serveur (fonction SQL avec `est_admin()`, ou contrôle dans l'edge function), jamais seulement en cachant un bouton.
   - La table `notifications` n'accepte aucune insertion directe depuis l'appli : on passe par une fonction SQL (`admin_notifier` pour l'admin).
4. **Mise en ligne** :
   - `npm run check` ne vérifie que le contenu. Avant tout merge sur `main` : `npm run build`, puis la suite complète `NODE_PATH=$(npm root -g) node tests/run.cjs --parallele` (environ 8 minutes en 3 groupes parallèles ; `--seul <mot>` pour ne lancer qu'une partie pendant le travail ; mascotte-perso est parfois instable, relancer).
   - Fusionner sur `main` publie l'appli (GitHub Pages, dossier `docs/`), pas les fonctions Supabase : une modification de `supabase/functions/*` se redéploie à part.
   - Vérifier en ligne que `docs/sw.js` (VERSION) est bien servi sur https://gdroit.eu/sw.js.
5. **Adresse et dépôts (depuis le 13/11/2026)** :
   - Le dépôt de l'appli s'appelle `gasparddttk-arch/gdroit` et publie https://gdroit.eu (domaine OVH, DNS vers GitHub Pages, fichier `docs/CNAME` écrit par le build).
   - Le dépôt `gasparddttk-arch/arrets-admin` n'est plus l'appli : il sert seulement la page « Gdroit a déménagé » à l'ancienne adresse github.io. Ne rien y pousser d'autre.
   - Sur une copie locale ancienne : `git remote set-url origin https://github.com/gasparddttk-arch/gdroit.git`.

---

## Partage du travail (sans que Gaspard serve d'intermédiaire)
Quand Gaspard donne une demande, Claude la découpe lui-même :
- **Claude garde** : contenu juridique et pédagogique, choix de conception, textes visibles par les étudiants, Supabase, sécurité, tout ce qui est ambigu ou demande l'avis de Gaspard.
- **Claude délègue à Antigravity** : ce qui est long mais mécanique et entièrement spécifié (code mort, tests à écrire, application d'une consigne précise, CSS décrit, série complète de tests). Claude garde le merge et la mise en ligne.
- Pour déléguer : écrire la tâche dans `TACHES.md` (format ci-dessous, `- **Statut** : À faire`), la pousser sur `main` du dépôt gdroit, puis écrire la date dans `.antigravity/sonnette` sur le Mac (`date > $HOME/mnt/Desktop/arrets-admin-main/.antigravity/sonnette` via device_bash). Antigravity démarre aussitôt.
- Pour le résultat : relire `TACHES.md` sur le Mac (statut, compte rendu, questions) et `~/Library/Logs/gdroit-antigravity.log`. Une tâche « Bloqué » revient à Claude.
- Antigravity ne pousse jamais et ne committe pas `docs/`. Ses tâches s'empilent sur `antigravity/lot`. Pour publier : sur le Mac, `git bundle create ~/Desktop/arrets-admin-main/.antigravity/lot.bundle origin/main..antigravity/lot` (device_bash), `device_stage_files`, puis ici `git fetch <bundle> antigravity/lot`, relire chaque commit, merger sur `main`, `npm run build`, une seule suite complète pour le lot, push.
- Les commits qui ne touchent que `TACHES.md`, `AGENTS.md`, `CLAUDE.md` ou `scripts/antigravity/` ne demandent pas la suite complète.
- Claude dit à Gaspard en une ligne ce qu'il a délégué.
- **Suivi automatique** : après chaque sonnette, Claude programme un rappel dans cette conversation (`send_later`, environ 1 h 15, jamais plus de 2 h). À chaque rappel : relire l'état du Mac (branches `antigravity/*`, statuts, `.antigravity/en-cours`), publier les tâches « Prêt pour Claude », traiter les « Bloqué », refaire sonner si la session s'est arrêtée alors qu'il reste des tâches « À faire », puis reprogrammer le rappel suivant tant qu'il reste du travail. Prévenir Gaspard en une ligne de ce qui a été publié (`SendUserMessage`, et `PushNotification` pour qu'il le reçoive sur son téléphone).

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
