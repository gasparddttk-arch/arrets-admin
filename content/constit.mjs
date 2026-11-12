// L1, droit constitutionnel (cours du Pr Armel Le Divellec, équipe 2). Ouvert à toute la L1.
// Sources : notes des leçons 1 à 6, plaquette de TD (séances 1 à 6). Les citations et les articles
// sont recopiés de la plaquette ; les liens entre organes suivent les textes qu'elle reproduit.
// Le build écrit docs/constit.json à partir de ce fichier.

export const zones = [
  { id: 1, titre: 'Le droit constitutionnel', lieu: 'Droit public, droit politique, légalité et légitimité' },
  { id: 2, titre: 'Le pouvoir, le droit, l’État', lieu: 'Institutions, souveraineté, formes de l’État' },
  { id: 3, titre: 'Distinguer les pouvoirs', lieu: 'Angleterre, Locke, Montesquieu, États-Unis, garantie des droits' },
  { id: 4, titre: 'La Révolution et 1791', lieu: 'États généraux, représentation, Constitution de 1791' },
  { id: 5, titre: 'Présidentiel et parlementaire', lieu: 'États-Unis, gouvernement de cabinet, Weimar' },
  { id: 6, titre: 'Les Chartes de 1814 et 1830', lieu: 'Octroi, monarchie constitutionnelle, ministres' },
  { id: 7, titre: 'Les IIe et IIIe Républiques', lieu: 'Arrive avec le cours', travaux: true },
  { id: 8, titre: 'Les facettes de la constitution', lieu: 'Arrive avec le cours', travaux: true },
  { id: 9, titre: 'La justice constitutionnelle', lieu: 'Arrive avec le cours', travaux: true },
  { id: 10, titre: 'L’Allemagne', lieu: 'Arrive avec le cours', travaux: true },
];

