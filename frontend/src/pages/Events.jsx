import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import Modal from '../components/Modal';
import TagInput from '../components/TagInput';

const Events = () => {
    const { user } = useAuth();
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [filters, setFilters] = useState({ type: '', tag: '', upcoming: true });
    const [newEvent, setNewEvent] = useState({
        title: '', description: '', date: '', tags: [], type: 'Study Group', location: 'Online', maxAttendees: 50, link: ''
    });

    const fetchEvents = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get('/events', { params: filters });
            setEvents(res.data);
        } catch (err) {
            console.error('Failed to fetch events', err);
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        fetchEvents();
    }, [fetchEvents]);

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await api.post('/events', newEvent);
            setShowModal(false);
            setNewEvent({ title: '', description: '', date: '', tags: [], type: 'Study Group', location: 'Online', maxAttendees: 50, link: '' });
            fetchEvents();
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to create event');
        }
    };

    const handleRSVP = async (id, isAttending) => {
        try {
            if (isAttending) {
                await api.delete(`/events/${id}/rsvp`);
            } else {
                await api.post(`/events/${id}/rsvp`);
            }
            fetchEvents();
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to RSVP');
        }
    };

    const getTypeColor = (type) => {
        switch (type) {
            case 'Hackathon': return 'bg-purple-100 text-purple-700 border-purple-200';
            case 'Workshop': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'Study Group': return 'bg-indigo-100 text-indigo-700 border-indigo-200';
            case 'Networking': return 'bg-amber-100 text-amber-700 border-amber-200';
            case 'Talk': return 'bg-rose-100 text-rose-700 border-rose-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Events Board</h1>
                    <p className="text-gray-500 mt-1">Join study sessions, hackathons, and campus talks.</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="btn-primary h-12 px-6 flex items-center justify-center font-bold shadow-indigo-100 shadow-xl"
                >
                    <span className="text-xl mr-2">+</span> Create Event
                </button>
            </div>

            {/* Filter Bar */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-wrap gap-4 items-end">
                <div className="flex-1 min-w-[200px] flex gap-4">
                    <button
                        onClick={() => setFilters({ ...filters, upcoming: true })}
                        className={`flex-1 h-10 rounded-lg text-sm font-bold transition-all ${filters.upcoming ? 'bg-indigo-600 text-white shadow-md' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
                    >
                        Upcoming
                    </button>
                    <button
                        onClick={() => setFilters({ ...filters, upcoming: false })}
                        className={`flex-1 h-10 rounded-lg text-sm font-bold transition-all ${!filters.upcoming ? 'bg-indigo-600 text-white shadow-md' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
                    >
                        All Events
                    </button>
                </div>
                <div className="w-48">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Event Type</label>
                    <select
                        className="input text-sm h-10"
                        value={filters.type}
                        onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                    >
                        <option value="">All Types</option>
                        <option value="Hackathon">Hackathon</option>
                        <option value="Workshop">Workshop</option>
                        <option value="Study Group">Study Group</option>
                        <option value="Networking">Networking</option>
                        <option value="Talk">Talk</option>
                        <option value="Other">Other</option>
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
            ) : events.length === 0 ? (
                <div className="py-20 text-center bg-white rounded-2xl border border-dashed border-gray-200">
                    <span className="text-4xl mb-4 block">📅</span>
                    <h3 className="text-lg font-bold text-gray-900">No events found</h3>
                    <p className="text-gray-500">Try changing your filters or create a new event.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {events.map(event => {
                        const isAttending = event.attendees?.some(id => id._id === user._id || id === user._id);
                        const isFull = event.attendees?.length >= event.maxAttendees;
                        const date = new Date(event.date);

                        return (
                            <div key={event._id} className="card hover:shadow-md transition-all flex flex-col h-full group overflow-hidden border-b-4 border-b-indigo-500">
                                <div className="flex justify-between items-start mb-4">
                                    <div className={`badge border ${getTypeColor(event.type)}`}>
                                        {event.type}
                                    </div>
                                    <div className="bg-gray-50 px-2 py-1 rounded text-[10px] font-bold text-gray-400 border border-gray-100">
                                        {event.location}
                                    </div>
                                </div>

                                <div className="flex gap-4 mb-4">
                                    <div className="w-12 h-14 bg-white border border-gray-100 rounded-lg shadow-sm flex flex-col items-center justify-center shrink-0 overflow-hidden">
                                        <div className="bg-indigo-600 w-full text-[8px] text-white font-bold py-0.5 text-center uppercase">
                                            {date.toLocaleString('default', { month: 'short' })}
                                        </div>
                                        <div className="text-lg font-black text-gray-900 mt-0.5">
                                            {date.getDate()}
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900 leading-tight group-hover:text-indigo-600 transition-colors">{event.title}</h3>
                                        <p className="text-[10px] font-medium text-gray-400 mt-1">
                                            Organized by <span className="text-indigo-500">{event.organizer?.name}</span>
                                        </p>
                                    </div>
                                </div>

                                <p className="text-xs text-gray-500 mb-6 line-clamp-2 leading-relaxed flex-1">
                                    {event.description}
                                </p>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center text-xs text-gray-500 font-medium">
                                            <span className="mr-2 opacity-60">👥</span>
                                            {event.attendees?.length} / {event.maxAttendees} attending
                                        </div>
                                        <div className="flex -space-x-1.5">
                                            {event.attendees?.slice(0, 3).map((a, i) => (
                                                <div key={i} className="w-6 h-6 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-[7px] font-bold text-gray-600 shadow-sm overflow-hidden" title={a.name}>
                                                    {a.name?.[0]?.toUpperCase() || '?'}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {event.link && (
                                        <a href={event.link} target="_blank" rel="noreferrer" className="block w-full py-2 bg-gray-50 text-indigo-600 text-xs font-bold rounded-lg text-center hover:bg-indigo-50 transition-colors border border-indigo-100">
                                            🔗 Event Link
                                        </a>
                                    )}

                                    <div className="pt-2">
                                        {isAttending ? (
                                            <div className="flex gap-2">
                                                <div className="flex-1 bg-green-50 text-green-700 text-center py-2.5 rounded-lg text-xs font-black border border-green-200">
                                                    ✓ GOING
                                                </div>
                                                <button
                                                    onClick={() => handleRSVP(event._id, true)}
                                                    className="px-3 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors border border-red-100 font-bold text-lg"
                                                    title="Cancel RSVP"
                                                >
                                                    &times;
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                disabled={isFull}
                                                onClick={() => handleRSVP(event._id, false)}
                                                className={`w-full py-2.5 rounded-xl text-xs font-black transition-all shadow-md ${isFull
                                                        ? 'bg-gray-100 text-gray-400 cursor-default shadow-none'
                                                        : 'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95'
                                                    }`}
                                            >
                                                {isFull ? 'FULL CAPACITY' : 'RSVP NOW'}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Create Modal */}
            <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Create New Event 📅">
                <form onSubmit={handleCreate} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                            <label className="block text-sm font-bold text-gray-700 mb-1.5 ml-1">Event Title*</label>
                            <input
                                className="input h-11"
                                placeholder="e.g. Weekly Algorithm Study"
                                value={newEvent.title}
                                onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                                required
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-bold text-gray-700 mb-1.5 ml-1">Description*</label>
                            <textarea
                                className="input min-h-[100px] !py-3"
                                placeholder="What is this event about?"
                                value={newEvent.description}
                                onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1.5 ml-1">Date & Time*</label>
                            <input
                                type="datetime-local"
                                className="input h-11"
                                value={newEvent.date}
                                onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1.5 ml-1">Event Type</label>
                            <select
                                className="input h-11"
                                value={newEvent.type}
                                onChange={(e) => setNewEvent({ ...newEvent, type: e.target.value })}
                            >
                                <option value="Study Group">Study Group</option>
                                <option value="Hackathon">Hackathon</option>
                                <option value="Workshop">Workshop</option>
                                <option value="Networking">Networking</option>
                                <option value="Talk">Talk</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1.5 ml-1">Location</label>
                            <input
                                className="input h-11"
                                placeholder="e.g. Library 3rd Floor / Zoom"
                                value={newEvent.location}
                                onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1.5 ml-1">Max Attendees</label>
                            <input
                                type="number"
                                className="input h-11"
                                value={newEvent.maxAttendees}
                                onChange={(e) => setNewEvent({ ...newEvent, maxAttendees: parseInt(e.target.value) || 1 })}
                                min="1"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-bold text-gray-700 mb-1.5 ml-1">Tags</label>
                            <TagInput
                                value={newEvent.tags}
                                onChange={(tags) => setNewEvent({ ...newEvent, tags })}
                                placeholder="Add tags..."
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-bold text-gray-700 mb-1.5 ml-1">External Link (Optional)</label>
                            <input
                                className="input h-11"
                                placeholder="Registration or meeting link..."
                                value={newEvent.link}
                                onChange={(e) => setNewEvent({ ...newEvent, link: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="pt-6 border-t border-gray-100 flex justify-end gap-3">
                        <button type="button" onClick={() => setShowModal(false)} className="btn-secondary h-11 px-6 font-bold">Cancel</button>
                        <button type="submit" className="btn-primary h-11 px-10 font-bold">Create Event 📅</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default Events;
