import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import UserCard from '../components/UserCard';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useSocket } from '../contexts/SocketContext';
import { Link } from 'react-router-dom';

/* ── Skeleton ── */
const SkeletonCard = () => (
    <div className="card flex flex-col gap-3 animate-pulse">
        <div className="flex items-center gap-3">
            <div className="skeleton w-12 h-12 rounded-2xl" />
            <div className="flex-1 space-y-2">
                <div className="skeleton h-3.5 w-3/4 rounded" />
                <div className="skeleton h-2.5 w-1/2 rounded" />
            </div>
        </div>
        <div className="flex gap-1.5">
            <div className="skeleton h-5 w-14 rounded-md" />
            <div className="skeleton h-5 w-16 rounded-md" />
        </div>
        <div className="skeleton h-9 w-full rounded-xl mt-2" />
    </div>
);

const TRENDING_SKILLS = ['React', 'Python', 'Machine Learning', 'Node.js', 'Figma', 'Flutter', 'Data Science', 'TypeScript', 'AWS', 'Blockchain'];
const CATEGORIES = [
    { label: 'All Students', icon: '👥', filter: {} },
    { label: 'Hackathon Hunters', icon: '⚡', filter: { interests: 'hackathon' } },
    { label: 'ML / AI', icon: '🤖', filter: { skills: 'machine learning' } },
    { label: 'Web Dev', icon: '🌐', filter: { skills: 'react' } },
    { label: 'Researchers', icon: '🔬', filter: { interests: 'research' } },
    { label: 'PhDs', icon: '🎓', filter: { year: 'PhD' } },
];

