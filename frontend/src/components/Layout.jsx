import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/* ── Inline icon helpers (16×16 px) ── */
const Icon = ({ children }) => (
    <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: 16, height: 16, flexShrink: 0 }}>
        {children}
    </svg>
);

const navItems = [
    {
        name: 'Discover', path: '/',
        icon: <Icon><path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" /></Icon>,
    },
    {
        name: 'Projects', path: '/projects',
        icon: <Icon><path d="M2 4.25A2.25 2.25 0 014.25 2h2.5A2.25 2.25 0 019 4.25v2.5A2.25 2.25 0 016.75 9h-2.5A2.25 2.25 0 012 6.75v-2.5zm9 0A2.25 2.25 0 0113.25 2h2.5A2.25 2.25 0 0118 4.25v2.5A2.25 2.25 0 0115.75 9h-2.5A2.25 2.25 0 0111 6.75v-2.5zm-9 9A2.25 2.25 0 014.25 11h2.5A2.25 2.25 0 019 13.25v2.5A2.25 2.25 0 016.75 18h-2.5A2.25 2.25 0 012 15.75v-2.5zm9 0A2.25 2.25 0 0113.25 11h2.5A2.25 2.25 0 0118 13.25v2.5A2.25 2.25 0 0115.75 18h-2.5A2.25 2.25 0 0111 15.75v-2.5z" /></Icon>,
    },
    {
        name: 'Events', path: '/events',
        icon: <Icon>
            <path d="M5.25 12a.75.75 0 01.75-.75h.01a.75.75 0 01.75.75v.01a.75.75 0 01-.75.75H6a.75.75 0 01-.75-.75V12zM6 13.25a.75.75 0 00-.75.75v.01c0 .414.336.75.75.75h.01a.75.75 0 00.75-.75V14a.75.75 0 00-.75-.75H6zM9.25 10a.75.75 0 01.75-.75h.01a.75.75 0 01.75.75v.01a.75.75 0 01-.75.75H10a.75.75 0 01-.75-.75V10zM12 9.25a.75.75 0 00-.75.75v.01c0 .414.336.75.75.75h.01a.75.75 0 00.75-.75V10a.75.75 0 00-.75-.75H12z" />
            <path fillRule="evenodd" d="M5.75 2a.75.75 0 01.75.75V4h7V2.75a.75.75 0 011.5 0V4h.25A2.75 2.75 0 0118 6.75v8.5A2.75 2.75 0 0115.25 18H4.75A2.75 2.75 0 012 15.25v-8.5A2.75 2.75 0 014.75 4H5V2.75A.75.75 0 015.75 2zm-1 5.5c-.69 0-1.25.56-1.25 1.25v6.5c0 .69.56 1.25 1.25 1.25h10.5c.69 0 1.25-.56 1.25-1.25v-6.5c0-.69-.56-1.25-1.25-1.25H4.75z" clipRule="evenodd" />
        </Icon>,
    },
    {
        name: 'Leaderboard', path: '/leaderboard',
        icon: <Icon>
            <path fillRule="evenodd" d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.83-4.401z" clipRule="evenodd" />
        </Icon>,
    },
    {
        name: 'Chat', path: '/chat',
        icon: <Icon>
            <path d="M3.505 2.365A41.369 41.369 0 019 2c1.863 0 3.697.124 5.495.365 1.247.167 2.18 1.108 2.435 2.268a4.45 4.45 0 00-.577-.069 43.141 43.141 0 00-4.706 0C9.229 4.696 7.5 6.727 7.5 8.998v2.24c0 1.413.67 2.735 1.76 3.562l-2.98 2.98A.75.75 0 015 17.25v-3.443c-.501-.048-1-.106-1.495-.172C2.033 13.438 1 12.162 1 10.72V5.28c0-1.441 1.033-2.717 2.505-2.914z" />
            <path d="M14 6c-.762 0-1.52.02-2.271.062C10.157 6.148 9 7.472 9 8.998v2.24c0 1.519 1.147 2.839 2.71 2.935.214.013.428.024.642.034.2.009.385.09.518.224l2.35 2.35a.75.75 0 001.28-.531v-2.07c1.453-.195 2.5-1.463 2.5-2.915V8.998c0-1.526-1.157-2.85-2.729-2.936A41.645 41.645 0 0014 6z" />
        </Icon>,
    },
];

