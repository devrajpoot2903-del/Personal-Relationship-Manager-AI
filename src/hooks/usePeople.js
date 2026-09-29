import { useState, useEffect, useCallback } from 'react';
import * as db from '../services/indexedDB';
import { formatDate, calculateCountdown, generateId, fileToBlob, createObjectURL, revokeObjectURL, validateImageFile, validateAudioFile } from '../types';

export function usePeople() {
  const [people, setPeople] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load all people
  const loadPeople = useCallback(async () => {
    try {
      setLoading(true);
      const data = await db.getAllPeople();
      // Sort by name
      data.sort((a, b) => a.name.localeCompare(b.name));
      setPeople(data);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error('Failed to load people:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initialize on mount
  useEffect(() => {
    loadPeople();
  }, [loadPeople]);

  // Add person
  const addPerson = useCallback(async (personData) => {
    const newPerson = {
      ...personData,
      id: generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    await db.savePerson(newPerson);
    await loadPeople();
    return newPerson;
  }, [loadPeople]);

  // Update person
  const updatePerson = useCallback(async (id, updates) => {
    const person = await db.getPerson(id);
    if (!person) throw new Error('Person not found');
    
    const updated = {
      ...person,
      ...updates,
      updatedAt: new Date().toISOString()
    };
    await db.savePerson(updated);
    await loadPeople();
    return updated;
  }, [loadPeople]);

  // Delete person with all associated data
  const deletePerson = useCallback(async (id) => {
    await db.deletePersonWithData(id);
    await loadPeople();
  }, [loadPeople]);

  // Get person with all related data
  const getPersonWithData = useCallback(async (id) => {
    const [person, events, notes, images, songs] = await Promise.all([
      db.getPerson(id),
      db.getEventsByPerson(id),
      db.getNotesByPerson(id),
      db.getImagesByPerson(id),
      db.getSongsByPerson(id)
    ]);
    
    if (!person) return null;
    
    return {
      ...data,
      events: events || [],
      notes: notes || [],
      images: images || [],
      songs: songs || []
    };
  }, []);

  // Search people by name
  const searchPeople = useCallback((query) => {
    if (!query.trim()) return people;
    const lowerQuery = query.toLowerCase();
    return people.filter(p => 
      p.name.toLowerCase().includes(lowerQuery) ||
      p.relationship.toLowerCase().includes(lowerQuery)
    );
  }, [people]);

  return {
    people,
    loading,
    error,
    loadPeople,
    addPerson,
    updatePerson,
    deletePerson,
    getPersonWithData,
    searchPeople
  };
}

export function usePerson(id) {
  const [person, setPerson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadPerson = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await db.getPerson(id);
      if (!data) {
        setError('Person not found');
        return;
      }
      
      const [events, notes, images, songs] = await Promise.all([
        db.getEventsByPerson(id),
        db.getNotesByPerson(id),
        db.getImagesByPerson(id),
        db.getSongsByPerson(id)
      ]);
      
      setPerson({
        ...data,
        events: events || [],
        notes: notes || [],
        images: images || [],
        songs: songs || []
      });
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error('Failed to load person:', err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadPerson();
  }, [loadPerson]);

  // Update person
  const updatePerson = useCallback(async (updates) => {
    if (!person) return;
    const updated = {
      ...person,
      ...updates,
      updatedAt: new Date().toISOString()
    };
    await db.savePerson(updated);
    setPerson(updated);
    return updated;
  }, [person]);

  // Add event
  const addEvent = useCallback(async (eventData) => {
    if (!person) return;
    const newEvent = {
      ...eventData,
      id: generateId(),
      personId: person.id,
      createdAt: new Date().toISOString()
    };
    await db.saveEvent(newEvent);
    setPerson(prev => ({
      ...prev,
      events: [...(prev.events || []), newEvent]
    }));
    return newEvent;
  }, [person]);

  // Update event
  const updateEvent = useCallback(async (eventId, updates) => {
    const event = person.events.find(e => e.id === eventId);
    if (!event) return;
    
    const updated = { ...event, ...updates };
    await db.saveEvent(updated);
    setPerson(prev => ({
      ...prev,
      events: prev.events.map(e => e.id === eventId ? updated : e)
    }));
    return updated;
  }, [person]);

  // Delete event
  const deleteEvent = useCallback(async (eventId) => {
    await db.deleteEvent(eventId);
    setPerson(prev => ({
      ...prev,
      events: prev.events.filter(e => e.id !== eventId)
    }));
  }, []);

  // Add note
  const addNote = useCallback(async (content) => {
    if (!person) return;
    const newNote = {
      id: generateId(),
      personId: person.id,
      content,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    await db.saveNote(newNote);
    setPerson(prev => ({
      ...prev,
      notes: [...(prev.notes || []), newNote]
    }));
    return newNote;
  }, [person]);

  // Update note
  const updateNote = useCallback(async (noteId, content) => {
    const note = person.notes.find(n => n.id === noteId);
    if (!note) return;
    
    const updated = {
      ...note,
      content,
      updatedAt: new Date().toISOString()
    };
    await db.saveNote(updated);
    setPerson(prev => ({
      ...prev,
      notes: prev.notes.map(n => n.id === noteId ? updated : n)
    }));
    return updated;
  }, [person]);

  // Delete note
  const deleteNote = useCallback(async (noteId) => {
    await db.deleteNote(noteId);
    setPerson(prev => ({
      ...prev,
      notes: prev.notes.filter(n => n.id !== noteId)
    }));
  }, []);

  // Add image
  const addImage = useCallback(async (file) => {
    if (!person) return;
    validateImageFile(file);
    const { blob, name, type, size } = await fileToBlob(file);
    
    const newImage = {
      id: generateId(),
      personId: person.id,
      blob,
      name,
      type,
      size,
      createdAt: new Date().toISOString()
    };
    await db.saveImage(newImage);
    setPerson(prev => ({
      ...prev,
      images: [...(prev.images || []), newImage]
    }));
    return newImage;
  }, [person]);

  // Delete image
  const deleteImage = useCallback(async (imageId) => {
    await db.deleteImage(imageId);
    setPerson(prev => ({
      ...prev,
      images: prev.images.filter(img => img.id !== imageId)
    }));
  }, []);

  // Add song
  const addSong = useCallback(async (songData) => {
    if (!person) return;
    const newSong = {
      ...songData,
      id: generateId(),
      personId: person.id,
      createdAt: new Date().toISOString()
    };
    await db.saveSong(newSong);
    setPerson(prev => ({
      ...prev,
      songs: [...(prev.songs || []), newSong]
    }));
    return newSong;
  }, [person]);

  // Delete song
  const deleteSong = useCallback(async (songId) => {
    await db.deleteSong(songId);
    setPerson(prev => ({
      ...prev,
      songs: prev.songs.filter(s => s.id !== songId)
    }));
  }, []);

  // Get countdown for next event
  const getNextEventCountdown = useCallback(() => {
    if (!person || !person.events?.length) return null;
    
    const countdowns = person.events.map(event => ({
      ...event,
      countdown: calculateCountdown(event.date, event.recurring)
    }));
    
    // Sort by days remaining (ascending), putting today/tomorrow first
    countdowns.sort((a, b) => {
      if (a.countdown.isPast && !b.countdown.isPast) return 1;
      if (!a.countdown.isPast && b.countdown.isPast) return -1;
      return a.countdown.days - b.countdown.days;
    });
    
    return countdowns[0];
  }, [person]);

  return {
    person,
    loading,
    error,
    loadPerson,
    updatePerson,
    addEvent,
    updateEvent,
    deleteEvent,
    addNote,
    updateNote,
    deleteNote,
    addImage,
    deleteImage,
    addSong,
    deleteSong,
    getNextEventCountdown
  };
}

// Utility hooks
export function useFilePreview() {
  const [previews, setPreviews] = useState(new Map());

  const createPreview = useCallback((blob) => {
    const url = URL.createObjectURL(blob);
    setPreviews(prev => new Map(prev).set(blob, url));
    return URL.createObjectURL(blob);
  }, []);

  const revokePreview = useCallback((blob) => {
    const url = previews.get(blob);
    if (url) {
      URL.revokeObjectURL(url);
      setPreviews(prev => {
        const next = new Map(prev);
        next.delete(blob);
        return next;
      });
    }
  }, [previews]);

  useEffect(() => {
    return () => {
      previews.forEach(url => URL.revokeObjectURL(url));
    };
  }, [previews]);

  return { createPreview, revokePreview };
}