//
//  P1SmokeTestsSuite.ts
//  = P1SmokeTestsSuite.kt
//
//  JUnit's @Suite.SuiteClasses(P1LoginTests::class, P1CheckoutTests::class, ...)
//  doesn't exist in Playwright. The equivalent is a tag selector: every P1 spec
//  is tagged `@P1`, and this file documents the roster + exposes the npm script.
//
//  Run:
//    npm run test:p1
//    npx playwright test --grep @P1
//

export const P1_SUITE_MEMBERS = [
    'login/P1LoginTests.spec.ts',
    // Evening 2 adds:
    // 'shopHome/P1ShopHomeTests.spec.ts',
    // 'search/P1SearchTests.spec.ts',
    // 'productDetail/P1ProductDetailTests.spec.ts',
    // 'checkout/P1CheckoutTests.spec.ts',
    // 'profile/P1ProfileTests.spec.ts',
    // 'memberHome/P1MemberHomeTests.spec.ts',
    // 'navigation/P1NavigationTests.spec.ts',
    // 'settings/P1SettingsTests.spec.ts',
    // 'userLocaleConfiguration/P1LocaleTests.spec.ts',
    // 'deeplinking/P1DeeplinkTests.spec.ts',
    // 'preReceipt/P1PreReceiptTests.spec.ts',
    // 'favorites/P1FavoritesTests.spec.ts',
    // 'onboarding/P1OnboardingTests.spec.ts',
];
