import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Mail } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Seo } from '@/components/Seo';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }
    setLoading(true);
    try {
      await api('/auth/forgot-password', { method: 'POST', body: { email } });
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Seo title="Forgot Password" description="Request a secure password reset link." path="/forgot-password" noIndex />
      <div>
        <p className="eyebrow mb-4">Account recovery</p>
        <h1 className="display text-[clamp(2.5rem,4.5vw,3.8rem)]">
          A way back <span className="display-soft">in.</span>
        </h1>
        {sent ? (
          <div className="mt-7">
            <div className="grid h-12 w-12 place-items-center rounded-full border border-lavender/20 bg-lavender/[0.07] text-lavender">
              <Mail className="h-5 w-5" />
            </div>
            <p className="mt-5 font-display text-2xl text-ivory">Check your email.</p>
            <p className="mt-2 font-body text-[11.5px] leading-relaxed text-mauve">
              If an account exists for that address, a reset link has been sent. For security, we do
              not confirm whether an account exists.
            </p>
            <div className="mt-4 rounded-xl border border-white/[0.08] bg-white/[0.025] p-4">
              <p className="font-body text-[10px] leading-relaxed text-mauve">
                <strong className="text-ivory">Local demo without SMTP:</strong> the reset link is
                printed in the API terminal. Email delivery requires the SMTP environment variables.
              </p>
            </div>
            <Link
              to="/login"
              className="mt-6 inline-flex items-center gap-2 font-sans text-[11px] font-semibold text-lavender hover:text-rose"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back to sign in
            </Link>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-7 space-y-4">
            <p className="font-body text-[12px] leading-relaxed text-mauve">
              Enter the email address on your account. We will send a single-use link that expires in
              30 minutes.
            </p>
            {error && (
              <div role="alert" className="rounded-xl border border-rose/25 bg-burgundy/25 px-4 py-3">
                <p className="font-body text-[11px] text-ivory/75">{error}</p>
              </div>
            )}
            <div>
              <label htmlFor="forgot-email" className="label-premium">Email address</label>
              <input
                id="forgot-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-premium"
                autoComplete="email"
                required
              />
            </div>
            <Button type="submit" size="lg" className="w-full" loading={loading} arrow>
              Send reset link
            </Button>
            <Link
              to="/login"
              className="flex items-center justify-center gap-2 font-sans text-[10px] text-mauve hover:text-ivory"
            >
              <ArrowLeft className="h-3 w-3" /> Back to sign in
            </Link>
          </form>
        )}
      </div>
    </>
  );
}
