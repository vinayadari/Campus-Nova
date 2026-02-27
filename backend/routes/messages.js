const express = require('express');
const Chatroom = require('../models/Chatroom');
const Message = require('../models/Message');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

router.use(auth);

// ═══ Static routes first ═══

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

// POST /api/messages/intro/:userId — send a cold intro (1 message only)
router.post('/intro/:userId', async (req, res) => {
    try {
        const myId = req.user._id;
        const targetId = req.params.userId;
        const { content } = req.body;

        if (!content || !content.trim()) {
            return res.status(400).json({ error: 'Message content is required.' });
        }

        if (myId.equals(targetId)) {
            return res.status(400).json({ error: 'Cannot message yourself.' });
        }

        const currentUser = await User.findById(myId);
        const targetUser = await User.findById(targetId);
        if (!targetUser) return res.status(404).json({ error: 'User not found.' });

        // If already connected, tell them to use the regular chat
        if (currentUser.connections.some(c => c.equals(targetId))) {
            return res.status(400).json({ error: 'You are already connected. Use the regular chat.' });
        }

        // Check if an intro room already exists between these two
        let introRoom = await Chatroom.findOne({
            participants: { $all: [myId, targetId] },
            isIntro: true,
        });

        if (introRoom) {
            // Check if the current user already sent an intro message
            const existingCount = await Message.countDocuments({
                room: introRoom._id.toString(),
                sender: myId,
            });
            if (existingCount >= 1) {
                return res.status(400).json({
                    error: 'You already sent an intro message. Wait for them to accept your connection.',
                });
            }
        } else {
            introRoom = await Chatroom.create({
                participants: [myId, targetId],
                isIntro: true,
            });
        }

        // Create the single allowed intro message
        let message = await Message.create({
            room: introRoom._id.toString(),
            sender: myId,
            content: content.trim(),
        });

        message = await message.populate('sender', 'name avatar');

        await Chatroom.findByIdAndUpdate(introRoom._id, {
            lastMessage: content.trim(),
            lastMessageAt: new Date(),
        });

        res.json({ message, room: introRoom });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/messages/status/:roomId — get the chat status for a room
router.get('/status/:roomId', async (req, res) => {
    try {
        const room = await Chatroom.findById(req.params.roomId);
        if (!room) return res.status(404).json({ error: 'Room not found.' });

        if (!room.participants.some(p => p.equals(req.user._id))) {
            return res.status(403).json({ error: 'Access denied.' });
        }

        const otherUserId = room.participants.find(p => !p.equals(req.user._id));
        const currentUser = await User.findById(req.user._id);
        const isConnected = currentUser.connections.some(c => c.equals(otherUserId));

        const myMessageCount = await Message.countDocuments({
            room: req.params.roomId,
            sender: req.user._id,
        });

        res.json({
            isIntro: room.isIntro || false,
            isConnected,
            myMessageCount,
            canSend: isConnected || myMessageCount < 1,
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/messages/clear/:roomId — clear all messages in a room
router.delete('/clear/:roomId', async (req, res) => {
    try {
        const room = await Chatroom.findById(req.params.roomId);
        if (!room) return res.status(404).json({ error: 'Room not found.' });

        if (!room.participants.some(p => p.equals(req.user._id))) {
            return res.status(403).json({ error: 'Access denied.' });
        }

        await Message.deleteMany({ room: req.params.roomId });

        await Chatroom.findByIdAndUpdate(req.params.roomId, {
            lastMessage: '',
            lastMessageAt: new Date(),
        });

        const io = req.app.get('io');
        if (io) {
            io.to(req.params.roomId).emit('chat_cleared', {
                roomId: req.params.roomId,
                clearedBy: { _id: req.user._id, name: req.user.name },
            });
        }

        res.json({ message: 'Chat cleared.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ═══ Dynamic :roomId route last ═══

// GET /api/messages/:roomId
router.get('/:roomId', async (req, res) => {
    try {
        const room = await Chatroom.findById(req.params.roomId);
        if (!room) return res.status(404).json({ error: 'Room not found.' });

        if (!room.participants.some(p => p.equals(req.user._id))) {
            return res.status(403).json({ error: 'Access denied.' });
        }

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
