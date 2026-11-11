import { useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { AdditiveBlending } from 'three';
import { floorY, type SceneMotion } from './sceneMotion';

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  varying vec2 vUv;
  uniform float time;
  uniform float dim;
  uniform float detail;

  float gaussianRing(float dist, float radius, float width) {
    float d = (dist - radius) / width;
    return exp(-d * d);
  }

  void main() {
    // Transform UV to center at the lotus base
    vec2 p = (vUv - vec2(0.5, 0.48)) * vec2(2.8, 1.6);
    float r = length(p);

    // Floor boundary soft vignette
    float edge = 1.0 - smoothstep(0.55, 1.15, r);

    // Core radiant pool of light from the glowing lotus
    float lotusCoreGlow = exp(-length(p * vec2(4.5, 4.0)) * 2.2);

    // Dynamic expanding circular ripples under the lotus (matching visual reference)
    float ripples = 0.0;
    for (int i = 0; i < 4; i++) {
      float phase = fract(time * 0.18 + float(i) * 0.25);
      float radius = 0.08 + phase * 0.95;
      float envelope = sin(phase * 3.14159);
      // Sharp crest + soft luminous halo for each ripple
      float crest = gaussianRing(r, radius, 0.0045) * 0.75;
      float halo = gaussianRing(r, radius, 0.038) * 0.35;
      ripples += envelope * (crest + halo);
    }

    // Static concentric reference rings
    float baseRings = gaussianRing(r, 0.16, 0.006) * 0.45 
                    + gaussianRing(r, 0.38, 0.007) * 0.35 
                    + gaussianRing(r, 0.65, 0.009) * 0.22;

    // Specular floor wash from the infinity sculpture
    float sculptureWash = exp(-dot(p, p) * 3.8) * 0.32;
    float loopReflection = gaussianRing(p.y + 0.15, 0.28, 0.25) * (
      gaussianRing(p.x - 0.52, 0.0, 0.18) + gaussianRing(p.x + 0.52, 0.0, 0.18)
    );

    // Color gradient across the floor: deep royal violet to vibrant rose
    vec3 floorViolet = vec3(0.38, 0.04, 0.58);
    vec3 floorRose   = vec3(1.0, 0.32, 0.62);
    vec3 floorWhite  = vec3(1.0, 0.82, 0.94);

    vec3 tint = mix(floorViolet, floorRose, clamp(1.0 - abs(p.x) * 0.8 + 0.3 * p.y, 0.0, 1.0));
    tint = mix(tint, floorWhite, lotusCoreGlow * 0.85 + ripples * 0.25);

    float alpha = (sculptureWash + lotusCoreGlow * 0.92 + ripples * 0.55 + baseRings * 0.35 + loopReflection * detail * 0.28) * edge * dim;

    gl_FragColor = vec4(tint, alpha);
    #include <colorspace_fragment>
  }
`;

const shadowFragment = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vec2 p = (vUv - 0.5) * 2.0;
    float radius = dot(p, p);
    float shadow = exp(-radius * 4.8) * (1.0 - smoothstep(0.4, 1.0, radius));
    gl_FragColor = vec4(0.045, 0.012, 0.062, 0.42 * shadow);
  }
`;

export function ReflectiveFloor({ compact, motion }: { compact: boolean; motion: SceneMotion }) {
  const uniforms = useMemo(
    () => ({
      time: { value: 0 },
      dim: { value: 1 },
      detail: { value: compact ? 0.35 : 1 },
    }),
    [compact]
  );

  useFrame(({ clock }) => {
    uniforms.time.value = clock.elapsedTime;
    uniforms.dim.value =
      0.75 + 0.25 * Math.sin(clock.elapsedTime * 1.57) ** 2 - motion.current.scroll * 0.35;
  });

  return (
    <>
      <mesh position={[0, floorY, 0.18]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={3}>
        <planeGeometry args={[9.2, 5.0]} />
        <shaderMaterial
          uniforms={uniforms}
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          blending={AdditiveBlending}
          transparent
          depthWrite={false}
        />
      </mesh>
      {!compact && (
        <mesh
          position={[0, floorY + 0.005, 0.04]}
          rotation={[-Math.PI / 2, 0, 0]}
          renderOrder={3}
        >
          <planeGeometry args={[2.2, 1.5]} />
          <shaderMaterial
            vertexShader={vertexShader}
            fragmentShader={shadowFragment}
            transparent
            depthWrite={false}
          />
        </mesh>
      )}
    </>
  );
}
