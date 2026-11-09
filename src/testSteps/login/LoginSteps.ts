//
//  LoginSteps.ts
//  = LoginSteps.kt
//
//  Page object for the automationexercise.com login/signup page.
//  Uses role-based locators (= withText/withId matchers in Espresso) wrapped
//  in `test.step()` for first-class visibility in the Trace Viewer.
//

import { expect, type Page, type Locator } from '@playwright/test';
import { test } from '@playwright/test';

export class LoginSteps {

    // ── Locators (= private val withId(R.id.xxx) in Nike) ────────────────────
    private readonly loginEmailInput: Locator;
    private readonly loginPasswordInput: Locator;
    private readonly loginButton: Locator;
    private readonly loginErrorText: Locator;
    private readonly signupNameInput: Locator;
    private readonly signupEmailInput: Locator;
    private readonly signupButton: Locator;
    private readonly loggedInBanner: Locator;
    private readonly logoutLink: Locator;

    constructor(private readonly page: Page) {
        this.loginEmailInput    = page.getByTestId('login-email');
        this.loginPasswordInput = page.getByTestId('login-password');
        this.loginButton        = page.getByTestId('login-button');
        this.loginErrorText     = page.getByText('Your email or password is incorrect!');
        this.signupNameInput    = page.getByTestId('signup-name');
        this.signupEmailInput   = page.getByTestId('signup-email');
        this.signupButton       = page.getByTestId('signup-button');
        this.loggedInBanner     = page.getByText(/Logged in as/i);
        this.logoutLink         = page.getByRole('link', { name: /logout/i });
    }

    // ── Navigation ────────────────────────────────────────────────────────────

    async open(): Promise<void> {
        await test.step('Open login page', async () => {
            await this.page.goto('/login');
        });
    }

    // ── Assertions on the page itself ─────────────────────────────────────────

    async verifyLoginPageLoaded(): Promise<void> {
        await test.step('Verify both Login and Signup forms are visible', async () => {
            await expect(this.page.getByRole('heading', { name: /Login to your account/i })).toBeVisible();
            await expect(this.page.getByRole('heading', { name: /New User Signup!/i })).toBeVisible();
            await expect(this.loginEmailInput).toBeVisible();
            await expect(this.loginPasswordInput).toBeVisible();
            await expect(this.loginButton).toBeVisible();
            await expect(this.signupNameInput).toBeVisible();
            await expect(this.signupEmailInput).toBeVisible();
            await expect(this.signupButton).toBeVisible();
        });
    }

    // ── Actions ───────────────────────────────────────────────────────────────

    async loginWith(email: string, password: string): Promise<void> {
        await test.step(`Login as ${email}`, async () => {
            await this.loginEmailInput.fill(email);
            await this.loginPasswordInput.fill(password);
            await this.loginButton.click();
        });
    }

    async startSignup(name: string, email: string): Promise<void> {
        await test.step(`Start signup for ${email}`, async () => {
            await this.signupNameInput.fill(name);
            await this.signupEmailInput.fill(email);
            await this.signupButton.click();
        });
    }

    async logout(): Promise<void> {
        await test.step('Logout', async () => {
            await this.logoutLink.click();
        });
    }

    // ── Verifications after actions ───────────────────────────────────────────

    async verifyIncorrectCredentialsError(): Promise<void> {
        await test.step('Verify "incorrect credentials" error is shown', async () => {
            await expect(this.loginErrorText).toBeVisible();
        });
    }

    async verifyLoggedInAs(username: string): Promise<void> {
        await test.step(`Verify logged in as ${username}`, async () => {
            await expect(this.loggedInBanner).toContainText(username);
        });
    }
}
