import { Users, Plus, Search } from 'lucide-react';
import { Button } from '../ui/Button';

const EmptyState = ({ onAddPerson, searchQuery }) => {
  if (searchQuery) {
    return (
      <div className="empty-state animate-fade-in">
        <div className="empty-state-icon">🔍</div>
        <h3 className="text-lg font-medium text-neutral-900 mb-2">No results found</h3>
        <p className="text-neutral-500 mb-6">No people match your search</p>
        <button onClick={() => {}} className="btn-ghost">
          Clear search
        </button>
      </div>
    );
  }

  return (
    <div className="empty-state animate-fade-in">
      <div className="empty-state-icon">
        <Users className="w-16 h-16 text-neutral-300 mx-auto" />
      </div>
      <h3 className="text-lg font-medium text-neutral-900 mb-2">
        Your people are waiting here
      </h3>
      <p className="text-neutral-500 mb-8 max-w-xs mx-auto text-center">
        Add the people whose important dates and memories you want to remember.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
        <button className="btn-primary w-full sm:w-auto">
          <span className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h3m-3 0h3m-3 0h3M3 12a9 9 0 019-9h3v3m0 0v3m0-3h3m-3 0h3m-3 0h3m-3 0h3M3 12a9 9 0 019-9h3v3m0 0v3m0-3h3m-3 0h3m-3 0h3m-3 0h3M3 12a9 9 0 019-9h3v3m0 0v3m0-3h3m-3 0h3m-3 0h3m-3 0h3" />
            </svg>
            Add Person
          </button>
        </div>
      </div>
    );
  }
};

export default EmptyState;