import React, { useState } from 'react';

const TagInput = ({ value = [], onChange, placeholder = "Add a tag..." }) => {
    const [input, setInput] = useState('');

    const handleKeyDown = (e) => {
        if ((e.key === 'Enter' || e.key === ',') && input.trim()) {
            e.preventDefault();
            const newTag = input.trim().replace(',', '');
            if (!value.includes(newTag)) {
                onChange([...value, newTag]);
            }
            setInput('');
        } else if (e.key === 'Backspace' && !input && value.length > 0) {
            removeTag(value.length - 1);
        }
    };

    const removeTag = (indexToRemove) => {
        onChange(value.filter((_, index) => index !== indexToRemove));
    };

    return (
        <div className="flex flex-wrap items-center gap-2 p-2 border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-indigo-500 bg-white min-h-[42px] transition-shadow">
            {value.map((tag, index) => (
                <span
                    key={index}
                    className="flex items-center bg-indigo-600 text-white text-xs font-medium px-2 py-1 rounded-full animate-in fade-in zoom-in duration-200"
                >
                    {tag}
                    <button
                        type="button"
                        onClick={() => removeTag(index)}
                        className="ml-1.5 text-indigo-200 hover:text-white transition-colors"
                    >
                        &times;
                    </button>
                </span>
            ))}
            <input
                type="text"
                className="flex-1 outline-none text-sm placeholder:text-gray-400 min-w-[120px]"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={value.length === 0 ? placeholder : ""}
            />
        </div>
    );
};

export default TagInput;
