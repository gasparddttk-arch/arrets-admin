// Le rappel quotidien de Lexou : appelé chaque heure par la base, il écrit à ceux dont c'est l'heure.
// Drôle et un peu vexé, jamais le jour où le sceau est posé, et il se calme après 10 jours d'absence.
import webpush from 'npm:web-push@3.6.7';
import { createClient } from 'npm:@supabase/supabase-js@2.45.4';

const PUBLIQUE = 'BLsoEkbLXGZbRgEpqtBy4wC6et54RaMPURc8HDK1G3EfrZz0l8xiV7YkOy7sR9EJdsnckBqV6fxrdOlP4gNklQM';

const MESSAGES: Record<string, string[]> = {
  normal: [
    'Le Défi du jour t’attend. Lexou aussi. Surtout Lexou.',
    '5 minutes. Juste 5. Lexou a déjà ouvert le dossier.',
    'Lexou a rangé le Palais pour toi. Ce serait dommage de ne pas venir.',
    'Une séance, un sceau, un Lexou content. Le calcul est vite fait.',
    'Lexou a mis sa plus belle robe. Il attend la plaidoirie.',
  ],
  fiche: [
    'Lexou a relu {fiche} trois fois en t’attendant. Il connaît l’affaire par cœur.',
    '{fiche} est à revoir aujourd’hui. Lexou a la réponse. Et toi ?',
    'Petite audience : {fiche}. Lexou t’attend à la barre.',
  ],
  serie: [
    'Ta série de {serie} jours tient à un fil. Lexou tient le fil. Il a mal aux plumes.',
    '{serie} jours de suite. Lexou a déjà prévu le gâteau pour demain. Ne le fais pas mentir.',
    'Il te reste la journée pour garder tes {serie} jours. Lexou a sorti le sablier.',
  ],
  absent1: [
    'Lexou a mis sa robe d’avocat pour rien hier.',
    'Lexou a attendu toute la journée. Il fait semblant que ça va.',
  ],
  absent3: [
    'Tu veux plus me voir ? Signé : Lexou.',
    'Lexou révise tout seul. Il dit que c’est moins drôle sans toi.',
    'Lexou a commencé à parler aux arrêts. Les arrêts ne répondent pas.',
  ],
  absent7: [
    'Lexou a déposé un recours pour abandon. Le juge t’attend.',
    'Une semaine. Lexou a écrit une lettre. Elle est très longue, et un peu triste.',
  ],
};

const tirer = (liste: string[], graine: number) => liste[graine % liste.length];
const remplir = (t: string, v: Record<string, string | number>) => t.replace(/\{(\w+)\}/g, (_, k) => String(v[k] ?? ''));

Deno.serve(async (req) => {
  const url = Deno.env.get('SUPABASE_URL')!;
  const service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const prive = Deno.env.get('VAPID_PRIVATE_KEY');
  const base = createClient(url, service);
  const { data: jeton } = await base.from('reglage').select('valeur').eq('cle', 'jeton_rappel').single();
  if (!jeton?.valeur || req.headers.get('x-rappel') !== jeton.valeur) return new Response('refusé', { status: 401 });
  if (!prive) return new Response(JSON.stringify({ envoyes: 0, raison: 'cle absente' }), { headers: { 'Content-Type': 'application/json' } });
  webpush.setVapidDetails('https://github.com/gasparddttk-arch/arrets-admin', PUBLIQUE, prive);

  const maintenant = new Date();
  const paris = new Intl.DateTimeFormat('fr-CA', { timeZone: 'Europe/Paris', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hour12: false }).formatToParts(maintenant);
  const part = (t: string) => paris.find((p) => p.type === t)!.value;
  const heure = Number(part('hour')) % 24;
  const aujourdhui = `${part('year')}-${part('month')}-${part('day')}`;
  const jourIdx = Math.floor(Date.UTC(+part('year'), +part('month') - 1, +part('day')) / 864e5);

  const { data: profils } = await base.from('profils').select('id, pseudo, rappel, rappel_le, vu_le, acces').neq('acces', 'aucun');
  let envoyes = 0;
  for (const p of profils || []) {
    if (!p.rappel?.actif || Number(p.rappel.heure ?? 9) !== heure || p.rappel_le === aujourdhui) continue;
    const { data: g } = await base.from('progressions').select('resume').eq('id', p.id).maybeSingle();
    const r = g?.resume || {};
    if (r.sceau && r.jour === jourIdx) continue;
    const vu = p.vu_le ? Math.floor(Date.parse(p.vu_le) / 864e5) : jourIdx;
    const absent = Math.max(0, jourIdx - vu);
    if (absent >= 30) continue;
    if (absent >= 10 && absent % 7 !== 0) continue;
    const serie = r.serie || 0;
    const famille = absent >= 7 ? 'absent7' : absent >= 3 ? 'absent3' : absent >= 1 ? 'absent1' : serie >= 3 ? 'serie' : r.revoir ? (jourIdx % 2 ? 'fiche' : 'normal') : 'normal';
    const body = remplir(tirer(MESSAGES[famille], jourIdx + p.id.charCodeAt(0)), { serie, fiche: r.revoir || 'un arrêt', pseudo: p.pseudo || '' });
    const { data: apps } = await base.from('appareils').select('point, abonnement').eq('proprietaire', p.id);
    for (const a of apps || []) {
      try { await webpush.sendNotification(a.abonnement, JSON.stringify({ title: 'Lexou', body, ami: true, url: './', tag: 'rappel' }), { TTL: 6 * 3600 }); envoyes++; } catch (e) {
        const code = (e as { statusCode?: number }).statusCode;
        if (code === 404 || code === 410) await base.from('appareils').delete().eq('point', a.point);
      }
    }
    await base.from('profils').update({ rappel_le: aujourdhui }).eq('id', p.id);
  }
  return new Response(JSON.stringify({ envoyes, heure }), { headers: { 'Content-Type': 'application/json' } });
});
