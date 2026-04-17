import { expect, test } from "@playwright/test";

test("home page renders the phase 1 scaffold", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("MoodTune v4 · Phase 1 Scaffold")).toBeVisible();
  await expect(
    page.getByText("The Next.js rebuild is live and ready for Phase 2 features."),
  ).toBeVisible();
});
