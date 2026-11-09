//
//  P1MemberHomeTests.spec.ts
//  = P1MemberHomeTests.kt
//

import { test } from '../base/UITestBase';
import { runAccessibilityScan } from '../../accessibility/AccessibilityCheck';

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

    test('P1 | HOME | Passes accessibility scan (axe, suppressions applied) @a11y',
        async ({ page, memberHomeSteps }, testInfo) => {
            testInfo.annotations.push(
                { type: 'description', description: 'Runs @axe-core/playwright over the landing page; fails on any non-suppressed WCAG 2.0 A/AA violation.' },
                { type: 'jira', description: 'DEMO-702' },
                { type: 'priority', description: 'P1' },
            );
            await memberHomeSteps.open();
            await runAccessibilityScan(page, { name: 'home-landing' });
        });
});
