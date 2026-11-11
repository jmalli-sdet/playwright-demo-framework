//
//  response-stub.spec.ts
//
//  Demonstrates the key network-interception concepts:
//    - context.route(pattern, handler)
//    - route.fulfill({ status, body })
//    - route.continue({ headers })
//    - page.waitForRequest(pattern) — assert that a specific request was made
//
//  This is the pattern reference uses in `OkHttpManager.kt` for driving UI through
//  canned API states.
//

import { test, expect } from '@playwright/test';

test.describe('Network — @P2 @network', { tag: ['@P2', '@regression', '@network'] }, () => {

    test('P2 | NET | /api/productsList can be stubbed to return a canned payload',
        async ({ page, context }, testInfo) => {
            testInfo.annotations.push(
                { type: 'description', description: 'context.route + route.fulfill replaces the real response with a known payload.' },
                { type: 'jira', description: 'DEMO-801' },
                { type: 'priority', description: 'P2' },
            );

            const fakePayload = {
                responseCode: 200,
                products: [
                    { id: 999, name: 'Stubbed Demo Product', price: 'Rs. 42',
                      brand: 'Demo Framework', category: { usertype: { usertype: 'Men' }, category: 'Tshirts' } },
                ],
            };

            await context.route('**/api/productsList', (route) =>
                route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify(fakePayload),
                }),
            );

            // The browser's fetch (triggered from page context) is routed through
            // context.route(); page.request / APIRequestContext is NOT consistently
            // intercepted across versions, so we drive the request from the page
            // instead — this mirrors how production UIs actually consume the API.
            await page.goto('/');
            const json = await page.evaluate(async () => {
                const r = await fetch('/api/productsList');
                return r.json();
            });
            expect(json.products[0].name).toBe('Stubbed Demo Product');
        });

    test('P2 | NET | page.waitForRequest asserts the AUT calls expected endpoint',
        async ({ page }, testInfo) => {
            testInfo.annotations.push(
                { type: 'description', description: 'When navigating to /products, verifies the AUT issues a specific asset request.' },
                { type: 'jira', description: 'DEMO-802' },
                { type: 'priority', description: 'P2' },
            );
            const [req] = await Promise.all([
                page.waitForRequest((r) => r.url().includes('/get_category_products') === false &&
                                           r.resourceType() === 'document' &&
                                           r.url().includes('/products')),
                page.goto('/products'),
            ]);
            expect(req.method()).toBe('GET');
        });
});
