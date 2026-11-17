import { useEffect, useRef } from 'react';

export type VoiceOrbState = 'idle' | 'listening' | 'thinking' | 'speaking';

interface NayaVoiceOrbProps {
  state: VoiceOrbState;
  audioLevel?: number; // 0 to 1
  size?: number; // canvas size in px, default 340
  className?: string;
}

export function NayaVoiceOrb({
  state,
  audioLevel = 0,
  size = 360,
  className = '',
}: NayaVoiceOrbProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Smooth interpolated audio level and time tracking
  const smoothedLevelRef = useRef(0);
  const timeRef = useRef(0);
  const stateRef = useRef<VoiceOrbState>(state);
  stateRef.current = state;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;

    let lastTimestamp = performance.now();

    const render = (now: number) => {
      const dt = Math.min((now - lastTimestamp) / 1000, 0.1);
      lastTimestamp = now;

      // Smooth interpolation for audio level
      const targetLevel = stateRef.current === 'listening' ? Math.max(audioLevel, 0.05) : audioLevel;
      smoothedLevelRef.current += (targetLevel - smoothedLevelRef.current) * 0.22;
      const level = smoothedLevelRef.current;

      // Speed of animation depends on state
      let speed = 1.6;
      if (stateRef.current === 'thinking') speed = 3.6;
      else if (stateRef.current === 'speaking') speed = 2.4;
      else if (stateRef.current === 'listening') speed = 1.8 + level * 2.2;
      else speed = 1.2;

      timeRef.current += dt * speed;
      const t = timeRef.current;

      // Clear canvas
      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, size, size);

      const cx = size / 2;
      const cy = size / 2 - 12; // slightly elevated above floor shadow
      const baseRadius = size * 0.26;

      // Dynamic scale
      let scaleMultiplier = 1;
      if (stateRef.current === 'listening') {
        scaleMultiplier = 1 + level * 0.28;
      } else if (stateRef.current === 'speaking') {
        // Natural speech cadence breathing
        const speechRhythm = Math.sin(t * 4.2) * 0.06 + Math.sin(t * 7.5) * 0.04;
        scaleMultiplier = 1.04 + speechRhythm;
      } else if (stateRef.current === 'thinking') {
        scaleMultiplier = 0.96 + Math.sin(t * 3.5) * 0.04;
      } else {
        // Idle calm breathing
        scaleMultiplier = 1 + Math.sin(t * 1.5) * 0.025;
      }

      const r = baseRadius * scaleMultiplier;

      // 1. Draw floor shadow
      const shadowW = r * 1.55;
      const shadowH = r * 0.32;
      const shadowY = cy + r + 38;
      const shadowGrad = ctx.createRadialGradient(
        cx,
        shadowY,
        0,
        cx,
        shadowY,
        shadowW,
      );
      shadowGrad.addColorStop(0, 'rgba(15, 23, 42, 0.35)');
      shadowGrad.addColorStop(0.4, 'rgba(59, 130, 246, 0.12)');
      shadowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.save();
      ctx.beginPath();
      ctx.ellipse(cx, shadowY, shadowW, shadowH, 0, 0, Math.PI * 2);
      ctx.fillStyle = shadowGrad;
      ctx.fill();
      ctx.restore();

      // 2. Draw outer luminous aura
      const auraGrad = ctx.createRadialGradient(
        cx,
        cy,
        r * 0.75,
        cx,
        cy,
        r * 1.65,
      );
      if (stateRef.current === 'speaking') {
        auraGrad.addColorStop(0, 'rgba(96, 165, 250, 0.32)');
        auraGrad.addColorStop(0.5, 'rgba(192, 132, 252, 0.22)');
        auraGrad.addColorStop(1, 'rgba(147, 51, 234, 0)');
      } else if (stateRef.current === 'thinking') {
        auraGrad.addColorStop(0, 'rgba(147, 51, 234, 0.35)');
        auraGrad.addColorStop(0.6, 'rgba(59, 130, 246, 0.25)');
        auraGrad.addColorStop(1, 'rgba(59, 130, 246, 0)');
      } else if (stateRef.current === 'listening') {
        const reactiveAlpha = 0.2 + level * 0.35;
        auraGrad.addColorStop(0, `rgba(59, 130, 246, ${reactiveAlpha})`);
        auraGrad.addColorStop(0.6, `rgba(147, 197, 253, ${reactiveAlpha * 0.5})`);
        auraGrad.addColorStop(1, 'rgba(59, 130, 246, 0)');
      } else {
        auraGrad.addColorStop(0, 'rgba(96, 165, 250, 0.2)');
        auraGrad.addColorStop(0.6, 'rgba(147, 197, 253, 0.08)');
        auraGrad.addColorStop(1, 'rgba(59, 130, 246, 0)');
      }

      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, r * 1.65, 0, Math.PI * 2);
      ctx.fillStyle = auraGrad;
      ctx.fill();
      ctx.restore();

      // 3. Build morphing fluid sphere contour path
      const points = 72;
      const angleStep = (Math.PI * 2) / points;

      ctx.save();
      ctx.beginPath();

      for (let i = 0; i <= points; i++) {
        const theta = i * angleStep;

        // Wave deformation
        let deform = 0;
        if (stateRef.current === 'listening') {
          const amp = 0.025 + level * 0.12;
          deform =
            Math.sin(theta * 3 + t * 3.5) * amp +
            Math.sin(theta * 5 - t * 2.8) * (amp * 0.6) +
            Math.cos(theta * 2 + t * 4.2) * (amp * 0.4);
        } else if (stateRef.current === 'speaking') {
          const amp = 0.045;
          deform =
            Math.sin(theta * 3 + t * 3.2) * amp +
            Math.cos(theta * 4 - t * 2.5) * (amp * 0.7) +
            Math.sin(theta * 2 + t * 5.0) * (amp * 0.5);
        } else if (stateRef.current === 'thinking') {
          const amp = 0.05;
          deform =
            Math.sin(theta * 4 + t * 6.5) * amp +
            Math.cos(theta * 3 - t * 5.0) * (amp * 0.7);
        } else {
          deform =
            Math.sin(theta * 2 + t * 1.8) * 0.018 +
            Math.cos(theta * 3 - t * 1.5) * 0.012;
        }

        const currentR = r * (1 + deform);
        const px = cx + Math.cos(theta) * currentR;
        const py = cy + Math.sin(theta) * currentR;

        if (i === 0) {
          ctx.moveTo(px, py);
        } else {
          ctx.lineTo(px, py);
        }
      }

      ctx.closePath();

      // 4. Clip inside the morphing fluid sphere for rich interior textures
      ctx.clip();

      // Base gradient inside the sphere (ChatGPT blue-to-white cloudy gradient)
      // Rotates slightly over time
      const rotAngle = stateRef.current === 'thinking' ? t * 1.2 : t * 0.35;
      const gradX1 = cx + Math.cos(rotAngle + Math.PI * 0.75) * r;
      const gradY1 = cy + Math.sin(rotAngle + Math.PI * 0.75) * r;
      const gradX2 = cx + Math.cos(rotAngle - Math.PI * 0.25) * r;
      const gradY2 = cy + Math.sin(rotAngle - Math.PI * 0.25) * r;

      const sphereGrad = ctx.createLinearGradient(gradX1, gradY1, gradX2, gradY2);
      sphereGrad.addColorStop(0, '#1d4ed8'); // rich royal blue
      sphereGrad.addColorStop(0.25, '#3b82f6'); // primary azure
      sphereGrad.addColorStop(0.55, '#60a5fa'); // sky blue
      sphereGrad.addColorStop(0.85, '#93c5fd'); // baby blue
      sphereGrad.addColorStop(1, '#bfdbfe'); // soft light blue

      ctx.fillStyle = sphereGrad;
      ctx.fill();

      // 5. Flowing soft white cloudy wisps inside (the signature ChatGPT look)
      // Layer 1: Diagonal cloud swirl
      const cloud1X = cx + Math.sin(t * 0.8) * (r * 0.25);
      const cloud1Y = cy + Math.cos(t * 0.6) * (r * 0.22);
      const cloud1Grad = ctx.createRadialGradient(
        cloud1X,
        cloud1Y,
        0,
        cloud1X,
        cloud1Y,
        r * 0.85,
      );
      cloud1Grad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
      cloud1Grad.addColorStop(0.35, 'rgba(255, 255, 255, 0.75)');
      cloud1Grad.addColorStop(0.65, 'rgba(224, 242, 254, 0.35)');
      cloud1Grad.addColorStop(1, 'rgba(147, 197, 253, 0)');

      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = cloud1Grad;
      ctx.fill();
      ctx.restore();

      // Layer 2: Secondary soft cloud patch with undulating motion
      const cloud2Angle = -t * 0.9;
      const cloud2Dist = r * 0.42;
      const cloud2X = cx + Math.cos(cloud2Angle) * cloud2Dist;
      const cloud2Y = cy + Math.sin(cloud2Angle) * cloud2Dist;
      const cloud2Grad = ctx.createRadialGradient(
        cloud2X,
        cloud2Y,
        0,
        cloud2X,
        cloud2Y,
        r * 0.65,
      );
      cloud2Grad.addColorStop(0, 'rgba(255, 255, 255, 0.88)');
      cloud2Grad.addColorStop(0.4, 'rgba(238, 242, 255, 0.55)');
      cloud2Grad.addColorStop(1, 'rgba(96, 165, 250, 0)');

      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = cloud2Grad;
      ctx.fill();
      ctx.restore();

      // Layer 3: Soft ambient inner glow / depth rim
      const innerRim = ctx.createRadialGradient(cx, cy, r * 0.6, cx, cy, r);
      innerRim.addColorStop(0, 'rgba(255, 255, 255, 0)');
      innerRim.addColorStop(0.8, 'rgba(30, 64, 175, 0.18)');
      innerRim.addColorStop(1, 'rgba(30, 58, 138, 0.45)');

      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = innerRim;
      ctx.fill();
      ctx.restore();

      // Top soft highlight crescent for tangible 3D glass sheen
      const sheenGrad = ctx.createLinearGradient(cx, cy - r, cx, cy);
      sheenGrad.addColorStop(0, 'rgba(255, 255, 255, 0.5)');
      sheenGrad.addColorStop(0.6, 'rgba(255, 255, 255, 0.1)');
      sheenGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');

      ctx.save();
      ctx.beginPath();
      ctx.ellipse(cx, cy - r * 0.45, r * 0.72, r * 0.35, 0, 0, Math.PI * 2);
      ctx.fillStyle = sheenGrad;
      ctx.fill();
      ctx.restore();

      ctx.restore(); // restore clip

      // 6. Delicate crisp outer border ring
      ctx.save();
      ctx.beginPath();
      for (let i = 0; i <= points; i++) {
        const theta = i * angleStep;
        let deform = 0;
        if (stateRef.current === 'listening') {
          const amp = 0.025 + level * 0.12;
          deform =
            Math.sin(theta * 3 + t * 3.5) * amp +
            Math.sin(theta * 5 - t * 2.8) * (amp * 0.6) +
            Math.cos(theta * 2 + t * 4.2) * (amp * 0.4);
        } else if (stateRef.current === 'speaking') {
          const amp = 0.045;
          deform =
            Math.sin(theta * 3 + t * 3.2) * amp +
            Math.cos(theta * 4 - t * 2.5) * (amp * 0.7) +
            Math.sin(theta * 2 + t * 5.0) * (amp * 0.5);
        } else if (stateRef.current === 'thinking') {
          const amp = 0.05;
          deform =
            Math.sin(theta * 4 + t * 6.5) * amp +
            Math.cos(theta * 3 - t * 5.0) * (amp * 0.7);
        } else {
          deform =
            Math.sin(theta * 2 + t * 1.8) * 0.018 +
            Math.cos(theta * 3 - t * 1.5) * 0.012;
        }
        const currentR = r * (1 + deform);
        const px = cx + Math.cos(theta) * currentR;
        const py = cy + Math.sin(theta) * currentR;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.lineWidth = 1.2;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.stroke();
      ctx.restore();

      ctx.restore(); // restore scale

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [size, audioLevel]);

  return (
    <div
      className={`relative grid place-items-center select-none ${className}`}
      style={{ width: size, height: size }}
    >
      <canvas ref={canvasRef} className="block pointer-events-none" />
    </div>
  );
}
