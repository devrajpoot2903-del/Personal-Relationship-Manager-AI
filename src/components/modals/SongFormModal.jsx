import { useEffect, useRef, useState } from 'react';
import { Link2, Music4, Upload } from 'lucide-react';
import Modal from '../ui/Modal';
import Field from '../ui/Field';
import { AUDIO_ACCEPT_ATTR, LIMITS, SONG_TYPE, formatBytes } from '../../lib/constants';
import {
  detectLinkSource,
  titleFromFilename,
  validateHttpUrl,
} from '../../lib/files';

/**
 * Add a song either as an external link (YouTube / Spotify / …) or as an
 * uploaded audio file kept on this device.
 */
export default function SongFormModal({ isOpen, onClose, onSubmitLink, onSubmitAudio }) {
  const fileInputRef = useRef(null);

  const [mode, setMode] = useState(SONG_TYPE.LINK);
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [note, setNote] = useState('');
  const [audioFile, setAudioFile] = useState(null);
  const [audioTitle, setAudioTitle] = useState('');
  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setMode(SONG_TYPE.LINK);
    setTitle('');
    setUrl('');
    setNote('');
    setAudioFile(null);
    setAudioTitle('');
    setErrors({});
    setIsSaving(false);
  }, [isOpen]);

  const switchMode = (nextMode) => {
    setMode(nextMode);
    setErrors({});
  };

  const handlePickAudio = (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    if (!file.type.startsWith('audio/') && !/\.(mp3|wav|m4a|ogg)$/i.test(file.name)) {
      setErrors((current) => ({
        ...current,
        audioFile: `"${file.name}" is not a supported audio file. Use MP3, WAV, M4A or OGG.`,
      }));
      return;
    }

    if (file.size > LIMITS.MAX_AUDIO_BYTES) {
      setErrors((current) => ({
        ...current,
        audioFile: `"${file.name}" is larger than 25 MB.`,
      }));
      return;
    }

    setAudioFile(file);
    setAudioTitle((current) => current || titleFromFilename(file.name));
    setErrors((current) => ({ ...current, audioFile: undefined }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const next = {};

    if (mode === SONG_TYPE.LINK) {
      try {
        validateHttpUrl(url);
      } catch (error) {
        next.url = error.message;
      }

      if (!title.trim()) next.title = 'Give the song a name.';
      else if (title.trim().length > LIMITS.MAX_SONG_TITLE_LENGTH) next.title = 'That name is too long.';
    } else {
      if (!audioFile) next.audioFile = 'Choose an audio file to upload.';
      if (!audioTitle.trim()) next.audioTitle = 'Give the song a name.';
      else if (audioTitle.trim().length > LIMITS.MAX_SONG_TITLE_LENGTH)
        next.audioTitle = 'That name is too long.';
    }

    setErrors(next);
    if (Object.keys(next).length) return;

    setIsSaving(true);
    try {
      if (mode === SONG_TYPE.LINK) {
        const normalised = validateHttpUrl(url);
        await onSubmitLink({
          title: title.trim(),
          url: normalised,
          source: detectLinkSource(normalised),
          note: note.trim(),
        });
      } else {
        await onSubmitAudio(audioFile, audioTitle.trim());
      }
      onClose();
    } catch (error) {
      setErrors({ form: error.message || 'Could not save this song. Please try again.' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add a song"
      description="A song that reminds you of them, or one you may want to use."
      size="md"
      footer={
        <>
          <button type="button" className="btn-secondary" onClick={onClose} disabled={isSaving}>
            Cancel
          </button>
          <button type="submit" form="song-form" className="btn-primary" disabled={isSaving}>
            {isSaving ? 'Saving…' : 'Add song'}
          </button>
        </>
      }
    >
      <form id="song-form" onSubmit={handleSubmit} className="space-y-5" noValidate>
        {/* Mode switch */}
        <div className="grid grid-cols-2 gap-2 rounded-xl bg-ink-100 p-1">
          <button
            type="button"
            onClick={() => switchMode(SONG_TYPE.LINK)}
            aria-pressed={mode === SONG_TYPE.LINK}
            className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              mode === SONG_TYPE.LINK
                ? 'bg-white text-ink-900 shadow-sm'
                : 'text-ink-500 hover:text-ink-700'
            }`}
          >
            <Link2 className="h-4 w-4" aria-hidden="true" />
            Paste a link
          </button>
          <button
            type="button"
            onClick={() => switchMode(SONG_TYPE.AUDIO)}
            aria-pressed={mode === SONG_TYPE.AUDIO}
            className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              mode === SONG_TYPE.AUDIO
                ? 'bg-white text-ink-900 shadow-sm'
                : 'text-ink-500 hover:text-ink-700'
            }`}
          >
            <Upload className="h-4 w-4" aria-hidden="true" />
            Upload audio
          </button>
        </div>

        {mode === SONG_TYPE.LINK ? (
          <>
            <Field label="Song name" htmlFor="song-title" error={errors.title} required>
              <input
                id="song-title"
                type="text"
                className="form-input"
                placeholder="Perfect"
                value={title}
                maxLength={LIMITS.MAX_SONG_TITLE_LENGTH}
                onChange={(event) => {
                  setTitle(event.target.value);
                  if (errors.title) setErrors((current) => ({ ...current, title: undefined }));
                }}
              />
            </Field>

            <Field label="Link" htmlFor="song-url" error={errors.url} required>
              <input
                id="song-url"
                type="url"
                inputMode="url"
                className="form-input"
                placeholder="https://open.spotify.com/track/..."
                value={url}
                maxLength={LIMITS.MAX_LINK_LENGTH}
                onChange={(event) => {
                  setUrl(event.target.value);
                  if (errors.url) setErrors((current) => ({ ...current, url: undefined }));
                }}
              />
            </Field>
          </>
        ) : (
          <>
            <Field label="Audio file" htmlFor="song-file" error={errors.audioFile} required>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex w-full items-center gap-3 rounded-xl border border-dashed border-ink-300 bg-ink-50/60 px-4 py-4 text-left transition-colors hover:border-brand-300 hover:bg-brand-50/40"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-700">
                  <Music4 className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-ink-800">
                    {audioFile ? audioFile.name : 'Choose an audio file'}
                  </span>
                  <span className="mt-0.5 block text-xs text-ink-500">
                    {audioFile
                      ? formatBytes(audioFile.size)
                      : 'MP3, WAV, M4A or OGG · up to 25 MB'}
                  </span>
                </span>
              </button>
              <input
                ref={fileInputRef}
                id="song-file"
                type="file"
                accept={AUDIO_ACCEPT_ATTR}
                className="hidden"
                onChange={handlePickAudio}
              />
            </Field>

            <Field
              label="Song name"
              htmlFor="song-audio-title"
              error={errors.audioTitle}
              required
            >
              <input
                id="song-audio-title"
                type="text"
                className="form-input"
                placeholder="My song"
                value={audioTitle}
                maxLength={LIMITS.MAX_SONG_TITLE_LENGTH}
                onChange={(event) => {
                  setAudioTitle(event.target.value);
                  if (errors.audioTitle)
                    setErrors((current) => ({ ...current, audioTitle: undefined }));
                }}
              />
            </Field>
          </>
        )}

        {mode === SONG_TYPE.LINK && (
          <Field label="Why this song?" htmlFor="song-note" hint="Optional">
            <textarea
              id="song-note"
              className="form-textarea"
              placeholder="The song we played on the way back from the trip."
              rows={2}
              value={note}
              onChange={(event) => setNote(event.target.value)}
            />
          </Field>
        )}

        {errors.form && (
          <p className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
            {errors.form}
          </p>
        )}
      </form>
    </Modal>
  );
}
