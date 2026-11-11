import { useMemo } from 'react';
import { AdditiveBlending, Color, DoubleSide } from 'three';
import { floorY } from './sceneMotion';

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  varying vec3 worldPosition;
  void main() {
    vUv = uv;
    worldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * viewMatrix * vec4(worldPosition, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  varying vec2 vUv;
  varying vec3 worldPosition;
  uniform vec3 rose;
  uniform vec3 violet;
  uniform float floorY;
  uniform float strength;
  void main() {
    float depth = floorY - worldPosition.y;
    if (depth < 0.0) discard;
    float fade = exp(-depth * 0.94) * (1.0 - smoothstep(0.0, 2.0, abs(worldPosition.z)));
    float ripple = 0.72 + 0.28 * sin(depth * 19.0 + worldPosition.x * 1.8);
    float band = 0.25 + 0.75 * pow(abs(sin(vUv.y * 6.283)), 3.0);
    vec3 tint = mix(violet, rose, 0.5 + 0.5 * sin(vUv.x * 12.566));
    gl_FragColor = vec4(tint, strength * fade * ripple * band);
    #include <colorspace_fragment>
  }
`;

export function FloorReflection({ strength }: { strength: number }) {
  const uniforms = useMemo(() => ({
    rose: { value: new Color('#ff77bc') },
    violet: { value: new Color('#9a3bf0') },
    floorY: { value: floorY },
    strength: { value: strength },
  }), [strength]);

  return (
    <shaderMaterial
      vertexShader={vertexShader}
      fragmentShader={fragmentShader}
      uniforms={uniforms}
      side={DoubleSide}
      transparent
      depthWrite={false}
      blending={AdditiveBlending}
    />
  );
}

