import { Link, Outlet, useLocation } from 'react-router-dom';
import { ArrowLeft, HeartHandshake, LockKeyhole, ShieldCheck } from 'lucide-react';
import { Logo } from '@/components/layout/Logo';
import { RouteEffects } from '@/components/layout/RouteEffects';
import { cn } from '@/lib/utils';

export function AuthLayout() {
  const { pathname } = useLocation();
  const isLogin = /^\/(?:doctor\/|admin\/)?login\/?$/.test(pathname);

  return (
    <div className="min-h-screen bg-midnight">
      <RouteEffects />
      <a
        href="#auth-content"
        className="fixed left-4 top-4 z-[200] -translate-y-24 rounded-full bg-lavender px-4 py-2 font-sans text-xs font-semibold text-midnight transition-transform focus:translate-y-0"
      >
        Skip to form
      </a>
      <div className="grid min-h-[calc(100svh/var(--desktop-scale,1))] lg:grid-cols-[0.95fr_1.05fr]">
        <div className={cn(
          'relative flex flex-col px-5 sm:px-10 lg:px-16 xl:px-24',
          isLogin ? 'py-3 sm:py-4' : 'py-6 sm:py-8',
        )}>
          <div className="flex items-center justify-between">
            <Logo />
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 font-sans text-[10px] font-semibold uppercase tracking-[0.14em] text-mauve transition-colors hover:text-ivory"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back to site
            </Link>
          </div>
          <main id="auth-content" className={cn('flex flex-1 items-center', isLogin ? 'py-4' : 'py-10 sm:py-14')}>
            <div className="mx-auto w-full max-w-[430px]">
              <Outlet />
            </div>
          </main>
          <footer className={cn('flex flex-wrap items-center justify-between gap-2 border-t border-white/[0.07]', isLogin ? 'pt-2' : 'pt-5')}>
            <p className="font-body text-[9px] text-mauve/50">
              © {new Date().getFullYear()} Nayacura · Development demo
            </p>
            <div className="flex gap-4">
              {[
                ['Privacy', '/legal/privacy'],
                ['Terms', '/legal/terms'],
                ['Support', '/contact'],
              ].map(([label, to]) => (
                <Link
                  key={to}
                  to={to}
                  className="font-body text-[9px] text-mauve/50 transition-colors hover:text-ivory"
                >
                  {label}
                </Link>
              ))}
            </div>
          </footer>
        </div>

        <aside className={cn('relative hidden overflow-hidden lg:block', !isLogin && 'border-l border-white/[0.06]')}>
          <img
            src={isLogin ? '/images/art/login-purple-couple.png' : '/images/art/space.svg'}
            alt=""
            className={cn('absolute inset-0 h-full w-full object-cover', isLogin && 'object-right')}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-midnight via-midnight/30 to-midnight/20" />
          <div className={cn(
            'pointer-events-none absolute inset-0',
            isLogin
              ? 'bg-[linear-gradient(to_right,var(--midnight),rgba(9,6,15,0.78)_9%,rgba(9,6,15,0.28)_22%,transparent_36%)]'
              : 'bg-gradient-to-r from-midnight/60 via-transparent to-transparent',
          )} />
          <div className="absolute left-10 top-10 flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-rose" />
            <span className="font-sans text-[8px] font-semibold uppercase tracking-[0.22em] text-ivory/50">
              A private space for adults
            </span>
          </div>
          <div className="absolute inset-x-10 bottom-14 xl:inset-x-16">
            <div className="mb-8 flex gap-3">
              {[LockKeyhole, ShieldCheck, HeartHandshake].map((Icon, index) => (
                <span
                  key={index}
                  className="grid h-9 w-9 place-items-center rounded-full border border-white/15 bg-midnight/30 text-lavender backdrop-blur-md"
                >
                  <Icon className="h-3.5 w-3.5" />
                </span>
              ))}
            </div>
            <blockquote className="max-w-lg font-display text-[clamp(2rem,3.4vw,3.2rem)] leading-[1.1] text-ivory">
              “The first step is not having the right words. It is having a room where you can
              find them.”
            </blockquote>
            <div className="mt-6 h-px w-16 bg-rose/60" />
            <p className="mt-4 max-w-md font-body text-[11px] leading-relaxed text-mauve">
              Nayacura is a development demo. No real clinical service, clinician, payment or
              confidential medical record is represented.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
