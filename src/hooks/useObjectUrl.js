import { useEffect, useState } from 'react';
import { createObjectUrl, revokeObjectUrl } from '../lib/files';

/**
 * Turns a Blob into an object URL and revokes it when the blob changes or the
 * component unmounts. Keeps memory tidy even with many gallery images.
 *
 * @param {Blob|null|undefined} blob
 * @param {{ enabled?: boolean }} [options] pass `enabled: false` to lazy-load
 * @returns {string|null} object URL, or null when unavailable/disabled
 */
export function useObjectUrl(blob, { enabled = true } = {}) {
  const [url, setUrl] = useState(null);

  useEffect(() => {
    if (!blob || !enabled) {
      setUrl(null);
      return undefined;
    }

    const nextUrl = createObjectUrl(blob);
    setUrl(nextUrl);

    return () => revokeObjectUrl(nextUrl);
  }, [blob, enabled]);

  return url;
}

export default useObjectUrl;
