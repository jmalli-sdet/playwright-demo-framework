//
//  ClockHelper.ts
//  Wrapper on Playwright's page.clock API for tests that assert on time-dependent UI.
//

import type { Page } from '@playwright/test';

export class ClockHelper {

    /** Freeze the browser's clock at a specific moment. */
    static async freezeAt(page: Page, isoDate: string): Promise<void> {
        await page.clock.install({ time: new Date(isoDate) });
    }

    /** Advance the frozen clock by `ms` milliseconds without waiting in real time. */
    static async advance(page: Page, ms: number): Promise<void> {
        await page.clock.fastForward(ms);
    }

    /** Resume real-time progression. */
    static async resume(page: Page): Promise<void> {
        await page.clock.resume();
    }

    /** Pause the clock at its current moment. */
    static async pause(page: Page): Promise<void> {
        await page.clock.pauseAt(new Date());
    }
}
