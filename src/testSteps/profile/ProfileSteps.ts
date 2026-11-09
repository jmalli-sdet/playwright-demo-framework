//
//  ProfileSteps.ts
//  = ProfileSteps.kt
//
//  Logged-in-state assertions + logout flow.
//

import { expect, type Page, type Locator } from '@playwright/test';
import { test } from '@playwright/test';

export class ProfileSteps {

    private readonly loggedInBanner: Locator;
    private readonly logoutLink:     Locator;
    private readonly accountDeletedHeading: Locator;

    constructor(private readonly page: Page) {
        this.loggedInBanner         = this.page.getByText(/Logged in as/i);
        this.logoutLink             = this.page.getByRole('link', { name: /logout/i });
        this.accountDeletedHeading  = this.page.getByRole('heading', { name: /account deleted/i });
    }

    async goToHome(): Promise<void> {
        await test.step('Open /', async () => {
            await this.page.goto('/');
        });
    }

    async verifyLoggedInAs(expectedName: string): Promise<void> {
        await test.step(`Verify "Logged in as ${expectedName}"`, async () => {
            await expect(this.loggedInBanner).toBeVisible({ timeout: 15_000 });
            await expect(this.loggedInBanner).toContainText(expectedName);
        });
    }

    async logout(): Promise<void> {
        await test.step('Click Logout', async () => {
            await this.logoutLink.click();
            await expect(this.page).toHaveURL(/\/login$/);
        });
    }

    async verifyOnLoginPage(): Promise<void> {
        await test.step('Verify on login page after logout', async () => {
            await expect(this.page.getByRole('heading', { name: /login to your account/i })).toBeVisible();
        });
    }
}
