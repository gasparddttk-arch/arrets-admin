// L1, introduction au droit (équipe 2). Même plan que l'équipe 3 : Livre 1 « Identification du droit »,
// Titre 1 (théorie : définition, fondement, cartographie) et Titre 2, chapitre 1 (histoire).
// Les notions communes gardent l'identifiant de l'équipe 3 : la progression suit l'étudiant qui change d'équipe.
// Ce que le cours de l'équipe 2 ne traite pas est retiré ; ce qu'il dit autrement est réécrit.
import * as b from './intro.mjs';

export const zones = b.zones;

const N = (id, z, etiquette, nom, regle, c, ex = null, pg = null, mot = null) => ({ id, z, etiquette, nom, regle, c, ex, pg, mot });
const RETIRES = new Set(['quieta-non-movere', 'suppletive', 'imperative', 'lex-mercatoria', 'jus-lex', 'discours-preliminaire']);
const RETOUCHES = {
  'droit-subjectif': { ex: 'Le droit de propriété sur son stylo, le droit de vote.' },
  decision: { ex: 'Une amende, la nomination d’un préfet.' },
  'generale-impersonnelle': { ex: 'Le président de la République préside le Conseil des ministres : la règle vise une fonction, pas un homme.' },
  prescription: { ex: 'Extinctive : une créance non réclamée pendant cinq ans est perdue. Acquisitive : trente ans de possession font le propriétaire.' },
  'soft-law': { ex: 'Le Comité consultatif national d’éthique, la Commission des clauses abusives, les agences de notation.' },
  'pacta-sunt-servanda': { z: [1] },
  disciplinement: { regle: 'Volonté d’une autorité publique de discipliner et d’organiser le groupe (Aldo Schiavone) : la sanction n’en serait que le révélateur.' },
  consensualisme: { z: [2], regle: 'Principe selon lequel le contrat oblige quelle que soit sa forme : seule compte la sincérité de l’engagement. Il a une racine chrétienne.' },
  deontologie: { regle: 'Règles qu’une profession se donne à elle-même, parfois réunies dans un code.', ex: null },
  compliance: { regle: 'Codes d’usages que des groupes de sociétés commerciales se reconnaissent et proclament.' },
  positivisme: { pg: 'Il sépare de façon étanche le droit et le monde des valeurs.' },
  realisme: { regle: 'Le droit n’est pas dans les règles écrites (paper rules), mais dans ce que font concrètement les juges.', c: 'Le droit, c’est ce que font les juges' },
  'naturel-classique': { regle: 'Le droit est l’idéal de justice que la raison permet d’atteindre : une quête du juste sans cesse renouvelée.', c: 'Une quête du juste, sans cesse renouvelée' },
};

