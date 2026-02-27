const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema(
    {
        title: { type: String, required: true },
        description: { type: String, required: true },
        date: { type: Date, required: true },
        organizer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        attendees: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
        tags: [{ type: String }],
        type: {
            type: String,
            enum: ['Hackathon', 'Workshop', 'Study Group', 'Networking', 'Talk', 'Other'],
            default: 'Other',
        },
        location: { type: String, default: 'Online' },
        maxAttendees: { type: Number, default: 50 },
        link: { type: String, default: '' },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Event', eventSchema);
