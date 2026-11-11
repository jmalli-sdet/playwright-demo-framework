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

    /**
     * Like `verifyLoggedInAs`, but tolerates the AUT occasionally dropping the
     * shared `storageState` session (automationexercise.com rotates sessions
     * when multiple parallel CI workers hit the same account in a short window).
     *
     * Fast path: if the banner is already visible, this is identical to
     * `verifyLoggedInAs` and adds ~0 overhead. Slow path: if the banner is
     * missing after a brief wait, we re-login via the UI once with the supplied
     * credentials, navigate back to `/`, then re-assert the banner + name.
     *
     * If recovery itself fails, the final assertion still fails loudly — we
     * never silently pass a genuinely logged-out state.
     */
    async ensureLoggedInAs(
        expectedName: string,
        creds: { email: string; password: string },
    ): Promise<void> {
        await test.step(`Ensure logged in as "${expectedName}"`, async () => {
            const banner = this.loggedInBanner;

            // Fast path — banner already there (storageState session still valid).
            const bannerAlreadyVisible = await banner
                .waitFor({ state: 'visible', timeout: 7_500 })
                .then(() => true)
                .catch(() => false);

            if (!bannerAlreadyVisible) {
                await test.step('Session stale — re-login via UI and retry', async () => {
                    await this.page.goto('/login');
                    await this.page.getByTestId('login-email').fill(creds.email);
                    await this.page.getByTestId('login-password').fill(creds.password);
                    await this.page.getByTestId('login-button').click();
                    // After login the site 302s to /; be explicit so we don't
                    // depend on the server's redirect behavior.
                    await this.page.goto('/');
                });
            }

            await expect(banner).toBeVisible({ timeout: 10_000 });
            await expect(banner).toContainText(expectedName);
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
