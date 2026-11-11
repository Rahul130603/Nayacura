import { useEffect, useState, type ReactNode } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ChevronDown,
  LogOut,
  Menu,
  Sparkles,
  X,
  type LucideIcon,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { cn, initials } from '@/lib/utils';
import { Logo } from './Logo';
import { Avatar } from '@/components/ui/Avatar';

export type DashboardNavItem = {
  key: string;
  label: string;
  icon: LucideIcon;
  badge?: number;
};

export function DashboardShell({
  portal,
  title,
  subtitle,
  navItems,
  children,
  accent = 'lavender',
}: {
  portal: string;
  title: string;
  subtitle: string;
  navItems: DashboardNavItem[];
  children: ReactNode;
  accent?: 'lavender' | 'rose' | 'burgundy';
}) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [params, setParams] = useSearchParams();
  const [open, setOpen] = useState(false);
  const active = params.get('section') || navItems[0]?.key || 'overview';

  useEffect(() => {
    setOpen(false);
  }, [location.pathname, active]);

  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  function go(key: string) {
    const next = new URLSearchParams(params);
    next.set('section', key);
    setParams(next);
    setOpen(false);
  }

  async function handleLogout() {
    await logout();
    navigate('/');
  }

  const accentClasses = {
    lavender: 'from-royal/30 to-lavender/10 text-lavender',
    rose: 'from-burgundy/40 to-rose/10 text-rose',
    burgundy: 'from-burgundy/60 to-royal/20 text-rose',
  }[accent];

  return (
    <div className="min-h-screen bg-midnight">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_75%_0%,rgba(110,53,164,0.08),transparent_45%)]" />
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-[80] flex w-[268px] flex-col border-r border-white/[0.07] bg-plum/90 backdrop-blur-2xl transition-transform duration-300 lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
        aria-label={`${portal} navigation`}
      >
        <div className="flex h-[76px] items-center justify-between border-b border-white/[0.07] px-5">
          <Logo />
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="grid h-8 w-8 place-items-center rounded-full border border-white/10 text-mauve lg:hidden"
            aria-label="Close menu"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-4 py-5">
          <div
            className={cn(
              'rounded-2xl border border-white/[0.08] bg-gradient-to-br p-4',
              accentClasses,
            )}
          >
            <p className="font-sans text-[8px] font-semibold uppercase tracking-[0.18em] opacity-80">
              {portal}
            </p>
            <p className="mt-2 font-display text-xl leading-tight text-ivory">
              {user?.name || 'Nayacura'}
            </p>
            <p className="mt-1 truncate font-body text-[9px] text-mauve">{user?.email}</p>
          </div>
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 pb-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = active === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => go(item.key)}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all',
                  isActive
                    ? 'bg-white/[0.07] text-ivory'
                    : 'text-mauve hover:bg-white/[0.035] hover:text-ivory',
                )}
              >
                <span
                  className={cn(
                    'grid h-7 w-7 place-items-center rounded-lg border transition-colors',
                    isActive
                      ? 'border-lavender/25 bg-lavender/10 text-lavender'
                      : 'border-white/[0.06] text-mauve group-hover:text-ivory/80',
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                </span>
                <span className="flex-1 font-sans text-[11.5px] font-medium">{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="rounded-full bg-rose/15 px-1.5 py-0.5 font-sans text-[8px] font-semibold text-rose">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="border-t border-white/[0.07] p-3">
          <Link
            to="/ai"
            className="mb-2 flex items-center gap-2.5 rounded-xl border border-lavender/15 bg-lavender/[0.04] px-3 py-2.5 transition-colors hover:bg-lavender/[0.08]"
          >
            <Sparkles className="h-3.5 w-3.5 text-rose" />
            <span className="flex-1 font-sans text-[10px] font-semibold text-ivory">Ask Naya</span>
            <span className="font-body text-[8px] text-mauve">AI</span>
          </Link>
          <div className="flex items-center gap-2 rounded-xl px-2 py-2">
            <Avatar name={user?.name || 'Guest'} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="truncate font-sans text-[10px] font-semibold text-ivory">
                {user?.name}
              </p>
              <p className="font-body text-[8px] uppercase tracking-wider text-mauve">{portal}</p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="grid h-7 w-7 place-items-center rounded-full text-mauve transition-colors hover:bg-white/10 hover:text-rose"
              aria-label="Sign out"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
          <Link
            to="/"
            className="mt-1 block rounded-lg px-2 py-2 text-center font-body text-[8px] text-mauve/50 hover:text-ivory"
          >
            Return to public site
          </Link>
        </div>
      </aside>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] bg-midnight/70 backdrop-blur-sm lg:hidden"
            onClick={() => setOpen(false)}
            aria-hidden
          />
        )}
      </AnimatePresence>

      <div className="relative lg:pl-[268px]">
        <header className="sticky top-0 z-[60] border-b border-white/[0.07] bg-midnight/80 backdrop-blur-2xl">
          <div className="flex min-h-[76px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setOpen(true)}
                className="grid h-9 w-9 place-items-center rounded-full border border-white/10 text-ivory lg:hidden"
                aria-label="Open dashboard menu"
              >
                <Menu className="h-4 w-4" />
              </button>
              <div>
                <h1 className="font-display text-[20px] leading-tight text-ivory sm:text-[23px]">
                  {title}
                </h1>
                <p className="mt-0.5 hidden font-body text-[9.5px] text-mauve sm:block">
                  {subtitle}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="hidden items-center gap-1.5 rounded-full border border-lavender/15 bg-lavender/[0.04] px-3 py-1.5 font-body text-[8.5px] text-lavender sm:inline-flex">
                <span className="h-1.5 w-1.5 rounded-full bg-lavender" /> Demo environment
              </span>
              <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] py-1 pl-1 pr-2.5">
                <span className="grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br from-royal to-burgundy font-sans text-[9px] font-semibold text-ivory">
                  {initials(user?.name || 'N')}
                </span>
                <span className="hidden max-w-[100px] truncate font-sans text-[10px] text-ivory/80 sm:block">
                  {user?.name}
                </span>
                <ChevronDown className="h-3 w-3 text-mauve" />
              </div>
            </div>
          </div>
        </header>

        <main className="relative z-10 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          <div className="mx-auto max-w-[1280px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
