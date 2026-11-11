//
//  RetryTestRule.ts
//  = RetryTestRule.kt (retryCount = 2 by default)
//
//  Playwright's retry mechanism is configured at playwright.config.ts level
//  (`retries: 2`). This helper lets a *single* test opt into a different
//  retry count, mirroring the reference suite's per-test retry override.
//
//  Usage:
//    import { withRetries } from '../../testSteps/base/rules/RetryTestRule';
//    test.describe('my flaky area', () => {
//        withRetries(3);
//        test('...', async ({ page }) => { ... });
//    });
//

import { test } from '@playwright/test';

export function withRetries(count: number): void {
    test.describe.configure({ retries: count });
}
