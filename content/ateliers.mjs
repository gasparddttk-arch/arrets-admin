// L'ATELIER DU CAS PRATIQUE, droit des obligations.
// Chaque cas se construit comme une copie : trier et qualifier les faits, poser et ordonner les problèmes,
// un syllogisme par problème (règle, conditions, exception, conclusion), puis le conseil au client.
// Cas d'entraînement écrits sur les axes du cours (TD 1 à 6 de l'équipe 1, mêmes thèmes chez l'équipe 2).
//
// Format d'un cas :
//   niveau : 1 (un problème), 2 (deux problèmes enchaînés), 3 (faits lacunaires, hypothèses, problème caché)
//   zones : chambres par équipe { 1: [...], 2: [...] } ; un cas sans chambre pour une équipe ne lui est pas proposé
//   enonce : texte et faits ; { f: id, t } un fait utile, { b: true, t } un détail sans portée juridique
//   faits : pour chaque fait utile, sa qualification juridique (la bonne d'abord) et pourquoi
//   problemes : les vrais, dans l'ordre où on les traite ; t la formulation juridique, factuel la tentation à éviter
//   faux : problèmes que les faits ne posent pas
//   syllo : un syllogisme par problème
//     regle : [article, texte, carte] la bonne règle ; leurres : [[article, texte, pourquoi], ...]
//     conditions : [condition, fait qui la remplit | null, état, phrase « en l'espèce »]
//        état : 'oui' remplie, 'non' pas remplie, 'hypo' le cas ne le dit pas (si / sinon)
//     exception : [l'exception, joue-t-elle ici (vrai/faux), phrase] ou null
//     une condition sans fait et « oui » est acquise d'avance (problème précédent, ou la loi) : elle s'allume seule
//     conclusion : [la bonne, leurre, leurre]
//   conseil : [le bon, leurre, leurre]

