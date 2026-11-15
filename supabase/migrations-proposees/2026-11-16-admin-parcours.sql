-- Fiche « parcours » du panneau admin (le fil des événements reste dans admin_parcours) : tout ce que l'appli sait déjà d'un compte, en un seul objet.
-- Réservé à l'administrateur (est_admin), comme admin_comptes. Validé par Gaspard et appliqué le 16/11/2026 (migration admin_fiche_parcours).
create or replace function public.admin_fiche_parcours(cible uuid) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare r jsonb;
begin
  if not public.est_admin() then raise exception 'réservé à l''administrateur' using errcode = '42501'; end if;
  with ev as (
    select type, donnees, cree_le, (cree_le at time zone 'Europe/Paris') loc from public.evenements where compte = cible
  ), g as (select donnees d from public.progressions where id = cible),
  fins as (select loc, row_number() over (order by loc) k from ev where type = 'seance_fin'),
  mat as (
    select m.cle, m.nom, coalesce((m.x->>'xp')::int, 0) xp,
           coalesce(jsonb_array_length(m.x->'zones'->'gagnees'), 0) gagnees,
           coalesce(jsonb_array_length(m.x->'zones'->'ouvertes'), 0) ouvertes,
           coalesce(jsonb_array_length(m.x->'zones'->'parfaites'), 0) parfaites,
           (select count(*) from jsonb_each(coalesce(m.x->'arrets', '{}')) a where coalesce((a.value->>'b')::int, 0) >= 3) acquis,
           (select count(*) from jsonb_each(coalesce(m.x->'arrets', '{}'))) vues
    from g, lateral (values ('admin', 'Droit administratif', g.d), ('oblig', 'Droit des obligations', g.d->'oblig'),
                             ('intro', 'Introduction au droit', g.d->'intro'), ('constit', 'Droit constitutionnel', g.d->'constit')) m(cle, nom, x)
  )
  select jsonb_build_object(
    'cree_le', (select cree_le from public.profils where id = cible),
    'vu_le', (select vu_le from public.profils where id = cible),
    'serie', (select d->'serie' from g),
    'porte', (select d->'chouette'->'porte' from g),
    'skin', (select d->'chouette'->>'skin' from g),
    'jours', coalesce((select jsonb_agg(jsonb_build_object('j', j, 'n', n) order by j) from (select loc::date j, count(*) n from ev where type = 'seance_fin' and loc > now() - interval '57 days' group by 1) x), '[]'),
    'etapes', jsonb_build_object(
      'connexion', (select min(cree_le) from ev where type = 'connexion'),
      'premiere', (select min(cree_le) from ev where type = 'seance_fin'),
      'cinquieme', (select loc from fins where k = 5),
      'serie3', (select min(j) from (select loc::date j from ev where type = 'seance_fin' group by 1) a where exists (select 1 from ev e2 where e2.type = 'seance_fin' and e2.loc::date = a.j - 1) and exists (select 1 from ev e3 where e3.type = 'seance_fin' and e3.loc::date = a.j - 2))),
    'seances', jsonb_build_object(
      'debut', (select count(*) from ev where type = 'seance_debut'),
      'fin', (select count(*) from ev where type = 'seance_fin'),
      'duree', (select round(avg((donnees->>'duree')::numeric)) from ev where type = 'seance_fin' and donnees ? 'duree'),
      'score', (select round(avg((donnees->>'score')::numeric) * 100) from ev where type = 'seance_fin' and donnees ? 'score')),
    'abandons', coalesce((select jsonb_agg(jsonb_build_object('epreuve', e, 'i', i, 'n', n, 'duree', du) order by n desc) from (
       select donnees->>'epreuve' e, (donnees->>'i')::int i, count(*) n, round(avg((donnees->>'duree')::numeric)) du from ev where type = 'seance_quitte' group by 1, 2) x), '[]'),
    'jeux', coalesce((select jsonb_agg(jsonb_build_object('jeu', e, 'n', n, 'score', s) order by n desc) from (
       select donnees->>'epreuve' e, count(*) n, round(avg((donnees->>'score')::numeric) * 100) s from ev where type = 'epreuve' and donnees ? 'score' group by 1) x), '[]'),
    'heures', (select jsonb_agg(coalesce(c, 0) order by h) from generate_series(0, 23) h left join (select extract(hour from loc)::int hh, count(*) c from ev where type = 'seance_debut' group by 1) x on x.hh = h),
    'matieres', coalesce((select jsonb_agg(jsonb_build_object('cle', cle, 'nom', nom, 'xp', xp, 'gagnees', gagnees, 'ouvertes', ouvertes, 'parfaites', parfaites, 'acquis', acquis, 'vues', vues)) from mat where xp > 0 or vues > 0), '[]'),
    'appareil', (select donnees from ev where type = 'ouverture' order by cree_le desc limit 1),
    'notifications', (select count(*) from public.appareils where proprietaire = cible),
    'social', jsonb_build_object(
      'amis', (select count(*) from public.amities where statut = 'acceptee' and cible in (demandeur, destinataire)),
      'defis_envoyes', (select count(*) from public.defis_amis where auteur = cible),
      'defis_recus', (select count(*) from public.defis_amis where invite = cible),
      'defis_gagnes', (select count(*) from public.defis_amis where (auteur = cible and score_auteur > score_invite) or (invite = cible and score_invite > score_auteur)),
      'cadeaux_recus', (select count(*) from public.cadeaux where destinataire = cible)),
    'suivi_depuis', (select min(cree_le) from public.evenements)
  ) into r;
  return r;
end $$;
revoke all on function public.admin_fiche_parcours(uuid) from public, anon;
grant execute on function public.admin_fiche_parcours(uuid) to authenticated;
