//
//  AuthorizationApiClient.ts
//  = AuthorizationApiClient.kt
//
//  Thin wrapper on automationexercise.com's /verifyLogin endpoint.
//  Lets specs validate credentials without driving the UI — same pattern as
//  Nike's `AuthorizationApiClient.preTestLogin(testAccount)`.
//

import type { APIRequestContext } from '@playwright/test';
import { ApiClientBase } from './ApiClientBase';

export interface VerifyLoginResponse {
    responseCode: number;      // 200 = user exists, 404 = not found, 400 = bad request
    message: string;
}

export class AuthorizationApiClient extends ApiClientBase {

    constructor(request: APIRequestContext) {
        super(request);
    }

    /** POST /verifyLogin — validates (email, password) against the AUT. */
    async verifyLogin(email: string, password: string): Promise<VerifyLoginResponse> {
        const res = await this.post('/verifyLogin', { email, password });
        return this.asJson<VerifyLoginResponse>(res);
    }
}
