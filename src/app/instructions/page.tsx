"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { TEAM_SESSION_KEY } from "@/lib/game";
import { createClient } from "@/lib/supabase/client";
import { Team } from "@/types/supabase";

const RULES = [
  {
    num: "01",
    icon: "👥",
    title: "קבוצה ביחד",
    text: "על הקבוצה תמיד להיות ביחד — אין להשאיר חברי צוות מאחור בשום שלב.",
    color: "#FFD700",
  },
  {
    num: "02",
    icon: "🌉",
    title: "חציית כבישים",
    text: "חציית כבישים לאורך כל התחרות דרך הגשרים בלבד — אין לחצות כביש ישירות.",
    color: "#FF6B35",
  },
  {
    num: "03",
    icon: "🚫",
    title: "אין כניסה למים",
    text: "אין להיכנס למים כלל — נהרות, אגמים ובריכות הם מחוץ לתחום.",
    color: "#4a9ade",
  },
  {
    num: "04",
    icon: "💧",
    title: "שתייה מרובה",
    text: "להקפיד על שתייה מרובה לאורך כל התחרות — הבריאות שלכם קודמת לכל.",
    color: "#4adebd",
  },
  {
    num: "05",
    icon: "📞",
    title: "בעיה? מתקשרים",
    text: "בכל מקרה של בעיה יש להתקשר במיידית למארגנים — אנחנו זמינים לכם.",
    color: "#D62828",
  },
];

