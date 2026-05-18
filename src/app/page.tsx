"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { TEAM_SESSION_KEY, PLAYER_SESSION_KEY } from "@/lib/game";

// Fixed star positions — deterministic to avoid SSR/client hydration mismatch
const STARS = [
  { w: 1, h: 1, top: 8,  left: 12, op: 0.4 },
  { w: 1, h: 1, top: 15, left: 78, op: 0.3 },
  { w: 2, h: 2, top: 22, left: 45, op: 0.5 },
  { w: 1, h: 1, top: 5,  left: 90, op: 0.35 },
  { w: 1, h: 1, top: 33, left: 5,  op: 0.25 },
  { w: 1, h: 1, top: 40, left: 62, op: 0.45 },
  { w: 2, h: 1, top: 50, left: 30, op: 0.3 },
  { w: 1, h: 1, top: 55, left: 88, op: 0.4 },
  { w: 1, h: 2, top: 63, left: 18, op: 0.35 },
  { w: 1, h: 1, top: 70, left: 72, op: 0.5 },
  { w: 1, h: 1, top: 78, left: 40, op: 0.3 },
  { w: 2, h: 2, top: 85, left: 55, op: 0.45 },
  { w: 1, h: 1, top: 92, left: 10, op: 0.25 },
  { w: 1, h: 1, top: 18, left: 33, op: 0.4 },
  { w: 1, h: 1, top: 28, left: 95, op: 0.3 },
  { w: 1, h: 1, top: 47, left: 50, op: 0.35 },
  { w: 2, h: 1, top: 60, left: 82, op: 0.4 },
  { w: 1, h: 1, top: 73, left: 25, op: 0.5 },
  { w: 1, h: 1, top: 88, left: 68, op: 0.3 },
  { w: 1, h: 2, top: 3,  left: 55, op: 0.35 },
  { w: 1, h: 1, top: 12, left: 20, op: 0.4 },
  { w: 1, h: 1, top: 38, left: 75, op: 0.25 },
  { w: 2, h: 2, top: 65, left: 42, op: 0.5 },
  { w: 1, h: 1, top: 80, left: 15, op: 0.3 },
  { w: 1, h: 1, top: 95, left: 85, op: 0.4 },
];

