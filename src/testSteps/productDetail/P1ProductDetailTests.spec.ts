//
//  P1ProductDetailTests.spec.ts
//  = P1ProductDetailTests.kt
//

import { test, expect } from '../base/UITestBase';

test.describe('Product Detail — P1 Smoke', { tag: ['@P1', '@smoke', '@pdp'] }, () => {

    test('P1 | PDP | Direct-link opens PDP and shows all product attributes',
        async ({ productDisplaySteps, page }, testInfo) => {
            testInfo.annotations.push(
                { type: 'description', description: 'Direct navigation to a known PDP shows name/price/availability/condition/brand; price matches custom toHaveCurrencyFormat matcher.' },
                { type: 'jira', description: 'DEMO-301' },
                { type: 'priority', description: 'P1' },
            );
            await productDisplaySteps.openPdpById(1);
            await productDisplaySteps.verifyPdpDetailsVisible();

            // Custom matcher registered via expect.extend() in ExpectExtensions.ts.
            const price = page.locator('.product-information span span').first();
            await expect(price).toHaveCurrencyFormat('Rs.');
        });

    test('P1 | PDP | Setting quantity=3 adds 3 items to the cart',
        async ({ productDisplaySteps, page }, testInfo) => {
            testInfo.annotations.push(
                { type: 'description', description: 'Quantity entered on the PDP is honored on the cart row.' },
                { type: 'jira', description: 'DEMO-302' },
                { type: 'priority', description: 'P1' },
            );
            await productDisplaySteps.openPdpById(1);
            await productDisplaySteps.setQuantity(3);
            await productDisplaySteps.addToCart();
            await productDisplaySteps.goToCartFromModal();

            await expect(page.locator('.cart_quantity button').first()).toHaveText('3');
        });
});
