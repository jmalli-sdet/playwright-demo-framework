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

    // ── Category sidebar (/products and /) ──────────────────────────────────

    /** Expands a top-level category panel (Women / Men / Kids) and clicks a sub-category. */
    async openCategory(group: 'Women' | 'Men' | 'Kids', subCategory: string): Promise<void> {
        await test.step(`Open category ${group} → ${subCategory}`, async () => {
            await this.page.getByRole('link', { name: new RegExp(group, 'i') }).first().click();
            await this.page.getByRole('link', { name: new RegExp(subCategory, 'i') }).first().click();
            await expect(this.page).toHaveURL(/\/category_products\//);
        });
    }

    async verifyCategoryGridwallTitleContains(text: string): Promise<void> {
        await test.step(`Verify category gridwall title contains "${text}"`, async () => {
            await expect(this.page.locator('.features_items > .title').first())
                .toContainText(new RegExp(text, 'i'));
        });
    }

    // ── Hero carousel ───────────────────────────────────────────────────────

    /** Clicks the carousel's "next" control and waits for the slide to advance. */
    async advanceHeroCarousel(): Promise<void> {
        await test.step('Advance hero carousel by one slide', async () => {
            const firstSlide  = this.page.locator('#slider-carousel .item').first();
            const secondSlide = this.page.locator('#slider-carousel .item').nth(1);
            const initiallyActive = await firstSlide.getAttribute('class') ?? '';
            await this.page.locator('a.right.control-carousel').click();
            await expect
                .poll(async () => (await secondSlide.getAttribute('class')) ?? '',
                      { timeout: 5_000, message: 'Second slide never gained .active' })
                .toContain('active');
            expect(initiallyActive).toContain('active');
        });
    }
}
