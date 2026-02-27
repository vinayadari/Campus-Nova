import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import UserCard from '../components/UserCard';

const Discovery = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [params, setParams] = useState({
        skills: '',
        interests: '',
        year: '',
        page: 1,
    });
    const [hasMore, setHasMore] = useState(false);

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

    useEffect(() => {
        fetchUsers(params.page > 1);
    }, [params.page]);

    useEffect(() => {
        if (params.page === 1) {
            fetchUsers();
        } else {
            setParams(prev => ({ ...prev, page: 1 }));
        }
    }, [params.skills, params.interests, params.year]);

    const handleConnect = async (userId) => {
        try {
            await api.post(`/users/${userId}/connect`);
            setUsers(prev => prev.map(u =>
                u._id === userId ? { ...u, hasPendingRequest: true } : u
            ));
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to send request');
        }
    };

    const handleFilterChange = (e) => {
        setParams({ ...params, [e.target.name]: e.target.value, page: 1 });
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Discover Students</h1>
                    <p className="text-gray-500 mt-1">Find your next project partner or study buddy.</p>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-wrap gap-4 items-end">
                <div className="flex-1 min-w-[200px]">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Skills</label>
                    <input
                        name="skills"
                        className="input text-sm h-10"
                        placeholder="e.g. React, Python"
                        value={params.skills}
                        onChange={handleFilterChange}
                    />
                </div>
                <div className="flex-1 min-w-[200px]">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Interests</label>
                    <input
                        name="interests"
                        className="input text-sm h-10"
                        placeholder="e.g. AI, Music"
                        value={params.interests}
                        onChange={handleFilterChange}
                    />
                </div>
                <div className="w-40">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Year</label>
                    <select
                        name="year"
                        className="input text-sm h-10"
                        value={params.year}
                        onChange={handleFilterChange}
                    >
                        <option value="">Any Year</option>
                        <option value="1st">1st Year</option>
                        <option value="2nd">2nd Year</option>
                        <option value="3rd">3rd Year</option>
                        <option value="4th">4th Year</option>
                        <option value="Graduate">Graduate</option>
                        <option value="PhD">PhD</option>
                    </select>
                </div>
            </div>

            {/* User Grid */}
            {users.length === 0 && !loading ? (
                <div className="py-20 text-center bg-white rounded-2xl border border-dashed border-gray-200">
                    <span className="text-4xl mb-4 block">🔍</span>
                    <h3 className="text-lg font-bold text-gray-900">No students found</h3>
                    <p className="text-gray-500">Try adjusting your filters to find more matches.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {users.map(user => (
                        <UserCard
                            key={user._id}
                            user={user}
                            onConnect={handleConnect}
                            connectState={user.isConnected ? 'connected' : user.hasPendingRequest ? 'sent' : 'idle'}
                        />
                    ))}
                </div>
            )}

            {loading && (
                <div className="flex justify-center py-10">
                    <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
            )}

            {hasMore && !loading && (
                <div className="flex justify-center pt-8 pb-12">
                    <button
                        onClick={() => setParams(prev => ({ ...prev, page: prev.page + 1 }))}
                        className="btn-secondary h-12 px-10 text-indigo-600 font-bold border-indigo-200 hover:bg-indigo-50"
                    >
                        Load More Students
                    </button>
                </div>
            )}
        </div>
    );
};

export default Discovery;
