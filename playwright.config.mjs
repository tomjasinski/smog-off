import fs from 'node:fs';
import path from 'node:path';
import { defineConfig, devices } from '@playwright/test';
import { buildFixture } from './e2e/fixture.mjs';

// Testy przeglądarkowe działają na zbudowanej aplikacji z danymi testowymi (bez prawdziwego API),
// więc są powtarzalne. Plik z danymi powstaje przy każdym uruchomieniu, ze świeżymi znacznikami czasu.
const PORT = 3100;
const fixtureFile = path.join(process.cwd(), 'e2e', '.fixture.json');
fs.writeFileSync(fixtureFile, JSON.stringify(buildFixture()));

export default defineConfig({
  testDir: 'e2e',
  testMatch: '**/*.spec.js',
  timeout: 45_000,
  expect: { timeout: 15_000 },
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    serviceWorkers: 'block',
    trace: 'retain-on-failure'
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'phone', use: { ...devices['Pixel 7'] } }
  ],
  webServer: {
    // Strony statyczne powstają przy budowaniu, więc budowanie też używa danych testowych
    command: `npm run build && npx next start -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    timeout: 240_000,
    reuseExistingServer: false,
    env: { AIR_QUALITY_FIXTURE_FILE: fixtureFile }
  }
});
