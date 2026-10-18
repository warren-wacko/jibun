import { expect, test } from "@playwright/test";
import { decodeOrder } from "../src/lib/order";

/** The order form: a client answers, and gets one message to send us. Nothing is stored on the server. */
test("a Standard order with add-ons builds a message whose code reads back correctly", async ({ page }) => {
  await page.goto("/order?plan=standard&addons=gallery,video&template=social-bento");
  await expect(page.getByText("Your plan:")).toContainText("Standard + Photo gallery, Video");
  await expect(page.getByRole("radio", { name: "Bento" })).toBeChecked();

  await page.getByLabel("Full name").fill("Eva Reyes");
  await page.getByLabel("Nickname (optional)").fill("Eva");
  await page.getByLabel("Mobile number").fill("0917 123 4567");
  await page.getByLabel("Instagram link or username").fill("@eva.designs");
  await page.getByLabel("Video link").fill("https://youtu.be/abc");

  // Standard includes two extra sections: a third is not allowed
  await page.getByLabel("Skills", { exact: true }).check();
  await page.getByLabel("Interests", { exact: true }).check();
  await expect(page.getByLabel("Services", { exact: true })).toBeDisabled();
  await page.getByLabel("What should Skills say?").fill("Figma, Prototyping");
  await page.getByLabel("What should Interests say?").fill("coffee\nfilm");

  await page.getByRole("button", { name: /Copy my answers/ }).click();
  const message = await page.getByLabel("Your order message").inputValue();
  expect(message).toContain("Plan: Standard + Photo gallery, Video");
  expect(message).toContain("Name: Eva Reyes (Eva)");

  const r = decodeOrder(message);
  expect(r.ok).toBe(true);
  if (!r.ok) return;
  expect(r.order).toMatchObject({
    plan: "standard",
    addOns: ["gallery", "video"],
    name: "Eva Reyes",
    phone: "0917 123 4567",
    template: "social-bento",
    videoUrl: "https://youtu.be/abc",
  });
  expect(r.order.socials).toEqual([{ type: "instagram", handle: "eva.designs", url: "" }]);
  expect(r.order.sections.map((s) => s.kind)).toEqual(["skills", "interests"]);
});

test("a Starter link has no extra sections or custom colour, and a blank form asks for the missing answers", async ({ page }) => {
  await page.goto("/order");
  await expect(page.getByText("Your plan:")).toContainText("Starter");
  await expect(page.getByRole("heading", { name: "Extras" })).toHaveCount(0);
  await expect(page.getByText("Any colour")).toHaveCount(0);

  await page.getByRole("button", { name: /Copy my answers/ }).click();
  await expect(page.getByText("Please enter your name.")).toBeVisible();
  await expect(page.getByText("Add a phone number or an email")).toBeVisible();
  await expect(page.getByLabel("Your order message")).toHaveCount(0);
});

test("a mistyped link still opens the form, and the form is not indexed", async ({ page }) => {
  await page.goto("/order?plan=premium&addons=nope,gallery");
  await expect(page.getByText("Your plan:")).toContainText("Starter + Photo gallery");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
});

test("nothing is sent to the server when the form is filled in", async ({ page }) => {
  const posts: string[] = [];
  page.on("request", (req) => {
    if (req.method() !== "GET") posts.push(`${req.method()} ${req.url()}`);
  });
  await page.goto("/order");
  await page.getByLabel("Full name").fill("No Network");
  await page.getByLabel("Email").fill("no@example.com");
  await page.getByRole("button", { name: /Copy my answers/ }).click();
  await expect(page.getByLabel("Your order message")).toBeVisible();
  expect(posts).toEqual([]);
});
