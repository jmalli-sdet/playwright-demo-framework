//
//  global.setup.ts
//
//  Runs ONCE before any project. Idempotently creates the P1 demo account on
//  automationexercise.com via POST /api/createAccount so every subsequent spec
//  (via UITestBase fixtures + the `setup` project) can rely on the account
//  existing. If the account already exists (second run), we silently continue.
//
//  Direct Reference analog: the preTestLoginBySpecificAccount() + API-seed phase
//  in UITestBase.kt, except here we do it once per run instead of once per test.
//

import { request as playwrightRequest, type FullConfig } from '@playwright/test';
import { UserAccountApiClient } from '../src/utils/api/clients/UserAccountApiClient';
import { TestData, P1_DEMO_ACCOUNT } from '../src/resources/TestData';
import { SutAvailabilityHelper } from '../src/utils/helpers/SutAvailabilityHelper';

/**
 * Headers that make the APIRequestContext look like a real desktop browser to
 * Cloudflare's bot heuristics. The default Playwright UA string (`Playwright/
 * 1.x (…) node/…`) is frequently flagged, which is one of the reasons the
 * /api/createAccount endpoint starts returning the "One moment, please…"
 * interstitial from GitHub Actions runners.
 */
const BROWSER_LIKE_HEADERS: Record<string, string> = {
    'user-agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 ' +
        '(KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36',
    'accept-language': 'en-US,en;q=0.9',
    accept: 'application/json, text/plain, */*',
};

const API_RETRY_ATTEMPTS = 4;
const API_RETRY_INITIAL_BACKOFF_MS = 2_000;
const API_RETRY_MAX_BACKOFF_MS = 15_000;

/** Sleep helper that doesn't need an external import. */
const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/**
 * Try `fn` up to {@link API_RETRY_ATTEMPTS} times, backing off exponentially
 * whenever the thrown error looks like a Cloudflare interstitial. Any other
 * error is rethrown immediately so we don't mask a real bug.
 */
async function withChallengeRetry<T>(label: string, fn: () => Promise<T>): Promise<T> {
    let backoff = API_RETRY_INITIAL_BACKOFF_MS;
    let lastErr: unknown;

    for (let i = 1; i <= API_RETRY_ATTEMPTS; i++) {
        try {
            return await fn();
        } catch (err) {
            lastErr = err;
            const msg = (err as Error).message ?? '';
            if (!SutAvailabilityHelper.isChallengeBody(msg)) {
                throw err;
            }
            console.warn(
                `[global.setup] ${label}: Cloudflare challenge on attempt ${i}/${API_RETRY_ATTEMPTS}. ` +
                `Backing off ${backoff}ms before retrying…`,
            );
            await sleep(backoff);
            backoff = Math.min(backoff * 2, API_RETRY_MAX_BACKOFF_MS);
        }
    }

    throw new Error(
        `SUT unavailable (Cloudflare bot challenge) — ${label} returned the ` +
        `"One moment, please…" interstitial on all ${API_RETRY_ATTEMPTS} attempts. ` +
        `This is an upstream issue with automationexercise.com; retry when the site ` +
        `drops out of under-attack mode. Underlying error: ${(lastErr as Error)?.message}`,
    );
}

export default async function globalSetup(_config: FullConfig): Promise<void> {
    console.log('\n[global.setup] Ensuring P1 demo account exists on automationexercise.com …');

    const ctx = await playwrightRequest.newContext({
        extraHTTPHeaders: BROWSER_LIKE_HEADERS,
    });
    const api = new UserAccountApiClient(ctx);
    const testData = new TestData();
    const payload = testData.buildCreateAccountPayload(P1_DEMO_ACCOUNT);

    try {
        // 1. Delete any prior instance so each run starts with the same, known-good
        //    account data (right name, address, etc.). 404 "not found" is fine.
        try {
            const del = await withChallengeRetry(
                'deleteAccount',
                () => api.deleteAccount(P1_DEMO_ACCOUNT.email, P1_DEMO_ACCOUNT.password),
            );
            if (del.responseCode === 200) {
                console.log(`[global.setup] 🧹 Cleared stale account: ${P1_DEMO_ACCOUNT.email}`);
            }
        } catch (delErr) {
            // Delete failures are only fatal when the SUT is down. A missing
            // account (404/"Account not found") is a totally normal state.
            const msg = (delErr as Error).message ?? '';
            if (msg.startsWith('SUT unavailable')) throw delErr;
            /* fresh environment — nothing to delete */
        }

        // 2. Create fresh.
        const resp = await withChallengeRetry('createAccount', () => api.createAccount(payload));
        if (resp.responseCode === 201) {
            console.log(`[global.setup] ✅ Created fresh account: ${P1_DEMO_ACCOUNT.email}`);
        } else if (/email.*exist/i.test(resp.message ?? '')) {
            console.log(`[global.setup] ✅ Account already exists (idempotent): ${P1_DEMO_ACCOUNT.email}`);
        } else {
            console.warn(`[global.setup] ⚠️  Unexpected response: code=${resp.responseCode} message=${resp.message}`);
        }
    } catch (err) {
        // Keep the historical "warn-and-continue" behaviour so a flaky SUT
        // doesn't abort the whole run before auth.setup gets a chance to try
        // via the UI path (which has its own Cloudflare retry). The message
        // is now labeled clearly so operators can tell apart "SUT down" from
        // "framework bug".
        console.warn(`[global.setup] ⚠️  createAccount failed, tests may fall back to UI signup: ${(err as Error).message}`);
    } finally {
        await ctx.dispose();
    }
}
