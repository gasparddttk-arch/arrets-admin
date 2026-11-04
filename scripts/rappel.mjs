// Envoie le rappel quotidien au téléphone. Lancé par GitHub Actions vers 9 h, heure de Paris.
import { readFileSync } from 'node:fs';
import webpush from 'web-push';

const prive = process.env.VAPID_PRIVATE_KEY;
const abonnement = process.env.PUSH_SUBSCRIPTION;
if (!prive || !abonnement) {
  console.log('Secrets absents : VAPID_PRIVATE_KEY et PUSH_SUBSCRIPTION doivent être renseignés. Rien à envoyer.');
  process.exit(0);
}

// GitHub lance deux horaires UTC pour suivre l'heure d'été : un seul doit partir.
const prog = process.env.CRON_PREVU || '';
if (prog) {
  const heureParis = +new Intl.DateTimeFormat('fr-FR', { timeZone: 'Europe/Paris', hour: 'numeric', hourCycle: 'h23' }).format(new Date());
  const heureUTC = new Date().getUTCHours();
  const decalage = ((heureParis - heureUTC) % 24 + 24) % 24;
  const attendu = decalage === 2 ? '41 6 * * *' : '41 7 * * *';
  if (prog !== attendu) { console.log(`Horaire ${prog} ignoré (Paris à UTC+${decalage}).`); process.exit(0); }
}

const contenu = JSON.parse(readFileSync('docs/content.json', 'utf8'));
const jourAn = Math.floor(Date.now() / 864e5);
const grands = contenu.arrets.filter((a) => a.imp === 3);
const a = grands[jourAn % grands.length];
const accroches = [
  ['Ta série t’attend', `Une séance aujourd’hui, et ton sceau reste en place. Tu te souviens de ${a.nom} (${a.an}) ?`],
  ['Audience du jour', `${a.nom}, ${a.an} : tu saurais en donner l’apport ?`],
  ['Le rôle est prêt', `Cinq minutes pour garder ta série. Au programme, peut-être ${a.nom}.`],
];
const [title, body] = accroches[jourAn % accroches.length];

webpush.setVapidDetails('https://github.com/gasparddttk-arch/arrets-admin', readFileSync('rappel/cle-publique.txt', 'utf8').trim(), prive);
try {
  await webpush.sendNotification(JSON.parse(abonnement), JSON.stringify({ title, body }), { TTL: 6 * 3600, urgency: 'normal' });
  console.log('Rappel envoyé.');
} catch (e) {
  console.error(`Envoi refusé : ${e.statusCode || ''} ${e.body || e.message}`);
  process.exit(1);
}
