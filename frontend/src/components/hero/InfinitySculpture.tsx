import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import {
  AdditiveBlending,
  Color,
  DoubleSide,
  MathUtils,
  SRGBColorSpace,
  TextureLoader,
  Vector2,
  type Group,
  type Mesh,
  type ShaderMaterial as ShaderMaterialType,
} from 'three';
import { Glow } from './Glow';
import { cycle, floorY, type SceneMotion } from './sceneMotion';

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vWorldPos;
  uniform float time;

  void main() {
    vUv = uv;
    vec3 p = position;
    // Subtle organic breathing wave on the 3D surface
    p.z += sin(uv.x * 6.283 + time * 1.2) * 0.04;
    p.y += cos(uv.x * 3.141 - time * 0.9) * 0.025;

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    vWorldPos = (modelMatrix * vec4(p, 1.0)).xyz;
  }
`;

const fragmentShader = /* glsl */ `
  uniform sampler2D map;
  uniform float time;
  uniform float scroll;
  uniform vec2 mouse;
  varying vec2 vUv;
  varying vec3 vWorldPos;

  void main() {
    vec4 tex = texture2D(map, vUv);

    // Dynamic specular light gleam travelling along the glass ribbon
    float band = vUv.x * 8.0 - vUv.y * 4.0;
    float gleam1 = pow(0.5 + 0.5 * sin(band - time * 1.5), 10.0);
    float gleam2 = pow(0.5 + 0.5 * cos(vUv.x * 12.0 + time * 1.8), 12.0);

    // Warm rose and lavender gleam tints
    vec3 gleamPink = vec3(1.0, 0.65, 0.88);
    vec3 gleamWhite = vec3(1.0, 0.94, 0.98);

    // Breathing pulse
    float pulse = 0.97 + 0.03 * sin(time * 1.57);

    // Specular highlight boost on brighter areas of the glass
    float luminosity = dot(tex.rgb, vec3(0.299, 0.587, 0.114));
    vec3 highlight = (gleamPink * gleam1 + gleamWhite * gleam2) * smoothstep(0.35, 0.85, luminosity) * 0.42;

    vec3 finalColor = tex.rgb * pulse + highlight;

    // Smooth edge vignette to guarantee zero rectangular border or crop seam
    vec2 p = (vUv - 0.5) * 2.0;
    float edgeVignette = smoothstep(1.0, 0.72, length(p * vec2(0.96, 1.05)));
    float alpha = tex.a * edgeVignette * (1.0 - scroll * 0.4);

    if (alpha < 0.002) discard;

    gl_FragColor = vec4(finalColor, alpha);
    #include <colorspace_fragment>
  }
`;

// Dynamic glint positions across the infinity ribbon
const glintPositions: [number, number, number][] = [
  [1.52, 1.15, 0.35],   // Upper right pink crest
  [-2.41, 1.04, 0.32],  // Upper left violet loop
  [-0.57, -0.27, 0.42], // Center crossover
  [3.88, -0.31, 0.28],  // Far right lobe
  [-4.18, -0.26, 0.25], // Far left lobe
];

/**
 * InfinitySculpture Component
 * Integrates the exact bespoke liquid-glass infinity sculpture,
 * floating crystal lotus, and celestial halo into Three.js with:
 * - Real-time 3D interactive mouse parallax tilting (rotation.x, rotation.y)
 * - Continuous organic floating motion (sine-wave vertical drift)
 * - Dynamic travelling specular light gleams on the glass surface
 * - Luminous star glints pulsating on key reflection crests
 */
export function InfinitySculpture({ motion, compact }: { motion: SceneMotion; compact: boolean }) {
  const root = useRef<Group>(null);
  const mesh = useRef<Mesh>(null);
  const glints = useRef<Group>(null);

  const texture = useMemo(() => {
    const loader = new TextureLoader();
    const tex = loader.load('/images/hero-infinity-exact.png');
    tex.colorSpace = SRGBColorSpace;
    return tex;
  }, []);

  const uniforms = useMemo(
    () => ({
      map: { value: texture },
      time: { value: 0 },
      scroll: { value: 0 },
      mouse: { value: new Vector2() },
    }),
    [texture]
  );

  useEffect(() => () => texture.dispose(), [texture]);

  useFrame((state, delta) => {
    if (!root.current) return;
    const t = state.clock.elapsedTime;
    const { x, y, scroll } = motion.current;
    const ease = Math.min(delta, 0.1);

    uniforms.time.value = t;
    uniforms.scroll.value = scroll;
    uniforms.mouse.value.set(x, y);

    const group = root.current;

    // Interactive 3D mouse parallax tilt
    group.rotation.y = MathUtils.damp(group.rotation.y, x * 0.22, 3, ease);
    group.rotation.x = MathUtils.damp(group.rotation.x, -y * 0.14 - 0.04, 3, ease);
    group.rotation.z = MathUtils.damp(group.rotation.z, x * 0.04 - 0.015, 3, ease);

    // Continuous floating cycle (5 seconds)
    group.position.y = 0.12 + Math.sin((t * cycle) / 5) * 0.075 + scroll * 0.15;
    group.position.x = MathUtils.damp(group.position.x, x * 0.18, 3, ease);
    group.scale.setScalar((0.96 + 0.04 * MathUtils.smoothstep(t, 0, 1.5)) * (1 - scroll * 0.06));

    // Dynamic star sparkles pulsating on the glass crests
    glints.current?.children.forEach((glint, i) => {
      const pulse = 0.72 + 0.28 * Math.sin(t * 2.2 + i * 2.4);
      glint.scale.setScalar(pulse);
    });
  });

  return (
    <group ref={root}>
      {/* 3D Glass Sculpture & Lotus Surface Plane */}
      <mesh ref={mesh} position={[0, 0, 0]}>
        <planeGeometry args={[compact ? 9.2 : 10.92, compact ? 5.4 : 6.4, 32, 24]} />
        <shaderMaterial
          uniforms={uniforms}
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          transparent
          side={DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Pulsating Starlight Glints on High-Reflection Crests */}
      <group ref={glints}>
        {glintPositions.slice(0, compact ? 3 : 5).map(([gx, gy, gz], i) => (
          <group key={i} position={[gx, gy, gz]}>
            <Glow
              color={i % 2 === 0 ? '#ff8ec8' : '#c9a7f5'}
              size={i === 0 ? 0.75 : 0.55}
              rays={0.7}
              intensity={i === 0 ? 1.35 : 1.05}
            />
          </group>
        ))}
      </group>
    </group>
  );
}
