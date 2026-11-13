-- Point expiry on the next purchase (issue #22, finishing #21).
-- Rules: docs/program-rules.md (Points, The rail and laps).
--
-- Points expire 6 months after the member's last purchase, and expiry
-- returns Gustav to Start. The expiry row is written with the purchase that
-- comes after the 6 months, in the same transaction as its earn row, so the
-- purchase earns from 0. src/lib/purchases.ts works out whether the points
-- expired; this function only stores it.
--
-- Once Gustav is back at Start, the stops of the same lap open their perks
-- again (except the one-time 150 stop). perks.restart counts the member's
-- expiry rows when the perk opened, and the one-per-stop-per-lap index now
-- includes it.

-- =====================================================================
-- perks.restart
-- =====================================================================
alter table public.perks
  add column restart integer not null default 0 check (restart >= 0);

comment on column public.perks.restart is
  'Rail perks: how many times the member''s points had expired when it opened. A stop opens once per lap and restart.';

drop index public.perks_one_per_stop_per_lap;

-- A stop opens its perk once per lap, and again after the points expire.
create unique index perks_one_per_stop_per_lap
  on public.perks (member_id, stop_at, lap, restart) where source = 'rail';

-- =====================================================================
-- record_purchase_points, with the expiry row. The two new arguments have
-- defaults, so a call without an expiry looks as before.
-- =====================================================================
drop function public.record_purchase_points(uuid, bigint, integer, jsonb);

create function public.record_purchase_points(
  p_member_id     uuid,
  p_purchase_id   bigint,
  p_points        integer,
  p_perks         jsonb,
  p_expiry_points integer default null,     -- minus the expired lap points, or null
  p_expired_at    timestamptz default null  -- when they expired
)
returns jsonb
language plpgsql
set search_path = ''
as $$
declare
  v_ledger_id bigint;
  v_opened    integer[];
  v_restart   integer;
  v_lap_points integer;
begin
  if not exists (
    select 1 from public.purchases where id = p_purchase_id and member_id = p_member_id
  ) then
    raise exception 'purchase % does not belong to member %', p_purchase_id, p_member_id;
  end if;
  if (p_expiry_points is null) <> (p_expired_at is null) or p_expiry_points >= 0 then
    raise exception 'an expiry needs negative points and a time';
  end if;

  -- One purchase at a time per member, so the points read below stay true.
  perform 1 from public.members where id = p_member_id for update;

  -- Already recorded: write nothing, not even the expiry.
  if exists (select 1 from public.points_ledger where purchase_id = p_purchase_id) then
    return jsonb_build_object('applied', false, 'opened_stops', '[]'::jsonb);
  end if;

  if p_expiry_points is not null then
    select coalesce(sum(points), 0) % 400 into v_lap_points
    from public.points_ledger where member_id = p_member_id;
    -- 400 is the last rail stop. The caller read the lap points before this
    -- transaction; if they changed since, expiring them now would be wrong.
    if v_lap_points <> -p_expiry_points then
      raise exception 'the lap points changed from % to % before the expiry was written', -p_expiry_points, v_lap_points;
    end if;

    insert into public.points_ledger (member_id, kind, points, created_at)
    values (p_member_id, 'expiry', p_expiry_points, p_expired_at);
  end if;

  insert into public.points_ledger (member_id, purchase_id, kind, points)
  values (p_member_id, p_purchase_id, 'earn', p_points)
  on conflict (purchase_id) do nothing
  returning id into v_ledger_id;

  if v_ledger_id is null then
    raise exception 'purchase % got its points while this call was running', p_purchase_id;
  end if;

  select count(*) into v_restart
  from public.points_ledger where member_id = p_member_id and kind = 'expiry';

  with opened as (
    insert into public.perks (member_id, source, stop_at, lap, restart, opened_at, expires_at, choose_by, code)
    select
      p_member_id,
      'rail',
      (perk ->> 'stop_at')::integer,
      (perk ->> 'lap')::integer,
      v_restart,
      (perk ->> 'opened_at')::timestamptz,
      (perk ->> 'expires_at')::timestamptz,
      (perk ->> 'choose_by')::timestamptz,
      perk ->> 'code'
    from jsonb_array_elements(coalesce(p_perks, '[]'::jsonb)) as perk
    -- perks_one_per_stop_per_lap and perks_stop_150_once
    on conflict do nothing
    returning stop_at
  )
  select coalesce(array_agg(stop_at order by stop_at), '{}') into v_opened from opened;

  return jsonb_build_object('applied', true, 'opened_stops', to_jsonb(v_opened));
end;
$$;

revoke execute on function public.record_purchase_points(uuid, bigint, integer, jsonb, integer, timestamptz)
  from public, anon, authenticated;
grant execute on function public.record_purchase_points(uuid, bigint, integer, jsonb, integer, timestamptz)
  to service_role;
