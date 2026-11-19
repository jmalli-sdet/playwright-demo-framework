//
//  TestData.ts
//  = TestData.kt
//
//  Centralized test-data store. Mirrors the reference suite's TestData.kt which exposes
//  getP1User(UserType.BILLING), getCurrentLocale(), country helpers, etc.
//

import { faker } from '@faker-js/faker';
import { TestAccount, UserType } from './TestAccount';
import type { CreateAccountPayload } from '../utils/api/clients/UserAccountApiClient';

/**
 * Per-shard identity suffix for the P1 demo email.
 *
 * In GitHub Actions, every matrix shard (e.g. 3 projects × 4 shards = 12
 * jobs per nightly) is a separate CI runner, which means a separate Node
 * process, which means a separate run of `tests/global.setup.ts`. When
 * they all share one email (`jm-demo-framework-p1@demo.local`) they race
 * on `DELETE /api/deleteAccount` + `POST /api/createAccount` — e.g. Shard
 * B deletes the account while Shard A is mid-login, which surfaces as the
 * nondeterministic "Logged in as not visible" and "login-email fill
 * timeout" failures in the nightly workflow.
 *
 * Solution: in CI, append `${GITHUB_RUN_ID}-${MATRIX_PROJECT}-s${MATRIX_SHARD}`
 * so every shard owns a unique account. Local developer runs (where none
 * of those env vars are set) keep the original stable email.
 */
function perShardAccountSuffix(): string {
    const parts: string[] = [];
    const runId = process.env.GITHUB_RUN_ID;
    const proj  = process.env.MATRIX_PROJECT;
    const shard = process.env.MATRIX_SHARD;
    if (runId) parts.push(runId);
    if (proj)  parts.push(proj);
    if (shard) parts.push(`s${shard}`);
    return parts.length > 0 ? `-${parts.join('-')}` : '';
}

const P1_SUFFIX = perShardAccountSuffix();

/**
 * A stable demo account that the framework owns on automationexercise.com.
 * global.setup.ts creates it idempotently (POST /api/createAccount) before
 * any spec runs. auth.setup.ts then UI-logs-in as this account once and
 * persists the storageState to .auth/user.json.
 *
 * In CI the email is per-shard (see `perShardAccountSuffix` above) so
 * parallel matrix jobs cannot stomp on each other's account lifecycle.
 */
export const P1_DEMO_ACCOUNT = new TestAccount({
    email:    `jm-demo-framework-p1${P1_SUFFIX}@demo.local`,
    password: 'DemoFrameworkP1!2026',
    name:     'JM Demo P1',
    userType: UserType.P1_BILLING,
});

export class TestData {

    // ── Locale constants (= TestData.KO_KR in reference) ──────────────────────────
    static readonly EN_US = 'en-US';
    static readonly JA_JP = 'ja-JP';
    static readonly KO_KR = 'ko-KR';
    static readonly FR_FR = 'fr-FR';

    // ── Known-bad credentials for negative-login scenarios ───────────────────
    getInvalidUser(): TestAccount {
        return new TestAccount({
            email: 'invalid.user@does-not-exist.test',
            password: 'wrongpassword-12345',
            name: 'Invalid User',
            userType: UserType.INVALID,
        });
    }

    /** Stable P1 account (created by global.setup.ts via REST). */
    getP1User(_type: UserType = UserType.P1_BILLING): TestAccount {
        return P1_DEMO_ACCOUNT;
    }

    /** Fully-populated payload for POST /api/createAccount. */
    buildCreateAccountPayload(acct: TestAccount): CreateAccountPayload {
        return {
            name:         acct.name,
            email:        acct.email,
            password:     acct.password,
            title:        'Mr',
            birth_date:   '15',
            birth_month:  'January',
            birth_year:   '1995',
            firstname:    acct.name.split(' ')[0] ?? 'Demo',
            lastname:     acct.name.split(' ')[1] ?? 'User',
            company:      'Demo Framework',
            address1:     '123 Demo Street',
            address2:     'Apt 4',
            country:      'United States',
            zipcode:      '10001',
            state:        'NY',
            city:         'New York',
            mobile_number: '+15555550101',
        };
    }

    // ── Ephemeral generated data ──────────────────────────────────────────────

    newRandomUser(): TestAccount {
        return new TestAccount({
            email: faker.internet.email({ provider: 'demo.local' }).toLowerCase(),
            password: faker.internet.password({ length: 14, memorable: false }),
            name: faker.person.firstName(),
            userType: UserType.GENERATED,
        });
    }

    sampleAddress(countryISO: 'US' | 'FR' | 'JP' = 'US') {
        return {
            firstName: faker.person.firstName(),
            lastName:  faker.person.lastName(),
            address1:  faker.location.streetAddress(),
            city:      faker.location.city(),
            state:     faker.location.state(),
            zip:       faker.location.zipCode(),
            country:   countryISO,
            mobile:    faker.phone.number(),
        };
    }

    /** Fake but valid-format payment details for the AUT's demo checkout. */
    samplePayment() {
        return {
            nameOnCard: 'JM Demo',
            cardNumber: '4111 1111 1111 1111',
            cvc:        '123',
            expiryMM:   '12',
            expiryYYYY: '2030',
        };
    }

    /** Stable, canned search queries used by the data-driven P2 search spec. */
    searchQueries(): Array<{ query: string; expectedKeyword: string }> {
        return [
            { query: 'dress', expectedKeyword: 'dress' },
            { query: 'top',   expectedKeyword: 'top'   },
            { query: 'jeans', expectedKeyword: 'jean'  },
        ];
    }

    isCurrentGeo(locale: string): boolean {
        return (process.env.LOCALE ?? 'en-US') === locale;
    }
}
