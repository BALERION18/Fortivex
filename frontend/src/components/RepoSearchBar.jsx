import React, { useState } from 'react';
import { Search, AlertCircle, CornerDownLeft } from 'lucide-react';
import { parseClientUrl } from '../utils/formatters.js';

export default function RepoSearchBar({ onSearch, isLoading, initialValue = '', isCompact = false }) {
  const [inputValue, setInputValue] = useState(initialValue);
  const [validationError, setValidationError] = useState('');

  function handleSubmit(e) {
    if (e) e.preventDefault();
    setValidationError('');

    const parsed = parseClientUrl(inputValue);
    if (!parsed.valid) {
      setValidationError(parsed.error);
      return;
    }

    onSearch(parsed.owner, parsed.repo);
  }

  return (
    <div className={`w-full ${isCompact ? 'max-w-md' : 'max-w-2xl'} mx-auto`}>
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative flex items-center bg-[#1e1e1e] border border-[#383838] rounded shadow-none focus-within:border-[#0d99ff] focus-within:ring-1 focus-within:ring-[#0d99ff]/50 transition">
          <div className="pl-3 pr-2 text-[#0d99ff] flex items-center">
            <Search className="h-3.5 w-3.5" />
          </div>

          <input
            type="text"
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              if (validationError) setValidationError('');
            }}
            placeholder="Search repository (e.g. facebook/react or github.com/...)"
            className="w-full py-1.5 bg-transparent text-[#f5f5f5] placeholder-[#666666] focus:outline-none text-xs font-sans"
            disabled={isLoading}
          />

          <button
            type="submit"
            disabled={isLoading || !inputValue.trim()}
            className="mr-1 px-2.5 py-1 bg-[#0d99ff] hover:bg-[#007be5] text-white font-medium rounded text-xs transition flex items-center space-x-1 disabled:opacity-40 disabled:cursor-not-allowed shadow-none"
          >
            <span className="hidden sm:inline">Search</span>
            <CornerDownLeft className="h-3 w-3" />
          </button>
        </div>

        {validationError && (
          <div className="absolute top-full left-0 mt-1 z-30 flex items-center space-x-1.5 text-[11px] text-[#f24822] bg-[#252526] border border-[#f24822]/40 px-2.5 py-1 rounded shadow-md">
            <AlertCircle className="h-3.5 w-3.5 flex-shrink-0 text-[#f24822]" />
            <span>{validationError}</span>
          </div>
        )}
      </form>
    </div>
  );
}
