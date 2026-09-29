import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  countdownLabel,
  countdownPillClass,
  formatDayMonth,
  formatFullDate,
  getCountdown,
  getNextOccurrence,
  parseDateOnly,
  pickPrimaryEvent,
  sortEventsByUpcoming,
  toISODate,
  yearsAtNextOccurrence,
} from './dates';

/** Freezes "today" so countdown expectations stay deterministic. */
function setToday(isoDate) {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(`${isoDate}T09:00:00`));
}

afterEach(() => {
  vi.useRealTimers();
});

describe('parseDateOnly', () => {
  it('parses YYYY-MM-DD as a local date without timezone drift', () => {
    const date = parseDateOnly('1998-03-12');
    expect(date.getFullYear()).toBe(1998);
    expect(date.getMonth()).toBe(2); // March
    expect(date.getDate()).toBe(12);
    expect(date.getHours()).toBe(0);
  });

  it('returns null for junk input', () => {
    expect(parseDateOnly('not-a-date')).toBeNull();
    expect(parseDateOnly('')).toBeNull();
  });
});

describe('toISODate', () => {
  it('round-trips a date-only string', () => {
    expect(toISODate('2027-06-15')).toBe('2027-06-15');
  });
});

describe('getNextOccurrence', () => {
  it('uses this year when the date has not passed yet', () => {
    setToday('2026-03-01');
    const next = getNextOccurrence('1998-03-12', true);
    expect(next.getFullYear()).toBe(2026);
    expect(next.getMonth()).toBe(2);
    expect(next.getDate()).toBe(12);
  });

  it('rolls to next year once the date has passed', () => {
    setToday('2026-03-20');
    const next = getNextOccurrence('1998-03-12', true);
    expect(next.getFullYear()).toBe(2027);
  });

  it('returns the date itself for a one-off event', () => {
    setToday('2026-03-01');
    const next = getNextOccurrence('2027-06-15', false);
    expect(next.getFullYear()).toBe(2027);
    expect(next.getMonth()).toBe(5);
    expect(next.getDate()).toBe(15);
  });
});

describe('getCountdown', () => {
  it('reports Today when the occasion is today', () => {
    setToday('2026-03-12');
    const countdown = getCountdown('1998-03-12', true);
    expect(countdown.days).toBe(0);
    expect(countdown.isToday).toBe(true);
    expect(countdownLabel(countdown)).toBe('Today 🎉');
    expect(countdownPillClass(countdown)).toBe('pill-today');
  });

  it('reports Tomorrow for the day before', () => {
    setToday('2026-03-11');
    const countdown = getCountdown('1998-03-12', true);
    expect(countdown.days).toBe(1);
    expect(countdown.isTomorrow).toBe(true);
    expect(countdownLabel(countdown)).toBe('Tomorrow');
    expect(countdownPillClass(countdown)).toBe('pill-tomorrow');
  });

  it('counts the days remaining across a long gap', () => {
    setToday('2026-09-29');
    const countdown = getCountdown('1998-03-12', true);
    // 12 March 2027 is 164 days after 29 September 2026.
    expect(countdown.days).toBe(164);
    expect(countdownLabel(countdown)).toBe('164 days left');
  });

  it('marks a one-off past event as past', () => {
    setToday('2026-09-29');
    const countdown = getCountdown('2024-01-01', false);
    expect(countdown.isPast).toBe(true);
    expect(countdownPillClass(countdown)).toBe('pill-past');
    // 1 Jan 2024 -> 29 Sep 2026 is 1002 days.
    expect(countdown.days).toBe(-1002);
    expect(countdownLabel(countdown)).toBe('1002 days ago');
  });

  it('never reports a past event for a recurring date', () => {
    setToday('2026-09-29');
    const countdown = getCountdown('1998-03-12', true);
    expect(countdown.isPast).toBe(false);
    expect(countdown.days).toBeGreaterThanOrEqual(0);
  });
});

describe('yearsAtNextOccurrence', () => {
  it('works out the upcoming age/turn count', () => {
    setToday('2026-03-01');
    expect(yearsAtNextOccurrence('1998-03-12', true)).toBe(28);
  });
});

describe('sortEventsByUpcoming', () => {
  it('puts the soonest upcoming date first and past dates last', () => {
    setToday('2026-03-01');

    const sorted = sortEventsByUpcoming([
      { id: 'c', date: '2020-01-05', recurring: false }, // past one-off
      { id: 'a', date: '1990-03-12', recurring: true }, // 11 days away
      { id: 'b', date: '1990-11-20', recurring: true }, // later this year
    ]);

    expect(sorted.map((event) => event.id)).toEqual(['a', 'b', 'c']);
  });
});

describe('pickPrimaryEvent', () => {
  it('returns null when there are no events', () => {
    expect(pickPrimaryEvent([])).toBeNull();
  });

  it('selects the next occasion', () => {
    setToday('2026-03-01');
    const primary = pickPrimaryEvent([
      { id: 'b', date: '1990-11-20', recurring: true },
      { id: 'a', date: '1990-03-12', recurring: true },
    ]);
    expect(primary.id).toBe('a');
  });
});

describe('formatting', () => {
  it('formats day and month', () => {
    expect(formatDayMonth('1998-03-12')).toBe('12 Mar');
  });

  it('formats a full date with the year', () => {
    expect(formatFullDate('2027-06-15')).toBe('15 Jun 2027');
  });
});