export const notions = [
  ...b.notions.filter((n) => !RETIRES.has(n.id)).map((n) => ({ ...n, ...(RETOUCHES[n.id] || {}) })),
  // 1. Qu'est-ce que le droit ?
  N('nombre-dunbar', [1], 'Notion', 'Nombre de Dunbar', 'Environ 150 personnes : en dessous, un groupe s’organise spontanément, sans structure ; au-delà, il lui faut des règles.', 'Au-delà de 150, il faut des règles', null, null, 'DUNBAR'),
  N('harmonie-sociale', [1], 'Notion', 'Harmonie sociale', 'But du droit dans sa définition fonctionnelle : la pérennité du groupe, la prévision des actions, une coexistence pacifique. L’ordre social, plus la justice.', 'Le but du droit : l’ordre, plus la justice'),
  N('critere-sociologique', [1], 'Notion', 'Critère sociologique', 'Est du droit tout ce que le corps social suit spontanément, qu’il y ait une sanction ou non.', 'Est du droit ce que le groupe suit', null, 'Il voit du droit dans toutes les régularités sociales, celles de la mafia comprises.'),
  // 2. Le droit et ses voisins
  N('statut-personnel', [2], 'Notion', 'Statut personnel au Liban', 'Au Liban, État multiconfessionnel, le droit de la personne et de la famille renvoie à la religion de chacun.', 'Au Liban, la famille relève de la religion', null, 'Un cas où le droit délègue sa solution à la règle religieuse.'),
  // 3. Pourquoi le droit ?
  N('auguste-comte', [3], 'École', 'Positivisme d’Auguste Comte', 'Rupture de méthode : on n’accède à la connaissance que par l’observation neutre des faits, sans a priori moral ou religieux.', 'L’observation neutre des faits'),
  N('marxisme', [3], 'École', 'Lecture marxiste du droit', 'Le droit est un instrument de la bourgeoisie pour soumettre le prolétariat.', 'Le droit, outil de la bourgeoisie'),
  // 4. La carte du droit
  N('droit-commun-special', [4], 'Notion', 'Droit commun et droit spécial', 'Les droits spéciaux s’emboîtent dans le droit commun, comme les branches d’un arbre : la vente dans le droit des contrats, la vente immobilière dans la vente.', 'Les droits spéciaux s’emboîtent dans le commun', null, 'En cas de silence du droit spécial, le droit commun s’applique.'),
  N('patrimonial-famille', [4], 'Notion', 'Droit patrimonial de la famille', 'Les rapports d’argent entre époux (régimes matrimoniaux) et les successions.', 'Régimes matrimoniaux et successions', null, 'Le droit extrapatrimonial de la famille règle, lui, le mariage et le divorce.'),
  // 5. Le droit dans l'histoire
  N('invention-droit', [5], 'Notion', 'L’invention du droit', 'Pour Aldo Schiavone, Rome fait du droit un savoir autonome, détaché de la religion et de la morale, consacré à l’organisation du corps social.', 'À Rome, le droit devient un savoir autonome'),
  N('preteur', [5], 'Notion', 'Préteur', 'Magistrat romain de haut rang chargé d’interpréter le droit.', 'Le magistrat romain qui interprète le droit', null, null, 'PRETEUR'),
  N('redaction-coutumes', [5], 'Notion', 'Rédaction des coutumes', 'Au XVe siècle, le roi impose la mise par écrit des coutumes du Nord ; Du Moulin, d’Argentré et Guy Coquille les rationalisent.', 'Le roi fait écrire les coutumes'),
  N('ordonnances', [5], 'Notion', 'Grandes ordonnances royales', 'Lois du roi valables dans tout le royaume, préparées notamment par Colbert puis d’Aguesseau : les prémices du Code civil.', 'Les lois du roi pour tout le royaume'),
  N('egalite-civile', [5], 'Notion', 'Égalité civile', 'Avec l’abolition des privilèges et des ordres, tous ont les mêmes droits.', 'Les mêmes droits pour tous', null, 'La Révolution consacre aussi la propriété privée, la liberté du commerce et de l’industrie, l’égalité successorale.'),
  N('volontarisme', [5], 'Notion', 'Volontarisme juridique', 'Le droit est fondé sur la volonté, celle du peuple exprimée par la loi, plutôt que sur la raison, la morale ou l’ordre naturel.', 'Le droit fondé sur la volonté'),
  // 6. Le Code civil
  N('redacteurs', [6], 'Notion', 'Les quatre rédacteurs', 'Portalis, Tronchet, Bigot de Préameneu et Maleville, praticiens du droit, rédigent le projet de Code civil en trois mois.', 'Portalis, Tronchet, Bigot de Préameneu, Maleville'),
  N('fenet', [6], 'Notion', 'Le Fenet', 'Recueil des travaux préparatoires du Code civil, qui réunit notamment les observations des tribunaux consultés.', 'Le recueil des travaux préparatoires'),
];

// Le tri du greffe. Le règlement de la RATP a fait d'une convenance une règle de droit : la carte change de bord.
const TRI_RETIRES = new Set([
  'Le code de déontologie des médecins, rendu obligatoire par la loi.',
  'Faute d’accord contraire, la chose vendue se délivre là où elle se trouvait.',
  'Céder sa place à une personne âgée dans le bus.',
]);
export const tri = [
  ...b.tri.filter(([t]) => !TRI_RETIRES.has(t)),
  ['Dans le métro, céder sa place aux personnes prioritaires, comme le prévoit le règlement de la RATP.', 'd', 'Le droit s’est approprié une règle de savoir-vivre : elle est désormais sanctionnée.'],
  ['Les États respectent l’intégrité territoriale des autres États.', 'd', 'Un principe du droit international public, même si sa violation reste souvent sans sanction.'],
  ['Le fils aîné porte le prénom de son père.', 'c', 'Un usage de famille : personne ne le fait respecter par la force.'],
];

// Le grand rangement : p droit public, v droit privé, x droit mixte.
const RANG_RETIRES = new Set(['Droit de la sécurité sociale', 'Droit des brevets', 'L’amende infligée au voleur']);
export const rangement = [
  ...b.rangement.filter(([t]) => !RANG_RETIRES.has(t)),
  ['Un patient contre un hôpital public', 'p', 'L’hôpital public est une personne publique : droit administratif.'],
  ['Les rapports d’argent entre époux', 'v', 'Les régimes matrimoniaux : droit patrimonial de la famille.'],
  ['Le nom et la capacité d’une personne', 'v', 'L’individualisation de la personne privée : droit civil.'],
];

