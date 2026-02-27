import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import { useToast } from '../contexts/ToastContext';

const Chat = () => {
    const { roomId } = useParams();
    const { user } = useAuth();
    const { socket } = useSocket();
    const navigate = useNavigate();
    const { show } = useToast();

    const [rooms, setRooms] = useState([]);
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const [loadingRooms, setLoadingRooms] = useState(true);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [onlineUsers, setOnlineUsers] = useState([]);
    const [typingUsers, setTypingUsers] = useState({});
    const [chatStatus, setChatStatus] = useState(null);
    const [clearConfirm, setClearConfirm] = useState(false);
    const [clearing, setClearing] = useState(false);
    const [showMenu, setShowMenu] = useState(false);

    const messagesEndRef = useRef(null);
    const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

    const fetchRooms = async () => {
        try {
            const res = await api.get('/messages/rooms');
            setRooms(res.data);
        } catch (err) { console.error(err); }
        finally { setLoadingRooms(false); }
    };

    const fetchMessages = async (id) => {
        setLoadingMessages(true);
        try {
            const res = await api.get(`/messages/${id}`);
            setMessages(res.data);
        } catch (err) { console.error(err); }
        finally {
            setLoadingMessages(false);
            setTimeout(scrollToBottom, 100);
        }
    };

    const fetchChatStatus = async (id) => {
        try {
            const res = await api.get(`/messages/status/${id}`);
            setChatStatus(res.data);
        } catch (err) { console.error(err); }
    };

    useEffect(() => { fetchRooms(); }, []);

    const currentRoomIdRef = useRef(roomId);
    useEffect(() => { currentRoomIdRef.current = roomId; }, [roomId]);

    useEffect(() => {
        if (roomId) {
            fetchMessages(roomId);
            fetchChatStatus(roomId);
            socket?.emit('join_room', roomId);
        }
    }, [roomId, socket]);

    // Re-join personal user room + active chat room on reconnect
    useEffect(() => {
        if (!socket) return;
        const handleConnect = () => {
            socket.emit('user_online', user._id);
            if (currentRoomIdRef.current) {
                socket.emit('join_room', currentRoomIdRef.current);
            }
        };
        socket.on('connect', handleConnect);
        return () => socket.off('connect', handleConnect);
    }, [socket, user._id]);

    useEffect(() => {
        if (!socket) return;
        const onMsg = (message) => {
            // room field may be a string id or a populated object
            const msgRoomId = typeof message.room === 'object'
                ? message.room?._id?.toString()
                : message.room?.toString();
            const activeRoom = currentRoomIdRef.current;
            if (msgRoomId === activeRoom) {
                setMessages(prev => {
                    // Replace the optimistic temp message from same sender if exists
                    const tempIdx = prev.findIndex(m =>
                        m._id?.toString().startsWith('temp_') &&
                        m.sender?._id === message.sender?._id
                    );
                    if (tempIdx !== -1) {
                        const next = [...prev];
                        next[tempIdx] = message;
                        return next;
                    }
                    // Otherwise avoid real duplicates
                    if (prev.find(m => m._id === message._id)) return prev;
                    return [...prev, message];
                });
                setTimeout(scrollToBottom, 50);
                fetchChatStatus(activeRoom);
            }
            setRooms(prev => {
                const next = prev.map(r =>
                    r._id === msgRoomId ? { ...r, lastMessage: message, lastMessageAt: message.createdAt || new Date().toISOString() } : r
                );
                return [...next].sort((a, b) => new Date(b.lastMessageAt || 0) - new Date(a.lastMessageAt || 0));
            });
        };
        const onErr = ({ error }) => {
            show(error, 'error');
        };
        const onTyping = ({ roomId: rId, userName }) => {
            if (rId === roomId && userName !== user.name) {
                setTypingUsers(prev => ({ ...prev, [rId]: userName }));
                setTimeout(() => setTypingUsers(prev => {
                    const newState = { ...prev };
                    delete newState[rId];
                    return newState;
                }), 2200);
            }
        };
        socket.on('receive_message', onMsg);
        socket.on('message_error', onErr);
        socket.on('user_typing', onTyping);
        socket.on('online_users', setOnlineUsers);
        const onChatCleared = ({ roomId: clearedRoomId, clearedBy }) => {
            if (clearedRoomId === currentRoomIdRef.current) {
                setMessages([]);
                if (clearedBy._id !== user._id) {
                    show(`${clearedBy.name} cleared the chat.`, 'info');
                }
            }
            setRooms(prev => {
                const next = prev.map(r =>
                    r._id === clearedRoomId ? { ...r, lastMessage: null, lastMessageAt: null } : r
                );
                return [...next].sort((a, b) => new Date(b.lastMessageAt || 0) - new Date(a.lastMessageAt || 0));
            });
        };
        socket.on('chat_cleared', onChatCleared);
        return () => {
            socket.off('receive_message', onMsg);
            socket.off('message_error', onErr);
            socket.off('user_typing', onTyping);
            socket.off('online_users', setOnlineUsers);
            socket.off('chat_cleared', onChatCleared);
        };
    }, [socket, roomId, user.name]);

    const canSend = chatStatus ? chatStatus.canSend : true;
    const isIntroRoom = chatStatus?.isIntro && !chatStatus?.isConnected;

    const handleSend = (e) => {
        e.preventDefault();
        const text = inputText.trim();
        if (!text || !socket || !roomId) return;
        if (!canSend) {
            show('Intro limit reached. Wait for them to accept your connection.', 'error');
            return;
        }
        // Optimistically add own message so sender sees it immediately
        const tempMsg = {
            _id: `temp_${Date.now()}`,
            room: roomId,
            sender: { _id: user._id, name: user.name, avatar: user.avatar },
            content: text,
            createdAt: new Date().toISOString(),
        };
        setMessages(prev => [...prev, tempMsg]);
        setTimeout(scrollToBottom, 50);
        socket.emit('send_message', { roomId, senderId: user._id, content: text });
        setInputText('');
    };

    const handleInputChange = (e) => {
        setInputText(e.target.value);
        if (socket && roomId) socket.emit('typing', { roomId, userName: user.name });
    };

    const handleClearChat = async () => {
        if (clearing) return;
        setClearing(true);
        try {
            await api.delete(`/messages/clear/${roomId}`);
            setMessages([]);
            setRooms(prev => {
                const next = prev.map(r =>
                    r._id === roomId ? { ...r, lastMessage: null, lastMessageAt: null } : r
                );
                return [...next].sort((a, b) => new Date(b.lastMessageAt || 0) - new Date(a.lastMessageAt || 0));
            });
            show('Chat cleared.', 'success');
        } catch (err) {
            show(err.response?.data?.error || 'Failed to clear chat', 'error');
        } finally {
            setClearConfirm(false);
            setClearing(false);
        }
    };

    const getOtherParticipant = (room) =>
        room?.participants?.find(p => p._id !== user._id) || { name: 'Unknown User' };

    const getInitials = (name) => name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    const formatTime = (ts) => ts ? new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

    const activeRoom = rooms.find(r => r._id === roomId);
    const activePeer = getOtherParticipant(activeRoom);

    return (
        <div className="h-[calc(100vh-112px)] flex rounded-2xl overflow-hidden"
            style={{ background: 'var(--color-surface)', border: '1px solid rgba(255,255,255,0.06)', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>

            {/* ── Rooms Panel ── */}
            <div className="flex flex-col shrink-0" style={{ width: 280, borderRight: '1px solid rgba(255,255,255,0.06)', background: 'rgba(12,14,26,0.5)' }}>
                <div className="p-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <h2 className="text-sm font-black" style={{ color: '#f1f3f9' }}>Messages</h2>
                    <p className="text-[10px] mt-0.5" style={{ color: '#636b8a' }}>{rooms.length} conversations</p>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {loadingRooms ? (
                        <div className="p-4 space-y-3">
                            {[...Array(4)].map((_, i) => (
                                <div key={i} className="flex items-center gap-3 px-2">
                                    <div className="skeleton w-10 h-10 rounded-full shrink-0" />
                                    <div className="flex-1 space-y-2">
                                        <div className="skeleton h-3 w-3/4 rounded" />
                                        <div className="skeleton h-2.5 w-1/2 rounded" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : rooms.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mb-3" style={{ background: 'rgba(99,102,241,0.12)' }}>💬</div>
                            <p className="text-sm font-bold" style={{ color: '#a0a6c4' }}>No conversations yet</p>
                            <p className="text-xs mt-1" style={{ color: '#636b8a' }}>Connect with students to start chatting.</p>
                        </div>
                    ) : rooms.map(room => {
                        const other = getOtherParticipant(room);
                        const isActive = roomId === room._id;
                        const isOnline = onlineUsers.includes(other._id);
                        const isIntro = room.isIntro;
                        return (
                            <button
                                key={room._id}
                                onClick={() => navigate(`/chat/${room._id}`)}
                                className="w-full flex items-center gap-3 px-4 py-3 text-left transition-all"
                                style={{
                                    background: isActive ? 'rgba(99,102,241,0.12)' : 'transparent',
                                    borderLeft: isActive ? '2.5px solid #6366f1' : '2.5px solid transparent',
                                }}>
                                <div className="relative shrink-0">
                                    <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center"
                                        style={{ background: 'rgba(99,102,241,0.12)' }}>
                                        {other.avatar
                                            ? <img src={other.avatar} alt={other.name} className="w-full h-full object-cover" />
                                            : <span className="text-xs font-bold" style={{ color: '#a5b4fc' }}>{getInitials(other.name)}</span>}
                                    </div>
                                    {isOnline && (
                                        <div className="absolute -bottom-px -right-px w-3 h-3 rounded-full bg-emerald-500" style={{ border: '2px solid var(--color-surface)' }} />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-center">
                                        <h3 className="text-sm font-semibold truncate" style={{ color: isActive ? '#a5b4fc' : '#e0e7ff' }}>
                                            {other.name}
                                        </h3>
                                        <span className="text-[9px] shrink-0 ml-1" style={{ color: '#636b8a' }}>{formatTime(room.lastMessageAt)}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        {isIntro && (
                                            <span className="text-[8px] font-black px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 shrink-0">INTRO</span>
                                        )}
                                        <p className="text-xs truncate" style={{ color: '#636b8a' }}>
                                            {room.lastMessage
                                                ? (typeof room.lastMessage === 'object' ? room.lastMessage.content : room.lastMessage)
                                                : 'No messages yet'}
                                        </p>
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* ── Chat Panel ── */}
            <div className="flex-1 flex flex-col min-w-0">
                {roomId ? (
                    <>
                        {/* Chat header */}
                        <div className="flex items-center gap-3 px-5 py-3 shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                            <div className="w-9 h-9 rounded-full overflow-hidden shrink-0 flex items-center justify-center"
                                style={{ background: 'rgba(99,102,241,0.12)' }}>
                                {activePeer?.avatar
                                    ? <img src={activePeer.avatar} className="w-full h-full object-cover" alt="" />
                                    : <span className="text-xs font-bold" style={{ color: '#a5b4fc' }}>{getInitials(activePeer?.name)}</span>}
                            </div>
                            <div className="flex-1">
                                <h3 className="text-sm font-bold" style={{ color: '#f1f3f9' }}>{activePeer?.name}</h3>
                                <p className="text-[10px] flex items-center gap-1.5" style={{ color: '#636b8a' }}>
                                    {onlineUsers.includes(activePeer?._id) ? (
                                        <><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />Online</>
                                    ) : 'Offline'}
                                </p>
                            </div>
                            {isIntroRoom && (
                                <div className="px-3 py-1.5 rounded-lg text-[10px] font-bold"
                                    style={{ background: 'rgba(245,158,11,0.12)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.2)' }}>
                                    ⚠️ Intro
                                </div>
                            )}
                            {chatStatus?.isConnected && (
                                <div className="px-3 py-1.5 rounded-lg text-[10px] font-bold"
                                    style={{ background: 'rgba(16,185,129,0.12)', color: '#34d399', border: '1px solid rgba(16,185,129,0.2)' }}>
                                    ✅ Connected
                                </div>
                            )}

                            {/* Actions Menu */}
                            <div className="relative">
                                <button
                                    onClick={() => setShowMenu(!showMenu)}
                                    className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:bg-white/5 active:scale-90"
                                    style={{ color: '#636b8a' }}>
                                    <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: 18, height: 18 }}>
                                        <path d="M10 3a1.5 1.5 0 110 3 1.5 1.5 0 010-3zM10 8.5a1.5 1.5 0 110 3 1.5 1.5 0 010-3zM10 14a1.5 1.5 0 110 3 1.5 1.5 0 010-3z" />
                                    </svg>
                                </button>

                                {showMenu && (
                                    <>
                                        <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                                        <div className="absolute top-full right-0 mt-2 w-48 rounded-xl p-1.5 z-20 animate-pop-in"
                                            style={{ background: 'rgba(23,25,48,0.95)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 10px 40px rgba(0,0,0,0.5)' }}>
                                            <button
                                                onClick={() => { setShowMenu(false); setClearConfirm(true); }}
                                                disabled={messages.length === 0}
                                                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-bold transition-all hover:bg-red-500/10 disabled:opacity-30"
                                                style={{ color: '#f87171' }}>
                                                <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: 14, height: 14 }}>
                                                    <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd" />
                                                </svg>
                                                Clear Chat
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Clear confirmation Modal */}
                        {clearConfirm && (
                            <>
                                <div className="fixed inset-0 z-30" style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(2px)' }} onClick={() => setClearConfirm(false)} />
                                <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[320px] rounded-2xl p-6 z-40 animate-pop-in text-center shadow-2xl"
                                    style={{ background: 'var(--color-surface)', border: '1px solid rgba(255,255,255,0.08)' }}>
                                    <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4" style={{ color: '#ef4444' }}>
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 28, height: 28 }}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </div>
                                    <h3 className="text-base font-bold text-white mb-2">Clear this chat?</h3>
                                    <p className="text-xs text-[#636b8a] mb-6">This will permanently delete all messages in this conversation for both you and {activePeer?.name?.split(' ')[0]}.</p>
                                    <div className="flex gap-3">
                                        <button onClick={() => setClearConfirm(false)} className="flex-1 px-4 py-2.5 rounded-xl text-xs font-bold border border-white/5 text-[#a0a6c4] hover:bg-white/5 transition-all">Cancel</button>
                                        <button onClick={handleClearChat} disabled={clearing} className="flex-1 px-4 py-2.5 rounded-xl text-xs font-black bg-red-500 text-white hover:bg-red-600 transition-all active:scale-95 disabled:opacity-50">
                                            {clearing ? 'Clearing...' : 'Clear for all'}
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Intro banner */}
                        {isIntroRoom && (
                            <div className="px-5 py-2.5 shrink-0" style={{ background: 'rgba(245,158,11,0.08)', borderBottom: '1px solid rgba(245,158,11,0.15)' }}>
                                <p className="text-xs text-center" style={{ color: '#fbbf24' }}>
                                    <strong>Cold Intro Mode:</strong> You can send 1 introductory message. Once {activePeer?.name?.split(' ')[0]} accepts your connection request, full chat is unlocked.
                                </p>
                            </div>
                        )}

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3" style={{ background: 'rgba(12,14,26,0.3)' }}>
                            {loadingMessages ? (
                                <div className="flex justify-center py-10">
                                    <div className="w-5 h-5 border-2 rounded-full animate-spin border-[#4f46e5] border-t-transparent" />
                                </div>
                            ) : messages.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-center py-12 opacity-60">
                                    <div className="text-3xl mb-2">👋</div>
                                    <p className="text-sm font-medium" style={{ color: '#a0a6c4' }}>
                                        {isIntroRoom ? 'Send your intro message!' : 'Say hello!'}
                                    </p>
                                    {isIntroRoom && (
                                        <p className="text-xs mt-1 max-w-xs" style={{ color: '#636b8a' }}>You have 1 message to make a great first impression.</p>
                                    )}
                                </div>
                            ) : messages.map((msg, idx) => {
                                const isOwn = (typeof msg.sender === 'object' ? msg.sender._id : msg.sender) === user._id;
                                return (
                                    <div key={idx} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[68%] px-3.5 py-2.5 rounded-2xl text-sm font-medium ${isOwn ? 'text-white rounded-br-sm' : 'rounded-bl-sm'}`}
                                            style={isOwn
                                                ? { background: 'linear-gradient(135deg, #4f46e5, #0891b2)' }
                                                : { background: 'var(--color-surface-light)', color: '#e0e7ff', border: '1px solid rgba(255,255,255,0.06)' }}>
                                            {msg.content}
                                            <div className={`text-[9px] mt-1 text-right ${isOwn ? 'text-white/60' : ''}`} style={isOwn ? {} : { color: '#636b8a' }}>
                                                {formatTime(msg.createdAt)}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            {typingUsers[roomId] && (
                                <div className="flex justify-start">
                                    <div className="px-3 py-2 rounded-2xl rounded-bl-sm text-xs flex items-center gap-1.5"
                                        style={{ background: 'var(--color-surface-light)', color: '#636b8a', border: '1px solid rgba(255,255,255,0.06)' }}>
                                        <span className="flex gap-1">
                                            <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                            <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                            <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                        </span>
                                        {typingUsers[roomId]} is typing
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input */}
                        <div className="p-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)', background: 'var(--color-surface)' }}>
                            {!canSend ? (
                                <div className="text-center py-2">
                                    <p className="text-xs font-semibold" style={{ color: '#636b8a' }}>
                                        🔒 Intro message sent — waiting for {activePeer?.name?.split(' ')[0]} to accept your connection.
                                    </p>
                                </div>
                            ) : (
                                <form onSubmit={handleSend} className="flex gap-2.5">
                                    <input
                                        className="input flex-1 h-11 !rounded-xl"
                                        placeholder={isIntroRoom ? "Write your intro message…" : "Type a message…"}
                                        value={inputText}
                                        onChange={handleInputChange}
                                    />
                                    <button type="submit" disabled={!inputText.trim()}
                                        className="w-11 h-11 rounded-xl flex items-center justify-center text-white transition-all active:scale-95 disabled:opacity-40"
                                        style={{ background: 'linear-gradient(135deg, #4f46e5, #0891b2)' }}>
                                        <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: 16, height: 16 }}>
                                            <path d="M3.105 2.289a.75.75 0 00-.826.95l1.414 4.925A1.5 1.5 0 005.135 9.25h6.115a.75.75 0 010 1.5H5.135a1.5 1.5 0 00-1.442 1.086l-1.414 4.926a.75.75 0 00.826.95 28.896 28.896 0 0015.293-7.154.75.75 0 000-1.115A28.897 28.897 0 003.105 2.289z" />
                                        </svg>
                                    </button>
                                </form>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-16 text-center" style={{ background: 'rgba(12,14,26,0.3)' }}>
                        <div className="w-20 h-20 rounded-3xl flex items-center justify-center text-4xl mb-5" style={{ background: 'rgba(99,102,241,0.12)' }}>
                            💬
                        </div>
                        <h2 className="text-lg font-bold" style={{ color: '#f1f3f9' }}>Select a conversation</h2>
                        <p className="text-sm mt-1.5 max-w-xs" style={{ color: '#636b8a' }}>
                            Choose a chat from the left panel to start collaborating in real-time.
                        </p>
                        <div className="mt-6 pt-6 w-full max-w-xs" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                            <p className="text-xs" style={{ color: '#a0a6c4' }}>
                                <strong>💡 How chat works:</strong>
                            </p>
                            <div className="text-[11px] mt-2 text-left space-y-1.5" style={{ color: '#636b8a' }}>
                                <p>• Send <strong>1 intro message</strong> to someone you haven't connected with</p>
                                <p>• Once they <strong>accept your connection</strong>, full chat unlocks</p>
                                <p>• Connected users can chat <strong>freely in real-time</strong></p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Chat;