// Les notions : nom, définition, version courte, exemple, piège, mot à trouver.
const N = (id, z, etiquette, nom, regle, c, ex = null, pg = null, mot = null) => ({ id, z, etiquette, nom, regle, c, ex, pg, mot });
export const notions = [
  // 1. Le droit constitutionnel
  N('droit-constitutionnel', [1], 'Notion', 'Droit constitutionnel', 'Ensemble des institutions et des règles relatives à la constitution politique d’un pays ; c’est aussi une discipline, enseignée à Paris depuis 1834.', 'Les institutions et les règles de la constitution politique', null, 'Discipline jeune : au XIXe siècle, on ne l’enseigne presque pas.'),
  N('droit-politique', [1], 'Notion', 'Droit politique', 'Ancien nom du droit constitutionnel : un droit produit par la volonté politique, fabriqué par ceux-là mêmes auxquels il s’applique.', 'Un droit fait par ceux qu’il gouverne', 'Rousseau sous-titre le Contrat social « Principes du droit politique ».'),
  N('droit-public', [1], 'Branche', 'Droit public', 'Droit des affaires de l’État et de la collectivité : il met les individus en relation avec la puissance de l’État, qui dispose de droits exorbitants.', 'Les individus face à la puissance de l’État', 'Droit constitutionnel, administratif, financier.', 'Ulpien l’opposait déjà au droit privé, qui conserve les intérêts particuliers.'),
  N('constitution', [1], 'Notion', 'Constitution', 'Objet complexe, entre forme et matière : un texte placé au plus haut niveau juridique, et un contenu qui organise le pouvoir politique.', 'Entre forme et matière, au sommet du droit', null, null, 'CONSTITUTION'),
  N('institution', [1, 2], 'Notion', 'Institution', 'Création humaine détachée de ses auteurs et inscrite dans la durée.', 'Une création qui survit à ceux qui l’occupent', 'La présidence de la République demeure quand son titulaire change.', null, 'INSTITUTION'),
  N('competence-liee', [1], 'Notion', 'Compétence liée', 'Compétence que son titulaire doit exercer dans le sens prévu dès que les conditions sont réunies : il n’a pas le choix.', 'Les conditions réunies, on doit agir', 'Le gouvernement censuré par le Parlement : le président est lié par la règle.'),
  N('competence-discretionnaire', [1], 'Notion', 'Compétence discrétionnaire', 'Compétence que son titulaire exerce librement, quand et comme il le juge bon.', 'On agit si on le juge bon', 'La dissolution de l’Assemblée nationale par le président de la République.'),
  N('habilitation', [1, 2], 'Notion', 'Habilitation', 'Règle qui permet à une autorité de faire quelque chose : une permission plutôt qu’un commandement.', 'Une permission d’agir donnée par le droit', null, 'Le droit ne se réduit pas aux ordres et aux interdits.'),
  N('legalite', [1], 'Notion', 'Légalité', 'Conformité au droit en vigueur (de lex, la loi).', 'Être conforme au droit en vigueur', 'La dissolution de 2024, décidée après des consultations éclair : légale, mais discutée.', 'Légal ne veut pas dire légitime.', 'LEGALITE'),
  N('legitimite', [1], 'Notion', 'Légitimité', 'Qualité du pouvoir qui le rend acceptable à ceux qui s’y soumettent : elle oblige à justifier le droit.', 'Ce qui rend un pouvoir acceptable', 'De Gaulle à Londres, face au gouvernement de Vichy, légal mais contesté.', 'Elle appelle un jugement personnel, et ses valeurs varient selon les époques.', 'LEGITIME'),
  N('sources-legitimite', [1], 'Notion', 'Les sources de la légitimité', 'Traditionnelle, théocratique, démocratique : les trois grands fondements par lesquels un pouvoir se fait accepter.', 'Tradition, Dieu, démocratie'),
  N('etat-de-droit', [1, 2], 'Notion', 'État de droit', 'Règne du droit (Rechtsstaat, Rule of law) : un aspect formel, l’existence de règles, et un aspect substantiel, leur contenu protecteur de la liberté.', 'Le règne du droit, forme et contenu', 'L’indépendance des tribunaux.', 'Pour Kelsen, tout État est un État de droit : l’expression est un pléonasme.'),

  // 2. Le pouvoir, le droit, l'État
  N('pouvoir-politique', [2], 'Notion', 'Pouvoir politique', 'Puissance reconnue de domination humaine, qui s’exerce sur les individus.', 'Une domination reconnue', null, 'À l’origine, c’est une question de fait : le droit vient l’institutionnaliser.'),
  N('institutions-personnes', [2], 'Notion', 'Institutions-personnes', 'Pour Hauriou, institutions composées de personnes mais détachées d’elles : organes de l’État, partis, syndicats, Églises.', 'Des corps détachés de leurs membres', 'Le Parlement, le gouvernement, les tribunaux.'),
  N('institutions-choses', [2], 'Notion', 'Institutions-choses', 'Pour Hauriou, idées, fonctions, mécanismes et principes qui ont pris corps et inspirent les institutions-personnes.', 'Des idées qui ont pris corps'),
  N('loi-posterieure', [2], 'Notion', 'Loi postérieure', 'Les règles se coordonnent dans le temps : la loi postérieure déroge à la loi antérieure.', 'La loi nouvelle déroge à l’ancienne', null, 'Elles se coordonnent aussi par la hiérarchie : un arrêté communal cède devant un arrêté ministériel.'),
  N('souverainete', [2], 'Notion', 'Souveraineté', 'Pouvoir de décision ultime, théorisé par Bodin au XVIe siècle : indivisible, perpétuel et inaliénable.', 'Le pouvoir de décision ultime', null, 'Elle n’est pas naturelle : c’est une invention, qui marque le passage au monde moderne.'),
  N('souverainete-interne', [2], 'Notion', 'Souveraineté interne', 'Pouvoir de commandement ultime de l’État à l’intérieur : lui seul fait des règles générales et supérieures, qui s’imposent à tous.', 'L’État commande en dernier, chez lui'),
  N('souverainete-externe', [2], 'Notion', 'Souveraineté externe', 'Indépendance et liberté de l’État à l’égard des autres États : faire la guerre et la paix.', 'L’État indépendant des autres', null, 'D’où l’interdit de l’ingérence.'),
  N('secularisation', [2], 'Notion', 'Sécularisation du pouvoir', 'Séparation des sphères spirituelle et temporelle : une condition de l’État moderne.', 'Séparer le spirituel et le temporel'),
  N('depersonnalisation', [2], 'Notion', 'Dépersonnalisation du pouvoir', 'Le pouvoir se détache de la personne qui l’exerce grâce à la personnalité juridique de l’État : il continue quand le chef change.', 'Le pouvoir survit à son titulaire'),
  N('contrainte-legitime', [2], 'Notion', 'Monopole de la contrainte légitime', 'Pour Max Weber, le pouvoir d’imposer par la force, que l’État concentre entre ses mains.', 'L’État seul peut contraindre'),
  N('etat-nature', [2], 'Notion', 'État de nature', 'Condition des hommes sans pouvoir commun : guerre de chacun contre chacun pour Hobbes ; liberté et égalité, mais sans juge impartial, pour Locke.', 'Les hommes avant le pouvoir commun'),
  N('pacte-social', [2], 'Notion', 'Pacte social', 'Accord par lequel les individus fondent la société politique et se soumettent à un pouvoir, en gardant des droits.', 'Le contrat qui fonde la société', 'Grotius, Hobbes, Pufendorf, Locke, Rousseau.', 'Les pèlerins du Mayflower en signent un avant de débarquer, en 1620.'),
  N('volonte-generale', [2, 4], 'Notion', 'Volonté générale', 'Chez Rousseau, la direction suprême sous laquelle chacun met en commun sa personne et toute sa puissance.', 'Rousseau : la volonté du corps politique', null, null, 'GENERALE'),
  N('etat-unitaire', [2], 'Forme d’État', 'État unitaire', 'État doté d’un seul centre d’impulsion politique, auquel la population est uniformément soumise sur tout le territoire.', 'Un seul centre, une seule loi', 'La France.', 'Il peut être décentralisé sans cesser d’être unitaire : la France reste indivisible.', 'UNITAIRE'),
  N('decentralisation', [2], 'Notion', 'Décentralisation', 'Permettre à une collectivité ou à un service de s’administrer lui-même, sous le contrôle de l’État, en le dotant de la personnalité juridique.', 'S’administrer soi-même, sous contrôle', 'Loi du 2 mars 1982 ; principe d’organisation de la France depuis 2003.'),
  N('etat-regional', [2], 'Forme d’État', 'État régional', 'État unitaire où l’autonomie des régions est plus forte et garantie : l’État ne peut la reprendre.', 'Une autonomie régionale garantie', 'L’Italie, l’Espagne.', 'L’autonomie peut y être asymétrique, différente d’une région à l’autre.'),
  N('devolution', [2], 'Notion', 'Dévolution', 'Transfert de pouvoirs, notamment législatifs, du Parlement de Westminster au Parlement écossais et à l’Assemblée d’Irlande du Nord.', 'Westminster délègue aux nations', null, null, 'DEVOLUTION'),
  N('etat-federal', [2], 'Forme d’État', 'État fédéral', 'État composé qui superpose un État central et des États fédérés, selon trois principes : superposition, participation, autonomie.', 'Superposition, participation, autonomie', 'Les États-Unis (1787), le Canada, l’Allemagne, la Belgique.', 'Il naît d’une association d’États (États-Unis) ou de la dissociation d’un État unitaire (Belgique).', 'FEDERAL'),
  N('pacte-federal', [2], 'Notion', 'Pacte fédéral', 'Texte constitutionnel qui garantit l’autonomie des États membres : on ne peut la leur retirer unilatéralement.', 'L’autonomie garantie des États membres'),
  N('confederation', [2], 'Forme d’État', 'Confédération', 'Association d’États qui travaillent ensemble, au-delà d’une simple coopération, et peuvent en sortir.', 'Des États associés, libres de partir', 'La Confédération germanique, fondée en 1815.', 'Dans un État fédéral, on ne peut pas sortir : la guerre de Sécession en témoigne.'),

  // 3. Distinguer les pouvoirs
  N('constitutionnalisme-liberal', [3], 'Notion', 'Constitutionnalisme libéral', 'Mouvement qui agence la domination selon trois piliers : la représentation, la distinction des pouvoirs, la garantie des droits.', 'Représenter, distinguer, garantir'),
  N('organe', [3], 'Notion', 'Organe', 'Le « qui » : l’institution qui exerce le pouvoir.', 'Qui exerce le pouvoir', 'Le roi, une chambre, un ministre.', 'Ne pas désigner un organe par la fonction qu’il exerce : le Parlement n’est pas « le législatif ».', 'ORGANE'),
  N('fonction', [3], 'Notion', 'Fonction', 'Le « quoi » : la tâche de l’État, faire la loi, l’exécuter, juger.', 'Ce que fait le pouvoir', null, 'Plusieurs organes concourent presque toujours à chaque fonction.', 'FONCTION'),
  N('separation-pouvoirs', [3], 'Notion', 'Séparation des pouvoirs', 'Maxime d’art politique et principe négatif : ne pas concentrer toutes les fonctions de l’État dans les mains d’un seul organe.', 'Ne pas tout mettre dans les mêmes mains', null, 'Le mot « séparation » est presque toujours impropre : on parle mieux de distinction et d’articulation.'),
  N('checks-balances', [3, 5], 'Notion', 'Checks and balances', 'Freins et contrepoids : chaque organe dispose de moyens d’arrêter les autres, ce qui les oblige à composer.', 'Freins et contrepoids'),
  N('magna-carta', [3], 'Notion', 'Grande Charte (1215)', 'Texte que les barons imposent au roi d’Angleterre : premières limites au pouvoir royal.', 'Les barons limitent le roi'),
  N('bill-of-rights', [3], 'Notion', 'Bill of Rights (1689)', 'Texte sur lequel Guillaume et Marie prêtent serment après la Glorieuse Révolution : il consacre des droits et la place du Parlement.', 'Après 1688, le roi entouré du Parlement'),
  N('king-in-parliament', [3], 'Notion', 'King in Parliament', 'La fonction législative ne s’exerce que conjointement par le roi et les deux chambres.', 'La loi : le roi et les deux chambres'),
  N('king-no-wrong', [3], 'Adage', 'The King can do no wrong', 'Le roi est irresponsable et inattaquable : ce sont ses ministres qu’on met en cause.', 'Le roi ne peut mal faire'),
  N('impeachment', [3, 5], 'Notion', 'Impeachment', 'Mise en accusation par la chambre basse, jugement par la chambre haute : les ministres en Angleterre, le président aux États-Unis.', 'Accuser, puis juger, un membre de l’exécutif', null, 'Aux États-Unis, c’est une responsabilité constitutionnelle, pas une responsabilité pénale.'),
  N('prerogative', [3], 'Notion', 'Prérogative', 'Chez Locke, pouvoir en partie discrétionnaire de l’exécutif d’agir pour le bien du peuple, même sans loi.', 'Locke : agir pour le bien public, sans loi'),
  N('federatif', [3], 'Notion', 'Pouvoir fédératif', 'Chez Locke, le pouvoir de faire la guerre et la paix et de conduire les relations extérieures.', 'Locke : la guerre, la paix, la diplomatie'),
  N('faculte-statuer', [3], 'Notion', 'Faculté de statuer', 'Chez Montesquieu, le droit d’ordonner par soi-même, ou de corriger ce qui a été ordonné par un autre.', 'Ordonner ou corriger'),
  N('faculte-empecher', [3], 'Notion', 'Faculté d’empêcher', 'Chez Montesquieu, le droit de rendre nulle une résolution prise par quelque autre.', 'Rendre nulle la décision d’un autre', 'La puissance des tribuns de Rome.'),
  N('bicamerisme', [3, 4, 6], 'Notion', 'Bicamérisme', 'Organisation du Parlement en deux assemblées distinctes, aux délibérations et aux intérêts séparés.', 'Deux chambres', 'Lords et Communes ; pairs et députés en 1814.', 'La Constituante le rejette en 1789 ; il revient en 1795.'),
  N('veto', [3, 4, 5], 'Notion', 'Veto', 'Pouvoir d’empêcher qu’une loi votée entre en vigueur.', 'Le pouvoir d’empêcher la loi', null, 'Il peut être absolu ou seulement suspensif.', 'VETO'),
  N('droits-libertes', [3], 'Notion', 'Droits-libertés', 'Droits de la personne proclamés au XVIIIe siècle : aller et venir, opinion, expression, égalité, propriété, légalité des délits et des peines.', 'Les libertés du XVIIIe siècle'),
  N('droits-sociaux', [3], 'Notion', 'Droits économiques et sociaux', 'Droits consacrés entre 1848 et 1946 : association, éducation, travail, logement.', 'Éducation, travail, logement'),
  N('droits-collectifs', [3], 'Notion', 'Droits collectifs', 'Droits apparus à la fin du XXe siècle : environnement, minorités, biodiversité.', 'Environnement, minorités'),

  // 4. La Révolution et 1791
  N('etats-generaux', [4], 'Notion', 'États généraux', 'Assemblée des trois ordres, clergé, noblesse et tiers état, plus réunie depuis 1614 et ouverte le 5 mai 1789.', 'Les trois ordres réunis par le roi', null, 'Le tiers y obtient le doublement : autant de députés que les deux autres ordres réunis.'),
  N('assemblee-nationale-1789', [4], 'Notion', 'Proclamation de l’Assemblée nationale', 'Le 17 juin 1789, les députés du tiers se proclament Assemblée nationale : ils revendiquent le monopole de la représentation.', 'Le tiers se dit la nation'),
  N('jeu-de-paume', [4], 'Notion', 'Serment du Jeu de paume', 'Le 20 juin 1789, l’Assemblée revendique la puissance constituante.', 'L’Assemblée se veut constituante'),
  N('representation', [4], 'Notion', 'Représentation', 'Fiction juridique : la nation, de qui seule émanent tous les pouvoirs, ne peut les exercer que par délégation.', 'La nation n’agit que par délégués', null, 'Le peuple n’existe juridiquement qu’à travers le filtre du corps électoral.'),
  N('souverainete-nationale', [4], 'Notion', 'Souveraineté nationale', 'La souveraineté réside essentiellement dans la nation ; aucune section du peuple, aucun individu ne peut s’en attribuer l’exercice.', 'La nation souveraine, par ses représentants', 'Article 3 de la Déclaration de 1789.', null, 'NATION'),
  N('mandat-imperatif', [4], 'Notion', 'Mandat impératif', 'Représentation de type ancien : le député représente son ordre, est lié par ses instructions et peut être révoqué.', 'Lié par des instructions, révocable'),
  N('mandat-representatif', [4], 'Notion', 'Mandat représentatif', 'Représentation moderne : le député représente toute la nation et délibère librement, sans instructions.', 'Général et libre', null, 'L’Angleterre l’adopte dès les XIIIe et XIVe siècles ; Burke en donne la formule.', 'MANDAT'),
  N('vote-par-tete', [4], 'Notion', 'Vote par tête', 'Chaque député a une voix et l’on décide à la majorité, au lieu d’un vote par ordre.', 'Une voix par député'),
  N('irresponsabilite-depute', [4], 'Notion', 'Irresponsabilité du député', 'Le député ne peut être poursuivi pour ses votes ; il ne rend compte de son mandat que politiquement, devant ses électeurs.', 'Inattaquable pour ses votes'),
  N('veto-suspensif', [4], 'Notion', 'Veto suspensif', 'En 1791, le refus du roi ne fait que retarder la loi : présentée par trois législatures, elle s’impose.', 'Le refus du roi ne fait que retarder', null, 'La Constituante a écarté le veto absolu.', 'SUSPENSIF'),
  N('incompatibilite', [4, 6], 'Notion', 'Incompatibilité ministre-député', 'En 1791, un député ne peut devenir ministre : la Constituante écarte le modèle anglais, malgré Mirabeau.', 'Député ou ministre, pas les deux', null, 'La Charte de 1814 fait l’inverse : les ministres peuvent siéger.'),
  N('monocamerisme', [4], 'Notion', 'Monocamérisme', 'Parlement d’une seule chambre : la Constituante rejette la chambre haute en 1789.', 'Une seule chambre', 'Constitution de 1791 : l’Assemblée nationale est « permanente » et n’a qu’une chambre.'),
  N('constitution-1791', [4], 'Texte', 'Constitution de 1791', 'Première constitution écrite de la France (3 septembre 1791) : souveraineté nationale, régime représentatif, séparation rigide, primat de l’assemblée.', 'La première constitution écrite'),
  N('directoire', [4], 'Texte', 'Constitution de l’an III (1795)', 'Le Directoire : un exécutif collégial et, pour la première fois, deux conseils, les Cinq-Cents et les Anciens.', 'Le Directoire et deux conseils', null, 'Elle inspirera le système directorial suisse.'),
  N('consulat', [4], 'Texte', 'Constitution de l’an VIII (1799)', 'Le Consulat : trois consuls, dont Bonaparte, premier consul au rôle renforcé.', 'Trois consuls, Bonaparte en tête'),

  // 5. Présidentiel et parlementaire
  N('systeme-gouvernement', [5], 'Notion', 'Système de gouvernement', 'Manière de décrire le fonctionnement régulier des institutions : un concept, non une essence.', 'Un concept pour décrire, pas une essence', null, 'Le cours préfère « système de gouvernement » à « régime ».'),
  N('methode-juriste', [5], 'Notion', 'Méthode du juriste', 'Repérer les textes et coutumes, les interpréter, les combiner en constitution-cadre, puis observer les pratiques des acteurs et leur reconnaissance.', 'Du texte à la pratique reconnue', null, 'Ne jamais lire une disposition constitutionnelle isolément.'),
  N('presidentiel', [5], 'Système', 'Gouvernement présidentiel', 'Système où l’exécutif est organiquement indépendant du parlement.', 'L’exécutif indépendant du parlement', 'Les États-Unis.', 'Indépendance n’est pas isolement : veto, confirmation des nominations, impeachment.'),
  N('parlementaire', [5], 'Système', 'Gouvernement parlementaire', 'Système où l’exécutif est responsable devant le parlement, qui peut le démettre.', 'L’exécutif responsable devant le parlement'),
  N('directorial', [5], 'Système', 'Gouvernement directorial', 'Système où l’exécutif est issu du parlement mais reste relativement indépendant de lui.', 'Issu du parlement, mais indépendant', 'La Suisse.'),
  N('responsabilite-politique', [5, 6], 'Notion', 'Responsabilité politique', 'Obligation pour le gouvernement de quitter ses fonctions lorsque l’assemblée lui retire sa confiance.', 'Partir si l’assemblée retire sa confiance', 'Weimar, article 54.', 'À distinguer de la responsabilité pénale des ministres de 1791 et 1814.', 'CONFIANCE'),
  N('cabinet', [5], 'Notion', 'Cabinet', 'Pour Bagehot, comité qui rattache la partie législative à la partie exécutive : par son origine il appartient à l’une, par ses fonctions à l’autre.', 'Le trait d’union entre législatif et exécutif', null, null, 'CABINET'),
  N('dualisme', [5], 'Notion', 'Parlementarisme dualiste', 'Le gouvernement dépend à la fois du chef de l’État, qui le nomme, et de l’assemblée, qui peut le renverser.', 'Deux confiances : le chef de l’État et l’assemblée', 'Weimar, 1919 : le président du Reich nomme le chancelier, qui a besoin de la confiance du Reichstag.'),
  N('monisme', [5], 'Notion', 'Parlementarisme moniste', 'Le gouvernement ne dépend que de l’assemblée.', 'Une seule confiance : l’assemblée', 'Autriche, 1920 : le Conseil national élit le gouvernement.'),
  N('veto-de-poche', [5], 'Notion', 'Veto de poche', 'Le président américain retarde sa signature jusqu’à la fin de la session : le texte tombe, sans que le Congrès puisse passer outre.', 'Laisser filer la session sans signer'),
  N('dissolution', [3, 5, 6], 'Notion', 'Dissolution', 'Pouvoir de mettre fin avant son terme au mandat d’une assemblée élue.', 'Renvoyer une assemblée devant les électeurs', null, 'Interdite au roi en 1791 ; permise au roi en 1814 pour la Chambre des députés.'),
  N('contreseing', [4, 5, 6], 'Notion', 'Contreseing', 'Signature d’un ministre à côté de celle du chef de l’État : le ministre en assume la responsabilité.', 'Le ministre signe, et répond'),
  N('gouvernement-congressionnel', [5], 'Notion', 'Gouvernement congressionnel', 'Période (1865-1900) où le Congrès domine la présidence, décrite par Woodrow Wilson.', 'Quand le Congrès domine'),
  N('presidentialisme', [5], 'Notion', 'Présidentialisme', 'Système présidentiel déformé, transplanté hors des États-Unis, notamment en Amérique du Sud.', 'Le présidentiel déformé'),

  // 6. Les Chartes
  N('charte-octroyee', [6], 'Notion', 'Charte octroyée', 'Constitution concédée par le roi à ses sujets, « par le libre exercice de notre autorité royale ».', 'Le roi accorde la constitution', 'La Charte du 4 juin 1814.', 'Celle de 1830 n’est plus octroyée : elle est acceptée par le roi.', 'OCTROI'),
  N('restauration', [6], 'Notion', 'Restauration', 'Retour des Bourbons en 1814 : Louis XVIII octroie la Charte.', 'Le retour des Bourbons'),
  N('chambre-pairs', [6], 'Notion', 'Chambre des pairs', 'Chambre haute de 1814, dont le roi nomme les membres, à vie ou héréditaires ; elle juge les ministres accusés.', 'La chambre haute nommée par le roi', null, null, 'PAIRS'),
  N('suffrage-censitaire', [6], 'Notion', 'Suffrage censitaire', 'Droit de vote réservé à ceux qui paient un certain impôt : en 1814, 300 francs pour voter et 1 000 francs pour être élu.', 'Voter selon l’impôt payé', null, null, 'CENS'),
  N('monarchie-constitutionnelle', [6], 'Notion', 'Monarchie constitutionnelle', 'Monarchie limitée : un roi héréditaire, des ministres responsables et deux chambres, sur le modèle anglais.', 'Un roi, des ministres, deux chambres'),
  N('pouvoir-neutre', [6], 'Notion', 'Pouvoir neutre', 'Pour Benjamin Constant, le pouvoir du chef de l’État, placé en dehors des autres pour les remettre à leur place quand ils s’entrechoquent.', 'Constant : le chef de l’État arbitre'),
  N('adresse-221', [6], 'Notion', 'Adresse des 221', 'Le 18 mars 1830, 221 députés disent au roi que le concours entre son gouvernement et le pays n’existe pas.', 'Les députés désavouent le ministère'),
  N('charte-1830', [6], 'Texte', 'Charte de 1830', 'Charte révisée : Louis-Philippe est « roi des Français », l’initiative des lois est partagée avec les deux chambres.', 'L’initiative des lois partagée'),
  N('roi-regne', [6], 'Adage', 'Le roi règne et ne gouverne pas', 'Formule de l’opposition sous la monarchie de Juillet ; Guizot la conteste.', 'La formule que Guizot conteste'),
];

