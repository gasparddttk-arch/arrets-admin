-- Corrections de l'audit du 14/11 : lots 1c, 3a, 5b et 9. Proposé le 15/11/2026, à valider par Gaspard.

-- 1c. L'accès à l'appli vérifié côté serveur.
-- Correction de l'audit : autorise(preuve) est l'ancien mot de passe d'entrée, pas le contrôle d'accès.
-- Le vrai critère est profils.acces (admin, testeur ou paye) : on l'écrit dans une fonction.
create function public.a_acces() returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profils where id = auth.uid() and acces in ('admin', 'testeur', 'paye'));
$$;
revoke all on function public.a_acces() from public, anon;
grant execute on function public.a_acces() to authenticated;

alter policy "creer sa progression" on public.progressions
  with check (id = (select auth.uid()) and (select public.a_acces()));
alter policy "modifier sa progression" on public.progressions
  using (id = (select auth.uid())) with check (id = (select auth.uid()) and (select public.a_acces()));

create or replace function public.annoncer_defi_jour() returns void language plpgsql security definer set search_path = '' as $$
declare moi uuid := auth.uid(); a uuid;
begin
  if not public.a_acces() then raise exception 'accès réservé' using errcode = '42501'; end if;
  if (select masquer from public.profils where id = moi) then return; end if;
  for a in select case when demandeur = moi then destinataire else demandeur end from public.amities where statut = 'acceptee' and moi in (demandeur, destinataire) loop
    perform public.notifier(a, 'ami_defi', moi);
  end loop;
end $$;

-- 9c (en partie). Essais de code ami inconnus : au plus 30 par heure.
create table public.essais_code (qui uuid not null, le timestamptz not null default now());
create index essais_code_qui on public.essais_code (qui, le);
alter table public.essais_code enable row level security;
revoke all on public.essais_code from anon, authenticated;

create or replace function public.demander_ami(code text) returns text language plpgsql security definer set search_path = '' as $$
declare moi uuid := auth.uid(); cible uuid; inverse text;
begin
  if moi is null then raise exception 'non connecté' using errcode = '42501'; end if;
  if not public.a_acces() then raise exception 'accès réservé' using errcode = '42501'; end if;
  if (select count(*) from public.essais_code where qui = moi and le > now() - interval '1 hour') >= 30 then
    raise exception 'trop d''essais' using errcode = '54000';
  end if;
  select id into cible from public.profils where code_ami = upper(trim(code));
  if cible is null then
    insert into public.essais_code (qui) values (moi);
    delete from public.essais_code where le < now() - interval '1 day';
    return 'inconnu';
  end if;
  if cible = moi then return 'soi'; end if;
  if exists (select 1 from public.blocages where (qui = cible and bloque = moi) or (qui = moi and bloque = cible)) then return 'inconnu'; end if;
  if public.sont_amis(moi, cible) then return 'deja'; end if;
  select statut into inverse from public.amities where demandeur = cible and destinataire = moi;
  if inverse = 'attente' then
    update public.amities set statut = 'acceptee' where demandeur = cible and destinataire = moi;
    perform public.notifier(cible, 'acceptee', moi);
    return 'acceptee';
  end if;
  if exists (select 1 from public.amities where demandeur = moi and destinataire = cible) then return 'envoyee'; end if;
  if (select count(*) from public.amities where demandeur = moi and statut = 'attente') >= 50 then raise exception 'trop de demandes en attente'; end if;
  insert into public.amities (demandeur, destinataire) values (moi, cible);
  perform public.notifier(cible, 'demande', moi);
  return 'envoyee';
end $$;

-- 5b. Défis : forme des épreuves contrôlée, réponse impossible moins de 20 s après la première lecture.
alter table public.defis_amis add column lu_le timestamptz;

