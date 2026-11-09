//
//  UncaughtExceptionRule.ts
//  = CoroutineExceptionHandlerRule.kt
//
//  Outermost rule in the chain. Catches page errors + unhandled JS exceptions
//  and attaches them to the test report so background failures are never silent.
//

import type { Page, TestInfo } from '@playwright/test';

export function applyUncaughtExceptionRule(page: Page, testInfo: TestInfo): void {
    page.on('pageerror', (err) => {
        testInfo.annotations.push({
            type: 'pageerror',
            description: err.message,
        });
        testInfo.attach('pageerror-stack.txt', {
            body: Buffer.from(err.stack ?? err.message, 'utf-8'),
            contentType: 'text/plain',
        }).catch(() => { /* attachment is best-effort */ });
    });

    page.on('crash', () => {
        testInfo.annotations.push({ type: 'crash', description: 'Browser page crashed' });
    });
}
