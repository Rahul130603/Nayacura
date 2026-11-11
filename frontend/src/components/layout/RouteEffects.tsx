import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export function RouteEffects() {
  const { pathname } = useLocation();

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, left: 0, behavior: reduce ? 'auto' : 'instant' });
  }, [pathname]);

  return null;
}
