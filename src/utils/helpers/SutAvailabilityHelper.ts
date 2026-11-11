//
//  SutAvailabilityHelper.ts
//
//  Defensive helpers for when the system under test (automationexercise.com)
//  is misbehaving in ways the test itself didn't cause — most commonly a
//  Cloudflare / under-attack-mode interstitial that returns HTML with a
//  <title>One moment, please…</title> body instead of the real page.
//
//  When that happens, every `locator.*` call times out with a misleading
//  "element not found" error. This helper lets setup code:
//
//    1. detect the challenge explicitly (page title, response body),
//    2. retry the navigation with exponential backoff, giving Cloudflare a
//       chance to drop the challenge, and
//    3. fail fast with a clear, Googleable error when the SUT is genuinely
//       unavailable — instead of pretending our test selectors are broken.
//
//  Scope on purpose: only used by `tests/global.setup.ts` and
//  `tests/auth.setup.ts`. Browser-project specs run behind those and should
//  never see the challenge page in practice.
//

import type { Page } from '@playwright/test';

/**
 * Page titles / body snippets that indicate the SUT is behind a bot-protection
 * interstitial rather than serving the real page. Covers Cloudflare's common
 * variants ("One moment, please…", "Just a moment…", "Checking your browser…",
 * "Attention Required!").
 */
export const CHALLENGE_TITLE_PATTERNS: readonly RegExp[] = [
    /One moment, please/i,
    /Just a moment/i,
    /Checking your browser/i,
    /Attention Required/i,
];

/** Response body fingerprint (used by the global-setup API path). */
export const CHALLENGE_BODY_PATTERNS: readonly RegExp[] = [
    /<title>\s*One moment, please/i,
    /<title>\s*Just a moment/i,
    /cf-browser-verification/i,
    /cf_chl_opt/i,
];

export interface GotoWithChallengeRetryOptions {
    /** How many total navigation attempts before giving up. Default 4. */
    attempts?: number;
    /** First backoff in ms; doubled each attempt, capped at 15 s. Default 2000. */
    initialBackoffMs?: number;
    /** Optional selector that MUST appear for the page to count as "real". */
    waitForSelector?: string;
    /** Per-selector wait timeout in ms. Default 10_000. */
    waitForSelectorTimeoutMs?: number;
    /** Human-readable label used in log + error messages. */
    label?: string;
}

export class SutAvailabilityHelper {

    /**
     * Returns `true` when the current page looks like a Cloudflare/bot
     * interstitial. Safe to call anywhere — swallows its own errors.
     */
    static async isChallengePage(page: Page): Promise<boolean> {
        try {
            const title = await page.title();
            return CHALLENGE_TITLE_PATTERNS.some((rx) => rx.test(title));
        } catch {
            return false;
        }
    }

    /**
     * Returns `true` when an arbitrary HTML string looks like a Cloudflare/bot
     * interstitial. Used by the API client path (where we have the raw body
     * but no live Page).
     */
    static isChallengeBody(html: string): boolean {
        if (!html || html.length === 0) return false;
        return CHALLENGE_BODY_PATTERNS.some((rx) => rx.test(html));
    }

    /**
     * Navigate to `path` with up to N retries whenever the SUT serves a
     * challenge interstitial. On final failure throws a labeled
     * `SUT unavailable (Cloudflare bot challenge)` error so the Actions log
     * tells the operator what actually happened.
     */
    static async gotoWithChallengeRetry(
        page: Page,
        path: string,
        opts: GotoWithChallengeRetryOptions = {},
    ): Promise<void> {
        const attempts = opts.attempts ?? 4;
        const label = opts.label ?? path;
        const selectorTimeout = opts.waitForSelectorTimeoutMs ?? 10_000;
        let backoff = opts.initialBackoffMs ?? 2_000;

        for (let i = 1; i <= attempts; i++) {
            await page.goto(path);

            if (await SutAvailabilityHelper.isChallengePage(page)) {
                console.warn(
                    `[sut] ${label}: Cloudflare challenge on attempt ${i}/${attempts}. ` +
                    `Backing off ${backoff}ms before retrying…`,
                );
                await page.waitForTimeout(backoff);
                backoff = Math.min(backoff * 2, 15_000);
                continue;
            }

            if (opts.waitForSelector) {
                try {
                    await page.waitForSelector(opts.waitForSelector, { timeout: selectorTimeout });
                    return;
                } catch {
                    console.warn(
                        `[sut] ${label}: expected selector '${opts.waitForSelector}' not visible on ` +
                        `attempt ${i}/${attempts}; backing off ${backoff}ms and retrying.`,
                    );
                    await page.waitForTimeout(backoff);
                    backoff = Math.min(backoff * 2, 15_000);
                    continue;
                }
            }

            return;
        }

        throw new Error(
            `SUT unavailable (Cloudflare bot challenge) — ${label} returned the ` +
            `"One moment, please…" interstitial on all ${attempts} attempts. ` +
            `This is an upstream issue with automationexercise.com; retry when the ` +
            `site drops out of under-attack mode, or run the workflow after waiting.`,
        );
    }
}
