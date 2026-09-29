/**
 * IndexedDB persistence layer.
 *
 * Layout: `people` holds the person record; `events`, `notes`, `images` and
 * `songs` live in their own stores and are linked back with `personId`.
 * Binaries are stored as Blobs — no Base64, no localStorage.
 */

const DB_NAME = 'personal-relationship-manager';
const DB_VERSION = 1;

export const STORES = {
  PEOPLE: 'people',
  EVENTS: 'events',
  NOTES: 'notes',
  IMAGES: 'images',
  SONGS: 'songs',
};

/** Creates a collision-resistant id (readable prefix + time + randomness). */
export function createId(prefix = 'rec') {
  const time = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 10);
  return `${prefix}_${time}${rand}`;
}

let dbPromise = null;

/** Opens (once) and reuses the database connection. */
export function openDatabase() {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('This browser does not support IndexedDB, so data cannot be saved.'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains(STORES.PEOPLE)) {
        const people = db.createObjectStore(STORES.PEOPLE, { keyPath: 'id' });
        people.createIndex('name', 'name', { unique: false });
        people.createIndex('createdAt', 'createdAt', { unique: false });
      }

      if (!db.objectStoreNames.contains(STORES.EVENTS)) {
        const events = db.createObjectStore(STORES.EVENTS, { keyPath: 'id' });
        events.createIndex('personId', 'personId', { unique: false });
        events.createIndex('date', 'date', { unique: false });
      }

      if (!db.objectStoreNames.contains(STORES.NOTES)) {
        const notes = db.createObjectStore(STORES.NOTES, { keyPath: 'id' });
        notes.createIndex('personId', 'personId', { unique: false });
        notes.createIndex('createdAt', 'createdAt', { unique: false });
      }

      if (!db.objectStoreNames.contains(STORES.IMAGES)) {
        const images = db.createObjectStore(STORES.IMAGES, { keyPath: 'id' });
        images.createIndex('personId', 'personId', { unique: false });
        images.createIndex('createdAt', 'createdAt', { unique: false });
      }

      if (!db.objectStoreNames.contains(STORES.SONGS)) {
        const songs = db.createObjectStore(STORES.SONGS, { keyPath: 'id' });
        songs.createIndex('personId', 'personId', { unique: false });
        songs.createIndex('createdAt', 'createdAt', { unique: false });
      }
    };

    request.onsuccess = () => {
      const db = request.result;

      // If another tab requests a version change, close so it can proceed.
      db.onversionchange = () => {
        db.close();
        dbPromise = null;
      };

      resolve(db);
    };

    request.onerror = () => reject(request.error || new Error('Could not open local storage.'));
    request.onblocked = () =>
      reject(new Error('Local storage is busy in another tab. Close it and try again.'));
  });

  return dbPromise;
}

/** Runs a single request inside a transaction and resolves with its result. */
async function run(storeName, mode, executor) {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    let request;
    const transaction = db.transaction(storeName, mode);
    const store = transaction.objectStore(storeName);

    try {
      request = executor(store);
    } catch (error) {
      reject(error);
      return;
    }

    transaction.oncomplete = () => resolve(request ? request.result : undefined);
    transaction.onabort = () => reject(transaction.error || new Error('Database write failed.'));
    transaction.onerror = () => reject(transaction.error || new Error('Database error.'));
  });
}

const getAll = (store) => run(store, 'readonly', (s) => s.getAll());
const getOne = (store, id) => run(store, 'readonly', (s) => s.get(id));
const put = (store, value) => run(store, 'readwrite', (s) => s.put(value));
const remove = (store, id) => run(store, 'readwrite', (s) => s.delete(id));

/** Reads every record in `store` whose `personId` matches. */
async function getByPerson(store, personId) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(store, 'readonly');
    const index = transaction.objectStore(store).index('personId');
    const request = index.getAll(personId);
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

/** Deletes every record in `store` that belongs to `personId`. */
async function deleteByPerson(store, personId) {
  const records = await getByPerson(store, personId);
  await Promise.all(records.map((record) => remove(store, record.id)));
  return records.length;
}

/* ============================================================
   People
   ============================================================ */

export async function listPeople() {
  const people = await getAll(STORES.PEOPLE);
  return people.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
}

export function getPerson(id) {
  return getOne(STORES.PEOPLE, id);
}

export async function savePerson(person) {
  const now = new Date().toISOString();
  const record = {
    ...person,
    id: person.id || createId('person'),
    createdAt: person.createdAt || now,
    updatedAt: now,
  };
  await put(STORES.PEOPLE, record);
  return record;
}

