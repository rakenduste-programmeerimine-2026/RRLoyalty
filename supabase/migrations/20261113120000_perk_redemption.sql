-- Perk redemption (issue #14). Rules: docs/program-rules.md (Perks).
-- The rules themselves are in src/lib/perks.ts; these functions only store
-- their result, so that a perk can never be used twice.
--
-- Only the server (service_role, via SUPABASE_SECRET_KEY) may call them.

-- =====================================================================
-- record_purchase_points: now also stores each opened perk's code, so stop
-- 150 ("Äpp 5 € (uutele)") opens with the code it is shown with. Otherwise
-- unchanged from 20261108174000_record_purchase_points.sql.
-- =====================================================================
create or replace function public.record_purchase_points(
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
    insert into public.perks (member_id, source, stop_at, lap, opened_at, expires_at, choose_by, code)
    select
      p_member_id,
      'rail',
      (perk ->> 'stop_at')::integer,
      (perk ->> 'lap')::integer,
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

-- =====================================================================
-- give_prize: saves a prize stop's outcome, a gift card or a donation, in
-- one transaction. The perk's choice is set only while it has none, so of
-- two calls for the same perk (a double tap, or the member's choice racing
-- the automatic gift card) exactly one wins and the other returns false.
-- A donation spends the perk at once.
-- =====================================================================
create function public.give_prize(
  p_member_id   uuid,
  p_perk_id     bigint,
  p_choice      text,
  p_at          timestamptz,
  p_code        text,
  p_valid_until timestamptz,
  p_school      text
)
returns boolean
language plpgsql
set search_path = ''
as $$
begin
  if p_choice not in ('gift_card', 'donation') then
    raise exception 'a prize is a gift_card or a donation, got %', p_choice;
  end if;

  -- The row lock taken here makes a second call wait, then find a choice.
  update public.perks
  set choice = p_choice,
      redeemed_at = case when p_choice = 'donation' then p_at end
  where id = p_perk_id
    and member_id = p_member_id
    and source = 'rail'
    and choose_by is not null
    and choice is null
    and redeemed_at is null;

  if not found then
    return false;
  end if;

  if p_choice = 'gift_card' then
    insert into public.gift_cards (member_id, perk_id, code, valid_until, created_at)
    values (p_member_id, p_perk_id, p_code, p_valid_until, p_at);
  else
    insert into public.donations (member_id, perk_id, school, created_at)
    values (p_member_id, p_perk_id, p_school, p_at);
  end if;

  return true;
end;
$$;

revoke execute on function public.give_prize(uuid, bigint, text, timestamptz, text, timestamptz, text)
  from public, anon, authenticated;
grant execute on function public.give_prize(uuid, bigint, text, timestamptz, text, timestamptz, text)
  to service_role;

-- =====================================================================
-- redeem_perk: "Märgi kasutatuks". Sets redeemed_at only while it is empty,
-- so a perk is spent once. Stop 50's option (hot_drink or app_week) and the
-- app week's code are saved in the same step, and only while no option is set.
-- =====================================================================
create function public.redeem_perk(
  p_member_id uuid,
  p_perk_id   bigint,
  p_at        timestamptz,
  p_choice    text,
  p_code      text
)
returns boolean
language plpgsql
set search_path = ''
as $$
begin
  if p_choice is not null and p_choice not in ('hot_drink', 'app_week') then
    raise exception 'only stop 50 takes an option when spent, got %', p_choice;
  end if;

  update public.perks
  set redeemed_at = p_at,
      choice = coalesce(p_choice, choice),
      code = coalesce(p_code, code)
  where id = p_perk_id
    and member_id = p_member_id
    and redeemed_at is null
    and (p_choice is null or choice is null);

  return found;
end;
$$;

revoke execute on function public.redeem_perk(uuid, bigint, timestamptz, text, text)
  from public, anon, authenticated;
grant execute on function public.redeem_perk(uuid, bigint, timestamptz, text, text)
  to service_role;
