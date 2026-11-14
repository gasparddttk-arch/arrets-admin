// Les cours partagés (page gdroit.eu/partager.html). Appelée par la base :
// - le vendredi (mode rappel) : un e-mail à chaque contributeur qui a gardé le rappel ;
// - le samedi (mode recap) : un e-mail à l'administrateur avec les nouveaux fichiers en pièces jointes.
import { createClient } from 'npm:@supabase/supabase-js@2.45.4';
import { encodeBase64 } from 'jsr:@std/encoding@1.0.5/base64';

const EXPEDITEUR = 'Gdroit <lexou@gdroit.eu>';
const PAGE = 'https://gdroit.eu/partager.html';
const LOT_MAX = 25 * 1024 * 1024; // octets bruts par e-mail, sous la limite de Resend une fois encodés

const echapper = (t: string) => t.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));
const json = (d: unknown, status = 200) => new Response(JSON.stringify(d), { status, headers: { 'Content-Type': 'application/json' } });

async function envoyer(cle: string, corps: Record<string, unknown>) {
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST', headers: { Authorization: `Bearer ${cle}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ from: EXPEDITEUR, ...corps }),
  });
  if (!r.ok) throw new Error(`Resend ${r.status} ${(await r.text()).slice(0, 200)}`);
}

const cadre = (contenu: string) => `<div style="font:16px/1.5 Georgia,serif;color:#1d2440;max-width:520px;margin:0 auto;padding:16px">${contenu}</div>`;

Deno.serve(async (req) => {
  const base = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const { data: jeton } = await base.from('reglage').select('valeur').eq('cle', 'jeton_rappel').single();
  if (!jeton?.valeur || req.headers.get('x-rappel') !== jeton.valeur) return new Response('refusé', { status: 401 });
  const cle = Deno.env.get('RESEND_API_KEY');
  if (!cle) return json({ envoyes: 0, raison: 'cle absente' });
  const { mode } = await req.json().catch(() => ({}));

  // Adresse e-mail de chaque compte, lue côté serveur seulement.
  const adresses = new Map<string, string>();
  for (let page = 1; page < 50; page++) {
    const { data, error } = await base.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    for (const u of data.users) if (u.email) adresses.set(u.id, u.email);
    if (data.users.length < 1000) break;
  }

  if (mode === 'rappel') {
    const { data: liste } = await base.from('contributeurs').select('id, matiere, equipe, jeton').eq('rappel', true);
    let envoyes = 0; const erreurs: string[] = [];
    for (const c of liste || []) {
      const a = adresses.get(c.id); if (!a) continue;
      const quoi = c.matiere ? `tes notes de ${echapper(c.matiere)}${c.equipe ? ` (${echapper(c.equipe)})` : ''}` : 'tes notes de la semaine';
      try {
        await envoyer(cle, {
          to: a, subject: 'Tes cours de la semaine pour Gdroit',
          html: cadre(`<p>C’est vendredi. Si tu as ${quoi}, tu peux les déposer en deux minutes : Lexou en fera des fiches et des questions pour toute ta promo.</p>
            <p><a href="${PAGE}" style="display:inline-block;background:#1d3fa0;color:#fff;padding:10px 18px;border-radius:10px;text-decoration:none">Déposer mes cours</a></p>
            <p style="font-size:13px;color:#667">Tu reçois ce rappel parce que tu l’as demandé en déposant tes cours. <a href="${PAGE}?arreter=${c.jeton}" style="color:#667">Ne plus le recevoir</a>.</p>`),
          headers: { 'List-Unsubscribe': `<${PAGE}?arreter=${c.jeton}>` },
        });
        envoyes++;
      } catch (e) { erreurs.push(String(e).slice(0, 120)); }
    }
    return json({ envoyes, erreurs: erreurs.length });
  }

  if (mode === 'recap') {
    const { data: admins } = await base.from('profils').select('id').eq('acces', 'admin');
    const destinataires = (admins || []).map((p) => adresses.get(p.id)).filter(Boolean) as string[];
    if (!destinataires.length) return json({ envoyes: 0, raison: 'pas d’administrateur' });
    const { data: depots } = await base.from('depots').select('*').is('envoye_le', null).order('cree_le').limit(100);
    if (!depots?.length) return json({ envoyes: 0 });

    // Les dépôts sont regroupés en e-mails de 25 Mo au plus ; un dépôt n'est jamais coupé en deux.
    type Lot = { ids: number[]; lignes: string[]; pieces: { filename: string; content: string }[]; taille: number };
    const lots: Lot[] = []; let lot: Lot = { ids: [], lignes: [], pieces: [], taille: 0 };
    for (const d of depots) {
      const pieces: Lot['pieces'] = []; let taille = 0;
      for (const [k, chemin] of (d.fichiers as string[]).entries()) {
        const { data: f } = await base.storage.from('depots').download(chemin);
        if (!f) continue;
        const octets = new Uint8Array(await f.arrayBuffer()); taille += octets.length;
        pieces.push({ filename: `depot-${d.id}-${k + 1}-${chemin.split('/').pop()}`, content: encodeBase64(octets) });
      }
      if (lot.ids.length && lot.taille + taille > LOT_MAX) { lots.push(lot); lot = { ids: [], lignes: [], pieces: [], taille: 0 }; }
      lot.ids.push(d.id); lot.pieces.push(...pieces); lot.taille += taille;
      lot.lignes.push(`<li>Dépôt ${d.id} : ${echapper(d.annee)}, ${echapper(d.matiere)}${d.equipe ? `, ${echapper(d.equipe)}` : ''}. ${pieces.length} fichier(s). Contributeur : ${echapper(adresses.get(d.auteur) || d.auteur)} (compte ${d.auteur}).</li>`);
    }
    if (lot.ids.length) lots.push(lot);

    const jour = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long', timeZone: 'Europe/Paris' }).format(new Date());
    let envoyes = 0;
    for (const [i, l] of lots.entries()) {
      await envoyer(cle, {
        to: destinataires,
        subject: `Gdroit : dépôts de cours du ${jour}${lots.length > 1 ? ` (${i + 1}/${lots.length})` : ''}`,
        html: cadre(`<p>${l.ids.length} dépôt(s) à transformer en fiches.</p><ul>${l.lignes.join('')}</ul>`),
        attachments: l.pieces,
      });
      await base.from('depots').update({ envoye_le: new Date().toISOString() }).in('id', l.ids);
      envoyes += l.ids.length;
    }
    return json({ envoyes, emails: lots.length });
  }

  return json({ erreur: 'mode inconnu' }, 400);
});
