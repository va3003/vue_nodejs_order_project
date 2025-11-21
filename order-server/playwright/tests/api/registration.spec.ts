import { test, expect, APIRequestContext } from '@playwright/test';

const BASE = process.env.API_BASE_URL || 'http://localhost:3001';
const REGISTER_PATH = process.env.REGISTER_PATH || '/api/auth/register';

function randomEmail() {
    return `playwright+${Date.now()}${Math.floor(Math.random() * 1000)}@example.com`;
}

test.describe('User registration API', () => {
    let api: APIRequestContext;

    test.beforeAll(async ({ playwright }) => {
        api = await playwright.request.newContext({ baseURL: BASE });
    });

    test.afterAll(async () => {
        await api.dispose();
    });

    test('registers a new user successfully', async () => {
        const email = randomEmail();
        const unique = Date.now().toString();
        const payload = {
            userId: `uid-${unique}`,
            username: `user-${unique}`,
            email,
            password: 'Password123!',
            firstName: 'Test',
            lastName: 'User',
            role: 'tester',
        };

        const res = await api.post(REGISTER_PATH, { data: payload });

        // expected success status from controller
        expect([200, 201]).toContain(res.status());

        const body = await res.json().catch(() => ({}));

        // controller returns a success message and should not echo plaintext password
        expect(body).toBeTruthy();
        expect(body.message).toBe('Record created successfully');
        expect(body.password === undefined && body.user?.password === undefined).toBeTruthy();

        // optionally ensure email/username aren't leaked back as plain sensitive fields (if provided)
        // many APIs return limited info; assert that returned payload does not include plaintext password
        const text = JSON.stringify(body).toLowerCase();
        expect(text).not.toContain('password123!');
        expect(text).toContain('record created successfully');
    });

    test('returns validation error for missing required fields', async () => {
        const res = await api.post(REGISTER_PATH, {
            data: {
                // missing email & password
                name: '',
            },
        });

        expect([400, 422]).toContain(res.status());
        const json = await res.json().catch(() => ({}));
        // expect some error details to be present
        expect(
            json.errors || json.message || json.error
        ).toBeTruthy();
    });

    test('rejects invalid email format', async () => {
        const res = await api.post(REGISTER_PATH, {
            data: {
                name: 'Invalid Email',
                email: 'not-an-email',
                password: 'Password123!',
            },
        });

        expect([400, 422]).toContain(res.status());
        const json = await res.json().catch(() => ({}));
        expect(
            JSON.stringify(json).toLowerCase()
        ).toContain('email');
    });

    test('rejects too-short password', async () => {
        const res = await api.post(REGISTER_PATH, {
            data: {
                name: 'Short Password',
                email: randomEmail(),
                password: '123',
            },
        });

        expect([400, 422]).toContain(res.status());
        const json = await res.json().catch(() => ({}));
        expect(
            JSON.stringify(json).toLowerCase()
        ).toContain('password');
    });

    test('rejects duplicate email registration', async () => {
        const email = randomEmail();

        // first registration should succeed
        const first = await api.post(REGISTER_PATH, {
            data: {
                name: 'First',
                email,
                password: 'Password123!',
            },
        });
        expect([200, 201]).toContain(first.status());

        // second registration with same email should fail (409 or 400 typical)
        const second = await api.post(REGISTER_PATH, {
            data: {
                name: 'Second',
                email,
                password: 'Password123!',
            },
        });
        expect([400, 409]).toContain(second.status());

        const json = await second.json().catch(() => ({}));
        const text = JSON.stringify(json).toLowerCase();
        // message should indicate duplicate or already exists
        expect(
            text.includes('already') || text.includes('exists') || text.includes('duplicate')
        ).toBeTruthy();
    });
});