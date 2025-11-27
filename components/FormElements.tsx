
import React, { useState, useRef, useEffect } from 'react';
import Spinner from './Spinner';

// Common types
type Label = { ar: string; en: string };
type Lang = 'ar' | 'en';

// --- InputField ---
interface InputFieldProps {
  label: Label;
  lang: Lang;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  placeholder?: string;
  ariaRequired?: boolean;
}

export const InputField: React.FC<InputFieldProps> = ({ label, lang, name, value, onChange, type = 'text', placeholder, ariaRequired }) => {
  const isAr = lang === 'ar';
  return (
    <div className="flex flex-col">
      <label htmlFor={name} className={`flex items-end text-sm font-semibold text-gray-800 mb-1 ${isAr ? 'justify-between' : 'justify-start'}`}>
        {isAr ? (
            <>
                <span className="text-gray-700" aria-hidden="true" lang="en">{label.en}</span>
                <span>{label.ar}</span>
            </>
        ) : (
            <span>{label.en}</span>
        )}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        aria-required={ariaRequired}
        className="w-full p-2 border border-gray-400 rounded-md shadow-sm focus:ring-indigo-600 focus:border-indigo-600 transition bg-gray-50 text-base text-gray-900 placeholder-gray-500 focus:bg-white"
      />
    </div>
  );
};


// --- TextArea ---
interface TextAreaProps {
  label: Label;
  lang: Lang;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  rows?: number;
  placeholder?: string;
  onSmartRefine?: (instruction: string) => Promise<string>;
}

