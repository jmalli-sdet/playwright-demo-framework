//
//  NavBarSteps.ts
//  = NavBarSteps.kt
//
//  Site-wide nav bar. Verifies anonymous vs logged-in nav items.
//

import { expect, type Page, type Locator } from '@playwright/test';
import { test } from '@playwright/test';

export class NavBarSteps {

    private readonly homeLink:        Locator;
    private readonly productsLink:    Locator;
    private readonly cartLink:        Locator;
    private readonly signupLoginLink: Locator;
    private readonly logoutLink:      Locator;
    private readonly deleteAccount:   Locator;

    constructor(private readonly page: Page) {
        // Href-based locators — nav text is wrapped in <i class="fa fa-*"> icons
        // so accessible names come out as " Home", " Products" etc. with leading
        // whitespace. Hrefs are stable + unambiguous.
        const nav = page.locator('.navbar-nav');
        this.homeLink        = nav.locator('a[href="/"]').first();
        this.productsLink    = nav.locator('a[href="/products"]');
        this.cartLink        = nav.locator('a[href="/view_cart"]');
        this.signupLoginLink = nav.locator('a[href="/login"]');
        this.logoutLink      = nav.locator('a[href="/logout"]');
        this.deleteAccount   = nav.locator('a[href="/delete_account"]');
    }

    async verifyAnonymousNavItems(): Promise<void> {
        await test.step('Verify nav bar for anonymous user', async () => {
            await expect(this.homeLink).toBeVisible();
            await expect(this.productsLink).toBeVisible();
            await expect(this.cartLink).toBeVisible();
            await expect(this.signupLoginLink).toBeVisible();
            await expect(this.logoutLink).toBeHidden();
        });
    }

    async verifyAuthenticatedNavItems(): Promise<void> {
        await test.step('Verify nav bar for authenticated user', async () => {
            await expect(this.logoutLink).toBeVisible();
            await expect(this.deleteAccount).toBeVisible();
            await expect(this.signupLoginLink).toBeHidden();
        });
    }

    async goToProducts(): Promise<void> {
        await test.step('Navigate via nav → Products', async () => {
            await this.productsLink.click();
            await expect(this.page).toHaveURL(/\/products$/);
        });
    }
}
