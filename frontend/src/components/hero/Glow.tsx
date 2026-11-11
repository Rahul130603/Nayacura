import { useMemo } from 'react';
import { AdditiveBlending, Color, type Vector3Tuple } from 'three';

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    vec4 center = modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0);
    // Keep the glow facing the camera while its center follows the scene.
    vec2 size = vec2(length(modelMatrix[0].xyz), length(modelMatrix[1].xyz));
    gl_Position = projectionMatrix * (center + vec4(position.xy * size, 0.0, 0.0));
  }
`;

const fragmentShader = /* glsl */ `
  varying vec2 vUv;
  uniform vec3 tint;
  uniform float rays;
  uniform float intensity;
  void main() {
    vec2 p = (vUv - 0.5) * 2.0;
    float r = length(p);
    float envelope = 1.0 - smoothstep(0.35, 1.0, r);
    float core = exp(-r * r * 110.0);
    float halo = exp(-r * r * 9.0) * 0.39;
    float cross = exp(-abs(p.y) * 44.0 - abs(p.x) * 5.0)
      + exp(-abs(p.x) * 48.0 - abs(p.y) * 7.5);
    float alpha = (core + halo + cross * rays * 0.55) * envelope * intensity;
    gl_FragColor = vec4(mix(tint, vec3(1.0, 0.86, 0.96), core), alpha);
    #include <colorspace_fragment>
  }
`;

export function Glow({
  color,
  size,
  rays = 0,
  intensity = 1,
  position,
}: {
  color: string;
  size: number;
  rays?: number;
  intensity?: number;
  position?: Vector3Tuple;
}) {
  const uniforms = useMemo(
    () => ({ tint: { value: new Color(color) }, rays: { value: rays }, intensity: { value: intensity } }),
    [color, rays, intensity],
  );
  return (
    <mesh position={position} scale={size} renderOrder={4}>
      <planeGeometry />
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        blending={AdditiveBlending}
        depthWrite={false}
      />
    </mesh>
  );
}

