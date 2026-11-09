//
//  SettingSteps.ts
//  = SettingSteps.kt + the Contact-Us flow
//
//  Covers the /contact_us form, including file upload via setInputFiles —
//  the direct equivalent of Nike's GalleryIntentComposer.kt gallery picker.
//

import { expect, type Page, type Locator } from '@playwright/test';
import { test } from '@playwright/test';

export class SettingSteps {

    private readonly nameInput:     Locator;
    private readonly emailInput:    Locator;
    private readonly subjectInput:  Locator;
    private readonly messageInput:  Locator;
    private readonly fileInput:     Locator;
    private readonly submitButton:  Locator;
    private readonly successAlert:  Locator;
    private readonly contactHeader: Locator;

    constructor(private readonly page: Page) {
        this.nameInput     = page.getByTestId('name');
        this.emailInput    = page.getByTestId('email');
        this.subjectInput  = page.getByTestId('subject');
        this.messageInput  = page.getByTestId('message');
        this.fileInput     = page.locator('input[name="upload_file"]');
        this.submitButton  = page.getByTestId('submit-button');
        this.successAlert  = page.locator('.status.alert.alert-success');
        this.contactHeader = page.getByRole('heading', { name: /get in touch/i });
    }

    async open(): Promise<void> {
        await test.step('Open /contact_us', async () => {
            await this.page.goto('/contact_us');
            await expect(this.contactHeader).toBeVisible();
        });
    }

    async fillForm(d: { name: string; email: string; subject: string; message: string }): Promise<void> {
        await test.step('Fill contact-us form', async () => {
            await this.nameInput.fill(d.name);
            await this.emailInput.fill(d.email);
            await this.subjectInput.fill(d.subject);
            await this.messageInput.fill(d.message);
        });
    }

    /** File upload via setInputFiles — the key Playwright pattern here. */
    async attachFile(absolutePath: string): Promise<void> {
        await test.step(`Attach file ${absolutePath}`, async () => {
            await this.fileInput.setInputFiles(absolutePath);
            // The form shows the chosen file name next to the input.
            await expect(this.fileInput).toHaveJSProperty('files.0.name', absolutePath.split('/').pop());
        });
    }

    async acceptDialogAndSubmit(): Promise<void> {
        await test.step('Accept confirm dialog + submit the form', async () => {
            this.page.once('dialog', (dialog) => {
                void dialog.accept();
            });
            await this.submitButton.click();
        });
    }

    async verifySubmissionSuccess(): Promise<void> {
        await test.step('Verify submission success banner', async () => {
            await expect(this.successAlert).toContainText(/success.*submitted/i);
        });
    }
}
