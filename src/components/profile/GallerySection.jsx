import { useEffect, useRef, useState } from 'react';
import { ImagePlus, Loader2, Trash2, X, ChevronLeft, ChevronRight } from 'lucide-react';
import EmptyState from '../ui/EmptyState';
import { IMAGE_ACCEPT_ATTR } from '../../lib/constants';
import { useObjectUrl } from '../../hooks/useObjectUrl';

/** A single thumbnail. The blob URL is created lazily as it scrolls into view. */
function GalleryTile({ image, index, onOpen, onDelete }) {
  const containerRef = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = containerRef.current;
    if (!node || typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const url = useObjectUrl(image.blob, { enabled: visible });

  return (
    <div
      ref={containerRef}
      className="group relative aspect-square overflow-hidden rounded-xl bg-ink-100 ring-1 ring-ink-200/70"
    >
      {url ? (
        <button
          type="button"
          onClick={() => onOpen(index)}
          className="block h-full w-full"
          aria-label={`Open ${image.name || 'photo'}`}
        >
          <img
            src={url}
            alt={image.name || 'Memory'}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
          />
        </button>
      ) : (
        <div className="flex h-full w-full items-center justify-center text-ink-300">
          <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
        </div>
      )}

      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onDelete(image);
        }}
        aria-label={`Delete ${image.name || 'photo'}`}
        className="absolute right-2 top-2 rounded-lg bg-ink-900/60 p-1.5 text-white opacity-0 backdrop-blur-sm
                   transition-opacity focus:opacity-100 group-hover:opacity-100 hover:bg-red-600"
      >
        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
    </div>
  );
}

/** Full-screen viewer with keyboard navigation. */
function Lightbox({ images, index, onClose, onNavigate }) {
  const image = images[index];
  const url = useObjectUrl(image?.blob);

  useEffect(() => {
    if (!image) return undefined;

    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
      if (event.key === 'ArrowRight') onNavigate((index + 1) % images.length);
      if (event.key === 'ArrowLeft') onNavigate((index - 1 + images.length) % images.length);
    };

    document.addEventListener('keydown', onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [image, index, images.length, onClose, onNavigate]);

  if (!image) return null;

  return (
    <div
      className="animate-fade-in fixed inset-0 z-[70] flex flex-col bg-ink-900/95"
      role="dialog"
      aria-modal="true"
      aria-label="Photo viewer"
    >
      <div className="flex items-center justify-between px-4 py-3 text-white">
        <p className="truncate text-sm text-white/80">
          {image.name} {images.length > 1 && `· ${index + 1} of ${images.length}`}
        </p>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close viewer"
          className="rounded-lg p-2 text-white/80 transition-colors hover:bg-white/10 hover:text-white"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>

      <div className="relative flex flex-1 items-center justify-center overflow-hidden px-4 pb-6">
        {images.length > 1 && (
          <button
            type="button"
            onClick={() => onNavigate((index - 1 + images.length) % images.length)}
            aria-label="Previous photo"
            className="absolute left-3 z-10 rounded-full bg-white/10 p-2.5 text-white backdrop-blur transition-colors hover:bg-white/20"
          >
            <ChevronLeft className="h-5 w-5" aria-hidden="true" />
          </button>
        )}

        {url && (
          <img
            src={url}
            alt={image.name || 'Memory'}
            className="max-h-full max-w-full rounded-xl object-contain"
          />
        )}

        {images.length > 1 && (
          <button
            type="button"
            onClick={() => onNavigate((index + 1) % images.length)}
            aria-label="Next photo"
            className="absolute right-3 z-10 rounded-full bg-white/10 p-2.5 text-white backdrop-blur transition-colors hover:bg-white/20"
          >
            <ChevronRight className="h-5 w-5" aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  );
}

/** Photo gallery with multi-upload, lazy thumbnails and a lightbox. */
export default function GallerySection({ images = [], onUpload, onDelete }) {
  const inputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [lightboxIndex, setLightboxIndex] = useState(null);

  const handleFiles = async (event) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = '';
    if (!files.length) return;

    setIsUploading(true);
    setUploadError('');
    try {
      const { saved, rejected } = await onUpload(files);
      if (rejected.length) {
        setUploadError(
          rejected.length === 1
            ? rejected[0]
            : `${rejected.length} files were skipped: ${rejected[0]}`
        );
      }
      if (!saved.length && !rejected.length) {
        setUploadError('No photos were added.');
      }
    } catch {
      setUploadError('Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <section aria-labelledby="gallery-heading">
      <div className="mb-3 flex items-center justify-between">
        <h2 id="gallery-heading" className="section-title">
          <span aria-hidden="true">🖼️</span>
          Memories
          {images.length > 0 && (
            <span className="rounded-full bg-ink-100 px-2 py-0.5 text-xs font-medium text-ink-500">
              {images.length}
            </span>
          )}
        </h2>

        <button
          type="button"
          className="btn-ghost text-brand-700"
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
        >
          {isUploading ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <ImagePlus className="h-4 w-4" aria-hidden="true" />
          )}
          {isUploading ? 'Adding…' : 'Add photos'}
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={IMAGE_ACCEPT_ATTR}
        multiple
        className="hidden"
        onChange={handleFiles}
      />

      {uploadError && (
        <p className="mb-3 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-sm text-amber-800">
          {uploadError}
        </p>
      )}

      {images.length === 0 ? (
        <div className="card">
          <EmptyState
            compact
            icon="🖼️"
            title="No memories added yet"
            message="Photos together, birthdays, trips — anything you'd like to keep close."
            action={
              <button
                type="button"
                className="btn-secondary"
                onClick={() => inputRef.current?.click()}
              >
                <ImagePlus className="h-4 w-4" aria-hidden="true" />
                Add photos
              </button>
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
          {images.map((image, index) => (
            <GalleryTile
              key={image.id}
              image={image}
              index={index}
              onOpen={setLightboxIndex}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}

      {lightboxIndex !== null && (
        <Lightbox
          images={images}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onNavigate={setLightboxIndex}
        />
      )}
    </section>
  );
}
