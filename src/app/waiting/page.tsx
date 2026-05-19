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
];

// Floating background emojis — fixed positions, no Math.random
const BG_EMOJIS = [
  { emoji: "🏃‍♂️", top: 80, left: 8,  delay: 0,    dur: 28 },
  { emoji: "⚡",    top: 65, left: 88, delay: 5,    dur: 22 },
  { emoji: "🔥",    top: 75, left: 55, delay: 10,   dur: 32 },
  { emoji: "💨",    top: 90, left: 30, delay: 3,    dur: 26 },
  { emoji: "🎯",    top: 70, left: 72, delay: 8,    dur: 30 },
  { emoji: "🏅",    top: 85, left: 18, delay: 14,   dur: 24 },
];

export default function WaitingPage() {
  const router = useRouter();
  const [team, setTeam] = useState<Team | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const raw = localStorage.getItem(TEAM_SESSION_KEY);
    if (!raw) { router.replace("/"); return; }
    const cached: Team = JSON.parse(raw);

    const supabase = createClient();

    supabase.from("teams").select("*").eq("id", cached.id).single().then(({ data: fresh }) => {
      const t = fresh ?? cached;
      if (fresh) localStorage.setItem(TEAM_SESSION_KEY, JSON.stringify(fresh));
      setTeam(t);
      if (t.unlocked_at) { router.replace("/instructions"); return; }
    });

    const channel = supabase
      .channel(`team-start-${cached.id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "teams", filter: `id=eq.${cached.id}` },
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

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 600);
    return () => clearInterval(id);
  }, []);

  const dots = ".".repeat((tick % 3) + 1);

  return (
    <main
      className="relative flex flex-col h-dvh overflow-hidden"
      style={{ background: "linear-gradient(160deg,#0a1628 0%,#0d2044 50%,#0a1628 100%)" }}
    >
      {/* ── Stars ── */}
      <div className="absolute inset-0 pointer-events-none">
        {STARS.map((s, i) => (
          <div key={i} className="absolute rounded-full bg-white"
            style={{ width: s.w, height: s.h, top: `${s.top}%`, left: `${s.left}%`, opacity: s.op }} />
        ))}
      </div>

      {/* ── Floating emoji particles ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {BG_EMOJIS.map((e, i) => (
          <div key={i} className="absolute text-2xl animate-drift-up select-none"
            style={{
              top: `${e.top}%`, left: `${e.left}%`,
              opacity: 0.13,
              animationDuration: `${e.dur}s`,
              animationDelay: `${e.delay}s`,
            }}
          >{e.emoji}</div>
        ))}
      </div>

      {/* Top accent */}
      <div className="h-1 shrink-0" style={{ background: "linear-gradient(90deg,#D62828,#FFD700,#D62828)" }} />

      {/* Center content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center relative z-10 gap-1">

        {/* STAND BY badge */}
        <div
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-4 animate-pulse-badge"
          style={{
            background: "rgba(214,40,40,0.15)",
            border: "1px solid rgba(214,40,40,0.4)",
            boxShadow: "0 0 20px rgba(214,40,40,0.2)",
          }}
        >
          <span className="text-xs font-black uppercase tracking-[0.25em]" style={{ color: "#ff6b6b" }}>
            ⚡ STAND BY ⚡
          </span>
        </div>

        {/* Radar rings */}
        <div className="relative flex items-center justify-center mb-6" style={{ width: 240, height: 240 }}>
          {[
            { size: 240, op: "rgba(255,215,0,0.12)", delay: "0s" },
            { size: 196, op: "rgba(255,215,0,0.22)", delay: "0.6s" },
            { size: 152, op: "rgba(255,215,0,0.35)", delay: "1.2s" },
          ].map((r, i) => (
            <div key={i} className="absolute rounded-full border-2"
              style={{
                width: r.size, height: r.size,
                borderColor: r.op,
                animation: `radarPulse 2.2s ease-out ${r.delay} infinite`,
              }}
            />
          ))}

          {/* Inner gold fill ring */}
          <div className="absolute rounded-full"
            style={{
              width: 116, height: 116,
              background: "radial-gradient(circle, rgba(255,215,0,0.12) 0%, transparent 70%)",
            }}
          />

          {/* Spinning orbit ring */}
          <div className="absolute rounded-full border border-yellow-400/30"
            style={{ width: 100, height: 100, animation: "spin 6s linear infinite" }}
          />

          {/* Center icon */}
          <div
            className="relative w-24 h-24 rounded-full flex items-center justify-center animate-float"
            style={{
              background: "radial-gradient(circle at 35% 35%,#1e4080 0%,#0a1628 100%)",
              border: "2px solid rgba(255,215,0,0.45)",
              boxShadow: "0 0 40px rgba(255,215,0,0.25), inset 0 1px 0 rgba(255,255,255,0.15)",
            }}
          >
            <span className="text-5xl animate-glow-gold">🏁</span>
          </div>
        </div>

        {/* Team name */}
        {team && (
          <div className="mb-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.3em] mb-1" style={{ color: "rgba(255,215,0,0.55)" }}>
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
        <div className="flex flex-col items-center gap-1.5">
          <p className="text-white font-black text-xl">
            ממתינים להזנקה{dots}
          </p>
          <p className="text-white/45 text-sm max-w-xs leading-relaxed">
            🔥 התכוננו — זה קורה עכשיו!
          </p>
          <p className="text-white/30 text-xs mt-1">
            מנהל המירוץ יפתח את ההזנקה בקרוב
          </p>
        </div>

        {/* Pulsing dots */}
        <div className="flex gap-2 mt-6">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-full"
              style={{
                width: i === 2 ? 10 : 7,
                height: i === 2 ? 10 : 7,
                background: "#FFD700",
                animation: `pulse-badge 1.4s ease-in-out ${i * 0.2}s infinite`,
              }}
            />
          ))}
        </div>
      </div>

      <style>{`
        @keyframes radarPulse {
          0%   { opacity: 0.9; transform: scale(0.95); }
          50%  { opacity: 0.35; transform: scale(1.03); }
          100% { opacity: 0.9; transform: scale(0.95); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
    </main>
  );
}
