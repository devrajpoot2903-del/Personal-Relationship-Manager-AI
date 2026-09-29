import { useMemo, useState } from 'react';
import { Plus, Users } from 'lucide-react';
import Header from '../components/layout/Header';
import PersonCard from '../components/people/PersonCard';
import EmptyState from '../components/ui/EmptyState';
import PersonFormModal from '../components/modals/PersonFormModal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { usePeopleList } from '../hooks/usePeopleList';
import { useToast } from '../hooks/useToast';

function CardSkeleton() {
  return (
    <div className="card overflow-hidden">
      <div className="skeleton aspect-[4/3] rounded-none" />
      <div className="space-y-2.5 p-4">
        <div className="skeleton h-4 w-2/3" />
        <div className="skeleton h-3 w-1/2" />
        <div className="skeleton h-3 w-3/4" />
      </div>
    </div>
  );
}

/**
 * Dashboard: person-first cards with their next occasion and countdown.
 */
export default function HomePage() {
  const toast = useToast();
  const {
    people,
    peopleByUpcoming,
    isLoading,
    status,
    createPerson,
    updatePerson,
    removePerson,
  } = usePeopleList();

  const [searchQuery, setSearchQuery] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPerson, setEditingPerson] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const filtered = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return peopleByUpcoming;
    return peopleByUpcoming.filter(
      (person) =>
        person.name.toLowerCase().includes(query) ||
        (person.relationship || '').toLowerCase().includes(query) ||
        (person.designation || '').toLowerCase().includes(query)
    );
  }, [peopleByUpcoming, searchQuery]);

  const openAddForm = () => {
    setEditingPerson(null);
    setIsFormOpen(true);
  };

  const openEditForm = (person) => {
    setEditingPerson(person);
    setIsFormOpen(true);
  };

  const handleSubmit = async (data) => {
    if (editingPerson) {
      await updatePerson(editingPerson.id, data);
      toast.success(`${data.name}'s details were updated.`);
    } else {
      await createPerson(data);
      toast.success(`${data.name} was added.`);
    }
    setEditingPerson(null);
  };

  const handleDelete = async () => {
    if (!pendingDelete) return;
    setIsDeleting(true);
    try {
      const removed = await removePerson(pendingDelete.id);
      const total =
        removed.events + removed.notes + removed.images + removed.songs;
      toast.success(
        total > 0
          ? `${pendingDelete.name} and ${total} related ${total === 1 ? 'memory' : 'memories'} were deleted.`
          : `${pendingDelete.name} was deleted.`
      );
      setPendingDelete(null);
    } catch {
      toast.error('Could not delete this person. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const hasPeople = people.length > 0;
  const isSearching = searchQuery.trim().length > 0;

  return (
    <div className="min-h-screen bg-ink-50">
      <Header
        peopleCount={people.length}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onAddPerson={openAddForm}
      />

      <main className="mx-auto max-w-6xl px-4 pb-20 pt-6 sm:px-6">
        {/* Page intro */}
        {!isSearching && hasPeople && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold tracking-tight text-ink-900">
              Your people
            </h2>
            <p className="mt-0.5 text-sm text-ink-500">
              Sorted by the next occasion coming up.
            </p>
          </div>
        )}

        {/* Content */}
        {isLoading || status === 'loading' ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <CardSkeleton key={index} />
            ))}
          </div>
        ) : status === 'error' ? (
          <div className="card">
            <EmptyState
              icon="⚠️"
              title="Local storage could not be opened"
              message="This app keeps everything in your browser's IndexedDB. Try reloading the page, or check that private browsing isn't blocking storage."
            />
          </div>
        ) : !hasPeople ? (
          <div className="card mt-2">
            <EmptyState
              icon={<Users className="h-6 w-6 text-ink-400" aria-hidden="true" />}
              title="Your people are waiting here"
              message="Add the people whose important dates and memories you want to keep together in one place."
              action={
                <button type="button" className="btn-primary" onClick={openAddForm}>
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  Add Person
                </button>
              }
            />
          </div>
        ) : filtered.length === 0 ? (
          <div className="card">
            <EmptyState
              icon="🔍"
              title="No one matched that search"
              message={`Nothing found for “${searchQuery.trim()}”. Try a different name.`}
              action={
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setSearchQuery('')}
                >
                  Show all people
                </button>
              }
            />
          </div>
        ) : (
          <>
            {isSearching && (
              <p className="mb-4 text-sm text-ink-500">
                {filtered.length} {filtered.length === 1 ? 'result' : 'results'} for “
                {searchQuery.trim()}”
              </p>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((person, index) => (
                <PersonCard
                  key={person.id}
                  person={person}
                  index={index}
                  onEdit={openEditForm}
                  onDelete={setPendingDelete}
                />
              ))}
            </div>
          </>
        )}
      </main>

      {/* Footer note about local storage */}
      {hasPeople && (
        <footer className="border-t border-ink-200/70 bg-white/60">
          <div className="mx-auto max-w-6xl px-4 py-5 text-center text-xs text-ink-400 sm:px-6">
            Everything you add is stored only in this browser, on this device.
          </div>
        </footer>
      )}

      {/* Modals */}
      <PersonFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingPerson(null);
        }}
        onSubmit={handleSubmit}
        person={editingPerson}
      />

      <ConfirmDialog
        isOpen={Boolean(pendingDelete)}
        title={pendingDelete ? `Delete ${pendingDelete.name}?` : 'Delete person?'}
        message={
          pendingDelete
            ? `This will permanently remove ${pendingDelete.name} along with all their memories — photos, songs, notes and dates. This cannot be undone.`
            : ''
        }
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setPendingDelete(null)}
        isBusy={isDeleting}
      />
    </div>
  );
}
