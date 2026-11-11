//
//  NotificationsRule.ts
//  = UrbanAirshipNotificationsRule.kt
//
//  Grant/deny browser permissions up-front so permission prompts never
//  interrupt a test. the reference suite's rule dismisses push-notification prompts on Android.
//

import type { BrowserContext } from '@playwright/test';

export async function applyNotificationsRule(context: BrowserContext): Promise<void> {
    // Explicitly deny notifications so no browser prompt appears.
    await context.grantPermissions([], { origin: 'https://automationexercise.com' });
}
