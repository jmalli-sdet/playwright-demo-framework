//
//  SearchSteps.ts
//  = SearchSteps.kt
//
//  Covers: keyboard submission, locator chaining, locator.filter(), locator.nth().
//

import { expect, type Page, type Locator } from '@playwright/test';
import { test } from '@playwright/test';

export class SearchSteps {

    private readonly searchInput: Locator;
    private readonly submitButton: Locator;
    private readonly searchedProductsHeader: Locator;
    private readonly productCards: Locator;

    constructor(private readonly page: Page) {
        this.searchInput             = page.locator('#search_product');
        this.submitButton            = page.locator('#submit_search');
        this.searchedProductsHeader  = page.getByRole('heading', { name: /searched products/i });
        this.productCards            = page.locator('.features_items .product-image-wrapper');
    }

    async openProductsPage(): Promise<void> {
        await test.step('Open /products', async () => {
            await this.page.goto('/products');
        });
    }

    /**
     * Fills the search box using the keyboard API (type-by-type), then submits
     * by clicking the magnifier button. Covers both `locator.pressSequentially`
     * (keyboard concept) and submit-button interaction.
     *
     * NOTE: automationexercise's search form does NOT bind Enter; the magnifier
     * button is the only reliable submit path.
     */
    async searchFor(query: string): Promise<void> {
        await test.step(`Search "${query}"`, async () => {
            await this.searchInput.click();
            await this.searchInput.pressSequentially(query, { delay: 15 });
            await this.submitButton.click();
        });
    }

    async verifySearchedProductsVisible(): Promise<void> {
        await test.step('Verify "SEARCHED PRODUCTS" section appears', async () => {
            await expect(this.searchedProductsHeader).toBeVisible();
        });
    }

    async verifyResultCountAtLeast(min: number): Promise<void> {
        await test.step(`Verify at least ${min} results`, async () => {
            const count = await this.productCards.count();
            expect(count, `Expected ≥${min} results, got ${count}`).toBeGreaterThanOrEqual(min);
        });
    }

    /**
     * At least one visible result card contains the expected keyword in its name.
     * (The AUT's search also matches on category, so not every result's NAME
     *  contains the keyword, but at least one must.)
     */
    async verifyAtLeastOneResultContains(keyword: string): Promise<void> {
        await test.step(`Verify at least one result name contains "${keyword}"`, async () => {
            const names = await this.productCards.locator('.productinfo p').allInnerTexts();
            expect(names.length, 'no result rows rendered').toBeGreaterThan(0);
            const rx = new RegExp(keyword, 'i');
            const match = names.find((n) => rx.test(n));
            expect(match, `No result name contained "${keyword}". Got: ${JSON.stringify(names)}`).toBeTruthy();
        });
    }

    /** Demonstrates locator.filter() + nth(). */
    async firstResultWithName(substring: string): Promise<Locator> {
        return this.productCards
            .filter({ has: this.page.locator('p', { hasText: new RegExp(substring, 'i') }) })
            .first();
    }
}
