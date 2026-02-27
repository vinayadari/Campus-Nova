require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const mongoose = require('mongoose');
const { Server } = require('socket.io');

const Message = require('./models/Message');
const Chatroom = require('./models/Chatroom');

const clientUrl = (process.env.CLIENT_URL || 'http://localhost:5173').trim();

// ─── Express Setup ──────────────────────────────────────────────
const app = express();
app.use(cors({
    origin: clientUrl,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// ─── Mount Routes ───────────────────────────────────────────────
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/events', require('./routes/events'));
app.use('/api/messages', require('./routes/messages'));

// Health-check endpoint
app.get('/', (_req, res) => res.json({ status: 'StudyMesh API is running 🚀' }));

// ─── HTTP + Socket.io ───────────────────────────────────────────
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: clientUrl,
        methods: ['GET', 'POST'],
        credentials: true
    },
});

const onlineUsers = new Map();

io.on('connection', (socket) => {
    console.log('⚡ Socket connected:', socket.id);

    socket.on('user_online', (userId) => {
        onlineUsers.set(userId, socket.id);
        io.emit('online_users', Array.from(onlineUsers.keys()));
    });

    socket.on('join_room', (roomId) => {
        socket.join(roomId);
    });

    socket.on('send_message', async ({ roomId, senderId, content }) => {
        try {
            let message = await Message.create({
                room: roomId,
                sender: senderId,
                content,
            });

            message = await message.populate('sender', 'name avatar');

            io.to(roomId).emit('receive_message', message);

            await Chatroom.findByIdAndUpdate(roomId, {
                lastMessage: content,
                lastMessageAt: new Date(),
            });
        } catch (err) {
            console.error('send_message error:', err.message);
        }
    });

    socket.on('typing', ({ roomId, userName }) => {
        socket.to(roomId).emit('user_typing', { userName });
    });

    socket.on('disconnect', () => {
        for (const [userId, sid] of onlineUsers.entries()) {
            if (sid === socket.id) {
                onlineUsers.delete(userId);
                break;
            }
        }
        io.emit('online_users', Array.from(onlineUsers.keys()));
        console.log('🔌 Socket disconnected:', socket.id);
    });
});

// ─── MongoDB Connection & Start ─────────────────────────────────
const PORT = process.env.PORT || 5000;

mongoose
    .connect(process.env.MONGO_URI)
    .then(() => {
        console.log('✅ MongoDB connected');
        server.listen(PORT, () => {
            console.log(`🚀 StudyMesh server listening on port ${PORT}`);
        });
    })
    .catch((err) => {
        console.error('❌ MongoDB connection error:', err.message);
        process.exit(1);
    });
