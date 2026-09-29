import { CalendarPlus, Pencil, Repeat, Trash2 } from 'lucide-react';
import EmptyState from '../ui/EmptyState';
import {
  countdownLabel,
  countdownPillClass,
  formatDayMonthLong,
  formatFullDate,
  getCountdown,
  sortEventsByUpcoming,
  yearsAtNextOccurrence,
} from '../../lib/dates';
import { EVENT_TYPE, EVENT_TYPE_META } from '../../lib/constants';

function EventRow({ event, onEdit, onDelete }) {
  const meta = EVENT_TYPE_META[event.type] ?? EVENT_TYPE_META.other;
  const countdown = getCountdown(event.date, event.recurring);
  const years = yearsAtNextOccurrence(event.date, event.recurring);
  const isCustom = event.type === EVENT_TYPE.OTHER;
  const label = isCustom && event.title ? event.title : meta.label;

  return (
    <li className="group flex items-start gap-3 rounded-xl border border-ink-200/70 bg-white px-3.5 py-3 transition-colors hover:border-ink-300/70">
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-ink-100 text-base"
        aria-hidden="true"
      >
        {meta.icon}
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <p className="text-sm font-medium text-ink-900">{label}</p>
          {event.recurring ? (
            <span className="inline-flex items-center gap-1 text-[11px] text-ink-400">
              <Repeat className="h-3 w-3" aria-hidden="true" />
              every year
            </span>
          ) : (
            <span className="text-[11px] text-ink-400">one time</span>
          )}
        </div>

        <p className="mt-0.5 text-xs text-ink-500">
          {event.recurring ? formatDayMonthLong(event.date) : formatFullDate(event.date)}
          {years !== null && !isCustom ? ` · turns ${years}` : ''}
        </p>

        <span className={`mt-2 ${countdownPillClass(countdown)}`}>
          {countdownLabel(countdown)}
        </span>
      </div>

      <div className="flex shrink-0 gap-1 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
        <button
          type="button"
          className="btn-icon"
          aria-label={`Edit ${label}`}
          onClick={() => onEdit(event)}
        >
          <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
        <button
          type="button"
          className="btn-icon hover:text-red-600"
          aria-label={`Delete ${label}`}
          onClick={() => onDelete(event)}
        >
          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </div>
    </li>
  );
}

/**
 * "Important dates" — birthdays, anniversaries and custom occasions.
 */
export default function EventsSection({ events = [], onAdd, onEdit, onDelete }) {
  const sorted = sortEventsByUpcoming(events);

  return (
    <section aria-labelledby="events-heading">
      <div className="mb-3 flex items-center justify-between">
        <h2 id="events-heading" className="section-title">
          <span aria-hidden="true">📅</span>
          Important dates
          {sorted.length > 0 && (
            <span className="rounded-full bg-ink-100 px-2 py-0.5 text-xs font-medium text-ink-500">
              {sorted.length}
            </span>
          )}
        </h2>

        <button type="button" className="btn-ghost text-brand-700" onClick={onAdd}>
          <CalendarPlus className="h-4 w-4" aria-hidden="true" />
          Add date
        </button>
      </div>

      {sorted.length === 0 ? (
        <div className="card">
          <EmptyState
            compact
            icon="🎂"
            title="No dates yet"
            message="Add a birthday, anniversary or any occasion you want to remember."
            action={
              <button type="button" className="btn-secondary" onClick={onAdd}>
                <CalendarPlus className="h-4 w-4" aria-hidden="true" />
                Add your first date
              </button>
            }
          />
        </div>
      ) : (
        <ul className="space-y-2">
          {sorted.map((event) => (
            <EventRow
              key={event.id}
              event={event}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
