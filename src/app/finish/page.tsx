"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { TEAM_SESSION_KEY, formatDuration, calcFinalScore } from "@/lib/game";
import { Team, GameEvent, LeaderboardEntry } from "@/types/supabase";
import ConfettiBlast from "@/components/finish/ConfettiBlast";

const MEDALS = ["🥇", "🥈", "🥉"];

export default function FinishPage() {
  const router = useRouter();
  const [team, setTeam] = useState<Team | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [tick, setTick] = useState(0);
  const [visibleCount, setVisibleCount] = useState(0);

  useEffect(() => {
    const raw = localStorage.getItem(TEAM_SESSION_KEY);
    if (!raw) { router.replace("/"); return; }
    const t: Team = JSON.parse(raw);
    if (!t.unlocked_at) { router.replace("/waiting"); return; }
    setTeam(t);

    const supabase = createClient();
    const channel = supabase
      .channel("game-events-finish")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "game_events" },
        (payload) => {
          const event = payload.new as GameEvent;
          if (event.type === "reveal_winner" && event.payload) {
            const lb = (event.payload as { leaderboard: LeaderboardEntry[] }).leaderboard;
            setLeaderboard(lb);
            setRevealed(true);
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [router]);

  // Animated waiting dots
  useEffect(() => {
    if (revealed) return;
    const id = setInterval(() => setTick((t) => t + 1), 600);
    return () => clearInterval(id);
  }, [revealed]);

  // Stagger leaderboard entries in
  useEffect(() => {
    if (!revealed || leaderboard.length === 0) return;
    setVisibleCount(0);
    leaderboard.forEach((_, i) => {
      setTimeout(() => setVisibleCount(i + 1), 400 + i * 180);
    });
  }, [revealed, leaderboard]);

  const dots = ".".repeat((tick % 3) + 1);

  const myScore = team?.started_at && team?.finished_at
    ? calcFinalScore(team.started_at, team.finished_at, team.total_penalties_minutes)
    : null;

  const myRank = leaderboard.findIndex((e) => e.team_id === team?.id) + 1;

  return (
    <main
      className="flex flex-col min-h-dvh overflow-hidden"
      style={{ background: "linear-gradient(160deg,#0a1628 0%,#0d2044 50%,#0a1628 100%)" }}
    >
      {revealed && <ConfettiBlast />}

      {/* Top accent */}
      <div className="h-1 shrink-0" style={{ background: "linear-gradient(90deg,#D62828,#FFD700,#D62828)" }} />

      {!revealed ? (
        /* ── Waiting state ── */
        <div className="flex flex-col items-center justify-center flex-1 px-6 text-center gap-6">

          {/* Trophy with glow rings */}
          <div className="relative flex items-center justify-center">
            <div
              className="absolute rounded-full"
              style={{
                width: 160, height: 160,
                background: "radial-gradient(circle,rgba(255,215,0,0.08),transparent 70%)",
                animation: "waitPulse 2s ease-in-out infinite",
              }}
            />
            <div
              className="absolute rounded-full"
              style={{
                width: 120, height: 120,
                background: "radial-gradient(circle,rgba(255,215,0,0.12),transparent 70%)",
                animation: "waitPulse 2s ease-in-out 0.5s infinite",
              }}
            />
            <span
              className="text-7xl relative z-10"
              style={{
                filter: "drop-shadow(0 0 20px rgba(255,215,0,0.5))",
                animation: "waitPulse 2s ease-in-out infinite",
              }}
            >
              🏆
            </span>
          </div>

          {/* Title */}
          <div>
            <h1
              className="font-black leading-tight mb-2"
              style={{
                fontFamily: "'Impact','Arial Black',sans-serif",
                fontSize: "clamp(2rem,9vw,3rem)",
                background: "linear-gradient(180deg,#FFE566 0%,#FFB800 55%,#CC8800 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                filter: "drop-shadow(0 2px 0 #7A4E00)",
              }}
            >
              הגעתם לסיום!
            </h1>
            <p className="text-white font-bold text-lg">
              ממתינים לתוצאות{dots}
            </p>
            <p className="text-white/35 text-sm mt-2 max-w-xs mx-auto leading-relaxed">
              מנהל המירוץ יחשוף את לוח התוצאות בקרוב.
              <br />הישארו עם הטלפון בידיים!
            </p>
          </div>

          {/* My time card */}
          {myScore && (
            <div
              className="rounded-2xl px-6 py-4 animate-slide-up w-full max-w-xs"
              style={{
                background: "rgba(255,215,0,0.07)",
                border: "1px solid rgba(255,215,0,0.2)",
                boxShadow: "0 0 30px rgba(255,215,0,0.08)",
              }}
            >
              <p className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: "rgba(255,215,0,0.5)" }}>
                הזמן שלכם
              </p>
              <p className="font-mono font-black text-3xl mt-1" style={{ color: "#FFD700" }}>
                {formatDuration(myScore)}
              </p>
              {(team?.total_penalties_minutes ?? 0) > 0 && (
                <p className="text-sm mt-1" style={{ color: "#ff6b6b" }}>
                  כולל +{team?.total_penalties_minutes} דקות עונש
                </p>
              )}
            </div>
          )}

          {/* Waiting indicator */}
          <div className="flex items-center gap-3">
            <div className="h-px w-10" style={{ background: "rgba(255,255,255,0.1)" }} />
            <div className="flex gap-1.5">
              {[0,1,2].map((i) => (
                <div
                  key={i}
                  className="w-1.5 h-1.5 rounded-full"
                  style={{
                    background: "rgba(255,255,255,0.25)",
                    animation: `pulse-badge 1.4s ease-in-out ${i * 0.25}s infinite`,
                  }}
                />
              ))}
            </div>
            <div className="h-px w-10" style={{ background: "rgba(255,255,255,0.1)" }} />
          </div>
        </div>

      ) : (
        /* ── Results revealed ── */
        <div className="flex flex-col flex-1 px-4 py-5 gap-4 overflow-y-auto">

          {/* Header */}
          <div className="text-center animate-slide-up">
            <div className="text-5xl mb-2" style={{ filter: "drop-shadow(0 0 16px rgba(255,215,0,0.6))" }}>🎉</div>
            <h1
              className="font-black"
              style={{
                fontFamily: "'Impact','Arial Black',sans-serif",
                fontSize: "clamp(2rem,9vw,3rem)",
                background: "linear-gradient(180deg,#FFE566 0%,#FFB800 55%,#CC8800 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                filter: "drop-shadow(0 2px 0 #7A4E00)",
              }}
            >
              תוצאות סופיות
            </h1>
            <p className="text-white/35 text-sm mt-1">המרוץ למט&quot;מון — פארק הירקון</p>
          </div>

          {/* Winner spotlight */}
          {leaderboard[0] && visibleCount >= 1 && (
            <div
              className="rounded-2xl p-5 text-center animate-slide-up relative overflow-hidden"
              style={{
                background: "linear-gradient(135deg,rgba(255,215,0,0.15) 0%,rgba(255,215,0,0.05) 100%)",
                border: "2px solid rgba(255,215,0,0.45)",
                boxShadow: "0 0 50px rgba(255,215,0,0.2), inset 0 1px 0 rgba(255,255,255,0.1)",
              }}
            >
              {/* Shimmer */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: "linear-gradient(105deg,transparent 40%,rgba(255,215,0,0.06) 50%,transparent 60%)",
                  animation: "shimmer 3s ease-in-out infinite",
                }}
              />
              <p className="text-[11px] font-black uppercase tracking-[0.25em] mb-2" style={{ color: "rgba(255,215,0,0.55)" }}>
                🥇 המנצחים
              </p>
              <h2
                className="font-black text-2xl"
                style={{
                  fontFamily: "'Impact','Arial Black',sans-serif",
                  color: "#FFD700",
                  filter: "drop-shadow(0 0 12px rgba(255,215,0,0.4))",
                }}
              >
                {leaderboard[0].team_name}
              </h2>
              <p className="font-mono font-bold text-xl mt-1" style={{ color: "rgba(255,255,255,0.65)" }}>
                {formatDuration(leaderboard[0].final_score_seconds)}
              </p>
            </div>
          )}

          {/* My rank callout (if not #1) */}
          {myRank > 1 && visibleCount >= myRank && (
            <div
              className="rounded-xl px-4 py-3 text-center animate-slide-up"
              style={{
                background: "rgba(74,154,222,0.1)",
                border: "1px solid rgba(74,154,222,0.3)",
              }}
            >
              <p className="text-[11px] font-bold uppercase tracking-widest mb-0.5" style={{ color: "rgba(74,154,222,0.7)" }}>
                המיקום שלכם
              </p>
              <p className="font-black text-2xl text-white">
                {myRank <= 3 ? MEDALS[myRank - 1] : `#${myRank}`} מקום {myRank}
              </p>
            </div>
          )}

          {/* Full leaderboard */}
          <div className="flex flex-col gap-2">
            {leaderboard.map((entry, i) => {
              const isMe = entry.team_id === team?.id;
              const visible = i < visibleCount;
              return (
                <div
                  key={entry.team_id}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300"
                  style={{
                    background: isMe
                      ? "rgba(255,215,0,0.1)"
                      : i === 0
                      ? "rgba(255,215,0,0.06)"
                      : "rgba(255,255,255,0.04)",
                    border: isMe
                      ? "1px solid rgba(255,215,0,0.4)"
                      : i === 0
                      ? "1px solid rgba(255,215,0,0.2)"
                      : "1px solid rgba(255,255,255,0.07)",
                    transform: visible ? (isMe ? "scale(1.02)" : "scale(1)") : "scale(0.96)",
                    opacity: visible ? 1 : 0,
                    transition: "opacity 0.35s ease, transform 0.35s ease",
                  }}
                >
                  <span className="text-xl w-8 text-center shrink-0">
                    {i < 3 ? MEDALS[i] : `${i + 1}.`}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-white truncate text-sm">
                      {entry.team_name}
                      {isMe && <span className="text-[10px] mr-1.5" style={{ color: "rgba(255,215,0,0.6)" }}>(אתם)</span>}
                    </p>
                    {entry.total_penalties_minutes > 0 && (
                      <p className="text-[10px] mt-0.5" style={{ color: "#ff6b6b" }}>
                        +{entry.total_penalties_minutes} דק׳ עונש
                      </p>
                    )}
                  </div>
                  <span
                    className="font-mono font-black text-sm shrink-0"
                    style={{ color: i === 0 ? "#FFD700" : "rgba(255,255,255,0.45)" }}
                  >
                    {entry.finished_at ? formatDuration(entry.final_score_seconds) : "—"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Inline keyframes */}
      <style>{`
        @keyframes waitPulse {
          0%,100% { opacity:1; transform:scale(1); }
          50%      { opacity:0.65; transform:scale(1.04); }
        }
        @keyframes shimmer {
          0%   { transform:translateX(-100%); }
          100% { transform:translateX(200%); }
        }
      `}</style>
    </main>
  );
}
