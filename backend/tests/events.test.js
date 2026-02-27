const request = require('supertest');
const { connect, close, clear } = require('./setup');
const express = require('express');
const eventRoutes = require('../routes/events');
const User = require('../models/User');
const Event = require('../models/Event');
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
app.use('/api/events', eventRoutes);

beforeAll(async () => await connect());
afterEach(async () => await clear());
afterAll(async () => await close());

describe('Events API', () => {
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

    it('should create a new event', async () => {
        const res = await request(app)
            .post('/api/events')
            .set('Authorization', `Bearer ${token}`)
            .send({
                title: 'Test Event',
                description: 'A test event',
                date: new Date(Date.now() + 86400000),
                type: 'Workshop',
                location: 'Main Hall'
            });

        expect(res.statusCode).toBe(201);
        expect(res.body.title).toBe('Test Event');
    });

    it('should RSVP to an event', async () => {
        const event = await Event.create({
            title: 'Study Session',
            description: 'Study hard',
            date: new Date(Date.now() + 86400000),
            organizer: user._id,
            maxAttendees: 10
        });

        const res = await request(app)
            .post(`/api/events/${event._id}/rsvp`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.attendees).toContain(user._id.toString());
    });
});
