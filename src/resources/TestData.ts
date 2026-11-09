//
//  TestData.ts
//  = TestData.kt
//
//  Centralized test-data store. Mirrors Nike's TestData.kt which exposes
//  getP1User(UserType.BILLING), getCurrentLocale(), country helpers, etc.
//

import { faker } from '@faker-js/faker';
import { TestAccount, UserType } from './TestAccount';

export class TestData {

    // ── Static sample locales (= TestData.KO_KR / EN_US / DE_AT in Nike) ─────
    static readonly EN_US = 'en-US';
    static readonly JA_JP = 'ja-JP';
    static readonly KO_KR = 'ko-KR';
    static readonly FR_FR = 'fr-FR';

    // ── Seeded users ──────────────────────────────────────────────────────────
    //    (For Evening 1 we only expose an invalid user. Evening 2's
    //    `global.setup.ts` will register real users against automationexercise
    //    and populate the UserType.P1_BILLING / P1_SHIPPING slots.)

    getInvalidUser(): TestAccount {
        return new TestAccount({
            email: 'invalid.user@does-not-exist.test',
            password: 'wrongpassword-12345',
            name: 'Invalid User',
            userType: UserType.INVALID,
        });
    }

    getP1User(_type: UserType): TestAccount {
        // Replaced in Evening 2 once we seed via API.
        return new TestAccount({
            email: process.env.TEST_USER_EMAIL ?? '',
            password: process.env.TEST_USER_PASSWORD ?? '',
            name: 'Demo User',
            userType: UserType.P1_BILLING,
        });
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

    isCurrentGeo(locale: string): boolean {
        return (process.env.LOCALE ?? 'en-US') === locale;
    }
}
