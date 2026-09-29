import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import HomePage from '../pages/HomePage';
import PersonProfilePage from '../pages/PersonProfilePage';
import { ToastProvider } from '../hooks/useToast';
import {
  countRecords,
  deletePersonCascade,
  listEvents,
  listNotes,
  listPeopleWithEvents,
  listSongs,
  saveEvent,
  savePerson,
} from '../lib/db';

function renderApp(initialPath = '/') {
  return render(
    <ToastProvider>
      <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/person/:personId" element={<PersonProfilePage />} />
        </Routes>
      </MemoryRouter>
    </ToastProvider>
  );
}

async function seedPerson({ name = 'Rahul Sharma', events = [] } = {}) {
  const person = await savePerson({
    name,
    relationship: 'College Friend',
    designation: '',
    instagram: '',
    profileImage: null,
  });

  for (const event of events) {
    await saveEvent({ personId: person.id, ...event });
  }

  return person;
}

/**
 * Scopes queries to one profile section. Sections are the level-2 headings, so
 * the level-3 empty-state headings inside them never collide.
 */
function sectionByHeading(name) {
  const heading = screen.getByRole('heading', { level: 2, name });
  const section = heading.closest('section');
  if (!section) throw new Error(`No <section> found for heading ${String(name)}`);
  return within(section);
}

beforeEach(async () => {
  const people = await listPeopleWithEvents();
  await Promise.all(people.map((person) => deletePersonCascade(person.id)));
});

/* ============================================================
   Home / dashboard
   ============================================================ */

describe('HomePage', () => {
  it('shows the empty state when there are no people', async () => {
    renderApp();

    expect(await screen.findByText(/your people are waiting here/i)).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /add person/i }).length).toBeGreaterThan(0);
  });

  it('adds a person through the modal and shows their card', async () => {
    const user = userEvent.setup();
    renderApp();

    await screen.findByText(/your people are waiting here/i);
    await user.click(screen.getAllByRole('button', { name: /add person/i })[0]);

    const dialog = await screen.findByRole('dialog');
    await user.type(within(dialog).getByLabelText(/^name/i), 'Rahul Sharma');
    await user.type(within(dialog).getByLabelText(/relationship/i), 'College Friend');
    await user.click(within(dialog).getByRole('button', { name: /^add person$/i }));

    expect(await screen.findByRole('heading', { name: 'Rahul Sharma' })).toBeInTheDocument();
    expect(screen.getByText('College Friend')).toBeInTheDocument();

    // Persisted, not just rendered.
    const people = await listPeopleWithEvents();
    expect(people).toHaveLength(1);
    expect(people[0].name).toBe('Rahul Sharma');
  });

  it('refuses to add a person without a name and shows a friendly message', async () => {
    const user = userEvent.setup();
    renderApp();

    await screen.findByText(/your people are waiting here/i);
    await user.click(screen.getAllByRole('button', { name: /add person/i })[0]);

    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: /^add person$/i }));

    expect(await screen.findByText(/please enter a name/i)).toBeInTheDocument();
    expect(await listPeopleWithEvents()).toHaveLength(0);
  });

  it('shows the next occasion countdown on the card', async () => {
    await seedPerson({
      name: 'Rahul',
      events: [{ type: 'birthday', title: '', date: '1998-03-12', recurring: true }],
    });

    renderApp();

    const heading = await screen.findByRole('heading', { name: 'Rahul' });
    const card = heading.closest('article');

    expect(within(card).getByText('Birthday')).toBeInTheDocument();
    expect(within(card).getByText(/12 March/)).toBeInTheDocument();
    expect(within(card).getByText(/\d+ days left|Today|Tomorrow/)).toBeInTheDocument();
  });

  it('filters people by name as the user types', async () => {
    await seedPerson({ name: 'Rahul' });
    await seedPerson({ name: 'Asha' });

    const user = userEvent.setup();
    renderApp();

    expect(await screen.findByRole('heading', { name: 'Rahul' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Asha' })).toBeInTheDocument();

    await user.type(screen.getByLabelText(/search people/i), 'ash');

    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: 'Rahul' })).not.toBeInTheDocument();
    });
    expect(screen.getByRole('heading', { name: 'Asha' })).toBeInTheDocument();
  });

  it('shows a search empty state that can be cleared', async () => {
    await seedPerson({ name: 'Rahul' });

    const user = userEvent.setup();
    renderApp();
    await screen.findByRole('heading', { name: 'Rahul' });

    await user.type(screen.getByLabelText(/search people/i), 'zzz');
    expect(await screen.findByText(/no one matched that search/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /show all people/i }));
    expect(await screen.findByRole('heading', { name: 'Rahul' })).toBeInTheDocument();
  });

  it('asks for confirmation before deleting, then removes the person and their memories', async () => {
    await seedPerson({
      name: 'Rahul',
      events: [{ type: 'birthday', title: '', date: '1998-03-12', recurring: true }],
    });

    const user = userEvent.setup();
    renderApp();
    await screen.findByRole('heading', { name: 'Rahul' });

    await user.click(screen.getByRole('button', { name: /more options for rahul/i }));
    await user.click(screen.getByRole('menuitem', { name: /delete person/i }));

    // Confirmation first — nothing is deleted yet.
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText(/delete rahul\?/i)).toBeInTheDocument();
    expect(await listPeopleWithEvents()).toHaveLength(1);

    // Cancelling keeps the person.
    await user.click(within(dialog).getByRole('button', { name: /cancel/i }));
    expect(await listPeopleWithEvents()).toHaveLength(1);

    // Confirming deletes the person and their associated data.
    await user.click(screen.getByRole('button', { name: /more options for rahul/i }));
    await user.click(screen.getByRole('menuitem', { name: /delete person/i }));
    const dialogAgain = await screen.findByRole('dialog');
    await user.click(within(dialogAgain).getByRole('button', { name: /^delete$/i }));

    await waitFor(async () => {
      expect(await listPeopleWithEvents()).toHaveLength(0);
    });
    expect(await countRecords()).toEqual({
      people: 0,
      events: 0,
      notes: 0,
      images: 0,
      songs: 0,
    });
  });
});

