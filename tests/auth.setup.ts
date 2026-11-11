//
//  auth.setup.ts
//
//  Playwright "setup project" pattern. Before any browser-project runs, this
//  file logs in as the P1 user via the real /login UI and persists the
//  browser context's storageState (cookies + localStorage) to .auth/user.json.
//
//  Any spec that needs an authenticated session just opts in:
//
//      test.use({ storageState: AUTH_STATE_FILE });
//
//  Mirrors the reference suite's `preTestLoginBySpecificAccount(testAccount)` call, except
//  it happens once and is reused — which is faster and far more stable.
//

import { test as setup, expect } from '@playwright/test';
import { P1_DEMO_ACCOUNT } from '../src/resources/TestData';
import { AUTH_STATE_FILE } from '../src/resources/AuthState';
import { SutAvailabilityHelper } from '../src/utils/helpers/SutAvailabilityHelper';
import * as path from 'path';
import * as fs from 'fs';

// Tag with every common filter so `--grep @P1` / `@P2` / `@smoke` / `@regression`
// still triggers this setup project (Playwright applies --grep to all projects,
// including setup dependencies).
setup('@setup @P1 @P2 @smoke @regression authenticate as P1 user and persist storageState',
    async ({ page }) => {
    fs.mkdirSync(path.dirname(AUTH_STATE_FILE), { recursive: true });

    // automationexercise.com periodically enables Cloudflare under-attack mode
    // and serves a `<title>One moment, please…</title>` interstitial instead of
    // the real /login HTML. In that state `getByTestId('login-email')` simply
    // times out — producing a misleading "element not found" that looks like a
    // broken selector. `gotoWithChallengeRetry` detects the interstitial and
    // either backs off + retries, or fails fast with a labeled SUT-unavailable
    // error so the operator knows it's upstream, not us.
    await SutAvailabilityHelper.gotoWithChallengeRetry(page, '/login', {
        attempts: 4,
        initialBackoffMs: 2_000,
        waitForSelector: '[data-qa="login-email"]',
        label: 'auth.setup → /login',
    });

    await page.getByTestId('login-email').fill(P1_DEMO_ACCOUNT.email);
    await page.getByTestId('login-password').fill(P1_DEMO_ACCOUNT.password);
    await page.getByTestId('login-button').click();

    // After successful login the nav shows "Logged in as <name>".
    await expect(page.getByText(/Logged in as/i)).toBeVisible({ timeout: 15_000 });

    await page.context().storageState({ path: AUTH_STATE_FILE });
    console.log(`[auth.setup] storageState persisted → ${AUTH_STATE_FILE}`);
    });

