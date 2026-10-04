import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests",
  timeout: 30_000,
  webServer: {
    command: `"${process.execPath}" tools/serve.mjs`,
    url: "http://127.0.0.1:8793",
    reuseExistingServer: true,
  },
  use: { baseURL: "http://127.0.0.1:8793", trace: "retain-on-failure" },
  reporter: [["list"]],
});
