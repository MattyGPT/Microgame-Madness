const { defineConfig, devices } = require("@playwright/test");
module.exports = defineConfig({
  testDir: "./web/tests",
  testMatch: "*.spec.cjs",
  timeout: 90000,
  expect: { timeout: 30000 },
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: "http://127.0.0.1:8766",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "desktop",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 1100 },
      },
    },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  webServer: {
    command: "python3 -m http.server 8766 --bind 127.0.0.1 --directory dist",
    url: "http://127.0.0.1:8766",
    reuseExistingServer: !process.env.CI,
  },
});
