import "dotenv/config";
import { randomBytes } from "node:crypto";
import { expect, test } from "@playwright/test";
import { Pool } from "pg";
import { generateCardCode } from "../src/lib/card-code";
import { SAMPLE_PAGE_DATA } from "../src/lib/sample-data";

/**
 * The promise of the product: tap a card, land on the person's page, save their contact.
 * The fixture is a fictional client with an active page and three cards (active, lost, and one on a lapsed page).
 * Plain SQL rather than the app's Prisma client: that client is an ES module, which Playwright's loader cannot import.
 */
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const id = () => `e2e${randomBytes(10).toString("hex")}`;
const tapCount = async (username: string) =>
  Number(
    (await pool.query(`SELECT count(*) FROM "Tap" t JOIN "Page" p ON p.id = t."pageId" WHERE p.username = $1`, [username])).rows[0].count,
  );

const run = Math.random().toString(36).slice(2, 8);
const ACTIVE = { username: `e2e-${run}`, code: generateCardCode() };
const LAPSED = { username: `e2e-lapsed-${run}`, code: generateCardCode() };
const LOST_CODE = generateCardCode();
const YEAR = 365 * 24 * 60 * 60 * 1000;

const data = { ...SAMPLE_PAGE_DATA, profile: { ...SAMPLE_PAGE_DATA.profile, fullName: "Eva E2E" } };

test.beforeAll(async () => {
  const clientId = id();
  await pool.query(`INSERT INTO "Client" (id, name) VALUES ($1, $2)`, [clientId, `e2e-${run}`]);
  const addPage = async (username: string, paidUntil: Date) => {
    const pageId = id();
    await pool.query(
      `INSERT INTO "Page" (id, username, "clientId", "templateKey", data, "addOns", status, "paidUntil", "updatedAt")
       VALUES ($1, $2, $3, 'pro-classic', $4, '{}', 'ACTIVE', $5, now())`,
      [pageId, username, clientId, JSON.stringify(data), paidUntil],
    );
    return pageId;
  };
  const addCard = (code: string, pageId: string, status = "ACTIVE") =>
    pool.query(`INSERT INTO "Card" (id, code, "pageId", status) VALUES ($1, $2, $3, $4::"CardStatus")`, [id(), code, pageId, status]);

  const active = await addPage(ACTIVE.username, new Date(Date.now() + YEAR));
  // ended well past the 30-day grace period
  const lapsed = await addPage(LAPSED.username, new Date(Date.now() - YEAR));
  await addCard(ACTIVE.code, active);
  await addCard(LOST_CODE, active, "LOST");
  await addCard(LAPSED.code, lapsed);
});

test.afterAll(async () => {
  const pages = (await pool.query(`SELECT id, "clientId" FROM "Page" WHERE username LIKE $1`, [`%${run}`])).rows;
  const ids: string[] = pages.map((p) => p.id);
  await pool.query(`DELETE FROM "Tap" WHERE "pageId" = ANY($1)`, [ids]);
  await pool.query(`DELETE FROM "Card" WHERE "pageId" = ANY($1)`, [ids]);
  await pool.query(`DELETE FROM "Page" WHERE id = ANY($1)`, [ids]);
  await pool.query(`DELETE FROM "Client" WHERE id = ANY($1)`, [pages.map((p) => p.clientId)]);
  await pool.end();
});

test("a tap redirects to the page, uncached, and the visitor sees the person's card", async ({ page, request }) => {
  const res = await request.get(`/c/${ACTIVE.code}`, { maxRedirects: 0 });
  expect(res.status()).toBe(302);
  expect(res.headers()["location"]).toBe(`/${ACTIVE.username}`);
  expect(res.headers()["cache-control"]).toContain("no-store");

  // the code is accepted in any case, as typed from a printed card
  await page.goto(`/c/${ACTIVE.code.toLowerCase()}?src=nfc`);
  await expect(page).toHaveURL(new RegExp(`/${ACTIVE.username}$`));
  await expect(page.getByText("Eva E2E").first()).toBeVisible();
  await expect(page.getByText("Product Designer").first()).toBeVisible();
});

test("Save Contact downloads a valid vCard with the person's details", async ({ page }) => {
  await page.goto(`/${ACTIVE.username}`);
  const save = page.getByRole("link", { name: /save contact/i }).first();
  await expect(save).toHaveAttribute("href", `/${ACTIVE.username}/vcard`);

  const res = await page.request.get(`/${ACTIVE.username}/vcard`);
  expect(res.status()).toBe(200);
  expect(res.headers()["content-type"]).toContain("text/vcard");
  // inline, so iPhone Safari opens the contact preview instead of asking to download a file
  expect(res.headers()["content-disposition"]).toMatch(/^inline;/);
  expect(res.headers()["content-disposition"]).toContain(`${ACTIVE.username}.vcf`);
  await expect(save).not.toHaveAttribute("download", /.*/);
  const vcf = await res.text();
  expect(vcf).toMatch(/^BEGIN:VCARD/);
  expect(vcf).toContain("FN:Eva E2E");
  expect(vcf).toContain("maria@example.com");
  expect(vcf).toContain("+639171234567");
  expect(vcf.trim()).toMatch(/END:VCARD$/);
});

test("the QR code is an SVG image", async ({ request }) => {
  const res = await request.get(`/${ACTIVE.username}/qr`);
  expect(res.status()).toBe(200);
  expect(res.headers()["content-type"]).toContain("image/svg+xml");
});

test("a tap is logged after the redirect, with no IP address stored", async ({ request }) => {
  const before = await tapCount(ACTIVE.username);
  // a phone user agent from a fresh address, so the tap is neither a crawler nor a duplicate
  const ip = `203.0.113.${Math.floor(Math.random() * 200) + 1}`;
  const res = await request.get(`/c/${ACTIVE.code}?src=qr`, {
    maxRedirects: 0,
    headers: {
      "user-agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile Safari",
      "x-forwarded-for": ip,
    },
  });
  expect(res.status()).toBe(302);
  await expect.poll(() => tapCount(ACTIVE.username), { timeout: 10_000 }).toBeGreaterThan(before);

  const tap = (
    await pool.query(
      `SELECT t.* FROM "Tap" t JOIN "Page" p ON p.id = t."pageId" WHERE p.username = $1 ORDER BY t."createdAt" DESC LIMIT 1`,
      [ACTIVE.username],
    )
  ).rows[0];
  expect(tap.source).toBe("qr");
  expect(JSON.stringify(tap)).not.toContain(ip);
});

test("unknown, lost and lapsed cards all land on /inactive", async ({ request, page }) => {
  for (const code of [generateCardCode(), LOST_CODE, LAPSED.code]) {
    const res = await request.get(`/c/${code}`, { maxRedirects: 0 });
    expect(res.status(), code).toBe(302);
    expect(res.headers()["location"], code).toBe("/inactive");
  }
  await page.goto(`/c/${LAPSED.code}`);
  await expect(page).toHaveURL(/\/inactive$/);
});

test("a page that does not exist shows the not-found page, and a lapsed page offers no contact download", async ({ page, request }) => {
  // the page streams, so the status line is already 200 when the not-found page is chosen
  await page.goto(`/nobody-${run}`);
  await expect(page.getByRole("heading", { name: "We can't find that page." })).toBeVisible();
  expect((await request.get(`/${LAPSED.username}/vcard`)).status()).toBe(404);
});
