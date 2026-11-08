-- Writes a purchase's points and opened perks in one transaction (issue #11).
-- The points engine (src/lib/points.ts) works out the points and perks; this
-- function only stores them, so a half-written purchase cannot happen.
--
-- Safe to retry: points_ledger.purchase_id is unique, so a second call for
-- the same purchase writes nothing and returns applied = false. A perk whose
-- stop is already open on that lap, or stop 150 a second time, is skipped.
--
-- Only the server (service_role, via SUPABASE_SECRET_KEY) may call it.

create function public.record_purchase_points(
  p_member_id   uuid,
  p_purchase_id bigint,
  p_points      integer,
  p_perks       jsonb
)
returns jsonb
language plpgsql
set search_path = ''
as $$
declare
  v_ledger_id bigint;
  v_opened    integer[];
begin
  if not exists (
    select 1 from public.purchases where id = p_purchase_id and member_id = p_member_id
  ) then
    raise exception 'purchase % does not belong to member %', p_purchase_id, p_member_id;
  end if;

  insert into public.points_ledger (member_id, purchase_id, kind, points)
  values (p_member_id, p_purchase_id, 'earn', p_points)
  on conflict (purchase_id) do nothing
  returning id into v_ledger_id;

  if v_ledger_id is null then
    return jsonb_build_object('applied', false, 'opened_stops', '[]'::jsonb);
  end if;

  with opened as (
    insert into public.perks (member_id, source, stop_at, lap, opened_at, expires_at, choose_by)
    select
      p_member_id,
      'rail',
      (perk ->> 'stop_at')::integer,
      (perk ->> 'lap')::integer,
      (perk ->> 'opened_at')::timestamptz,
      (perk ->> 'expires_at')::timestamptz,
      (perk ->> 'choose_by')::timestamptz
    from jsonb_array_elements(coalesce(p_perks, '[]'::jsonb)) as perk
    -- perks_one_per_stop_per_lap and perks_stop_150_once
    on conflict do nothing
    returning stop_at
  )
  select coalesce(array_agg(stop_at order by stop_at), '{}') into v_opened from opened;

  return jsonb_build_object('applied', true, 'opened_stops', to_jsonb(v_opened));
end;
$$;

revoke execute on function public.record_purchase_points(uuid, bigint, integer, jsonb) from public, anon, authenticated;
grant execute on function public.record_purchase_points(uuid, bigint, integer, jsonb) to service_role;
