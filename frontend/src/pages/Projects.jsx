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
            case 'Open': return 'bg-[rgba(16,185,129,0.12)] text-[#34d399] border-[rgba(52,211,153,0.3)]';
            case 'In Progress': return 'bg-[rgba(59,130,246,0.12)] text-[#93c5fd] border-[rgba(59,130,246,0.3)]';
            case 'Completed': return 'bg-[rgba(255,255,255,0.06)] text-[#94a3b8] border-[rgba(255,255,255,0.1)]';
            default: return 'bg-[rgba(255,255,255,0.06)]';
        }
    };

    const getInitials = (name) => name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-[#f8fafc] tracking-tight">Projects Board</h1>
                    <p className="text-[#94a3b8] mt-1">Collaborate on coding projects, research, and more.</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="btn-primary h-12 px-6 flex items-center justify-center font-bold"
                >
                    <span className="text-xl mr-2">+</span> Create Project
                </button>
            </div>

            {/* Filter Bar */}
            <div className="card !p-4 flex flex-wrap gap-4 items-end">
                <div className="flex-1 min-w-[200px]">
                    <label className="block text-[10px] font-bold text-[#94a3b8] uppercase tracking-widest mb-1.5 ml-1">Search Projects</label>
                    <input
                        className="input text-sm h-10"
                        placeholder="Search by title..."
                        value={filters.search}
                        onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    />
                </div>
                <div className="w-48">
                    <label className="block text-[10px] font-bold text-[#94a3b8] uppercase tracking-widest mb-1.5 ml-1">Status</label>
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
                    <label className="block text-[10px] font-bold text-[#94a3b8] uppercase tracking-widest mb-1.5 ml-1">Tag</label>
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
                <div className="card py-20 text-center rounded-2xl border-dashed">
                    <span className="text-4xl mb-4 block">🚀</span>
                    <h3 className="text-lg font-bold text-[#f8fafc]">No projects found</h3>
                    <p className="text-[#94a3b8]">Be the first to create one!</p>
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
                                        <span className="text-[10px] font-bold text-[#64748b] flex items-center">
                                            📅 {new Date(project.deadline).toLocaleDateString()}
                                        </span>
                                    )}
                                </div>

                                <h3 className="text-xl font-bold text-[#f8fafc] mb-2 group-hover:text-[#06b6d4] transition-colors uppercase tracking-tight">{project.title}</h3>
                                <p className="text-sm text-[#94a3b8] mb-4 line-clamp-2 leading-relaxed flex-1">
                                    {project.description}
                                </p>

                                <div className="mb-4 space-y-3">
                                    <div>
                                        <p className="text-[10px] font-bold text-[#64748b] uppercase tracking-wider mb-1.5">Owner</p>
                                        <div className="flex items-center">
                                            <div className="w-6 h-6 rounded-full bg-[rgba(6,182,212,0.15)] flex items-center justify-center text-[10px] font-bold text-[#06b6d4] mr-2 border border-[var(--color-bg)] shadow-sm overflow-hidden">
                                                {project.owner?.avatar ? <img src={project.owner.avatar} className="w-full h-full object-cover" /> : getInitials(project.owner?.name)}
                                            </div>
                                            <span className="text-xs font-semibold text-[#cbd5e1]">{isOwner ? 'You' : project.owner?.name}</span>
                                        </div>
                                    </div>

                                    <div>
                                        <p className="text-[10px] font-bold text-[#64748b] uppercase tracking-wider mb-1.5">Members ({project.members?.length}/{project.maxMembers})</p>
                                        <div className="flex -space-x-2">
                                            {project.members?.map((m, i) => (
                                                <div key={i} className="w-7 h-7 rounded-full bg-[rgba(255,255,255,0.08)] border-2 border-[var(--color-bg)] flex items-center justify-center text-[8px] font-bold text-[#94a3b8] shadow-sm overflow-hidden" title={m.name}>
                                                    {m.avatar ? <img src={m.avatar} className="w-full h-full object-cover" /> : getInitials(m.name)}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-1.5 mb-6">
                                    {project.tags?.map((tag, i) => (
                                        <span key={i} className="px-2 py-0.5 bg-[rgba(255,255,255,0.04)] text-[#94a3b8] rounded text-[10px] font-medium border border-[rgba(255,255,255,0.06)]">#{tag}</span>
                                    ))}
                                </div>

                                <div className="pt-4 border-t border-[rgba(255,255,255,0.06)] flex items-center justify-between">
                                    <div className="flex flex-wrap gap-1">
                                        {project.skillsNeeded?.slice(0, 2).map((s, i) => (
                                            <span key={i} className="text-[10px] font-bold text-[#06b6d4]">· {s}</span>
                                        ))}
                                    </div>
                                    {isMember ? (
                                        <span className="text-xs font-bold text-[#34d399] bg-[rgba(16,185,129,0.12)] px-3 py-1.5 rounded-lg flex items-center">
                                            <span className="mr-1.5">✓</span> Already Joined
                                        </span>
                                    ) : isFull ? (
                                        <span className="text-xs font-bold text-[#94a3b8] bg-[rgba(255,255,255,0.06)] px-3 py-1.5 rounded-lg">Full</span>
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
                            <label className="section-label block mb-1.5">Project Title*</label>
                            <input
                                className="input h-11"
                                placeholder="e.g. AI Research Bot"
                                value={newProject.title}
                                onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
                                required
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="section-label block mb-1.5">Description*</label>
                            <textarea
                                className="input min-h-[100px] !py-3"
                                placeholder="Describe your project goals and scope..."
                                value={newProject.description}
                                onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <label className="section-label block mb-1.5">Max Members</label>
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
                            <label className="section-label block mb-1.5">Deadline (Optional)</label>
                            <input
                                type="date"
                                className="input h-11"
                                value={newProject.deadline}
                                onChange={(e) => setNewProject({ ...newProject, deadline: e.target.value })}
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="section-label block mb-1.5">Tags</label>
                            <TagInput
                                value={newProject.tags}
                                onChange={(tags) => setNewProject({ ...newProject, tags })}
                                placeholder="Add tags (e.g. ML, Python)..."
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="section-label block mb-1.5">Skills Needed</label>
                            <TagInput
                                value={newProject.skillsNeeded}
                                onChange={(skills) => setNewProject({ ...newProject, skillsNeeded: skills })}
                                placeholder="What skills are you looking for?"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="section-label block mb-1.5">GitHub Repo Link</label>
                            <input
                                className="input h-11"
                                placeholder="https://github.com/..."
                                value={newProject.githubRepo}
                                onChange={(e) => setNewProject({ ...newProject, githubRepo: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="pt-6 border-t border-[rgba(255,255,255,0.06)] flex justify-end gap-3">
                        <button type="button" onClick={() => setShowModal(false)} className="btn-secondary h-11 px-6 font-bold">Cancel</button>
                        <button type="submit" className="btn-primary h-11 px-10 font-bold">Launch Project 🚀</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default Projects;
