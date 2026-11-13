// LA FORMULE : lire la formule du juge, en déduire le type de décision, puis le plan.
// Tâche K de TACHES.md. Textes des arrêts vérifiés sur Légifrance (voir notes/formule-verifs.md).
// Méthode inspirée d'une vidéo (Juris'Up) ; aucun texte ni plan n'en est repris.
//
// TYPES : ce que révèle la formule. Chaque type a un squelette de plan, avec des [crochets] à remplir.
// Les squelettes des autres types servent de pièges à l'étape 2.
// ARRETS : un arrêt du cours par entrée.
//   extrait : [avant, formule, après] ; la formule est la partie à toucher (étape 1).
//   type : clé de TYPES ; lecture : ce qu'il fallait voir, montré après la réponse.
//   pieges : 2 clés de TYPES, les squelettes proposés à côté du bon (étape 2).
//   morceaux : à glisser dans le squelette (étape 3, version entière) ; case 'I' ou 'II', ou null pour un leurre.
//   modele : le plan propre à l'arrêt, montré à la fin.

export const TYPES = {
  violation: {
    nom: 'Cassation pour violation de la loi',
    signe: '« a violé » : les juges du fond se sont trompés sur la règle elle-même.',
    squelette: { I: 'La règle rappelée par la Cour : [la règle]', II: 'La censure de sa méconnaissance : [ce que les juges du fond ont fait]' },
  },
  baseLegale: {
    nom: 'Cassation pour manque de base légale',
    signe: '« n\'a pas donné de base légale » : la règle n\'est pas en cause, les constatations sont insuffisantes.',
    squelette: { I: 'La règle et ce qu\'elle exige de constater : [la condition]', II: 'Des motifs impropres à trancher : [ce qui manquait]' },
  },
  justifie: {
    nom: 'Rejet : décision légalement justifiée',
    signe: '« a, par ces seuls motifs, justifié légalement sa décision » : les constatations suffisent.',
    squelette: { I: 'La caractérisation par les juges du fond : [la notion et ses éléments]', II: 'Une motivation jugée suffisante : [la conséquence tirée]' },
  },
  pousse: {
    nom: 'Rejet avec contrôle poussé',
    signe: '« à bon droit », « exactement » : la Cour fait sienne la solution juridique.',
    squelette: { I: 'L\'affirmation de la règle : [la règle approuvée]', II: 'Son application approuvée : [la qualification ou la conséquence]' },
  },
  leger: {
    nom: 'Rejet avec contrôle léger',
    signe: '« a pu » : la solution était possible, la Cour ne dit pas qu\'elle s\'imposait.',
    squelette: { I: 'Une règle que les juges du fond devaient appliquer : [la règle]', II: 'Une appréciation laissée aux juges du fond : [ce qu\'ils ont pu en déduire]' },
  },
  souverain: {
    nom: 'Rejet : appréciation souveraine, puis contrôle',
    signe: '« souverainement », « interprétation souveraine » : les faits et le sens du contrat échappent à la Cour ; la qualification, non.',
    squelette: { I: 'Le pouvoir souverain des juges du fond : [le fait ou l\'interprétation]', II: 'Le contrôle maintenu sur la qualification : [la qualification retenue]' },
  },
  // Conseil d'État
  erreurDroit: {
    nom: 'Cassation pour erreur de droit',
    signe: '« a commis une erreur de droit » : devant le juge de cassation administratif, le pendant de « a violé ».',
    squelette: { I: 'Le principe posé par le Conseil d\'État : [le principe]', II: 'La censure de l\'erreur des juges du fond : [ce qu\'ils ont jugé]' },
  },
  compatible: {
    nom: 'Contrôle de compatibilité exercé, sans censure',
    signe: '« n\'est pas incompatible » : en le disant, le juge montre qu\'il s\'estime compétent pour contrôler.',
    squelette: { I: 'Le contrôle accepté : [la norme contrôlée et sa référence]', II: 'Une norme jugée compatible : [la solution]' },
  },
  abrogation: {
    nom: 'Annulation : obligation d\'abroger un règlement devenu illégal',
    signe: '« est tenue d\'y déférer », « sont devenues illégales » : l\'illégalité peut survenir après coup.',
    squelette: { I: 'L\'obligation d\'abroger : [le principe]', II: 'Son application : [le règlement devenu illégal et pourquoi]' },
  },
  invocabilite: {
    nom: 'Invocabilité d\'une norme, puis contrôle au fond',
    signe: '« tout justiciable peut se prévaloir » : le juge ouvre une voie de droit, puis vérifie si elle sert en l\'espèce.',
    squelette: { I: 'L\'ouverture d\'une voie de droit : [ce que le justiciable peut invoquer]', II: 'Sa portée limitée en l\'espèce : [pourquoi la requête échoue]' },
  },
  lacune: {
    nom: 'Annulation « en tant que ne… pas »',
    signe: '« annulé en tant qu\'il ne prévoit pas » : l\'illégalité tient à ce que le texte omet.',
    squelette: { I: 'Une obligation pesant sur l\'auteur de l\'acte : [l\'obligation]', II: 'L\'annulation de l\'acte dans la mesure de son silence : [la lacune]' },
  },
};

