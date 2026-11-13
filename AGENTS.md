# Consignes permanentes pour Antigravity (projet Gdroit)

Ce fichier est lu automatiquement. Il complète `CLAUDE.md` (règles d'architecture, à respecter aussi).

## Quand Gaspard dit « tâche suivante », « fais les tâches » ou « au travail »
1. `git checkout main && git pull`. Le dépôt doit être `gasparddttk-arch/gdroit` (`git remote -v`). Si c'est `arrets-admin`, corriger d'abord : `git remote set-url origin https://github.com/gasparddttk-arch/gdroit.git`.
2. Ouvrir `TACHES.md`, section « Cahier des charges pour Antigravity ». Prendre la **première** tâche dont le statut est `À faire` et qui n'est ni datée dans le futur ni marquée « attend Gaspard ».
3. Passer son statut à `En cours (Antigravity)` et créer une branche `antigravity/<lettre>-<mot>` (ex. `antigravity/a-tri-l2`).
4. Faire exactement ce que dit la tâche, rien de plus. En cas de doute sur le sens juridique d'un contenu, s'arrêter et écrire la question dans la tâche (ligne « Question pour Claude : … »).
5. Valider : `npm run check`, `npm run build`, puis `NODE_PATH=$(npm root -g) node tests/run.cjs` (plus de 5 minutes). Si un test échoue deux fois de suite, s'arrêter et noter l'erreur dans la tâche.
6. Si tout est vert : commit, push de la branche, merge `--ff-only` sur `main`, push, puis vérifier que https://gdroit.eu/sw.js sert la nouvelle VERSION. Si le merge `--ff-only` échoue parce que `main` a avancé : `git rebase origin/main` ; en cas de conflit dans `docs/`, garder la version de `main` puis refaire `npm run build` ; relancer la suite complète avant de réessayer.
7. Passer le statut à `Fait le JJ/MM (Antigravity)`, ajouter une ligne dans « Dernières actions exécutées par Antigravity », commit et push de `TACHES.md`.
8. Annoncer à Gaspard en deux phrases ce qui a changé, puis passer à la tâche suivante seulement s'il le demande.

## Exécution automatique
Claude te lance directement (`agy -p` via `scripts/antigravity/lancer.sh`) quand il te confie une tâche. Personne ne répond alors : ne pose pas de question, note-la dans `TACHES.md` (« Question pour Claude : … »), passe le statut à `Bloqué` et arrête-toi. Une seule tâche par lancement.

## Interdits
- Pousser quoi que ce soit sur le dépôt `arrets-admin` (il ne sert que la page de déménagement).
- Modifier la base Supabase (tables, fonctions SQL, réglages) ou redéployer une fonction sans l'accord écrit de Gaspard dans la conversation.
- Écrire ou réécrire du contenu juridique (fiches, cas, notions, quiz) : c'est le rôle de Claude. Corriger une faute de frappe signalée est permis.
- Committer un secret (clé, mot de passe, jeton).

## Quand Claude ajoute des tâches
Claude écrit ses consignes dans `TACHES.md` au format « [TÂCHE] » de `CLAUDE.md`, avec une ligne **Statut**. Antigravity ne modifie pas une consigne de Claude ; il ajoute seulement statut, questions et compte rendu.