// Qui a dit ? Citations recopiées de la plaquette de TD ou des notes de cours.
export const auteurs = {
  montesquieu: 'Montesquieu', madison: 'James Madison', sieyes: 'Sieyès', lally: 'Lally-Tollendal', lanjuinais: 'Lanjuinais', rousseau: 'Rousseau',
  hobbes: 'Hobbes', locke: 'Locke', kelsen: 'Hans Kelsen', hauriou: 'Maurice Hauriou', constant: 'Benjamin Constant', bagehot: 'Walter Bagehot',
  esmein: 'Adhémar Esmein', mirabeau: 'Mirabeau', guizot: 'Guizot', louis18: 'Louis XVIII', les221: 'Les 221 députés', charles10: 'Charles X',
  bodin: 'Jean Bodin', weber: 'Max Weber', burke: 'Edmund Burke', wilson: 'Woodrow Wilson', tocqueville: 'Tocqueville',
};
export const citations = [
  ['hauriou', 'Ce sont les institutions qui créent le droit plus que le droit crée les institutions.', 2],
  ['hobbes', 'Là où il n’y a pas de puissance commune, il n’y a pas de loi ; là où il n’y a pas de loi, il n’y a pas d’injustice.', 2],
  ['locke', 'Le pouvoir civil est bien le remède convenable aux inconvénients de l’état de nature.', 2],
  ['rousseau', 'Chacun s’unissant à tous n’obéisse pourtant qu’à lui-même et reste aussi libre qu’auparavant.', 2, 'Le problème que le contrat social résout'],
  ['kelsen', 'Tout État est un État de droit, et ce terme d’État de droit représente un pléonasme.', 2],
  ['constant', 'Le système représentatif est une procuration donnée à un certain nombre d’hommes par la masse du peuple.', 2],
  ['constant', 'Le but des modernes est la sécurité dans les jouissances privées.', 2],
  ['montesquieu', 'C’est une expérience éternelle que tout homme qui a du pouvoir est porté à en abuser.', 3],
  ['montesquieu', 'Pour qu’on ne puisse abuser du pouvoir, il faut que, par la disposition des choses, le pouvoir arrête le pouvoir.', 3],
  ['montesquieu', 'J’appelle faculté d’empêcher, le droit de rendre nulle une résolution prise par quelque autre.', 3],
  ['madison', 'L’accumulation de tous les pouvoirs, législatif, exécutif et judiciaire, dans les mêmes mains […] peut justement être considérée comme la véritable définition de la tyrannie.', 3],
  ['montesquieu', 'Le grand avantage des représentants, c’est qu’ils sont capables de discuter les affaires.', 4],
  ['sieyes', 'Qu’est-ce que le Tiers état ? — Tout.', 4],
  ['lally', 'Un pouvoir unique finira nécessairement par tout dévorer.', 4, 'Pour une deuxième chambre, le 31 août 1789'],
  ['lanjuinais', 'Si l’on admettait une Chambre haute, le petit nombre commanderait au plus grand.', 4],
  ['mirabeau', 'Je ne puis croire que l’auteur de la motion veuille sérieusement faire décider que l’élite de la nation ne peut pas renfermer un bon ministre.', 4, 'Contre l’incompatibilité des fonctions de ministre et de député'],
  ['bagehot', 'Un Cabinet est un comité combiné de telle sorte qu’il sert, comme un trait d’union ou une boucle, à rattacher la partie législative à la partie exécutive du gouvernement.', 5],
  ['esmein', 'Le gouvernement parlementaire, que les Anglais appellent le plus souvent gouvernement de cabinet, suppose tout d’abord le gouvernement représentatif, dont il est une variété.', 5],
  ['louis18', 'Nous avons volontairement, et par le libre exercice de notre autorité royale, accordé et accordons […] la Charte constitutionnelle.', 6],
  ['les221', 'Sire, notre loyauté, notre dévouement nous condamnent à vous dire que ce concours n’existe pas.', 6, 'Adresse au roi, 18 mars 1830'],
  ['charles10', 'Ces résolutions sont immuables ; l’intérêt de mon peuple me défend de m’en écarter.', 6, 'Réponse à l’adresse des 221'],
  ['constant', 'Le pouvoir royal (j’entends celui du chef de l’État, quelque titre qu’il porte), est un pouvoir neutre.', 6],
  ['guizot', 'Le trône n’est pas un fauteuil auquel on a mis une clef pour que personne ne puisse s’y asseoir.', 6, 'Contre « le roi règne et ne gouverne pas »'],
];

