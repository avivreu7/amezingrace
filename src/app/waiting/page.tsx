"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { TEAM_SESSION_KEY } from "@/lib/game";
import { Team } from "@/types/supabase";

const STARS = [
  { w: 1, h: 1, top: 8,  left: 15, op: 0.35 },
  { w: 2, h: 2, top: 14, left: 72, op: 0.4  },
  { w: 1, h: 1, top: 22, left: 40, op: 0.25 },
  { w: 1, h: 1, top: 6,  left: 88, op: 0.3  },
  { w: 1, h: 1, top: 35, left: 8,  op: 0.2  },
  { w: 1, h: 1, top: 42, left: 65, op: 0.4  },
  { w: 2, h: 1, top: 55, left: 28, op: 0.3  },
  { w: 1, h: 1, top: 62, left: 85, op: 0.35 },
  { w: 1, h: 1, top: 70, left: 18, op: 0.25 },
  { w: 1, h: 2, top: 78, left: 55, op: 0.4  },
  { w: 1, h: 1, top: 88, left: 35, op: 0.3  },
  { w: 2, h: 2, top: 92, left: 78, op: 0.35 },
  { w: 1, h: 1, top: 18, left: 52, op: 0.2  },
  { w: 1, h: 1, top: 30, left: 92, op: 0.3  },
  { w: 1, h: 1, top: 48, left: 45, op: 0.25 },
];

export default function WaitingPage() {
  const router = useRouter();
  const [team, setTeam] = useState<Team | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const raw = localStorage.getItem(TEAM_SESSION_KEY);
    if (!raw) { router.replace("/"); return; }
    const t: Team = JSON.parse(raw);
    setTeam(t);
    if (t.unlocked_at) { router.replace("/instructions"); return; }

    const supabase = createClient();
    const channel = supabase
      .channel(`team-start-${t.id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "teams", filter: `id=eq.${t.id}` },
        (payload) => {
          const updated = payload.new as Team;
          if (updated.unlocked_at) {
            localStorage.setItem(TEAM_SESSION_KEY, JSON.stringify(updated));
            router.push("/instructions");
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [router]);

  // Animate dots
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 600);
    return () => clearInterval(id);
  }, []);

  const dots = ".".repeat((tick % 3) + 1);

  return (
    <main
      className="relative flex flex-col min-h-dvh overflow-hidden"
      style={{ background: "linear-gradient(160deg,#0a1628 0%,#0d2044 50%,#0a1628 100%)" }}
    >
      {/* Stars */}
      <div className="absolute inset-0 pointer-events-none">
        {STARS.map((s, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white"
            style={{ width: s.w, height: s.h, top: `${s.top}%`, left: `${s.left}%`, opacity: s.op }}
          />
        ))}
      </div>

      {/* Top accent */}
      <div className="h-1 shrink-0" style={{ background: "linear-gradient(90deg,#D62828,#FFD700,#D62828)" }} />

      {/* Center content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center relative z-10">

        {/* Radar rings */}
        <div className="relative w-56 h-56 flex items-center justify-center mb-8">
          {/* Outer ring 1 */}
          <div
            className="absolute rounded-full border"
            style={{
              width: 224, height: 224,
              borderColor: "rgba(255,215,0,0.08)",
              animation: "radarPulse 2.4s ease-out infinite",
            }}
          />
          {/* Outer ring 2 */}
          <div
            className="absolute rounded-full border"
            style={{
              width: 184, height: 184,
              borderColor: "rgba(255,215,0,0.12)",
              animation: "radarPulse 2.4s ease-out 0.6s infinite",
            }}
          />
          {/* Middle ring */}
          <div
            className="absolute rounded-full border"
            style={{
              width: 144, height: 144,
              borderColor: "rgba(255,215,0,0.18)",
              animation: "radarPulse 2.4s ease-out 1.2s infinite",
            }}
          />
          {/* Inner glow */}
          <div
            className="absolute rounded-full"
            style={{
              width: 104, height: 104,
              background: "radial-gradient(circle,rgba(255,215,0,0.15) 0%,transparent 70%)",
            }}
          />
          {/* Center icon */}
          <div
            className="relative w-20 h-20 rounded-full flex items-center justify-center"
            style={{
              background: "radial-gradient(circle at 35% 35%,#1a3a6a 0%,#0a1628 100%)",
              border: "2px solid rgba(255,215,0,0.3)",
              boxShadow: "0 0 30px rgba(255,215,0,0.15), inset 0 1px 0 rgba(255,255,255,0.1)",
            }}
          >
            <span className="text-4xl" style={{ filter: "drop-shadow(0 0 8px rgba(255,215,0,0.6))" }}>🏁</span>
          </div>
        </div>

        {/* Team name */}
        {team && (
          <div className="mb-2">
            <p className="text-[11px] font-bold uppercase tracking-[0.3em] mb-1" style={{ color: "rgba(255,215,0,0.5)" }}>
              הקבוצה שלכם
            </p>
            <h1
              className="font-black leading-none"
              style={{
                fontFamily: "'Impact','Arial Black',sans-serif",
                fontSize: "clamp(2rem,10vw,3.5rem)",
                background: "linear-gradient(180deg,#FFE566 0%,#FFB800 55%,#CC8800 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                filter: "drop-shadow(0 2px 0 #7A4E00)",
              }}
            >
              {team.name}
            </h1>
          </div>
        )}

        {/* Status */}
        <div className="mt-4 flex flex-col items-center gap-2">
          <p className="text-white font-bold text-lg">
            ממתינים להתחלה{dots}
          </p>
          <p className="text-white/35 text-sm max-w-xs leading-relaxed">
            מנהל המירוץ יפתח את האזעקה בקרוב.
            <br />הישארו ממוקדים ומוכנים!
          </p>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 mt-8">
          <div className="h-px w-10" style={{ background: "rgba(255,215,0,0.2)" }} />
          <span className="text-[10px] uppercase tracking-[0.3em]" style={{ color: "rgba(255,255,255,0.2)" }}>
            מחכים לאדמין
          </span>
          <div className="h-px w-10" style={{ background: "rgba(255,215,0,0.2)" }} />
        </div>

        {/* Pulsing dots */}
        <div className="flex gap-2 mt-5">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full"
              style={{
                background: "#FFD700",
                animation: `pulse-badge 1.4s ease-in-out ${i * 0.25}s infinite`,
              }}
            />
          ))}
        </div>
      </div>

      {/* Radar pulse keyframe (inline) */}
      <style>{`
        @keyframes radarPulse {
          0%   { opacity: 0.8; transform: scale(0.95); }
          50%  { opacity: 0.4; transform: scale(1.02); }
          100% { opacity: 0.8; transform: scale(0.95); }
        }
      `}</style>
    </main>
  );
}
