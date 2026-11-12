// L'ATELIER DU CAS PRATIQUE, droit administratif. Même format que content/ateliers.mjs.
// Les conditions viennent ici de la jurisprudence : la règle est citée avec l'arrêt qui la pose.
// Cas d'entraînement ; zones : équipe 1 (cours de l'équipe 1), équipe 2 (cours du Pr Plessix).

export const ateliers = [
  {
    id: 'ad-convention', titre: 'Le logement refusé', niveau: 2, zones: { 1: [3, 5], 2: [4, 5] },
    enonce: [
      { f: 'f1', t: 'La France a ratifié et publié une convention internationale qui impose de traiter les étrangers en situation régulière comme les nationaux en matière de logement' }, '. ',
      { f: 'f2', t: 'Une loi postérieure, de 2025, exclut du droit au logement opposable les étrangers en séjour régulier depuis moins de deux ans' }, '. ',
      { f: 'f3', t: 'Un décret applique cette loi' }, '. ',
      { b: true, t: 'Le décret a été publié un vendredi.' }, ' ',
      { f: 'f4', t: 'Une association attaque le décret pour excès de pouvoir, en invoquant la convention' }, '.',
    ],
    question: 'L’association vous consulte : peut-elle obtenir l’annulation du décret ?',
    faits: {
      f1: ['Un traité régulièrement ratifié et publié', ['Une déclaration d’intention sans force obligatoire', 'Une coutume internationale non écrite'], 'La convention a été ratifiée et publiée : elle entre dans l’ordre juridique interne (art. 55 de la Constitution).'],
      f2: ['Une loi postérieure contraire au traité', ['Une loi antérieure au traité, qu’il a abrogée', 'Une loi conforme au traité qu’elle applique'], 'La loi de 2025 est postérieure à la convention et la contredit.'],
      f3: ['Un acte réglementaire d’application de la loi', ['Un acte individuel visant une seule personne', 'Un acte de gouvernement insusceptible de recours'], 'Le décret applique la loi : sa légalité dépend de celle de sa base légale.'],
      f4: ['Un recours pour excès de pouvoir contre un acte administratif', ['Un recours de plein contentieux en indemnité', 'Une action devant le juge judiciaire'], 'L’association demande au juge administratif d’annuler le décret.'],
    },
    problemes: [
      { id: 'p1', t: 'La stipulation de la convention a-t-elle un effet direct, qui permet à un particulier de l’invoquer ?', factuel: 'L’association a-t-elle le droit de parler de cette convention ?' },
      { id: 'p2', t: 'Le juge administratif peut-il écarter une loi postérieure contraire à un traité ?', factuel: 'Le juge peut-il désobéir à la loi ?' },
    ],
    faux: [['La loi de 2025 est-elle contraire à la Constitution ?', 'L’association invoque la convention, pas la Constitution ; et le juge administratif ne contrôle pas la constitutionnalité de la loi.']],
    syllo: {
      p1: {
        regle: ['CE, Ass., 11 avr. 2012, GISTI et FAPIL', 'Une stipulation d’un traité est d’effet direct lorsqu’elle n’a pas pour objet exclusif de régir les relations entre États et ne requiert l’intervention d’aucun acte complémentaire pour produire des effets à l’égard des particuliers.', 'gisti-fapil'],
        leurres: [['Art. 55 de la Constitution', 'Les traités régulièrement ratifiés ont une autorité supérieure à celle des lois.', 'L’article 55 dit la place du traité, pas s’il peut être invoqué par un particulier.'],
          ['CE, Ass., 20 oct. 1989, Nicolo', 'Le juge écarte la loi, même postérieure, contraire à un traité.', 'C’est la question suivante : encore faut-il que la stipulation soit invocable.']],
        conditions: [
          ['Une stipulation qui ne régit pas seulement les relations entre États', 'f1', 'oui', 'La convention crée des droits au profit des étrangers, et pas seulement des obligations entre États.'],
          ['Une stipulation qui n’appelle aucun acte complémentaire', 'f1', 'oui', 'L’égalité de traitement en matière de logement se suffit à elle-même.'],
        ],
        exception: null,
        conclusion: ['La stipulation est d’effet direct : l’association peut l’invoquer.', 'Un traité ne crée d’obligations qu’entre États : un particulier ne peut jamais l’invoquer.', 'La stipulation n’est invocable que si une loi en reprend le contenu en droit interne.'],
      },
      p2: {
        regle: ['Art. 55 C. et CE, Ass., 20 oct. 1989, Nicolo', 'Les traités régulièrement ratifiés ou approuvés ont, dès leur publication, une autorité supérieure à celle des lois : le juge administratif écarte la loi, même postérieure, qui leur est contraire.', 'nicolo'],
        leurres: [['CE, Sect., 1er mars 1968, Semoules', 'Le juge administratif ne peut écarter une loi postérieure contraire à un traité.', 'C’était le droit avant 1989 : Nicolo l’a abandonné.'],
          ['CE, Sect., 6 nov. 1936, Arrighi', 'Le juge administratif ne contrôle pas la loi au regard de la Constitution.', 'La loi-écran concerne la Constitution, pas les traités.']],
        conditions: [
          ['Un traité régulièrement ratifié et publié', 'f1', 'oui', 'La convention a été ratifiée et publiée.'],
          ['Une loi contraire au traité, même postérieure', 'f2', 'oui', 'La loi de 2025 contredit l’égalité de traitement.'],
          ['Un acte administratif qui applique cette loi', 'f3', 'oui', 'Le décret applique la loi écartée : il perd sa base légale.'],
        ],
        exception: null,
        conclusion: ['Le juge écarte la loi : le décret, privé de base légale, est annulé.', 'La loi, plus récente que le traité, l’emporte : le juge l’applique et rejette le recours.', 'Le juge renvoie la question au Conseil constitutionnel, seul juge de la loi.'],
      },
    },
    conseil: ['Oui : la convention est d’effet direct, le juge écarte la loi contraire et annule le décret.', 'L’association doit d’abord obtenir du Parlement l’abrogation de la loi, sans quoi le décret reste valable.', 'L’association doit saisir la Cour européenne des droits de l’homme, seule compétente pour juger la loi.'],
  },

  {
    id: 'ad-directive', titre: 'La directive oubliée', niveau: 1, zones: { 1: [4], 2: [4] },
    enonce: [
      { f: 'f1', t: 'Une directive européenne, à transposer avant le 1er janvier 2024, accorde aux agents publics cinq jours de congé par an pour s’occuper d’un proche malade' }, '. ',
      { f: 'f2', t: 'La France ne l’a toujours pas transposée' }, '. ',
      { b: true, t: 'Mme Duval travaille au ministère depuis douze ans.' }, ' ',
      { f: 'f3', t: 'Le ministre refuse à Mme Duval ces cinq jours, par une décision individuelle' }, '.',
    ],
    question: 'Mme Duval vous consulte : peut-elle faire annuler le refus en invoquant la directive ?',
    faits: {
      f1: ['Des dispositions précises et inconditionnelles', ['Des objectifs généraux laissés au choix des États', 'Une recommandation dépourvue de force obligatoire'], 'Cinq jours par an, pour un motif défini : la règle est précise et ne dépend d’aucune condition.'],
      f2: ['Un délai de transposition expiré sans transposition', ['Un délai de transposition encore ouvert à ce jour', 'Une transposition faite mais incomplète'], 'Le délai est passé depuis le 1er janvier 2024 : l’État est en faute.'],
      f3: ['Un acte administratif non réglementaire', ['Un acte réglementaire de portée générale', 'Un acte de droit privé de l’employeur'], 'Le refus vise Mme Duval seule : c’est un acte individuel.'],
    },
    problemes: [
      { id: 'p1', t: 'Un justiciable peut-il invoquer une directive non transposée à l’appui d’un recours contre un acte administratif individuel ?', factuel: 'Mme Duval peut-elle obtenir ses jours de congé ?' },
    ],
    faux: [['La directive l’emporte-t-elle sur la Constitution ?', 'Aucune disposition constitutionnelle n’est en cause.']],
    syllo: {
      p1: {
        regle: ['CE, Ass., 30 oct. 2009, Perreux', 'Tout justiciable peut se prévaloir, à l’appui d’un recours dirigé contre un acte administratif non réglementaire, des dispositions précises et inconditionnelles d’une directive, lorsque l’État n’a pas pris, dans les délais impartis, les mesures de transposition nécessaires.', 'perreux'],
        leurres: [['CE, Ass., 22 déc. 1978, Cohn-Bendit', 'Les directives ne peuvent être invoquées à l’appui d’un recours dirigé contre un acte individuel.', 'Cette solution a été abandonnée par Perreux en 2009.'],
          ['Art. 288 TFUE', 'Le règlement est directement applicable dans tout État membre.', 'C’est le règlement qui est directement applicable ; il s’agit ici d’une directive.']],
        conditions: [
          ['Un acte administratif non réglementaire', 'f3', 'oui', 'Le refus du ministre est une décision individuelle.'],
          ['Un délai de transposition expiré sans mesure de transposition', 'f2', 'oui', 'Le délai a expiré le 1er janvier 2024 et rien n’a été transposé.'],
          ['Des dispositions précises et inconditionnelles', 'f1', 'oui', 'Le congé est défini avec précision et sans condition.'],
        ],
        exception: null,
        conclusion: ['Mme Duval peut invoquer la directive : le refus est annulé.', 'Une directive ne peut jamais être invoquée à l’appui d’un recours contre un acte individuel.', 'Mme Duval ne pourra invoquer la directive qu’une fois celle-ci transposée en droit interne.'],
      },
    },
    conseil: ['Mme Duval peut attaquer le refus et invoquer directement la directive.', 'Mme Duval doit attendre que la France transpose la directive, puis renouveler sa demande.', 'Mme Duval doit saisir directement la Cour de justice de l’Union européenne.'],
  },

  {
    id: 'ad-loi-ecran', titre: 'Le décret fidèle à la loi', niveau: 2, zones: { 1: [2], 2: [5] },
    enonce: [
      { f: 'f1', t: 'Un décret se borne à reprendre, mot pour mot, une loi qui interdit l’ouverture de nouvelles boulangeries à moins d’un kilomètre d’une boulangerie existante' }, '. ',
      { f: 'f2', t: 'M. Leroux, artisan, soutient que cette loi porte une atteinte sérieuse à la liberté d’entreprendre' }, '. ',
      { b: true, t: 'Il fait du pain depuis vingt ans.' }, ' ',
      { f: 'f3', t: 'La loi n’a jamais été soumise au Conseil constitutionnel' }, '. ',
      { f: 'f4', t: 'M. Leroux attaque le décret devant le Conseil d’État' }, '.',
    ],
    question: 'M. Leroux vous consulte : comment faire juger que la loi est contraire à la Constitution ?',
    faits: {
      f1: ['Un décret qui fait écran : il se borne à appliquer la loi', ['Un décret autonome pris sur le fondement de l’article 37', 'Un décret qui ajoute à la loi une condition nouvelle'], 'Le décret ne fait que reprendre la loi : le critiquer revient à critiquer la loi.'],
      f2: ['Un grief tiré d’un droit garanti par la Constitution', ['Un grief tiré d’un traité international', 'Un grief tiré de la seule opportunité de la mesure'], 'La liberté d’entreprendre est un droit que la Constitution garantit.'],
      f3: ['Une disposition jamais déclarée conforme à la Constitution', ['Une disposition déjà jugée conforme par le Conseil', 'Une disposition abrogée avant le litige'], 'Le Conseil constitutionnel ne s’est jamais prononcé sur cette loi.'],
      f4: ['Un litige en cours devant une juridiction administrative', ['Une saisine directe du Conseil constitutionnel par M. Leroux', 'Un recours porté devant le juge judiciaire'], 'La question peut être soulevée à l’occasion de ce litige.'],
    },
    problemes: [
      { id: 'p1', t: 'Le juge administratif peut-il contrôler la conformité à la Constitution d’un décret qui se borne à appliquer une loi ?', factuel: 'Le Conseil d’État peut-il dire que la loi est mauvaise ?' },
      { id: 'p2', t: 'La question de la constitutionnalité de la loi peut-elle être transmise au Conseil constitutionnel ?', factuel: 'M. Leroux peut-il aller au Conseil constitutionnel ?' },
    ],
    faux: [['La loi est-elle contraire à la Convention européenne ?', 'M. Leroux ne l’invoque pas : il invoque la Constitution.']],
    syllo: {
      p1: {
        regle: ['CE, Sect., 6 nov. 1936, Arrighi', 'Le juge administratif ne contrôle pas la conformité de la loi à la Constitution : quand le décret se borne à appliquer la loi, celle-ci fait écran.', 'arrighi'],
        leurres: [['CE, Ass., 20 oct. 1989, Nicolo', 'Le juge écarte la loi contraire à un traité.', 'Nicolo concerne les traités, pas la Constitution.'],
          ['Art. 61 de la Constitution', 'Les lois peuvent être déférées au Conseil constitutionnel avant leur promulgation.', 'Ce contrôle a priori n’est plus possible : la loi est promulguée.']],
        conditions: [
          ['Un décret qui se borne à appliquer la loi', 'f1', 'oui', 'Le décret reprend la loi mot pour mot.'],
          ['Un grief qui vise en réalité la loi', 'f2', 'oui', 'C’est la loi elle-même que M. Leroux juge contraire à la liberté d’entreprendre.'],
        ],
        exception: null,
        conclusion: ['La loi fait écran : le juge administratif ne peut pas juger le décret contraire à la Constitution.', 'Le juge administratif annule le décret, qu’il juge contraire à la Constitution.', 'Le juge administratif écarte la loi contraire à la Constitution, comme il le ferait pour un traité.'],
      },
      p2: {
        regle: ['Art. 61-1 C. et art. 23-5 de l’ordonnance du 7 nov. 1958', 'Le Conseil d’État renvoie au Conseil constitutionnel la question prioritaire de constitutionnalité lorsque la disposition est applicable au litige, n’a pas déjà été déclarée conforme à la Constitution, et que la question est nouvelle ou présente un caractère sérieux.', null],
        leurres: [['Art. 61 de la Constitution', 'Le Conseil constitutionnel est saisi des lois avant leur promulgation.', 'Le contrôle a priori est réservé à certaines autorités et ne vaut plus après la promulgation.'],
          ['CE, Sect., 6 nov. 1936, Arrighi', 'La loi fait écran.', 'Arrighi explique pourquoi le juge ne contrôle pas lui-même, pas comment saisir le Conseil constitutionnel.']],
        conditions: [
          ['Une disposition applicable au litige', 'f1', 'oui', 'La loi est la base du décret attaqué.'],
          ['Une disposition jamais déclarée conforme', 'f3', 'oui', 'Le Conseil constitutionnel ne l’a jamais examinée.'],
          ['Une question nouvelle ou sérieuse', 'f2', 'oui', 'L’atteinte à la liberté d’entreprendre est un grief sérieux.'],
        ],
        exception: null,
        conclusion: ['La question doit être renvoyée au Conseil constitutionnel.', 'La question ne peut plus être posée, puisque la loi est promulguée.', 'Le Conseil d’État tranche lui-même la question, sans renvoi.'],
      },
    },
    conseil: ['M. Leroux doit soulever, par un mémoire distinct, une question prioritaire de constitutionnalité : le Conseil d’État la renverra au Conseil constitutionnel.', 'M. Leroux doit demander au Conseil d’État d’annuler le décret, contraire à la liberté d’entreprendre : le juge administratif contrôle la constitutionnalité des actes.', 'M. Leroux ne peut plus rien faire : la loi est promulguée, et seul le contrôle avant promulgation existe.'],
  },

  {
    id: 'ad-pgd', titre: 'La radiation sans défense', niveau: 2, zones: { 1: [8], 2: [3] },
    enonce: [
      { f: 'f1', t: 'Un décret permet au ministre de radier un professionnel de santé de la liste des praticiens agréés, sans prévoir qu’il soit entendu' }, '. ',
      { f: 'f2', t: 'Aucune loi n’autorise à priver ces professionnels du droit de se défendre' }, '. ',
      { b: true, t: 'Le cabinet de Mme Morel est au deuxième étage.' }, ' ',
      { f: 'f3', t: 'Mme Morel est radiée pour des manquements qu’on lui reproche, sans avoir pu présenter ses observations' }, '.',
    ],
    question: 'Mme Morel vous consulte : peut-elle obtenir l’annulation de sa radiation ?',
    faits: {
      f1: ['Un décret, acte réglementaire', ['Une loi votée par le Parlement', 'Un acte individuel visant Mme Morel'], 'C’est le pouvoir réglementaire qui a organisé la procédure.'],
      f2: ['L’absence de loi dérogeant au principe', ['Une loi qui écarte expressément les droits de la défense', 'Un traité qui écarte les droits de la défense'], 'Seule une loi pourrait déroger à un principe général du droit : il n’y en a pas.'],
      f3: ['Une sanction prise en considération de la personne', ['Une mesure d’organisation interne du service', 'Une mesure gracieuse prise dans l’intérêt de Mme Morel'], 'La radiation punit des manquements : c’est une mesure prise en considération de la personne.'],
    },
    problemes: [
      { id: 'p1', t: 'Le respect des droits de la défense s’impose-t-il à l’administration en l’absence de texte ?', factuel: 'Mme Morel aurait-elle dû être écoutée ?' },
      { id: 'p2', t: 'Un décret peut-il déroger à un principe général du droit ?', factuel: 'Le décret avait-il le droit de dire ça ?' },
    ],
    faux: [['La radiation est-elle un acte de gouvernement ?', 'Rien ne la rattache aux relations internationales ou aux rapports entre pouvoirs publics.']],
    syllo: {
      p1: {
        regle: ['CE, Ass., 26 oct. 1945, Aramu', 'Le principe général des droits de la défense s’applique même en l’absence de texte, dès lors qu’une sanction est prise en considération de la personne.', 'aramu'],
        leurres: [['CE, Ass., 7 juill. 1950, Dehaene', 'Le droit de grève s’exerce dans le cadre des lois qui le réglementent.', 'Dehaene concerne le droit de grève, pas les droits de la défense.'],
          ['Art. 6 de la Convention européenne', 'Toute personne a droit à un procès équitable.', 'L’article 6 vise le procès ; ici, c’est une décision administrative.']],
        conditions: [
          ['Une sanction prise en considération de la personne', 'f3', 'oui', 'La radiation punit des manquements reprochés à Mme Morel.'],
          ['Aucun texte n’est nécessaire', null, 'oui', 'Le principe vaut même sans texte.'],
        ],
        exception: null,
        conclusion: ['Mme Morel devait pouvoir présenter sa défense avant d’être radiée.', 'Faute de texte prévoyant une procédure, l’administration n’avait pas à l’entendre.', 'Seul un juge, et non le ministre, devait entendre Mme Morel.'],
      },
      p2: {
        regle: ['CE, Sect., 26 juin 1959, Syndicat général des ingénieurs-conseils', 'Les principes généraux du droit s’imposent à toute autorité réglementaire, même en l’absence de disposition législative ; seule la loi peut y déroger.', 'sgic'],
        leurres: [['CE, Ass., 28 mai 1954, Barel', 'L’égal accès aux emplois publics interdit d’écarter un candidat pour ses opinions.', 'Barel concerne un autre principe, l’égal accès aux emplois publics.'],
          ['CE, Ass., 20 oct. 1989, Nicolo', 'Le juge écarte la loi contraire à un traité.', 'Aucun traité n’est en cause.']],
        conditions: [
          ['Un acte du pouvoir réglementaire', 'f1', 'oui', 'C’est un décret qui écarte les droits de la défense.'],
          ['Contraire à un principe général du droit', 'f3', 'oui', 'Le décret permet de sanctionner sans entendre.'],
        ],
        exception: ['Une loi peut déroger au principe', false, 'Aucune loi n’autorise cette dérogation : le décret ne peut pas l’opérer seul.'],
        conclusion: ['Le décret est illégal en ce qu’il prive les praticiens de leur défense.', 'Le décret peut déroger au principe, puisque ce principe n’est écrit dans aucun texte.', 'Le décret est valable, mais la radiation est nulle pour un vice de forme.'],
      },
    },
    conseil: ['Mme Morel peut faire annuler sa radiation en excipant de l’illégalité du décret.', 'Mme Morel doit d’abord obtenir l’abrogation du décret, sans quoi sa radiation reste valable.', 'Mme Morel ne peut rien faire : le ministre a respecté à la lettre la procédure prévue par le décret.'],
  },

  {
    id: 'ad-cyclone', titre: 'L’île coupée du monde', niveau: 2, zones: { 2: [2] },
    enonce: [
      { f: 'f1', t: 'Un cyclone d’une violence exceptionnelle ravage une île : routes coupées, administrations à l’arrêt' }, '. ',
      { f: 'f2', t: 'Le préfet réquisitionne aussitôt les engins d’une entreprise pour dégager les routes, sans suivre la procédure de réquisition prévue par les textes' }, '. ',
      { b: true, t: 'L’entreprise appartient à une famille installée sur l’île depuis un siècle.' }, ' ',
      { f: 'f3', t: 'Il interdit aussi toute circulation sur l’île, sans exception et pour une durée indéterminée' }, '.',
    ],
    question: 'L’entreprise et des habitants vous consultent : ces deux décisions sont-elles légales ?',
    faits: {
      f1: ['Des circonstances exceptionnelles', ['Une difficulté de service ordinaire', 'Un état d’urgence déclaré par décret'], 'Un cyclone qui paralyse l’île et ses administrations entrave le fonctionnement régulier des pouvoirs publics.'],
      f2: ['Une mesure prise hors des formes légales, faute de pouvoir les respecter', ['Une mesure prise dans les formes légales ordinaires', 'Un acte de gouvernement soustrait au juge'], 'Le préfet s’affranchit de la procédure normale de réquisition.'],
      f3: ['Une mesure générale, absolue et sans terme', ['Une mesure limitée à quelques routes', 'Une mesure provisoire de quelques heures'], 'L’interdiction ne connaît ni exception ni limite de durée.'],
    },
    problemes: [
      { id: 'p1', t: 'Les circonstances exceptionnelles permettent-elles à l’autorité administrative de s’affranchir des règles normales de compétence et de forme ?', factuel: 'Le préfet pouvait-il prendre les engins ?' },
      { id: 'p2', t: 'Une mesure prise en vertu des circonstances exceptionnelles est-elle légale lorsqu’elle n’est pas indispensable ?', factuel: 'Le préfet pouvait-il tout bloquer ?' },
    ],
    faux: [['Le préfet aurait-il dû demander l’autorisation du Parlement ?', 'Les circonstances exceptionnelles sont une construction jurisprudentielle : aucune autorisation parlementaire n’est requise.']],
    syllo: {
      p1: {
        regle: ['CE, 28 juin 1918, Heyriès', 'En période de circonstances exceptionnelles, l’autorité administrative peut prendre des mesures qui excèdent ses pouvoirs habituels lorsqu’elle est dans l’impossibilité d’agir selon les normes en vigueur, sous le contrôle du juge.', 'heyries'],
        leurres: [['TC, 2 déc. 1902, Société immobilière de Saint-Just', 'L’administration peut procéder à l’exécution forcée dans des cas limités.', 'L’exécution forcée n’est pas en cause : il s’agit de pouvoirs de crise.'],
          ['CE, 1875, Prince Napoléon', 'Le mobile politique ne suffit pas à faire un acte de gouvernement.', 'Aucun acte de gouvernement n’est en cause.']],
        conditions: [
          ['Des circonstances exceptionnelles', 'f1', 'oui', 'Le cyclone paralyse l’île et ses administrations.'],
          ['L’impossibilité d’agir selon les normes en vigueur', 'f2', 'oui', 'Dégager les routes ne pouvait attendre la procédure ordinaire de réquisition.'],
        ],
        exception: null,
        conclusion: ['La réquisition, irrégulière en temps normal, est légale dans ces circonstances.', 'La réquisition est illégale : la procédure prévue par les textes n’a pas été suivie.', 'La réquisition, mesure de crise, échappe à tout contrôle du juge.'],
      },
      p2: {
        regle: ['CE, Ass., 1er avr. 2025, LDH et autres (TikTok)', 'Les mesures prises en vertu des circonstances exceptionnelles ne sont légales que si elles sont indispensables au regard des circonstances à la date de la décision, sous l’entier contrôle du juge.', 'tiktok'],
        leurres: [['CE, 28 juin 1918, Heyriès', 'En circonstances exceptionnelles, l’administration peut excéder ses pouvoirs habituels.', 'Heyriès ouvre les pouvoirs de crise ; reste à savoir jusqu’où la mesure peut aller.'],
          ['Loi du 3 avril 1955', 'L’état d’urgence permet des mesures de police renforcées.', 'L’état d’urgence n’a pas été déclaré.']],
        conditions: [
          ['Des circonstances exceptionnelles', null, 'oui', 'Elles ont été reconnues au premier problème.'],
          ['Une mesure indispensable, limitée dans sa portée et sa durée', 'f3', 'non', 'Une interdiction totale, sans exception ni terme, n’est pas indispensable : des mesures ciblées suffisaient.'],
        ],
        exception: null,
        conclusion: ['L’interdiction générale et illimitée n’est pas indispensable : elle est illégale.', 'Toute mesure prise pendant la crise est légale, dès lors que les circonstances sont exceptionnelles.', 'L’interdiction est légale, car le préfet est seul juge de ce que la crise exige.'],
      },
    },
    conseil: ['La réquisition tient ; l’interdiction générale de circuler sera annulée.', 'Les deux décisions sont illégales : le préfet devait suivre les procédures ordinaires, même pendant le cyclone.', 'Les deux décisions sont légales : en circonstances exceptionnelles, le préfet peut prendre toute mesure qu’il juge utile.'],
  },

  {
    id: 'ad-extradition', titre: 'L’opposant réclamé', niveau: 2, zones: { 2: [3, 6] },
    enonce: [
      { f: 'f1', t: 'Par décret, le Premier ministre accorde à un État étranger l’extradition de M. Sarkis, opposant au régime de cet État' }, '. ',
      { f: 'f2', t: 'La demande vise des infractions de droit commun, mais tout montre qu’elle cherche à le punir pour son opposition' }, '. ',
      { b: true, t: 'M. Sarkis vit en France depuis quatre ans.' }, ' ',
      { f: 'f3', t: 'Le gouvernement soutient que le décret, qui touche aux relations avec cet État, échappe au juge' }, '.',
    ],
    question: 'M. Sarkis vous consulte : peut-il faire annuler le décret d’extradition ?',
    faits: {
      f1: ['Un décret d’extradition', ['Un traité d’extradition entre les deux États', 'Une décision de justice de l’État étranger'], 'C’est un acte administratif français qui accorde l’extradition.'],
      f2: ['Une extradition demandée dans un but politique', ['Une extradition pour de simples infractions de droit commun', 'Une demande d’asile déposée par M. Sarkis'], 'Derrière les infractions affichées, la demande vise son opposition politique.'],
      f3: ['L’argument de l’acte de gouvernement', ['Une exception tirée de la prescription', 'Une question préjudicielle au juge judiciaire'], 'Le gouvernement invoque l’immunité juridictionnelle des actes de gouvernement.'],
    },
    problemes: [
      { id: 'p1', t: 'Le décret d’extradition est-il un acte de gouvernement soustrait au contrôle du juge ?', factuel: 'Le juge peut-il s’occuper de cette affaire ?' },
      { id: 'p2', t: 'L’État doit-il refuser l’extradition demandée dans un but politique ?', factuel: 'La France doit-elle livrer M. Sarkis ?' },
    ],
    faux: [['M. Sarkis a-t-il droit au statut de réfugié ?', 'La question de l’asile est distincte de la légalité du décret.']],
    syllo: {
      p1: {
        regle: ['Jurisprudence des actes de gouvernement', 'Échappent au juge les actes qui touchent aux rapports entre pouvoirs publics ou à la conduite des relations internationales et qui n’en sont pas détachables ; le décret d’extradition en est détachable.', null],
        leurres: [['Théorie du mobile politique', 'Tout acte inspiré par un motif politique échappe au juge.', 'Le mobile politique a été abandonné en 1875 (Prince Napoléon).'],
          ['Art. 55 de la Constitution', 'Les traités ont une autorité supérieure aux lois.', 'Cela ne dit rien de la compétence du juge.']],
        conditions: [
          ['Un acte qui touche aux relations internationales', 'f1', 'oui', 'L’extradition répond à la demande d’un État étranger.'],
          ['Un acte qui n’en est pas détachable', null, 'non', 'Le décret d’extradition est détachable de la conduite des relations internationales.'],
        ],
        exception: null,
        conclusion: ['Le décret n’est pas un acte de gouvernement : le juge est compétent.', 'Le décret touche aux relations internationales : il échappe à tout juge.', 'Seul le juge judiciaire, gardien de la liberté, est compétent.'],
      },
      p2: {
        regle: ['CE, Ass., 3 juill. 1996, Koné', 'Selon un principe fondamental reconnu par les lois de la République, l’État doit refuser l’extradition d’un étranger lorsqu’elle est demandée dans un but politique.', 'kone'],
        leurres: [['Convention européenne d’extradition', 'L’extradition est accordée pour les infractions prévues au traité.', 'Le traité ne prime pas sur un principe constitutionnel ; et il va dans le même sens.'],
          ['CE, Sect., 26 juin 1959, Syndicat général des ingénieurs-conseils', 'Les principes généraux du droit s’imposent au pouvoir réglementaire.', 'Le principe est ici un PFRLR, de valeur constitutionnelle.']],
        conditions: [
          ['Une extradition demandée dans un but politique', 'f2', 'oui', 'La demande vise en réalité l’opposition de M. Sarkis.'],
        ],
        exception: null,
        conclusion: ['Le décret méconnaît ce principe : il est annulé.', 'Le décret est légal, les infractions visées étant de droit commun.', 'Le décret est légal, faute de texte interdisant l’extradition politique.'],
      },
    },
    conseil: ['M. Sarkis peut faire annuler le décret par le Conseil d’État : l’extradition politique est interdite.', 'M. Sarkis ne peut rien faire : le décret d’extradition, qui engage les relations avec un État étranger, est un acte de gouvernement.', 'M. Sarkis doit saisir le juge pénal, seul compétent pour apprécier les infractions qu’on lui reproche.'],
  },

  {
    id: 'ad-preable', titre: 'Les taxes de la rivière', niveau: 1, zones: { 2: [2] },
    enonce: [
      { f: 'f1', t: 'Un établissement public réclame à une société des redevances impayées ; il a déjà émis contre elle des titres exécutoires' }, '. ',
      { f: 'f2', t: 'La société a rendu ses biens en France insaisissables ; elle possède des biens en Belgique' }, '. ',
      { b: true, t: 'Le siège de la société est en Lorraine.' }, ' ',
      { f: 'f3', t: 'L’établissement demande au juge administratif de condamner la société à payer' }, '.',
    ],
    question: 'L’établissement vous consulte : sa demande au juge est-elle recevable ?',
    faits: {
      f1: ['Une administration dotée du privilège du préalable', ['Un créancier ordinaire, sans titre', 'Une juridiction administrative'], 'Elle peut émettre elle-même des titres exécutoires : c’est le privilège du préalable.'],
      f2: ['Une décision juridictionnelle utile pour saisir des biens à l’étranger', ['Une difficulté de recouvrement limitée à la France', 'Une insolvabilité totale de la société'], 'Pour saisir des biens à l’étranger, un titre émis par l’administration ne suffit pas.'],
      f3: ['Une demande au juge de ce que l’administration peut décider elle-même', ['Un recours pour excès de pouvoir contre ses titres', 'Une action en responsabilité contre la société'], 'Elle demande au juge une condamnation qu’elle pourrait en principe se donner seule.'],
    },
    problemes: [
      { id: 'p1', t: 'L’administration peut-elle demander au juge de prononcer une condamnation qu’elle a le pouvoir de décider elle-même ?', factuel: 'L’établissement a-t-il le droit d’aller voir le juge ?' },
    ],
    faux: [['Les redevances sont-elles légales ?', 'Leur légalité n’est pas discutée.']],
    syllo: {
      p1: {
        regle: ['CE, 30 mai 1913, Préfet de l’Eure', 'L’administration qui peut prendre elle-même une décision exécutoire n’est pas recevable à demander au juge de la prendre à sa place.', 'prefet-eure'],
        leurres: [['TC, 2 déc. 1902, Société immobilière de Saint-Just', 'L’administration peut procéder à l’exécution forcée dans certains cas.', 'L’exécution forcée est une autre question que celle du recours au juge.'],
          ['CE, 28 juin 1918, Heyriès', 'En circonstances exceptionnelles, l’administration excède ses pouvoirs habituels.', 'Aucune circonstance exceptionnelle.']],
        conditions: [
          ['Une administration qui peut émettre elle-même un titre exécutoire', 'f1', 'oui', 'L’établissement a d’ailleurs déjà émis des titres.'],
          ['Une demande au juge de ce qu’elle peut décider seule', 'f3', 'oui', 'Elle demande au juge une condamnation au paiement.'],
        ],
        exception: ['Sauf si une décision juridictionnelle est utile, par exemple pour saisir des biens à l’étranger (CE, 20 mai 2025, Forge de Longuyon)', true, 'Les biens saisissables sont en Belgique : un jugement est utile pour les atteindre.'],
        conclusion: ['La demande est recevable, par exception, car un jugement est utile pour saisir les biens à l’étranger.', 'La demande est irrecevable : l’administration ne peut jamais demander au juge ce qu’elle peut décider seule.', 'La demande est recevable : toute administration peut choisir de s’adresser au juge comme un créancier ordinaire.'],
      },
    },
    conseil: ['L’établissement peut maintenir sa demande : un jugement lui est utile pour saisir en Belgique.', 'L’établissement doit retirer sa demande, irrecevable, et se contenter des titres exécutoires qu’il a déjà émis.', 'L’établissement doit saisir directement le juge judiciaire belge, seul compétent pour les biens situés en Belgique.'],
  },
];
