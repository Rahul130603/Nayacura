import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, CheckCircle2, Eye, EyeOff, KeyRound } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Seo } from '@/components/Seo';

const schema = z
  .object({
    password: z
      .string()
      .min(10, 'Use at least 10 characters.')
      .refine((value) => /[A-Za-z]/.test(value) && /\d/.test(value), {
        message: 'Include at least one letter and one number.',
      }),
    confirm: z.string(),
  })
  .refine((data) => data.password === data.confirm, {
    path: ['confirm'],
    message: 'Passwords do not match.',
  });
type FormValues = z.infer<typeof schema>;

export default function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [show, setShow] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function submit(values: FormValues) {
    setError(null);
    try {
      await api('/auth/reset-password', {
        method: 'POST',
        body: { token, password: values.password },
      });
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'This link may have expired.');
    }
  }

  if (!token) {
    return (
      <div>
        <Seo title="Reset Password" description="Reset your Nayacura account password securely." path="/reset-password" noIndex />
        <div className="grid h-12 w-12 place-items-center rounded-full border border-rose/20 bg-rose/10 text-rose">
          <KeyRound className="h-5 w-5" />
        </div>
        <h1 className="display mt-5 text-4xl">This link is incomplete.</h1>
        <p className="mt-3 font-body text-[12px] leading-relaxed text-mauve">
          A valid password reset link is required. Request a new one from the sign-in page.
        </p>
        <Button onClick={() => window.location.assign('/forgot-password')} className="mt-6">
          Request a new link
        </Button>
      </div>
    );
  }

  return (
    <>
      <Seo title="Choose a New Password" description="Choose a new password for your Nayacura account." path="/reset-password" noIndex />
      <div>
        {done ? (
          <>
            <div className="grid h-12 w-12 place-items-center rounded-full border border-lavender/20 bg-lavender/10 text-lavender">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <h1 className="display mt-5 text-4xl">Password updated.</h1>
            <p className="mt-3 font-body text-[12px] leading-relaxed text-mauve">
              For security, all other sessions have been signed out. Sign in with your new password.
            </p>
            <Button onClick={() => window.location.assign('/login')} className="mt-6" arrow>
              Go to sign in
            </Button>
          </>
        ) : (
          <>
            <p className="eyebrow mb-4">Account recovery</p>
            <h1 className="display text-[clamp(2.5rem,4.5vw,3.8rem)]">Choose a new password.</h1>
            <p className="mt-3 font-body text-[12px] leading-relaxed text-mauve">
              Use at least 10 characters with a mix of letters and numbers. Do not reuse a password
              from another service.
            </p>
            <form onSubmit={handleSubmit(submit)} className="mt-7 space-y-4">
              {error && (
                <div role="alert" className="rounded-xl border border-rose/25 bg-burgundy/25 px-4 py-3">
                  <p className="font-body text-[11px] text-ivory/75">{error}</p>
                </div>
              )}
              <div>
                <label htmlFor="new-password" className="label-premium">New password</label>
                <div className="relative">
                  <input
                    id="new-password"
                    type={show ? 'text' : 'password'}
                    className="input-premium pr-11"
                    autoComplete="new-password"
                    {...register('password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShow((value) => !value)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-mauve hover:text-ivory"
                    aria-label={show ? 'Hide password' : 'Show password'}
                  >
                    {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && <p className="mt-1.5 font-body text-[10px] text-rose">{errors.password.message}</p>}
              </div>
              <div>
                <label htmlFor="confirm-password" className="label-premium">Confirm password</label>
                <input
                  id="confirm-password"
                  type={show ? 'text' : 'password'}
                  className="input-premium"
                  autoComplete="new-password"
                  {...register('confirm')}
                />
                {errors.confirm && <p className="mt-1.5 font-body text-[10px] text-rose">{errors.confirm.message}</p>}
              </div>
              <Button type="submit" size="lg" className="w-full" loading={isSubmitting}>
                Update password
              </Button>
              <Link
                to="/login"
                className="flex items-center justify-center gap-2 font-sans text-[10px] text-mauve hover:text-ivory"
              >
                <ArrowLeft className="h-3 w-3" /> Back to sign in
              </Link>
            </form>
          </>
        )}
      </div>
    </>
  );
}
