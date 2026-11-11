#!/usr/bin/env node
/* Writes the remaining reference-mirrored structural placeholders. */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const w = (rel, body) => {
    const p = path.join(ROOT, rel);
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.writeFileSync(p, body);
    console.log('  +', rel);
};

const stub = (className, refEq, desc) => `//
//  ${className}.ts   (placeholder — populated in Evening 2/3)
//  = reference ${refEq}
//
//  ${desc}
//

export class ${className} {
    // TODO
}
`;

// ── Additional API clients ────────────────────────────────────────────────────
const apiClients = [
    ['UserCartApiClient',        'UserCartApiClient.kt',        'Seeds / clears the cart via REST so UI tests start from a known state.'],
    ['WishlistApiClient',        'WishlistApiClient.kt',        'Add / remove favorites via REST.'],
    ['ShippingAddressApiClient', 'ShippingAddressApiClient.kt', 'Pre-create shipping addresses for checkout tests.'],
    ['StoredPaymentsApiClient',  'StoredPaymentsApiClient.kt',  'Pre-create / clear stored payment methods.'],
    ['ProductFeedApiClient',     'ProductFeedApiClient.kt',     'Query the product catalog for stable SKU/size candidates.'],
    ['ProductRecsApiClient',     'ProductRecsApiClient.kt',     'Query personalized product recommendations.'],
    ['ProductWallApiClient',     'ProductWallApiClient.kt',     'Query search/gridwall results via REST.'],
    ['OnboardingApiClient',      'OnboardingApiClient.kt',      'Drive onboarding state transitions server-side.'],
];
for (const [cls, refEq, desc] of apiClients) {
    w(`src/utils/api/clients/${cls}.ts`,
`//
//  ${cls}.ts   (placeholder — populated in Evening 2)
//  = reference ${refEq}
//  ${desc}
//
import type { APIRequestContext } from '@playwright/test';
import { ApiClientBase } from './ApiClientBase';

export class ${cls} extends ApiClientBase {
    constructor(request: APIRequestContext) { super(request); }
    // TODO: port reference ${refEq} methods.
}
`);
}

// ── API interfaces + models ───────────────────────────────────────────────────
w('src/utils/api/interfaces/IApiClient.ts',
`// = api/interfaces/ in the reference suite
export interface IApiClient {
    readonly baseUrl: string;
}
`);
['User', 'Cart', 'Product', 'Address'].forEach((m) => {
    w(`src/utils/api/models/${m}.ts`, `// = api/models/${m} in the reference suite\nexport interface ${m} { readonly id: string; }\n`);
});

// ── Helpers ───────────────────────────────────────────────────────────────────
const helpers = [
    ['AutoDiscoveryHelper',  'AutoDiscoveryHelper.kt',  'Discover products / SKUs dynamically at runtime.'],
    ['FeatureFlagHelper',    'FeatureFlagHelper.kt',    'Flip feature flags via cookie / localStorage / route-interception.'],
    ['GeolocationHelper',    'MockingLocationHelper.kt','Set browser geolocation + permissions per test.'],
    ['ClockHelper',          '(new)',                   'page.clock.install / fastForward for time-sensitive flows.'],
    ['DownloadUploadHelper', 'GalleryIntentComposer.kt','Wrap setInputFiles + download waits.'],
    ['NetworkHelper',        'OkHttpManager.kt',        'Route interception, HAR record/replay, CDP throttle.'],
    ['ShellCommandHelper',   'ShellCommandGenerator.kt','Spawn shell commands for Docker/adb-equivalent ops.'],
    ['ManageCartHelper',     'ManageCartHelper.kt',     'High-level cart composition across API + UI.'],
    ['SafeZoneHelper',       'SafeZoneHelper.kt',       'Viewport-safe tapping on mobile emulation.'],
];
for (const [cls, refEq, desc] of helpers) {
    w(`src/utils/helpers/${cls}.ts`, stub(cls, refEq, desc));
}

// ── Reporters ────────────────────────────────────────────────────────────────
const reporters = [
    ['DocumentationReporter', 'DocumentationReportHelper.kt', 'Custom Playwright reporter that reads @Description + @Documentation annotations.'],
    ['ScreenshotProcessor',   'ScreenCaptureProcessor.kt',    'Post-processes screenshot folders (crop, resize, upload to S3).'],
    ['ScreenshotTaker',       'ScreenshotTaker.kt',           'Manual screenshot helper for mid-test captures.'],
    ['JiraAnnotator',         '(new)',                         'Custom reporter: posts pass/fail back to Jira comments.'],
    ['SlackReporter',         '(new)',                         'Custom reporter: posts a run summary to Slack.'],
    ['AllureSetup',           '(new)',                         'allure-playwright wiring.'],
];
for (const [cls, refEq, desc] of reporters) {
    w(`src/utils/reporting/${cls}.ts`, stub(cls, refEq, desc));
}

