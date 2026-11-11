import { Seo } from '@/components/Seo';
import { LoginPortal } from '@/components/auth/LoginPortal';

export default function DoctorLogin() {
  return (
    <>
      <Seo
        title="Clinician Sign In"
        description="Verified professional sign-in for the Nayacura clinician dashboard."
        path="/doctor/login"
        noIndex
      />
      <LoginPortal role="DOCTOR" />
    </>
  );
}
