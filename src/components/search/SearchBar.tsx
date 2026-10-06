'use client';

import React, { useState, useEffect } from 'react';

interface SearchBarProps {
  value: string;
  onChange: (query: string) => void;
  placeholder?: string;
  className?: string;
}

export default function SearchBar({
  value,
  onChange,
  placeholder = 'Buscar por nombre (ej. Jujuy, Areco, San Martín) o número (ej. 115, 49)...',
  className = '',
}: SearchBarProps) {
  const [internalValue, setInternalValue] = useState(value);

  useEffect(() => {
    setInternalValue(value);
  }, [value]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (internalValue !== value) {
        onChange(internalValue);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [internalValue, value, onChange]);

  return (
    <div className={`relative flex items-center ${className}`}>
      <span className="absolute left-3.5 text-slate-400 pointer-events-none text-base">
        🔍
      </span>
      <input
        type="text"
        value={internalValue}
        onChange={(e) => setInternalValue(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-posadas-river focus:border-transparent text-sm shadow-sm transition-all"
      />
      {internalValue && (
        <button
          type="button"
          onClick={() => {
            setInternalValue('');
            onChange('');
          }}
          className="absolute right-3 text-slate-400 hover:text-slate-600 text-sm p-1 rounded-full hover:bg-slate-100 transition-colors"
          title="Limpiar búsqueda"
        >
          ✕
        </button>
      )}
    </div>
  );
}
