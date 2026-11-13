# Consignes permanentes pour Antigravity (projet Gdroit)

Ce fichier est lu automatiquement. Il complète `CLAUDE.md` (règles d'architecture, à respecter aussi).

## Quand Gaspard dit « tâche suivante », « fais les tâches » ou « au travail »
1. `git checkout main && git pull`. Le dépôt doit être `gasparddttk-arch/gdroit` (`git remote -v`). Si c'est `arrets-admin`, corriger d'abord : `git remote set-url origin https://github.com/gasparddttk-arch/gdroit.git`.
2. Ouvrir `TACHES.md`. Prendre la **première** tâche dont la ligne de statut est exactement `- **Statut** : À faire` et pour laquelle aucune branche locale `antigravity/<lettre>-…` n'existe déjà (`git branch --list 'antigravity/*'`).
3. Créer une branche `antigravity/<lettre>-<mot>` **à partir de `main`** (ex. `antigravity/f-banc`).
4. Faire exactement ce que dit la tâche, rien de plus. En cas de doute sur le sens juridique d'un contenu, s'arrêter et écrire la question dans la tâche (ligne « Question pour Claude : … »).
5. Valider : `npm run check`, `npm run build`, puis `NODE_PATH=$(npm root -g) node tests/run.cjs`. Si un test échoue deux fois de suite, s'arrêter et noter l'erreur dans la tâche.
6. **Ne jamais pousser ni merger.** Antigravity n'a pas d'accès en écriture à GitHub : c'est Claude qui récupère la branche sur le Mac et publie. Commit sur la branche uniquement.
7. Sur la branche, passer le statut à `Prêt pour Claude (antigravity/<lettre>-<mot>, suite verte le JJ/MM à HHhMM sur <commit court>)`, ajouter une ligne dans « Dernières actions exécutées par Antigravity », commit.
8. Revenir sur `main` à jour (`git checkout main && git pull --ff-only`) et enchaîner sur la tâche prête suivante (retour à l'étape 2). S'arrêter quand il n'y en a plus, puis résumer à Gaspard en deux phrases.

## Exécution automatique
Claude te lance directement (`agy -p` via `scripts/antigravity/lancer.sh`) quand il te confie une tâche. Personne ne répond alors : ne pose pas de question, note-la dans `TACHES.md` (« Question pour Claude : … »), passe le statut à `Bloqué` et arrête-toi. Enchaîne les tâches prêtes, chacune sur sa branche partie de `main`, puis arrête-toi.

## Interdits
- Pousser quoi que ce soit sur le dépôt `arrets-admin` (il ne sert que la page de déménagement).
- Modifier la base Supabase (tables, fonctions SQL, réglages) ou redéployer une fonction sans l'accord écrit de Gaspard dans la conversation.
- Écrire ou réécrire du contenu juridique (fiches, cas, notions, quiz) : c'est le rôle de Claude. Corriger une faute de frappe signalée est permis.
- Committer un secret (clé, mot de passe, jeton).

## Quand Claude ajoute des tâches
Claude écrit ses consignes dans `TACHES.md` au format « [TÂCHE] » de `CLAUDE.md`, avec une ligne **Statut**. Antigravity ne modifie pas une consigne de Claude ; il ajoute seulement statut, questions et compte rendu.
