import { Link } from 'react-router-dom';
import { CalendarDays, Clock3, MoreVertical, Pencil, Trash2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import Avatar from '../ui/Avatar';
import {
  countdownLabel,
  countdownPillClass,
  formatDayMonthLong,
  getCountdown,
  pickPrimaryEvent,
  yearsAtNextOccurrence,
} from '../../lib/dates';
import { EVENT_TYPE_META } from '../../lib/constants';

/**
 * The person card: photo first, then name, relationship and the next occasion
 * with a live countdown. Deliberately not a contact-list row.
 */
export default function PersonCard({ person, onEdit, onDelete, index = 0 }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const event = pickPrimaryEvent(person.events || []);
  const countdown = event ? getCountdown(event.date, event.recurring) : null;
  const meta = event ? EVENT_TYPE_META[event.type] ?? EVENT_TYPE_META.other : null;
  const years = event ? yearsAtNextOccurrence(event.date, event.recurring) : null;

  // Close the overflow menu on outside click / Escape.
  useEffect(() => {
    if (!menuOpen) return undefined;

    const onPointerDown = (e) => {
      if (!menuRef.current?.contains(e.target)) setMenuOpen(false);
    };
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [menuOpen]);

  return (
    <article
      className="card-interactive animate-rise group relative overflow-hidden"
      style={{ animationDelay: `${Math.min(index, 8) * 35}ms` }}
    >
      <Link to={`/person/${person.id}`} className="block focus:outline-none">
        {/* Photo */}
        <div className="relative aspect-[4/3] overflow-hidden">
          <Avatar
            name={person.name}
            blob={person.profileImage?.blob}
            size="full"
            circular={false}
            className="transition-transform duration-300 group-hover:scale-[1.03]"
          />

          {countdown?.isToday && (
            <span className="pointer-events-none absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-brand-700 shadow-sm">
              Today 🎉
            </span>
          )}
        </div>

        {/* Details */}
        <div className="px-4 pb-4 pt-3.5">
          <h3 className="truncate text-[15px] font-semibold leading-tight text-ink-900">
            {person.name}
          </h3>

          <p className="mt-0.5 truncate text-[13px] text-ink-500">
            {person.relationship}
            {person.designation ? ` · ${person.designation}` : ''}
          </p>

          {event ? (
            <div className="mt-3 border-t border-ink-100 pt-3">
              <div className="flex items-center gap-1.5 text-[13px] font-medium text-ink-700">
                <span aria-hidden="true">{meta.icon}</span>
                <span className="truncate">
                  {event.type === 'other' && event.title ? event.title : meta.label}
                </span>
                {years !== null && event.type !== 'other' && (
                  <span className="text-ink-400">· {years}</span>
                )}
              </div>

              <div className="mt-2 flex items-center justify-between gap-2">
                <span className="flex items-center gap-1 text-xs text-ink-500">
                  <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
                  {formatDayMonthLong(event.date)}
                  {!event.recurring && <span className="text-ink-400">· once</span>}
                </span>
              </div>

              <span
                className={`mt-2 ${countdownPillClass(countdown)}`}
                title={countdownLabel(countdown)}
              >
                <Clock3 className="h-3 w-3" aria-hidden="true" />
                {countdownLabel(countdown)}
              </span>
            </div>
          ) : (
            <div className="mt-3 border-t border-ink-100 pt-3">
              <p className="text-xs text-ink-400">No dates added yet</p>
            </div>
          )}
        </div>
      </Link>

      {/* Overflow menu */}
      <div ref={menuRef} className="absolute right-2.5 top-2.5">
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            setMenuOpen((open) => !open);
          }}
          aria-label={`More options for ${person.name}`}
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          className="rounded-lg bg-white/90 p-1.5 text-ink-600 opacity-0 shadow-sm backdrop-blur transition-opacity
                     focus:opacity-100 group-hover:opacity-100 hover:bg-white"
        >
          <MoreVertical className="h-4 w-4" aria-hidden="true" />
        </button>

        {menuOpen && (
          <div
            role="menu"
            className="animate-scale-in absolute right-0 top-full z-20 mt-1 w-40 overflow-hidden rounded-xl border border-ink-200/70 bg-white py-1 shadow-[var(--shadow-lift)]"
          >
            <Link
              to={`/person/${person.id}`}
              role="menuitem"
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-ink-700 hover:bg-ink-50"
              onClick={() => setMenuOpen(false)}
            >
              <span className="h-4 w-4" aria-hidden="true">👤</span>
              Open profile
            </Link>

            <button
              type="button"
              role="menuitem"
              onClick={(e) => {
                e.preventDefault();
                setMenuOpen(false);
                onEdit?.(person);
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-ink-700 hover:bg-ink-50"
            >
              <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
              Edit person
            </button>

            <button
              type="button"
              role="menuitem"
              onClick={(e) => {
                e.preventDefault();
                setMenuOpen(false);
                onDelete?.(person);
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
              Delete person
            </button>
          </div>
        )}
      </div>
    </article>
  );
}
