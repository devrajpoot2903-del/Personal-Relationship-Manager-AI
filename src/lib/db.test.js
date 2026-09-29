// @vitest-environment node
// Blob structured-cloning needs the Node environment: jsdom's Blob class is not
// cloneable by fake-indexeddb, while real browsers store Blobs natively.
import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  countRecords,
  deletePersonCascade,
  getPersonBundle,
  listPeopleWithEvents,
  saveEvent,
  saveImage,
  saveNote,
  savePerson,
  saveSong,
  getPerson,
} from './db';

/** A small helper that mimics a stored profile photo. */
function fakeBlob(size = 64) {
  return new Blob([new Uint8Array(size)], { type: 'image/jpeg' });
}

async function createPerson(name, extra = {}) {
  return savePerson({
    name,
    relationship: 'College Friend',
    designation: '',
    instagram: '',
    profileImage: null,
    ...extra,
  });
}

describe('IndexedDB persistence', () => {
  // Each test starts from a clean database so record counts stay meaningful.
  beforeEach(async () => {
    const existing = await listPeopleWithEvents();
    await Promise.all(existing.map((person) => deletePersonCascade(person.id)));
  });

  it('saves a person and reads it back', async () => {
    const person = await createPerson('Rahul Sharma');
    expect(person.id).toBeTruthy();
    expect(person.createdAt).toBeTruthy();

    const loaded = await getPerson(person.id);
    expect(loaded.name).toBe('Rahul Sharma');
    expect(loaded.relationship).toBe('College Friend');
  });

  it('keeps a binary profile image as a Blob (not a base64 string)', async () => {
    const person = await createPerson('Asha', {
      profileImage: { blob: fakeBlob(128), name: 'asha.jpg', mimeType: 'image/jpeg', size: 128 },
    });

    const loaded = await getPerson(person.id);
    expect(loaded.profileImage.blob).toBeInstanceOf(Blob);
    expect(loaded.profileImage.blob.size).toBe(128);
    expect(typeof loaded.profileImage.blob).not.toBe('string');
  });

  it('updates a person in place rather than creating a duplicate', async () => {
    const person = await createPerson('Rahul');
    await savePerson({ ...person, name: 'Rahul Sharma', relationship: 'Best Friend' });

    const bundle = await getPersonBundle(person.id);
    expect(bundle.name).toBe('Rahul Sharma');
    expect(bundle.relationship).toBe('Best Friend');

    const all = await countRecords();
    expect(all.people).toBe(1);
  });

  it('stores multiple events, notes and songs against one person', async () => {
    const person = await createPerson('Rahul');

    await saveEvent({ personId: person.id, type: 'birthday', title: '', date: '1998-03-12', recurring: true });
    await saveEvent({ personId: person.id, type: 'anniversary', title: '', date: '2020-11-20', recurring: true });
    await saveEvent({ personId: person.id, type: 'other', title: 'Graduation', date: '2027-06-15', recurring: false });

    await saveNote({ personId: person.id, content: 'Loves Marvel movies' });
    await saveNote({ personId: person.id, content: 'Wants a watch for birthday' });

    await saveSong({ personId: person.id, type: 'link', title: 'Perfect', url: 'https://youtube.com/x', source: 'YouTube' });
    await saveSong({ personId: person.id, type: 'audio', title: 'My Song', blob: new Blob(['abc'], { type: 'audio/mpeg' }), name: 'my-song.mp3' });

    const bundle = await getPersonBundle(person.id);

    expect(bundle.events).toHaveLength(3);
    expect(bundle.notes).toHaveLength(2);
    expect(bundle.songs).toHaveLength(2);

    // Events come back in date order.
    expect(bundle.events.map((event) => event.date)).toEqual([
      '1998-03-12',
      '2020-11-20',
      '2027-06-15',
    ]);

    const audioSong = bundle.songs.find((song) => song.type === 'audio');
    expect(audioSong.blob).toBeInstanceOf(Blob);
  });

  it('stores gallery images with blobs and lists them newest first', async () => {
    const person = await createPerson('Rahul');

    await saveImage({ personId: person.id, blob: fakeBlob(10), name: 'a.jpg', createdAt: '2024-01-01T00:00:00.000Z' });
    await saveImage({ personId: person.id, blob: fakeBlob(20), name: 'b.jpg', createdAt: '2025-01-01T00:00:00.000Z' });

    const bundle = await getPersonBundle(person.id);
    expect(bundle.images).toHaveLength(2);
    expect(bundle.images[0].name).toBe('b.jpg');
    expect(bundle.images[0].blob).toBeInstanceOf(Blob);
  });

  it('refuses to save a child record without a personId', async () => {
    // Records are only reachable via the personId index, so a missing personId
    // would silently orphan them. This must fail loudly instead.
    await expect(saveNote({ content: 'orphan' })).rejects.toThrow(/personId is required/i);
    await expect(saveEvent({ type: 'birthday', date: '1998-03-12' })).rejects.toThrow(
      /personId is required/i
    );
    await expect(saveImage({ blob: fakeBlob(), name: 'x.jpg' })).rejects.toThrow(
      /personId is required/i
    );
    await expect(saveSong({ type: 'link', title: 'x', url: 'https://x.com' })).rejects.toThrow(
      /personId is required/i
    );
  });

  it('keeps a note attached to its person when it is edited', async () => {
    const person = await createPerson('Rahul');
    const note = await saveNote({ personId: person.id, content: 'Loves Marvel' });

    // Simulate an edit that merges with the stored record.
    await saveNote({ ...note, content: 'Loves Marvel and DC' });

    const notes = await getPersonBundle(person.id).then((bundle) => bundle.notes);
    expect(notes).toHaveLength(1);
    expect(notes[0].content).toBe('Loves Marvel and DC');
    expect(notes[0].personId).toBe(person.id);
  });

  it('never writes relationship arrays into the people store', async () => {
    const person = await createPerson('Rahul');

    // Callers sometimes hold the fully-loaded bundle; savePerson must ignore children.
    await savePerson({
      ...person,
      name: 'Rahul Sharma',
      events: [{ id: 'e1', date: '1998-03-12' }],
      notes: [{ id: 'n1', content: 'x' }],
      images: [{ id: 'i1', blob: fakeBlob(2048) }],
      songs: [{ id: 's1', title: 'y' }],
    });

    const stored = await getPerson(person.id);
    expect(stored.name).toBe('Rahul Sharma');
    expect(stored.events).toBeUndefined();
    expect(stored.notes).toBeUndefined();
    expect(stored.images).toBeUndefined();
    expect(stored.songs).toBeUndefined();
  });

  it('does not leak one person’s records into another', async () => {
    const rahul = await createPerson('Rahul');
    const asha = await createPerson('Asha');

    await saveNote({ personId: rahul.id, content: 'Rahul note' });
    await saveImage({ personId: asha.id, blob: fakeBlob(), name: 'asha.jpg' });

    const rahulBundle = await getPersonBundle(rahul.id);
    const ashaBundle = await getPersonBundle(asha.id);

    expect(rahulBundle.notes).toHaveLength(1);
    expect(rahulBundle.images).toHaveLength(0);
    expect(ashaBundle.notes).toHaveLength(0);
    expect(ashaBundle.images).toHaveLength(1);
  });

  it('deleting a person also removes all their associated data', async () => {
    const person = await createPerson('Rahul');
    const other = await createPerson('Asha');

    await saveEvent({ personId: person.id, type: 'birthday', date: '1998-03-12', recurring: true });
    await saveNote({ personId: person.id, content: 'note' });
    await saveImage({ personId: person.id, blob: fakeBlob(), name: 'photo.jpg' });
    await saveSong({ personId: person.id, type: 'link', title: 'Song', url: 'https://x.com' });

    // Another person's data must survive.
    await saveNote({ personId: other.id, content: 'keep me' });

    const removed = await deletePersonCascade(person.id);
    expect(removed).toEqual({ events: 1, notes: 1, images: 1, songs: 1 });

    expect(await getPerson(person.id)).toBeUndefined();
    expect(await getPersonBundle(person.id)).toBeNull();

    const remaining = await countRecords();
    expect(remaining).toEqual({ people: 1, events: 0, notes: 1, images: 0, songs: 0 });
  });

  it('listPeopleWithEvents returns people sorted by name with their events', async () => {
    const zara = await createPerson('Zara');
    const arjun = await createPerson('Arjun');

    await saveEvent({ personId: zara.id, type: 'birthday', date: '1999-05-05', recurring: true });
    await saveEvent({ personId: arjun.id, type: 'other', title: 'Meeting', date: '2027-01-02', recurring: false });

    const people = await listPeopleWithEvents();

    expect(people.map((person) => person.name)).toEqual(['Arjun', 'Zara']);
    expect(people[0].events).toHaveLength(1);
    expect(people[1].events[0].date).toBe('1999-05-05');
    // The heavy binary fields stay out of the dashboard query.
    expect(people[0].images).toBeUndefined();
  });
});
