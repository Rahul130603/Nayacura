import { Outlet, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { NayaAssistant } from '@/components/ai/NayaAssistant';
import { SmoothScroll } from '@/components/layout/SmoothScroll';
import { RouteEffects } from '@/components/layout/RouteEffects';

export function MarketingLayout() {
  const location = useLocation();

  return (
    <div className="relative min-h-screen bg-midnight">
      <a
        href="#main-content"
        className="fixed left-4 top-4 z-[200] -translate-y-24 rounded-full bg-lavender px-4 py-2 font-sans text-xs font-semibold text-midnight transition-transform focus:translate-y-0"
      >
        Skip to content
      </a>
      <SmoothScroll />
      <RouteEffects />
      <Navbar />
      <motion.main
        id="main-content"
        key={location.pathname}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
      >
        <Outlet />
      </motion.main>
      <Footer />
      <NayaAssistant />
    </div>
  );
}
