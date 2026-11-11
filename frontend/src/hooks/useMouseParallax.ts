import { useEffect, useRef, type RefObject } from 'react';

export function useMouseParallax(surface: RefObject<HTMLElement>, enabled: boolean) {
  const motion = useRef({ x: 0, y: 0, scroll: 0 });

  useEffect(() => {
    const element = surface.current;
    if (!enabled || !element) return;

    const move = (event: PointerEvent) => {
      if (event.pointerType === 'touch') return;
      const bounds = element.getBoundingClientRect();
      motion.current.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
      motion.current.y = 1 - ((event.clientY - bounds.top) / bounds.height) * 2;
    };
    const reset = () => {
      motion.current.x = 0;
      motion.current.y = 0;
    };

    element.addEventListener('pointermove', move, { passive: true });
    element.addEventListener('pointerleave', reset);
    element.addEventListener('pointercancel', reset);
    return () => {
      element.removeEventListener('pointermove', move);
      element.removeEventListener('pointerleave', reset);
      element.removeEventListener('pointercancel', reset);
      reset();
    };
  }, [enabled, surface]);

  return motion;
}

