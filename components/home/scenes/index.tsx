"use client";

import type { ComponentType } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { SceneId } from "@/lib/home/scenes";
import { useHydrated } from "@/lib/home/store";
import CafeScene from "./CafeScene";
import HillScene from "./HillScene";
import PhotoScene, { type PhotoId } from "./PhotoScene";
import RainScene from "./RainScene";
import SunsetScene from "./SunsetScene";

const photo = (id: PhotoId) => {
  const Scene = () => <PhotoScene id={id} />;
  Scene.displayName = `PhotoScene(${id})`;
  return Scene;
};

/** Each scene's live background. Metadata lives in lib/home/scenes.ts. */
const BACKGROUNDS: Record<SceneId, ComponentType> = {
  rain: RainScene,
  hill: HillScene,
  sunset: SunsetScene,
  cafe: CafeScene,
  "p-aurora": photo("aurora"),
  "p-forest": photo("forest"),
  "p-space": photo("space"),
  "p-sunset": photo("sunset"),
};

/**
 * Fixed behind the page. Renders nothing until hydrated: the stored scene is
 * only known on the client, and mounting the wrong canvas first would mean
 * starting and tearing down a whole animation for nothing. The wrapper's
 * ground colour already matches the scene, so the canvas fades in over it.
 */
const SceneBackground = ({ scene }: { scene: SceneId }) => {
  const hydrated = useHydrated();
  const Background = BACKGROUNDS[scene];

  return (
    <div
      aria-hidden="true"
      className="bg-background pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      <AnimatePresence>
        {hydrated && (
          <motion.div
            key={scene}
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease: "easeInOut" }}
          >
            <Background />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SceneBackground;
