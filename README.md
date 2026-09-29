# Personal Relationship Manager

A small, personal **memory book** — not a CRM, not a calendar app.

Keep the people you care about in one place: their photo, how you know them, their
birthdays and anniversaries, the countdown to the next one, plus your notes, photos
and songs about them.

> Open one person's profile and everything about them is right there — no hunting
> through your gallery, WhatsApp, Instagram, notes app and contacts.

**Everything is stored locally in your browser using IndexedDB. There is no backend,
no account, no login and no cloud sync.**

---

## What it does

### People
- Add, edit and delete people
- Profile picture (JPG / PNG / WebP)
- Name, relationship and an optional designation
- Relationship is free text with suggestions — `Family`, `College Friend`, `Cousin`…
  or anything you like, such as `Rakhi Sister` or `Neighbour`
- Optional Instagram handle or link

### Important dates
- 🎂 Birthday, 💍 Anniversary and 📅 Other (custom) events
- Multiple dates per person
- Recurring yearly or one-off (for things like a graduation)
- Live countdown: **Today 🎉**, **Tomorrow**, **12 days left**, sorted so the next
  occasion is always first

### Memories
- **Notes** — quick personal details: favourite colour, gift ideas, things to say
- **Gallery** — upload many photos at once, view them full-screen in a lightbox
- **Songs** — paste a link (YouTube, Spotify, …) or upload an audio file and play it

### Finding people
- Instant search by name (and relationship / designation)

### Storage
- All data lives in IndexedDB, in **this browser on this device**
- Images and audio are stored as **Blobs** — not Base64, not localStorage
- Deleting a person also deletes their photos, songs, notes and dates — after a
  confirmation prompt, never silently

---

## Tech stack

| Layer | Choice |
| --- | --- |
| UI | React 19 |
| Build | Vite 8 |
| Language | JavaScript (JSX) |
| Styling | Tailwind CSS v4 |
| Routing | React Router (hash routing) |
| Icons | lucide-react |
| Persistence | IndexedDB (native browser API) |
| Tests | Vitest, Testing Library, jsdom, fake-indexeddb |

No Express, no MongoDB, no SQL, no Firebase, no Supabase, no authentication.

---

## Getting started

```bash
npm install
npm run dev      # http://localhost:5173
```

Other scripts:

```bash
npm run build      # production build into dist/
npm run preview    # serve the production build
npm test           # run the test suite (45 tests)
npm run test:watch # re-run tests on change
npm run lint       # oxlint
```

### Tests

`npm test` covers three layers:

- **`src/lib/dates.test.js`** — countdown maths with a frozen clock: today,
  tomorrow, a 164-day gap, leap/shift handling, rolling annual dates, one-off
  past dates, and ordering events by what is coming up next.
- **`src/lib/db.test.js`** — real IndexedDB round-trips (via `fake-indexeddb`)
  proving people, events, notes, photos and songs persist; that binaries come
  back as `Blob`s rather than Base64; that one person's records never leak into
  another's; and that deleting a person removes everything attached to them.
- **`src/test/app.test.jsx`** and **`src/test/journey.test.jsx`** — the actual
  React app rendered with Testing Library: the full CRUD surface, validation and
  error messages, search, confirmation prompts, image and audio upload, the
  lightbox, and a simulated browser refresh that rebuilds the UI from IndexedDB
  alone.

> The persistence suite runs in the Node environment because jsdom's `Blob` is
> not structured-cloneable by `fake-indexeddb`; Node's `Blob` is, exactly as in a
> real browser. The UI tests run in jsdom.

---

## Project structure

```
src/
├── lib/
│   ├── constants.js    Relationship/event options, limits, accepted file types
│   ├── dates.js        Countdown + date formatting (never stored, always derived)
│   ├── db.js           IndexedDB layer: stores, CRUD, cascade delete
│   └── files.js        File validation and object-URL helpers
├── hooks/
│   ├── usePeopleList.js   Dashboard data + create/update/delete
│   ├── usePersonDetail.js One person with events, notes, gallery, songs
│   ├── useObjectUrl.js    Blob -> object URL, revoked automatically
│   └── useToast.jsx       Friendly notifications
├── components/
│   ├── layout/         Header
│   ├── ui/             Avatar, Modal, ConfirmDialog, EmptyState, Field, SearchInput
│   ├── people/         PersonCard
│   ├── profile/        ProfileHero, EventsSection, NotesSection,
│   │                   GallerySection, SongsSection
│   └── modals/         PersonFormModal, EventFormModal, SongFormModal
├── pages/
│   ├── HomePage.jsx
│   └── PersonProfilePage.jsx
├── App.jsx
└── index.css           Tailwind theme tokens + component classes
```

### Data model

```
people   { id, name, relationship, designation, instagram,
           profileImage: { blob, name, mimeType, size },
           createdAt, updatedAt }

events   { id, personId, type, title, date, recurring, createdAt }
notes    { id, personId, content, createdAt, updatedAt }
images   { id, personId, blob, name, mimeType, size, createdAt }
songs    { id, personId, type: 'link' | 'audio', title, url?, source?, note?,
           blob?, name?, mimeType?, size?, createdAt }
```

Events, notes, images and songs each carry a `personId`, so a person's record never
has to hold their binaries. Deleting a person removes every record that points at them.

---

## Deployment

The build is fully static — any static host works.

```bash
npm run build     # outputs dist/
```

- **Vercel / Netlify** — build command `npm run build`, output directory `dist`
- **GitHub Pages** — a workflow is included at
  `.github/workflows/deploy-pages.yml`; enable Pages with "GitHub Actions" as the
  source and it builds, tests and deploys on every push to `main`
- **Anywhere else** — upload the contents of `dist/` as static files

Asset paths are relative (`base: './'`) and routing uses the URL hash, so the same
build works from a domain root *or* a project subpath, and refreshing a profile
page works on any host without rewrite rules.

> **Note on data:** deployment only hosts the application code. IndexedDB is
> per-browser and per-device, so your people and memories do **not** travel between
> devices or browsers. Clearing your browser's site data will remove them.

---

## Design principles

Warm, quiet and personal — a digital memory book rather than a dashboard.

- Off-white and warm neutral surfaces, one soft amber accent
- Large photos, card-based layout, soft shadows, subtle borders, rounded corners
- Generous whitespace, minimal animation, elegant hover states, clean icons
- Fully responsive: one to three cards per row, adapting gallery grid
- No neon, no purple AI gradients, no glassmorphism, no charts, no calendar grid

The visual hierarchy is always **person → photo → name → memory → date → countdown**.

---

## Out of scope (deliberately)

No authentication, user accounts, social sharing, AI, chatbot, analytics,
notifications, cloud sync, multi-user collaboration or backend of any kind. This is
a focused personal tool for roughly 20–50 people.
