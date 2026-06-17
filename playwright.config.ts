import { defineConfig } from "@playwright/test";

const PORT = 3000;
const BASE_URL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./tests",
  testMatch: ["e2e/**/*.spec.ts", "security/**/*.spec.ts"],
  fullyParallel: true,
  use: { baseURL: BASE_URL },
  // Header assertions run against a production server (HSTS/CSP are prod-gated).
  webServer: {
    command: "bun run start",
    url: `${BASE_URL}/storage`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