/* ============================================================
   Person profile
   ============================================================ */

describe('PersonProfilePage', () => {
  it('shows an empty-profile state for an unknown person id', async () => {
    renderApp('/person/does-not-exist');

    expect(await screen.findByText(/this person no longer exists/i)).toBeInTheDocument();
  });

  it('renders the hero, every section and the next occasion countdown', async () => {
    const person = await seedPerson({
      name: 'Rahul Sharma',
      events: [{ type: 'birthday', title: '', date: '1998-03-12', recurring: true }],
    });

    renderApp(`/person/${person.id}`);

    // Hero
    const hero = await screen.findByRole('heading', { name: 'Rahul Sharma' });
    expect(screen.getByText('College Friend')).toBeInTheDocument();
    expect(within(hero.closest('div.profile-hero')).getByText(/12 March/)).toBeInTheDocument();

    // Every section is present.
    expect(screen.getByRole('heading', { level: 2, name: /important dates/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: /notes/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: /memories/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: /songs/i })).toBeInTheDocument();

    // Event row inside the dates section.
    expect(sectionByHeading(/important dates/i).getByText('Birthday')).toBeInTheDocument();

    // Empty states for the sections that are still empty.
    expect(screen.getByText(/no notes yet/i)).toBeInTheDocument();
    expect(screen.getByText(/no memories added yet/i)).toBeInTheDocument();
    expect(screen.getByText(/no songs added yet/i)).toBeInTheDocument();
  });

  it('adds a custom recurring event from the profile', async () => {
    const user = userEvent.setup();
    const person = await seedPerson({ name: 'Rahul' });

    renderApp(`/person/${person.id}`);
    await screen.findByRole('heading', { name: 'Rahul' });

    await user.click(sectionByHeading(/important dates/i).getByRole('button', { name: /^add date$/i }));

    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: /other/i }));
    await user.type(within(dialog).getByLabelText(/event name/i), 'Friendship Day');

    const dateInput = within(dialog).getByLabelText(/^date/i);
    await user.clear(dateInput);
    await user.type(dateInput, '2020-08-02');

    await user.click(within(dialog).getByRole('button', { name: /^add date$/i }));

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    const events = await listEvents(person.id);
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      type: 'other',
      title: 'Friendship Day',
      date: '2020-08-02',
      recurring: true,
    });
  });

  it('requires a name for a custom event', async () => {
    const user = userEvent.setup();
    const person = await seedPerson({ name: 'Rahul' });

    renderApp(`/person/${person.id}`);
    await screen.findByRole('heading', { name: 'Rahul' });

    await user.click(sectionByHeading(/important dates/i).getByRole('button', { name: /^add date$/i }));

    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: /other/i }));
    await user.click(within(dialog).getByRole('button', { name: /^add date$/i }));

    expect(await screen.findByText(/give this occasion a name/i)).toBeInTheDocument();
    expect(await listEvents(person.id)).toHaveLength(0);
  });

  it('adds, edits and deletes a note', async () => {
    const user = userEvent.setup();
    const person = await seedPerson({ name: 'Rahul' });

    renderApp(`/person/${person.id}`);
    await screen.findByRole('heading', { name: 'Rahul' });

    // Add
    await user.click(sectionByHeading(/notes/i).getByRole('button', { name: /^add note$/i }));
    await user.type(screen.getByPlaceholderText(/loves marvel/i), 'Loves Marvel movies');
    await user.click(screen.getByRole('button', { name: /save note/i }));

    await waitFor(async () => {
      expect(await listNotes(person.id)).toHaveLength(1);
    });
    expect(await screen.findByText('Loves Marvel movies')).toBeInTheDocument();

    // Edit
    await user.click(screen.getByRole('button', { name: /edit note/i }));
    const textarea = screen.getByDisplayValue('Loves Marvel movies');
    await user.clear(textarea);
    await user.type(textarea, 'Loves Marvel and DC');
    await user.click(screen.getByRole('button', { name: /^save$/i }));

    await waitFor(async () => {
      const updated = await listNotes(person.id);
      expect(updated).toHaveLength(1);
      expect(updated[0].content).toBe('Loves Marvel and DC');
    });
    expect(await screen.findByText('Loves Marvel and DC')).toBeInTheDocument();

    // Delete, with confirmation
    await user.click(screen.getByRole('button', { name: /delete note/i }));
    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: /^delete$/i }));

    await waitFor(async () => {
      expect(await listNotes(person.id)).toHaveLength(0);
    });
  });

  it('rejects an invalid song URL and stores nothing', async () => {
    const user = userEvent.setup();
    const person = await seedPerson({ name: 'Rahul' });

    renderApp(`/person/${person.id}`);
    await screen.findByRole('heading', { name: 'Rahul' });

    await user.click(sectionByHeading(/songs/i).getByRole('button', { name: /^add song$/i }));

    const dialog = await screen.findByRole('dialog');
    await user.type(within(dialog).getByLabelText(/song name/i), 'Perfect');
    await user.type(within(dialog).getByLabelText(/^link/i), 'not-a-url');
    await user.click(within(dialog).getByRole('button', { name: /^add song$/i }));

    expect(await screen.findByText(/does not look valid/i)).toBeInTheDocument();
    expect(await listSongs(person.id)).toHaveLength(0);
  });

  it('saves a valid song link with its detected source', async () => {
    const user = userEvent.setup();
    const person = await seedPerson({ name: 'Rahul' });

    renderApp(`/person/${person.id}`);
    await screen.findByRole('heading', { name: 'Rahul' });

    await user.click(sectionByHeading(/songs/i).getByRole('button', { name: /^add song$/i }));

    const dialog = await screen.findByRole('dialog');
    await user.type(within(dialog).getByLabelText(/song name/i), 'Perfect');
    await user.type(
      within(dialog).getByLabelText(/^link/i),
      'https://www.youtube.com/watch?v=abc'
    );
    await user.click(within(dialog).getByRole('button', { name: /^add song$/i }));

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    await waitFor(async () => {
      const stored = await listSongs(person.id);
      expect(stored).toHaveLength(1);
      expect(stored[0]).toMatchObject({ type: 'link', title: 'Perfect', source: 'YouTube' });
    });
    expect(await screen.findByText('Perfect')).toBeInTheDocument();
  });

  it('edits the person from the profile and updates the same record', async () => {
    const user = userEvent.setup();
    const person = await seedPerson({ name: 'Rahul' });

    renderApp(`/person/${person.id}`);
    await screen.findByRole('heading', { name: 'Rahul' });

    await user.click(screen.getByRole('button', { name: /edit person/i }));

    const dialog = await screen.findByRole('dialog');
    const nameInput = within(dialog).getByLabelText(/^name/i);
    await user.clear(nameInput);
    await user.type(nameInput, 'Rahul Sharma');
    await user.click(within(dialog).getByRole('button', { name: /save changes/i }));

    expect(await screen.findByRole('heading', { name: 'Rahul Sharma' })).toBeInTheDocument();

    // Updated in place — not duplicated.
    expect((await countRecords()).people).toBe(1);
  });

  it('deletes the person from the profile and returns to the dashboard', async () => {
    const user = userEvent.setup();
    const person = await seedPerson({ name: 'Rahul' });

    renderApp(`/person/${person.id}`);
    await screen.findByRole('heading', { name: 'Rahul' });

    await user.click(screen.getByRole('button', { name: /delete person/i }));

    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText(/delete rahul\?/i)).toBeInTheDocument();

    await user.click(within(dialog).getByRole('button', { name: /^delete$/i }));

    expect(await screen.findByText(/your people are waiting here/i)).toBeInTheDocument();
    expect(await listPeopleWithEvents()).toHaveLength(0);
  });
});
