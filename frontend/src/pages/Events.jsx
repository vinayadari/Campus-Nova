import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import Modal from '../components/Modal';
import TagInput from '../components/TagInput';
import { useToast } from '../contexts/ToastContext';

const EVENT_TYPES = ['Hackathon', 'Workshop', 'Study Group', 'Networking', 'Talk', 'Other'];

const TYPE_STYLES = {
    Hackathon: { bg: 'bg-[rgba(168,85,247,0.12)]', text: 'text-[#d8b4fe]', border: 'border-[rgba(255,255,255,0.06)]', dot: 'bg-[#c084fc]' },
    Workshop: { bg: 'bg-[rgba(59,130,246,0.12)]', text: 'text-[#93c5fd]', border: 'border-[rgba(255,255,255,0.06)]', dot: 'bg-[#60a5fa]' },
    'Study Group': { bg: 'bg-[rgba(6,182,212,0.12)]', text: 'text-[#67e8f9]', border: 'border-[rgba(255,255,255,0.06)]', dot: 'bg-[#22d3ee]' },
    Networking: { bg: 'bg-[rgba(245,158,11,0.12)]', text: 'text-[#fcd34d]', border: 'border-[rgba(255,255,255,0.06)]', dot: 'bg-[#fbbf24]' },
    Talk: { bg: 'bg-[rgba(244,63,94,0.12)]', text: 'text-[#fda4af]', border: 'border-[rgba(255,255,255,0.06)]', dot: 'bg-[#fb7185]' },
    Other: { bg: 'bg-[rgba(255,255,255,0.06)]', text: 'text-[#94a3b8]', border: 'border-[rgba(255,255,255,0.06)]', dot: 'bg-[#94a3b8]' },
};

const SkeletonCard = () => (
    <div className="card flex flex-col gap-4">
        <div className="flex justify-between">
            <div className="skeleton h-5 w-24 rounded-lg" />
            <div className="skeleton h-5 w-16 rounded-lg" />
        </div>
        <div className="flex gap-3">
            <div className="skeleton w-12 h-14 rounded-xl shrink-0" />
            <div className="flex-1 space-y-2">
                <div className="skeleton h-4 w-3/4 rounded" />
                <div className="skeleton h-3 w-1/2 rounded" />
            </div>
        </div>
        <div className="skeleton h-10 w-full rounded-xl" />
    </div>
);

