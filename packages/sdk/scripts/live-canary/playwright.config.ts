import { defineConfig, devices } from "@playwright/test";

// eslint-disable-next-line turbo/no-undeclared-env-vars -- This opt-in canary reads a repository variable outside normal Turbo tasks.
const applicationId = process.env.FINIX_SANDBOX_APPLICATION_ID?.trim();

if (!applicationId) {
  throw new Error("FINIX_SANDBOX_APPLICATION_ID is required to run the live Finix CDN canary.");
}

export default defineConfig({
  testDir: ".",
  // Keep a non-Vitest suffix so the normal unit command cannot collect this network suite.
  testMatch: "finix-v2.canary.ts",
  fullyParallel: false,
  forbidOnly: true,
  retries: 1,
  workers: 1,
  timeout: 60_000,
  expect: {
    timeout: 15_000,
  },
  reporter: "line",
  outputDir: "test-results",
  use: {
    baseURL: "http://127.0.0.1:4177",
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium-desktop-light",
      grep: /@desktop/,
      use: {
        ...devices["Desktop Chrome"],
        colorScheme: "light",
      },
    },
    {
      name: "chromium-mobile-dark",
      grep: /@mobile/,
      use: {
        ...devices["Pixel 5"],
        colorScheme: "dark",
      },
    },
  ],
  webServer: {
    command: "pnpm exec tsx scripts/live-canary/server.ts",
    url: "http://127.0.0.1:4177/health",
    timeout: 30_000,
    reuseExistingServer: false,
  },
});
