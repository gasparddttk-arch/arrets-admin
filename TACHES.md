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

Ordre conseillé : F, G, H (gros effet, peu de risque), puis I, J, K, L, M.

### [TÂCHE F] Le banc de pièces : glisser au lieu de trier une carte à la fois (Antigravity)
- **Statut** : À faire
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
- **Statut** : À faire
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
- **Statut** : À faire
- **Fichiers concernés** : `app/css/app.css`, `app/js/main.js`, `tests/run.cjs`
- **Détails de modification** :
  - **Décor pendant les épreuves** : les animations du décor choisi en boutique (ex. « Le jardin », feuilles qui tombent) restent sur le Palais et les écrans de résultats, mais s'arrêtent et se masquent pendant une épreuve (tout écran de jeu, du premier round à l'écran de fin exclu).
  - **Contraste** : tout texte de réponse (`.option`, cartes, pièces, colonnes) doit avoir un contraste d'au moins 4,5:1 avec son fond, y compris pendant l'animation d'apparition (pas d'opacité réduite sur le texte, seulement sur le fond). Ajouter au test une vérification automatique du contraste des `.option` sur un QCM.
  - **Grade coupé en haut** (« Auditeur de 2e cla… ») : afficher le grade sans troncature, sur deux lignes si besoin, ou en version courte (« Auditeur 2e cl. ») sous 360 px.
  - **Memory** : le dos des cartes porte un repère distinct par position (lettre A à L en petit, couleur `--texte-2`), pour qu'on s'y retrouve.
- **Validation attendue** : captures avant/après (QCM, rangement, résultats avec le décor « jardin ») ; suite complète verte.

### [TÂCHE I] Jouer d'abord, installer ensuite (Claude, puis Antigravity)
- **Statut** : Attend Claude (choix du meilleur exercice par matière, d'après le suivi d'usage, et textes)
- **Objectif** : quelqu'un qui ouvre gdroit.eu dans un navigateur joue tout de suite, sans compte ni notice. L'invitation à installer vient après, sur l'écran de fin.
- **Parcours visé** :
  1. Premier écran dans le navigateur : « Tu es en… » L1 / L2, puis la matière (et l'équipe pour l'admin, les obligations et l'intro).
  2. Une séance découverte d'un seul exercice, le meilleur de la matière (liste `DECOUVERTE` à revoir par Claude).
  3. Écran de fin : le résultat, puis « Maintenant, installe Gdroit » avec le guide d'installation adapté au navigateur (déjà dans `guideInstallation()`), et « Ta série commence dans l'appli ».
  4. Dans l'appli installée : connexion, puis le Palais.
- **À préciser par Claude** : le meilleur exercice de chaque matière, les textes des trois écrans, ce qui arrive si la personne refuse d'installer (rejouer un exercice ? se connecter dans le navigateur ?).

### [TÂCHE J] Les défis entre amis en L1 (Claude, puis Antigravity)
- **Statut** : Attend Claude (migration Supabase, avec l'accord de Gaspard)
- **Constat** : la fiche d'un ami ne propose que « Administratif » et « Obligations ». La base refuse aussi tout autre défi (`defis_amis_matiere_check` n'accepte que `admin` et `oblig`). Et le test « même équipe » compare l'équipe L1 de l'ami (`resume.equipe`) à l'équipe L2 de l'utilisateur.
- **Partie Claude** : migration qui accepte `intro` et `constit` dans `defis_amis.matiere` ; ajouter `xpConstit` au `resume()`.
- **Partie Antigravity** (une fois la migration faite) :
  - Dans la fiche d'un ami, proposer les matières de l'année commune : deux L2 → Administratif, Obligations (même équipe L2) ; deux L1 → Droit constitutionnel (toujours), Introduction au droit (même équipe L1). Un L1 et un L2 : « Vous n'avez pas de matière en commun pour l'instant. »
  - Comparer `resume.annee` et `resume.equipe` avec `etat.annee` et l'équipe de la bonne année.
  - Le tableau de comparaison montre les lignes de l'année (L1 : Introduction, Constitutionnel ; L2 : Administratif, Obligations).
  - `releverDefi` : pour l'intro, refuser si l'équipe L1 diffère (« Ce défi porte sur le cours de l'autre équipe »).
  - Test : deux comptes L1 simulés se défient en constit puis en intro.

### [TÂCHE K] Nouvel exercice « La formule » : lire la formule de la Cour, en déduire le plan (Claude, puis Antigravity)
- **Statut** : Attend Claude (contenu)
- **Idée** : les formules de la Cour de cassation et du Conseil d'État disent ce que le juge a contrôlé et avec quelle intensité, donc où se trouve le plan d'un commentaire. Inspiré d'une méthode vue sur TikTok (Juris'Up) ; ni ses textes ni ses plans ne sont repris.
- **Trois temps, sur un arrêt du cours** :
  1. **Lire** : l'extrait décisif de l'arrêt ; toucher la formule et dire ce qu'elle révèle (cassation pour violation de la loi, manque de base légale, rejet avec contrôle poussé, rejet avec contrôle léger, appréciation souveraine).
  2. **Choisir** : trois squelettes de plan, un seul correspond au type de décision.
  3. **Remplir** : glisser les morceaux de l'arrêt (règle, condition, conséquence) dans les crochets du squelette, avec le banc de pièces (tâche F), puis comparer au plan modèle propre à l'arrêt.
- **Partie Claude** : 6 à 8 arrêts des obligations (équipe 1) dont la formule est nette, texte vérifié sur Judilibre ou Légifrance ; squelettes, pièges, plans modèles ; format de données dans `content/`. Puis l'administratif (formules du Conseil d'État : erreur de droit, erreur de qualification juridique, erreur manifeste d'appréciation, dénaturation).
- **Exactitude** : c'est la cour d'appel qui « a violé » ou « a privé sa décision de base légale » ; la Cour de cassation le lui reproche.
- **Partie Antigravity** : le moteur (`app/js/formule.js`), branché dans les modes d'examen (tâche L), tests.

### [TÂCHE L] Les exercices de production réservés aux modes d'examen et aux audiences (Claude, puis Antigravity)
- **Statut** : Attend Claude (répartition des exercices)
- **Principe (Gaspard)** : les exercices de production (écrire, construire, remplir un plan) restent dans les modes d'examen (« Appel », « Cassation », « Partiel blanc ») et dans les épreuves difficiles, notamment l'audience qui valide une chambre. Les séances du quotidien restent courtes et en reconnaissance.
- **Partie Claude** : revoir `NIVEAUX_EXAMEN` et `composerBoss` : quels exercices où, et le seuil pour gagner l'audience (au moins un exercice de production par audience).

### [TÂCHE M] Une révision du jour fondée sur les erreurs, visible (Claude, puis Antigravity)
- **Statut** : Attend Claude (conception)
- **Constat** : la répétition espacée existe déjà (`noter`, `aRevoir`), mais elle est cachée dans le défi du jour et les révisions de chambre. Certains jeux ne notent pas les erreurs (vérifier chaque jeu : `ctx.noter`).
- **Objectif** : sur le Palais, une entrée « À revoir aujourd'hui : N fiches » qui lance une séance faite uniquement de ce que l'étudiant a raté, et qui disparaît quand il n'y a rien à revoir.
- **Partie Claude** : la règle (combien de fiches, quels exercices pour une fiche ratée), les textes.

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
