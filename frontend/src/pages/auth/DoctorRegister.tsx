import { useState, useRef, type FormEvent, type ChangeEvent, type DragEvent } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  Award,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  FileCheck,
  FileText,
  FileUp,
  Globe,
  GraduationCap,
  Lock,
  Mail,
  MapPin,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  User,
  X,
} from 'lucide-react';
import { Seo } from '@/components/Seo';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { api, ApiError } from '@/lib/api';
import { cn } from '@/lib/utils';

const currentYear = new Date().getFullYear();

function encodeDocument(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1]);
    reader.onerror = () => reject(new Error('Could not read the selected PDF file. Please select it again.'));
    reader.readAsDataURL(file);
  });
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

interface DocumentUploadProps {
  id: string;
  name: string;
  label: string;
  required?: boolean;
  help?: string;
  file: File | null;
  error?: string;
  disabled?: boolean;
  onFileChange: (file: File | null) => void;
}

function DocumentUploadCard({
  id,
  name,
  label,
  required = false,
  help,
  file,
  error,
  disabled = false,
  onFileChange,
}: DocumentUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFile(selectedFile: File | undefined) {
    if (!selectedFile) return;
    if (!/\.pdf$/i.test(selectedFile.name)) {
      onFileChange(null);
      return;
    }
    onFileChange(selectedFile);
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) handleFile(dropped);
  }

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const chosen = e.target.files?.[0];
    if (chosen) handleFile(chosen);
  }

  function handleRemove() {
    onFileChange(null);
    if (inputRef.current) inputRef.current.value = '';
  }

  return (
    <div className="flex-1 space-y-1.5">
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="font-sans text-[11px] font-semibold uppercase tracking-[0.14em] text-mauve flex items-center gap-1.5">
          <span>{label}</span>
          {required ? (
            <span className="text-rose text-xs" title="Required">*</span>
          ) : (
            <span className="text-mauve/60 text-[10px] lowercase font-normal">(optional)</span>
          )}
        </label>
        {file && (
          <span className="text-[11px] font-medium text-lavender flex items-center gap-1">
            <CheckCircle2 className="h-3.5 w-3.5" /> PDF attached
          </span>
        )}
      </div>

      <input
        ref={inputRef}
        id={id}
        name={name}
        type="file"
        accept=".pdf,application/pdf"
        disabled={disabled}
        required={required && !file}
        className="sr-only"
        onChange={handleChange}
      />

      {file ? (
        <div className="flex items-center justify-between rounded-xl border border-lavender/30 bg-white/[0.04] p-3.5 transition-all hover:border-lavender/50">
          <div className="flex items-center gap-3 min-w-0 pr-2">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-lavender/30 bg-lavender/10 text-lavender">
              <FileCheck className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="truncate font-sans text-xs font-semibold text-ivory">{file.name}</p>
              <p className="font-sans text-[11px] text-mauve">{formatFileSize(file.size)} · Valid PDF</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleRemove}
            disabled={disabled}
            className="rounded p-1.5 text-mauve transition-colors hover:bg-rose/10 hover:text-rose"
            title="Remove file"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div
          role="button"
          tabIndex={0}
          onClick={() => !disabled && inputRef.current?.click()}
          onKeyDown={(e) => {
            if ((e.key === 'Enter' || e.key === ' ') && !disabled) {
              e.preventDefault();
              inputRef.current?.click();
            }
          }}
          onDragOver={(e) => {
            e.preventDefault();
            if (!disabled) setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={cn(
            'flex cursor-pointer items-center justify-center gap-3.5 rounded-xl border border-dashed p-4 text-center transition-all duration-200',
            isDragging
              ? 'border-lavender bg-royal/20 scale-[1.01]'
              : error
                ? 'border-rose/50 bg-burgundy/10'
                : 'border-white/15 bg-white/[0.025] hover:border-lavender/40 hover:bg-white/[0.05]',
            disabled && 'cursor-not-allowed opacity-60'
          )}
        >
          <div className="grid h-8 w-8 place-items-center rounded-lg border border-white/10 bg-white/[0.04] text-lavender shrink-0">
            <FileUp className="h-4 w-4" />
          </div>
          <div className="text-left">
            <p className="font-sans text-xs font-medium text-ivory">
              Click to upload or drag & drop PDF
            </p>
            <p className="font-sans text-[10px] text-mauve/70">
              PDF format only · Maximum file size 2 MB
            </p>
          </div>
        </div>
      )}

      {error ? (
        <p className="mt-1 flex items-center gap-1 text-[11px] text-rose font-medium">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" /> {error}
        </p>
      ) : help ? (
        <p className="mt-1 text-[10px] text-mauve/60 truncate">{help}</p>
      ) : null}
    </div>
  );
}

