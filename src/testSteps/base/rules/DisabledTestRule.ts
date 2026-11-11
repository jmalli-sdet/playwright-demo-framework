//
//  DisabledTestRule.ts
//  = DisabledTestRule.kt + @Disabled annotation
//
//  Skips tests tagged @disabled or @fixme — mirrors the reference suite's DisabledTestRule
//  which honors the @Disabled annotation on test methods.
//

import type { TestInfo } from '@playwright/test';
import { test } from '@playwright/test';

export function applyDisabledTestRule(testInfo: TestInfo): void {
    const tags = testInfo.tags; // Playwright exposes @tags from describe/test titles
    if (tags.includes('@disabled')) {
        test.skip(true, 'Tagged @disabled');
    }
    if (tags.includes('@fixme')) {
        test.fixme(true, 'Tagged @fixme — awaiting fix');
    }
}
