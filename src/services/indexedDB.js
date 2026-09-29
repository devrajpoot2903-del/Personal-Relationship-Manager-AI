/**
 * IndexedDB Service for Personal Relationship Manager
 * Handles all local data persistence for people, events, notes, images, and songs
 */

const DB_NAME = 'PersonalRelationshipManager';
const DB_VERSION = 1;

// Object store names
const STORES = {
  PEOPLE: 'people',
  EVENTS: 'events',
  NOTES: 'notes',
  IMAGES: 'images',
  SONGS: 'songs'
};

/**
 * Initialize the IndexedDB database
 */
export function initDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // People store
      if (!db.objectStoreNames.contains(STORES.PEOPLE)) {
        const peopleStore = db.createObjectStore(STORES.PEOPLE, { keyPath: 'id' });
        peopleStore.createIndex('name', 'name', { unique: false });
        peopleStore.createIndex('createdAt', 'createdAt', { unique: false });
      }

      // Events store
      if (!db.objectStoreNames.contains(STORES.EVENTS)) {
        const eventsStore = db.createObjectStore(STORES.EVENTS, { keyPath: 'id' });
        eventsStore.createIndex('personId', 'personId', { unique: false });
        eventsStore.createIndex('date', 'date', { unique: false });
      }

      // Notes store
      if (!db.objectStoreNames.contains(STORES.NOTES)) {
        const notesStore = db.createObjectStore(STORES.NOTES, { keyPath: 'id' });
        notesStore.createIndex('personId', 'personId', { unique: false });
        notesStore.createIndex('createdAt', 'createdAt', { unique: false });
      }

      // Images store
      if (!db.objectStoreNames.contains(STORES.IMAGES)) {
        const imagesStore = db.createObjectStore(STORES.IMAGES, { keyPath: 'id' });
        imagesStore.createIndex('personId', 'personId', { unique: false });
        imagesStore.createIndex('createdAt', 'createdAt', { unique: false });
      }

      // Songs store
      if (!db.objectStoreNames.contains(STORES.SONGS)) {
        const songsStore = db.createObjectStore(STORES.SONGS, { keyPath: 'id' });
        songsStore.createIndex('personId', 'personId', { unique: false });
        songsStore.createIndex('createdAt', 'createdAt', { unique: false });
      }
    };
  });
}

/**
 * Generic database operation helper
 */
function dbOperation(storeName, mode, callback) {
  return initDB().then(db => {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, mode);
      const store = transaction.objectStore(storeName);
      const request = callback(store);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
      transaction.oncomplete = () => db.close();
    });
  });
}

/**
 * Generate unique ID
 */
function generateId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Convert File to Blob for storage
 */
