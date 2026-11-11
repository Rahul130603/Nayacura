import { FlaskConical } from 'lucide-react';
import { cn } from '@/lib/utils';

export function DemoNotice({
  children,
  className,
  compact,
}: {
  children?: React.ReactNode;
  className?: string;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-2xl border border-lavender/15 bg-lavender/[0.045] px-4 py-3',
        compact && 'items-center px-3 py-2',
        className,
      )}
    >
      <FlaskConical className="mt-0.5 h-4 w-4 shrink-0 text-lavender" aria-hidden />
      <p className="font-body text-[11.5px] leading-relaxed text-mauve">
        {children || (
          <>
            <strong className="font-semibold text-lavender">Development demo.</strong> Profiles,
            availability, reviews and clinical content are illustrative. No real clinicians,
            clinics, medical credentials or patient outcomes are represented.
          </>
        )}
      </p>
    </div>
  );
}
