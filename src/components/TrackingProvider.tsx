'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

export default function TrackingProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  // Keep track of the last tracked URL to avoid duplicate events on fast renders
  const lastTrackedUrl = useRef('');

  useEffect(() => {
    const url = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : '');
    
    // Simple deduplication for strict mode / fast renders
    if (lastTrackedUrl.current === url) return;
    lastTrackedUrl.current = url;

    // Send the tracking event to the API
    const trackPageView = async () => {
      try {
        let deviceType = 'Desktop';
        if (/Mobi|Android/i.test(navigator.userAgent)) deviceType = 'Mobile';
        else if (/Tablet|iPad/i.test(navigator.userAgent)) deviceType = 'Tablet';

        const screenResolution = typeof window !== 'undefined' ? `${window.screen.width}x${window.screen.height}` : undefined;
        const language = typeof navigator !== 'undefined' ? navigator.language : undefined;
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const referrer = document.referrer;

        await fetch('/api/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'page_view',
            path: url,
            deviceType,
            screenResolution,
            language,
            timezone,
            referrer
          })
        });
      } catch (error) {
        console.error('Failed to track page view:', error);
      }
    };

    trackPageView();
  }, [pathname, searchParams]);

  return <>{children}</>;
}
