//
//  Documentation.ts
//  = Documentation.kt
//
//  In the reference suite:
//      @Documentation(["https://jira.example.com/browse/ATF-3553",
//                      "https://jira.example.com/browse/FAQE-1163"])
//
//  Here we add one `jira` annotation per link so custom reporters
//  (DocumentationReporter.ts in Evening 3) can emit a traceability matrix.
//

import type { TestInfo } from '@playwright/test';

export function Documentation(testInfo: TestInfo, ...jiraLinks: string[]): void {
    for (const link of jiraLinks) {
        testInfo.annotations.push({ type: 'jira', description: link });
    }
}
