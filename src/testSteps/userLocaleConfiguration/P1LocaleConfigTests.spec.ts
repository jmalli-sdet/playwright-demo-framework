//
//  P1LocaleConfigTests.spec.ts
//  = Nike P1LocaleConfigTests.kt
//
//  Cross-project locale smoke. Playwright runs this spec under every project
//  in the matrix (chromium-en-US, webkit-en-US, chromium-fr-FR, …) — we read
//  the project's locale from testInfo and assert the browser context + outgoing
//  request headers agree with it.
//
//  This is the Playwright equivalent of Nike's per-market build-flavor coverage.
//    10|
import { test } from '../base/UITestBase';

// Anonymous — locale checks don't require a login.
test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Locale — P1 Smoke', { tag: ['@P1', '@smoke', '@locale'] }, () => {

    test('P1 | LOCALE | navigator.language matches the active project locale',
        async ({ userLocaleConfigurationSteps }, testInfo) => {
            const locale = testInfo.project.use.locale ?? 'en-US';
            testInfo.annotations.push(
                { type: 'description', description: `Verifies the browser context's navigator.language matches the ${locale} project.` },
                { type: 'jira', description: 'DEMO-1301' },
                { type: 'priority', description: 'P1' },
            );

            await userLocaleConfigurationSteps.openHome();
            await userLocaleConfigurationSteps.verifyNavigatorLocale(locale);
        });

    test('P1 | LOCALE | Accept-Language header reflects the active locale',
        async ({ userLocaleConfigurationSteps }, testInfo) => {
            const locale = testInfo.project.use.locale ?? 'en-US';
            testInfo.annotations.push(
                { type: 'description', description: `Verifies outgoing Accept-Language contains ${locale}.` },
                { type: 'jira', description: 'DEMO-1302' },
                { type: 'priority', description: 'P1' },
            );

            await userLocaleConfigurationSteps.openHome();
            await userLocaleConfigurationSteps.verifyAcceptLanguageContains(locale);
        });

    test('P1 | LOCALE | Core page structure is stable across locales',
        async ({ userLocaleConfigurationSteps }, testInfo) => {
            testInfo.annotations.push(
                { type: 'description', description: 'Markup regions (hero carousel, features, footer) must render in every locale.' },
                { type: 'jira', description: 'DEMO-1303' },
                { type: 'priority', description: 'P1' },
            );

            await userLocaleConfigurationSteps.openHome();
            await userLocaleConfigurationSteps.verifyCorePageStructureStable();
        });
});
