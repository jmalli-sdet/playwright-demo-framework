//
//  P1NavigationTests.spec.ts
//  = P1NavigationTests.kt
//

import { test } from '../base/UITestBase';

test.describe('Navigation — P1 Smoke', { tag: ['@P1', '@smoke', '@nav'] }, () => {

    test('P1 | NAV | Anonymous user sees Signup/Login (no Logout)',
        async ({ navBarSteps, page }, testInfo) => {
            testInfo.annotations.push(
                { type: 'description', description: 'Default anonymous state: nav exposes Signup/Login and hides Logout.' },
                { type: 'jira', description: 'DEMO-601' },
                { type: 'priority', description: 'P1' },
            );
            await page.goto('/');
            await navBarSteps.verifyAnonymousNavItems();
        });
});
