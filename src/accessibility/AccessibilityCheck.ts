//
//  AccessibilityCheck.ts
//  = accessibility/ in Nike (Espresso's AccessibilityChecks)
//
//  Wrapper over @axe-core/playwright. Call from inside a test:
//
//      await runAccessibilityScan(page, { name: 'login-page' });
//
//  Results attach to the test report as an a11y-<name>.json file so failures
//  are triagable without re-running. Known violations live in
//  AccessibilitySuppressionsRepository.ts and are filtered out.
//

import type { Page, TestInfo } from '@playwright/test';
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { ACCESSIBILITY_SUPPRESSIONS } from './AccessibilitySuppressionsRepository';

export interface A11yOptions {
    /** Short slug used in attachment name. */
    name: string;
    /** WCAG + axe tags to include. Default: wcag2a + wcag2aa. */
    tags?: string[];
    /** Rule IDs to additionally disable on top of the suppression repository. */
    disableRules?: string[];
    /** If true, test fails on any non-suppressed violation. Default true. */
    hardFail?: boolean;
}

export async function runAccessibilityScan(
    page: Page,
    opts: A11yOptions,
): Promise<void> {
    await test.step(`Accessibility scan: ${opts.name}`, async () => {
        const testInfo: TestInfo = test.info();

        const builder = new AxeBuilder({ page })
            .withTags(opts.tags ?? ['wcag2a', 'wcag2aa']);

        const suppressedIds = [
            ...ACCESSIBILITY_SUPPRESSIONS.map((s) => s.ruleId),
            ...(opts.disableRules ?? []),
        ];
        if (suppressedIds.length) builder.disableRules(suppressedIds);

        const results = await builder.analyze();

        await testInfo.attach(`a11y-${opts.name}.json`, {
            body: Buffer.from(JSON.stringify(results.violations, null, 2), 'utf-8'),
            contentType: 'application/json',
        });

        if ((opts.hardFail ?? true) && results.violations.length > 0) {
            const summary = results.violations
                .map((v) => `  - ${v.id} (${v.impact}): ${v.nodes.length} node(s) — ${v.help}`)
                .join('\n');
            expect.soft(
                results.violations,
                `Accessibility violations on "${opts.name}":\n${summary}`,
            ).toHaveLength(0);
        }
    });
}
