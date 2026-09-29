import { useEffect, useState } from 'react';
import Modal from '../ui/Modal';
import Field from '../ui/Field';
import { EVENT_TYPE, EVENT_TYPE_OPTIONS, LIMITS } from '../../lib/constants';
import { todayISO } from '../../lib/dates';

/**
 * Add or edit one occasion. Birthdays and anniversaries default to repeating
 * every year; custom events let the user decide.
 */
export default function EventFormModal({ isOpen, onClose, onSubmit, event = null }) {
  const isEditing = Boolean(event);

  const [type, setType] = useState(EVENT_TYPE.BIRTHDAY);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(todayISO());
  const [recurring, setRecurring] = useState(true);
  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setType(event?.type ?? EVENT_TYPE.BIRTHDAY);
    setTitle(event?.title ?? '');
    setDate(event?.date ?? todayISO());
    setRecurring(event?.recurring ?? true);
    setErrors({});
    setIsSaving(false);
  }, [isOpen, event]);

  // Birthdays/anniversaries repeat by default; custom events ask the user.
  const handleTypeChange = (nextType) => {
    setType(nextType);
    setRecurring(nextType === EVENT_TYPE.OTHER ? recurring : true);
    if (errors.type) setErrors((current) => ({ ...current, type: undefined }));
  };

  const validate = () => {
    const next = {};

    if (!date) {
      next.date = 'Please choose a date.';
    } else if (Number.isNaN(new Date(`${date}T00:00:00`).getTime())) {
      next.date = 'That date is not valid.';
    }

    if (type === EVENT_TYPE.OTHER && !title.trim()) {
      next.title = 'Give this occasion a name.';
    }

    if (title.trim().length > LIMITS.MAX_EVENT_TITLE_LENGTH) {
      next.title = 'That name is too long.';
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (submitEvent) => {
    submitEvent.preventDefault();
    if (!validate()) return;

    setIsSaving(true);
    try {
      await onSubmit({
        type,
        title: title.trim(),
        date,
        recurring,
      });
      onClose();
    } catch (error) {
      setErrors({ form: error.message || 'Could not save this date. Please try again.' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit date' : 'Add a date'}
      size="md"
      footer={
        <>
          <button type="button" className="btn-secondary" onClick={onClose} disabled={isSaving}>
            Cancel
          </button>
          <button type="submit" form="event-form" className="btn-primary" disabled={isSaving}>
            {isSaving ? 'Saving…' : isEditing ? 'Save changes' : 'Add date'}
          </button>
        </>
      }
    >
      <form id="event-form" onSubmit={handleSubmit} className="space-y-5" noValidate>
        {/* Type */}
        <fieldset>
          <legend className="form-label">Occasion</legend>
          <div className="grid grid-cols-3 gap-2">
            {EVENT_TYPE_OPTIONS.map((option) => {
              const selected = type === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleTypeChange(option.value)}
                  aria-pressed={selected}
                  className={`flex flex-col items-center gap-1.5 rounded-xl border px-2 py-3 text-xs font-medium transition-colors ${
                    selected
                      ? 'border-brand-300 bg-brand-50 text-brand-700'
                      : 'border-ink-200 bg-white text-ink-600 hover:bg-ink-50'
                  }`}
                >
                  <span className="text-xl leading-none" aria-hidden="true">
                    {option.icon}
                  </span>
                  {option.label}
                </button>
              );
            })}
          </div>
        </fieldset>

        {/* Custom name (only meaningful for "Other") */}
        <Field
          label={type === EVENT_TYPE.OTHER ? 'Event name' : 'Event name (optional)'}
          htmlFor="event-title"
          error={errors.title}
          hint={
            type === EVENT_TYPE.OTHER
              ? 'For example: Graduation, Friendship Day, Special Day.'
              : 'Leave blank to use the occasion name.'
          }
          required={type === EVENT_TYPE.OTHER}
        >
          <input
            id="event-title"
            type="text"
            className="form-input"
            placeholder={type === EVENT_TYPE.OTHER ? 'College Graduation' : 'Optional label'}
            value={title}
            maxLength={LIMITS.MAX_EVENT_TITLE_LENGTH}
            onChange={(inputEvent) => {
              setTitle(inputEvent.target.value);
              if (errors.title) setErrors((current) => ({ ...current, title: undefined }));
            }}
          />
        </Field>

        {/* Date */}
        <Field label="Date" htmlFor="event-date" error={errors.date} required>
          <input
            id="event-date"
            type="date"
            className="form-input"
            value={date}
            onChange={(inputEvent) => {
              setDate(inputEvent.target.value);
              if (errors.date) setErrors((current) => ({ ...current, date: undefined }));
            }}
          />
        </Field>

        {/* Recurring */}
        <div className="rounded-xl border border-ink-200 bg-ink-50/60 p-3.5">
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={recurring}
              disabled={type !== EVENT_TYPE.OTHER}
              onChange={(inputEvent) => setRecurring(inputEvent.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded border-ink-300 text-brand-600 focus:ring-brand-500 disabled:cursor-not-allowed disabled:opacity-60"
            />
            <span>
              <span className="block text-sm font-medium text-ink-800">Repeats every year</span>
              <span className="mt-0.5 block text-xs text-ink-500">
                {type === EVENT_TYPE.OTHER
                  ? 'Turn this off for a one-time date such as a graduation.'
                  : 'Birthdays and anniversaries always repeat each year.'}
              </span>
            </span>
          </label>
        </div>

        {errors.form && (
          <p className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
            {errors.form}
          </p>
        )}
      </form>
    </Modal>
  );
}
