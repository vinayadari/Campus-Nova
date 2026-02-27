import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';

import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Onboarding from './pages/Onboarding';
import Discovery from './pages/Discovery';
import Profile from './pages/Profile';
import Projects from './pages/Projects';
import Events from './pages/Events';
import Chat from './pages/Chat';
import Leaderboard from './pages/Leaderboard';

const LoadingScreen = () => (
    <div className="flex flex-col items-center justify-center h-screen bg-[var(--color-bg)] gap-4">
        <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #6366f1 0%, #6366f1 100%)' }}>
            <span className="text-white font-bold text-lg">S</span>
        </div>
        <div className="flex gap-1.5">
            <div className="w-2 h-2 rounded-full bg-[#6366f1] animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 rounded-full bg-[#6366f1] animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 rounded-full bg-[#22d3ee] animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
    </div>
);

const ProtectedRoute = ({ children }) => {
    const { user, loading } = useAuth();
    if (loading) return <LoadingScreen />;
    if (!user) return <Navigate to="/login" />;
    return children;
};

const PublicRoute = ({ children }) => {
    const { user, loading } = useAuth();
    if (loading) return <LoadingScreen />;
    if (user) return <Navigate to="/" />;
    return children;
};

function App() {
    return (
        <ToastProvider>
            <BrowserRouter>
                <Routes>
                    {/* Public Routes */}
                    <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
                    <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

                    {/* Onboarding */}
                    <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />

                    {/* Private Routes */}
                    <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                        <Route index element={<Discovery />} />
                        <Route path="projects" element={<Projects />} />
                        <Route path="events" element={<Events />} />
                        <Route path="chat" element={<Chat />} />
                        <Route path="chat/:roomId" element={<Chat />} />
                        <Route path="profile" element={<Profile />} />
                        <Route path="profile/:userId" element={<Profile />} />
                        <Route path="leaderboard" element={<Leaderboard />} />
                    </Route>

                    {/* Fallback */}
                    <Route path="*" element={<Navigate to="/" />} />
                </Routes>
            </BrowserRouter>
        </ToastProvider>
    );
}

export default App;
