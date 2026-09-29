import { useState } from 'react';
import { Check, NotebookPen, Pencil, Plus, Trash2, X } from 'lucide-react';
import EmptyState from '../ui/EmptyState';
import { LIMITS } from '../../lib/constants';
import { formatRelative } from '../../lib/dates';

function NoteCard({ note, onSave, onDelete }) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(note.content);
  const [error, setError] = useState('');

  const startEditing = () => {
    setDraft(note.content);
    setError('');
    setIsEditing(true);
  };

  const save = async () => {
    const trimmed = draft.trim();
    if (!trimmed) {
      setError('A note cannot be empty.');
      return;
    }
    if (trimmed.length > LIMITS.MAX_NOTE_LENGTH) {
      setError('That note is too long.');
      return;
    }
    await onSave(note.id, trimmed);
    setIsEditing(false);
  };

  return (
    <li className="group rounded-xl border border-ink-200/70 bg-white p-3.5 transition-colors hover:border-ink-300/70">
      {isEditing ? (
        <div>
          <textarea
            className="form-textarea"
            rows={3}
            value={draft}
            autoFocus
            maxLength={LIMITS.MAX_NOTE_LENGTH}
            onChange={(event) => {
              setDraft(event.target.value);
              if (error) setError('');
            }}
          />
          {error && <p className="form-error">{error}</p>}

          <div className="mt-2 flex justify-end gap-2">
            <button type="button" className="btn-ghost" onClick={() => setIsEditing(false)}>
              <X className="h-3.5 w-3.5" aria-hidden="true" />
              Cancel
            </button>
            <button type="button" className="btn-primary !py-2" onClick={save}>
              <Check className="h-3.5 w-3.5" aria-hidden="true" />
              Save
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-start gap-3">
          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-300" aria-hidden="true" />

          <div className="min-w-0 flex-1">
            <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-ink-700">
              {note.content}
            </p>
            <p className="mt-1.5 text-[11px] text-ink-400">
              {formatRelative(note.updatedAt || note.createdAt)}
            </p>
          </div>

          <div className="flex shrink-0 gap-1 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
            <button
              type="button"
              className="btn-icon"
              aria-label="Edit note"
              onClick={startEditing}
            >
              <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
            <button
              type="button"
              className="btn-icon hover:text-red-600"
              aria-label="Delete note"
              onClick={() => onDelete(note)}
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>
      )}
    </li>
  );
}

/** Personal notes about a person — likes, gift ideas, things to remember. */
export default function NotesSection({ notes = [], onAdd, onSave, onDelete }) {
  const [isAdding, setIsAdding] = useState(false);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const submit = async () => {
    const trimmed = draft.trim();
    if (!trimmed) {
      setError('Write something first.');
      return;
    }

    setIsSaving(true);
    try {
      await onAdd(trimmed);
      setDraft('');
      setError('');
      setIsAdding(false);
    } catch {
      setError('Could not save this note. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section aria-labelledby="notes-heading">
      <div className="mb-3 flex items-center justify-between">
        <h2 id="notes-heading" className="section-title">
          <span aria-hidden="true">📝</span>
          Notes
          {notes.length > 0 && (
            <span className="rounded-full bg-ink-100 px-2 py-0.5 text-xs font-medium text-ink-500">
              {notes.length}
            </span>
          )}
        </h2>

        {!isAdding && (
          <button
            type="button"
            className="btn-ghost text-brand-700"
            onClick={() => {
              setIsAdding(true);
              setError('');
            }}
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add note
          </button>
        )}
      </div>

      <div className="space-y-2">
        {isAdding && (
          <div className="animate-rise rounded-xl border border-brand-200 bg-brand-50/50 p-3.5">
            <textarea
              className="form-textarea"
              rows={3}
              autoFocus
              placeholder="Loves Marvel movies, wants a watch for their birthday…"
              value={draft}
              maxLength={LIMITS.MAX_NOTE_LENGTH}
              onChange={(event) => {
                setDraft(event.target.value);
                if (error) setError('');
              }}
            />
            <div className="mt-2 flex items-center justify-between">
              <span className="text-[11px] text-ink-400">
                {draft.length}/{LIMITS.MAX_NOTE_LENGTH}
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={() => {
                    setIsAdding(false);
                    setDraft('');
                    setError('');
                  }}
                  disabled={isSaving}
                >
                  Cancel
                </button>
                <button type="button" className="btn-primary !py-2" onClick={submit} disabled={isSaving}>
                  {isSaving ? 'Saving…' : 'Save note'}
                </button>
              </div>
            </div>
            {error && <p className="form-error">{error}</p>}
          </div>
        )}

        {notes.length === 0 && !isAdding ? (
          <div className="card">
            <EmptyState
              compact
              icon="📝"
              title="No notes yet"
              message="Small details worth remembering — favourite colour, gift ideas, things to say."
              action={
                <button type="button" className="btn-secondary" onClick={() => setIsAdding(true)}>
                  <NotebookPen className="h-4 w-4" aria-hidden="true" />
                  Add your first note
                </button>
              }
            />
          </div>
        ) : (
          <ul className="space-y-2">
            {notes.map((note) => (
              <NoteCard key={note.id} note={note} onSave={onSave} onDelete={onDelete} />
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
