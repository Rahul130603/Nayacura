import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { AdditiveBlending, Color, MathUtils, type Points } from 'three';
import { cycle, type SceneMotion } from './sceneMotion';

const vertexShader = /* glsl */ `
  attribute float seed;
  uniform float time;
  uniform float pixelRatio;
  uniform float entrance;
  varying float brightness;
  varying float tint;

  void main() {
    vec3 p = position;
    // Gentle floating orbital drift
    p.y += sin(time * 0.55 + seed * 24.0) * 0.16;
    p.x += cos(time * 0.32 + seed * 16.0) * 0.11;
    p.z += sin(time * 0.22 + seed * 32.0) * 0.08;

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;

    float scale = 11.0 / -mv.z;
    gl_PointSize = (1.6 + 4.2 * pow(seed, 3.5)) * scale * pixelRatio;
    // Twinkling animation
    brightness = (0.25 + 0.75 * pow(0.5 + 0.5 * sin(time * (0.8 + seed * 1.2) + seed * 62.0), 3.0)) * entrance;
    tint = fract(seed * 4.31);
  }
`;

const fragmentShader = /* glsl */ `
  uniform vec3 pink;
  uniform vec3 lavender;
  varying float brightness;
  varying float tint;

  void main() {
    vec2 p = (gl_PointCoord - 0.5) * 2.0;
    float r = dot(p, p);
    // Pinpoint bright starlight core
    float core = exp(-r * 12.0);
    // Soft glowing halo
    float halo = exp(-r * 3.4) * 0.38;
    float alpha = (core + halo) * (1.0 - smoothstep(0.65, 1.0, r)) * brightness;

    vec3 col = mix(lavender, pink, tint) + core * 0.45;
    gl_FragColor = vec4(col, alpha);
    #include <colorspace_fragment>
  }
`;

export function CelestialParticles({ compact, motion }: { compact: boolean; motion: SceneMotion }) {
  const points = useRef<Points>(null);

  const { positions, seeds } = useMemo(() => {
    const count = compact ? 120 : 360;
    const positions = new Float32Array(count * 3);
    const seeds = new Float32Array(count);
    const random = MathUtils.seededRandom;
    let seed = 7412;
    const next = () => random(seed++);

    for (let i = 0; i < count; i += 1) {
      const theta = next() * cycle;
      const radius = 1.2 + next() * 2.85;
      positions[i * 3] = Math.cos(theta) * radius;
      positions[i * 3 + 1] = Math.sin(theta) * radius * (0.45 + next() * 0.25) + 0.28;
      positions[i * 3 + 2] = (next() - 0.5) * 4.2;
      seeds[i] = next();
    }
    return { positions, seeds };
  }, [compact]);

  const uniforms = useMemo(
    () => ({
      time: { value: 0 },
      pixelRatio: { value: 1 },
      entrance: { value: 0 },
      pink: { value: new Color('#ffa3d2') },
      lavender: { value: new Color('#d4b0ff') },
    }),
    []
  );

  useFrame(({ clock, gl }, delta) => {
    const { x, y, scroll } = motion.current;
    const t = clock.elapsedTime;
    uniforms.time.value = t;
    uniforms.pixelRatio.value = gl.getPixelRatio();
    uniforms.entrance.value = MathUtils.smoothstep(t, 0.3, 1.6) * (1 - scroll * 0.48);

    if (points.current) {
      points.current.rotation.y = MathUtils.damp(points.current.rotation.y, x * 0.14, 2.5, delta);
      points.current.rotation.x = MathUtils.damp(points.current.rotation.x, -y * 0.11, 2.5, delta);
      points.current.position.z = -scroll * 0.65;
    }
  });

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-seed" args={[seeds, 1]} />
      </bufferGeometry>
      <shaderMaterial
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        transparent
        depthWrite={false}
        blending={AdditiveBlending}
      />
    </points>
  );
}
