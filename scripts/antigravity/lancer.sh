#!/bin/bash
# Lance Antigravity sans intervention, s'il reste une tâche prête dans TACHES.md.
# Appelé par launchd dès que Claude écrit dans .antigravity/sonnette (voir installer.sh).
# Journal : ~/Library/Logs/gdroit-antigravity.log
JOURNAL="$HOME/Library/Logs/gdroit-antigravity.log"
cd "$(dirname "$0")/../.." 2>/dev/null && ls >/dev/null 2>&1 || { echo "$(date '+%d/%m %H:%M') Arrêt : macOS refuse l'accès au dossier du projet (Réglages > Confidentialité > Accès complet au disque : ajouter /bin/bash)." >> "$JOURNAL"; exit 1; }
export PATH="/opt/homebrew/bin:/usr/local/bin:$HOME/.local/bin:$HOME/.npm-global/bin:$PATH"
dire() { echo "$(date '+%d/%m %H:%M') $*" >> "$JOURNAL"; }

git remote get-url origin | grep -q '/gdroit' || { dire "Arrêt : le dossier ne pointe pas vers le dépôt gdroit."; exit 1; }
git checkout -q main && git pull -q --ff-only || { dire "Arrêt : impossible de mettre main à jour (modifications locales ?)."; exit 1; }
[ -z "$(git status --porcelain)" ] || { dire "Arrêt : des modifications non enregistrées traînent dans le dossier."; exit 1; }

# Une tâche est prête quand son statut est exactement « À faire » (pas « attend Gaspard », pas de date future).
if ! grep -q '^- \*\*Statut\*\* : À faire$' TACHES.md; then dire "Sonnette reçue, mais aucune tâche « À faire »."; exit 0; fi
# Un seul Antigravity à la fois.
VERROU=".antigravity/en-cours"
[ -e "$VERROU" ] && { dire "Antigravity tourne déjà."; exit 0; }
touch "$VERROU"; trap 'rm -f "$VERROU"' EXIT

dire "Lancement d'Antigravity."
agy -p "Tâche suivante. Suis AGENTS.md à la lettre : une seule tâche, tests complets avant toute mise en ligne, arrêt et question notée dans TACHES.md au moindre doute. Personne ne te répondra pendant cette exécution." \
  --output-format json >> "$JOURNAL" 2>&1
dire "Fin d'Antigravity (code $?)."
