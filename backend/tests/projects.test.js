const request = require('supertest');
const { connect, close, clear } = require('./setup');
const express = require('express');
const projectRoutes = require('../routes/projects');
const User = require('../models/User');
const Project = require('../models/Project');
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
app.use('/api/projects', projectRoutes);

beforeAll(async () => await connect());
afterEach(async () => await clear());
afterAll(async () => await close());

describe('Projects API', () => {
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

    it('should create a new project', async () => {
        const res = await request(app)
            .post('/api/projects')
            .set('Authorization', `Bearer ${token}`)
            .send({
                title: 'Test Project',
                description: 'A test project',
                tags: ['tag1'],
                maxMembers: 5
            });

        expect(res.statusCode).toBe(201);
        expect(res.body.title).toBe('Test Project');
        expect(res.body.owner.toString()).toBe(user._id.toString());
    });

    it('should join a project', async () => {
        const otherUser = await User.create({ name: 'Bob', email: 'bob@test.com', password: 'password123' });
        const project = await Project.create({
            title: 'Other Project',
            description: 'Bob\'s project',
            owner: otherUser._id,
            members: [otherUser._id],
            maxMembers: 5
        });

        const res = await request(app)
            .post(`/api/projects/${project._id}/join`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.members).toContain(user._id.toString());
    });

    it('should list projects with filters', async () => {
        await Project.create({
            title: 'React Project',
            description: 'Learn React',
            owner: user._id,
            tags: ['React']
        });

        const res = await request(app)
            .get('/api/projects')
            .query({ tag: 'React' });

        expect(res.statusCode).toBe(200);
        expect(res.body.length).toBe(1);
    });
});
