//
//  ShopHomeSteps.ts
//  = ShopHomeSteps.kt
//
//  Lightweight page object for the anonymous landing page, used by the visual
//  regression spec.
//

import { expect, type Page, type Locator } from '@playwright/test';
import { test } from '@playwright/test';

export class ShopHomeSteps {

    readonly heroSlider: Locator;
    private readonly subscribeInput: Locator;

    constructor(private readonly page: Page) {
        this.heroSlider      = page.locator('#slider-carousel');
        this.subscribeInput  = page.locator('#susbscribe_email');
    }

    async open(): Promise<void> {
        await test.step('Open /', async () => {
            await this.page.goto('/');
        });
    }

    async scrollToSubscribeFooter(): Promise<void> {
        await test.step('Scroll to the Subscribe footer', async () => {
            await this.subscribeInput.scrollIntoViewIfNeeded();
        });
    }

    async verifySubscribeFooterVisible(): Promise<void> {
        await test.step('Verify Subscribe footer is visible', async () => {
            await expect(this.subscribeInput).toBeVisible();
        });
    }
}
