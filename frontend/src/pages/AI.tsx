import { Link } from 'react-router-dom';
import {
  ArrowUpRight,
  Bot,
  CircleAlert,
  Clock3,
  HeartHandshake,
  Languages,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
  UserCheck,
} from 'lucide-react';
import { Seo } from '@/components/Seo';
import { PageHero } from '@/components/layout/PageHero';
import { NayaChat } from '@/components/ai/NayaChat';
import { Badge } from '@/components/ui/Badge';
import { ButtonLink } from '@/components/ui/Button';

export default function AI() {
  return (
    <>
      <Seo
        title="Naya AI — Your Private Wellness Companion"
        description="A private AI wellness companion for general sexual wellness education, service navigation and specialist guidance in English and Tamil. Not a doctor."
        path="/ai"
      />
      <PageHero
        eyebrow="Naya AI · private wellness companion"
        title="A quieter place to"
        accent="start."
        description="Ask general questions about sexual wellness, relationships, the consultation process or finding the right specialist. Naya is AI — not a doctor — and cannot diagnose, prescribe or handle emergencies."
        art="veil"
        className="pb-10 sm:pb-12 lg:pb-14"
      >
        <div className="flex flex-wrap items-center gap-3">
          <Badge tone="lavender" dot>
            AI assistant
          </Badge>
          <span className="inline-flex items-center gap-1.5 font-body text-[9.5px] text-mauve">
            <Languages className="h-3 w-3 text-lavender" /> English & தமிழ்
          </span>
          <span className="inline-flex items-center gap-1.5 font-body text-[9.5px] text-mauve">
            <LockKeyhole className="h-3 w-3 text-lavender" /> Consent before storage
          </span>
        </div>
      </PageHero>

      <section className="relative border-t border-white/[0.06] bg-midnight pb-16 pt-6 sm:pb-24">
        <div className="container-naya">
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_310px]">
            <div className="flex min-h-[600px] flex-col overflow-hidden rounded-[28px] border border-white/[0.09] bg-plum/30 shadow-card sm:min-h-[680px]">
              <NayaChat variant="page" />
            </div>

            <aside className="space-y-3">
              <div className="rounded-[22px] border border-lavender/15 bg-gradient-to-br from-burgundy/30 via-plum to-royal/15 p-5">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-lavender" />
                  <p className="font-sans text-[11px] font-semibold text-ivory">What Naya can do</p>
                </div>
                <ul className="mt-4 space-y-3">
                  {[
                    [Bot, 'Explain general sexual wellness topics'],
                    [UserCheck, 'Help identify a specialist category'],
                    [HeartHandshake, 'Offer general communication guidance'],
                    [Clock3, 'Explain how booking and consultations work'],
                    [Languages, 'Respond in English or Tamil'],
                  ].map(([Icon, text]) => {
                    const Component = Icon as typeof Bot;
                    return (
                      <li key={text as string} className="flex items-start gap-2.5">
                        <Component className="mt-0.5 h-3.5 w-3.5 shrink-0 text-lavender/80" />
                        <span className="font-body text-[10px] leading-relaxed text-mauve">
                          {text as string}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>

              <div className="rounded-[22px] border border-rose/20 bg-burgundy/20 p-5">
                <div className="flex items-center gap-2">
                  <CircleAlert className="h-4 w-4 text-rose" />
                  <p className="font-sans text-[11px] font-semibold text-ivory">What Naya cannot do</p>
                </div>
                <ul className="mt-4 space-y-2.5">
                  {[
                    'Diagnose a condition',
                    'Prescribe or recommend prescription medication',
                    'Guarantee a treatment outcome',
                    'Provide emergency care',
                    'Access your clinical records',
                    'Replace a qualified consultation',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2.5">
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-rose/70" />
                      <span className="font-body text-[10px] leading-relaxed text-mauve">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-[22px] border border-white/[0.08] bg-white/[0.025] p-5">
                <p className="font-sans text-[10px] font-semibold text-ivory">Privacy choices</p>
                <p className="mt-2 font-body text-[9.5px] leading-relaxed text-mauve">
                  Guests can chat without an account; the conversation is not stored. Signed-in users
                  can opt in to storing a conversation and delete it at any time from the chat header.
                  AI conversations are encrypted at rest in this demo.
                </p>
                <Link
                  to="/legal/privacy"
                  className="mt-3 inline-flex items-center gap-1.5 font-sans text-[9.5px] font-semibold text-lavender hover:text-rose"
                >
                  Privacy Policy <ArrowUpRight className="h-3 w-3" />
                </Link>
              </div>

              <div className="rounded-[22px] border border-rose/20 bg-rose/[0.04] p-5">
                <p className="font-sans text-[10px] font-semibold text-ivory">Emergency support</p>
                <p className="mt-2 font-body text-[9.5px] leading-relaxed text-mauve">
                  Naya cannot handle an emergency. Contact local emergency services (112 in India) or
                  Tele-MANAS on{' '}
                  <a href="tel:14416" className="text-lavender underline">14416</a>. Do not wait for
                  an AI reply.
                </p>
              </div>

              <div className="rounded-[22px] border border-white/[0.07] p-5">
                <Sparkles className="h-4 w-4 text-rose" />
                <p className="mt-3 font-display text-xl leading-tight text-ivory">
                  Prefer a human conversation?
                </p>
                <p className="mt-1.5 font-body text-[9.5px] leading-relaxed text-mauve">
                  Browse demo specialists when you are ready. You do not need to explain everything to
                  Naya first.
                </p>
                <ButtonLink to="/doctors" variant="secondary" size="sm" className="mt-4 w-full" arrow>
                  Find a specialist
                </ButtonLink>
              </div>
            </aside>
          </div>

          <div className="mt-6 flex flex-col items-start justify-between gap-3 border-t border-white/[0.07] pt-5 sm:flex-row sm:items-center">
            <p className="font-body text-[9px] text-mauve/50">
              Naya is an AI system. Responses may be incomplete or inaccurate and should not be used
              as medical advice. Demo fallback responses are used when no LLM API key is configured.
            </p>
            <Link
              to="/legal/medical-disclaimer"
              className="shrink-0 font-sans text-[9px] font-semibold uppercase tracking-[0.14em] text-lavender hover:text-rose"
            >
              Medical disclaimer
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
