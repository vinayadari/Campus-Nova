import React from 'react';
import { Link } from 'react-router-dom';

const UserCard = ({ user, onConnect, connectState = 'idle' }) => {
    const { name, major, university, skills, interests, collabScore, _id, avatar } = user;

    const getScoreColor = (score) => {
        if (score >= 80) return 'bg-green-100 text-green-700 border-green-200';
        if (score >= 60) return 'bg-indigo-100 text-indigo-700 border-indigo-200';
        if (score >= 40) return 'bg-amber-100 text-amber-700 border-amber-200';
        return 'bg-gray-100 text-gray-700 border-gray-200';
    };

    const getScoreLabel = (score) => {
        if (score >= 80) return 'Excellent Match';
        if (score >= 60) return 'Strong Match';
        if (score >= 40) return 'Decent Match';
        return 'Low Match';
    };

    const getInitials = (userName) => {
        return userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    return (
        <div className="card hover:shadow-md transition-shadow flex flex-col group">
            <div className="flex justify-between items-start mb-4">
                <Link to={`/profile/${_id}`} className="flex items-center group-hover:text-indigo-600 transition-colors">
                    <div className="w-12 h-12 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center font-bold text-indigo-600 mr-3 overflow-hidden shadow-sm">
                        {avatar ? <img src={avatar} className="w-full h-full object-cover" /> : getInitials(name)}
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900 leading-tight">{name}</h3>
                        <p className="text-xs text-gray-500">{major}</p>
                    </div>
                </Link>
                <div className={`badge border ${getScoreColor(collabScore)} flex items-center`}>
                    <span className="mr-1">⚡</span> {collabScore}%
                </div>
            </div>

            <div className="text-xs text-gray-500 mb-4 italic">
                {university || 'Global Student'}
            </div>

            <div className="mb-3">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Top Skills</p>
                <div className="flex flex-wrap gap-1.5 h-6 overflow-hidden">
                    {skills.slice(0, 3).map((s, i) => (
                        <span key={i} className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-[10px] font-medium border border-gray-200">
                            {s}
                        </span>
                    ))}
                    {skills.length > 3 && <span className="text-[10px] text-gray-400">+{skills.length - 3}</span>}
                </div>
            </div>

            <div className="mb-5 flex-1">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Interests</p>
                <div className="flex flex-wrap gap-1.5 h-6 overflow-hidden">
                    {interests.slice(0, 3).map((interest, i) => (
                        <span key={i} className="bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded text-[10px] font-medium border border-indigo-100">
                            {interest}
                        </span>
                    ))}
                    {interests.length > 3 && <span className="text-[10px] text-gray-400">+{interests.length - 3}</span>}
                </div>
            </div>

            <div className="pt-4 border-t border-gray-50 flex flex-col gap-2">
                <p className="text-[10px] font-semibold text-center text-indigo-400 mb-1">{getScoreLabel(collabScore)}</p>
                {connectState === 'connected' ? (
                    <button disabled className="btn-secondary w-full py-1.5 text-sm bg-gray-50 cursor-default flex items-center justify-center">
                        <span className="mr-2">✨</span> Connected
                    </button>
                ) : connectState === 'sent' ? (
                    <button disabled className="btn-secondary w-full py-1.5 text-sm border-amber-200 text-amber-600 bg-amber-50 cursor-default flex items-center justify-center">
                        <span className="mr-2">⏳</span> Request Sent
                    </button>
                ) : (
                    <button
                        onClick={() => onConnect(_id)}
                        className="btn-primary w-full py-1.5 text-sm flex items-center justify-center"
                    >
                        <span className="mr-2">🤝</span> Connect
                    </button>
                )}
            </div>
        </div>
    );
};

export default UserCard;
