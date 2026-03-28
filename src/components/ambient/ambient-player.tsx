"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface AmbientSound {
  id: string;
  label: string;
  icon: React.ReactNode;
  src: string;
}

const SOUNDS: AmbientSound[] = [
  {
    id: "rain",
    label: "Rain",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
        <path d="M16 14v6" /><path d="M8 14v6" /><path d="M12 16v6" />
      </svg>
    ),
    src: "/sounds/rain.mp3",
  },
  {
    id: "fire",
    label: "Fire",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
      </svg>
    ),
    src: "/sounds/fire.mp3",
  },
  {
    id: "wind",
    label: "Wind",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <path d="M17.7 7.7a2.5 2.5 0 1 1 1.8 4.3H2" />
        <path d="M9.6 4.6A2 2 0 1 1 11 8H2" />
        <path d="M12.6 19.4A2 2 0 1 0 14 16H2" />
      </svg>
    ),
    src: "/sounds/wind.mp3",
  },
  {
    id: "forest",
    label: "Forest",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <path d="M12 2L7 9h3l-4 7h4l-5 8h14l-5-8h4l-4-7h3L12 2z" />
      </svg>
    ),
    src: "/sounds/forest.mp3",
  },
];

export function AmbientPlayer() {
  const [activeSound, setActiveSound] = useState<string | null>(null);
  const [volume, setVolume] = useState(0.5);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const stopSound = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    setActiveSound(null);
  }, []);

  const playSound = useCallback(
    (sound: AmbientSound) => {
      if (activeSound === sound.id) {
        stopSound();
        return;
      }
      stopSound();

      const audio = new Audio(sound.src);
      audio.loop = true;
      audio.volume = volume;
      audio.play();
      audioRef.current = audio;
      setActiveSound(sound.id);
    },
    [activeSound, stopSound, volume]
  );

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  return (
    <motion.div
      className="w-full max-w-md mx-auto"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.5 }}
    >
      <h2 className="text-xl font-semibold mb-4" style={{ fontFamily: "var(--font-heading), serif" }}>
        Ambient
      </h2>

      <div className="grid grid-cols-4 gap-2">
        {SOUNDS.map((sound) => {
          const isActive = activeSound === sound.id;
          return (
            <motion.button
              key={sound.id}
              whileTap={{ scale: 0.93 }}
              whileHover={{ scale: 1.03 }}
              onClick={() => playSound(sound)}
              className={`cursor-pointer flex flex-col items-center gap-2 rounded-xl border p-3.5 transition-all duration-200 ${
                isActive
                  ? "border-primary/20 bg-primary/8 text-primary shadow-sm"
                  : "border-border/30 bg-card/30 text-muted-foreground hover:text-foreground hover:bg-card/60 backdrop-blur-sm"
              }`}
              aria-label={`${isActive ? "Stop" : "Play"} ${sound.label}`}
            >
              {sound.icon}
              <span className="text-xs font-medium tracking-wide">{sound.label}</span>
            </motion.button>
          );
        })}
      </div>

      <AnimatePresence>
        {activeSound && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 flex items-center gap-3 px-1 overflow-hidden"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-muted-foreground/40 shrink-0">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19" />
            </svg>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="flex-1 h-1 appearance-none rounded-full bg-border/50 cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:cursor-pointer"
              aria-label="Ambient volume"
            />
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-muted-foreground/40 shrink-0">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19" />
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
            </svg>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
