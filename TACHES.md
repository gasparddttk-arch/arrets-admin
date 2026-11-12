# GDROIT : Journal et relais des tâches (Claude ↔ Antigravity)

Ce fichier sert de carnet de transmission entre **Claude** (qui conçoit et briefe) et **Antigravity** (qui exécute, teste et valide sur la machine).

---

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
* **À faire** : cas d'administratif (le syllogisme y reste en attendant), nouveaux cas à chaque séance (inexécution, responsabilité).

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
