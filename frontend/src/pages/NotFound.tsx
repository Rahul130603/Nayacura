import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowUpRight, Sparkles } from 'lucide-react';
import { Seo } from '@/components/Seo';
import { ButtonLink } from '@/components/ui/Button';

export function NotFound() {
  return (
    <>
      <Seo
        title="Page Not Found"
        description="This page could not be found."
        path="/404"
        noIndex
      />
      <section className="relative flex min-h-[84vh] items-center overflow-hidden bg-midnight pb-20 pt-36">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_60%_40%,rgba(110,53,164,0.22),transparent_55%),radial-gradient(circle_at_20%_80%,rgba(87,26,55,0.22),transparent_45%)]" />
        <div className="container-naya relative z-10">
          <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
            <div>
              <p className="eyebrow mb-6">A quiet detour</p>
              <p className="font-display text-[clamp(6rem,16vw,13rem)] leading-[0.7] text-ivory/[0.08]">
                404
              </p>
              <h1 className="display -mt-6 text-[clamp(2.8rem,6vw,5.3rem)]">
                This page has <span className="display-soft">wandered off.</span>
              </h1>
              <p className="body-copy mt-5 max-w-md">
                The link may be old, the page may have moved, or the address may be incomplete.
                Nothing private has been submitted.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <ButtonLink to="/" arrow>
                  Return home
                </ButtonLink>
                <ButtonLink to="/doctors" variant="secondary">
                  Find a specialist
                </ButtonLink>
              </div>
              <div className="mt-8 flex flex-wrap gap-x-5 gap-y-2">
                {[
                  ['Services', '/services'],
                  ['Wellness journal', '/journal'],
                  ['How it works', '/how-it-works'],
                  ['Support', '/contact'],
                ].map(([label, to]) => (
                  <Link
                    key={to}
                    to={to}
                    className="inline-flex items-center gap-1 font-body text-[10px] text-mauve transition-colors hover:text-ivory"
                  >
                    {label} <ArrowUpRight className="h-2.5 w-2.5" />
                  </Link>
                ))}
              </div>
            </div>
            <div className="relative hidden h-[420px] place-items-center lg:grid" aria-hidden>
              <span className="absolute h-[360px] w-[360px] rounded-full border border-lavender/10" />
              <span className="absolute h-[270px] w-[270px] animate-[spin_38s_linear_infinite] rounded-full border border-rose/10" />
              <span className="absolute h-[180px] w-[180px] rounded-[45%] rotate-45 bg-gradient-to-br from-royal/30 via-burgundy/20 to-transparent blur-xl" />
              <div className="relative text-center">
                <Sparkles className="mx-auto h-6 w-6 text-rose" />
                <p className="mt-4 font-display text-2xl italic text-ivory/50">Nothing lost.</p>
                <Link
                  to="/"
                  className="mt-3 inline-flex items-center gap-1.5 font-sans text-[9px] font-semibold uppercase tracking-[0.18em] text-lavender"
                >
                  <ArrowLeft className="h-3 w-3" /> Begin again
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

export default NotFound;
