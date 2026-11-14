-- Dépôts de cours (page gdroit.eu/partager.html) et rappel du vendredi. Validé par Gaspard le 14/11/2026.

-- 1. Les fichiers : un dossier par compte, privé. Seul l'administrateur peut les lire.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('depots', 'depots', false, 20971520,
  array['image/jpeg','image/png','image/heic','image/heif','image/webp','application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document']);

create policy "deposer dans son dossier" on storage.objects for insert to authenticated
  with check (bucket_id = 'depots' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "admin lit les depots" on storage.objects for select to authenticated
  using (bucket_id = 'depots' and public.est_admin());

-- 2. Le dépôt lui-même : matière, groupe, fichiers, accord d'utilisation obligatoire.
create table public.depots (
  id bigint generated always as identity primary key,
  auteur uuid not null default auth.uid() references auth.users on delete cascade,
  annee text not null check (annee in ('L1','L2','L3','autre')),
  matiere text not null check (char_length(matiere) between 2 and 80),
  equipe text check (char_length(equipe) <= 30),
  fichiers text[] not null check (cardinality(fichiers) between 1 and 10),
  accord boolean not null check (accord),
  cree_le timestamptz not null default now(),
  envoye_le timestamptz,
  retenu boolean
);
alter table public.depots enable row level security;
create policy "deposer" on public.depots for insert to authenticated with check (auteur = (select auth.uid()));
create policy "voir ses depots" on public.depots for select to authenticated using (auteur = (select auth.uid()));
revoke all on public.depots from anon, authenticated;
grant select on public.depots to authenticated;
grant insert (annee, matiere, equipe, fichiers, accord) on public.depots to authenticated;

-- Au plus 10 dépôts par jour et par compte ; les chemins doivent être dans le dossier du compte.
create function public.borner_depot() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if (select count(*) from public.depots where auteur = new.auteur and cree_le > now() - interval '1 day') >= 10 then
    raise exception 'trop de depots' using errcode = '54000';
  end if;
  if exists (select 1 from unnest(new.fichiers) f where f not like new.auteur::text || '/%') then
    raise exception 'chemin invalide' using errcode = '22023';
  end if;
  return new;
end $$;
create trigger borner_depot before insert on public.depots for each row execute function public.borner_depot();

-- 3. Le rappel du vendredi, coché dans le formulaire : par e-mail, pour la matière et le groupe donnés.
create table public.contributeurs (
  id uuid primary key default auth.uid() references auth.users on delete cascade,
  rappel boolean not null default true,
  annee text check (annee in ('L1','L2','L3','autre')),
  matiere text check (char_length(matiere) <= 80),
  equipe text check (char_length(equipe) <= 30),
  jeton uuid not null default gen_random_uuid() unique,
  maj timestamptz not null default now()
);
alter table public.contributeurs enable row level security;
create policy "son rappel" on public.contributeurs for all to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));
revoke all on public.contributeurs from anon, authenticated;
grant select on public.contributeurs to authenticated;
grant insert (rappel, annee, matiere, equipe), update (rappel, annee, matiere, equipe, maj) on public.contributeurs to authenticated;

-- Lien « ne plus recevoir ce rappel » des e-mails : il marche sans être connecté, avec le jeton propre au destinataire.
create function public.arreter_rappel_cours(jeton uuid) returns boolean language sql security definer set search_path = '' as $$
  update public.contributeurs set rappel = false, maj = now() where contributeurs.jeton = arreter_rappel_cours.jeton returning true;
$$;
revoke all on function public.arreter_rappel_cours(uuid) from public;
grant execute on function public.arreter_rappel_cours(uuid) to anon, authenticated;

-- 4. Les deux envois automatiques (heure de Paris en hiver) : rappel le vendredi 17 h 30, récapitulatif le samedi 1 h 30.
select cron.schedule('cours-rappel', '30 16 * * 5', $c$
  select net.http_post(url := 'https://jhpgxisxayceixmppxuu.supabase.co/functions/v1/cours',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-rappel', (select valeur from public.reglage where cle = 'jeton_rappel')),
    body := '{"mode":"rappel"}'::jsonb, timeout_milliseconds := 60000);
$c$);
select cron.schedule('cours-recap', '30 0 * * 6', $c$
  select net.http_post(url := 'https://jhpgxisxayceixmppxuu.supabase.co/functions/v1/cours',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-rappel', (select valeur from public.reglage where cle = 'jeton_rappel')),
    body := '{"mode":"recap"}'::jsonb, timeout_milliseconds := 120000);
$c$);

-- 5. Appliqué ensuite : la fonction du déclencheur n'est pas appelable par l'API.
revoke all on function public.borner_depot() from public, anon, authenticated;
