// = DeeplinkNavigator.kt
import type { Page } from '@playwright/test';

export class DeeplinkNavigator {
    constructor(private readonly page: Page) {}
    async open(path: string) { await this.page.goto(path); }
}
