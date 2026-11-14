// Page « Partage tes cours » (gdroit.eu/partager.html), pensée pour le lien en bio Instagram :
// connexion par code e-mail (Google refuse les navigateurs intégrés), dépôt des notes, rappel du vendredi coché d'office.
import { h, toast } from './ui.js';
import { connecte, utilisateur, envoyerCode, verifierCode, deposerCours, arreterRappelCours, typeDepot } from './compte.js';

const racine = document.getElementById('app');
const MATIERES = {
  L1: ['Introduction au droit', 'Droit constitutionnel', 'Histoire du droit', 'Institutions juridictionnelles'],
  L2: ['Droit administratif', 'Droit des obligations', 'Droit pénal', 'Finances publiques', 'Droit européen'],
  L3: ['Droit des contrats spéciaux', 'Droit des affaires', 'Droit international public', 'Libertés fondamentales'],
  autre: [],
};
const MAX_FICHIERS = 10; const MAX_OCTETS = 20 * 1024 * 1024;

const page = (...enfants) => racine.replaceChildren(h('main', { class: 'connexion partager' },
  h('img', { class: 'partager-logo', src: 'icons/icon-192.png', alt: '', width: 72, height: 72 }),
  h('h1', {}, 'Partage tes cours'),
  ...enfants,
  h('p', { class: 'liens-legaux' }, h('a', { href: './' }, 'Gdroit'), h('a', { href: 'confidentialite.html' }, 'Confidentialité'))));

function ecranArret(jeton) {
  page(h('p', { class: 'connexion-sous' }, 'Un instant…'));
  arreterRappelCours(jeton)
    .then(() => page(h('p', { class: 'connexion-sous' }, 'C’est noté : tu ne recevras plus le rappel du vendredi.'), h('a', { class: 'bouton-fantome', href: 'partager.html' }, 'Déposer quand même des cours')))
    .catch(() => page(h('p', { class: 'connexion-sous' }, 'Ce lien ne marche plus. Connecte-toi ci-dessous et décoche le rappel lors de ton prochain dépôt.'), h('a', { class: 'bouton-fantome', href: 'partager.html' }, 'Continuer')));
}

function ecranConnexion() {
  const email = h('input', { class: 'code', type: 'email', inputmode: 'email', autocomplete: 'email', placeholder: 'ton.adresse@email.fr', 'aria-label': 'Adresse e-mail' });
  const code = h('input', { class: 'code', inputmode: 'numeric', autocomplete: 'one-time-code', placeholder: 'Code reçu par e-mail', 'aria-label': 'Code reçu par e-mail', maxlength: 10 });
  const valider = h('button', { class: 'bouton-or', onClick: async () => {
    if (code.value.replace(/\s/g, '').length < 6) return toast('Tape le code reçu.');
    valider.disabled = true;
    try { await verifierCode(email.value, code.value); ecranDepot(); } catch (err) { toast(err.message); valider.disabled = false; }
  } }, 'Valider le code');
  const etape2 = h('div', { class: 'connexion-code', hidden: true }, h('p', { class: 'aide-claire' }, 'Regarde tes e-mails, y compris les indésirables.'), code, valider);
  const envoyer = h('button', { class: 'bouton-or', onClick: async () => {
    if (!/^\S+@\S+\.\S+$/.test(email.value.trim())) return toast('Adresse e-mail incomplète.');
    envoyer.disabled = true;
    try { await envoyerCode(email.value); etape2.hidden = false; code.focus(); toast('Code envoyé.'); } catch (err) { toast(err.message); } finally { envoyer.disabled = false; }
  } }, 'Recevoir un code');
  page(
    h('p', { class: 'connexion-sous' }, 'Tes notes deviennent des fiches et des questions dans Gdroit, pour toute ta promo. Elles ne sont jamais publiées telles quelles.'),
    h('p', { class: 'aide-claire' }, 'Ton adresse sert à te connecter et, si tu le veux, à te rappeler le vendredi de partager tes cours.'),
    email, envoyer, etape2);
}

