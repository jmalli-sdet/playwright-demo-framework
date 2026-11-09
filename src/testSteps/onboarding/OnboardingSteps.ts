//
//  OnboardingSteps.ts
//  = OnboardingSteps.kt
//
//  Full UI signup flow for automationexercise.com. Covers:
//  - signup launch from /login
//  - the "Enter Account Information" form with selects (title, day/month/year/country)
//  - "Create Account" → "Continue" → logged-in state → "Delete Account" cleanup
//
//  Playwright concepts: selectOption, keyboard, dynamic form, cleanup teardown.
//

import { expect, type Page, type Locator } from '@playwright/test';
import { test } from '@playwright/test';

export interface SignupDetails {
    password: string;
    title: 'Mr' | 'Mrs';
    day:   string;    // "15"
    month: string;    // "January"
    year:  string;    // "1995"
    firstName: string;
    lastName:  string;
    address:   string;
    country:   string; // one of: India, United States, Canada, Australia, Israel, New Zealand, Singapore
    state:     string;
    city:      string;
    zipcode:   string;
    mobile:    string;
}

export class OnboardingSteps {

    constructor(private readonly page: Page) {}

    async openLoginSignup(): Promise<void> {
        await test.step('Open /login (signup section)', async () => {
            await this.page.goto('/login');
        });
    }

    async startSignup(name: string, email: string): Promise<void> {
        await test.step(`Start signup for ${email}`, async () => {
            await this.page.getByTestId('signup-name').fill(name);
            await this.page.getByTestId('signup-email').fill(email);
            await this.page.getByTestId('signup-button').click();
            await expect(this.page.getByText(/enter account information/i)).toBeVisible();
        });
    }

    async fillAccountInformation(d: SignupDetails): Promise<void> {
        await test.step('Fill "Enter Account Information" form', async () => {
            await this.page.locator(`#id_gender${d.title === 'Mr' ? '1' : '2'}`).check();
            await this.page.getByTestId('password').fill(d.password);
            await this.page.getByTestId('days').selectOption(d.day);
            await this.page.getByTestId('months').selectOption(d.month);
            await this.page.getByTestId('years').selectOption(d.year);
        });

        await test.step('Fill address block', async () => {
            await this.page.getByTestId('first_name').fill(d.firstName);
            await this.page.getByTestId('last_name').fill(d.lastName);
            await this.page.getByTestId('address').fill(d.address);
            await this.page.getByTestId('country').selectOption(d.country);
            await this.page.getByTestId('state').fill(d.state);
            await this.page.getByTestId('city').fill(d.city);
            await this.page.getByTestId('zipcode').fill(d.zipcode);
            await this.page.getByTestId('mobile_number').fill(d.mobile);
        });

        await test.step('Submit "Create Account"', async () => {
            await this.page.getByTestId('create-account').click();
            await expect(this.page.getByTestId('account-created')).toBeVisible({ timeout: 20_000 });
        });
    }

    async clickContinueAfterCreation(): Promise<void> {
        await test.step('Click Continue after account creation', async () => {
            await this.page.getByTestId('continue-button').click();
        });
    }

    async verifyLoggedInAs(expectedName: string): Promise<void> {
        await test.step(`Verify "Logged in as ${expectedName}"`, async () => {
            await expect(this.page.getByText(/Logged in as/i)).toContainText(expectedName);
        });
    }

    /** Cleanup — deletes the just-created account so re-runs don't collide. */
    async deleteAccount(): Promise<void> {
        await test.step('Delete the account (cleanup)', async () => {
            await this.page.locator('a[href="/delete_account"]').click();
            await expect(this.page.getByTestId('account-deleted')).toBeVisible({ timeout: 20_000 });
            await this.page.getByTestId('continue-button').click();
        });
    }
}
