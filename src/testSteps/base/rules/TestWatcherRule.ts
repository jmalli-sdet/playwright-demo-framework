//
//  TestWatcherRule.ts
//  = TestWatcherRule.kt + ScreenshotTaker.kt
//
//  On failure: attach a final full-page screenshot, the DOM snapshot, and
//  console-log tail. Mirrors what the reference suite's TestWatcherRule + ScreenshotTaker do.
//

import type { Page, TestInfo } from '@playwright/test';

export async function applyTestWatcherRule(page: Page, testInfo: TestInfo): Promise<void> {
    const failed = testInfo.status !== testInfo.expectedStatus;
    if (!failed) return;

    try {
        const screenshot = await page.screenshot({ fullPage: true });
        await testInfo.attach('failure-screenshot.png', {
            body: screenshot,
            contentType: 'image/png',
        });
    } catch { /* page may already be closed */ }

    try {
        const html = await page.content();
        await testInfo.attach('failure-dom.html', {
            body: Buffer.from(html, 'utf-8'),
            contentType: 'text/html',
        });
    } catch { /* ignore */ }
}
