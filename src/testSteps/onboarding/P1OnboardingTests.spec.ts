//
//  P1OnboardingTests.spec.ts
//  = P1OnboardingTests.kt
//
//  Full UI signup flow for a freshly-generated user. Tests the long form on
//  /signup with selectOption dropdowns, then deletes the account to keep the
//  AUT clean.
//

import { test } from '../base/UITestBase';
import { faker } from '@faker-js/faker';

// Needs to start logged OUT so the signup form is accessible.
test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Onboarding — P1 Smoke', { tag: ['@P1', '@smoke', '@onboarding'] }, () => {

    test('P1 | ONBOARDING | Full UI signup → logged in → delete account',
        async ({ onboardingSteps }, testInfo) => {
            testInfo.annotations.push(
                { type: 'description', description: 'Generates a random user, completes the full /signup form including selects, verifies logged-in state, then cleans up by deleting the account.' },
                { type: 'jira', description: 'DEMO-1001' },
                { type: 'priority', description: 'P1' },
            );

            const firstName = faker.person.firstName();
            const lastName  = faker.person.lastName();
            const email     = `pwdemo.${Date.now()}@demo.local`;
            const name      = `${firstName} ${lastName}`;

            await onboardingSteps.openLoginSignup();
            await onboardingSteps.startSignup(name, email);
            await onboardingSteps.fillAccountInformation({
                password:  'DemoFramework!2026',
                title:     'Mr',
                day:       '15',
                month:     'January',
                year:      '1995',
                firstName,
                lastName,
                address:   '123 Playwright Lane',
                country:   'United States',
                state:     'NY',
                city:      'New York',
                zipcode:   '10001',
                mobile:    '+15555550101',
            });
            await onboardingSteps.clickContinueAfterCreation();
            await onboardingSteps.verifyLoggedInAs(name);
            await onboardingSteps.deleteAccount();
        });
});
