import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import TagInput from '../components/TagInput';

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
        } catch (err) {
            alert('Failed to update profile');
        }
    };

    const handleConnect = async () => {
        try {
            await api.post(`/users/${profile._id}/connect`);
            setProfile({ ...profile, hasPendingRequest: true });
        } catch (err) {
            alert('Failed to send request');
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

    if (loading) return <div className="flex justify-center p-20"><div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div></div>;

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header Card */}
            <div className="card overflow-hidden !p-0">
                <div className="h-40 bg-gradient-to-r from-indigo-500 to-purple-600 relative">
                    {!isOwnProfile && profile.collabScore !== undefined && (
                        <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-md text-white px-4 py-2 rounded-full font-bold border border-white/30 flex items-center shadow-lg">
                            <span className="mr-2">⚡</span> Collab Score: {profile.collabScore}%
                        </div>
                    )}
                </div>
                <div className="px-8 pb-8 flex flex-col md:flex-row gap-8">
                    <div className="-mt-16 relative">
                        <div className="w-32 h-32 rounded-3xl bg-white p-1.5 shadow-xl">
                            <div className="w-full h-full rounded-2xl bg-indigo-100 flex items-center justify-center text-4xl font-bold text-indigo-700 overflow-hidden border border-indigo-50">
                                {profile.avatar ? <img src={profile.avatar} className="w-full h-full object-cover" /> : getInitials(profile.name)}
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 mt-4">
                        <div className="flex items-start justify-between">
                            <div>
                                <h1 className="text-3xl font-extrabold text-gray-900 leading-tight">{profile.name}</h1>
                                <div className="flex items-center gap-3 text-gray-500 font-medium mt-1">
                                    <span>🎓 {profile.major}</span>
                                    <span>•</span>
                                    <span>🏫 {profile.university}</span>
                                </div>
                                <div className="flex items-center gap-2 mt-2">
                                    <span className="badge bg-indigo-50 text-indigo-600">{profile.year} Student</span>
                                    <span className="text-sm text-gray-400">• {profile.connections?.length || 0} Connections</span>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                {isOwnProfile ? (
                                    <button onClick={handleEdit} className="btn-secondary h-10 flex items-center">
                                        <span className="mr-2">✏️</span> Edit Profile
                                    </button>
                                ) : (
                                    <>
                                        {profile.isConnected ? (
                                            <button onClick={() => navigate('/chat')} className="btn-primary h-10 bg-green-600 hover:bg-green-700">
                                                <span className="mr-2">💬</span> Message
                                            </button>
                                        ) : profile.hasPendingRequest ? (
                                            <button disabled className="btn-secondary h-10 text-amber-600 bg-amber-50 border-amber-200">
                                                <span className="mr-2">⏳</span> Request Sent
                                            </button>
                                        ) : (
                                            <button onClick={handleConnect} className="btn-primary h-10">
                                                <span className="mr-2">🤝</span> Connect
                                            </button>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                        <p className="text-gray-600 mt-6 leading-relaxed max-w-2xl italic">
                            {profile.bio || "No bio added yet."}
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-2 space-y-8">
                    {/* Tags Sections */}
                    <div className="card space-y-8">
                        <div>
                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Core Skills</h3>
                            <div className="flex flex-wrap gap-2">
                                {profile.skills?.length > 0 ? profile.skills.map((s, i) => (
                                    <span key={i} className="px-3 py-1.5 bg-gray-50 text-gray-700 rounded-lg text-sm font-semibold border border-gray-100">{s}</span>
                                )) : <p className="text-sm text-gray-400">No skills listed.</p>}
                            </div>
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Interests</h3>
                            <div className="flex flex-wrap gap-2">
                                {profile.interests?.length > 0 ? profile.interests.map((s, i) => (
                                    <span key={i} className="px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-semibold border border-indigo-100">{s}</span>
                                )) : <p className="text-sm text-gray-400">No interests listed.</p>}
                            </div>
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Looking For</h3>
                            <div className="flex flex-wrap gap-2">
                                {profile.lookingFor?.length > 0 ? profile.lookingFor.map((s, i) => (
                                    <span key={i} className="px-3 py-1.5 bg-purple-50 text-purple-700 rounded-lg text-sm font-semibold border border-purple-100">{s}</span>
                                )) : <p className="text-sm text-gray-400">No goals listed.</p>}
                            </div>
                        </div>
                    </div>

                    {/* Own Requests Section */}
                    {isOwnProfile && requests.length > 0 && (
                        <div className="space-y-4">
                            <h2 className="text-xl font-bold text-gray-900 px-1">Pending Connection Requests ({requests.length})</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {requests.map(req => (
                                    <div key={req._id} className="card flex items-center gap-4 bg-amber-50/20 border-amber-100">
                                        <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center font-bold text-amber-700 shrink-0">
                                            {getInitials(req.name)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-gray-900 truncate">{req.name}</p>
                                            <p className="text-xs text-gray-500 truncate">{req.major}</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => handleAccept(req._id)} className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center hover:bg-green-600 transition-colors shadow-sm">✓</button>
                                            <button className="w-8 h-8 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center hover:bg-gray-300 transition-colors shadow-sm">✕</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="space-y-6">
                    <div className="card">
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Social Links</h3>
                        <div className="space-y-3">
                            <div className="flex items-center gap-3">
                                <span className="text-xl">🐙</span>
                                {editing ? <input className="input !py-1 text-sm" value={editData.github} onChange={e => setEditData({ ...editData, github: e.target.value })} placeholder="GitHub URL" /> :
                                    <a href={profile.github} target="_blank" className="text-indigo-600 hover:underline text-sm truncate">{profile.github || 'Not set'}</a>}
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-xl">🔗</span>
                                {editing ? <input className="input !py-1 text-sm" value={editData.linkedin} onChange={e => setEditData({ ...editData, linkedin: e.target.value })} placeholder="LinkedIn URL" /> :
                                    <a href={profile.linkedin} target="_blank" className="text-indigo-600 hover:underline text-sm truncate">{profile.linkedin || 'Not set'}</a>}
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-xl">💼</span>
                                {editing ? <input className="input !py-1 text-sm" value={editData.portfolio} onChange={e => setEditData({ ...editData, portfolio: e.target.value })} placeholder="Portfolio URL" /> :
                                    <a href={profile.portfolio} target="_blank" className="text-indigo-600 hover:underline text-sm truncate">{profile.portfolio || 'Not set'}</a>}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {editing && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-8 animate-in zoom-in-95 duration-300">
                        <h2 className="text-2xl font-bold mb-6">Edit Profile</h2>
                        <form onSubmit={handleSave} className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold mb-1">Name</label>
                                    <input className="input" value={editData.name} onChange={e => setEditData({ ...editData, name: e.target.value })} />
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
                                <label className="block text-sm font-bold mb-1">Skills</label>
                                <TagInput value={editData.skills} onChange={v => setEditData({ ...editData, skills: v })} />
                            </div>
                            <div className="flex justify-end gap-3 pt-6 border-t">
                                <button type="button" onClick={() => setEditing(false)} className="btn-secondary">Cancel</button>
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
