const request = require('supertest');
const { connect, close, clear } = require('./setup');
const express = require('express');
const userRoutes = require('../routes/users');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

const app = express();
app.use(express.json());
// Mock middleware logic for req.user
app.use((req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader) {
        const token = authHeader.split(' ')[1];
        try {
            const decoded = jwt.verify(token, 'testsecret');
            req.user = decoded;
        } catch (e) { }
    }
    next();
});
app.use('/api/users', userRoutes);

beforeAll(async () => await connect());
afterEach(async () => await clear());
afterAll(async () => await close());

describe('Users API', () => {
    let token;
    let user;

    beforeEach(async () => {
        user = await User.create({
            name: 'Alice',
            email: 'alice@test.com',
            password: 'password123',
            skills: ['React'],
            interests: ['AI'],
            university: 'Uni A',
            major: 'CS'
        });
        token = jwt.sign({ _id: user._id }, 'testsecret');
        process.env.JWT_SECRET = 'testsecret';
    });

    it('should discover other users', async () => {
        await User.create({
            name: 'Bob',
            email: 'bob@test.com',
            password: 'password123',
            skills: ['Node.js'],
            interests: ['AI'],
            university: 'Uni B'
        });

        const res = await request(app)
            .get('/api/users/discover')
            .set('Authorization', `Bearer ${token}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.users.length).toBe(1);
        expect(res.body.users[0].name).toBe('Bob');
    });

    it('should update current user profile', async () => {
        const res = await request(app)
            .patch('/api/users/me')
            .set('Authorization', `Bearer ${token}`)
            .send({ bio: 'New bio' });

        expect(res.statusCode).toBe(200);
        expect(res.body.bio).toBe('New bio');
    });

    it('should send connection request', async () => {
        const otherUser = await User.create({
            name: 'Bob',
            email: 'bob@test.com',
            password: 'password123'
        });

        const res = await request(app)
            .post(`/api/users/${otherUser._id}/connect`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.statusCode).toBe(200);

        const updatedOtherUser = await User.findById(otherUser._id);
        expect(updatedOtherUser.pendingRequests).toContainEqual(user._id);
    });
});
