"use client";
import { useEffect, useState } from "react";
import { calcElapsedSeconds, formatDuration } from "@/lib/game";

interface Props {
  startedAt: string;
  penaltyMinutes?: number;
}

export default function TimerBadge({ startedAt, penaltyMinutes = 0 }: Props) {
  const [elapsed, setElapsed] = useState(() => calcElapsedSeconds(startedAt));

  useEffect(() => {
    const id = setInterval(() => {
      setElapsed(calcElapsedSeconds(startedAt));
    }, 1000);
    return () => clearInterval(id);
  }, [startedAt]);

  const display = elapsed + penaltyMinutes * 60;

  return (
    <div className="flex items-center gap-2 bg-charcoal text-mustard px-3 py-1.5 rounded-lg font-mono font-bold text-sm border-2 border-mustard">
      <span className="animate-pulse-badge">⏱</span>
      <span>{formatDuration(display)}</span>
      {penaltyMinutes > 0 && (
        <span className="text-race-red text-xs">(+{penaltyMinutes}דק&apos; עונש)</span>
      )}
    </div>
  );
}
