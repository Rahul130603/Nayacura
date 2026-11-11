import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import {
  BufferAttribute,
  BufferGeometry,
  Color,
  FrontSide,
  MathUtils,
  MeshPhysicalMaterial,
  type Group,
} from 'three';
import { FloorReflection } from './FloorReflection';
import { Glow } from './Glow';
import { cycle, floorY, type SceneMotion } from './sceneMotion';

/**
 * Concentric layers of lotus petals:
 * - Outer tier: 8 broad, spread petals with gentle upward flare
 * - Middle tier: 8 cup-shaped petals cradling the core
 * - Inner tier: 6 slender, blooming petals wrapping around the glowing heart
 */
const petalLayers = [
  { count: 8, radius: 0.92, height: 0.55, width: 0.3, tilt: 0.14, tint: '#e84393', emissive: '#c2185b' },
  { count: 8, radius: 0.65, height: 0.76, width: 0.25, tilt: 0.06, tint: '#f472b6', emissive: '#db2777' },
  { count: 6, radius: 0.38, height: 0.66, width: 0.19, tilt: -0.04, tint: '#fce7f3', emissive: '#f43f5e' },
];

/**
 * Generates an organic, curved lotus petal geometry:
 * - Smooth parametric profile with natural width taper
 * - S-curved bend and pointed tip
 * - Central crease for specular highlights
 */