export default function LoginPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [shake, setShake] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !code.trim() || loading) return;
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { data: team, error: dbError } = await supabase
      .from("teams")
      .select("*")
      .eq("access_code", code.trim().toUpperCase())
      .single();

    if (dbError || !team) {
      setError("קוד גישה לא נמצא — נסה שוב");
      setShake(true);
      setTimeout(() => setShake(false), 500);
      setLoading(false);
      return;
    }

    // Re-use existing player record if name+team match (prevents duplicates on refresh)
    const { data: existing } = await supabase
      .from("players")
      .select("*")
      .eq("name", name.trim())
      .eq("team_id", team.id)
      .maybeSingle();
    const player = existing ?? (
      await supabase.from("players").insert({ name: name.trim(), team_id: team.id }).select().single()
    ).data;
    if (player) localStorage.setItem(PLAYER_SESSION_KEY, JSON.stringify(player));

    localStorage.setItem(TEAM_SESSION_KEY, JSON.stringify(team));
    router.push(team.unlocked_at ? "/instructions" : "/waiting");
  }

  return (
    <main className="relative flex flex-col min-h-dvh overflow-hidden" style={{ background: "linear-gradient(160deg, #0a1628 0%, #0d2044 40%, #0a1628 100%)" }}>

      {/* ── Stars background ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {STARS.map((s, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              width: `${s.w}px`,
              height: `${s.h}px`,
              top: `${s.top}%`,
              left: `${s.left}%`,
              opacity: s.op,
            }}
          />
        ))}
        {/* Big glow from globe area */}
        <div className="absolute top-[18%] left-1/2 -translate-x-1/2 w-72 h-72 rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, #4a90d9 0%, transparent 70%)" }} />
      </div>

      {/* ── Content ── */}
      <div className="relative z-10 flex flex-col flex-1 items-center justify-between px-5 py-8">

        {/* TOP — Logo area */}
        <div className="flex flex-col items-center gap-0 mt-4">

          {/* Globe with orbiting arrows */}
          <div className="relative w-44 h-44 flex items-center justify-center mb-1">
            {/* Orbit ring */}
            <div className="absolute w-40 h-40 rounded-full border border-yellow-400/20 animate-spin" style={{ animationDuration: "8s" }} />
            <div className="absolute w-32 h-32 rounded-full border border-yellow-400/10 animate-spin" style={{ animationDuration: "5s", animationDirection: "reverse" }} />

            {/* Globe */}
            <div className="relative w-28 h-28 rounded-full flex items-center justify-center shadow-[0_0_60px_#1a4a8a80]"
              style={{
                background: "radial-gradient(circle at 35% 35%, #4a9ade 0%, #1a5fa8 40%, #0d3060 80%, #061828 100%)",
                boxShadow: "0 0 40px #1a5fa840, inset -8px -8px 20px #00000060, inset 4px 4px 10px #6ab5f040"
              }}>
              {/* Continent silhouettes */}
              <div className="absolute inset-0 rounded-full overflow-hidden opacity-40">
                <div className="absolute top-4 left-5 w-8 h-5 rounded-full bg-green-600/60 rotate-12" />
                <div className="absolute top-8 left-12 w-6 h-8 rounded-full bg-green-700/50 -rotate-6" />
                <div className="absolute bottom-6 left-4 w-10 h-6 rounded-full bg-green-600/50 rotate-6" />
                <div className="absolute top-5 right-4 w-7 h-9 rounded-full bg-green-700/60 rotate-3" />
              </div>
            </div>

            {/* Orbiting arrows */}
            <div className="absolute w-full h-full animate-spin" style={{ animationDuration: "3s" }}>
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1">
                <span style={{ fontSize: "22px", filter: "drop-shadow(0 0 8px #FFD700)" }}>➤</span>
              </div>
            </div>
            <div className="absolute w-full h-full animate-spin" style={{ animationDuration: "3s", animationDelay: "-1.5s" }}>
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1 rotate-180">
                <span style={{ fontSize: "22px", filter: "drop-shadow(0 0 8px #FFD700)" }}>➤</span>
              </div>
            </div>
          </div>

          {/* Title — 3D gold style, both lines together so they scale as a unit */}
          <div className="w-full px-4 text-center leading-none select-none">
            <h1
              className="font-black leading-[0.9] tracking-tight whitespace-nowrap"
              style={{
                fontFamily: "'Impact','Arial Black','David','sans-serif'",
                fontSize: "clamp(2.8rem,13vw,5rem)",
                background: "linear-gradient(180deg, #FFE566 0%, #FFB800 45%, #CC8800 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                filter: "drop-shadow(0 3px 0px #7A4E00) drop-shadow(0 6px 12px #00000080)",
              }}
            >
              המירוץ
            </h1>
            <h2
              className="font-black leading-none whitespace-nowrap"
              style={{
                fontFamily: "'Impact','Arial Black','David','sans-serif'",
                fontSize: "clamp(1.6rem,7.5vw,2.8rem)",
                letterSpacing: "0.05em",
                background: "linear-gradient(180deg, #FFE566 0%, #FFB800 55%, #CC8800 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                filter: "drop-shadow(0 2px 0px #7A4E00) drop-shadow(0 4px 8px #00000060)",
              }}
            >
              למט&quot;מון
            </h2>
          </div>

          {/* Subtitle */}
          <div className="flex items-center gap-2 mt-3">
            <div className="h-px w-6 bg-yellow-400/40" />
            <p className="text-[11px] font-bold text-yellow-300/60 uppercase tracking-[0.25em]">
              פארק הירקון
            </p>
            <div className="h-px w-6 bg-yellow-400/40" />
          </div>
        </div>

        {/* MIDDLE — Hype text + form */}
        <div className="w-full max-w-[340px] flex flex-col gap-5 mt-6">

          {/* Hype copy */}
          <div className="text-center px-2">
            <p className="text-white font-bold text-lg leading-snug">
              האתגר הגדול מתחיל עכשיו.
            </p>
            <p className="text-white/50 text-sm mt-1 leading-relaxed">
              חידות שדה אמיתיות בפארק הירקון. רק קבוצה אחת תנצח.
              <br />
              <span className="text-yellow-400/70">האם זו תהיה הקבוצה שלכם?</span>
            </p>
          </div>

          {/* Card */}
          <div
            className="rounded-2xl p-5 border border-yellow-400/20"
            style={{
              background: "linear-gradient(135deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.03) 100%)",
              backdropFilter: "blur(12px)",
              boxShadow: "0 20px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)"
            }}
          >
            <p className="text-center text-xs font-bold text-white/40 uppercase tracking-[0.2em] mb-4">
              הזינו שם וקוד גישה
            </p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="השם שלך"
                autoComplete="given-name"
                maxLength={30}
                className="w-full rounded-xl px-4 py-3.5 text-center text-lg font-bold text-white placeholder:text-white/25 border-2 border-yellow-400/20 focus:border-yellow-400 focus:outline-none transition-all duration-200"
                style={{ background: "rgba(255,255,255,0.06)" }}
                dir="rtl"
              />
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="_ _ _ _ _"
                autoComplete="off"
                autoCapitalize="characters"
                maxLength={10}
                className={[
                  "w-full rounded-xl px-4 py-4 text-center text-2xl font-black tracking-[0.4em]",
                  "text-white placeholder:text-white/15 placeholder:tracking-[0.3em]",
                  "border-2 focus:outline-none transition-all duration-200",
                  "focus:scale-[1.02]",
                  error
                    ? "border-red-500/80 bg-red-500/10 focus:border-red-400"
                    : "border-yellow-400/30 bg-white/8 focus:border-yellow-400 focus:bg-white/12",
                  shake ? "animate-shake" : "",
                ].join(" ")}
                style={{ background: error ? "rgba(220,38,38,0.1)" : "rgba(255,255,255,0.06)" }}
              />
              {error && (
                <p className="text-center text-xs font-bold text-red-400 -mt-1">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading || !code.trim() || !name.trim()}
                className="relative w-full rounded-xl py-4 font-black text-lg transition-all duration-150 border-2 border-yellow-600/50 overflow-hidden disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
                style={{
                  background: loading || !code.trim() || !name.trim()
                    ? "linear-gradient(180deg, #c49000 0%, #8a6400 100%)"
                    : "linear-gradient(180deg, #FFD700 0%, #E8A000 50%, #C47800 100%)",
                  color: "#1a0a00",
                  boxShadow: code.trim() && name.trim() && !loading ? "0 4px 20px rgba(232,160,0,0.5), inset 0 1px 0 rgba(255,255,255,0.3)" : "none",
                }}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="inline-block w-5 h-5 border-2 border-[#1a0a00] border-t-transparent rounded-full animate-spin" />
                    <span>בודק...</span>
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <span>יאללה, מתחילים!</span>
                    <span className="text-xl">🏁</span>
                  </span>
                )}
                {/* Shine effect */}
                {!loading && code.trim() && name.trim() && (
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />
                )}
              </button>
            </form>
          </div>

          {/* Sub-hint */}
          <p className="text-center text-[11px] text-white/25">
            הקוד מגיע ממנהל המירוץ
          </p>
        </div>

        {/* BOTTOM — dots decoration */}
        <div className="flex items-center gap-3 mt-6">
          <div className="h-px w-12 bg-gradient-to-r from-transparent to-yellow-400/30" />
          <div className="flex gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-yellow-400/60" />
            <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
            <div className="w-1.5 h-1.5 rounded-full bg-red-500/50" />
          </div>
          <div className="h-px w-12 bg-gradient-to-l from-transparent to-yellow-400/30" />
        </div>
      </div>
    </main>
  );
}