// Memory : un auteur, son idée.
export const idees = [
  ['bodin', 'La souveraineté, pouvoir ultime', 2], ['hauriou', 'Institutions-personnes et institutions-choses', 2], ['weber', 'Le monopole de la contrainte légitime', 2],
  ['hobbes', 'La guerre de chacun contre chacun', 2], ['rousseau', 'La volonté générale', 2], ['kelsen', 'Tout État est un État de droit', 2],
  ['constant', 'Liberté des anciens, liberté des modernes', 2], ['tocqueville', 'La continuité de l’Ancien Régime à la Révolution', 2],
  ['locke', 'Le pouvoir fédératif et la prérogative', 3], ['montesquieu', 'Le pouvoir arrête le pouvoir', 3], ['madison', 'L’accumulation des pouvoirs, c’est la tyrannie', 3],
  ['sieyes', 'Le Tiers état, c’est tout', 4], ['burke', 'Le député représente l’intérêt général', 4], ['mirabeau', 'Des ministres pris parmi les députés', 4],
  ['bagehot', 'Le Cabinet, trait d’union', 5], ['wilson', 'Le gouvernement congressionnel', 5], ['esmein', 'Le gouvernement de cabinet', 5],
  ['guizot', 'Contre « le roi règne et ne gouverne pas »', 6],
];

