-- Lot E du cahier n° 4 : le classement de la semaine entre amis, figé le lundi à 0 h 05 (Paris),
-- annoncé à 9 h par la fonction rappel, et lisible dans l'appli par mon_classement().
-- Proposé le 15/11/2026, à valider par Gaspard (texte et heure de la notification compris).

create table public.classements (
  semaine int not null,          -- jour (jours depuis 1970, heure de Paris) du lundi de la semaine classée, comme lundi() dans l'appli
  compte uuid not null references auth.users on delete cascade,
  rang int not null check (rang >= 1),
  sur int not null check (sur >= 2),
  xp int not null check (xp >= 0),
  podium jsonb not null,         -- [{ pseudo, xp, moi }] : les trois premiers
  notifie_le timestamptz,
  primary key (semaine, compte)
);
alter table public.classements enable row level security;
create policy "son classement" on public.classements for select to authenticated using (compte = (select auth.uid()));
revoke all on public.classements from anon, authenticated;
grant select on public.classements to authenticated;

-- Fige la semaine écoulée : pour chaque compte qui a au moins un ami, son rang parmi lui et ses amis visibles.
create function public.figer_classement() returns int language plpgsql security definer set search_path = '' as $$
declare
  aujourdhui int := ((now() at time zone 'Europe/Paris')::date - date '1970-01-01');
  semaine_passee int := aujourdhui - (extract(isodow from (now() at time zone 'Europe/Paris'))::int - 1) - 7;
  n int;
begin
  with xp as (
    select p.id, p.pseudo, p.masquer,
      case when (g.resume->>'semaine')::int = semaine_passee then coalesce((g.resume->>'xpSemaine')::int, 0) else 0 end as xp
    from public.profils p left join public.progressions g on g.id = p.id
  ),
  bandes as (
    -- chaque compte avec lui-même et ses amis acceptés
    select m.demandeur as moi, m.demandeur as membre from public.amities m where m.statut = 'acceptee'
    union select m.destinataire, m.destinataire from public.amities m where m.statut = 'acceptee'
    union select m.demandeur, m.destinataire from public.amities m where m.statut = 'acceptee'
    union select m.destinataire, m.demandeur from public.amities m where m.statut = 'acceptee'
  ),
  scores as (
    select b.moi, b.membre, x.pseudo, x.xp
    from bandes b join xp x on x.id = b.membre
    where b.membre = b.moi or not coalesce(x.masquer, false)
  ),
  ranges as (
    select s.*, rank() over (partition by s.moi order by s.xp desc) as rang, count(*) over (partition by s.moi) as sur
    from scores s
  )
  insert into public.classements (semaine, compte, rang, sur, xp, podium)
  select semaine_passee, r.moi, r.rang, r.sur, r.xp,
    (select jsonb_agg(jsonb_build_object('pseudo', coalesce(t.pseudo, 'Un ami'), 'xp', t.xp, 'moi', t.membre = r.moi) order by t.rang, t.pseudo)
       from ranges t where t.moi = r.moi and t.rang <= 3)
  from ranges r
  where r.membre = r.moi and r.sur >= 2
    and exists (select 1 from ranges t where t.moi = r.moi and t.xp > 0)
  on conflict (semaine, compte) do nothing;
  get diagnostics n = row_count;
  delete from public.classements where semaine < semaine_passee - 56;
  return n;
end $$;
revoke all on function public.figer_classement() from public, anon, authenticated;

-- Pour l'appli : le classement de la dernière semaine figée, s'il existe.
create function public.mon_classement() returns jsonb language sql stable security definer set search_path = '' as $$
  select to_jsonb(c) - 'compte' - 'notifie_le' from public.classements c
  where c.compte = auth.uid() order by c.semaine desc limit 1;
$$;
revoke all on function public.mon_classement() from public, anon;
grant execute on function public.mon_classement() to authenticated;

select cron.schedule('classement-semaine', '5 23 * * 0', $c$ select public.figer_classement(); $c$);
-- 23 h 05 UTC le dimanche = 0 h 05 le lundi à Paris en hiver (1 h 05 en été : sans conséquence).
