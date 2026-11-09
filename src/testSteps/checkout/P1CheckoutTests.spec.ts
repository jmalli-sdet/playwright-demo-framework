//
//  P1CheckoutTests.spec.ts
//  = P1CheckoutTests.kt
//
//  End-to-end buy flow. Opts into the shared storageState produced by
//  tests/auth.setup.ts so we start logged in as the P1 demo user.
//

import { test, expect } from '../base/UITestBase';
import { AUTH_STATE_FILE } from '../../resources/AuthState';

test.use({ storageState: AUTH_STATE_FILE });

test.describe('Checkout — P1 Smoke', { tag: ['@P1', '@smoke', '@checkout'] }, () => {

    test('P1 | CHECKOUT | Logged-in user can place an order and download invoice',
        async ({ productDisplaySteps, checkoutSteps, testData, profileSteps }, testInfo) => {
            testInfo.annotations.push(
                { type: 'description', description: 'Full happy-path buy flow: PDP → Cart → Checkout → Payment → Order placed → Download invoice.' },
                { type: 'jira', description: 'DEMO-401' },
                { type: 'priority', description: 'P1' },
            );

            // Sanity: storageState is active → we are logged in.
            await profileSteps.goToHome();
            await profileSteps.verifyLoggedInAs('JM Demo P1');

            // 1. Add a product to the cart
            await productDisplaySteps.openPdpById(1);
            await productDisplaySteps.setQuantity(1);
            await productDisplaySteps.addToCart();
            await productDisplaySteps.goToCartFromModal();

            // 2. Checkout
            await checkoutSteps.proceedToCheckout();
            await checkoutSteps.verifyAddressDetailsVisible();
            await checkoutSteps.addOrderComment('Playwright demo order — please ignore.');
            await checkoutSteps.placeOrder();

            // 3. Payment
            await checkoutSteps.fillPaymentDetails(testData.samplePayment());
            await checkoutSteps.submitPayment();

            // 4. Confirmation + invoice download
            await checkoutSteps.verifyOrderPlaced();

            const download = await checkoutSteps.downloadInvoice();
            expect(download.suggestedFilename()).toMatch(/invoice/i);

            await checkoutSteps.clickContinueAfterOrder();
        });
});
