//
//  TestAccount.ts
//  = TestAccount in the reference suite's resources/TestData.kt
//

export enum UserType {
    P1_BILLING  = 'P1_BILLING',
    P1_SHIPPING = 'P1_SHIPPING',
    P2_RETURNS  = 'P2_RETURNS',
    INVALID     = 'INVALID',
    GENERATED   = 'GENERATED',
}

export class TestAccount {
    readonly email: string;
    readonly password: string;
    readonly name: string;
    readonly userType: UserType;

    constructor(opts: { email: string; password: string; name: string; userType: UserType }) {
        this.email = opts.email;
        this.password = opts.password;
        this.name = opts.name;
        this.userType = opts.userType;
    }
}
