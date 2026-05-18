"use client";
import { useState } from "react";
import Button from "@/components/ui/Button";
import { HINT_PENALTY_MINUTES } from "@/lib/game";

interface Props {
  hint: string;
  hintsUsed: number;
  onUseHint: () => Promise<void>;
}

export default function HintButton({ hint, hintsUsed, onUseHint }: Props) {
  const [state, setState] = useState<"idle" | "confirm" | "revealed" | "loading">("idle");
  const isLoading = state === "loading";

  async function handleConfirm() {
    setState("loading");
    await onUseHint();
    setState("revealed");
  }

  if (state === "revealed" || hintsUsed > 0) {
    return (
      <div className="bg-mustard-light border-2 border-mustard rounded-xl p-4 animate-slide-up">
        <p className="text-xs font-bold text-charcoal uppercase tracking-wider mb-1">
          רמז (עונש: {hintsUsed * HINT_PENALTY_MINUTES} דקות)
        </p>
        <p className="text-charcoal font-semibold text-base leading-relaxed">{hint}</p>
      </div>
    );
  }

  if (state === "confirm") {
    return (
      <div className="bg-race-red/10 border-2 border-race-red rounded-xl p-4 animate-slide-up">
        <p className="font-bold text-charcoal mb-3 text-center">
          שימוש ברמז יוסיף <span className="text-race-red">{HINT_PENALTY_MINUTES} דקות עונש</span>. להמשיך?
        </p>
        <div className="flex gap-3">
          <Button variant="red" size="sm" fullWidth loading={isLoading} onClick={handleConfirm}>
            כן, תן רמז
          </Button>
          <Button variant="ghost" size="sm" fullWidth onClick={() => setState("idle")}>
            ביטול
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Button variant="ghost" size="sm" onClick={() => setState("confirm")}>
      💡 צריך רמז? (+{HINT_PENALTY_MINUTES} דקות)
    </Button>
  );
}
