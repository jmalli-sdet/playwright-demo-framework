//
//  P1MemberHomeTests.spec.ts
//  = P1MemberHomeTests.kt
//

import { test } from '../base/UITestBase';

test.describe('Member Home — P1 Smoke', { tag: ['@P1', '@smoke', '@home'] }, () => {

    test('P1 | HOME | Landing page shows hero + features + categories + brands',
        async ({ memberHomeSteps }, testInfo) => {
            testInfo.annotations.push(
                { type: 'description', description: 'Anonymous landing page renders all top-level sections.' },
                { type: 'jira', description: 'DEMO-701' },
                { type: 'priority', description: 'P1' },
            );
            await memberHomeSteps.open();
            await memberHomeSteps.verifyHomePageLoaded();
        });
});
