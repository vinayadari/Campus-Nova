import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import TagInput from '../components/TagInput';
import { useToast } from '../contexts/ToastContext';

const lookingForOptions = [
    { value: 'Project Partner', icon: '🚀' },
    { value: 'Study Buddy', icon: '📚' },
    { value: 'Mentor', icon: '🎓' },
    { value: 'Mentee', icon: '🌱' },
    { value: 'Hackathon Team', icon: '💻' },
];

const TOTAL_STEPS = 4;

const Onboarding = () => {
    const [step, setStep] = useState(1);
    const [skills, setSkills] = useState([]);
    const [interests, setInterests] = useState([]);
    const [lookingFor, setLookingFor] = useState([]);
    const [socials, setSocials] = useState({ github: '', linkedin: '', twitter: '', instagram: '', discord: '', portfolio: '' });
    const [loading, setLoading] = useState(false);

    const { updateUser } = useAuth();
    const { show } = useToast();
    const navigate = useNavigate();

    const handleToggleLookingFor = (item) => {
        setLookingFor(prev => prev.includes(item) ? prev.filter(l => l !== item) : [...prev, item]);
    };

    const handleSocialChange = (e) => setSocials({ ...socials, [e.target.name]: e.target.value });

    const handleFinish = async () => {
        setLoading(true);
        try {
            const res = await api.patch('/users/me', { skills, interests, lookingFor, ...socials });
            updateUser(res.data);
            show('Profile set up successfully! 🎉', 'success');
            navigate('/');
        } catch (err) {
            show('Failed to save profile. Please try again.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const canNext = () => {
        if (step === 1) return skills.length >= 2;
        if (step === 2) return interests.length >= 2;
        if (step === 3) return lookingFor.length >= 1;
        return true;
    };

    const stepTitles = [
        { title: "What are your core skills?", sub: "Tell us what you're good at so we can match you with the right projects.", icon: "💻" },
        { title: "What are you interested in?", sub: "This helps us find students with similar passions.", icon: "🧠" },
        { title: "What are you looking for?", sub: "Let us know your goals on StudyMesh.", icon: "🎯" },
        { title: "Where can we find you?", sub: "Add your socials to build credibility. All fields are optional.", icon: "🌐" },
    ];
    const current = stepTitles[step - 1];

    return (
        <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'var(--color-bg)' }}>
            <div className="w-full max-w-xl animate-fade-up">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="w-12 h-12 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                        style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(6,182,212,0.2))', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <span className="font-black" style={{ color: '#a5b4fc' }}>S</span>
                    </div>
                    <p className="text-xs font-bold tracking-widest uppercase mb-1" style={{ color: '#a5b4fc' }}>Step {step} of {TOTAL_STEPS}</p>
                </div>

                {/* Card */}
                <div className="rounded-2xl overflow-hidden glass" style={{ border: '1px solid rgba(255,255,255,0.06)', background: 'var(--color-surface)', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
                    {/* Progress bar */}
                    <div className="h-1 w-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
                        <div className="h-full transition-all duration-500 ease-out"
                            style={{ width: `${(step / TOTAL_STEPS) * 100}%`, background: 'linear-gradient(90deg, #6366f1, #06b6d4)' }} />
                    </div>

                    <div className="p-8">
                        {/* Step header */}
                        <div className="mb-7">
                            <div className="flex items-center gap-3 mb-2">
                                <span className="text-2xl">{current.icon}</span>
                                <h2 className="text-xl font-bold" style={{ color: '#f1f3f9' }}>{current.title}</h2>
                            </div>
                            <p className="text-sm leading-relaxed" style={{ color: '#a0a6c4' }}>{current.sub}</p>
                        </div>

                        {/* Step content */}
                        <div className="min-h-[220px] flex flex-col justify-start">
                            {step === 1 && (
                                <div className="space-y-3">
                                    <TagInput value={skills} onChange={setSkills} placeholder="Type skill and press Enter (e.g. React, Python)" />
                                    <p className="text-xs" style={{ color: '#636b8a' }}>Add at least 2 skills to continue.</p>
                                </div>
                            )}

                            {step === 2 && (
                                <div className="space-y-3">
                                    <TagInput value={interests} onChange={setInterests} placeholder="Type interest and press Enter (e.g. AI, Music)" />
                                    <p className="text-xs" style={{ color: '#636b8a' }}>Add at least 2 interests to continue.</p>
                                </div>
                            )}

                            {step === 3 && (
                                <div className="grid grid-cols-2 gap-2.5">
                                    {lookingForOptions.map(({ value, icon }) => {
                                        const selected = lookingFor.includes(value);
                                        return (
                                            <button key={value} type="button" onClick={() => handleToggleLookingFor(value)}
                                                className={`flex items-center gap-3 p-3.5 rounded-xl border transition-all duration-200 ${selected
                                                    ? 'border-indigo-500 bg-indigo-500/20 text-indigo-300'
                                                    : 'border-white/10 bg-white/5 text-slate-400 hover:border-indigo-400/50'
                                                    }`}>
                                                <span className="text-lg">{icon}</span>
                                                <span className={`text-sm font-semibold ${selected ? 'text-indigo-300' : 'text-slate-400'}`}>{value}</span>
                                                {selected && (
                                                    <div className="ml-auto w-4 h-4 rounded-full flex items-center justify-center shrink-0" style={{ background: '#6366f1' }}>
                                                        <svg viewBox="0 0 12 12" fill="currentColor" className="w-2.5 h-2.5 text-white">
                                                            <path d="M10 3L5 8.5 2 5.5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                                                        </svg>
                                                    </div>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}

                            {step === 4 && (
                                <div className="grid grid-cols-2 gap-3">
                                    {[
                                        { name: 'github', label: 'GitHub', placeholder: 'github.com/username' },
                                        { name: 'linkedin', label: 'LinkedIn', placeholder: 'linkedin.com/in/name' },
                                        { name: 'twitter', label: 'Twitter / X', placeholder: 'twitter.com/name' },
                                        { name: 'instagram', label: 'Instagram', placeholder: 'instagram.com/name' },
                                        { name: 'discord', label: 'Discord', placeholder: 'Username#1234' },
                                        { name: 'portfolio', label: 'Portfolio', placeholder: 'yoursite.com' },
                                    ].map(f => (
                                        <div key={f.name}>
                                            <label className="section-label block mb-1.5">{f.label}</label>
                                            <input name={f.name} className="input text-sm" value={socials[f.name]}
                                                onChange={handleSocialChange} placeholder={f.placeholder} />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Navigation */}
                        <div className="flex justify-between items-center mt-8">
                            {step > 1 ? (
                                <button onClick={() => setStep(s => s - 1)} className="btn-secondary px-4 focus:outline-none" style={{ background: 'transparent', borderColor: 'transparent', color: '#a0a6c4' }}
                                    onMouseEnter={(e) => e.target.style.color = '#f1f3f9'}
                                    onMouseLeave={(e) => e.target.style.color = '#a0a6c4'}>
                                    ← Back
                                </button>
                            ) : <div />}

                            {step < TOTAL_STEPS ? (
                                <button disabled={!canNext()} onClick={() => setStep(s => s + 1)}
                                    className="btn-primary px-8">
                                    Continue →
                                </button>
                            ) : (
                                <button disabled={loading} onClick={handleFinish}
                                    className="btn-primary px-8"
                                    style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
                                    {loading ? (
                                        <span className="flex items-center gap-2">
                                            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                            </svg>
                                            Saving…
                                        </span>
                                    ) : 'Finish Setup 🚀'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Skip option */}
                {step === 4 && (
                    <p className="text-center mt-4 text-xs text-slate-400">
                        You can add socials later from your profile.{' '}
                        <button onClick={handleFinish} className="text-[#6366f1] font-semibold hover:underline">Skip</button>
                    </p>
                )}
            </div>
        </div>
    );
};

export default Onboarding;
