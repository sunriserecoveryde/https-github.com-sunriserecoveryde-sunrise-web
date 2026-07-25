import { useEffect } from 'react';

interface PageMetaProps {
  title: string;
  description: string;
  ogTitle?: string;
  ogDescription?: string;
  ogUrl?: string;
  ogImage?: string;
  twitterCard?: 'summary' | 'summary_large_image';
  canonical?: string;
}

const BASE_URL = 'https://www.growmotivational.com';
const DEFAULT_IMAGE = `${BASE_URL}/og-image.jpg`;

export function PageMeta({
  title,
  description,
  ogTitle,
  ogDescription,
  ogUrl,
  ogImage = DEFAULT_IMAGE,
  twitterCard = 'summary_large_image',
  canonical,
}: PageMetaProps) {
  useEffect(() => {
    // Title
    document.title = title;

    const setMeta = (property: string, content: string, attr = 'name') => {
      let el = document.querySelector(`meta[${attr}="${property}"]`);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, property);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    // Standard meta
    setMeta('description', description);
    setMeta('robots', 'index, follow');

    // Open Graph
    setMeta('og:type', 'website', 'property');
    setMeta('og:title', ogTitle ?? title, 'property');
    setMeta('og:description', ogDescription ?? description, 'property');
    setMeta('og:image', ogImage, 'property');
    setMeta('og:url', ogUrl ?? (BASE_URL + window.location.pathname), 'property');
    setMeta('og:site_name', 'Grow Motivational', 'property');

    // Twitter Card
    setMeta('twitter:card', twitterCard);
    setMeta('twitter:title', ogTitle ?? title);
    setMeta('twitter:description', ogDescription ?? description);
    setMeta('twitter:image', ogImage);

    // Canonical link
    let canonicalEl = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonicalEl) {
      canonicalEl = document.createElement('link');
      canonicalEl.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalEl);
    }
    canonicalEl.setAttribute('href', canonical ?? (BASE_URL + window.location.pathname));

    return () => {
      // restore default on unmount so stale meta doesn't persist during SPA navigation
      document.title = 'Grow Motivational | Education for the Journey of Recovery';
    };
  }, [title, description, ogTitle, ogDescription, ogUrl, ogImage, twitterCard, canonical]);

  return null;
}
