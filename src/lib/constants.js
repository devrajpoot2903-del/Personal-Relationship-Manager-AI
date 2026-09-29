/**
 * Shared constants and option lists.
 */

/** Suggested relationships — the user is always free to type a custom one. */
export const RELATIONSHIP_SUGGESTIONS = [
  'Family',
  'Parent',
  'Sibling',
  'Relative',
  'Friend',
  'School Friend',
  'College Friend',
  'Classmate',
  'Cousin',
  'Other',
];

/** Built-in event types. Custom events use type "other" with a custom name. */
export const EVENT_TYPE = {
  BIRTHDAY: 'birthday',
  ANNIVERSARY: 'anniversary',
  OTHER: 'other',
};

export const EVENT_TYPE_OPTIONS = [
  { value: EVENT_TYPE.BIRTHDAY, label: 'Birthday', icon: '🎂' },
  { value: EVENT_TYPE.ANNIVERSARY, label: 'Anniversary', icon: '💍' },
  { value: EVENT_TYPE.OTHER, label: 'Other', icon: '📅' },
];

export const EVENT_TYPE_META = {
  [EVENT_TYPE.BIRTHDAY]: { label: 'Birthday', icon: '🎂' },
  [EVENT_TYPE.ANNIVERSARY]: { label: 'Anniversary', icon: '💍' },
  [EVENT_TYPE.OTHER]: { label: 'Other', icon: '📅' },
};

/** Song source types. */
export const SONG_TYPE = {
  LINK: 'link',
  AUDIO: 'audio',
};

/** Upload limits and accepted MIME types. */
export const LIMITS = {
  MAX_IMAGE_BYTES: 10 * 1024 * 1024, // 10 MB
  MAX_AUDIO_BYTES: 25 * 1024 * 1024, // 25 MB
  MAX_NAME_LENGTH: 80,
  MAX_RELATIONSHIP_LENGTH: 48,
  MAX_DESIGNATION_LENGTH: 80,
  MAX_NOTE_LENGTH: 4000,
  MAX_EVENT_TITLE_LENGTH: 80,
  MAX_SONG_TITLE_LENGTH: 120,
  MAX_LINK_LENGTH: 600,
};

export const ACCEPTED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
];

export const ACCEPTED_AUDIO_TYPES = [
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/x-wav',
  'audio/mp4',
  'audio/m4a',
  'audio/x-m4a',
  'audio/ogg',
  'audio/webm',
];

export const IMAGE_ACCEPT_ATTR = '.jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp';
export const AUDIO_ACCEPT_ATTR = '.mp3,.wav,.m4a,.ogg,audio/*';

/** Formats a byte count for display, e.g. "2.4 MB". */
export function formatBytes(bytes) {
  if (!bytes || bytes < 1024) return `${bytes || 0} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
