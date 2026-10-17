import "dotenv/config";
import { defineConfig, devices } from "@playwright/test";

/**
 * End-to-end tests: npm run test:e2e. They run against a production build on port 3200 and use the
 * database in .env: each test file creates its own fixture page and cards and removes them afterwards.
 * They drive the Chrome that is installed on the machine (no browser download).
 */
const PORT = 3200;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    ...devices["Pixel 7"],
    channel: "chrome",
  },
  webServer: {
    command: `npm run build && npx next start -p ${PORT}`,
    url: `http://localhost:${PORT}/inactive`,
    reuseExistingServer: true,
    timeout: 300_000,
  },
});
