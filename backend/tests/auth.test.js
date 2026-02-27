const request = require('supertest');
const { connect, close, clear } = require('./setup');
const express = require('express');
const authRoutes = require('../routes/auth');
const User = require('../models/User');

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

beforeAll(async () => await connect());
afterEach(async () => await clear());
afterAll(async () => await close());

describe('Auth API', () => {
    const testUser = {
        name: 'Test user',
        email: 'test@test.com',
        password: 'password123',
        university: 'Test Uni',
        major: 'CS',
        year: '1st'
    };

    it('should register a new user', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send(testUser);

        expect(res.statusCode).toBe(201);
        expect(res.body).toHaveProperty('token');
        expect(res.body.user.email).toBe(testUser.email);
    });

    it('should login an existing user', async () => {
        await User.create(testUser);

        const res = await request(app)
            .post('/api/auth/login')
            .send({
                email: testUser.email,
                password: testUser.password
            });

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('token');
    });

    it('should fail to login with wrong password', async () => {
        await User.create(testUser);

        const res = await request(app)
            .post('/api/auth/login')
            .send({
                email: testUser.email,
                password: 'wrongpassword'
            });

        expect(res.statusCode).toBe(400);
        expect(res.body).toHaveProperty('error');
    });
});
