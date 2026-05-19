"use client";
import { useEffect } from "react";
import confetti from "canvas-confetti";

export default function ConfettiBlast() {
  useEffect(() => {
    const duration = 6000;
    const end = Date.now() + duration;
    const colors = ["#FFD700", "#FF6B35", "#D62828", "#4ade80", "#FFFFFF", "#FFF3CC", "#4a9ade"];

    // Initial big burst
    confetti({ particleCount: 120, spread: 100, startVelocity: 45, origin: { y: 0.6 }, colors });

    // Side streams
    (function frame() {
      confetti({ particleCount: 10, angle: 60,  spread: 65, origin: { x: 0 }, colors });
      confetti({ particleCount: 10, angle: 120, spread: 65, origin: { x: 1 }, colors });
      if (Date.now() < end) requestAnimationFrame(frame);
    })();

    // Late surprise burst at 2s
    setTimeout(() => {
      confetti({ particleCount: 80, spread: 120, startVelocity: 55, origin: { x: 0.5, y: 0.5 }, colors });
    }, 2000);
  }, []);

  return null;
}
