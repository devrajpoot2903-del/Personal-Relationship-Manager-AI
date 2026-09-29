import { beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import HomePage from '../pages/HomePage';
import PersonProfilePage from '../pages/PersonProfilePage';
import { ToastProvider } from '../hooks/useToast';
import {
  countRecords,
  deletePersonCascade,
  getPersonBundle,
  listPeopleWithEvents,
} from '../lib/db';

/**
 * Renders the app the way `main.jsx` does, so unmount + re-render is a faithful
 * stand-in for a browser refresh: the React tree is thrown away and rebuilt
 * from whatever is persisted in IndexedDB.
 */
let mountedView = null;

function renderApp(initialPath = '/') {
  // Only ever one tree at a time, so queries cannot match stale DOM.
  mountedView?.unmount();
  mountedView = render(
    <ToastProvider>
      <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/person/:personId" element={<PersonProfilePage />} />
        </Routes>
      </MemoryRouter>
    </ToastProvider>
  );
  return mountedView;
}

/** Discards the React tree completely and rebuilds it — a browser refresh. */
function refreshApp(initialPath = '/') {
  mountedView?.unmount();
  mountedView = null;
  return renderApp(initialPath);
}

function imageFile(name, sizeBytes = 2048) {
  return new File([new Uint8Array(sizeBytes)], name, { type: 'image/jpeg' });
}

function audioFile(name = 'our-song.mp3', sizeBytes = 4096) {
  return new File([new Uint8Array(sizeBytes)], name, { type: 'audio/mpeg' });
}

/** The gallery uploader (multiple) and the song uploader (single). */
function fileInputs(container) {
  return {
    gallery: container.querySelector('input[type="file"][multiple]'),
    audio: container.querySelector('input[type="file"]:not([multiple])'),
  };
}

/** Bound queries scoped to one profile section (sections are level-2 headings). */
function section(name) {
  const heading = screen.getByRole('heading', { level: 2, name });
  return within(heading.closest('section'));
}

beforeEach(async () => {
  const people = await listPeopleWithEvents();
  await Promise.all(people.map((person) => deletePersonCascade(person.id)));
});

describe('Definition of done — one full journey', () => {
  it('takes a person from empty app to a fully populated profile that survives a refresh', async () => {
    const user = userEvent.setup();

    // 1. Open the application — empty state.
    const first = renderApp();
    expect(await screen.findByText(/your people are waiting here/i)).toBeInTheDocument();

    // 2-4. Add a person with a name and a relationship.
    await user.click(screen.getAllByRole('button', { name: /add person/i })[0]);
    const personDialog = await screen.findByRole('dialog');
    await user.type(within(personDialog).getByLabelText(/^name/i), 'Rahul Sharma');
    await user.type(within(personDialog).getByLabelText(/relationship/i), 'College Friend');
    await user.type(within(personDialog).getByLabelText(/designation/i), 'Frontend Developer');
    await user.type(within(personDialog).getByLabelText(/instagram/i), '@rahul');
    await user.click(within(personDialog).getByRole('button', { name: /^add person$/i }));

    // 6. Card appears on the home page.
    expect(await screen.findByRole('heading', { name: 'Rahul Sharma' })).toBeInTheDocument();
    expect(screen.getByText(/College Friend/)).toBeInTheDocument();

    // 5. Add a birthday, then check the countdown shows on the card (7).
    await user.click(screen.getByRole('heading', { name: 'Rahul Sharma' }));

    await screen.findByRole('button', { name: /edit person/i });
    await user.click(section(/important dates/i).getByRole('button', { name: /^add date$/i }));

    let dialog = await screen.findByRole('dialog');
    const dateInput = within(dialog).getByLabelText(/^date/i);
    await user.clear(dateInput);
    await user.type(dateInput, '1998-03-12');
    await user.click(within(dialog).getByRole('button', { name: /^add date$/i }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());

    const person = (await listPeopleWithEvents())[0];
    const bundleAfterBirthday = await getPersonBundle(person.id);
    expect(bundleAfterBirthday.events).toHaveLength(1);

    // 8. Back on the dashboard the card shows the countdown.
    renderApp();
    const card = (await screen.findByRole('heading', { name: 'Rahul Sharma' })).closest('article');
    expect(within(card).getByText(/days left|Today|Tomorrow/)).toBeInTheDocument();

    // Now work entirely inside the profile page.
    const profile = renderApp(`/person/${person.id}`);
    await screen.findByRole('heading', { name: 'Rahul Sharma' });

    // 9-10. Add an anniversary and a custom recurring event.
    await user.click(section(/important dates/i).getByRole('button', { name: /^add date$/i }));
    dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: /anniversary/i }));
    const annivDate = within(dialog).getByLabelText(/^date/i);
    await user.clear(annivDate);
    await user.type(annivDate, '2020-11-20');
    await user.click(within(dialog).getByRole('button', { name: /^add date$/i }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());

    await user.click(section(/important dates/i).getByRole('button', { name: /^add date$/i }));
    dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: /other/i }));
    await user.type(within(dialog).getByLabelText(/event name/i), 'Friendship Day');
    const customDate = within(dialog).getByLabelText(/^date/i);
    await user.clear(customDate);
    await user.type(customDate, '2019-08-04');
    await user.click(within(dialog).getByRole('button', { name: /^add date$/i }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());

    expect(section(/important dates/i).getByText('Friendship Day')).toBeInTheDocument();
    expect(section(/important dates/i).getByText('Anniversary')).toBeInTheDocument();
    expect((await getPersonBundle(person.id)).events).toHaveLength(3);

    // 11. Add a personal note.
    await user.click(section(/notes/i).getByRole('button', { name: /^add note$/i }));
    await user.type(
      screen.getByPlaceholderText(/loves marvel/i),
      'Loves Marvel movies, wants a watch for their birthday'
    );
    await user.click(screen.getByRole('button', { name: /save note/i }));
    expect(await screen.findByText(/wants a watch/)).toBeInTheDocument();

    // 12-13. Upload several photos and see them in the gallery.
    const { gallery } = fileInputs(profile.container);
    fireEvent.change(gallery, {
      target: { files: [imageFile('trip.jpg'), imageFile('birthday.jpg'), imageFile('selfie.jpg')] },
    });

    expect(await screen.findByText(/3 photos added/i)).toBeInTheDocument();
    await waitFor(async () => {
      expect((await getPersonBundle(person.id)).images).toHaveLength(3);
    });

    // 14. A bad photo is rejected with a friendly message and not stored.
    fireEvent.change(gallery, {
      target: { files: [new File(['x'], 'notes.pdf', { type: 'application/pdf' })] },
    });
    expect(await screen.findByText(/not a supported image/i)).toBeInTheDocument();
    expect((await getPersonBundle(person.id)).images).toHaveLength(3);

    // 15. Open a photo in the viewer, then close it.
    const tiles = await screen.findAllByRole('button', { name: /^Open /i });
    expect(tiles).toHaveLength(3);
    await user.click(tiles[1]);
    const viewer = await screen.findByRole('dialog', { name: /photo viewer/i });
    expect(within(viewer).getByText(/2 of 3/)).toBeInTheDocument();
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());

    // 16-17. Add a song by link.
    await user.click(section(/songs/i).getByRole('button', { name: /^add song$/i }));
    dialog = await screen.findByRole('dialog');
    await user.type(within(dialog).getByLabelText(/song name/i), 'Perfect');
    await user.type(
      within(dialog).getByLabelText(/^link/i),
      'https://open.spotify.com/track/abc'
    );
    await user.click(within(dialog).getByRole('button', { name: /^add song$/i }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());

    const link = await screen.findByRole('link', { name: /Perfect/ });
    expect(link).toHaveAttribute('href', 'https://open.spotify.com/track/abc');
    expect(link).toHaveAttribute('target', '_blank');

    // 18-19. Upload an audio file and play it.
    await user.click(section(/songs/i).getByRole('button', { name: /^add song$/i }));
    dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: /upload audio/i }));
    fireEvent.change(dialog.querySelector('input[type="file"]'), {
      target: { files: [audioFile('our-song.mp3')] },
    });
    await user.click(within(dialog).getByRole('button', { name: /^add song$/i }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());

    const playButton = await screen.findByRole('button', { name: /play our song/i });
    await user.click(playButton);
    expect(window.HTMLMediaElement.prototype.play).toHaveBeenCalled();

    const songs = (await getPersonBundle(person.id)).songs;
    expect(songs).toHaveLength(2);

    const audio = songs.find((song) => song.type === 'audio');
    expect(audio.title).toBe('our song');
    expect(audio.mimeType).toBe('audio/mpeg');
    expect(audio.size).toBe(4096);
    expect(audio.blob).toBeTruthy();

    // The rendered player points at an object URL built from the stored audio.
    // (Blob identity itself is asserted in db.test.js, which runs in Node where
    // fake-indexeddb can structured-clone Blobs the way a browser does.)
    const audioEl = document.querySelector('audio');
    expect(audioEl).toBeTruthy();
    expect(audioEl.getAttribute('src')).toMatch(/^blob:/);

    // 20. Edit the person's details.
    await user.click(screen.getByRole('button', { name: /edit person/i }));
    dialog = await screen.findByRole('dialog');
    const nameField = within(dialog).getByLabelText(/^name/i);
    await user.clear(nameField);
    await user.type(nameField, 'Rahul S. Sharma');
    await user.click(within(dialog).getByRole('button', { name: /save changes/i }));
    expect(await screen.findByRole('heading', { name: 'Rahul S. Sharma' })).toBeInTheDocument();
    expect((await countRecords()).people).toBe(1);

    // 21. Delete a note (an individual item), leaving the rest intact.
    await user.click(screen.getByRole('button', { name: /delete note/i }));
    const confirm = await screen.findByRole('dialog');
    await user.click(within(confirm).getByRole('button', { name: /^delete$/i }));
    await waitFor(async () => {
      expect((await getPersonBundle(person.id)).notes).toHaveLength(0);
    });

    // ---------------------------------------------------------------
    // 22. "Refresh the browser" — tear the UI down and rebuild it from
    //     IndexedDB only. Everything must still be there.
    // ---------------------------------------------------------------
    const before = await getPersonBundle(person.id);
    refreshApp(`/person/${person.id}`);

    expect(await screen.findByRole('heading', { name: 'Rahul S. Sharma' })).toBeInTheDocument();
    expect(screen.getByText('@rahul')).toBeInTheDocument();
    expect(section(/important dates/i).getByText('Birthday')).toBeInTheDocument();
    expect(section(/important dates/i).getByText('Anniversary')).toBeInTheDocument();
    expect(section(/important dates/i).getByText('Friendship Day')).toBeInTheDocument();
    expect(await screen.findAllByRole('button', { name: /^Open /i })).toHaveLength(3);
    expect(await screen.findByRole('link', { name: /Perfect/ })).toBeInTheDocument();

    const after = await getPersonBundle(person.id);
    expect(after.events).toHaveLength(before.events.length);
    expect(after.images).toHaveLength(3);
    expect(after.songs).toHaveLength(2);
    expect(after.images.map((image) => image.size)).toEqual([2048, 2048, 2048]);
    expect(after.images.every((image) => image.blob)).toBe(true);

    // 23. Search for the person from the dashboard.
    refreshApp();
    await screen.findByRole('heading', { name: 'Rahul S. Sharma' });
    await user.type(screen.getByLabelText(/search people/i), 'rah');
    expect(screen.getByRole('heading', { name: 'Rahul S. Sharma' })).toBeInTheDocument();

    // 24. Delete the person — every associated memory goes with them.
    await user.click(screen.getByRole('button', { name: /more options for rahul s. sharma/i }));
    await user.click(screen.getByRole('menuitem', { name: /delete person/i }));
    const deleteDialog = await screen.findByRole('dialog');
    expect(within(deleteDialog).getByText(/permanently remove Rahul S\. Sharma/i)).toBeInTheDocument();
    await user.click(within(deleteDialog).getByRole('button', { name: /^delete$/i }));

    await waitFor(async () => {
      expect(await countRecords()).toEqual({
        people: 0,
        events: 0,
        notes: 0,
        images: 0,
        songs: 0,
      });
    });
  }, 30000);
});
