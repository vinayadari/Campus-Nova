import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Layout = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const navItems = [
        { name: 'Discover', path: '/', icon: '🔍' },
        { name: 'Projects', path: '/projects', icon: '🚀' },
        { name: 'Events', path: '/events', icon: '📅' },
        { name: 'Chat', path: '/chat', icon: '💬' },
    ];

    const getInitials = (name) => {
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden">
            {/* Sidebar */}
            <aside className="w-60 bg-white border-r border-gray-200 flex flex-col flex-shrink-0">
                <div className="p-6">
                    <h1 className="text-2xl font-bold text-indigo-600 tracking-tight">StudyMesh</h1>
                </div>

                <nav className="flex-1 px-4 space-y-1">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) =>
                                `flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${isActive
                                    ? 'bg-indigo-50 text-indigo-700'
                                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                }`
                            }
                        >
                            <span className="mr-3 text-lg">{item.icon}</span>
                            {item.name}
                        </NavLink>
                    ))}
                </nav>

                {/* User Profile / Logout */}
                <div className="p-4 border-t border-gray-100">
                    <div className="flex items-center mb-4 px-2">
                        <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold mr-3 border-2 border-white shadow-sm overflow-hidden">
                            {user.avatar ? (
                                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                            ) : (
                                getInitials(user.name)
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">{user.name}</p>
                            <p className="text-xs text-gray-500 truncate">{user.major}</p>
                        </div>
                    </div>
                    <div className="space-y-1">
                        <button
                            onClick={() => navigate('/profile')}
                            className="w-full text-left px-3 py-2 text-sm font-medium text-gray-600 rounded-md hover:bg-gray-50 hover:text-gray-900 transition-colors flex items-center"
                        >
                            <span className="mr-2">👤</span> My Profile
                        </button>
                        <button
                            onClick={logout}
                            className="w-full text-left px-3 py-2 text-sm font-medium text-red-600 rounded-md hover:bg-red-50 transition-colors flex items-center"
                        >
                            <span className="mr-2">🚪</span> Logout
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto overflow-x-hidden">
                <div className="max-w-7xl mx-auto p-8">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default Layout;