const Events = () => {
    const { user } = useAuth();
    const { show } = useToast();
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [view, setView] = useState('all'); // 'all' | 'bookmarks'
    const [bookmarks, setBookmarks] = useState([]);
    const [bookmarkedIds, setBookmarkedIds] = useState(new Set());
    const [filters, setFilters] = useState({ type: '', tag: '', upcoming: true });
    const [newEvent, setNewEvent] = useState({
        title: '', description: '', date: '', tags: [], type: 'Study Group',
        location: 'Online', maxAttendees: 50, link: ''
    });

    const fetchEvents = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get('/events', { params: filters });
            setEvents(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [filters]);

    const fetchBookmarks = useCallback(async () => {
        try {
            const res = await api.get('/users/me/bookmarks');
            setBookmarks(res.data);
            setBookmarkedIds(new Set(res.data.map(b => b._id)));
        } catch (err) { console.error(err); }
    }, []);

    useEffect(() => { fetchEvents(); }, [fetchEvents]);
    useEffect(() => { fetchBookmarks(); }, [fetchBookmarks]);

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await api.post('/events', newEvent);
            setShowModal(false);
            setNewEvent({ title: '', description: '', date: '', tags: [], type: 'Study Group', location: 'Online', maxAttendees: 50, link: '' });
            fetchEvents();
            show('Event created! 🎉', 'success');
        } catch (err) {
            show(err.response?.data?.error || 'Failed to create event', 'error');
        }
    };

    const handleRSVP = async (id, isAttending) => {
        try {
            if (isAttending) {
                await api.delete(`/events/${id}/rsvp`);
                show('RSVP cancelled.', 'info');
            } else {
                await api.post(`/events/${id}/rsvp`);
                show('You\'re going! +5 credits earned ⚡', 'success');
            }
            fetchEvents();
        } catch (err) {
            show(err.response?.data?.error || 'Failed to RSVP', 'error');
        }
    };

    const handleBookmark = async (eventId) => {
        try {
            const res = await api.post(`/users/me/bookmark/${eventId}`);
            const newSet = new Set(res.data.bookmarks);
            setBookmarkedIds(newSet);
            if (newSet.has(eventId)) {
                show('Event saved to bookmarks!', 'success');
            } else {
                show('Bookmark removed.', 'info');
                if (view === 'bookmarks') fetchBookmarks();
            }
            fetchBookmarks();
        } catch (err) {
            show('Failed to update bookmark', 'error');
        }
    };

    const displayedEvents = view === 'bookmarks' ? bookmarks : events;

    return (
        <div className="space-y-6 animate-fade-up">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-[#f8fafc]">Events</h1>
                    <p className="text-sm mt-0.5 text-[#94a3b8]">Hackathons, workshops, study sessions & more.</p>
                </div>
                <button onClick={() => setShowModal(true)} className="btn-primary text-sm">
                    + Create Event
                </button>
            </div>

            {/* Filter Bar */}
            <div className="card !py-3.5 flex flex-wrap gap-3 items-center">
                {/* View toggle */}
                <div className="flex gap-1.5 p-1 rounded-xl bg-[rgba(255,255,255,0.04)]">
                    <button onClick={() => setView('all')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${view === 'all' ? 'bg-[#334155] shadow-sm text-[#f8fafc]' : 'text-[#94a3b8] hover:text-[#f8fafc]'}`}>
                        All Events
                    </button>
                    <button onClick={() => setView('bookmarks')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${view === 'bookmarks' ? 'bg-[#334155] shadow-sm text-[#f8fafc]' : 'text-[#94a3b8] hover:text-[#f8fafc]'}`}>
                        🔖 Saved
                        {bookmarkedIds.size > 0 && (
                            <span className="w-4 h-4 rounded-full bg-[#06b6d4] text-white text-[9px] flex items-center justify-center">
                                {bookmarkedIds.size}
                            </span>
                        )}
                    </button>
                </div>

                {view === 'all' && (
                    <>
                        {/* Upcoming toggle */}
                        <div className="flex gap-1.5 p-1 rounded-xl bg-[rgba(255,255,255,0.04)]">
                            <button onClick={() => setFilters(f => ({ ...f, upcoming: true }))}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${filters.upcoming ? 'bg-[#334155] shadow-sm text-[#f8fafc]' : 'text-[#94a3b8] hover:text-[#f8fafc]'}`}>
                                Upcoming
                            </button>
                            <button onClick={() => setFilters(f => ({ ...f, upcoming: false }))}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${!filters.upcoming ? 'bg-[#334155] shadow-sm text-[#f8fafc]' : 'text-[#94a3b8] hover:text-[#f8fafc]'}`}>
                                All
                            </button>
                        </div>

                        {/* Type filter chips */}
                        <div className="flex gap-1.5 flex-wrap">
                            <button onClick={() => setFilters(f => ({ ...f, type: '' }))}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${filters.type === '' ? 'bg-[#06b6d4] text-white border-[#06b6d4]' : 'bg-[rgba(255,255,255,0.04)] text-[#94a3b8] border-[rgba(255,255,255,0.06)] hover:bg-[rgba(255,255,255,0.08)]'}`}>
                                All Types
                            </button>
                            {EVENT_TYPES.map(t => {
                                const s = TYPE_STYLES[t];
                                const active = filters.type === t;
                                return (
                                    <button key={t} onClick={() => setFilters(f => ({ ...f, type: active ? '' : t }))}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border flex items-center gap-1.5 ${active ? `${s.bg} ${s.text} ${s.border}` : 'bg-[rgba(255,255,255,0.04)] text-[#94a3b8] border-[rgba(255,255,255,0.06)] hover:bg-[rgba(255,255,255,0.08)]'}`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                                        {t}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Tag search */}
                        <input className="input text-xs h-8 w-32 ml-auto"
                            placeholder="Search tag…"
                            value={filters.tag}
                            onChange={e => setFilters(f => ({ ...f, tag: e.target.value }))} />
                    </>
                )}
            </div>

            {/* Grid */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 stagger">
                    {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
                </div>
            ) : displayedEvents.length === 0 ? (
                <div className="py-24 text-center card border-dashed">
                    <div className="text-4xl mb-3">{view === 'bookmarks' ? '🔖' : '📅'}</div>
                    <h3 className="text-base font-bold text-[#f8fafc]">
                        {view === 'bookmarks' ? 'No bookmarked events yet' : 'No events found'}
                    </h3>
                    <p className="text-[#94a3b8] text-sm mt-1">
                        {view === 'bookmarks' ? 'Click the bookmark icon on any event to save it here.' : 'Try changing filters or create a new event.'}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 stagger">
                    {displayedEvents.map(event => {
                        const isAttending = event.attendees?.some(a => a._id === user._id || a === user._id);
                        const isFull = event.attendees?.length >= event.maxAttendees;
                        const isBookmarked = bookmarkedIds.has(event._id);
                        const date = new Date(event.date);
                        const style = TYPE_STYLES[event.type] || TYPE_STYLES.Other;
                        const isPast = date < new Date();

                        return (
                            <div key={event._id} className={`card-hover flex flex-col ${isPast ? 'opacity-70' : ''}`}>
                                {/* Top row */}
                                <div className="flex justify-between items-start mb-4">
                                    <span className={`badge border text-[11px] ${style.bg} ${style.text} ${style.border} flex items-center gap-1.5`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                                        {event.type}
                                    </span>
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-[10px] border rounded-lg px-2 py-0.5 text-[#94a3b8] font-medium"
                                            style={{ borderColor: 'var(--color-border)' }}>
                                            {event.location}
                                        </span>
                                        <button onClick={() => handleBookmark(event._id)}
                                            title={isBookmarked ? 'Remove bookmark' : 'Bookmark event'}
                                            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${isBookmarked ? 'bg-[#06b6d4] text-white' : 'bg-[rgba(255,255,255,0.06)] text-[#94a3b8] hover:bg-[rgba(255,255,255,0.1)]'}`}>
                                            <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                                                <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>

                                {/* Date + Title */}
                                <div className="flex gap-3 mb-4">
                                    <div className="w-12 h-14 rounded-xl border overflow-hidden shrink-0 flex flex-col items-center justify-center"
                                        style={{ borderColor: 'var(--color-border-light)', background: 'var(--color-bg)' }}>
                                        <div className="w-full text-center text-[8px] font-black uppercase py-1 text-white"
                                            style={{ background: 'var(--color-accent)' }}>
                                            {date.toLocaleString('default', { month: 'short' })}
                                        </div>
                                        <div className="text-lg font-black text-[#f8fafc] leading-none mt-1">
                                            {date.getDate()}
                                        </div>
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="font-bold text-[#f8fafc] leading-snug line-clamp-2 text-sm">{event.title}</h3>
                                        <p className="text-[10px] text-[#64748b] mt-1">
                                            by <span className="text-[#06b6d4] font-semibold">{event.organizer?.name}</span>
                                            {' · '}{date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                </div>

                                {/* Description */}
                                <p className="text-xs text-[#94a3b8] line-clamp-2 flex-1 mb-4 leading-relaxed">
                                    {event.description}
                                </p>

                                {/* Tags */}
                                {event.tags?.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mb-4">
                                        {event.tags.slice(0, 3).map(tag => (
                                            <span key={tag} className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-[rgba(255,255,255,0.06)] text-[#cbd5e1]">
                                                #{tag}
                                            </span>
                                        ))}
                                    </div>
                                )}

                                {/* Capacity bar */}
                                <div className="mb-4">
                                    <div className="flex justify-between items-center mb-1">
                                        <div className="flex -space-x-1.5">
                                            {event.attendees?.slice(0, 4).map((a, i) => (
                                                <div key={i} title={a.name}
                                                    className="w-5 h-5 rounded-full border-2 border-[var(--color-bg)] flex items-center justify-center text-[7px] font-bold overflow-hidden"
                                                    style={{ background: 'var(--color-accent-light)', color: '#06b6d4' }}>
                                                    {a.avatar ? <img src={a.avatar} className="w-full h-full object-cover" alt="" /> : (a.name?.[0] || '?')}
                                                </div>
                                            ))}
                                        </div>
                                        <span className="text-[10px] text-[#94a3b8] font-medium">
                                            {event.attendees?.length}/{event.maxAttendees} attending
                                        </span>
                                    </div>
                                    <div className="h-1 bg-[rgba(255,255,255,0.08)] rounded-full overflow-hidden">
                                        <div className="h-full transition-all duration-500 rounded-full"
                                            style={{
                                                width: `${Math.min(100, (event.attendees?.length / event.maxAttendees) * 100)}%`,
                                                background: isFull ? '#f87171' : 'var(--color-accent)'
                                            }} />
                                    </div>
                                </div>

                                {/* Action */}
                                <div className="flex gap-2">
                                    {event.link && (
                                        <a href={event.link} target="_blank" rel="noreferrer"
                                            className="btn-secondary flex-none px-3 text-xs">
                                            🔗
                                        </a>
                                    )}
                                    {isAttending ? (
                                        <div className="flex gap-2 flex-1">
                                            <div className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold text-[#34d399] bg-[rgba(16,185,129,0.12)] border border-[rgba(52,211,153,0.3)] rounded-xl">
                                                <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                                                    <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                                                </svg>
                                                GOING
                                            </div>
                                            <button onClick={() => handleRSVP(event._id, true)}
                                                className="btn-secondary px-3 text-xs rounded-xl hover:text-red-400">
                                                Cancel
                                            </button>
                                        </div>
                                    ) : (
                                        <button disabled={isFull || isPast}
                                            onClick={() => handleRSVP(event._id, false)}
                                            className={`btn-primary flex-1 text-xs py-2 ${(isFull || isPast) ? 'opacity-40 cursor-not-allowed' : ''}`}>
                                            {isPast ? 'Ended' : isFull ? 'Full' : 'RSVP Now'}
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Create Event Modal */}
            <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Create New Event">
                <form onSubmit={handleCreate} className="space-y-4">
                    <div>
                        <label className="section-label block mb-1.5">Event Title *</label>
                        <input className="input" placeholder="e.g. Weekly Algorithm Study" value={newEvent.title}
                            onChange={e => setNewEvent({ ...newEvent, title: e.target.value })} required />
                    </div>
                    <div>
                        <label className="section-label block mb-1.5">Description *</label>
                        <textarea className="input min-h-[90px]" placeholder="What is this event about?"
                            value={newEvent.description} onChange={e => setNewEvent({ ...newEvent, description: e.target.value })} required />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="section-label block mb-1.5">Date & Time *</label>
                            <input type="datetime-local" className="input" value={newEvent.date}
                                onChange={e => setNewEvent({ ...newEvent, date: e.target.value })} required />
                        </div>
                        <div>
                            <label className="section-label block mb-1.5">Event Type</label>
                            <select className="input" value={newEvent.type} onChange={e => setNewEvent({ ...newEvent, type: e.target.value })}>
                                {EVENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="section-label block mb-1.5">Location</label>
                            <input className="input" placeholder="Library / Zoom link" value={newEvent.location}
                                onChange={e => setNewEvent({ ...newEvent, location: e.target.value })} />
                        </div>
                        <div>
                            <label className="section-label block mb-1.5">Max Attendees</label>
                            <input type="number" className="input" value={newEvent.maxAttendees} min="1"
                                onChange={e => setNewEvent({ ...newEvent, maxAttendees: parseInt(e.target.value) || 1 })} />
                        </div>
                    </div>
                    <div>
                        <label className="section-label block mb-1.5">Tags</label>
                        <TagInput value={newEvent.tags} onChange={tags => setNewEvent({ ...newEvent, tags })} />
                    </div>
                    <div>
                        <label className="section-label block mb-1.5">External Link (optional)</label>
                        <input className="input" placeholder="Registration or meeting link"
                            value={newEvent.link} onChange={e => setNewEvent({ ...newEvent, link: e.target.value })} />
                    </div>
                    <div className="flex justify-end gap-3 pt-4 border-t" style={{ borderColor: 'var(--color-border-light)' }}>
                        <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
                        <button type="submit" className="btn-primary">Create Event</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default Events;
