// "Now" for every page and Server Action: the real time plus the /demo
// page's offset (demo-clock.ts), read from a cookie. Without the cookie it is
// the real time. Server only.

import "server-only";
import { cookies } from "next/headers";
import { cache } from "react";
import { DEMO_COOKIE, demoNow, offsetFor, parseDemoOffset } from "./demo-clock";

/** The demo date and time for this request. */
export const getNow = cache(async (): Promise<Date> => {
  const store = await cookies();
  return demoNow(new Date(), parseDemoOffset(store.get(DEMO_COOKIE)?.value));
});

/** Moves the demo clock to `demo`. Only from a Server Action. */
export async function setDemoNow(demo: Date): Promise<void> {
  const store = await cookies();
  const offset = offsetFor(new Date(), demo);
  if (offset === 0) {
    store.delete(DEMO_COOKIE);
    return;
  }
  store.set(DEMO_COOKIE, String(offset), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 30 * 24 * 60 * 60,
  });
}

/** Back to the real date. Only from a Server Action. */
export async function resetDemoClock(): Promise<void> {
  (await cookies()).delete(DEMO_COOKIE);
}
