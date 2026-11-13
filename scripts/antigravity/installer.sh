#!/bin/bash
# À lancer une fois dans le Terminal du Mac : bash ~/Desktop/arrets-admin-main/scripts/antigravity/installer.sh
# Fait démarrer lancer.sh dès que Claude écrit dans .antigravity/sonnette. Aucun passage programmé.
set -e
ICI="$(cd "$(dirname "$0")" && pwd)"
command -v agy >/dev/null || { echo "La commande agy (Antigravity CLI) est introuvable : installe-la, puis lance « agy » une fois pour te connecter."; exit 1; }
chmod +x "$ICI/lancer.sh"

# Autorisations limitées : git, npm, node et les fichiers du projet. Rien d'autre sans demande.
REGLAGES="$HOME/.gemini/antigravity-cli/settings.json"
mkdir -p "$(dirname "$REGLAGES")"
PROJET="$(cd "$ICI/../.." && pwd)"
python3 - "$REGLAGES" "$PROJET" <<'PY'
import json, os, sys
chemin, projet = sys.argv[1], sys.argv[2]
r = json.load(open(chemin)) if os.path.exists(chemin) else {}
allow = r.setdefault('permissions', {}).setdefault('allow', [])
for regle in ['command(git)', 'command(npm)', 'command(node)', 'command(curl)', 'command(regex:NODE_PATH=.* node tests/run\\.cjs)', f'write_file({projet}/)']:
    if regle not in allow: allow.append(regle)
json.dump(r, open(chemin, 'w'), indent=2)
print('Autorisations Antigravity :', ', '.join(allow))
PY

mkdir -p "$PROJET/.antigravity" && touch "$PROJET/.antigravity/sonnette"
PLIST="$HOME/Library/LaunchAgents/eu.gdroit.antigravity.plist"
mkdir -p "$HOME/Library/LaunchAgents"
cat > "$PLIST" <<PL
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>Label</key><string>eu.gdroit.antigravity</string>
  <key>ProgramArguments</key><array><string>/bin/bash</string><string>$ICI/lancer.sh</string></array>
  <key>WatchPaths</key><array><string>$PROJET/.antigravity/sonnette</string></array>
  <key>StandardOutPath</key><string>$HOME/Library/Logs/gdroit-antigravity.log</string>
  <key>StandardErrorPath</key><string>$HOME/Library/Logs/gdroit-antigravity.log</string>
</dict></plist>
PL
launchctl bootout "gui/$(id -u)/eu.gdroit.antigravity" 2>/dev/null || true
launchctl bootstrap "gui/$(id -u)" "$PLIST"
echo "C'est en place : Antigravity démarrera quand Claude lui confiera une tâche."
echo "Journal : ~/Library/Logs/gdroit-antigravity.log"
echo "Pour arrêter : launchctl bootout gui/$(id -u)/eu.gdroit.antigravity"
