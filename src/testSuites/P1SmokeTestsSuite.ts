//
//  P1SmokeTestsSuite.ts
//  = P1SmokeTestsSuite.kt
//
//  JUnit's @Suite.SuiteClasses doesn't exist in Playwright. The equivalent is
//  tag-based selection: every P1 spec is tagged `@P1`, and this file documents
//  the roster + exposes the npm script.
//
//  Run:
//    npm run test:p1
//    npx playwright test --grep @P1
//

export const P1_SUITE_MEMBERS = [
    // ── Populated in Evening 2 ───────────────────────────────────────────────
    'login/P1LoginTests.spec.ts',
    'search/P1SearchTests.spec.ts',
    'productDetail/P1ProductDetailTests.spec.ts',
    'checkout/P1CheckoutTests.spec.ts',
    'profile/P1ProfileTests.spec.ts',
    'navigation/P1NavigationTests.spec.ts',
    'memberHome/P1MemberHomeTests.spec.ts',
    'api/health.api.spec.ts',

    // ── Placeholders — populated in Evening 3 ────────────────────────────────
    // 'onboarding/P1OnboardingTests.spec.ts',
    // 'favorites/P1FavoritesTests.spec.ts',
    // 'preReceipt/P1PreReceiptTests.spec.ts',
    // 'settings/P1SettingsTests.spec.ts',
    // 'userLocaleConfiguration/P1LocaleConfigTests.spec.ts',
    // 'deeplinking/P1DeeplinkTests.spec.ts',
];