export function deletePerson(id) {
  return remove(STORES.PEOPLE, id);
}

/* ============================================================
   Events
   ============================================================ */

export function listEvents(personId) {
  return getByPerson(STORES.EVENTS, personId);
}

export async function saveEvent(event) {
  const record = {
    ...event,
    id: event.id || createId('event'),
    createdAt: event.createdAt || new Date().toISOString(),
  };
  await put(STORES.EVENTS, record);
  return record;
}

export function deleteEvent(id) {
  return remove(STORES.EVENTS, id);
}

/* ============================================================
   Notes
   ============================================================ */

export function listNotes(personId) {
  return getByPerson(STORES.NOTES, personId);
}

export async function saveNote(note) {
  const now = new Date().toISOString();
  const record = {
    ...note,
    id: note.id || createId('note'),
    createdAt: note.createdAt || now,
    updatedAt: now,
  };
  await put(STORES.NOTES, record);
  return record;
}

export function deleteNote(id) {
  return remove(STORES.NOTES, id);
}

/* ============================================================
   Gallery images
   ============================================================ */

export function listImages(personId) {
  return getByPerson(STORES.IMAGES, personId);
}

export async function saveImage(image) {
  const record = {
    ...image,
    id: image.id || createId('image'),
    createdAt: image.createdAt || new Date().toISOString(),
  };
  await put(STORES.IMAGES, record);
  return record;
}

export function deleteImage(id) {
  return remove(STORES.IMAGES, id);
}

/* ============================================================
   Songs
   ============================================================ */

export function listSongs(personId) {
  return getByPerson(STORES.SONGS, personId);
}

export async function saveSong(song) {
  const record = {
    ...song,
    id: song.id || createId('song'),
    createdAt: song.createdAt || new Date().toISOString(),
  };
  await put(STORES.SONGS, record);
  return record;
}

export function deleteSong(id) {
  return remove(STORES.SONGS, id);
}

/* ============================================================
   Aggregates
   ============================================================ */

/** Loads a person together with every memory attached to them. */
export async function getPersonBundle(personId) {
  const person = await getPerson(personId);
  if (!person) return null;

  const [events, notes, images, songs] = await Promise.all([
    listEvents(personId),
    listNotes(personId),
    listImages(personId),
    listSongs(personId),
  ]);

  const byNewest = (a, b) => String(b.createdAt).localeCompare(String(a.createdAt));

  return {
    ...person,
    events: events.sort((a, b) => String(a.date).localeCompare(String(b.date))),
    notes: notes.sort(byNewest),
    images: images.sort(byNewest),
    songs: songs.sort(byNewest),
  };
}

/**
 * Loads people with just enough event data for the dashboard cards.
 * Avoids pulling every gallery blob and song into memory on the home page.
 */
export async function listPeopleWithEvents() {
  const people = await listPeople();
  const db = await openDatabase();

  const allEvents = await new Promise((resolve, reject) => {
    const transaction = db.transaction(STORES.EVENTS, 'readonly');
    const request = transaction.objectStore(STORES.EVENTS).getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });

  const grouped = new Map();
  for (const event of allEvents) {
    if (!grouped.has(event.personId)) grouped.set(event.personId, []);
    grouped.get(event.personId).push(event);
  }

  return people.map((person) => ({
    ...person,
    events: (grouped.get(person.id) || []).sort((a, b) =>
      String(a.date).localeCompare(String(b.date))
    ),
  }));
}

/**
 * Deletes a person along with every memory they own.
 * @returns {Promise<{events:number,notes:number,images:number,songs:number}>}
 */
export async function deletePersonCascade(personId) {
  const [events, notes, images, songs] = await Promise.all([
    deleteByPerson(STORES.EVENTS, personId),
    deleteByPerson(STORES.NOTES, personId),
    deleteByPerson(STORES.IMAGES, personId),
    deleteByPerson(STORES.SONGS, personId),
  ]);

  await deletePerson(personId);

  return { events, notes, images, songs };
}

/** Counts of stored records, used for the footer/diagnostics. */
export async function countRecords() {
  const [people, events, notes, images, songs] = await Promise.all([
    getAll(STORES.PEOPLE),
    getAll(STORES.EVENTS),
    getAll(STORES.NOTES),
    getAll(STORES.IMAGES),
    getAll(STORES.SONGS),
  ]);
  return {
    people: people.length,
    events: events.length,
    notes: notes.length,
    images: images.length,
    songs: songs.length,
  };
}
