-- Row-level security test (issue #6). Run with: npm run test:db
-- (needs Docker and the local Supabase server: npx supabase start).
--
-- Creates two members, A and B, then reads and writes as A, as B and as a
-- visitor who is not signed in. Everything runs in one transaction that is
-- rolled back at the end, so the database is left as it was.

begin;
create extension if not exists pgtap with schema extensions;
select plan(50);

-- ---------------------------------------------------------------------
-- Test data, written as the database owner (RLS does not apply)
-- ---------------------------------------------------------------------
insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'rls-a@example.com'),
  ('22222222-2222-2222-2222-222222222222', 'rls-b@example.com');

insert into public.members (id, first_name) values
  ('11111111-1111-1111-1111-111111111111', 'Test A'),
  ('22222222-2222-2222-2222-222222222222', 'Test B');

insert into public.rail_stops (at, reward, type) values
  (50, 'Tasuta kuum jook', 'direct'),
  (100, '5 € kinkekaart või annetus', 'prize_choice')
on conflict (at) do nothing;

insert into public.authors (first_name, last_name) values ('Rls', 'Test');
insert into public.books (slug, title, author_id, price, cover)
  select 'rls-test-book', 'RLS test', id, 10, 'teal' from public.authors where last_name = 'Test' and first_name = 'Rls';
insert into public.name_days (name, month, day) values ('Rls', 1, 1) on conflict do nothing;
insert into public.settings (key, value) values ('rls_test', 'x') on conflict (key) do nothing;

insert into public.purchases (member_id, channel, amount_paid, external_ref) values
  ('11111111-1111-1111-1111-111111111111', 'store', 10, 'rls-a'),
  ('22222222-2222-2222-2222-222222222222', 'store', 20, 'rls-b');

insert into public.points_ledger (member_id, purchase_id, kind, points)
  select member_id, id, 'earn', floor(amount_paid)::int from public.purchases where external_ref in ('rls-a', 'rls-b');

-- Per member: a rail perk (for the gift card), a birthday perk (for the
-- donation) and a spare perk at stop 100.
insert into public.perks (member_id, source, stop_at, lap, birthday_year, expires_at)
  select m.id, p.source, p.stop_at, p.lap, p.birthday_year, now() + interval '60 days'
  from public.members m
  cross join (values
    ('rail', 50, 1, null::integer),
    ('birthday', null, null, 2026),
    ('rail', 100, 1, null)
  ) as p (source, stop_at, lap, birthday_year)
  where m.id in ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222');

insert into public.gift_cards (member_id, perk_id, code, valid_until)
  select member_id, id, 'RLS-' || left(member_id::text, 1), now() + interval '60 days'
  from public.perks where stop_at = 50 and member_id in ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222');

insert into public.donations (member_id, perk_id, school)
  select member_id, id, 'Näidiskooli'
  from public.perks where source = 'birthday' and member_id in ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222');

insert into public.messages (member_id, kind, title, body, event_key) values
  ('11111111-1111-1111-1111-111111111111', 'order', 'Tellimus', 'Tekst', 'rls-a'),
  ('22222222-2222-2222-2222-222222222222', 'order', 'Tellimus', 'Tekst', 'rls-b');

-- ---------------------------------------------------------------------
-- 1) Signed in as A: only A's rows
-- ---------------------------------------------------------------------
set local role authenticated;
select set_config('request.jwt.claims', '{"sub": "11111111-1111-1111-1111-111111111111", "role": "authenticated"}', true);

select is((select count(*) from public.members), 1::bigint, 'A sees exactly one member row');
select is((select id from public.members), '11111111-1111-1111-1111-111111111111'::uuid, 'and it is A''s own row');

select ok((select count(*) from public.purchases where member_id = '11111111-1111-1111-1111-111111111111') > 0, 'A sees own purchases');
select is((select count(*) from public.purchases where member_id <> '11111111-1111-1111-1111-111111111111'), 0::bigint, 'A sees no other member''s purchases');
select ok((select count(*) from public.points_ledger where member_id = '11111111-1111-1111-1111-111111111111') > 0, 'A sees own ledger rows');
select is((select count(*) from public.points_ledger where member_id <> '11111111-1111-1111-1111-111111111111'), 0::bigint, 'A sees no other member''s ledger rows');
select ok((select count(*) from public.perks where member_id = '11111111-1111-1111-1111-111111111111') > 0, 'A sees own perks');
select is((select count(*) from public.perks where member_id <> '11111111-1111-1111-1111-111111111111'), 0::bigint, 'A sees no other member''s perks');
select ok((select count(*) from public.gift_cards where member_id = '11111111-1111-1111-1111-111111111111') > 0, 'A sees own gift cards');
select is((select count(*) from public.gift_cards where member_id <> '11111111-1111-1111-1111-111111111111'), 0::bigint, 'A sees no other member''s gift cards');
select ok((select count(*) from public.donations where member_id = '11111111-1111-1111-1111-111111111111') > 0, 'A sees own donations');
select is((select count(*) from public.donations where member_id <> '11111111-1111-1111-1111-111111111111'), 0::bigint, 'A sees no other member''s donations');
select ok((select count(*) from public.messages where member_id = '11111111-1111-1111-1111-111111111111') > 0, 'A sees own messages');
select is((select count(*) from public.messages where member_id <> '11111111-1111-1111-1111-111111111111'), 0::bigint, 'A sees no other member''s messages');

