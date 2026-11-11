//
//  P1FavoritesTests.spec.ts
//  = reference P1FavoritesTests.kt
//
//  Signed-in user filters the catalogue by brand — the AUT's closest analog to
//  a "my favorite brands" feature. Exercises:
//    • storageState dependency (requires auth.setup.ts to have run)
//    • Sidebar interaction + URL assertion
//    • Gridwall count expectation
//

import { test, expect } from '../base/UITestBase';
import { AUTH_STATE_FILE } from '../../resources/AuthState';

test.use({ storageState: AUTH_STATE_FILE });

test.describe('Favorites — P1 Smoke', { tag: ['@P1', '@smoke', '@favorites'] }, () => {

    test('P1 | FAV | Signed-in user can browse the Polo brand gridwall',
        async ({ favoritesSteps, profileSteps }, testInfo) => {
            testInfo.annotations.push(
                { type: 'description', description: 'Logged-in user uses the Brands sidebar as a proxy for "my favorite brands" and lands on a non-empty gridwall.' },
                { type: 'jira', description: 'DEMO-901' },
                { type: 'priority', description: 'P1' },
            );

            await favoritesSteps.openProducts();
            await favoritesSteps.openBrand('Polo');
            await favoritesSteps.verifyBrandGridwallLoaded('Polo');
            await favoritesSteps.verifyAtLeastOneBrandedTileShown();
        });

    test('P1 | FAV | Switching brands updates the gridwall',
        async ({ favoritesSteps }, testInfo) => {
            testInfo.annotations.push(
                { type: 'description', description: 'Each brand click produces a distinct gridwall URL + title; verifies the sidebar is an actual filter, not a decoration.' },
                { type: 'jira', description: 'DEMO-902' },
                { type: 'priority', description: 'P1' },
            );

            await favoritesSteps.openProducts();

            await favoritesSteps.openBrand('Polo');
            await favoritesSteps.verifyBrandGridwallLoaded('Polo');

            await favoritesSteps.openBrand('H&M');
            await favoritesSteps.verifyBrandGridwallLoaded('H&M');
        });
});