// Le mot du juriste : mot simple, indice court, notion liée, chambre.
export const mots = [
  ['ETAT', 'Il a le monopole de la contrainte légitime.', 'contrainte-legitime', 2],
  ['BODIN', 'Il théorise la souveraineté au XVIe siècle.', 'souverainete', 2],
  ['FEDERAL', 'Superposition, participation, autonomie : l’État …', 'etat-federal', 2],
  ['UNITAIRE', 'Un seul centre d’impulsion politique : l’État …', 'etat-unitaire', 2],
  ['DEVOLUTION', 'Westminster transfère des pouvoirs à l’Écosse.', 'devolution', 2],
  ['LEGALITE', 'Être conforme au droit en vigueur.', 'legalite', 1],
  ['LEGITIME', 'Accepté par ceux qui s’y soumettent, un pouvoir est …', 'legitimite', 1],
  ['INSTITUTION', 'Elle survit à ceux qui l’occupent.', 'institution', 1],
  ['ORGANE', 'Le « qui » du pouvoir.', 'organe', 3],
  ['FONCTION', 'Le « quoi » du pouvoir.', 'fonction', 3],
  ['VETO', 'Le pouvoir d’empêcher qu’une loi s’applique.', 'veto', 3],
  ['LOCKE', 'Il écrit le Traité du gouvernement civil en 1690.', 'federatif', 3],
  ['NATION', 'En 1789, c’est elle qui est souveraine.', 'souverainete-nationale', 4],
  ['MANDAT', 'Représentatif, il est général et libre.', 'mandat-representatif', 4],
  ['SIEYES', 'Il demande ce qu’est le Tiers état.', 'assemblee-nationale-1789', 4],
  ['SUSPENSIF', 'Le veto du roi en 1791.', 'veto-suspensif', 4],
  ['CABINET', 'Pour Bagehot, le trait d’union entre législatif et exécutif.', 'cabinet', 5],
  ['CONFIANCE', 'Le gouvernement parlementaire la doit à l’assemblée.', 'responsabilite-politique', 5],
  ['CHARTE', 'La constitution de 1814, octroyée par le roi.', 'charte-octroyee', 6],
  ['PAIRS', 'La chambre haute de 1814, nommée par le roi.', 'chambre-pairs', 6],
  ['OCTROI', 'Le roi accorde la Charte : c’est un …', 'charte-octroyee', 6],
];

// Les frises.
export const frises = [
  { id: 'angleterre', titre: 'De la Grande Charte à Montesquieu', zones: [3], p: 'L’Angleterre limite peu à peu le pouvoir royal, puis Montesquieu en tire une théorie.', q: 'Quelle étape consacre le roi entouré du Parlement souverain ?', r: 4, e: [
    { an: '1215', n: 'Grande Charte', t: 'Les barons imposent des limites au roi', ch: 'Le roi ne juge plus seul et arbitrairement' },
    { an: '1649', n: 'Exécution de Charles Ier', t: 'Le Parlement gagne la guerre civile', ch: 'Le roi est jugé et exécuté' },
    { an: '1688', n: 'Glorieuse Révolution', t: 'Révolution presque sans violence', ch: 'Fin de la lutte du siècle' },
    { an: '1689', n: 'Bill of Rights', t: 'Guillaume et Marie prêtent serment', ch: 'Le King in Parliament' },
    { an: '1690', n: 'Locke', t: 'Traité du gouvernement civil', ch: 'La distinction des pouvoirs théorisée' },
    { an: '1748', n: 'Montesquieu', t: 'De l’esprit des lois', ch: 'Le pouvoir arrête le pouvoir' },
  ] },
  { id: 'amerique', titre: 'La naissance des États-Unis', zones: [3, 5], p: 'Des pactes des colons à la constitution fédérale.', q: 'Quelle étape ajoute des droits à la Constitution fédérale ?', r: 5, e: [
    { an: '1620', n: 'Pacte du Mayflower', t: 'Les pèlerins signent un contrat avant de débarquer', ch: 'Un pacte social mis en pratique' },
    { an: '1701', n: 'Charte de Pennsylvanie', t: 'Une colonie garantit des droits', ch: 'Des droits avant l’État fédéral' },
    { an: '1776', n: 'Déclaration d’indépendance', t: 'Les colonies rompent avec la Couronne', ch: 'Naissance des États' },
    { an: '1787', n: 'Constitution fédérale', t: 'Le plan de gouvernement des États-Unis', ch: 'Checks and balances, État fédéral' },
    { an: '1791', n: 'Bill of Rights américain', t: 'Des amendements garantissent des droits', ch: 'Les limites posées au pouvoir fédéral' },
  ] },
  { id: 'revolution', titre: 'De 1789 à 1791', zones: [4], p: 'En deux ans, le tiers devient la nation et la France reçoit sa première constitution écrite.', q: 'Quelle étape revendique la puissance constituante ?', r: 3, e: [
    { an: '5 mai', n: 'États généraux', t: 'Les trois ordres se réunissent à Versailles', ch: 'Première réunion depuis 1614' },
    { an: '17 juin', n: 'Assemblée nationale', t: 'Le tiers se proclame Assemblée nationale', ch: 'Le monopole de la représentation' },
    { an: '20 juin', n: 'Serment du Jeu de paume', t: 'Les députés jurent de donner une constitution', ch: 'La puissance constituante' },
    { an: '4 août', n: 'Nuit du 4 août', t: 'Abolition des privilèges', ch: 'La fin de la société d’ordres' },
    { an: '26 août', n: 'Déclaration des droits', t: 'Les droits naturels et la souveraineté nationale', ch: 'Placée en tête de la Constitution de 1791' },
    { an: '1791', n: 'Constitution du 3 septembre', t: 'Première constitution écrite', ch: 'Monarchie représentative, séparation rigide' },
  ] },
  { id: 'constitutions', titre: 'Les constitutions françaises', zones: [4, 6], p: 'Après 1791, la France change de constitution au rythme des régimes.', q: 'Quelle étape crée pour la première fois deux chambres ?', r: 3, e: [
    { an: '1791', n: 'Constitution du 3 septembre', t: 'Une assemblée unique, un roi', ch: 'La monarchie représentative' },
    { an: '1793', n: 'Constitution de l’an I', t: 'Un texte démocratique, jamais appliqué', ch: 'Suspendue jusqu’à la paix' },
    { an: '1795', n: 'Constitution de l’an III', t: 'Le Directoire', ch: 'Deux conseils : les Cinq-Cents et les Anciens' },
    { an: '1799', n: 'Constitution de l’an VIII', t: 'Le Consulat', ch: 'Bonaparte premier consul' },
    { an: '1814', n: 'Charte constitutionnelle', t: 'Louis XVIII octroie la Charte', ch: 'La Restauration' },
    { an: '1830', n: 'Charte révisée', t: 'Louis-Philippe, roi des Français', ch: 'La monarchie de Juillet' },
  ] },
];

