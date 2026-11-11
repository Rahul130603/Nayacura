import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowUpRight,
  ChevronDown,
  Heart,
  LayoutDashboard,
  LogOut,
  Menu,
  Sparkles,
  UserRound,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { serviceCategories } from '@/data/services';
import { Logo } from './Logo';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';

const primaryLinks = [
  { label: 'Find a Doctor', to: '/doctors' },
  { label: 'How It Works', to: '/how-it-works' },
  { label: 'Wellness Journal', to: '/journal' },
  { label: 'Pricing', to: '/pricing' },
];

const secondaryLinks = [
  { label: 'About Nayacura', to: '/about' },
  { label: 'All services', to: '/services' },
  { label: 'Contact & support', to: '/contact' },
  { label: 'Naya AI', to: '/ai' },
];

function dashboardPath(role: string) {
  if (role === 'DOCTOR') return '/doctor';
  if (role === 'ADMIN') return '/admin';
  return '/dashboard';
}

export function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [megaOpen, setMegaOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileServices, setMobileServices] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const megaRef = useRef<HTMLDivElement>(null);
  const accountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 28);
    }
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMegaOpen(false);
    setMobileOpen(false);
    setAccountOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setMegaOpen(false);
        setMobileOpen(false);
        setAccountOpen(false);
      }
    }
    function onClick(event: MouseEvent) {
      if (accountRef.current && !accountRef.current.contains(event.target as Node)) {
        setAccountOpen(false);
      }
    }
    document.addEventListener('keydown', onKey);
    document.addEventListener('click', onClick);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('click', onClick);
    };
  }, []);

  async function handleLogout() {
    await logout();
    setAccountOpen(false);
    navigate('/');
  }

  return (
    <>
      <header
        className={cn(
          'fixed inset-x-0 top-0 z-[80] transition-all duration-500',
          scrolled ? 'py-2.5' : 'py-4 sm:py-5',
        )}
        onMouseLeave={() => setMegaOpen(false)}
      >
        <div className="container-naya">
          <div
            className={cn(
              'flex items-center justify-between rounded-full border px-4 py-2.5 transition-all duration-500 sm:px-5',
              scrolled || megaOpen
                ? 'border-white/[0.09] bg-midnight/80 shadow-[0_18px_60px_-30px_rgba(0,0,0,0.9)] backdrop-blur-2xl'
                : 'border-transparent bg-midnight/20 backdrop-blur-sm',
            )}
          >
            <Logo className="relative z-10" />

            <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary">
              <div className="relative" ref={megaRef}>
                <button
                  type="button"
                  aria-expanded={megaOpen}
                  aria-haspopup="true"
                  onClick={() => setMegaOpen((v) => !v)}
                  onMouseEnter={() => setMegaOpen(true)}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-full px-4 py-2 font-sans text-[12.5px] font-medium transition-colors',
                    megaOpen ? 'bg-white/[0.07] text-ivory' : 'text-ivory/70 hover:text-ivory',
                  )}
                >
                  Our Services
                  <ChevronDown
                    className={cn('h-3.5 w-3.5 transition-transform', megaOpen && 'rotate-180')}
                  />
                </button>
              </div>
              {primaryLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) =>
                    cn(
                      'rounded-full px-3.5 py-2 font-sans text-[12.5px] font-medium transition-colors xl:px-4',
                      isActive
                        ? 'bg-white/[0.07] text-ivory'
                        : 'text-ivory/70 hover:text-ivory',
                    )
                  }
                >
                  {link.label}
                </NavLink>
              ))}
              <NavLink
                to="/about"
                className={({ isActive }) =>
                  cn(
                    'hidden rounded-full px-4 py-2 font-sans text-[12.5px] font-medium transition-colors xl:block',
                    isActive ? 'bg-white/[0.07] text-ivory' : 'text-ivory/70 hover:text-ivory',
                  )
                }
              >
                About
              </NavLink>
            </nav>

            <div className="flex items-center gap-2">
              {user ? (
                <div className="relative hidden sm:block" ref={accountRef}>
                  <button
                    type="button"
                    onClick={() => setAccountOpen((v) => !v)}
                    aria-expanded={accountOpen}
                    aria-haspopup="menu"
                    className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] py-1.5 pl-1.5 pr-3 transition-colors hover:border-lavender/30"
                  >
                    <Avatar name={user.name} size="sm" />
                    <span className="max-w-[92px] truncate font-sans text-xs font-semibold text-ivory">
                      {user.name.split(' ')[0]}
                    </span>
                    <ChevronDown className="h-3.5 w-3.5 text-mauve" />
                  </button>
                  <AnimatePresence>
                    {accountOpen && (
                      <motion.div
                        role="menu"
                        initial={{ opacity: 0, y: 8, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 6, scale: 0.98 }}
                        transition={{ duration: 0.2 }}
                        className="glass-strong absolute right-0 top-[calc(100%+10px)] w-60 overflow-hidden rounded-2xl p-2"
                      >
                        <div className="border-b border-white/[0.07] px-3 py-2">
                          <p className="truncate font-sans text-xs font-semibold text-ivory">
                            {user.name}
                          </p>
                          <p className="mt-0.5 truncate font-body text-[10px] text-mauve">
                            {user.email}
                          </p>
                        </div>
                        <Link
                          role="menuitem"
                          to={dashboardPath(user.role)}
                          className="mt-1 flex items-center gap-2.5 rounded-xl px-3 py-2.5 font-sans text-xs text-ivory/80 transition-colors hover:bg-white/[0.06] hover:text-ivory"
                        >
                          <LayoutDashboard className="h-4 w-4 text-lavender" />
                          {user.role === 'ADMIN'
                            ? 'Admin console'
                            : user.role === 'DOCTOR'
                              ? 'Professional dashboard'
                              : 'My dashboard'}
                        </Link>
                        <Link
                          role="menuitem"
                          to="/ai"
                          className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 font-sans text-xs text-ivory/80 transition-colors hover:bg-white/[0.06] hover:text-ivory"
                        >
                          <Sparkles className="h-4 w-4 text-rose" />
                          Naya AI
                        </Link>
                        <button
                          role="menuitem"
                          type="button"
                          onClick={handleLogout}
                          className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 font-sans text-xs text-ivory/80 transition-colors hover:bg-white/[0.06] hover:text-ivory"
                        >
                          <LogOut className="h-4 w-4 text-mauve" />
                          Sign out
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <Link
                  to="/login"
                  className="hidden items-center gap-1.5 rounded-full px-3 py-2 font-sans text-[12.5px] font-medium text-ivory/70 transition-colors hover:text-ivory sm:inline-flex"
                >
                  <UserRound className="h-4 w-4" />
                  Sign in
                </Link>
              )}
              <ButtonLink
                to={user ? '/doctors' : '/doctors'}
                size="sm"
                className="hidden sm:inline-flex"
                arrow
              >
                Book a consultation
              </ButtonLink>
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                className="grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-white/[0.04] text-ivory lg:hidden"
                aria-label="Open navigation menu"
                aria-expanded={mobileOpen}
              >
                <Menu className="h-5 w-5" />
              </button>
            </div>
          </div>

          <AnimatePresence>
            {megaOpen && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                className="glass-strong absolute left-1/2 top-[calc(100%-6px)] hidden w-[min(920px,calc(100vw-48px))] -translate-x-1/2 overflow-hidden rounded-[28px] p-3 lg:grid lg:grid-cols-[1.6fr_1fr]"
                onMouseEnter={() => setMegaOpen(true)}
                onMouseLeave={() => setMegaOpen(false)}
              >
                <div className="grid grid-cols-2 gap-1 p-2">
                  {serviceCategories.map((category) => (
                    <Link
                      key={category.slug}
                      to={`/services?category=${category.slug}`}
                      className="group rounded-2xl p-4 transition-colors hover:bg-white/[0.055]"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-sans text-[13px] font-semibold text-ivory">
                          {category.name}
                        </p>
                        <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-mauve transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-rose" />
                      </div>
                      <p className="mt-2 font-body text-[11.5px] leading-relaxed text-mauve">
                        {category.tagline}
                      </p>
                    </Link>
                  ))}
                  <div className="col-span-2 mt-1 flex items-center justify-between border-t border-white/[0.07] px-4 pt-4">
                    <p className="font-body text-[11px] text-mauve">
                      Not sure where to begin? Naya AI can guide you.
                    </p>
                    <Link
                      to="/services"
                      className="font-sans text-[11px] font-semibold text-lavender hover:text-rose"
                    >
                      View all 26 services →
                    </Link>
                  </div>
                </div>
                <div className="relative m-1 hidden overflow-hidden rounded-[22px] border border-lavender/10 bg-gradient-to-br from-burgundy/40 via-plum to-royal/25 p-6 lg:flex lg:flex-col lg:justify-between">
                  <div className="absolute -right-12 -top-12 h-44 w-44 rounded-full border border-rose/20" />
                  <div className="absolute -bottom-16 -left-10 h-48 w-48 rounded-full bg-royal/20 blur-[50px]" />
                  <div className="relative">
                    <Heart className="h-5 w-5 text-rose" />
                    <p className="mt-10 font-display text-[27px] leading-[1.1] text-ivory">
                      Care that begins with being heard.
                    </p>
                    <p className="mt-3 font-body text-[11.5px] leading-relaxed text-mauve">
                      Every specialist on Nayacura starts with consent, privacy and your comfort —
                      not a checklist.
                    </p>
                  </div>
                  <Link
                    to="/how-it-works"
                    className="relative mt-8 inline-flex items-center gap-2 font-sans text-[11px] font-semibold text-lavender"
                  >
                    How consultations work <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </header>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[95] flex flex-col bg-midnight/95 backdrop-blur-2xl lg:hidden"
          >
            <div className="container-naya flex items-center justify-between py-5">
              <Logo />
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-white/[0.04] text-ivory"
                aria-label="Close navigation menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="container-naya flex-1 overflow-y-auto pb-10 pt-4">
              {user && (
                <div className="mb-8 flex items-center justify-between rounded-2xl border border-white/[0.08] bg-white/[0.035] p-4">
                  <div className="flex items-center gap-3">
                    <Avatar name={user.name} size="md" />
                    <div>
                      <p className="font-sans text-sm font-semibold text-ivory">{user.name}</p>
                      <p className="font-body text-[11px] text-mauve">{user.email}</p>
                    </div>
                  </div>
                  <Link
                    to={dashboardPath(user.role)}
                    className="rounded-full border border-lavender/25 px-3 py-1.5 font-sans text-[10px] font-semibold uppercase tracking-wider text-lavender"
                  >
                    Dashboard
                  </Link>
                </div>
              )}

              <nav aria-label="Mobile primary" className="flex flex-col">
                <button
                  type="button"
                  onClick={() => setMobileServices((v) => !v)}
                  aria-expanded={mobileServices}
                  className="flex items-center justify-between border-b border-white/[0.07] py-5 text-left"
                >
                  <span className="font-display text-3xl text-ivory">Our Services</span>
                  <ChevronDown
                    className={cn(
                      'h-5 w-5 text-mauve transition-transform',
                      mobileServices && 'rotate-180',
                    )}
                  />
                </button>
                <AnimatePresence>
                  {mobileServices && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden border-b border-white/[0.07]"
                    >
                      <div className="space-y-1 py-4">
                        {serviceCategories.map((category) => (
                          <Link
                            key={category.slug}
                            to={`/services?category=${category.slug}`}
                            className="block rounded-xl px-3 py-3 font-sans text-sm text-ivory/80 hover:bg-white/[0.05]"
                          >
                            {category.name}
                          </Link>
                        ))}
                        <Link
                          to="/services"
                          className="block px-3 py-3 font-sans text-xs font-semibold uppercase tracking-wider text-lavender"
                        >
                          View all services
                        </Link>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                {[...primaryLinks, ...secondaryLinks.slice(0, 3)].map((link) => (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    className={({ isActive }) =>
                      cn(
                        'border-b border-white/[0.07] py-5 font-display text-3xl transition-colors',
                        isActive ? 'text-rose' : 'text-ivory hover:text-rose',
                      )
                    }
                  >
                    {link.label}
                  </NavLink>
                ))}
              </nav>

              <div className="mt-8 flex flex-col gap-3">
                <ButtonLink to="/doctors" size="lg" arrow className="w-full">
                  Find your specialist
                </ButtonLink>
                {user ? (
                  <Button
                    variant="secondary"
                    size="lg"
                    onClick={handleLogout}
                    icon={<LogOut className="h-4 w-4" />}
                    className="w-full"
                  >
                    Sign out
                  </Button>
                ) : (
                  <ButtonLink to="/login" variant="secondary" size="lg" className="w-full">
                    Sign in to your private space
                  </ButtonLink>
                )}
              </div>
              <p className="mt-8 text-center font-sans text-[9px] uppercase tracking-[0.2em] text-mauve/70">
                Your wellness. Your confidence. Your private space.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
