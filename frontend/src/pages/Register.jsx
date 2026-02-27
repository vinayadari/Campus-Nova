import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

const yearOptions = ['1st', '2nd', '3rd', '4th', 'Graduate', 'PhD'];

const Register = () => {
    const [formData, setFormData] = useState({
        name: '', email: '', password: '', university: '', major: '', year: '1st',
    });
    const [showPw, setShowPw] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { register } = useAuth();
    const { show } = useToast();
    const navigate = useNavigate();

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const pwStrength = (pw) => {
        if (!pw) return 0;
        let s = 0;
        if (pw.length >= 8) s++;
        if (/[A-Z]/.test(pw)) s++;
        if (/\d/.test(pw)) s++;
        if (/[^a-zA-Z0-9]/.test(pw)) s++;
        return s;
    };
    const strength = pwStrength(formData.password);
    const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'];
    const strengthColor = ['', '#f87171', '#fbbf24', '#60a5fa', '#34d399'];

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await register(formData);
            show('Account created! Let\'s set up your profile.', 'success');
            navigate('/onboarding');
        } catch (err) {
            setError(err.response?.data?.error || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex" style={{ background: 'var(--color-bg)' }}>
            {/* Left panel */}
            <div className="hidden lg:flex w-[42%] relative flex-col items-center justify-center p-12 overflow-hidden hero-gradient">
                <div style={{ position: 'absolute', top: -80, right: -80, width: 280, height: 280, borderRadius: '50%', background: 'rgba(139,92,246,0.1)', filter: 'blur(60px)' }} />
                <div style={{ position: 'absolute', bottom: -60, left: -60, width: 220, height: 220, borderRadius: '50%', background: 'rgba(99,102,241,0.08)', filter: 'blur(50px)' }} />

                <div className="relative text-white text-center max-w-xs">
                    <div className="w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-6 animate-float"
                        style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', backdropFilter: 'blur(12px)' }}>
                        <span className="text-3xl font-black">S</span>
                    </div>
                    <h2 className="text-4xl font-black mb-4 leading-tight">Join the student network</h2>
                    <p className="text-white/50 text-sm leading-relaxed">
                        Find your next research partner, hackathon team, or mentor. StudyMesh connects you with students who share your goals.
                    </p>
                    <div className="mt-8 grid grid-cols-3 gap-3">
                        {[['🚀', 'Projects'], ['🧠', 'Study'], ['💬', 'Chat']].map(([e, l]) => (
                            <div key={l} className="rounded-2xl p-3 text-center"
                                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(8px)' }}>
                                <div className="text-2xl mb-1">{e}</div>
                                <div className="text-xs font-bold text-white/60">{l}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Form */}
            <div className="flex-1 flex items-center justify-center p-6 overflow-y-auto" style={{ background: 'var(--color-bg-secondary)' }}>
                <div className="w-full max-w-md animate-fade-up py-8">
                    <div className="mb-8">
                        <div className="flex items-center gap-2 mb-6 lg:hidden">
                            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                                style={{ background: 'var(--gradient-primary)' }}>
                                <span className="text-white font-black text-sm">S</span>
                            </div>
                            <span className="font-black text-lg" style={{ color: '#f1f3f9' }}>StudyMesh</span>
                        </div>
                        <h1 className="text-2xl font-bold" style={{ color: '#f1f3f9' }}>Create your account</h1>
                        <p className="text-sm mt-1" style={{ color: '#636b8a' }}>Join thousands of students collaborating on StudyMesh.</p>
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
                            <label className="block text-sm font-semibold mb-1.5" style={{ color: '#a0a6c4' }}>Full Name</label>
                            <input name="name" className="input" placeholder="Alex Johnson" value={formData.name} onChange={handleChange} required />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold mb-1.5" style={{ color: '#a0a6c4' }}>Email address</label>
                            <input name="email" type="email" className="input" placeholder="you@uni.edu" value={formData.email} onChange={handleChange} required />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold mb-1.5" style={{ color: '#a0a6c4' }}>Password</label>
                            <div className="relative">
                                <input name="password" type={showPw ? 'text' : 'password'} className="input pr-10"
                                    placeholder="At least 6 characters" value={formData.password} onChange={handleChange} required minLength={6} />
                                <button type="button" tabIndex={-1} onClick={() => setShowPw(!showPw)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: '#636b8a' }}>
                                    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                                        <path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" />
                                        <path fillRule="evenodd" d="M.664 10.59a1.651 1.651 0 010-1.186A10.004 10.004 0 0110 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0110 17c-4.257 0-7.893-2.66-9.336-6.41zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                                    </svg>
                                </button>
                            </div>
                            {formData.password && (
                                <div className="mt-2 flex items-center gap-2">
                                    <div className="flex-1 flex gap-1">
                                        {[1, 2, 3, 4].map(i => (
                                            <div key={i} className="h-1 flex-1 rounded-full transition-all duration-300"
                                                style={{ background: i <= strength ? strengthColor[strength] : 'rgba(255,255,255,0.08)' }} />
                                        ))}
                                    </div>
                                    <span className="text-xs font-medium" style={{ color: strengthColor[strength] || '#636b8a' }}>{strengthLabel[strength]}</span>
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-semibold mb-1.5" style={{ color: '#a0a6c4' }}>University</label>
                            <input name="university" className="input" placeholder="Stanford University" value={formData.university} onChange={handleChange} required />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-sm font-semibold mb-1.5" style={{ color: '#a0a6c4' }}>Major</label>
                                <input name="major" className="input" placeholder="Computer Science" value={formData.major} onChange={handleChange} required />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold mb-1.5" style={{ color: '#a0a6c4' }}>Year</label>
                                <select name="year" className="input" value={formData.year} onChange={handleChange} required>
                                    {yearOptions.map(y => <option key={y} value={y}>{y} Year</option>)}
                                </select>
                            </div>
                        </div>

                        <button type="submit" disabled={loading} className="btn-primary w-full h-11 text-sm mt-2">
                            {loading ? (
                                <span className="flex items-center gap-2">
                                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                    Creating account…
                                </span>
                            ) : 'Create account'}
                        </button>
                    </form>

                    <p className="mt-6 text-center text-sm" style={{ color: '#636b8a' }}>
                        Already have an account?{' '}
                        <Link to="/login" className="font-bold hover:underline" style={{ color: '#a5b4fc' }}>Sign in</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Register;
