// Seed data for the demo (issue #7). Run with: npm run seed
//
// Seeds the database that .env.local points to (local or hosted), using the
// secret key. Safe to run again: rows are updated or skipped, never duplicated,
// and nothing is deleted. The demo password comes from DEMO_PASSWORD in
// .env.local, so it never enters the repo.

import { createClient } from "@supabase/supabase-js";
import { STOPS } from "../src/lib/rail.ts";

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing ${name}. Add it to .env.local (see .env.example).`);
  }
  return value;
}

const db = createClient(required("NEXT_PUBLIC_SUPABASE_URL"), required("SUPABASE_SECRET_KEY"), {
  auth: { persistSession: false, autoRefreshToken: false },
});
const demoEmail = required("DEMO_EMAIL");
const demoPassword = required("DEMO_PASSWORD");

type SupabaseResult<T> = { data: T | null; error: { message: string } | null };

/** Throws with a readable message when a Supabase call fails. */
function ok(result: { error: { message: string } | null }, what: string): void {
  if (result.error) throw new Error(`Could not ${what}: ${result.error.message}`);
}

/** Like ok(), and also returns the data, which must be there. */
function must<T>(result: SupabaseResult<T>, what: string): T {
  ok(result, what);
  if (result.data === null) throw new Error(`Could not ${what}: nothing came back.`);
  return result.data;
}

// ---------------------------------------------------------------------------
// Demo data. The stops come from src/lib/rail.ts, so code and database agree.
// ---------------------------------------------------------------------------

const settings = [{ key: "donation_school", value: "Näidiskooli" }];

// 13 November: the 7-day offer runs 13–19.11.2026 and covers the presentation.
const nameDays = [{ name: "Mari", month: 11, day: 13 }];

const authors = [
  { first_name: "Mari", last_name: "Näidis" },
  { first_name: "Mari", last_name: "Proov" },
];

const books = [
  { slug: "sugisene-raamatupood", title: "Sügisene raamatupood", author: "Näidis", price: 20, cover: "aubergine" },
  { slug: "lounatuul", title: "Lõunatuul", author: "Näidis", price: 17.9, cover: "aqua" },
  { slug: "kolm-kassi", title: "Kolm kassi katusel", author: "Proov", price: 14.5, cover: "crimson" },
  { slug: "vaikne-tanav", title: "Vaikne tänav", author: "Proov", price: 22, cover: "teal" },
];

const demoMember = {
  first_name: "Mari",
  last_name: "Maasikas",
  birthday: "2001-01-01",
  member_since: "2019-01-01",
  card_number: "RR-0000-1234",
};

// 11 + 14 + 9 = 34 points, so the €18 name-day purchase takes Mari to 52.
const purchases = [
  {
    external_ref: "seed-demo-1",
    order_number: "RR-2026-0815",
    channel: "store",
    location: "Viru Keskus",
    amount_paid: 11,
    status: "in_store",
    purchased_at: "2026-08-15T12:00:00+03:00",
  },
  {
    external_ref: "seed-demo-2",
    order_number: "RR-2026-0828",
    channel: "app",
    location: null,
    amount_paid: 14,
    status: "delivered",
    purchased_at: "2026-08-28T12:00:00+03:00",
  },
  {
    external_ref: "seed-demo-3",
    order_number: "RR-2026-0903",
    channel: "literaat",
    location: "Telliskivi",
    amount_paid: 9,
    status: "in_store",
    purchased_at: "2026-09-03T12:00:00+03:00",
  },
];

// ---------------------------------------------------------------------------

async function seedReferenceData() {
  ok(await db.from("settings").upsert(settings, { onConflict: "key" }), "save settings");

  const stops = STOPS.map((stop) => ({ at: stop.at, reward: stop.label, type: stop.type }));
  ok(await db.from("rail_stops").upsert(stops, { onConflict: "at" }), "save rail stops");

  ok(
    await db.from("name_days").upsert(nameDays, { onConflict: "name,month,day", ignoreDuplicates: true }),
    "save name days",
  );

  // authors has no unique key, so look each one up before adding it.
  const authorIds = new Map<string, number>();
  for (const author of authors) {
    const found = await db
      .from("authors")
      .select("id")
      .eq("first_name", author.first_name)
      .eq("last_name", author.last_name)
      .maybeSingle<{ id: number }>();
    ok(found, "read authors");
    const id =
      found.data?.id ??
      must(await db.from("authors").insert(author).select("id").single<{ id: number }>(), "add an author").id;
    authorIds.set(author.last_name, id);
  }

  const bookRows = books.map(({ author, ...book }) => ({ ...book, format: "book", author_id: authorIds.get(author) }));
  ok(await db.from("books").upsert(bookRows, { onConflict: "slug" }), "save books");
}

/** Finds the demo sign-in account, or creates it. Keeps its password in step with DEMO_PASSWORD. */
async function seedDemoAccount(): Promise<string> {
  for (let page = 1; ; page++) {
    const list = await db.auth.admin.listUsers({ page, perPage: 1000 });
    ok(list, "list users");
    const users = list.data.users;
    const existing = users.find((user) => user.email?.toLowerCase() === demoEmail.toLowerCase());
    if (existing) {
      ok(await db.auth.admin.updateUserById(existing.id, { password: demoPassword }), "update the demo account");
      return existing.id;
    }
    if (users.length < 1000) break;
  }

  const created = await db.auth.admin.createUser({ email: demoEmail, password: demoPassword, email_confirm: true });
  ok(created, "create the demo account");
  if (!created.data.user) throw new Error("Could not create the demo account: no user came back.");
  return created.data.user.id;
}

async function seedDemoMember(memberId: string) {
  ok(await db.from("members").upsert({ id: memberId, ...demoMember }, { onConflict: "id" }), "save the member");

  for (const purchase of purchases) {
    // An existing purchase keeps its row, so its points are never written twice.
    ok(
      await db
        .from("purchases")
        .upsert({ member_id: memberId, ...purchase }, { onConflict: "external_ref", ignoreDuplicates: true }),
      "save a purchase",
    );
    const saved = must(
      await db
        .from("purchases")
        .select("id, member_id, amount_paid")
        .eq("external_ref", purchase.external_ref)
        .single<{ id: number; member_id: string; amount_paid: number | string }>(),
      "read a purchase",
    );
    if (saved.member_id !== memberId) {
      throw new Error(`Purchase ${purchase.external_ref} belongs to another member.`);
    }

    // The team's write path (#11): one earn row per purchase, at most once.
    // 34 points opens no stop, so there are no perks to add.
    ok(
      await db.rpc("record_purchase_points", {
        p_member_id: memberId,
        p_purchase_id: saved.id,
        p_points: Math.floor(Number(saved.amount_paid)),
        p_perks: [],
      }),
      "write a purchase's points",
    );
  }
}

async function main() {
  await seedReferenceData();
  const memberId = await seedDemoAccount();
  await seedDemoMember(memberId);

  const points = must(
    await db
      .from("member_points")
      .select("lifetime_total, current_lap_points")
      .eq("member_id", memberId)
      .single<{ lifetime_total: number; current_lap_points: number }>(),
    "read the demo member's points",
  );
  console.log(`Seeded: ${STOPS.length} rail stops, ${books.length} books, the demo account and member.`);
  console.log(`Demo member: ${points.current_lap_points} points on the current lap (lifetime ${points.lifetime_total}).`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
