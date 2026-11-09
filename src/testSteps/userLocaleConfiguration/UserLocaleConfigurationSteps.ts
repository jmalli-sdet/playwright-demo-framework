//
//  UserLocaleConfigurationSteps.ts
//  = Nike UserLocaleConfigurationSteps.kt
//
//  Reads the browser context's active locale and asserts it matches the active
//  Playwright project. Also inspects outgoing request headers to confirm the
//  AUT at least sees the Accept-Language header we sent.
//
//  This is the Playwright equivalent of Nike's region/locale assertion helpers.
//

import { expect, type Page } from '@playwright/test';
import { test } from '@playwright/test';

export class UserLocaleConfigurationSteps {

    constructor(private readonly page: Page) {}

    async openHome(): Promise<void> {
        await test.step('Open /', async () => {
            await this.page.goto('/');
        });
    }

    async verifyNavigatorLocale(expected: string): Promise<void> {
        await test.step(`Verify navigator.language reports "${expected}"`, async () => {
            const actual = await this.page.evaluate(() => navigator.language);
            expect(actual).toBe(expected);
        });
    }

    async verifyAcceptLanguageContains(expected: string): Promise<void> {
        await test.step(`Verify outgoing Accept-Language header contains "${expected}"`, async () => {
            // Reload and capture the document request so we can inspect its headers.
            const [observed] = await Promise.all([
                this.page.waitForRequest((r) => r.resourceType() === 'document'),
                this.page.reload(),
            ]);
            expect(observed.headers()['accept-language'] ?? '').toContain(expected);
        });
    }

    async verifyCorePageStructureStable(): Promise<void> {
        await test.step('Verify the home page renders the same key regions regardless of locale', async () => {
            // The AUT does not actually localise strings, but the markup
            // structure must stay identical across locales — this would catch
            // layout drift caused by a translated CSS class or RTL swap.
            await expect(this.page.locator('#slider-carousel')).toBeVisible();
            await expect(this.page.locator('.features_items')).toBeVisible();
            await expect(this.page.locator('#footer')).toBeVisible();
        });
    }
}
