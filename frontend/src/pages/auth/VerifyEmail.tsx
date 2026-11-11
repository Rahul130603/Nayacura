import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, CircleAlert, Loader2, MailCheck } from 'lucide-react';
import { api } from '@/lib/api';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Seo } from '@/components/Seo';

export default function VerifyEmail() {
  const [params] = useSearchParams();
  const token = params.get('token');
  const [state, setState] = useState<'verifying' | 'success' | 'error' | 'missing'>(
    token ? 'verifying' : 'missing',
  );
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) return;
    api<{ message: string }>('/auth/verify-email', { method: 'POST', body: { token } })
      .then((data) => {
        setState('success');
        setMessage(data.message);
      })
      .catch((error) => {
        setState('error');
        setMessage(error instanceof Error ? error.message : 'This verification link is invalid.');
      });
  }, [token]);

  return (
    <>
      <Seo title="Verify Email" description="Verify the email address on your Nayacura account." path="/verify-email" noIndex />
      <div>
        <div className="grid h-12 w-12 place-items-center rounded-full border border-lavender/20 bg-lavender/[0.07] text-lavender">
          {state === 'verifying' ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : state === 'success' ? (
            <CheckCircle2 className="h-5 w-5" />
          ) : state === 'missing' ? (
            <MailCheck className="h-5 w-5" />
          ) : (
            <CircleAlert className="h-5 w-5 text-rose" />
          )}
        </div>
        <h1 className="display mt-5 text-4xl">
          {state === 'verifying'
            ? 'Verifying your email…'
            : state === 'success'
              ? 'Email verified.'
              : state === 'missing'
                ? 'Verification link needed.'
                : 'Link not valid.'}
        </h1>
        <p className="mt-3 font-body text-[12px] leading-relaxed text-mauve">
          {state === 'verifying'
            ? 'Please wait while we confirm the link.'
            : state === 'success'
              ? message
              : state === 'missing'
                ? 'Open the verification link from your email, or sign in and request a new one from your account settings.'
                : message}
        </p>
        {state === 'success' ? (
          <ButtonLink to="/dashboard" className="mt-6" arrow>
            Go to my dashboard
          </ButtonLink>
        ) : state === 'missing' || state === 'error' ? (
          <div className="mt-6 flex flex-wrap gap-3">
            <ButtonLink to="/login" arrow>
              Sign in
            </ButtonLink>
            <Link
              to="/contact"
              className="inline-flex min-h-11 items-center rounded-full border border-white/12 px-5 font-sans text-[11px] text-ivory/70 hover:text-ivory"
            >
              Contact support
            </Link>
          </div>
        ) : null}
        <p className="mt-8 border-t border-white/[0.07] pt-5 font-body text-[9px] text-mauve/50">
          In local demo mode without SMTP configured, verification links are printed in the API
          terminal.
        </p>
      </div>
    </>
  );
}
