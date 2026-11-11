import { Seo } from '@/components/Seo';
import { LoginPortal } from '@/components/auth/LoginPortal';

export default function Login() {
  return (
    <>
      <Seo
        title="Patient Sign In"
        description="Sign in to your private Nayacura patient account to manage appointments, documents and consultations."
        path="/login"
        noIndex
      />
      <LoginPortal role="PATIENT" />
    </>
  );
}
