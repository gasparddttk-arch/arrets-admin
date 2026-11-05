// Envoie le rappel quotidien au téléphone. Lancé par GitHub Actions vers 9 h, heure de Paris.
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import webpush from 'web-push';

const prive = process.env.VAPID_PRIVATE_KEY;
if (!prive) {
  console.log('Secret absent : VAPID_PRIVATE_KEY doit être renseigné. Rien à envoyer.');
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
const nom = a.nom.replace(/\s*\(\d{4}\)$/, '');
const question = `${nom}, ${a.an} : tu saurais en donner l’apport ?`;
const accroches = [
  ['Ta série t’attend', `Une séance aujourd’hui, et ton sceau reste en place. Tu te souviens de ${nom} (${a.an}) ?`],
  ['Audience du jour', question],
  ['Le rôle est prêt', `Cinq minutes pour garder ta série. Au programme, peut-être ${nom}, ${a.an}.`],
];
const [title, body] = accroches[jourAn % accroches.length];

webpush.setVapidDetails('https://github.com/gasparddttk-arch/arrets-admin', readFileSync('rappel/cle-publique.txt', 'utf8').trim(), prive);

// La liste vient de Supabase ; la preuve dérive de la clé privée, sans la révéler.
const supa = existsSync('rappel/supabase.json') ? JSON.parse(readFileSync('rappel/supabase.json', 'utf8')) : null;
const preuve = createHash('sha256').update(`arrets-admin:${prive}`).digest('hex');
async function rpc(nom, corps) {
  const r = await fetch(`${supa.url}/rest/v1/rpc/${nom}`, { method: 'POST', headers: { apikey: supa.cle, 'Content-Type': 'application/json' }, body: JSON.stringify(corps) });
  if (!r.ok) throw new Error(`${nom} : ${r.status}`);
  const t = await r.text();
  return t ? JSON.parse(t) : null;
}

const abonnes = new Map();
if (process.env.PUSH_SUBSCRIPTION) {
  const a = JSON.parse(process.env.PUSH_SUBSCRIPTION);
  for (const s of Array.isArray(a) ? a : [a]) abonnes.set(s.endpoint, s);
}
let listeLue = false;
if (supa) {
  try { for (const s of await rpc('lister_abonnes', { preuve })) abonnes.set(s.endpoint, s); listeLue = true; } catch (e) { console.error(`Liste indisponible : ${e.message}`); }
}

let envoyes = 0; let echecs = 0;
for (const s of abonnes.values()) {
  try {
    await webpush.sendNotification(s, JSON.stringify({ title, body, question }), { TTL: 6 * 3600, urgency: 'normal' });
    envoyes++;
  } catch (e) {
    echecs++;
    console.error(`Envoi refusé : ${e.statusCode || ''}`);
    // 404 et 410 : l'appli a été supprimée, l'adresse ne servira plus.
    if (supa && listeLue && [404, 410].includes(e.statusCode)) await rpc('retirer_abonne', { preuve, point: s.endpoint }).catch(() => {});
  }
}
console.log(`Rappel : ${envoyes} envoyé(s), ${echecs} échec(s).`);
if (!listeLue && supa) process.exit(1);
if (abonnes.size && !envoyes) process.exit(1);
