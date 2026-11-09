//
//  MemberHomeSteps.ts
//  = MemberHomeSteps.kt
//
//  Home-page landing experience. Verifies hero carousel, features-items grid,
//  and category/brand sidebars render.
//

import { expect, type Page, type Locator } from '@playwright/test';
import { test } from '@playwright/test';

export class MemberHomeSteps {

    private readonly heroSlider:    Locator;
    private readonly featuresItems: Locator;
    private readonly categoriesBox: Locator;
    private readonly brandsBox:     Locator;

    constructor(private readonly page: Page) {
        this.heroSlider    = page.locator('#slider-carousel');
        this.featuresItems = page.locator('.features_items');
        this.categoriesBox = page.getByRole('heading', { name: /^category$/i });
        this.brandsBox     = page.getByRole('heading', { name: /^brands$/i });
    }

    async open(): Promise<void> {
        await test.step('Open /', async () => {
            await this.page.goto('/');
        });
    }

    async verifyHomePageLoaded(): Promise<void> {
        // Soft assertions: all 4 run even if the first fails — surfaces the
        // complete failure picture in one report instead of hiding
        // downstream regressions. (Playwright `expect.soft()` pattern.)
        await test.step('Verify key home-page sections (soft)', async () => {
            await expect.soft(this.heroSlider).toBeVisible();
            await expect.soft(this.featuresItems).toBeVisible();
            await expect.soft(this.categoriesBox).toBeVisible();
            await expect.soft(this.brandsBox).toBeVisible();
        });
    }
}
