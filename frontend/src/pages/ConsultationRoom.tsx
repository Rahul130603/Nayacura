import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  Camera,
  CameraOff,
  Check,
  ChevronDown,
  CircleAlert,
  Clock3,
  LockKeyhole,
  Mic,
  MicOff,
  PhoneOff,
  RefreshCw,
  ShieldCheck,
  SignalHigh,
  SignalLow,
  SignalMedium,
  Video,
  WifiOff,
} from 'lucide-react';
import type { Room as LiveKitRoom } from 'livekit-client';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { formatDateTime, formatTime, cn } from '@/lib/utils';
import { Logo } from '@/components/layout/Logo';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { DoctorAvatar } from '@/components/ui/DoctorAvatar';
import { PageLoader, ErrorState } from '@/components/ui/States';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { Seo } from '@/components/Seo';
import type { Appointment } from '@/types';

type TokenResponse = {
  provider: 'LIVEKIT' | 'DEMO';
  url?: string;
  token?: string;
  roomName: string;
  role: string;
  message?: string;
};

type Connection = 'idle' | 'connecting' | 'connected' | 'reconnecting' | 'disconnected' | 'denied';

function useSessionTimer(active: boolean) {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    if (!active) return;
    const timer = window.setInterval(() => setSeconds((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, [active]);
  const minutes = String(Math.floor(seconds / 60)).padStart(2, '0');
  const secs = String(seconds % 60).padStart(2, '0');
  return `${minutes}:${secs}`;
}

export default function ConsultationRoom() {
  const { id } = useParams();
  const { user, loading } = useAuth();
  const { push } = useToast();
  const [consent, setConsent] = useState(false);
  const [joining, setJoining] = useState(false);
  const [joined, setJoined] = useState(false);
  const [ended, setEnded] = useState(false);
  const [endOpen, setEndOpen] = useState(false);
  const [micOn, setMicOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(true);
  const [connection, setConnection] = useState<Connection>('idle');
  const [tokenInfo, setTokenInfo] = useState<TokenResponse | null>(null);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [cameraId, setCameraId] = useState('');
  const [microphoneId, setMicrophoneId] = useState('');
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const roomRef = useRef<LiveKitRoom | null>(null);
  const timer = useSessionTimer(joined);

  const appointmentQuery = useQuery({
    queryKey: ['consultation', id],
    enabled: Boolean(user && id),
    queryFn: () => api<{ appointment: Appointment }>(`/appointments/${id}`),
  });
  const appointment = appointmentQuery.data?.appointment;

  const stopLocalStream = useCallback(() => {
    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    localStreamRef.current = null;
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
  }, []);

  const refreshDevices = useCallback(async () => {
    try {
      const list = await navigator.mediaDevices.enumerateDevices();
      setDevices(list);
      if (!cameraId) {
        const camera = list.find((device) => device.kind === 'videoinput');
        if (camera) setCameraId(camera.deviceId);
      }
      if (!microphoneId) {
        const microphone = list.find((device) => device.kind === 'audioinput');
        if (microphone) setMicrophoneId(microphone.deviceId);
      }
    } catch {
      /* device labels can be unavailable before permission */
    }
  }, [cameraId, microphoneId]);

  const startDemoMedia = useCallback(async () => {
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        setConnection('disconnected');
        setMediaError('This browser does not support camera access.');
        return;
      }
      stopLocalStream();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: cameraId ? { deviceId: { ideal: cameraId } } : true,
        audio: microphoneId ? { deviceId: { ideal: microphoneId } } : true,
      });
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        await localVideoRef.current.play().catch(() => undefined);
      }
      setConnection('connected');
      setMediaError(null);
      await refreshDevices();
    } catch (error) {
      setConnection('denied');
      const name = error instanceof DOMException ? error.name : '';
      setMediaError(
        name === 'NotAllowedError'
          ? 'Camera or microphone permission was denied. Allow access in your browser, then retry. You can still see the consultation room and use audio only.'
          : name === 'NotFoundError'
            ? 'No camera or microphone was found. Check your device and try again.'
            : 'We could not start your camera or microphone. Check browser permissions and try again.',
      );
    }
  }, [cameraId, microphoneId, refreshDevices, stopLocalStream]);

  const connectLiveKit = useCallback(async (info: TokenResponse) => {
    if (!info.url || !info.token) return;
    const { Room, RoomEvent } = await import('livekit-client');
    const room = new Room({ adaptiveStream: true, dynacast: true });
    roomRef.current = room;
    room.on(RoomEvent.Connected, () => setConnection('connected'));
    room.on(RoomEvent.Reconnecting, () => setConnection('reconnecting'));
    room.on(RoomEvent.Reconnected, () => setConnection('connected'));
    room.on(RoomEvent.Disconnected, () => setConnection('disconnected'));
    room.on(RoomEvent.TrackSubscribed, (track: { kind: string; attach: (el: HTMLVideoElement) => void }) => {
      if (track.kind === 'video' && remoteVideoRef.current) {
        track.attach(remoteVideoRef.current);
      }
    });
    await room.connect(info.url, info.token);
    await room.localParticipant.setCameraEnabled(true);
    await room.localParticipant.setMicrophoneEnabled(true);
    const publication = Array.from(room.localParticipant.videoTrackPublications.values())[0];
    if (publication?.videoTrack && localVideoRef.current) {
      publication.videoTrack.attach(localVideoRef.current);
    }
    await refreshDevices();
  }, [refreshDevices]);

  const joinRoom = useCallback(async () => {
    if (!appointment || !consent) return;
    setJoining(true);
    setMediaError(null);
    try {
      await api(`/appointments/${appointment.id}/consultation/consent`, {
        method: 'POST',
        body: { teleconsultationConsent: true, recordingConsent: false },
      });
      const info = await api<TokenResponse>(`/appointments/${appointment.id}/video-token`);
      setTokenInfo(info);
      if (info.provider === 'LIVEKIT') {
        setConnection('connecting');
        await connectLiveKit(info);
      } else {
        await startDemoMedia();
      }
      setJoined(true);
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        setMediaError(
          'Teleconsultation consent must be recorded before joining. Please confirm the consent above.',
        );
      } else if (error instanceof ApiError && error.status === 403) {
        setMediaError(error.message);
      } else {
        setMediaError(error instanceof Error ? error.message : 'The secure room could not be opened.');
      }
      setConnection('disconnected');
    } finally {
      setJoining(false);
    }
  }, [appointment, consent, connectLiveKit, startDemoMedia]);

  async function toggleMic() {
    if (roomRef.current) {
      await roomRef.current.localParticipant.setMicrophoneEnabled(!micOn);
    } else {
      localStreamRef.current?.getAudioTracks().forEach((track) => {
        track.enabled = !micOn;
      });
    }
    setMicOn((value) => !value);
  }

  async function toggleCamera() {
    if (roomRef.current) {
      await roomRef.current.localParticipant.setCameraEnabled(!cameraOn);
    } else {
      localStreamRef.current?.getVideoTracks().forEach((track) => {
        track.enabled = !cameraOn;
      });
    }
    setCameraOn((value) => !value);
  }

  async function changeDevice(kind: 'videoinput' | 'audioinput', deviceId: string) {
    if (kind === 'videoinput') setCameraId(deviceId);
    else setMicrophoneId(deviceId);
    if (roomRef.current) {
      await roomRef.current.switchActiveDevice(kind, deviceId);
    } else if (joined) {
      await startDemoMedia();
    }
  }

  async function endRoom() {
    setEndOpen(false);
    roomRef.current?.disconnect();
    roomRef.current = null;
    stopLocalStream();
    setJoined(false);
    setEnded(true);
    setConnection('disconnected');
  }

  useEffect(() => {
    return () => {
      roomRef.current?.disconnect();
      stopLocalStream();
    };
  }, [stopLocalStream]);

  useEffect(() => {
    if (!joined) return;
    void refreshDevices();
    if (localVideoRef.current && localStreamRef.current && localVideoRef.current.srcObject !== localStreamRef.current) {
      localVideoRef.current.srcObject = localStreamRef.current;
      void localVideoRef.current.play().catch(() => undefined);
    }
    if (roomRef.current && localVideoRef.current) {
      const publication = Array.from(roomRef.current.localParticipant.videoTrackPublications.values())[0];
      if (publication?.videoTrack && !localVideoRef.current.srcObject) {
        publication.videoTrack.attach(localVideoRef.current);
      }
    }
  }, [joined, refreshDevices]);

  if (loading) return <PageLoader label="Securing your consultation room" />;
  if (!user) {
    return <Navigate to={`/login?next=${encodeURIComponent(`/consult/${id}`)}`} replace />;
  }
  if (appointmentQuery.isLoading) return <PageLoader label="Opening secure room" />;
  if (appointmentQuery.isError || !appointment) {
    return (
      <div className="grid min-h-screen place-items-center bg-midnight px-5">
        <ErrorState
          title="This consultation room is unavailable"
          description="The appointment may not exist, may not belong to your account, or the room may not be open yet."
          onRetry={() => void appointmentQuery.refetch()}
        />
      </div>
    );
  }

  const notJoinable = appointment.mode !== 'ONLINE' || !['CONFIRMED', 'IN_PROGRESS'].includes(appointment.status);
  const statusLabel =
    connection === 'connected'
      ? tokenInfo?.provider === 'LIVEKIT'
        ? 'Live · encrypted'
        : 'Demo room · local preview'
      : connection === 'reconnecting'
        ? 'Reconnecting…'
        : connection === 'denied'
          ? 'Camera permission needed'
          : connection === 'connecting'
            ? 'Connecting…'
            : 'Not connected';

  const ConnectionIcon =
    connection === 'connected'
      ? SignalHigh
      : connection === 'reconnecting'
        ? SignalMedium
        : connection === 'denied'
          ? WifiOff
          : SignalLow;

  return (
    <>
      <Seo title="Secure consultation room" description="Private video consultation room." noIndex />
      <div className="flex min-h-[100svh] flex-col bg-[#07040B] text-ivory">
        <header className="border-b border-white/[0.08] bg-midnight/70 px-4 py-3 backdrop-blur-xl sm:px-6">
          <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-4">
            <div className="flex items-center gap-3 sm:gap-5">
              <Logo />
              <span className="hidden h-6 w-px bg-white/10 sm:block" />
              <div className="hidden sm:block">
                <p className="font-sans text-[10px] font-semibold text-ivory">
                  Secure consultation · {appointment.bookingId}
                </p>
                <p className="font-body text-[9px] text-mauve">
                  {formatDateTime(appointment.startAt, appointment.timezone)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-lavender/20 bg-lavender/[0.06] px-2.5 py-1 font-body text-[8.5px] text-lavender">
                <LockKeyhole className="h-2.5 w-2.5" /> Not recorded
              </span>
              <Badge tone={joined ? 'lavender' : 'muted'} dot>
                {joined ? 'In session' : 'Waiting'}
              </Badge>
            </div>
          </div>
        </header>

        <main className="mx-auto flex w-full max-w-[1500px] flex-1 flex-col gap-3 px-3 py-3 sm:px-5 sm:py-4 lg:flex-row">
          <div className="relative flex min-h-[420px] flex-1 flex-col overflow-hidden rounded-[24px] border border-white/[0.09] bg-[#0C0812] sm:min-h-[560px]">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(110,53,164,0.12),transparent_60%)]" />

            {!joined ? (
              <div className="relative z-10 flex flex-1 flex-col items-center justify-center p-6 sm:p-10">
                {ended ? (
                  <div className="max-w-lg text-center">
                    <div className="mx-auto grid h-16 w-16 place-items-center rounded-full border border-lavender/25 bg-lavender/10">
                      <Check className="h-7 w-7 text-lavender" />
                    </div>
                    <h1 className="display mt-6 text-4xl">Consultation ended.</h1>
                    <p className="mt-3 font-body text-[12px] leading-relaxed text-mauve">
                      Your local session has closed. In a production service, your clinician would
                      update the appointment and add any notes or follow-up with your consent.
                    </p>
                    <div className="mt-6 flex flex-wrap justify-center gap-3">
                      <ButtonLink to="/dashboard?section=appointments" arrow>
                        Back to my appointments
                      </ButtonLink>
                      <ButtonLink to="/contact" variant="secondary">
                        Contact support
                      </ButtonLink>
                    </div>
                  </div>
                ) : notJoinable ? (
                  <div className="max-w-lg text-center">
                    <CircleAlert className="mx-auto h-7 w-7 text-rose" />
                    <h1 className="display mt-5 text-4xl">The room is not open.</h1>
                    <p className="mt-3 font-body text-[12px] leading-relaxed text-mauve">
                      {appointment.mode !== 'ONLINE'
                        ? 'This is an in-person appointment. There is no video room for it.'
                        : 'This appointment must be confirmed before the room opens. The room is available from 15 minutes before the start time.'}
                    </p>
                    <ButtonLink to="/dashboard?section=appointments" variant="secondary" className="mt-6">
                      View my appointment
                    </ButtonLink>
                  </div>
                ) : (
                  <>
                    <div className="relative mb-7">
                      <div className="absolute inset-0 -m-8 rounded-full border border-lavender/10" />
                      <div className="absolute inset-0 -m-16 rounded-full border border-rose/[0.06]" />
                      <DoctorAvatar doctor={appointment.doctor} size="xl" />
                      <span className="absolute bottom-1 right-1 h-4 w-4 rounded-full border-4 border-[#0C0812] bg-rose" />
                    </div>
                    <p className="font-sans text-[9px] font-semibold uppercase tracking-[0.2em] text-lavender">
                      Waiting room
                    </p>
                    <h1 className="display mt-3 text-center text-4xl sm:text-5xl">
                      {appointment.doctor.name}
                    </h1>
                    <p className="mt-2 font-sans text-[11px] text-mauve">{appointment.doctor.title}</p>

                    <div className="mt-6 w-full max-w-md rounded-2xl border border-white/[0.08] bg-white/[0.025] p-4 text-left">
                      <p className="font-sans text-[10px] font-semibold text-ivory">Before you join</p>
                      <ul className="mt-3 space-y-2">
                        {[
                          'Find a private space where you cannot be overheard.',
                          'Confirm your camera and microphone permissions.',
                          'This consultation is not recorded by default.',
                          'You can end the session at any time.',
                        ].map((item) => (
                          <li key={item} className="flex items-start gap-2 font-body text-[10px] leading-relaxed text-mauve">
                            <Check className="mt-0.5 h-3 w-3 shrink-0 text-rose" /> {item}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <label className="mt-5 flex w-full max-w-md cursor-pointer items-start gap-3 rounded-2xl border border-white/[0.08] p-4 text-left">
                      <span
                        className={cn(
                          'mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded border transition-colors',
                          consent ? 'border-lavender bg-lavender text-midnight' : 'border-white/25',
                        )}
                      >
                        {consent && <Check className="h-3 w-3" strokeWidth={3} />}
                      </span>
                      <input
                        type="checkbox"
                        checked={consent}
                        onChange={(e) => setConsent(e.target.checked)}
                        className="sr-only"
                      />
                      <span className="font-body text-[10px] leading-relaxed text-mauve">
                        I consent to this teleconsultation and understand its limits. I have read the{' '}
                        <Link to="/legal/teleconsultation-consent" target="_blank" className="text-lavender underline">
                          Teleconsultation Consent
                        </Link>
                        . I understand this demo room may connect only a local preview.
                      </span>
                    </label>

                    {mediaError && (
                      <div className="mt-4 flex max-w-md items-start gap-2 rounded-xl border border-rose/20 bg-burgundy/20 p-3">
                        <CircleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose" />
                        <p className="font-body text-[10px] leading-relaxed text-ivory/70">{mediaError}</p>
                      </div>
                    )}
                    <Button
                      onClick={() => void joinRoom()}
                      disabled={!consent}
                      loading={joining}
                      size="lg"
                      className="mt-5"
                      icon={<Video className="h-4 w-4" />}
                    >
                      Enter secure room
                    </Button>
                    <p className="mt-3 font-body text-[8.5px] text-mauve/50">
                      Room opens 15 minutes before the appointment.
                    </p>
                  </>
                )}
              </div>
            ) : (
              <>
                <div className="relative flex flex-1 items-center justify-center overflow-hidden">
                  {tokenInfo?.provider === 'LIVEKIT' ? (
                    <video
                      ref={remoteVideoRef}
                      autoPlay
                      playsInline
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="relative flex h-full w-full flex-col items-center justify-center gap-5 p-6">
                      <div className="absolute h-64 w-64 rounded-full border border-lavender/10 sm:h-96 sm:w-96" />
                      <div className="absolute h-44 w-44 rounded-full border border-rose/10 sm:h-64 sm:w-64" />
                      <DoctorAvatar doctor={appointment.doctor} size="xl" />
                      <div className="relative z-10 text-center">
                        <p className="font-display text-3xl text-ivory">{appointment.doctor.name}</p>
                        <p className="mt-1 font-sans text-[10px] text-mauve">{appointment.doctor.title}</p>
                        <span className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-midnight/50 px-3 py-1.5 font-body text-[9px] text-mauve backdrop-blur-md">
                          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-rose" />
                          Demo room · no remote clinician connected
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="absolute inset-x-0 top-0 flex items-center justify-between gap-3 bg-gradient-to-b from-[#07040B]/80 to-transparent p-4">
                    <div>
                      <p className="font-sans text-[10px] font-semibold text-ivory">
                        {appointment.doctor.name}
                      </p>
                      <p className="font-body text-[9px] text-mauve">Clinician · demo profile</p>
                    </div>
                    <div className="flex items-center gap-2 rounded-full border border-white/10 bg-midnight/50 px-2.5 py-1 font-body text-[8.5px] text-ivory/70 backdrop-blur-md">
                      <ConnectionIcon className="h-3 w-3 text-lavender" /> {statusLabel}
                    </div>
                  </div>

                  <div className="absolute bottom-4 right-4 w-28 overflow-hidden rounded-xl border border-white/15 bg-midnight/80 shadow-xl sm:w-40">
                    <video
                      ref={localVideoRef}
                      autoPlay
                      playsInline
                      muted
                      className="aspect-[4/3] w-full object-cover"
                    />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-midnight to-transparent p-2">
                      <p className="font-body text-[8px] text-ivory/70">
                        You {!cameraOn && '· camera off'}
                      </p>
                    </div>
                  </div>

                  {!cameraOn && (
                    <div className="absolute inset-0 flex items-center justify-center bg-[#07040B]/70">
                      <div className="text-center">
                        <CameraOff className="mx-auto h-7 w-7 text-mauve" />
                        <p className="mt-2 font-body text-[10px] text-mauve">Camera is off</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="relative z-10 flex flex-wrap items-center justify-center gap-2 border-t border-white/[0.08] bg-midnight/70 p-3 backdrop-blur-md sm:gap-3 sm:p-4">
                  <button
                    type="button"
                    onClick={() => void toggleMic()}
                    className={cn(
                      'grid h-11 w-11 place-items-center rounded-full border transition-colors',
                      micOn
                        ? 'border-white/15 bg-white/[0.06] text-ivory hover:bg-white/10'
                        : 'border-rose/30 bg-rose/10 text-rose',
                    )}
                    aria-label={micOn ? 'Mute microphone' : 'Unmute microphone'}
                    aria-pressed={!micOn}
                  >
                    {micOn ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => void toggleCamera()}
                    className={cn(
                      'grid h-11 w-11 place-items-center rounded-full border transition-colors',
                      cameraOn
                        ? 'border-white/15 bg-white/[0.06] text-ivory hover:bg-white/10'
                        : 'border-rose/30 bg-rose/10 text-rose',
                    )}
                    aria-label={cameraOn ? 'Turn camera off' : 'Turn camera on'}
                    aria-pressed={!cameraOn}
                  >
                    {cameraOn ? <Camera className="h-4 w-4" /> : <CameraOff className="h-4 w-4" />}
                  </button>
                  <span className="mx-1 hidden h-7 w-px bg-white/10 sm:block" />
                  <button
                    type="button"
                    onClick={() => void startDemoMedia()}
                    className="hidden h-11 items-center gap-2 rounded-full border border-white/12 px-4 font-sans text-[10px] text-mauve transition-colors hover:text-ivory sm:flex"
                  >
                    <RefreshCw className="h-3.5 w-3.5" /> Retry media
                  </button>
                  <Button
                    variant="danger"
                    size="md"
                    onClick={() => setEndOpen(true)}
                    icon={<PhoneOff className="h-4 w-4" />}
                    className="ml-2"
                  >
                    End consultation
                  </Button>
                </div>
              </>
            )}
          </div>

          <aside className="w-full shrink-0 space-y-3 lg:w-[310px]">
            <div className="rounded-[22px] border border-white/[0.08] bg-white/[0.025] p-5">
              <div className="flex items-center justify-between">
                <p className="font-sans text-[9px] font-semibold uppercase tracking-[0.17em] text-mauve">
                  Session
                </p>
                <span className="inline-flex items-center gap-1.5 font-body text-[9px] text-lavender">
                  <Clock3 className="h-3 w-3" /> {timer}
                </span>
              </div>
              <div className="mt-4 space-y-3">
                <div>
                  <p className="font-body text-[8.5px] uppercase tracking-[0.14em] text-mauve/60">
                    Booking
                  </p>
                  <p className="mt-1 font-mono text-[11px] text-ivory">{appointment.bookingId}</p>
                </div>
                <div>
                  <p className="font-body text-[8.5px] uppercase tracking-[0.14em] text-mauve/60">
                    Scheduled
                  </p>
                  <p className="mt-1 font-sans text-[10.5px] text-ivory/70">
                    {formatDateTime(appointment.startAt, appointment.timezone)}
                  </p>
                </div>
                <div>
                  <p className="font-body text-[8.5px] uppercase tracking-[0.14em] text-mauve/60">
                    Participant
                  </p>
                  <p className="mt-1 font-sans text-[10.5px] text-ivory/70">
                    {user.name} · patient
                  </p>
                </div>
                <div>
                  <p className="font-body text-[8.5px] uppercase tracking-[0.14em] text-mauve/60">
                    Room ID
                  </p>
                  <p className="mt-1 truncate font-mono text-[9px] text-mauve">
                    {tokenInfo?.roomName || 'Not connected'}
                  </p>
                </div>
              </div>
              <div className="mt-4 border-t border-white/[0.07] pt-4">
                <div className="flex items-start gap-2">
                  <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-lavender" />
                  <p className="font-body text-[9px] leading-relaxed text-mauve">
                    No recording by default. Room access is granted by short-lived server tokens. Do
                    not share your screen or room.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[22px] border border-white/[0.08] bg-white/[0.025] p-5">
              <p className="font-sans text-[9px] font-semibold uppercase tracking-[0.17em] text-mauve">
                Devices
              </p>
              <div className="mt-3 space-y-3">
                <label className="block">
                  <span className="mb-1.5 block font-body text-[9px] text-mauve">Camera</span>
                  <div className="relative">
                    <select
                      value={cameraId}
                      onChange={(e) => void changeDevice('videoinput', e.target.value)}
                      className="w-full appearance-none rounded-xl border border-white/10 bg-midnight px-3 py-2.5 pr-8 font-body text-[10px] text-ivory focus:border-lavender/40 focus:outline-none"
                    >
                      {devices.filter((item) => item.kind === 'videoinput').length === 0 && (
                        <option value="">Default camera</option>
                      )}
                      {devices
                        .filter((item) => item.kind === 'videoinput')
                        .map((device, index) => (
                          <option key={device.deviceId} value={device.deviceId}>
                            {device.label || `Camera ${index + 1}`}
                          </option>
                        ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-mauve" />
                  </div>
                </label>
                <label className="block">
                  <span className="mb-1.5 block font-body text-[9px] text-mauve">Microphone</span>
                  <div className="relative">
                    <select
                      value={microphoneId}
                      onChange={(e) => void changeDevice('audioinput', e.target.value)}
                      className="w-full appearance-none rounded-xl border border-white/10 bg-midnight px-3 py-2.5 pr-8 font-body text-[10px] text-ivory focus:border-lavender/40 focus:outline-none"
                    >
                      {devices.filter((item) => item.kind === 'audioinput').length === 0 && (
                        <option value="">Default microphone</option>
                      )}
                      {devices
                        .filter((item) => item.kind === 'audioinput')
                        .map((device, index) => (
                          <option key={device.deviceId} value={device.deviceId}>
                            {device.label || `Microphone ${index + 1}`}
                          </option>
                        ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-mauve" />
                  </div>
                </label>
              </div>
              {!joined && (
                <p className="mt-3 font-body text-[8.5px] leading-relaxed text-mauve/60">
                  Device names become available after you grant camera or microphone permission.
                </p>
              )}
            </div>

            <div className="rounded-[22px] border border-lavender/15 bg-lavender/[0.04] p-5">
              <p className="font-sans text-[10px] font-semibold text-ivory">In an emergency</p>
              <p className="mt-2 font-body text-[9px] leading-relaxed text-mauve">
                This room is not monitored for emergencies. If you are in danger or need urgent
                medical help, leave the room and contact local emergency services (112 in India).
              </p>
            </div>

            <div className="flex items-center justify-between px-1">
              <Link
                to="/dashboard?section=appointments"
                className="inline-flex items-center gap-1.5 font-sans text-[9px] text-mauve hover:text-ivory"
              >
                <ArrowLeft className="h-3 w-3" /> My appointments
              </Link>
              <span className="font-body text-[8px] uppercase tracking-[0.14em] text-mauve/40">
                Demo teleconsultation
              </span>
            </div>
          </aside>
        </main>
      </div>

      <Modal
        open={endOpen}
        onClose={() => setEndOpen(false)}
        title="End this consultation?"
        description="This closes your local room and camera. In a production service, ending a consultation would be recorded and your clinician would complete any notes."
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={() => setEndOpen(false)}>
            Stay in room
          </Button>
          <Button variant="danger" onClick={() => void endRoom()} icon={<PhoneOff className="h-4 w-4" />}>
            End consultation
          </Button>
        </div>
      </Modal>
    </>
  );
}
