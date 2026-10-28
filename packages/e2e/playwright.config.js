import { defineConfig } from '@playwright/test'

// Two servers over the same fixture app: `pulse dev` (source modules, import map) and the
// production path (`pulse build` bundles, then `pulse start`). Every test runs against both.
const CLI = '../pulse/src/cli/index.js'
const STYLES = 'mkdir -p fixture/public && cp ../pulse/public/pulse-ui.css fixture/public/pulse-ui.css'

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
      command: `${STYLES} && cd fixture && PORT=3500 node ../${CLI} dev --port 3500`,
      url: 'http://localhost:3500/',
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
    },
    {
      command: `${STYLES} && cd fixture && node ../${CLI} build && PORT=3501 node ../${CLI} start --port 3501`,
      url: 'http://localhost:3501/',
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
  ],
})
