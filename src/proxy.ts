// Runs before every page request (Next.js 16 renamed middleware to proxy).
// It refreshes the Supabase session cookie and sends signed-out visitors on
// /konto to the sign-in page. This is only the first, optimistic check: pages
// and Server Actions check the member again through src/lib/auth.ts.

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { signInPath } from "@/lib/auth-redirect";
import { supabaseEnv } from "@/lib/supabase/env";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  const signedIn = await refreshSession(request, (next) => (response = next));

  const { pathname, search } = request.nextUrl;
  if (!signedIn && (pathname === "/konto" || pathname.startsWith("/konto/"))) {
    const redirect = NextResponse.redirect(new URL(signInPath(pathname + search), request.url));
    // Keep any cookies Supabase cleared, such as an expired session.
    for (const cookie of response.cookies.getAll()) redirect.cookies.set(cookie);
    return redirect;
  }

  return response;
}

/** Refreshes the session cookie and reports whether a member is signed in. */
async function refreshSession(
  request: NextRequest,
  setResponse: (response: NextResponse) => void,
): Promise<boolean> {
  let env;
  try {
    env = supabaseEnv();
  } catch {
    // Without Supabase settings nobody can sign in. Public pages still work,
    // and /konto still redirects.
    return false;
  }

  const supabase = createServerClient(env.url, env.publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
        const response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
        setResponse(response);
      },
    },
  });

  // getClaims() validates the token and refreshes it when it has expired.
  // Do not run other code between creating the client and this call.
  const { data } = await supabase.auth.getClaims();
  return Boolean(data?.claims?.sub);
}

export const config = {
  matcher: [
    // Every page except Next.js assets and image files.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
