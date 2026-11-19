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

/**
 * Body fingerprints for automationexercise.com's "queue full / under heavy load"
 * interstitial. Unlike the Cloudflare page, this one has NO `<title>` — it is a
 * bare `<body>` with an `<h2>This website is under heavy load (queue full)</h2>`
 * block — so title-based detection misses it entirely. Match on body text
 * instead, applied to the raw HTML returned by `page.content()`.
 */
export const HEAVY_LOAD_BODY_PATTERNS: readonly RegExp[] = [
    /under heavy load/i,
    /queue full/i,
    /too many people are accessing this website/i,
];

export interface GotoWithChallengeRetryOptions {
    /** How many total navigation attempts before giving up. See `SutAvailabilityHelper.DEFAULT_GOTO_ATTEMPTS`. */
    attempts?: number;
    /** First backoff in ms; doubled each attempt, capped at `BACKOFF_CEILING_MS`. See `DEFAULT_GOTO_INITIAL_BACKOFF_MS`. */
    initialBackoffMs?: number;
    /** Optional selector that MUST appear for the page to count as "real". */
    waitForSelector?: string;
    /** Per-selector wait timeout in ms. See `SutAvailabilityHelper.DEFAULT_SELECTOR_TIMEOUT_MS`. */
    waitForSelectorTimeoutMs?: number;
    /** Human-readable label used in log + error messages. */
    label?: string;
}

export class SutAvailabilityHelper {

    // ─── Companion-object–style constants ──────────────────────────────────────
    // Direct TypeScript analogue of Kotlin's
    //     private companion object { const val NAME = value }
    // All default timeout / retry knobs for the public methods live here so
    // callers tune them in one place instead of scanning method bodies for
    // scattered magic numbers. Same pattern used by ProfileSteps.
    private static readonly DEFAULT_GOTO_ATTEMPTS              = 4;
    private static readonly DEFAULT_GOTO_INITIAL_BACKOFF_MS    = 2_000;
    private static readonly DEFAULT_SELECTOR_TIMEOUT_MS        = 10_000;
    private static readonly DEFAULT_RECOVER_ATTEMPTS           = 4;
    private static readonly DEFAULT_RECOVER_INITIAL_BACKOFF_MS = 2_000;
    private static readonly RECOVER_RELOAD_TIMEOUT_MS          = 30_000;
    /** Exponential-backoff ceiling shared by both retry loops. */
    private static readonly BACKOFF_CEILING_MS                 = 15_000;

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
     * Returns `true` when the page body indicates the AUT is serving its
     * "under heavy load / queue full" interstitial. Uses raw HTML (not title)
     * because that interstitial has no `<title>` — a title-only check would
     * false-negative and burn the full locator timeout.
     */
    static async isHeavyLoadPage(page: Page): Promise<boolean> {
        try {
            const html = await page.content();
            return HEAVY_LOAD_BODY_PATTERNS.some((rx) => rx.test(html));
        } catch {
            return false;
        }
    }

    /**
     * Returns `true` when the page looks like EITHER a Cloudflare challenge OR
     * the AUT's "queue full" overflow page. This is the detection the retry
     * helpers below gate on — callers should prefer it over the individual
     * `isChallengePage` / `isHeavyLoadPage` methods.
     */
    static async isInterstitial(page: Page): Promise<boolean> {
        if (await SutAvailabilityHelper.isChallengePage(page)) return true;
        if (await SutAvailabilityHelper.isHeavyLoadPage(page)) return true;
        return false;
    }

    /**
     * If the current page is an interstitial (Cloudflare or heavy-load),
     * `page.reload()` up to `attempts` times with exponential backoff until a
     * real page comes back. Returns `true` when a reload recovered the page
     * (or `false` when no interstitial was present to begin with).
     *
     * ⚠️  Only safe to call on GET endpoints — a reload after a POST
     * submission would re-submit the form. Call this AFTER any post-redirect
     * has landed on its final GET URL (e.g. `/payment_done` after the payment
     * POST completes), never immediately after clicking a form submit button.
     *
     * Throws on final failure so the error surfaces as "SUT unavailable" and
     * not as a confusing downstream "element not found".
     */
    static async recoverIfInterstitial(
        page: Page,
        opts: { label?: string; attempts?: number; initialBackoffMs?: number } = {},
    ): Promise<boolean> {
        const attempts = opts.attempts ?? SutAvailabilityHelper.DEFAULT_RECOVER_ATTEMPTS;
        const label = opts.label ?? page.url();
        let backoff = opts.initialBackoffMs ?? SutAvailabilityHelper.DEFAULT_RECOVER_INITIAL_BACKOFF_MS;

        if (!(await SutAvailabilityHelper.isInterstitial(page))) return false;

        for (let i = 1; i <= attempts; i++) {
            console.warn(
                `[sut] ${label}: interstitial detected on attempt ${i}/${attempts}. ` +
                `Waiting ${backoff}ms before reloading…`,
            );
            await page.waitForTimeout(backoff);
            try {
                await page.reload({
                    waitUntil: 'domcontentloaded',
                    timeout: SutAvailabilityHelper.RECOVER_RELOAD_TIMEOUT_MS,
                });
            } catch (err) {
                console.warn(
                    `[sut] ${label}: reload failed on attempt ${i}: ` +
                    `${(err as Error).message.split('\n')[0]}`,
                );
            }
            if (!(await SutAvailabilityHelper.isInterstitial(page))) {
                console.log(`[sut] ${label}: interstitial cleared after ${i} reload(s).`);
                return true;
            }
            backoff = Math.min(backoff * 2, SutAvailabilityHelper.BACKOFF_CEILING_MS);
        }

        throw new Error(
            `SUT unavailable (interstitial) — ${label} kept returning the ` +
            `"under heavy load / Cloudflare challenge" page after ${attempts} reload(s). ` +
            `This is an upstream issue with automationexercise.com; retry when the ` +
            `site drops out of overflow/under-attack mode.`,
        );
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
        const attempts = opts.attempts ?? SutAvailabilityHelper.DEFAULT_GOTO_ATTEMPTS;
        const label = opts.label ?? path;
        const selectorTimeout = opts.waitForSelectorTimeoutMs ?? SutAvailabilityHelper.DEFAULT_SELECTOR_TIMEOUT_MS;
        let backoff = opts.initialBackoffMs ?? SutAvailabilityHelper.DEFAULT_GOTO_INITIAL_BACKOFF_MS;

        for (let i = 1; i <= attempts; i++) {
            await page.goto(path);

            // Detect Cloudflare "One moment, please…" AND the AUT's
            // "under heavy load (queue full)" interstitial — the latter has
            // no <title> so title-only detection was missing it in CI.
            if (await SutAvailabilityHelper.isInterstitial(page)) {
                console.warn(
                    `[sut] ${label}: interstitial on attempt ${i}/${attempts}. ` +
                    `Backing off ${backoff}ms before retrying…`,
                );
                await page.waitForTimeout(backoff);
                backoff = Math.min(backoff * 2, SutAvailabilityHelper.BACKOFF_CEILING_MS);
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
                    backoff = Math.min(backoff * 2, SutAvailabilityHelper.BACKOFF_CEILING_MS);
                    continue;
                }
            }

            return;
        }

        throw new Error(
            `SUT unavailable (interstitial) — ${label} returned a Cloudflare ` +
            `"One moment, please…" or "under heavy load (queue full)" page on all ` +
            `${attempts} attempts. This is an upstream issue with automationexercise.com; ` +
            `retry when the site drops out of under-attack / overflow mode.`,
        );
    }
}
