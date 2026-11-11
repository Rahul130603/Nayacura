import { Component, lazy, Suspense, useEffect, useRef, useState, type ReactNode } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useMouseParallax } from '@/hooks/useMouseParallax';
import { useMediaQuery, useReducedMotion } from '@/hooks/useReducedMotion';
import { SculptureFallback } from './SculptureFallback';
import '@/styles/cinematicHero.css';

const HeroScene = lazy(() => import('./HeroScene'));
gsap.registerPlugin(ScrollTrigger);

class SceneBoundary extends Component<{ children: ReactNode; fallback: ReactNode }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

function supportsWebGL() {
  try {
    const context = document.createElement('canvas').getContext('webgl2');
    if (!context) return false;
    context.getExtension('WEBGL_lose_context')?.loseContext();
    return true;
  } catch {
    return false;
  }
}

export function CinematicHero() {
  const stage = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const compact = useMediaQuery('(max-width: 1023px)');
  const [webgl, setWebgl] = useState<boolean>();
  const [visible, setVisible] = useState(true);
  const [ready, setReady] = useState(false);
  const interactive = !reduced && webgl === true;
  const motion = useMouseParallax(stage, interactive);

  useEffect(() => {
    if (!reduced && webgl === undefined) setWebgl(supportsWebGL());
  }, [reduced, webgl]);

  useEffect(() => {
    const element = stage.current;
    if (!element || !interactive) return;
    const onLoss = (event: Event) => {
      event.preventDefault();
      setWebgl(false);
      setReady(false);
    };
    element.addEventListener('webglcontextlost', onLoss, true);
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting));
    observer.observe(element);
    return () => {
      element.removeEventListener('webglcontextlost', onLoss, true);
      observer.disconnect();
      setReady(false);
    };
  }, [interactive]);

  useEffect(() => {
    const element = stage.current;
    if (!element || reduced) return;
    const hero = element.closest('.hero-section');
    const ctx = gsap.context(() => {
      gsap.from('.cinematic-hero__atmosphere', { opacity: 0, duration: 1.1, ease: 'power2.out' });
      gsap.to(motion.current, {
        scroll: 1,
        ease: 'none',
        scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: 0.8 },
      });
      gsap.to('.cinematic-hero__silhouette', {
        yPercent: -6, scale: 0.97, opacity: 0.38,
        ease: 'none',
        scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: 0.8 },
      });
    }, element);
    return () => ctx.revert();
  }, [motion, reduced]);

  const fallback = <SculptureFallback />;

  return (
    <div className="cinematic-hero" ref={stage} data-scene-ready={interactive && ready}>
      <div className="cinematic-hero__atmosphere" aria-hidden="true" />
      <div className="cinematic-hero__art" aria-hidden="true">
        {interactive ? (
          <SceneBoundary fallback={fallback}>
            <Suspense fallback={fallback}>
              <div className="cinematic-hero__canvas">
                <HeroScene compact={compact} active={visible} motion={motion} onReady={() => setReady(true)} />
              </div>
            </Suspense>
          </SceneBoundary>
        ) : fallback}
      </div>
    </div>
  );
}

