"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { TEAM_SESSION_KEY, FINISH_COORDS } from "@/lib/game";
import { Team } from "@/types/supabase";

const WAZE_URL = `https://waze.com/ul?ll=${FINISH_COORDS.lat},${FINISH_COORDS.lng}&navigate=yes`;
const GMAPS_URL = `https://www.google.com/maps?q=${FINISH_COORDS.lat},${FINISH_COORDS.lng}`;

const COORD_LINES = [
  { label: "צפון", full: "32° 05′ 58.2″" },
  { label: "מזרח", full: "34° 48′ 00.3″" },
];

const BG_EMOJIS = [
  { emoji: "📡", top: 78, left: 8,  delay: 0,  dur: 28 },
  { emoji: "🗺️", top: 82, left: 85, delay: 6,  dur: 24 },
  { emoji: "🔍", top: 88, left: 55, delay: 12, dur: 30 },
  { emoji: "❗", top: 75, left: 30, delay: 4,  dur: 22 },
  { emoji: "🏃‍♂️",top: 85, left: 68, delay: 9,  dur: 26 },
];

// Orbiting phase-0 emojis
const ORBIT_EMOJIS = [
  { emoji: "📡", angle: 0   },
  { emoji: "❗", angle: 120 },
  { emoji: "🔴", angle: 240 },
];

