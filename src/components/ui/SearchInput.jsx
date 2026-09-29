import { Search, X } from 'lucide-react';

/**
 * Simple controlled search field.
 */
export default function SearchInput({
  value,
  onChange,
  placeholder = 'Search people...',
  className = '',
  autoFocus = false,
}) {
  return (
    <div className={`relative ${className}`}>
      <Search
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400"
        aria-hidden="true"
      />
      <input
        type="search"
        value={value}
        autoFocus={autoFocus}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label="Search people"
        className="w-full rounded-xl border border-ink-200 bg-white py-2.5 pl-9 pr-9 text-sm text-ink-900
                   placeholder:text-ink-400 transition-colors duration-150
                   focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/25
                   [&::-webkit-search-cancel-button]:hidden"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="Clear search"
          className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-ink-400
                     transition-colors hover:bg-ink-100 hover:text-ink-600"
        >
          <X className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
