//
//  RegionHelper.ts
//  = MultiRegionRoutingSetupHelper.kt + regionSetUp()
//
//  the reference suite's regionSetUp() switches the app to the correct brand/locale/geo before
//  a test. In Playwright the browser context already has `locale` + `timezoneId`
//  set via the project; this helper layers in a cookie-based region marker so
//  AUT-side feature flags behave consistently.
//

import type { BrowserContext } from '@playwright/test';

export async function setRegion(context: BrowserContext, locale: string): Promise<void> {
    await context.addCookies([
        {
            name: 'preferred_locale',
            value: locale,
            domain: '.automationexercise.com',
            path: '/',
        },
    ]);
}
