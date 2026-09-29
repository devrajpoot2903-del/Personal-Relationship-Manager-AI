import { useCallback, useEffect, useState } from 'react';
import {
  deleteEvent,
  deleteImage,
  deleteNote,
  deleteSong,
  getPersonBundle,
  saveEvent,
  saveImage,
  saveNote,
  savePerson,
  saveSong,
} from '../lib/db';
import { fileToRecord, validateAudioFile, validateImageFile } from '../lib/files';
import { sortEventsByUpcoming } from '../lib/dates';

/**
 * Person-level fields only. Events, notes, images and songs live in their own
 * stores, so they must never be written back into the `people` record.
 */
function personFields(source = {}) {
  return {
    name: source.name,
    relationship: source.relationship,
    designation: source.designation,
    instagram: source.instagram,
    profileImage: source.profileImage ?? null,
  };
}

/**
 * Loads one person with their events, notes, gallery and songs, and exposes
 * CRUD helpers that keep both IndexedDB and local state in sync.
 */
export function usePersonDetail(personId) {
  const [person, setPerson] = useState(null);
  const [status, setStatus] = useState('loading'); // loading | ready | missing | error
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!personId) {
      setStatus('missing');
      return null;
    }

    try {
      const bundle = await getPersonBundle(personId);
      if (!bundle) {
        setPerson(null);
        setStatus('missing');
        return null;
      }
      setPerson(bundle);
      setError(null);
      setStatus('ready');
      return bundle;
    } catch (cause) {
      setError(cause);
      setStatus('error');
      return null;
    }
  }, [personId]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const bundle = personId ? await getPersonBundle(personId) : null;
        if (!active) return;
        if (!bundle) {
          setPerson(null);
          setStatus(personId ? 'missing' : 'missing');
          return;
        }
        setPerson(bundle);
        setError(null);
        setStatus('ready');
      } catch (cause) {
        if (!active) return;
        setError(cause);
        setStatus('error');
      }
    })();
    return () => {
      active = false;
    };
  }, [personId]);

  /* ---------------- Person ---------------- */

  const updatePerson = useCallback(
    async (data) => {
      const saved = await savePerson({ ...personFields(person), ...data, id: person.id });
      // Keep the loaded children (events/notes/images/songs) in local state.
      setPerson((current) => ({ ...current, ...saved }));
      return saved;
    },
    [person]
  );

  /* ---------------- Events ---------------- */

  const addEvent = useCallback(
    async (data) => {
      const saved = await saveEvent({ ...data, personId });
      setPerson((current) => ({
        ...current,
        events: sortEventsByUpcoming([...(current.events || []), saved]),
      }));
      return saved;
    },
    [personId]
  );

  const editEvent = useCallback(async (id, data) => {
    const saved = await saveEvent({ ...data, id });
    setPerson((current) => ({
      ...current,
      events: sortEventsByUpcoming(
        (current.events || []).map((event) => (event.id === id ? saved : event))
      ),
    }));
    return saved;
  }, []);

  const removeEvent = useCallback(async (id) => {
    await deleteEvent(id);
    setPerson((current) => ({
      ...current,
      events: (current.events || []).filter((event) => event.id !== id),
    }));
  }, []);

  /* ---------------- Notes ---------------- */

  const addNote = useCallback(
    async (content) => {
      const saved = await saveNote({ personId, content, createdAt: new Date().toISOString() });
      setPerson((current) => ({ ...current, notes: [saved, ...(current.notes || [])] }));
      return saved;
    },
    [personId]
  );

  const editNote = useCallback(async (id, content) => {
    const saved = await saveNote({ id, content });
    setPerson((current) => ({
      ...current,
      notes: (current.notes || []).map((note) => (note.id === id ? saved : note)),
    }));
    return saved;
  }, []);

  const removeNote = useCallback(async (id) => {
    await deleteNote(id);
    setPerson((current) => ({
      ...current,
      notes: (current.notes || []).filter((note) => note.id !== id),
    }));
  }, []);

  /* ---------------- Gallery ---------------- */

  /** Accepts an array of Files; validates each and stores the Blob. */
  const addImages = useCallback(
    async (files) => {
      const accepted = [];
      const rejected = [];

      for (const file of files) {
        try {
          validateImageFile(file);
          accepted.push(file);
        } catch (cause) {
          rejected.push(cause.message);
        }
      }

      const saved = [];
      for (const file of accepted) {
        const record = fileToRecord(file);
        const image = await saveImage({ personId, ...record });
        saved.push(image);
      }

      if (saved.length) {
        setPerson((current) => ({ ...current, images: [...saved.reverse(), ...(current.images || [])] }));
      }

      return { saved, rejected };
    },
    [personId]
  );

  const removeImage = useCallback(async (id) => {
    await deleteImage(id);
    setPerson((current) => ({
      ...current,
      images: (current.images || []).filter((image) => image.id !== id),
    }));
  }, []);

  /* ---------------- Songs ---------------- */

  const addSongLink = useCallback(
    async (data) => {
      const saved = await saveSong({ ...data, personId, type: 'link' });
      setPerson((current) => ({ ...current, songs: [saved, ...(current.songs || [])] }));
      return saved;
    },
    [personId]
  );

  const addSongAudio = useCallback(
    async (file, title) => {
      validateAudioFile(file);
      const record = fileToRecord(file);
      const saved = await saveSong({
        personId,
        type: 'audio',
        title: title?.trim() || record.name,
        ...record,
      });
      setPerson((current) => ({ ...current, songs: [saved, ...(current.songs || [])] }));
      return saved;
    },
    [personId]
  );

  const removeSong = useCallback(async (id) => {
    await deleteSong(id);
    setPerson((current) => ({
      ...current,
      songs: (current.songs || []).filter((song) => song.id !== id),
    }));
  }, []);

  return {
    person,
    status,
    isLoading: status === 'loading',
    error,
    reload: load,
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
  };
}

export default usePersonDetail;
