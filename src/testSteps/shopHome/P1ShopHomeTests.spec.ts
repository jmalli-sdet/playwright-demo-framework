//
//  P1ShopHomeTests.spec.ts
//  = reference P1ShopHomeTests.kt
//
//  Anonymous Shop Home P1 smoke:
//    • Category sidebar drill-in works and lands on the right gridwall
//    • Hero carousel can be advanced to the next slide
//
//  Deliberately runs *without* storageState so we cover the un-authenticated
//  variant of the home screen as well.
//    10|
import { test, expect } from '../base/UITestBase';

// Anonymous — do not reuse the signed-in storage from auth.setup.ts.
test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Shop Home — P1 Smoke', { tag: ['@P1', '@smoke', '@shop'] }, () => {

    test('P1 | SHOP | Category sidebar drills into Women → Dress gridwall',
        async ({ shopHomeSteps }, testInfo) => {
            testInfo.annotations.push(
                { type: 'description', description: 'Anonymous user expands the Women category panel and clicks Dress — verifies URL + gridwall title.' },
                { type: 'jira', description: 'DEMO-1201' },
                { type: 'priority', description: 'P1' },
            );
            await shopHomeSteps.open();
            await shopHomeSteps.openCategory('Women', 'Dress');
            await shopHomeSteps.verifyCategoryGridwallTitleContains('Dress');
        });

    test('P1 | SHOP | Hero carousel next-control advances to slide 2',
        async ({ shopHomeSteps }, testInfo) => {
            testInfo.annotations.push(
                { type: 'description', description: 'Clicks the carousel right control and polls until the second slide becomes active.' },
                { type: 'jira', description: 'DEMO-1202' },
                { type: 'priority', description: 'P1' },
            );
            await shopHomeSteps.open();
            await expect(shopHomeSteps.heroSlider).toBeVisible();
            await shopHomeSteps.advanceHeroCarousel();
        });
});
