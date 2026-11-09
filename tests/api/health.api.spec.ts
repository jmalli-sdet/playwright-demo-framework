// Pure-API smoke test — demonstrates APIRequestContext fixture usage.
import { test, expect } from '@playwright/test';

test.describe('AUT /productsList — @P1 @api', { tag: ['@P1', '@api'] }, () => {
    test('productsList endpoint returns a non-empty catalog', async ({ request }) => {
        const res = await request.get('https://automationexercise.com/api/productsList');
        expect(res.ok()).toBeTruthy();
        const json = await res.json();
        expect(Array.isArray(json.products)).toBeTruthy();
        expect(json.products.length).toBeGreaterThan(0);
    });
});
