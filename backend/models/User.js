const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        email: { type: String, required: true, unique: true, lowercase: true },
        password: { type: String, required: true },
        avatar: { type: String, default: '' },
        bio: { type: String, default: '' },
        university: { type: String, default: '' },
        major: { type: String, default: '' },
        year: {
            type: String,
            enum: ['1st', '2nd', '3rd', '4th', 'Graduate', 'PhD'],
            default: '1st',
        },
        skills: [{ type: String }],
        interests: [{ type: String }],
        lookingFor: [{ type: String }],
        connections: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
        pendingRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
        sentRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
        bookmarks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Event' }],
        campusCredits: { type: Number, default: 0 },
        github: { type: String, default: '' },
        linkedin: { type: String, default: '' },
        portfolio: { type: String, default: '' },
        twitter: { type: String, default: '' },
        instagram: { type: String, default: '' },
        discord: { type: String, default: '' },
    },
    { timestamps: true }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (err) {
        next(err);
    }
});

// Compare plain-text password with hashed password
userSchema.methods.comparePassword = async function (plain) {
    return bcrypt.compare(plain, this.password);
};

// Collaboration score between this user and another user (0–100)
userSchema.methods.collabScore = function (otherUser) {
    // --- 40 pts: complementary skills (skills each lacks in the other) ---
    const mySkills = new Set(this.skills.map((s) => s.toLowerCase()));
    const theirSkills = new Set(otherUser.skills.map((s) => s.toLowerCase()));

    let complementary = 0;
    for (const s of theirSkills) {
        if (!mySkills.has(s)) complementary++;
    }
    for (const s of mySkills) {
        if (!theirSkills.has(s)) complementary++;
    }
    const totalSkills = new Set([...mySkills, ...theirSkills]).size;
    const skillScore = totalSkills > 0 ? Math.round((complementary / totalSkills) * 40) : 0;

    // --- 35 pts: shared interests ---
    const myInterests = new Set(this.interests.map((i) => i.toLowerCase()));
    const theirInterests = new Set(otherUser.interests.map((i) => i.toLowerCase()));
    let sharedInterests = 0;
    for (const i of myInterests) {
        if (theirInterests.has(i)) sharedInterests++;
    }
    const maxInterests = Math.max(myInterests.size, theirInterests.size);
    const interestScore = maxInterests > 0 ? Math.round((sharedInterests / maxInterests) * 35) : 0;

    // --- 25 pts: matching lookingFor ---
    const myLF = new Set(this.lookingFor.map((l) => l.toLowerCase()));
    const theirLF = new Set(otherUser.lookingFor.map((l) => l.toLowerCase()));
    let sharedLF = 0;
    for (const l of myLF) {
        if (theirLF.has(l)) sharedLF++;
    }
    const maxLF = Math.max(myLF.size, theirLF.size);
    const lfScore = maxLF > 0 ? Math.round((sharedLF / maxLF) * 25) : 0;

    return skillScore + interestScore + lfScore;
};

module.exports = mongoose.model('User', userSchema);
