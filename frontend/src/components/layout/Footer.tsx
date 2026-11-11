import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Clock3, LockKeyhole, Mail, ShieldCheck } from 'lucide-react';
import { serviceCategories } from '@/data/services';
import { Logo } from './Logo';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';

const careLinks = [
  { label: 'Find a specialist', to: '/doctors' },
  { label: 'How it works', to: '/how-it-works' },
  { label: 'Consultation pricing', to: '/pricing' },
  { label: 'Wellness journal', to: '/journal' },
  { label: 'Naya AI companion', to: '/ai' },
  { label: 'Contact & support', to: '/contact' },
];

const companyLinks = [
  { label: 'About Nayacura', to: '/about' },
  { label: 'Our approach', to: '/about#approach' },
  { label: 'Professional access', to: '/doctor/login' },
  { label: 'Administration', to: '/admin/login' },
];

const legalLinks = [
  { label: 'Privacy Policy', to: '/legal/privacy' },
  { label: 'Terms of Service', to: '/legal/terms' },
  { label: 'Medical Disclaimer', to: '/legal/medical-disclaimer' },
  { label: 'Teleconsultation Consent', to: '/legal/teleconsultation-consent' },
  { label: 'Cancellation & Refunds', to: '/legal/cancellation-refund' },
  { label: 'Cookie Policy', to: '/legal/cookies' },
  { label: 'Accessibility', to: '/legal/accessibility' },
  { label: 'Data Deletion', to: '/legal/data-deletion' },
  { label: 'Grievance & Support', to: '/legal/grievance' },
];

