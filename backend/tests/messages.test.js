const request = require('supertest');
const { connect, close, clear } = require('./setup');
const express = require('express');
const messageRoutes = require('../routes/messages');
const User = require('../models/User');
const Chatroom = require('../models/Chatroom');
const Message = require('../models/Message');
const jwt = require('jsonwebtoken');

const app = express();
app.use(express.json());
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
app.use('/api/messages', messageRoutes);

beforeAll(async () => await connect());
afterEach(async () => await clear());
afterAll(async () => await close());

describe('Messages API', () => {
    let token;
    let user;

    beforeEach(async () => {
        user = await User.create({
            name: 'Alice',
            email: 'alice@test.com',
            password: 'password123'
        });
        token = jwt.sign({ _id: user._id }, 'testsecret');
        process.env.JWT_SECRET = 'testsecret';
    });

    it('should list chatrooms for a user', async () => {
        const bob = await User.create({ name: 'Bob', email: 'bob@test.com', password: 'password123' });
        await Chatroom.create({
            participants: [user._id, bob._id]
        });

        const res = await request(app)
            .get('/api/messages/rooms')
            .set('Authorization', `Bearer ${token}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.length).toBe(1);
    });

    it('should get message history for a room', async () => {
        const bob = await User.create({ name: 'Bob', email: 'bob@test.com', password: 'password123' });
        const room = await Chatroom.create({
            participants: [user._id, bob._id]
        });

        await Message.create({
            room: room._id,
            sender: bob._id,
            content: 'Hello!'
        });

        const res = await request(app)
            .get(`/api/messages/${room._id}`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.length).toBe(1);
        expect(res.body[0].content).toBe('Hello!');
    });
});
