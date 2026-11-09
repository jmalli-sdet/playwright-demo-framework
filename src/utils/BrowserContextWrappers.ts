// = InstrumentationRegistryWrappers.kt — convenience wrappers around context ops.
import type { BrowserContext } from '@playwright/test';

export class BrowserContextWrappers {
    constructor(private readonly context: BrowserContext) {}
}
