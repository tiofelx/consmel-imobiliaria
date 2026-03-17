'use client';

import { useEffect } from 'react';

export default function ScrollResetOnReload() {
  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }

    const navigationEntries = window.performance.getEntriesByType('navigation');
    const navigationType = navigationEntries[0]?.type;

    if (navigationType === 'reload') {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });

      const frameId = window.requestAnimationFrame(() => {
        window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      });

      return () => window.cancelAnimationFrame(frameId);
    }
  }, []);

  return null;
}
