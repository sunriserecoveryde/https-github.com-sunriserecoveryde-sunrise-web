import { useEffect } from 'react';
import { useVideoPlayer } from '@/lib/video';
import { AnimatePresence, motion } from 'framer-motion';

import { Scene0Hero } from './video_scenes/Scene0Hero';
import { Scene1Problem } from './video_scenes/Scene1Problem';
import { Scene2Features } from './video_scenes/Scene2Features';
import { Scene3Stats } from './video_scenes/Scene3Stats';
import { Scene4Outro } from './video_scenes/Scene4Outro';

export const SCENE_DURATIONS: Record<string, number> = {
  hero: 4000,
  problem: 5000,
  features: 8000,
  stats: 6000,
  outro: 5000,
};

const SCENE_COMPONENTS: Record<string, React.ComponentType> = {
  hero: Scene0Hero,
  problem: Scene1Problem,
  features: Scene2Features,
  stats: Scene3Stats,
  outro: Scene4Outro,
};

export default function VideoTemplate({
  durations = SCENE_DURATIONS,
  loop = true,
  onSceneChange,
}: {
  durations?: Record<string, number>;
  loop?: boolean;
  onSceneChange?: (sceneKey: string) => void;
} = {}) {
  const { currentScene, currentSceneKey } = useVideoPlayer({ durations, loop });

  useEffect(() => {
    onSceneChange?.(currentSceneKey);
  }, [currentSceneKey, onSceneChange]);

  const baseSceneKey = currentSceneKey.replace(/_r[12]$/, '') as keyof typeof SCENE_DURATIONS;
  const sceneIndex = Object.keys(SCENE_DURATIONS).indexOf(baseSceneKey);
  const SceneComponent = SCENE_COMPONENTS[baseSceneKey];

  // Per-scene position values for persistent midground elements
  const orb1X = ['45vw', '-5vw', '60vw', '20vw', '40vw'][sceneIndex] ?? '45vw';
  const orb1Y = ['20vh', '40vh', '10vh', '60vh', '30vh'][sceneIndex] ?? '20vh';
  const orb2X = ['10vw', '70vw', '5vw', '50vw', '55vw'][sceneIndex] ?? '10vw';
  const orb2Y = ['60vh', '10vh', '70vh', '20vh', '55vh'][sceneIndex] ?? '60vh';
  const accentLineWidth = ['40%', '0%', '60%', '80%', '30%'][sceneIndex] ?? '40%';

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[#0F172A]">
      {/* Persistent ambient orbs — live outside AnimatePresence */}
      <motion.div
        className="absolute w-[50vw] h-[50vw] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(249,115,22,0.12), transparent 70%)' }}
        animate={{ x: orb1X, y: orb1Y }}
        transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
      />
      <motion.div
        className="absolute w-[40vw] h-[40vw] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(37,99,235,0.1), transparent 70%)' }}
        animate={{ x: orb2X, y: orb2Y }}
        transition={{ duration: 1.8, ease: [0.16, 1, 0.3, 1] }}
      />

      {/* Persistent background image — morphs opacity per scene */}
      <motion.div
        className="absolute inset-0 w-full h-full pointer-events-none"
        animate={{
          opacity: sceneIndex === 1 ? 0 : 0.35,
          scale: sceneIndex === 4 ? 1 : 1.08,
          filter: sceneIndex === 2 ? 'blur(12px)' : 'blur(0px)',
        }}
        transition={{ duration: 1.8, ease: 'easeInOut' }}
      >
        <img
          src={`${import.meta.env.BASE_URL}bg-abstract.jpg`}
          alt=""
          className="w-full h-full object-cover mix-blend-screen"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A] via-transparent to-[#0F172A]" />
      </motion.div>

      {/* Persistent accent line */}
      <motion.div
        className="absolute top-[10%] left-0 h-[2px] bg-gradient-to-r from-[#F97316] to-transparent pointer-events-none"
        animate={{ width: accentLineWidth, opacity: sceneIndex === 4 ? 0.3 : 0.7 }}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
      />

      {/* Scene-specific foreground */}
      <AnimatePresence mode="popLayout">
        {SceneComponent && <SceneComponent key={currentSceneKey} />}
      </AnimatePresence>
    </div>
  );
}
