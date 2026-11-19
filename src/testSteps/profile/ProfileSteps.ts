//
//  ProfileSteps.ts
//  = ProfileSteps.kt
//
//  Logged-in-state assertions + logout flow.
//

import { expect, type Page, type Locator } from '@playwright/test';
import { test } from '@playwright/test';
import { SutAvailabilityHelper } from '../../utils/helpers/SutAvailabilityHelper';

export class ProfileSteps {

    // ─── Companion-object–style constants ──────────────────────────────────────
    // Direct TypeScript analogue of Kotlin's
    //     private companion object { const val NAME = value }
    // — `static readonly` members are class-scoped (not per-instance), fixed at
    // declaration, and accessed as `ProfileSteps.NAME`. We collect the recovery
    // policy knobs here so they're tunable from one place instead of being
    // sprinkled through `ensureLoggedInAs`.
    private static readonly RECOVERY_ATTEMPTS           = 2;
    private static readonly RECOVERY_BACKOFF_BASE_MS    = 1_000;
    private static readonly RECOVERY_BACKOFF_JITTER_MS  = 1_500;
    private static readonly BANNER_FAST_PATH_TIMEOUT_MS = 7_500;
    private static readonly BANNER_VISIBLE_TIMEOUT_MS   = 10_000;
    private static readonly INPUT_VISIBLE_TIMEOUT_MS    = 10_000;
    private static readonly NETWORK_IDLE_TIMEOUT_MS     = 10_000;
    private static readonly LOGIN_GOTO_ATTEMPTS         = 3;
    private static readonly LOGIN_GOTO_BACKOFF_MS       = 1_500;
    // goToHome is challenge-aware too — the home page can be served as the
    // Cloudflare / "queue full" interstitial under parallel load, which
    // otherwise cascades into a misleading "Logged in as" element-not-found.
    private static readonly HOME_GOTO_ATTEMPTS          = 4;
    private static readonly HOME_GOTO_BACKOFF_MS        = 1_500;

    private readonly loggedInBanner: Locator;
    private readonly logoutLink:     Locator;
    private readonly accountDeletedHeading: Locator;

    constructor(private readonly page: Page) {
        this.loggedInBanner         = this.page.getByText(/Logged in as/i);
        this.logoutLink             = this.page.getByRole('link', { name: /logout/i });
        this.accountDeletedHeading  = this.page.getByRole('heading', { name: /account deleted/i });
    }

    async goToHome(): Promise<void> {
        await test.step('Open /', async () => {
            // Route through the challenge-aware helper so a Cloudflare
            // interstitial or the AUT's "under heavy load (queue full)" page
            // triggers a backoff + retry instead of silently loading a page
            // without the "Logged in as" banner and failing downstream
            // assertions with a misleading "element not found".
            await SutAvailabilityHelper.gotoWithChallengeRetry(this.page, '/', {
                attempts: ProfileSteps.HOME_GOTO_ATTEMPTS,
                initialBackoffMs: ProfileSteps.HOME_GOTO_BACKOFF_MS,
                label: 'ProfileSteps.goToHome → /',
            });
        });
    }

    async verifyLoggedInAs(expectedName: string): Promise<void> {
        await test.step(`Verify "Logged in as ${expectedName}"`, async () => {
            await expect(this.loggedInBanner).toBeVisible({ timeout: 15_000 });
            await expect(this.loggedInBanner).toContainText(expectedName);
        });
    }

