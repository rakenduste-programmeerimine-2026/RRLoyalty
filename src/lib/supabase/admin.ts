// Supabase client with the secret key, for server code that changes points,
// perks or purchases. It bypasses row-level security, so it must never reach
// the browser: 'server-only' fails the build if a Client Component imports it.
// Only use it after checking who the member is (getMember in src/lib/auth.ts).

import "server-only";
import { createClient } from "@supabase/supabase-js";

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;

  if (!url || !secretKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY. Copy .env.example to .env.local and fill them in.",
    );
  }

  return createClient(url, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
