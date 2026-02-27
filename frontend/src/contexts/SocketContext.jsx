import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext({ socket: null });

export const SocketProvider = ({ children }) => {
    const { user } = useAuth();
    const [socket, setSocket] = useState(null);

    useEffect(() => {
        if (!user) return;

        // Connect to socket server — uses Vite proxy in dev
        const newSocket = io('/', {
            transports: ['websocket', 'polling'],
            reconnectionDelay: 1000,
            reconnectionAttempts: 5,
        });

        newSocket.on('connect', () => {
            console.log('✅ Socket connected:', newSocket.id);
            newSocket.emit('user_online', user._id);
        });

        newSocket.on('connect_error', (err) => {
            console.warn('Socket connection error:', err.message);
        });

        setSocket(newSocket);

        return () => {
            newSocket.disconnect();
            setSocket(null);
        };
    }, [user]);

    return (
        <SocketContext.Provider value={{ socket }}>
            {children}
        </SocketContext.Provider>
    );
};

export const useSocket = () => useContext(SocketContext);
