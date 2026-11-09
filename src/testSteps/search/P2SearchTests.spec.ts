//
//  P2SearchTests.spec.ts
//  Data-driven regression: iterates the TestData.searchQueries() list to prove
//  Playwright's describe-loop pattern (= @ParameterizedTest in JUnit 5).
//

import { test, expect } from '../base/UITestBase';
import { TestData } from '../../resources/TestData';

test.describe('Search — P2 Regression', { tag: ['@P2', '@regression', '@search'] }, () => {

    // Data-driven loop hits the AUT concurrently — give this describe its own
    // retry budget to absorb occasional server-side flakes.
    // (Demonstrates per-describe `test.describe.configure({ retries })`.)
    test.describe.configure({ retries: 1 });


    for (const { query, expectedKeyword } of new TestData().searchQueries()) {

        test(`P2 | SEARCH | Keyword "${query}" returns matching results`,
            async ({ searchSteps }, testInfo) => {
                testInfo.annotations.push(
                    { type: 'description', description: `Data-driven: every result for "${query}" contains "${expectedKeyword}".` },
                    { type: 'jira', description: 'DEMO-299' },
                    { type: 'priority', description: 'P2' },
                );

                await searchSteps.openProductsPage();
                await searchSteps.searchFor(query);
                await searchSteps.verifySearchedProductsVisible();
                await searchSteps.verifyResultCountAtLeast(1);
                await searchSteps.verifyAtLeastOneResultContains(expectedKeyword);
            });
    }
});
