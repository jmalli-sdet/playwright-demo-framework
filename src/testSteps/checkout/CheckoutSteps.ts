//
//  CheckoutSteps.ts
//  = CheckoutSteps.kt
//
//  End-to-end buy-flow helper. Mirrors Nike's CheckoutSteps.kt pattern of one
//  method per screen with its own test.step() for traceability.
//
//  Playwright concepts covered: navigation, forms, download event handling,
//  URL assertions, dynamic locator chains.
//

import { expect, type Page, type Locator, type Download } from '@playwright/test';
import { test } from '@playwright/test';

export interface PaymentDetails {
    nameOnCard: string;
    cardNumber: string;
    cvc: string;
    expiryMM: string;
    expiryYYYY: string;
}

export class CheckoutSteps {

    // Cart page
    private readonly proceedToCheckoutBtn: Locator;
    // Checkout page
    private readonly placeOrderBtn:        Locator;
    private readonly orderComment:         Locator;
    // Payment page
    private readonly nameOnCard:           Locator;
    private readonly cardNumber:           Locator;
    private readonly cvc:                  Locator;
    private readonly expiryMonth:          Locator;
    private readonly expiryYear:           Locator;
    private readonly payConfirmBtn:        Locator;
    // Confirmation page
    private readonly orderPlacedHeading:   Locator;
    private readonly downloadInvoiceLink:  Locator;
    private readonly continueBtn:          Locator;

    constructor(private readonly page: Page) {
        this.proceedToCheckoutBtn = page.locator('a.check_out');
        this.placeOrderBtn        = page.getByRole('link',  { name: /place order/i });
        this.orderComment         = page.locator('textarea[name="message"]');
        this.nameOnCard           = page.getByTestId('name-on-card');
        this.cardNumber           = page.getByTestId('card-number');
        this.cvc                  = page.getByTestId('cvc');
        this.expiryMonth          = page.getByTestId('expiry-month');
        this.expiryYear           = page.getByTestId('expiry-year');
        this.payConfirmBtn        = page.getByTestId('pay-button');
        this.orderPlacedHeading   = page.getByRole('heading', { name: /order placed/i });
        this.downloadInvoiceLink  = page.getByRole('link',    { name: /download invoice/i });
        this.continueBtn          = page.getByTestId('continue-button');
    }

    // ── Cart screen ───────────────────────────────────────────────────────────

    async openCart(): Promise<void> {
        await test.step('Open /view_cart', async () => {
            await this.page.goto('/view_cart');
        });
    }

    async verifyProductInCart(productName: string): Promise<void> {
        await test.step(`Verify "${productName}" is in the cart`, async () => {
            await expect(this.page.getByRole('row').filter({ hasText: productName })).toBeVisible();
        });
    }

    async proceedToCheckout(): Promise<void> {
        await test.step('Proceed to checkout', async () => {
            await this.proceedToCheckoutBtn.first().click();
            await expect(this.page).toHaveURL(/\/checkout$/);
        });
    }

    // ── Checkout screen ───────────────────────────────────────────────────────

    async verifyAddressDetailsVisible(): Promise<void> {
        await test.step('Verify delivery address block is shown', async () => {
            await expect(this.page.locator('#address_delivery')).toBeVisible();
            await expect(this.page.locator('#address_invoice')).toBeVisible();
        });
    }

    async addOrderComment(comment: string): Promise<void> {
        await test.step('Add an order comment', async () => {
            await this.orderComment.fill(comment);
        });
    }

    async placeOrder(): Promise<void> {
        await test.step('Place order', async () => {
            await this.placeOrderBtn.click();
            await expect(this.page).toHaveURL(/\/payment$/);
        });
    }

    // ── Payment screen ────────────────────────────────────────────────────────

    async fillPaymentDetails(d: PaymentDetails): Promise<void> {
        await test.step('Fill payment details', async () => {
            await this.nameOnCard.fill(d.nameOnCard);
            await this.cardNumber.fill(d.cardNumber);
            await this.cvc.fill(d.cvc);
            await this.expiryMonth.fill(d.expiryMM);
            await this.expiryYear.fill(d.expiryYYYY);
        });
    }

    async submitPayment(): Promise<void> {
        await test.step('Submit payment', async () => {
            await this.payConfirmBtn.click();
        });
    }

    // ── Confirmation screen ───────────────────────────────────────────────────

    async verifyOrderPlaced(): Promise<void> {
        await test.step('Verify "Order Placed!" confirmation', async () => {
            await expect(this.orderPlacedHeading).toBeVisible({ timeout: 20_000 });
            await expect(this.page.getByText(/congratulations.*order.*confirmed/i)).toBeVisible();
        });
    }

    /** Clicks "Download Invoice" and returns the Download event (Playwright pattern). */
    async downloadInvoice(): Promise<Download> {
        return test.step('Download invoice', async () => {
            const downloadPromise = this.page.waitForEvent('download');
            await this.downloadInvoiceLink.click();
            return downloadPromise;
        });
    }

    async clickContinueAfterOrder(): Promise<void> {
        await test.step('Click Continue after order', async () => {
            await this.continueBtn.click();
        });
    }
}
