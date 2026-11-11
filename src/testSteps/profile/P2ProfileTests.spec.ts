//
//  P2ProfileTests.spec.ts
//

import { test } from '../base/UITestBase';
import { AUTH_STATE_FILE } from '../../resources/AuthState';

test.use({ storageState: AUTH_STATE_FILE });

test.describe('Profile — P2 Regression', { tag: ['@P2', '@regression', '@profile'] }, () => {

    test('P2 | PROFILE | Logout flow redirects to /login',
        async ({ profileSteps, testData }, testInfo) => {
            testInfo.annotations.push(
                { type: 'description', description: 'Clicking Logout clears the session and lands on /login. Uses the self-healing login check so a stale shared storageState does not cause a false logout-flow failure.' },
                { type: 'jira', description: 'DEMO-599' },
                { type: 'priority', description: 'P2' },
            );
            const p1 = testData.getP1User();
            await profileSteps.goToHome();
            await profileSteps.ensureLoggedInAs(p1.name, { email: p1.email, password: p1.password });
            await profileSteps.logout();
            await profileSteps.verifyOnLoginPage();
        });
});
