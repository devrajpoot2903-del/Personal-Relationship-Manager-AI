/**
 * File validation and object-URL helpers.
 *
 * Binary data (images, audio) is stored as a Blob inside IndexedDB — never as a
 * Base64 string, and never in localStorage.
 */

import {
  ACCEPTED_AUDIO_TYPES,
  ACCEPTED_IMAGE_TYPES,
  LIMITS,
} from './constants';

/** Throws a friendly Error when the image is not usable. */
export function validateImageFile(file) {
  if (!file) throw new Error('No file selected.');

  const isImage = file.type
    ? ACCEPTED_IMAGE_TYPES.includes(file.type)
    : /\.(jpe?g|png|webp)$/i.test(file.name);

  if (!isImage) {
    throw new Error(`"${file.name}" is not a supported image. Use JPG, PNG or WebP.`);
  }

  if (file.size > LIMITS.MAX_IMAGE_BYTES) {
    throw new Error(`"${file.name}" is larger than 10 MB.`);
  }

  return true;
}

/** Throws a friendly Error when the audio file is not usable. */
export function validateAudioFile(file) {
  if (!file) throw new Error('No file selected.');

  const isAudio = file.type
    ? ACCEPTED_AUDIO_TYPES.includes(file.type) || file.type.startsWith('audio/')
    : /\.(mp3|wav|m4a|ogg)$/i.test(file.name);

  if (!isAudio) {
    throw new Error(`"${file.name}" is not a supported audio file. Use MP3, WAV, M4A or OGG.`);
  }

  if (file.size > LIMITS.MAX_AUDIO_BYTES) {
    throw new Error(`"${file.name}" is larger than 25 MB.`);
  }

  return true;
}

/**
 * Normalises a File into a plain record we can persist.
 * IndexedDB can store Blob/File directly, so no Base64 conversion happens here.
 */
export function fileToRecord(file) {
  const blob = file instanceof Blob ? file : new Blob([file]);
  return {
    blob,
    name: file.name || 'untitled',
    mimeType: file.type || blob.type || 'application/octet-stream',
    size: blob.size,
  };
}

/** Creates an object URL for a stored blob. */
export function createObjectUrl(blob) {
  if (!blob) return null;
  return URL.createObjectURL(blob);
}

/** Revokes an object URL, ignoring empty values. */
export function revokeObjectUrl(url) {
  if (!url) return;
  try {
    URL.revokeObjectURL(url);
  } catch {
    /* already revoked — nothing to do */
  }
}

/** Validates a user-supplied URL (http/https only). */
export function validateHttpUrl(value) {
  const trimmed = String(value || '').trim();
  if (!trimmed) throw new Error('Please enter a link.');

  let parsed;
  try {
    parsed = new URL(trimmed);
  } catch {
    throw new Error('That link does not look valid. Include https:// at the start.');
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error('Only http and https links are supported.');
  }

  return parsed.toString();
}

/** Picks a friendly label for a song link's source, e.g. "YouTube". */
export function detectLinkSource(url) {
  try {
    const host = new URL(url).hostname.replace(/^www\./, '');
    if (host.includes('youtube') || host.includes('youtu.be')) return 'YouTube';
    if (host.includes('spotify')) return 'Spotify';
    if (host.includes('soundcloud')) return 'SoundCloud';
    if (host.includes('apple')) return 'Apple Music';
    if (host.includes('jiosaavn')) return 'JioSaavn';
    if (host.includes('gaana')) return 'Gaana';
    return host;
  } catch {
    return 'Link';
  }
}

/** Derives a display title from a filename: "my_song_v2.mp3" -> "my song v2". */
export function titleFromFilename(filename = '') {
  return filename
    .replace(/\.[^.]+$/, '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
