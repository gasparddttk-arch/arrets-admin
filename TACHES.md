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
- **Statut** : En attente : premier passage de Gaspard sur iPhone le 14/11 sans défaut relevé ; retours plus tard
- **Fichiers concernés** : `app/js/jeux-l1.js`, `app/css/app.css`
- **Objectif** : appliquer les retours de Gaspard sur le tri, le rangement, Qui a dit ?, Memory et la frise, un retour par commit.
- **Contraintes** : DOM uniquement avec `h()`, tokens CSS de `:root`, textes sobres. Vérifier chaque écran en 390 px de large (fonction `debordement` des tests).
- **Validation attendue** : captures avant/après dans `tests/captures/`, suite complète verte.

### [TÂCHE E] Test automatique du grand rangement L2
- **Statut** : Fait le 14/11 (Antigravity), publié par Claude
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
- **Statut** : Fait le 13/11 (commencé par Antigravity, terminé par Claude) : suite complète en 8 min au lieu de 30, `npm test` (3 groupes en parallèle), `node tests/run.cjs --seul <mot>` pour une partie
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
- **Statut** : Fait le 13/11 (Antigravity), publié par Claude
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
- **Statut** : Fait le 14/11 (Antigravity), publié par Claude
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
- **Statut** : Fait le 14/11 (commencé par Antigravity, terminé par Claude). Version courte dans le défi du jour et la révision des chambres ; version entière dans le mode « La formule », « Appel », « Cassation », « Partiel blanc » et les audiences. La liste `PRODUCTION` existe déjà dans `engine.js` (tâche L : la compléter).
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

