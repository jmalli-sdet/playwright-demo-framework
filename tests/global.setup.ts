//
//  global.setup.ts
//
//  Runs ONCE before any project. Idempotently creates the P1 demo account on
//  automationexercise.com via POST /api/createAccount so every subsequent spec
//  (via UITestBase fixtures + the `setup` project) can rely on the account
//  existing. If the account already exists (second run), we silently continue.
//
//  Direct Nike analog: the preTestLoginBySpecificAccount() + API-seed phase
//  in UITestBase.kt, except here we do it once per run instead of once per test.
//

import { request as playwrightRequest, type FullConfig } from '@playwright/test';
import { UserAccountApiClient } from '../src/utils/api/clients/UserAccountApiClient';
import { TestData, P1_DEMO_ACCOUNT } from '../src/resources/TestData';

export default async function globalSetup(_config: FullConfig): Promise<void> {
    console.log('\n[global.setup] Ensuring P1 demo account exists on automationexercise.com …');

    const ctx = await playwrightRequest.newContext();
    const api = new UserAccountApiClient(ctx);
    const testData = new TestData();
    const payload = testData.buildCreateAccountPayload(P1_DEMO_ACCOUNT);

    try {
        // 1. Delete any prior instance so each run starts with the same, known-good
        //    account data (right name, address, etc.). 404 "not found" is fine.
        try {
            const del = await api.deleteAccount(P1_DEMO_ACCOUNT.email, P1_DEMO_ACCOUNT.password);
            if (del.responseCode === 200) {
                console.log(`[global.setup] 🧹 Cleared stale account: ${P1_DEMO_ACCOUNT.email}`);
            }
        } catch { /* fresh environment — nothing to delete */ }

        // 2. Create fresh.
        const resp = await api.createAccount(payload);
        if (resp.responseCode === 201) {
            console.log(`[global.setup] ✅ Created fresh account: ${P1_DEMO_ACCOUNT.email}`);
        } else if (/email.*exist/i.test(resp.message ?? '')) {
            console.log(`[global.setup] ✅ Account already exists (idempotent): ${P1_DEMO_ACCOUNT.email}`);
        } else {
            console.warn(`[global.setup] ⚠️  Unexpected response: code=${resp.responseCode} message=${resp.message}`);
        }
    } catch (err) {
        console.warn(`[global.setup] ⚠️  createAccount failed, tests may fall back to UI signup: ${(err as Error).message}`);
    } finally {
        await ctx.dispose();
    }
}
