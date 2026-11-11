//
//  UserAccountApiClient.ts
//  = UserAccountApiClient.kt
//
//  Create / delete accounts against automationexercise.com. Used in Evening 2 by
//  tests/global.setup.ts to seed the P1/P2 users exactly as the reference suite's
//  pre-test account bootstrap does.
//

import type { APIRequestContext } from '@playwright/test';
import { ApiClientBase } from './ApiClientBase';

export interface CreateAccountPayload {
    name: string;
    email: string;
    password: string;
    title?: 'Mr' | 'Mrs';
    birth_date?: string;  // dd
    birth_month?: string; // Month name, e.g. "January"
    birth_year?: string;  // yyyy
    firstname?: string;
    lastname?: string;
    company?: string;
    address1?: string;
    address2?: string;
    country?: string;
    zipcode?: string;
    state?: string;
    city?: string;
    mobile_number?: string;
}

export class UserAccountApiClient extends ApiClientBase {

    constructor(request: APIRequestContext) { super(request); }

    async createAccount(payload: CreateAccountPayload): Promise<{ responseCode: number; message: string }> {
        const res = await this.post('/createAccount', payload as unknown as Record<string, string>);
        return this.asJson(res);
    }

    async deleteAccount(email: string, password: string): Promise<{ responseCode: number; message: string }> {
        const res = await this.delete('/deleteAccount', { email, password });
        return this.asJson(res);
    }
}