    /**
     * Like `verifyLoggedInAs`, but tolerates the AUT occasionally dropping the
     * shared `storageState` session (automationexercise.com rotates sessions
     * when multiple parallel CI workers hit the same account in a short window).
     *
     * Fast path: if the banner is already visible, this is identical to
     * `verifyLoggedInAs` and adds ~0 overhead.
     *
     * Slow path (re-login): hardened against the two races that bit CI:
     *   • `locator.click()` returns as soon as the pointer event dispatches,
     *     it does NOT await the resulting navigation. The previous
     *     implementation followed the click with a bare `page.goto('/')`
     *     which aborted the in-flight login POST — the following page load
     *     was unauthenticated and the banner never appeared. We now couple
     *     the click to `waitForLoadState('domcontentloaded')` so the POST
     *     completes before we assert anything.
     *   • `/login` is occasionally served as a Cloudflare interstitial under
     *     parallel CI load; the raw `page.goto` then silently detaches the
     *     login-email locator. We route the navigation through
     *     `SutAvailabilityHelper.gotoWithChallengeRetry` — the same guard the
     *     setup project uses — so the challenge is retried explicitly.
     *
     * We retry the full recovery up to 2× with jittered backoff so that a
     * single flaked login POST under parallel load can self-heal. If the
     * recovery still can't succeed, the final outer assertion fails loudly —
     * we never silently pass a genuinely logged-out state.
     */
    async ensureLoggedInAs(
        expectedName: string,
        creds: { email: string; password: string },
    ): Promise<void> {
        await test.step(`Ensure logged in as "${expectedName}"`, async () => {
            const banner = this.loggedInBanner;

            // Fast path — banner already there (storageState session still valid).
            const bannerAlreadyVisible = await banner
                .waitFor({ state: 'visible', timeout: ProfileSteps.BANNER_FAST_PATH_TIMEOUT_MS })
                .then(() => true)
                .catch(() => false);

            if (!bannerAlreadyVisible) {
                for (let attempt = 1; attempt <= ProfileSteps.RECOVERY_ATTEMPTS; attempt++) {
                    const recovered = await test.step(
                        `Session stale — UI re-login (attempt ${attempt}/${ProfileSteps.RECOVERY_ATTEMPTS})`,
                        async () => {
                            try {
                                await SutAvailabilityHelper.gotoWithChallengeRetry(
                                    this.page,
                                    '/login',
                                    {
                                        attempts: ProfileSteps.LOGIN_GOTO_ATTEMPTS,
                                        initialBackoffMs: ProfileSteps.LOGIN_GOTO_BACKOFF_MS,
                                        waitForSelector: '[data-qa="login-email"]',
                                        label: `ensureLoggedInAs → /login (attempt ${attempt})`,
                                    },
                                );

                                // Wait for the email input to be actionable, not
                                // just present in the DOM — closes the window
                                // where a Cloudflare refresh would detach it.
                                const emailInput = this.page.getByTestId('login-email');
                                await emailInput.waitFor({
                                    state: 'visible',
                                    timeout: ProfileSteps.INPUT_VISIBLE_TIMEOUT_MS,
                                });

                                await emailInput.fill(creds.email);
                                await this.page.getByTestId('login-password').fill(creds.password);

                                // Couple click → navigation so the login POST
                                // completes before we assert on the result.
                                // (Replaces the old bare `goto('/')` which was
                                // aborting the in-flight POST.)
                                await Promise.all([
                                    this.page.waitForLoadState('domcontentloaded'),
                                    this.page.getByTestId('login-button').click(),
                                ]);
                                await this.page
                                    .waitForLoadState('networkidle', {
                                        timeout: ProfileSteps.NETWORK_IDLE_TIMEOUT_MS,
                                    })
                                    .catch(() => undefined);

                                // Verify this recovery attempt actually logged
                                // us in. If it didn't, we loop and try again.
                                await expect(banner).toBeVisible({
                                    timeout: ProfileSteps.BANNER_VISIBLE_TIMEOUT_MS,
                                });
                                return true;
                            } catch (err) {
                                console.warn(
                                    `[ProfileSteps] re-login attempt ${attempt}/${ProfileSteps.RECOVERY_ATTEMPTS} ` +
                                    `failed: ${(err as Error).message.split('\n')[0]}`,
                                );
                                return false;
                            }
                        },
                    );
                    if (recovered) break;
                    if (attempt < ProfileSteps.RECOVERY_ATTEMPTS) {
                        // Jittered backoff — keeps parallel workers from retrying in lockstep.
                        await this.page.waitForTimeout(
                            ProfileSteps.RECOVERY_BACKOFF_BASE_MS
                                + Math.floor(Math.random() * ProfileSteps.RECOVERY_BACKOFF_JITTER_MS),
                        );
                    }
                }
            }

            await expect(banner).toBeVisible({ timeout: ProfileSteps.BANNER_VISIBLE_TIMEOUT_MS });
            await expect(banner).toContainText(expectedName);
        });
    }

    async logout(): Promise<void> {
        await test.step('Click Logout', async () => {
            await this.logoutLink.click();
            await expect(this.page).toHaveURL(/\/login$/);
        });
    }

    async verifyOnLoginPage(): Promise<void> {
        await test.step('Verify on login page after logout', async () => {
            await expect(this.page.getByRole('heading', { name: /login to your account/i })).toBeVisible();
        });
    }
}
