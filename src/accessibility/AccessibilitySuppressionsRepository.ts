//
//  AccessibilitySuppressionsRepository.ts
//  = Nike's equivalent registry of allow-listed a11y rule violations.
//
//  automationexercise.com is a demo site and has many pre-existing WCAG
//  violations. We suppress the known offenders here so our scan surfaces only
//  *new* regressions that the demo team would own.
//

export interface AccessibilitySuppression {
    ruleId: string;
    reason: string;
    jira?: string;
}

export const ACCESSIBILITY_SUPPRESSIONS: AccessibilitySuppression[] = [
    { ruleId: 'color-contrast',                reason: 'AUT uses low-contrast text throughout; tracked as design debt.' },
    { ruleId: 'region',                        reason: 'AUT lacks landmarks on <main>; design-team ticket pending.' },
    { ruleId: 'landmark-one-main',             reason: 'AUT has no <main> element.' },
    { ruleId: 'page-has-heading-one',          reason: 'AUT home lacks a single H1.' },
    { ruleId: 'image-alt',                     reason: 'AUT has decorative images without alt; allowed per design.' },
    { ruleId: 'link-name',                     reason: 'Icon-only social links on footer have no accessible name.' },
    { ruleId: 'html-has-lang',                 reason: 'AUT markup lacks lang attribute.' },
    { ruleId: 'html-lang-valid',               reason: 'AUT lang attribute is non-standard.' },
    { ruleId: 'document-title',                reason: 'AUT page titles are duplicated across pages.' },
    { ruleId: 'meta-viewport',                 reason: 'AUT has user-scalable=no on viewport meta.' },
    { ruleId: 'bypass',                        reason: 'AUT lacks skip-to-main-content link.' },
    { ruleId: 'nested-interactive',            reason: 'AUT wraps clickable cards inside anchors.' },
    { ruleId: 'aria-allowed-attr',             reason: 'AUT uses aria attrs on roles that disallow them.' },
    { ruleId: 'label',                         reason: 'AUT search box lacks an associated <label>.' },
    { ruleId: 'select-name',                   reason: 'AUT has unlabelled <select> elements.' },
    { ruleId: 'form-field-multiple-labels',    reason: 'AUT signup form has duplicate labels.' },
    { ruleId: 'duplicate-id-aria',             reason: 'AUT has duplicate IDs referenced by aria-*.' },
    { ruleId: 'duplicate-id-active',           reason: 'AUT has duplicate IDs on interactive elements.' },
    { ruleId: 'listitem',                      reason: 'AUT puts non-<li> inside <ul>.' },
    { ruleId: 'list',                          reason: 'AUT <ul> lacks direct <li> children in a few spots.' },
    { ruleId: 'heading-order',                 reason: 'AUT skips heading levels.' },
    { ruleId: 'scrollable-region-focusable',   reason: 'AUT has scrollable regions without tabindex.' },
    { ruleId: 'aria-hidden-focus',             reason: 'AUT hides nav items from AT while keeping them focusable.' },
    { ruleId: 'button-name',                   reason: 'AUT footer subscribe button is icon-only (no aria-label); known legacy issue.' },
];
