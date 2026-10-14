import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { generateCardCode } from "../src/lib/card-code";
import { parsePageData } from "../src/lib/page-schema";
import { SAMPLE_PAGE_DATA } from "../src/lib/sample-data";
import { termEnd } from "../src/lib/plan-term";

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!connectionString) throw new Error("Set DATABASE_URL (or DIRECT_URL) in .env before seeding");

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

async function main() {
  const data = parsePageData(SAMPLE_PAGE_DATA);
  const existing = await db.page.findUnique({ where: { username: "maria" }, include: { cards: true } });
  if (existing) {
    console.log(`Sample page already exists. Card codes: ${existing.cards.map((c) => c.code).join(", ")}`);
    return;
  }

  const page = await db.page.create({
    data: {
      username: "maria",
      tier: "STARTER",
      templateKey: "pro-classic", // renders the placeholder until the real template is converted
      data,
      status: "ACTIVE",
      paidUntil: termEnd(new Date()),
      client: { create: { name: "Maria Santos (sample)", contactEmail: "maria@example.com" } },
      cards: { create: { code: generateCardCode(), label: "Main PVC" } },
    },
    include: { cards: true },
  });
  console.log(`Seeded /${page.username}. Card code: ${page.cards[0].code}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
