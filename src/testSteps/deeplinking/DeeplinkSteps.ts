//
//  DeeplinkSteps.ts
//  = DeeplinkNavigator.kt / Deeplink helpers
//
//  Wraps multi-tab and dialog interactions behind named methods.
//

import { expect, type Page, type BrowserContext } from '@playwright/test';
import { test } from '@playwright/test';

export interface CapturedDialog {
    type:    string;
    message: string;
}

export class DeeplinkSteps {

    constructor(private readonly page: Page) {}

    async directDeeplink(path: string): Promise<void> {
        await test.step(`Direct deeplink to ${path}`, async () => {
            await this.page.goto(path);
        });
    }

    /**
     * Opens a URL in a new tab via window.open and returns the popup Page.
     * Equivalent of the reference suite's deeplink navigator that tracks the resulting
     * activity. Playwright pattern: `context.waitForEvent('page')`.
     */
    async openInNewTab(url: string, context: BrowserContext): Promise<Page> {
        return test.step(`Open "${url}" in a new tab`, async () => {
            const [popup] = await Promise.all([
                context.waitForEvent('page'),
                this.page.evaluate((u) => window.open(u, '_blank'), url),
            ]);
            await popup.waitForLoadState('domcontentloaded');
            return popup;
        });
    }

    /**
     * Triggers a native confirm() dialog and captures what came through.
     * Playwright pattern: `page.on('dialog', …)`.
     */
    async triggerConfirmAndCapture(message: string): Promise<CapturedDialog> {
        return test.step(`Trigger confirm("${message}") and capture`, async () => {
            let captured: CapturedDialog | null = null;
            this.page.once('dialog', async (dialog) => {
                captured = { type: dialog.type(), message: dialog.message() };
                await dialog.accept();
            });
            await this.page.evaluate((msg) => confirm(msg), message);
            expect(captured, 'dialog was not captured').not.toBeNull();
            return captured!;
        });
    }
}
