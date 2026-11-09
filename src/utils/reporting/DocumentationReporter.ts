//
//  DocumentationReporter.ts
//  = DocumentationReportHelper.kt
//
//  Custom Playwright Reporter. Reads testInfo.annotations collected via
//  src/utils/annotations/{Description,Documentation}.ts and emits:
//
//    1. A Markdown traceability matrix at reports/traceability-matrix.md
//       with one row per test: file | test | priority | status | duration | Jira link
//    2. A short summary to stdout at the end of the run.
//
//  Register in playwright.config.ts:
//    reporter: [ ..., ['./src/utils/reporting/DocumentationReporter.ts'] ]
//

import type {
    Reporter,
    TestCase,
    TestResult,
    FullResult,
} from '@playwright/test/reporter';
import * as fs from 'fs';
import * as path from 'path';

interface Row {
    file: string;
    title: string;
    priority: string;
    jira: string[];
    description: string;
    status: string;
    duration: number;
    project: string;
}

export default class DocumentationReporter implements Reporter {

    private rows: Row[] = [];

    onTestEnd(test: TestCase, result: TestResult): void {
        const anno = test.annotations ?? [];
        const jira = anno.filter((a) => a.type === 'jira').map((a) => a.description ?? '');
        const priority = anno.find((a) => a.type === 'priority')?.description ?? '—';
        const description = anno.find((a) => a.type === 'description')?.description ?? '';
        const tags = (test.tags ?? []).join(' ');

        this.rows.push({
            file: path.relative(process.cwd(), test.location.file),
            title: `${test.title}${tags ? `  _(${tags})_` : ''}`,
            priority,
            jira,
            description,
            status: statusEmoji(result.status),
            duration: result.duration,
            project: (test.parent as unknown as { project?: () => { name: string } }).project?.()?.name ?? '—',
        });
    }

    async onEnd(result: FullResult): Promise<void> {
        const out = path.resolve('reports/traceability-matrix.md');
        fs.mkdirSync(path.dirname(out), { recursive: true });

        const lines: string[] = [];
        lines.push('# Traceability Matrix');
        lines.push('');
        lines.push(`_Generated ${new Date().toISOString()} — overall status: **${result.status}**_`);
        lines.push('');
        lines.push('| Status | Priority | Project | Test | Jira | File | Duration |');
        lines.push('|---|---|---|---|---|---|---|');

        for (const r of this.rows) {
            const jiraCell = r.jira.length
                ? r.jira.map((j) => `[${j}](https://jira.example.com/browse/${j})`).join(', ')
                : '—';
            lines.push([
                r.status,
                r.priority,
                r.project,
                r.title.replace(/\|/g, '\\|'),
                jiraCell,
                `\`${r.file}\``,
                `${r.duration} ms`,
            ].join(' | ') + ' |');
        }

        const totals = this.rows.reduce<Record<string, number>>((acc, r) => {
            acc[r.status] = (acc[r.status] ?? 0) + 1; return acc;
        }, {});
        lines.push('');
        lines.push('## Totals');
        lines.push('');
        for (const [s, n] of Object.entries(totals)) {
            lines.push(`- ${s}  **${n}**`);
        }

        fs.writeFileSync(out, lines.join('\n'));

        console.log('');
        console.log(`[DocumentationReporter] Traceability matrix → ${out}`);
        console.log(`[DocumentationReporter] ${this.rows.length} tests recorded (${JSON.stringify(totals)})`);
    }

    printsToStdio(): boolean {
        return false;
    }
}

function statusEmoji(s: string): string {
    switch (s) {
        case 'passed':      return '✅ passed';
        case 'failed':      return '❌ failed';
        case 'timedOut':    return '⏱ timed out';
        case 'skipped':     return '⏭ skipped';
        case 'interrupted': return '⚠️ interrupted';
        default:            return s;
    }
}
