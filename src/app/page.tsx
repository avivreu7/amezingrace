"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { TEAM_SESSION_KEY, PLAYER_SESSION_KEY } from "@/lib/game";

const STARS = [
  { w: 2, h: 2, top: 5,  left: 12, op: 0.55 },
  { w: 1, h: 1, top: 11, left: 78, op: 0.45 },
  { w: 1, h: 1, top: 18, left: 43, op: 0.35 },
  { w: 2, h: 2, top: 3,  left: 90, op: 0.5  },
  { w: 1, h: 1, top: 29, left: 7,  op: 0.3  },
  { w: 1, h: 1, top: 36, left: 62, op: 0.5  },
  { w: 2, h: 2, top: 47, left: 28, op: 0.4  },
  { w: 1, h: 1, top: 53, left: 86, op: 0.45 },
  { w: 1, h: 1, top: 60, left: 18, op: 0.3  },
  { w: 2, h: 2, top: 68, left: 72, op: 0.55 },
  { w: 1, h: 1, top: 75, left: 40, op: 0.35 },
  { w: 1, h: 1, top: 82, left: 55, op: 0.45 },
  { w: 1, h: 1, top: 90, left: 10, op: 0.3  },
  { w: 2, h: 2, top: 15, left: 33, op: 0.45 },
  { w: 1, h: 1, top: 24, left: 93, op: 0.4  },
  { w: 1, h: 1, top: 44, left: 51, op: 0.4  },
  { w: 1, h: 1, top: 58, left: 82, op: 0.45 },
  { w: 2, h: 2, top: 71, left: 23, op: 0.55 },
  { w: 1, h: 1, top: 86, left: 66, op: 0.35 },
  { w: 1, h: 1, top: 2,  left: 55, op: 0.45 },
  { w: 1, h: 1, top: 95, left: 37, op: 0.3  },
  { w: 1, h: 1, top: 9,  left: 69, op: 0.5  },
  { w: 1, h: 1, top: 34, left: 19, op: 0.35 },
  { w: 2, h: 2, top: 50, left: 47, op: 0.4  },
];

