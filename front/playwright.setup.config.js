import { defineConfig, devices } from '@playwright/test';

// Config dédiée à l'assistant de configuration initiale (/setup).
// Contrairement à playwright.config.js (build + preview statique, sans proxy API),
// ce fichier cible le serveur de dev Vite, dont le proxy `/api` redirige vers le
// backend Express — nécessaire puisque l'assistant dialogue en continu avec l'API.
export default defineConfig({
  testDir: './e2e',
  testMatch: /setup\.spec\.js/,
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [['html', { open: 'never' }], ['list']] : 'list',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  webServer: [
    {
      command: 'npm run dev --prefix ../back',
      url: 'http://localhost:3001/api/setup',
      reuseExistingServer: true,
      timeout: 60 * 1000,
    },
    {
      command: 'npm run dev',
      url: 'http://localhost:5173',
      reuseExistingServer: true,
      timeout: 60 * 1000,
    },
  ],
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
