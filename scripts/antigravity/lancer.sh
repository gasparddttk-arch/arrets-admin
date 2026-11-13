#!/bin/bash
# Lance Antigravity sans intervention, s'il reste une tâche prête dans TACHES.md.
# Appelé chaque jour par launchd (voir installer.sh). Journal : ~/Library/Logs/gdroit-antigravity.log
cd "$(dirname "$0")/../.." || exit 1
export PATH="/opt/homebrew/bin:/usr/local/bin:$HOME/.local/bin:$HOME/.npm-global/bin:$PATH"
JOURNAL="$HOME/Library/Logs/gdroit-antigravity.log"
dire() { echo "$(date '+%d/%m %H:%M') $*" >> "$JOURNAL"; }

git remote get-url origin | grep -q '/gdroit' || { dire "Arrêt : le dossier ne pointe pas vers le dépôt gdroit."; exit 1; }
git checkout -q main && git pull -q --ff-only || { dire "Arrêt : impossible de mettre main à jour (modifications locales ?)."; exit 1; }
[ -z "$(git status --porcelain)" ] || { dire "Arrêt : des modifications non enregistrées traînent dans le dossier."; exit 1; }

# Une tâche est prête quand son statut est exactement « À faire » (pas « attend Gaspard », pas de date future).
if ! grep -q '^- \*\*Statut\*\* : À faire$' TACHES.md; then dire "Rien à faire aujourd'hui."; exit 0; fi

dire "Lancement d'Antigravity."
agy -p "Tâche suivante. Suis AGENTS.md à la lettre : une seule tâche, tests complets avant toute mise en ligne, arrêt et question notée dans TACHES.md au moindre doute. Personne ne te répondra pendant cette exécution." \
  --output-format json >> "$JOURNAL" 2>&1
dire "Fin d'Antigravity (code $?)."
