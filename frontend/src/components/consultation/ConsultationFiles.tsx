import { useCallback, useEffect, useState, type ChangeEvent } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';
import { Download, Upload } from 'lucide-react';
import { api, uploadMedicalDocument } from '@/lib/api';
import { formatDateTime } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';

export const clinicianPrescriptionCategory = 'CLINICIAN_PRESCRIPTION';

type SharedFile = {
  id: string;
  fileName: string;
  mimeType: string;
  category: string;
  createdAt: string;
};

export function DocumentDownload({ endpoint, fileName, previewImage = false }: { endpoint: string; fileName: string; previewImage?: boolean }) {
  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const { push } = useToast();
  const closePreview = useCallback(() => setPreviewUrl(null), []);
  useEffect(() => {
    if (previewUrl) return () => URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  async function openFile(preview: boolean) {
    setLoading(true);
    try {
      const response = await api<Response>(endpoint, { raw: true });
      const url = URL.createObjectURL(await response.blob());
      if (preview) {
        setPreviewUrl(url);
        return;
      }
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) {
      push({ title: 'Could not open file', description: error instanceof Error ? error.message : undefined, tone: 'error' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-wrap gap-1">
      {previewImage && (
        <Button type="button" size="sm" variant="ghost" disabled={loading} onClick={() => void openFile(true)} aria-label={`Preview ${fileName}`}>
          Preview
        </Button>
      )}
      <Button type="button" size="sm" variant="ghost" loading={loading} disabled={loading}
        icon={<Download className="h-3.5 w-3.5" />} onClick={() => void openFile(false)} aria-label={`Download ${fileName}`}>
        Download
      </Button>
      {previewUrl && (
        <Modal open onClose={closePreview} title="Report preview">
          <img src={previewUrl} alt={fileName} className="mx-auto max-h-[65vh] w-auto object-contain" />
        </Modal>
      )}
    </div>
  );
}

export function ConsultationFiles({ appointmentId, isDoctor }: { appointmentId: string; isDoctor: boolean }) {
  const endpoint = `/appointments/${encodeURIComponent(appointmentId)}/files`;
  const queryClient = useQueryClient();
  const { push } = useToast();
  const [uploading, setUploading] = useState(false);
  const { hash } = useLocation();
  useEffect(() => {
    if (hash !== '#consultation-files') return;
    const frame = window.requestAnimationFrame(() => {
      document.getElementById('consultation-files')?.scrollIntoView({ block: 'start', behavior: 'instant' });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [hash, appointmentId]);
  const query = useQuery({
    queryKey: ['consultation-files', appointmentId],
    queryFn: () => api<{ documents: SharedFile[]; canUpload: boolean }>(endpoint),
    refetchInterval: 5000,
  });
  const files = query.data?.documents ?? [];

  async function upload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = '';
    if (!file) return;
    if (file.size === 0 || file.size > 5 * 1024 * 1024) {
      push({ title: 'Choose a non-empty file up to 5 MB', tone: 'error' });
      return;
    }
    setUploading(true);
    try {
      await uploadMedicalDocument(file, 'REPORT', appointmentId);
      await Promise.all([
        query.refetch(),
        queryClient.invalidateQueries({ queryKey: ['patient-documents'] }),
        queryClient.invalidateQueries({ queryKey: ['patient-overview'] }),
      ]);
      push({ title: isDoctor ? 'Prescription PDF shared' : 'Report shared', tone: 'success' });
    } catch (error) {
      push({ title: 'Could not upload file', description: error instanceof Error ? error.message : undefined, tone: 'error' });
    } finally {
      setUploading(false);
    }
  }

  return (
    <section id="consultation-files" className="scroll-mt-4 rounded-[22px] border border-white/[0.08] bg-white/[0.025] p-5">
      <h2 className="font-sans text-sm font-semibold text-ivory">Consultation files</h2>
      <p className="mt-1 text-xs text-mauve">Shared with this appointment’s patient and assigned clinician.</p>
      {query.isLoading && <p role="status" className="mt-3 text-xs text-mauve">Loading files…</p>}
      {query.isError && <p role="alert" className="mt-3 text-xs text-rose">Could not refresh files. <button type="button" className="underline" onClick={() => void query.refetch()}>Retry</button></p>}
      {query.data && [false, true].map((prescription) => {
        const group = files.filter((file) => (file.category === clinicianPrescriptionCategory) === prescription);
        const title = prescription ? 'Clinician prescriptions' : 'Patient reports';
        return (
          <div key={title} className="mt-4 border-t border-white/[0.08] pt-3">
            <h3 className="text-xs font-semibold text-ivory">{title}</h3>
            {group.length ? <ul className="mt-2 space-y-2">
              {group.map((file) => (
                <li key={file.id} className="flex flex-wrap items-center justify-between gap-1">
                  <div className="min-w-0 text-xs">
                    <p className="break-words text-ivory">{file.fileName}</p>
                    <p className="text-mauve">{formatDateTime(file.createdAt)}</p>
                  </div>
                  <DocumentDownload endpoint={`${endpoint}/${encodeURIComponent(file.id)}/download`}
                    fileName={file.fileName} previewImage={file.mimeType === 'image/jpeg' || file.mimeType === 'image/png'} />
                </li>
              ))}
            </ul> : <p className="mt-1 text-xs text-mauve">No files shared yet.</p>}
            {query.data?.canUpload && isDoctor === prescription && (
              <label className="mt-3 block text-xs text-lavender">
                <Upload className="mr-1 inline h-3.5 w-3.5" aria-hidden="true" />
                {uploading ? 'Uploading…' : prescription ? 'Upload prescription PDF' : 'Upload report'}
                <input type="file" disabled={uploading} accept={prescription ? 'application/pdf' : 'application/pdf,image/jpeg,image/png'}
                  onChange={(event) => void upload(event)} className="mt-2 block w-full text-xs text-mauve" />
                <span className="mt-1 block text-mauve">{prescription ? 'PDF' : 'PDF, JPEG or PNG'} · Up to 5 MB. Demo files only.</span>
              </label>
            )}
          </div>
        );
      })}
    </section>
  );
}