function createPetalGeometry() {
  const positions: number[] = [];
  const uv: number[] = [];
  const indices: number[] = [];
  const rows = 26;
  const columns = 14;

  for (let row = 0; row <= rows; row += 1) {
    const t = row / rows; // 0 (base) to 1 (tip)
    const profile = Math.sin(Math.PI * t) ** 0.82;

    for (let col = 0; col <= columns; col += 1) {
      const s = col / columns;
      const across = s * 2.0 - 1.0;

      const crease = Math.abs(across);
      const bowl = (1.0 - crease) * 0.18 * profile;

      const x = across * profile;
      const y = t ** 1.35 + profile * 0.12 - bowl * 0.4;
      const z = t * 0.95 + 0.18 * Math.sin(t * Math.PI) + bowl * 0.5;

      positions.push(x, y, z);
      uv.push(s, t);

      if (row < rows && col < columns) {
        const a = row * (columns + 1) + col;
        const b = a + columns + 1;
        indices.push(a, a + 1, b, b, a + 1, b + 1);
      }
    }
  }

  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(new Float32Array(positions), 3));
  geometry.setAttribute('uv', new BufferAttribute(new Float32Array(uv), 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

export function GlassLotus({ compact, motion }: { compact: boolean; motion: SceneMotion }) {
  const flower = useRef<Group>(null);
  const reflection = useRef<Group>(null);
  const core = useRef<Group>(null);

  const geometry = useMemo(createPetalGeometry, []);
  useEffect(() => () => geometry.dispose(), [geometry]);

  /**
   * Custom GLSL petal shader for luminous, crystal petal rendering
   */
  const addPetalShader: MeshPhysicalMaterial['onBeforeCompile'] = useCallback((shader) => {
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec2 petalUv;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\npetalUv = uv;');

    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying vec2 petalUv;')
      .replace(
        '#include <emissivemap_fragment>',
        /* glsl */ `
        #include <emissivemap_fragment>
        float edge = pow(abs(petalUv.x * 2.0 - 1.0), 10.0) * sin(petalUv.y * 3.14159);
        float midrib = exp(-abs(petalUv.x - 0.5) * 35.0) * (1.0 - petalUv.y * 0.4);
        float baseGlow = pow(1.0 - petalUv.y, 3.0);
        float tipGlow = pow(petalUv.y, 7.0) * 0.55;

        vec3 glowPink = vec3(1.0, 0.42, 0.72);
        vec3 glowWhite = vec3(1.0, 0.92, 0.97);

        totalEmissiveRadiance += glowPink * (baseGlow * 1.1 + midrib * 0.28 + edge * 0.75);
        totalEmissiveRadiance += glowWhite * tipGlow;
      `
      );
  }, []);

  const materials = useMemo(
    () =>
      petalLayers.map(({ tint, emissive }) => {
        const mat = new MeshPhysicalMaterial({
          color: tint,
          emissive: new Color(emissive),
          emissiveIntensity: 0.42,
          roughness: 0.12,
          metalness: 0.14,
          transmission: 0.58,
          thickness: 0.45,
          ior: 1.5,
          clearcoat: 1.0,
          clearcoatRoughness: 0.06,
          side: FrontSide,
          transparent: true,
          opacity: 0.95,
          depthWrite: false,
        });
        mat.onBeforeCompile = addPetalShader;
        return mat;
      }),
    [addPetalShader]
  );

  useEffect(() => () => materials.forEach((m) => m.dispose()), [materials]);

  useFrame(({ clock }) => {
    if (!flower.current || !core.current) return;
    const t = clock.elapsedTime;
    const { scroll } = motion.current;

    const opening = 0.052 * Math.sin((t * cycle) / 6);
    const lightPulse = 0.88 + 0.12 * Math.sin((t * cycle) / 4);
    const entrance = MathUtils.smoothstep(t, 0.2, 1.6);

    flower.current.position.y = floorY + 0.16 + 0.055 * Math.sin((t * cycle) / 5 + 0.8);
    flower.current.rotation.y = Math.sin(t * 0.25) * 0.18;
    flower.current.scale.setScalar((0.85 + 0.15 * entrance) * (1 - 0.08 * scroll));

    flower.current.children.forEach((layerGroup, layerIdx) => {
      layerGroup.children.forEach((holder) => {
        const petalMesh = holder.children[0];
        if (petalMesh) {
          petalMesh.rotation.x = petalLayers[layerIdx].tilt + opening * (1.0 + layerIdx * 0.4);
        }
      });
    });

    core.current.position.y = flower.current.position.y + 0.15;
    core.current.scale.setScalar(lightPulse * (0.6 + entrance * 0.4) * (1 - 0.45 * scroll));

    materials.forEach((mat) => {
      mat.emissiveIntensity = (0.28 + 0.32 * lightPulse) * entrance * (1 - scroll * 0.4);
    });

    if (reflection.current) {
      reflection.current.position.copy(flower.current.position);
      reflection.current.rotation.copy(flower.current.rotation);
      reflection.current.scale.copy(flower.current.scale);
    }
  });

  return (
    <>
      {/* 3D Glass Lotus Flower */}
      <group ref={flower} position={[0, floorY + 0.16, 0]}>
        {petalLayers.map(({ count, radius, height, width }, layerIndex) => {
          const petals = compact ? Math.max(4, count - 2) : count;
          return (
            <group key={radius} position={[0, layerIndex * 0.038, 0]}>
              {Array.from({ length: petals }, (_, i) => (
                <group key={i} rotation={[0, (cycle * (i + layerIndex * 0.5)) / petals, 0]}>
                  <mesh
                    geometry={geometry}
                    material={materials[layerIndex]}
                    scale={[width, height, radius]}
                  />
                </group>
              ))}
            </group>
          );
        })}
      </group>

      {/* Radiant Glowing Central Core */}
      <group ref={core} position={[0, floorY + 0.3, 0]}>
        <Glow color="#ff6ea7" size={1.55} rays={0.45} intensity={1.2} position={[0, 0, 0.16]} />
        <Glow color="#ffe0f0" size={0.75} rays={0.85} intensity={1.65} position={[0, 0, 0.22]} />
      </group>

      {/* Reflection underneath the glossy floor */}
      {!compact && (
        <group position={[0, 2 * floorY, 0]} scale={[1, -1, 1]}>
          <group ref={reflection}>
            {Array.from({ length: 8 }, (_, i) => (
              <mesh
                key={i}
                geometry={geometry}
                rotation={[0, (cycle * i) / 8, 0]}
                scale={[0.28, 0.52, 0.9]}
              >
                <FloorReflection strength={0.24} />
              </mesh>
            ))}
          </group>
        </group>
      )}
    </>
  );
}
