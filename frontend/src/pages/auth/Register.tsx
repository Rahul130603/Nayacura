import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowRight, Check, Eye, EyeOff, LockKeyhole, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/Toast';
import { Button } from '@/components/ui/Button';
import { Seo } from '@/components/Seo';

const schema = z
  .object({
    name: z.string().trim().min(2, 'Please enter your full name.').max(80),
    email: z.string().trim().email('Please enter a valid email address.'),
    password: z
      .string()
      .min(10, 'Use at least 10 characters.')
      .max(128)
      .refine((value) => /[A-Za-z]/.test(value) && /\d/.test(value), {
        message: 'Include at least one letter and one number.',
      }),
    confirmPassword: z.string(),
    ageConfirmed: z.literal(true, {
      errorMap: () => ({ message: 'You must confirm that you are 18 or older.' }),
    }),
    consent: z.literal(true, {
      errorMap: () => ({ message: 'Please accept the privacy notice to continue.' }),
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match.',
  });

type FormValues = z.infer<typeof schema>;

export default function Register() {
  const { register: createAccount, user, loading } = useAuth();
  const navigate = useNavigate();
  const { push } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', email: '', password: '', confirmPassword: '' },
  });

  useEffect(() => {
    if (!loading && user) navigate('/dashboard', { replace: true });
  }, [user, loading, navigate]);

  async function onSubmit(values: FormValues) {
    setError(null);
    try {
      await createAccount({
        name: values.name,
        email: values.email,
        password: values.password,
        ageConfirmed: true,
        consent: true,
      });
      push({
        title: 'Your private account is ready',
        description: 'In local demo mode, the verification link is printed in the API terminal.',
        tone: 'success',
      });
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'We could not create your account.');
    }
  }

  return (
    <>
      <Seo
        title="Create a Private Patient Account"
        description="Create a private Nayacura patient account for confidential appointment booking and follow-up."
        path="/register"
        noIndex
      />
      <div>
        <p className="eyebrow mb-4">Your private space</p>
        <h1 className="display text-[clamp(2.5rem,4.5vw,3.8rem)]">
          Create your <span className="display-soft">Nayacura account.</span>
        </h1>
        <p className="mt-4 font-body text-[12px] leading-[1.8] text-mauve">
          One account for appointments, secure video rooms, documents and your private AI
          conversation history. You decide what to share, and when.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-7 space-y-4" noValidate>
          {error && (
            <div role="alert" className="rounded-xl border border-rose/25 bg-burgundy/25 px-4 py-3">
              <p className="font-body text-[11px] leading-relaxed text-ivory/75">{error}</p>
            </div>
          )}
          <div>
            <label htmlFor="register-name" className="label-premium">Full name</label>
            <input id="register-name" className="input-premium" autoComplete="name" {...register('name')} />
            {errors.name && <p className="mt-1.5 font-body text-[10px] text-rose">{errors.name.message}</p>}
          </div>
          <div>
            <label htmlFor="register-email" className="label-premium">Email address</label>
            <input id="register-email" type="email" className="input-premium" autoComplete="email" {...register('email')} />
            {errors.email && <p className="mt-1.5 font-body text-[10px] text-rose">{errors.email.message}</p>}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="register-password" className="label-premium">Password</label>
              <div className="relative">
                <input
                  id="register-password"
                  type={showPassword ? 'text' : 'password'}
                  className="input-premium pr-10"
                  autoComplete="new-password"
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 text-mauve hover:text-ivory"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>
              {errors.password && <p className="mt-1.5 font-body text-[10px] text-rose">{errors.password.message}</p>}
            </div>
            <div>
              <label htmlFor="register-confirm" className="label-premium">Confirm password</label>
              <input
                id="register-confirm"
                type={showPassword ? 'text' : 'password'}
                className="input-premium"
                autoComplete="new-password"
                {...register('confirmPassword')}
              />
              {errors.confirmPassword && <p className="mt-1.5 font-body text-[10px] text-rose">{errors.confirmPassword.message}</p>}
            </div>
          </div>
          <p className="font-body text-[9px] text-mauve/60">
            10+ characters with at least one letter and one number.
          </p>

          <div className="space-y-3 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4">
            <label className="flex cursor-pointer items-start gap-3">
              <input type="checkbox" className="mt-1 h-4 w-4 accent-[#C9A7F5]" {...register('ageConfirmed')} />
              <span className="font-body text-[10.5px] leading-relaxed text-mauve">
                I confirm I am 18 years or older.
              </span>
            </label>
            {errors.ageConfirmed && <p className="font-body text-[10px] text-rose">{errors.ageConfirmed.message}</p>}
            <label className="flex cursor-pointer items-start gap-3">
              <input type="checkbox" className="mt-1 h-4 w-4 accent-[#C9A7F5]" {...register('consent')} />
              <span className="font-body text-[10.5px] leading-relaxed text-mauve">
                I have read and accept the{' '}
                <Link to="/legal/privacy" className="text-lavender underline">Privacy Policy</Link> and{' '}
                <Link to="/legal/terms" className="text-lavender underline">Terms of Service</Link>. I
                understand this is a development demo.
              </span>
            </label>
            {errors.consent && <p className="font-body text-[10px] text-rose">{errors.consent.message}</p>}
          </div>

          <Button type="submit" size="lg" loading={isSubmitting} className="w-full" arrow>
            Create private account
          </Button>
        </form>

        <p className="mt-5 text-center font-body text-[11px] text-mauve">
          Already have an account?{' '}
          <Link to="/login" className="font-sans font-semibold text-lavender hover:text-rose">
            Sign in <ArrowRight className="inline h-3 w-3" />
          </Link>
        </p>

        <div className="mt-6 grid gap-2 border-t border-white/[0.07] pt-5">
          {[
            [LockKeyhole, 'Your account is private to you'],
            [ShieldCheck, 'Minimal information collected'],
            [Check, 'Delete or request deletion of data at any time'],
          ].map(([Icon, text]) => {
            const Component = Icon as typeof LockKeyhole;
            return (
              <div key={text as string} className="flex items-center gap-2">
                <Component className="h-3 w-3 text-lavender/70" />
                <span className="font-body text-[9px] text-mauve/60">{text as string}</span>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
