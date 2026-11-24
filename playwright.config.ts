import { defineConfig, devices } from '@playwright/test'

const port = process.env.E2E_PORT ?? '3000'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  use: { baseURL: `http://localhost:${port}` },
  projects: [
    { name: 'chromium', testIgnore: /(house|fallback|perf)\.spec\.ts/, use: { ...devices['Desktop Chrome'] } },
    {
      // maquete 3D: WebGL por software no headless, para o canvas realmente renderizar
      name: 'webgl',
      testMatch: /(house|perf)\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        // sem voo de abertura/auto-rotação: o SwiftShader desenha ~1 quadro/s
        reducedMotion: 'reduce',
        launchOptions: { args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] },
      },
    },
    {
      // sem WebGL: o fallback estático tem de funcionar sozinho
      name: 'no-webgl',
      testMatch: /fallback\.spec\.ts/,
      use: { ...devices['Desktop Chrome'], launchOptions: { args: ['--disable-webgl', '--disable-gpu'] } },
    },
  ],
  webServer: {
    command: `npm run start -- -p ${port}`,
    url: `http://localhost:${port}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
