// Le rappel quotidien de Lexou : appelé chaque heure par la base, il écrit à ceux dont c'est l'heure.
// Drôle et un peu vexé, jamais le jour où le sceau est posé, et il se calme après 10 jours d'absence.
import webpush from 'npm:web-push@3.6.7';
import { createClient } from 'npm:@supabase/supabase-js@2.45.4';
import { timingSafeEqual } from 'jsr:@std/crypto@1.0.3/timing-safe-equal';

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

// Comparaison du secret en temps constant : la durée de la réponse ne renseigne pas sur le secret.
const enc = new TextEncoder();
const memeSecret = async (a: string | null, b: string) => {
  if (!a) return false;
  const [x, y] = await Promise.all([crypto.subtle.digest('SHA-256', enc.encode(a)), crypto.subtle.digest('SHA-256', enc.encode(b))]);
  return timingSafeEqual(new Uint8Array(x), new Uint8Array(y));
};

const tirer = (liste: string[], graine: number) => liste[graine % liste.length];
const remplir = (t: string, v: Record<string, string | number>) => t.replace(/\{(\w+)\}/g, (_, k) => String(v[k] ?? ''));

Deno.serve(async (req) => {
  const url = Deno.env.get('SUPABASE_URL')!;
  const service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const prive = Deno.env.get('VAPID_PRIVATE_KEY');
  const base = createClient(url, service);
  const { data: jeton } = await base.from('reglage').select('valeur').eq('cle', 'jeton_rappel').single();
  if (!jeton?.valeur || !(await memeSecret(req.headers.get('x-rappel'), jeton.valeur))) return new Response('refusé', { status: 401 });
  if (!prive) return new Response(JSON.stringify({ envoyes: 0, raison: 'cle absente' }), { headers: { 'Content-Type': 'application/json' } });
  webpush.setVapidDetails('https://gdroit.eu', PUBLIQUE, prive);

  const maintenant = new Date();
  const paris = new Intl.DateTimeFormat('fr-CA', { timeZone: 'Europe/Paris', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hour12: false }).formatToParts(maintenant);
  const part = (t: string) => paris.find((p) => p.type === t)!.value;
  const heure = Number(part('hour')) % 24;
  const aujourdhui = `${part('year')}-${part('month')}-${part('day')}`;
  const jourIdx = Math.floor(Date.UTC(+part('year'), +part('month') - 1, +part('day')) / 864e5);

  // Ceux dont c'est l'heure, puis leurs résumés et leurs appareils en deux requêtes (au lieu de deux par personne).
  const { data: profils } = await base.from('profils').select('id, pseudo, rappel, rappel_le, vu_le, acces').neq('acces', 'aucun');
  const dus = (profils || []).filter((p) => p.rappel?.actif && Number(p.rappel.heure ?? 9) === heure && p.rappel_le !== aujourdhui);
  const ids = dus.map((p) => p.id);
  const resumes = new Map<string, Record<string, unknown>>();
  const appareils = new Map<string, { point: string; abonnement: unknown }[]>();
  if (ids.length) {
    const [{ data: gs }, { data: as }] = await Promise.all([
      base.from('progressions').select('id, resume').in('id', ids),
      base.from('appareils').select('proprietaire, point, abonnement').in('proprietaire', ids),
    ]);
    for (const g of gs || []) resumes.set(g.id, g.resume || {});
    for (const a of as || []) appareils.set(a.proprietaire, [...(appareils.get(a.proprietaire) || []), a]);
  }
  let envoyes = 0;
  for (const p of dus) {
    const r = (resumes.get(p.id) || {}) as { sceau?: boolean; jour?: number; serie?: number; revoir?: string };
    if (r.sceau && r.jour === jourIdx) continue;
    const vu = p.vu_le ? Math.floor(Date.parse(p.vu_le) / 864e5) : jourIdx;
    const absent = Math.max(0, jourIdx - vu);
    if (absent >= 30) continue;
    if (absent >= 10 && absent % 7 !== 0) continue;
    const serie = r.serie || 0;
    const famille = absent >= 7 ? 'absent7' : absent >= 3 ? 'absent3' : absent >= 1 ? 'absent1' : serie >= 3 ? 'serie' : r.revoir ? (jourIdx % 2 ? 'fiche' : 'normal') : 'normal';
    const body = remplir(tirer(MESSAGES[famille], jourIdx + p.id.charCodeAt(0)), { serie, fiche: r.revoir || 'un arrêt', pseudo: p.pseudo || '' });
    for (const a of appareils.get(p.id) || []) {
      try { await webpush.sendNotification(a.abonnement as Parameters<typeof webpush.sendNotification>[0], JSON.stringify({ title: 'Lexou', body, ami: true, url: './', tag: 'rappel' }), { TTL: 6 * 3600 }); envoyes++; } catch (e) {
        const code = (e as { statusCode?: number }).statusCode;
        if (code === 404 || code === 410) await base.from('appareils').delete().eq('point', a.point);
      }
    }
    await base.from('profils').update({ rappel_le: aujourdhui }).eq('id', p.id);
  }
  // Le lundi à 9 h : la place de chacun dans le classement de la semaine écoulée (figé à 0 h 05).
  // Seulement pour ceux qui gardent les notifications de défis, une fois par semaine.
  let classements = 0;
  const lundiParis = new Intl.DateTimeFormat('en-US', { timeZone: 'Europe/Paris', weekday: 'short' }).format(maintenant) === 'Mon';
  if (lundiParis && heure === 9) {
    const { data: lignes } = await base.from('classements').select('semaine, compte, rang, sur, xp, podium').is('notifie_le', null).gte('semaine', jourIdx - 7);
    const comptes = (lignes || []).map((l) => l.compte);
    if (comptes.length) {
      const [{ data: prefs }, { data: apps }] = await Promise.all([
        base.from('profils').select('id, notifs').in('id', comptes),
        base.from('appareils').select('proprietaire, point, abonnement').in('proprietaire', comptes),
      ]);
      const veut = new Map((prefs || []).map((p) => [p.id, p.notifs?.defis !== false]));
      for (const l of lignes || []) {
        if (veut.get(l.compte)) {
          const premier = (l.podium || [])[0];
          const body = l.rang === 1
            ? `Tu finis en tête de ta bande cette semaine, avec ${l.xp} points. Lexou te tend la coupe.`
            : `Tu finis ${l.rang}e sur ${l.sur} cette semaine. ${premier?.pseudo || 'Un ami'} est devant avec ${premier?.xp ?? 0} points : la revanche commence aujourd’hui.`;
          for (const a of (apps || []).filter((x) => x.proprietaire === l.compte)) {
            try { await webpush.sendNotification(a.abonnement as Parameters<typeof webpush.sendNotification>[0], JSON.stringify({ title: 'Lexou', body, ami: true, url: './?amis', tag: 'classement' }), { TTL: 12 * 3600 }); classements++; } catch (e) {
              const code = (e as { statusCode?: number }).statusCode;
              if (code === 404 || code === 410) await base.from('appareils').delete().eq('point', a.point);
            }
          }
        }
        await base.from('classements').update({ notifie_le: new Date().toISOString() }).eq('semaine', l.semaine).eq('compte', l.compte);
      }
    }
  }
  return new Response(JSON.stringify({ envoyes, classements, heure }), { headers: { 'Content-Type': 'application/json' } });
});
