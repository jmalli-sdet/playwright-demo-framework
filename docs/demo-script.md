# Interview demo — 5 minute script

1. Open `README.md` — point at the architecture diagram + CI badge (10s).
2. Open `playwright.config.ts` — "cross-browser × locale matrix, retries, trace on retry" (30s).
3. Open `src/testSteps/base/UITestBase.ts` — "this is my UITestBase.kt from reference, as fixtures" (45s).
4. Open `src/testSteps/login/P1LoginTests.spec.ts` — "P1 tag, Jira annotation, step-wrapped actions" (45s).
5. Run: `npm run test:p1 -- --project=chromium-en-US` (60s).
6. Break a selector → `npm test` → open HTML report → show screenshot + video + trace (90s).
7. Open `.github/workflows/pr.yml` — "sharded matrix, artifacts uploaded" (30s).

Total ≈ 5:20. Every click lands on a different interview signal.
