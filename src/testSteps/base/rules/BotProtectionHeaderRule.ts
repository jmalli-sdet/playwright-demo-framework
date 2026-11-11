//
//  BotProtectionHeaderRule.ts
//  = BotProtectionHeaderRule.kt
//
//  Adds an extra header on every request — reference uses this to bypass Akamai
//  bot protection during automated test runs. Here it's a no-op-by-default
//  header plus a UA override, to demonstrate the pattern.
//

import type { BrowserContext } from '@playwright/test';

/**
 * Adds our automation header only to requests that hit the AUT's own origin.
 * Setting the header globally would trigger CORS preflights on every
 * third-party asset (fonts, trackers, CDNs), which pollutes the console.
 * Demonstrates scoped `context.route()` usage as a bonus Playwright concept.
 */
export async function applyBotProtectionHeaderRule(context: BrowserContext): Promise<void> {
    await context.route('**/automationexercise.com/**', async (route) => {
        const headers = {
            ...route.request().headers(),
            'x-automated-test': 'playwright-demo-framework',
        };
        await route.continue({ headers });
    });
}
