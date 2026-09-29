import { useEffect, useState } from 'react';
import { Plus, Users } from 'lucide-react';
import SearchInput from '../ui/SearchInput';

/**
 * Top bar: app identity, people count, search and the primary "Add Person" action.
 */
export default function Header({
  peopleCount = 0,
  searchQuery = '',
  onSearchChange,
  onAddPerson,
}) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-30 border-b transition-colors duration-200 ${
        scrolled
          ? 'border-ink-200/70 bg-ink-50/85 backdrop-blur-md'
          : 'border-transparent bg-ink-50'
      }`}
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
        {/* Identity */}
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-700">
            <Users className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h1 className="truncate text-[17px] font-semibold leading-tight tracking-tight text-ink-900">
              Personal Relationship Manager
            </h1>
            <p className="text-xs text-ink-500">
              {peopleCount === 0
                ? 'No people yet'
                : `${peopleCount} ${peopleCount === 1 ? 'person' : 'people'}`}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:gap-3">
          <SearchInput
            value={searchQuery}
            onChange={onSearchChange}
            className="w-full sm:w-64 lg:w-72"
          />
          <button type="button" onClick={onAddPerson} className="btn-primary shrink-0">
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add Person
          </button>
        </div>
      </div>
    </header>
  );
}
