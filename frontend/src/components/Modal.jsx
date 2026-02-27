import React, { useEffect } from 'react';

const Modal = ({ isOpen, onClose, title, children, size = 'md' }) => {
    useEffect(() => {
        document.body.style.overflow = isOpen ? 'hidden' : 'unset';
        return () => { document.body.style.overflow = 'unset'; };
    }, [isOpen]);

    if (!isOpen) return null;

    const sizeClass = size === 'lg' ? 'max-w-3xl' : size === 'sm' ? 'max-w-md' : 'max-w-2xl';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
            {/* Backdrop */}
            <div className="absolute inset-0" onClick={onClose}
                style={{ background: 'rgba(6, 8, 18, 0.75)', backdropFilter: 'blur(8px)' }} />

            {/* Modal Card */}
            <div className={`relative w-full ${sizeClass} max-h-[90vh] flex flex-col animate-pop-in rounded-2xl`}
                style={{
                    background: 'var(--gradient-card)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    boxShadow: '0 24px 64px rgba(0,0,0,0.5), 0 0 0 1px rgba(6,182,212,0.1)',
                }}>
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4"
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <h2 className="text-base font-bold" style={{ color: '#f1f3f9' }}>{title}</h2>
                    <button onClick={onClose}
                        className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                        style={{ color: '#636b8a' }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#a0a6c4'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#636b8a'; }}>
                        <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                            <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default Modal;
