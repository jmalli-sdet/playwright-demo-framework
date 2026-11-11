//
//  ExpectExtensions.ts
//  Custom matchers (= TaggedAssert in reference).
//
//  Imported once in playwright.config.ts to make the matchers available
//  globally. Usage:
//
//      import { expect } from '../../testSteps/base/UITestBase';
//      await expect(page.locator('.price').first()).toHaveCurrencyFormat('Rs.');
//
//  Demonstrates Playwright's `expect.extend()` API.
//

import { expect, type Locator } from '@playwright/test';

export const registerCustomMatchers = (): void => {
    expect.extend({

        /**
         * Asserts the element's text matches a price pattern like "Rs. 500",
         * "$19.99", "£100.00" etc. with the given currency prefix.
         */
        async toHaveCurrencyFormat(received: Locator, currencyPrefix: string) {
            const actual = (await received.textContent()) ?? '';
            const rx = new RegExp(`^\\s*${escape(currencyPrefix)}\\s?\\d{1,3}(?:[,.]\\d{3})*(?:[.,]\\d{2})?\\s*$`);
            const pass = rx.test(actual.trim());
            return {
                pass,
                message: () => pass
                    ? `Expected "${actual}" NOT to match currency format with prefix "${currencyPrefix}"`
                    : `Expected "${actual}" to match currency format with prefix "${currencyPrefix}" (regex: ${rx})`,
            };
        },
    });
};

function escape(s: string): string {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Augment the global expect types so TypeScript recognises our matcher.
// Playwright plugs custom matchers into the global PlaywrightTest.Matchers<R, T>
// namespace — this mirrors the generated `// --- BEGINGLOBAL ---` block in
// node_modules/playwright/types/test.d.ts.
declare global {
    namespace PlaywrightTest {
        interface Matchers<R, T> {
            toHaveCurrencyFormat(currencyPrefix: string): Promise<R>;
        }
    }
}

export {}; // ensure this file is treated as a module so `declare global` works
