import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowRight, Eye, EyeOff, LockKeyhole, ShieldCheck, Sparkles } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { safeNext } from '@/lib/utils';
import type { Role } from '@/types';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';

const schema = z.object({
  email: z.string().trim().email('Please enter a valid email address.'),
  password: z.string().min(1, 'Please enter your password.'),
});
type FormValues = z.infer<typeof schema>;

const portalConfig: Record<
  Role,
  {
    eyebrow: string;
    title: string;
    accent: string;
    copy: string;
    demoEmail: string;
    dashboard: string;
    companion: { label: string; to: string };
    notice: string;
  }
> = {
  PATIENT: {
    eyebrow: 'Your private space',
    title: 'Welcome back.',
    accent: 'You set the pace.',
    copy: 'Sign in to view appointments, secure consultation rooms, documents, prescriptions and your Naya conversations.',
    demoEmail: 'patient@nayacura.demo',
    dashboard: '/dashboard',
    companion: { label: 'Professional sign in', to: '/doctor/login' },
    notice: 'Patient accounts can see only their own records.',
  },
  DOCTOR: {
    eyebrow: 'Professional access',
    title: 'Clinician sign in.',
    accent: 'Verified accounts only.',
    copy: 'Access today’s appointments, availability, consultation rooms and clinical records for your own patients.',
    demoEmail: 'doctor@nayacura.demo',
    dashboard: '/doctor',
    companion: { label: 'Patient sign in', to: '/login' },
    notice: 'Clinical tools require verified professional status.',
  },
  ADMIN: {
    eyebrow: 'Administration',
    title: 'Admin console.',
    accent: 'Least privilege access.',
    copy: 'Credential workflows, platform operations, payment records and audit events. Clinical notes are restricted by default.',
    demoEmail: 'admin@nayacura.demo',
    dashboard: '/admin',
    companion: { label: 'Patient sign in', to: '/login' },
    notice: 'Administrators do not automatically receive clinical notes.',
  },
};

export function LoginPortal({ role }: { role: Role }) {
  const { login, user, loading } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { push } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const config = portalConfig[role];

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  });

  useEffect(() => {
    if (!loading && user) {
      const target =
        user.role === 'PATIENT' ? '/dashboard' : user.role === 'DOCTOR' ? '/doctor' : '/admin';
      navigate(safeNext(params.get('next'), target), { replace: true });
    }
  }, [user, loading, navigate, params]);

  async function onSubmit(values: FormValues) {
    setError(null);
    try {
      const account = await login({ ...values, role });
      push({ title: 'Signed in securely', tone: 'success' });
      navigate(
        safeNext(
          params.get('next'),
          account.role === 'PATIENT'
            ? '/dashboard'
            : account.role === 'DOCTOR'
              ? '/doctor'
              : '/admin',
        ),
        { replace: true },
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed. Please try again.');
    }
  }

  function fillDemo() {
    setValue('email', config.demoEmail);
    setValue('password', 'Nayacura@2026');
    setError(null);
  }

  return (
    <div>
      <div className="mb-7 flex flex-wrap items-center gap-2">
        <Badge tone={role === 'PATIENT' ? 'rose' : role === 'DOCTOR' ? 'lavender' : 'burgundy'}>
          {role === 'PATIENT' ? 'Patient' : role === 'DOCTOR' ? 'Clinician' : 'Administrator'}
        </Badge>
        <span className="font-body text-[9px] text-mauve">Development demo</span>
      </div>
      <p className="eyebrow mb-4">{config.eyebrow}</p>
      <h1 className="display text-[clamp(2.7rem,5vw,4.1rem)]">
        {config.title} <span className="display-soft">{config.accent}</span>
      </h1>
      <p className="mt-4 font-body text-[12.5px] leading-[1.8] text-mauve">{config.copy}</p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4" noValidate>
        {error && (
          <div role="alert" className="rounded-xl border border-rose/25 bg-burgundy/25 px-4 py-3">
            <p className="font-body text-[11px] leading-relaxed text-ivory/75">{error}</p>
          </div>
        )}
        <div>
          <label htmlFor={`${role}-email`} className="label-premium">
            Email address
          </label>
          <input
            id={`${role}-email`}
            type="email"
            autoComplete="email"
            className="input-premium"
            placeholder="you@example.com"
            {...register('email')}
          />
          {errors.email && <p className="mt-1.5 font-body text-[10px] text-rose">{errors.email.message}</p>}
        </div>
        <div>
          <div className="mb-2 flex items-center justify-between">
            <label htmlFor={`${role}-password`} className="label-premium mb-0">
              Password
            </label>
            <Link
              to="/forgot-password"
              className="font-body text-[9.5px] text-lavender transition-colors hover:text-rose"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <input
              id={`${role}-password`}
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              className="input-premium pr-11"
              placeholder="Your password"
              {...register('password')}
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-mauve transition-colors hover:text-ivory"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && <p className="mt-1.5 font-body text-[10px] text-rose">{errors.password.message}</p>}
        </div>

        <Button type="submit" size="lg" loading={isSubmitting} className="w-full" arrow>
          Sign in securely
        </Button>
      </form>

      <div className="mt-5 flex items-start gap-3 rounded-2xl border border-lavender/15 bg-lavender/[0.04] p-3.5">
        <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-lavender" />
        <div className="min-w-0 flex-1">
          <p className="font-sans text-[10px] font-semibold text-ivory">Demo account</p>
          <p className="mt-0.5 break-all font-body text-[9.5px] text-mauve">
            {config.demoEmail} · Nayacura@2026
          </p>
        </div>
        <button
          type="button"
          onClick={fillDemo}
          className="shrink-0 rounded-full border border-lavender/25 px-2.5 py-1 font-sans text-[8px] font-semibold uppercase tracking-wider text-lavender hover:bg-lavender/10"
        >
          Fill
        </button>
      </div>

      {role === 'PATIENT' ? (
        <p className="mt-6 text-center font-body text-[11px] text-mauve">
          New to Nayacura?{' '}
          <Link to="/register" className="font-sans font-semibold text-lavender hover:text-rose">
            Create a private account <ArrowRight className="inline h-3 w-3" />
          </Link>
        </p>
      ) : (
        <p className="mt-6 text-center font-body text-[11px] text-mauve">
          Not a {role === 'DOCTOR' ? 'clinician' : 'administrator'}?{' '}
          <Link to="/login" className="font-sans font-semibold text-lavender hover:text-rose">
            Patient sign in
          </Link>
        </p>
      )}

      <div className="mt-7 flex flex-col gap-2 border-t border-white/[0.07] pt-5">
        <p className="flex items-center gap-1.5 font-body text-[9px] text-mauve/60">
          <ShieldCheck className="h-3 w-3 shrink-0 text-lavender" />
          {config.notice}
        </p>
        <div className="flex flex-wrap items-center gap-4">
          <Link
            to={config.companion.to}
            className="font-body text-[9.5px] text-mauve transition-colors hover:text-ivory"
          >
            {config.companion.label}
          </Link>
          <Link
            to="/admin/login"
            className="font-body text-[9.5px] text-mauve/50 transition-colors hover:text-ivory"
          >
            Admin access
          </Link>
          <span className="inline-flex items-center gap-1 font-body text-[9px] text-mauve/40">
            <LockKeyhole className="h-2.5 w-2.5" /> Sessions expire
          </span>
        </div>
      </div>
    </div>
  );
}
