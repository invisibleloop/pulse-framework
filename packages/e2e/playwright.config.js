import { defineConfig } from '@playwright/test'

// Two servers over the same fixture app: `pulse dev` (source modules, import map) and the
// production path (`pulse build` bundles, then `pulse start`). Every test runs against both.
// Paths are relative to fixture/, where the servers run
const CLI = '../../pulse/src/cli/index.js'

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['github']] : 'list',
  use: { trace: 'retain-on-failure' },
  projects: [
    { name: 'dev',  use: { baseURL: 'http://localhost:3500' } },
    { name: 'prod', use: { baseURL: 'http://localhost:3501' } },
  ],
  webServer: [
    {
      // PORT must be set explicitly: a PORT already in the environment overrides --port.
      command: `node ../prepare.js && node ${CLI} dev --port 3500`,
      cwd: 'fixture',
      env: { PORT: '3500' },
      url: 'http://localhost:3500/',
      // Never reuse a server that is already listening: it could be an unrelated app (or a stale
      // build), and the suite would pass or fail against that instead of this checkout.
      reuseExistingServer: false,
      timeout: 60_000,
    },
    {
      command: `node ../prepare.js && node ${CLI} build && node ${CLI} start --port 3501`,
      cwd: 'fixture',
      env: { PORT: '3501' },
      url: 'http://localhost:3501/',
      reuseExistingServer: false,
      timeout: 120_000,
    },
  ],
})