### [TÂCHE O] Memory : voir les cartes avant de jouer (Antigravity)
- **Statut** : Fait le 14/11 (Antigravity), publié par Claude
- **Demande (retour d'un testeur, transmis par Gaspard le 14/11)** : au début du Memory, toutes les cartes sont visibles un moment pour qu'on les mémorise, puis elles se retournent et le jeu habituel commence. Ainsi le début n'est plus du hasard.
- **Fichiers concernés** : `app/js/jeux-l1.js` (`jouerMemory`, qui sert aussi au Memory de L2), `app/css/app.css`, `tests/run.cjs`
- **Détails de modification** :
  1. **Phase « Mémorise »** au lancement : toutes les cartes sont face visible (classe `ouverte`), non cliquables.
     - Consigne à la place de la consigne habituelle : « Mémorise les cartes : elles se retournent dans 20 secondes. »
     - Un compte à rebours visible, en secondes (« 20 s », « 19 s »…), dans la ligne de la consigne.
     - Un bouton discret « C'est mémorisé » qui termine la phase tout de suite.
  2. **Fin de la phase** (au bout de 20 s ou au bouton) : toutes les cartes se retournent en même temps (la même animation que d'habitude), la consigne habituelle revient (`round.consigne` ou « Retrouve chaque notion et sa définition. »), puis le jeu se joue exactement comme aujourd'hui (coups, erreurs visibles 3200 ms, récapitulatif).
  3. Le chronomètre de la phase ne compte pas dans le score ni dans les coups.
  4. Sans effets visuels (`effets()` faux) ou avec « réduire les animations » : même phase, sans animation de retournement.
  5. Si on quitte la séance pendant la phase, le compte à rebours s'arrête (pas de `setTimeout` qui retourne des cartes d'un écran disparu).
- **Tests** :
  - `jouerParfait` : si un bouton `.mem-pret` est présent, le toucher d'abord.
  - Bloc « memory lisible » : vérifier qu'au lancement les 12 cartes sont `ouverte` et que la consigne contient « Mémorise » ; toucher « C'est mémorisé » (`.mem-pret`) ; vérifier qu'aucune carte n'est plus `ouverte` ; puis la suite du test comme aujourd'hui.
- **Validation attendue** : `npm test` vert ; capture `memory-memorise.png` en 390 px, sans débordement.

### [TÂCHE L] La production réservée aux modes d'examen et aux audiences (Antigravity)
- **Statut** : Fait le 14/11 (Antigravity), publié par Claude
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
- **Statut** : Fait le 14/11 (commencé par Antigravity, terminé par Claude). Jeux complétés pour noter les fiches : `jouerTri`, `jouerMot` (fiche du round), `jouerQuiADit`, `jouerScanner`, `jouerMemory` (L1), `jouerFrise`, `construire`/`reconnaitre` (pouvoirs), `jouerNuancier`, `jouerPlume`. Seules les fiches du cours sont suivies (`ctx.noter` ignore les autres identifiants).
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

### [TÂCHE P] Animations : passages d'écran et ouverture du Palais (Antigravity)
- **Statut** : Fait le 14/11 (Antigravity), vidéos validées par Gaspard, publié par Claude
- **Demande de Gaspard (14/11)** : le style graphique est bon mais manque de mouvement. Priorités : passages d'écran et Palais à l'ouverture. Intensité : très expressive (rebonds, effet ressort), sans gêner quand on enchaîne. **Rien n'est mis en ligne avant que Gaspard ait vu une vidéo de chaque animation.** Ne pas merger : livrer sur `antigravity/lot` avec les vidéos.
- **Fichiers concernés** : `app/js/main.js` (`montrer`, `aller`, `lancer`, `accueil`, `resultats`, barre d'onglets), `app/css/app.css` (keyframes regroupées dans un bloc « Mouvement »), `tests/run.cjs`
- **Courbes et durées (tokens à ajouter dans `:root`)** : `--ressort: cubic-bezier(.34, 1.56, .64, 1)` (dépassement), `--sortie: cubic-bezier(.4, 0, 1, 1)`, `--t-court: 180ms`, `--t-moyen: 340ms`, `--t-long: 520ms`. Aucune animation ne dépasse 700 ms au total ; l'écran reste cliquable dès le premier instant (jamais de `pointer-events: none` sur le nouvel écran).
- **Détails de modification** :
  1. **Passage d'écran dans `montrer()`**, en gardant le remplacement du DOM **synchrone** (pas de `document.startViewTransition`, dont la mise à jour est asynchrone et casserait le code qui lit le DOM juste après `montrer`) :
     - avant le remplacement, cloner l'écran sortant (`racine.firstElementChild?.cloneNode(true)`), le poser en `position: fixed` à sa place exacte (`getBoundingClientRect`), `aria-hidden`, `inert`, `pointer-events: none`, `z-index` sous la barre d'onglets ; l'animer avec la Web Animations API puis le retirer à `finish` (et au plus tard après 600 ms) ;
     - animer l'écran entrant avec la Web Animations API ;
     - trois sens, donnés par une variable `sens` fixée par l'appelant puis remise à `'neutre'` :
       - `'avant'` (on entre plus loin : Palais → exercice, liste → fiche, rôle → mode) : entrant `translateX(48px) scale(.96)`, opacité 0 → `none`, `--t-moyen`, `--ressort` ; sortant `translateX(-24px) scale(.98)`, opacité → 0, `--t-court`, `--sortie` ;
       - `'arriere'` (retour, « Retour au Palais », fermeture d'une fiche) : l'inverse ;
       - `'onglet'` : selon l'ordre des onglets, glissement de 32px vers la gauche ou la droite, entrant `--t-moyen` `--ressort`, sortant en fondu `--t-court` ;
       - `'neutre'` : simple fondu montant de 8px (comportement actuel `arrive`).
     - `aller(id)` fixe `'onglet'` quand on change d'onglet (comparer l'index de l'onglet courant et du nouveau), `'avant'` sinon ; les boutons retour fixent `'arriere'`.
  2. **Entre deux épreuves d'une séance** (`scene.replaceChildren` dans `lancer`) : l'épreuve suivante entre comme une carte posée sur la table : `translateY(28px) rotate(-1.5deg) scale(.95)` → `none`, `--t-moyen`, `--ressort`, et la barre de progression (`pips`) fait un petit saut sur la pastille qui se remplit (`scale(1.35)` → 1, 260 ms).
  3. **Écran de résultats** : le titre (« Sans faute », etc.) tombe et rebondit (`translateY(-24px) scale(1.2)` → `none`, `--ressort`, 420 ms) ; les trois cases Réussite / Expérience / Jetons entrent en cascade (80 ms d'écart, `scale(.8)` → 1, `--ressort`) et leurs nombres **défilent de 0 jusqu'à la valeur** en 600 ms (`requestAnimationFrame`, arrondi entier, le texte final exact reste dans le DOM dès le départ pour les lecteurs d'écran via `aria-label`).
  4. **Palais à l'ouverture** — seulement à la première ouverture de la session et au retour d'une séance, **pas** quand `accueil()` est redessiné pour une autre raison (drapeau `animerPalais`) :
     - le bandeau du haut (grade, jetons) descend de 12px en fondu (`--t-court`) ;
     - la carte « Ta série » monte avec rebond (`translateY(30px) scale(.94)` → `none`, `--t-long`, `--ressort`) ; le chiffre de la série défile de 0 à sa valeur ; les sept petits sceaux de la semaine apparaissent un par un (50 ms d'écart, `scale(0)` → 1, `--ressort`), et celui d'aujourd'hui, s'il est tamponné, reprend l'animation existante `cachet` ;
     - la chouette fait l'animation existante `saute` une fois, 150 ms après la carte ;
     - les entrées suivantes (« À revoir aujourd'hui », « Défi du jour », puis la grille des tuiles) arrivent en cascade de bas en haut, 70 ms d'écart, `translateY(24px) scale(.97)` → `none`, `--ressort` ;
     - le compteur de jetons fait un petit pop (`scale(1.25)` → 1) si des jetons ont été gagnés depuis le dernier affichage.
  5. **Barre d'onglets** : la pastille de l'onglet actif **glisse** d'un onglet à l'autre (un seul élément `.onglet-pastille` positionné en `transform: translateX()` et `width`, `--t-moyen`, `--ressort`) au lieu de sauter ; l'icône de l'onglet touché fait un petit rebond (`scale(.85)` → 1).
  6. **Réglages et accessibilité** : `[data-effets='non']` et `prefers-reduced-motion: reduce` → aucune de ces animations (remplacement direct). `[data-effets='leger']` → seulement les fondus, sans déplacement ni rebond ni cascade ni défilement des nombres.
  7. **Tests** : en `?test`, ces animations sont **coupées** (durée 0, pas de clone) pour ne pas fragiliser la suite, **sauf** si l'adresse contient aussi `&anim`. Ajouter un bloc `if (matchSeul('animations'))` : avec `?test&anim`, vérifier qu'après une navigation le clone sortant a disparu au bout de 700 ms, que le nouvel écran est cliquable tout de suite, et `debordement` pendant et après l'animation.
  8. **Vidéos pour Gaspard** (obligatoires) : un petit script `scripts/antigravity/videos-p.cjs` (Playwright, `devices['iPhone 13']`, `recordVideo`, `?test&anim`, thème par défaut) qui enregistre une vidéo par point : `P1-passages.webm` (Palais → Défi du jour → retour, puis Palais → onglet Fiches → Boutique → Profil), `P2-epreuves.webm` (deux épreuves enchaînées), `P3-resultats.webm`, `P4-palais.webm` (ouverture de l'appli), `P5-onglets.webm`. Les écrire dans `.antigravity/videos/` (hors Git, ne pas les committer).
- **Contraintes** : DOM avec `h()` uniquement ; une seule feuille `app/css/app.css` ; pas de bibliothèque ; animer seulement `transform` et `opacity` ; ne pas toucher aux animations existantes des jeux.
- **Validation attendue** : `npm run check`, `npm run build`, suite complète verte, les 5 vidéos présentes. Statut : `Prêt pour Claude (vidéos dans .antigravity/videos)`. **Ne pas considérer la tâche comme publiable** : Claude montre les vidéos à Gaspard avant tout merge.

## Cahier des charges n° 4 : accueil des nouveaux (16–20/11/2026)

Plan : https://claude.ai/artifact/MUQk51XZ9Y4uv5v47EGUK3. Mêmes règles que le cahier n° 3 (statut exact « À faire », au plus 2 h 45 par session, tests dans un bloc `matchSeul` du groupe 1). Tout ce qui se voit sera montré en vidéo à Gaspard par Claude avant publication : ne rien publier.

### [TÂCHE B] L'installation proposée au bon moment, avec un pas-à-pas illustré
- **Statut** : Fait (Antigravity, illustrations reprises par Claude), publié le 15/11
- **Fichiers concernés** : `app/js/main.js`, `app/js/visuels.js`, `app/js/state.js`, `app/css/app.css`, `tests/run.cjs`
- **Objectif** : sur 218 personnes venues d'un téléphone, 31 ont ouvert l'appli installée. Proposer l'installation après une réussite, l'expliquer en images, et compter les installations iPhone.
- **Détails de modification** :
  1. **Quand proposer.** `rappelInstallationResultats()` (main.js ~ligne 996) ne s'affiche plus que si la moyenne de la séance est ≥ 0,7, en plus des conditions actuelles (connecté, téléphone, pas installée). Mémoriser dans `etat.reglages.install = { vues, derniere, jamais }` : au plus 3 propositions, au moins 2 jours (`jour()`) entre deux, aucune si `jamais`. `resultats()` doit passer la moyenne à la fonction.
  2. **Boutons** du bloc : « Comment faire » (ouvre `ouvrirGuideInstallModal`, inchangé), « Plus tard » (comportement actuel + compte la vue), « Ne plus proposer » (`jamais = true`). Classes existantes `bouton-fantome` / `bouton-lien`.
  3. **Images.** Dans `visuels.js`, exporter `illustrationInstall(os, etape)` qui renvoie un SVG (via `svg()` de ui.js, `viewBox="0 0 240 150"`, `role="img"` avec `aria-label`) : un téléphone stylisé, l'élément à toucher entouré d'un cercle doré `var(--titre-or)`, le reste en tons neutres. iPhone : étape 1 la barre d'outils de Safari avec le bouton Partager (carré + flèche vers le haut), étape 2 une liste avec la ligne « Sur l'écran d'accueil » (carré avec un +), étape 3 l'en-tête avec « Ajouter » en haut à droite. Android : étape 1 les trois points verticaux en haut à droite, étape 2 la ligne « Installer l'application ». Aucun logo ni nom de marque dessiné, seulement des formes simples.
  4. Dans `guideInstallation()` (main.js ~ligne 2375), pour les branches iPhone Safari, iPhone Chrome et Android Chrome/Edge, chaque `<li>` d'étape reçoit son image au-dessus du texte (`h('li', {}, illustrationInstall(os, n), texte)`). Les textes restent identiques. CSS : `.guide li svg { display:block; width:100%; max-width:240px; margin:6px auto; }`.
  5. **Mesure.** Au démarrage (`demarrer()`), si `estInstallee()` et `!etat.reglages.installeCompte`, appeler `suivre('installer_clic', { fait: true, premiere: true })` et poser `etat.reglages.installeCompte = true` puis `sauver()`.
- **Contraintes** : Vanilla JS et `h()`/`svg()` ; aucun texte nouveau en dehors de « Ne plus proposer » ; rendu correct en thème clair, rose et nuit.
- **Test à ajouter** (`matchSeul('installation')`) : en mode test sur `devices['iPhone 13']` avec un état connecté simulé (comme le test « rappel installation »), `resultats` avec une moyenne de 0,5 n'affiche pas `.res-rappel-install`, avec 0,9 l'affiche ; « Ne plus proposer » puis une nouvelle séance réussie ne l'affiche plus ; le guide modal contient 3 `svg` sur iPhone Safari. Adapter le test existant « rappel installation » si besoin (il passe une séance réussie).
- **Validation attendue** : `npm run check`, `npm run build`, suite complète verte, captures `CAP + 'install-guide-ios.png'` et `CAP + 'install-guide-android.png'`.

### [TÂCHE C3] Après un jeu lancé seul : « Encore une » et « Passer au Défi du jour »
- **Statut** : Fait par Claude, publié le 15/11
- **Fichiers concernés** : `app/js/main.js`, `tests/run.cjs`
- **Objectif** : 21 abandons sur 63 ont lieu dans un jeu lancé seul depuis la liste des jeux. Donner une suite évidente en fin de jeu.
- **Détails de modification** :
  - Dans `lancerMode(m, genre)` (~ligne 780), mémoriser `genre` dans l'objet de séance (passer `genre` à `lancer`, qui le range dans `S.genre`).
  - Dans `resultats(S, reussi)`, quand `S.type === 'mode'` et `S.mode !== 'atelier'`, ajouter en tête du `.pied` : un bouton `bouton-or` « Encore une » (`data-encore-mode`) qui appelle `lancerMode(S.mode, S.genre || null)`, et, si le Défi du jour n'est pas fait aujourd'hui (même test que l'accueil pour afficher le défi), un bouton `bouton-fantome` « Passer au Défi du jour » qui appelle `lancerDefi()`. « Retour au Palais » reste en dernier.
- **Test à ajouter** (`matchSeul('encore une')`) : lancer un mode (`paires`) en mode test, finir, vérifier les deux boutons, cliquer « Encore une » et vérifier qu'une nouvelle séance du même type démarre.
- **Validation attendue** : `npm run check`, `npm run build`, suite complète verte.

### [TÂCHE E] Carte du podium de la semaine sur le Palais
- **Statut** : Fait (Antigravity), publié le 15/11
- **Fichiers concernés** : `app/js/compte.js`, `app/js/main.js`, `app/css/app.css`, `tests/run.cjs`
- **Objectif** : le classement des amis se remet à zéro chaque lundi sans que personne le voie. Le lundi (et jusqu'à ce qu'on la ferme), une carte montre le podium de la semaine écoulée.
- **Détails de modification** :
  - `compte.js` : `export const monClassement = () => rpc('mon_classement');` Réponse : `null` ou `{ semaine, rang, sur, xp, podium: [{ pseudo, xp, moi }] }` (`semaine` = lundi de la semaine classée, même unité que `lundi()` de state.js).
  - `main.js`, à l'affichage de l'accueil (`accueil()`), si `connecte()` : appeler `monClassement()` sans bloquer l'affichage ; si la réponse existe, que `r.semaine === lundi() - 7` et que `etat.reglages.podiumVu !== r.semaine`, insérer en haut de la tribune une carte `section.carte-podium` :
    - titre `h2` : « La semaine dernière » ;
    - phrase : rang 1 → « Tu finis en tête, avec {xp} points. » ; sinon → « Tu finis {rang}e sur {sur}, avec {xp} points. » (`fmt()` pour les nombres) ;
    - liste `ol` des trois premiers : `medaille('or'|'argent'|'bronze', true)` de visuels.js, pseudo, points ; la ligne `moi` en gras ;
    - deux boutons : `bouton-fantome` « Voir mes amis » (`aller('amis')`) et `bouton-lien` « Fermer » (pose `etat.reglages.podiumVu = r.semaine`, `sauver()`, retire la carte).
  - CSS dans `app.css` avec les tokens existants, sans nouvelle couleur ; même gabarit que les autres cartes de la tribune.
- **Contraintes** : aucun texte en dehors de ceux ci-dessus ; rien si hors ligne ou si l'appel échoue.
- **Test à ajouter** (`matchSeul('podium')`) : en mode test avec session simulée, `page.route` sur `rpc/mon_classement` renvoie un classement de la semaine dernière (rang 2 sur 4) ; la carte s'affiche avec 3 lignes et le texte « Tu finis 2e sur 4 » ; « Fermer » la retire et elle ne revient pas au rechargement ; une réponse `null` n'affiche rien.
- **Validation attendue** : `npm run check`, `npm run build`, suite complète verte, capture `CAP + 'podium.png'`.

## Cahier des charges n° 3 : corrections de l'audit du 14/11 (15–20/11/2026)

Plan complet : https://claude.ai/artifact/4uVgRbEGp8ExbrvpTpbAfL (rapport : `notes/audit-securite-code.md`).
Antigravity ne prend que les tâches au statut exact « À faire ». Les autres sont prévues un jour précis : Claude passe leur statut à « À faire » le matin du jour prévu. Au plus 2 h 45 de travail par session ; si une tâche déborde, s'arrêter proprement (commit « WIP »), statut « Prêt pour Claude (incomplet) », et noter où l'on en est.
Chaque tâche ajoute ses tests dans un bloc `if (matchSeul('<nom>'))` du groupe 1 de `tests/run.cjs`.

### [TÂCHE 1a] Mode test réservé à la machine locale
- **Statut** : Fait (publié le 15/11, version cdebea5e44fb)
- **Fichiers concernés** : `app/js/ui.js`, `app/js/main.js`, `app/js/suivi.js`, `app/js/chouette.js`, `app/js/jeux-l1.js`, `tests/run.cjs`
- **Objectif** : aujourd'hui `https://gdroit.eu/?test` ouvre l'appli sans compte et écrit les bonnes réponses dans le DOM. `?test` ne doit plus rien changer hors de la machine de développement.
- **Détails de modification** :
  - Dans `ui.js`, ajouter et exporter : `export const modeTest = () => typeof location !== 'undefined' && new URLSearchParams(location.search).has('test') && ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname);`
  - Remplacer **chaque** lecture de `has('test')` par `modeTest()`, en gardant les autres conditions telles quelles (ex. `p.has('test') && !p.has('anim')` devient `modeTest() && !p.has('anim')`). Occurrences au 15/11 : chouette.js 143 et 177 ; jeux-l1.js 75 ; main.js 103, 208, 287, 509, 735, 2149, 2223, 2298, 2411, 2428, 2431, 2432, 2442, 2443, 2446, 2450 ; suivi.js 26 ; ui.js 35 et 92. Vérifier par `grep -n "has('test')" app/js/*.js` qu'il n'en reste aucune.
  - `suivi.js` n'importe pas `ui.js` : y importer `modeTest` depuis `./ui.js` (pas d'import circulaire : ui.js n'importe ni suivi.js ni compte.js).
- **Contraintes** : aucun changement de comportement sur localhost (toute la suite existante doit rester verte sans modification).
- **Test à ajouter** (`matchSeul('mode test')`) : servir `docs/` comme les autres tests, ouvrir `http://127.0.0.1:<port>/?test` et vérifier que `window.__app` existe ; puis ouvrir `http://gdroit.localhost:<port>/?test` (Chromium résout `*.localhost` vers la machine) et vérifier que `window.__app` est `undefined` et qu'aucun élément `[data-ok]` n'existe.
- **Validation attendue** : `npm run check`, `npm run build`, suite complète verte.

### [TÂCHE 7a] Une épreuve qui plante ne bloque plus la séance
- **Statut** : Fait (publié le 15/11, version cdebea5e44fb)
- **Fichiers concernés** : `app/js/main.js`, `tests/run.cjs`
- **Objectif** : une erreur levée immédiatement par un jeu échappe aujourd'hui au `.catch` et fige la séance.
- **Détails de modification** :
  - Ligne ~940 : remplacer `Promise.resolve(TOUS_JEUX[r.type](scene, ctx, r, ix)).catch((e) => {` par `Promise.resolve().then(() => TOUS_JEUX[r.type](scene, ctx, r, ix)).catch((e) => {` (corps du catch inchangé). Ajouter dans ce catch : `suivre('erreur', { type: String(r.type).slice(0, 30), m: String(e?.message || e).slice(0, 120) });`.
  - Dans `demarrer()`, à côté des écouteurs `online` / `visibilitychange` (~ligne 2464), ajouter : `window.addEventListener('unhandledrejection', (e) => suivre('erreur', { m: String(e.reason?.message || e.reason).slice(0, 120) }));`
- **Test à ajouter** (`matchSeul('epreuve en erreur')`) : en mode test, lancer via `window.__app` une séance dont un round a `type: 'inexistant'` ; vérifier que le texte « Cette épreuve n’a pas pu s’afficher » apparaît et que « Continuer » mène à l'épreuve suivante ou aux résultats.
- **Validation attendue** : `npm run check`, `npm run build`, suite complète verte.

### [TÂCHE 7b] Minuteurs et écouteurs arrêtés quand on quitte une épreuve
- **Statut** : Fait (publié le 15/11)
- **Fichiers concernés** : `app/js/jeux-l1.js`, `app/js/dunk.js`, `app/js/main.js`, `tests/run.cjs`
- **Objectif** : après « Quitter », certaines boucles continuent sur un écran détaché.
- **Détails de modification** (le contexte de jeu offre `ctx.nettoyage(fonction)`, appelée à la sortie de séance) :
  - `jeux-l1.js`, mot mystère (~ligne 140) : juste après `document.addEventListener('keydown', physique);`, ajouter `ctx.nettoyage(() => document.removeEventListener('keydown', physique));`.
  - `jeux-l1.js`, pièces qui tombent (~ligne 210–223) : ajouter `ctx.nettoyage(() => { cancelAnimationFrame(anim); fini_ = true; });` à la création du jeu (adapter le nom des variables si besoin).
  - `dunk.js` (~ligne 135) : ajouter `ctx.nettoyage(() => clearInterval(minuteur));` une fois, à la création.
  - `main.js`, chrono du partiel (~ligne 828) : après `const tic = setInterval(...)`, ajouter `S.nettoyer.push(() => clearInterval(tic));`.
- **Test à ajouter** (`matchSeul('quitter en cours')`) : lancer une séance en mode test, quitter au milieu d'une épreuve dunk puis d'une épreuve « pièces » ; attendre 3 s ; aucune erreur `pageerror`, et `document.querySelectorAll('.dunk, .rg-piece').length === 0`.
- **Validation attendue** : `npm run check`, `npm run build`, suite complète verte.

### [TÂCHE 5a] Défi d'ami illisible refusé proprement
- **Statut** : Fait par Claude le 15/11 (publié)
- **Fichiers concernés** : `app/js/main.js`, `tests/run.cjs`
- **Détails de modification** : dans `releverDefi` (~ligne 1925), juste après le test `d.statut !== 'ouvert'`, ajouter :
  `if (!Array.isArray(d.rounds) || !d.rounds.length || d.rounds.length > 8 || d.rounds.some((r) => !r || !TOUS_JEUX[r.type])) return toast('Ce défi est illisible.');`
- **Test à ajouter** (`matchSeul('defi illisible')`) : intercepter avec `page.route` l'appel `rpc/lire_defi` pour renvoyer un défi ouvert dont `rounds` vaut `[{ "type": "inexistant" }]`, appeler `releverDefi` (l'exposer dans `window.__app` si besoin) et vérifier le toast « Ce défi est illisible. » et l'absence de séance.
- **Validation attendue** : `npm run check`, `npm run build`, suite complète verte.

### [TÂCHE 3b] Appareils : inscription par la fonction serveur, désinscription à la déconnexion
- **Statut** : Fait par Claude le 15/11 (publié)
- **Fichiers concernés** : `app/js/compte.js`, `app/js/notif.js`, `tests/run.cjs`
- **Détails de modification** :
  - `compte.js` ligne ~226 : `inscrireAppareil` devient `(abonnement) => rpc('inscrire_appareil', { point: abonnement.endpoint, abonnement })`.
  - Ajouter `export const retirerAppareil = (point) => api(\`appareils?point=eq.${encodeURIComponent(point)}\`, { method: 'DELETE', prefer: 'return=minimal' });`
  - Dans `deconnexion()` (ligne ~81), avant l'appel `logout` : récupérer l'abonnement (`const reg = await navigator.serviceWorker?.getRegistration(); const ab = await reg?.pushManager?.getSubscription();`), puis si `ab` : `try { await retirerAppareil(ab.endpoint); } catch {}` et `try { await ab.unsubscribe(); } catch {}`. Tout dans des `try`, la déconnexion ne doit jamais échouer à cause de ça.
- **Test à ajouter** (`matchSeul('deconnexion appareil')`) : avec `page.route`, simuler une session et un abonnement (ou vérifier simplement qu'une requête `DELETE .../appareils?point=` part quand un abonnement existe) ; sans abonnement, la déconnexion se fait sans erreur.
- **Validation attendue** : `npm run check`, `npm run build`, suite complète verte.

### [TÂCHE 4c] Envoi après un achat ; confirmation avant une déconnexion qui perdrait des données
- **Statut** : Fait par Claude le 15/11 (publié)
- **Fichiers concernés** : `app/js/main.js`, `tests/run.cjs`
- **Détails de modification** :
  - Dans `acheter(item)` (~ligne 1433), après la sauvegarde de l'achat réussi : `setTimeout(envoyerProgression, 1000);` (la fin de séance envoie déjà, ligne ~1002).
  - Les deux boutons « Se déconnecter » (lignes ~2105 et ~2206) appellent une nouvelle fonction `async function seDeconnecter()` :
    1. `const ok = await envoyerProgression();`
    2. si `ok === false` et `etat.modifie > (etat.compte?.sync || 0)` : ouvrir un voile (même modèle que les autres fenêtres, classe `voile` + `boite`) avec le titre « Ta dernière séance n’est pas encore sauvegardée », le texte « Te déconnecter maintenant l’effacera de ce téléphone. Reconnecte-toi à internet pour la garder. » et deux boutons : « Rester connecté » (ferme le voile) et « Me déconnecter quand même » (continue) ;
    3. sinon, ou après confirmation : `await deconnexion(); remplacerEtat({}); location.reload();`.
  - Textes à reprendre exactement (apostrophes typographiques comprises).
- **Test à ajouter** (`matchSeul('deconnexion hors ligne')`) : simuler `navigator.onLine === false` (`context.setOffline(true)`) avec un état modifié ; cliquer « Se déconnecter » : la fenêtre apparaît ; « Rester connecté » la ferme sans déconnecter.
- **Validation attendue** : `npm run check`, `npm run build`, suite complète verte.

### [TÂCHE 11a] Politique de sécurité du contenu (CSP)
- **Statut** : Fait par Claude le 15/11 (publié)
- **Fichiers concernés** : `app/index.html`, `app/partager.html`, `scripts/build.mjs`, `tests/run.cjs`
- **Détails de modification** :
  - Dans les deux pages, ajouter dans `<head>` : `<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self'; connect-src 'self' https://*.supabase.co; img-src 'self' data: blob:; style-src 'self' 'unsafe-inline'; media-src 'self' blob:; font-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'">`.
  - Vérifier qu'aucun `<script>` en ligne n'existe dans `app/index.html` (sinon le déplacer dans un fichier `.js`).
- **Test à ajouter** (`matchSeul('csp')`) : ouvrir l'accueil, une séance, la boutique et `partager.html` en collectant les messages console ; échouer si un message contient « Content Security Policy ».
- **Validation attendue** : `npm run check`, `npm run build`, suite complète verte (aucune violation CSP dans toute la suite : ajouter si possible la vérification console aux pages existantes).

### [TÂCHE 8b] Sauvegarde groupée
- **Statut** : Fait par Claude le 15/11 (publié)
- **Fichiers concernés** : `app/js/state.js`, `tests/run.cjs`
- **Détails de modification** :
  - `sauver()` (ligne ~274) met `etat.modifie = Date.now()` tout de suite, mais l'écriture (`JSON.stringify`, `localStorage.setItem`, `ecrireSecours`) passe dans une fonction `ecrire()` appelée par un `setTimeout(ecrire, 300)` (un seul minuteur à la fois : `clearTimeout` avant).
  - Exporter `sauverMaintenant()` qui annule le minuteur et appelle `ecrire()` tout de suite. L'appeler sur `visibilitychange` (page cachée) et `pagehide`, enregistrés une fois dans `state.js`.
- **Test à ajouter** (`matchSeul('sauvegarde groupee')`) : finir une séance, recharger aussitôt la page (moins de 300 ms), vérifier que les points de la séance sont toujours là.
- **Validation attendue** : `npm run check`, `npm run build`, suite complète verte.

### [TÂCHE 7c] Fenêtres accessibles au clavier
- **Statut** : Fait par Claude le 15/11 (publié)
- **Fichiers concernés** : `app/js/ui.js`, `app/js/main.js`, `app/js/atelier.js`, `app/js/lexique.js`, `tests/run.cjs`
- **Détails de modification** :
  - Dans `ui.js`, exporter `ouvrirVoile(boite, { fermer } = {})` : crée `h('div', { class: 'voile' }, boite)`, pose sur `boite` `role="dialog"` (si absent) et `aria-modal="true"`, l'ajoute au `body`, mémorise `document.activeElement`, place le focus sur le premier élément focalisable de la boîte (sinon sur la boîte avec `tabindex="-1"`), ferme sur Échap et sur un clic dans le voile hors de la boîte, garde Tab dans la boîte, et à la fermeture retire l'écouteur clavier et rend le focus à l'élément mémorisé. Renvoie une fonction `fermer()`.
  - Remplacer les 17 créations de voile de `main.js` (`grep -n "class: 'voile'" app/js/main.js`) par `ouvrirVoile(...)`, sans changer leur contenu ni leurs textes. Les boutons qui faisaient `voile.remove()` appellent la fonction `fermer` renvoyée.
  - `atelier.js` ligne ~57, `lexique.js` ligne ~34 et `ui.js` ligne ~374 (`role: 'button'`) : ajouter `onKeydown: (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.currentTarget.click(); } }`.
- **Contraintes** : rendu visuel identique ; ne pas toucher au voile de Lexou en colère (`.colere-voile`, il gère déjà Échap).
- **Test à ajouter** (`matchSeul('fenetres clavier')`) : ouvrir « Faire un retour » et la boutique : le focus est dans la boîte, Échap ferme, le focus revient au bouton d'origine.
- **Validation attendue** : `npm run check`, `npm run build`, suite complète verte.

### [TÂCHE 8a] Lexou : une planche décodée à la fois
- **Statut** : Fait par Claude le 15/11 (publié)
- **Fichiers concernés** : `app/js/lexou.js`
- **Objectif** : aujourd'hui toutes les planches d'une animation sont décodées avant le départ (près de 100 Mo de mémoire sur iPhone).
- **Détails de modification** :
  - `lexouAnime` attend seulement la planche 0 puis lance ; pendant la lecture de la planche k, il précharge la planche k+1 (`new Image()` + `decode()`). Si la planche suivante n'est pas prête quand on y arrive, rester sur la dernière image affichée et réessayer à l'image suivante.
  - `prechargerLexou(nom)` garde son comportement (toutes les planches) : il sert au voile de Lexou en colère, qui doit être prêt d'un coup.
  - Dans `tic`, ne réécrire `background-image` / `background-position` que si l'indice d'image a changé.
- **Contraintes** : aucun changement visible. Claude enregistre une vidéo avant/après pour Gaspard avant publication.
- **Validation attendue** : `npm run check`, `npm run build`, suite complète verte.

## Tâches en attente (Roadmap)

### 1. Nom du professeur de l'équipe 3 en L1
* **Statut** : 🟡 En attente de l'information
* **Fichiers concernés** : `app/js/main.js` ou données d'onboarding
* **Action** : Ajouter le nom du professeur dès communication par Gaspard.

### 2. Relecture et ajustement du contenu L1
* **Statut** : 🟢 Relu par Gaspard le 14/11 : cohérent, rien à corriger
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
- **15/11/2026 (Tâche E)** :
  - `app/js/compte.js` : export de `monClassement = () => rpc('mon_classement')`.
  - `app/js/state.js` : initialisation de `podiumVu: null` dans `reglages`.
  - `app/js/main.js` :
    - Dans `accueil()`, si connecté : appel asynchrone non-bloquant de `monClassement()`.
    - Insertion de `section.carte-podium` en tête de `.tribune` si la semaine correspond à la semaine précédente (`r.semaine === lundi() - 7`) et n'a pas encore été vue (`etat.reglages.podiumVu !== r.semaine`).
    - Affichage du titre « La semaine dernière », de la phrase de classement avec `fmt()` (« Tu finis en tête, avec {xp} points. » ou « Tu finis {rang}e sur {sur}, avec {xp} points. »), du podium des 3 premiers avec médailles or/argent/bronze et ligne `moi` en gras, du bouton fantôme « Voir mes amis » (`aller('amis')`) et du bouton lien « Fermer » (`etat.reglages.podiumVu = r.semaine`, `sauver()`, suppression de la carte).
  - `app/css/app.css` : ajout du token de médaille `bronze` et styles complets pour `.carte-podium`.
  - `tests/run.cjs` : ajout du bloc de test `podium` dans le groupe 1 (affichage du rang 2 sur 4 et des 3 lignes avec session simulée, fermeture et non-réapparition au rechargement, réponse `null` sans affichage, capture `podium.png`).
  - Validation : `npm run check`, `npm run build`, suite complète `npm test` 100% verte (510.7s sur c9c2e7b).
- **15/11/2026 (Tâche B)** :
  - `app/js/visuels.js` : export de `illustrationInstall(os, etape)` générant les SVGs pas-à-pas (téléphone stylisé, cercle doré `var(--titre-or)` sur l'élément à toucher, tons neutres) pour iOS Safari (1. Partager, 2. Sur l'écran d'accueil, 3. Ajouter) et Android (1. Trois points, 2. Installer l'application).
  - `app/js/state.js` : initialisation de `install: null` et `installeCompte: false` dans `reglages`.
  - `app/js/main.js` :
    - `rappelInstallationResultats(moyenne)` : affichage conditionné à `moyenne >= 0.7`, au plus 3 propositions (`vues < 3`), au moins 2 jours entre deux (`jour() - derniere >= 2`), et masqué définitivement si `jamais` est vrai.
    - Ajout du bouton « Ne plus proposer » (`jamais = true`) et comptage de la vue dans « Plus tard ».
    - `guideInstallation()` : intégration des illustrations SVG au-dessus de chaque étape pour iOS Safari, iOS Chrome et Android Chrome/Edge.
    - `demarrer()` : mesure unique `suivre('installer_clic', { fait: true, premiere: true })` et enregistrement de `etat.reglages.installeCompte = true` lors de la première ouverture installée.
  - `app/css/app.css` : styles pour `.guide li svg` (centrage, max-width 240px) et `flex-wrap: wrap;` sur `.res-rappel-actions`.
  - `tests/run.cjs` : adaptation du test `rappel installation` (vérification du bouton « Ne plus proposer ») et ajout du bloc `installation` dans le groupe 1 (non-affichage à 0.5, affichage à 0.9, 3 SVGs sur iPhone Safari, masquage après « Ne plus proposer », 2 SVGs et capture sur Android Pixel 7).
  - Captures : `install-guide-ios.png` et `install-guide-android.png`.
  - Validation : `npm run check`, `npm run build`, suite complète `npm test` 100% verte (512.4s sur f6b2905).
- **15/11/2026 (Tâche 7b)** :
  - `app/js/jeux-l1.js` :
    - Mot mystère : suppression de l'écouteur clavier physique via `ctx.nettoyage` si le joueur quitte la séance.
    - Grand rangement : annulation de l'animation `anim` et verrouillage `fini_ = true` via `ctx.nettoyage` lors de la sortie, évitant les lancements résiduels.
  - `app/js/dunk.js` :
    - Enregistrement du nettoyage de `minuteur` via `ctx.nettoyage` et arrêt automatique du timer si `terrain` est détaché du DOM.
  - `app/js/main.js` :
    - Nettoyage du chronomètre de partiel lors de l'abandon ou en fin de séance, tout en le préservant entre les épreuves successives du partiel.
  - `tests/run.cjs` : ajout du test `quitter en cours` (groupe 1) validant l'abandon en plein Dunk et en plein Rangement, sans erreur résiduelle et avec disparition des éléments sous 3s.
  - Validation : `npm run check`, `npm run build`, suite complète `NODE_PATH=$(npm root -g) node tests/run.cjs --parallele` 100% verte (512.4s).
- **15/11/2026 (Tâche 7a)** :
  - `app/js/main.js` :
    - Enrobage de l'appel au jeu dans `Promise.resolve().then(() => TOUS_JEUX[r.type](scene, ctx, r, ix)).catch(...)` pour intercepter les erreurs synchrones lors de l'initialisation d'un round.
    - Ajout du suivi `suivre('erreur', ...)` dans le bloc catch d'épreuve et sur l'événement `unhandledrejection` de `window` dans `demarrer()`.
  - `tests/run.cjs` : ajout du bloc de test `epreuve en erreur` dans le groupe 1 vérifiant l'affichage du message d'erreur et la possibilité de continuer vers les résultats sans blocage lors d'un round inexistant.
  - Validation : `npm run check`, `npm run build`, suite complète `NODE_PATH=$(npm root -g) node tests/run.cjs --parallele` 100% verte (513.1s sur d01d814).
- **15/11/2026 (Tâche 1a)** :
  - `app/js/ui.js` : export de la fonction `modeTest` vérifiant que l'URL contient le paramètre `test` et que l'hôte fait partie de `['localhost', '127.0.0.1', '[::1]']`. Remplacement des appels directs à `has('test')` par `modeTest()`.
  - `app/js/chouette.js`, `app/js/jeux-l1.js`, `app/js/suivi.js`, `app/js/main.js` : remplacement de toutes les occurrences de `has('test')` par `modeTest()`.
  - `tests/serveur.cjs` : écoute sur `0.0.0.0` pour répondre indifféremment sur `127.0.0.1`, `localhost` et les sous-domaines `*.localhost`.
  - `tests/run.cjs` : ajout du bloc de test `mode test` dans le groupe 1 vérifiant la présence de `window.__app` sur `http://127.0.0.1:<port>/?test` et son absence (`undefined`, sans aucun repère `[data-ok]`) sur `http://gdroit.localhost:<port>/?test`.
  - Validation : `npm run check`, `npm run build`, suite complète `NODE_PATH=$(npm root -g) node tests/run.cjs --parallele` 100% verte (524.5s sur 48825d0).
- **14/11/2026 (Tâche P)** :
  - `app/css/app.css` : ajout des tokens de mouvement dans `:root` (`--ressort`, `--sortie`, `--t-court`, `--t-moyen`, `--t-long`), règles pour `.clone-sortant`, gestion de la pastille d'onglet unique `.onglet-pastille`, adaptation accessibilité pour `prefers-reduced-motion` et `[data-effets='non']` / `[data-effets='leger']`, ajout de `overflow-x: clip` sur `html, body`.
  - `app/js/main.js` :
    - Mise en place des transitions synchrones dans `montrer()` avec clonage de l'écran sortant (`.clone-sortant`) et Web Animations API selon le sens (`avant`, `arriere`, `onglet`, `neutre`).
    - Orientation du sens de navigation dans `aller()` et sur tous les boutons retour (`fixerSens('arriere')`).
    - Animation d'entrée des épreuves en carte sur la table et rebond de la pastille dans `lancer()`.
    - Cascade d'entrée des cartes de statistiques, rebond du titre et défilement progressif des nombres sur 600ms dans `resultats()`.
    - Animations d'ouverture du Palais conditionnées par `animerPalais` : descente du bandeau supérieur, montée avec rebond de la carte série, défilement du compteur de série, apparition en cascade des sceaux de la semaine avec effet cachet sur aujourd'hui, saut de la chouette, cascade des tuiles du Palais et pop du compteur de jetons en cas de gain.
    - Glissement fluide de la pastille `.onglet-pastille` dans `afficherOnglets()` et rebond sur l'icône touchée.
    - Respect des réglages d'effets visuels et désactivation en mode test sauf si `&anim` est présent.
  - `tests/run.cjs` : ajout du bloc de test `animations` (groupe 1) vérifiant sous `?test&anim` la disparition du clone sous 700ms, l'interactivité immédiate du nouvel écran et l'absence de débordement horizontal pendant et après l'animation.
  - `scripts/antigravity/videos-p.cjs` : génération automatique des 5 vidéos de démonstration sur iPhone 13 dans `.antigravity/videos/` (`P1-passages.webm`, `P2-epreuves.webm`, `P3-resultats.webm`, `P4-palais.webm`, `P5-onglets.webm`).
  - Validation : `npm run check`, `npm run build`, suite complète `NODE_PATH=$(npm root -g) node tests/run.cjs --parallele` 100% verte (514.9s).
- **14/11/2026 (Tâche L)** :
  - `app/js/engine.js` : export de `PRODUCTION` et du helper `estProduction`, implémentation de `roundTrous` et `roundPlaide` intégrés à `tirerRound` et `tirerOblig`.
  - Retrait d'`architecte` du défi du jour administratif dans `composerDefi` (remplacé par `plan`) et exclusion de `plume` dans `composerDefiIntro`.
  - `composerBoss` et `composerBossIntro` : composition des 6 épreuves de chaque audience avec exactement une épreuve de production selon l'ordre de préférence fixé (obligations : formule entière > atelier > trous > plaide ; administratif : formule entière > architecte > atelier > trous > plaide ; L1 : formule entière > plume > mot à défaut), jamais en première position.
  - `app/js/main.js` : remplacement de `plume` par `nuancier` dans les Trois minutes de droit constitutionnel (`lancerExpress`) et filtrage de `plume` dans `reviserZone`. Vérification des niveaux d'examen (`NIVEAUX_EXAMEN`).
  - `app/js/examen.js` : réutilisation de `roundTrous` et `roundPlaide` partagés depuis `engine.js`.
  - `tests/run.cjs` : ajout du bloc de test `production` (groupe 1) validant 200 défis du jour, Trois minutes et révisions sans production par matière (rng fixe), et 200 audiences par matière contenant exactement une production jamais en premier.
  - Suite de tests validée : `npm run check`, `npm run build`, `npm test` vert (538.0s).
- **14/11/2026 (Tâche O)** :
  - `app/js/jeux-l1.js` : phase de mémorisation initiale au lancement du Memory : 12 cartes visibles (`ouverte`), non cliquables, consigne avec compte à rebours dynamique de 20s (`.mem-rebours`) et bouton discret « C’est mémorisé » (`.mem-pret`) qui referme les cartes immédiatement.
  - Nettoyage du chronomètre si le joueur quitte l'écran ou au terme des 20s.
  - `app/css/app.css` : styles de `.mem-consigne:has(.mem-pret)`, `.mem-rebours` et `.mem-pret`.
  - `tests/run.cjs` : adaptation de `jouerParfait` et `pasL1` pour cliquer `.mem-pret`, vérification des 12 cartes ouvertes et du clic sur `.mem-pret` dans le bloc « memory lisible », capture `memory-memorise.png` sans débordement.
  - Suite de tests validée : `npm run check`, `npm run build`, `npm test` vert (521.2s).
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
