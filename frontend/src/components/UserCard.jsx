import React from 'react';
import { Link } from 'react-router-dom';

const socialIcons = (user) => [
    user.github && {
        href: user.github, label: 'GitHub', color: '#a5b4fc', icon: (
            <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 14, height: 14 }}>
                <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
            </svg>
        )
    },
    user.linkedin && {
        href: user.linkedin, label: 'LinkedIn', color: '#60a5fa', icon: (
            <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 14, height: 14 }}>
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
            </svg>
        )
    },
    user.twitter && {
        href: user.twitter, label: 'Twitter', color: '#38bdf8', icon: (
            <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 14, height: 14 }}>
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
        )
    },
    user.portfolio && {
        href: user.portfolio, label: 'Portfolio', color: '#22d3ee', icon: (
            <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: 14, height: 14 }}>
                <path fillRule="evenodd" d="M4.25 2A2.25 2.25 0 002 4.25v11.5A2.25 2.25 0 004.25 18h11.5A2.25 2.25 0 0018 15.75V4.25A2.25 2.25 0 0015.75 2H4.25zm4.03 6.28a.75.75 0 00-1.06-1.06L4.97 9.47a.75.75 0 000 1.06l2.25 2.25a.75.75 0 001.06-1.06L6.56 10l1.72-1.72zm4.5-1.06a.75.75 0 10-1.06 1.06L13.44 10l-1.72 1.72a.75.75 0 101.06 1.06l2.25-2.25a.75.75 0 000-1.06l-2.25-2.25z" clipRule="evenodd" />
            </svg>
        )
    },
].filter(Boolean);

const UserCard = ({ user, onConnect, connectState = 'idle' }) => {
    const { name, major, university, skills = [], interests = [], collabScore, _id, avatar } = user;

    const getScoreBadge = (score) => {
        if (score >= 80) return { color: '#34d399', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.25)', label: 'Excellent' };
        if (score >= 60) return { color: '#a5b4fc', bg: 'rgba(99,102,241,0.12)', border: 'rgba(99,102,241,0.25)', label: 'Strong' };
        if (score >= 40) return { color: '#fbbf24', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.25)', label: 'Good' };
        return { color: '#94a3b8', bg: 'rgba(148,163,184,0.1)', border: 'rgba(148,163,184,0.2)', label: 'Low' };
    };

    const score = getScoreBadge(collabScore);
    const initials = name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    const socials = socialIcons(user);

    const SKILL_COLORS = [
        { bg: 'rgba(99,102,241,0.12)', color: '#a5b4fc', border: 'rgba(99,102,241,0.2)' },
        { bg: 'rgba(139,92,246,0.12)', color: '#c4b5fd', border: 'rgba(139,92,246,0.2)' },
        { bg: 'rgba(236,72,153,0.12)', color: '#f9a8d4', border: 'rgba(236,72,153,0.2)' },
        { bg: 'rgba(14,165,233,0.12)', color: '#7dd3fc', border: 'rgba(14,165,233,0.2)' },
        { bg: 'rgba(16,185,129,0.12)', color: '#6ee7b7', border: 'rgba(16,185,129,0.2)' },
    ];

    return (
        <div className="card-hover flex flex-col group cursor-default">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
                <Link to={`/profile/${_id}`} className="flex items-center gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-2xl shrink-0 overflow-hidden"
                        style={{ border: '1.5px solid rgba(99,102,241,0.2)' }}>
                        {avatar ? (
                            <img src={avatar} alt={name} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-sm font-bold"
                                style={{ background: 'rgba(99,102,241,0.15)', color: '#a5b4fc' }}>
                                {initials}
                            </div>
                        )}
                    </div>
                    <div className="min-w-0">
                        <h3 className="font-bold text-sm leading-tight truncate transition-colors"
                            style={{ color: '#f1f3f9' }}>{name}</h3>
                        <p className="text-xs truncate mt-0.5" style={{ color: '#636b8a' }}>{major}</p>
                    </div>
                </Link>
                <div className="badge shrink-0 text-[10px] ml-2"
                    style={{ background: score.bg, color: score.color, border: `1px solid ${score.border}` }}>
                    ⚡ {collabScore}%
                </div>
            </div>

            {/* University */}
            <p className="text-xs mb-4 flex items-center gap-1.5" style={{ color: '#636b8a' }}>
                <svg viewBox="0 0 16 16" fill="currentColor" style={{ width: 12, height: 12, flexShrink: 0, color: '#4a5280' }}>
                    <path d="M8 0l8 4-8 4L0 4l8-4zM0 7.5l8 4 8-4v2l-8 4-8-4v-2z" />
                </svg>
                <span className="truncate">{university || 'Global Student'}</span>
            </p>

            {/* Skills */}
            <div className="mb-3">
                <p className="section-label mb-2">Skills</p>
                <div className="flex flex-wrap gap-1.5">
                    {skills.slice(0, 4).map((s, i) => {
                        const c = SKILL_COLORS[i % SKILL_COLORS.length];
                        return (
                            <span key={i} className="px-2 py-0.5 rounded-md text-[11px] font-medium"
                                style={{ background: c.bg, color: c.color, border: `1px solid ${c.border}` }}>
                                {s}
                            </span>
                        );
                    })}
                    {skills.length > 4 && <span className="text-[10px] self-center" style={{ color: '#636b8a' }}>+{skills.length - 4}</span>}
                </div>
            </div>

            {/* Interests */}
            <div className="mb-4 flex-1">
                <p className="section-label mb-2">Interests</p>
                <div className="flex flex-wrap gap-1.5">
                    {interests.slice(0, 3).map((v, i) => (
                        <span key={i} className="px-2 py-0.5 rounded-md text-[11px] font-medium"
                            style={{ background: 'rgba(99,102,241,0.1)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.15)' }}>
                            {v}
                        </span>
                    ))}
                    {interests.length > 3 && <span className="text-[10px] self-center" style={{ color: '#636b8a' }}>+{interests.length - 3}</span>}
                </div>
            </div>

            {/* Socials */}
            {socials.length > 0 && (
                <div className="flex gap-1.5 mb-3">
                    {socials.map(s => (
                        <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer"
                            title={s.label}
                            className="w-7 h-7 rounded-lg flex items-center justify-center transition-all"
                            style={{ background: 'rgba(255,255,255,0.05)', color: s.color }}
                            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}>
                            {s.icon}
                        </a>
                    ))}
                </div>
            )}

            {/* Action */}
            <div className="pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                {connectState === 'connected' ? (
                    <div className="flex items-center justify-center gap-2 py-2 text-sm font-semibold" style={{ color: '#34d399' }}>
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#34d399' }}></span>
                        Connected
                    </div>
                ) : connectState === 'sent' ? (
                    <button disabled className="w-full py-2 text-sm font-semibold rounded-xl cursor-default"
                        style={{ background: 'rgba(245,158,11,0.1)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.2)' }}>
                        Request Sent
                    </button>
                ) : (
                    <button
                        onClick={() => onConnect(_id)}
                        className="btn-primary w-full py-2 text-sm"
                    >
                        Connect
                    </button>
                )}
                <p className="text-center text-[10px] font-medium mt-1.5" style={{ color: '#636b8a' }}>{score.label} Match</p>
            </div>
        </div>
    );
};

export default UserCard;
