// The name-day flow (#17): Postkast email → namesake books at −10% → bag →
// "Maksa" → order confirmation, with the points landing on the rail.

import { expect, test } from "@playwright/test";
import { lapPoints, triggerNameDay } from "./demo";

test("a member buys a namesake book on their name day and earns the points", async ({ page }) => {
  const before = await lapPoints(page);
  // The seeded demo member's name day is 19 November; /demo moves "today" there.
  await triggerNameDay(page);

  await page.goto("/postkast/nimepaev");
  await expect(page.getByRole("heading", { name: /Palju õnne nimepäevaks/ })).toBeVisible();
  await page.getByRole("link", { name: "Vaata nimekaimude raamatuid" }).click();

  await expect(page).toHaveURL(/\/nimekaimud$/);
  await expect(page.getByText("Nimepäeva −10% ainult täna").filter({ visible: true })).toBeVisible();
  await page.getByRole("link", { name: /Sügisene raamatupood/ }).first().click();

  await expect(page).toHaveURL(/\/raamat\/sugisene-raamatupood$/);
  // Next.js keeps the previous page hidden in the DOM, so match only what is visible.
  await expect(page.locator("p.price s").filter({ visible: true })).toHaveText(/20,00/);
  await expect(page.locator("p.price strong").filter({ visible: true })).toHaveText(/18,00/);
  await expect(page.getByText("+18 punkti").filter({ visible: true })).toBeVisible();
  await page.getByRole("button", { name: "Lisa ostukorvi" }).click();

  await expect(page).toHaveURL(/\/ostukorv$/);
  await expect(page.locator(".sum .saving").filter({ visible: true })).toContainText("2,00");
  await expect(page.locator(".sum .total").filter({ visible: true })).toContainText("18,00");
  await page.getByRole("button", { name: /Maksa 18,00/ }).click();

  await expect(page.getByRole("heading", { name: "Aitäh, Mari!" })).toBeVisible();
  await expect(page.getByText(/Tellimus RR-[0-9A-F]{8} on vormistatud/).filter({ visible: true })).toBeVisible();
  await expect(page.getByText("+18 punkti Gustavi rajale").filter({ visible: true })).toBeVisible();

  // The purchase is recorded: the rail moves on by 18, and the order is listed.
  expect(await lapPoints(page)).toBe((before + 18) % 400);
  await page.goto("/konto/tellimused");
  await expect(page.getByText("E-pood").filter({ visible: true }).first()).toBeVisible();
  await expect(page.getByText("+18 p").filter({ visible: true }).first()).toBeVisible();
});
