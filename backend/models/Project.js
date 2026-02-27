const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema(
    {
        title: { type: String, required: true },
        description: { type: String, required: true },
        owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
        tags: [{ type: String }],
        skillsNeeded: [{ type: String }],
        status: {
            type: String,
            enum: ['Open', 'In Progress', 'Completed'],
            default: 'Open',
        },
        maxMembers: { type: Number, default: 5 },
        deadline: { type: Date },
        githubRepo: { type: String, default: '' },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Project', projectSchema);
