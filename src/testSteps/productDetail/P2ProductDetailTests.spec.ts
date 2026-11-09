//
//  P2ProductDetailTests.spec.ts
//

import { test } from '../base/UITestBase';

test.describe('Product Detail — P2 Regression', { tag: ['@P2', '@regression', '@pdp'] }, () => {

    test('P2 | PDP | Gridwall hover reveals "View Product" overlay and navigates',
        async ({ productDisplaySteps, page }, testInfo) => {
            testInfo.annotations.push(
                { type: 'description', description: 'Hover interaction surfaces the overlay; clicking it goes to a /product_details/<id> URL.' },
                { type: 'jira', description: 'DEMO-399' },
                { type: 'priority', description: 'P2' },
            );
            await page.goto('/products');
            await productDisplaySteps.hoverTileAndOpen(0);
        });
});
