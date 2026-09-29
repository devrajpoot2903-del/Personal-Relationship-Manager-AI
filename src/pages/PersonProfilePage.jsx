import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';

import ProfileHero from '../components/profile/ProfileHero';
import EventsSection from '../components/profile/EventsSection';
import NotesSection from '../components/profile/NotesSection';
import GallerySection from '../components/profile/GallerySection';
import SongsSection from '../components/profile/SongsSection';

import PersonFormModal from '../components/modals/PersonFormModal';
import EventFormModal from '../components/modals/EventFormModal';
import SongFormModal from '../components/modals/SongFormModal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import EmptyState from '../components/ui/EmptyState';

import { usePersonDetail } from '../hooks/usePersonDetail';
import { useToast } from '../hooks/useToast';
import { deletePersonCascade } from '../lib/db';

function SectionCard({ children }) {
  return <div className="card p-4 sm:p-5">{children}</div>;
}

/**
 * A whole person on one page: profile, dates, notes, memories and songs.
 */
export default function PersonProfilePage() {
  const { personId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const {
    person,
    status,
    updatePerson,
    addEvent,
    editEvent,
    removeEvent,
    addNote,
    editNote,
    removeNote,
    addImages,
    removeImage,
    addSongLink,
    addSongAudio,
    removeSong,
  } = usePersonDetail(personId);

  const [isPersonFormOpen, setIsPersonFormOpen] = useState(false);
  const [isEventFormOpen, setIsEventFormOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [isSongFormOpen, setIsSongFormOpen] = useState(false);

  const [confirmState, setConfirmState] = useState(null); // { type, payload }
  const [isWorking, setIsWorking] = useState(false);

  /* ---------------- Loading / missing states ---------------- */

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink-50">
        <Loader2 className="h-6 w-6 animate-spin text-ink-400" aria-hidden="true" />
        <span className="sr-only">Loading profile</span>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="mx-auto max-w-xl px-4 py-20">
        <div className="card">
          <EmptyState
            icon="⚠️"
            title="Could not load this profile"
            message="Something went wrong reading local storage. Try reloading the page."
            action={
              <Link to="/" className="btn-secondary">
                Back to all people
              </Link>
            }
          />
        </div>
      </div>
    );
  }

  if (!person) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20">
        <div className="card">
          <EmptyState
            icon="🤍"
            title="This person no longer exists"
            message="They may have been deleted from this browser."
            action={
              <Link to="/" className="btn-primary">
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                Back to all people
              </Link>
            }
          />
        </div>
      </div>
    );
  }

  /* ---------------- Handlers ---------------- */

  const handlePersonSubmit = async (data) => {
    await updatePerson(data);
    toast.success('Profile updated.');
  };

  const handleEventSubmit = async (data) => {
    if (editingEvent) {
      await editEvent(editingEvent.id, data);
      setEditingEvent(null);
      toast.success('Date updated.');
    } else {
      await addEvent(data);
      toast.success('Date added.');
    }
  };

  const handleSongSubmit = async (mode, payload, title) => {
    if (mode === 'audio') {
      await addSongAudio(payload, title);
      toast.success('Song uploaded and saved on this device.');
    } else {
      await addSongLink(payload);
      toast.success('Song added.');
    }
  };

  const handleUploadImages = async (files) => {
    const result = await addImages(files);
    if (result.saved.length) {
      toast.success(
        `${result.saved.length} ${result.saved.length === 1 ? 'photo' : 'photos'} added.`
      );
    }
    return result;
  };

  /* ---------------- Confirmations ---------------- */

  const runConfirmedAction = async () => {
    if (!confirmState) return;
    setIsWorking(true);

    try {
      const { type, payload } = confirmState;

      if (type === 'delete-person') {
        await deletePersonCascade(person.id);
        toast.success(`${person.name} and all related memories were deleted.`);
        navigate('/', { replace: true });
        return;
      }

      if (type === 'delete-event') {
        await removeEvent(payload.id);
        toast.success('Date removed.');
      }

      if (type === 'delete-note') {
        await removeNote(payload.id);
        toast.success('Note removed.');
      }

      if (type === 'delete-image') {
        await removeImage(payload.id);
        toast.success('Photo removed.');
      }

      if (type === 'delete-song') {
        await removeSong(payload.id);
        toast.success('Song removed.');
      }

      setConfirmState(null);
    } catch {
      toast.error('That action could not be completed. Please try again.');
    } finally {
      setIsWorking(false);
    }
  };

  const confirmCopy = (() => {
    if (!confirmState) return { title: '', message: '' };
    switch (confirmState.type) {
      case 'delete-person':
        return {
          title: `Delete ${person.name}?`,
          message: `This will permanently remove ${person.name} and all associated memories — photos, songs, notes and dates. This cannot be undone.`,
        };
      case 'delete-event':
        return {
          title: 'Delete this date?',
          message: 'This occasion will be removed from the profile.',
        };
      case 'delete-note':
        return { title: 'Delete this note?', message: 'This note will be removed permanently.' };
      case 'delete-image':
        return { title: 'Delete this photo?', message: 'This photo will be removed permanently.' };
      case 'delete-song':
        return { title: 'Delete this song?', message: 'This song will be removed permanently.' };
      default:
        return { title: '', message: '' };
    }
  })();

  /* ---------------- Render ---------------- */

  return (
    <div className="min-h-screen bg-ink-50">
      <ProfileHero
        person={person}
        eventCount={person.events.length}
        onEdit={() => setIsPersonFormOpen(true)}
        onDelete={() => setConfirmState({ type: 'delete-person' })}
      />

      <main className="mx-auto max-w-4xl space-y-8 px-4 pb-20 pt-8 sm:px-6">
        <SectionCard>
          <EventsSection
            events={person.events}
            onAdd={() => {
              setEditingEvent(null);
              setIsEventFormOpen(true);
            }}
            onEdit={(event) => {
              setEditingEvent(event);
              setIsEventFormOpen(true);
            }}
            onDelete={(event) => setConfirmState({ type: 'delete-event', payload: event })}
          />
        </SectionCard>

        <SectionCard>
          <NotesSection
            notes={person.notes}
            onAdd={addNote}
            onSave={editNote}
            onDelete={(note) => setConfirmState({ type: 'delete-note', payload: note })}
          />
        </SectionCard>

        <SectionCard>
          <GallerySection
            images={person.images}
            onUpload={handleUploadImages}
            onDelete={(image) => setConfirmState({ type: 'delete-image', payload: image })}
          />
        </SectionCard>

        <SectionCard>
          <SongsSection
            songs={person.songs}
            onAdd={() => setIsSongFormOpen(true)}
            onDelete={(song) => setConfirmState({ type: 'delete-song', payload: song })}
          />
        </SectionCard>

        <div className="pt-2 text-center">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm text-ink-500 transition-colors hover:text-ink-800"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to all people
          </Link>
        </div>
      </main>

      {/* Modals */}
      <PersonFormModal
        isOpen={isPersonFormOpen}
        onClose={() => setIsPersonFormOpen(false)}
        onSubmit={handlePersonSubmit}
        person={person}
      />

      <EventFormModal
        isOpen={isEventFormOpen}
        onClose={() => {
          setIsEventFormOpen(false);
          setEditingEvent(null);
        }}
        onSubmit={handleEventSubmit}
        event={editingEvent}
      />

      <SongFormModal
        isOpen={isSongFormOpen}
        onClose={() => setIsSongFormOpen(false)}
        onSubmitLink={(payload) => handleSongSubmit('link', payload)}
        onSubmitAudio={(file, title) => handleSongSubmit('audio', file, title)}
      />

      <ConfirmDialog
        isOpen={Boolean(confirmState)}
        title={confirmCopy.title}
        message={confirmCopy.message}
        onConfirm={runConfirmedAction}
        onCancel={() => setConfirmState(null)}
        isBusy={isWorking}
      />
    </div>
  );
}
