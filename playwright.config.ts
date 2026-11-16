import { defineConfig } from "playwright/test";

import { loadSiteEnvironment } from "./scripts/lib/environment.ts";

loadSiteEnvironment("development");
const devURL = "http://127.0.0.1:5191";
const productionURL = "http://127.0.0.1:5192";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 120_000,
  workers: 1,
  forbidOnly: !!process.env.CI,
  reporter: "list",
  use: {
    headless: true,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "fixture",
      testMatch: /\/(browser|review|works)\.spec\.ts$/,
      use: { baseURL: devURL },
    },
    {
      name: "content",
      testMatch: "content.spec.ts",
      use: { baseURL: productionURL },
    },
    {
      name: "live",
      testMatch: "live/*.spec.ts",
      use: { baseURL: process.env.TEST_BASE_URL ?? devURL },
    },
  ],
  webServer: [
    {
      command: "npm run dev -- --host 127.0.0.1 --port 5191 --strictPort",
      url: devURL,
      env: {
        VITE_CTF_SPACE_ID: "fixture-space",
        VITE_CTF_CDA_ACCESS_TOKEN: "fixture-token",
        VITE_API_BASE_URL: devURL,
      },
      reuseExistingServer: false,
    },
    {
      command: "npm run preview",
      url: productionURL,
      env: { PORT: "5192" },
      reuseExistingServer: false,
    },
  ],
});
