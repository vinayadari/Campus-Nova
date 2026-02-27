import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';

const Chat = () => {
    const { roomId } = useParams();
    const { user } = useAuth();
    const { socket } = useSocket();
    const navigate = useNavigate();

    const [rooms, setRooms] = useState([]);
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const [loadingRooms, setLoadingRooms] = useState(true);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [onlineUsers, setOnlineUsers] = useState([]);
    const [typingUsers, setTypingUsers] = useState({}); // { roomId: userName }

    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const fetchRooms = async () => {
        try {
            const res = await api.get('/messages/rooms');
            setRooms(res.data);
        } catch (err) {
            console.error('Failed to fetch rooms', err);
        } finally {
            setLoadingRooms(false);
        }
    };

    const fetchMessages = async (id) => {
        setLoadingMessages(true);
        try {
            const res = await api.get(`/messages/${id}`);
            setMessages(res.data);
        } catch (err) {
            console.error('Failed to fetch messages', err);
        } finally {
            setLoadingMessages(false);
            setTimeout(scrollToBottom, 100);
        }
    };

    useEffect(() => {
        fetchRooms();
    }, []);

    useEffect(() => {
        if (roomId) {
            fetchMessages(roomId);
            if (socket) {
                socket.emit('join_room', roomId);
            }
        }
    }, [roomId, socket]);

    useEffect(() => {
        if (!socket) return;

        const handleReceiveMessage = (message) => {
            if (message.room === roomId) {
                setMessages(prev => [...prev, message]);
                setTimeout(scrollToBottom, 50);
            }
            // Update last message in room list
            setRooms(prev => prev.map(r =>
                r._id === message.room ? { ...r, lastMessage: message, lastMessageAt: message.createdAt } : r
            ));
        };

        const handleTyping = ({ roomId: typingRoomId, userName }) => {
            if (typingRoomId === roomId && userName !== user.name) {
                setTypingUsers(prev => ({ ...prev, [typingRoomId]: userName }));
                setTimeout(() => {
                    setTypingUsers(prev => {
                        const newState = { ...prev };
                        delete newState[typingRoomId];
                        return newState;
                    });
                }, 2000);
            }
        };

        const handleOnlineUsers = (users) => {
            setOnlineUsers(users);
        };

        socket.on('receive_message', handleReceiveMessage);
        socket.on('user_typing', handleTyping);
        socket.on('online_users', handleOnlineUsers);

        return () => {
            socket.off('receive_message', handleReceiveMessage);
            socket.off('user_typing', handleTyping);
            socket.off('online_users', handleOnlineUsers);
        };
    }, [socket, roomId, user.name]);

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!inputText.trim() || !socket || !roomId) return;

        const messageData = {
            roomId,
            senderId: user._id,
            content: inputText.trim()
        };

        socket.emit('send_message', messageData);
        setInputText('');
    };

    const handleInputChange = (e) => {
        setInputText(e.target.value);
        if (socket && roomId) {
            socket.emit('typing', { roomId, userName: user.name });
        }
    };

    const getOtherParticipant = (room) => {
        return room.participants?.find(p => p._id !== user._id) || { name: 'Unknown User' };
    };

    const getInitials = (name) => name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

    return (
        <div className="h-[calc(100vh-140px)] bg-white rounded-2xl shadow-xl flex overflow-hidden border border-gray-100 animate-in fade-in duration-500">
            {/* Left Panel: Rooms */}
            <div className="w-80 border-r border-gray-100 flex flex-col bg-gray-50/30">
                <div className="p-6 border-b border-gray-100 bg-white">
                    <h2 className="text-xl font-bold text-gray-900 tracking-tight">Messages</h2>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {loadingRooms ? (
                        <div className="p-10 text-center text-gray-400 text-sm">Loading chats...</div>
                    ) : rooms.length === 0 ? (
                        <div className="p-10 text-center">
                            <span className="text-3xl mb-4 block">💬</span>
                            <p className="text-sm text-gray-500 font-medium">No conversations yet.</p>
                            <p className="text-[10px] text-gray-400 mt-1">Connect with students to start chatting.</p>
                        </div>
                    ) : (
                        rooms.map(room => {
                            const other = getOtherParticipant(room);
                            const isActive = roomId === room._id;
                            const isOnline = onlineUsers.includes(other._id);

                            return (
                                <div
                                    key={room._id}
                                    onClick={() => navigate(`/chat/${room._id}`)}
                                    className={`p-4 flex gap-3 cursor-pointer transition-all border-b border-gray-50/50 ${isActive ? 'bg-indigo-50/80 border-indigo-100' : 'hover:bg-white'
                                        }`}
                                >
                                    <div className="relative shrink-0">
                                        <div className="w-12 h-12 rounded-2xl bg-indigo-100 flex items-center justify-center font-bold text-indigo-700 shadow-sm overflow-hidden">
                                            {other.avatar ? <img src={other.avatar} className="w-full h-full object-cover" /> : getInitials(other.name)}
                                        </div>
                                        {isOnline && (
                                            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full"></div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-baseline mb-0.5">
                                            <h3 className={`text-sm font-bold truncate ${isActive ? 'text-indigo-900' : 'text-gray-900'}`}>{other.name}</h3>
                                            <span className="text-[10px] text-gray-400">{room.lastMessageAt ? new Date(room.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                                        </div>
                                        <p className="text-xs text-gray-500 truncate font-medium">
                                            {room.lastMessage ? (
                                                <span>{room.lastMessage.sender === user._id ? 'You: ' : ''}{room.lastMessage.content}</span>
                                            ) : 'No messages yet'}
                                        </p>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Right Panel: Active Chat */}
            <div className="flex-1 flex flex-col bg-white">
                {roomId ? (
                    <>
                        {/* Header */}
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center font-bold text-indigo-700">
                                    {getInitials(getOtherParticipant(rooms.find(r => r._id === roomId) || {}).name)}
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 text-sm">{getOtherParticipant(rooms.find(r => r._id === roomId) || {}).name}</h3>
                                    <p className="text-[10px] text-gray-500 flex items-center">
                                        {onlineUsers.includes(getOtherParticipant(rooms.find(r => r._id === roomId) || {})._id) ? (
                                            <><span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5 animate-pulse"></span> Online Now</>
                                        ) : 'Offline'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50/10 custom-scrollbar">
                            {loadingMessages ? (
                                <div className="flex justify-center py-10"><div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div></div>
                            ) : messages.length === 0 ? (
                                <div className="text-center py-10 opacity-40">
                                    <p className="text-sm font-medium">Say hello! 👋</p>
                                </div>
                            ) : (
                                messages.map((msg, idx) => {
                                    const isOwn = msg.sender === user._id;
                                    return (
                                        <div key={idx} className={`flex ${isOwn ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}>
                                            <div className={`max-w-[70%] p-3 rounded-2xl text-sm font-medium shadow-sm ${isOwn
                                                    ? 'bg-indigo-600 text-white rounded-br-none'
                                                    : 'bg-white border border-gray-100 text-gray-800 rounded-bl-none'
                                                }`}>
                                                {msg.content}
                                                <div className={`text-[9px] mt-1 opacity-60 text-right ${isOwn ? 'text-indigo-100' : 'text-gray-400'}`}>
                                                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                            {typingUsers[roomId] && (
                                <div className="flex justify-start">
                                    <div className="bg-gray-100 px-3 py-2 rounded-2xl rounded-bl-none text-[10px] text-gray-500 font-bold italic animate-pulse">
                                        {typingUsers[roomId]} is typing...
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Bar */}
                        <div className="p-4 border-t border-gray-100 bg-white">
                            <form onSubmit={handleSendMessage} className="flex gap-3">
                                <input
                                    className="input flex-1 h-12 !rounded-2xl bg-gray-50/50"
                                    placeholder="Type a message..."
                                    value={inputText}
                                    onChange={handleInputChange}
                                />
                                <button
                                    type="submit"
                                    disabled={!inputText.trim()}
                                    className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50 shadow-lg shadow-indigo-100"
                                >
                                    <span className="text-xl">✈️</span>
                                </button>
                            </form>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-20 text-center opacity-60">
                        <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center text-5xl mb-6 grayscale">💬</div>
                        <h2 className="text-xl font-bold text-gray-900 uppercase tracking-widest">Select a Conversation</h2>
                        <p className="text-sm text-gray-500 mt-2">Chat with your connections in real-time to collaborate on projects.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Chat;