export const ateliers = [
  {
    id: 'at-offre', titre: 'La maison de Rennes', niveau: 2, zones: { 1: [7], 2: [3] },
    enonce: [
      'Le 2 mars, ', { f: 'f1', t: 'Mme Leroy écrit à M. Dubois qu’elle lui vend sa maison 300 000 euros, « offre valable quinze jours »' }, '. ',
      { b: true, t: 'M. Dubois, instituteur, a toujours aimé cette maison bleue.' }, ' Ravi, ', { f: 'f2', t: 'il paie 800 euros à un géomètre pour faire mesurer le terrain' }, '. ',
      { f: 'f3', t: 'Le 8 mars, Mme Leroy lui annonce qu’elle a changé d’avis' }, '. ', { f: 'f4', t: 'Le 10 mars, M. Dubois accepte l’offre par écrit' }, '. ',
      { b: true, t: 'Il en parle à tout son entourage.' },
    ],
    question: 'M. Dubois vous consulte : peut-il obtenir la maison ? À défaut, que peut-il obtenir ?',
    faits: {
      f1: ['Une offre assortie d’un délai', ['Une simple invitation à entrer en pourparlers', 'Une promesse unilatérale de vente'], 'Elle est ferme et précise (le bien, le prix) et fixe un délai : c’est une offre au sens de l’article 1114.'],
      f2: ['Une dépense engagée sur la foi de l’offre', ['Un commencement d’exécution du contrat de vente', 'Une acceptation tacite de l’offre'], 'Payer un géomètre n’accepte rien : c’est une dépense, qui pourra être un préjudice.'],
      f3: ['Une rétractation avant l’expiration du délai', ['Une rétractation après l’expiration du délai fixé', 'Une caducité de l’offre par l’écoulement du temps'], 'Le délai courait jusqu’au 17 mars : la rétractation du 8 mars intervient pendant le délai.'],
      f4: ['Une acceptation postérieure à la rétractation', ['Une acceptation qui forme le contrat de vente', 'Une contre-proposition sur le prix'], 'L’acceptation arrive après une rétractation : il faut savoir si elle a encore un objet.'],
    },
    problemes: [
      { id: 'p1', t: 'La rétractation d’une offre avant l’expiration du délai fixé par son auteur empêche-t-elle la formation du contrat ?', factuel: 'Mme Leroy avait-elle le droit de changer d’avis ?' },
      { id: 'p2', t: 'La rétractation fautive de l’offre engage-t-elle la responsabilité de son auteur, et pour quel préjudice ?', factuel: 'Mme Leroy doit-elle payer M. Dubois ?' },
    ],
    faux: [['La vente d’un immeuble doit-elle être conclue par acte notarié pour être valable ?', 'Les faits ne posent pas la question de la forme : la question est de savoir si le contrat existe.']],
    syllo: {
      p1: {
        regle: ['Art. 1116, al. 1 et 2', 'L’offre ne peut être rétractée avant l’expiration du délai fixé par son auteur. La rétractation de l’offre en violation de cette interdiction empêche la conclusion du contrat.', 'a1116'],
        leurres: [['Art. 1124, al. 2', 'La révocation de la promesse pendant le temps laissé au bénéficiaire pour opter n’empêche pas la formation du contrat promis.', 'C’est la règle de la promesse unilatérale : ici, il n’y a qu’une offre.'],
          ['Art. 1115', 'L’offre peut être librement rétractée tant qu’elle n’est pas parvenue à son destinataire.', 'L’offre était parvenue à M. Dubois : l’article 1115 ne joue plus.']],
        conditions: [
          ['Une offre assortie d’un délai fixé par son auteur', 'f1', 'oui', 'La lettre du 2 mars est une offre valable quinze jours.'],
          ['Une rétractation avant l’expiration de ce délai', 'f3', 'oui', 'Mme Leroy se rétracte le 8 mars, avant le 17 mars.'],
        ],
        exception: null,
        conclusion: ['La rétractation, bien que fautive, empêche la conclusion du contrat : M. Dubois ne peut pas obtenir la maison.', 'La rétractation, faite pendant le délai, est sans effet : l’acceptation du 10 mars forme la vente.', 'L’offre est caduque, mais M. Dubois peut obtenir l’exécution forcée de la vente promise.'],
      },
      p2: {
        regle: ['Art. 1116, al. 3', 'La rétractation engage la responsabilité extracontractuelle de son auteur dans les conditions du droit commun sans l’obliger à compenser la perte des avantages attendus du contrat.', 'a1116'],
        leurres: [['Art. 1231-1', 'Le débiteur est condamné au paiement de dommages et intérêts en raison de l’inexécution de l’obligation.', 'C’est la responsabilité contractuelle : le contrat n’a jamais été formé.'],
          ['Art. 1112, al. 2', 'La réparation du préjudice né d’une faute dans les négociations ne compense ni la perte des avantages attendus, ni la perte de chance.', 'Il n’y a pas eu de négociations : la règle propre à l’offre est l’article 1116.']],
        conditions: [
          ['Une faute : la rétractation dans le délai', 'f3', 'oui', 'La rétractation du 8 mars viole l’interdiction de l’article 1116 : elle est fautive.'],
          ['Un préjudice réparable', 'f2', 'oui', 'Les 800 euros versés au géomètre sont une perte subie à cause de la rétractation.'],
        ],
        exception: ['Pas de compensation de la perte des avantages attendus du contrat', true, 'L’espoir d’acquérir la maison, et le gain qu’il représentait, n’est pas réparable.'],
        conclusion: ['Mme Leroy doit réparer les 800 euros de frais, mais pas la perte de la maison.', 'Mme Leroy doit indemniser M. Dubois de la perte de la maison, à hauteur de sa valeur.', 'M. Dubois ne peut rien obtenir, puisque le contrat n’a jamais été formé.'],
      },
    },
    conseil: ['M. Dubois n’aura pas la maison, mais Mme Leroy lui doit les 800 euros (art. 1240).', 'M. Dubois peut demander au juge de constater la vente, formée par son acceptation, et de le déclarer propriétaire de la maison.', 'M. Dubois n’a aucune action : une offre ne lie jamais son auteur, qui reste libre de la retirer à tout moment.'],
  },

  {
    id: 'at-pourparlers', titre: 'La franchise abandonnée', niveau: 2, zones: { 1: [9], 2: [2] },
    enonce: [
      { f: 'f1', t: 'Depuis dix-huit mois, la société Boulangerie Nova négocie avec M. Martin l’ouverture d’une franchise' }, '. ',
      { f: 'f2', t: 'À la demande de Nova, M. Martin a signé un bail commercial et fait refaire la vitrine pour 40 000 euros' }, '. ',
      { b: true, t: 'Le local donne sur une place très fréquentée.' }, ' ',
      { f: 'f3', t: 'La veille de la signature, Nova rompt sans un mot d’explication, après avoir choisi un autre candidat' }, '. ',
      { f: 'f4', t: 'M. Martin estime qu’il aurait gagné 150 000 euros en cinq ans avec la franchise' }, '.',
    ],
    question: 'M. Martin vous consulte : que peut-il obtenir de Nova ?',
    faits: {
      f1: ['Des négociations précontractuelles avancées', ['Un contrat de franchise déjà formé entre eux', 'Une offre ferme de contracter'], 'Rien n’est signé : les parties sont dans la période précontractuelle, que l’article 1112 régit.'],
      f2: ['Des dépenses engagées à la demande du partenaire', ['Une exécution anticipée du contrat de franchise', 'Une libéralité consentie au partenaire'], 'Ces frais ont été engagés sur la foi des négociations, à la demande de Nova.'],
      f3: ['Une rupture brutale et sans motif, au dernier moment', ['L’usage normal de la liberté de ne pas contracter', 'Une rétractation d’offre'], 'Rompre est libre ; rompre brutalement, sans explication, après avoir fait engager des frais, ne l’est pas.'],
      f4: ['Les gains espérés du contrat non conclu', ['Un préjudice moral né de la déception', 'Une perte subie du fait des dépenses'], 'C’est la perte des avantages attendus du contrat : le texte l’exclut de la réparation.'],
    },
    problemes: [
      { id: 'p1', t: 'La rupture brutale et sans motif de pourparlers avancés constitue-t-elle une faute ?', factuel: 'Nova avait-elle le droit de choisir un autre candidat ?' },
      { id: 'p2', t: 'Quels préjudices nés d’une faute dans les négociations sont réparables ?', factuel: 'Combien Nova doit-elle payer à M. Martin ?' },
    ],
    faux: [['Le contrat de franchise est-il formé malgré l’absence de signature ?', 'Rien ne montre une rencontre de l’offre et de l’acceptation : la question est celle de la faute dans les négociations.']],
    syllo: {
      p1: {
        regle: ['Art. 1112, al. 1', 'L’initiative, le déroulement et la rupture des négociations précontractuelles sont libres. Ils doivent impérativement satisfaire aux exigences de la bonne foi.', 'a1112'],
        leurres: [['Art. 1102', 'Chacun est libre de contracter ou de ne pas contracter.', 'La liberté existe, mais l’article 1112 lui ajoute l’exigence de bonne foi dans la rupture.'],
          ['Art. 1116', 'L’offre ne peut être rétractée avant l’expiration du délai fixé.', 'Nova n’avait fait aucune offre : il s’agit de pourparlers.']],
        conditions: [
          ['Des négociations en cours', 'f1', 'oui', 'Nova et M. Martin négocient depuis dix-huit mois.'],
          ['Une rupture contraire à la bonne foi', 'f3', 'oui', 'Nova rompt la veille de la signature, sans explication, après avoir fait engager des frais.'],
        ],
        exception: null,
        conclusion: ['La rupture, libre dans son principe, est fautive dans ses circonstances : brutale, tardive, sans motif.', 'La rupture n’est jamais fautive, puisque chacun reste libre de ne pas contracter.', 'Les négociations avancées valent contrat : Nova doit exécuter la franchise.'],
      },
      p2: {
        regle: ['Art. 1112, al. 2', 'En cas de faute commise dans les négociations, la réparation du préjudice qui en résulte ne peut avoir pour objet de compenser ni la perte des avantages attendus du contrat non conclu, ni la perte de chance d’obtenir ces avantages.', 'a1112'],
        leurres: [['Art. 1231-2', 'Les dommages et intérêts dus au créancier sont de la perte qu’il a faite et du gain dont il a été privé.', 'C’est la réparation contractuelle : aucun contrat n’a été conclu.'],
          ['Art. 1116, al. 3', 'La rétractation de l’offre engage la responsabilité de son auteur.', 'Il n’y a pas d’offre rétractée, mais une rupture de négociations.']],
        conditions: [
          ['Une faute dans les négociations', null, 'oui', 'La rupture a été jugée fautive (premier problème).'],
          ['Un préjudice qui n’est pas la perte des avantages attendus', 'f2', 'oui', 'Le bail et les 40 000 euros de travaux sont des frais engagés en pure perte.'],
        ],
        exception: ['Ni la perte des gains espérés, ni la perte de chance de les obtenir', true, 'Les 150 000 euros espérés sont la perte des avantages attendus : ils ne sont pas réparables.'],
        conclusion: ['Seuls les frais engagés sont réparés : les 40 000 euros de travaux, pas les 150 000 euros espérés.', 'M. Martin obtient les 150 000 euros de gains qu’il espérait tirer de la franchise.', 'M. Martin obtient une indemnité pour la perte de chance de conclure le contrat.'],
      },
    },
    conseil: ['M. Martin obtiendra ses frais pour rupture fautive, pas les gains espérés.', 'M. Martin peut exiger de Nova la signature du contrat de franchise, qui était presque prêt.', 'M. Martin n’a aucun recours : la liberté de ne pas contracter permettait à Nova de rompre sans s’expliquer.'],
  },

  {
    id: 'at-promesse', titre: 'L’appartement promis', niveau: 3, zones: { 1: [7], 2: [4] },
    enonce: [
      { f: 'f1', t: 'Le 1er février, M. Roux consent à Mme Faure une promesse unilatérale de vente de son appartement, avec deux mois pour lever l’option' }, '. ',
      { f: 'f2', t: 'Le 1er mars, il lui écrit qu’il révoque sa promesse' }, '. ',
      { f: 'f3', t: 'Le 10 mars, il vend l’appartement à M. Garnier' }, '. ',
      { b: true, t: 'M. Garnier est un ancien collègue de M. Roux.' }, ' ',
      { f: 'f4', t: 'Le 15 mars, Mme Faure lève l’option' }, '. On ne sait pas si M. Garnier connaissait la promesse.',
    ],
    question: 'Mme Faure vous consulte : peut-elle obtenir l’appartement ?',
    faits: {
      f1: ['Une promesse unilatérale de vente', ['Une offre de vente avec délai', 'Un pacte de préférence sur l’appartement'], 'M. Roux a déjà consenti à la vente ; seule manque l’option de Mme Faure : c’est une promesse unilatérale (art. 1124).'],
      f2: ['Une révocation pendant le délai d’option', ['Une rétractation d’offre pendant son délai', 'Une résiliation du contrat de vente déjà formé'], 'La révocation intervient avant l’expiration des deux mois.'],
      f3: ['Un contrat conclu avec un tiers en violation de la promesse', ['Une vente parfaitement valable et opposable', 'Une cession de la promesse à M. Garnier'], 'Le promettant vend à un autre le bien promis.'],
      f4: ['Une levée d’option dans le délai', ['Une levée d’option tardive, hors délai', 'Une simple acceptation d’offre'], 'Le délai courait jusqu’au 1er avril : l’option est levée à temps.'],
    },
    problemes: [
      { id: 'p1', t: 'La révocation de la promesse unilatérale pendant le délai d’option empêche-t-elle la formation du contrat promis ?', factuel: 'M. Roux pouvait-il changer d’avis ?' },
      { id: 'p2', t: 'Le contrat conclu avec un tiers en violation de la promesse peut-il être annulé ?', factuel: 'Mme Faure peut-elle reprendre l’appartement à M. Garnier ?' },
    ],
    faux: [['La promesse aurait-elle dû être enregistrée pour être valable ?', 'Les faits n’évoquent aucune formalité ; et la question est celle des effets de la révocation.']],
    syllo: {
      p1: {
        regle: ['Art. 1124, al. 2', 'La révocation de la promesse pendant le temps laissé au bénéficiaire pour opter n’empêche pas la formation du contrat promis.', 'a1124'],
        leurres: [['Art. 1116, al. 2', 'La rétractation de l’offre en violation de l’interdiction empêche la conclusion du contrat.', 'C’est la règle de l’offre : une promesse unilatérale n’est pas une offre.'],
          ['Ancienne jurisprudence Cruz', 'La rétractation du promettant avant la levée de l’option ne se résout qu’en dommages et intérêts.', 'C’était le droit d’avant 2016 : l’article 1124 l’a abandonné.']],
        conditions: [
          ['Une promesse unilatérale', 'f1', 'oui', 'M. Roux a consenti une promesse unilatérale de vente avec deux mois d’option.'],
          ['Une révocation pendant le délai d’option', 'f2', 'oui', 'Il la révoque le 1er mars, avant le 1er avril.'],
          ['Une levée d’option dans le délai', 'f4', 'oui', 'Mme Faure lève l’option le 15 mars.'],
        ],
        exception: null,
        conclusion: ['La révocation est sans effet : la levée de l’option forme la vente.', 'La révocation met fin à la promesse : Mme Faure n’a droit qu’à des dommages et intérêts.', 'La vente n’est formée que si M. Roux y consent de nouveau.'],
      },
      p2: {
        regle: ['Art. 1124, al. 3', 'Le contrat conclu en violation de la promesse unilatérale avec un tiers qui en connaissait l’existence est nul.', 'a1124'],
        leurres: [['Art. 1123, al. 2', 'Le contrat conclu avec un tiers en violation d’un pacte de préférence ouvre droit à réparation ; le bénéficiaire peut agir en nullité si le tiers connaissait le pacte et son intention de s’en prévaloir.', 'C’est la règle du pacte de préférence, plus exigeante : il s’agit ici d’une promesse.'],
          ['Art. 1199', 'Le contrat ne crée d’obligations qu’entre les parties.', 'L’effet relatif n’empêche pas la loi de sanctionner le tiers de mauvaise foi.']],
        conditions: [
          ['Un contrat conclu avec un tiers en violation de la promesse', 'f3', 'oui', 'M. Roux vend le 10 mars à M. Garnier le bien promis à Mme Faure.'],
          ['Un tiers qui connaissait l’existence de la promesse', null, 'hypo', 'Les faits ne disent pas si M. Garnier connaissait la promesse.'],
        ],
        si: 'Si M. Garnier connaissait la promesse, la vente à son profit est nulle et Mme Faure peut obtenir l’appartement.',
        sinon: 'S’il l’ignorait, la vente est valable : Mme Faure ne peut obtenir que des dommages et intérêts contre M. Roux.',
        exception: null,
        conclusion: ['Tout dépend de la connaissance de M. Garnier : nullité s’il connaissait la promesse, dommages et intérêts sinon.', 'La vente à M. Garnier est nulle dans tous les cas, la promesse étant antérieure.', 'La vente à M. Garnier est valable dans tous les cas, en vertu de l’effet relatif.'],
      },
    },
    conseil: ['La vente avec Mme Faure est formée. Il faut prouver que M. Garnier connaissait la promesse pour faire annuler sa vente et obtenir l’appartement ; à défaut, elle n’obtiendra que des dommages et intérêts de M. Roux.', 'Mme Faure obtient l’appartement sans rien prouver : la levée de l’option suffit à évincer M. Garnier, qu’il ait su ou non.', 'Mme Faure ne peut obtenir que des dommages et intérêts : la révocation, même fautive, a mis fin à la promesse et la vente à M. Garnier tient.'],
  },

  {
    id: 'at-buffet', titre: 'Le buffet du grenier', niveau: 3, zones: { 1: [10, 11, 12], 2: [5] },
    enonce: [
      { f: 'f1', t: 'Mme Petit vend 200 euros à un antiquaire un buffet trouvé dans son grenier' }, '. ',
      { b: true, t: 'L’antiquaire repart avec le meuble dans sa camionnette blanche.' }, ' ',
      { f: 'f2', t: 'L’antiquaire savait, grâce à l’estampille, que le buffet valait environ 20 000 euros, et ne l’a pas dit' }, '. ',
      { f: 'f3', t: 'Mme Petit savait que c’était un buffet ancien d’ébéniste ; elle se trompait seulement sur son prix' }, '. ',
      { f: 'f4', t: 'Elle découvre la vérité six mois plus tard, en voyant le meuble en vitrine' }, '.',
    ],
    question: 'Mme Petit vous consulte : peut-elle faire annuler la vente ou obtenir réparation ?',
    faits: {
      f1: ['Une vente entre une particulière et un professionnel', ['Une donation déguisée en vente', 'Une vente entre deux professionnels du meuble'], 'Un professionnel des meubles anciens achète à une particulière.'],
      f2: ['Le silence de l’acheteur sur la valeur du bien', ['Une manœuvre active de l’acheteur pour la tromper', 'Un mensonge de l’acheteur sur les qualités du meuble'], 'L’antiquaire n’a rien affirmé de faux : il s’est tu sur la valeur.'],
      f3: ['Une erreur portant seulement sur la valeur', ['Une erreur sur une qualité essentielle du meuble', 'Une erreur sur la personne de l’acheteur'], 'Mme Petit connaissait la nature et l’origine du meuble : elle n’en a mal estimé que le prix.'],
      f4: ['La découverte du vice six mois plus tard', ['L’expiration du délai de prescription pour agir', 'La confirmation tacite de la vente par Mme Petit'], 'Le délai de l’action ne court qu’à compter de la découverte.'],
    },
    problemes: [
      { id: 'p1', t: 'L’acheteur est-il tenu d’informer le vendeur de la valeur du bien ?', factuel: 'L’antiquaire aurait-il dû dire le vrai prix ?' },
      { id: 'p2', t: 'Le silence gardé par l’acheteur sur la valeur du bien constitue-t-il une réticence dolosive ?', factuel: 'L’antiquaire a-t-il triché ?' },
      { id: 'p3', t: 'L’erreur du vendeur sur la seule valeur du bien est-elle une cause de nullité ?', factuel: 'Mme Petit s’est-elle fait avoir ?' },
    ],
    faux: [['L’action de Mme Petit est-elle prescrite ?', 'Elle découvre la vérité six mois plus tard : le délai de cinq ans court à peine. La question ne pose pas de difficulté.']],
    syllo: {
      p1: {
        regle: ['Art. 1112-1, al. 1 et 2', 'Celle des parties qui connaît une information dont l’importance est déterminante pour le consentement de l’autre doit l’en informer. Néanmoins, ce devoir d’information ne porte pas sur l’estimation de la valeur de la prestation.', 'a1112-1'],
        leurres: [['Art. 1104', 'Les contrats doivent être négociés, formés et exécutés de bonne foi.', 'La bonne foi ne permet pas d’écarter la règle précise de l’article 1112-1, alinéa 2.'],
          ['Art. 1112-1, al. 3', 'Ont une importance déterminante les informations qui ont un lien direct et nécessaire avec le contenu du contrat.', 'Utile, mais la question est tranchée par l’exclusion de la valeur à l’alinéa 2.']],
        conditions: [
          ['Une information connue de l’acheteur', 'f2', 'oui', 'L’antiquaire connaissait la valeur du buffet.'],
          ['Une information sur autre chose que la valeur de la prestation', 'f2', 'non', 'L’information tue porte précisément sur la valeur : elle est hors du devoir d’information.'],
        ],
        exception: null,
        conclusion: ['L’acheteur n’était pas tenu de révéler la valeur : le devoir d’information n’a pas été méconnu.', 'L’acheteur, professionnel, a manqué à son devoir d’information sur la valeur.', 'Le devoir d’information ne pèse que sur le vendeur, jamais sur l’acheteur.'],
      },
      p2: {
        regle: ['Art. 1137, al. 2 et 3', 'Constitue un dol la dissimulation intentionnelle par l’un des contractants d’une information dont il sait le caractère déterminant pour l’autre partie. Néanmoins, ne constitue pas un dol le fait pour une partie de ne pas révéler à son cocontractant son estimation de la valeur de la prestation.', 'a1137'],
        leurres: [['Art. 1137, al. 1', 'Le dol est le fait d’obtenir le consentement de l’autre par des manœuvres ou des mensonges.', 'Il n’y a ni manœuvre ni mensonge : seulement un silence.'],
          ['Art. 1138', 'Le dol est également constitué s’il émane du représentant ou d’un tiers complice.', 'Aucun tiers n’intervient.']],
        conditions: [
          ['Une dissimulation intentionnelle', 'f2', 'oui', 'L’antiquaire s’est tu sciemment.'],
          ['Sur autre chose que l’estimation de la valeur', 'f2', 'non', 'Il n’a tu que son estimation de la valeur.'],
        ],
        exception: ['L’estimation de la valeur n’est jamais un dol', true, 'C’est exactement le cas : l’alinéa 3 écarte le dol.'],
        conclusion: ['Pas de réticence dolosive : taire son estimation de la valeur n’est pas un dol.', 'Il y a réticence dolosive : le silence de l’antiquaire rend la vente nulle.', 'Il y a dol, mais il n’ouvre droit qu’à des dommages et intérêts.'],
      },
      p3: {
        regle: ['Art. 1136', 'L’erreur sur la valeur par laquelle, sans se tromper sur les qualités essentielles de la prestation, un contractant fait seulement de celle-ci une appréciation économique inexacte, n’est pas une cause de nullité.', 'a1136'],
        leurres: [['Art. 1132', 'L’erreur de droit ou de fait, à moins qu’elle ne soit inexcusable, est une cause de nullité lorsqu’elle porte sur les qualités essentielles de la prestation.', 'Mme Petit ne se trompait sur aucune qualité essentielle.'],
          ['Art. 1133, al. 2', 'L’erreur est une cause de nullité qu’elle porte sur la prestation de l’une ou de l’autre partie.', 'Vrai (c’est l’affaire Poussin), mais encore faut-il une erreur sur une qualité essentielle.']],
        conditions: [
          ['Une erreur sans méprise sur les qualités essentielles', 'f3', 'oui', 'Mme Petit savait qu’il s’agissait d’un buffet ancien d’ébéniste.'],
          ['Une simple appréciation économique inexacte', 'f3', 'oui', 'Elle s’est seulement trompée sur le prix.'],
        ],
        exception: null,
        conclusion: ['L’erreur sur la valeur n’est pas une cause de nullité.', 'L’erreur sur la valeur permet d’annuler la vente.', 'L’erreur sur la valeur permet au juge de réviser le prix.'],
      },
    },
    conseil: ['Mme Petit ne peut ni faire annuler la vente, ni obtenir réparation : le droit laisse à chacun le risque de mal estimer la valeur de ce qu’il vend.', 'Mme Petit peut faire annuler la vente pour réticence dolosive et récupérer le buffet contre restitution du prix.', 'Mme Petit peut obtenir de l’antiquaire, professionnel tenu d’informer, la différence entre le prix et la valeur.'],
  },

  {
    id: 'at-tableau', titre: 'Le tableau du château', niveau: 2, zones: { 1: [11], 2: [5] },
    enonce: [
      { f: 'f1', t: 'M. et Mme Arnaud vendent aux enchères un tableau présenté au catalogue comme « attribué à l’école de Fragonard », adjugé 3 000 euros' }, '. ',
      { b: true, t: 'La vente a lieu un samedi, dans une salle comble.' }, ' ',
      { f: 'f2', t: 'Le musée qui l’achète l’expose ensuite comme une œuvre de Fragonard lui-même' }, '. ',
      { f: 'f3', t: 'Les vendeurs ignoraient que l’œuvre pouvait être de la main du maître ; une expertise le confirme' }, '. ',
      { f: 'f4', t: 'Ils ont découvert l’attribution un an après la vente' }, '.',
    ],
    question: 'Les époux Arnaud vous consultent : peuvent-ils récupérer le tableau ?',
    faits: {
      f1: ['Une vente dans la conviction que l’œuvre n’est pas du maître', ['Une vente avec un aléa accepté sur l’auteur', 'Une vente d’une œuvre authentique connue comme telle'], 'Le catalogue, « école de », révèle la conviction des vendeurs : ce n’était pas, pour eux, une œuvre du maître.'],
      f2: ['L’authenticité de l’œuvre', ['Une simple plus-value réalisée par l’acheteur', 'Une erreur de l’acheteur'], 'L’œuvre est de Fragonard lui-même : la réalité diffère de ce que les vendeurs croyaient.'],
      f3: ['Une erreur du vendeur sur sa propre prestation', ['Une erreur de l’acheteur', 'Un dol commis par l’acheteur'], 'Les vendeurs se sont trompés sur ce qu’ils vendaient.'],
      f4: ['Une découverte de l’erreur qui fait courir le délai', ['Une confirmation tacite de la vente par les époux', 'Un délai d’action déjà expiré'], 'Le délai de cinq ans ne court que du jour de la découverte de l’erreur.'],
    },
    problemes: [
      { id: 'p1', t: 'L’erreur du vendeur sur l’authenticité de l’œuvre qu’il vend est-elle une cause de nullité ?', factuel: 'Les vendeurs se sont-ils trompés ?' },
      { id: 'p2', t: 'L’action en nullité pour erreur est-elle encore recevable un an après la vente ?', factuel: 'Est-il trop tard pour agir ?' },
    ],
    faux: [['Le musée a-t-il commis un dol en se taisant ?', 'Rien n’indique que le musée savait : et le silence sur la valeur n’est pas un dol (art. 1137, al. 3).']],
    syllo: {
      p1: {
        regle: ['Art. 1132 et 1133', 'L’erreur, à moins qu’elle ne soit inexcusable, est une cause de nullité lorsqu’elle porte sur les qualités essentielles de la prestation due, qu’elle porte sur la prestation de l’une ou de l’autre partie.', 'a1133'],
        leurres: [['Art. 1136', 'L’erreur sur la valeur n’est pas une cause de nullité.', 'L’erreur ne porte pas sur le prix, mais sur l’auteur de l’œuvre : une qualité essentielle.'],
          ['Art. 1137', 'Le dol est une cause de nullité.', 'Aucune manœuvre, aucun silence fautif de l’acheteur n’est établi.']],
        conditions: [
          ['Une erreur sur une qualité essentielle', 'f2', 'oui', 'L’auteur d’un tableau est une qualité essentielle, en considération de laquelle on contracte.'],
          ['Une erreur déterminante', 'f1', 'oui', 'Sachant l’œuvre du maître, les vendeurs ne l’auraient pas vendue à ce prix.'],
          ['Une erreur excusable', 'f3', 'oui', 'Des particuliers qui se fient au catalogue ne commettent pas d’erreur grossière.'],
        ],
        exception: ['L’acceptation d’un aléa exclut l’erreur', false, 'Les vendeurs n’avaient accepté aucun aléa : ils étaient convaincus que l’œuvre n’était pas du maître.'],
        conclusion: ['L’erreur sur l’authenticité est une cause de nullité, même commise par le vendeur sur sa propre prestation.', 'Le vendeur ne peut jamais invoquer une erreur sur la chose qu’il vend lui-même.', 'L’erreur est indifférente : elle ne porte que sur la valeur du tableau.'],
      },
      p2: {
        regle: ['Art. 1144 et 2224', 'Le délai de l’action en nullité ne court, en cas d’erreur ou de dol, que du jour où ils ont été découverts. Il est de cinq ans.', 'a1144'],
        leurres: [['Art. 1304 ancien', 'L’action en nullité se prescrit par cinq ans à compter du contrat.', 'Le point de départ est la découverte de l’erreur, pas la conclusion du contrat.'],
          ['Art. 1182', 'La confirmation emporte renonciation aux moyens qui pouvaient être opposés.', 'Les vendeurs n’ont rien confirmé.']],
        conditions: [
          ['Un délai de cinq ans', null, 'oui', 'L’action en nullité relative se prescrit par cinq ans.'],
          ['Un délai qui court de la découverte de l’erreur', 'f4', 'oui', 'L’erreur a été découverte un an après la vente.'],
        ],
        exception: null,
        conclusion: ['L’action est recevable : le délai court depuis la découverte.', 'L’action est prescrite : cinq ans ont passé depuis la vente.', 'L’action en nullité ne se prescrit jamais.'],
      },
    },
    conseil: ['Les époux Arnaud peuvent faire annuler la vente pour erreur et récupérer le tableau contre le prix.', 'Ils ne peuvent obtenir qu’un complément de prix, calculé sur la valeur réelle de l’œuvre au jour de la vente.', 'Ils n’ont aucun recours : le vendeur supporte seul le risque d’une erreur sur la chose qu’il vend lui-même.'],
  },

  {
    id: 'at-dependance', titre: 'Le sous-traitant captif', niveau: 2, zones: { 1: [13], 2: [6] },
    enonce: [
      { f: 'f1', t: 'La société Bertin réalise 90 % de son chiffre d’affaires avec un constructeur automobile, son unique gros client' }, '. ',
      { f: 'f2', t: 'Il y a trois ans, le constructeur lui a imposé une baisse de prix de 40 %, en la menaçant de rompre toute relation' }, '. ',
      { b: true, t: 'Bertin est installée près de Lyon depuis 1962.' }, ' ',
      { f: 'f3', t: 'Ce prix ne couvre même pas les coûts de fabrication ; le constructeur, lui, a augmenté ses marges' }, '. ',
      { f: 'f4', t: 'Bertin dépend toujours de ce client aujourd’hui' }, '.',
    ],
    question: 'Bertin vous consulte : peut-elle remettre en cause le contrat qu’elle a signé ?',
    faits: {
      f1: ['Un état de dépendance économique', ['Une simple relation commerciale suivie', 'Un contrat d’exclusivité librement négocié'], 'Sans ce client, Bertin ne survit pas : elle est dépendante à son égard.'],
      f2: ['Un engagement obtenu sous la contrainte', ['Une négociation commerciale dure mais normale', 'Une offre que Bertin pouvait librement refuser'], 'La menace de rompre toute relation a dicté le consentement.'],
      f3: ['Un avantage manifestement excessif', ['Une simple bonne affaire pour l’acheteur', 'Une lésion, indifférente en principe'], 'Un prix sous les coûts, quand le cocontractant augmente ses marges : l’avantage est manifestement excessif.'],
      f4: ['Une contrainte qui n’a pas cessé', ['Une violence terminée depuis trois ans', 'Une confirmation du contrat'], 'Le délai pour agir ne court qu’à compter du jour où la violence a cessé.'],
    },
    problemes: [
      { id: 'p1', t: 'L’abus de l’état de dépendance économique d’un contractant constitue-t-il une violence viciant son consentement ?', factuel: 'Le constructeur a-t-il été trop dur ?' },
      { id: 'p2', t: 'L’action en nullité pour violence est-elle prescrite trois ans après la conclusion du contrat ?', factuel: 'Est-il trop tard pour agir ?' },
    ],
    faux: [['Le prix est-il déterminé ?', 'Le prix est fixé ; la question est celle de la façon dont il a été obtenu.']],
    syllo: {
      p1: {
        regle: ['Art. 1143', 'Il y a également violence lorsqu’une partie, abusant de l’état de dépendance dans lequel se trouve son cocontractant à son égard, obtient de lui un engagement qu’il n’aurait pas souscrit en l’absence d’une telle contrainte et en tire un avantage manifestement excessif.', 'a1143'],
        leurres: [['Art. 1140', 'Il y a violence lorsqu’une partie s’engage sous la pression d’une contrainte qui lui inspire la crainte d’exposer sa personne ou sa fortune à un mal considérable.', 'Juste en général, mais l’article 1143 vise précisément l’abus de dépendance.'],
          ['Art. 1168', 'Le défaut d’équivalence des prestations n’est pas une cause de nullité.', 'La nullité ne vient pas du déséquilibre seul, mais de l’abus de dépendance.']],
        conditions: [
          ['Un état de dépendance à l’égard du cocontractant', 'f1', 'oui', 'Bertin réalise 90 % de son chiffre d’affaires avec ce client.'],
          ['Un abus : un engagement qui n’aurait pas été souscrit sans cette contrainte', 'f2', 'oui', 'La baisse a été imposée sous la menace d’une rupture.'],
          ['Un avantage manifestement excessif', 'f3', 'oui', 'Le prix ne couvre pas les coûts tandis que le constructeur augmente ses marges.'],
        ],
        exception: null,
        conclusion: ['Il y a violence par abus de dépendance : le contrat est nul.', 'Il n’y a pas de violence sans menace physique ou morale contre la personne.', 'Le seul déséquilibre du prix suffit à annuler le contrat.'],
      },
      p2: {
        regle: ['Art. 1144 et 2224', 'Le délai de l’action en nullité ne court, en cas de violence, que du jour où elle a cessé. Il est de cinq ans.', 'a1143'],
        leurres: [['Art. 2224 seul', 'L’action se prescrit par cinq ans à compter du jour où le titulaire a connu les faits.', 'Pour la violence, la loi retarde le point de départ au jour où elle cesse.'],
          ['Art. 1182', 'L’exécution volontaire du contrat vaut confirmation.', 'On ne confirme pas un contrat tant que dure la violence.']],
        conditions: [
          ['Un délai de cinq ans', null, 'oui', 'L’action en nullité relative se prescrit par cinq ans.'],
          ['Un délai qui court du jour où la violence a cessé', 'f4', 'oui', 'La dépendance dure encore : le délai n’a pas commencé.'],
        ],
        exception: null,
        conclusion: ['L’action n’est pas prescrite : le délai n’a pas encore commencé à courir.', 'L’action est prescrite depuis deux ans, le délai courant de la signature.', 'L’action n’est recevable que dans l’année qui suit le contrat.'],
      },
    },
    conseil: ['Bertin peut agir en nullité pour abus de dépendance, et demander des dommages et intérêts.', 'Bertin doit exécuter le contrat : elle l’a signé librement, et la dépendance n’est pas un vice du consentement.', 'Bertin peut seulement demander au juge de réviser le prix, devenu manifestement excessif.'],
  },

  {
    id: 'at-silence', titre: 'Le vin de chaque automne', niveau: 1, zones: { 1: [8], 2: [3] },
    enonce: [
      { f: 'f1', t: 'Depuis dix ans, un viticulteur envoie chaque septembre son tarif à un caviste, qui ne répond jamais, puis reçoit et paie les caisses en octobre' }, '. ',
      { b: true, t: 'Le caviste est connu dans tout le quartier.' }, ' ',
      { f: 'f2', t: 'Cette année, le caviste ne répond pas au tarif ; en octobre, il refuse les caisses, disant n’avoir rien commandé' }, '.',
    ],
    question: 'Le viticulteur vous consulte : le caviste est-il tenu de prendre et de payer les caisses ?',
    faits: {
      f1: ['Des relations d’affaires suivies, où le silence vaut accord', ['Un simple usage de politesse entre commerçants', 'Un contrat-cadre écrit qui prévoit les commandes'], 'Dix ans de commandes tacites créent des relations d’affaires où le silence a un sens.'],
      f2: ['Le silence du destinataire de l’offre', ['Un refus exprès de l’offre par le caviste', 'Une contre-proposition sur la quantité'], 'Le caviste n’a rien dit : la question est la valeur de ce silence.'],
    },
    problemes: [
      { id: 'p1', t: 'Le silence gardé par le destinataire d’une offre vaut-il acceptation lorsque les parties sont en relations d’affaires ?', factuel: 'Le caviste a-t-il le droit de refuser les caisses ?' },
    ],
    faux: [['Le prix du vin est-il excessif ?', 'Rien dans les faits ne le suggère.']],
    syllo: {
      p1: {
        regle: ['Art. 1120', 'Le silence ne vaut pas acceptation, à moins qu’il n’en résulte autrement de la loi, des usages, des relations d’affaires ou de circonstances particulières.', 'a1120'],
        leurres: [['Adage', 'Qui ne dit mot consent.', 'Le principe est inverse : le silence ne vaut pas acceptation.'],
          ['Art. 1118', 'L’acceptation est la manifestation de volonté de son auteur d’être lié dans les termes de l’offre.', 'Il faut savoir si le silence peut valoir cette manifestation : c’est l’article 1120 qui répond.']],
        conditions: [
          ['Une offre adressée au destinataire', 'f2', 'oui', 'Le tarif de septembre est une offre de vente.'],
          ['Des relations d’affaires qui donnent un sens au silence', 'f1', 'oui', 'Depuis dix ans, le silence du caviste a toujours valu commande.'],
        ],
        exception: null,
        conclusion: ['Le silence vaut ici acceptation : la vente est formée.', 'Le silence ne vaut jamais acceptation : il n’y a pas de vente.', 'Il faut un écrit pour former la vente.'],
      },
    },
    conseil: ['Le viticulteur peut exiger livraison et paiement : le silence a formé la vente.', 'Le viticulteur doit reprendre ses caisses : le silence ne vaut jamais acceptation.', 'Le viticulteur peut seulement réclamer au caviste les frais de transport engagés.'],
  },

  {
    id: 'at-inondation', titre: 'L’inondation', niveau: 1, zones: { 1: [1] },
    enonce: [
      { f: 'f1', t: 'Pendant les vacances de son voisin, Léa voit de l’eau couler sous la porte de celui-ci' }, '. ',
      { f: 'f2', t: 'Elle fait intervenir un plombier, qui coupe l’eau et répare la fuite pour 400 euros, qu’elle paie' }, '. ',
      { b: true, t: 'Le plombier arrive en moins d’une heure.' }, ' ',
      { f: 'f3', t: 'Au retour, le voisin refuse de rembourser : il n’a jamais rien demandé' }, '.',
    ],
    question: 'Léa vous consulte : le voisin doit-il lui rembourser les 400 euros ?',
    faits: {
      f1: ['L’affaire d’autrui, sans obligation de s’en occuper', ['Un contrat tacite de voisinage', 'Un mandat donné par le voisin avant son départ'], 'Rien n’obligeait Léa à intervenir chez son voisin.'],
      f2: ['Une gestion utile', ['Une dépense somptuaire', 'Un enrichissement de Léa'], 'Couper l’eau et réparer la fuite a évité un dommage plus grave.'],
      f3: ['Une gestion à l’insu du maître de l’affaire', ['Une gestion malgré l’opposition du voisin', 'Un refus de ratification, sans portée ici'], 'Le voisin était absent : il ne s’y est pas opposé.'],
    },
    problemes: [
      { id: 'p1', t: 'Celui qui gère utilement l’affaire d’autrui sans y être tenu peut-il obtenir le remboursement de ses dépenses ?', factuel: 'Le voisin doit-il payer Léa ?' },
    ],
    faux: [['Le plombier a-t-il correctement exécuté sa prestation ?', 'La qualité du travail ne dit pas pourquoi le voisin devrait payer.']],
    syllo: {
      p1: {
        regle: ['Art. 1301 et 1301-2', 'Celui qui, sans y être tenu, gère sciemment et utilement l’affaire d’autrui, à l’insu ou sans opposition du maître de cette affaire, est soumis aux obligations d’un mandataire ; le maître lui rembourse les dépenses faites dans son intérêt.', 'a1301'],
        leurres: [['Art. 1302', 'Ce qui a été reçu sans être dû est sujet à restitution.', 'Léa n’a rien payé au voisin : ce n’est pas un paiement de l’indu.'],
          ['Art. 1240', 'Tout fait quelconque de l’homme qui cause à autrui un dommage oblige celui par la faute duquel il est arrivé à le réparer.', 'Le voisin n’a commis aucune faute.']],
        conditions: [
          ['Gérer l’affaire d’autrui sans y être tenu, et sciemment', 'f1', 'oui', 'Léa intervient volontairement chez son voisin, sans aucune obligation.'],
          ['Une gestion utile', 'f2', 'oui', 'L’intervention a mis fin à l’inondation.'],
          ['À l’insu ou sans opposition du maître', 'f3', 'oui', 'Le voisin, absent, ne s’y est pas opposé.'],
        ],
        exception: null,
        conclusion: ['Le voisin doit rembourser les 400 euros, dépense utile faite dans son intérêt.', 'Le voisin ne doit rien, faute de contrat entre lui et Léa.', 'Le voisin doit rembourser le double, pour récompenser l’initiative de Léa.'],
      },
    },
    conseil: ['Léa obtiendra du voisin les 400 euros, au titre de la gestion d’affaires.', 'Léa doit se retourner contre le plombier, seul cocontractant.', 'Léa n’a aucun recours : elle a agi sans mandat.'],
  },

  {
    id: 'at-trottinette', titre: 'La trottinette', niveau: 1, zones: { 1: [1], 2: [9] },
    enonce: [
      { f: 'f1', t: 'Hugo descend un trottoir à trottinette, en regardant son téléphone' }, '. ',
      { f: 'f2', t: 'Il heurte Mme Blanc, qui chute et se fracture le poignet' }, '. ',
      { b: true, t: 'Il faisait beau ce jour-là.' }, ' ',
      { f: 'f3', t: 'Mme Blanc a dû payer des soins et n’a pas pu travailler pendant six semaines' }, '. ',
      'Hugo dit qu’il ne doit rien : il ne connaît pas Mme Blanc et ne s’est jamais engagé envers elle.',
    ],
    question: 'Mme Blanc vous consulte : Hugo doit-il réparer son dommage ?',
    faits: {
      f1: ['Une faute d’imprudence', ['Un cas de force majeure', 'Un fait de la victime'], 'Rouler sur un trottoir en regardant son téléphone est un comportement imprudent.'],
      f2: ['Un lien de causalité', ['Une simple coïncidence', 'Une faute de la victime'], 'Le choc est la cause directe de la chute et de la fracture.'],
      f3: ['Un dommage corporel et économique', ['Un préjudice hypothétique et futur', 'Un préjudice purement moral'], 'Soins et perte de revenus sont des préjudices certains.'],
    },
    problemes: [
      { id: 'p1', t: 'L’auteur d’une faute d’imprudence doit-il réparer le dommage qu’elle a causé, en l’absence de tout contrat avec la victime ?', factuel: 'Hugo doit-il payer Mme Blanc ?' },
    ],
    faux: [['Hugo et Mme Blanc étaient-ils liés par un contrat ?', 'L’absence de contrat n’empêche rien : l’obligation naît ici d’un fait juridique.']],
    syllo: {
      p1: {
        regle: ['Art. 1240', 'Tout fait quelconque de l’homme, qui cause à autrui un dommage, oblige celui par la faute duquel il est arrivé à le réparer.', 'a1240'],
        leurres: [['Art. 1231-1', 'Le débiteur est condamné à des dommages et intérêts en raison de l’inexécution de l’obligation.', 'Cela suppose un contrat : il n’y en a pas.'],
          ['Art. 1103', 'Les contrats légalement formés tiennent lieu de loi à ceux qui les ont faits.', 'Aucun contrat entre Hugo et Mme Blanc.']],
        conditions: [
          ['Une faute', 'f1', 'oui', 'Hugo roule sur le trottoir en regardant son téléphone : c’est une imprudence.'],
          ['Un dommage', 'f3', 'oui', 'Mme Blanc a payé des soins et perdu six semaines de revenus.'],
          ['Un lien de causalité', 'f2', 'oui', 'Le choc a directement provoqué la fracture.'],
        ],
        exception: null,
        conclusion: ['Hugo doit réparer l’entier dommage de Mme Blanc.', 'Hugo ne doit rien, faute de contrat.', 'Hugo ne doit réparer que si Mme Blanc prouve une intention de nuire.'],
      },
    },
    conseil: ['Mme Blanc peut obtenir d’Hugo, sur le fondement de l’article 1240, ses soins et sa perte de revenus.', 'Mme Blanc doit agir contre le fabricant de la trottinette, responsable du produit.', 'Mme Blanc doit d’abord prouver un contrat avec Hugo pour obtenir réparation.'],
  },

  {
    id: 'at-influence', titre: 'Le contrat d’influence', niveau: 1, zones: { 1: [3, 14], 2: [7] },
    enonce: [
      { f: 'f1', t: 'Une entreprise promet 50 000 euros à un consultant s’il obtient, grâce à ses relations avec un élu, l’attribution d’un marché public' }, '. ',
      { b: true, t: 'Le contrat est rédigé sur papier à en-tête.' }, ' ',
      { f: 'f2', t: 'Le marché attribué, le consultant réclame son paiement ; l’entreprise refuse' }, '.',
    ],
    question: 'Le consultant vous consulte : peut-il obtenir les 50 000 euros ?',
    faits: {
      f1: ['Un contrat dont l’objet et le but sont contraires à l’ordre public', ['Un contrat de prestation de services ordinaire', 'Une donation déguisée au consultant'], 'Payer pour obtenir l’intervention d’un élu dans l’attribution d’un marché, c’est rémunérer un trafic d’influence.'],
      f2: ['Une demande d’exécution d’un contrat illicite', ['Une demande de réparation d’un préjudice', 'Une demande de restitution de l’indu'], 'Le consultant demande l’exécution du contrat.'],
    },
    problemes: [
      { id: 'p1', t: 'Un contrat dont l’objet est de rémunérer un trafic d’influence peut-il produire effet ?', factuel: 'L’entreprise doit-elle payer ?' },
    ],
    faux: [['Le consultant a-t-il bien rempli sa mission ?', 'Peu importe qu’il ait réussi : le contrat est nul.']],
    syllo: {
      p1: {
        regle: ['Art. 1162', 'Le contrat ne peut déroger à l’ordre public ni par ses stipulations, ni par son but, que ce dernier ait été connu ou non par toutes les parties.', 'a1162'],
        leurres: [['Art. 1103', 'Les contrats légalement formés tiennent lieu de loi à ceux qui les ont faits.', 'Un contrat contraire à l’ordre public n’est pas légalement formé.'],
          ['Art. 1102', 'Chacun est libre de déterminer le contenu de son contrat.', 'Cette liberté s’arrête à l’ordre public, comme le rappelle l’article 1102 lui-même.']],
        conditions: [
          ['Un contrat qui déroge à l’ordre public par ses stipulations ou son but', 'f1', 'oui', 'Le contrat rémunère l’intervention d’un élu dans un marché public.'],
        ],
        exception: null,
        conclusion: ['Le contrat est nul : il ne peut produire aucun effet.', 'Le contrat est valable : le consultant a rempli sa mission.', 'Le contrat est valable, mais le prix doit être réduit.'],
      },
    },
    conseil: ['Le consultant n’obtiendra rien : le contrat est frappé de nullité absolue.', 'Le consultant peut obtenir son paiement en justice, puisque le marché a bien été attribué.', 'Le consultant peut obtenir la moitié de la somme, le juge réduisant le prix excessif.'],
  },
];
