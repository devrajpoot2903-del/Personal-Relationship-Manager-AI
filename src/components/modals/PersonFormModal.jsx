import { useEffect, useMemo, useRef, useState } from 'react';
import { ImagePlus, Trash2 } from 'lucide-react';
import Modal from '../ui/Modal';
import Field from '../ui/Field';
import Avatar from '../ui/Avatar';
import { IMAGE_ACCEPT_ATTR, LIMITS, RELATIONSHIP_SUGGESTIONS } from '../../lib/constants';
import { fileToRecord, validateImageFile } from '../../lib/files';

const EMPTY = {
  name: '',
  relationship: '',
  designation: '',
  instagram: '',
  profileImage: null,
};

/**
 * Add or edit a person. Used by both the dashboard and the profile page; when
 * `person` is provided the same record is updated rather than duplicated.
 */
export default function PersonFormModal({ isOpen, onClose, onSubmit, person = null }) {
  const isEditing = Boolean(person);
  const fileInputRef = useRef(null);

  const [form, setForm] = useState(EMPTY);
  const [pendingImage, setPendingImage] = useState(null); // File chosen, not yet saved
  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);


  // Reset the form whenever the dialog opens.
  useEffect(() => {
    if (!isOpen) return;
    setForm({
      name: person?.name ?? '',
      relationship: person?.relationship ?? '',
      designation: person?.designation ?? '',
      instagram: person?.instagram ?? '',
      profileImage: person?.profileImage ?? null,
    });
    setPendingImage(null);
    setErrors({});
    setIsSaving(false);
  }, [isOpen, person]);

  const suggestions = useMemo(() => RELATIONSHIP_SUGGESTIONS, []);

  const update = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
    if (errors[key]) setErrors((current) => ({ ...current, [key]: undefined }));
  };

  const handlePickImage = (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    try {
      validateImageFile(file);
      setPendingImage(file);
      setErrors((current) => ({ ...current, profileImage: undefined }));
    } catch (error) {
      setErrors((current) => ({ ...current, profileImage: error.message }));
    }
  };

  const handleRemoveImage = () => {
    setPendingImage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    update('profileImage', null);
  };

  const validate = () => {
    const next = {};

    const name = form.name.trim();
    if (!name) next.name = 'Please enter a name.';
    else if (name.length > LIMITS.MAX_NAME_LENGTH) next.name = 'That name is too long.';

    const relationship = form.relationship.trim();
    if (!relationship) next.relationship = 'Please add a relationship.';
    else if (relationship.length > LIMITS.MAX_RELATIONSHIP_LENGTH)
      next.relationship = 'That relationship is too long.';

    if (form.designation.trim().length > LIMITS.MAX_DESIGNATION_LENGTH)
      next.designation = 'That designation is too long.';

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) return;

    setIsSaving(true);
    try {
      // Only rebuild profileImage when a new file was chosen or it was cleared.
      let profileImage = form.profileImage;
      if (pendingImage) {
        profileImage = { ...fileToRecord(pendingImage), addedAt: new Date().toISOString() };
      }

      await onSubmit({
        name: form.name.trim(),
        relationship: form.relationship.trim(),
        designation: form.designation.trim(),
        instagram: form.instagram.trim(),
        profileImage: profileImage ?? null,
      });

      onClose();
    } catch (error) {
      setErrors({ form: error.message || 'Could not save this person. Please try again.' });
    } finally {
      setIsSaving(false);
    }
  };

  const previewBlob = pendingImage ?? (form.profileImage?.blob ?? null);
  const hasImage = Boolean(previewBlob);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? `Edit ${person?.name}` : 'Add a person'}
      description={
        isEditing ? 'Update their details — memories stay untouched.' : 'Add someone you want to remember.'
      }
      size="lg"
      footer={
        <>
          <button type="button" className="btn-secondary" onClick={onClose} disabled={isSaving}>
            Cancel
          </button>
          <button type="submit" form="person-form" className="btn-primary" disabled={isSaving}>
            {isSaving ? 'Saving…' : isEditing ? 'Save changes' : 'Add person'}
          </button>
        </>
      }
    >
      <form id="person-form" onSubmit={handleSubmit} className="space-y-5" noValidate>
        {/* Profile picture */}
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-start">
          <Avatar
            name={form.name}
            blob={previewBlob}
            size="lg"
            className={hasImage ? '' : 'bg-ink-100'}
          />

          <div className="flex-1 text-center sm:text-left">
            <p className="form-label sm:mb-2">Profile picture</p>
            <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => fileInputRef.current?.click()}
              >
                <ImagePlus className="h-4 w-4" aria-hidden="true" />
                {hasImage ? 'Change photo' : 'Upload photo'}
              </button>

              {hasImage && (
                <button type="button" className="btn-ghost text-red-600" onClick={handleRemoveImage}>
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                  Remove
                </button>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept={IMAGE_ACCEPT_ATTR}
              className="hidden"
              onChange={handlePickImage}
            />

            <p className="mt-2 text-xs text-ink-500">
              JPG, PNG or WebP · up to 10 MB. Stored on this device only.
            </p>
            {errors.profileImage && <p className="form-error">{errors.profileImage}</p>}
          </div>
        </div>

        {/* Name */}
        <Field label="Name" htmlFor="person-name" error={errors.name} required>
          <input
            id="person-name"
            type="text"
            className="form-input"
            placeholder="Rahul Sharma"
            value={form.name}
            maxLength={LIMITS.MAX_NAME_LENGTH}
            onChange={(event) => update('name', event.target.value)}
          />
        </Field>

        {/* Relationship — free text with soft suggestions */}
        <Field
          label="Relationship"
          htmlFor="person-relationship"
          error={errors.relationship}
          hint="Pick a suggestion or write your own — “Rakhi Sister”, “Neighbour”, anything."
          required
        >
          <input
            id="person-relationship"
            type="text"
            list="relationship-suggestions"
            className="form-input"
            placeholder="College Friend"
            value={form.relationship}
            maxLength={LIMITS.MAX_RELATIONSHIP_LENGTH}
            onChange={(event) => update('relationship', event.target.value)}
          />
          <datalist id="relationship-suggestions">
            {suggestions.map((option) => (
              <option key={option} value={option} />
            ))}
          </datalist>
        </Field>

        {/* Quick-pick chips */}
        <div className="-mt-2 flex flex-wrap gap-1.5">
          {suggestions.slice(0, 7).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => update('relationship', option)}
              className={`rounded-full border px-2.5 py-1 text-xs transition-colors ${
                form.relationship === option
                  ? 'border-brand-300 bg-brand-50 text-brand-700'
                  : 'border-ink-200 bg-white text-ink-600 hover:bg-ink-50'
              }`}
            >
              {option}
            </button>
          ))}
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          {/* Designation */}
          <Field
            label="Designation / title"
            htmlFor="person-designation"
            error={errors.designation}
            hint="Optional"
          >
            <input
              id="person-designation"
              type="text"
              className="form-input"
              placeholder="Frontend Developer"
              value={form.designation}
              maxLength={LIMITS.MAX_DESIGNATION_LENGTH}
              onChange={(event) => update('designation', event.target.value)}
            />
          </Field>

          {/* Instagram */}
          <Field
            label="Instagram"
            htmlFor="person-instagram"
            hint="Optional — @handle or full link"
          >
            <input
              id="person-instagram"
              type="text"
              className="form-input"
              placeholder="@rahul"
              value={form.instagram}
              maxLength={LIMITS.MAX_LINK_LENGTH}
              onChange={(event) => update('instagram', event.target.value)}
            />
          </Field>
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