// Le bon plan.
const P = (i, ia, ib, ii, iia, iib, ids = {}) => ({ 1: i, 2: ii, '1a': { t: ia, ids: ids.a || [] }, '1b': { t: ib, ids: ids.b || [] }, '2a': { t: iia, ids: ids.c || [] }, '2b': { t: iib, ids: ids.d || [] } });
export const sujets = [
  { id: 'dc-legitimite', type: 'D', titre: 'Légalité et légitimité', zones: [1],
    bon: P('Deux notions distinctes', 'La légalité, conformité au droit en vigueur', 'La légitimité, qualité qui rend le pouvoir acceptable',
      'Deux notions qui peuvent se contredire', 'Un pouvoir légal peut être illégitime', 'L’État de droit cherche à les réunir', { a: ['legalite'], b: ['legitimite'], c: ['sources-legitimite'], d: ['etat-de-droit'] }),
    mauvais: [
      { code: 'RECIT', pourquoi: 'Le plan raconte Vichy et la France libre au lieu de définir et confronter les notions.', plan: { 1: 'Le gouvernement de Vichy', 2: 'La France libre', '1a': 'Les pleins pouvoirs de 1940', '1b': 'Le fonctionnement du régime', '2a': 'De Gaulle à Londres', '2b': 'La Libération' } },
      { code: 'CONTRESENS', pourquoi: 'Le plan confond les deux notions : ce qui est légal n’est pas forcément légitime.', plan: { 1: 'Le légal est toujours légitime', 2: 'Le légitime est toujours légal', '1a': 'La loi, source de légitimité', '1b': 'L’obéissance due à la loi', '2a': 'Le juste est inscrit dans la loi', '2b': 'L’illégal est illégitime' } },
    ],
    pb: 'Suffit-il qu’un pouvoir soit conforme au droit pour qu’on lui obéisse ?', m: 'Le cours distingue les deux notions puis montre qu’elles peuvent se séparer : la légitimité oblige à justifier le droit.' },
  { id: 'dc-souverainete', type: 'D', titre: 'La souveraineté', zones: [2],
    bon: P('Une invention de l’État moderne', 'Un pouvoir de décision ultime, théorisé par Bodin', 'Une souveraineté interne et externe',
      'Une souveraineté à loger', 'Le roi, la nation, le Parlement', 'Faut-il lui donner un titulaire ?', { a: ['souverainete'], b: ['souverainete-externe'], c: ['souverainete-nationale'], d: ['depersonnalisation'] }),
    mauvais: [
      { code: 'CHRONO', pourquoi: 'Le plan découpe des époques sans rien démontrer sur la notion.', plan: { 1: 'Dans le monde ancien', 2: 'Dans le monde moderne', '1a': 'L’Antiquité', '1b': 'Le Moyen Âge', '2a': 'Le XVIe siècle', '2b': 'Aujourd’hui' } },
      { code: 'HORS', pourquoi: 'Le plan traite des formes de l’État, pas de la souveraineté.', plan: { 1: 'L’État unitaire', 2: 'L’État composé', '1a': 'La centralisation', '1b': 'La décentralisation', '2a': 'L’État fédéral', '2b': 'La confédération' } },
    ],
    pb: 'La souveraineté est-elle un attribut de l’État ou de celui qui le gouverne ?', m: 'Le I montre ce qu’est la souveraineté, le II la question de son titulaire, que le cours laisse ouverte.' },
  { id: 'dc-separation', type: 'D', titre: 'La séparation des pouvoirs', zones: [3],
    bon: P('Un principe de non-concentration', 'Le pouvoir arrête le pouvoir', 'Distinguer les organes et les fonctions',
      'Une articulation plutôt qu’une séparation', 'Statuer et empêcher', 'Les freins et contrepoids anglais et américains', { a: ['separation-pouvoirs'], b: ['organe'], c: ['faculte-empecher'], d: ['checks-balances'] }),
    mauvais: [
      { code: 'RECIT', pourquoi: 'Le plan récite des auteurs sans répondre à la question.', plan: { 1: 'Locke', 2: 'Montesquieu', '1a': 'Sa vie', '1b': 'Le Traité du gouvernement civil', '2a': 'De l’esprit des lois', '2b': 'Sa postérité' } },
      { code: 'CONTRESENS', pourquoi: 'Le plan croit à une séparation stricte, chaque organe enfermé dans une fonction. Le cours montre l’inverse.', plan: { 1: 'Trois organes isolés', 2: 'Trois fonctions étanches', '1a': 'Le législatif fait la loi seul', '1b': 'L’exécutif exécute seul', '2a': 'Aucun organe n’empiète', '2b': 'Aucun contrôle mutuel' } },
    ],
    pb: 'Faut-il séparer les pouvoirs, ou les faire se contrôler ?', m: 'Le mot « séparation » est presque toujours impropre : le cœur de l’idée, c’est la pluralité des organes et leur contrôle mutuel.' },
  { id: 'dc-1791', type: 'D', titre: 'La Constitution de 1791, une séparation rigide des pouvoirs ?', zones: [4],
    bon: P('Une séparation voulue rigide', 'Pas de dissolution, pas de ministres députés', 'Une assemblée unique et permanente',
      'Des pouvoirs pourtant liés', 'Le veto suspensif du roi', 'La responsabilité pénale des ministres', { a: ['incompatibilite'], b: ['monocamerisme'], c: ['veto-suspensif'], d: ['contreseing'] }),
    mauvais: [
      { code: 'HORS', pourquoi: 'Le plan raconte la Révolution au lieu d’étudier la constitution.', plan: { 1: 'La crise de 1789', 2: 'La radicalisation', '1a': 'Les États généraux', '1b': 'La prise de la Bastille', '2a': 'Varennes', '2b': 'La chute de la monarchie' } },
      { code: 'NIVEAU', pourquoi: 'Une partie porte sur la constitution, l’autre sur un seul de ses articles.', plan: { 1: 'La Constitution de 1791', 2: 'Le veto du roi', '1a': 'Sa préparation', '1b': 'Son contenu', '2a': 'Le débat de 1789', '2b': 'Son usage par Louis XVI' } },
    ],
    pb: 'La Constituante a-t-elle réussi à isoler les pouvoirs les uns des autres ?', m: 'Le texte se veut séparatiste, mais il ménage des liens : veto suspensif, contreseing, accusation des ministres.' },
  { id: 'dc-regimes', type: 'D', titre: 'Gouvernement présidentiel et gouvernement parlementaire', zones: [5],
    bon: P('Un critère de distinction', 'Un exécutif indépendant du parlement', 'Un exécutif responsable devant lui',
      'Des systèmes qui se rapprochent', 'Les contrôles mutuels du présidentiel', 'Les variantes du parlementaire : dualisme, monisme', { a: ['presidentiel'], b: ['responsabilite-politique'], c: ['checks-balances'], d: ['dualisme'] }),
    mauvais: [
      { code: 'BANAL', pourquoi: 'Une partie sur chaque système : le plan juxtapose sans comparer.', plan: { 1: 'Le système présidentiel', 2: 'Le système parlementaire', '1a': 'Les États-Unis', '1b': 'Le président', '2a': 'L’Angleterre', '2b': 'Le Premier ministre' } },
      { code: 'CONTRESENS', pourquoi: 'Le plan croit que le président américain peut dissoudre le Congrès. Le Congrès est indissoluble.', plan: { 1: 'Un président tout-puissant', 2: 'Un Congrès soumis', '1a': 'Il nomme les juges', '1b': 'Il dissout le Congrès', '2a': 'Le Congrès suit le président', '2b': 'Le Sénat obéit' } },
    ],
    pb: 'Qu’est-ce qui distingue vraiment ces deux systèmes de gouvernement ?', m: 'Le cours les définit par la dépendance organique de l’exécutif, puis montre que les deux connaissent des contrôles mutuels.' },
  { id: 'dc-charte', type: 'D', titre: 'La Charte de 1814, une transposition de la constitution anglaise ?', zones: [6],
    bon: P('Une transposition des structures anglaises', 'Un monarque, des ministres, deux chambres', 'Des ministres présents aux chambres et accusables',
      'Une monarchie française', 'Une charte octroyée par le roi', 'Le roi propose et sanctionne seul la loi', { a: ['monarchie-constitutionnelle'], b: ['incompatibilite'], c: ['charte-octroyee'], d: ['chambre-pairs'] }),
    mauvais: [
      { code: 'CHRONO', pourquoi: 'Le plan raconte les règnes au lieu d’étudier la Charte.', plan: { 1: 'Louis XVIII', 2: 'Charles X', '1a': 'Le retour des Bourbons', '1b': 'Les Cent-Jours', '2a': 'Le sacre', '2b': 'Les Trois Glorieuses' } },
      { code: 'CONTRESENS', pourquoi: 'Le plan voit dans la Charte une république parlementaire. Le roi y garde l’exécutif et l’initiative des lois.', plan: { 1: 'La souveraineté du peuple', 2: 'Un gouvernement responsable', '1a': 'Le suffrage universel', '1b': 'Une Chambre souveraine', '2a': 'La censure des ministres', '2b': 'Un roi sans pouvoir' } },
    ],
    pb: 'La Charte reprend-elle les techniques anglaises sans en reprendre l’esprit ?', m: 'Le Divellec montre une transposition des structures anglaises, dans une monarchie qui reste limitée et octroyée.' },
];

