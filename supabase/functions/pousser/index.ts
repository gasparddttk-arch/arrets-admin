// Envoie sur les téléphones les notifications que l'appelant vient de créer (demande d'ami, défi, révision).
// L'appelant est identifié par son jeton ; seules ses propres notifications des deux dernières minutes partent.
// Place de test et mise à jour : seulement si l'appelant est l'administrateur.
import webpush from 'npm:web-push@3.6.7';
import { createClient } from 'npm:@supabase/supabase-js@2.45.4';

const PUBLIQUE = 'BLsoEkbLXGZbRgEpqtBy4wC6et54RaMPURc8HDK1G3EfrZz0l8xiV7YkOy7sR9EJdsnckBqV6fxrdOlP4gNklQM';
// Les adresses d'où l'appli peut appeler cette fonction : gdroit.eu, et l'ancienne adresse le temps du déménagement.
const ORIGINES = ['https://gdroit.eu', 'https://www.gdroit.eu', 'https://gasparddttk-arch.github.io'];

const TEXTES: Record<string, (p: string, d: Record<string, unknown>) => [string, string]> = {
  demande: (p) => ['Demande d’ami', `${p} veut t’ajouter sur Gdroit.`],
  acceptee: (p) => ['Nouvel ami', `${p} a accepté ta demande.`],
  defi_recu: (p) => ['Tu es défié', `${p} te lance un défi. À toi de jouer.`],
  defi_resultat: (p, d) => {
    const moi = Math.round(Number(d.moi) * 100); const lui = Math.round(Number(d.lui) * 100);
    return ['Défi relevé', lui > moi ? `${p} a battu ton score : ${lui} % contre ${moi} %.` : lui === moi ? `Égalité avec ${p} : ${lui} %.` : `${p} n’a pas battu ton score : ${lui} % contre ${moi} %.`];
  },
  ami_defi: (p) => ['Défi du jour', `${p} a fini son défi du jour.`],
  place_testeur: () => ['Place de test ouverte', 'Une place s’est libérée sur Gdroit ! Lexou t’attend au Palais.'],
  maj_appli: (_, d) => ['Mise à jour de Gdroit', (d.titre as string) || 'Une nouvelle version est en ligne. Viens voir les nouveautés !'],
};

const ADMIN = new Set(['place_testeur', 'maj_appli']);

const corsPour = (req: Request) => {
  const o = req.headers.get('origin') || '';
  return { 'Access-Control-Allow-Origin': ORIGINES.includes(o) ? o : ORIGINES[0], 'Access-Control-Allow-Headers': 'authorization, apikey, content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS', Vary: 'Origin' };
};

Deno.serve(async (req) => {
  const entetes = corsPour(req);
  if (req.method === 'OPTIONS') return new Response(null, { headers: entetes });
  const prive = Deno.env.get('VAPID_PRIVATE_KEY');
  const url = Deno.env.get('SUPABASE_URL')!;
  const service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const jeton = (req.headers.get('Authorization') || '').replace(/^Bearer /, '');
  const base = createClient(url, service);
  const { data: u } = await base.auth.getUser(jeton);
  if (!u?.user) return new Response('non connecté', { status: 401, headers: entetes });
  if (!prive) return new Response(JSON.stringify({ envoyees: 0, raison: 'cle absente' }), { headers: { ...entetes, 'Content-Type': 'application/json' } });
  webpush.setVapidDetails('https://github.com/gasparddttk-arch/arrets-admin', PUBLIQUE, prive);

  const { data: prof } = await base.from('profils').select('pseudo, acces').eq('id', u.user.id).single();
  const estAdmin = prof?.acces === 'admin';
  const depuis = new Date(Date.now() - 120000).toISOString();
  const { data: brute } = await base.from('notifications').select('id, destinataire, type, donnees').eq('de', u.user.id).eq('pousser', true).is('pousse_le', null).gte('cree_le', depuis).limit(estAdmin ? 500 : 50);
  const liste = (brute || []).filter((n) => estAdmin || !ADMIN.has(n.type));
  if (!liste?.length) return new Response(JSON.stringify({ envoyees: 0 }), { headers: { ...entetes, 'Content-Type': 'application/json' } });
  await base.from('notifications').update({ pousse_le: new Date().toISOString() }).in('id', liste.map((n) => n.id));
  const pseudo = prof?.pseudo || 'Un ami';
  let envoyees = 0;
  for (const n of liste) {
    const { data: apps } = await base.from('appareils').select('point, abonnement').eq('proprietaire', n.destinataire);
    const [title, body] = (TEXTES[n.type] || TEXTES.demande)(pseudo, n.donnees || {});
    // Une annonce de l'admin peut ouvrir gdroit.eu : utile pour faire quitter une ancienne installation.
    const vers = String((n.donnees as Record<string, unknown>)?.url || '');
    const lien = ADMIN.has(n.type) ? (vers.startsWith('https://gdroit.eu/') ? vers : './') : './?amis';
    for (const a of apps || []) {
      try {
        await webpush.sendNotification(a.abonnement, JSON.stringify({ title, body, ami: true, tag: `${n.type}-${n.id}`, url: lien }), { TTL: 3600 * 12 });
        envoyees++;
      } catch (e) {
        const code = (e as { statusCode?: number }).statusCode;
        if (code === 404 || code === 410) await base.from('appareils').delete().eq('point', a.point);
      }
    }
  }
  return new Response(JSON.stringify({ envoyees }), { headers: { ...entetes, 'Content-Type': 'application/json' } });
});
