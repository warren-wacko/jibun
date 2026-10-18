import { expect, test } from "@playwright/test";

/** The marketing homepage: it loads, the anchors work, the compare toggle and the FAQ respond, and nothing overflows. */
test("the homepage shows the offer and every main button leads somewhere", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/Jibun/);
  await expect(page.getByRole("heading", { level: 1 }).first()).toContainText("One tap");
  await expect(page.getByText("Digital card by Jibun", { exact: true })).toBeVisible();

  // every "message us" style button points at a real contact link (never empty or "#")
  for (const name of ["Message us", "Get your card", "Ask about Starter", "Ask about Standard", "Ask for prices", "Message us to get yours"]) {
    const href = await page.getByRole("link", { name }).first().getAttribute("href");
    expect(href, name).toMatch(/^(https?:\/\/|mailto:|tel:)/);
  }
});

test("nothing is wider than the phone screen", async ({ page }) => {
  await page.goto("/");
  const widths = await page.evaluate(() => [document.documentElement.scrollWidth, window.innerWidth]);
  expect(widths[0]).toBeLessThanOrEqual(widths[1]);
});

test("the FAQ opens and closes", async ({ page }) => {
  await page.goto("/#faq");
  const first = page.locator("details.q").first();
  await expect(first).not.toHaveAttribute("open", "");
  await first.locator("summary").click();
  await expect(first).toHaveAttribute("open", "");
  await expect(first.getByText("No. It opens in the phone's browser.")).toBeVisible();
  await first.locator("summary").click();
  await expect(first).not.toHaveAttribute("open", "");
});

test("the paper-versus-Jibun toggle switches the comparison", async ({ page }) => {
  await page.goto("/");
  const toggle = page.getByRole("group", { name: "Compare" });
  await toggle.scrollIntoViewIfNeeded();
  await expect(page.getByText("One tap or scan opens your whole profile.")).toBeVisible();
  await toggle.getByText("Paper card").click();
  await expect(page.getByText("They type your number by hand.")).toBeVisible();
  await expect(page.getByText("One tap or scan opens your whole profile.")).toBeHidden();
  await toggle.getByText("Jibun", { exact: true }).click();
  await expect(page.getByText("One tap or scan opens your whole profile.")).toBeVisible();
});

test("the sample designs and anchors are there", async ({ page }) => {
  await page.goto("/");
  for (const id of ["how-it-works", "designs", "plans", "faq", "contact"]) await expect(page.locator(`#${id}`)).toHaveCount(1);
  await expect(page.locator("#designs figure")).toHaveCount(6);
  await expect(page.locator("#designs img").first()).toHaveAttribute("alt", /sample design/);
  await page.getByRole("link", { name: "See how it works" }).click();
  await expect(page).toHaveURL(/#how-it-works$/);
});

test("Privacy and Terms are linked from the footer and open", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("contentinfo").getByRole("link", { name: "Privacy" }).click();
  await expect(page).toHaveURL(/\/privacy$/);
  await expect(page.getByRole("heading", { level: 1, name: "Privacy" })).toBeVisible();
  await expect(page.getByText("We do not store IP addresses")).toBeVisible();
  await page.getByRole("contentinfo").getByRole("link", { name: "Terms" }).click();
  await expect(page).toHaveURL(/\/terms$/);
  await expect(page.getByRole("heading", { level: 1, name: "Terms" })).toBeVisible();
  await expect(page.getByText("30-day grace period").first()).toBeVisible();
  await page.getByRole("link", { name: "Jibun home" }).click();
  await expect(page).toHaveURL(/\/$/);
});

test("an address that does not exist shows the Jibun not-found page", async ({ page }) => {
  await page.goto("/no-such-page-anywhere");
  await expect(page.getByRole("heading", { name: "We can't find that page." })).toBeVisible();
  await expect(page.getByRole("link", { name: "Go to the homepage" })).toBeVisible();
  const widths = await page.evaluate(() => [document.documentElement.scrollWidth, window.innerWidth]);
  expect(widths[0]).toBeLessThanOrEqual(widths[1]);
});