export const ARRETS = [
  // OBLIGATIONS, ÉQUIPE 1 -----------------------------------------------------------------------
  {
    id: 'f-climatiseur', arret: 'climatiseur', matiere: 'oblig', equipes: [1],
    ref: 'Civ. 1re, 19 sept. 2018, n° 17-24.347',
    extrait: ['Qu\'en faisant ainsi application de l\'article 1186 du code civil dans sa rédaction issue de l\'ordonnance n° 2016-131 du 10 février 2016 à un contrat dont il ressortait de ses propres constatations qu\'il avait été conclu avant le 1er octobre 2016, la juridiction de proximité ', 'a violé le texte susvisé', '.'],
    type: 'violation', pieges: ['baseLegale', 'pousse'],
    lecture: 'La juridiction de proximité a appliqué une règle qui ne régissait pas le contrat : c\'est une erreur sur la règle, donc une violation de la loi. Attention, ce n\'est pas une cour d\'appel qui est censurée.',
    morceaux: [
      { t: 'les contrats conclus avant le 1er octobre 2016 demeurent soumis à la loi ancienne', case: 'I' },
      { t: 'l\'application de la caducité de l\'article 1186 nouveau à un contrat conclu en 2013', case: 'II' },
      { t: 'le juge peut interpréter le droit ancien à la lumière du droit nouveau', case: null, w: 'Vrai en général, mais l\'arrêt ne le dit pas : il censure, il n\'interprète pas.' },
      { t: 'l\'insuffisance des constatations sur la date du contrat', case: null, w: 'La date était constatée : c\'est justement pour cela que la règle était fausse.' },
    ],
    modele: { I: 'La survie de la loi ancienne pour les contrats conclus avant le 1er octobre 2016', II: 'La censure de l\'application de l\'article 1186 nouveau à un contrat ancien' },
  },
  {
    id: 'f-lampe', arret: 'lampe', matiere: 'oblig', equipes: [1],
    ref: 'Civ. 1re, 5 janv. 2022, n° 20-20.331',
    extrait: ['En présence d\'une convention d\'assistance bénévole, toute faute de l\'assistant, fût-elle d\'imprudence, ayant causé un dommage à l\'assisté est susceptible d\'engager la responsabilité de l\'assistant. […] En statuant ainsi, la cour d\'appel ', 'a violé le texte susvisé', '.'],
    type: 'violation', pieges: ['leger', 'justifie'],
    lecture: 'La Cour pose d\'abord la règle (toute faute, même d\'imprudence), puis censure la cour d\'appel qui l\'a écartée : violation de l\'article 1147 ancien.',
    morceaux: [
      { t: 'toute faute de l\'assistant, fût-elle d\'imprudence, peut engager sa responsabilité', case: 'I' },
      { t: 'la responsabilité écartée au nom de la commune intention des parties', case: 'II' },
      { t: 'seule une faute lourde de l\'assistant engage sa responsabilité', case: null, w: 'C\'est précisément ce que la Cour refuse.' },
      { t: 'l\'appréciation souveraine de la commune intention des parties', case: null, w: 'La Cour ne s\'incline pas devant cette appréciation : elle casse.' },
    ],
    modele: { I: 'L\'affirmation de la responsabilité de l\'assistant pour toute faute, même d\'imprudence', II: 'La censure d\'une exonération tirée de la commune intention des parties' },
  },
  {
    id: 'f-geste', arret: 'geste', matiere: 'oblig', equipes: [1],
    ref: 'Com., 12 déc. 2018, n° 17-22.268',
    extrait: ['Qu\'en se déterminant par de tels motifs, impropres à exclure l\'existence d\'un engagement unilatéral de la société Beauty Tech, postérieur à la commande, qui l\'aurait obligée envers la société Plaisirimmo, la cour d\'appel ', 'n\'a pas donné de base légale à sa décision', '.'],
    type: 'baseLegale', pieges: ['violation', 'souverain'],
    lecture: 'La règle n\'est pas en cause : les juges devaient rechercher si le geste commercial valait engagement unilatéral, et leurs motifs ne permettaient pas de l\'exclure. (La décision attaquée était un jugement du tribunal de commerce ; l\'arrêt écrit pourtant « la cour d\'appel ».)',
    morceaux: [
      { t: 'un geste commercial postérieur à la commande peut constituer un engagement unilatéral', case: 'I' },
      { t: 'des motifs tirés de la seule date du geste, impropres à exclure cet engagement', case: 'II' },
      { t: 'l\'engagement unilatéral n\'est pas une source d\'obligation', case: null, w: 'La Cour suppose le contraire : elle reproche de ne pas l\'avoir recherché.' },
      { t: 'la violation de l\'article 1134 ancien', case: null, w: 'Ce n\'est pas la règle qui est méconnue, ce sont les constatations qui manquent.' },
    ],
    modele: { I: 'L\'engagement unilatéral, source d\'obligation possible après la commande', II: 'La censure de motifs impropres à l\'écarter' },
  },
  {
    id: 'f-investiture', arret: 'investiture2013', matiere: 'oblig', equipes: [1],
    ref: 'Civ. 1re, 27 févr. 2013, n° 10-19.133',
    extrait: ['c\'est par une ', 'interprétation souveraine, exclusive de dénaturation', ', que l\'ambiguïté des termes des conventions […] rendait nécessaire, que la cour d\'appel […] a estimé que la cause déterminante de ces conventions […] n\'était pas la participation des candidats aux dépenses électorales […] mais leur investiture à une élection politique ; qu\'elle en a déduit à bon droit qu\'une telle cause était illicite comme portant sur un objet hors du commerce'],
    type: 'souverain', pieges: ['pousse', 'baseLegale'],
    lecture: 'Deux temps : le sens du contrat relève des juges du fond (« interprétation souveraine »), mais la qualification de cause illicite est contrôlée et approuvée (« à bon droit »).',
    morceaux: [
      { t: 'la cause déterminante : l\'investiture, non la participation aux dépenses', case: 'I' },
      { t: 'une cause illicite, l\'investiture étant hors du commerce', case: 'II' },
      { t: 'la dénaturation de conventions claires', case: null, w: 'La Cour dit l\'inverse : les termes étaient ambigus, l\'interprétation était nécessaire.' },
      { t: 'l\'irrévocabilité des dons', case: null, w: 'Argument du pourvoi, écarté : il ne fait pas le plan.' },
    ],
    modele: { I: 'L\'interprétation souveraine de la cause déterminante des conventions', II: 'Le contrôle de la qualification : l\'investiture, cause illicite' },
  },
  {
    id: 'f-bailcache', arret: 'bailcache', matiere: 'oblig', equipes: [1],
    ref: 'Civ. 3e, 19 janv. 2022, n° 20-13.951',
    extrait: ['La cour d\'appel a exactement retenu que l\'obligation de loyauté, de bonne foi et de sincérité s\'imposait en matière contractuelle. […] Elle ', 'a pu déduire de ces seuls motifs', ' que la dissimulation de la libération des lieux par l\'occupant en titre […] manifestait l\'absence de loyauté, de bonne foi et de sincérité de l\'acquéreur, ouvrant droit à dommages-intérêts pour le vendeur.'],
    type: 'leger', pieges: ['pousse', 'violation'],
    lecture: 'Le même arrêt montre les deux intensités : « exactement retenu » pour la règle (contrôle poussé), « a pu déduire » pour son application aux faits (contrôle léger). La formule à retenir pour le plan est la seconde : c\'est elle qui porte la solution.',
    morceaux: [
      { t: 'l\'obligation de loyauté, de bonne foi et de sincérité en matière contractuelle', case: 'I' },
      { t: 'la dissimulation de la libération des lieux, que les juges ont pu juger déloyale', case: 'II' },
      { t: 'la nullité de la vente pour dol', case: null, w: 'Le vendeur obtient des dommages-intérêts, pas la nullité.' },
      { t: 'l\'appréciation de la loyauté au jour de la promesse', case: null, w: 'Non : au jour de la réalisation de la vente, le 17 janvier 2012.' },
    ],
    modele: { I: 'Une obligation de loyauté exactement rappelée', II: 'Une déloyauté que les juges du fond ont pu déduire des faits' },
  },
  {
    id: 'f-karous', arret: 'karous2015', matiere: 'oblig', equipes: [1],
    ref: 'Civ. 1re, 4 févr. 2015, n° 14-10.920',
    extrait: ['que la cour d\'appel, caractérisant ainsi la contrainte économique exploitée par la société Karous pour amener son cocontractant à lui consentir une indemnité transactionnelle d\'un montant particulièrement élevé, ', 'a, par ces seuls motifs, justifié légalement sa décision', ' de tenir la transaction pour nulle'],
    type: 'justifie', pieges: ['baseLegale', 'violation'],
    lecture: 'C\'est l\'envers du manque de base légale : les juges du fond ont constaté tout ce qu\'il fallait (menace illégitime, crainte d\'un échec coûteux) pour caractériser la contrainte économique.',
    morceaux: [
      { t: 'une menace de recours illégitime, faute de toute chance de succès', case: 'I' },
      { t: 'la nullité de la transaction pour violence économique', case: 'II' },
      { t: 'l\'exercice normal d\'une voie de droit', case: null, w: 'La menace d\'une voie de droit n\'est violence que si elle est illégitime : c\'est ce qui est caractérisé ici.' },
      { t: 'l\'absence de concessions réciproques', case: null, w: 'Autre fondement invoqué, que la Cour n\'a pas besoin d\'examiner.' },
    ],
    modele: { I: 'La caractérisation d\'une contrainte économique illégitime', II: 'Une motivation suffisante pour annuler la transaction' },
  },

  // ADMINISTRATIF -------------------------------------------------------------------------------
  {
    id: 'f-nicolo', arret: 'nicolo', matiere: 'admin', equipes: [1, 2],
    ref: 'CE, Ass., 20 oct. 1989, n° 108243',
    extrait: ['que les règles ci-dessus rappelées, définies par la loi du 7 juillet 1977, ', 'ne sont pas incompatibles avec les stipulations claires', ' de l\'article 227-1 précité du traité de Rome'],
    type: 'compatible', pieges: ['abrogation', 'erreurDroit'],
    lecture: 'La solution est un rejet, mais tout l\'apport est dans la formule : en vérifiant qu\'une loi de 1977, postérieure au traité de 1957, n\'est pas incompatible avec lui, le Conseil d\'État accepte de faire prévaloir le traité sur la loi postérieure.',
    morceaux: [
      { t: 'la loi postérieure confrontée au traité de Rome sur le fondement de l\'article 55', case: 'I' },
      { t: 'la loi de 1977 compatible, la requête rejetée', case: 'II' },
      { t: 'la loi fait écran entre le traité et l\'acte', case: null, w: 'C\'est l\'état du droit que Nicolo abandonne.' },
      { t: 'l\'annulation des élections européennes', case: null, w: 'La requête est rejetée.' },
    ],
    modele: { I: 'L\'acceptation du contrôle de la loi postérieure au traité', II: 'Une loi jugée compatible avec le traité' },
  },
  {
    id: 'f-alitalia', arret: 'alitalia', matiere: 'admin', equipes: [1],
    ref: 'CE, Ass., 3 févr. 1989, n° 74052',
    extrait: ['l\'autorité compétente, saisie d\'une demande tendant à l\'abrogation d\'un règlement illégal, ', 'est tenu d\'y déférer', ', soit que ce règlement ait été illégal dès la date de sa signature, soit que l\'illégalité résulte de circonstances de droit ou de fait postérieures à cette date'],
    type: 'abrogation', pieges: ['lacune', 'compatible'],
    lecture: 'L\'administration doit abroger un règlement illégal, même devenu illégal après coup. Appliqué aux directives : une disposition réglementaire incompatible avec leurs objectifs, une fois le délai de transposition expiré, « est devenue illégale ».',
    morceaux: [
      { t: 'l\'obligation d\'abroger un règlement illégal, dès l\'origine ou devenu tel', case: 'I' },
      { t: 'la condition d\'affectation exclusive, devenue illégale au regard de la sixième directive', case: 'II' },
      { t: 'le contrôle de la conformité de la loi à la directive', case: null, w: 'Le Conseil d\'État précise le contraire : il contrôle les décrets, non la loi.' },
      { t: 'l\'invocabilité de la directive contre un acte individuel', case: null, w: 'Ce sera Perreux, en 2009.' },
    ],
    modele: { I: 'L\'obligation d\'abroger les règlements illégaux', II: 'Des règlements devenus illégaux faute de compatibilité avec une directive' },
  },
  {
    id: 'f-perreux', arret: 'perreux', matiere: 'admin', equipes: [1, 2],
    ref: 'CE, Ass., 30 oct. 2009, n° 298348',
    extrait: ['qu\'en outre, ', 'tout justiciable peut se prévaloir', ', à l\'appui d\'un recours dirigé contre un acte administratif non réglementaire, des dispositions précises et inconditionnelles d\'une directive, lorsque l\'Etat n\'a pas pris, dans les délais impartis par celle-ci, les mesures de transposition nécessaires'],
    type: 'invocabilite', pieges: ['abrogation', 'erreurDroit'],
    lecture: 'Le principe ouvre une voie de droit nouvelle ; l\'application la referme pour l\'espèce : l\'article 10 de la directive est « dépourvu d\'effet direct » à cause de sa réserve, et le juge fixe lui-même un aménagement de la preuve.',
    morceaux: [
      { t: 'les dispositions précises et inconditionnelles d\'une directive non transposée, invocables contre un acte individuel', case: 'I' },
      { t: 'un article 10 dépourvu d\'effet direct, et une preuve aménagée par le juge lui-même', case: 'II' },
      { t: 'l\'annulation de la nomination de Mme B', case: null, w: 'Le choix n\'est entaché ni d\'erreur de droit ni d\'erreur manifeste : rejet.' },
      { t: 'la primauté de la directive sur la Constitution', case: null, w: 'L\'arrêt fonde au contraire l\'obligation de transposer sur l\'article 88-1 de la Constitution.' },
    ],
    modele: { I: 'L\'invocabilité des directives contre les actes individuels', II: 'Une invocabilité sans effet en l\'espèce, compensée par l\'office du juge' },
  },
  {
    id: 'f-kpmg', arret: 'kpmg', matiere: 'admin', equipes: [1, 2],
    ref: 'CE, Ass., 24 mars 2006, n° 288460',
    extrait: ['Le décret du 16 novembre 2005 portant approbation du code de déontologie ', 'est annulé en tant qu\'il ne prévoit pas', ' de mesures transitoires relatives aux mandats de commissaires aux comptes en cours à la date de son entrée en vigueur.'],
    type: 'lacune', pieges: ['abrogation', 'compatible'],
    lecture: 'Le décret n\'est pas annulé pour ce qu\'il dit, mais pour ce qu\'il omet : l\'autorité réglementaire devait, au nom de la sécurité juridique, prévoir des mesures transitoires.',
    morceaux: [
      { t: 'l\'obligation d\'édicter les mesures transitoires qu\'implique une réglementation nouvelle', case: 'I' },
      { t: 'un code de déontologie appliqué sans transition aux mandats en cours', case: 'II' },
      { t: 'l\'annulation totale du code de déontologie', case: null, w: 'Annulation partielle seulement : « en tant que ».' },
      { t: 'l\'interdiction de toute application de la loi nouvelle aux contrats en cours', case: null, w: 'La loi le peut, pour des raisons d\'ordre public ; c\'est le règlement qui doit ménager une transition.' },
    ],
    modele: { I: 'La sécurité juridique, source d\'une obligation de mesures transitoires', II: 'L\'annulation du décret en tant qu\'il n\'en prévoit pas' },
  },
  {
    id: 'f-gardedieu', arret: 'gardedieu', matiere: 'admin', equipes: [1, 2],
    ref: 'CE, Ass., 8 févr. 2007, n° 279522',
    extrait: ['qu\'en statuant ainsi, alors que l\'Etat ne peut, sans méconnaître ces stipulations, porter atteinte au droit de toute personne à un procès équitable en prenant, au cours d\'un procès, des mesures législatives à portée rétroactive […] sauf lorsque l\'intervention de ces mesures est justifiée par d\'impérieux motifs d\'intérêt général, la cour administrative d\'appel ', 'a commis une erreur de droit', ''],
    type: 'erreurDroit', pieges: ['compatible', 'invocabilite'],
    lecture: 'La cour administrative d\'appel s\'était contentée d\'un « but d\'intérêt général suffisant » ; il fallait d\'« impérieux motifs ». Erreur sur la règle, donc cassation, puis le Conseil d\'État règle l\'affaire et engage la responsabilité de l\'État du fait d\'une loi inconventionnelle.',
    morceaux: [
      { t: 'la responsabilité de l\'État pour une loi adoptée en méconnaissance des engagements internationaux', case: 'I' },
      { t: 'une validation législative sans impérieux motif d\'intérêt général, contraire au procès équitable', case: 'II' },
      { t: 'la responsabilité fondée sur la rupture d\'égalité devant les charges publiques', case: null, w: 'C\'est l\'autre fondement rappelé par l\'arrêt, pas celui qu\'il applique.' },
      { t: 'l\'abrogation de la loi de validation', case: null, w: 'Le juge administratif n\'abroge pas une loi : il l\'écarte et indemnise.' },
    ],
    modele: { I: 'Un nouveau cas de responsabilité de l\'État du fait des lois', II: 'Son application à une validation législative inconventionnelle' },
  },
];
