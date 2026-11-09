# Playwright concept coverage matrix

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
