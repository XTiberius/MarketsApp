import { defineConfig, devices } from '@playwright/test'

// Load the app's local env (NEXT_PUBLIC_* + SUPABASE_SERVICE_ROLE_KEY) into the
// Playwright process so admin-bypass seeding works. Optional: public-only and CI
// runs don't need it. Uses Node's built-in loader (no extra dependency).
try {
  process.loadEnvFile('.env.local')
} catch {
  // .env.local absent — authed/admin specs will skip; public specs still run.
}

const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  workers: 1,
  globalSetup: './tests/fixtures/global-setup',
  globalTeardown: './tests/fixtures/global-teardown',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'npm run build && npm run start',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [
    {
      name: 'public',
      testMatch: /public\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'investor',
      testMatch: /investor\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        storageState: serviceRoleKey ? 'tests/.auth/investor.json' : undefined,
      },
    },
    {
      name: 'admin',
      testMatch: /admin\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        storageState: serviceRoleKey ? 'tests/.auth/admin.json' : undefined,
      },
    },
  ],
})
