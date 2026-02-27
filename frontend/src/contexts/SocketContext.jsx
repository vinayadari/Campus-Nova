import React, { createContext, useContext, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
    const { user } = useAuth();
    const socketRef = useRef();

    useEffect(() => {
        if (user) {
            // Connect to the same host using proxy
            socketRef.current = io('/');

            socketRef.current.on('connect', () => {
                console.log('Connected to socket', socketRef.current.id);
                socketRef.current.emit('user_online', user._id);
            });

            return () => {
                if (socketRef.current) {
                    socketRef.current.disconnect();
                    socketRef.current = null;
                }
            };
        }
    }, [user]);

    return (
        <SocketContext.Provider value={{ socket: socketRef.current }}>
            {children}
        </SocketContext.Provider>
    );
};

export const useSocket = () => useContext(SocketContext);