export default function FinalMissionPage() {
  const router = useRouter();
  const [team, setTeam] = useState<Team | null>(null);
  const [phase, setPhase] = useState(0);
  const [coordChars, setCoordChars] = useState<[number, number]>([0, 0]);

  useEffect(() => {
    const raw = localStorage.getItem(TEAM_SESSION_KEY);
    if (!raw) { router.replace("/"); return; }
    setTeam(JSON.parse(raw));

    const t1 = setTimeout(() => setPhase(1), 900);
    const t2 = setTimeout(() => setPhase(2), 2400);
    const t3 = setTimeout(() => setPhase(3), 4000);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [router]);

  // Typewriter effect for coordinates
  useEffect(() => {
    if (phase < 2) return;
    const interval = setInterval(() => {
      setCoordChars(([a, b]) => {
        const maxA = COORD_LINES[0].full.length;
        const maxB = COORD_LINES[1].full.length;
        if (a < maxA) return [a + 1, b];
        if (b < maxB) return [a, b + 1];
        clearInterval(interval);
        return [a, b];
      });
    }, 55);
    return () => clearInterval(interval);
  }, [phase]);

  return (
    <div
      className="relative flex flex-col h-dvh overflow-hidden"
      style={{ background: "linear-gradient(160deg,#0a1628 0%,#0d2044 50%,#0a1628 100%)" }}
    >
      {/* Floating bg emojis */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        {BG_EMOJIS.map((e, i) => (
          <div key={i} className="absolute text-2xl animate-drift-up select-none"
            style={{ top: `${e.top}%`, left: `${e.left}%`, opacity: 0.11, animationDuration: `${e.dur}s`, animationDelay: `${e.delay}s` }}
          >{e.emoji}</div>
        ))}
      </div>

      {/* Red alert screen pulse (only phase 0-1) */}
      {phase < 2 && (
        <div className="absolute inset-0 pointer-events-none z-0"
          style={{
            boxShadow: "inset 0 0 80px rgba(214,40,40,0.25)",
            animation: "redScreenPulse 1.4s ease-in-out infinite",
          }}
        />
      )}

      {/* Top accent */}
      <div className="h-1 shrink-0 relative z-10" style={{ background: "linear-gradient(90deg,#D62828,#FFD700,#D62828)" }} />

      <div className="flex-1 flex flex-col items-center justify-center px-5 py-8 text-center relative z-10">

        {/* Phase 0 — Orbiting emojis */}
        {phase === 0 && (
          <div className="relative flex items-center justify-center" style={{ width: 180, height: 180 }}>
            {ORBIT_EMOJIS.map((o, i) => (
              <div key={i} className="absolute text-3xl"
                style={{
                  animation: `orbitSpin 2s linear infinite`,
                  animationDelay: `${-i * (2 / ORBIT_EMOJIS.length)}s`,
                  transformOrigin: "90px 90px",
                  transform: `rotate(${o.angle}deg) translateX(70px) rotate(-${o.angle}deg)`,
                }}
              >{o.emoji}</div>
            ))}
            <span className="text-6xl animate-glow-red animate-pulse-badge">🚨</span>
          </div>
        )}

        {/* Phase 1+ */}
        {phase >= 1 && (
          <div className="w-full max-w-sm flex flex-col items-center gap-5 animate-slide-up">

            {/* Alert header */}
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-4"
                style={{
                  background: "rgba(214,40,40,0.18)",
                  border: "1px solid rgba(214,40,40,0.5)",
                  boxShadow: "0 0 24px rgba(214,40,40,0.3)",
                }}
              >
                <span className="text-xs font-black uppercase tracking-[0.2em] animate-flicker" style={{ color: "#ff4444" }}>
                  🚨 עצרו — המירוץ לא נגמר 🚨
                </span>
              </div>

              <h1
                className="font-black leading-tight animate-flicker"
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
                חשבתם שהגעתם לסוף?
              </h1>
              <p className="text-white/65 text-base mt-3 leading-relaxed">
                נותרת משימה אחת אחרונה.
              </p>
              <p className="text-white/35 text-sm mt-1">האם יש לכם מה שצריך? 😈</p>
            </div>

            {/* Phase 2+ — Coordinates */}
            {phase >= 2 && (
              <div
                className="w-full rounded-2xl p-5 animate-slide-up relative overflow-hidden"
                style={{
                  background: "rgba(214,40,40,0.06)",
                  border: "1px solid rgba(214,40,40,0.45)",
                  boxShadow: "0 0 40px rgba(214,40,40,0.18), inset 0 1px 0 rgba(255,255,255,0.05)",
                }}
              >
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse-badge" />
                  <span className="text-[10px] font-black uppercase tracking-[0.25em] text-red-400">
                    קואורדינטות סודיות
                  </span>
                  <div className="flex-1 h-px bg-red-500/20" />
                  <span className="text-[10px] font-mono text-white/20 animate-flicker">מסווג</span>
                </div>

                <div className="flex flex-col gap-2">
                  {COORD_LINES.map((c, i) => {
                    const revealed = i === 0 ? coordChars[0] : coordChars[1];
                    const text = c.full.slice(0, revealed);
                    const cursor = revealed < c.full.length ? "▋" : "";
                    return (
                      <div key={i}
                        className="flex items-center justify-between px-3 py-2.5 rounded-xl"
                        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
                      >
                        <span className="text-[11px] font-bold text-white/40 uppercase">{c.label}</span>
                        <span className="font-mono font-black text-base tracking-wider" style={{ color: "#FFD700" }}>
                          {text}<span className="animate-pulse-badge">{cursor}</span>
                        </span>
                      </div>
                    );
                  })}
                </div>

                <p className="text-white/30 text-xs mt-3 text-center">
                  אתרו את נקודת הסיום וחכו לאות האדמין
                </p>
              </div>
            )}

            {/* Phase 3+ — Navigation */}
            {phase >= 3 && (
              <div className="w-full flex flex-col gap-3 animate-slide-up">
                <p className="text-white/50 text-xs uppercase tracking-widest text-center">
                  נווטו לנקודת הסיום
                </p>

                <a
                  href={WAZE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="relative btn-shimmer w-full rounded-xl py-4 font-black text-lg text-center overflow-hidden animate-bounce-gentle"
                  style={{
                    background: "linear-gradient(180deg,#FFD700 0%,#E8A000 50%,#C47800 100%)",
                    color: "#1a0a00",
                    boxShadow: "0 4px 24px rgba(232,160,0,0.5)",
                    border: "2px solid rgba(255,200,0,0.4)",
                  }}
                >
                  <span className="flex items-center justify-center gap-2">
                    <span className="animate-float">🗺️</span>
                    <span>נווט ב-Waze</span>
                    <span>→</span>
                  </span>
                  <div className="absolute inset-0 bg-linear-to-b from-white/20 to-transparent pointer-events-none rounded-xl" />
                </a>

                <a
                  href={GMAPS_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full rounded-xl py-3.5 font-bold text-base text-center"
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    color: "rgba(255,255,255,0.6)",
                    border: "1px solid rgba(255,255,255,0.12)",
                  }}
                >
                  פתח ב-Google Maps 🌐
                </a>
              </div>
            )}

            {team && (
              <p className="text-white/20 text-xs mt-1">{team.name} — בהצלחה! 💪</p>
            )}
          </div>
        )}
      </div>

      <style>{`
        @keyframes redScreenPulse {
          0%,100% { box-shadow: inset 0 0 80px rgba(214,40,40,0.2); }
          50%      { box-shadow: inset 0 0 120px rgba(214,40,40,0.45); }
        }
        @keyframes orbitSpin {
          from { transform: rotate(0deg) translateX(70px) rotate(0deg); }
          to   { transform: rotate(360deg) translateX(70px) rotate(-360deg); }
        }
      `}</style>
    </div>
  );
}