// ── UI / networkrewriter ─────────────────────────────────────────────────────
w('src/ui/networkrewriter/NetworkRewriter.ts',
`// = ui/networkrewriter/ in reference — wraps page.route() so feature specs can
// rewrite responses without knowing Playwright plumbing.
import type { BrowserContext } from '@playwright/test';

export class NetworkRewriter {
    constructor(private readonly context: BrowserContext) {}
    // TODO: mock(request) / rewrite(url, body) / etc.
}
`);

// ── Extensions ───────────────────────────────────────────────────────────────
w('src/utils/extensions/ExpectExtensions.ts',
`// Custom matchers (= TaggedAssert in reference).
// Evening 3 will add: expect.extend({ toHaveCurrencyFormat(...) }).
export {};
`);
w('src/utils/extensions/LocatorExtensions.ts',
`// Shared locator-building conventions.
export {};
`);

// ── Accessibility ────────────────────────────────────────────────────────────
w('src/accessibility/AccessibilityCheck.ts',
`// = accessibility/ in reference — axe-core wrapper, added in Evening 3.
// npm i -D @axe-core/playwright
export async function runAccessibilityCheck(/* page: Page, name: string */): Promise<void> {
    // TODO
}
`);
w('src/accessibility/AccessibilitySuppressionsRepository.ts',
`// = accessibility/AccessibilitySuppressionsRepository in reference.
export const ACCESSIBILITY_SUPPRESSIONS: Array<{ ruleId: string; reason: string }> = [];
`);

// ── Utility files ────────────────────────────────────────────────────────────
w('src/utils/DeeplinkNavigator.ts',
`// = DeeplinkNavigator.kt
import type { Page } from '@playwright/test';

export class DeeplinkNavigator {
    constructor(private readonly page: Page) {}
    async open(path: string) { await this.page.goto(path); }
}
`);
w('src/utils/BrowserContextWrappers.ts',
`// = InstrumentationRegistryWrappers.kt — convenience wrappers around context ops.
import type { BrowserContext } from '@playwright/test';

export class BrowserContextWrappers {
    constructor(private readonly context: BrowserContext) {}
}
`);

// ── tests/ entrypoints ───────────────────────────────────────────────────────
w('tests/global.setup.ts',
`//
//  global.setup.ts   (placeholder — populated in Evening 2)
//  = reference pre-test bootstrap
//
//  Evening 2 will: create P1/P2 test users via UserAccountApiClient,
//  write storageState to .auth/<user>.json, consumed by the chromium-en-US project.
//
export default async function globalSetup(): Promise<void> {
    // TODO
}
`);
w('tests/global.teardown.ts',
`// Runs after all projects finish. Evening 2 will delete seeded users.
export default async function globalTeardown(): Promise<void> {}
`);
w('tests/auth.setup.ts',
`//
//  auth.setup.ts   (placeholder — populated in Evening 2)
//
//  Will log in each test user once and persist storageState so subsequent
//  tests re-use the cookies instead of re-logging through the UI.
//
export {};
`);
w('tests/api/health.api.spec.ts',
`// Pure-API smoke test — demonstrates APIRequestContext fixture usage.
import { test, expect } from '@playwright/test';

test.describe('AUT /productsList — @P1 @api', { tag: ['@P1', '@api'] }, () => {
    test('productsList endpoint returns a non-empty catalog', async ({ request }) => {
        const res = await request.get('https://automationexercise.com/api/productsList');
        expect(res.ok()).toBeTruthy();
        const json = await res.json();
        expect(Array.isArray(json.products)).toBeTruthy();
        expect(json.products.length).toBeGreaterThan(0);
    });
});
`);

// ── CI workflows ─────────────────────────────────────────────────────────────
w('.github/workflows/pr.yml',
`# ≈ Reference Jenkinsfile-android-feature-dev.groovy
# Runs P1 smoke on every pull request, 2 shards in parallel.
name: PR • P1 Smoke
on:
  pull_request:
    branches: [ main ]

jobs:
  smoke:
    name: P1 Smoke (shard \${{ matrix.shard }}/2)
    runs-on: ubuntu-latest
    strategy:
      fail-fast: false
      matrix:
        shard: [1, 2]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: npm }
      - run: npm ci
      - run: npx playwright install --with-deps chromium webkit
      - run: npx playwright test --grep @P1 --shard=\${{ matrix.shard }}/2
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: html-report-shard-\${{ matrix.shard }}
          path: reports/html
          retention-days: 7
`);
w('.github/workflows/nightly.yml',
`# ≈ Reference Jenkinsfile-android-qe-multi-threaded-dynamic.groovy
# Runs the full P2 regression on cron, 4 shards × 2 projects.
name: Nightly • P2 Regression
on:
  schedule: [ { cron: '0 4 * * *' } ]
  workflow_dispatch:

jobs:
  regression:
    runs-on: ubuntu-latest
    strategy:
      fail-fast: false
      matrix:
        shard: [1, 2, 3, 4]
        project: [chromium-en-US, webkit-en-US]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: npm }
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npx playwright test --grep @P2 --project=\${{ matrix.project }} --shard=\${{ matrix.shard }}/4
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: results-\${{ matrix.project }}-shard-\${{ matrix.shard }}
          path: |
            reports/
            test-results/
`);
w('.github/workflows/rc.yml',
`# ≈ Reference Jenkinsfile-android-qe-rc-trigger.groovy
# Runs when a release candidate tag is pushed.
name: RC • Full suite
on:
  push:
    tags: [ 'v*' ]

jobs:
  rc:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: npm }
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npx playwright test
`);