export const TextArea: React.FC<TextAreaProps> = ({ label, lang, name, value, onChange, rows = 3, placeholder, onSmartRefine }) => {
    const isAr = lang === 'ar';
    const hasLabel = label.ar || label.en;
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    const toggleMenu = (e: React.MouseEvent) => {
        e.preventDefault();
        setIsMenuOpen(!isMenuOpen);
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleAction = async (instruction: string) => {
        if (!onSmartRefine) return;
        setIsMenuOpen(false);
        setIsLoading(true);
        try {
            const newText = await onSmartRefine(instruction);
            // Create a synthetic event to update the parent state
            const event = {
                target: {
                    name,
                    value: newText
                }
            } as React.ChangeEvent<HTMLTextAreaElement>;
            onChange(event);
        } catch (error) {
            console.error("Smart refine failed", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col w-full relative">
            <div className={`flex items-end mb-1 ${isAr ? 'justify-between' : 'justify-start gap-4'}`}>
                {hasLabel && (
                    <label htmlFor={name} className="flex flex-col md:flex-row md:gap-2 text-sm font-semibold text-gray-800">
                         {isAr ? (
                            <>
                                <span className="text-gray-700 order-1 md:order-2" aria-hidden="true" lang="en">{label.en}</span>
                                <span className="order-2 md:order-1">{label.ar}</span>
                            </>
                        ) : (
                            <span>{label.en}</span>
                        )}
                    </label>
                )}
                
                {onSmartRefine && (
                    <div className="relative" ref={menuRef}>
                        <button 
                            onClick={toggleMenu}
                            className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-bold transition border shadow-sm ${isLoading ? 'bg-gray-100 text-gray-400 cursor-wait' : 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100'}`}
                            disabled={isLoading}
                            type="button"
                        >
                            {isLoading ? <Spinner className="w-3 h-3 text-current"/> : (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 9a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zm7-4a1 1 0 011 1v1h1a1 1 0 110 2h-1v1a1 1 0 11-2 0v-1h-1a1 1 0 110-2h1V8a1 1 0 011-1z" clipRule="evenodd" />
                                </svg>
                            )}
                            {isAr ? 'مساعد ذكي' : 'Smart Assist'}
                        </button>

                        {isMenuOpen && !isLoading && (
                            <div className={`absolute bottom-full mb-1 z-30 w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-1 ${isAr ? 'left-0' : 'right-0'}`}>
                                <div className="px-3 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-100 bg-gray-50 rounded-t-lg">
                                    {isAr ? 'تحسين المحتوى' : 'Refine Content'}
                                </div>
                                <button onClick={() => handleAction('Make it more engaging and student-centered')} className="w-full text-start px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 flex items-center gap-2">
                                     ✨ {isAr ? 'اجعلها أكثر تفاعلاً' : 'Make Engaging'}
                                </button>
                                <button onClick={() => handleAction('Simplify the language for better understanding')} className="w-full text-start px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 flex items-center gap-2">
                                     📉 {isAr ? 'تبسيط اللغة' : 'Simplify'}
                                </button>
                                <button onClick={() => handleAction('Expand with more details and examples')} className="w-full text-start px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 flex items-center gap-2">
                                     ➕ {isAr ? 'توسيع وإضافة تفاصيل' : 'Expand'}
                                </button>
                                <button onClick={() => handleAction('Fix grammar and spelling errors')} className="w-full text-start px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 flex items-center gap-2">
                                     📝 {isAr ? 'تصحيح لغوي' : 'Fix Grammar'}
                                </button>
                                <button onClick={() => handleAction('Add differentiation strategies (Support & Extension)')} className="w-full text-start px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 flex items-center gap-2 border-t border-gray-100 mt-1">
                                     🤝 {isAr ? 'إضافة تمايز' : 'Add Differentiation'}
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
            <textarea
                id={name}
                name={name}
                value={value}
                onChange={onChange}
                rows={rows}
                placeholder={placeholder}
                className={`w-full p-2 border border-gray-400 rounded-md shadow-sm focus:ring-indigo-600 focus:border-indigo-600 transition bg-gray-50 text-base text-gray-900 placeholder-gray-500 focus:bg-white ${isLoading ? 'opacity-50 cursor-wait' : ''}`}
                disabled={isLoading}
            />
        </div>
    );
};

// --- Checkbox ---
interface CheckboxProps {
  label: Label;
  lang: Lang;
  name: string;
  checked: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  otherTextName?: string;
  otherTextValue?: string;
  onOtherTextChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const Checkbox: React.FC<CheckboxProps> = ({ label, lang, name, checked, onChange, otherTextName, otherTextValue, onOtherTextChange }) => {
    const isAr = lang === 'ar';
    const isOther = !!otherTextName;

    return (
        <label htmlFor={name} className="inline-flex items-start gap-3 cursor-pointer text-gray-800 w-full py-2">
            <div className="relative w-5 h-5 flex-shrink-0 mt-0.5">
                 <input
                    id={name}
                    type="checkbox"
                    name={name}
                    checked={checked}
                    onChange={onChange}
                    className="absolute opacity-0 w-full h-full cursor-pointer peer"
                />
                <div className="w-full h-full border border-black bg-white transition-colors peer-focus:ring-2 peer-focus:ring-offset-0 peer-focus:ring-[#8A1538]"></div>
                <svg
                    className="absolute w-5 h-5 left-0 top-0 text-[#8A1538] transition-opacity opacity-0 peer-checked:opacity-100 pointer-events-none"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                >
                    <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                    />
                </svg>
            </div>
            
            <div className="flex-1 min-w-0 break-words">
                <span className="font-bold">{isAr ? label.ar : label.en}</span>
                {' '}
                <span className="text-gray-800" lang={isAr ? 'en' : 'ar'}>
                    {isAr ? label.en : label.ar}
                </span>
                {isOther && (
                    <input
                        type="text"
                        name={otherTextName}
                        value={otherTextValue}
                        onChange={onOtherTextChange}
                        onClick={(e) => e.preventDefault()} // Prevent label click from toggling checkbox
                        className={`inline-block p-1 border-b border-gray-400 focus:outline-none focus:ring-0 focus:border-indigo-500 bg-transparent w-20 ${isAr ? 'mr-2' : 'ml-2'}`}
                        aria-label={`${isAr ? label.ar : label.en} text input`}
                    />
                )}
            </div>
        </label>
    );
};


// --- SelectField ---
type Option = string | { value: string; ar: string; en: string };

interface SelectFieldProps {
  label: Label;
  lang: Lang;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: Option[];
  ariaRequired?: boolean;
}

export const SelectField: React.FC<SelectFieldProps> = ({ label, lang, name, value, onChange, options, ariaRequired }) => {
    const isAr = lang === 'ar';
    return (
        <div className="flex flex-col">
            <label htmlFor={name} className={`flex items-end text-sm font-semibold text-gray-800 mb-1 ${isAr ? 'justify-between' : 'justify-start'}`}>
                {isAr ? (
                    <>
                        <span className="text-gray-700" aria-hidden="true" lang="en">{label.en}</span>
                        <span>{label.ar}</span>
                    </>
                ) : (
                    <span>{label.en}</span>
                )}
            </label>
            <select
                id={name}
                name={name}
                value={value}
                onChange={onChange}
                aria-required={ariaRequired}
                className="w-full p-2 border border-gray-400 rounded-md shadow-sm focus:ring-indigo-600 focus:border-indigo-600 transition bg-gray-50 text-base text-gray-900 placeholder-gray-500 focus:bg-white"
            >
                <option value="" disabled>{isAr ? 'اختر...' : 'Select...'}</option>
                {options.map((option, index) => {
                    if (typeof option === 'string') {
                        return <option key={index} value={option}>{option}</option>;
                    }
                    return <option key={index} value={option.value}>{isAr ? option.ar : option.en}</option>;
                })}
            </select>
        </div>
    );
};
