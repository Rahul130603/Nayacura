import { Environment, Lightformer } from '@react-three/drei';

/**
 * HeroLighting Component
 * Creates the cinematic 3D lighting environment:
 * - Subtle ambient fill in soft lavender
 * - Powerful directional key light casting rose specular highlights
 * - Vibrant royal violet and bright pink rim & accent lights
 * - Multi-directional Lightformer environment emitters for realistic glass refraction and clearcoat reflections
 */
export function HeroLighting({ compact }: { compact: boolean }) {
  return (
    <>
      <ambientLight color="#edd5fa" intensity={0.55} />

      {/* Main directional key light - highlights the top curves */}
      <directionalLight color="#ffe8f6" intensity={2.6} position={[2.5, 4.5, 4.2]} />

      {/* Royal violet left rim light */}
      <pointLight color="#8d35c9" intensity={22} position={[-3.8, 1.0, 1.8]} distance={10} />

      {/* Bright rose pink right rim light */}
      <pointLight color="#ff8ec8" intensity={24} position={[3.5, 0.5, 1.6]} distance={10} />

      {/* Soft backlighting rim */}
      <pointLight color="#c9a7f5" intensity={15} position={[0, 1.8, -2.5]} distance={8} />

      {/* Warm lotus base light */}
      <pointLight color="#f29bc5" intensity={12} position={[0, -1.45, 0.8]} distance={5} />

      {/* Studio HDRI Lightformers for crystalline glass reflections */}
      <Environment resolution={compact ? 64 : 128}>
        {/* Overhead soft white-rose strip for top crest specular glint */}
        <Lightformer
          color="#fff5fc"
          intensity={5.2}
          position={[0.8, 4.2, 2.2]}
          rotation={[Math.PI / 2, 0, 0.28]}
          scale={[9, 1.2, 1]}
        />
        {/* Right side bright pink light strip */}
        <Lightformer
          color="#ff8ec8"
          intensity={4.2}
          position={[4.0, 0.5, 2.2]}
          target={[0, 0, 0]}
          scale={[1.8, 5.5, 1]}
        />
        {/* Left side royal violet glow panel */}
        <Lightformer
          color="#a855f7"
          intensity={3.8}
          position={[-4.2, 1.6, 1.4]}
          target={[0, 0, 0]}
          scale={[2.2, 5.5, 1]}
        />
        {/* Underneath subtle reflection strip */}
        <Lightformer
          color="#ffb6dc"
          intensity={2.8}
          position={[0, -3.2, 1.8]}
          target={[0, 0, 0]}
          scale={[8, 0.8, 1]}
        />
      </Environment>
    </>
  );
}
