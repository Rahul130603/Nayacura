import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { AdditiveBlending, Color, DoubleSide, MathUtils, type Group, type Vector3Tuple } from 'three';
import { Glow } from './Glow';
import { cycle, type SceneMotion } from './sceneMotion';

const vertexShader = /* glsl */ `
  varying vec2 vLocal;
  void main() {
    vLocal = position.xy;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  uniform vec3 tint;
  uniform float radius;
  uniform float time;
  uniform float entrance;
  varying vec2 vLocal;

  void main() {
    float angle = atan(vLocal.y, vLocal.x);
    // Dynamic light pulse streaming along the orbit
    float stream = pow(0.5 + 0.5 * cos(angle * 2.0 - time), 6.0);
    float spark = pow(0.5 + 0.5 * cos(angle * 6.0 + time * 1.5), 14.0);

    float offset = length(vLocal) - radius;
    float aa = fwidth(offset);
    // Crisp thin core ring
    float core = 1.0 - smoothstep(0.002, 0.003 + aa, abs(offset));
    // Soft atmospheric aura
    float halo = exp(-offset * offset * 2200.0) * 0.35;

    float alpha = (core + halo) * (0.28 + 0.72 * stream + 0.45 * spark) * entrance;
    vec3 col = mix(tint, vec3(1.0, 0.92, 0.98), core * 0.35);

    gl_FragColor = vec4(col, alpha);
    #include <colorspace_fragment>
  }
`;

/**
 * 3 Celestial Orbits with distinct radii, inclinations, and velocities
 * Designed to frame the infinity sculpture and echo the visual reference
 */
const orbits = [
  // Primary sweeping horizontal orbit cutting through the sculpture
  { radius: 4.55, flatten: 0.85, pitch: 1.25, roll: 0.22, z: 0.08, speed: 0.32, color: '#ff8ec8', sparkCount: 4 },
  // Counter-inclined lavender orbit
  { radius: 4.25, flatten: 0.88, pitch: 1.18, roll: -0.32, z: -0.15, speed: -0.25, color: '#c9a7f5', sparkCount: 3 },
  // Outer delicate halo ring
  { radius: 4.88, flatten: 0.76, pitch: 1.42, roll: 0.12, z: -0.28, speed: 0.18, color: '#f29bc5', sparkCount: 3 },
];

function Orbit({
  orbit,
  motion,
  index,
}: {
  orbit: (typeof orbits)[number];
  motion: SceneMotion;
  index: number;
}) {
  const group = useRef<Group>(null);
  const sparks = useRef<Group>(null);

  const uniforms = useMemo(
    () => ({
      tint: { value: new Color(orbit.color) },
      radius: { value: orbit.radius },
      time: { value: 0 },
      entrance: { value: 0 },
    }),
    [orbit]
  );

  useFrame(({ clock }) => {
    if (!group.current) return;
    const time = clock.elapsedTime;
    const { scroll, x, y } = motion.current;

    uniforms.time.value = time * orbit.speed * 2.2;
    uniforms.entrance.value =
      MathUtils.smoothstep(time, 0.2 + index * 0.12, 1.35 + index * 0.12) * (1 - scroll * 0.35);

    // Subtle responsive tilt
    group.current.rotation.x =
      orbit.pitch + Math.sin(time * 0.42 + index) * 0.04 + scroll * 0.12 - y * 0.06;
    group.current.rotation.z =
      orbit.roll + Math.sin(time * 0.28 + index) * 0.038 + x * 0.08;

    // Animate glowing starlight beads travelling along each trajectory
    sparks.current?.children.forEach((spark, i) => {
      const angle = time * orbit.speed + (i * cycle) / orbit.sparkCount + index * 0.85;
      spark.position.set(
        Math.cos(angle) * orbit.radius,
        Math.sin(angle) * orbit.radius * orbit.flatten,
        0.02
      );
      const twinkle = 0.75 + 0.25 * Math.sin(time * 2.4 + i * 2.1);
      spark.scale.setScalar(uniforms.entrance.value * twinkle);
    });
  });

  return (
    <group ref={group} position={[0, 0.04, orbit.z]} rotation={[orbit.pitch, 0, orbit.roll]}>
      <mesh scale={[1, orbit.flatten, 1]} renderOrder={1}>
        <ringGeometry args={[orbit.radius - 0.048, orbit.radius + 0.048, 180]} />
        <shaderMaterial
          uniforms={uniforms}
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          side={DoubleSide}
          transparent
          depthWrite={false}
          blending={AdditiveBlending}
        />
      </mesh>
      <group ref={sparks}>
        {Array.from({ length: orbit.sparkCount }, (_, i) => (
          <group key={i}>
            <Glow color={orbit.color} size={0.34} rays={0.75} intensity={1.25} />
          </group>
        ))}
      </group>
    </group>
  );
}

export function OrbitRings({ compact, motion }: { compact: boolean; motion: SceneMotion }) {
  const position: Vector3Tuple = [0, 0.18, 0];
  return (
    <group position={position}>
      {orbits.slice(0, compact ? 2 : 3).map((orbit, index) => (
        <Orbit key={orbit.radius} orbit={orbit} motion={motion} index={index} />
      ))}
    </group>
  );
}
