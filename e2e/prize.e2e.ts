// The 100-point flow (#18) with both prize choices: reaching 100 and choosing
// the 5 € gift card, then reaching 200 and choosing the donation.

import { expect, test } from "@playwright/test";
import { buyUpTo } from "./demo";

test.describe.serial("prize stops", () => {
  test("at 100 points the member chooses the gift card and gets a QR code", async ({ page }) => {
    await buyUpTo(page, 100);

    await page.goto("/konto/gustavi-rada/tasu");
    await expect(page.getByRole("heading", { name: "Vali oma 100 punkti tasu" })).toBeVisible();
    await page.getByLabel(/5 € kinkekaart/).check();
    await page.getByRole("button", { name: "Kinnita valik" }).click();

    await expect(page).toHaveURL(/\/konto\/kinkekaardid\/\d+$/);
    await expect(page.getByRole("heading", { name: "5 € kinkekaart on sinu!" })).toBeVisible();
    await expect(page.getByRole("img", { name: /QR-kood: GUSTAV-/ })).toBeVisible();

    // The prize is used up: choosing again isn't offered.
    await page.goto("/konto/gustavi-rada/tasu");
    await expect(page.getByRole("heading", { name: "Praegu pole tasu valida" })).toBeVisible();
  });

  test("at 200 points the member chooses the donation to the school library", async ({ page }) => {
    await buyUpTo(page, 200);

    await page.goto("/konto/gustavi-rada/tasu");
    await expect(page.getByRole("heading", { name: "Vali oma 200 punkti tasu" })).toBeVisible();
    await page.getByLabel(/Anneta 5 € kooliraamatukogule/).check();
    await page.getByRole("button", { name: "Kinnita valik" }).click();

    await expect(page).toHaveURL(/\/konto\/gustavi-rada\/annetus$/);
    await expect(page.getByRole("heading", { name: "Aitäh!" })).toBeVisible();
    await expect(page.getByText("Sinu 5 € läheb Näidiskooli raamatukogule.")).toBeVisible();

    await page.goto("/konto/annetused");
    await expect(page.getByText("Kokku annetatud")).toBeVisible();
    await expect(page.getByText("Näidiskooli raamatukogu").first()).toBeVisible();
  });
});
