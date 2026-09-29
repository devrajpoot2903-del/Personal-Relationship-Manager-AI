import '@testing-library/jest-dom/vitest';
import 'fake-indexeddb/auto';
import { afterEach, vi } from 'vitest';

/**
 * Shared test setup. This file runs for both the jsdom UI tests and the plain
 * Node tests, so every DOM touch is guarded.
 */
const hasDom = typeof window !== 'undefined' && typeof document !== 'undefined';

if (hasDom) {
  // jsdom does not implement these; the app relies on them for media previews.
  if (!URL.createObjectURL) URL.createObjectURL = vi.fn(() => 'blob:mock-url');
  if (!URL.revokeObjectURL) URL.revokeObjectURL = vi.fn();

  if (!window.matchMedia) {
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
  }

  if (!window.IntersectionObserver) {
    window.IntersectionObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  }

  window.scrollTo = vi.fn();
  if (!Element.prototype.scrollTo) Element.prototype.scrollTo = vi.fn();

  const { cleanup } = await import('@testing-library/react');
  afterEach(() => cleanup());
}