const StatBadge = ({ icon, label, value }) => (
    <div className="flex flex-col items-center justify-center px-6 py-4 rounded-2xl text-center"
        style={{ background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.2)' }}>
        <span className="text-2xl mb-1">{icon}</span>
        <p className="text-white font-black text-xl leading-none">{value}</p>
        <p className="text-white/70 text-xs mt-0.5">{label}</p>
    </div>
);

const Discovery = () => {
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [params, setParams] = useState({ skills: '', interests: '', year: '', page: 1 });
    const [hasMore, setHasMore] = useState(false);
    const [activeCategory, setActiveCategory] = useState(0);
    const [activeSkill, setActiveSkill] = useState('');
    const { show } = useToast();
    const { socket } = useSocket();

    const fetchUsers = useCallback(async (isLoadMore = false) => {
        setLoading(true);
        try {
            const res = await api.get('/users/discover', { params });
            if (isLoadMore) {
                setUsers(prev => [...prev, ...res.data.users]);
            } else {
                setUsers(res.data.users);
            }
            setHasMore(res.data.pages > params.page);
        } catch (err) {
            console.error('Failed to fetch users', err);
        } finally {
            setLoading(false);
        }
    }, [params]);

    useEffect(() => { fetchUsers(params.page > 1); }, [params.page]);
    useEffect(() => {
        if (params.page === 1) fetchUsers();
        else setParams(prev => ({ ...prev, page: 1 }));
    }, [params.skills, params.interests, params.year]);

    useEffect(() => {
        if (!socket) return;
        const handleConnectionAccepted = (acceptorData) => {
            setUsers(prev => prev.filter(u => u._id !== acceptorData._id));
        };
        socket.on('connection_accepted', handleConnectionAccepted);
        return () => {
            socket.off('connection_accepted', handleConnectionAccepted);
        };
    }, [socket]);

    const handleConnect = async (userId) => {
        try {
            await api.post(`/users/${userId}/connect`);
            setUsers(prev => prev.map(u => u._id === userId ? { ...u, hasPendingRequest: true } : u));
            show('Connection request sent! 🤝', 'success');
        } catch (err) {
            show(err.response?.data?.error || 'Failed to send request', 'error');
        }
    };

    const handleCategoryClick = (cat, idx) => {
        setActiveCategory(idx);
        setActiveSkill('');
        setParams({ ...params, ...cat.filter, page: 1 });
    };

    const handleSkillClick = (skill) => {
        const s = activeSkill === skill ? '' : skill;
        setActiveSkill(s);
        setParams({ ...params, skills: s, page: 1 });
    };

    const handleFilterChange = (e) => setParams({ ...params, [e.target.name]: e.target.value, page: 1 });
    const clearFilters = () => { setParams({ skills: '', interests: '', year: '', page: 1 }); setActiveCategory(0); setActiveSkill(''); };

    const hasFilters = params.skills || params.interests || params.year;

    return (
        <div className="space-y-8">

            {/* ══ HERO BANNER ══ */}
            <div className="relative rounded-3xl overflow-hidden"
                style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #0891b2 50%, #06b6d4 100%)', minHeight: 200 }}>
                {/* Decorative blobs */}
                <div style={{ position: 'absolute', top: -40, right: -40, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
                <div style={{ position: 'absolute', bottom: -30, left: 100, width: 150, height: 150, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />

                <div className="relative px-8 py-8">
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-widest text-white/60 mb-1">StudyMesh Discovery</p>
                            <h1 className="text-3xl font-black text-white leading-tight">
                                Find Your <span style={{ color: '#fcd34d' }}>Perfect</span> Study Partner
                            </h1>
                            <p className="text-white/70 text-sm mt-2 max-w-md">
                                Connect with talented students who complement your skills. Build projects, ace exams, and grow your network.
                            </p>
                        </div>
                        <div className="flex gap-3 shrink-0">
                            <StatBadge icon="🎓" label="Students" value={`${users.length}+`} />
                            <StatBadge icon="🤝" label="Connections" value="Daily" />
                            <StatBadge icon="⚡" label="Live Now" value="Active" />
                        </div>
                    </div>
                </div>
            </div>

            {/* ══ QUICK CATEGORIES ══ */}
            <div>
                <div className="flex items-center justify-between mb-3">
                    <h2 className="text-sm font-black uppercase tracking-widest" style={{ color: '#a0a6c4' }}>Browse by Category</h2>
                </div>
                <div className="flex gap-2 flex-wrap">
                    {CATEGORIES.map((cat, idx) => (
                        <button key={cat.label} onClick={() => handleCategoryClick(cat, idx)}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all"
                            style={{
                                background: activeCategory === idx ? '#4f46e5' : 'rgba(22,25,56,0.8)',
                                color: activeCategory === idx ? 'white' : '#a0a6c4',
                                border: `1.5px solid ${activeCategory === idx ? '#4f46e5' : 'rgba(255,255,255,0.08)'}`,
                                boxShadow: activeCategory === idx ? '0 4px 14px rgba(79,70,229,0.3)' : 'none',
                            }}>
                            <span>{cat.icon}</span>
                            {cat.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* ══ TRENDING SKILLS ══ */}
            <div className="card !py-4">
                <div className="flex items-center gap-2 mb-3">
                    <span className="text-sm">🔥</span>
                    <h2 className="text-xs font-black uppercase tracking-widest" style={{ color: '#a0a6c4' }}>Trending Skills</h2>
                </div>
                <div className="flex gap-2 flex-wrap">
                    {TRENDING_SKILLS.map(skill => (
                        <button key={skill} onClick={() => handleSkillClick(skill)}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                            style={{
                                background: activeSkill === skill ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.04)',
                                color: activeSkill === skill ? '#a5b4fc' : '#636b8a',
                                border: `1px solid ${activeSkill === skill ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.06)'}`,
                            }}>
                            {skill}
                        </button>
                    ))}
                </div>
            </div>

            {/* ══ SEARCH / FILTER BAR ══ */}
            <div className="card !py-4">
                <div className="flex items-center gap-2 mb-3">
                    <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: 14, height: 14, color: '#6366f1' }}>
                        <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
                    </svg>
                    <h2 className="text-xs font-black uppercase tracking-widest" style={{ color: '#a0a6c4' }}>Advanced Search</h2>
                    {hasFilters && (
                        <button onClick={clearFilters} className="ml-auto text-xs font-bold hover:underline" style={{ color: '#a5b4fc' }}>
                            ✕ Clear all
                        </button>
                    )}
                </div>
                <div className="flex flex-wrap gap-3">
                    <div className="flex-1 min-w-[160px]">
                        <label className="block text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: '#636b8a' }}>Skills</label>
                        <input name="skills" className="input text-sm h-9" placeholder="React, Python…"
                            value={params.skills} onChange={handleFilterChange} />
                    </div>
                    <div className="flex-1 min-w-[160px]">
                        <label className="block text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: '#636b8a' }}>Interests</label>
                        <input name="interests" className="input text-sm h-9" placeholder="AI, Music…"
                            value={params.interests} onChange={handleFilterChange} />
                    </div>
                    <div className="w-36">
                        <label className="block text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: '#636b8a' }}>Year</label>
                        <select name="year" className="input text-sm h-9" value={params.year} onChange={handleFilterChange}>
                            <option value="">Any Year</option>
                            {['1st', '2nd', '3rd', '4th', 'Graduate', 'PhD'].map(y => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* ══ RESULTS HEADER ══ */}
            {!loading && (
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <h2 className="text-base font-black" style={{ color: '#f1f3f9' }}>
                            {hasFilters ? 'Search Results' : 'All Students'}
                        </h2>
                        <span className="px-2 py-0.5 rounded-lg text-xs font-bold"
                            style={{ background: 'rgba(99,102,241,0.12)', color: '#a5b4fc' }}>
                            {users.length} found
                        </span>
                    </div>
                    <p className="text-xs" style={{ color: '#636b8a' }}>Sorted by compatibility ⚡</p>
                </div>
            )}

            {/* ══ STUDENT GRID ══ */}
            {loading && users.length === 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
                </div>
            ) : users.length === 0 ? (
                <div className="py-24 text-center card border-dashed">
                    <div className="text-5xl mb-4">🔍</div>
                    <h3 className="text-lg font-bold" style={{ color: '#f1f3f9' }}>No students found</h3>
                    <p className="text-sm mt-1" style={{ color: '#636b8a' }}>Try adjusting your filters or browse by category above.</p>
                    <button onClick={clearFilters} className="btn-primary text-sm mt-4 px-6">Show all students</button>
                </div>
            ) : (
                <>
                    {/* Top Matches callout (first 3) */}
                    {!hasFilters && users.length >= 3 && (
                        <div className="mb-2">
                            <div className="flex items-center gap-2 mb-3">
                                <span className="w-1.5 h-5 rounded-full" style={{ background: 'linear-gradient(#4f46e5,#06b6d4)' }} />
                                <h3 className="text-sm font-black" style={{ color: '#a0a6c4' }}>⭐ Top Matches for You</h3>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                                {users.slice(0, 3).map(user => (
                                    <div key={user._id + '-top'} className="relative">
                                        <div className="absolute -top-2 -right-2 z-10 px-2 py-0.5 rounded-full text-[9px] font-black text-white"
                                            style={{ background: 'linear-gradient(90deg,#f59e0b,#ef4444)' }}>
                                            TOP MATCH
                                        </div>
                                        <UserCard user={user} onConnect={handleConnect}
                                            connectState={user.isConnected ? 'connected' : user.hasPendingRequest ? 'sent' : 'idle'} />
                                    </div>
                                ))}
                            </div>
                            {users.length > 3 && (
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
                                    <span className="text-xs font-bold" style={{ color: '#636b8a' }}>More students</span>
                                    <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
                                </div>
                            )}
                        </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                        {(hasFilters ? users : users.slice(3)).map(user => (
                            <UserCard key={user._id} user={user} onConnect={handleConnect}
                                connectState={user.isConnected ? 'connected' : user.hasPendingRequest ? 'sent' : 'idle'} />
                        ))}
                    </div>
                </>
            )}

            {loading && users.length > 0 && (
                <div className="flex justify-center py-6">
                    <div className="w-6 h-6 border-2 rounded-full animate-spin border-[#4f46e5] border-t-transparent" />
                </div>
            )}

            {hasMore && !loading && (
                <div className="flex justify-center py-4">
                    <button onClick={() => setParams(prev => ({ ...prev, page: prev.page + 1 }))}
                        className="btn-secondary px-10 text-[#4f46e5] font-bold">
                        Load more students →
                    </button>
                </div>
            )}

            {/* ══ PLATFORM TIPS ══ */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                    { icon: '🎯', title: 'Smart Matching', desc: 'Our algorithm scores compatibility based on skills, interests, and goals.' },
                    { icon: '💬', title: 'Instant Chat', desc: 'Accept a connection and a private chat room opens automatically.' },
                    { icon: '⚡', title: 'Earn Credits', desc: 'Connect, attend events, and build your profile to climb the leaderboard.' },
                ].map(tip => (
                    <div key={tip.title} className="card flex gap-4 items-start !p-4">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
                            style={{ background: 'rgba(99,102,241,0.12)' }}>
                            {tip.icon}
                        </div>
                        <div>
                            <p className="text-sm font-bold" style={{ color: '#f1f3f9' }}>{tip.title}</p>
                            <p className="text-xs mt-0.5 leading-relaxed" style={{ color: '#636b8a' }}>{tip.desc}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Discovery;
