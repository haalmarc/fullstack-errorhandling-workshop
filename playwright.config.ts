import { defineConfig } from '@playwright/test';

const variant = process.env.WORKSHOP_VARIANT === 'start' ? 'start' : 'losningsforslag';
export default defineConfig({
  testDir: './tests/browser',
  workers: 1,
  use: { baseURL: 'http://localhost:5173', browserName: 'chromium', trace: 'retain-on-failure' },
  webServer: [
    {
      command: `dotnet run --no-launch-profile --project ${variant}/backend -- --environment Development --BeerTypes:Offline true --DatabasePath data/e2e-${variant}.db`,
      url: 'http://localhost:5050/api/health', reuseExistingServer: false,
    },
    { command: variant === 'start' ? 'npm run dev' : 'npm run dev:losningsforslag', url: 'http://localhost:5173', reuseExistingServer: false },
  ],
});