// Qui a dit ?
export const auteurs = {
  ...b.auteurs, schmitt: 'Éric-Emmanuel Schmitt', ripert: 'Georges Ripert', roubier: 'Paul Roubier', labbe: 'Labbé', paul: 'Paul (jurisconsulte)',
  brassens: 'Georges Brassens', schiavone: 'Aldo Schiavone', comte: 'Auguste Comte', romano: 'Santi Romano',
};
const CIT_RETIREES = new Set(['bentham', 'jestaz', 'stendhal']);
export const citations = [
  ...b.citations.filter(([a]) => !CIT_RETIREES.has(a)).map((c) => (c[0] === 'antigone'
    ? ['antigone', 'Je ne pensais pas que tes ordres fussent assez puissants pour que l’homme mortel pût enfreindre les lois non écrites et immuables des Dieux.', 3, 'Réponse à Créon']
    : c)),
  ['schmitt', 'Il n’y a que les questions sans intérêt qui ont des réponses définitives.', 1],
  ['augustin', 'Enlève le droit, et qu’est-ce qui distingue l’État d’une bande de brigands ?', 1],
  ['paul', 'Ce n’est pas de la règle qu’est tiré le droit, c’est du droit tel qu’il préexiste qu’on tire la règle.', 1],
  ['labbe', 'Le droit prescrit selon le degré de moralité qu’exige l’intérêt social.', 2],
  ['brassens', 'La seule révolution possible, c’est d’essayer de s’améliorer soi-même, en espérant que les autres fassent la même démarche.', 2],
  ['roubier', 'Les hommes ont une foi ardente dans l’existence de la justice et leur cœur ne se résignera jamais à un divorce entre ce qui est juste et ce qui est juridique.', 2],
  ['ripert', 'Le positivisme juridique est impuissant à nous donner le mot de l’énigme.', 3],
  ['carbonnier', 'Chacun devient Louis XIV sur sa propriété.', 5, 'À propos du droit révolutionnaire'],
];

// Memory : un auteur, son idée.
export const idees = [
  ...b.idees.filter(([a]) => a !== 'jestaz' && a !== 'portalis'),
  ['portalis', 'Il dirige la rédaction du Code civil', 6],
  ['schiavone', 'L’invention du droit à Rome', 5],
  ['comte', 'L’observation neutre des faits', 3],
  ['romano', 'Le droit, un ordre juridique', 1],
];

// Au scanner.
export const scanner = [
  ...b.scanner,
  ['Le président de la République préside le Conseil des ministres.', 'Constitution de 1958', null, 'Une règle générale : elle vise une fonction, quel que soit celui qui l’occupe.'],
  ['Mme Bernard est nommée préfète du Finistère.', 'Un décret de nomination', 'generale', 'Une décision : elle vise une personne nommée et s’épuise avec elle.'],
];

// Le mot du juriste.
export const mots = [
  ...b.mots.map((m) => (m[0] === 'ROME' ? ['ROME', 'La cité où le droit devient un savoir autonome.', 'invention-droit', 5]
    : m[0] === 'PORTALIS' ? ['PORTALIS', 'Il dirige les quatre rédacteurs du Code civil.', 'redacteurs', 6] : m)),
  ['DUNBAR', 'Son nombre : 150. Au-delà, un groupe a besoin de règles.', 'nombre-dunbar', 1],
  ['PRETEUR', 'Le magistrat romain qui interprète le droit.', 'preteur', 5],
];

// Les frises.
export const frises = b.frises.map((f) => (f.id === 'rome-revolution'
  ? { ...f, e: f.e.map((e) => (e.n === 'Domat' ? { ...e, t: 'Il systématise le droit, avant Pothier' } : e)) }
  : f));

// Le bon plan.
const P = (i, ia, ib, ii, iia, iib, ids = {}) => ({ 1: i, 2: ii, '1a': { t: ia, ids: ids.a || [] }, '1b': { t: ib, ids: ids.b || [] }, '2a': { t: iia, ids: ids.c || [] }, '2b': { t: iib, ids: ids.d || [] } });
export const sujets = [
  ...b.sujets.map((s) => {
    if (s.id === 'l1-sanction') return { ...s, m: 'L’approche moderne renverse la cause et la conséquence ; un compromis fait de la sanction le révélateur de la volonté de discipliner.' };
    if (s.id === 'l1-civil') return { ...s, bon: { ...s.bon, '2a': { ...s.bon['2a'], ids: ['invention-droit'] } } };
    return s;
  }),
  { id: 'l1-religion', type: 'D', titre: 'Droit et religion', zones: [2],
    bon: P('Deux ordres distincts', 'Des finalités différentes : la justice, le salut', 'Des sanctions différentes : la contrainte publique, le regard de Dieu',
      'Deux ordres en relation', 'Le droit emprunte à la règle religieuse', 'En cas de conflit, la règle de droit l’emporte', { a: ['regle-religieuse'], b: ['sanction'], c: ['consensualisme'], d: ['laicite'] }),
    mauvais: [
      { code: 'HORS', pourquoi: 'Le plan traite du droit et de la morale, pas de la religion.', plan: { 1: 'La morale', 2: 'Le minimum éthique', '1a': 'Sa finalité', '1b': 'Sa sanction', '2a': 'Le droit reprend la morale', '2b': 'Les bonnes mœurs' } },
      { code: 'CHRONO', pourquoi: 'Le plan raconte l’histoire au lieu de confronter les deux ordres.', plan: { 1: 'Avant 1905', 2: 'Depuis 1905', '1a': 'Le droit romain et les pontifes', '1b': 'L’ancien droit', '2a': 'La loi de séparation', '2b': 'Aujourd’hui' } },
    ],
    pb: 'La règle de droit peut-elle s’affranchir de la règle religieuse ?', m: 'Le cours oppose finalités et sanctions, puis montre les emprunts du droit à la religion et la primauté de la règle de droit en cas de conflit.' },
];
