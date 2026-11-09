//
//  P1ProfileTests.spec.ts
//  = P1ProfileTests.kt
//

import { test } from '../base/UITestBase';
import { AUTH_STATE_FILE } from '../../resources/AuthState';

test.use({ storageState: AUTH_STATE_FILE });

test.describe('Profile — P1 Smoke', { tag: ['@P1', '@smoke', '@profile'] }, () => {

    test('P1 | PROFILE | Logged-in banner shows the P1 user name',
        async ({ profileSteps }, testInfo) => {
            testInfo.annotations.push(
                { type: 'description', description: 'storageState login persists across sessions → banner reads the correct user name.' },
                { type: 'jira', description: 'DEMO-501' },
                { type: 'priority', description: 'P1' },
            );
            await profileSteps.goToHome();
            await profileSteps.verifyLoggedInAs('JM Demo P1');
        });
});