function ecranDepot() {
  let annee = 'L2';
  const choixAnnee = h('div', { class: 'bascule', role: 'radiogroup', 'aria-label': 'Année' }, ['L1', 'L2', 'L3', 'autre'].map((a) => h('button', {
    type: 'button', role: 'radio', 'aria-checked': String(a === annee), class: a === annee ? 'actif' : '', onClick: () => {
      annee = a; [...choixAnnee.children].forEach((b) => { const oui = b.dataset.a === a; b.classList.toggle('actif', oui); b.setAttribute('aria-checked', String(oui)); });
      liste.replaceChildren(...MATIERES[a].map((m) => h('option', { value: m })));
    }, 'data-a': a }, a === 'autre' ? 'Autre' : a)));
  const liste = h('datalist', { id: 'matieres' }, MATIERES[annee].map((m) => h('option', { value: m })));
  const matiere = h('input', { class: 'code', list: 'matieres', maxlength: 80, placeholder: 'Matière (ex. Droit administratif)', 'aria-label': 'Matière' });
  const equipe = h('input', { class: 'code', maxlength: 30, placeholder: 'Équipe ou groupe (ex. équipe 1)', 'aria-label': 'Équipe ou groupe' });
  const fichiers = h('input', { type: 'file', multiple: true, accept: 'image/*,.pdf,.docx', class: 'partager-fichiers', 'aria-label': 'Tes fichiers' });
  const resume = h('p', { class: 'aide-claire' }, 'Photos, PDF ou Word : 10 fichiers au plus, 20 Mo chacun.');
  fichiers.addEventListener('change', () => {
    const n = fichiers.files.length;
    resume.textContent = n ? `${n} fichier${n > 1 ? 's' : ''} choisi${n > 1 ? 's' : ''}.` : 'Photos, PDF ou Word : 10 fichiers au plus, 20 Mo chacun.';
  });
  const case_ = (texte, coche) => { const c = h('input', { type: 'checkbox', checked: coche }); return [c, h('label', { class: 'partager-case' }, c, h('span', {}, texte))]; };
  const [accord, ligneAccord] = case_('J’autorise Gdroit à utiliser ces notes pour rédiger des fiches et des questions. Elles ne seront pas publiées telles quelles.', false);
  const [rappel, ligneRappel] = case_('Me rappeler chaque vendredi, par e-mail, de partager mes cours de cette matière.', true);
  const etat = h('p', { class: 'aide-claire', role: 'status' });
  const envoyer = h('button', { class: 'bouton-or', onClick: async () => {
    const liste_ = [...fichiers.files];
    if (matiere.value.trim().length < 2) return toast('Indique la matière.');
    if (!liste_.length) return toast('Choisis au moins un fichier.');
    if (liste_.length > MAX_FICHIERS) return toast('10 fichiers au plus par dépôt.');
    const lourd = liste_.find((f) => f.size > MAX_OCTETS); if (lourd) return toast(`${lourd.name} dépasse 20 Mo.`);
    const inconnu = liste_.find((f) => !typeDepot(f)); if (inconnu) return toast(`${inconnu.name} : photos, PDF ou Word seulement.`);
    if (!accord.checked) return toast('Coche l’autorisation pour envoyer.');
    envoyer.disabled = true;
    try {
      await deposerCours({ annee, matiere: matiere.value.trim(), equipe: equipe.value.trim(), fichiers: liste_, rappel: rappel.checked },
        (i) => { etat.textContent = `Envoi du fichier ${i + 1} sur ${liste_.length}…`; });
      ecranMerci(rappel.checked);
    } catch (err) { etat.textContent = ''; toast(err.message); envoyer.disabled = false; }
  } }, 'Envoyer mes cours');
  page(
    h('p', { class: 'connexion-sous' }, `Connecté : ${utilisateur()?.email || 'ton compte'}`),
    choixAnnee, liste, matiere, equipe,
    h('label', { class: 'bouton-fantome partager-choisir' }, 'Choisir mes fichiers', fichiers), resume,
    ligneAccord, ligneRappel, envoyer, etat);
}

function ecranMerci(rappel) {
  page(
    h('p', { class: 'connexion-sous' }, 'Merci. Lexou transforme tes notes en fiches ce week-end.'),
    rappel ? h('p', { class: 'aide-claire' }, 'Rendez-vous vendredi pour les cours de la semaine prochaine.') : null,
    h('button', { class: 'bouton-fantome', onClick: ecranDepot }, 'Déposer d’autres cours'),
    h('a', { class: 'bouton-or', href: './' }, 'Découvrir Gdroit'));
}

const p = new URLSearchParams(location.search);
if (p.get('arreter')) ecranArret(p.get('arreter'));
else if (connecte()) ecranDepot();
else ecranConnexion();
