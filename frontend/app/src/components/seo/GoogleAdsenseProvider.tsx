import { useEffect, useState } from 'react';

export function GoogleAdsenseProvider() {
  const [injected, setInjected] = useState(false);

  useEffect(() => {
    // Requirements: Load only in production AND when explicitly enabled
    if (!import.meta.env.PROD || import.meta.env.VITE_ENABLE_ADSENSE !== 'true') {
      return;
    }

    const clientId = import.meta.env.VITE_GOOGLE_ADSENSE_CLIENT;
    if (!clientId) {
      console.warn('Google AdSense Client ID is missing in environment variables.');
      return;
    }

    // Requirements: Duplicate protection check
    const existingScript = document.head.querySelector('script[src*="adsbygoogle.js"]');
    if (existingScript || injected) {
      return;
    }

    setInjected(true);

    // Requirements: Asynchronous, SEO-safe, non-blocking insertion
    const script = document.createElement('script');
    script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${clientId}`;
    script.async = true;
    script.crossOrigin = 'anonymous';
    
    document.head.appendChild(script);
  }, [injected]);

  // Headless provider for verification purposes only. No ad UI elements are rendered.
  return null;
}
