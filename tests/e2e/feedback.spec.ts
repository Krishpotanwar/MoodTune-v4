import { expect, test } from "@playwright/test";

test("rating three tracks creates a visible taste profile", async ({ page }) => {
  test.setTimeout(30_000);

  await page.goto("/");
  await page.getByPlaceholder("What's the mood?").fill("dark rainy drive");
  await page.getByRole("button", { name: /send/i }).click();

  await expect
    .poll(async () => page.getByTestId("track-card").count(), {
      timeout: 20_000,
    })
    .toBeGreaterThanOrEqual(4);

  for (let index = 0; index < 3; index += 1) {
    await page.getByRole("button", { name: /^Like / }).nth(index).click();
  }

  await expect(page.getByText("Your taste profile updated.").first()).toBeVisible({
    timeout: 10_000,
  });

  await page.goto("/profile");
  await expect(page.getByTestId("taste-profile-summary")).toBeVisible({
    timeout: 10_000,
  });
  await expect(page.getByTestId("taste-profile-summary")).not.toContainText(
    "Rate a few songs to see your taste profile.",
  );
});
