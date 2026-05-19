"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { TEAM_SESSION_KEY, formatDuration, calcFinalScore } from "@/lib/game";
import { Team, GameEvent, LeaderboardEntry } from "@/types/supabase";
import ConfettiBlast from "@/components/finish/ConfettiBlast";

const MEDALS = ["🥇", "🥈", "🥉"];

const BG_EMOJIS_WAIT = [
  { emoji: "🏆", top: 82, left: 8,  delay: 0,  dur: 30 },
  { emoji: "⭐",  top: 75, left: 85, delay: 5,  dur: 24 },
  { emoji: "🌟",  top: 88, left: 50, delay: 10, dur: 28 },
  { emoji: "🎊",  top: 80, left: 25, delay: 3,  dur: 26 },
  { emoji: "🏅",  top: 70, left: 68, delay: 8,  dur: 32 },
  { emoji: "✨",  top: 85, left: 40, delay: 14, dur: 22 },
];

// Fixed orbital star positions for the 3 orbits around the trophy
const ORBIT_STARS = [
  { r: 90,  dur: 7,  stars: [{ a: 0 }, { a: 180 }] },
  { r: 120, dur: 11, stars: [{ a: 60 }, { a: 180 }, { a: 300 }] },
  { r: 155, dur: 16, stars: [{ a: 30 }, { a: 150 }, { a: 270 }] },
];

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

  useEffect(() => {
    if (revealed) return;
    const id = setInterval(() => setTick((t) => t + 1), 600);
    return () => clearInterval(id);
  }, [revealed]);

  useEffect(() => {
    if (!revealed || leaderboard.length === 0) return;
    setVisibleCount(0);
    leaderboard.forEach((_, i) => {
      setTimeout(() => setVisibleCount(i + 1), 500 + i * 200);
    });
  }, [revealed, leaderboard]);

  const dots = ".".repeat((tick % 3) + 1);
  const myScore = team?.started_at && team?.finished_at
    ? calcFinalScore(team.started_at, team.finished_at, team.total_penalties_minutes)
    : null;
  const myRank = leaderboard.findIndex((e) => e.team_id === team?.id) + 1;
  const isWinner = myRank === 1;

  return (
    <main
      className="flex flex-col h-dvh overflow-hidden"
      style={{ background: "linear-gradient(160deg,#0a1628 0%,#0d2044 50%,#0a1628 100%)" }}
    >
      {revealed && <ConfettiBlast />}

      {/* Floating bg emojis (waiting state) */}
      {!revealed && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
          {BG_EMOJIS_WAIT.map((e, i) => (
            <div key={i} className="absolute text-2xl animate-drift-up select-none"
              style={{ top: `${e.top}%`, left: `${e.left}%`, opacity: 0.12, animationDuration: `${e.dur}s`, animationDelay: `${e.delay}s` }}
            >{e.emoji}</div>
          ))}
        </div>
      )}

      {/* Top accent */}
      <div className="h-1 shrink-0 relative z-10" style={{ background: "linear-gradient(90deg,#D62828,#FFD700,#D62828)" }} />

      {!revealed ? (
        /* ── Waiting ── */
        <div className="flex flex-col items-center justify-center flex-1 px-6 text-center gap-5 relative z-10">

          {/* Trophy + orbiting stars */}
          <div className="relative flex items-center justify-center" style={{ width: 320, height: 320 }}>

            {/* Orbital rings */}
            {ORBIT_STARS.map((orbit, oi) => (
              <div key={oi}>
                {orbit.stars.map((star, si) => (
                  <div key={si} className="absolute flex items-center justify-center"
                    style={{
                      width: 320, height: 320,
                      top: 0, left: 0,
                      animation: `orbitStar ${orbit.dur}s linear infinite`,
                      animationDelay: `${-(star.a / 360) * orbit.dur}s`,
                    }}
                  >
                    <div style={{ position: "absolute", top: `calc(50% - ${orbit.r}px)` }}>
                      <span className="text-lg" style={{ filter: "drop-shadow(0 0 8px rgba(255,215,0,0.8))" }}>⭐</span>
                    </div>
                  </div>
                ))}
              </div>
            ))}

            {/* Glow rings */}
            {[200, 160, 120].map((s, i) => (
              <div key={i} className="absolute rounded-full"
                style={{
                  width: s, height: s,
                  background: "radial-gradient(circle,rgba(255,215,0,0.1),transparent 70%)",
                  animation: `waitPulse 2s ease-in-out ${i * 0.5}s infinite`,
                }}
              />
            ))}

            {/* Trophy */}
            <span
              className="text-8xl relative z-10 animate-zoom-pulse animate-float"
              style={{ filter: "drop-shadow(0 0 30px rgba(255,215,0,0.7))" }}
            >
              🏆
            </span>
          </div>

          {/* Title */}
          <div>
            <h1
              className="font-black leading-tight mb-1"
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
            <p className="text-white font-black text-xl">ממתינים לתוצאות{dots}</p>
            <p className="text-white/35 text-sm mt-2 max-w-xs mx-auto leading-relaxed">
              מנהל המירוץ יחשוף את לוח התוצאות בקרוב.
              <br />הישארו עם הטלפון בידיים! 📱
            </p>
          </div>

          {/* My time card */}
          {myScore && (
            <div
              className="rounded-2xl px-6 py-4 w-full max-w-xs animate-border-glow"
              style={{
                background: "rgba(255,215,0,0.08)",
                border: "1px solid rgba(255,215,0,0.3)",
              }}
            >
              <p className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: "rgba(255,215,0,0.6)" }}>
                ⏱ הזמן שלכם
              </p>
              <p className="font-mono font-black text-4xl mt-1" style={{ color: "#FFD700" }}>
                {formatDuration(myScore)}
              </p>
              {(team?.total_penalties_minutes ?? 0) > 0 && (
                <p className="text-sm mt-1" style={{ color: "#ff6b6b" }}>
                  כולל +{team?.total_penalties_minutes} דקות עונש
                </p>
              )}
            </div>
          )}

          {/* Marquee strip */}
          <div className="w-full overflow-hidden" style={{ borderTop: "1px solid rgba(255,215,0,0.1)", borderBottom: "1px solid rgba(255,215,0,0.1)", padding: "6px 0" }}>
            <div className="animate-marquee inline-flex gap-8 text-yellow-400/40 text-xs font-bold uppercase tracking-widest">
              {["🏆 כל הכבוד!", "הגעתם לסיום!", "⭐ מדהים!", "🏁 ממתינים לתוצאות!", "🏆 כל הכבוד!", "הגעתם לסיום!", "⭐ מדהים!", "🏁 ממתינים לתוצאות!"].map((t, i) => (
                <span key={i}>{t}</span>
              ))}
            </div>
          </div>
        </div>

      ) : (
        /* ── Results revealed ── */
        <div className="flex flex-col flex-1 px-4 py-5 gap-4 overflow-y-auto relative z-10">

          {/* Header */}
          <div className="text-center animate-slide-up">
            <div className="text-5xl mb-2 animate-zoom-pulse" style={{ filter: "drop-shadow(0 0 20px rgba(255,215,0,0.6))" }}>🎉</div>
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
              className="rounded-2xl p-5 text-center animate-scale-in relative overflow-hidden animate-border-glow"
              style={{
                background: "linear-gradient(135deg,rgba(255,215,0,0.18) 0%,rgba(255,215,0,0.06) 100%)",
                border: "2px solid rgba(255,215,0,0.5)",
                boxShadow: "0 0 60px rgba(255,215,0,0.25), inset 0 1px 0 rgba(255,255,255,0.12)",
              }}
            >
              {/* Crown if viewer is winner */}
              {isWinner && (
                <div className="text-4xl animate-float animate-glow-gold mb-1">👑</div>
              )}
              <div className="absolute inset-0 pointer-events-none"
                style={{
                  background: "linear-gradient(105deg,transparent 40%,rgba(255,215,0,0.08) 50%,transparent 60%)",
                  animation: "shimmer 2.5s ease-in-out infinite",
                }}
              />
              <p className="text-[11px] font-black uppercase tracking-[0.25em] mb-2" style={{ color: "rgba(255,215,0,0.6)" }}>
                🥇 המנצחים
              </p>
              <h2
                className="font-black text-2xl animate-glow-gold"
                style={{
                  fontFamily: "'Impact','Arial Black',sans-serif",
                  color: "#FFD700",
                }}
              >
                {leaderboard[0].team_name}
              </h2>
              <p className="font-mono font-bold text-xl mt-1" style={{ color: "rgba(255,255,255,0.7)" }}>
                {formatDuration(leaderboard[0].final_score_seconds)}
              </p>
            </div>
          )}

          {/* My rank callout */}
          {myRank > 1 && visibleCount >= myRank && (
            <div
              className="rounded-xl px-4 py-3 text-center animate-scale-in"
              style={{ background: "rgba(74,154,222,0.1)", border: "1px solid rgba(74,154,222,0.35)" }}
            >
              <p className="text-[11px] font-bold uppercase tracking-widest mb-0.5" style={{ color: "rgba(74,154,222,0.7)" }}>
                המיקום שלכם
              </p>
              <p className="font-black text-2xl text-white">
                {myRank <= 3 ? MEDALS[myRank - 1] : `#${myRank}`} מקום {myRank}
              </p>
            </div>
          )}

          {/* Leaderboard */}
          <div className="flex flex-col gap-2">
            {leaderboard.map((entry, i) => {
              const isMe = entry.team_id === team?.id;
              const visible = i < visibleCount;
              return (
                <div
                  key={entry.team_id}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl"
                  style={{
                    background: isMe ? "rgba(255,215,0,0.12)" : i === 0 ? "rgba(255,215,0,0.06)" : "rgba(255,255,255,0.04)",
                    border: isMe ? "1px solid rgba(255,215,0,0.45)" : i === 0 ? "1px solid rgba(255,215,0,0.22)" : "1px solid rgba(255,255,255,0.07)",
                    transform: visible ? (isMe ? "scale(1.02)" : "scale(1)") : "translateX(60px) scale(0.95)",
                    opacity: visible ? 1 : 0,
                    transition: `opacity 0.4s ease ${i * 0.05}s, transform 0.4s cubic-bezier(0.25,0.46,0.45,0.94) ${i * 0.05}s`,
                  }}
                >
                  <span className="text-xl w-8 text-center shrink-0" style={{ animation: visible && i < 3 ? `zoomPulse 2.5s ease-in-out ${i * 0.3}s infinite` : "none" }}>
                    {i < 3 ? MEDALS[i] : `${i + 1}.`}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-white truncate text-sm">
                      {entry.team_name}
                      {isMe && <span className="text-[10px] mr-1.5" style={{ color: "rgba(255,215,0,0.6)" }}>(אתם)</span>}
                    </p>
                    {entry.total_penalties_minutes > 0 && (
                      <p className="text-[10px] mt-0.5" style={{ color: "#ff6b6b" }}>+{entry.total_penalties_minutes} דק׳ עונש</p>
                    )}
                  </div>
                  <span className="font-mono font-black text-sm shrink-0"
                    style={{ color: i === 0 ? "#FFD700" : "rgba(255,255,255,0.45)" }}>
                    {entry.finished_at ? formatDuration(entry.final_score_seconds) : "—"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <style>{`
        @keyframes waitPulse {
          0%,100% { opacity:1;    transform:scale(1); }
          50%      { opacity:0.55; transform:scale(1.05); }
        }
        @keyframes shimmer {
          0%   { transform:translateX(-100%); }
          100% { transform:translateX(200%); }
        }
        @keyframes orbitStar {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
    </main>
  );
}
