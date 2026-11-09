//
//  P1SmokeTestsSuite.ts
//  = P1SmokeTestsSuite.kt
//
//  Tag-based suite roster. Run with:
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

    // ── Added in Evening 3 ───────────────────────────────────────────────────
    'onboarding/P1OnboardingTests.spec.ts',     // full UI signup
    'settings/P1SettingsTests.spec.ts',         // contact form + file upload
    'deeplinking/P1DeeplinkTests.spec.ts',      // popup + dialog + direct deeplink
    'memberHome/P1MemberHomeTests.spec.ts  (a11y variant)',

    // ── Placeholders — populated in Evening 4 ────────────────────────────────
    // 'favorites/P1FavoritesTests.spec.ts',
    // 'preReceipt/P1PreReceiptTests.spec.ts',
    // 'userLocaleConfiguration/P1LocaleConfigTests.spec.ts',
];

export const P2_SUITE_MEMBERS = [
    'search/P2SearchTests.spec.ts',             // data-driven loop + per-describe retry
    'productDetail/P2ProductDetailTests.spec.ts',
    'profile/P2ProfileTests.spec.ts',
    'shopHome/P2ShopHomeTests.spec.ts',         // visual regression
    'api/response-stub.spec.ts',                // route.fulfill + waitForRequest
    'clock.spec.ts',                            // page.clock mock
];
