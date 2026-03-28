"use client";

import { useCallback } from "react";
import confetti from "canvas-confetti";

export function useConfetti() {
  const fireConfetti = useCallback(() => {
    // Forest + Champagne themed confetti
    const colors = ["#102C26", "#F7E7CE", "#C4A35A", "#2D5A4A", "#D4C4A0"];

    // First burst
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors,
      shapes: ["circle", "square"],
      gravity: 0.8,
      scalar: 1.2,
      drift: 0,
      ticks: 200,
    });

    // Second burst delayed
    setTimeout(() => {
      confetti({
        particleCount: 40,
        spread: 100,
        origin: { y: 0.5, x: 0.3 },
        colors,
        shapes: ["circle"],
        gravity: 0.6,
        scalar: 0.8,
      });
    }, 200);

    setTimeout(() => {
      confetti({
        particleCount: 40,
        spread: 100,
        origin: { y: 0.5, x: 0.7 },
        colors,
        shapes: ["circle"],
        gravity: 0.6,
        scalar: 0.8,
      });
    }, 400);
  }, []);

  return { fireConfetti };
}
