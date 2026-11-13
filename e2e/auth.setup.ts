// Signs in as the seeded demo member once and saves the session for the flows.
// DEMO_EMAIL and DEMO_PASSWORD are the seed's demo account (scripts/seed.mts).

import { expect, test as setup } from "@playwright/test";

const AUTH_FILE = "e2e/.auth/mari.json";

setup("sign in as the demo member", async ({ page }) => {
  const email = process.env.DEMO_EMAIL;
  const password = process.env.DEMO_PASSWORD;
  if (!email || !password) throw new Error("Set DEMO_EMAIL and DEMO_PASSWORD (the seeded demo account).");

  await page.goto("/logi-sisse?next=%2Fkonto");
  await page.getByLabel("E-posti aadress").fill(email);
  await page.getByLabel("Parool").fill(password);
  await page.getByRole("button", { name: "Logi sisse" }).click();

  await expect(page).toHaveURL(/\/konto$/);
  await page.context().storageState({ path: AUTH_FILE });
});
