import { Seo } from '@/components/Seo';
import { LoginPortal } from '@/components/auth/LoginPortal';

export default function AdminLogin() {
  return (
    <>
      <Seo
        title="Administrator Sign In"
        description="Least-privilege administrative access to the Nayacura development platform."
        path="/admin/login"
        noIndex
      />
      <LoginPortal role="ADMIN" />
    </>
  );
}
