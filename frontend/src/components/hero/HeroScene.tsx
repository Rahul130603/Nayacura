import { useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { PerformanceMonitor } from '@react-three/drei';
import { MathUtils, PerspectiveCamera } from 'three';
import { CelestialParticles } from './CelestialParticles';
import { GlassLotus } from './GlassLotus';
import { HeroLighting } from './HeroLighting';
import { InfinitySculpture } from './InfinitySculpture';
import { OrbitRings } from './OrbitRings';
import { ReflectiveFloor } from './ReflectiveFloor';
import type { SceneMotion } from './sceneMotion';

const cameraPosition: [number, number, number] = [0, 1.95, 10];

function CameraRig({ motion }: { motion: SceneMotion }) {
  useFrame(({ camera, size }, delta) => {
    if (!(camera instanceof PerspectiveCamera)) return;
    const { x, y, scroll } = motion.current;
    const verticalSpan = Math.max(5.8, (7.75 * size.height) / Math.max(1, size.width));
    const fov = MathUtils.radToDeg(2 * Math.atan(verticalSpan / 20));
    if (camera.fov !== fov) {
      camera.fov = fov;
      camera.updateProjectionMatrix();
    }

    camera.position.x = MathUtils.damp(camera.position.x, x * 0.24, 3, delta);
    camera.position.y = MathUtils.damp(camera.position.y, cameraPosition[1] + y * 0.14 + scroll * 0.46, 3, delta);
    camera.position.z = MathUtils.damp(camera.position.z, cameraPosition[2] + scroll * 0.55, 3, delta);
    camera.lookAt(0, -0.18 + scroll * 0.12, 0);
  });
  return null;
}

export default function HeroScene({
  compact, motion, active, onReady,
}: {
  compact: boolean;
  motion: SceneMotion;
  active: boolean;
  onReady: () => void;
}) {
  const [quality, setQuality] = useState(1);
  const detailed = !compact && quality > 0.35;
  const dpr = Math.min(window.devicePixelRatio, compact ? 1.15 : 1.55) * (0.72 + 0.28 * quality);

  return (
    <Canvas
      camera={{ position: cameraPosition, fov: 42, near: 0.2, far: 30 }}
      dpr={dpr}
      frameloop={active ? 'always' : 'demand'}
      gl={{ alpha: true, antialias: !compact, powerPreference: 'high-performance' }}
      onCreated={({ gl }) => {
        gl.setClearColor('#120719', 0);
        gl.toneMappingExposure = 1.18;
        onReady();
      }}
    >
      <PerformanceMonitor
        factor={1}
        step={0.22}
        ms={375}
        bounds={() => [48, 58]}
        onChange={({ factor }) => setQuality(factor)}
      />
      <CameraRig motion={motion} />
      <HeroLighting compact={compact} />
      <InfinitySculpture motion={motion} compact={!detailed} />
      <OrbitRings motion={motion} compact={!detailed} />
      <CelestialParticles motion={motion} compact={!detailed} />
    </Canvas>
  );
}

