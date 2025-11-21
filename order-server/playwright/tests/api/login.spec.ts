import { test, expect } from '@playwright/test';

declare const process: {
    env: { [key: string]: string | undefined };
};

const BASE = process.env.BASE_URL || 'http://localhost:3001';
const LOGIN_PATH = '/api/auth/login';

// Test credentials - override with env vars in CI if needed
const TEST_USERNAME = process.env.TEST_USERNAME || 'kc125';
const TEST_EMAIL = process.env.TEST_USER_EMAIL || 'kc125@gmail.com';
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD || 'Password123!';

async function login(request: any, payload: Record<string, any>) {
    const url = new URL(LOGIN_PATH, BASE).toString();
    return request.post(url, {
        data: payload,
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
        },
    });
}

test.describe('AuthController - /api/auth/login', () => {
    test('successful login returns 200 and a JWT token (or auth cookie)', async ({ request }) => {
        const res = await login(request, { username: TEST_USERNAME, password: TEST_PASSWORD });
        expect(res.status(), 'expected 200 OK').toBe(200);

        // Prefer JSON token in body
        let json: any = {};
        try {
            json = await res.json();
        } catch {
            // ignore parse errors
        }

        const token = json?.token;
        const setCookie = res.headers()['set-cookie'] || '';

        // Accept either JWT in response body OR a set-cookie header for session
        if (typeof token === 'string' && token.split('.').length === 3) {
            expect(token.length).toBeGreaterThan(20);
        } else {
            expect(setCookie.length, 'expected auth cookie to be set').toBeGreaterThan(0);
        }

        // Basic user shape when returned
        if (json?.user) {
            expect(json.user).toHaveProperty('email');
            expect(json.user.email).toBe(TEST_EMAIL);
        }
    });

    test('invalid credentials return 401', async ({ request }) => {
        const res = await login(request, { email: TEST_EMAIL, password: 'wrong-password' });
        expect([401, 400].includes(res.status()), 'expected 401 Unauthorized or 400 Bad Request for invalid creds').toBeTruthy();

        // If body contains error details, check message exists
        try {
            const body = await res.json();
            if (body && typeof body === 'object') {
                expect(body).toHaveProperty('message');
            }
        } catch {
            // ignore invalid json responses
        }
    });

    test('missing fields return 400', async ({ request }) => {
        const res = await login(request, {});
        expect([400, 422].includes(res.status()), 'expected 400/422 for missing fields').toBeTruthy();
    });

    test('login response has reasonable headers', async ({ request }) => {
        const res = await login(request, { email: TEST_EMAIL, password: TEST_PASSWORD });
        // CORS and content type are common expectations - adapt if your controller differs
        const ct = res.headers()['content-type'] || '';
        expect(ct.includes('application/json') || ct.includes('text/plain') || ct === '', 'unexpected content-type').toBeTruthy();
    });
});