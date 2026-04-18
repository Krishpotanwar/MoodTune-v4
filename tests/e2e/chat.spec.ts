import { expect, test } from "@playwright/test";

test("chat returns a reply and at least four track cards", async ({ page }) => {
  test.setTimeout(30_000);

  await page.goto("/");
  await page.getByPlaceholder("What's the mood?").fill("dark rainy drive");
  await page.getByRole("button", { name: /send/i }).click();

  await expect
    .poll(async () => page.getByTestId("track-card").count(), {
      timeout: 20_000,
    })
    .toBeGreaterThanOrEqual(4);
  await expect(
    page.getByText(/Demo quota reached|Searching for that mood/i),
  ).toBeVisible({
    timeout: 20_000,
  });
});