select is((select count(*) from public.member_points), 1::bigint, 'A sees one row in member_points');
select is((select member_id from public.member_points), '11111111-1111-1111-1111-111111111111'::uuid, 'and it is A''s own points');

-- ---------------------------------------------------------------------
-- 2) Signed in as B: only B's rows
-- ---------------------------------------------------------------------
select set_config('request.jwt.claims', '{"sub": "22222222-2222-2222-2222-222222222222", "role": "authenticated"}', true);

select is((select count(*) from public.members), 1::bigint, 'B sees exactly one member row');
select is((select id from public.members), '22222222-2222-2222-2222-222222222222'::uuid, 'and it is B''s own row');
select is((select count(*) from public.purchases where member_id <> '22222222-2222-2222-2222-222222222222'), 0::bigint, 'B sees no other member''s purchases');
select is((select count(*) from public.points_ledger where member_id <> '22222222-2222-2222-2222-222222222222'), 0::bigint, 'B sees no other member''s ledger rows');
select is((select count(*) from public.perks where member_id <> '22222222-2222-2222-2222-222222222222'), 0::bigint, 'B sees no other member''s perks');
select is((select count(*) from public.gift_cards where member_id <> '22222222-2222-2222-2222-222222222222'), 0::bigint, 'B sees no other member''s gift cards');
select is((select count(*) from public.donations where member_id <> '22222222-2222-2222-2222-222222222222'), 0::bigint, 'B sees no other member''s donations');
select is((select count(*) from public.messages where member_id <> '22222222-2222-2222-2222-222222222222'), 0::bigint, 'B sees no other member''s messages');
select is((select member_id from public.member_points), '22222222-2222-2222-2222-222222222222'::uuid, 'B sees only B''s points');

-- ---------------------------------------------------------------------
-- 3) Not signed in: no member data, but the general data
-- ---------------------------------------------------------------------
set local role anon;
select set_config('request.jwt.claims', '{"role": "anon"}', true);

select is((select count(*) from public.members), 0::bigint, 'A visitor sees no members');
select is((select count(*) from public.purchases), 0::bigint, 'A visitor sees no purchases');
select is((select count(*) from public.points_ledger), 0::bigint, 'A visitor sees no ledger rows');
select is((select count(*) from public.perks), 0::bigint, 'A visitor sees no perks');
select is((select count(*) from public.gift_cards), 0::bigint, 'A visitor sees no gift cards');
select is((select count(*) from public.donations), 0::bigint, 'A visitor sees no donations');
select is((select count(*) from public.messages), 0::bigint, 'A visitor sees no messages');
select is((select count(*) from public.member_points), 0::bigint, 'A visitor sees no points');

select ok((select count(*) from public.rail_stops) > 0, 'A visitor can read the rail stops');
select ok((select count(*) from public.books) > 0, 'A visitor can read books');
select ok((select count(*) from public.authors) > 0, 'A visitor can read authors');
select ok((select count(*) from public.name_days) > 0, 'A visitor can read name days');
select ok((select count(*) from public.settings) > 0, 'A visitor can read settings');

select throws_ok(
  $$insert into public.books (slug, title, author_id, price, cover) select 'rls-visitor', 'X', id, 1, 'teal' from public.authors limit 1$$,
  '42501', null, 'A visitor cannot add a book');

-- ---------------------------------------------------------------------
-- 4) Signed in as A: no changes allowed, not even to A's own data
-- ---------------------------------------------------------------------
set local role authenticated;
select set_config('request.jwt.claims', '{"sub": "11111111-1111-1111-1111-111111111111", "role": "authenticated"}', true);

select throws_ok(
  $$insert into public.points_ledger (member_id, kind, points) values ('11111111-1111-1111-1111-111111111111', 'expiry', 0)$$,
  '42501', null, 'A cannot add a ledger row');
select throws_ok(
  $$insert into public.perks (member_id, source, stop_at, lap, expires_at) values ('11111111-1111-1111-1111-111111111111', 'rail', 50, 2, now())$$,
  '42501', null, 'A cannot add a perk');
select throws_ok(
  $$insert into public.gift_cards (member_id, perk_id, code, valid_until)
    select member_id, id, 'RLS-NEW', now() from public.perks where member_id = '11111111-1111-1111-1111-111111111111' and stop_at = 100$$,
  '42501', null, 'A cannot add a gift card');
select throws_ok(
  $$insert into public.messages (member_id, kind, title, body, event_key) values ('11111111-1111-1111-1111-111111111111', 'order', 'X', 'X', 'rls-new')$$,
  '42501', null, 'A cannot add a message');

select lives_ok($$update public.members set first_name = 'Changed' where id = '11111111-1111-1111-1111-111111111111'$$, 'Updating own member row runs');
select is((select first_name from public.members), 'Test A', 'but A''s member row is unchanged');

select lives_ok($$update public.messages set read_at = now()$$, 'Marking messages read runs');
select ok((select bool_and(read_at is null) from public.messages), 'but A''s messages stay unread (the server marks them)');

select lives_ok($$delete from public.purchases$$, 'Deleting purchases runs');
select ok((select count(*) from public.purchases) > 0, 'but A''s purchases are still there');

select throws_ok(
  $$select public.record_purchase_points('11111111-1111-1111-1111-111111111111', 1, 1, '[]'::jsonb)$$,
  '42501', null, 'A cannot run the server-only points function');

select * from finish();
rollback;
