import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // Migrate needs the direct (non-pooled) connection; the app uses DATABASE_URL.
    url: process.env["DIRECT_URL"] || process.env["DATABASE_URL"],
  },
});
