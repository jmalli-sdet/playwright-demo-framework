// = ui/networkrewriter/ in Nike — wraps page.route() so feature specs can
// rewrite responses without knowing Playwright plumbing.
import type { BrowserContext } from '@playwright/test';

export class NetworkRewriter {
    constructor(private readonly context: BrowserContext) {}
    // TODO: mock(request) / rewrite(url, body) / etc.
}
