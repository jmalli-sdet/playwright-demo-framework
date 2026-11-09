//
//  ProductDisplaySteps.ts
//  = ProductDisplaySteps.kt
//
//  Covers: direct deep-link navigation, hover, quantity input, modal dialog
//  handling, URL assertions.
//

import { expect, type Page, type Locator } from '@playwright/test';
import { test } from '@playwright/test';

export class ProductDisplaySteps {

    private readonly productName:       Locator;
    private readonly productPrice:      Locator;
    private readonly quantityInput:     Locator;
    private readonly addToCartBtn:      Locator;
    private readonly viewCartLink:      Locator;
    private readonly continueShopping:  Locator;

    constructor(private readonly page: Page) {
        this.productName      = page.locator('.product-information h2').first();
        this.productPrice     = page.locator('.product-information span span');
        this.quantityInput    = page.locator('#quantity');
        this.addToCartBtn     = page.locator('button.cart');
        this.viewCartLink     = page.getByRole('link', { name: /view cart/i });
        this.continueShopping = page.getByRole('button', { name: /continue shopping/i });
    }

    async openPdpById(productId: number): Promise<void> {
        await test.step(`Open PDP /product_details/${productId}`, async () => {
            await this.page.goto(`/product_details/${productId}`);
        });
    }

    async verifyPdpDetailsVisible(): Promise<void> {
        await test.step('Verify name + price + availability + condition + brand are shown', async () => {
            await expect(this.productName).toBeVisible();
            await expect(this.productPrice).toBeVisible();
            await expect(this.page.locator('.product-information').getByText(/availability/i)).toBeVisible();
            await expect(this.page.locator('.product-information').getByText(/condition/i)).toBeVisible();
            await expect(this.page.locator('.product-information').getByText(/brand/i)).toBeVisible();
        });
    }

    async setQuantity(q: number): Promise<void> {
        await test.step(`Set quantity to ${q}`, async () => {
            await this.quantityInput.fill(String(q));
        });
    }

    async addToCart(): Promise<void> {
        await test.step('Add to cart', async () => {
            await this.addToCartBtn.click();
        });
    }

    async goToCartFromModal(): Promise<void> {
        await test.step('Open cart from the Added-to-cart modal', async () => {
            await expect(this.viewCartLink).toBeVisible();
            await this.viewCartLink.click();
            await expect(this.page).toHaveURL(/\/view_cart$/);
        });
    }

    async dismissAddedToCartModal(): Promise<void> {
        await test.step('Dismiss the Added-to-cart modal', async () => {
            await this.continueShopping.click();
        });
    }

    // ── Gridwall (on /products) ───────────────────────────────────────────────

    /** Hovers over the Nth product tile and clicks its "View Product" overlay. */
    async hoverTileAndOpen(nth: number): Promise<void> {
        await test.step(`Hover tile #${nth} and click "View Product"`, async () => {
            const tile = this.page.locator('.features_items .product-image-wrapper').nth(nth);
            await tile.scrollIntoViewIfNeeded();
            await tile.hover();
            await tile.getByRole('link', { name: /view product/i }).first().click();
            await expect(this.page).toHaveURL(/\/product_details\/\d+/);
        });
    }
}
