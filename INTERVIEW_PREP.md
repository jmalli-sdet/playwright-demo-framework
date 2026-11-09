# Interview Preparation — Playwright Demo Framework

> A plain-language reference you can study the night before an interview.
> Every concept is explained the way you'd explain it to a friend who's
> never seen Playwright, and then shows exactly where we use it in this
> repo so you can point to real code on the whiteboard.

---

## Table of contents

1. [Framework Architecture](#part-1--framework-architecture)
2. [All Playwright Concepts (definition + where we use it)](#part-2--all-playwright-concepts)
3. [CI Pipeline Deep-Dive](#part-3--ci-pipeline-deep-dive)

---

# PART 1 — Framework Architecture

## 1.1  The 30-second pitch

> *"It's a Playwright + TypeScript UI-and-API automation framework whose folder
> structure and base-class design mirror the Nike App Android automation
> framework, so I can walk from one job to the other without mental overhead.
> It targets `automationexercise.com`, runs on 4 browser/locale projects,
> shards across GitHub Actions, produces an HTML report plus a custom
> Markdown traceability matrix, and ships with Docker, Allure, and a Slack
> hook."*

That one paragraph is your opening. The rest of this document is the detail
to back it up.

## 1.2  Why we mirror Nike's Android automation

Nike's Android automation is built on **UITestBase.kt + RuleChain**:

```
UITestBase.kt
   @Rule chain = RuleChain
       .outerRule(UncaughtExceptionRule)
       .around(TestWatcherRule)
       .around(DisabledTestRule)
       .around(PdpConfigurationRule)
       .around(NotificationsRule)
       .around(BotProtectionHeaderRule)
```

Every test extends `UITestBase`, inherits the rule chain, and gets a set of
`*Steps` page-object classes (`checkoutSteps`, `loginSteps`, …).

**Playwright doesn't have JUnit `@Rule`,** but it has something equally
powerful: **fixtures**. A fixture is a bit of setup/teardown code the test
runner wires into every test. We compose fixtures in the exact same order
as Nike's RuleChain so the mental model carries over 1:1.

The payoff is huge in an interview:
- *"Here's `UITestBase.ts` — same filename, same job, same ordering as the
  Kotlin one. The difference is RuleChain is replaced by `test.extend()`
  because that's the idiomatic Playwright way."*
- You can speak fluently about either stack.

## 1.3  Folder tour — "what lives where and why"

```
playwright-demo-framework/
├── playwright.config.ts            ← Project matrix, reporters, timeouts
├── tests/                          ← Setup + cross-cutting specs
│   ├── global.setup.ts             ← Runs ONCE: bootstraps demo user via REST
│   ├── auth.setup.ts               ← Setup project: UI-logs-in and saves cookies
│   ├── clock.spec.ts               ← Standalone spec for page.clock
│   └── api/                        ← Pure API specs (no browser)
│       ├── health.api.spec.ts
│       └── response-stub.spec.ts
│
├── src/
│   ├── testSteps/                  ← One folder PER feature area (= Nike pattern)
│   │   ├── base/
│   │   │   ├── UITestBase.ts       ← Our fixture composition (= Nike UITestBase.kt)
│   │   │   └── rules/              ← Each rule mirrors a Nike @Rule
│   │   │       ├── UncaughtExceptionRule.ts
│   │   │       ├── TestWatcherRule.ts
│   │   │       ├── DisabledTestRule.ts
│   │   │       ├── PdpConfigurationRule.ts
│   │   │       ├── NotificationsRule.ts
│   │   │       ├── BotProtectionHeaderRule.ts
│   │   │       └── RetryTestRule.ts
│   │   │
│   │   ├── login/                  ← Feature area "Login"
│   │   │   ├── LoginSteps.ts       ← Page object = Nike LoginSteps.kt
│   │   │   ├── P1LoginTests.spec.ts   ← Smoke priority
│   │   │   └── P2LoginTests.spec.ts   ← Regression priority
│   │   │
│   │   ├── search/                 ← Same 3-file pattern, one per area
│   │   ├── productDetail/
│   │   ├── checkout/
│   │   ├── profile/
│   │   ├── navigation/
│   │   ├── memberHome/
│   │   ├── shopHome/
│   │   ├── favorites/
│   │   ├── onboarding/
│   │   ├── deeplinking/
│   │   ├── settings/
│   │   ├── preReceipt/
│   │   └── userLocaleConfiguration/
│   │
│   ├── testSuites/                 ← Logical grouping (optional, like Nike's suites)
│   │   └── P1SmokeTestsSuite.ts
│   │
│   ├── resources/                  ← Test data + env + strings (= Nike resources/)
│   │   ├── TestData.ts             ← Central test-data store
│   │   ├── TestAccount.ts
│   │   ├── AuthState.ts            ← Path constant for storageState file
│   │   └── env/, strings/
│   │
│   ├── utils/
│   │   ├── annotations/            ← @Description, @Documentation (metadata helpers)
│   │   ├── api/
│   │   │   ├── clients/            ← REST clients (= Nike utils/api/clients/)
│   │   │   ├── interfaces/
│   │   │   └── models/
│   │   ├── helpers/
│   │   │   ├── NetworkHelper.ts    ← Block ads, add bot headers
│   │   │   ├── RegionHelper.ts     ← Locale + geo setup
│   │   │   └── ClockHelper.ts      ← Wraps page.clock
│   │   ├── extensions/
│   │   │   └── ExpectExtensions.ts ← Custom matchers (expect.extend)
│   │   └── reporting/
│   │       └── DocumentationReporter.ts   ← Custom Markdown reporter
│   │
│   └── accessibility/              ← Axe wrapper + suppression repo
│       ├── AccessibilityCheck.ts
│       └── AccessibilitySuppressionsRepository.ts
│
├── .github/workflows/              ← CI
│   ├── pr.yml                      ← P1 smoke on every PR
│   ├── nightly.yml                 ← Full P2 regression nightly
│   ├── rc.yml                      ← Full suite on release-candidate tag
│   └── adhoc.yml                   ← Manual trigger with grep + project inputs
│
├── Dockerfile                      ← Runner image mirroring CI
├── .dockerignore
└── docker-compose.yml              ← tests / report / headed services
```

### How to describe this in one sentence

> *"Every feature area is its own folder with a `Steps` class and
> a `P1Tests` + `P2Tests` spec file — exactly the three-file-per-area
> pattern Nike's Android team uses. The base class is one TypeScript file
> composing fixtures in the same order as Nike's RuleChain."*

## 1.4  The RuleChain analogy — how UITestBase.ts actually works

Open [`src/testSteps/base/UITestBase.ts`](./src/testSteps/base/UITestBase.ts).

In plain English, this is what happens when any spec runs:

1. **Playwright gives us a fresh `page`.**
2. **Our fixture wraps that `page`** and applies each "rule" in order:
   - `UncaughtExceptionRule` → catches any unhandled page errors.
   - `DisabledTestRule` → checks the test's tags for `@disabled` and skips if found.
   - `PdpConfigurationRule` → per-test env tweaks (viewport, dark mode, etc.).
   - `NotificationsRule` → auto-dismisses browser notification prompts.
   - `BotProtectionHeaderRule` → adds a bypass header for bot-blocked sites.
3. **`NetworkHelper.blockAds()`** → kills ad/tracking requests so tests are
   faster and more stable.
4. **`setRegion()`** → sets locale/timezone to match the active project.
5. **Hands the `page` to the test.**
6. **After the test:** `TestWatcherRule` runs, grabbing extra screenshots on
   failure (mirrors Nike's `ScreenshotTaker.kt`).

Every page-object class (`LoginSteps`, `CheckoutSteps`, …) is also exposed
as a fixture so tests can just destructure them:

```typescript
test('P1 | CHECKOUT | happy path', async ({ checkoutSteps, profileSteps }) => {
    await profileSteps.verifyLoggedInAs('JM Demo P1');
    await checkoutSteps.proceedToCheckout();
    // ...
});
```

That syntax is doing exactly what `protected val checkoutSteps = CheckoutSteps(composeTestRule)`
does in Nike's Kotlin world — making each `Steps` instance available by
name inside the test body.

## 1.5  How a single test runs — the lifecycle

Picture this sequence when you type `npm run test:p1`:

```
┌─────────────────────────────────────────────────────────────────────────┐
│ 1. Playwright reads playwright.config.ts                                │
│    - loads the 4 projects                                               │
│    - registers reporters (list, html, junit, json, custom)              │
│    - resolves globalSetup → tests/global.setup.ts                       │
└─────────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ 2. globalSetup runs ONCE                                                │
│    - DELETE /api/deleteAccount (clean slate)                            │
│    - POST   /api/createAccount (P1 demo user)                           │
│    - That account is now guaranteed to exist for every spec.            │
└─────────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ 3. "setup" project runs (because other projects list it as dependency)  │
│    - tests/auth.setup.ts opens a browser, UI-logs-in as the P1 user,    │
│      and saves cookies → .auth/user.json                                │
└─────────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ 4. Feature projects (chromium-en-US, webkit-en-US, …) start running.    │
│    For each test:                                                       │
│      a. UITestBase fixture creates the `page` with all rules applied.   │
│      b. test.use({ storageState: AUTH_STATE_FILE }) opts in to the      │
│         saved cookies → test starts LOGGED IN (no manual login steps).  │
│      c. Each test.step() wraps a chunk so the trace reads as a story.   │
│      d. On failure: screenshot, video, trace.zip, and failure-dom.html  │
│         are dropped into test-results/.                                 │
└─────────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ 5. Reporters write their output:                                        │
│    - reports/html/           → interactive HTML dashboard                │
│    - reports/junit.xml       → CI-friendly XML                          │
│    - reports/results.json    → machine-readable JSON                    │
│    - reports/traceability-matrix.md → our custom Markdown table         │
│    - (optional) Slack POST summary if SLACK_WEBHOOK is set              │
└─────────────────────────────────────────────────────────────────────────┘
```

The important thing to say in an interview: **"Each layer solves exactly
one problem — I never cram login into every test, I never hard-code
cookies, I never commit screenshots, and I never leave a dirty account
behind."**

---

# PART 2 — All Playwright Concepts

Each concept below has three parts:

- **What it is** (layman)
- **Where in our project** (clickable file reference)
- **Interview one-liner** (exactly what to say)

They're grouped by theme so you can study in blocks.

---

## Group A — Core runner concepts

### A1. Test runner

**What it is:** Playwright ships with its own test runner (you don't need
Mocha or Jest). It discovers `.spec.ts` files, runs them in parallel across
worker processes, retries on failure, and emits reports.

**Where in our project:** Every file ending in `.spec.ts` under
`src/testSteps/**` and `tests/**` is auto-discovered — configured via:

- `playwright.config.ts` → `testDir: '.'` and `testMatch: [...]`

**Interview one-liner:**
> *"Playwright's own runner. Zero setup — no mocha, no karma, no jasmine —
> and it has parallelism, retries, sharding, and tracing built in."*

### A2. `playwright.config.ts`

**What it is:** The one file that controls the whole framework —
projects, reporters, timeouts, baseURL, retries, globalSetup.

**Where:** [`playwright.config.ts`](./playwright.config.ts)

**Interview one-liner:**
> *"Single source of truth. Everything from browsers to Slack hooks is
> driven from here, so there's never a 'how did this test know to…?'
> moment."*

### A3. Projects (`projects: [...]`)

**What it is:** A project is one named combination of
browser × locale × device × storage. Playwright can run every spec against
every project in parallel.

**In our project** we have 5 projects:

| Project name                 | Purpose                                    |
|------------------------------|--------------------------------------------|
| `setup`                      | Runs auth.setup.ts, writes storageState    |
| `chromium-en-US`             | Desktop Chrome, English US                 |
| `webkit-en-US`               | Desktop Safari, English US (cross-browser) |
| `mobile-chrome-pixel7`       | Pixel 7 device profile                     |
| `chromium-fr-FR`             | French locale (localisation coverage)      |

Each feature project has `dependencies: ['setup']`, which means Playwright
guarantees the setup project finishes first.

**Interview one-liner:**
> *"Projects give us a matrix for free. I run the same spec across Chrome,
> Safari, a mobile Pixel 7, and a French locale by changing one CLI flag."*

### A4. Fixtures (`test.extend`)

**What it is:** A fixture is a helper the test runner creates fresh for
every test. Think of it like dependency injection — you declare what you
need in the test signature and Playwright hands it to you.

**Where:** [`src/testSteps/base/UITestBase.ts`](./src/testSteps/base/UITestBase.ts)
— we extend the base `test` and add every `*Steps` page-object plus our
override of `page` (which runs the rule chain).

**Interview one-liner:**
> *"Fixtures are Playwright's version of dependency injection. Instead of
> `new LoginSteps(page)` in every test, I declare `{ loginSteps }` in the
> test parameters and the fixture builds it for me."*

### A5. `test.use({ ... })` — opt-in per spec/describe

**What it is:** A spec or `describe` block can override fixture values for
itself only.

**Where:** Every spec that requires login has:
```ts
test.use({ storageState: AUTH_STATE_FILE });
```
Every spec that must stay anonymous has:
```ts
test.use({ storageState: { cookies: [], origins: [] } });
```
(see [`P1ShopHomeTests.spec.ts`](./src/testSteps/shopHome/P1ShopHomeTests.spec.ts),
[`P1LocaleConfigTests.spec.ts`](./src/testSteps/userLocaleConfiguration/P1LocaleConfigTests.spec.ts))

**Interview one-liner:**
> *"`test.use` lets a single spec change its browser/storage/locale without
> touching the global config — I use it to opt in to the shared login
> cookies, and to opt out when I need an anonymous session."*

### A6. `test.describe` + `test.describe.configure`

**What it is:** Grouping. `describe` makes the output readable;
`describe.configure` sets group-scoped behaviour (retries, parallel mode).

**Where:** [`P2SearchTests.spec.ts`](./src/testSteps/search/P2SearchTests.spec.ts)
uses `test.describe.configure({ retries: 1 })` because search-result
counts fluctuate on the public AUT.

**Interview one-liner:**
> *"Describe gives me grouping for the HTML report; `describe.configure`
> lets me override retries just for one flaky group without raising the
> global retry count."*

### A7. `test.step()`

**What it is:** Wraps a chunk of a test so the trace viewer and HTML
report show it as a named sub-step. The test still runs linearly — this
is purely for readability.

**Where:** Every `*Steps` class wraps its public methods in `test.step`.
Example: [`CheckoutSteps.ts`](./src/testSteps/checkout/CheckoutSteps.ts).

**Interview one-liner:**
> *"Each `test.step` becomes a collapsible section in the HTML report.
> When something fails at 'Proceed to checkout', I don't have to scroll
> through 100 actions — the failing step is right there."*

### A8. Annotations (`testInfo.annotations`)

**What it is:** Arbitrary key/value metadata attached to a test (Jira ID,
priority, description, reproduction link, etc).

**Where:** Every spec's `testInfo.annotations.push({ type: 'jira', description: 'DEMO-101' })`
— consumed by our [`DocumentationReporter`](./src/utils/reporting/DocumentationReporter.ts)
to produce the traceability matrix.

**Interview one-liner:**
> *"Annotations are how I tie tests back to Jira. The custom reporter
> reads them and emits a Markdown traceability matrix that goes straight
> into the release notes."*

### A9. Tags and `--grep`

**What it is:** Tags like `@P1`, `@smoke`, `@regression` are strings in
the test title (or in `{ tag: [...] }`). `--grep "@P1"` runs only tests
whose title matches.

**Where:** Every spec is tagged `@P1 @smoke` or `@P2 @regression` plus a
feature tag (`@login`, `@checkout`, `@a11y`). NPM scripts:

```json
"test:p1": "playwright test --grep @P1",
"test:smoke": "playwright test --grep @smoke",
```

**Interview one-liner:**
> *"Tags let me slice the suite any way the CI pipeline needs —
> `--grep @P1` on PR, `--grep @P2` nightly, `--grep @a11y` for the
> accessibility channel."*

### A10. `test.skip`, `test.fixme`, `test.fail`, `test.slow`

**What it is:** Lifecycle modifiers.
- `skip` → skip unconditionally
- `fixme` → skip but flag "needs fixing"
- `fail` → test is expected to fail (passes if it fails, fails if it passes)
- `slow` → triples the per-test timeout

**Where:** Placeholder P2 specs use `test.fixme('TODO — add P2 scenarios …')`
so the traceability matrix tracks gaps instead of hiding them.

**Interview one-liner:**
> *"`test.fixme` is better than deleting — it keeps the gap visible in
> every report until someone fills it in."*

---

## Group B — Locators and interactions

### B1. Locators

**What it is:** A locator is a lazy reference to an element — it isn't
looked up until you interact with it. That's how Playwright gets its
auto-waiting magic.

**Where:** Every `*Steps` constructor. Example:

```typescript
this.loggedInBanner = page.getByText(/Logged in as/i);
```

**Interview one-liner:**
> *"Locators are lazy — they don't do a DOM query until action time.
> That's why Playwright auto-waits without me writing a single `sleep`."*

### B2. Role-based selectors (`page.getByRole`)

**What it is:** Find elements the way a screen-reader does — by ARIA role
and accessible name. Resilient to CSS/DOM rewrites.

**Where:** Used throughout — e.g. `page.getByRole('heading', { name: /order placed/i })`
in [`CheckoutSteps.ts`](./src/testSteps/checkout/CheckoutSteps.ts).

**Interview one-liner:**
> *"Role selectors give me accessibility-grade resilience for free —
> changing a CSS class doesn't break my tests."*

### B3. `page.getByTestId` + custom `testIdAttribute`

**What it is:** Finds elements by a dedicated test attribute. By default
Playwright looks for `data-testid`, but we told it to look for `data-qa`.

**Where:** `playwright.config.ts`:
```ts
testIdAttribute: 'data-qa',   // automationexercise.com convention
```

**Interview one-liner:**
> *"automationexercise.com tags inputs with `data-qa` rather than
> `data-testid`. One config flip and `page.getByTestId('name-on-card')`
> just works."*

### B4. Auto-waiting

**What it is:** Every action waits for the element to be visible,
enabled, and stable before acting — no manual `waitForElement`.

**Where:** Everywhere. That's why you don't see a single `sleep()` or
`waitForSelector()` in the project.

**Interview one-liner:**
> *"I've never written `Thread.sleep()` in this framework. Auto-waiting
> means a click is really 'wait until clickable, then click'."*

### B5. Keyboard interactions

**What it is:** `page.keyboard.press`, `locator.fill`, `locator.pressSequentially`.

- `fill` → instantly sets value (good for forms)
- `pressSequentially` → types one key at a time (simulates a real user)

**Where:** [`SearchSteps.ts`](./src/testSteps/search/SearchSteps.ts) uses
`pressSequentially` because the AUT's search box ignores `fill` for its
autocomplete.

**Interview one-liner:**
> *"`fill` is the lazy-fast way; `pressSequentially` triggers keydown
> events one by one for inputs that depend on key handlers."*

### B6. Mouse: click, hover, double-click, long-press, scroll

**What it is:** All methods on a `Locator`. `scrollIntoViewIfNeeded`
is the one you'll quote most often.

**Where:** `ProductDisplaySteps.hoverTileAndOpen()` hovers a product tile
to reveal the "View Product" overlay.

**Interview one-liner:**
> *"Hover-reveal UIs test cleanly because the locator for the overlay
> only becomes visible after the hover — Playwright waits for it
> automatically."*

### B7. File upload — `setInputFiles`

**What it is:** Attach a local file to an `<input type="file">`.

**Where:** [`SettingSteps.ts`](./src/testSteps/settings/SettingSteps.ts)
uploads a fake file on the contact-us form.

**Interview one-liner:**
> *"File upload is `locator.setInputFiles(path)` — no OS dialog
> interaction needed because Playwright sets the input directly."*

### B8. Download handling

**What it is:** Downloads emit a `page.on('download')` event. The API
pattern is `const [download] = await Promise.all([page.waitForEvent('download'), triggerClick()])`.

**Where:** [`CheckoutSteps.downloadInvoice`](./src/testSteps/checkout/CheckoutSteps.ts)
waits for the invoice download and asserts the filename.

**Interview one-liner:**
> *"Playwright gives me a `Download` object — I can read the suggested
> filename, save it anywhere, or read the bytes for assertion. I never
> actually touch the filesystem dialog."*

### B9. Dialog handling (`page.on('dialog')`)

**What it is:** `alert()`, `confirm()`, `prompt()` all emit a `dialog`
event. You attach a listener and call `.accept()` or `.dismiss()`.

**Where:** [`P1DeeplinkTests.spec.ts`](./src/testSteps/deeplinking/P1DeeplinkTests.spec.ts)
— a native `confirm()` scenario.

**Interview one-liner:**
> *"If you don't attach a dialog handler Playwright auto-dismisses it.
> I attach one explicitly so I can assert the message text."*

### B10. Popups / multi-tab (`context.waitForEvent('page')`)

**What it is:** When a link opens in a new tab, the new `Page` is emitted
on the context.

**Where:** Same deeplink spec — `_blank` link produces a second page.

**Interview one-liner:**
> *"`context.waitForEvent('page')` is the clean way to capture a popup.
> I then treat that second page like any other — same locators, same
> assertions."*

---

## Group C — Assertions

### C1. Web-first assertions (`expect(locator).toBeVisible()`)

**What it is:** These assertions auto-retry. `toBeVisible()` keeps
re-querying the DOM for up to 10 s (our configured `expect.timeout`)
instead of failing immediately.

**Where:** Every spec.

**Interview one-liner:**
> *"The reason there's no `waitFor` sprinkled through my code is these
> auto-retrying assertions — they *are* the wait."*

### C2. Non-web assertions (`expect(value).toBe(…)`)

**What it is:** The classic Jest-style assertions. Useful for API
responses, filenames, counts.

**Where:** [`health.api.spec.ts`](./tests/api/health.api.spec.ts),
`expect(json.products[0].name).toBe('Stubbed Demo Product')`.

### C3. Soft assertions (`expect.soft`)

**What it is:** The test continues after a failed soft assertion and
fails at the end. Useful when you want to collect multiple findings.

**Where:** [`AccessibilityCheck.ts`](./src/accessibility/AccessibilityCheck.ts)
— every axe violation becomes a soft fail so we see all of them, not
just the first.

**Interview one-liner:**
> *"Soft assertions are for 'tell me everything that's wrong', not
> 'stop at the first thing'. Perfect for accessibility scans."*

### C4. Polling assertions (`expect.poll`)

**What it is:** Calls a function repeatedly until it matches or times out.

**Where:** [`ShopHomeSteps.advanceHeroCarousel()`](./src/testSteps/shopHome/ShopHomeSteps.ts)
polls for the second slide to gain `.active` class.

**Interview one-liner:**
> *"`expect.poll` is auto-wait for anything that isn't a DOM query —
> perfect for class-transition animations."*

### C5. Custom matchers (`expect.extend`)

**What it is:** You can add your own assertions to `expect`. We added
`toHaveCurrencyFormat('Rs.')`.

**Where:** [`ExpectExtensions.ts`](./src/utils/extensions/ExpectExtensions.ts)

The tricky part (interview catnip): making TypeScript recognise it.
Playwright's types expose a global namespace:

```typescript
declare global {
    namespace PlaywrightTest {
        interface Matchers<R, T> {
            toHaveCurrencyFormat(currencyPrefix: string): Promise<R>;
        }
    }
}
```

**Interview one-liner:**
> *"The TypeScript augmentation goes on the global `PlaywrightTest.Matchers`
> namespace, not a module declaration — I debugged that by reading
> Playwright's `MakeMatchers<R, T, ExtendedMatchers>` type."*

### C6. Snapshot / visual assertions (`toHaveScreenshot`)

**What it is:** Pixel-diff against a committed baseline PNG. On first run
with `--update-snapshots` it writes the baseline; on subsequent runs it
asserts the image matches.

**Where:** [`P2ShopHomeTests.spec.ts`](./src/testSteps/shopHome/P2ShopHomeTests.spec.ts)
— captures the hero carousel.

**Interview one-liner:**
> *"Visual regression is one line per baseline. I store baselines
> alongside the spec and set `maxDiffPixels: 50` in config so sub-pixel
> AA doesn't flake us."*

---

## Group D — State, sessions, and data

### D1. `storageState` — persisted cookies + localStorage

**What it is:** A JSON file containing the browser's cookies and
localStorage. Playwright can load it into a fresh context so a test
starts "already logged in".

**Where:** `.auth/user.json`, written by [`tests/auth.setup.ts`](./tests/auth.setup.ts),
consumed by any spec that calls `test.use({ storageState: AUTH_STATE_FILE })`.

**Interview one-liner:**
> *"Login happens once per CI run, not once per test. The 20 tests that
> need a session share the same `.auth/user.json`."*

### D2. Setup project pattern

**What it is:** A Playwright project named `setup` that runs first and
other projects declare `dependencies: ['setup']` to wait for it.

**Where:** `playwright.config.ts`:
```ts
projects: [
    { name: 'setup', testMatch: /tests[\\/]auth\.setup\.ts/, … },
    { name: 'chromium-en-US', dependencies: ['setup'], … },
]
```

**Interview one-liner:**
> *"The setup project writes the storage state; the feature projects
> depend on it, so Playwright's own scheduler guarantees order without
> me writing shell glue."*

### D3. `globalSetup`

**What it is:** A one-shot TypeScript file that runs ONCE before any
projects start. Used for things that have to exist before even setup
can run — like "create our test user in the backend".

**Where:** [`tests/global.setup.ts`](./tests/global.setup.ts) —
`DELETE /api/deleteAccount` then `POST /api/createAccount`.

**Interview one-liner:**
> *"`globalSetup` is for the thing that even the login step depends on.
> In my case: the demo account itself, via REST, before any browser
> opens."*

### D4. API preconditioning — `APIRequestContext`

**What it is:** Playwright's built-in HTTP client. You get one for free
via `page.request` or `context.request`, and it shares cookies with the
browser.

**Where:** [`AuthorizationApiClient.ts`](./src/utils/api/clients/AuthorizationApiClient.ts),
[`UserAccountApiClient.ts`](./src/utils/api/clients/UserAccountApiClient.ts).

**Interview one-liner:**
> *"Instead of logging in through the UI 50 times, I POST to the login
> API, set the cookies on the context, and the browser is already
> logged in for the next 50 tests."*

### D5. `baseURL`

**What it is:** All navigations like `page.goto('/products')` are
resolved against this.

**Where:** `playwright.config.ts`:
```ts
baseURL: process.env.BASE_URL ?? 'https://automationexercise.com'
```

**Interview one-liner:**
> *"One env var swaps between dev/stage/prod. I never hard-code a URL
> in a spec."*

### D6. Test data (faker + static fixtures)

**What it is:** We blend stable constants (`P1_DEMO_ACCOUNT`) with
generated data (via `@faker-js/faker`) in one class: [`TestData.ts`](./src/resources/TestData.ts).

**Interview one-liner:**
> *"Stable where identity matters (the P1 account), generated where
> uniqueness matters (new signups) — all funneled through one `TestData`
> class."*

---

## Group E — Network interception

### E1. `context.route()` / `page.route()`

**What it is:** Intercepts every matching request. You can abort it,
let it continue, or fulfil it with a canned response.

**Where:**
- [`NetworkHelper.blockAds`](./src/utils/helpers/NetworkHelper.ts) → aborts
  ad/tracker requests.
- [`response-stub.spec.ts`](./tests/api/response-stub.spec.ts) → fulfils
  `/api/productsList` with a stub payload.
- [`BotProtectionHeaderRule.ts`](./src/testSteps/base/rules/BotProtectionHeaderRule.ts) → adds a header on the fly.

**Interview one-liner:**
> *"`context.route` is my hammer for three things: speeding up tests by
> aborting ads, driving UI through canned API responses, and adding
> headers without touching the app code."*

### E2. `route.fulfill` — serve a canned response

**What it is:** Pretend to be the server. You decide status, headers, body.

**Where:** [`response-stub.spec.ts`](./tests/api/response-stub.spec.ts).

**Interview one-liner:**
> *"If I want the UI to render an empty cart, an error state, or a
> million products, I don't touch the backend — I fulfil the response
> client-side."*

### E3. `route.abort`

**What it is:** Cancels the request. Browser sees it as a network error.

**Where:** `NetworkHelper.blockAds`.

### E4. `route.continue({ headers })`

**What it is:** Lets the request proceed but with modifications.

**Where:** `BotProtectionHeaderRule.ts` adds an `x-bot-bypass` header.

### E5. `page.waitForRequest` / `page.waitForResponse`

**What it is:** Not interception — observation. Assert that a given
request fires, and inspect it.

**Where:** Second test in [`response-stub.spec.ts`](./tests/api/response-stub.spec.ts)
proves navigating to `/products` issues a GET to `/products`.

**Interview one-liner:**
> *"`waitForRequest` is the API-level version of `expect(button).toHaveText`.
> It's how I prove the UI calls the right endpoint."*

### E6. Important subtlety — APIRequestContext doesn't always go through routes

In the stub test I originally used `page.request.get('/api/productsList')`
and it bypassed the route handler. The fix was to drive the request from
the page context:

```typescript
const json = await page.evaluate(async () => {
    const r = await fetch('/api/productsList');
    return r.json();
});
```

**Interview one-liner:**
> *"If a stubbed route isn't firing, nine times out of ten it's because
> the request is going through `APIRequestContext` instead of the page.
> `page.evaluate(fetch)` keeps it on the browser side."*

---

## Group F — Advanced browser control

### F1. `page.evaluate`

**What it is:** Execute arbitrary JavaScript inside the page. Useful
for reading `navigator.*`, firing custom events, or driving pages that
depend on in-page APIs.

**Where:** [`UserLocaleConfigurationSteps.ts`](./src/testSteps/userLocaleConfiguration/UserLocaleConfigurationSteps.ts)
reads `navigator.language`.

**Interview one-liner:**
> *"When you need to reach something only the page itself knows,
> `page.evaluate` is your trap door into the browser runtime."*

### F2. `page.clock` — virtual time

**What it is:** Install a fake clock inside the page so you can
fast-forward hours/days without actually waiting.

**Where:** [`ClockHelper.ts`](./src/utils/helpers/ClockHelper.ts),
[`clock.spec.ts`](./tests/clock.spec.ts).

**Interview one-liner:**
> *"`page.clock.install()` + `fastForward('24:00:00')` means a
> session-timeout test runs in 20 ms instead of 24 hours."*

### F3. BrowserContext

**What it is:** Think of a context as an incognito profile — its own
cookies, its own localStorage. One browser can host dozens of contexts.

**Where:** Every test gets its own context by default. Setup project
saves cookies to a storage state so later contexts can reuse them.

**Interview one-liner:**
> *"Contexts are how I isolate tests cheaply — no need to spawn a fresh
> browser per test."*

### F4. Trace Viewer (`trace: 'on-first-retry'`)

**What it is:** A time-travelling UI showing every action, DOM snapshot,
network request, and console log for a test run. Opens in a web UI from
a `.zip` file.

**Where:** `playwright.config.ts` — `trace: 'on-first-retry'` means we
record a trace only when a test fails once and is retrying, keeping
artifacts small.

**Interview one-liner:**
> *"The trace viewer is the killer feature. Click a failed test, open
> the zip, and you can scrub through time like a video with the DOM
> rebuilt at each tick."*

### F5. Screenshots and video

**What it is:** `screenshot: 'only-on-failure'`, `video: 'retain-on-failure'`
save a PNG and WebM only for failures.

**Where:** `playwright.config.ts`.

---

## Group G — Accessibility

### G1. `@axe-core/playwright`

**What it is:** Deque's industry-standard a11y scanner, wrapped so
Playwright can run it inside any page.

**Where:** [`AccessibilityCheck.ts`](./src/accessibility/AccessibilityCheck.ts)
runs axe, filters out known legacy issues via
[`AccessibilitySuppressionsRepository.ts`](./src/accessibility/AccessibilitySuppressionsRepository.ts),
and uses soft assertions so all violations surface.

**Where used:** [`P1MemberHomeTests.spec.ts`](./src/testSteps/memberHome/P1MemberHomeTests.spec.ts)
runs an a11y scan on the home page.

**Interview one-liner:**
> *"I treat a11y like any other quality gate. Axe runs in CI, known
> legacy violations live in a suppression registry with a reason, and
> any NEW violation fails the build."*

---

## Group H — Reporting

### H1. Built-in reporters: `list`, `html`, `junit`, `json`, `github`, `blob`

- `list` — live progress to terminal.
- `html` — interactive dashboard at `reports/html/index.html`.
- `junit` — XML for CI dashboards.
- `json` — machine-readable results.
- `github` — Actions annotations + grouping.
- `blob` — **binary blob report per shard** used only for `merge-reports`.

**Where:** `playwright.config.ts` — reporter stack flips based on
`PLAYWRIGHT_BLOB` and `ALLURE` env vars.

### H2. Custom reporter — `DocumentationReporter`

**What it is:** A class that implements the `Reporter` interface. We
hook `onTestEnd` to collect metadata and `onEnd` to emit a Markdown
traceability matrix + an optional Slack notification.

**Where:** [`DocumentationReporter.ts`](./src/utils/reporting/DocumentationReporter.ts).

**Interview one-liner:**
> *"The custom reporter reads my annotations (Jira ID, priority) and
> emits a Markdown table that goes straight into release notes — no
> human copy-paste."*

### H3. Allure (opt-in via `ALLURE=1`)

**What it is:** A richer report with trends, suites, severities,
history. Industry-standard for large QA orgs.

**Where:** `playwright.config.ts` conditionally appends the Allure
reporter; `npm run test:allure`, `npm run allure:generate`,
`npm run allure:open`.

**Interview one-liner:**
> *"Playwright's HTML report is per-run; Allure is the long-term
> dashboard with trends across runs."*

### H4. Slack hook

**What it is:** `DocumentationReporter.postToSlackIfConfigured` POSTs a
summary message to `$SLACK_WEBHOOK`. Fails silently if unreachable so a
Slack outage can never fail the suite.

**Interview one-liner:**
> *"Opt-in via env var. No Slack webhook, no POST — zero coupling."*

### H5. `merge-reports` + blob

**What it is:** When a suite is sharded across runners, each runner
emits a blob (`.zip`). A merge job downloads them all and runs
`playwright merge-reports --reporter html ./all-blob-reports` to produce
one unified HTML + traceability matrix.

**Where:** Every CI workflow ends with a `merge` job. See
[`pr.yml`](./.github/workflows/pr.yml) → `merge:` job.

**Interview one-liner:**
> *"Sharding gives me 4× speed, blob + merge-reports gives me one
> unified report. I don't make reviewers click into 4 separate HTML
> dashboards."*

---

## Group I — Organisation and scaling

### I1. Page Object Model

**What it is:** One class per screen or feature, exposing locators +
actions as methods. Tests never touch raw selectors.

**Where:** Every `*Steps.ts` file. Example:
[`CheckoutSteps.ts`](./src/testSteps/checkout/CheckoutSteps.ts).

**Interview one-liner:**
> *"When the Checkout CSS changes I update one file. The 10 tests that
> use it don't change at all."*

### I2. Data-driven loops

**What it is:** A `for` loop around `test('…', …)` creates one real
test per data row.

**Where:** [`P2SearchTests.spec.ts`](./src/testSteps/search/P2SearchTests.spec.ts)
loops over `testData.searchQueries()`.

**Interview one-liner:**
> *"Each row becomes its own test in the report — I can retry just the
> flaky one without touching the others."*

### I3. Sharding

**What it is:** `--shard=N/M` splits the suite into M buckets; shard N
runs its bucket only. Typically one shard per CI runner.

**Where:** `pr.yml` runs 2 shards, `nightly.yml` runs 4.

### I4. Retries

**What it is:** `retries: 2` in config means a failed test is tried up
to 3 times total. Trace is only recorded on retry, so passes stay fast.

### I5. Timeouts

| Level             | Default in this repo       | Overrideable via                    |
|-------------------|----------------------------|-------------------------------------|
| Per-test          | 90 s                        | `test.setTimeout(ms)`               |
| Per-action        | 15 s                        | `locator.click({ timeout })`        |
| Per-navigation    | 30 s                        | `page.goto(url, { timeout })`       |
| Per-assertion     | 10 s                        | `expect(l).toBeVisible({ timeout })`|

---

# PART 3 — CI Pipeline Deep-Dive

## 3.1  The big picture

You have four workflow files under `.github/workflows/`, each triggered
by a different event, but all built on the same pattern:

```
┌────────────┐    ┌────────────┐    ┌────────────┐
│  shard 1   │    │  shard 2   │    │  shard 3   │        (parallel)
│ (test run) │    │ (test run) │    │ (test run) │
└──────┬─────┘    └──────┬─────┘    └──────┬─────┘
       │                 │                 │
       ▼                 ▼                 ▼
   blob-report-1    blob-report-2     blob-report-3       (artifacts)
       │                 │                 │
       └─────────────────┼─────────────────┘
                         ▼
                ┌─────────────────┐
                │   merge job     │   playwright merge-reports …
                │                 │   custom reporter runs again
                └────────┬────────┘
                         ▼
             ┌───────────────────────┐
             │ html-report (merged)  │
             │ traceability-matrix   │
             │ job summary + Slack   │
             └───────────────────────┘
```

Why this pattern wins:
- Each shard is independent → no cross-shard flakes
- Final report looks like one run → reviewers click one link
- Our custom reporter re-runs in the merge job → traceability matrix
  always reflects the FULL suite, not just a shard

## 3.2  `pr.yml` — P1 smoke on every pull request

**Trigger:** every PR to `main`.

**Key behaviours:**

```yaml
concurrency:
  group: pr-${{ github.ref }}
  cancel-in-progress: true
```
> *"If someone pushes a new commit, the previous run for that PR is
> cancelled. No wasted compute."*

```yaml
strategy:
  fail-fast: false
  matrix:
    shard: [1, 2]
```
> *"Two shards in parallel — half the wall-clock time."*

```yaml
- uses: actions/cache@v4
  with:
    path: ~/.cache/ms-playwright
    key: ${{ runner.os }}-pw-${{ hashFiles('package-lock.json') }}
```
> *"Playwright browsers are ~300 MB each. We cache them keyed on
> `package-lock.json` so we only re-download when the Playwright version
> changes. Saves roughly a minute per shard."*

```yaml
- name: Run P1 smoke
  env:
    PLAYWRIGHT_BLOB: '1'
  run: npx playwright test --project=chromium-en-US --grep @P1 --shard=${{ matrix.shard }}/2
```
> *"`PLAYWRIGHT_BLOB=1` tells our config to swap the reporter stack —
> local gets HTML, CI gets blob + GitHub annotations."*

The `merge` job then:
1. Downloads every `blob-report-*` artifact into one folder
2. Runs `playwright merge-reports --reporter html,./src/utils/reporting/DocumentationReporter.ts ./all-blob-reports`
3. Uploads `html-report` + `traceability-matrix.md`
4. Prints the matrix into the GitHub step summary so reviewers see it
   without downloading anything

## 3.3  `nightly.yml` — full P2 regression

**Trigger:** cron `0 4 * * *` (04:00 UTC) + `workflow_dispatch`.

**Scale:** 3 projects × 4 shards = **12 parallel jobs**.
```yaml
matrix:
  project: [ chromium-en-US, webkit-en-US, chromium-fr-FR ]
  shard:   [ 1, 2, 3, 4 ]
```

**Extras over the PR workflow:**
- `ALLURE=1` env flips on the Allure reporter in addition to blob
- The `merge` job uploads the merged Allure data as its own artifact
  (90-day retention on the traceability matrix, 30-day on HTML)
- Slack webhook posts a message on failure:

```yaml
- name: Notify Slack on failure
  if: failure() && env.SLACK_WEBHOOK != ''
  run: |
    curl -sS -X POST -H 'content-type: application/json' \
      --data "{\"text\":\":red_circle: Nightly P2 regression failed …\"}" \
      "$SLACK_WEBHOOK"
```

**Interview one-liner:**
> *"Nightly runs the full regression across 3 locales × 4 shards in
> parallel, publishes an Allure report, and only pings Slack if
> something breaks — 'quiet success, loud failure' operations model."*

## 3.4  `rc.yml` — release candidate

**Trigger:** push of a tag matching `v*`, plus manual dispatch.

**Scale:** 4 projects × 4 shards = **16 parallel jobs** — this is the
widest matrix (includes mobile Pixel 7).

**Unique piece — release notes generation:**

```yaml
- name: Write release notes
  run: |
    mkdir -p dist
    {
      echo "# ${{ github.ref_name }} — RC test summary"
      echo
      echo "- Workflow run: …"
      echo "- Tag: \`${{ github.ref_name }}\`"
      echo
      cat reports/traceability-matrix.md
      # ...plus optional free-text input
    } > dist/release-notes.md
```

Then `dist/release-notes.md` is uploaded as a 365-day artifact.

**Interview one-liner:**
> *"Each RC tag auto-generates a Markdown release-notes file with the
> full test matrix embedded. Release managers can paste it straight into
> Confluence."*

## 3.5  `adhoc.yml` — manual coverage runs

**Trigger:** `workflow_dispatch` only. Lets anyone kick a run with
custom inputs from the Actions tab:

```yaml
inputs:
  grep:    { description: 'Grep expression', default: '@smoke' }
  project: { type: choice, options: [chromium-en-US, webkit-en-US, mobile-chrome-pixel7, chromium-fr-FR] }
  shards:  { type: choice, options: ['1', '2', '4'] }
```

**Interview one-liner:**
> *"If a dev wants to run just `@checkout` tests on the French locale
> before merging, they don't need me — one click, three dropdowns, done."*

## 3.6  Docker — reproducible local == CI

### `Dockerfile`

```dockerfile
FROM mcr.microsoft.com/playwright:v1.49.0-jammy

USER root
WORKDIR /work
COPY package*.json ./
RUN npm ci --no-audit --no-fund
COPY . .
RUN chown -R pwuser:pwuser /work

USER pwuser
ENV CI=1 PLAYWRIGHT_BLOB=1
CMD ["npx", "playwright", "test"]
```

**Why `pwuser`?**
> *"The Playwright image ships with an unprivileged user already set up
> with browsers. Running tests as root is a bad habit — containers that
> run as root can break host file permissions when they write into
> volume mounts."*

### `.dockerignore`

```
node_modules
.auth
reports
test-results
playwright-report
.git
.github
*.log
.env
.env.local
.DS_Store
```

**Why it matters:**
> *"Without this, every Docker build uploads `node_modules/` (~400 MB)
> into the build context. With it, builds are under 10 MB and layer
> caching actually works."*

### `docker-compose.yml`

Three services, same image:

| Service   | What it does                                            |
|-----------|---------------------------------------------------------|
| `tests`   | Headless run; writes `reports/` and `test-results/` back to host |
| `report`  | Serves the HTML report on `http://localhost:9323`       |
| `headed`  | Opens an X11 window (macOS: XQuartz) for visual debugging |

**Interview one-liner:**
> *"`docker compose run --rm tests` is my 'reproduce the exact CI
> failure locally' button. Same image, same env vars, same browsers."*

## 3.7  Allure vs built-in HTML reporter

| Dimension       | Built-in HTML             | Allure                                 |
|-----------------|---------------------------|----------------------------------------|
| Trends          | Per-run only              | Across all runs                        |
| Grouping        | Flat tree                 | By suite/severity/epic                 |
| History         | None                      | Flaky test detection, history graphs   |
| Setup cost      | Zero                      | Needs `allure-playwright` + CLI to generate |
| Default?        | Yes                       | Opt-in via `ALLURE=1`                  |

**Interview one-liner:**
> *"I keep Playwright HTML on for fast feedback — it's instant. I turn
> Allure on nightly because that's where trending data comes from."*

## 3.8  Slack notifications — two layers

There are TWO Slack integrations:

1. **GitHub Actions curl** in `nightly.yml` — fires if the whole
   workflow fails. Quick and dumb.
2. **`DocumentationReporter.postToSlackIfConfigured`** — fires at end
   of every run with pass/fail totals. More detailed, works locally
   too, not tied to GitHub Actions.

Both are gated behind `SLACK_WEBHOOK` so turning them off is
"delete the secret".

## 3.9  Sharding math (interview gotcha)

**Q: "You have 46 tests and 4 shards — how long does the suite take?"**

Playwright splits by *file*, not test. If one file has 20 tests and the
others have 2 each, shard 1 does the heavy lifting. Rule of thumb:

- Expected wall-clock = (longest shard's wall-clock) + merge overhead
- Longest shard = roughly `total_runtime / shards` **only if** tests are
  evenly distributed across files

**Fix:** split big spec files into smaller ones, or set `fullyParallel: true`
(which we have) so tests within a file can parallelise across workers.

## 3.10  Quick reference — running everything

```bash
# Local
npm test                                   # everything, every project
npm run test:p1                            # @P1 only
npm run test:smoke                         # @smoke only
npm run test:chromium                      # one project
npm run test:ui                            # interactive UI mode
npm run test:allure                        # with Allure output

# CI simulation
PLAYWRIGHT_BLOB=1 npm test                 # blob reporter (same as CI)
npm run ci:merge                           # merge blob dir → html + custom

# Docker
npm run docker:test                        # docker compose run --rm tests
npm run docker:report                      # docker compose up report  →  http://localhost:9323

# Report
npm run report                             # open HTML report
npm run allure:generate && npm run allure:open
```

---

## Appendix — the 60-second "tell me about your project" script

> *"I built a Playwright + TypeScript framework whose structure mirrors
> the Nike App Android automation — same `testSteps/<area>/{Steps, P1Tests,
> P2Tests}` layout, same `UITestBase` + rule chain, same separation
> between resources, utils, and feature specs. It runs against
> `automationexercise.com`, sharded across a 4-project matrix in GitHub
> Actions. On every PR two shards run @P1 smoke in parallel, each emits a
> blob report, and a merge job stitches them into one HTML dashboard
> plus a Markdown traceability matrix that gets posted straight into the
> PR summary. Nightly runs the full P2 regression across Chrome, Safari,
> and French locale on four shards each with Allure trending and a Slack
> hook. Release-candidate tags produce auto-generated release notes. I
> also wrote a custom Playwright reporter, a custom expect matcher, an
> accessibility scan with a known-issue suppression repo, visual
> regression baselines, and full Docker support so local == CI."*

That's your 60-second opener. Everything else in this doc is your backup.

---

*Last updated: Evening 4 — 46 tests across 15 feature areas, 4 CI
workflows, 54+ Playwright concepts covered.*
