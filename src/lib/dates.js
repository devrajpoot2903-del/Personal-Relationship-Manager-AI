/**
 * Date helpers. Countdowns are always derived from the current date — never stored.
 */

/** Midnight today, in local time. */
export function startOfToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

/** Parses a `YYYY-MM-DD` string into a local Date (avoids UTC shifting). */
export function parseDateOnly(value) {
  if (!value) return null;
  if (value instanceof Date) {
    return new Date(value.getFullYear(), value.getMonth(), value.getDate());
  }
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(value));
  if (match) {
    const [, y, m, d] = match;
    return new Date(Number(y), Number(m) - 1, Number(d));
  }
  const fallback = new Date(value);
  if (Number.isNaN(fallback.getTime())) return null;
  return new Date(fallback.getFullYear(), fallback.getMonth(), fallback.getDate());
}

/** Today as `YYYY-MM-DD`, suitable for `<input type="date">` defaults. */
export function todayISO() {
  const d = startOfToday();
  return toISODate(d);
}

/** Date -> `YYYY-MM-DD`. */
export function toISODate(date) {
  const d = parseDateOnly(date);
  if (!d) return '';
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${month}-${day}`;
}

/**
 * Next occurrence of an event.
 * Recurring events roll forward to this year or next; one-off events keep their date.
 */
export function getNextOccurrence(dateString, recurring = true) {
  const date = parseDateOnly(dateString);
  if (!date) return null;

  const today = startOfToday();

  if (!recurring) return date;

  const thisYear = new Date(today.getFullYear(), date.getMonth(), date.getDate());
  if (thisYear.getTime() >= today.getTime()) return thisYear;

  return new Date(today.getFullYear() + 1, date.getMonth(), date.getDate());
}

/**
 * Countdown info for an event.
 * @returns {{days:number,isToday:boolean,isTomorrow:boolean,isPast:boolean,date:Date|null}}
 */
export function getCountdown(dateString, recurring = true) {
  const next = getNextOccurrence(dateString, recurring);
  if (!next) {
    return { days: null, isToday: false, isTomorrow: false, isPast: false, date: null };
  }

  const today = startOfToday();
  const days = Math.round((next.getTime() - today.getTime()) / 86400000);

  return {
    days,
    isToday: days === 0,
    isTomorrow: days === 1,
    isPast: days < 0,
    date: next,
  };
}

/** Human label for a countdown, e.g. "Today 🎉" or "164 days left". */
export function countdownLabel(countdown) {
  if (!countdown || countdown.days === null) return '';
  if (countdown.isToday) return 'Today 🎉';
  if (countdown.isTomorrow) return 'Tomorrow';
  if (countdown.isPast) {
    const ago = Math.abs(countdown.days);
    return `${ago} ${ago === 1 ? 'day' : 'days'} ago`;
  }
  return `${countdown.days} ${countdown.days === 1 ? 'day' : 'days'} left`;
}

/** Pill class name for a countdown state. */
export function countdownPillClass(countdown) {
  if (!countdown || countdown.days === null) return 'pill-normal';
  if (countdown.isPast) return 'pill-past';
  if (countdown.isToday) return 'pill-today';
  if (countdown.isTomorrow) return 'pill-tomorrow';
  if (countdown.days <= 14) return 'pill-soon';
  return 'pill-normal';
}

/** "12 Mar" */
export function formatDayMonth(value) {
  const date = parseDateOnly(value);
  if (!date) return '—';
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

/** "12 March" */
export function formatDayMonthLong(value) {
  const date = parseDateOnly(value);
  if (!date) return '—';
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' });
}

/** "12 Mar 1998" */
export function formatFullDate(value) {
  const date = parseDateOnly(value);
  if (!date) return '—';
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/** "Sunday, 12 March 2028" */
export function formatLongDate(value) {
  const date = parseDateOnly(value);
  if (!date) return '—';
  return date.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/** Relative "added 3 days ago" style label. */
export function formatRelative(isoString) {
  if (!isoString) return '';
  const then = new Date(isoString);
  if (Number.isNaN(then.getTime())) return '';

  const diffMs = Date.now() - then.getTime();
  const mins = Math.round(diffMs / 60000);

  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;

  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;

  return then.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

/** Whole years between a birth/anniversary date and its next occurrence. */
export function yearsAtNextOccurrence(dateString, recurring = true) {
  const original = parseDateOnly(dateString);
  const next = getNextOccurrence(dateString, recurring);
  if (!original || !next) return null;
  const years = next.getFullYear() - original.getFullYear();
  return years > 0 ? years : null;
}

/** Sorts events so the soonest upcoming one comes first, past ones last. */
export function sortEventsByUpcoming(events = []) {
  return [...events].sort((a, b) => {
    const ca = getCountdown(a.date, a.recurring);
    const cb = getCountdown(b.date, b.recurring);

    if (ca.isPast !== cb.isPast) return ca.isPast ? 1 : -1;
    return (ca.days ?? 0) - (cb.days ?? 0);
  });
}

/** The single most relevant event for a person, or null. */
export function pickPrimaryEvent(events = []) {
  const sorted = sortEventsByUpcoming(events);
  return sorted[0] ?? null;
}
