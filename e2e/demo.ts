// Helpers that set up state through the hidden /demo page (#22), so the flows
// never wait on real dates and never write to tables directly.

import { expect, type Page } from "@playwright/test";

/** The member's points on the current lap, as /demo shows them. */
export async function lapPoints(page: Page): Promise<number> {
  await page.goto("/demo");
  const value = page.locator(".demo-state dt", { hasText: "Punkte sellel ringil" }).locator("xpath=following-sibling::dd");
  const text = (await value.textContent()) ?? "";
  const match = /(\d+)\s*p/.exec(text);
  if (!match) throw new Error(`Could not read the lap points from /demo: "${text}"`);
  return Number(match[1]);
}

/** Records a purchase through /demo's "Lisa ost" and waits for it to be saved. */
export async function addPurchase(page: Page, channelLabel: string, amount: number): Promise<void> {
  await page.goto("/demo");
  await page.getByLabel("Müügikanal").selectOption({ label: channelLabel });
  await page.getByLabel("Makstud summa (€, pärast soodustusi)").fill(String(amount));
  await page.getByRole("button", { name: "Lisa ost" }).click();
  await expect(page.getByRole("status").filter({ hasText: "lisatud" })).toBeVisible();
}

/** Buys exactly enough to land on `stop` on the current lap. */
export async function buyUpTo(page: Page, stop: number): Promise<void> {
  const points = await lapPoints(page);
  if (points >= stop) throw new Error(`The member already has ${points} points, past the ${stop} stop.`);
  await addPurchase(page, "E-pood", stop - points);
}

/** Moves the demo date to the member's next name day ("Käivita nimepäev"). */
export async function triggerNameDay(page: Page): Promise<void> {
  await page.goto("/demo");
  await page.getByRole("button", { name: "Käivita nimepäev" }).click();
  await expect(page.getByRole("status").filter({ hasText: "nimepäev" })).toBeVisible();
}
