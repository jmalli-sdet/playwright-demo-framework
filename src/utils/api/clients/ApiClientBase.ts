//
//  ApiClientBase.ts
//  = ApiClientBase.kt
//
//  Base class for every REST client. Wraps APIRequestContext so subclasses
//  only declare endpoint-specific methods. In Nike this centralises OkHttp
//  setup + interceptors + auth header injection.
//

import type { APIRequestContext, APIResponse } from '@playwright/test';

export abstract class ApiClientBase {

    protected constructor(
        protected readonly request: APIRequestContext,
        protected readonly baseUrl: string = process.env.API_BASE_URL ?? 'https://automationexercise.com/api',
    ) {}

    protected async get(path: string, params?: Record<string, string | number>): Promise<APIResponse> {
        return this.request.get(this.url(path), { params });
    }

    protected async post(path: string, form?: Record<string, string>): Promise<APIResponse> {
        // automationexercise APIs expect application/x-www-form-urlencoded, not JSON.
        return this.request.post(this.url(path), { form });
    }

    protected async delete(path: string, form?: Record<string, string>): Promise<APIResponse> {
        return this.request.delete(this.url(path), { form });
    }

    protected url(path: string): string {
        return path.startsWith('http') ? path : `${this.baseUrl}${path}`;
    }

    protected async asJson<T>(res: APIResponse): Promise<T> {
        const text = await res.text();
        try { return JSON.parse(text) as T; }
        catch (err) {
            throw new Error(`Expected JSON from ${res.url()} but got:\n${text.slice(0, 400)}`);
        }
    }
}
