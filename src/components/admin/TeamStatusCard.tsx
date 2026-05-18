"use client";
import { Team, TeamProgress, Station, Player } from "@/types/supabase";
import { TOTAL_STATIONS, formatDuration, calcElapsedSeconds } from "@/lib/game";
import { useEffect, useState } from "react";

interface Props {
  team: Team;
  progress: (TeamProgress & { station: Station })[];
  teamPlayers: Player[];
  onStart: (id: string) => Promise<unknown>;
  onReset: (id: string) => Promise<unknown>;
  onAddPenalty: (id: string, minutes: number) => Promise<unknown>;
  onFinish: (id: string) => Promise<unknown>;
  onDelete: (id: string) => Promise<unknown>;
}

export default function TeamStatusCard({ team, progress, teamPlayers, onStart, onReset, onAddPenalty, onFinish, onDelete }: Props) {
  const [elapsed, setElapsed] = useState(0);
  const [busy, setBusy] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const completedCount = progress.filter((p) => p.status === "completed").length;
  const currentStation = progress.find((p) => p.status === "active")?.station;
  const finished  = !!team.finished_at;
  const started   = !!team.started_at;       // timer running
  const unlocked  = !!team.unlocked_at && !team.started_at; // on instructions page
  const active    = started || unlocked;
  const totalSeconds = elapsed + team.total_penalties_minutes * 60;

  useEffect(() => {
    if (!team.started_at) return;
    setElapsed(calcElapsedSeconds(team.started_at));
    const id = setInterval(() => setElapsed(calcElapsedSeconds(team.started_at!)), 1000);
    return () => clearInterval(id);
  }, [team.started_at]);

  async function run(fn: () => Promise<unknown>) {
    setBusy(true);
    await fn();
    setBusy(false);
  }

  // Visual state
  const cardBorder = finished
    ? "1px solid rgba(74,222,128,0.35)"
    : started
    ? "1px solid rgba(255,215,0,0.35)"
    : unlocked
    ? "1px solid rgba(74,154,222,0.3)"
    : "1px solid rgba(255,255,255,0.1)";
  const cardBg = finished
    ? "rgba(34,197,94,0.07)"
    : started
    ? "rgba(255,215,0,0.06)"
    : unlocked
    ? "rgba(74,154,222,0.05)"
    : "rgba(255,255,255,0.04)";

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: cardBg, border: cardBorder }}>

      {/* ── Status stripe ── */}
      <div
        className="h-1 w-full"
        style={{
          background: finished
            ? "linear-gradient(90deg,#22c55e,#4ade80)"
            : started
            ? "linear-gradient(90deg,#FFB800,#FFD700)"
            : unlocked
            ? "linear-gradient(90deg,#3a7ab8,#4a9ade)"
            : "rgba(255,255,255,0.08)",
        }}
      />

      <div className="p-4 flex flex-col gap-3">

        {/* ── Header row ── */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-black text-white text-base leading-tight">{team.name}</h3>
              <StatusBadge finished={finished} started={started} unlocked={unlocked} />
            </div>
            <p className="text-[11px] font-mono mt-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>
              קוד: <span style={{ color: "rgba(255,255,255,0.55)" }}>{team.access_code}</span>
            </p>
          </div>

          {/* Timer */}
          {started && (
            <div
              className="shrink-0 rounded-xl px-3 py-2 text-center"
              style={{
                background: "rgba(0,0,0,0.3)",
                border: finished ? "1px solid rgba(74,222,128,0.25)" : "1px solid rgba(255,215,0,0.25)",
              }}
            >
              <p
                className="font-mono font-black text-lg leading-none"
                style={{ color: finished ? "#4ade80" : "#FFD700" }}
              >
                {formatDuration(totalSeconds)}
              </p>
              {team.total_penalties_minutes > 0 && (
                <p className="text-[10px] mt-0.5" style={{ color: "#ff6b6b" }}>
                  +{team.total_penalties_minutes}′ עונש
                </p>
              )}
            </div>
          )}
        </div>

        {/* ── Players ── */}
        {teamPlayers.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {teamPlayers.map((p) => (
              <span
                key={p.id}
                className="text-[11px] font-bold px-2.5 py-1 rounded-full"
                style={{ background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)" }}
              >
                👤 {p.name}
              </span>
            ))}
          </div>
        )}

        {/* ── Progress (only if timer running) ── */}
        {started && (
          <div>
            <div className="flex justify-between text-[11px] font-bold mb-1.5" style={{ color: "rgba(255,255,255,0.4)" }}>
              <span>התקדמות</span>
              <span style={{ color: "rgba(255,255,255,0.7)" }}>{completedCount}/{TOTAL_STATIONS}</span>
            </div>
            <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.1)" }}>
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${(completedCount / TOTAL_STATIONS) * 100}%`,
                  background: finished ? "#22c55e" : "linear-gradient(90deg,#FFB800,#FFD700)",
                }}
              />
            </div>
            {currentStation && !finished && (
              <p className="text-[11px] mt-1.5" style={{ color: "rgba(255,255,255,0.5)" }}>
                📍 תחנה {currentStation.order_num}: <span className="font-bold text-white/70">{currentStation.title}</span>
              </p>
            )}
          </div>
        )}

        {/* ── Penalty controls (only if timer running) ── */}
        {started && (
          <div
            className="flex items-center gap-3 px-3 py-2 rounded-xl"
            style={{ background: "rgba(0,0,0,0.25)", border: "1px solid rgba(255,255,255,0.07)" }}
          >
            <span className="text-[11px] font-bold" style={{ color: "rgba(255,255,255,0.4)" }}>עונש:</span>
            <span
              className="font-black text-sm flex-1"
              style={{ color: team.total_penalties_minutes > 0 ? "#ff6b6b" : "rgba(255,255,255,0.25)" }}
            >
              {team.total_penalties_minutes > 0 ? `+${team.total_penalties_minutes} דקות` : "אין"}
            </span>
            <div className="flex gap-1.5">
              <SmBtn
                onClick={() => run(() => onAddPenalty(team.id, -5))}
                disabled={busy || team.total_penalties_minutes === 0}
                color="gray"
              >−5′</SmBtn>
              <SmBtn
                onClick={() => run(() => onAddPenalty(team.id, 5))}
                disabled={busy}
                color="red"
              >+5′</SmBtn>
            </div>
          </div>
        )}

        {/* ── Divider ── */}
        <div style={{ height: "1px", background: "rgba(255,255,255,0.07)" }} />

        {/* ── Action buttons ── */}
        <div className="flex flex-wrap gap-2">

          {/* NOT UNLOCKED */}
          {!active && !finished && (
            <Btn onClick={() => run(() => onStart(team.id))} disabled={busy} color="gold" className="flex-1">
              🏁 שחרר לקבוצה
            </Btn>
          )}

          {/* UNLOCKED but not started (on instructions page) */}
          {unlocked && (
            <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: "rgba(74,154,222,0.1)", border: "1px solid rgba(74,154,222,0.25)" }}>
              <span className="text-sm animate-pulse-badge">📋</span>
              <span className="text-xs font-bold" style={{ color: "#4a9ade" }}>קוראים הוראות...</span>
            </div>
          )}

          {/* STARTED, NOT FINISHED */}
          {started && !finished && (
            <Btn onClick={() => run(() => onFinish(team.id))} disabled={busy} color="green" className="flex-1">
              🏆 סיים ידנית
            </Btn>
          )}

          {/* RESET (unlocked, started, or finished) */}
          {(active || finished) && (
            confirmReset ? (
              <>
                <Btn onClick={() => { run(() => onReset(team.id)); setConfirmReset(false); }} disabled={busy} color="red" className="flex-1">
                  ✓ אישור איפוס
                </Btn>
                <Btn onClick={() => setConfirmReset(false)} disabled={busy} color="ghost">
                  ביטול
                </Btn>
              </>
            ) : (
              <Btn onClick={() => setConfirmReset(true)} disabled={busy} color="ghost">
                ↺ איפוס
              </Btn>
            )
          )}

          {/* DELETE (any state) */}
          {confirmDelete ? (
            <>
              <Btn onClick={() => { run(() => onDelete(team.id)); setConfirmDelete(false); }} disabled={busy} color="red" className="flex-1">
                🗑 אישור מחיקה
              </Btn>
              <Btn onClick={() => setConfirmDelete(false)} disabled={busy} color="ghost">
                ביטול
              </Btn>
            </>
          ) : (
            <Btn onClick={() => setConfirmDelete(true)} disabled={busy} color="ghost">
              🗑
            </Btn>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Tiny helpers ─── */

function StatusBadge({ finished, started, unlocked }: { finished: boolean; started: boolean; unlocked: boolean }) {
  if (finished) return (
    <span className="text-[10px] font-black px-2 py-0.5 rounded-full" style={{ background: "rgba(34,197,94,0.2)", color: "#4ade80", border: "1px solid rgba(34,197,94,0.3)" }}>
      ✓ סיים
    </span>
  );
  if (started) return (
    <span className="text-[10px] font-black px-2 py-0.5 rounded-full animate-pulse-badge" style={{ background: "rgba(255,215,0,0.15)", color: "#FFD700", border: "1px solid rgba(255,215,0,0.3)" }}>
      ● רץ
    </span>
  );
  if (unlocked) return (
    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "rgba(74,154,222,0.15)", color: "#4a9ade", border: "1px solid rgba(74,154,222,0.3)" }}>
      📋 בהוראות
    </span>
  );
  return (
    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.4)" }}>
      ממתין
    </span>
  );
}

function SmBtn({ onClick, disabled, color, children }: {
  onClick: () => void; disabled: boolean; color: "red" | "gray"; children: React.ReactNode;
}) {
  const s = {
    red: { background: "rgba(214,40,40,0.25)", color: "#ff6b6b", border: "1px solid rgba(214,40,40,0.35)" },
    gray: { background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.12)" },
  }[color];
  return (
    <button onClick={onClick} disabled={disabled} className="text-xs font-black px-2.5 py-1 rounded-lg disabled:opacity-30" style={s}>
      {children}
    </button>
  );
}

function Btn({ onClick, disabled, color, children, className = "" }: {
  onClick: () => void; disabled: boolean;
  color: "gold" | "green" | "red" | "ghost";
  children: React.ReactNode; className?: string;
}) {
  const s = {
    gold: { background: "linear-gradient(180deg,#FFD700,#E8A000)", color: "#1a0a00", border: "none" },
    green: { background: "rgba(34,197,94,0.2)", color: "#4ade80", border: "1px solid rgba(34,197,94,0.35)" },
    red: { background: "rgba(214,40,40,0.2)", color: "#ff6b6b", border: "1px solid rgba(214,40,40,0.35)" },
    ghost: { background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.12)" },
  }[color];
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`text-xs font-black px-3 py-2.5 rounded-xl disabled:opacity-30 ${className}`}
      style={s}
    >
      {children}
    </button>
  );
}
