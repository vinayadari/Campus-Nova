const express = require('express');
const Chatroom = require('../models/Chatroom');
const Message = require('../models/Message');
const auth = require('../middleware/auth');

const router = express.Router();

router.use(auth);

// GET /api/messages/rooms
router.get('/rooms', async (req, res) => {
    try {
        const rooms = await Chatroom.find({ participants: req.user._id })
            .populate('participants', 'name avatar')
            .sort({ lastMessageAt: -1 });

        res.json(rooms);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/messages/:roomId
router.get('/:roomId', async (req, res) => {
    try {
        const messages = await Message.find({ room: req.params.roomId })
            .populate('sender', 'name avatar')
            .sort({ createdAt: 1 })
            .limit(100);

        res.json(messages);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
