// The URL and publishable key come from .env.local (see .env.example).
// Both are safe in the browser. The secret key lives only in supabase/admin.ts.

export function supabaseEnv() {
  // Next.js only inlines NEXT_PUBLIC_ variables written out in full like this.
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !publishableKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY. Copy .env.example to .env.local and fill them in.",
    );
  }

  return { url, publishableKey };
}
