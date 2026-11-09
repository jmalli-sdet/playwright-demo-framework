//
//  P1DeeplinkTests.spec.ts
//  = P1DeeplinkTests.kt
//
//  Covers:
//    - direct deeplink navigation → right page renders
//    - popup / multi-tab via context.waitForEvent('page')
//    - native dialog handling via page.on('dialog', …)
//

import { test, expect } from '../base/UITestBase';

test.describe('Deeplinking — P1 Smoke', { tag: ['@P1', '@smoke', '@deeplink'] }, () => {

    test('P1 | DEEP | Direct deeplink lands on the correct PDP',
        async ({ deeplinkSteps, page }, testInfo) => {
            testInfo.annotations.push(
                { type: 'description', description: 'Navigating straight to /product_details/5 renders its PDP with price visible.' },
                { type: 'jira', description: 'DEMO-1101' },
                { type: 'priority', description: 'P1' },
            );
            await deeplinkSteps.directDeeplink('/product_details/5');
            await expect(page.locator('.product-information h2').first()).toBeVisible();
        });

    test('P1 | DEEP | Opening a URL in a new tab produces a second Page in the context',
        async ({ deeplinkSteps, page, context }, testInfo) => {
            testInfo.annotations.push(
                { type: 'description', description: 'window.open fires a popup event; new Page lands on the requested URL.' },
                { type: 'jira', description: 'DEMO-1102' },
                { type: 'priority', description: 'P1' },
            );
            await page.goto('/');
            const popup = await deeplinkSteps.openInNewTab('/products', context);
            await expect(popup).toHaveURL(/\/products$/);
            await popup.close();
        });

    test('P1 | DEEP | Native confirm() is captured by page.on("dialog")',
        async ({ deeplinkSteps, page }, testInfo) => {
            testInfo.annotations.push(
                { type: 'description', description: 'page.on("dialog") intercepts a JavaScript confirm() and the handler accepts it.' },
                { type: 'jira', description: 'DEMO-1103' },
                { type: 'priority', description: 'P1' },
            );
            await page.goto('/');
            const captured = await deeplinkSteps.triggerConfirmAndCapture('Confirm this demo dialog?');
            expect(captured.type).toBe('confirm');
            expect(captured.message).toBe('Confirm this demo dialog?');
        });
});
