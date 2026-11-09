//
//  en_US.ts  = en_US.kt
//
//  Nike per-locale annotation that filters tests into an en-US run.
//  In Playwright the equivalent is the `--project=chromium-en-US` selector
//  combined with a tag. Usage mirrors Nike's `@en_US` at the test level:
//
//      test.describe('…', { tag: [enUS] }, () => { … });
//

export const enUS = '@en_US';
