//
//  NetworkHelper.ts
//  = OkHttpManager.kt
//
//  Playwright's page.route() API for network interception. Used by the
//  UITestBase fixture to strip Google ads / consent / analytics traffic
//  that make automationexercise.com flaky.
//

import type { BrowserContext, Route } from '@playwright/test';

/** Hosts whose requests we abort — ads, consent, analytics, tracking. */
const AD_HOST_PATTERNS = [
    /googlesyndication\.com/,
    /googleadservices\.com/,
    /googletagservices\.com/,
    /googletagmanager\.com/,
    /google-analytics\.com/,
    /fundingchoicesmessages\.google\.com/,
    /doubleclick\.net/,
    /adtrafficquality\.google/,
    /cloudflareinsights\.com/,
];

export class NetworkHelper {

    /**
     * Blocks ads / trackers for the whole context. Call this from the
     * UITestBase page fixture — it removes ~70% of console noise and
     * improves cold-cache PDP load time by ~1.5 s on this AUT.
     */
    static async blockAds(context: BrowserContext): Promise<void> {
        await context.route('**/*', (route: Route) => {
            const url = route.request().url();
            if (AD_HOST_PATTERNS.some((rx) => rx.test(url))) {
                return route.abort();
            }
            return route.continue();
        });
    }

    /** Record all network traffic to a HAR file — used in Evening 3. */
    static async recordHarTo(_context: BrowserContext, _file: string): Promise<void> {
        // TODO Evening 3 — context.routeFromHAR() for playback.
    }

    /** Simulate 3G via CDP. Used in Evening 3 for perf-sensitive specs. */
    static async throttle3G(_context: BrowserContext): Promise<void> {
        // TODO Evening 3 — use CDPSession.send('Network.emulateNetworkConditions', ...)
    }
}
