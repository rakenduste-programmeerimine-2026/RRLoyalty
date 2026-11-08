-- Gustavi rada loyalty schema (issue #5).
-- Rules: docs/program-rules.md. Seed data comes in #7, access rules (RLS policies) in #6.

-- =====================================================================
-- Members
-- One row per signed-up member. The id is the Supabase Auth user id (#9).
-- Laps completed, last purchase and point totals are not stored here:
-- they are calculated in the member_points view at the end of this file.
-- =====================================================================
create table public.members (
  id           uuid primary key references auth.users (id) on delete cascade,
  first_name   text not null,          -- used for name-day matching
  last_name    text,
  birthday     date,
  phone        text,
  member_since date not null default current_date,  -- "Klubiliige alates"
  card_number  text unique,            -- shown on the simulated wallet card
  created_at   timestamptz not null default now()
);

-- =====================================================================
-- Purchases, from every sales channel (all simulated in the prototype).
-- external_ref is unique, so the same purchase cannot be recorded twice (#11).
-- =====================================================================
create table public.purchases (
  id           bigint generated always as identity primary key,
  member_id    uuid not null references public.members (id) on delete cascade,
  channel      text not null check (channel in ('e_shop', 'store', 'literaat', 'app')),
  location     text,                   -- e.g. "Viru Keskus", "Telliskivi"
  amount_paid  numeric(10, 2) not null check (amount_paid >= 0),  -- after discounts
  external_ref text not null unique,
  order_number text,
  status       text not null default 'processing'
               check (status in ('processing', 'delivered', 'in_store')),
  purchased_at timestamptz not null default now()
);

create index purchases_member_id_idx on public.purchases (member_id);

-- =====================================================================
-- Points ledger: append-only. Rows are only ever added, never changed.
--   earn   = points from one purchase (1 per euro, rounded down)
--   expiry = minus the member's current lap points, when they expire
-- Totals are calculated from these rows in the member_points view.
-- =====================================================================
create table public.points_ledger (
  id          bigint generated always as identity primary key,
  member_id   uuid not null references public.members (id),
  purchase_id bigint unique references public.purchases (id),  -- one earn row per purchase
  kind        text not null check (kind in ('earn', 'expiry')),
  points      integer not null,
  created_at  timestamptz not null default now(),
  constraint points_ledger_earn_check
    check (kind <> 'earn' or (points >= 0 and purchase_id is not null)),
  constraint points_ledger_expiry_check
    check (kind <> 'expiry' or (points <= 0 and purchase_id is null))
);

create index points_ledger_member_id_idx on public.points_ledger (member_id);

create function public.points_ledger_append_only()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'points_ledger is append-only: rows cannot be updated or deleted';
end;
$$;

create trigger points_ledger_no_update_or_delete
  before update or delete on public.points_ledger
  for each row execute function public.points_ledger_append_only();

-- =====================================================================
-- Rail stops: the 8 stops of one lap. The rows themselves are seeded in #7.
-- =====================================================================
create table public.rail_stops (
  at     integer primary key check (at between 50 and 400 and at % 50 = 0),
  reward text not null,
  type   text not null check (type in ('direct', 'prize_choice', 'code_once'))
);

-- =====================================================================
-- Perks: opened at a rail stop or given for a birthday. Last 60 days.
-- choice: hot_drink / app_week for the 50 stop,
--         gift_card / donation for the prize stops (100, 200, 300, 400).
-- =====================================================================
create table public.perks (
  id            bigint generated always as identity primary key,
  member_id     uuid not null references public.members (id) on delete cascade,
  source        text not null check (source in ('rail', 'birthday')),
  stop_at       integer references public.rail_stops (at),
  lap           integer check (lap >= 1),
  birthday_year integer,
  opened_at     timestamptz not null default now(),
  expires_at    timestamptz not null,
  choose_by     timestamptz,           -- prize stops: 3 days to choose
  choice        text check (choice in ('hot_drink', 'app_week', 'gift_card', 'donation')),
  code          text,                  -- code-only perks (app, birthday card)
  redeemed_at   timestamptz,           -- "Märgi kasutatuks"
  constraint perks_rail_check
    check (source <> 'rail' or (stop_at is not null and lap is not null and birthday_year is null)),
  constraint perks_birthday_check
    check (source <> 'birthday' or (stop_at is null and lap is null and birthday_year is not null))
);

create index perks_member_id_idx on public.perks (member_id);

-- A stop opens its perk once per lap.
create unique index perks_one_per_stop_per_lap
  on public.perks (member_id, stop_at, lap) where source = 'rail';

-- "Äpp 5 € (uutele)" (stop 150) is given only once per member, ever.
create unique index perks_stop_150_once
  on public.perks (member_id) where stop_at = 150;

-- The birthday card is given once a year.
create unique index perks_birthday_once_per_year
  on public.perks (member_id, birthday_year) where source = 'birthday';

-- =====================================================================
-- Gift cards and donations: the two outcomes of a prize choice.
-- =====================================================================
create table public.gift_cards (
  id           bigint generated always as identity primary key,
  member_id    uuid not null references public.members (id) on delete cascade,
  perk_id      bigint not null unique references public.perks (id),
  code         text not null unique,   -- also used for the QR code
  amount       numeric(10, 2) not null default 5 check (amount > 0),
  min_purchase numeric(10, 2) not null default 20 check (min_purchase >= 0),
  valid_until  timestamptz not null,
  created_at   timestamptz not null default now()
);

create table public.donations (
  id         bigint generated always as identity primary key,
  member_id  uuid not null references public.members (id) on delete cascade,
  perk_id    bigint not null unique references public.perks (id),
  amount     numeric(10, 2) not null default 5 check (amount > 0),
  school     text not null,            -- copied from settings.donation_school
  created_at timestamptz not null default now()
);

-- =====================================================================
-- In-app Postkast messages (no real emails). event_key makes sure each
-- message is created once per event, e.g. 'name_day:2026'.
-- =====================================================================
create table public.messages (
  id         bigint generated always as identity primary key,
  member_id  uuid not null references public.members (id) on delete cascade,
  kind       text not null
             check (kind in ('name_day', 'points_100', 'birthday', 'order', 'perk_expiring')),
  title      text not null,
  body       text not null,
  link       text,                     -- the screen the message opens
  event_key  text not null,
  created_at timestamptz not null default now(),
  read_at    timestamptz,
  unique (member_id, event_key)
);

-- =====================================================================
-- Name days, authors and books
-- =====================================================================
create table public.name_days (
  id    bigint generated always as identity primary key,
  name  text not null,
  month smallint not null check (month between 1 and 12),
  day   smallint not null check (day between 1 and 31),
  unique (name, month, day)
);

create table public.authors (
  id         bigint generated always as identity primary key,
  first_name text not null,            -- must match the member's first name exactly
  last_name  text
);

create table public.books (
  id        bigint generated always as identity primary key,
  slug      text not null unique,
  title     text not null,
  author_id bigint not null references public.authors (id),
  price     numeric(10, 2) not null check (price >= 0),
  cover     text not null check (cover in ('aqua', 'crimson', 'aubergine', 'teal')),
  format    text not null default 'book' check (format in ('book', 'ebook'))
);

-- =====================================================================
-- Settings, e.g. key 'donation_school'
-- =====================================================================
create table public.settings (
  key   text primary key,
  value text not null
);

-- =====================================================================
-- member_points: everything about points, calculated from the ledger.
-- An expiry row subtracts exactly the current lap's points, so the sum of
-- all rows is always (laps completed * 400) + current lap points.
-- 400 is the last rail stop (docs/program-rules.md).
-- security_invoker: the view respects each table's row-level security.
-- =====================================================================
create view public.member_points
with (security_invoker = true)
as
select
  m.id as member_id,
  coalesce(sum(l.points) filter (where l.kind = 'earn'), 0) as lifetime_total,
  coalesce(sum(l.points), 0) / 400 as laps_completed,
  coalesce(sum(l.points), 0) % 400 as current_lap_points,
  p.last_purchase_at,
  p.last_purchase_at + interval '6 months' as points_valid_until
from public.members m
left join public.points_ledger l on l.member_id = m.id
left join lateral (
  select max(purchased_at) as last_purchase_at
  from public.purchases
  where member_id = m.id
) p on true
group by m.id, p.last_purchase_at;

-- =====================================================================
-- Row-level security: on for every table, with no policies yet, so the
-- public API key cannot read or change anything. #6 adds the policies.
-- =====================================================================
alter table public.members       enable row level security;
alter table public.purchases     enable row level security;
alter table public.points_ledger enable row level security;
alter table public.rail_stops    enable row level security;
alter table public.perks         enable row level security;
alter table public.gift_cards    enable row level security;
alter table public.donations     enable row level security;
alter table public.messages      enable row level security;
alter table public.name_days     enable row level security;
alter table public.authors       enable row level security;
alter table public.books         enable row level security;
alter table public.settings      enable row level security;