export function Footer() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const { push } = useToast();

  function subscribe(e: React.FormEvent) {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      push({ title: 'Please check your email address', tone: 'error' });
      return;
    }
    setSubscribed(true);
    push({
      title: 'You are on the list',
      description: 'Demo only — no marketing email has been stored or sent.',
      tone: 'success',
    });
  }

  return (
    <footer className="relative overflow-hidden border-t border-white/[0.07] bg-plum">
      <div className="pointer-events-none absolute -right-40 top-0 h-[480px] w-[480px] rounded-full bg-royal/[0.12] blur-[120px]" />
      <div className="pointer-events-none absolute -left-32 bottom-0 h-[400px] w-[400px] rounded-full bg-burgundy/[0.2] blur-[120px]" />

      <div className="container-naya relative z-10">
        <div className="grid gap-12 border-b border-white/[0.07] py-16 lg:grid-cols-[1.15fr_1fr] lg:gap-24 lg:py-20">
          <div>
            <p className="eyebrow mb-6">Stay thoughtfully informed</p>
            <h2 className="display max-w-xl text-[clamp(2.6rem,5vw,4.6rem)]">
              Private care, <span className="display-soft">gently delivered.</span>
            </h2>
            <p className="body-copy mt-5 max-w-lg">
              Occasional notes on intimate wellbeing, relationships and navigating care — written
              with care, never with shame. No explicit content. Unsubscribe anytime.
            </p>
            {subscribed ? (
              <div className="mt-8 flex items-center gap-3 rounded-2xl border border-lavender/20 bg-lavender/[0.06] p-4">
                <ShieldCheck className="h-5 w-5 text-lavender" />
                <p className="font-body text-sm text-ivory">
                  You are on the demo list. No data was sent.
                </p>
              </div>
            ) : (
              <form onSubmit={subscribe} className="mt-8 flex max-w-md flex-col gap-3 sm:flex-row">
                <label htmlFor="footer-email" className="sr-only">
                  Email address
                </label>
                <input
                  id="footer-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Your email address"
                  className="input-premium flex-1"
                  autoComplete="email"
                />
                <Button type="submit" size="md" arrow>
                  Join
                </Button>
              </form>
            )}
            <p className="mt-3 font-body text-[10px] leading-relaxed text-mauve/60">
              Demo newsletter form. It does not transmit or persist your email address.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-x-8 gap-y-10 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3">
            <div>
              <h3 className="font-sans text-[10px] font-semibold uppercase tracking-[0.2em] text-rose">
                Care
              </h3>
              <ul className="mt-5 space-y-3">
                {careLinks.map((link) => (
                  <li key={link.to}>
                    <Link
                      to={link.to}
                      className="font-body text-[12px] text-mauve transition-colors hover:text-ivory"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-sans text-[10px] font-semibold uppercase tracking-[0.2em] text-rose">
                Services
              </h3>
              <ul className="mt-5 space-y-3">
                {serviceCategories.map((category) => (
                  <li key={category.slug}>
                    <Link
                      to={`/services?category=${category.slug}`}
                      className="font-body text-[12px] leading-snug text-mauve transition-colors hover:text-ivory"
                    >
                      {category.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-sans text-[10px] font-semibold uppercase tracking-[0.2em] text-rose">
                Nayacura
              </h3>
              <ul className="mt-5 space-y-3">
                {companyLinks.map((link) => (
                  <li key={link.to}>
                    <Link
                      to={link.to}
                      className="font-body text-[12px] text-mauve transition-colors hover:text-ivory"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div className="col-span-2 mt-2 rounded-2xl border border-white/[0.07] bg-midnight/30 p-4 sm:col-span-3 lg:col-span-2 xl:col-span-3">
              <div className="flex items-start gap-3">
                <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-lavender" />
                <div>
                  <p className="font-sans text-[11px] font-semibold text-ivory">
                    Support hours (illustrative)
                  </p>
                  <p className="mt-1 font-body text-[11px] leading-relaxed text-mauve">
                    Monday–Saturday, 9:00–19:00 IST. This demo does not operate a live support
                    desk. For emergencies, contact local emergency services.
                  </p>
                </div>
              </div>
              <Link
                to="/contact"
                className="mt-4 inline-flex items-center gap-1.5 font-sans text-[11px] font-semibold text-lavender hover:text-rose"
              >
                <Mail className="h-3.5 w-3.5" /> Send a support request
              </Link>
            </div>
          </div>
        </div>

        <div className="grid gap-8 border-b border-white/[0.07] py-10 md:grid-cols-[1fr_1.4fr]">
          <div>
            <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.2em] text-rose">
              Legal & trust
            </p>
            <p className="mt-3 max-w-sm font-body text-[11px] leading-relaxed text-mauve/80">
              Every policy here is a clearly marked pre-launch draft and requires review by
              qualified Indian legal and clinical professionals before any real service begins.
            </p>
          </div>
          <ul className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3">
            {legalLinks.map((link) => (
              <li key={link.to}>
                <Link
                  to={link.to}
                  className="font-body text-[11px] text-mauve transition-colors hover:text-ivory"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col gap-5 border-b border-white/[0.07] py-8 lg:flex-row lg:items-center lg:justify-between">
          <Logo />
          <p className="max-w-2xl font-body text-[10.5px] leading-relaxed text-mauve/65">
            Nayacura is a fictional development project. Clinicians, reviews, clinic locations,
            pricing and availability shown are illustrative. Nayacura does not claim HIPAA, GDPR,
            DPDP certification, ABDM registration or any other regulatory accreditation. Nothing
            here is medical advice or a substitute for an in-person assessment.
          </p>
          <a
            href="#top"
            onClick={(e) => {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="inline-flex shrink-0 items-center gap-2 font-sans text-[10px] font-semibold uppercase tracking-[0.16em] text-lavender"
          >
            Back to top <ArrowUpRight className="h-3.5 w-3.5" />
          </a>
        </div>

        <div className="flex flex-col items-center justify-between gap-3 py-6 sm:flex-row">
          <p className="font-body text-[10px] text-mauve/55">
            © {new Date().getFullYear()} Nayacura. A development demo. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1.5 font-body text-[10px] text-mauve/60">
              <LockKeyhole className="h-3 w-3" /> Consent-first design
            </span>
            <span className="font-body text-[10px] text-mauve/40">Built for adults 18+</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
