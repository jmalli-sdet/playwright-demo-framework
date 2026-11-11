//
//  en_US.ts  = en_US.kt
//
//  reference per-locale annotation that filters tests into an en-US run.
//  In Playwright the equivalent is the `--project=chromium-en-US` selector
//  combined with a tag. Usage mirrors the reference suite's `@en_US` at the test level:
//
//      test.describe('…', { tag: [enUS] }, () => { … });
//

export const enUS = '@en_US';