create or replace function public.creer_defi(invite uuid, matiere text, equipe smallint, rounds jsonb, score real) returns uuid
language plpgsql security definer set search_path = '' as $$
declare moi uuid := auth.uid(); nouveau uuid;
begin
  if not public.a_acces() then raise exception 'accès réservé' using errcode = '42501'; end if;
  if not public.sont_amis(moi, invite) then raise exception 'pas amis' using errcode = '42501'; end if;
  if jsonb_typeof(rounds) <> 'array' or jsonb_array_length(rounds) not between 1 and 8
     or exists (select 1 from jsonb_array_elements(rounds) r where jsonb_typeof(r) <> 'object' or jsonb_typeof(r->'type') <> 'string') then
    raise exception 'défi mal formé' using errcode = '22023';
  end if;
  if (select count(*) from public.defis_amis d where d.auteur = moi and d.statut = 'ouvert' and d.cree_le > now() - interval '7 days') >= 10 then raise exception 'trop de défis en cours'; end if;
  insert into public.defis_amis (auteur, invite, matiere, equipe, rounds, score_auteur) values (moi, invite, matiere, equipe, rounds, score) returning id into nouveau;
  perform public.notifier(invite, 'defi_recu', moi, jsonb_build_object('defi', nouveau, 'matiere', matiere));
  return nouveau;
end $$;

-- lire_defi note la première lecture par l'invité (elle n'est donc plus « stable »).
create or replace function public.lire_defi(defi uuid) returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare r jsonb;
begin
  update public.defis_amis set lu_le = now() where id = defi and invite = auth.uid() and lu_le is null;
  select jsonb_build_object('id', d.id, 'auteur', d.auteur, 'invite', d.invite, 'matiere', d.matiere, 'equipe', d.equipe, 'rounds', d.rounds,
    'score_auteur', d.score_auteur, 'score_invite', d.score_invite, 'statut', d.statut, 'cree_le', d.cree_le,
    'pseudo_auteur', (select pseudo from public.profils where id = d.auteur))
  into r from public.defis_amis d where d.id = defi and auth.uid() in (d.auteur, d.invite);
  return r;
end $$;

create or replace function public.repondre_defi(defi uuid, score real) returns void language plpgsql security definer set search_path = '' as $$
declare d public.defis_amis;
begin
  update public.defis_amis set score_invite = score, statut = 'joue', joue_le = now()
  where id = defi and invite = auth.uid() and statut = 'ouvert' and cree_le > now() - interval '7 days'
    and lu_le is not null and lu_le < now() - interval '20 seconds'
  returning * into d;
  if d.id is null then raise exception 'défi introuvable, expiré ou joué trop vite'; end if;
  perform public.notifier(d.auteur, 'defi_resultat', d.invite, jsonb_build_object('defi', d.id, 'moi', d.score_auteur, 'lui', d.score_invite));
end $$;

-- 3a. Appareils : adresse d'envoi d'un service connu, reprise par le compte connecté, 10 appareils au plus.
alter table public.appareils add constraint appareils_point_hote check (
  point ~ '^https://([a-z0-9-]+\.)*(push\.apple\.com|googleapis\.com|mozilla\.com|mozaws\.net|notify\.windows\.com)/');

create function public.inscrire_appareil(point text, abonnement jsonb) returns void language plpgsql security definer set search_path = '' as $$
declare moi uuid := auth.uid();
begin
  if moi is null then raise exception 'non connecté' using errcode = '42501'; end if;
  insert into public.appareils (point, proprietaire, abonnement) values (inscrire_appareil.point, moi, inscrire_appareil.abonnement)
  on conflict on constraint appareils_pkey do update set proprietaire = moi, abonnement = excluded.abonnement, cree_le = now();
  delete from public.appareils a where a.proprietaire = moi and a.point not in (
    select b.point from public.appareils b where b.proprietaire = moi order by b.cree_le desc limit 10);
end $$;
revoke all on function public.inscrire_appareil(text, jsonb) from public, anon;
grant execute on function public.inscrire_appareil(text, jsonb) to authenticated;

