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

import { test as setup, expect, request as playwrightRequest } from '@playwright/test';
import { TestData, P1_DEMO_ACCOUNT } from '../src/resources/TestData';
import { AUTH_STATE_FILE } from '../src/resources/AuthState';
import { SutAvailabilityHelper } from '../src/utils/helpers/SutAvailabilityHelper';
import { UserAccountApiClient } from '../src/utils/api/clients/UserAccountApiClient';
import * as path from 'path';
import * as fs from 'fs';

/**
 * How many full UI-login attempts we make before giving up. Each attempt is a
 * fresh `/login` goto → fill → click → expect. Between attempts we re-POST
 * `/api/createAccount` so that if the account vanished (e.g. a parallel CI
 * shard's global.setup deleted it, or the AUT reset) the next attempt has a
 * valid account to log in against. This is the retry that actually matters —
 * the one inside `gotoWithChallengeRetry` only protects the goto itself, not
 * the fill/click/expect that follows.
 */
const MAX_LOGIN_ATTEMPTS = 3;

/** Browser-like headers so the API self-heal doesn't trip Cloudflare on its own. */
const BROWSER_LIKE_HEADERS: Record<string, string> = {
    'user-agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 ' +
        '(KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36',
    'accept-language': 'en-US,en;q=0.9',
    accept: 'application/json, text/plain, */*',
};

/**
 * Best-effort "re-create the demo account via REST" between failed UI login
 * attempts. Swallows all errors — if this fails we still let the next UI
 * attempt run; the loop's own error-reporting handles the final verdict.
 */
async function recreateDemoAccount(label: string): Promise<void> {
    try {
        const ctx = await playwrightRequest.newContext({ extraHTTPHeaders: BROWSER_LIKE_HEADERS });
        try {
            const api = new UserAccountApiClient(ctx);
            const payload = new TestData().buildCreateAccountPayload(P1_DEMO_ACCOUNT);
            const resp = await api.createAccount(payload);
            console.log(
                `[auth.setup] ${label}: re-posted createAccount for ${P1_DEMO_ACCOUNT.email} ` +
                `(code=${resp.responseCode}, message=${resp.message})`,
            );
        } finally {
            await ctx.dispose();
        }
    } catch (err) {
        console.warn(`[auth.setup] ${label}: account self-heal failed (will still try UI): ${(err as Error).message}`);
    }
}

// Tag with every common filter so `--grep @P1` / `@P2` / `@smoke` / `@regression`
// still triggers this setup project (Playwright applies --grep to all projects,
// including setup dependencies).
setup('@setup @P1 @P2 @smoke @regression authenticate as P1 user and persist storageState',
    async ({ page }) => {
    fs.mkdirSync(path.dirname(AUTH_STATE_FILE), { recursive: true });

    let lastErr: Error | undefined;

    for (let attempt = 1; attempt <= MAX_LOGIN_ATTEMPTS; attempt++) {
        try {
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
                label: `auth.setup → /login (attempt ${attempt}/${MAX_LOGIN_ATTEMPTS})`,
            });

            // Belt-and-suspenders: wait for the input to be actionable, not just
            // present. Without this, a Cloudflare refresh that fires between
            // `waitForSelector` and `.fill()` detaches the locator and burns the
            // full 15 s actionTimeout waiting for an element that won't come back.
            const emailInput = page.getByTestId('login-email');
            await emailInput.waitFor({ state: 'visible', timeout: 10_000 });

            await emailInput.fill(P1_DEMO_ACCOUNT.email);
            await page.getByTestId('login-password').fill(P1_DEMO_ACCOUNT.password);

            // Couple the click to the post-login navigation so we don't race it.
            // The AUT 302s to `/` on success; `waitForLoadState('domcontentloaded')`
            // fires either way and keeps the two events bound together.
            await Promise.all([
                page.waitForLoadState('domcontentloaded'),
                page.getByTestId('login-button').click(),
            ]);
            // Give any deferred redirects a short settle window — best-effort.
            await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => undefined);

            // After successful login the nav shows "Logged in as <name>".
            await expect(page.getByText(/Logged in as/i)).toBeVisible({ timeout: 15_000 });

            await page.context().storageState({ path: AUTH_STATE_FILE });
            console.log(`[auth.setup] storageState persisted → ${AUTH_STATE_FILE}`);
            return;
        } catch (err) {
            lastErr = err as Error;
            console.warn(
                `[auth.setup] attempt ${attempt}/${MAX_LOGIN_ATTEMPTS} failed: ${lastErr.message.split('\n')[0]}`,
            );

            if (attempt < MAX_LOGIN_ATTEMPTS) {
                // Self-heal: if the account vanished (race with another shard,
                // SUT reset, etc.) re-POST createAccount before the next UI try.
                // Idempotent on the AUT — "email exists" is a non-error.
                await recreateDemoAccount(`attempt ${attempt} recovery`);
                // Small jitter so simultaneous shards don't retry in lockstep.
                await page.waitForTimeout(1_000 + Math.floor(Math.random() * 2_000));
            }
        }
    }

    throw new Error(
        `[auth.setup] UI login failed after ${MAX_LOGIN_ATTEMPTS} attempts for ${P1_DEMO_ACCOUNT.email}. ` +
        `Last error: ${lastErr?.message ?? 'unknown'}`,
    );
});
