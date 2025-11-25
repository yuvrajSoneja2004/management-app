const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const authService = require('../../src/modules/auth/auth.service');
const User = require('../../src/modules/auth/user.model');

require('../setup');

describe('Auth Service - Unit Tests', () => {
    describe('registerUser', () => {
        it('should register a new user successfully', async () => {
            const username = 'testuser';
            const email = 'test@example.com';
            const password = 'password123';

            const result = await authService.registerUser(username, email, password);

            expect(result).toHaveProperty('user');
            expect(result).toHaveProperty('accessToken');
            expect(result).toHaveProperty('refreshToken');
            expect(result.user.email).toBe(email);
            expect(result.user.username).toBe(username);
        });

        it('should throw error for duplicate email', async () => {
            const username = 'testuser';
            const email = 'test@example.com';
            const password = 'password123';

            await authService.registerUser(username, email, password);

            await expect(
                authService.registerUser('anotheruser', email, 'password456')
            ).rejects.toThrow('User already exists');
        });

        it('should hash password with 12+ bcrypt rounds', async () => {
            const username = 'testuser';
            const email = 'test@example.com';
            const password = 'password123';

            await authService.registerUser(username, email, password);

            const user = await User.findOne({ email }).select('+password');

            // Verify password is hashed
            expect(user.password).not.toBe(password);

            // Verify bcrypt rounds (hash starts with $2a$ or $2b$ followed by rounds)
            const rounds = parseInt(user.password.split('$')[2]);
            expect(rounds).toBeGreaterThanOrEqual(12);
        });
    });

    describe('loginUser', () => {
        beforeEach(async () => {
            await authService.registerUser('testuser', 'test@example.com', 'password123');
        });

        it('should login user with correct credentials', async () => {
            const result = await authService.loginUser('test@example.com', 'password123');

            expect(result).toHaveProperty('user');
            expect(result).toHaveProperty('accessToken');
            expect(result).toHaveProperty('refreshToken');
            expect(result.user.email).toBe('test@example.com');
        });

        it('should throw error for invalid email', async () => {
            await expect(
                authService.loginUser('wrong@example.com', 'password123')
            ).rejects.toThrow('Invalid email or password');
        });

        it('should throw error for invalid password', async () => {
            await expect(
                authService.loginUser('test@example.com', 'wrongpassword')
            ).rejects.toThrow('Invalid email or password');
        });
    });

    describe('JWT Token Generation', () => {
        it('should generate valid access token', async () => {
            const result = await authService.registerUser('testuser', 'test@example.com', 'password123');

            const decoded = jwt.verify(result.accessToken, process.env.JWT_SECRET || 'testsecret');

            expect(decoded).toHaveProperty('id');
            expect(decoded).toHaveProperty('email', 'test@example.com');
        });

        it('should generate valid refresh token', async () => {
            const result = await authService.registerUser('testuser', 'test@example.com', 'password123');

            const decoded = jwt.verify(result.refreshToken, process.env.JWT_REFRESH_SECRET || 'testrefreshsecret');

            expect(decoded).toHaveProperty('id');
        });
    });

    describe('refreshAccessToken', () => {
        let refreshToken;
        let userId;

        beforeEach(async () => {
            const result = await authService.registerUser('testuser', 'test@example.com', 'password123');
            refreshToken = result.refreshToken;
            userId = result.user._id;
        });

        it('should generate new access token with valid refresh token', async () => {
            const newAccessToken = await authService.refreshAccessToken(refreshToken);

            expect(newAccessToken).toBeDefined();

            const decoded = jwt.verify(newAccessToken, process.env.JWT_SECRET || 'testsecret');
            expect(decoded.id).toBe(userId.toString());
        });

        it('should throw error for missing refresh token', async () => {
            await expect(
                authService.refreshAccessToken(null)
            ).rejects.toThrow('Unauthorized');
        });

        it('should throw error for invalid refresh token', async () => {
            await expect(
                authService.refreshAccessToken('invalid-token')
            ).rejects.toThrow();
        });
    });
});
