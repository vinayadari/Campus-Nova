import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import Modal from '../components/Modal';
import TagInput from '../components/TagInput';

const Projects = () => {
    const { user } = useAuth();
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [filters, setFilters] = useState({ status: '', tag: '', search: '' });
    const [newProject, setNewProject] = useState({
        title: '', description: '', tags: [], skillsNeeded: [], maxMembers: 5, deadline: '', githubRepo: '', status: 'Open'
    });

    const fetchProjects = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get('/projects', { params: filters });
            setProjects(res.data);
        } catch (err) {
            console.error('Failed to fetch projects', err);
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        fetchProjects();
    }, [fetchProjects]);

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await api.post('/projects', newProject);
            setShowModal(false);
            setNewProject({ title: '', description: '', tags: [], skillsNeeded: [], maxMembers: 5, deadline: '', githubRepo: '', status: 'Open' });
            fetchProjects();
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to create project');
        }
    };

    const handleJoin = async (id) => {
        try {
            await api.post(`/projects/${id}/join`);
            fetchProjects();
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to join project');
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Open': return 'bg-green-100 text-green-700 border-green-200';
            case 'In Progress': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'Completed': return 'bg-gray-100 text-gray-700 border-gray-200';
            default: return 'bg-gray-100';
        }
    };

    const getInitials = (name) => name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Projects Board</h1>
                    <p className="text-gray-500 mt-1">Collaborate on coding projects, research, and more.</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="btn-primary h-12 px-6 flex items-center justify-center font-bold shadow-indigo-100 shadow-xl"
                >
                    <span className="text-xl mr-2">+</span> Create Project
                </button>
            </div>

            {/* Filter Bar */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-wrap gap-4 items-end">
                <div className="flex-1 min-w-[200px]">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Search Projects</label>
                    <input
                        className="input text-sm h-10"
                        placeholder="Search by title..."
                        value={filters.search}
                        onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    />
                </div>
                <div className="w-48">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Status</label>
                    <select
                        className="input text-sm h-10"
                        value={filters.status}
                        onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                    >
                        <option value="">All Statuses</option>
                        <option value="Open">Open</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                    </select>
                </div>
                <div className="w-48">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Tag</label>
                    <input
                        className="input text-sm h-10"
                        placeholder="Filter by tag..."
                        value={filters.tag}
                        onChange={(e) => setFilters({ ...filters, tag: e.target.value })}
                    />
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div></div>
            ) : projects.length === 0 ? (
                <div className="py-20 text-center bg-white rounded-2xl border border-dashed border-gray-200">
                    <span className="text-4xl mb-4 block">🚀</span>
                    <h3 className="text-lg font-bold text-gray-900">No projects found</h3>
                    <p className="text-gray-500">Be the first to create one!</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {projects.map(project => {
                        const isOwner = project.owner?._id === user._id;
                        const isMember = project.members?.some(m => m._id === user._id);
                        const isFull = project.members?.length >= project.maxMembers;

                        return (
                            <div key={project._id} className="card hover:shadow-md transition-shadow flex flex-col h-full group">
                                <div className="flex justify-between items-start mb-4">
                                    <div className={`badge border ${getStatusColor(project.status)}`}>
                                        {project.status}
                                    </div>
                                    {project.deadline && (
                                        <span className="text-[10px] font-bold text-gray-400 flex items-center">
                                            📅 {new Date(project.deadline).toLocaleDateString()}
                                        </span>
                                    )}
                                </div>

                                <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{project.title}</h3>
                                <p className="text-sm text-gray-500 mb-4 line-clamp-2 leading-relaxed flex-1">
                                    {project.description}
                                </p>

                                <div className="mb-4 space-y-3">
                                    <div>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Owner</p>
                                        <div className="flex items-center">
                                            <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-[10px] font-bold text-indigo-700 mr-2 border border-white shadow-sm overflow-hidden">
                                                {project.owner?.avatar ? <img src={project.owner.avatar} className="w-full h-full object-cover" /> : getInitials(project.owner?.name)}
                                            </div>
                                            <span className="text-xs font-semibold text-gray-700">{isOwner ? 'You' : project.owner?.name}</span>
                                        </div>
                                    </div>

                                    <div>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Members ({project.members?.length}/{project.maxMembers})</p>
                                        <div className="flex -space-x-2">
                                            {project.members?.map((m, i) => (
                                                <div key={i} className="w-7 h-7 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-[8px] font-bold text-gray-600 shadow-sm overflow-hidden" title={m.name}>
                                                    {m.avatar ? <img src={m.avatar} className="w-full h-full object-cover" /> : getInitials(m.name)}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-1.5 mb-6">
                                    {project.tags?.map((tag, i) => (
                                        <span key={i} className="px-2 py-0.5 bg-gray-50 text-gray-500 rounded text-[10px] font-medium border border-gray-200">#{tag}</span>
                                    ))}
                                </div>

                                <div className="pt-4 border-t border-gray-50 flex items-center justify-between">
                                    <div className="flex flex-wrap gap-1">
                                        {project.skillsNeeded?.slice(0, 2).map((s, i) => (
                                            <span key={i} className="text-[10px] font-bold text-indigo-500">· {s}</span>
                                        ))}
                                    </div>
                                    {isMember ? (
                                        <span className="text-xs font-bold text-green-600 bg-green-50 px-3 py-1.5 rounded-lg flex items-center">
                                            <span className="mr-1.5">✓</span> Already Joined
                                        </span>
                                    ) : isFull ? (
                                        <span className="text-xs font-bold text-gray-400 bg-gray-100 px-3 py-1.5 rounded-lg">Full</span>
                                    ) : (
                                        <button
                                            onClick={() => handleJoin(project._id)}
                                            className="btn-primary py-1.5 text-xs font-bold px-5"
                                        >
                                            Join Project
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Create Modal */}
            <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Create New Project 🚀">
                <form onSubmit={handleCreate} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                            <label className="block text-sm font-bold text-gray-700 mb-1.5 ml-1">Project Title*</label>
                            <input
                                className="input h-11"
                                placeholder="e.g. AI Research Bot"
                                value={newProject.title}
                                onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
                                required
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-bold text-gray-700 mb-1.5 ml-1">Description*</label>
                            <textarea
                                className="input min-h-[100px] !py-3"
                                placeholder="Describe your project goals and scope..."
                                value={newProject.description}
                                onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1.5 ml-1">Max Members</label>
                            <input
                                type="number"
                                className="input h-11"
                                value={newProject.maxMembers}
                                onChange={(e) => setNewProject({ ...newProject, maxMembers: parseInt(e.target.value) || 2 })}
                                min="2"
                                max="50"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1.5 ml-1">Deadline (Optional)</label>
                            <input
                                type="date"
                                className="input h-11"
                                value={newProject.deadline}
                                onChange={(e) => setNewProject({ ...newProject, deadline: e.target.value })}
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-bold text-gray-700 mb-1.5 ml-1">Tags</label>
                            <TagInput
                                value={newProject.tags}
                                onChange={(tags) => setNewProject({ ...newProject, tags })}
                                placeholder="Add tags (e.g. ML, Python)..."
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-bold text-gray-700 mb-1.5 ml-1">Skills Needed</label>
                            <TagInput
                                value={newProject.skillsNeeded}
                                onChange={(skills) => setNewProject({ ...newProject, skillsNeeded: skills })}
                                placeholder="What skills are you looking for?"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-bold text-gray-700 mb-1.5 ml-1">GitHub Repo Link</label>
                            <input
                                className="input h-11"
                                placeholder="https://github.com/..."
                                value={newProject.githubRepo}
                                onChange={(e) => setNewProject({ ...newProject, githubRepo: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="pt-6 border-t border-gray-100 flex justify-end gap-3">
                        <button type="button" onClick={() => setShowModal(false)} className="btn-secondary h-11 px-6 font-bold">Cancel</button>
                        <button type="submit" className="btn-primary h-11 px-10 font-bold">Launch Project 🚀</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default Projects;