// L'ARCHITECTE DES POUVOIRS. Pour chaque régime : ses organes et les liens que posent les textes.
// Un lien : [de, vers (un organe ou une liste d'organes acceptés), type, explication].
// Les pièges : liens tentants que le régime ne connaît pas, avec la raison.
export const liensTypes = {
  elit: 'élit', nomme: 'nomme', renverse: 'peut renverser', dissout: 'peut dissoudre', veto: 'oppose son veto à',
  accuse: 'met en accusation', juge: 'juge', confirme: 'confirme les nominations de',
};
export const regimes = [
  { id: 'angleterre', nom: 'Angleterre, XVIIIe siècle', zones: [3], famille: 'Monarchie limitée',
    organes: [['electeurs', 'Électeurs'], ['roi', 'Roi'], ['ministres', 'Ministres'], ['lords', 'Lords'], ['communes', 'Communes']],
    liens: [
      ['electeurs', 'communes', 'elit', 'Les Communes sont élues, au suffrage censitaire.'],
      ['roi', 'ministres', 'nomme', 'Le roi nomme et révoque ses ministres, ses conseillers attitrés.'],
      ['roi', 'communes', 'dissout', 'Le roi convoque et dissout les Communes.'],
      ['roi', ['communes', 'lords'], 'veto', 'Le roi peut refuser une loi votée par les chambres : c’est le King in Parliament.'],
      ['communes', 'ministres', 'accuse', 'Les Communes mettent les ministres en accusation : l’impeachment.'],
      ['lords', 'ministres', 'juge', 'Les Lords jugent les ministres accusés.'],
    ],
    pieges: [
      ['roi', 'lords', 'dissout', 'La Chambre des lords, héréditaire, est indissoluble.'],
      ['communes', 'ministres', 'renverse', 'Pas encore : la responsabilité politique naîtra plus tard, de la pratique.'],
      ['electeurs', 'lords', 'elit', 'Les Lords sont héréditaires : personne ne les élit.'],
    ] },
  { id: 'usa', nom: 'États-Unis, 1787', zones: [3, 5], famille: 'Gouvernement présidentiel',
    organes: [['peuple', 'Peuple'], ['president', 'Président'], ['representants', 'Représentants'], ['senat', 'Sénat']],
    liens: [
      ['peuple', 'president', 'elit', 'Le président est élu par le peuple, à deux degrés, séparément du Congrès.'],
      ['peuple', 'representants', 'elit', 'La Chambre des représentants est élue par le peuple.'],
      ['president', ['representants', 'senat'], 'veto', 'Le président oppose son veto aux lois ; le Congrès ne le lève qu’aux deux tiers de chaque chambre.'],
      ['senat', 'president', 'confirme', 'Le Sénat confirme les nominations du président.'],
      ['representants', 'president', 'accuse', 'La Chambre des représentants peut mettre le président en accusation.'],
      ['senat', 'president', 'juge', 'Le Sénat juge le président mis en accusation.'],
    ],
    pieges: [
      ['president', 'representants', 'dissout', 'Le Congrès est indissoluble.'],
      ['president', 'senat', 'dissout', 'Le Congrès est indissoluble.'],
      ['representants', 'president', 'renverse', 'Pas de responsabilité politique : l’impeachment n’est pas un vote de défiance.'],
      ['senat', 'president', 'renverse', 'Pas de responsabilité politique : le président reste en place jusqu’au terme de son mandat.'],
      ['president', 'representants', 'nomme', 'Les membres du Congrès sont élus ; et nul ne peut être à la fois dans l’exécutif et au Congrès.'],
    ] },
  { id: 'c1791', nom: 'France, Constitution de 1791', zones: [4], famille: 'Monarchie représentative',
    organes: [['peuple', 'Peuple'], ['roi', 'Roi'], ['ministres', 'Ministres'], ['assemblee', 'Assemblée'], ['hautecour', 'Haute Cour']],
    liens: [
      ['peuple', 'assemblee', 'elit', 'L’Assemblée est composée de représentants librement élus par le peuple.'],
      ['roi', 'ministres', 'nomme', 'Au roi seul appartiennent le choix et la révocation des ministres.'],
      ['roi', 'assemblee', 'veto', 'Le roi peut refuser son consentement aux décrets, mais ce refus n’est que suspensif.'],
      ['assemblee', 'ministres', 'accuse', 'Le Corps législatif poursuit la responsabilité des ministres devant la Haute Cour.'],
      ['hautecour', 'ministres', 'juge', 'La haute Cour nationale connaît des délits des ministres.'],
    ],
    pieges: [
      ['roi', 'assemblee', 'dissout', 'Article 5 : le Corps législatif ne pourra être dissous par le roi.'],
      ['assemblee', 'ministres', 'renverse', 'Les ministres ne répondent que de leurs délits : une responsabilité pénale, pas politique.'],
      ['assemblee', 'roi', 'accuse', 'La personne du roi est inviolable et sacrée.'],
      ['peuple', 'roi', 'elit', 'La royauté est héréditaire.'],
    ] },
  { id: 'charte1814', nom: 'Charte de 1814', zones: [6], famille: 'Monarchie constitutionnelle',
    organes: [['electeurs', 'Électeurs'], ['roi', 'Roi'], ['ministres', 'Ministres'], ['pairs', 'Pairs'], ['deputes', 'Députés']],
    liens: [
      ['electeurs', 'deputes', 'elit', 'Les députés sont élus par les collèges électoraux, au suffrage censitaire.'],
      ['roi', 'pairs', 'nomme', 'La nomination des pairs appartient au roi.'],
      ['roi', 'ministres', 'nomme', 'Au roi seul appartient la puissance exécutive : il choisit ses ministres.'],
      ['roi', 'deputes', 'dissout', 'Article 50 : le roi peut dissoudre la Chambre des députés.'],
      ['roi', ['deputes', 'pairs'], 'veto', 'Le roi seul sanctionne les lois : il peut refuser celles que votent les chambres.'],
      ['deputes', 'ministres', 'accuse', 'Article 55 : la Chambre des députés a le droit d’accuser les ministres.'],
      ['pairs', 'ministres', 'juge', 'Article 55 : la Chambre des pairs a seule le droit de les juger.'],
    ],
    pieges: [
      ['roi', 'pairs', 'dissout', 'Seule la Chambre des députés peut être dissoute.'],
      ['deputes', 'ministres', 'renverse', 'La Charte ne prévoit qu’une accusation pour trahison ou concussion, pas un retrait de confiance.'],
      ['electeurs', 'pairs', 'elit', 'Les pairs sont nommés par le roi.'],
    ] },
  { id: 'weimar', nom: 'Allemagne, Weimar 1919', zones: [5], famille: 'Parlementarisme dualiste',
    organes: [['peuple', 'Peuple'], ['president', 'Président du Reich'], ['chancelier', 'Chancelier'], ['reichstag', 'Reichstag']],
    liens: [
      ['peuple', 'president', 'elit', 'Article 41 : le président du Reich est élu par tout le peuple allemand.'],
      ['peuple', 'reichstag', 'elit', 'Le Reichstag est l’assemblée élue.'],
      ['president', 'chancelier', 'nomme', 'Article 53 : le chancelier est nommé et révoqué par le président du Reich.'],
      ['president', 'reichstag', 'dissout', 'Article 25 : le président peut dissoudre le Reichstag, une fois seulement pour le même motif.'],
      ['reichstag', 'chancelier', 'renverse', 'Article 54 : le chancelier doit démissionner si le Reichstag lui retire sa confiance.'],
      ['reichstag', 'president', 'accuse', 'Article 43 : le Reichstag peut proposer la destitution du président, décidée par le peuple.'],
    ],
    pieges: [
      ['chancelier', 'reichstag', 'dissout', 'C’est le président du Reich qui dissout le Reichstag.'],
      ['reichstag', 'chancelier', 'elit', 'Le chancelier est nommé par le président, pas élu par le Reichstag.'],
    ] },
  { id: 'autriche', nom: 'Autriche, 1920', zones: [5], famille: 'Parlementarisme moniste',
    organes: [['peuple', 'Peuple'], ['national', 'Conseil national'], ['president', 'Président fédéral'], ['gouvernement', 'Gouvernement']],
    liens: [
      ['peuple', 'national', 'elit', 'Article 24 : le Conseil national est élu par la nation tout entière.'],
      ['national', 'gouvernement', 'elit', 'Article 70 : le gouvernement fédéral est élu par le Conseil national.'],
      ['national', 'president', 'elit', 'Article 60 : le président est élu par l’Assemblée fédérale, que le Conseil national forme avec le Conseil fédéral.'],
    ],
    pieges: [
      ['president', 'national', 'dissout', 'Article 29 : seul le Conseil national peut se dissoudre, par une loi.'],
      ['president', 'gouvernement', 'nomme', 'Le gouvernement est élu par le Conseil national : c’est le monisme.'],
      ['peuple', 'president', 'elit', 'En 1920, le président est élu par l’Assemblée fédérale, pas par le peuple.'],
    ] },
];

