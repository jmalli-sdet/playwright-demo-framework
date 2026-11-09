//
//  P1SettingsTests.spec.ts
//  = P1SettingsTests.kt
//
//  /contact_us form end-to-end including file upload — the most common
//  "shows I can handle file I/O in Playwright" concept.
//

import { test } from '../base/UITestBase';
import * as path from 'path';

test.describe('Contact Us — P1 Smoke', { tag: ['@P1', '@smoke', '@settings'] }, () => {

    test('P1 | CONTACT | Submits contact form with file attachment',
        async ({ settingSteps }, testInfo) => {
            testInfo.annotations.push(
                { type: 'description', description: 'Fills the contact-us form, attaches a file via setInputFiles, accepts the confirm dialog, and verifies the success alert.' },
                { type: 'jira', description: 'DEMO-901' },
                { type: 'priority', description: 'P1' },
            );

            // A file we know is always present in the repo — use the README.
            const attachment = path.resolve('README.md');

            await settingSteps.open();
            await settingSteps.fillForm({
                name:    'JM Demo',
                email:   'jm-demo-framework-p1@demo.local',
                subject: 'Playwright demo contact submission',
                message: 'This is an automated submission from the Playwright demo framework. Ignore.',
            });
            await settingSteps.attachFile(attachment);
            await settingSteps.acceptDialogAndSubmit();
            await settingSteps.verifySubmissionSuccess();
        });
});
