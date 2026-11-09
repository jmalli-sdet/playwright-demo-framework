//
//  P1LoginTests.spec.ts
//  = P1LoginTests.kt
//
//  Smoke-tier login coverage. Mirrors Nike's P1LoginTests.kt — one @Test
//  per @Description + @Documentation annotation, running under the
//  UITestBase (= fixture base) with a @get:Rule chain.
//

import { test, expect } from '../base/UITestBase';

// Login tests must start anonymous — reset any storageState an earlier project set.
test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Login — P1 Smoke', { tag: ['@P1', '@smoke', '@login'] }, () => {

    test.beforeEach(async ({ loginSteps }) => {
        await loginSteps.open();
    });

    test('P1 | LOGIN | Page loads with both Login and Signup forms', async ({ loginSteps }, testInfo) => {
        testInfo.annotations.push(
            { type: 'description', description: 'Verifies the /login page renders both the Login and Signup forms.' },
            { type: 'jira', description: 'DEMO-101' },
            { type: 'priority', description: 'P1' },
        );
        await loginSteps.verifyLoginPageLoaded();
    });

    test('P1 | LOGIN | Invalid credentials shows incorrect-credentials error', async ({ loginSteps, testData }, testInfo) => {
        testInfo.annotations.push(
            { type: 'description', description: 'Negative login — invalid credentials must show the correct error.' },
            { type: 'jira', description: 'DEMO-102' },
            { type: 'priority', description: 'P1' },
        );

        const fake = testData.getInvalidUser();
        await loginSteps.loginWith(fake.email, fake.password);
        await loginSteps.verifyIncorrectCredentialsError();
    });

    test('P1 | LOGIN | Empty email keeps user on the login page (HTML5 validation)',
        async ({ loginSteps, page }, testInfo) => {
            testInfo.annotations.push(
                { type: 'description', description: 'HTML5 required-field validation keeps the user on /login.' },
                { type: 'jira', description: 'DEMO-103' },
                { type: 'priority', description: 'P1' },
            );

            await loginSteps.loginWith('', 'anything');

            // Native browser validation blocks submission — URL stays on /login
            await expect(page).toHaveURL(/\/login$/);
        });
});
