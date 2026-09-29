import { Link } from 'react-router-dom';
import { ArrowLeft, AtSign, ExternalLink, Pencil, Trash2 } from 'lucide-react';
import Avatar from '../ui/Avatar';
import {
  countdownLabel,
  countdownPillClass,
  formatDayMonthLong,
  getCountdown,
  pickPrimaryEvent,
  yearsAtNextOccurrence,
} from '../../lib/dates';
import { EVENT_TYPE, EVENT_TYPE_META } from '../../lib/constants';

/** Turns "@handle" or "instagram.com/x" into a usable link. */
function instagramHref(value) {
  const trimmed = String(value || '').trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith('@')) return `https://instagram.com/${trimmed.slice(1)}`;
  if (trimmed.includes('instagram.com')) return `https://${trimmed.replace(/^\/+/, '')}`;
  return `https://instagram.com/${trimmed}`;
}

/**
 * Profile hero: large photo, name, relationship, the next occasion and its
 * countdown, plus edit/delete actions.
 */
export default function ProfileHero({ person, eventCount, onEdit, onDelete }) {
  const event = pickPrimaryEvent(person.events || []);
  const countdown = event ? getCountdown(event.date, event.recurring) : null;
  const meta = event ? EVENT_TYPE_META[event.type] ?? EVENT_TYPE_META.other : null;
  const years = event ? yearsAtNextOccurrence(event.date, event.recurring) : null;
  const instagram = instagramHref(person.instagram);

  return (
    <div className="profile-hero border-b border-ink-200/70">
      <div className="mx-auto max-w-4xl px-4 pb-7 pt-5 sm:px-6">
        <Link
          to="/"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-ink-500 transition-colors hover:text-ink-800"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          All people
        </Link>

        <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
          <Avatar name={person.name} blob={person.profileImage?.blob} size="hero" />

          <div className="min-w-0 flex-1 text-center sm:text-left">
            <h1 className="text-2xl font-semibold tracking-tight text-ink-900 sm:text-[28px]">
              {person.name}
            </h1>

            <p className="mt-1 text-[15px] text-ink-600">
              {person.relationship}
              {person.designation && (
                <span className="text-ink-400"> · {person.designation}</span>
              )}
            </p>

            {/* Social / contact */}
            {instagram && (
              <a
                href={instagram}
                target="_blank"
                rel="noreferrer noopener"
                className="mt-2.5 inline-flex items-center gap-1.5 rounded-full border border-ink-200 bg-white px-3 py-1 text-xs font-medium text-ink-600 transition-colors hover:border-brand-300 hover:text-brand-700"
              >
                <AtSign className="h-3.5 w-3.5" aria-hidden="true" />
                {person.instagram}
                <ExternalLink className="h-3 w-3 opacity-60" aria-hidden="true" />
              </a>
            )}

            {/* Next occasion */}
            {event ? (
              <div className="mt-5 inline-flex flex-col items-center gap-2 rounded-2xl border border-ink-200/70 bg-white px-4 py-3 shadow-[var(--shadow-card)] sm:items-start">
                <span className="flex items-center gap-2 text-sm font-medium text-ink-700">
                  <span className="text-lg" aria-hidden="true">
                    {meta.icon}
                  </span>
                  {event.type === EVENT_TYPE.OTHER && event.title ? event.title : meta.label}
                  {years !== null && event.type !== EVENT_TYPE.OTHER && (
                    <span className="text-ink-400">· turns {years}</span>
                  )}
                </span>

                <span className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                  <span className="text-sm text-ink-500">{formatDayMonthLong(event.date)}</span>
                  <span className={countdownPillClass(countdown)}>
                    {countdownLabel(countdown)}
                  </span>
                  {eventCount > 1 && (
                    <span className="text-xs text-ink-400">
                      {eventCount} dates tracked
                    </span>
                  )}
                </span>
              </div>
            ) : (
              <p className="mt-5 text-sm text-ink-400">
                No important dates yet — add a birthday or anniversary below.
              </p>
            )}

            {/* Actions */}
            <div className="mt-5 flex flex-wrap justify-center gap-2 sm:justify-start">
              <button type="button" className="btn-secondary" onClick={onEdit}>
                <Pencil className="h-4 w-4" aria-hidden="true" />
                Edit person
              </button>
              <button
                type="button"
                className="btn-ghost text-red-600 hover:bg-red-50"
                onClick={onDelete}
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
                Delete person
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
