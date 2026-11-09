//
//  FavoritesSteps.ts
//  = Nike FavoritesSteps.kt
//
//  automationexercise.com has no real wishlist, but it does expose a very
//  similar pattern: the "Brands" sidebar lets you drill into a branded gridwall
//  that we treat here as the "favorites" view for a brand.
//
//  This keeps the spec realistic without inventing UI that the AUT does not
//  10|  have — the test still exercises:
//     • an authenticated navigation (requires storageState)
//     • a sidebar filter → gridwall render assertion
//     • a product-count expectation per brand
//

import { expect, type Page, type Locator } from '@playwright/test';
import { test } from '@playwright/test';

export class FavoritesSteps {

    private readonly brandsSidebar: Locator;
    private readonly gridwallTitle:  Locator;
    private readonly gridwallTiles:  Locator;

    constructor(private readonly page: Page) {
        this.brandsSidebar = page.locator('.brands_products');
        this.gridwallTitle = page.locator('.features_items > .title').first();
        this.gridwallTiles = page.locator('.features_items .product-image-wrapper');
    }

    async openProducts(): Promise<void> {
        await test.step('Open /products', async () => {
            await this.page.goto('/products');
        });
    }

    async openBrand(brand: string): Promise<void> {
        await test.step(`Open the "${brand}" brand gridwall from the Brands sidebar`, async () => {
            await expect(this.brandsSidebar).toBeVisible();
            await this.brandsSidebar.getByRole('link', { name: new RegExp(brand, 'i') }).click();
            await expect(this.page).toHaveURL(/\/brand_products\//);
        });
    }

    async verifyBrandGridwallLoaded(brand: string): Promise<void> {
        await test.step(`Verify the branded gridwall title mentions "${brand}"`, async () => {
            await expect(this.gridwallTitle).toContainText(new RegExp(brand, 'i'));
        });
    }

    async verifyAtLeastOneBrandedTileShown(): Promise<void> {
        await test.step('Verify at least one product tile renders on the brand gridwall', async () => {
            await expect(this.gridwallTiles.first()).toBeVisible();
            expect(await this.gridwallTiles.count()).toBeGreaterThan(0);
        });
    }
}
