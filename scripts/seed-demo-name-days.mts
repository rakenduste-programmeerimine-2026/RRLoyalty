// TEMPORARY demo helper (issue #53). Run with: npm run seed:demo-name-days
//
// Gives Mari a name day on every date of the year, so the name-day discount
// can be tested on any day until /demo (#22) can move "today". Her real demo
// name day stays 19 November (scripts/seed.mts).
//
// Remove this script once #22 is done, and delete every Mari name day except
// 19 November from the database (including any added by hand).
//
// Seeds the database that .env.local points to. Safe to run again: existing
// rows are skipped.

import { createClient } from "@supabase/supabase-js";

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name}. Add it to .env.local (see .env.example).`);
  return value;
}

const db = createClient(required("NEXT_PUBLIC_SUPABASE_URL"), required("SUPABASE_SECRET_KEY"), {
  auth: { persistSession: false, autoRefreshToken: false },
});

// Every date of a leap year, so 29 February is included too.
const rows: { name: string; month: number; day: number }[] = [];
for (let date = new Date(Date.UTC(2028, 0, 1)); date.getUTCFullYear() === 2028; date.setUTCDate(date.getUTCDate() + 1)) {
  rows.push({ name: "Mari", month: date.getUTCMonth() + 1, day: date.getUTCDate() });
}

const { error } = await db.from("name_days").upsert(rows, { onConflict: "name,month,day", ignoreDuplicates: true });
if (error) {
  console.error(`Could not save the demo name days: ${error.message}`);
  process.exit(1);
}

const { count, error: countError } = await db
  .from("name_days")
  .select("*", { count: "exact", head: true })
  .eq("name", "Mari");
if (countError) {
  console.error(`Could not count the name days: ${countError.message}`);
  process.exit(1);
}
console.log(`Mari now has a name day on every date (${count} rows). Temporary until #22: see the comment at the top.`);
