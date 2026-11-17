import { useEffect, useId, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

type Notification = { id: string; title: string; body: string; readAt: string | null };

export function PatientNotifications({ unreadCount, section }: { unreadCount: number; section: string }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const headingId = useId();
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const client = useQueryClient();
  const { user } = useAuth();
  const { data, isPending, isError, refetch } = useQuery({
    queryKey: ['patient-notifications', user?.id],
    queryFn: () => api<{ notifications: Notification[] }>('/patient/notifications'),
    enabled: open && Boolean(user),
  });
  const markRead = useMutation({
    mutationFn: (id: string | null) => id
      ? api(`/patient/notifications/${encodeURIComponent(id)}/read`, { method: 'PATCH' })
      : api('/patient/notifications/read-all', { method: 'POST' }),
    onSuccess: async () => {
      await Promise.all([
        refetch(),
        client.invalidateQueries({ queryKey: ['patient-overview'] }),
      ]);
    },
  });

  useEffect(() => setOpen(false), [section]);

  useEffect(() => {
    if (!open) return;
    function closeOutside(event: Event) {
      if (event.target instanceof Node && !root.current?.contains(event.target)) setOpen(false);
    }
    document.addEventListener('pointerdown', closeOutside);
    document.addEventListener('focusin', closeOutside);
    return () => {
      document.removeEventListener('pointerdown', closeOutside);
      document.removeEventListener('focusin', closeOutside);
    };
  }, [open]);

  return (
    <div ref={root} onKeyDown={(event) => {
      if (open && event.key === 'Escape') {
        setOpen(false);
        trigger.current?.focus();
      }
    }}>
      <button
        ref={trigger}
        type="button"
        aria-label={unreadCount ? `Notifications, ${unreadCount} unread` : 'Notifications'}
        aria-controls={panelId}
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className="relative grid h-10 w-10 shrink-0 place-items-center rounded-full border border-white/10 bg-white/[0.03] text-lavender hover:border-lavender/30"
      >
        <Bell className="h-4 w-4" aria-hidden="true" />
        {unreadCount > 0 && <span aria-hidden="true" className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-rose" />}
      </button>
      <section id={panelId} aria-labelledby={headingId} hidden={!open}
        className="absolute right-4 top-full mt-2 w-[calc(100%-2rem)] max-w-sm rounded-2xl border border-white/10 bg-plum p-4 shadow-card sm:right-6 lg:right-8">
        <div className="flex items-center justify-between gap-3">
          <h2 id={headingId} className="text-sm font-semibold text-ivory">Notifications</h2>
          {unreadCount > 0 && (
            <button type="button" disabled={markRead.isPending} onClick={() => markRead.mutate(null)}
              className="shrink-0 rounded px-1 py-2 text-xs font-semibold text-lavender hover:text-rose disabled:opacity-50">
              Mark all read
            </button>
          )}
        </div>
        {markRead.isError && <p role="alert" className="mt-2 text-xs text-rose">Could not mark notifications as read. Try again.</p>}
        {isPending && <p role="status" className="mt-3 text-xs text-mauve">Loading notifications…</p>}
        {isError && <p role="alert" className="mt-3 text-xs text-rose">Could not load notifications. <button type="button" className="underline" onClick={() => void refetch()}>Retry</button></p>}
        {data && (data.notifications.length ? (
          <ul className="mt-2 max-h-[min(60dvh,26rem)] overflow-y-auto overscroll-contain [overflow-wrap:anywhere]">
            {data.notifications.map(({ id, title, body, readAt }) => (
              <li key={id} className="border-t border-white/[0.07]">
                <button type="button" aria-disabled={Boolean(readAt) || markRead.isPending}
                  onClick={() => { if (!readAt && !markRead.isPending) markRead.mutate(id); }}
                  className="flex w-full items-start gap-2.5 rounded-lg px-1 py-3 text-left hover:bg-white/[0.04]">
                  <span aria-hidden="true" className={cn('mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full', readAt ? 'bg-white/15' : 'bg-rose')} />
                  <span className="min-w-0">
                    {!readAt && <span className="sr-only">Unread: </span>}
                    <span className="block text-xs font-semibold text-ivory">{title}</span>
                    <span className="mt-1 block text-xs leading-relaxed text-mauve">{body}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : <p className="mt-3 text-xs text-mauve">No notifications yet.</p>)}
      </section>
    </div>
  );
}
