import { useEffect, useState } from 'react';
import { ExternalLink, Music4, Pause, Play, Plus, Trash2 } from 'lucide-react';
import EmptyState from '../ui/EmptyState';
import { SONG_TYPE } from '../../lib/constants';
import { useObjectUrl } from '../../hooks/useObjectUrl';

/** Uploaded audio: a single play/pause button, no full player. */
function AudioSong({ song, onDelete }) {
  const url = useObjectUrl(song.blob);
  const [audioEl, setAudioEl] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    // Stop playback when the row disappears (e.g. the song is deleted).
    return () => {
      audioEl?.pause();
    };
  }, [audioEl]);

  const toggle = () => {
    const audio = audioEl;
    if (!audio) return;

    if (audio.paused) {
      audio.play().catch(() => setIsPlaying(false));
    } else {
      audio.pause();
    }
  };

  return (
    <li className="group flex items-center gap-3 rounded-xl border border-ink-200/70 bg-white px-3.5 py-3 transition-colors hover:border-ink-300/70">
      <button
        type="button"
        onClick={toggle}
        disabled={!url}
        aria-label={isPlaying ? `Pause ${song.title}` : `Play ${song.title}`}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-600 text-white
                   transition-colors hover:bg-brand-700 disabled:opacity-50"
      >
        {isPlaying ? (
          <Pause className="h-4 w-4" aria-hidden="true" />
        ) : (
          <Play className="ml-0.5 h-4 w-4" aria-hidden="true" />
        )}
      </button>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-ink-900">{song.title}</p>
        <p className="mt-0.5 truncate text-xs text-ink-500">
          Uploaded audio{song.size ? ` · ${(song.size / (1024 * 1024)).toFixed(1)} MB` : ''}
        </p>
      </div>

      <button
        type="button"
        className="btn-icon shrink-0 opacity-0 transition-opacity focus:opacity-100 group-hover:opacity-100 hover:text-red-600"
        aria-label={`Delete ${song.title}`}
        onClick={() => onDelete(song)}
      >
        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
      </button>

      {url && (
        <audio
          ref={setAudioEl}
          src={url}
          preload="none"
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={() => setIsPlaying(false)}
          className="hidden"
        />
      )}
    </li>
  );
}

/** External link song: opens in a new tab. */
function LinkSong({ song, onDelete }) {
  return (
    <li className="group flex items-center gap-3 rounded-xl border border-ink-200/70 bg-white px-3.5 py-3 transition-colors hover:border-ink-300/70">
      <span
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ink-100 text-ink-500"
        aria-hidden="true"
      >
        <Music4 className="h-4 w-4" />
      </span>

      <div className="min-w-0 flex-1">
        <a
          href={song.url}
          target="_blank"
          rel="noreferrer noopener"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-900 hover:text-brand-700 hover:underline"
        >
          <span className="truncate">{song.title}</span>
          <ExternalLink className="h-3.5 w-3.5 shrink-0 opacity-60" aria-hidden="true" />
        </a>

        <p className="mt-0.5 truncate text-xs text-ink-500">
          {song.source || 'Link'}
          {song.note ? ` · ${song.note}` : ''}
        </p>
      </div>

      <button
        type="button"
        className="btn-icon shrink-0 opacity-0 transition-opacity focus:opacity-100 group-hover:opacity-100 hover:text-red-600"
        aria-label={`Delete ${song.title}`}
        onClick={() => onDelete(song)}
      >
        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
    </li>
  );
}

/** Songs associated with a person — links and uploaded audio. */
export default function SongsSection({ songs = [], onAdd, onDelete }) {
  return (
    <section aria-labelledby="songs-heading">
      <div className="mb-3 flex items-center justify-between">
        <h2 id="songs-heading" className="section-title">
          <span aria-hidden="true">🎵</span>
          Songs
          {songs.length > 0 && (
            <span className="rounded-full bg-ink-100 px-2 py-0.5 text-xs font-medium text-ink-500">
              {songs.length}
            </span>
          )}
        </h2>

        <button type="button" className="btn-ghost text-brand-700" onClick={onAdd}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add song
        </button>
      </div>

      {songs.length === 0 ? (
        <div className="card">
          <EmptyState
            compact
            icon="🎵"
            title="No songs added yet"
            message="Keep the song that reminds you of them, or one you'd like to use for their story."
            action={
              <button type="button" className="btn-secondary" onClick={onAdd}>
                <Music4 className="h-4 w-4" aria-hidden="true" />
                Add song
              </button>
            }
          />
        </div>
      ) : (
        <ul className="space-y-2">
          {songs.map((song) =>
            song.type === SONG_TYPE.AUDIO ? (
              <AudioSong key={song.id} song={song} onDelete={onDelete} />
            ) : (
              <LinkSong key={song.id} song={song} onDelete={onDelete} />
            )
          )}
        </ul>
      )}
    </section>
  );
}
