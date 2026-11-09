//
//  playwright.config.ts
//  playwright-demo-framework
//
//  Equivalent of Nike App Android app/build.gradle test config + build flavors.
//  Projects below mirror Nike's build-flavor × locale matrix.
//

import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config();

const BASE_URL = process.env.BASE_URL ?? 'https://automationexercise.com';

const sharedUse = {
    baseURL: BASE_URL,
    trace: 'on-first-retry' as const,         // Playwright Trace Viewer on retry
    screenshot: 'only-on-failure' as const,   // = ScreenshotTaker.kt
    video: 'retain-on-failure' as const,
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
    // automationexercise.com tags inputs with `data-qa` instead of `data-testid`.
    // Teach `page.getByTestId(...)` to honour that attribute.
    testIdAttribute: 'data-qa',
};

export default defineConfig({
    testDir: '.',                             // look in both src/testSteps and tests/
    testMatch: ['src/testSteps/**/*.spec.ts', 'tests/**/*.spec.ts'],
    testIgnore: ['tests/*.setup.ts'],         // setup files are referenced by the `setup` project below
    outputDir: 'test-results',
    timeout: 90_000,                          // per-test
    expect: { timeout: 10_000, toHaveScreenshot: { maxDiffPixels: 50 } },

    // Runs ONCE before any project — bootstraps the P1 demo account via REST.
    globalSetup: require.resolve('./tests/global.setup.ts'),

    fullyParallel: true,
    workers: process.env.CI ? 4 : undefined,
    retries: process.env.CI ? 2 : 0,          // = RetryTestRule(retryCount = 2)
    forbidOnly: !!process.env.CI,
    reporter: [
        ['list'],
        ['html', { outputFolder: 'reports/html', open: 'never' }],
        ['junit', { outputFile: 'reports/junit.xml' }],
        ['json',  { outputFile: 'reports/results.json' }],
        // Evening 3 will add: ['./src/utils/reporting/DocumentationReporter.ts']
        //                    ['./src/utils/reporting/SlackReporter.ts']
    ],
    use: sharedUse,

    // ────────────────────────────────────────────────────────────────────
    // Projects matrix: browser × locale × device
    // Mirrors Nike build flavors (world / china) + per-locale annotations.
    // Run with --project=<name>, or run all with just `npm test`.
    // ────────────────────────────────────────────────────────────────────
    projects: [
        // ── Setup project: UI-logs-in once, persists storageState to .auth/user.json
        {
            name: 'setup',
            testMatch: /tests[\\/]auth\.setup\.ts/,
            testIgnore: [],                         // override global testIgnore so auth.setup.ts is discovered
            use: { ...devices['Desktop Chrome'], ...sharedUse, locale: 'en-US' },
        },

        {
            name: 'chromium-en-US',
            dependencies: ['setup'],
            use: {
                ...devices['Desktop Chrome'],
                ...sharedUse,
                locale: 'en-US',
                timezoneId: 'America/New_York',
            },
        },
        {
            name: 'webkit-en-US',
            dependencies: ['setup'],
            use: {
                ...devices['Desktop Safari'],
                ...sharedUse,
                locale: 'en-US',
                timezoneId: 'America/New_York',
            },
        },
        {
            name: 'mobile-chrome-pixel7',
            dependencies: ['setup'],
            use: {
                ...devices['Pixel 7'],
                ...sharedUse,
                locale: 'en-US',
            },
        },
        {
            name: 'chromium-fr-FR',
            dependencies: ['setup'],
            use: {
                ...devices['Desktop Chrome'],
                ...sharedUse,
                locale: 'fr-FR',
                timezoneId: 'Europe/Paris',
            },
        },
    ],
});
