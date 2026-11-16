import { defineConfig, devices } from '@playwright/test'

const port = process.env.E2E_PORT ?? '3000'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  use: { baseURL: `http://localhost:${port}` },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: `npm run start -- -p ${port}`,
    url: `http://localhost:${port}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
