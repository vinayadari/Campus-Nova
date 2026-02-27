import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';

const MEDAL = ['🥇', '🥈', '🥉'];
const PODIUM_COLORS = ['#f59e0b', '#94a3b8', '#cd7c32'];

const creditSources = [
    { icon: '🤝', action: 'Accept a connection', credits: 10 },
    { icon: '📅', action: 'RSVP to an event', credits: 5 },
    { icon: '🚀', action: 'Create a project', credits: 8 },
    { icon: '✨', action: 'Complete profile', credits: 20 },
];

const ACHIEVEMENTS = [
    { icon: '🌟', label: 'First Connection', threshold: 1, type: 'connections' },
    { icon: '🔥', label: 'Social Butterfly', threshold: 5, type: 'connections' },
    { icon: '👑', label: 'Networker', threshold: 10, type: 'connections' },
    { icon: '⚡', label: 'Credit Starter', threshold: 10, type: 'credits' },
    { icon: '💎', label: 'Credit Pro', threshold: 50, type: 'credits' },
];

const getLevel = (credits) => {
    if (credits >= 100) return { label: 'Legend', color: '#f59e0b', icon: '👑' };
    if (credits >= 50) return { label: 'Pro', color: '#22d3ee', icon: '💎' };
    if (credits >= 20) return { label: 'Rising', color: '#3b82f6', icon: '🚀' };
    if (credits >= 10) return { label: 'Active', color: '#10b981', icon: '⚡' };
    return { label: 'Newbie', color: '#94a3b8', icon: '🌱' };
};

const SkeletonRow = () => (
    <div className="flex items-center gap-4 px-5 py-3.5 animate-pulse">
        <div className="skeleton w-6 h-4 rounded" />
        <div className="skeleton w-10 h-10 rounded-full" />
        <div className="flex-1 space-y-2">
            <div className="skeleton h-3.5 w-1/3 rounded" />
            <div className="skeleton h-2.5 w-1/4 rounded" />
        </div>
        <div className="skeleton h-7 w-16 rounded-lg" />
    </div>
);

