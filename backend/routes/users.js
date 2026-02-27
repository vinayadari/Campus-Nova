const express = require('express');
const User = require('../models/User');
const Chatroom = require('../models/Chatroom');
const auth = require('../middleware/auth');

const router = express.Router();

router.use(auth);

// ════════════════════════════════════════════════════════════════
// Static routes MUST come before /:id to avoid path conflicts
// ════════════════════════════════════════════════════════════════

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

// PATCH /api/users/me
router.patch('/me', async (req, res) => {
    try {
        const allowed = [
            'name', 'bio', 'university', 'major', 'year',
            'skills', 'interests', 'lookingFor',
            'avatar', 'github', 'linkedin', 'portfolio',
            'twitter', 'instagram', 'discord',
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

// GET /api/users/leaderboard — real scoring algorithm for ALL users
router.get('/leaderboard', async (req, res) => {
    try {
        const users = await User.find({})
            .select('name avatar major university campusCredits connections skills interests lookingFor bio github linkedin portfolio');

        const maxCredits = Math.max(1, ...users.map(u => u.campusCredits || 0));
        const maxConnections = Math.max(1, ...users.map(u => u.connections?.length || 0));

        const scored = users.map(u => {
            // 1) Campus Credits factor (0–40 pts)
            const creditScore = Math.round(((u.campusCredits || 0) / maxCredits) * 40);

            // 2) Connections factor (0–25 pts)
            const connScore = Math.round(((u.connections?.length || 0) / maxConnections) * 25);

            // 3) Profile completeness (0–20 pts)
            let filled = 0;
            if (u.name?.trim()) filled++;
            if (u.bio?.trim()) filled++;
            if (u.avatar?.trim()) filled++;
            if (u.university?.trim()) filled++;
            if (u.major?.trim()) filled++;
            if (u.github?.trim()) filled++;
            if (u.linkedin?.trim()) filled++;
            if (u.portfolio?.trim()) filled++;
            if (u.skills?.length >= 2) filled++;
            if (u.interests?.length >= 1) filled++;
            if (u.lookingFor?.length >= 1) filled++;
            const profileScore = Math.round((filled / 11) * 20);

            // 4) Skills diversity (0–15 pts)
            const skillsCount = Math.min(u.skills?.length || 0, 10);
            const skillScore = Math.round((skillsCount / 10) * 15);

            const totalScore = creditScore + connScore + profileScore + skillScore;

            return {
                _id: u._id,
                name: u.name,
                avatar: u.avatar,
                major: u.major,
                university: u.university,
                campusCredits: u.campusCredits || 0,
                connections: u.connections,
                skills: u.skills,
                leaderboardScore: totalScore,
            };
        });

        scored.sort((a, b) => b.leaderboardScore - a.leaderboardScore);

        res.json(scored);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/users/me/bookmark/:eventId — toggle bookmark
router.post('/me/bookmark/:eventId', async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        const { eventId } = req.params;
        const idx = user.bookmarks.findIndex(b => b.equals(eventId));
        if (idx === -1) {
            user.bookmarks.push(eventId);
        } else {
            user.bookmarks.splice(idx, 1);
        }
        await user.save();
        res.json({ bookmarks: user.bookmarks });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/users/me/bookmarks — get bookmarked events
router.get('/me/bookmarks', async (req, res) => {
    try {
        const user = await User.findById(req.user._id).populate({
            path: 'bookmarks',
            populate: { path: 'organizer', select: 'name avatar' }
        });
        res.json(user.bookmarks);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ════════════════════════════════════════════════════════════════
// Dynamic :id routes MUST come AFTER all /static routes
// ════════════════════════════════════════════════════════════════

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

        const io = req.app.get('io');
        if (io) {
            io.to(targetId).emit('connection_request_received', {
                _id: currentUser._id,
                name: currentUser.name,
                avatar: currentUser.avatar,
                major: currentUser.major
            });
        }

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
        // +10 credits for connecting
        currentUser.campusCredits = (currentUser.campusCredits || 0) + 10;
        senderUser.campusCredits = (senderUser.campusCredits || 0) + 10;

        currentUser.pendingRequests = currentUser.pendingRequests.filter(
            (p) => !p.equals(senderId)
        );
        senderUser.sentRequests = senderUser.sentRequests.filter(
            (s) => !s.equals(req.user._id)
        );

        await currentUser.save();
        await senderUser.save();

        // Check if an intro room already exists — upgrade it instead of creating new
        let chatroom = await Chatroom.findOne({
            participants: { $all: [req.user._id, senderId] },
        });

        if (chatroom) {
            chatroom.isIntro = false;
            await chatroom.save();
        } else {
            chatroom = await Chatroom.create({
                participants: [req.user._id, senderId],
                isIntro: false,
            });
        }

        const io = req.app.get('io');
        if (io) {
            // Notify sender that their request was accepted
            io.to(senderId).emit('connection_accepted', {
                _id: currentUser._id,
                name: currentUser.name,
                avatar: currentUser.avatar
            });
            // Update leaderboard if anyone's looking
            io.emit('leaderboard_update', { userId: req.user._id, credits: currentUser.campusCredits });
            io.emit('leaderboard_update', { userId: senderId, credits: senderUser.campusCredits });
        }

        res.json({ message: 'Connection accepted.', chatroom });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