// ── Docker ───────────────────────────────────────────────────────────────────
w('Dockerfile',
`# Mirrors the reference suite's runner image. Pinned Playwright image includes browsers.
FROM mcr.microsoft.com/playwright:v1.49.0-jammy
WORKDIR /work
COPY package*.json ./
RUN npm ci
COPY . .
CMD ["npx", "playwright", "test"]
`);
w('docker-compose.yml',
`# Optional: run the tests in a container identical to CI.
services:
  tests:
    build: .
    environment:
      BASE_URL: https://automationexercise.com
    volumes:
      - ./reports:/work/reports
      - ./test-results:/work/test-results
`);
w('mise.toml',
`# = reference mise.toml — pin tool versions for all contributors.
[tools]
node = "20.18.1"
`);
w('scripts/pre-validation.sh',
`#!/usr/bin/env bash
# = reference pre-validation.sh — fast checks run before heavy test invocations.
set -e
npm run lint || true
npx tsc --noEmit
echo "pre-validation: OK"
`);

// ── Docs ─────────────────────────────────────────────────────────────────────
w('docs/architecture.md', `# Architecture\n\nSee README.md for the full Mermaid diagram.\n`);
w('docs/demo-script.md',
`# Interview demo — 5 minute script

1. Open \`README.md\` — point at the architecture diagram + CI badge (10s).
2. Open \`playwright.config.ts\` — "cross-browser × locale matrix, retries, trace on retry" (30s).
3. Open \`src/testSteps/base/UITestBase.ts\` — "this is my UITestBase.kt from reference, as fixtures" (45s).
4. Open \`src/testSteps/login/P1LoginTests.spec.ts\` — "P1 tag, Jira annotation, step-wrapped actions" (45s).
5. Run: \`npm run test:p1 -- --project=chromium-en-US\` (60s).
6. Break a selector → \`npm test\` → open HTML report → show screenshot + video + trace (90s).
7. Open \`.github/workflows/pr.yml\` — "sharded matrix, artifacts uploaded" (30s).

Total ≈ 5:20. Every click lands on a different interview signal.
`);
w('docs/concept-coverage.md',
`# Playwright concept coverage matrix

| # | Concept | Lives in |
|--|--|--|
| 1 | Custom fixtures | src/testSteps/base/UITestBase.ts |
| 2 | Projects × locale matrix | playwright.config.ts |
| 3 | Retries | playwright.config.ts + base/rules/RetryTestRule.ts |
| 4 | Trace / screenshot / video | playwright.config.ts use: {} |
| 5 | Tags @P1 @P2 @smoke @regression | every spec |
| 6 | API testing via request fixture | src/utils/api/clients/ + tests/api/ |
| 7 | Role / testid / label / text locators | every *Steps.ts |
| 8 | test.step() | every page-object method |
| 9 | Annotations (description, jira) | src/utils/annotations/ |
| 10 | DisabledTestRule / fixme / skip | src/testSteps/base/rules/DisabledTestRule.ts |
| 11 | Custom reporters | src/utils/reporting/DocumentationReporter.ts (Evening 3) |
| 12 | Sharding --shard k/N | .github/workflows/nightly.yml |
| 13 | Dockerized runner | Dockerfile + docker-compose.yml |
| 14 | Env config | .env.example + dotenv |
| 15 | storageState auth | tests/auth.setup.ts (Evening 2) |
| 16 | Mobile emulation | playwright.config.ts (mobile-chrome-pixel7) |
| 17 | Geolocation / locale / timezone | playwright.config.ts + helpers/GeolocationHelper.ts |
| 18 | Clock mocking | helpers/ClockHelper.ts (Evening 3) |
| 19 | Network stubbing page.route() | ui/networkrewriter/NetworkRewriter.ts (Evening 3) |
| 20 | HAR record/replay | helpers/NetworkHelper.ts (Evening 3) |
| 21 | Visual regression toHaveScreenshot | visual-baselines/ (Evening 3) |
| 22 | Accessibility (axe) | src/accessibility/AccessibilityCheck.ts (Evening 3) |
| 23 | Component tests (experimental) | tests/ct/ (stretch) |
| … | 30+ more concepts documented over Evenings 2–4 | — |
`);

console.log('\nAll remaining placeholders written.');
