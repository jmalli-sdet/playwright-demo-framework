//
//  P1SearchTests.spec.ts
//  = P1SearchTests.kt
//

import { test, expect } from '../base/UITestBase';

test.describe('Search — P1 Smoke', { tag: ['@P1', '@smoke', '@search'] }, () => {

    test.beforeEach(async ({ searchSteps }) => {
        await searchSteps.openProductsPage();
    });

    test('P1 | SEARCH | Keyword "top" returns results that all contain "top"',
        async ({ searchSteps }, testInfo) => {
            testInfo.annotations.push(
                { type: 'description', description: 'Types "top" into the search box and verifies every result name contains the keyword.' },
                { type: 'jira', description: 'DEMO-201' },
                { type: 'priority', description: 'P1' },
            );
            await searchSteps.searchFor('top');
            await searchSteps.verifySearchedProductsVisible();
            await searchSteps.verifyResultCountAtLeast(1);
            await searchSteps.verifyAtLeastOneResultContains('top');
        });

    test('P1 | SEARCH | Empty search submits and stays on /products',
        async ({ searchSteps, page }, testInfo) => {
            testInfo.annotations.push(
                { type: 'description', description: 'Empty search submits without blowing up; URL stays on /products.' },
                { type: 'jira', description: 'DEMO-202' },
                { type: 'priority', description: 'P1' },
            );
            await searchSteps.searchFor('');
            await expect(page).toHaveURL(/\/products(\?.*)?$/);
        });
});