const GOLD_TEXT = {
  background: "linear-gradient(180deg,#FFE566 0%,#FFB800 45%,#CC8800 100%)",
  WebkitBackgroundClip: "text" as const,
  WebkitTextFillColor: "transparent" as const,
  backgroundClip: "text" as const,
};
const FONT = { fontFamily: "'Impact','Arial Black','David',sans-serif" };

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
      .from("teams").select("*").eq("access_code", code.trim().toUpperCase()).single();

    if (dbError || !team) {
      setError("קוד גישה לא נמצא — נסה שוב");
      setShake(true);
      setTimeout(() => setShake(false), 500);
      setLoading(false);
      return;
    }

    const { data: existing } = await supabase.from("players").select("*")
      .eq("name", name.trim()).eq("team_id", team.id).maybeSingle();
    const player = existing ?? (
      await supabase.from("players").insert({ name: name.trim(), team_id: team.id }).select().single()
    ).data;
    if (player) localStorage.setItem(PLAYER_SESSION_KEY, JSON.stringify(player));
    localStorage.setItem(TEAM_SESSION_KEY, JSON.stringify(team));
    router.push(team.unlocked_at ? "/instructions" : "/waiting");
  }

  const ready = !loading && !!code.trim() && !!name.trim();

  return (
    <main
      className="relative flex flex-col h-dvh overflow-y-auto"
      style={{ background: "#040812" }}
    >
      {/* ── Background layers ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">

        {/* Deep blue radial glow — center top */}
        <div className="absolute" style={{
          top: "-10%", left: "50%", transform: "translateX(-50%)",
          width: "110%", height: "70%",
          background: "radial-gradient(ellipse 70% 60% at 50% 20%, #0d2a5a 0%, #060f28 55%, transparent 80%)",
        }} />

        {/* Subtle cyan atmospheric glow — top right */}
        <div className="absolute" style={{
          top: "-5%", right: "-10%", width: "55%", height: "45%",
          background: "radial-gradient(circle, rgba(0,180,220,0.07) 0%, transparent 65%)",
        }} />

        {/* Gold warmth glow — bottom left */}
        <div className="absolute" style={{
          bottom: 0, left: "-5%", width: "45%", height: "40%",
          background: "radial-gradient(circle, rgba(180,120,0,0.08) 0%, transparent 70%)",
        }} />

        {/* Star field */}
        {STARS.map((s, i) => (
          <div key={i} className="absolute rounded-full bg-white"
            style={{ width: s.w, height: s.h, top: `${s.top}%`, left: `${s.left}%`, opacity: s.op }} />
        ))}
      </div>

      {/* ── Top gold bar ── */}
      <div className="shrink-0 relative z-10">
        <div className="h-1" style={{ background: "linear-gradient(90deg,#7A4E00,#FFD700 30%,#FFE566 50%,#FFD700 70%,#7A4E00)" }} />
        <div className="h-px" style={{ background: "linear-gradient(90deg,transparent,rgba(255,229,102,0.4),transparent)" }} />
      </div>

      {/* ── Main content ── */}
      <div className="relative z-10 flex flex-col items-center justify-center flex-1 px-5 py-5 gap-5">

        {/* ── Globe Hero ── */}
        <div className="relative flex items-center justify-center animate-float"
          style={{ width: "clamp(130px,34vw,160px)", height: "clamp(130px,34vw,160px)" }}>

          {/* Outer atmospheric halo — blue */}
          <div className="absolute inset-[-30%] rounded-full" style={{
            background: "radial-gradient(circle, rgba(30,100,200,0.18) 0%, rgba(0,180,255,0.06) 45%, transparent 70%)",
          }} />

          {/* Cyan atmospheric rim */}
          <div className="absolute rounded-full" style={{
            inset: "-8%",
            background: "radial-gradient(circle, transparent 55%, rgba(0,229,255,0.09) 70%, transparent 80%)",
          }} />

          {/* Slow outer orbit ring — gold */}
          <div className="absolute inset-0 rounded-full" style={{
            border: "1px solid rgba(255,215,0,0.18)",
            animation: "spin 14s linear infinite",
          }} />

          {/* Inner orbit ring — cyan, reverse */}
          <div className="absolute rounded-full" style={{
            inset: "7%",
            border: "1px solid rgba(0,229,255,0.15)",
            animation: "spin 8s linear infinite reverse",
          }} />

          {/* Globe sphere */}
          <div className="relative rounded-full animate-zoom-pulse" style={{
            width: "clamp(86px,22vw,110px)", height: "clamp(86px,22vw,110px)",
            background: "radial-gradient(circle at 30% 28%, #7dc8f5 0%, #1a65c8 30%, #0a3578 65%, #050d2a 100%)",
            boxShadow: [
              "0 0 0 2px rgba(0,229,255,0.12)",
              "0 0 50px rgba(26,95,200,0.55)",
              "0 0 90px rgba(0,180,255,0.2)",
              "0 20px 50px rgba(0,0,0,0.7)",
              "inset -8px -8px 20px rgba(0,0,0,0.65)",
              "inset 5px 5px 12px rgba(130,205,255,0.22)",
            ].join(","),
          }}>
            {/* Continents */}
            <div className="absolute inset-0 rounded-full overflow-hidden" style={{ opacity: 0.45 }}>
              <div className="absolute rounded-full bg-green-600/70 rotate-12"  style={{ top:"25%", left:"15%", width:"35%", height:"22%" }} />
              <div className="absolute rounded-full bg-green-700/55 -rotate-6" style={{ top:"37%", left:"46%", width:"26%", height:"34%" }} />
              <div className="absolute rounded-full bg-green-600/55 rotate-6"  style={{ bottom:"19%", left:"13%", width:"40%", height:"26%" }} />
            </div>
            {/* Specular highlight */}
            <div className="absolute rounded-full bg-white/20 blur-sm rotate-12"
              style={{ top:"6%", left:"12%", width:"33%", height:"22%" }} />
          </div>

          {/* Orbiting gold ➤ arrows */}
          {[0, 1].map((i) => (
            <div key={i} className="absolute inset-0"
              style={{ animation: "spin 3.4s linear infinite", animationDelay: i === 1 ? "-1.7s" : "0s" }}>
              <div className={`absolute left-1/2 -translate-x-1/2 ${i === 0 ? "top-0 -translate-y-1" : "bottom-0 translate-y-1 rotate-180"}`}>
                <span style={{ fontSize: 15, filter: "drop-shadow(0 0 10px #FFD700) drop-shadow(0 0 5px #FF9900)" }}>➤</span>
              </div>
            </div>
          ))}
        </div>

        {/* ── Title Block ── */}
        <div className="text-center select-none" style={{ lineHeight: 1 }}>

          {/* Label */}
          <p className="text-[9px] font-black uppercase tracking-[0.4em] mb-2"
            style={{ color: "rgba(255,215,0,0.4)" }}>
            ✦ AMAZING RACE ISRAEL ✦
          </p>

          {/* "המירוץ" — huge gold gradient */}
          <h1 className="leading-none font-black whitespace-nowrap" style={{
            ...GOLD_TEXT, ...FONT,
            fontSize: "clamp(3.4rem,16vw,5.2rem)",
            filter: "drop-shadow(0 3px 0 #7A4E00) drop-shadow(0 6px 24px rgba(0,0,0,0.9))",
          }}>
            המירוץ
          </h1>

          {/* "למט"מון" — mixed colors */}
          <h2 className="leading-none font-black whitespace-nowrap mt-1" style={{
            ...FONT,
            fontSize: "clamp(2rem,9.5vw,3.4rem)",
          }}>
            {/* ל */}
            <span style={{
              color: "#E8A000",
              textShadow: "0 2px 0 #7A4E00, 0 5px 16px rgba(0,0,0,0.85)",
            }}>ל</span>
            {/* מט"מ — Cyan electric */}
            <span style={{
              color: "#00E5FF",
              textShadow: [
                "0 0 18px rgba(0,229,255,0.85)",
                "0 0 40px rgba(0,229,255,0.45)",
                "0 0 70px rgba(0,180,255,0.25)",
                "0 2px 0 #005566",
                "0 5px 16px rgba(0,0,0,0.85)",
              ].join(","),
              letterSpacing: "0.02em",
            }}>מט&quot;מ</span>
            {/* ון */}
            <span style={{
              color: "#E8A000",
              textShadow: "0 2px 0 #7A4E00, 0 5px 16px rgba(0,0,0,0.85)",
            }}>ון</span>
          </h2>

          {/* Divider */}
          <div className="flex items-center justify-center gap-3 mt-3">
            <div className="h-px w-10" style={{ background: "linear-gradient(90deg,transparent,rgba(255,215,0,0.45))" }} />
            <span className="text-[10px] font-black uppercase tracking-[0.22em]"
              style={{ color: "rgba(255,215,0,0.45)" }}>
              🏁 פארק הירקון 🏁
            </span>
            <div className="h-px w-10" style={{ background: "linear-gradient(90deg,rgba(255,215,0,0.45),transparent)" }} />
          </div>
        </div>

        {/* ── Login card ── */}
        <div className="w-full max-w-85">
          <div className="rounded-2xl overflow-hidden" style={{
            background: "linear-gradient(160deg,rgba(255,255,255,0.065) 0%,rgba(255,255,255,0.025) 100%)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(255,215,0,0.22)",
            boxShadow: [
              "0 0 0 1px rgba(0,229,255,0.06)",
              "0 24px 60px rgba(0,0,0,0.65)",
              "inset 0 1px 0 rgba(255,255,255,0.09)",
            ].join(","),
          }}>
            {/* Card top — gold */}
            <div className="h-px" style={{
              background: "linear-gradient(90deg,transparent,rgba(255,215,0,0.7) 30%,rgba(0,229,255,0.5) 60%,transparent)",
            }} />

            <div className="p-5">
              <div className="flex items-center justify-center gap-2 mb-4">
                <div className="h-px flex-1" style={{ background: "rgba(255,255,255,0.07)" }} />
                <p className="text-[10px] font-black text-white/35 uppercase tracking-[0.22em]">
                  הכנסו לתחרות
                </p>
                <div className="h-px flex-1" style={{ background: "rgba(255,255,255,0.07)" }} />
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                {/* Name */}
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="השם שלך"
                  autoComplete="given-name"
                  maxLength={30}
                  dir="rtl"
                  className="w-full rounded-xl px-4 py-3.5 text-center text-base font-bold text-white placeholder:text-white/22 focus:outline-none transition-all duration-200"
                  style={{
                    background: "rgba(255,255,255,0.055)",
                    border: "1.5px solid rgba(255,215,0,0.18)",
                    caretColor: "#FFD700",
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = "rgba(255,215,0,0.65)"}
                  onBlur={(e) => e.currentTarget.style.borderColor = "rgba(255,215,0,0.18)"}
                />

                {/* Code */}
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
                    "focus:outline-none transition-all duration-200",
                    shake ? "animate-shake" : "",
                  ].join(" ")}
                  style={{
                    background: error ? "rgba(220,38,38,0.1)" : "rgba(255,255,255,0.055)",
                    border: `1.5px solid ${error ? "rgba(239,68,68,0.7)" : "rgba(255,215,0,0.18)"}`,
                    caretColor: "#FFD700",
                  }}
                  onFocus={(e) => { if (!error) e.currentTarget.style.borderColor = "rgba(255,215,0,0.65)"; }}
                  onBlur={(e) => { if (!error) e.currentTarget.style.borderColor = "rgba(255,215,0,0.18)"; }}
                />

                {error && (
                  <p className="text-center text-xs font-bold text-red-400 -mt-1 animate-slide-up">{error}</p>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={!ready}
                  className={`relative btn-shimmer w-full rounded-xl py-4 font-black text-lg overflow-hidden transition-all duration-200 active:scale-95 ${ready ? "animate-bounce-gentle" : ""}`}
                  style={{
                    background: ready
                      ? "linear-gradient(180deg,#FFD700 0%,#E8A000 45%,#C47800 100%)"
                      : "rgba(255,255,255,0.055)",
                    color: ready ? "#1a0a00" : "rgba(255,255,255,0.18)",
                    border: ready ? "1.5px solid rgba(255,200,0,0.5)" : "1.5px solid rgba(255,255,255,0.07)",
                    boxShadow: ready
                      ? "0 4px 24px rgba(232,160,0,0.5), 0 0 0 1px rgba(255,215,0,0.2), inset 0 1px 0 rgba(255,255,255,0.35)"
                      : "none",
                    cursor: ready ? "pointer" : "not-allowed",
                  }}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="inline-block w-5 h-5 border-2 border-[#1a0a00] border-t-transparent rounded-full animate-spin" />
                      <span>נכנסים לתחרות...</span>
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <span>יאללה, מתחילים!</span>
                      <span className={ready ? "animate-float" : ""} style={{ fontSize: "1.15em" }}>🏁</span>
                    </span>
                  )}
                  {ready && (
                    <div className="absolute inset-0 rounded-xl pointer-events-none"
                      style={{ background: "linear-gradient(180deg,rgba(255,255,255,0.22) 0%,transparent 55%)" }} />
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Bottom hint */}
          <div className="flex items-center justify-center gap-2 mt-3">
            <div className="h-px flex-1" style={{ background: "rgba(255,255,255,0.05)" }} />
            <p className="text-[10px] text-white/22 px-2">הקוד מגיע ממנהל המירוץ</p>
            <div className="h-px flex-1" style={{ background: "rgba(255,255,255,0.05)" }} />
          </div>
        </div>

      </div>

      {/* ── Bottom gold bar ── */}
      <div className="shrink-0 relative z-10">
        <div className="h-px" style={{ background: "linear-gradient(90deg,transparent,rgba(255,229,102,0.35),transparent)" }} />
        <div className="h-1" style={{ background: "linear-gradient(90deg,#7A4E00,#FFD700 30%,#FFE566 50%,#FFD700 70%,#7A4E00)" }} />
      </div>

    </main>
  );
}
