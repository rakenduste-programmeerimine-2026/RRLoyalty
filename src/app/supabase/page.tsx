// Developer check: does the app reach Supabase with the values in .env.local?
// Not linked from the menus. Can be removed once real data is connected (#16).

import { connection } from "next/server";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";

// The schema comes in #5, so we ask for a table that does not exist yet.
// If Supabase answers "table not found", the URL and key both worked.
const MISSING_TABLE = "connection_check";
const TABLE_NOT_FOUND = ["PGRST205", "42P01"];

async function ConnectionStatus() {
  // Run the check on every visit, never once at build time.
  await connection();

  let message: string;
  let ok = false;

  try {
    const supabase = await createClient();
    const { error, status } = await supabase.from(MISSING_TABLE).select().limit(1);

    if (!error || TABLE_NOT_FOUND.includes(error.code)) {
      ok = true;
      message = "Ühendus Supabasega töötab.";
    } else if (status === 401 || status === 403) {
      message = "Supabase lükkas võtme tagasi. Kontrolli NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY väärtust.";
    } else {
      message = `Supabasega ei saanud ühendust. Kontrolli NEXT_PUBLIC_SUPABASE_URL väärtust. (${error.message})`;
    }
  } catch {
    message = "Supabase'i seadistus puudub. Kopeeri .env.example failiks .env.local ja täida väärtused.";
  }

  return <p className={ok ? "" : "muted"}>{message}</p>;
}

export default function SupabaseCheckPage() {
  return (
    <main className="index">
      <h1>{"Supabase'i ühendus"}</h1>
      <Suspense fallback={<p className="muted">Kontrollin ühendust…</p>}>
        <ConnectionStatus />
      </Suspense>
    </main>
  );
}
