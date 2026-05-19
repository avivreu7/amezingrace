"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { TEAM_SESSION_KEY, PLAYER_SESSION_KEY } from "@/lib/game";

const STARS = [
  { w: 1, h: 1, top: 7,  left: 11, op: 0.5 },
  { w: 2, h: 2, top: 13, left: 79, op: 0.6 },
  { w: 1, h: 1, top: 20, left: 44, op: 0.4 },
  { w: 1, h: 1, top: 4,  left: 91, op: 0.45 },
  { w: 1, h: 1, top: 31, left: 6,  op: 0.3 },
  { w: 1, h: 1, top: 38, left: 63, op: 0.55 },
  { w: 2, h: 2, top: 48, left: 29, op: 0.4 },
  { w: 1, h: 1, top: 54, left: 87, op: 0.5 },
  { w: 1, h: 1, top: 61, left: 17, op: 0.35 },
  { w: 1, h: 1, top: 69, left: 73, op: 0.6 },
  { w: 2, h: 1, top: 76, left: 41, op: 0.4 },
  { w: 1, h: 2, top: 83, left: 56, op: 0.5 },
  { w: 1, h: 1, top: 91, left: 9,  op: 0.3 },
  { w: 1, h: 1, top: 17, left: 34, op: 0.5 },
  { w: 1, h: 1, top: 26, left: 94, op: 0.4 },
  { w: 2, h: 2, top: 46, left: 52, op: 0.45 },
  { w: 1, h: 1, top: 59, left: 83, op: 0.5 },
  { w: 1, h: 1, top: 72, left: 24, op: 0.6 },
  { w: 1, h: 1, top: 87, left: 67, op: 0.4 },
  { w: 1, h: 1, top: 2,  left: 54, op: 0.5 },
  { w: 2, h: 2, top: 96, left: 38, op: 0.3 },
  { w: 1, h: 1, top: 10, left: 70, op: 0.55 },
  { w: 1, h: 1, top: 35, left: 20, op: 0.4 },
  { w: 1, h: 1, top: 52, left: 48, op: 0.35 },
];

