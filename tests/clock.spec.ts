//
//  clock.spec.ts
//
//  Demonstrates page.clock — freeze + fast-forward + resume. Used in
//  production tests to validate time-sensitive UI (promo countdowns, token
//  expiry warnings, scheduled flags) without actually waiting.
//

import { test, expect } from '@playwright/test';
import { ClockHelper } from '../src/utils/helpers/ClockHelper';

test.describe('Clock mocking — @P2 @clock', { tag: ['@P2', '@regression', '@clock'] }, () => {

    test('P2 | CLOCK | Install clock → Date.now reads the frozen moment',
        async ({ page }, testInfo) => {
            testInfo.annotations.push(
                { type: 'description', description: 'page.clock.install freezes the browser clock so time-dependent code sees a deterministic moment.' },
                { type: 'jira', description: 'DEMO-1201' },
                { type: 'priority', description: 'P2' },
            );

            await ClockHelper.freezeAt(page, '2026-01-15T10:00:00Z');
            await page.goto('/');

            const browserNow = await page.evaluate(() => new Date().toISOString());
            expect(browserNow.startsWith('2026-01-15T10:00')).toBeTruthy();
        });

    test('P2 | CLOCK | fastForward advances the frozen clock instantly',
        async ({ page }, testInfo) => {
            testInfo.annotations.push(
                { type: 'description', description: 'page.clock.fastForward advances time without a real-world wait.' },
                { type: 'jira', description: 'DEMO-1202' },
                { type: 'priority', description: 'P2' },
            );

            await ClockHelper.freezeAt(page, '2026-01-15T10:00:00Z');
            await page.goto('/');
            await ClockHelper.advance(page, 60 * 60 * 1000); // +1 hour

            const browserNow = await page.evaluate(() => new Date().toISOString());
            expect(browserNow.startsWith('2026-01-15T11:00')).toBeTruthy();
        });
});
