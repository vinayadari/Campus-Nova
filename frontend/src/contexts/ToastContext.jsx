import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

export const useToast = () => {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error('useToast must be inside ToastProvider');
    return ctx;
};

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const show = useCallback((message, type = 'info', duration = 3500) => {
        const id = Date.now() + Math.random();
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, duration);
    }, []);

    const icons = { success: '✓', error: '✕', info: 'i' };

    return (
        <ToastContext.Provider value={{ show }}>
            {children}
            <div id="toast-container">
                {toasts.map(t => (
                    <div key={t.id} className={`toast toast-${t.type}`}>
                        <span className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
                            style={{ background: t.type === 'success' ? '#34d399' : t.type === 'error' ? '#f87171' : '#60a5fa' }}>
                            {icons[t.type]}
                        </span>
                        <span className="flex-1">{t.message}</span>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
};
