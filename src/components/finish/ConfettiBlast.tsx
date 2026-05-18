"use client";
import { useEffect } from "react";
import confetti from "canvas-confetti";

export default function ConfettiBlast() {
  useEffect(() => {
    const duration = 4000;
    const end = Date.now() + duration;

    const colors = ["#E8B400", "#1A1A1A", "#D62828", "#FFF3CC", "#FFFFFF"];

    (function frame() {
      confetti({
        particleCount: 6,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors,
      });
      confetti({
        particleCount: 6,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors,
      });
      if (Date.now() < end) requestAnimationFrame(frame);
    })();
  }, []);

  return null;
}