const Leaderboard = () => {
    const { user: currentUser } = useAuth();
    const [leaders, setLeaders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const { socket } = useSocket();

    const fetchLeaderboard = async () => {
        try {
            const res = await api.get('/users/leaderboard');
            setLeaders(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLeaderboard();
    }, []);

    useEffect(() => {
        if (!socket) return;
        socket.on('leaderboard_update', fetchLeaderboard);
        return () => socket.off('leaderboard_update', fetchLeaderboard);
    }, [socket]);

    const getInitials = (name) => name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

    const filtered = filter === 'connected'
        ? leaders.filter(u => currentUser.connections?.some(c => c === u._id || c?._id === u._id))
        : leaders;

    const myRank = leaders.findIndex(u => u._id === currentUser._id);
    const myData = leaders.find(u => u._id === currentUser._id);
    const myLevel = getLevel(myData?.campusCredits || 0);
    const top3 = filtered.slice(0, 3);

    return (
        <div className="space-y-6">
            {/* ══ HEADER ══ */}
            <div className="relative rounded-3xl overflow-hidden p-7"
                style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4c1d95 100%)' }}>
                {/* Decorative */}
                <div style={{ position: 'absolute', top: -60, right: -60, width: 220, height: 220, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
                <div style={{ position: 'absolute', bottom: -40, left: 40, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />

                <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-5">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-white/50 mb-1">StudyMesh</p>
                        <h1 className="text-3xl font-black text-white">Campus Leaderboard 🏆</h1>
                        <p className="text-white/60 text-sm mt-1">Ranked by a real algorithm: credits (40%) + connections (25%) + profile (20%) + skills (15%)</p>
                    </div>
                    {/* My rank chip */}
                    <div className="flex gap-3 shrink-0 flex-wrap">
                        <div className="px-5 py-3 rounded-2xl text-center"
                            style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)' }}>
                            <p className="text-xs font-bold text-white/60 mb-0.5">My Rank</p>
                            <p className="text-2xl font-black text-white">
                                {myRank >= 0 ? `#${myRank + 1}` : '—'}
                            </p>
                        </div>
                        <div className="px-5 py-3 rounded-2xl text-center"
                            style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)' }}>
                            <p className="text-xs font-bold text-white/60 mb-0.5">Score</p>
                            <p className="text-2xl font-black text-white">{myData?.leaderboardScore || 0}<span className="text-sm text-white/50">/100</span></p>
                        </div>
                        <div className="px-5 py-3 rounded-2xl text-center"
                            style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)' }}>
                            <p className="text-xs font-bold text-white/60 mb-0.5">Credits</p>
                            <p className="text-2xl font-black text-white">{myData?.campusCredits || 0} ⚡</p>
                        </div>
                        <div className="px-5 py-3 rounded-2xl text-center"
                            style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)' }}>
                            <p className="text-xs font-bold text-white/60 mb-0.5">Level</p>
                            <p className="text-xl font-black text-white">{myLevel.icon} {myLevel.label}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

                {/* ══ MAIN LIST ══ */}
                <div className="lg:col-span-2 space-y-4">

                    {/* Filters */}
                    <div className="flex gap-2">
                        {['all', 'connected'].map(f => (
                            <button key={f} onClick={() => setFilter(f)}
                                className="px-4 py-2 text-xs font-bold rounded-xl transition-all capitalize"
                                style={{
                                    background: filter === f ? '#4f46e5' : 'rgba(22,25,56,0.8)',
                                    color: filter === f ? 'white' : '#a0a6c4',
                                    border: `1.5px solid ${filter === f ? '#4f46e5' : 'rgba(255,255,255,0.08)'}`,
                                    boxShadow: filter === f ? '0 4px 14px rgba(79,70,229,0.3)' : 'none',
                                }}>
                                {f === 'all' ? '🌍 All Students' : '🔗 My Network'}
                            </button>
                        ))}
                    </div>

                    {/* Podium (top 3, all view) */}
                    {!loading && filter === 'all' && top3.length >= 3 && (
                        <div className="card overflow-hidden !p-0">
                            <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                                <p className="text-xs font-black uppercase tracking-widest" style={{ color: '#636b8a' }}>🏆 Hall of Fame</p>
                            </div>
                            <div className="flex items-end justify-center gap-4 pt-6 pb-4"
                                style={{ background: 'linear-gradient(135deg,rgba(79,70,229,0.1),rgba(139,92,246,0.05))' }}>
                                {/* 2nd */}
                                <div className="flex flex-col items-center gap-2">
                                    <span className="text-2xl">🥈</span>
                                    <Link to={`/profile/${top3[1]?._id}`}
                                        className="w-16 h-16 rounded-2xl overflow-hidden shadow-md flex items-center justify-center text-sm font-bold"
                                        style={{ border: '2px solid rgba(255,255,255,0.1)', background: 'rgba(99,102,241,0.12)', color: '#a5b4fc' }}>
                                        {top3[1]?.avatar ? <img src={top3[1].avatar} className="w-full h-full object-cover" alt="" /> : getInitials(top3[1]?.name)}
                                    </Link>
                                    <div className="text-center">
                                        <p className="text-xs font-bold max-w-[80px] truncate" style={{ color: '#f1f3f9' }}>{top3[1]?.name?.split(' ')[0]}</p>
                                        <p className="text-[10px] font-black" style={{ color: '#94a3b8' }}>{top3[1]?.leaderboardScore || 0}pts</p>
                                    </div>
                                    <div className="w-14 rounded-t-lg h-10" style={{ background: 'linear-gradient(180deg,#cbd5e1,#94a3b8)' }} />
                                </div>
                                {/* 1st */}
                                <div className="flex flex-col items-center gap-2 -mt-6">
                                    <span className="text-3xl">🥇</span>
                                    <Link to={`/profile/${top3[0]?._id}`}
                                        className="w-20 h-20 rounded-2xl overflow-hidden border-4 shadow-xl flex items-center justify-center text-lg font-bold"
                                        style={{ borderColor: '#fcd34d', background: 'rgba(99,102,241,0.15)', color: '#a5b4fc', position: 'relative', zIndex: 10 }}>
                                        {top3[0]?.avatar ? <img src={top3[0].avatar} className="w-full h-full object-cover" alt="" /> : getInitials(top3[0]?.name)}
                                    </Link>
                                    <div className="text-center">
                                        <p className="text-sm font-black max-w-[90px] truncate" style={{ color: '#f1f3f9' }}>{top3[0]?.name?.split(' ')[0]}</p>
                                        <p className="text-xs font-black" style={{ color: '#f59e0b' }}>{top3[0]?.leaderboardScore || 0}pts</p>
                                    </div>
                                    <div className="w-14 rounded-t-lg h-16" style={{ background: 'linear-gradient(180deg,#fcd34d,#f59e0b)' }} />
                                </div>
                                {/* 3rd */}
                                <div className="flex flex-col items-center gap-2">
                                    <span className="text-2xl">🥉</span>
                                    <Link to={`/profile/${top3[2]?._id}`}
                                        className="w-16 h-16 rounded-2xl overflow-hidden shadow-md flex items-center justify-center text-sm font-bold"
                                        style={{ border: '2px solid rgba(255,255,255,0.1)', background: 'rgba(99,102,241,0.12)', color: '#a5b4fc' }}>
                                        {top3[2]?.avatar ? <img src={top3[2].avatar} className="w-full h-full object-cover" alt="" /> : getInitials(top3[2]?.name)}
                                    </Link>
                                    <div className="text-center">
                                        <p className="text-xs font-bold max-w-[80px] truncate" style={{ color: '#f1f3f9' }}>{top3[2]?.name?.split(' ')[0]}</p>
                                        <p className="text-[10px] font-black" style={{ color: '#cd7c32' }}>{top3[2]?.leaderboardScore || 0}pts</p>
                                    </div>
                                    <div className="w-14 rounded-t-lg h-6" style={{ background: 'linear-gradient(180deg,#d97706,#92400e)' }} />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Full ranked list */}
                    <div className="rounded-2xl overflow-hidden"
                        style={{ background: 'var(--color-surface)', border: '1px solid rgba(255,255,255,0.06)', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
                        <div className="px-5 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                            <p className="text-xs font-black uppercase tracking-widest" style={{ color: '#636b8a' }}>Full Rankings</p>
                            <p className="text-xs" style={{ color: '#a0a6c4' }}>{filtered.length} students</p>
                        </div>
                        <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                            {loading ? (
                                Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
                            ) : filtered.length === 0 ? (
                                <div className="py-16 text-center">
                                    <p className="text-3xl mb-2">🔗</p>
                                    <p className="text-sm font-bold" style={{ color: '#f1f3f9' }}>No connections yet</p>
                                    <p className="text-xs mt-1" style={{ color: '#636b8a' }}>Connect with students to see their rankings here.</p>
                                </div>
                            ) : (
                                filtered.map((u, idx) => {
                                    const isMe = u._id === currentUser._id;
                                    const rank = leaders.findIndex(l => l._id === u._id);
                                    const lvl = getLevel(u.campusCredits || 0);
                                    return (
                                        <div key={u._id}
                                            className="flex items-center gap-4 px-5 py-3 transition-colors"
                                            style={{ background: isMe ? 'rgba(99,102,241,0.08)' : 'transparent' }}>
                                            {/* Rank */}
                                            <div className="w-7 text-center shrink-0">
                                                {rank < 3 && filter === 'all'
                                                    ? <span className="text-lg">{MEDAL[rank]}</span>
                                                    : <span className="text-sm font-black" style={{ color: '#636b8a' }}>#{rank + 1}</span>}
                                            </div>
                                            {/* Avatar */}
                                            <Link to={isMe ? '/profile' : `/profile/${u._id}`}
                                                className="w-10 h-10 rounded-full overflow-hidden shrink-0 flex items-center justify-center text-xs font-bold"
                                                style={{ border: '1.5px solid rgba(255,255,255,0.1)', background: 'rgba(99,102,241,0.12)', color: '#a5b4fc' }}>
                                                {u.avatar ? <img src={u.avatar} alt={u.name} className="w-full h-full object-cover" /> : getInitials(u.name)}
                                            </Link>
                                            {/* Info */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <Link to={isMe ? '/profile' : `/profile/${u._id}`}
                                                        className="text-sm font-bold hover:underline transition-colors truncate"
                                                        style={{ color: '#f1f3f9' }}>
                                                        {u.name}
                                                    </Link>
                                                    {isMe && <span className="text-[9px] font-black px-2 py-0.5 rounded-md bg-[#4f46e5] text-white">YOU</span>}
                                                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md" style={{ background: 'rgba(255,255,255,0.06)', color: lvl.color }}>
                                                        {lvl.icon} {lvl.label}
                                                    </span>
                                                </div>
                                                <p className="text-xs truncate" style={{ color: '#636b8a' }}>{u.major || 'Student'} · {u.connections?.length || 0} connections</p>
                                            </div>
                                            {/* Score + Credits */}
                                            <div className="flex items-center gap-2 shrink-0">
                                                <div className="px-2.5 py-1 rounded-lg text-xs font-black"
                                                    style={{ background: 'rgba(245,158,11,0.12)', color: '#fbbf24' }}>
                                                    {u.leaderboardScore || 0}pts
                                                </div>
                                                <div className="px-3 py-1.5 rounded-xl text-sm font-black"
                                                    style={{ background: isMe ? '#4f46e5' : 'rgba(99,102,241,0.12)', color: isMe ? 'white' : '#a5b4fc' }}>
                                                    {u.campusCredits || 0} ⚡
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>

                {/* ══ RIGHT PANEL ══ */}
                <div className="space-y-4">

                    {/* How to earn */}
                    <div className="card">
                        <h3 className="text-xs font-black uppercase tracking-widest mb-4" style={{ color: '#a0a6c4' }}>💰 How to Earn Credits</h3>
                        <div className="space-y-3">
                            {creditSources.map(({ icon, action, credits }) => (
                                <div key={action} className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-xl flex items-center justify-center text-base shrink-0"
                                        style={{ background: 'rgba(255,255,255,0.06)' }}>
                                        {icon}
                                    </div>
                                    <span className="text-xs flex-1" style={{ color: '#a0a6c4' }}>{action}</span>
                                    <span className="text-xs font-black" style={{ color: '#a5b4fc' }}>+{credits} ⚡</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Levels */}
                    <div className="card">
                        <h3 className="text-xs font-black uppercase tracking-widest mb-4" style={{ color: '#a0a6c4' }}>🏅 Credit Levels</h3>
                        <div className="space-y-2.5">
                            {[
                                { label: 'Legend', min: 100, icon: '👑', color: '#f59e0b' },
                                { label: 'Pro', min: 50, icon: '💎', color: '#22d3ee' },
                                { label: 'Rising', min: 20, icon: '🚀', color: '#3b82f6' },
                                { label: 'Active', min: 10, icon: '⚡', color: '#10b981' },
                                { label: 'Newbie', min: 0, icon: '🌱', color: '#94a3b8' },
                            ].map(l => (
                                <div key={l.label} className="flex items-center gap-2.5">
                                    <span className="text-base">{l.icon}</span>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-center mb-0.5">
                                            <span className="text-xs font-bold" style={{ color: l.color }}>{l.label}</span>
                                            <span className="text-[9px]" style={{ color: '#636b8a' }}>{l.min}+ credits</span>
                                        </div>
                                        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                                            <div className="h-full rounded-full transition-all"
                                                style={{ width: `${Math.min(100, ((myData?.campusCredits || 0) - l.min) / Math.max(1, l.min) * 100)}%`, background: l.color, opacity: (myData?.campusCredits || 0) >= l.min ? 1 : 0.25 }} />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Pro Tip */}
                    <div className="card" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.15)' }}>
                        <p className="text-xs font-black mb-2" style={{ color: '#fbbf24' }}>💡 Pro Tip</p>
                        <p className="text-xs leading-relaxed" style={{ color: '#fcd34d' }}>
                            Complete your entire profile to unlock a <strong>+20 credit bonus</strong> instantly and boost your discovery ranking!
                        </p>
                        <Link to="/profile" className="mt-3 inline-block text-xs font-black underline" style={{ color: '#fbbf24' }}>
                            Complete profile →
                        </Link>
                    </div>

                    {/* Achievements */}
                    <div className="card">
                        <h3 className="text-xs font-black uppercase tracking-widest mb-3" style={{ color: '#a0a6c4' }}>🎖 My Achievements</h3>
                        <div className="grid grid-cols-3 gap-2">
                            {ACHIEVEMENTS.map(a => {
                                const val = a.type === 'credits'
                                    ? (myData?.campusCredits || 0)
                                    : (myData?.connections?.length || 0);
                                const unlocked = val >= a.threshold;
                                return (
                                    <div key={a.label} title={`${a.label} — ${unlocked ? 'Unlocked!' : `Need ${a.threshold} ${a.type}`}`}
                                        className="flex flex-col items-center gap-1 p-2 rounded-xl"
                                        style={{ background: unlocked ? 'rgba(99,102,241,0.12)' : 'rgba(255,255,255,0.04)', opacity: unlocked ? 1 : 0.4 }}>
                                        <span className="text-xl">{a.icon}</span>
                                        <span className="text-[9px] font-bold text-center leading-tight" style={{ color: '#a0a6c4' }}>{a.label}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Leaderboard;
