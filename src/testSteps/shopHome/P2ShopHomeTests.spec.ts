//
//  P2ShopHomeTests.spec.ts
//  = P2ShopHomeTests.kt
//
//  Visual regression on the anonymous landing page.
//  Baseline is produced on the first run with `--update-snapshots`; subsequent
//  runs diff against visual-baselines/ and fail on pixel drift above
//  config.expect.toHaveScreenshot.maxDiffPixels.
//

import { test, expect } from '../base/UITestBase';

test.describe('Shop Home — P2 Visual', { tag: ['@P2', '@regression', '@visual'] }, () => {

    test('P2 | HOME | Hero carousel matches visual baseline',
        async ({ shopHomeSteps, page }, testInfo) => {
            testInfo.annotations.push(
                { type: 'description', description: 'Pixel-diff of the hero carousel against the committed baseline. Dynamic elements are masked.' },
                { type: 'jira', description: 'DEMO-799' },
                { type: 'priority', description: 'P2' },
            );
            await shopHomeSteps.open();

            // Wait for hero to be fully painted before snapshotting.
            await expect(shopHomeSteps.heroSlider).toBeVisible();
            await page.waitForLoadState('networkidle');

            await expect(shopHomeSteps.heroSlider).toHaveScreenshot('home-hero.png', {
                // Mask anything that legitimately varies between runs.
                mask: [
                    page.locator('.carousel-indicators'),
                    page.locator('.carousel-caption'),
                ],
                maxDiffPixels: 150,
            });
        });
});
