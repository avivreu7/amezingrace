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
    <main
      className="relative flex flex-col h-dvh overflow-y-auto"
      style={{ background: "linear-gradient(160deg, #0a1628 0%, #0d2044 40%, #0a1628 100%)" }}
    >
      {/* ── Stars background ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {STARS.map((s, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white"
            style={{ width: `${s.w}px`, height: `${s.h}px`, top: `${s.top}%`, left: `${s.left}%`, opacity: s.op }}
          />
        ))}
        <div
          className="absolute top-[15%] left-1/2 -translate-x-1/2 w-64 h-64 rounded-full opacity-15"
          style={{ background: "radial-gradient(circle, #4a90d9 0%, transparent 70%)" }}
        />
      </div>

      {/* ── Content — single scrollable column ── */}
      <div className="relative z-10 flex flex-col items-center justify-center flex-1 px-5 py-6 gap-5">

        {/* ── Globe + Title ── */}
        <div className="flex flex-col items-center gap-0">

          {/* Globe */}
          <div className="relative flex items-center justify-center mb-2 animate-float"
            style={{ width: "clamp(108px,30vw,144px)", height: "clamp(108px,30vw,144px)" }}>
            {/* Glow */}
            <div className="absolute inset-0 rounded-full"
              style={{ background: "radial-gradient(circle, rgba(74,144,217,0.18) 0%, transparent 70%)" }} />
            {/* Orbit rings */}
            <div className="absolute inset-0 rounded-full border border-yellow-400/25 animate-spin"
              style={{ animationDuration: "8s" }} />
            <div className="absolute rounded-full border border-yellow-400/12 animate-spin"
              style={{ inset: "10%", animationDuration: "5s", animationDirection: "reverse" }} />

            {/* Globe sphere */}
            <div
              className="relative rounded-full"
              style={{
                width: "clamp(76px,21vw,100px)",
                height: "clamp(76px,21vw,100px)",
                background: "radial-gradient(circle at 35% 35%, #5aaae8 0%, #1a5fa8 40%, #0d3060 80%, #061828 100%)",
                boxShadow: "0 0 40px #1a5fa850, 0 16px 32px rgba(0,0,0,0.5), inset -6px -6px 16px #00000060, inset 3px 3px 8px #7ac5ff30",
              }}
            >
              <div className="absolute inset-0 rounded-full overflow-hidden opacity-40">
                <div className="absolute top-[28%] left-[18%] w-[32%] h-[20%] rounded-full bg-green-600/60 rotate-12" />
                <div className="absolute top-[38%] left-[45%] w-[25%] h-[32%] rounded-full bg-green-700/50 -rotate-6" />
                <div className="absolute bottom-[22%] left-[15%] w-[38%] h-[24%] rounded-full bg-green-600/50 rotate-6" />
              </div>
              <div className="absolute top-[8%] left-[14%] w-[30%] h-[20%] rounded-full bg-white/18 rotate-12 blur-sm" />
            </div>

            {/* Orbiting arrows */}
            <div className="absolute inset-0 animate-spin" style={{ animationDuration: "3s" }}>
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1">
                <span style={{ fontSize: "18px", filter: "drop-shadow(0 0 10px #FFD700)" }}>➤</span>
              </div>
            </div>
            <div className="absolute inset-0 animate-spin" style={{ animationDuration: "3s", animationDelay: "-1.5s" }}>
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1 rotate-180">
                <span style={{ fontSize: "18px", filter: "drop-shadow(0 0 10px #FFD700)" }}>➤</span>
              </div>
            </div>
          </div>

          {/* Title */}
          <div className="text-center leading-none select-none">
            <h1
              className="font-black leading-[0.9] tracking-tight whitespace-nowrap"
              style={{
                fontFamily: "'Impact','Arial Black','David','sans-serif'",
                fontSize: "clamp(2.4rem,11vw,4rem)",
                background: "linear-gradient(180deg, #FFE566 0%, #FFB800 45%, #CC8800 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                filter: "drop-shadow(0 2px 0px #7A4E00) drop-shadow(0 5px 10px #00000080)",
              }}
            >
              המירוץ
            </h1>
            <h2
              className="font-black leading-none whitespace-nowrap"
              style={{
                fontFamily: "'Impact','Arial Black','David','sans-serif'",
                fontSize: "clamp(1.4rem,6.5vw,2.4rem)",
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
            <div className="flex items-center justify-center gap-2 mt-2">
              <div className="h-px w-5 bg-yellow-400/40" />
              <p className="text-[10px] font-bold text-yellow-300/60 uppercase tracking-[0.25em]">פארק הירקון</p>
              <div className="h-px w-5 bg-yellow-400/40" />
            </div>
          </div>
        </div>

        {/* ── Form card ── */}
        <div className="w-full max-w-[340px]">
          <div
            className="rounded-2xl p-5 animate-border-glow"
            style={{
              background: "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%)",
              backdropFilter: "blur(12px)",
              border: "1px solid rgba(255,215,0,0.25)",
              boxShadow: "0 20px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)",
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
                  error
                    ? "border-red-500/80 focus:border-red-400"
                    : "border-yellow-400/30 focus:border-yellow-400",
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
                className="relative btn-shimmer w-full rounded-xl py-4 font-black text-lg transition-all duration-150 border-2 border-yellow-600/50 overflow-hidden disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
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
                {!loading && code.trim() && name.trim() && (
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />
                )}
              </button>
            </form>
          </div>

          <p className="text-center text-[11px] text-white/25 mt-3">
            הקוד מגיע ממנהל המירוץ
          </p>
        </div>

      </div>
    </main>
  );
}
