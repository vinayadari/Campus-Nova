const { connect, close, clear } = require('./setup');
const User = require('../models/User');

beforeAll(async () => await connect());
afterEach(async () => await clear());
afterAll(async () => await close());

describe('User Model Logic', () => {
    it('should correctly calculate collabScore between users', async () => {
        const userA = new User({
            name: 'Alice',
            email: 'alice@test.com',
            password: 'password123',
            skills: ['React', 'Node.js', 'Python'],
            interests: ['AI', 'Web Dev', 'Robotics'],
            lookingFor: ['Project Partner', 'Mentor']
        });

        const userB = new User({
            name: 'Bob',
            email: 'bob@test.com',
            password: 'password123',
            skills: ['Python', 'Django', 'ML'], // Matches 'Python'
            interests: ['AI', 'Robotics', 'Music'], // Matches 'AI', 'Robotics'
            lookingFor: ['Project Partner', 'Hackathon Team'] // Matches 'Project Partner'
        });

        // 40pts skills (1 match/3 = 13.3), 35pts interests (2 matches/3 = 23.3), 25pts lookingFor (1 match = 25)
        // Total should be around 61-62
        const score = userA.collabScore(userB);
        expect(score).toBeGreaterThan(60);
        expect(score).toBeLessThan(65);
    });

    it('should hash password before saving', async () => {
        const user = new User({
            name: 'Alice',
            email: 'alice@test.com',
            password: 'password123'
        });
        await user.save();
        expect(user.password).not.toBe('password123');

        const isMatch = await user.comparePassword('password123');
        expect(isMatch).toBe(true);
    });
});
