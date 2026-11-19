//
//  CheckoutSteps.ts
//  = CheckoutSteps.kt
//
//  End-to-end buy-flow helper. Mirrors the reference suite's CheckoutSteps.kt pattern of one
//  method per screen with its own test.step() for traceability.
//
//  Playwright concepts covered: navigation, forms, download event handling,
//  URL assertions, dynamic locator chains.
//

import { expect, type Page, type Locator, type Download } from '@playwright/test';
import { test } from '@playwright/test';
import { SutAvailabilityHelper } from '../../utils/helpers/SutAvailabilityHelper';

export interface PaymentDetails {
    nameOnCard: string;
    cardNumber: string;
    cvc: string;
    expiryMM: string;
    expiryYYYY: string;
}

export class CheckoutSteps {

    // ─── Companion-object–style constants ──────────────────────────────────────
    // Direct TypeScript analogue of Kotlin's
    //     private companion object { const val NAME = value }
    // All retry / timeout knobs for the SUT-overload hardening live here so
    // callers tune them in one place instead of hunting through method bodies.
    // Same pattern used by ProfileSteps / SutAvailabilityHelper.

    /** For click-then-assert-URL steps (proceedToCheckout, placeOrder). */
    private static readonly NAV_CLICK_ATTEMPTS                  = 3;
    /** Per-attempt URL-settle budget; short so retries don't waste the per-test budget. */
    private static readonly NAV_URL_POLL_TIMEOUT_MS             = 5_000;
    /** Base + per-attempt step for the inter-click backoff on dropped navigations. */
    private static readonly NAV_RETRY_BACKOFF_BASE_MS           = 1_000;
    private static readonly NAV_RETRY_BACKOFF_STEP_MS           = 500;

    /** For invoice-download retry loop (503 responses yield no Download event). */
    private static readonly DOWNLOAD_ATTEMPTS                   = 3;
    private static readonly DOWNLOAD_PER_ATTEMPT_TIMEOUT_MS     = 20_000;
    private static readonly DOWNLOAD_GO_BACK_TIMEOUT_MS         = 10_000;
    private static readonly DOWNLOAD_RETRY_BACKOFF_BASE_MS      = 2_000;
    private static readonly DOWNLOAD_RETRY_BACKOFF_STEP_MS      = 1_000;

    /** Nested recoverIfInterstitial attempts when called as a pre-flight inside a loop. */
    private static readonly INNER_RECOVER_ATTEMPTS              = 3;