const GOLD = { background: "linear-gradient(180deg,#FFE566 0%,#FFB800 45%,#CC8800 100%)", WebkitBackgroundClip: "text" as const, WebkitTextFillColor: "transparent" as const, backgroundClip: "text" as const };
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
    <main className="relative flex flex-col h-dvh overflow-y-auto" style={{ background: "#040e20" }}>

      {/* ── Layered background ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">

        {/* Base gradient */}
        <div className="absolute inset-0" style={{
          background: "radial-gradient(ellipse 80% 55% at 50% 30%, #0d2a5a 0%, #040e20 65%)"
        }} />

        {/* Red cinematic spotlight from top-right */}
        <div className="absolute" style={{
          top: "-10%", right: "-10%", width: "60%", height: "60%",
          background: "radial-gradient(circle, rgba(180,20,20,0.18) 0%, transparent 65%)",
        }} />

        {/* Gold spotlight from bottom-left */}
        <div className="absolute" style={{
          bottom: "-5%", left: "-5%", width: "50%", height: "50%",
          background: "radial-gradient(circle, rgba(200,140,0,0.10) 0%, transparent 65%)",
        }} />

        {/* Diagonal racing stripes */}
        <div className="absolute inset-0" style={{
          background: `
            linear-gradient(148deg, transparent 35%, rgba(214,40,40,0.035) 35%, rgba(214,40,40,0.035) 37%, transparent 37%),
            linear-gradient(148deg, transparent 52%, rgba(255,215,0,0.025) 52%, rgba(255,215,0,0.025) 54%, transparent 54%),
            linear-gradient(148deg, transparent 68%, rgba(214,40,40,0.02) 68%, rgba(214,40,40,0.02) 70%, transparent 70%)
          `,
        }} />

        {/* Stars */}
        {STARS.map((s, i) => (
          <div key={i} className="absolute rounded-full bg-white"
            style={{ width: s.w, height: s.h, top: `${s.top}%`, left: `${s.left}%`, opacity: s.op }} />
        ))}
      </div>

      {/* ── Top racing bar ── */}
      <div className="shrink-0 relative z-10">
        <div className="h-1.25" style={{ background: "linear-gradient(90deg, #D62828 0%, #FF4444 20%, #FFD700 50%, #FF4444 80%, #D62828 100%)" }} />
        <div className="h-0.5" style={{ background: "linear-gradient(90deg, transparent, rgba(255,215,0,0.3), transparent)" }} />
      </div>

      {/* ── Main content ── */}
      <div className="relative z-10 flex flex-col items-center justify-center flex-1 px-5 py-4 gap-4">

        {/* ── Globe ── */}
        <div className="relative flex items-center justify-center animate-float"
          style={{ width: "clamp(100px,28vw,136px)", height: "clamp(100px,28vw,136px)" }}>

          {/* Outer glow halo */}
          <div className="absolute inset-[-20%] rounded-full" style={{
            background: "radial-gradient(circle, rgba(74,144,217,0.15) 0%, transparent 70%)",
          }} />

          {/* Orbit rings */}
          <div className="absolute inset-0 rounded-full border-2 animate-spin"
            style={{ borderColor: "rgba(255,215,0,0.2)", animationDuration: "9s" }} />
          <div className="absolute rounded-full border animate-spin"
            style={{ inset: "8%", borderColor: "rgba(214,40,40,0.2)", animationDuration: "5.5s", animationDirection: "reverse" }} />

          {/* Globe sphere */}
          <div className="relative rounded-full" style={{
            width: "clamp(70px,19vw,92px)", height: "clamp(70px,19vw,92px)",
            background: "radial-gradient(circle at 32% 32%, #6bbcf0 0%, #1a65b8 35%, #0b3570 75%, #050f28 100%)",
            boxShadow: "0 0 50px rgba(26,95,168,0.5), 0 18px 40px rgba(0,0,0,0.6), inset -7px -7px 18px rgba(0,0,0,0.65), inset 4px 4px 10px rgba(120,195,255,0.25)",
          }}>
            {/* Continents */}
            <div className="absolute inset-0 rounded-full overflow-hidden" style={{ opacity: 0.45 }}>
              <div className="absolute rounded-full bg-green-600/70 rotate-12" style={{ top:"26%",left:"16%",width:"34%",height:"22%" }} />
              <div className="absolute rounded-full bg-green-700/55 -rotate-6" style={{ top:"38%",left:"46%",width:"26%",height:"34%" }} />
              <div className="absolute rounded-full bg-green-600/55 rotate-6" style={{ bottom:"20%",left:"14%",width:"40%",height:"26%" }} />
            </div>
            {/* Specular */}
            <div className="absolute rounded-full bg-white/22 rotate-12 blur-sm" style={{ top:"7%",left:"13%",width:"32%",height:"22%" }} />
            {/* Red racing stripe on globe */}
            <div className="absolute left-0 right-0 h-0.5" style={{ top:"50%", background:"rgba(214,40,40,0.35)", transform:"rotate(-15deg) scaleX(1.2)" }} />
          </div>

          {/* Orbiting gold arrows */}
          {[0, 1].map((i) => (
            <div key={i} className="absolute inset-0 animate-spin"
              style={{ animationDuration: "3.2s", animationDelay: i === 1 ? "-1.6s" : "0s" }}>
              <div className={`absolute left-1/2 -translate-x-1/2 ${i === 0 ? "top-0 -translate-y-1" : "bottom-0 translate-y-1 rotate-180"}`}>
                <span style={{ fontSize: "16px", filter: "drop-shadow(0 0 12px #FFD700) drop-shadow(0 0 6px #FF8800)" }}>➤</span>
              </div>
            </div>
          ))}
        </div>

        {/* ── Title Block ── */}
        <div className="text-center select-none" style={{ lineHeight: 1 }}>

          {/* Super small label */}
          <p className="text-[9px] font-black uppercase tracking-[0.45em] mb-1.5"
            style={{ color: "rgba(255,100,100,0.55)", letterSpacing: "0.4em" }}>
            ✦ AMAZING RACE ISRAEL ✦
          </p>

          {/* "המירוץ" — huge gold */}
          <h1 className="leading-none font-black whitespace-nowrap" style={{
            ...GOLD, ...FONT,
            fontSize: "clamp(3.2rem,15vw,5rem)",
            filter: "drop-shadow(0 3px 0 #7A4E00) drop-shadow(0 6px 20px rgba(0,0,0,0.9))",
          }}>
            המירוץ
          </h1>

          {/* "למט"מון" — mixed colors */}
          <h2 className="leading-none font-black whitespace-nowrap mt-0.5" style={{
            ...FONT,
            fontSize: "clamp(1.9rem,9vw,3.2rem)",
          }}>
            {/* ל — gold */}
            <span style={{
              color: "#E8A000",
              textShadow: "0 2px 0 #7A4E00, 0 5px 14px rgba(0,0,0,0.8)",
            }}>ל</span>
            {/* מט"מ — RED highlight — the brand */}
            <span style={{
              color: "#FF3333",
              textShadow: "0 2px 0 #7A0000, 0 0 24px rgba(255,50,50,0.55), 0 5px 14px rgba(0,0,0,0.8)",
              letterSpacing: "0.02em",
            }}>מט&quot;מ</span>
            {/* ון — gold */}
            <span style={{
              color: "#E8A000",
              textShadow: "0 2px 0 #7A4E00, 0 5px 14px rgba(0,0,0,0.8)",
            }}>ון</span>
          </h2>

          {/* Racing divider */}
          <div className="flex items-center justify-center gap-3 mt-3">
            <div className="h-px w-8" style={{ background: "linear-gradient(90deg, transparent, rgba(255,215,0,0.5))" }} />
            <div className="flex items-center gap-2">
              <span style={{ fontSize: 12 }}>🏁</span>
              <span className="text-[10px] font-black uppercase tracking-[0.25em]"
                style={{ color: "rgba(255,215,0,0.55)" }}>פארק הירקון</span>
              <span style={{ fontSize: 12 }}>🏁</span>
            </div>
            <div className="h-px w-8" style={{ background: "linear-gradient(90deg, rgba(255,215,0,0.5), transparent)" }} />
          </div>

          {/* Stats strip */}
          <div className="flex items-center justify-center gap-5 mt-3">
            {[["8","תחנות"],["⚡","אנרגיה"],["1","זוכה"]].map(([val, label]) => (
              <div key={label} className="text-center">
                <div className="font-black text-base leading-none" style={{ color: "#FFD700", ...FONT }}>{val}</div>
                <div className="text-[9px] uppercase tracking-widest mt-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Login card ── */}
        <div className="w-full max-w-[340px]">
          <div className="rounded-2xl overflow-hidden" style={{
            background: "linear-gradient(160deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.03) 100%)",
            backdropFilter: "blur(16px)",
            border: "1px solid rgba(255,215,0,0.2)",
            boxShadow: "0 0 0 1px rgba(214,40,40,0.15), 0 24px 60px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.08)",
          }}>
            {/* Card top stripe — red+gold like the show */}
            <div className="h-0.75" style={{ background: "linear-gradient(90deg, #D62828 0%, #FF6B35 35%, #FFD700 65%, #D62828 100%)" }} />

            <div className="p-5">
              <div className="flex items-center justify-center gap-2 mb-4">
                <div className="h-px flex-1" style={{ background: "rgba(255,255,255,0.08)" }} />
                <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.25em]">
                  הכנסו לתחרות
                </p>
                <div className="h-px flex-1" style={{ background: "rgba(255,255,255,0.08)" }} />
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                {/* Name input */}
                <div className="relative">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="השם שלך"
                    autoComplete="given-name"
                    maxLength={30}
                    dir="rtl"
                    className="w-full rounded-xl px-4 py-3.5 text-center text-base font-bold text-white placeholder:text-white/25 focus:outline-none transition-all duration-200"
                    style={{
                      background: "rgba(255,255,255,0.06)",
                      border: "2px solid rgba(255,215,0,0.18)",
                      caretColor: "#FFD700",
                    }}
                    onFocus={(e) => e.currentTarget.style.borderColor = "rgba(255,215,0,0.6)"}
                    onBlur={(e) => e.currentTarget.style.borderColor = "rgba(255,215,0,0.18)"}
                  />
                </div>

                {/* Code input */}
                <div className="relative">
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
                      error ? "border-red-500/80" : "border-yellow-400/25",
                      shake ? "animate-shake" : "",
                    ].join(" ")}
                    style={{ background: error ? "rgba(220,38,38,0.1)" : "rgba(255,255,255,0.06)", caretColor: "#FFD700" }}
                    onFocus={(e) => { if (!error) e.currentTarget.style.borderColor = "rgba(255,215,0,0.7)"; }}
                    onBlur={(e) => { if (!error) e.currentTarget.style.borderColor = "rgba(255,215,0,0.25)"; }}
                  />
                </div>

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
                      : "rgba(255,255,255,0.06)",
                    color: ready ? "#1a0a00" : "rgba(255,255,255,0.2)",
                    border: ready ? "2px solid rgba(255,200,0,0.5)" : "2px solid rgba(255,255,255,0.08)",
                    boxShadow: ready ? "0 4px 24px rgba(232,160,0,0.55), 0 0 0 1px rgba(255,215,0,0.2), inset 0 1px 0 rgba(255,255,255,0.35)" : "none",
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
                      <span className={ready ? "animate-float" : ""} style={{ fontSize: "1.2em" }}>🏁</span>
                    </span>
                  )}
                  {ready && (
                    <div className="absolute inset-0 rounded-xl pointer-events-none"
                      style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.25) 0%, transparent 60%)" }} />
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Bottom hint */}
          <div className="flex items-center justify-center gap-2 mt-3">
            <div className="h-px flex-1" style={{ background: "rgba(255,255,255,0.06)" }} />
            <p className="text-[10px] text-white/25 px-2">הקוד מגיע ממנהל המירוץ</p>
            <div className="h-px flex-1" style={{ background: "rgba(255,255,255,0.06)" }} />
          </div>
        </div>

      </div>

      {/* ── Bottom racing bar ── */}
      <div className="shrink-0 relative z-10">
        <div className="h-0.5" style={{ background: "linear-gradient(90deg, transparent, rgba(255,215,0,0.2), transparent)" }} />
        <div className="h-0.75" style={{ background: "linear-gradient(90deg, #D62828 0%, #FF4444 20%, #FFD700 50%, #FF4444 80%, #D62828 100%)" }} />
      </div>

    </main>
  );
}
