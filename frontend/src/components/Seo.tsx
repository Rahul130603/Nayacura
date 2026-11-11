import { useEffect } from 'react';

type SeoProps = {
  title: string;
  description: string;
  path?: string;
  type?: string;
  noIndex?: boolean;
  jsonLd?: Record<string, unknown>;
};

const SITE = 'Nayacura';
const BASE = typeof window !== 'undefined' ? window.location.origin : 'https://nayacura.example';

function setMeta(attr: 'name' | 'property', key: string, value: string) {
  let element = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attr, key);
    document.head.appendChild(element);
  }
  element.setAttribute('content', value);
}

export function Seo({ title, description, path, type = 'website', noIndex, jsonLd }: SeoProps) {
  useEffect(() => {
    const fullTitle = title.includes(SITE) ? title : `${title} — ${SITE}`;
    document.title = fullTitle;
    setMeta('name', 'description', description);
    setMeta('property', 'og:title', fullTitle);
    setMeta('property', 'og:description', description);
    setMeta('property', 'og:type', type);
    setMeta('property', 'og:url', `${BASE}${path || window.location.pathname}`);
    setMeta('property', 'og:site_name', SITE);
    setMeta('property', 'og:locale', 'en_IN');
    setMeta('property', 'og:image', `${BASE}/og/nayacura-og.png`);
    setMeta('property', 'og:image:width', '1200');
    setMeta('property', 'og:image:height', '630');
    setMeta('property', 'og:image:alt', 'Nayacura — Your Wellness. Your Confidence. Your Private Space.');
    setMeta('name', 'twitter:title', fullTitle);
    setMeta('name', 'twitter:description', description);
    setMeta('name', 'twitter:image', `${BASE}/og/nayacura-og.png`);
    setMeta('name', 'robots', noIndex ? 'noindex,nofollow' : 'index,follow');

    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = `${BASE}${path || window.location.pathname}`;

    let script = document.getElementById('nayacura-jsonld') as HTMLScriptElement | null;
    if (jsonLd) {
      if (!script) {
        script = document.createElement('script');
        script.id = 'nayacura-jsonld';
        script.type = 'application/ld+json';
        document.head.appendChild(script);
      }
      script.textContent = JSON.stringify(jsonLd);
    } else if (script) {
      script.remove();
    }
  }, [title, description, path, type, noIndex, jsonLd]);

  return null;
}
