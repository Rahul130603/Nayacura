import { Navigate, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '@/context/AuthContext';
import { PageLoader } from '@/components/ui/States';
import type { Role } from '@/types';
import { Link } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';

const portalPath: Record<Role, string> = {
  PATIENT: '/login',
  DOCTOR: '/doctor/login',
  ADMIN: '/admin/login',
};

const dashboardPath: Record<Role, string> = {
  PATIENT: '/dashboard',
  DOCTOR: '/doctor',
  ADMIN: '/admin',
};

export function ProtectedRoute({ role, children }: { role: Role; children: ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <PageLoader label="Verifying your private session" />;
  if (!user) {
    const next = `${location.pathname}${location.search}`;
    return <Navigate to={`${portalPath[role]}?next=${encodeURIComponent(next)}`} replace />;
  }
  if (user.role !== role) {
    return (
      <div className="grid min-h-screen place-items-center bg-midnight px-5">
        <div className="max-w-md text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-full border border-rose/25 bg-rose/10 text-rose">
            <ShieldAlert className="h-6 w-6" />
          </span>
          <h1 className="display mt-6 text-4xl">This space is not for this account.</h1>
          <p className="mt-3 font-body text-[12px] leading-relaxed text-mauve">
            You are signed in as a {user.role.toLowerCase()}. Role-based access keeps patient,
            clinician and administrative areas separate.
          </p>
          <Link
            to={dashboardPath[user.role]}
            className="mt-6 inline-flex min-h-11 items-center rounded-full bg-gradient-to-r from-rose to-lavender px-6 font-sans text-[11px] font-semibold text-midnight"
          >
            Go to my dashboard
          </Link>
        </div>
      </div>
    );
  }
  return <>{children}</>;
}
