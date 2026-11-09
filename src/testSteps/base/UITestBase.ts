//
//  UITestBase.ts
//  playwright-demo-framework
//
//  Equivalent of Nike's UITestBase.kt + RuleChain.
//
//  In Nike, @Rule RuleChain composes TestWatcherRule → DisabledTestRule → PdpConfigurationRule →
//  UrbanAirshipNotificationsRule → BotProtectionHeaderRule, with CoroutineExceptionHandlerRule
//  as the outermost rule.
//
//  In Playwright we compose that behavior as a chain of custom fixtures. Fixture order is
//  "outside-in": the first fixture listed below runs first and tears down last, which maps
//  directly to RuleChain.outerRule(...).around(...).around(...).
//
//  Every *Steps / page-object class is exposed as a fixture — the equivalent of
//  `protected val checkoutSteps = CheckoutSteps(composeTestRule)` in UITestBase.kt.
//

import { test as base, expect, type Page, type BrowserContext, type APIRequestContext } from '@playwright/test';

// ── Rules (= base/rules/ in Nike) ─────────────────────────────────────────────
import { applyUncaughtExceptionRule } from './rules/UncaughtExceptionRule';
import { applyTestWatcherRule }        from './rules/TestWatcherRule';
import { applyDisabledTestRule }       from './rules/DisabledTestRule';
import { applyPdpConfigurationRule }   from './rules/PdpConfigurationRule';
import { applyNotificationsRule }      from './rules/NotificationsRule';
import { applyBotProtectionHeaderRule } from './rules/BotProtectionHeaderRule';

// ── Resources (= resources/ in Nike) ──────────────────────────────────────────
import { TestData } from '../../resources/TestData';

// ── API clients (= utils/api/clients/ in Nike) ───────────────────────────────
import { AuthorizationApiClient } from '../../utils/api/clients/AuthorizationApiClient';
import { UserAccountApiClient }    from '../../utils/api/clients/UserAccountApiClient';

// ── Feature steps (= testSteps/<area>/<Area>Steps in Nike) ───────────────────
import { LoginSteps }            from '../login/LoginSteps';
import { SearchSteps }           from '../search/SearchSteps';
import { ProductDisplaySteps }   from '../productDetail/ProductDisplaySteps';
import { CheckoutSteps }         from '../checkout/CheckoutSteps';
import { ProfileSteps }          from '../profile/ProfileSteps';
import { NavBarSteps }           from '../navigation/NavBarSteps';
import { MemberHomeSteps }       from '../memberHome/MemberHomeSteps';

// ── Helpers ──────────────────────────────────────────────────────────────────
import { setRegion }     from '../../utils/helpers/RegionHelper';
import { NetworkHelper } from '../../utils/helpers/NetworkHelper';

/**
 * Fixture set exposed to every test in the framework.
 *
 * Direct Nike analog:
 *     protected val testData = TestData()
 *     protected val device = DeviceWrappers()
 *     protected val loginSteps = LoginSteps()
 *     protected val checkoutSteps = CheckoutSteps(composeTestRule)
 *     ...
 */
type UIFixtures = {
    // resources + api
    testData: TestData;
    authApi: AuthorizationApiClient;
    userAccountApi: UserAccountApiClient;

    // feature steps (= *Steps.kt classes)
    loginSteps:          LoginSteps;
    searchSteps:         SearchSteps;
    productDisplaySteps: ProductDisplaySteps;
    checkoutSteps:       CheckoutSteps;
    profileSteps:        ProfileSteps;
    navBarSteps:         NavBarSteps;
    memberHomeSteps:     MemberHomeSteps;
};

/**
 * `test` is the UITestBase equivalent. Every spec in the framework imports from here:
 *     import { test, expect } from '../../testSteps/base/UITestBase';
 */
export const test = base.extend<UIFixtures>({

    // ── Resources ─────────────────────────────────────────────────────────────
    testData: async ({}, use) => {
        await use(new TestData());
    },

    // ── API clients (share the browser's APIRequestContext → shared cookies) ─
    authApi:        async ({ request }, use) => { await use(new AuthorizationApiClient(request)); },
    userAccountApi: async ({ request }, use) => { await use(new UserAccountApiClient(request)); },

    // ── Feature steps — same lifetime as the `page` fixture ───────────────────
    loginSteps:          async ({ page }, use) => { await use(new LoginSteps(page)); },
    searchSteps:         async ({ page }, use) => { await use(new SearchSteps(page)); },
    productDisplaySteps: async ({ page }, use) => { await use(new ProductDisplaySteps(page)); },
    checkoutSteps:       async ({ page }, use) => { await use(new CheckoutSteps(page)); },
    profileSteps:        async ({ page }, use) => { await use(new ProfileSteps(page)); },
    navBarSteps:         async ({ page }, use) => { await use(new NavBarSteps(page)); },
    memberHomeSteps:     async ({ page }, use) => { await use(new MemberHomeSteps(page)); },

    // ── The `page` fixture is overridden to compose our "RuleChain" ───────────
    //    Order below mirrors RuleChain.outerRule(...).around(...).around(...):
    //      1. UncaughtExceptionRule  (outermost — catches everything)
    //      2. TestWatcherRule        (screenshots / trace on failure)
    //      3. DisabledTestRule       (skips flagged tests)
    //      4. PdpConfigurationRule   (per-test env tweaks)
    //      5. NotificationsRule      (dismiss browser notifications)
    //      6. BotProtectionHeaderRule (extra headers for bot-blocked sites)
    page: async ({ page, context }, use, testInfo) => {
        applyUncaughtExceptionRule(page, testInfo);
        applyDisabledTestRule(testInfo);
        applyPdpConfigurationRule(page);
        await applyNotificationsRule(context);
        await applyBotProtectionHeaderRule(context);

        // Strip ads/analytics — faster + more reliable + clean console.
        await NetworkHelper.blockAds(context);

        // region/locale setup — equivalent of @Before { regionSetUp() }
        await setRegion(context, testInfo.project.use.locale ?? 'en-US');

        // Hand the configured page to the test.
        await use(page);

        // Teardown runs in reverse order (= RuleChain post-evaluate).
        await applyTestWatcherRule(page, testInfo);
    },
});

export { expect };
export type { Page, BrowserContext, APIRequestContext };
