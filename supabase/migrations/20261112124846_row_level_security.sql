-- Row-level security policies (issue #6).
-- RLS has been on for every table since the schema migration, with no
-- policies, so nobody could read anything through the public key.
--
-- These policies only allow reading:
--   * a signed-in member reads their own rows in the member tables;
--   * anyone, signed in or not, reads the general program and shop data.
-- There are no insert, update or delete policies. Every change goes through
-- the server's secret key (service_role), which bypasses RLS.
--
-- The member_points view uses security_invoker, so it follows these policies
-- and each member sees only their own points.
--
-- (select auth.uid()) is wrapped in a select so Postgres evaluates it once
-- per query instead of once per row.

-- =====================================================================
-- Member data: a signed-in member reads only their own rows
-- =====================================================================
create policy "Members read their own row"
  on public.members for select
  to authenticated
  using (id = (select auth.uid()));

create policy "Members read their own purchases"
  on public.purchases for select
  to authenticated
  using (member_id = (select auth.uid()));

create policy "Members read their own ledger rows"
  on public.points_ledger for select
  to authenticated
  using (member_id = (select auth.uid()));

create policy "Members read their own perks"
  on public.perks for select
  to authenticated
  using (member_id = (select auth.uid()));

create policy "Members read their own gift cards"
  on public.gift_cards for select
  to authenticated
  using (member_id = (select auth.uid()));

create policy "Members read their own donations"
  on public.donations for select
  to authenticated
  using (member_id = (select auth.uid()));

-- Marking a message as read also goes through the server (#15).
create policy "Members read their own messages"
  on public.messages for select
  to authenticated
  using (member_id = (select auth.uid()));

-- =====================================================================
-- General program and shop data: anyone may read it
-- =====================================================================
create policy "Anyone reads the rail stops"
  on public.rail_stops for select
  to anon, authenticated
  using (true);

create policy "Anyone reads books"
  on public.books for select
  to anon, authenticated
  using (true);

create policy "Anyone reads authors"
  on public.authors for select
  to anon, authenticated
  using (true);

create policy "Anyone reads name days"
  on public.name_days for select
  to anon, authenticated
  using (true);

-- settings is public: never store secrets or personal data in it.
create policy "Anyone reads settings"
  on public.settings for select
  to anon, authenticated
  using (true);

comment on table public.settings is
  'Public program settings, readable by anyone. Never store secrets or personal data here.';
