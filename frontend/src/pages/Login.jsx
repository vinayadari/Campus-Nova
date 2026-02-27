import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPw, setShowPw] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { login } = useAuth();
    const { show } = useToast();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await login(email, password);
            show('Welcome back! 🎉', 'success');
            navigate('/');
        } catch (err) {
            const msg = err.response?.data?.error || 'Login failed. Please check your credentials.';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex" style={{ background: 'var(--color-bg)' }}>
            {/* Left decorative panel */}
            <div className="hidden lg:flex w-[45%] relative flex-col items-center justify-center p-12 overflow-hidden hero-gradient">
                {/* Decorative orbs */}
                <div style={{ position: 'absolute', top: -80, right: -80, width: 300, height: 300, borderRadius: '50%', background: 'rgba(99,102,241,0.1)', filter: 'blur(60px)' }} />
                <div style={{ position: 'absolute', bottom: -60, left: -60, width: 250, height: 250, borderRadius: '50%', background: 'rgba(6,182,212,0.08)', filter: 'blur(50px)' }} />

                <div className="relative text-white text-center">
                    <div className="w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-6 animate-float"
                        style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', backdropFilter: 'blur(12px)' }}>
                        <span className="text-3xl font-black">S</span>
                    </div>
                    <h2 className="text-4xl font-black mb-4 leading-tight">Welcome back to<br />StudyMesh</h2>
                    <p className="text-white/50 text-base leading-relaxed max-w-xs mx-auto">
                        Your network of ambitious students is waiting. Connect, collaborate, and grow together.
                    </p>
                    <div className="mt-8 flex gap-3 justify-center">
                        {[['🔍', 'Discover'], ['💬', 'Chat'], ['🏆', 'Compete']].map(([e, l]) => (
                            <div key={l} className="px-4 py-2.5 rounded-xl text-xs font-bold"
                                style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)' }}>
                                {e} {l}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right form panel */}
            <div className="flex-1 flex items-center justify-center p-6" style={{ background: 'var(--color-bg-secondary)' }}>
                <div className="w-full max-w-sm animate-fade-up">
                    <div className="mb-8">
                        <div className="flex items-center gap-2 mb-6 lg:hidden">
                            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                                style={{ background: 'var(--gradient-primary)' }}>
                                <span className="text-white font-black text-sm">S</span>
                            </div>
                            <span className="font-black text-lg" style={{ color: '#f1f3f9' }}>StudyMesh</span>
                        </div>
                        <h1 className="text-2xl font-bold" style={{ color: '#f1f3f9' }}>Sign in</h1>
                        <p className="text-sm mt-1" style={{ color: '#636b8a' }}>Enter your account details below.</p>
                    </div>

                    {error && (
                        <div className="alert-error mb-6 animate-fade-up">
                            <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 shrink-0 mt-0.5">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                            </svg>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-semibold mb-1.5" style={{ color: '#a0a6c4' }}>Email address</label>
                            <input type="email" className="input" placeholder="you@university.edu"
                                value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold mb-1.5" style={{ color: '#a0a6c4' }}>Password</label>
                            <div className="relative">
                                <input type={showPw ? 'text' : 'password'} className="input pr-10" placeholder="••••••••"
                                    value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
                                <button type="button" tabIndex={-1}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                                    style={{ color: '#636b8a' }}
                                    onClick={() => setShowPw(!showPw)}>
                                    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                                        <path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" />
                                        <path fillRule="evenodd" d="M.664 10.59a1.651 1.651 0 010-1.186A10.004 10.004 0 0110 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0110 17c-4.257 0-7.893-2.66-9.336-6.41zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        <button type="submit" disabled={loading} className="btn-primary w-full h-11 text-sm mt-2">
                            {loading ? (
                                <span className="flex items-center gap-2">
                                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                    Signing in…
                                </span>
                            ) : 'Sign in'}
                        </button>
                    </form>

                    <p className="mt-6 text-center text-sm" style={{ color: '#636b8a' }}>
                        Don't have an account?{' '}
                        <Link to="/register" className="font-bold hover:underline" style={{ color: '#a5b4fc' }}>
                            Create one
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
