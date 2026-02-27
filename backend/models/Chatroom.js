const mongoose = require('mongoose');

const chatroomSchema = new mongoose.Schema(
    {
        participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
        lastMessage: { type: String, default: '' },
        lastMessageAt: { type: Date, default: Date.now },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Chatroom', chatroomSchema);
