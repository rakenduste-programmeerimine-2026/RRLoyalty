// Supabase client for Server Components, Server Actions and Route Handlers.
// Create a new one for every request: never share it between users.

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabaseEnv } from "./env";

export async function createClient() {
  // Read the cookies first: it marks the caller as request-time, so a build
  // never prerenders a signed-in page or needs the Supabase values.
  const cookieStore = await cookies();
  const { url, publishableKey } = supabaseEnv();

  return createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Server Components cannot set cookies. src/proxy.ts refreshes
          // the session on every request, so this is safe to ignore here.
        }
      },
    },
  });
}