function fileToBlob(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(new Blob([reader.result], { type: file.type }));
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Create object URL from blob for display
 */
export function createObjectURL(blob) {
  return URL.createObjectURL(blob);
}

/**
 * Revoke object URL to free memory
 */
export function revokeObjectURL(url) {
  URL.revokeObjectURL(url);
}

// ==================== PEOPLE OPERATIONS ====================

export function getAllPeople() {
  return dbOperation(STORES.PEOPLE, 'readonly', store => store.getAll());
}

export function getPerson(id) {
  return dbOperation(STORES.PEOPLE, 'readonly', store => store.get(id));
}

export function savePerson(person) {
  const personData = {
    ...person,
    id: person.id || generateId(),
    updatedAt: new Date().toISOString(),
    createdAt: person.createdAt || new Date().toISOString()
  };
  return dbOperation(STORES.PEOPLE, 'readwrite', store => store.put(personData));
}

export function deletePerson(id) {
  return dbOperation(STORES.PEOPLE, 'readwrite', store => store.delete(id));
}

// ==================== EVENTS OPERATIONS ====================

export function getEventsByPerson(personId) {
  return dbOperation(STORES.EVENTS, 'readonly', store => {
    const index = store.index('personId');
    return index.getAll(personId);
  });
}

export function getEvent(id) {
  return dbOperation(STORES.EVENTS, 'readonly', store => store.get(id));
}

export function saveEvent(event) {
  const eventData = {
    ...event,
    id: event.id || generateId(),
    createdAt: event.createdAt || new Date().toISOString()
  };
  return dbOperation(STORES.EVENTS, 'readwrite', store => store.put(eventData));
}

export function deleteEvent(id) {
  return dbOperation(STORES.EVENTS, 'readwrite', store => store.delete(id));
}

export function deleteEventsByPerson(personId) {
  return getEventsByPerson(personId).then(events => {
    const promises = events.map(event => deleteEvent(event.id));
    return Promise.all(promises);
  });
}

// ==================== NOTES OPERATIONS ====================

export function getNotesByPerson(personId) {
  return dbOperation(STORES.NOTES, 'readonly', store => {
    const index = store.index('personId');
    return index.getAll(personId);
  });
}

export function saveNote(note) {
  const noteData = {
    ...note,
    id: note.id || generateId(),
    updatedAt: new Date().toISOString(),
    createdAt: note.createdAt || new Date().toISOString()
  };
  return dbOperation(STORES.NOTES, 'readwrite', store => store.put(noteData));
}

export function deleteNote(id) {
  return dbOperation(STORES.NOTES, 'readwrite', store => store.delete(id));
}

export function deleteNotesByPerson(personId) {
  return getNotesByPerson(personId).then(notes => {
    const promises = notes.map(note => deleteNote(note.id));
    return Promise.all(promises);
  });
}

// ==================== IMAGES OPERATIONS ====================

export function getImagesByPerson(personId) {
  return dbOperation(STORES.IMAGES, 'readonly', store => {
    const index = store.index('personId');
    return index.getAll(personId);
  });
}

export function saveImage(imageData) {
  const data = {
    ...imageData,
    id: imageData.id || generateId(),
    createdAt: imageData.createdAt || new Date().toISOString()
  };
  return dbOperation(STORES.IMAGES, 'readwrite', store => store.put(data));
}

export function deleteImage(id) {
  return dbOperation(STORES.IMAGES, 'readwrite', store => store.delete(id));
}

export function deleteImagesByPerson(personId) {
  return getImagesByPerson(personId).then(images => {
    const promises = images.map(image => deleteImage(image.id));
    return Promise.all(promises);
  });
}

// ==================== SONGS OPERATIONS ====================

export function getSongsByPerson(personId) {
  return dbOperation(STORES.SONGS, 'readonly', store => {
    const index = store.index('personId');
    return index.getAll(personId);
  });
}

export function saveSong(song) {
  const songData = {
    ...song,
    id: song.id || generateId(),
    createdAt: song.createdAt || new Date().toISOString()
  };
  return dbOperation(STORES.SONGS, 'readwrite', store => store.put(songData));
}

export function deleteSong(id) {
  return dbOperation(STORES.SONGS, 'readwrite', store => store.delete(id));
}

export function deleteSongsByPerson(personId) {
  return getSongsByPerson(personId).then(songs => {
    const promises = songs.map(song => deleteSong(song.id));
    return Promise.all(promises);
  });
}

// ==================== CASCADE DELETE ====================

/**
 * Delete a person and all associated data
 */
export function deletePersonWithData(personId) {
  return Promise.all([
    deletePerson(personId),
    deleteEventsByPerson(personId),
    deleteNotesByPerson(personId),
    deleteImagesByPerson(personId),
    deleteSongsByPerson(personId)
  ]);
}

// ==================== FILE HANDLING ====================

/**
 * Process uploaded image file
 */
export function processImageFile(file) {
  return fileToBlob(file).then(blob => ({
    blob,
    name: file.name,
    type: file.type,
    size: file.size
  }));
}

/**
 * Process uploaded audio file
 */
export function processAudioFile(file) {
  return fileToBlob(file).then(blob => ({
    blob,
    name: file.name,
    type: file.type,
    size: file.size
  }));
}

/**
 * Validate image file
 */
export function validateImageFile(file) {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  const maxSize = 10 * 1024 * 1024; // 10MB
  
  if (!validTypes.includes(file.type)) {
    throw new Error('Invalid file type. Please upload JPG, PNG, or WebP images.');
  }
  if (file.size > maxSize) {
    throw new Error('File too large. Maximum size is 10MB.');
  }
  return true;
}

/**
 * Validate audio file
 */
export function validateAudioFile(file) {
  const validTypes = ['audio/mpeg', 'audio/wav', 'audio/mp4', 'audio/ogg', 'audio/m4a'];
  const maxSize = 20 * 1024 * 1024; // 20MB
  
  if (!validTypes.includes(file.type)) {
    throw new Error('Invalid file type. Please upload MP3, WAV, M4A, or OGG audio files.');
  }
  if (file.size > maxSize) {
    throw new Error('File too large. Maximum size is 20MB.');
  }
  return true;
}

// ==================== UTILITY FUNCTIONS ====================

/**
 * Calculate days until next occurrence of a date
 */
export function calculateCountdown(dateString, recurring = true) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const eventDate = new Date(dateString);
  const month = eventDate.getMonth();
  const day = eventDate.getDate();
  
  let nextOccurrence = new Date(today.getFullYear(), month, day);
  
  if (nextOccurrence < today) {
    if (recurring) {
      nextOccurrence = new Date(today.getFullYear() + 1, month, day);
    } else {
      // For non-recurring past events, return null or negative
      return { days: -1, isToday: false, isTomorrow: false, isPast: true };
    }
  }
  
  const diffTime = nextOccurrence - today;
  const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return {
    days,
    isToday: days === 0,
    isTomorrow: days === 1,
    isPast: days < 0,
    date: nextOccurrence
  };
}

/**
 * Format date for display (DD MMM)
 */
export function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

/**
 * Format full date for display (DD MMM YYYY)
 */
export function formatFullDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

/**
 * Get relationship options
 */
export const RELATIONSHIP_OPTIONS = [
  'Family',
  'Parent',
  'Sibling',
  'Relative',
  'Friend',
  'School Friend',
  'College Friend',
  'Classmate',
  'Cousin',
  'Other'
];

/**
 * Get event type options
 */
export const EVENT_TYPE_OPTIONS = [
  { value: 'birthday', label: '🎂 Birthday', icon: '🎂' },
  { value: 'anniversary', label: '💍 Anniversary', icon: '💍' },
  { value: 'other', label: '📅 Other', icon: '📅' }
];