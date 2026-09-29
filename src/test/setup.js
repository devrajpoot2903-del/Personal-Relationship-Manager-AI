import '@testing-library/jest-dom/vitest';
import 'fake-indexeddb/auto';
import { afterEach, vi } from 'vitest';

/**
 * Shared test setup. This file runs for both the jsdom UI tests and the plain
 * Node tests, so every DOM touch is guarded.
 */
const hasDom = typeof window !== 'undefined' && typeof document !== 'undefined';

if (hasDom) {
  // jsdom ships throwing "not implemented" stubs for these, so they must be
  // replaced unconditionally — the app relies on them for every preview.
  URL.createObjectURL = vi.fn(() => `blob:mock-${Math.random().toString(36).slice(2, 8)}`);
  URL.revokeObjectURL = vi.fn();

  if (!window.matchMedia) {
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
  }

  // jsdom defines IntersectionObserver but has no layout, so it never fires a
  // callback — leaving lazy content permanently hidden. Replace it with one that
  // reports elements as visible, which is what a browser does for on-screen
  // content (the gallery uses this to defer object URLs for off-screen photos).
  window.IntersectionObserver = class {
    constructor(callback) {
      this.callback = callback;
    }
    observe(element) {
      // Deliver asynchronously, exactly as a real observer would, so React sees
      // the update outside the mount effect rather than during it.
      queueMicrotask(() => {
        this.callback([{ target: element, isIntersecting: true, intersectionRatio: 1 }], this);
      });
    }
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return [];
    }
  };
  globalThis.IntersectionObserver = window.IntersectionObserver;

  window.scrollTo = vi.fn();
  if (!Element.prototype.scrollTo) Element.prototype.scrollTo = vi.fn();

  // jsdom has no media stack; make play/pause observable instead of throwing.
  window.HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined);
  window.HTMLMediaElement.prototype.pause = vi.fn();
  window.HTMLMediaElement.prototype.load = vi.fn();

  const { cleanup } = await import('@testing-library/react');
  afterEach(() => cleanup());
}
