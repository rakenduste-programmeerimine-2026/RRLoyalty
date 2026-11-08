// Where to send a member before and after sign-in.
// Shared by the proxy (Node) and the sign-in Server Action, so keep it free of
// Next.js and Supabase imports.

export const SIGN_IN_PATH = "/logi-sisse";
export const ACCOUNT_HOME = "/konto";

/** The sign-in URL that brings the visitor back to `path` afterwards. */
export function signInPath(path: string): string {
  return `${SIGN_IN_PATH}?next=${encodeURIComponent(path)}`;
}

/**
 * The page to open after sign-in. Only same-site paths are allowed, so the
 * `next` parameter cannot be used to send members to another site.
 */
export function safeNextPath(next: string | null | undefined): string {
  if (!next || !next.startsWith("/")) return ACCOUNT_HOME;
  // "//host" and "/\host" are treated by browsers as another site.
  if (next.startsWith("//") || next.startsWith("/\\")) return ACCOUNT_HOME;
  if (next === SIGN_IN_PATH || next.startsWith(`${SIGN_IN_PATH}?`)) return ACCOUNT_HOME;
  return next;
}
