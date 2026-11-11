//
//  Disabled.ts
//  = Disabled.kt
//
//  reference: @Disabled("JIRA-1234 regression") → DisabledTestRule honors it.
//  Here: add `@disabled` to the test tag list in test.describe or call this helper.
//

import { test } from '@playwright/test';

export function Disabled(reason: string): void {
    test.skip(true, `@Disabled — ${reason}`);
}
