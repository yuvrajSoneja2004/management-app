const request = require('supertest');
const app = require('../../src/app');
const User = require('../../src/modules/auth/user.model');

require('../setup');

describe('Auth API - Integration Tests', () => {
    describe('POST /api/auth/register', () => {
        it('should register a new user', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send({
                    username: 'testuser',
                    email: 'test@example.com',
                    password: 'password123'
                });

            expect(res.status).toBe(201);
            expect(res.body).toHaveProperty('_id');
            expect(res.body).toHaveProperty('accessToken');
            expect(res.body.email).toBe('test@example.com');
        });

        it('should return 400 for invalid email', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send({
                    username: 'testuser',
                    email: 'invalid-email',
                    password: 'password123'
                });

            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty('error');
        });

        it('should return 400 for short password', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send({
                    username: 'testuser',
                    email: 'test@example.com',
                    password: '123'
                });

            expect(res.status).toBe(400);
        });

        it('should enforce rate limiting after 5 attempts', async () => {
            const userData = {
                username: 'testuser',
                email: 'test@example.com',
                password: 'password123'
            };

            // Make 5 requests
            for (let i = 0; i < 5; i++) {
                await request(app)
                    .post('/api/auth/register')
                    .send({ ...userData, email: `test${i}@example.com` });
            }

            // 6th request should be rate limited
            const res = await request(app)
                .post('/api/auth/register')
                .send({ ...userData, email: 'test6@example.com' });

            expect(res.status).toBe(429);
        }, 10000);
    });

    describe('POST /api/auth/login', () => {
        beforeEach(async () => {
            await request(app)
                .post('/api/auth/register')
                .send({
                    username: 'testuser',
                    email: 'test@example.com',
                    password: 'password123'
                });
        });

        it('should login with valid credentials', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'test@example.com',
                    password: 'password123'
                });

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('accessToken');
            expect(res.headers['set-cookie']).toBeDefined();
        });

        it('should return 401 for invalid credentials', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'test@example.com',
                    password: 'wrongpassword'
                });

            expect(res.status).toBe(401);
        });
    });

    describe('GET /api/auth/refresh', () => {
        let refreshToken;

        beforeEach(async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send({
                    username: 'testuser',
                    email: 'test@example.com',
                    password: 'password123'
                });

            // Extract refresh token from cookie
            const cookies = res.headers['set-cookie'];
            refreshToken = cookies.find(c => c.startsWith('jwt=')).split(';')[0].split('=')[1];
        });

        it('should refresh access token with valid refresh token', async () => {
            const res = await request(app)
                .get('/api/auth/refresh')
                .set('Cookie', [`jwt=${refreshToken}`]);

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('accessToken');
        });

        it('should return 401 without refresh token', async () => {
            const res = await request(app)
                .get('/api/auth/refresh');

            expect(res.status).toBe(401);
        });
    });
});
