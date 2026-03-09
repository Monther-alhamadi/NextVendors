import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  globalSetup: require.resolve("./e2e/global-setup"),
  globalTeardown: require.resolve("./e2e/global-teardown"),
  // Increase timeouts to reduce CI flakiness on slower runners
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  use: {
    baseURL: process.env.FRONTEND_URL || "http://127.0.0.1:3000",
    headless: true,
    viewport: { width: 1280, height: 720 },
    actionTimeout: 10_000,
    ignoreHTTPSErrors: true,
    // Collect trace on first retry for easier debugging
    trace: "on-first-retry",
  },
  webServer: {
    command: `npm run dev -- --port ${
      process.env.FRONTEND_PORT || process.env.PORT || 3000
    } --strictPort`,
    url:
      process.env.FRONTEND_URL ||
      `http://127.0.0.1:${
        process.env.FRONTEND_PORT || process.env.PORT || 3000
      }`,
    timeout: 120_000,
    reuseExistingServer: true,
  },
});
