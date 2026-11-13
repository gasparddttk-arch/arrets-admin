# GDROIT : Journal et relais des tâches (Claude ↔ Antigravity)

Ce fichier sert de carnet de transmission entre **Claude** (qui conçoit et briefe) et **Antigravity** (qui exécute, teste et valide sur la machine).

---

## Cahier des charges pour Antigravity (13/11/2026)

Antigravity : voir `AGENTS.md` pour la marche à suivre. À faire dans l'ordre. Chaque tâche se fait sur sa propre branche, puis `npm run check`, `npm run build` et la suite complète (`NODE_PATH=$(npm root -g) node tests/run.cjs`) avant tout merge sur `main`. Vérifier ensuite la VERSION servie sur https://gdroit.eu/sw.js. Le dépôt est `gasparddttk-arch/gdroit` : ne jamais pousser l'appli sur `arrets-admin` (page de déménagement seulement).

### [TÂCHE A] Retirer le code mort du tri L2
- **Statut** : Fait le 13/11 (Antigravity, publié par Claude)
- **Fichiers concernés** : `app/js/jeux-l1.js` (fonction `jouerTri`), `app/css/app.css` (bloc « Le tri en L2 », classes `.tri-l2`, `.tri-sur`)
- **Objectif** : le tri L2 a été remplacé par le grand rangement ; `jouerTri` ne sert plus qu'à la L1.
- **Détails de modification** :
  - Dans `jouerTri`, supprimer tout ce qui dépend de `l2` (`round.bords`, `COTES`, `parCote` peut rester pour la L1, `tri-l2`, tampon « Rangé », récapitulatif « Le classement », `c.s`, `ctx.noter`). Garder exactement le comportement L1 d'avant (bords droit, morale, religion, convenance).
  - Supprimer le bloc CSS `.tri-l2` et `.tri-sur`.
- **Contraintes** : ne pas toucher `jouerRangement` (il sert la L1 et la L2).
- **Validation attendue** : `npm run check`, `npm run build`, suite complète verte (blocs « L1 ok », « L1 équipe 2 ok »).

### [TÂCHE B] Test automatique de l'annonce aux testeurs
- **Statut** : Fait le 13/11 (Antigravity, publié par Claude)
- **Fichiers concernés** : `tests/run.cjs` (bloc du compte simulé, fonction `simuler`)
- **Objectif** : vérifier l'écran Administration > « Mise à jour de l'application ».
- **Détails de modification** :
  - Dans le faux serveur, répondre à l'appel `rpc/admin_notifier` en gardant le corps reçu.
  - Ouvrir l'admin avec un compte `acces: 'admin'`, modifier le texte du champ, toucher « Notifier les testeurs ».
  - Vérifier que le corps envoyé contient `genre: 'maj_appli'`, le texte saisi et `url: 'https://gdroit.eu/'`.
- **Validation attendue** : nouveau `log('annonce admin ok')`, suite complète verte.

### [TÂCHE C] Corrections iPhone des jeux L1 (attend les retours de Gaspard)
- **Statut** : À faire, attend les retours iPhone de Gaspard
- **Fichiers concernés** : `app/js/jeux-l1.js`, `app/css/app.css`
- **Objectif** : appliquer les retours de Gaspard sur le tri, le rangement, Qui a dit ?, Memory et la frise, un retour par commit.
- **Contraintes** : DOM uniquement avec `h()`, tokens CSS de `:root`, textes sobres. Vérifier chaque écran en 390 px de large (fonction `debordement` des tests).
- **Validation attendue** : captures avant/après dans `tests/captures/`, suite complète verte.

### [TÂCHE E] Test automatique du grand rangement L2
- **Statut** : À faire, après la tâche A
- **Fichiers concernés** : `tests/run.cjs`
- **Objectif** : vérifier que le grand rangement L2 prend ses colonnes dans le cours, en obligations comme en administratif.
- **Détails de modification** :
  - Ajouter un bloc qui ouvre, en `?test`, le mode « Le grand rangement » en obligations (équipe 1) puis en administratif.
  - Vérifier : au moins 2 colonnes, chaque nom de colonne non vide et sans « ? » final ; chaque pièce qui tombe porte un texte ; un clic sur la bonne colonne la range ; un clic sur une mauvaise affiche l'explication.
  - Aller au bout et vérifier que le récapitulatif s'affiche, sans débordement en 390 px (fonction `debordement`).
  - Ne rien changer dans `app/` : si un défaut apparaît, s'arrêter et le noter (« Question pour Claude : … »).
- **Validation attendue** : nouveau `log('rangement L2 ok')`, suite complète verte.

