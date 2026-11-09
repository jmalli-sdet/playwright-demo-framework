//
//  PdpConfigurationRule.ts
//  = PdpConfigurationRule.kt
//
//  Per-test environment tweaks: here we enable JS console forwarding so
//  console.error / console.warn from the SUT surface in test output.
//

import type { Page } from '@playwright/test';

export function applyPdpConfigurationRule(page: Page): void {
    page.on('console', (msg) => {
        if (msg.type() === 'error' || msg.type() === 'warning') {
            // Prefix so it's easy to grep in CI logs.
            console.log(`[SUT ${msg.type()}] ${msg.text()}`);
        }
    });
}
