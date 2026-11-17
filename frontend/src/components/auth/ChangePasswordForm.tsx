import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { api, ApiError } from '@/lib/api';

export function ChangePasswordForm() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const form = new FormData(event.currentTarget);
    const password = form.get('password');
    if (password !== form.get('confirmation')) {
      setError('New passwords do not match.');
      return;
    }
    setError('');
    setBusy(true);
    try {
      await api('/auth/change-password', { method: 'POST', body: { currentPassword: form.get('currentPassword'), password } });
      window.location.assign('/doctor/login');
    } catch (cause) {
      const details = cause instanceof ApiError ? cause.details as { password?: string[] } | undefined : undefined;
      setError(details?.password?.[0] ?? (cause instanceof Error ? cause.message : 'Could not change your password.'));
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3 rounded-[22px] border border-white/[0.08] bg-white/[0.02] p-5">
      <h2 className="text-sm font-semibold text-ivory">Change password</h2>
      <p className="text-xs text-mauve">Use at least 10 characters, including a letter and a number. You’ll sign in again after saving.</p>
      {error && <p role="alert" className="text-xs text-rose">{error}</p>}
      <div>
        <label htmlFor="current-clinician-password" className="label-premium">Current password</label>
        <input id="current-clinician-password" name="currentPassword" type="password" autoComplete="current-password" maxLength={128} className="input-premium" required />
      </div>
      <div>
        <label htmlFor="new-clinician-password" className="label-premium">New password</label>
        <input id="new-clinician-password" name="password" type="password" autoComplete="new-password" minLength={10} maxLength={128} className="input-premium" required />
      </div>
      <div>
        <label htmlFor="confirm-clinician-password" className="label-premium">Confirm new password</label>
        <input id="confirm-clinician-password" name="confirmation" type="password" autoComplete="new-password" minLength={10} maxLength={128} className="input-premium" required />
      </div>
      <Button size="sm" type="submit" loading={busy} disabled={busy}>Save password</Button>
    </form>
  );
}
