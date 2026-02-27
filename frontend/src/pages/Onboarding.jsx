import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import TagInput from '../components/TagInput';

const Onboarding = () => {
    const [step, setStep] = useState(1);
    const [skills, setSkills] = useState([]);
    const [interests, setInterests] = useState([]);
    const [lookingFor, setLookingFor] = useState([]);
    const [loading, setLoading] = useState(false);

    const { updateUser } = useAuth();
    const navigate = useNavigate();

    const lookingForOptions = [
        'Project Partner', 'Study Buddy', 'Mentor', 'Mentee', 'Hackathon Team'
    ];

    const handleToggleLookingFor = (item) => {
        if (lookingFor.includes(item)) {
            setLookingFor(lookingFor.filter(l => l !== item));
        } else {
            setLookingFor([...lookingFor, item]);
        }
    };

    const handleFinish = async () => {
        setLoading(true);
        try {
            const res = await api.patch('/users/me', {
                skills,
                interests,
                lookingFor
            });
            updateUser(res.data);
            navigate('/');
        } catch (err) {
            console.error('Onboarding failed', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50/50 p-6">
            <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
                {/* Progress Bar */}
                <div className="w-full h-1.5 bg-gray-100">
                    <div
                        className="h-full bg-indigo-600 transition-all duration-500 ease-out"
                        style={{ width: `${(step / 3) * 100}%` }}
                    />
                </div>

                <div className="p-10">
                    <div className="mb-10 text-center">
                        <span className="inline-block bg-indigo-50 text-indigo-700 text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-3">
                            Step {step} of 3
                        </span>
                        <h2 className="text-3xl font-extrabold text-gray-900">
                            {step === 1 && "What are your core skills? 💻"}
                            {step === 2 && "What are you interested in? 🧠"}
                            {step === 3 && "What are you looking for? 🔍"}
                        </h2>
                        <p className="text-gray-500 mt-2">
                            {step === 1 && "Tell us what you're good at so you can match with the right projects."}
                            {step === 2 && "This helps us find students with similar passions."}
                            {step === 3 && "Let us know your goals on StudyMesh."}
                        </p>
                    </div>

                    <div className="min-h-[200px] flex flex-col justify-center animate-in fade-in slide-in-from-right-4 duration-500">
                        {step === 1 && (
                            <div className="space-y-4">
                                <TagInput
                                    value={skills}
                                    onChange={setSkills}
                                    placeholder="Type skill (e.g. React, Python) and press Enter"
                                />
                                <p className="text-xs text-gray-400 font-medium">Add at least 2 skills to continue.</p>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="space-y-4">
                                <TagInput
                                    value={interests}
                                    onChange={setInterests}
                                    placeholder="Type interest (e.g. AI, Music, Startups) and press Enter"
                                />
                                <p className="text-xs text-gray-400 font-medium">Add at least 2 interests to continue.</p>
                            </div>
                        )}

                        {step === 3 && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {lookingForOptions.map(option => (
                                    <button
                                        key={option}
                                        onClick={() => handleToggleLookingFor(option)}
                                        className={`p-4 rounded-xl border-2 text-left transition-all duration-200 flex items-center justify-between group ${lookingFor.includes(option)
                                                ? 'border-indigo-600 bg-indigo-50/50'
                                                : 'border-gray-100 bg-gray-50/30 hover:border-indigo-200'
                                            }`}
                                    >
                                        <span className={`font-semibold ${lookingFor.includes(option) ? 'text-indigo-700' : 'text-gray-600'}`}>
                                            {option}
                                        </span>
                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${lookingFor.includes(option) ? 'bg-indigo-600 border-indigo-600' : 'border-gray-200'
                                            }`}>
                                            {lookingFor.includes(option) && <span className="text-white text-xs">✓</span>}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="mt-12 flex justify-between items-center">
                        {step > 1 ? (
                            <button
                                onClick={() => setStep(step - 1)}
                                className="text-gray-500 font-bold hover:text-gray-900 transition-colors py-2 px-4"
                            >
                                ← Back
                            </button>
                        ) : <div />}

                        {step < 3 ? (
                            <button
                                disabled={(step === 1 && skills.length < 2) || (step === 2 && interests.length < 2)}
                                onClick={() => setStep(step + 1)}
                                className="btn-primary px-8 h-12 shadow-indigo-100 shadow-xl"
                            >
                                Next Step →
                            </button>
                        ) : (
                            <button
                                disabled={loading || lookingFor.length === 0}
                                onClick={handleFinish}
                                className="btn-primary px-10 h-12 bg-green-600 hover:bg-green-700 shadow-green-100 shadow-xl border-none"
                            >
                                {loading ? "Saving..." : "Finish Set Up 🚀"}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Onboarding;
