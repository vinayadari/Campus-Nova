import React, { useMemo } from 'react';

/**
 * Computes a profile completeness score (0–100) and lists missing items.
 * Completely frontend-only — no backend changes needed.
 */
const checks = [
    { key: 'name', label: 'Full name', weight: 10, test: u => !!u.name?.trim() },
    { key: 'bio', label: 'Bio', weight: 10, test: u => !!u.bio?.trim() },
    { key: 'avatar', label: 'Profile photo', weight: 10, test: u => !!u.avatar?.trim() },
    { key: 'university', label: 'University', weight: 10, test: u => !!u.university?.trim() },
    { key: 'major', label: 'Major', weight: 5, test: u => !!u.major?.trim() },
    { key: 'skills', label: 'At least 2 skills', weight: 15, test: u => u.skills?.length >= 2 },
    { key: 'interests', label: 'Interests', weight: 10, test: u => u.interests?.length >= 1 },
    { key: 'lookingFor', label: 'Looking for', weight: 10, test: u => u.lookingFor?.length >= 1 },
    { key: 'github', label: 'GitHub link', weight: 5, test: u => !!u.github?.trim() },
    { key: 'linkedin', label: 'LinkedIn link', weight: 5, test: u => !!u.linkedin?.trim() },
    { key: 'portfolio', label: 'Portfolio link', weight: 5, test: u => !!u.portfolio?.trim() },
    { key: 'connections', label: '1+ connections', weight: 5, test: u => u.connections?.length >= 1 },
];

const getLevelInfo = (score) => {
    if (score >= 90) return { label: 'Elite', color: '#f59e0b', emoji: '🏆' };
    if (score >= 75) return { label: 'Strong', color: '#6366f1', emoji: '🚀' };
    if (score >= 50) return { label: 'Growing', color: '#3b82f6', emoji: '📈' };
    if (score >= 25) return { label: 'Starter', color: '#10b981', emoji: '🌱' };
    return { label: 'Incomplete', color: '#94a3b8', emoji: '📝' };
};

const ProfileStrengthMeter = ({ user, onEditClick }) => {
    const { score, missing } = useMemo(() => {
        let total = 0;
        const miss = [];
        for (const c of checks) {
            if (c.test(user)) {
                total += c.weight;
            } else {
                miss.push({ label: c.label, weight: c.weight });
            }
        }
        return { score: Math.min(100, total), missing: miss.slice(0, 3) };
    }, [user]);

    const level = getLevelInfo(score);
    const circumference = 2 * Math.PI * 28; // r=28

    return (
        <div className="card">
            <h3 className="text-sm font-bold mb-4" style={{ color: '#f1f3f9' }}>Profile Strength</h3>

            {/* Circular gauge */}
            <div className="flex items-center gap-5 mb-4">
                <div className="relative w-20 h-20 shrink-0">
                    <svg viewBox="0 0 64 64" className="w-full h-full -rotate-90">
                        <circle cx="32" cy="32" r="28" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
                        <circle cx="32" cy="32" r="28" fill="none"
                            stroke={level.color} strokeWidth="6"
                            strokeDasharray={circumference}
                            strokeDashoffset={circumference * (1 - score / 100)}
                            strokeLinecap="round"
                            style={{ transition: 'stroke-dashoffset 0.8s ease' }}
                        />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-lg font-black leading-none" style={{ color: '#f1f3f9' }}>{score}</span>
                        <span className="text-[9px] font-bold" style={{ color: '#636b8a' }}>/ 100</span>
                    </div>
                </div>

                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-xl">{level.emoji}</span>
                        <span className="text-sm font-black" style={{ color: level.color }}>{level.label}</span>
                    </div>
                    <p className="text-xs leading-relaxed" style={{ color: '#a0a6c4' }}>
                        {score === 100
                            ? 'Your profile is complete! 🎉'
                            : `Complete your profile to improve your visibility.`}
                    </p>
                </div>
            </div>

            {/* Missing items */}
            {missing.length > 0 && (
                <div className="space-y-2 mb-4">
                    {missing.map((m, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-xs" style={{ color: '#a0a6c4' }}>
                            <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: 'rgba(255,255,255,0.2)' }} />
                            <span>{m.label}</span>
                            <span className="ml-auto font-semibold" style={{ color: '#a5b4fc' }}>+{m.weight}pts</span>
                        </div>
                    ))}
                </div>
            )}

            {missing.length > 0 && (
                <button onClick={onEditClick}
                    className="w-full btn-primary text-xs py-2">
                    Complete Profile →
                </button>
            )}
        </div>
    );
};

export default ProfileStrengthMeter;
