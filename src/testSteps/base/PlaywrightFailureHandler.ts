//
//  PlaywrightFailureHandler.ts
//  = EspressoFailureHandler.kt
//
//  Centralized "what to do when an action fails" wrapper. In Nike this
//  intercepts Espresso's NoMatchingViewException / AmbiguousViewMatcher etc.
//  In Playwright we wrap an action with a consistent diagnostic: capture
//  the failing locator's screenshot + computed HTML before rethrowing.
//

import type { Locator, TestInfo } from '@playwright/test';

export async function runWithFailureDiagnostics<T>(
    locator: Locator,
    label: string,
    testInfo: TestInfo,
    action: () => Promise<T>,
): Promise<T> {
    try {
        return await action();
    } catch (err) {
        const name = `${label}-failure`.replace(/[^a-z0-9-]/gi, '_');

        try {
            const shot = await locator.screenshot({ timeout: 2_000 });
            await testInfo.attach(`${name}.png`, { body: shot, contentType: 'image/png' });
        } catch { /* locator may not exist */ }

        try {
            const html = await locator.evaluate((el) => (el as Element).outerHTML, undefined, { timeout: 2_000 });
            await testInfo.attach(`${name}.html`, {
                body: Buffer.from(html, 'utf-8'),
                contentType: 'text/html',
            });
        } catch { /* ignore */ }

        throw err;
    }
}
