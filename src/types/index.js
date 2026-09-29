/**
 * Type definitions and constants for Personal Relationship Manager
 */

// ==================== ENUMS & CONSTANTS ====================

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

export const EVENT_TYPES = {
  BIRTHDAY: 'birthday',
  ANNIVERSARY: 'anniversary',
  OTHER: 'other'
};

export const EVENT_TYPE_OPTIONS = [
  { value: EVENT_TYPES.BIRTHDAY, label: '🎂 Birthday', icon: '🎂' },
  { value: EVENT_TYPES.ANNIVERSARY, label: '💍 Anniversary', icon: '💍' },
  { value: EVENT_TYPES.OTHER, label: '📅 Other', icon: '📅' }
];

export const SONG_TYPES = {
  URL: 'url',
  UPLOAD: 'upload'
};

export const FILE_TYPES = {
  IMAGE: 'image',
  AUDIO: 'audio'
};

// ==================== VALIDATION ====================

export const VALIDATION = {
  MAX_IMAGE_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_AUDIO_SIZE: 20 * 1024 * 1024, // 20MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  ALLOWED_AUDIO_TYPES: ['audio/mpeg', 'audio/wav', 'audio/mp4', 'audio/ogg', 'audio/m4a', 'audio/x-m4a'],
  MAX_NAME_LENGTH: 100,
  MAX_NOTE_LENGTH: 2000,
  MAX_EVENT_TITLE_LENGTH: 100,
  MAX_SONG_TITLE_LENGTH: 100,
  MAX_SONG_URL_LENGTH: 500,
  MAX_SOCIAL_LINK_LENGTH: 200
};

// ==================== HELPER FUNCTIONS ====================

export function formatDate(dateString) {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

export function formatFullDate(dateString) {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

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
      return { days: -1, isToday: false, isTomorrow: false, isPast: true, date: nextOccurrence };
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

export function getCountdownLabel(countdown) {
  if (countdown.isPast) return 'Past';
  if (countdown.isToday) return 'Today 🎉';
  if (countdown.isTomorrow) return 'Tomorrow';
  return `${countdown.days} days left`;
}

export function getCountdownClass(countdown) {
  if (countdown.isPast) return 'countdown-normal';
  if (countdown.isToday) return 'countdown-today';
  if (countdown.isTomorrow) return 'countdown-tomorrow';
  if (countdown.days <= 7) return 'countdown-soon';
  return 'countdown-normal';
}

export function generateId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function validateImageFile(file) {
  if (!VALIDATION.ALLOWED_IMAGE_TYPES.includes(file.type)) {
    throw new Error('Invalid file type. Please upload JPG, PNG, or WebP images.');
  }
  if (file.size > VALIDATION.MAX_IMAGE_SIZE) {
    throw new Error('File too large. Maximum size is 10MB.');
  }
  return true;
}

export function validateAudioFile(file) {
  if (!VALIDATION.ALLOWED_AUDIO_TYPES.includes(file.type)) {
    throw new Error('Invalid file type. Please upload MP3, WAV, M4A, or OGG audio files.');
  }
  if (file.size > VALIDATION.MAX_AUDIO_SIZE) {
    throw new Error('File too large. Maximum size is 20MB.');
  }
  return true;
}

export function fileToBlob(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(new Blob([reader.result], { type: file.type }));
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file);
  });
}

export function createObjectURL(blob) {
  return URL.createObjectURL(blob);
}

export function revokeObjectURL(url) {
  if (url) URL.revokeObjectURL(url);
}