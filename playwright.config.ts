// Playwright for the critical flows only (#20): the name-day flow and the
// 100-point flow with both prize choices. They write purchases and perks, so
// run them against a fresh local Supabase (CI does: see .github/workflows/ci.yml),
// never against the hosted project.

import { defineConfig, devices } from "@playwright/test";

const AUTH_FILE = "e2e/.auth/mari.json";

export default defineConfig({
  testDir: "e2e",
  // *.e2e.ts, so Vitest (which picks up *.test.ts and *.spec.ts) leaves them alone.
  testMatch: "**/*.e2e.ts",
  // One member, one database: run the flows one after another.
  fullyParallel: false,
  workers: 1,
  retries: 0,
  forbidOnly: Boolean(process.env.CI),
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  timeout: 60_000,
  expect: { timeout: 15_000 },
  use: {
    baseURL: "http://localhost:3000",
    locale: "et-EE",
    timezoneId: "Europe/Tallinn",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "sign-in", testMatch: "**/auth.setup.ts" },
    {
      name: "flows",
      use: { ...devices["Desktop Chrome"], storageState: AUTH_FILE },
      dependencies: ["sign-in"],
    },
  ],
  webServer: {
    // CI builds first; locally `npm run dev` already running is reused.
    command: "npm run start",
    url: "http://localhost:3000/logi-sisse",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
