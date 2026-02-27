import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import TagInput from '../components/TagInput';
import ProfileStrengthMeter from '../components/ProfileStrengthMeter';
import { useToast } from '../contexts/ToastContext';
import { useSocket } from '../contexts/SocketContext';

const Profile = () => {
    const { userId } = useParams();
    const { user: currentUser, updateUser } = useAuth();
    const navigate = useNavigate();

    const isOwnProfile = !userId;
    const [profile, setProfile] = useState(isOwnProfile ? currentUser : null);
    const [loading, setLoading] = useState(!isOwnProfile);
    const [editing, setEditing] = useState(false);
    const [requests, setRequests] = useState([]);
    const [editData, setEditData] = useState({});
    const { show } = useToast();
    const { socket } = useSocket();

    const lookingForOptions = [
        'Project Partner', 'Study Buddy', 'Mentor', 'Mentee', 'Hackathon Team'
    ];

    const handleToggleLookingFor = (item) => {
        const current = editData.lookingFor || [];
        if (current.includes(item)) {
            setEditData({ ...editData, lookingFor: current.filter(l => l !== item) });
        } else {
            setEditData({ ...editData, lookingFor: [...current, item] });
        }
    };

    useEffect(() => {
        const fetchProfile = async () => {
            setLoading(true);
            try {
                const id = userId || currentUser._id;
                const res = await api.get(`/users/${id}`);
                setProfile(res.data);
                if (isOwnProfile) setEditData(res.data);
            } catch (err) {
                console.error('Failed to fetch profile', err);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, [userId, currentUser._id, isOwnProfile]);

    useEffect(() => {
        if (isOwnProfile) {
            const fetchRequests = async () => {
                try {
                    const res = await api.get('/users/me/requests');
                    setRequests(res.data);
                } catch (err) {
                    console.error('Failed to fetch requests', err);
                }
            };
            fetchRequests();
        }
    }, [isOwnProfile]);

    useEffect(() => {
        if (!socket) return;

        const handleRequestReceived = (senderData) => {
            if (isOwnProfile) {
                setRequests(prev => {
                    if (prev.find(r => r._id === senderData._id)) return prev;
                    return [...prev, senderData];
                });
                show(`New connection request from ${senderData.name} 🔔`, 'info');
            }
        };

        const handleConnectionAccepted = (acceptorData) => {
            if (isOwnProfile && profile) {
                // Update connection stats
                setProfile(prev => ({
                    ...prev,
                    connections: [...(prev.connections || []), acceptorData._id],
                    campusCredits: (prev.campusCredits || 0) + 10
                }));
            } else if (profile && profile._id === acceptorData._id) {
                // If viewing the acceptor's profile, update our view of them
                setProfile(prev => ({
                    ...prev,
                    hasPendingRequest: false,
                    isConnected: true
                }));
            }
            show(`${acceptorData.name} accepted your connection request! 🎉`, 'success');
        };

        socket.on('connection_request_received', handleRequestReceived);
        socket.on('connection_accepted', handleConnectionAccepted);

        return () => {
            socket.off('connection_request_received', handleRequestReceived);
            socket.off('connection_accepted', handleConnectionAccepted);
        };
    }, [socket, isOwnProfile, profile, show]);

    const handleEdit = () => {
        setEditData({ ...profile });
        setEditing(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            const res = await api.patch('/users/me', editData);
            setProfile(res.data);
            updateUser(res.data);
            setEditing(false);
            show('Profile updated! ✨', 'success');
        } catch (err) {
            show('Failed to update profile', 'error');
        }
    };

    const handleConnect = async () => {
        try {
            await api.post(`/users/${profile._id}/connect`);
            setProfile({ ...profile, hasPendingRequest: true });
            show('Connection request sent!', 'success');
        } catch (err) {
            show('Failed to send request', 'error');
        }
    };

    const handleAccept = async (senderId) => {
        try {
            const res = await api.post(`/users/${senderId}/accept`);
            setRequests(requests.filter(r => r._id !== senderId));
            if (res.data.chatroom) {
                navigate(`/chat/${res.data.chatroom._id}`);
            }
        } catch (err) {
            alert('Failed to accept request');
        }
    };

    const getInitials = (name) => {
        return name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    if (loading) return <div className="flex justify-center p-20"><div className="w-10 h-10 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#6366f1', borderTopColor: 'transparent' }} /></div>;

    /* Stat rows */
    const stats = [
        { icon: '🤝', label: 'Connections', value: profile.connections?.length || 0 },
        { icon: '💡', label: 'Skills', value: profile.skills?.length || 0 },
        { icon: '⚡', label: 'Campus Credits', value: profile.campusCredits || 0 },
        { icon: '🎯', label: 'Interests', value: profile.interests?.length || 0 },
    ];

    const SKILL_COLORS = [
        { bg: 'rgba(99,102,241,0.12)', text: '#a5b4fc', border: 'rgba(255,255,255,0.06)' },
        { bg: 'rgba(16,185,129,0.12)', text: '#6ee7b7', border: 'rgba(255,255,255,0.06)' },
        { bg: 'rgba(6,182,212,0.12)', text: '#67e8f9', border: 'rgba(255,255,255,0.06)' },
        { bg: 'rgba(249,115,22,0.12)', text: '#fdba74', border: 'rgba(255,255,255,0.06)' },
        { bg: 'rgba(59,130,246,0.12)', text: '#93c5fd', border: 'rgba(255,255,255,0.06)' },
    ];

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            {/* ══ HEADER CARD ══ */}
            <div className="card overflow-hidden !p-0">
                <div className="h-44 relative" style={{ background: 'linear-gradient(135deg,rgba(79,70,229,0.2) 0%,rgba(8,145,178,0.15) 55%,rgba(6,182,212,0.1) 100%)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    {/* Decorative circles */}
                    <div style={{ position: 'absolute', top: -30, right: -30, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.07)' }} />
                    <div style={{ position: 'absolute', bottom: -20, left: 120, width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
                    {!isOwnProfile && profile.collabScore !== undefined && (
                        <div className="absolute top-4 right-4 px-4 py-2 rounded-full font-bold flex items-center shadow-lg text-sm"
                            style={{ background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(10px)', color: '#f1f3f9', border: '1px solid rgba(255,255,255,0.1)' }}>
                            ⚡ Collab Match: {profile.collabScore}%
                        </div>
                    )}
                </div>

                <div className="px-8 pb-6">
                    <div className="flex flex-col md:flex-row gap-6">
                        {/* Avatar */}
                        <div className="-mt-14 relative shrink-0">
                            <div className="w-28 h-28 rounded-3xl p-1.5 shadow-xl glass" style={{ background: 'var(--color-surface)', border: '1px solid rgba(255,255,255,0.1)' }}>
                                <div className="w-full h-full rounded-2xl flex items-center justify-center text-3xl font-bold overflow-hidden" style={{ background: 'rgba(99,102,241,0.15)', color: '#a5b4fc' }}>
                                    {profile.avatar ? <img src={profile.avatar} className="w-full h-full object-cover" alt={profile.name} /> : getInitials(profile.name)}
                                </div>
                            </div>
                        </div>

                        {/* Info */}
                        <div className="flex-1 pt-4">
                            <div className="flex items-start justify-between flex-wrap gap-3">
                                <div>
                                    <h1 className="text-2xl font-black leading-tight" style={{ color: '#f1f3f9' }}>{profile.name}</h1>
                                    <div className="flex items-center flex-wrap gap-x-3 gap-y-1 text-sm mt-1" style={{ color: '#a0a6c4' }}>
                                        {profile.major && <span>🎓 {profile.major}</span>}
                                        {profile.university && <><span>•</span><span>🏫 {profile.university}</span></>}
                                    </div>
                                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                                        <span className="badge text-xs" style={{ background: 'rgba(99,102,241,0.12)', color: '#a5b4fc', border: '1px solid rgba(255,255,255,0.06)' }}>{profile.year} Student</span>
                                        {profile.lookingFor?.map(lf => (
                                            <span key={lf} className="badge text-xs" style={{ background: 'rgba(16,185,129,0.12)', color: '#6ee7b7', border: '1px solid rgba(255,255,255,0.06)' }}>{lf}</span>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    {isOwnProfile ? (
                                        <button onClick={handleEdit} className="btn-secondary flex items-center gap-2 text-sm" style={{ background: 'rgba(255,255,255,0.04)', color: '#a0a6c4', borderColor: 'rgba(255,255,255,0.1)' }}>
                                            <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: 14, height: 14 }}>
                                                <path d="M2.695 14.763l-1.262 3.154a.5.5 0 00.65.65l3.155-1.262a4 4 0 001.343-.885L17.5 5.5a2.121 2.121 0 00-3-3L3.58 13.42a4 4 0 00-.885 1.343z" />
                                            </svg>
                                            Edit Profile
                                        </button>
                                    ) : profile.isConnected ? (
                                        <button onClick={() => navigate('/chat')} className="btn-primary flex items-center gap-2 text-sm">💬 Message</button>
                                    ) : profile.hasPendingRequest ? (
                                        <button disabled className="btn-secondary text-sm" style={{ color: '#fbbf24', background: 'rgba(245,158,11,0.12)', borderColor: 'rgba(245,158,11,0.2)' }}>⏳ Request Sent</button>
                                    ) : (
                                        <button onClick={handleConnect} className="btn-primary flex items-center gap-2 text-sm">🤝 Connect</button>
                                    )}
                                </div>
                            </div>

                            {profile.bio && (
                                <p className="mt-3 leading-relaxed text-sm max-w-2xl" style={{ color: '#636b8a' }}>{profile.bio}</p>
                            )}
                        </div>
                    </div>

                    {/* ── Stat chips row ── */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                        {stats.map(s => (
                            <div key={s.label} className="flex flex-col items-center py-3 rounded-2xl" style={{ background: 'var(--color-surface-light)', border: '1px solid rgba(255,255,255,0.06)' }}>
                                <span className="text-xl mb-1">{s.icon}</span>
                                <p className="text-xl font-black leading-none" style={{ color: '#f1f3f9' }}>{s.value}</p>
                                <p className="text-[10px] font-bold mt-0.5 uppercase tracking-wider" style={{ color: '#636b8a' }}>{s.label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ══ MAIN GRID ══ */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* LEFT: main content */}
                <div className="md:col-span-2 space-y-6">

                    {/* Skills */}
                    <div className="card">
                        <div className="flex items-center gap-2 mb-4">
                            <span className="w-1 h-5 rounded-full" style={{ background: '#6366f1' }} />
                            <h3 className="text-xs font-black uppercase tracking-widest" style={{ color: '#a0a6c4' }}>Core Skills</h3>
                            <span className="ml-auto text-[10px] font-bold" style={{ color: '#636b8a' }}>{profile.skills?.length || 0} skills</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {profile.skills?.length > 0 ? profile.skills.map((s, i) => {
                                const c = SKILL_COLORS[i % SKILL_COLORS.length];
                                return <span key={i} className="px-3 py-1.5 rounded-lg text-xs font-bold" style={{ background: c.bg, color: c.text, border: c.border }}>{s}</span>;
                            }) : <p className="text-sm" style={{ color: '#636b8a' }}>No skills listed.</p>}
                        </div>
                    </div>

                    {/* Interests */}
                    <div className="card">
                        <div className="flex items-center gap-2 mb-4">
                            <span className="w-1 h-5 rounded-full" style={{ background: '#06b6d4' }} />
                            <h3 className="text-xs font-black uppercase tracking-widest" style={{ color: '#a0a6c4' }}>Interests &amp; Passions</h3>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {profile.interests?.length > 0 ? profile.interests.map((s, i) => (
                                <span key={i} className="px-3 py-1.5 rounded-lg text-xs font-bold" style={{ background: 'rgba(6,182,212,0.12)', color: '#67e8f9', border: '1px solid rgba(255,255,255,0.06)' }}>{s}</span>
                            )) : <p className="text-sm" style={{ color: '#636b8a' }}>No interests listed.</p>}
                        </div>
                    </div>

                    {/* Looking For */}
                    <div className="card">
                        <div className="flex items-center gap-2 mb-4">
                            <span className="w-1 h-5 rounded-full" style={{ background: '#10b981' }} />
                            <h3 className="text-xs font-black uppercase tracking-widest" style={{ color: '#a0a6c4' }}>Looking For</h3>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {profile.lookingFor?.length > 0 ? profile.lookingFor.map((s, i) => (
                                <span key={i} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold" style={{ background: 'rgba(16,185,129,0.12)', color: '#6ee7b7', border: '1px solid rgba(255,255,255,0.06)' }}>
                                    <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: 10, height: 10 }}><path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" /></svg>
                                    {s}
                                </span>
                            )) : <p className="text-sm text-slate-400">No goals listed.</p>}
                        </div>
                    </div>

                    {/* Activity Timeline */}
                    <div className="card">
                        <div className="flex items-center gap-2 mb-5">
                            <span className="w-1 h-5 rounded-full" style={{ background: '#f59e0b' }} />
                            <h3 className="text-xs font-black uppercase tracking-widest" style={{ color: '#a0a6c4' }}>Recent Activity</h3>
                        </div>
                        <div className="space-y-4">
                            {[
                                { icon: '🤝', text: 'Joined StudyMesh', sub: '2 days ago', color: 'rgba(99,102,241,0.12)', c: '#a5b4fc' },
                                { icon: '✏️', text: 'Updated profile skills', sub: 'Recent', color: 'rgba(16,185,129,0.12)', c: '#6ee7b7' },
                                { icon: '⚡', text: `Earned ${profile.campusCredits || 0} campus credits`, sub: 'Total earned', color: 'rgba(245,158,11,0.12)', c: '#fbbf24' },
                                { icon: '👥', text: `${profile.connections?.length || 0} connections made`, sub: 'Network growing', color: 'rgba(6,182,212,0.12)', c: '#67e8f9' },
                            ].map((item, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0" style={{ background: item.color, border: '1px solid rgba(255,255,255,0.06)' }}>
                                        {item.icon}
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-semibold" style={{ color: '#f1f3f9' }}>{item.text}</p>
                                        <p className="text-xs" style={{ color: '#636b8a' }}>{item.sub}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Pending Requests */}
                    {isOwnProfile && requests.length > 0 && (
                        <div className="space-y-4">
                            <h2 className="text-xl font-bold px-1" style={{ color: '#f1f3f9' }}>Pending Connection Requests ({requests.length})</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {requests.map(req => (
                                    <div key={req._id} className="card flex items-center gap-4" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.15)' }}>
                                        <div className="w-12 h-12 rounded-xl flex items-center justify-center font-bold shrink-0" style={{ background: 'rgba(245,158,11,0.12)', color: '#fbbf24' }}>
                                            {getInitials(req.name)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold truncate" style={{ color: '#f1f3f9' }}>{req.name}</p>
                                            <p className="text-xs truncate" style={{ color: '#a0a6c4' }}>{req.major}</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => handleAccept(req._id)} className="w-8 h-8 rounded-full flex items-center justify-center transition-colors shadow-sm" style={{ background: 'rgba(34,197,94,0.15)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.3)' }}>✓</button>
                                            <button className="w-8 h-8 rounded-full flex items-center justify-center transition-colors shadow-sm" style={{ background: 'rgba(255,255,255,0.06)', color: '#a0a6c4', border: '1px solid rgba(255,255,255,0.1)' }}>✕</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="space-y-6">
                    {/* Profile Strength Meter — own profile only */}
                    {isOwnProfile && (
                        <ProfileStrengthMeter user={profile} onEditClick={() => { setEditData({ ...profile }); setEditing(true); }} />
                    )}

                    {/* Campus Credits */}
                    {isOwnProfile && (
                        <div className="card flex items-center gap-4"
                            style={{ background: 'linear-gradient(135deg, rgba(79,70,229,0.15) 0%, rgba(8,145,178,0.05) 100%)', border: '1px solid rgba(99,102,241,0.2)' }}>
                            <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl shrink-0"
                                style={{ background: 'rgba(99,102,241,0.15)' }}>
                                ⚡
                            </div>
                            <div>
                                <p className="text-xs font-bold mb-0.5" style={{ color: '#a0a6c4' }}>Campus Credits</p>
                                <p className="text-2xl font-black leading-none" style={{ color: '#f1f3f9' }}>{profile.campusCredits || 0}</p>
                            </div>
                            <a href="/leaderboard" className="ml-auto text-xs font-bold transition-colors" style={{ color: '#a5b4fc' }}>
                                Leaderboard →
                            </a>
                        </div>
                    )}

                    <div className="card">
                        <h3 className="text-sm font-bold uppercase tracking-widest mb-4" style={{ color: '#636b8a' }}>Social Links</h3>
                        <div className="space-y-3">
                            <div className="flex items-center gap-3">
                                <span className="text-xl">🐙</span>
                                {editing ? <input className="input !py-1 text-sm" value={editData.github} onChange={e => setEditData({ ...editData, github: e.target.value })} placeholder="GitHub URL" /> :
                                    <a href={profile.github} target="_blank" className="hover:underline text-sm truncate" style={{ color: '#a5b4fc' }}>{profile.github || 'Not set'}</a>}
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-xl">🔗</span>
                                {editing ? <input className="input !py-1 text-sm" value={editData.linkedin} onChange={e => setEditData({ ...editData, linkedin: e.target.value })} placeholder="LinkedIn URL" /> :
                                    <a href={profile.linkedin} target="_blank" className="hover:underline text-sm truncate" style={{ color: '#a5b4fc' }}>{profile.linkedin || 'Not set'}</a>}
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-xl">💼</span>
                                {editing ? <input className="input !py-1 text-sm" value={editData.portfolio} onChange={e => setEditData({ ...editData, portfolio: e.target.value })} placeholder="Portfolio URL" /> :
                                    <a href={profile.portfolio} target="_blank" className="hover:underline text-sm truncate" style={{ color: '#a5b4fc' }}>{profile.portfolio || 'Not set'}</a>}
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-xl">🐦</span>
                                {editing ? <input className="input !py-1 text-sm" value={editData.twitter} onChange={e => setEditData({ ...editData, twitter: e.target.value })} placeholder="Twitter URL" /> :
                                    <a href={profile.twitter} target="_blank" className="hover:underline text-sm truncate" style={{ color: '#a5b4fc' }}>{profile.twitter || 'Not set'}</a>}
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-xl">📸</span>
                                {editing ? <input className="input !py-1 text-sm" value={editData.instagram} onChange={e => setEditData({ ...editData, instagram: e.target.value })} placeholder="Instagram URL" /> :
                                    <a href={profile.instagram} target="_blank" className="hover:underline text-sm truncate" style={{ color: '#a5b4fc' }}>{profile.instagram || 'Not set'}</a>}
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-xl">👾</span>
                                {editing ? <input className="input !py-1 text-sm" value={editData.discord} onChange={e => setEditData({ ...editData, discord: e.target.value })} placeholder="Discord Username" /> :
                                    <span className="text-sm truncate" style={{ color: '#636b8a' }}>{profile.discord || 'Not set'}</span>}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {editing && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-8 animate-in zoom-in-95 duration-300" style={{ background: 'var(--color-surface)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <h2 className="text-2xl font-bold mb-6" style={{ color: '#f1f3f9' }}>Edit Profile</h2>
                        <form onSubmit={handleSave} className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold mb-1">Name</label>
                                    <input className="input" value={editData.name} onChange={e => setEditData({ ...editData, name: e.target.value })} />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-sm font-bold mb-1">Profile Picture URL</label>
                                    <div className="flex gap-4">
                                        <input
                                            className="input flex-1"
                                            value={editData.avatar || ''}
                                            onChange={e => setEditData({ ...editData, avatar: e.target.value })}
                                            placeholder="https://example.com/photo.jpg"
                                        />
                                        {editData.avatar && (
                                            <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
                                                <img src={editData.avatar} alt="Preview" className="w-full h-full object-cover" onError={(e) => e.target.style.display = 'none'} />
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold mb-1">Year</label>
                                    <select className="input" value={editData.year} onChange={e => setEditData({ ...editData, year: e.target.value })}>
                                        <option value="1st">1st Year</option>
                                        <option value="2nd">2nd Year</option>
                                        <option value="3rd">3rd Year</option>
                                        <option value="4th">4th Year</option>
                                        <option value="Graduate">Graduate</option>
                                        <option value="PhD">PhD</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-1">Bio</label>
                                <textarea className="input min-h-[100px]" value={editData.bio} onChange={e => setEditData({ ...editData, bio: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-1 border-t pt-4">Skills</label>
                                <TagInput value={editData.skills || []} onChange={v => setEditData({ ...editData, skills: v })} />
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-1">Interests</label>
                                <TagInput value={editData.interests || []} onChange={v => setEditData({ ...editData, interests: v })} />
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-1">Looking For</label>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {lookingForOptions.map(option => (
                                        <button
                                            key={option}
                                            type="button"
                                            onClick={() => handleToggleLookingFor(option)}
                                            className={`px-3 py-1.5 rounded-lg text-sm font-semibold border-2 transition-all ${(editData.lookingFor || []).includes(option)
                                                ? 'border-indigo-500 bg-indigo-500/20 text-indigo-300'
                                                : 'border-white/10 bg-white/5 text-slate-400 hover:border-indigo-400/50'
                                                }`}
                                        >
                                            {option}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold mb-1">GitHub</label>
                                    <input className="input" value={editData.github} onChange={e => setEditData({ ...editData, github: e.target.value })} placeholder="URL" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold mb-1">LinkedIn</label>
                                    <input className="input" value={editData.linkedin} onChange={e => setEditData({ ...editData, linkedin: e.target.value })} placeholder="URL" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold mb-1">Twitter</label>
                                    <input className="input" value={editData.twitter} onChange={e => setEditData({ ...editData, twitter: e.target.value })} placeholder="URL" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold mb-1">Instagram</label>
                                    <input className="input" value={editData.instagram} onChange={e => setEditData({ ...editData, instagram: e.target.value })} placeholder="URL" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold mb-1">Discord</label>
                                    <input className="input" value={editData.discord} onChange={e => setEditData({ ...editData, discord: e.target.value })} placeholder="Username" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold mb-1">Portfolio</label>
                                    <input className="input" value={editData.portfolio} onChange={e => setEditData({ ...editData, portfolio: e.target.value })} placeholder="URL" />
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 pt-6" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                                <button type="button" onClick={() => setEditing(false)} className="btn-secondary" style={{ background: 'transparent', color: '#a0a6c4', borderColor: 'rgba(255,255,255,0.1)' }}>Cancel</button>
                                <button type="submit" className="btn-primary px-8">Save Changes</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Profile;
