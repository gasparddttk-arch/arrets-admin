-- Lot 4a de l'audit : date de mise à jour posée par la base, résumé visible des amis borné.
-- Proposé le 15/11/2026, prévu le mardi 17/11, à valider par Gaspard.
-- Valeurs actuelles les plus hautes (15/11) : xpSemaine 1 788, xp 3 703, grade 17 caractères, résumé 408 octets.
create function public.controler_progression() returns trigger language plpgsql set search_path = '' as $$
declare r jsonb := new.resume; k text; v jsonb;
begin
  new.maj := now();
  if r is null then return new; end if;
  if jsonb_typeof(r) <> 'object' then raise exception 'résumé invalide' using errcode = '22023'; end if;
  for k, v in select * from jsonb_each(r) loop
    if jsonb_typeof(v) = 'string' and char_length(v #>> '{}') > 60 then raise exception 'résumé invalide (%)', k using errcode = '22023'; end if;
    if jsonb_typeof(v) = 'number' and ((v #>> '{}')::numeric < 0 or (v #>> '{}')::numeric > 10000000) then raise exception 'résumé invalide (%)', k using errcode = '22023'; end if;
    if jsonb_typeof(v) in ('object', 'array') and pg_column_size(v) > 400 then raise exception 'résumé invalide (%)', k using errcode = '22023'; end if;
  end loop;
  if coalesce((r->>'xpSemaine')::numeric, 0) > 30000 or coalesce((r->>'serie')::numeric, 0) > 3650 then
    raise exception 'résumé invalide' using errcode = '22023';
  end if;
  return new;
end $$;
create trigger controler_progression before insert or update on public.progressions for each row execute function public.controler_progression();

-- Appliqué le 15/11/2026 à 0 h 25 (migration audit_lot_4a), avec en plus : revoke all on function public.controler_progression() from public, anon, authenticated;