const Layout = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const getInitials = (name) =>
        name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

    return (
        <div className="flex h-screen overflow-hidden" style={{ background: 'var(--color-bg)' }}>

            {/* ── Sidebar ── */}
            <aside
                className="flex flex-col flex-shrink-0 overflow-hidden"
                style={{
                    width: 230,
                    background: 'linear-gradient(180deg, #12143a 0%, #0d0f24 100%)',
                    borderRight: '1px solid rgba(255,255,255,0.06)',
                }}
            >
                {/* Logo */}
                <div style={{ padding: '22px 18px 16px' }}>
                    <div className="flex items-center gap-2.5">
                        <div style={{
                            width: 32, height: 32, borderRadius: 10, flexShrink: 0,
                            background: 'var(--gradient-primary)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 4px 16px rgba(99, 102, 241, 0.35)',
                        }}>
                            <span style={{ color: 'white', fontWeight: 900, fontSize: 14 }}>S</span>
                        </div>
                        <span style={{ fontWeight: 900, fontSize: 15, color: '#f1f3f9', letterSpacing: '-0.02em' }}>StudyMesh</span>
                    </div>
                </div>

                {/* Nav */}
                <nav style={{ flex: 1, overflowY: 'auto', padding: '4px 10px', display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            end={item.path === '/'}
                            style={({ isActive }) => ({
                                display: 'flex',
                                alignItems: 'center',
                                gap: 10,
                                padding: '10px 12px',
                                borderRadius: 10,
                                fontSize: 13,
                                fontWeight: isActive ? 700 : 500,
                                textDecoration: 'none',
                                transition: 'all 0.2s',
                                color: isActive ? '#a5b4fc' : '#8890b5',
                                background: isActive ? 'rgba(99, 102, 241, 0.12)' : 'transparent',
                                borderLeft: isActive ? '2px solid #6366f1' : '2px solid transparent',
                            })}
                            onMouseEnter={e => {
                                if (!e.currentTarget.classList.contains('active'))
                                    e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                            }}
                            onMouseLeave={e => {
                                if (!e.currentTarget.classList.contains('active'))
                                    e.currentTarget.style.background = 'transparent';
                            }}
                        >
                            {item.icon}
                            {item.name}
                        </NavLink>
                    ))}
                </nav>

                {/* ── My Profile ── */}
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '10px' }}>
                    <NavLink
                        to="/profile"
                        style={({ isActive }) => ({
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            padding: '8px 10px',
                            borderRadius: 10,
                            textDecoration: 'none',
                            marginBottom: 4,
                            background: isActive ? 'rgba(99, 102, 241, 0.12)' : 'transparent',
                            transition: 'background 0.2s',
                        })}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                        onMouseLeave={e => {
                            if (!window.location.pathname.startsWith('/profile'))
                                e.currentTarget.style.background = 'transparent';
                        }}
                    >
                        <div style={{
                            width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                            overflow: 'hidden', border: '2px solid rgba(99, 102, 241, 0.3)',
                            background: 'rgba(99, 102, 241, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            {user?.avatar
                                ? <img src={user.avatar} alt={user.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                : <span style={{ fontSize: 11, fontWeight: 700, color: '#a5b4fc' }}>{getInitials(user?.name || '')}</span>
                            }
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: 12, fontWeight: 700, color: '#e0e7ff', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {user?.name}
                            </p>
                            <p style={{ fontSize: 10, color: '#636b8a', marginTop: 1 }}>View profile →</p>
                        </div>
                    </NavLink>

                    <button
                        onClick={logout}
                        style={{
                            width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                            padding: '7px 10px', borderRadius: 8, border: 'none',
                            background: 'transparent', cursor: 'pointer',
                            fontSize: 12, fontWeight: 600, color: '#f87171',
                            transition: 'background 0.15s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                    >
                        <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: 14, height: 14, flexShrink: 0 }}>
                            <path fillRule="evenodd" d="M3 4.25A2.25 2.25 0 015.25 2h5.5A2.25 2.25 0 0113 4.25v2a.75.75 0 01-1.5 0v-2a.75.75 0 00-.75-.75h-5.5a.75.75 0 00-.75.75v11.5c0 .414.336.75.75.75h5.5a.75.75 0 00.75-.75v-2a.75.75 0 011.5 0v2A2.25 2.25 0 0110.75 18h-5.5A2.25 2.25 0 013 15.75V4.25z" clipRule="evenodd" />
                            <path fillRule="evenodd" d="M6 10a.75.75 0 01.75-.75h9.546l-1.048-.943a.75.75 0 111.004-1.114l2.5 2.25a.75.75 0 010 1.114l-2.5 2.25a.75.75 0 11-1.004-1.114l1.048-.943H6.75A.75.75 0 016 10z" clipRule="evenodd" />
                        </svg>
                        Sign out
                    </button>
                </div>
            </aside>

            {/* ── Main Content ── */}
            <main className="flex-1 overflow-y-auto overflow-x-hidden mesh-overlay">
                <div style={{ maxWidth: 1200, margin: '0 auto', padding: '28px 28px' }}>
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default Layout;