export default function DoctorRegister() {
  const [receipt, setReceipt] = useState<{
    acknowledgementSent: boolean;
    name?: string;
    email?: string;
  } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  const [certFile, setCertFile] = useState<File | null>(null);
  const [resumeFile, setResumeFile] = useState<File | null>(null);

  const specialties = useQuery({
    queryKey: ['doctor-application-specialties'],
    queryFn: () => api<{ specializations: { slug: string; name: string }[] }>('/doctors/filters'),
  });

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    const form = new FormData(event.currentTarget);
    const body = Object.fromEntries(form);

    const activeCertFile = certFile || (form.get('registrationCertificate') as File | null);
    const activeResumeFile = resumeFile || (form.get('resume') as File | null);

    setSubmitting(true);
    setError('');
    setFieldErrors({});

    try {
      const errors: Record<string, string[]> = {};

      if (!activeCertFile || activeCertFile.size === 0) {
        errors.registrationCertificate = ['Registration certificate PDF is required.'];
      } else if (activeCertFile.size > 2 * 1024 * 1024 || !/\.pdf$/i.test(activeCertFile.name)) {
        errors.registrationCertificate = ['Please choose a valid PDF file up to 2 MB.'];
      }

      if (activeResumeFile && activeResumeFile.size > 0) {
        if (activeResumeFile.size > 2 * 1024 * 1024 || !/\.pdf$/i.test(activeResumeFile.name)) {
          errors.resume = ['Please choose a valid PDF file up to 2 MB.'];
        }
      }

      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors);
        setSubmitting(false);
        return;
      }

      const encodedCert = activeCertFile ? await encodeDocument(activeCertFile) : undefined;
      const encodedResume = activeResumeFile && activeResumeFile.size > 0 ? await encodeDocument(activeResumeFile) : undefined;

      const response = await api<{ acknowledgementSent: boolean }>('/auth/doctor-applications', {
        method: 'POST',
        body: {
          ...body,
          graduationYear: Number(body.graduationYear),
          experienceYears: Number(body.experienceYears),
          languages: String(body.languages)
            .split(',')
            .map((language) => language.trim())
            .filter(Boolean),
          consent: form.has('consent'),
          registrationCertificate: encodedCert,
          resume: encodedResume,
        },
      });

      setReceipt({
        acknowledgementSent: response.acknowledgementSent,
        name: String(body.name || ''),
        email: String(body.email || ''),
      });
    } catch (cause) {
      if (cause instanceof ApiError && cause.code === 'VALIDATION_ERROR') {
        setFieldErrors((cause.details ?? {}) as Record<string, string[]>);
      }
      setError(
        cause instanceof ApiError && cause.status === 409
          ? 'A clinician account or pending application already exists with this email address.'
          : cause instanceof Error
            ? cause.message
            : 'Could not submit your application. Please verify your details.'
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Seo
        title="Clinician Application · Medical Board Onboarding"
        description="Apply to join Nayacura's network of verified medical specialists."
        path="/doctor/register"
        noIndex
      />

      {receipt ? (
        <div className="card-surface p-8 sm:p-10 space-y-6 animate-fade-up max-w-xl mx-auto my-auto text-center">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full border border-lavender/40 bg-royal/20 text-lavender shadow-glow">
            <ShieldCheck className="h-8 w-8 text-lavender" />
          </div>
          <div>
            <Badge tone="lavender" dot className="mx-auto mb-2">
              Application Under Review
            </Badge>
            <h1 className="display text-3xl sm:text-4xl text-ivory">
              Application Received
            </h1>
            <p className="mt-2 font-body text-sm leading-relaxed text-mauve max-w-md mx-auto">
              Thank you{receipt.name ? `, ${receipt.name}` : ''}. Your qualifications and credentials have been securely submitted to the Nayacura Medical Review Board.
            </p>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5 text-left space-y-3.5">
            <h2 className="font-sans text-xs font-semibold uppercase tracking-[0.16em] text-lavender">
              Verification Next Steps
            </h2>
            <div className="space-y-3 text-xs text-mauve">
              <div className="flex items-start gap-3">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-lavender/20 text-lavender font-bold text-xs">1</span>
                <div>
                  <p className="font-semibold text-ivory text-xs">Submission Logged</p>
                  <p className="text-[11px] text-mauve/80">{receipt.acknowledgementSent ? 'A confirmation email has been dispatched to your inbox.' : 'Logged securely in verification queue.'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-lavender/20 text-lavender font-bold text-xs">2</span>
                <div>
                  <p className="font-semibold text-ivory text-xs">Medical Council & License Check</p>
                  <p className="text-[11px] text-mauve/80">Turnaround completed within 24–48 business hours by our vetting committee.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-lavender/20 text-lavender font-bold text-xs">3</span>
                <div>
                  <p className="font-semibold text-ivory text-xs">Clinician Portal Invitation</p>
                  <p className="text-[11px] text-mauve/80">Invitation link to set up your password and consultation availability.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3 pt-2">
            <ButtonLink to="/doctor/login" variant="primary" size="md">
              Go to Clinician Sign-In
            </ButtonLink>
            <ButtonLink to="/" variant="secondary" size="md">
              Return to Site
            </ButtonLink>
          </div>
        </div>
      ) : (
        <div className="w-full space-y-4">
          {/* Header Row: Generous & Premium */}
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-2 pb-2 border-b border-white/[0.07]">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge tone="lavender" dot>
                  Clinician Onboarding
                </Badge>
                <span className="text-xs font-sans text-mauve/70">Strictly Confidential</span>
              </div>
              <h1 className="display text-2xl sm:text-3xl text-ivory">
                Apply as a <span className="display-soft">Clinician</span>
              </h1>
              <p className="mt-1 font-body text-xs sm:text-[13px] text-mauve">
                Submit your verified credentials to establish your private practice on Nayacura.
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs font-sans text-mauve/70 pb-1">
              <span className="flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5 text-lavender" /> 256-Bit Encrypted
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-lavender" /> Medical Board Vetted
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-rose" /> 24–48h Review
              </span>
            </div>
          </div>

          {error && (
            <div
              role="alert"
              className="flex items-center gap-2.5 rounded-xl border border-rose/30 bg-burgundy/25 px-4 py-3 text-ivory text-xs shadow-rose"
            >
              <AlertCircle className="h-4 w-4 shrink-0 text-rose" />
              <p className="text-ivory/90">{error}</p>
            </div>
          )}

          <form onSubmit={submit} className="space-y-4" noValidate>
            {/* 2-Column Balanced Dashboard Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-5">
              {/* Column 1: Profile & Academic Credentials */}
              <div className="space-y-4">
                {/* 01. Profile & Contact Card */}
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5 space-y-3.5 shadow-card">
                  <div className="flex items-center gap-2 border-b border-white/[0.08] pb-2.5">
                    <User className="h-4 w-4 text-lavender" />
                    <h2 className="font-sans text-xs font-semibold uppercase tracking-[0.14em] text-ivory">
                      01. Professional Profile & Contact
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="application-name" className="mb-1.5 block font-sans text-[11px] font-semibold uppercase tracking-[0.12em] text-mauve">
                        Full Name <span className="text-rose">*</span>
                      </label>
                      <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-mauve/60">
                          <User className="h-4 w-4" />
                        </div>
                        <input
                          id="application-name"
                          name="name"
                          type="text"
                          autoComplete="name"
                          maxLength={80}
                          required
                          placeholder="e.g. Dr. Maya Sharma, MD"
                          className="w-full rounded-xl border border-white/10 bg-white/[0.045] pl-9 pr-3 py-2.5 font-body text-xs sm:text-[13px] text-ivory placeholder:text-mauve/50 transition-all hover:border-white/20 focus:border-lavender/60 focus:bg-white/[0.065] focus:outline-none"
                          aria-invalid={Boolean(fieldErrors.name)}
                        />
                      </div>
                      {fieldErrors.name && (
                        <p className="mt-1 text-xs text-rose">{fieldErrors.name[0]}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="application-email" className="mb-1.5 block font-sans text-[11px] font-semibold uppercase tracking-[0.12em] text-mauve">
                        Professional Email <span className="text-rose">*</span>
                      </label>
                      <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-mauve/60">
                          <Mail className="h-4 w-4" />
                        </div>
                        <input
                          id="application-email"
                          name="email"
                          type="email"
                          autoComplete="email"
                          maxLength={254}
                          required
                          placeholder="doctor@hospital.org"
                          className="w-full rounded-xl border border-white/10 bg-white/[0.045] pl-9 pr-3 py-2.5 font-body text-xs sm:text-[13px] text-ivory placeholder:text-mauve/50 transition-all hover:border-white/20 focus:border-lavender/60 focus:bg-white/[0.065] focus:outline-none"
                          aria-invalid={Boolean(fieldErrors.email)}
                        />
                      </div>
                      {fieldErrors.email && (
                        <p className="mt-1 text-xs text-rose">{fieldErrors.email[0]}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="application-city" className="mb-1.5 block font-sans text-[11px] font-semibold uppercase tracking-[0.12em] text-mauve">
                        City of Practice <span className="text-rose">*</span>
                      </label>
                      <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-mauve/60">
                          <MapPin className="h-4 w-4" />
                        </div>
                        <input
                          id="application-city"
                          name="city"
                          type="text"
                          autoComplete="address-level2"
                          maxLength={100}
                          required
                          placeholder="e.g. Chennai, Tamil Nadu"
                          className="w-full rounded-xl border border-white/10 bg-white/[0.045] pl-9 pr-3 py-2.5 font-body text-xs sm:text-[13px] text-ivory placeholder:text-mauve/50 transition-all hover:border-white/20 focus:border-lavender/60 focus:bg-white/[0.065] focus:outline-none"
                          aria-invalid={Boolean(fieldErrors.city)}
                        />
                      </div>
                      {fieldErrors.city && (
                        <p className="mt-1 text-xs text-rose">{fieldErrors.city[0]}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="application-languages" className="mb-1.5 block font-sans text-[11px] font-semibold uppercase tracking-[0.12em] text-mauve">
                        Consultation Languages <span className="text-rose">*</span>
                      </label>
                      <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-mauve/60">
                          <Globe className="h-4 w-4" />
                        </div>
                        <input
                          id="application-languages"
                          name="languages"
                          type="text"
                          maxLength={410}
                          required
                          placeholder="e.g. English, Tamil, Hindi"
                          className="w-full rounded-xl border border-white/10 bg-white/[0.045] pl-9 pr-3 py-2.5 font-body text-xs sm:text-[13px] text-ivory placeholder:text-mauve/50 transition-all hover:border-white/20 focus:border-lavender/60 focus:bg-white/[0.065] focus:outline-none"
                          aria-invalid={Boolean(fieldErrors.languages)}
                        />
                      </div>
                      {fieldErrors.languages && (
                        <p className="mt-1 text-xs text-rose">{fieldErrors.languages[0]}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* 02. Specialty & Degree Card */}
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5 space-y-3.5 shadow-card">
                  <div className="flex items-center gap-2 border-b border-white/[0.08] pb-2.5">
                    <Stethoscope className="h-4 w-4 text-lavender" />
                    <h2 className="font-sans text-xs font-semibold uppercase tracking-[0.14em] text-ivory">
                      02. Medical Specialty & Academic Degrees
                    </h2>
                  </div>

                  <div>
                    <label htmlFor="application-specialization" className="mb-1.5 block font-sans text-[11px] font-semibold uppercase tracking-[0.12em] text-mauve">
                      Primary Clinical Specialty <span className="text-rose">*</span>
                    </label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-mauve/60">
                        <Stethoscope className="h-4 w-4" />
                      </div>
                      <select
                        id="application-specialization"
                        name="specialization"
                        className="w-full rounded-xl border border-white/10 bg-white/[0.045] pl-9 pr-8 py-2.5 font-body text-xs sm:text-[13px] text-ivory appearance-none cursor-pointer transition-all hover:border-white/20 focus:border-lavender/60 focus:bg-white/[0.065] focus:outline-none"
                        defaultValue=""
                        required
                        aria-invalid={Boolean(fieldErrors.specialization)}
                      >
                        <option value="" disabled>
                          {specialties.isPending ? 'Loading clinical specialties…' : 'Choose primary specialty'}
                        </option>
                        {specialties.data?.specializations.map(({ slug, name }) => (
                          <option key={slug} value={slug} className="bg-plum text-ivory py-2">
                            {name}
                          </option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5 text-xs text-mauve">
                        ▼
                      </div>
                    </div>
                    {specialties.isError && (
                      <button
                        type="button"
                        className="mt-1.5 text-xs text-rose underline flex items-center gap-1"
                        onClick={() => void specialties.refetch()}
                      >
                        <RotateCcw className="h-3 w-3" /> Could not load specialties. Retry
                      </button>
                    )}
                    {fieldErrors.specialization && (
                      <p className="mt-1 text-xs text-rose">{fieldErrors.specialization[0]}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="application-qualification" className="mb-1.5 block font-sans text-[11px] font-semibold uppercase tracking-[0.12em] text-mauve">
                        Highest Qualification <span className="text-rose">*</span>
                      </label>
                      <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-mauve/60">
                          <GraduationCap className="h-4 w-4" />
                        </div>
                        <input
                          id="application-qualification"
                          name="qualification"
                          type="text"
                          maxLength={150}
                          required
                          placeholder="e.g. MBBS, MD (Psychiatry), DNB"
                          className="w-full rounded-xl border border-white/10 bg-white/[0.045] pl-9 pr-3 py-2.5 font-body text-xs sm:text-[13px] text-ivory placeholder:text-mauve/50 transition-all hover:border-white/20 focus:border-lavender/60 focus:bg-white/[0.065] focus:outline-none"
                          aria-invalid={Boolean(fieldErrors.qualification)}
                        />
                      </div>
                      {fieldErrors.qualification && (
                        <p className="mt-1 text-xs text-rose">{fieldErrors.qualification[0]}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="application-institution" className="mb-1.5 block font-sans text-[11px] font-semibold uppercase tracking-[0.12em] text-mauve">
                        University or Institution <span className="text-rose">*</span>
                      </label>
                      <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-mauve/60">
                          <Building2 className="h-4 w-4" />
                        </div>
                        <input
                          id="application-institution"
                          name="institution"
                          type="text"
                          maxLength={150}
                          required
                          placeholder="e.g. Madras Medical College / AIIMS"
                          className="w-full rounded-xl border border-white/10 bg-white/[0.045] pl-9 pr-3 py-2.5 font-body text-xs sm:text-[13px] text-ivory placeholder:text-mauve/50 transition-all hover:border-white/20 focus:border-lavender/60 focus:bg-white/[0.065] focus:outline-none"
                          aria-invalid={Boolean(fieldErrors.institution)}
                        />
                      </div>
                      {fieldErrors.institution && (
                        <p className="mt-1 text-xs text-rose">{fieldErrors.institution[0]}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="application-graduationYear" className="mb-1.5 block font-sans text-[11px] font-semibold uppercase tracking-[0.12em] text-mauve">
                        Graduation Year <span className="text-rose">*</span>
                      </label>
                      <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-mauve/60">
                          <Calendar className="h-4 w-4" />
                        </div>
                        <input
                          id="application-graduationYear"
                          name="graduationYear"
                          type="number"
                          min={1950}
                          max={currentYear}
                          required
                          placeholder="e.g. 2018"
                          className="w-full rounded-xl border border-white/10 bg-white/[0.045] pl-9 pr-3 py-2.5 font-body text-xs sm:text-[13px] text-ivory placeholder:text-mauve/50 transition-all hover:border-white/20 focus:border-lavender/60 focus:bg-white/[0.065] focus:outline-none"
                          aria-invalid={Boolean(fieldErrors.graduationYear)}
                        />
                      </div>
                      {fieldErrors.graduationYear && (
                        <p className="mt-1 text-xs text-rose">{fieldErrors.graduationYear[0]}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="application-experienceYears" className="mb-1.5 block font-sans text-[11px] font-semibold uppercase tracking-[0.12em] text-mauve">
                        Years of Experience <span className="text-rose">*</span>
                      </label>
                      <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-mauve/60">
                          <Clock className="h-4 w-4" />
                        </div>
                        <input
                          id="application-experienceYears"
                          name="experienceYears"
                          type="number"
                          min={0}
                          max={75}
                          required
                          placeholder="e.g. 8"
                          className="w-full rounded-xl border border-white/10 bg-white/[0.045] pl-9 pr-3 py-2.5 font-body text-xs sm:text-[13px] text-ivory placeholder:text-mauve/50 transition-all hover:border-white/20 focus:border-lavender/60 focus:bg-white/[0.065] focus:outline-none"
                          aria-invalid={Boolean(fieldErrors.experienceYears)}
                        />
                      </div>
                      {fieldErrors.experienceYears && (
                        <p className="mt-1 text-xs text-rose">{fieldErrors.experienceYears[0]}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Column 2: Council, Documents & Submission */}
              <div className="space-y-4">
                {/* 03. Medical Council Registration Card */}
                <div className="rounded-2xl border border-lavender/25 bg-gradient-to-br from-plum/40 via-midnight/50 to-midnight p-4 sm:p-5 space-y-3.5 shadow-card">
                  <div className="flex items-center gap-2 border-b border-white/[0.08] pb-2.5">
                    <ShieldCheck className="h-4 w-4 text-lavender" />
                    <h2 className="font-sans text-xs font-semibold uppercase tracking-[0.14em] text-ivory">
                      03. Medical Council Registration
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="application-council" className="mb-1.5 block font-sans text-[11px] font-semibold uppercase tracking-[0.12em] text-mauve">
                        Registration Council <span className="text-rose">*</span>
                      </label>
                      <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-mauve/60">
                          <Award className="h-4 w-4" />
                        </div>
                        <input
                          id="application-council"
                          name="council"
                          type="text"
                          maxLength={150}
                          required
                          placeholder="e.g. Tamil Nadu Medical Council / NMC"
                          className="w-full rounded-xl border border-white/10 bg-white/[0.045] pl-9 pr-3 py-2.5 font-body text-xs sm:text-[13px] text-ivory placeholder:text-mauve/50 transition-all hover:border-white/20 focus:border-lavender/60 focus:bg-white/[0.065] focus:outline-none"
                          aria-invalid={Boolean(fieldErrors.council)}
                        />
                      </div>
                      <p className="mt-1 text-[10px] text-mauve/70">As printed on your council certificate.</p>
                      {fieldErrors.council && (
                        <p className="mt-1 text-xs text-rose">{fieldErrors.council[0]}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="application-registrationNumber" className="mb-1.5 block font-sans text-[11px] font-semibold uppercase tracking-[0.12em] text-mauve">
                        Registration / License # <span className="text-rose">*</span>
                      </label>
                      <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-mauve/60">
                          <FileText className="h-4 w-4" />
                        </div>
                        <input
                          id="application-registrationNumber"
                          name="registrationNumber"
                          type="text"
                          maxLength={100}
                          required
                          placeholder="e.g. TNMC-84920"
                          className="w-full rounded-xl border border-white/10 bg-white/[0.045] pl-9 pr-3 py-2.5 font-body text-xs sm:text-[13px] text-ivory placeholder:text-mauve/50 transition-all hover:border-white/20 focus:border-lavender/60 focus:bg-white/[0.065] focus:outline-none"
                          aria-invalid={Boolean(fieldErrors.registrationNumber)}
                        />
                      </div>
                      <p className="mt-1 text-[10px] text-mauve/70">Official council registration number.</p>
                      {fieldErrors.registrationNumber && (
                        <p className="mt-1 text-xs text-rose">{fieldErrors.registrationNumber[0]}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* 04. Credentialing Documents Upload Card */}
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5 space-y-3.5 shadow-card">
                  <div className="flex items-center gap-2 border-b border-white/[0.08] pb-2.5">
                    <FileText className="h-4 w-4 text-lavender" />
                    <h2 className="font-sans text-xs font-semibold uppercase tracking-[0.14em] text-ivory">
                      04. Credential Verification Documents (PDF)
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <DocumentUploadCard
                      id="application-registrationCertificate"
                      name="registrationCertificate"
                      label="Council Certificate"
                      required
                      help="Upload registration certificate showing the council and number."
                      file={certFile}
                      error={fieldErrors.registrationCertificate?.[0]}
                      disabled={submitting}
                      onFileChange={setCertFile}
                    />

                    <DocumentUploadCard
                      id="application-resume"
                      name="resume"
                      label="Curriculum Vitae"
                      help="Recommended to showcase clinical expertise & training."
                      file={resumeFile}
                      error={fieldErrors.resume?.[0]}
                      disabled={submitting}
                      onFileChange={setResumeFile}
                    />
                  </div>
                </div>

                {/* 05. Declaration, Action & Trust Footnote */}
                <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4 sm:p-5 space-y-3.5 shadow-card">
                  <label htmlFor="application-consent" className="flex items-start gap-3 cursor-pointer select-none">
                    <input
                      id="application-consent"
                      type="checkbox"
                      name="consent"
                      required
                      className="mt-0.5 h-4 w-4 rounded border-white/20 bg-white/5 accent-lavender focus:ring-lavender"
                    />
                    <span className="font-body text-xs leading-relaxed text-mauve">
                      I solemnly affirm that all submitted credentials, medical qualifications, and council registration details are active, accurate, and unencumbered. I consent to credential verification under the{' '}
                      <Link to="/legal/privacy" className="text-lavender underline hover:text-ivory">Privacy Policy</Link> and{' '}
                      <Link to="/legal/terms" className="text-lavender underline hover:text-ivory">Terms of Practice</Link>.
                    </span>
                  </label>
                  {fieldErrors.consent && (
                    <p className="text-xs text-rose flex items-center gap-1 pl-7">
                      <AlertCircle className="h-3.5 w-3.5" /> Please confirm the declaration to proceed.
                    </p>
                  )}

                  <div className="flex flex-col sm:flex-row items-center gap-3 pt-1">
                    <Button
                      type="submit"
                      size="lg"
                      loading={submitting}
                      disabled={submitting || !specialties.data?.specializations.length}
                      className="w-full sm:flex-1 text-xs sm:text-[13px] font-semibold tracking-wide min-h-[48px]"
                      icon={<ShieldCheck className="h-4 w-4" />}
                    >
                      {submitting ? 'Submitting Application & Documents…' : 'Submit Clinician Application'}
                    </Button>
                    <Link
                      to="/doctor/login"
                      className="shrink-0 text-xs font-sans font-semibold text-lavender hover:text-rose transition-colors py-1.5 px-3"
                    >
                      Sign In instead →
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Clinician Standards & Trust Strip (Fills the viewport gracefully) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
              <div className="flex items-start gap-3 rounded-xl border border-white/[0.07] bg-white/[0.02] p-3 text-left">
                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-lavender/10 text-lavender">
                  <Stethoscope className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-sans text-[11px] font-semibold uppercase tracking-[0.1em] text-ivory">Clinical Autonomy</h3>
                  <p className="mt-0.5 font-body text-[10px] leading-relaxed text-mauve/80">
                    Establish your private consultation schedule, consultation fees, and practice parameters with full sovereignty.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-xl border border-white/[0.07] bg-white/[0.02] p-3 text-left">
                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-lavender/10 text-lavender">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-sans text-[11px] font-semibold uppercase tracking-[0.1em] text-ivory">Verified Peer Standards</h3>
                  <p className="mt-0.5 font-body text-[10px] leading-relaxed text-mauve/80">
                    Direct validation with official state medical registers ensures an elite collective of board-certified specialists.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-xl border border-white/[0.07] bg-white/[0.02] p-3 text-left">
                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-lavender/10 text-lavender">
                  <Lock className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-sans text-[11px] font-semibold uppercase tracking-[0.1em] text-ivory">Confidential Telehealth</h3>
                  <p className="mt-0.5 font-body text-[10px] leading-relaxed text-mauve/80">
                    Peer-to-peer encrypted video consultation suites engineered specifically for sensitive, high-trust adult medical care.
                  </p>
                </div>
              </div>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
