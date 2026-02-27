const express = require('express');
const User = require('../models/User');
const Chatroom = require('../models/Chatroom');
const auth = require('../middleware/auth');

const router = express.Router();

router.use(auth);

// GET /api/users/discover
router.get('/discover', async (req, res) => {
    try {
        const { interests, skills, year, page = 1 } = req.query;
        const perPage = 12;
        const currentUser = await User.findById(req.user._id);

        const excludeIds = [req.user._id, ...currentUser.connections];
        const filter = { _id: { $nin: excludeIds } };

        if (year) filter.year = year;
        if (interests) {
            const list = interests.split(',').map((i) => i.trim());
            filter.interests = { $in: list };
        }
        if (skills) {
            const list = skills.split(',').map((s) => s.trim());
            filter.skills = { $in: list };
        }

        const total = await User.countDocuments(filter);
        const pages = Math.ceil(total / perPage);

        const users = await User.find(filter)
            .select('-password')
            .skip((page - 1) * perPage)
            .limit(perPage);

        const scored = users
            .map((u) => {
                const score = currentUser.collabScore(u);
                return { ...u.toObject(), collabScore: score };
            })
            .sort((a, b) => b.collabScore - a.collabScore);

        res.json({ users: scored, total, pages });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/users/me/requests
router.get('/me/requests', async (req, res) => {
    try {
        const user = await User.findById(req.user._id).populate(
            'pendingRequests',
            'name avatar major'
        );
        res.json(user.pendingRequests);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/users/:id
router.get('/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        if (!user) return res.status(404).json({ error: 'User not found.' });

        const currentUser = await User.findById(req.user._id);
        const collabScore = currentUser.collabScore(user);
        const isConnected = currentUser.connections.some((c) => c.equals(user._id));
        const hasPendingRequest =
            currentUser.pendingRequests.some((p) => p.equals(user._id)) ||
            currentUser.sentRequests.some((s) => s.equals(user._id));

        res.json({ ...user.toObject(), collabScore, isConnected, hasPendingRequest });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PATCH /api/users/me
router.patch('/me', async (req, res) => {
    try {
        const allowed = [
            'name', 'bio', 'university', 'major', 'year',
            'skills', 'interests', 'lookingFor',
            'avatar', 'github', 'linkedin', 'portfolio',
        ];
        const updates = {};
        for (const key of allowed) {
            if (req.body[key] !== undefined) updates[key] = req.body[key];
        }

        const user = await User.findByIdAndUpdate(req.user._id, updates, {
            new: true,
            runValidators: true,
        }).select('-password');

        res.json(user);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/users/:id/connect
router.post('/:id/connect', async (req, res) => {
    try {
        const targetId = req.params.id;
        if (req.user._id.equals(targetId)) {
            return res.status(400).json({ error: 'You cannot connect with yourself.' });
        }

        const currentUser = await User.findById(req.user._id);
        const targetUser = await User.findById(targetId);
        if (!targetUser) return res.status(404).json({ error: 'User not found.' });

        if (currentUser.connections.some((c) => c.equals(targetId))) {
            return res.status(400).json({ error: 'Already connected.' });
        }
        if (currentUser.sentRequests.some((s) => s.equals(targetId))) {
            return res.status(400).json({ error: 'Connection request already sent.' });
        }

        currentUser.sentRequests.push(targetId);
        targetUser.pendingRequests.push(req.user._id);

        await currentUser.save();
        await targetUser.save();

        res.json({ message: 'Connection request sent.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/users/:id/accept
router.post('/:id/accept', async (req, res) => {
    try {
        const senderId = req.params.id;
        const currentUser = await User.findById(req.user._id);
        const senderUser = await User.findById(senderId);
        if (!senderUser) return res.status(404).json({ error: 'User not found.' });

        if (!currentUser.pendingRequests.some((p) => p.equals(senderId))) {
            return res.status(400).json({ error: 'No pending request from this user.' });
        }

        currentUser.connections.push(senderId);
        senderUser.connections.push(req.user._id);

        currentUser.pendingRequests = currentUser.pendingRequests.filter(
            (p) => !p.equals(senderId)
        );
        senderUser.sentRequests = senderUser.sentRequests.filter(
            (s) => !s.equals(req.user._id)
        );

        await currentUser.save();
        await senderUser.save();

        const chatroom = await Chatroom.create({
            participants: [req.user._id, senderId],
        });

        res.json({ message: 'Connection accepted.', chatroom });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