-- 9a. Suivi d'usage : plafond global horaire, identifiant d'appareil au format attendu, étape « erreur » acceptée.
create or replace function public.noter_evenements(appareil text, lot jsonb) returns void language plpgsql security definer set search_path = '' as $$
declare
  moi uuid := auth.uid();
  e jsonb;
  n int := 0;
  types text[] := array['ouverture','installer_vu','installer_clic','connexion_vue','connexion','matiere','seance_debut','epreuve','seance_fin','seance_quitte','decouverte_suite','ecran','erreur'];
begin
  if appareil is null or appareil !~ '^[0-9a-z-]{8,64}$' or jsonb_typeof(lot) <> 'array' then return; end if;
  -- Garde-fous : 600 événements par appareil et par jour, 20 000 en tout par heure.
  if (select count(*) from public.evenements v where v.appareil = noter_evenements.appareil and v.cree_le > now() - interval '1 day') > 600 then return; end if;
  if (select count(*) from public.evenements v where v.cree_le > now() - interval '1 hour') > 20000 then return; end if;
  for e in select * from jsonb_array_elements(lot) loop
    n := n + 1; exit when n > 40;
    continue when not (e->>'t' = any(types));
    insert into public.evenements (compte, appareil, type, donnees, cree_le)
    values (moi, noter_evenements.appareil, e->>'t', coalesce(e->'d', '{}'::jsonb),
      least(now(), greatest(now() - interval '3 days', coalesce((e->>'q')::timestamptz, now()))));
  end loop;
  if moi is not null then
    update public.evenements v set compte = moi where v.appareil = noter_evenements.appareil and v.compte is null;
  end if;
exception when others then return;
end $$;

-- 9b. Droits de cadeaux réduits à la lecture ; bornes sur les préférences de notification.
revoke all on public.cadeaux from anon, authenticated;
grant select on public.cadeaux to authenticated;
alter table public.profils add constraint profils_notifs_taille check (pg_column_size(notifs) < 2000);
alter table public.profils add constraint profils_rappel_taille check (pg_column_size(rappel) < 2000);

-- 9c. Au plus 20 retours et 20 signalements par heure et par compte.
create function public.borner_envois() returns trigger language plpgsql security definer set search_path = '' as $$
declare n int;
begin
  if tg_table_name = 'retours' then
    select count(*) into n from public.retours where auteur = new.auteur and cree_le > now() - interval '1 hour';
  else
    select count(*) into n from public.signalements where auteur = new.auteur and cree_le > now() - interval '1 hour';
  end if;
  if n >= 20 then raise exception 'trop d''envois, réessaie plus tard' using errcode = '54000'; end if;
  return new;
end $$;
revoke all on function public.borner_envois() from public, anon, authenticated;
create trigger borner_retours before insert on public.retours for each row execute function public.borner_envois();
create trigger borner_signalements before insert on public.signalements for each row execute function public.borner_envois();

-- 9d. Pseudo par défaut des nouveaux comptes : plus jamais tiré de l'adresse e-mail.
create or replace function public.creer_profil() returns trigger language plpgsql security definer set search_path = '' as $$
declare defaut text; quota int; testeurs int; statut text;
begin
  perform pg_advisory_xact_lock(424242);
  select valeur into defaut from public.reglage where cle = 'acces_nouveaux';
  select coalesce(valeur::int, 0) into quota from public.reglage where cle = 'quota_testeurs';
  select count(*) into testeurs from public.profils where acces = 'testeur';
  statut := coalesce(defaut, 'aucun');
  if statut = 'testeur' and quota is not null and testeurs >= quota then statut := 'aucun'; end if;
  insert into public.profils (id, pseudo, acces)
  values (new.id, left(coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name',
            'Étudiant ' || upper(substr(md5(new.id::text), 1, 4))), 40), statut)
  on conflict (id) do nothing;
  return new;
end $$;