export default function InstructionsPage() {
  const router = useRouter();
  const [team, setTeam] = useState<Team | null>(null);
  const [agreed, setAgreed] = useState(false);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem(TEAM_SESSION_KEY);
    if (!raw) { router.replace("/"); return; }
    const t: Team = JSON.parse(raw);
    setTeam(t);
    if (!t.unlocked_at) { router.replace("/waiting"); return; }
    // If timer already running (page refresh), go straight to station 1
    if (t.started_at) { router.replace("/station/1"); return; }
  }, [router]);

  async function handleStart() {
    if (!team || starting) return;
    setStarting(true);
    const now = new Date().toISOString();
    const supabase = createClient();
    await supabase.from("teams").update({ started_at: now }).eq("id", team.id).is("started_at", null);
    const updated = { ...team, started_at: now };
    localStorage.setItem(TEAM_SESSION_KEY, JSON.stringify(updated));
    router.push("/station/1");
  }

  return (
    <main
      className="flex flex-col min-h-dvh"
      style={{ background: "linear-gradient(160deg, #0a1628 0%, #0d2044 50%, #0a1628 100%)" }}
    >
      {/* Top accent line */}
      <div className="h-1 w-full shrink-0" style={{ background: "linear-gradient(90deg, #D62828, #FFD700, #D62828)" }} />

      {/* ── Header ── */}
      <div className="shrink-0 px-5 pt-6 pb-5">
        {/* Team badge */}
        <div className="flex items-center gap-2 mb-4">
          <div className="h-px flex-1 bg-yellow-400/20" />
          <span className="text-[11px] font-bold text-yellow-400/60 uppercase tracking-[0.2em]">
            {team?.name ?? ""}
          </span>
          <div className="h-px flex-1 bg-yellow-400/20" />
        </div>

        {/* Title */}
        <div className="text-center">
          <p className="text-yellow-400/70 text-xs font-bold uppercase tracking-[0.25em] mb-1">לפני שמתחילים</p>
          <h1
            className="font-black leading-tight"
            style={{
              fontFamily: "'Impact','Arial Black',sans-serif",
              fontSize: "clamp(2.2rem,10vw,3.5rem)",
              background: "linear-gradient(180deg, #FFE566 0%, #FFB800 50%, #CC8800 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              filter: "drop-shadow(0 2px 0px #7A4E00) drop-shadow(0 4px 10px #00000060)",
            }}
          >
            כללי בטיחות
          </h1>
          <p className="text-white/40 text-sm mt-2">
            קרא/י בעיון — יש לאשר לפני תחילת המירוץ
          </p>
        </div>
      </div>

      {/* ── Rules list ── */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 flex flex-col gap-3">
        {RULES.map((rule, i) => (
          <div
            key={i}
            className="relative rounded-2xl overflow-hidden animate-slide-up"
            style={{
              animationDelay: `${i * 0.07}s`,
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              boxShadow: `0 4px 20px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.06)`,
            }}
          >
            {/* Color accent bar on right (RTL) */}
            <div
              className="absolute top-0 right-0 w-1 h-full rounded-r-2xl"
              style={{ background: rule.color }}
            />

            <div className="flex items-start gap-4 px-5 py-4 pr-6">
              {/* Number */}
              <div className="shrink-0 flex flex-col items-center gap-1">
                <span
                  className="text-2xl leading-none"
                >
                  {rule.icon}
                </span>
                <span
                  className="text-[10px] font-black"
                  style={{ color: rule.color, fontFamily: "monospace" }}
                >
                  {rule.num}
                </span>
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <p
                  className="font-black text-sm mb-0.5 uppercase tracking-wide"
                  style={{ color: rule.color }}
                >
                  {rule.title}
                </p>
                <p className="text-white/70 text-sm leading-relaxed">
                  {rule.text}
                </p>
              </div>
            </div>
          </div>
        ))}

        {/* ── Consent ── */}
        <button
          onClick={() => setAgreed((a) => !a)}
          className="flex items-start gap-3 mt-2 text-right w-full animate-slide-up"
          style={{ animationDelay: "0.4s" }}
        >
          <div
            className="shrink-0 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all duration-200 mt-0.5"
            style={{
              borderColor: agreed ? "#FFD700" : "rgba(255,255,255,0.3)",
              background: agreed ? "#FFD700" : "transparent",
              boxShadow: agreed ? "0 0 12px #FFD70060" : "none",
            }}
          >
            {agreed && (
              <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
                <path d="M1 5L4.5 8.5L11 1" stroke="#1a0a00" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </div>
          <p className="text-white/60 text-sm leading-relaxed text-right">
            קראתי את כללי הבטיחות ואני מתחייב/ת לפעול לפיהם לאורך כל המירוץ.
          </p>
        </button>
      </div>

      {/* ── CTA Button ── */}
      <div
        className="shrink-0 px-4 py-4"
        style={{
          background: "linear-gradient(to top, rgba(10,22,40,1) 60%, transparent)",
        }}
      >
        <button
          disabled={!agreed || starting}
          onClick={handleStart}
          className="relative w-full rounded-2xl py-4 font-black text-xl transition-all duration-200 overflow-hidden"
          style={{
            background: agreed
              ? "linear-gradient(180deg, #FFD700 0%, #E8A000 50%, #C47800 100%)"
              : "rgba(255,255,255,0.06)",
            color: agreed ? "#1a0a00" : "rgba(255,255,255,0.2)",
            border: agreed ? "2px solid rgba(255,200,0,0.4)" : "2px solid rgba(255,255,255,0.08)",
            boxShadow: agreed ? "0 4px 30px rgba(232,160,0,0.5), inset 0 1px 0 rgba(255,255,255,0.3)" : "none",
            transform: agreed ? "none" : "none",
            cursor: agreed ? "pointer" : "not-allowed",
          }}
        >
          {agreed && !starting ? (
            <>
              <span>יאללה — מתחילים! 🏁</span>
              {/* Shine */}
              <div className="absolute inset-0 bg-linear-to-b from-white/20 to-transparent pointer-events-none rounded-2xl" />
            </>
          ) : starting ? (
            <span className="flex items-center justify-center gap-2">
              <span className="inline-block w-5 h-5 border-2 border-[#1a0a00] border-t-transparent rounded-full animate-spin" />
              מתחילים...
            </span>
          ) : (
            <span>יש לאשר את הכללים תחילה</span>
          )}
        </button>
      </div>
    </main>
  );
}
