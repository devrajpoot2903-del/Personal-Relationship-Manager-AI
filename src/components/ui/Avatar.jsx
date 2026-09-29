import { User } from 'lucide-react';
import { useObjectUrl } from '../../hooks/useObjectUrl';

const SIZE_CLASS = {
  sm: 'h-9 w-9 text-xs',
  md: 'h-12 w-12 text-sm',
  lg: 'h-20 w-20 text-lg',
  xl: 'h-28 w-28 text-2xl',
  hero: 'h-32 w-32 text-3xl sm:h-40 sm:w-40',
  full: 'h-full w-full text-4xl',
};

/** First letters of the name, e.g. "Rahul Sharma" -> "RS". */
export function initialsOf(name = '') {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

/**
 * Profile photo with a warm initial-based fallback.
 *
 * @param {object} props
 * @param {string} [props.name]      used for alt text and the initials fallback
 * @param {Blob|null} [props.blob]   stored image blob from IndexedDB
 * @param {keyof typeof SIZE_CLASS} [props.size]
 * @param {boolean} [props.circular] circular by default; false for full-bleed blocks
 */
export default function Avatar({
  name = '',
  blob = null,
  size = 'md',
  circular = true,
  className = '',
}) {
  const url = useObjectUrl(blob);

  const shape = circular ? 'rounded-full ring-1 ring-ink-200/70' : 'rounded-none';
  const base = `relative flex shrink-0 items-center justify-center overflow-hidden ${shape} ${
    SIZE_CLASS[size] ?? SIZE_CLASS.md
  } ${className}`;

  if (url) {
    return (
      <div className={`${base} bg-ink-100`}>
        <img src={url} alt={name} className="h-full w-full object-cover" loading="lazy" />
      </div>
    );
  }

  if (name) {
    return (
      <div
        className={`${base} bg-brand-100 font-semibold uppercase tracking-wide text-brand-700`}
        aria-label={name}
      >
        <span aria-hidden="true">{initialsOf(name)}</span>
      </div>
    );
  }

  return (
    <div className={`${base} bg-ink-100 text-ink-400`} aria-hidden="true">
      <User className="h-1/2 w-1/2" />
    </div>
  );
}
