//
//  Description.ts
//  = Description.kt
//
//  In the reference suite:
//      @Retention(RUNTIME) @Target(FUNCTION)
//      annotation class Description(val testDescription: String)
//
//  Playwright exposes `testInfo.annotations[]` which custom reporters can read.
//  This helper centralises the "shape" so every spec adds descriptions the same way.
//

import type { TestInfo } from '@playwright/test';

export function Description(testInfo: TestInfo, description: string): void {
    testInfo.annotations.push({ type: 'description', description });
}