// LE NUANCIER DES ÉTATS. 0 État unitaire, 1 État régional, 2 État fédéral, 3 Confédération.
export const nuances = ['État unitaire', 'État régional', 'État fédéral', 'Confédération'];
export const nuancier = [
  ['La France', 0, 'Un État unitaire, décentralisé depuis 1982, qui reste indivisible.'],
  ['L’Italie', 1, 'Un État régional : l’autonomie de ses régions est garantie.'],
  ['L’Espagne', 1, 'Un État régional, né d’une histoire de provinces longtemps disjointes.'],
  ['Le Royaume-Uni', 1, 'Une agrégation de royaumes : la dévolution donne une autonomie différente à chacun.'],
  ['La Belgique', 2, 'Un État fédéral né de la dissociation d’un État unitaire.'],
  ['Les États-Unis', 2, 'Le modèle fédéral, inventé en 1787 par association d’États.'],
  ['Le Canada', 2, 'Un État fédéral, né d’une association.'],
  ['L’Allemagne', 2, 'Un État fédéral : la Loi fondamentale de 1949.'],
  ['L’Inde', 2, 'Le modèle fédéral s’est répandu hors d’Europe : Brésil, Inde, Australie.'],
  ['La Confédération germanique (1815)', 3, 'Les États allemands associés après la chute de Napoléon.'],
  ['La Suisse avant 1848', 3, 'Une confédération, avant la constitution fédérale de 1848.'],
  ['Un seul centre d’impulsion politique, une seule loi pour tout le territoire', 0, 'C’est la définition de l’État unitaire.'],
  ['Des collectivités qui s’administrent elles-mêmes, sous le contrôle de l’État', 0, 'La décentralisation : l’État reste unitaire.'],
  ['Une autonomie régionale que l’État ne peut pas reprendre', 1, 'La garantie de l’autonomie fait l’État régional.'],
  ['Une autonomie différente d’une région à l’autre', 1, 'L’asymétrie, trait des États régionaux.'],
  ['Westminster transfère des pouvoirs législatifs au Parlement écossais', 1, 'La dévolution britannique.'],
  ['Les États membres participent à la révision de la constitution commune', 2, 'Le principe de participation, propre à l’État fédéral.'],
  ['Une des deux assemblées représente les États membres', 2, 'Encore la participation des États fédérés.'],
  ['Chaque État membre a sa propre constitution', 2, 'Le principe d’autonomie des États fédérés.'],
  ['Le Nord refuse que les États du Sud quittent l’Union', 2, 'Avant la guerre de Sécession : dans un État fédéral, on ne sort pas.'],
  ['Les États membres peuvent décider d’en sortir', 3, 'C’est ce qui distingue la confédération de l’État fédéral.'],
];

// LA PLUME DU CONSTITUANT. Articles recopiés de la plaquette. {bon|leurre|leurre} marque un trou.
export const sources = {
  ddhc: 'Déclaration des droits de l’homme, 1789', c1791: 'Constitution de 1791', charte1814: 'Charte de 1814', charte1830: 'Charte de 1830',
  weimar: 'Constitution de Weimar, 1919', autriche: 'Constitution autrichienne, 1920',
};
export const textes = [
  ['ddhc', 'Article 1', 'Les hommes naissent et demeurent {libres|égaux|soumis} et égaux en {droits|devoirs|richesses}. Les distinctions sociales ne peuvent être fondées que sur l’{utilité|naissance|fortune} commune.', [3, 4]],
  ['ddhc', 'Article 2', 'Le but de toute association politique est la {conservation|création|limitation} des droits naturels et imprescriptibles de l’homme. Ces droits sont la liberté, la {propriété|fraternité|égalité}, la sûreté, et la {résistance|soumission|participation} à l’oppression.', [3, 4]],
  ['ddhc', 'Article 3', 'Le principe de toute souveraineté réside essentiellement dans la {nation|peuple|loi}. Nul corps, nul individu ne peut exercer d’autorité qui n’en {émane|découle|dépende} expressément.', [4]],
  ['ddhc', 'Article 16', 'Toute société dans laquelle la {garantie|déclaration|liberté} des droits n’est pas assurée, ni la {séparation|confusion|hiérarchie} des pouvoirs déterminée, n’a point de {constitution|gouvernement|liberté}.', [3, 4]],
  ['c1791', 'Titre III, article 1er', 'La Souveraineté est une, {indivisible|partageable|déléguée}, inaliénable et imprescriptible. Elle appartient à la {Nation|Roi|Assemblée} ; aucune section du peuple, ni aucun individu, ne peut s’en attribuer l’exercice.', [4]],
  ['c1791', 'Titre III, article 2', 'La Nation, de qui seule émanent tous les Pouvoirs, ne peut les exercer que par {délégation|elle-même|référendum}. La Constitution française est {représentative|démocratique|monarchique} : les représentants sont le Corps législatif et le {roi|peuple|Sénat}.', [4]],
  ['c1791', 'Titre III, article 4', 'Le Gouvernement est {monarchique|républicain|parlementaire} : le Pouvoir exécutif est délégué au roi, pour être exercé sous son autorité, par des ministres et autres agents {responsables|élus|inamovibles}.', [4]],
  ['c1791', 'Titre III, article 5', 'Le Pouvoir Judiciaire est délégué à des juges {élus|nommés|tirés au sort} à temps par le peuple.', [4]],
  ['c1791', 'Chapitre Ier, article 1er', 'L’Assemblée nationale formant le corps législatif est {permanente|annuelle|temporaire}, et n’est composée que d’une {Chambre|section|commission}.', [4]],
  ['c1791', 'Chapitre Ier, article 5', 'Le Corps législatif ne pourra être {dissous|convoqué|présidé} par le roi.', [4]],
  ['c1791', 'Chapitre II, section 1, article 3', 'Il n’y a point en France d’autorité supérieure à celle de la {loi|Nation|Constitution}. Le roi ne règne que par elle, et ce n’est qu’au nom de la loi qu’il peut exiger l’{obéissance|impôt|hommage}.', [4]],
  ['c1791', 'Chapitre II, section 4, article 1er', 'Au {roi|Corps législatif|peuple} seul appartiennent le choix et la {révocation|responsabilité|formation} des ministres.', [4]],
  ['c1791', 'Chapitre III, section 3, article 2', 'Dans le cas où le roi refuse son consentement, ce refus n’est que {suspensif|absolu|consultatif}.', [4]],
  ['charte1814', 'Article 13', 'La personne du roi est {inviolable|responsable|élective} et sacrée. Ses ministres sont {responsables|inviolables|élus}. Au roi seul appartient la puissance {exécutive|législative|judiciaire}.', [6]],
  ['charte1814', 'Article 15', 'La puissance législative s’exerce {collectivement|séparément|exclusivement} par le roi, la Chambre des {pairs|sénateurs|lords}, et la Chambre des députés des départements.', [6]],
  ['charte1814', 'Article 16', 'Le {roi|Parlement|ministre} propose la loi.', [6]],
  ['charte1814', 'Article 27', 'La nomination des pairs de France appartient au {roi|peuple|Chambre des députés}. Leur nombre est {illimité|fixe|réduit}.', [6]],
  ['charte1814', 'Article 50', 'Le roi convoque chaque année les deux Chambres ; il les proroge, et peut {dissoudre|présider|suspendre} celle des députés des départements.', [6]],
  ['charte1814', 'Article 55', 'La Chambre des députés a le droit d’{accuser|élire|renverser} les ministres, et de les traduire devant la Chambre des {pairs|députés|cassation} qui seule a celui de les juger.', [6]],
  ['charte1830', 'Article 15', 'La proposition des lois appartient au roi, à la Chambre des {pairs|ministres|communes} et à la Chambre des {députés|pairs|représentants}.', [6]],
  ['weimar', 'Article 25', 'Le président du Reich peut {dissoudre|convoquer|présider} le Reichstag, mais une fois seulement pour le même motif.', [5]],
  ['weimar', 'Article 41', 'Le président du Reich est élu par tout le {peuple|Reichstag|Conseil} allemand.', [5]],
  ['weimar', 'Article 54', 'Le chancelier et les ministres du Reich ont besoin, pour l’accomplissement de leurs fonctions, de la {confiance|nomination|signature} du Reichstag.', [5]],
  ['autriche', 'Article 70', 'Le gouvernement fédéral est {élu|nommé|révoqué} au scrutin nominal par le Conseil {national|fédéral|des ministres}.', [5]],
];
