//
//  P2ProfileTests.spec.ts
//

import { test } from '../base/UITestBase';
import { AUTH_STATE_FILE } from '../../resources/AuthState';

test.use({ storageState: AUTH_STATE_FILE });

test.describe('Profile — P2 Regression', { tag: ['@P2', '@regression', '@profile'] }, () => {

    test('P2 | PROFILE | Logout flow redirects to /login',
        async ({ profileSteps }, testInfo) => {
            testInfo.annotations.push(
                { type: 'description', description: 'Clicking Logout clears the session and lands on /login.' },
                { type: 'jira', description: 'DEMO-599' },
                { type: 'priority', description: 'P2' },
            );
            await profileSteps.goToHome();
            await profileSteps.verifyLoggedInAs('JM Demo P1');
            await profileSteps.logout();
            await profileSteps.verifyOnLoginPage();
        });
});