    /** Order-placed heading wait budget on /payment_done. */
    private static readonly ORDER_PLACED_VISIBLE_TIMEOUT_MS     = 20_000;

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
            // Safe reload: /view_cart is GET.
            await SutAvailabilityHelper.recoverIfInterstitial(this.page, {
                label: 'CheckoutSteps.openCart → /view_cart',
            });
        });
    }

    async verifyProductInCart(productName: string): Promise<void> {
        await test.step(`Verify "${productName}" is in the cart`, async () => {
            await expect(this.page.getByRole('row').filter({ hasText: productName })).toBeVisible();
        });
    }

    async proceedToCheckout(): Promise<void> {
        await test.step('Proceed to checkout', async () => {
            // Under SUT overload the "Proceed to Checkout" GET for /checkout
            // can be dropped silently — the browser stays on /view_cart with
            // no error, and the subsequent URL assertion burns its full
            // timeout. We retry the click a few times, falling back to a
            // direct goto('/checkout'), so one dropped navigation self-heals.
            for (let attempt = 1; attempt <= CheckoutSteps.NAV_CLICK_ATTEMPTS; attempt++) {
                await this.proceedToCheckoutBtn.first().click();

                // /checkout is a GET route — safe to reload if the AUT served
                // the "queue full" interstitial at that URL under load.
                await SutAvailabilityHelper.recoverIfInterstitial(this.page, {
                    label: `CheckoutSteps.proceedToCheckout → /checkout (attempt ${attempt})`,
                });

                // Short wait for the URL to update (the click returns before
                // navigation completes). toHaveURL's default timeout is too
                // long to burn per attempt, so we poll with a shorter budget.
                try {
                    await expect(this.page).toHaveURL(/\/checkout$/, {
                        timeout: CheckoutSteps.NAV_URL_POLL_TIMEOUT_MS,
                    });
                    return;
                } catch {
                    if (attempt === CheckoutSteps.NAV_CLICK_ATTEMPTS) break;
                    console.warn(
                        `[CheckoutSteps] proceedToCheckout: click #${attempt} did not navigate ` +
                        `(still at ${this.page.url()}), retrying…`,
                    );
                    // Last-ditch: navigate directly. If this ALSO lands on an
                    // interstitial, recoverIfInterstitial handles it.
                    if (attempt === CheckoutSteps.NAV_CLICK_ATTEMPTS - 1) {
                        await this.page.goto('/checkout');
                        await SutAvailabilityHelper.recoverIfInterstitial(this.page, {
                            label: 'CheckoutSteps.proceedToCheckout → /checkout (direct goto fallback)',
                        });
                        await expect(this.page).toHaveURL(/\/checkout$/);
                        return;
                    }
                    // Otherwise re-GET the cart so the button is on-screen again.
                    await this.page.goto('/view_cart');
                    await SutAvailabilityHelper.recoverIfInterstitial(this.page, {
                        label: 'CheckoutSteps.proceedToCheckout re-GET /view_cart',
                    });
                    await this.page.waitForTimeout(
                        CheckoutSteps.NAV_RETRY_BACKOFF_BASE_MS
                            + attempt * CheckoutSteps.NAV_RETRY_BACKOFF_STEP_MS,
                    );
                }
            }

            // All attempts exhausted — fall through to the strict assertion so
            // the failure message is the familiar toHaveURL diff, not a loop boundary.
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
            // Same retry pattern as proceedToCheckout — under SUT overload the
            // "Place Order" GET can be dropped and the browser stays on
            // /checkout with no error. /payment is a GET route so reloading
            // and direct-goto fallback are both safe.
            for (let attempt = 1; attempt <= CheckoutSteps.NAV_CLICK_ATTEMPTS; attempt++) {
                await this.placeOrderBtn.click();

                await SutAvailabilityHelper.recoverIfInterstitial(this.page, {
                    label: `CheckoutSteps.placeOrder → /payment (attempt ${attempt})`,
                });

                try {
                    await expect(this.page).toHaveURL(/\/payment$/, {
                        timeout: CheckoutSteps.NAV_URL_POLL_TIMEOUT_MS,
                    });
                    return;
                } catch {
                    if (attempt === CheckoutSteps.NAV_CLICK_ATTEMPTS) break;
                    console.warn(
                        `[CheckoutSteps] placeOrder: click #${attempt} did not navigate ` +
                        `(still at ${this.page.url()}), retrying…`,
                    );
                    if (attempt === CheckoutSteps.NAV_CLICK_ATTEMPTS - 1) {
                        await this.page.goto('/payment');
                        await SutAvailabilityHelper.recoverIfInterstitial(this.page, {
                            label: 'CheckoutSteps.placeOrder → /payment (direct goto fallback)',
                        });
                        await expect(this.page).toHaveURL(/\/payment$/);
                        return;
                    }
                    await this.page.goto('/checkout');
                    await SutAvailabilityHelper.recoverIfInterstitial(this.page, {
                        label: 'CheckoutSteps.placeOrder re-GET /checkout',
                    });
                    await this.page.waitForTimeout(
                        CheckoutSteps.NAV_RETRY_BACKOFF_BASE_MS
                            + attempt * CheckoutSteps.NAV_RETRY_BACKOFF_STEP_MS,
                    );
                }
            }

            await expect(this.page).toHaveURL(/\/payment$/);
        });
    }

    // ── Payment screen ────────────────────────────────────────────────────────

    async fillPaymentDetails(d: PaymentDetails): Promise<void> {
        await test.step('Fill payment details', async () => {
            // Belt-and-suspenders: placeOrder() already reloaded any
            // interstitial off /payment, but if the AUT flipped into
            // overflow mode between that call and this one we'd time out
            // on name-on-card. One cheap pre-flight check handles that.
            await SutAvailabilityHelper.recoverIfInterstitial(this.page, {
                label: 'CheckoutSteps.fillPaymentDetails → /payment',
            });
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
            // The payment POST has already landed on its result GET URL by
            // the time we get here (the AUT 302s after the submit). That means
            // reloading is safe — it re-GETs the confirmation page, it does
            // NOT re-POST the payment form. This was the Original attempt's
            // failure point: /payment_done was being served as the queue-full
            // interstitial and the "Order Placed!" heading never appeared.
            await SutAvailabilityHelper.recoverIfInterstitial(this.page, {
                label: 'CheckoutSteps.verifyOrderPlaced → /payment_done',
            });
            await expect(this.orderPlacedHeading).toBeVisible({
                timeout: CheckoutSteps.ORDER_PLACED_VISIBLE_TIMEOUT_MS,
            });
            await expect(this.page.getByText(/congratulations.*order.*confirmed/i)).toBeVisible();
        });
    }

    /**
     * Clicks "Download Invoice" and returns the Download event (Playwright pattern).
     *
     * Hardened against the AUT's "under heavy load (queue full)" overflow mode,
     * where `/download_invoice/<order>` 503's instead of returning the PDF. When
     * that happens the click triggers no download event at all — the browser
     * either stays on `/payment_done` or navigates to a 503 HTML page — and
     * `waitForEvent('download')` just times out with a confusing "waiting for
     * event" error that reads like a bug in our test. We retry the whole
     * click + wait up to N times, reloading the confirmation page in between
     * so the link is on-screen again and (hopefully) the next attempt lands
     * on a healthy server.
     */
    async downloadInvoice(): Promise<Download> {
        return test.step('Download invoice', async () => {
            let lastErr: Error | undefined;

            for (let attempt = 1; attempt <= CheckoutSteps.DOWNLOAD_ATTEMPTS; attempt++) {
                // If the confirmation page itself was served as an interstitial
                // between verifyOrderPlaced() and here, clear it first — the
                // download link isn't even on the DOM otherwise.
                await SutAvailabilityHelper.recoverIfInterstitial(this.page, {
                    label: `downloadInvoice pre-flight ` +
                        `(attempt ${attempt}/${CheckoutSteps.DOWNLOAD_ATTEMPTS})`,
                    attempts: CheckoutSteps.INNER_RECOVER_ATTEMPTS,
                });

                try {
                    const downloadPromise = this.page.waitForEvent('download', {
                        timeout: CheckoutSteps.DOWNLOAD_PER_ATTEMPT_TIMEOUT_MS,
                    });
                    await this.downloadInvoiceLink.click();
                    return await downloadPromise;
                } catch (err) {
                    lastErr = err as Error;
                    console.warn(
                        `[CheckoutSteps] downloadInvoice attempt ` +
                        `${attempt}/${CheckoutSteps.DOWNLOAD_ATTEMPTS} ` +
                        `failed: ${lastErr.message.split('\n')[0]}`,
                    );

                    if (attempt < CheckoutSteps.DOWNLOAD_ATTEMPTS) {
                        // The click may have navigated us onto the 503 page; go
                        // back to the confirmation page so the download link is
                        // on-screen again for the next try. `goBack` is a GET
                        // so re-submission is not a concern here.
                        try {
                            await this.page.goBack({
                                timeout: CheckoutSteps.DOWNLOAD_GO_BACK_TIMEOUT_MS,
                                waitUntil: 'domcontentloaded',
                            });
                        } catch {
                            // ignore — the next pre-flight recoverIfInterstitial
                            // will deal with whatever state we're in.
                        }
                        // Small backoff so repeated attempts don't hammer the
                        // overloaded SUT in lockstep.
                        await this.page.waitForTimeout(
                            CheckoutSteps.DOWNLOAD_RETRY_BACKOFF_BASE_MS
                                + attempt * CheckoutSteps.DOWNLOAD_RETRY_BACKOFF_STEP_MS,
                        );
                    }
                }
            }

            throw lastErr ?? new Error(
                `downloadInvoice: no Download event after ${CheckoutSteps.DOWNLOAD_ATTEMPTS} attempts.`,
            );
        });
    }

    async clickContinueAfterOrder(): Promise<void> {
        await test.step('Click Continue after order', async () => {
            await this.continueBtn.click();
        });
    }
}
