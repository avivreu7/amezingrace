"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { TEAM_SESSION_KEY, FINISH_COORDS } from "@/lib/game";
import { Team } from "@/types/supabase";

const WAZE_URL = `https://waze.com/ul?ll=${FINISH_COORDS.lat},${FINISH_COORDS.lng}&navigate=yes`;
const GMAPS_URL = `https://www.google.com/maps?q=${FINISH_COORDS.lat},${FINISH_COORDS.lng}`;

// Scrambled coord digits — revealed one by one for drama
const COORD_LINES = [
  { label: "צפון", value: "32° 05′ 58.2″" },
  { label: "מזרח", value: "34° 48′ 00.3″" },
];

export default function FinalMissionPage() {
  const router = useRouter();
  const [team, setTeam] = useState<Team | null>(null);
  const [phase, setPhase] = useState(0); // 0=classified, 1=reveal, 2=coords, 3=nav

  useEffect(() => {
    const raw = localStorage.getItem(TEAM_SESSION_KEY);
    if (!raw) { router.replace("/"); return; }
    setTeam(JSON.parse(raw));

    // Staged reveal
    const t1 = setTimeout(() => setPhase(1), 800);
    const t2 = setTimeout(() => setPhase(2), 2200);
    const t3 = setTimeout(() => setPhase(3), 3800);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [router]);

  return (
    <div
      className="flex flex-col min-h-dvh overflow-hidden"
      style={{ background: "linear-gradient(160deg,#0a1628 0%,#0d2044 50%,#0a1628 100%)" }}
    >
      {/* Top accent */}
      <div className="h-1 shrink-0" style={{ background: "linear-gradient(90deg,#D62828,#FFD700,#D62828)" }} />

      <div className="flex-1 flex flex-col items-center justify-center px-5 py-10 text-center">

        {/* Phase 0 — initial flash */}
        {phase === 0 && (
          <div className="animate-pulse-badge">
            <div className="text-6xl">📡</div>
          </div>
        )}

        {/* Phase 1+ — main content */}
        {phase >= 1 && (
          <div className="w-full max-w-sm flex flex-col items-center gap-6 animate-slide-up">

            {/* "Not done yet" header */}
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.3em] mb-3" style={{ color: "#D62828" }}>
                ⚠ עצרו — המירוץ לא נגמר ⚠
              </p>
              <h1
                className="font-black leading-tight"
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
              <p className="text-white/60 text-base mt-3 leading-relaxed">
                נותרת משימה אחת אחרונה.
                <br />
                <span className="text-white/40 text-sm">האם יש לכם מה שצריך?</span>
              </p>
            </div>

            {/* Phase 2+ — classified coordinates card */}
            {phase >= 2 && (
              <div
                className="w-full rounded-2xl p-5 animate-slide-up"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(214,40,40,0.4)",
                  boxShadow: "0 0 30px rgba(214,40,40,0.15)",
                }}
              >
                {/* Header */}
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse-badge" />
                  <span className="text-[10px] font-black uppercase tracking-[0.25em] text-red-400">
                    קואורדינטות סודיות
                  </span>
                  <div className="flex-1 h-px bg-red-500/20" />
                  <span className="text-[10px] font-mono text-white/20">מסווג</span>
                </div>

                {/* Coords */}
                <div className="flex flex-col gap-2">
                  {COORD_LINES.map((c, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between px-3 py-2.5 rounded-xl"
                      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
                    >
                      <span className="text-[11px] font-bold text-white/40 uppercase">{c.label}</span>
                      <span
                        className="font-mono font-black text-base tracking-wider"
                        style={{ color: "#FFD700" }}
                      >
                        {c.value}
                      </span>
                    </div>
                  ))}
                </div>

                <p className="text-white/30 text-xs mt-3 text-center">
                  אתרו את נקודת הסיום וחכו לאות האדמין
                </p>
              </div>
            )}

            {/* Phase 3+ — navigation buttons */}
            {phase >= 3 && (
              <div className="w-full flex flex-col gap-3 animate-slide-up">
                <p className="text-white/50 text-xs uppercase tracking-widest text-center">
                  נווטו לנקודת הסיום
                </p>

                <a
                  href={WAZE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="relative w-full rounded-xl py-4 font-black text-lg text-center overflow-hidden"
                  style={{
                    background: "linear-gradient(180deg,#FFD700 0%,#E8A000 50%,#C47800 100%)",
                    color: "#1a0a00",
                    boxShadow: "0 4px 20px rgba(232,160,0,0.45)",
                    border: "2px solid rgba(255,200,0,0.4)",
                  }}
                >
                  <span className="flex items-center justify-center gap-2">
                    <span>נווט ב-Waze</span>
                    <span>🗺️</span>
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
                  פתח ב-Google Maps
                </a>
              </div>
            )}

            {/* Team name */}
            {team && (
              <p className="text-white/20 text-xs mt-2">
                {team.name} — בהצלחה!
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
