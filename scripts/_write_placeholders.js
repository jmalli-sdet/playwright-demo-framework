#!/usr/bin/env node
/* Generates feature-folder placeholders so the Nike-mirrored tree is visible from day 1. */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

const FEATURES = [
    ['onboarding',              'OnboardingSteps',              'Onboarding'],
    ['shopHome',                'ShopHomeSteps',                'ShopHome'],
    ['memberHome',              'MemberHomeSteps',              'MemberHome'],
    ['navigation',              'NavBarSteps',                  'Navigation'],
    ['search',                  'SearchSteps',                  'Search'],
    ['productDetail',           'ProductDisplaySteps',          'ProductDetail'],
    ['favorites',               'FavoritesSteps',               'Favorites'],
    ['preReceipt',              'PreReceiptShippingSteps',      'PreReceipt'],
    ['checkout',                'CheckoutSteps',                'Checkout'],
    ['profile',                 'ProfileSteps',                 'Profile'],
    ['settings',                'SettingSteps',                 'Settings'],
    ['userLocaleConfiguration', 'UserLocaleConfigurationSteps', 'LocaleConfig'],
    ['deeplinking',             'DeeplinkSteps',                'Deeplink'],
];

const stepsTemplate = (steps) => `//
//  ${steps}.ts   (placeholder — populated in Evening 2)
//  = Nike ${steps}.kt
//
import type { Page } from '@playwright/test';

export class ${steps} {
    constructor(private readonly page: Page) {}
    // TODO: port Nike ${steps}.kt actions + verifications.
}
`;

const specTemplate = (area, tier) => `//
//  P${tier}${area}Tests.spec.ts   (placeholder — populated in Evening 2)
//  = Nike P${tier}${area}Tests.kt
//
import { test } from '../base/UITestBase';

test.describe('${area} — P${tier} ${tier === '1' ? 'Smoke' : 'Regression'}', { tag: ['@P${tier}', '${tier === '1' ? '@smoke' : '@regression'}'] }, () => {
    test.fixme('TODO — add P${tier} scenarios for ${area}', async () => {});
});
`;

let written = 0;
for (const [folder, steps, area] of FEATURES) {
    const dir = path.join(ROOT, 'src', 'testSteps', folder);
    fs.mkdirSync(dir, { recursive: true });

    fs.writeFileSync(path.join(dir, `${steps}.ts`),                stepsTemplate(steps));
    fs.writeFileSync(path.join(dir, `P1${area}Tests.spec.ts`),     specTemplate(area, '1'));
    fs.writeFileSync(path.join(dir, `P2${area}Tests.spec.ts`),     specTemplate(area, '2'));
    written += 3;
}

console.log(`Wrote ${written} placeholder files across ${FEATURES.length} feature folders.`);
