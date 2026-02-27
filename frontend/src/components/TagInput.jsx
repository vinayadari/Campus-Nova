import React, { useState } from 'react';

const TagInput = ({ value = [], onChange, placeholder = "Add a tag and press Enter…" }) => {
    const [input, setInput] = useState('');

    const addTag = (raw) => {
        const tag = raw.trim().replace(/,$/, '');
        if (tag && !value.includes(tag)) {
            onChange([...value, tag]);
        }
        setInput('');
    };

    const handleKeyDown = (e) => {
        if ((e.key === 'Enter' || e.key === ',') && input.trim()) {
            e.preventDefault();
            addTag(input);
        } else if (e.key === 'Backspace' && !input && value.length > 0) {
            onChange(value.slice(0, -1));
        }
    };

    const removeTag = (index) => onChange(value.filter((_, i) => i !== index));

    return (
        <div className="flex flex-wrap items-center gap-1.5 p-2.5 rounded-xl border transition-all duration-200 min-h-[44px]"
            style={{ borderColor: 'rgba(255,255,255,0.1)', background: 'var(--color-surface)' }}
            onFocus={(e) => e.currentTarget.style.boxShadow = '0 0 0 2px rgba(99,102,241,0.5)'}
            onBlur={(e) => e.currentTarget.style.boxShadow = 'none'}
            onClick={(e) => e.currentTarget.querySelector('input')?.focus()}>
            {value.map((tag, index) => (
                <span key={index}
                    className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg animate-pop-in"
                    style={{ background: 'rgba(99,102,241,0.15)', color: '#a5b4fc', border: '1px solid rgba(255,255,255,0.06)' }}>
                    {tag}
                    <button type="button" onClick={() => removeTag(index)}
                        className="transition-colors leading-none ml-0.5" style={{ color: 'rgba(165,180,252,0.5)' }}
                        onMouseEnter={(e) => e.target.style.color = '#a5b4fc'}
                        onMouseLeave={(e) => e.target.style.color = 'rgba(165,180,252,0.5)'}>
                        ×
                    </button>
                </span>
            ))}
            <input
                type="text"
                className="flex-1 outline-none text-sm bg-transparent placeholder:text-[#94a3b8] min-w-[130px]"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={value.length === 0 ? placeholder : ''}
            />
        </div>
    );
};

export default TagInput;