### [TÂCHE D] Fin du déménagement (pas avant le 4 décembre 2026)
- **Statut** : À faire, pas avant le 04/12/2026
- **Fichiers concernés** : `supabase/functions/pousser/index.ts`
- **Objectif** : quand plus personne n'utilise l'ancienne adresse (vérifier dans Administration > « Le parcours des testeurs » qu'aucune ouverture ne vient plus de github.io), ne plus accepter les appels depuis `https://gasparddttk-arch.github.io`.
- **Détails de modification** :
  - Retirer `https://gasparddttk-arch.github.io` de `ORIGINES`.
  - Redéployer la fonction `pousser` (elle ne part pas avec le merge).
  - Avec l'accord de Gaspard : dans Supabase > Authentication > URL Configuration, retirer `https://gasparddttk-arch.github.io/arrets-admin/` des Redirect URLs.
- **Contraintes** : modification Supabase = validation explicite de Gaspard (CLAUDE.md).
- **Validation attendue** : une notification d'ami envoyée depuis gdroit.eu arrive toujours.

### Ce qui reste pour Claude (ne pas faire sans lui)
- Tout contenu juridique : nouveaux cas d'atelier à chaque séance, chambres et chapitres suivants (constit 7 à 10, admin après le TD 6, oblig inexécution et responsabilité), cas pratique L1.
- Tout ce qui touche à la base Supabase (tables, fonctions SQL, droits).
- Avant la vente : contenu réservé aux comptes connectés, Cloudflare Pages et dépôt privé, CGV et statut.

---

## Cahier des charges n° 2 (13/11/2026)

Demandé par Gaspard le 13/11. Chaque tâche indique qui la fait. **Claude** : contenu juridique, choix de conception, textes vus par les étudiants, Supabase. **Antigravity** : le code, une fois la consigne complète. Une tâche d'Antigravity n'est « À faire » que lorsque Claude a tout précisé ; sinon elle est « Attend Claude ».

Ordre : F, G, H, J, N, I, L, M (Antigravity, dans l'ordre du fichier), puis K quand Claude aura écrit le contenu.

Antigravity ne pousse pas : il laisse chaque tâche sur sa branche, et Claude la publie.

### [TÂCHE F] Le banc de pièces : glisser au lieu de trier une carte à la fois (Antigravity)
- **Statut** : Fait le 13/11 (Antigravity), publié par Claude
- **Fichiers concernés** : `app/js/ui.js` (nouveau composant), `app/js/games.js` (`jouerArchitecte`, `jouerPuzzle`), `app/css/app.css`, `tests/run.cjs`
- **Objectif** : aujourd'hui, l'Architecte (plan de commentaire et de dissertation) et le Puzzle (fiche d'arrêt) montrent une seule carte à la fois avec « Écarter » et « Plus tard ». Gaspard veut voir toutes les pièces d'un coup, en bas, et les glisser vers les cases.
- **Détails de modification** :
  - Créer dans `ui.js` un composant `banc({ pieces, cases, ecart: true })` réutilisable (il servira aussi à la tâche K). En haut : les cases (parties du plan ou rubriques de la fiche). En bas : toutes les pièces restantes, sur plusieurs lignes, dans une zone qui défile si besoin. Au bout du banc : une case « Écartées » pour les pièces à ne pas garder.
  - Glisser une pièce sur une case la pose (événements pointer, au doigt comme à la souris). Une case déjà occupée échange les deux pièces. Une pièce posée peut être reprise par glisser vers le banc ou vers une autre case.
  - Sans glisser (accessibilité et petits écrans) : toucher une pièce la sélectionne, toucher une case la pose. Même logique pour « Écartées ».
  - Supprimer les boutons « Écarter » et « Plus tard » de ces deux jeux. Le bouton « Vérifier » (Puzzle) ou « Comparer au plan modèle » (Architecte) s'active quand toutes les cases sont remplies.
  - Barème, corrigé et écran de fin : inchangés.
- **Contraintes** : DOM uniquement avec `h()`, tokens de `:root`, pas de bibliothèque de glisser-déposer. Pendant un glisser, la page ne défile pas (`touch-action: none` sur la pièce). Cibles de 44 px minimum. Une case survolée change de bordure (`--or`).
- **Validation attendue** : les tests de l'Architecte et du Puzzle passent par le toucher-toucher ; ajouter un test qui fait un vrai glisser (Playwright `dragTo`) sur un iPhone 390 px, sans débordement (`debordement`). Suite complète verte.

### [TÂCHE G] L'atelier du cas pratique sans rouages (Antigravity)
- **Statut** : Fait le 13/11 (Antigravity), publié par Claude
- **Fichiers concernés** : `app/js/atelier.js` (étape « La mineure »), `app/css/app.css` (bloc `at-engrenage`, `at-machine`), `tests/run.cjs`
- **Objectif** : Gaspard ne comprend pas les engrenages. On remplace la « machine » par un tableau simple : chaque condition de la règle, en face le fait qui la remplit.
- **Détails de modification** :
  - Supprimer les `span.at-engrenage`, leurs styles et les animations `at-tourne`. Garder la liste des conditions, numérotées « Condition 1 », « Condition 2 »…
  - Chaque ligne : le texte de la condition, puis à droite son état écrit en toutes lettres une fois répondu : « Remplie : <fait> », « Non remplie », « Le cas ne le dit pas ». Couleur en plus du mot, jamais à la place (vert `--juste`, rouge `--faux`, orange `--orange-2`).
  - Consigne, à la place de l'actuelle : « Pour chaque condition de la règle, choisis le fait du cas qui la remplit. »
  - Textes de sortie, à la place de « la machine cale / tourne / hésite » :
    - « Toutes les conditions sont remplies : la règle s'applique. »
    - « Une condition n'est pas remplie : la règle ne s'applique pas. »
    - « Une condition dépend d'un fait que le cas ne donne pas : il faut raisonner par hypothèse. »
  - Les conditions « Posé par la loi » ou « Acquis plus haut » restent affichées comme remplies d'office, avec ce libellé.
- **Contraintes** : rien d'autre ne change dans l'atelier (barème, copie corrigée, étapes).
- **Validation attendue** : plus aucune occurrence de `engrenage` ni de `machine` dans `atelier.js` et `app.css` ; test de l'atelier vert ; capture `atelier-mineure.png` en 390 px. Suite complète verte.

### [TÂCHE H] Lisibilité (Antigravity)
- **Statut** : Fait le 13/11 (Antigravity), publié par Claude
- **Fichiers concernés** : `app/css/app.css`, `app/js/main.js`, `tests/run.cjs`
- **Détails de modification** :
  - **Décor pendant les épreuves** : les animations du décor choisi en boutique (ex. « Le jardin », feuilles qui tombent) restent sur le Palais et les écrans de résultats, mais s'arrêtent et se masquent pendant une épreuve (tout écran de jeu, du premier round à l'écran de fin exclu).
  - **Contraste** : tout texte de réponse (`.option`, cartes, pièces, colonnes) doit avoir un contraste d'au moins 4,5:1 avec son fond, y compris pendant l'animation d'apparition (pas d'opacité réduite sur le texte, seulement sur le fond). Ajouter au test une vérification automatique du contraste des `.option` sur un QCM.
  - **Grade coupé en haut** (« Auditeur de 2e cla… ») : afficher le grade sans troncature, sur deux lignes si besoin, ou en version courte (« Auditeur 2e cl. ») sous 360 px.
  - **Memory** : le dos des cartes porte un repère distinct par position (lettre A à L en petit, couleur `--texte-2`), pour qu'on s'y retrouve.
- **Validation attendue** : captures avant/après (QCM, rangement, résultats avec le décor « jardin ») ; suite complète verte.

### [TÂCHE N] Une suite de tests plus rapide (Antigravity)
- **Statut** : À faire
- **Fichiers concernés** : `tests/run.cjs`, `package.json`, éventuellement `app/js/main.js` (mode `?test` uniquement)
- **Objectif** : la suite complète dure environ 30 minutes. Viser moins de 12 minutes sur le Mac, sans retirer aucune vérification.
- **Détails de modification** :
  1. **Mesurer d'abord** : chaque `log('… ok')` affiche aussi la durée du bloc en secondes. Noter dans la tâche les 10 blocs les plus lents.
  2. **Lancer une partie** : `node tests/run.cjs --seul <mot>` ne joue que les blocs dont le nom contient ce mot (pour travailler vite sur une tâche ; la suite complète reste obligatoire avant publication).
  3. **En parallèle** : découper les blocs en 3 groupes indépendants de durée voisine (chacun avec son propre navigateur et ses contextes), lancés en même temps par `npm test`, qui affiche le total et échoue si un groupe échoue. La commande actuelle doit continuer de marcher.
  4. **Animations décoratives en `?test`** : portes du Palais, confettis, feuilles du décor, envols de cartes à durée nulle. Ne pas toucher aux délais qui font partie du jeu et qui sont testés (ex. l'erreur du Memory visible 3200 ms, la chute du grand rangement).
- **Contraintes** : même nombre de blocs `ok` qu'avant (le vérifier et l'écrire dans la tâche).
- **Validation attendue** : durée avant/après notée dans la tâche ; suite complète verte deux fois de suite.

### [TÂCHE I] Jouer d'abord, installer ensuite (Antigravity)
- **Statut** : À faire
- **Décisions de Gaspard (13/11)** : sans installation, on peut continuer sur le site (connexion dans le navigateur) ; l'invitation à installer revient après chaque séance. Le choix des exercices revient à Claude.
- **Constat (suivi du 13/11)** : 217 ouvertures, 141 écrans de connexion, 37 connexions. La plupart des gens s'arrêtent à l'écran de connexion, avant d'avoir joué.
- **Fichiers concernés** : `app/js/main.js` (`demarrer`, `ouvrirCompte`, `ecranConnexion`, `ecranAnnee`, `choisirEquipe`, `accueilL1`, `matieres`, `lancerDecouverte`, `resultats`), `app/css/app.css`, `tests/run.cjs`
- **Parcours** :
  1. **Visiteur** = navigateur (pas l'icône installée), non connecté, et qui n'a pas encore fini sa séance découverte dans ce navigateur. `ouvrirCompte` ne montre plus `ecranConnexion` à un visiteur : il passe au choix de l'année (`ecranAnnee`), puis de l'équipe (L2 : `choisirEquipe` ; L1 : équipe L1), puis de la matière. Au-dessus du choix de l'année, une ligne : « Essaie une minute, sans compte. »
  2. Toucher une matière lance directement `lancerDecouverte(0)` (pas de Palais). Le parcours visiteur cache la barre d'onglets.
  3. **Fin de la séance découverte d'un visiteur** : sous le résultat, à la place des boutons actuels, un bloc :
     - titre « Maintenant, installe Gdroit » ;
     - texte « Une icône sur ton écran d'accueil, ta série chaque jour, tes chambres qui s'ouvrent au fil du cours. » ;
     - `guideInstallation()` (déjà adapté au navigateur) ;
     - sur iPhone, une ligne : « Puis connecte-toi depuis l'icône : une connexion faite dans le navigateur ne la suit pas. » ;
     - deux boutons discrets : « Encore une minute » (relance `lancerDecouverte(1)`, comme aujourd'hui) et « Continuer sur le site » (ouvre `ecranConnexion`).
  4. Le visiteur qui revient plus tard dans le même navigateur, séance déjà faite : `ecranConnexion` comme aujourd'hui.
  5. **Dans l'icône installée, non connecté** : `ecranConnexion` directement, sans le bloc « D'abord, mets Gdroit sur ton écran d'accueil » (il est déjà installé).
  6. **Connecté dans le navigateur, sur téléphone** : après chaque séance, en bas de l'écran de résultats, un rappel court « Installe Gdroit : une icône, et tu n'as plus à repasser par le navigateur. » avec un bouton « Comment faire » (ouvre le guide) et « Plus tard » (masque le rappel jusqu'à la séance suivante). Rien sur ordinateur, rien dans l'icône installée.
  7. Supprimer le bloc « Installe l'appli avant de jouer » de l'accueil et le bloc « D'abord, mets Gdroit… » de l'écran de connexion dans le navigateur : l'installation n'est plus demandée avant de jouer.
- **Exercices de découverte** : `DECOUVERTE = { admin: ['juge', 'paires'], oblig: ['qualif', 'remede'], constit: ['nuancier', 'pouvoirs'], intro: ['tri', 'mot'] }`. Seul changement : en introduction, `mot` remplace `memory` en second (Memory : 56 % de réussite le premier jour, trop dur pour une première impression ; Le mot : 86 %, aucun abandon). À revoir avec une semaine de données.
- **Suivi** : utiliser les types existants (`seance_debut` avec `{ seance: 'decouverte', visiteur: true }`, `installer_vu`, `installer_clic`, `decouverte_suite` avec `choix: 'site'` pour « Continuer sur le site »). Aucun nouveau type : la liste des types est contrôlée côté serveur.
- **Contraintes** : les places de test (`acces: 'aucun'`) restent vérifiées à la connexion, comme aujourd'hui ; le visiteur n'écrit rien sur le serveur sauf le suivi.
- **Validation attendue** : test « visiteur iPhone » (contexte iPhone, sans `?test` de compte : année → équipe → matière → découverte → bloc d'installation → « Continuer sur le site » → écran de connexion) ; test « icône installée non connectée » (pas de bloc d'installation) ; captures en 390 px. Suite complète verte.

### [TÂCHE J] Les défis entre amis en L1 (Claude, puis Antigravity)
- **Statut** : À faire
- **Constat** : la fiche d'un ami ne propose que « Administratif » et « Obligations ». La base refuse aussi tout autre défi (`defis_amis_matiere_check` n'accepte que `admin` et `oblig`). Et le test « même équipe » compare l'équipe L1 de l'ami (`resume.equipe`) à l'équipe L2 de l'utilisateur.
- **Partie Claude (faite le 13/11, accord de Gaspard)** : la base accepte `intro` et `constit` dans `defis_amis.matiere`.
- **Partie Antigravity** :
  - Dans `resume()` (`app/js/compte.js`), ajouter `xpConstit: etat.constit?.xp || 0`.
  - Dans la fiche d'un ami, proposer les matières de l'année commune : deux L2 → Administratif, Obligations (même équipe L2) ; deux L1 → Droit constitutionnel (toujours), Introduction au droit (même équipe L1). Un L1 et un L2 : « Vous n'avez pas de matière en commun pour l'instant. »
  - Comparer `resume.annee` et `resume.equipe` avec `etat.annee` et l'équipe de la bonne année.
  - Le tableau de comparaison montre les lignes de l'année (L1 : Introduction, Constitutionnel ; L2 : Administratif, Obligations).
  - `releverDefi` : pour l'intro, refuser si l'équipe L1 diffère (« Ce défi porte sur le cours de l'autre équipe »).
  - Test : deux comptes L1 simulés se défient en constit puis en intro.

### [TÂCHE K] Nouvel exercice « La formule » : lire la formule du juge, en déduire le plan (Antigravity)
- **Statut** : À faire
- **Décisions de Gaspard (13/11)** : obligations, administratif et introduction au droit. Version courte (étapes 1 et 2) dans les séances du quotidien ; version entière (étapes 1 à 3) dans les modes d'examen et les audiences.
- **Contenu (fait par Claude)** : `content/formules.mjs`, 11 arrêts (6 obligations équipe 1, 5 administratif) dont le texte a été vérifié sur Légifrance (`notes/formule-verifs.md`). Ne pas modifier les textes. L'introduction L1 viendra avec le chapitre du cours sur la jurisprudence.
- **Fichiers concernés** : `scripts/build.mjs`, `scripts/check.mjs`, `app/js/formule.js` (nouveau), `app/js/engine.js`, `app/js/main.js`, `app/js/games.js`, `app/css/app.css`, `tests/run.cjs`
- **Détails de modification** :
  1. **Build** : écrire `docs/formules.json` à partir de `content/formules.mjs` (`TYPES`, `ARRETS`) ; le charger dans `demarrer()` avec les autres fichiers. Dans `indexer`, rattacher à chaque matière les entrées dont `matiere` correspond et dont `arret` existe dans les fiches de l'équipe courante (`equipes` contient l'équipe) ; une entrée prend les zones de sa fiche.
  2. **Check** : vérifier que chaque `type` et chaque `piege` existe dans `TYPES` et diffère du type, que `extrait` a 3 parties, qu'il y a au moins un morceau `I`, un `II` et un leurre, et que la fiche `arret` existe dans les fichiers de chaque équipe listée.
  3. **Moteur** (`app/js/formule.js`, `jouerFormule(zone, ctx, round)`, round `{ type: 'formule', entiere: bool, id }`) :
     - **Étape 1, Lire** : l'arrêt (`ref`), l'extrait avec la formule (2e partie) en gras sur fond `--or` pâle. Question « Que révèle cette formule ? » ; réponses : `TYPES[type].nom` et les noms des deux types de `pieges`, mélangés. Après réponse : `TYPES[type].signe` puis `lecture`. Appeler `ctx.noter(arret, juste)`.
     - **Étape 2, Choisir** : « Quel squelette de plan ? » ; trois cartes : le `squelette` du bon type et ceux des deux `pieges` (I et II, avec les crochets), mélangées. Après réponse, montrer sous chaque carte le `nom` du type correspondant.
     - **Étape 3, Remplir** (seulement si `entiere`) : le squelette du bon type en cases I et II, les `morceaux` dans le banc de pièces de la tâche F (avec la case « Écartées »). Vérifier : chaque morceau `I` ou `II` à sa place, les leurres écartés ; montrer le `w` de chaque leurre mal placé. Puis le plan modèle (`modele.I`, `modele.II`) sous le titre « Le plan de cet arrêt ».
     - Score : courte 0,5 + 0,5 ; entière 0,3 + 0,3 + 0,4 (part des morceaux bien placés).
  4. **Branchement** :
     - type `formule` dans `tirerRound` (obligations et administratif), seulement si la matière a au moins une entrée dans les zones demandées ;
     - version courte : ajoutée à la rotation de la révision d'une chambre (`reviserZone`) et du défi du jour, au plus une fois par séance ;
     - version entière : dans `PRODUCTION` (tâche L ; créer la liste si elle n'existe pas encore), dans « Appel », « Cassation » et « Partiel blanc » pour les obligations et l'administratif, et en premier choix de production des audiences quand la chambre en a une ;
     - mode « La formule » dans la liste des modes (`games.js`), version entière.
  5. Textes de l'interface : surtitre « La formule », étapes « Lire », « Choisir », « Remplir » ; pas d'autre texte que ceux du fichier de contenu et ceux-ci.
- **Contraintes** : DOM avec `h()`, tokens de `:root`, 390 px sans débordement. Dépend de la tâche F (banc de pièces).
- **Validation attendue** : test qui joue une version courte et une version entière en obligations (équipe 1) et en administratif (équipe 2), avec une mauvaise réponse à l'étape 1 (le `signe` s'affiche) ; captures `formule-lire.png`, `formule-remplir.png` ; suite complète verte.

### [TÂCHE L] La production réservée aux modes d'examen et aux audiences (Antigravity)
- **Statut** : À faire
- **Décisions de Gaspard (13/11)** : l'audience garde ses 3 vies, avec au moins un exercice de production qui compte comme les autres (le rater coûte une vie). « Première instance » reste un échauffement sans production ; la production commence à « Appel ».
- **Définition** : exercices de **production** = `atelier`, `architecte`, `plaide`, `trous`, `syllogisme`, `casnu`, et plus tard `formule` en version entière. Tous les autres sont de reconnaissance.
- **Fichiers concernés** : `app/js/engine.js` (`composerDefi`, `composerBoss`, `composerBossIntro`), `app/js/main.js` (`NIVEAUX_EXAMEN`, `lancerExpress`, `reviserZone`, `DECOUVERTE`), `tests/run.cjs`
- **Détails de modification** :
  1. Créer dans `engine.js` une liste exportée `PRODUCTION` avec ces types.
  2. **Séances du quotidien sans production** : défi du jour, Trois minutes, révision d'une chambre, découverte, défi entre amis. Aujourd'hui, le défi du jour de l'administratif tire parfois `architecte` (`choix(['plan', 'architecte'])`) : le remplacer par `plan`. Vérifier qu'aucune autre composition du quotidien ne tire un type de `PRODUCTION`.
  3. **Audiences (`composerBoss`, `composerBossIntro`)** : 6 épreuves dont exactement une de production, tirée parmi celles que la chambre peut nourrir. Ordre de préférence : obligations `atelier` (si un cas de la chambre existe), sinon `trous`, sinon `plaide` ; administratif `architecte`, sinon `atelier`, sinon `trous` ; L1 : `plume` (constitutionnel) ou `mot` à défaut, jusqu'à l'arrivée de `formule`. L'épreuve de production n'est jamais la première de l'audience. Les vies ne changent pas.
  4. **Modes d'examen** : « Première instance » ne contient aucun type de `PRODUCTION` (vérifier, et corriger s'il y en a). « Appel », « Cassation » et « Partiel blanc » en contiennent au moins un par matière ; pour l'introduction et le constitutionnel, ajouter `plume` ou `mot` là où il n'y en a pas.
- **Validation attendue** : un test qui compose 200 défis du jour, Trois minutes et révisions par matière (rng fixe) et vérifie qu'aucun ne contient de type de `PRODUCTION` ; 200 audiences par matière contiennent exactement une production, jamais en premier. Suite complète verte.

### [TÂCHE M] La révision du jour, fondée sur les erreurs, visible sur le Palais (Antigravity)
- **Statut** : À faire
- **Décisions de Gaspard (13/11)** : 8 fiches au maximum par jour ; la finir pose le sceau du jour.
- **Constat** : la répétition espacée existe (`noter`, `aRevoir` dans `state.js`), mais elle est cachée, et `aRevoir` mélange les fiches ratées, les fiches simplement dues et les fiches neuves.
- **Fichiers concernés** : `app/js/state.js`, `app/js/engine.js`, `app/js/main.js` (`accueil`, `resultats`), les fichiers de jeux, `app/css/app.css`, `tests/run.cjs`
- **Détails de modification** :
  1. `aRattraper(ix, zones)` dans `state.js` : les fiches **dues aujourd'hui** (`d <= jour()`) **et déjà ratées au moins une fois** (`ko > 0`), les plus anciennes d'abord (`d` croissant), au plus 8.
  2. **Sur le Palais**, quand la liste n'est pas vide : une entrée en tête, avant le défi du jour : « À revoir aujourd'hui » / « N fiches que tu as ratées reviennent. Environ 3 minutes. » Elle disparaît quand il n'y a rien à revoir ou que la révision du jour est faite.
  3. **La séance** (`type: 'revision'`) : 3 épreuves qui tirent leurs cartes dans cette liste en priorité, avec les types qui acceptent une liste de fiches (`dus`) : administratif `paires`, `juge`, `paires` ; obligations `qualif`, `remede`, `qualif` ; introduction `memory`, `mot`, `memory` ; constitutionnel `mot`, `memory`, `mot`. Aucun type de `PRODUCTION` (tâche L).
  4. **Écran de fin** : la liste des fiches revues, chacune avec « Revue, elle reviendra plus tard » ou « Encore ratée, elle revient demain ». La séance pose le sceau du jour comme une séance ordinaire.
  5. **Chaque jeu note ses erreurs** : vérifier que tout jeu dont le round porte une fiche (`carte`, `c.carte`, `p.carte`, `id` de fiche) appelle `ctx.noter(fiche, juste)`. À vérifier en particulier : `jouerTri`, `jouerMot`, `jouerQuiADit`, `jouerScanner`, `jouerFrise`, `jouerPouvoirs`, `jouerNuancier`, `jouerPlume`. Lister dans la tâche ceux qui ont été complétés.
- **Validation attendue** : test : une séance avec deux erreurs volontaires → le lendemain (`?decalage=1`), l'entrée « À revoir aujourd'hui » affiche 2 fiches → la séance les propose → après réussite, l'entrée disparaît. Suite complète verte.

## Tâches en attente (Roadmap)

### 1. Nom du professeur de l'équipe 3 en L1
* **Statut** : 🟡 En attente de l'information
* **Fichiers concernés** : `app/js/main.js` ou données d'onboarding
* **Action** : Ajouter le nom du professeur dès communication par Gaspard.

### 2. Relecture et ajustement du contenu L1
* **Statut** : 🟡 En attente de relecture Gaspard
* **Fichier concerné** : `content/intro.mjs`
* **Détail** : Relire les 87 notions, les cartes de tri, citations, mots et scanner. Appliquer les corrections éventuelles.

### 3. Ajustements des retours iPhone
* **Statut** : 🟢 Prêt pour prise en charge
* **Jeux concernés** : tri, rangement, Qui a dit ?, Memory, frise.
* **Consigne générale** : Exercices simples, clairs, collés au cours, sans formulations ambiguës.

### 4. Cas pratique L1
* **Statut** : ⚪ Attente suite du cours (sources du droit, jurisprudence).

### 8. L'atelier du cas pratique (obligations) : relecture et suite
* **Statut** : 🟡 En ligne, cas à relire par Gaspard
* **Fichiers** : `content/ateliers.mjs` (cas), `app/js/atelier.js` (moteur)
* **Détail** : 10 cas d'entraînement écrits sur les axes du cours (offre, pourparlers, promesse, information et dol, erreur, abus de dépendance, silence, ordre public, gestion d'affaires, 1240). Trois niveaux. Remplace le syllogisme et le cas nu dans « Vers l'examen » en obligations.
* **Administratif** : `content/ateliers-admin.mjs`, 7 cas (traité et loi, directive non transposée, loi-écran et QPC, PGD et droits de la défense, circonstances exceptionnelles, extradition et acte de gouvernement, privilège du préalable). Équipe 1 : 4 cas ; équipe 2 : les 7. Remplace le syllogisme dans « Vers l'examen ».
* **Contrôle** : `npm run check` vérifie la structure de chaque cas. Les leurres ont été rallongés pour que la bonne réponse ne se reconnaisse pas à sa longueur.
* **À faire** : nouveaux cas à chaque séance (inexécution, responsabilité ; en administratif, les séances suivantes).

### 11. Domaine gdroit.eu
* **Statut** : 🟢 En ligne
* **Fait (13/11)** : gdroit.eu acheté chez OVH ; DNS vers GitHub Pages (4 A, www en CNAME) ; HTTPS forcé ; Supabase (Site URL et redirections) ; fonction `pousser` autorisée depuis gdroit.eu ; emails de connexion par Resend depuis connexion@gdroit.eu.
* **Dépôts** : `gdroit` = l'appli ; `arrets-admin` = page de déménagement pour les anciennes installations (le service worker remplace l'ancienne appli par cette page).
* **À faire** : prévenir les testeurs (annonce de l'admin) ; dans quelques semaines, retirer l'ancienne adresse des redirections Supabase et des origines de `pousser`.

### 10. Conversion : installation, première séance, suivi
* **Statut** : 🟡 En ligne, à observer
* **Constat (13/11)** : 56 inscrits, 16 ont fini une séance (29 %), 9 en ont fait trois ou plus.
* **Fait** : guide d'installation selon le navigateur (Safari, Chrome iPhone, Chrome/Edge/Samsung Android avec bouton direct, navigateurs d'applis type Instagram) ; sur téléphone, l'écran de connexion propose d'installer d'abord. Première séance d'une matière = un seul exercice (admin : le juge ; oblig : qualifier ; constit : le nuancier ; intro : le tri), puis « Encore une minute » ou le Défi du jour. Message testeur sans « 28 ». Memory L1 : deux cartes ratées restent ouvertes 3 s ou jusqu'au toucher.
* **Suivi** : table `evenements` (Supabase) via `noter_evenements` ; entonnoir et parcours par compte dans l'admin (`admin_entonnoir`, `admin_parcours`). Page confidentialité mise à jour.
* **L2** : Memory (arrêt et ce qu'il apporte / article et son objet) et tri (arrêts par famille / situations par chambre), dans Le rôle et parfois en dernière épreuve du Défi.
* **À faire** : relire les chiffres dans une semaine (admin > Le parcours des testeurs).

### 9. Obligations, équipe 1 : chambres 13 et 14
* **Statut** : 🟡 En ligne, à relire par Gaspard
* **Détail** : la violence (TD 5) n'est plus en travaux ; nouvelle chambre « L'ordre public » (TD 6 : licéité, corps humain, GPA, bonnes mœurs, Gleeden, cagnotte, ostéopathe 2025). Fichiers `content/oblig1/*.txt`.

### 7. L1, droit constitutionnel (Pr Le Divellec, équipe 2) : relecture
* **Statut** : 🟡 À relire par Gaspard
* **Fichier concerné** : `content/constit.mjs` ; jeux dans `app/js/jeux-constit.js`
* **Détail** : leçons 1 à 6 et TD 1 à 6. Ouvert à toute la L1 (l'équipe 1 n'a que cette matière). 10 chambres, dont 4 en travaux (IIe-IIIe Républiques, facettes de la constitution, justice constitutionnelle, Allemagne). 89 notions, 23 citations de la plaquette, 4 frises, 6 sujets.
* **Jeux propres** : l'architecte des pouvoirs (6 régimes : Angleterre XVIIIe, États-Unis 1787, 1791, Charte 1814, Weimar, Autriche 1920), le nuancier des États (21 jetons), la plume du constituant (24 articles recopiés de la plaquette).
* **À ajouter à chaque nouvelle leçon** : notions, régimes (IIIe République), articles (lois de 1875), et retirer `travaux` de la chambre.

### 6. L1, introduction au droit, équipe 2 : relecture
* **Statut** : 🟡 À relire par Gaspard
* **Fichier concerné** : `content/intro2.mjs` (reprend `intro.mjs` et l'adapte)
* **Détail** : même plan que l'équipe 3, six chambres. Notions communes au même id (progression partagée). Retirés car absents du cours de l'équipe 2 : règles supplétive et impérative, lex mercatoria, quieta non movere, jus et lex, Discours préliminaire, Bentham, Jestaz, Stendhal. Ajouts : Dunbar, harmonie sociale, critère sociologique, statut personnel au Liban, Comte, marxisme, droit commun et spécial, Schiavone, préteur, rédaction des coutumes, ordonnances, égalité civile, volontarisme, rédacteurs, Fenet, citations (Schmitt, saint Augustin, Paul, Labbé, Brassens, Roubier, Ripert, Carbonnier), sujet « Droit et religion ».
* **Fonctionnement** : `etat.equipeL1` choisit le contenu (`intro2.json` ou `intro.json`) ; les chambres de l'autre équipe sont rangées dans `etat.intro.parEquipe`.

### 5. Droit administratif, équipe 2 (Pr Plessix) : relecture
* **Statut** : 🟡 En ligne, à relire par Gaspard
* **Fichiers concernés** : `content/admin2/*.txt` (arrêts, familles, juge, frises, sujets, commentaires)
* **Détail** : cours et plaquette jusqu'à la séance 6 incluse. 71 fiches (42 nouvelles, 29 reprises de l'équipe 1 avec le même id, donc progression partagée). Six chambres : caractères, puis une par séance de TD (2 à 6).
* **Points ouverts** : « Mme C.A. » (grand arrêt de la séance 5 de la plaquette) non identifié, donc absent. Fiches marquées `nf` (hors puzzle) : prefet-eure, amiante, chemins-de-fer-est.
* **Fonctionnement** : le choix d'équipe vaut pour toute la L2. La progression des chambres d'administratif de l'autre équipe est rangée dans `etat.adminParEquipe` ; les anciennes sauvegardes sont considérées comme équipe 1 (`adminEquipe`).

---

## Modèle pour ajouter une nouvelle tâche

```markdown
### [NOUVELLE TÂCHE] <Nom de la tâche>
- **Date** : YYYY-MM-DD
- **Demandeur** : Claude / Gaspard
- **Fichiers cibles** :
- **Consigne** :
- **Statut** : [ ] À faire  |  [ ] En cours  |  [X] Terminé
```

---

## Dernières actions exécutées par Antigravity
- **12/11/2026** :
  - Installation locale de Node.js v22 LTS et configuration du PATH.
  - Initialisation du dépôt Git local synchronisé avec `origin/main` (`gasparddttk-arch/arrets-admin`).
  - Validation du build : `npm run check` (100% valide) et `npm run build` (version docs/ générée avec succès).
  - Création de `CLAUDE.md` et `TACHES.md` pour l'orchestration Architecte/Ouvrier.
  - **Fonctionnalité Notifications Testeurs & Mises à jour** :
    - `app/js/main.js` :
      - Sur l'écran de quota dépassé (`ecranPlacesPrises`), ajout d'un bouton « Me prévenir dès qu'une place se libère » permettant d'inscrire l'appareil aux notifications push WebPush.
      - Dans l'écran Admin : bouton « Ouvrir X places en attente » qui active automatiquement les comptes en attente et déclenche leur notification dès qu'une place se libère.
      - Dans `ficheCompte` : notification automatique du compte cible lorsqu'il passe en statut `testeur`.
      - Dans l'écran Admin : bouton « Notifier les testeurs d’une mise à jour » pour prévenir tous les testeurs actifs lorsqu'une nouvelle version est déployée.
      - Dans `bandeauMiseAJour` : ajout d'un toast direct alertant de la disponibilité de la mise à jour PWA.
    - `app/js/compte.js` : ajout du helper `adminNotifierCompte(cible, type, donnees)`.
    - `supabase/functions/pousser/index.ts` : ajout des types `place_testeur` et `maj_appli` avec redirection directe vers `./`.
    - `app/css/app.css` : ajustement du style `.places-alerte`.
    - `npm run check` validé (100% vert) et `npm run build` exécuté pour `/docs`.
- **12/11/2026 (Claude, revue)** :
  - L'insertion directe dans `notifications` était refusée par la base (aucune règle d'insertion) : les notifications ne partaient pas. Remplacée par la fonction SQL `admin_notifier(cibles, genre, donnees)`, réservée à l'admin.
  - L'edge function `pousser` n'envoie `place_testeur` et `maj_appli` que si l'appelant est admin ; redéployée.
  - Écran « places prises » : message adapté si l'appli n'est pas installée sur l'écran d'accueil ou si les notifications sont refusées.
  - Bandeau de mise à jour : plus de toast en double, et caché pendant une séance.
  - Suite complète `tests/run.cjs` passée avant le merge.
