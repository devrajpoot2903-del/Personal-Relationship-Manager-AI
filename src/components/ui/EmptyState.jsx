/**
 * Shared empty-state block: an icon, a title, a short line and an optional action.
 */
export default function EmptyState({
  icon = '✦',
  title,
  message,
  action = null,
  compact = false,
  className = '',
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center ${
        compact ? 'px-4 py-8' : 'px-6 py-14'
      } ${className}`}
    >
      <div
        className={`mb-4 flex items-center justify-center rounded-2xl bg-ink-100/80 text-2xl ${
          compact ? 'h-11 w-11' : 'h-14 w-14'
        }`}
        aria-hidden="true"
      >
        {icon}
      </div>

      {title && (
        <h3 className={`font-medium text-ink-800 ${compact ? 'text-sm' : 'text-base'}`}>
          {title}
        </h3>
      )}

      {message && (
        <p className={`mt-1.5 max-w-sm leading-relaxed text-ink-500 ${compact ? 'text-xs' : 'text-sm'}`}>
          {message}
        </p>
      )}

      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
