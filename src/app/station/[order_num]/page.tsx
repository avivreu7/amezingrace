"use client";
import { useEffect, useState, use, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { TEAM_SESSION_KEY, TOTAL_STATIONS, calcElapsedSeconds, formatDuration } from "@/lib/game";
import { Team, Station } from "@/types/supabase";
import EnvelopeTear from "@/components/station/EnvelopeTear";

const TYPE_LABELS: Record<string, { label: string; color: string }> = {
  route:     { label: "מסלול",  color: "#FFD700" },
  detour:    { label: "סיבוב",  color: "#FF6B35" },
  roadblock: { label: "מחסום", color: "#D62828" },
  qr:        { label: "סריקה", color: "#4a9ade" },
};

const TYPE_EMOJIS: Record<string, { emoji: string; top: number; left: number; delay: number; dur: number }[]> = {
  route:     [
    { emoji: "🗺️", top: 78, left: 8,  delay: 0,  dur: 28 },
    { emoji: "📍", top: 85, left: 80, delay: 6,  dur: 24 },
    { emoji: "🔍", top: 72, left: 50, delay: 11, dur: 32 },
    { emoji: "🧭", top: 82, left: 25, delay: 3,  dur: 26 },
  ],
  detour:    [
    { emoji: "🔀", top: 80, left: 10, delay: 0,  dur: 26 },
    { emoji: "🏃‍♂️",top: 75, left: 82, delay: 5,  dur: 30 },
    { emoji: "⚡", top: 88, left: 55, delay: 9,  dur: 22 },
    { emoji: "🎭", top: 70, left: 35, delay: 14, dur: 28 },
  ],
  roadblock: [
    { emoji: "🚧", top: 78, left: 12, delay: 0,  dur: 28 },
    { emoji: "💪", top: 85, left: 78, delay: 7,  dur: 24 },
    { emoji: "🧩", top: 72, left: 45, delay: 12, dur: 30 },
    { emoji: "🔐", top: 82, left: 62, delay: 4,  dur: 26 },
  ],
  qr:        [
    { emoji: "📷", top: 80, left: 8,  delay: 0,  dur: 26 },
    { emoji: "📡", top: 75, left: 85, delay: 6,  dur: 30 },
    { emoji: "🔍", top: 88, left: 50, delay: 10, dur: 24 },
    { emoji: "✅", top: 70, left: 30, delay: 3,  dur: 28 },
  ],
};

export default function StationPage({ params }: { params: Promise<{ order_num: string }> }) {
  const { order_num } = use(params);
  const orderNum = parseInt(order_num, 10);
  const router = useRouter();

  const [team, setTeam]       = useState<Team | null>(null);
  const [station, setStation] = useState<Station | null>(null);
  const [loading, setLoading] = useState(true);
  const [tearing, setTearing] = useState(false);
  const [error, setError]     = useState("");
  const [redFlash, setRedFlash] = useState(false);

  const [answer, setAnswer]         = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [shake, setShake]           = useState(false);
  const [wrongMsg, setWrongMsg]     = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (!team?.started_at) return;
    setElapsed(calcElapsedSeconds(team.started_at));
    const id = setInterval(() => setElapsed(calcElapsedSeconds(team.started_at!)), 1000);
    return () => clearInterval(id);
  }, [team?.started_at]);

  useEffect(() => {
    const raw = localStorage.getItem(TEAM_SESSION_KEY);
    if (!raw) { router.replace("/"); return; }
    const cached: Team = JSON.parse(raw);

    const supabase = createClient();
    supabase.from("teams").select("*").eq("id", cached.id).single().then(({ data: fresh }) => {
      const t = fresh ?? cached;
      if (fresh) localStorage.setItem(TEAM_SESSION_KEY, JSON.stringify(fresh));
      if (!t.started_at) { router.replace(t.unlocked_at ? "/instructions" : "/waiting"); return; }
      setTeam(t);
      loadStation(t);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderNum]);

  async function loadStation(t: Team) {
    setLoading(true);
    const supabase = createClient();

    const { data: st, error: stErr } = await supabase
      .from("stations")
      .select("id, order_num, type, title, content, hint, created_at")
      .eq("order_num", orderNum)
      .single();

    if (stErr || !st) { setError("תחנה לא נמצאה."); setLoading(false); return; }
    setStation(st);

    const { data: prog } = await supabase
      .from("team_progress")
      .select("*")
      .eq("team_id", t.id)
      .eq("station_id", st.id)
      .single();

    if (!prog) {
      await supabase.from("team_progress").insert({ team_id: t.id, station_id: st.id, status: "active" });
    } else if (prog.status === "completed") {
      const next = orderNum + 1;
      router.replace(next > TOTAL_STATIONS ? "/final-mission" : `/station/${next}`);
      return;
    }

    setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!answer.trim() || submitting || !team || !station) return;
    setSubmitting(true);
    setWrongMsg("");

    const res = await fetch("/api/verify-solution", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ team_id: team.id, station_id: station.id, answer }),
    });
    const { correct } = await res.json();

    if (correct) {
      setTearing(true);
      setTimeout(() => {
        const next = orderNum + 1;
        router.push(next > TOTAL_STATIONS ? "/final-mission" : `/station/${next}`);
      }, 950);
    } else {
      setShake(true);
      setWrongMsg("לא נכון — נסו שוב!");
      setAnswer("");
      setRedFlash(true);
      setTimeout(() => { setShake(false); setRedFlash(false); inputRef.current?.focus(); }, 450);
    }
    setSubmitting(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-dvh" style={{ background: "linear-gradient(160deg,#0a1628,#0d2044)" }}>
        <div className="text-center">
          <div className="text-6xl mb-4 animate-zoom-pulse">✉️</div>
          <p className="font-bold text-lg" style={{ color: "#FFD700" }}>טוען תחנה...</p>
        </div>
      </div>
    );
  }

  if (error || !station) {
    return (
      <div className="flex items-center justify-center h-dvh px-6" style={{ background: "#0a1628" }}>
        <p className="font-bold text-center text-xl text-red-400">{error || "שגיאה"}</p>
      </div>
    );
  }

  const typeInfo = TYPE_LABELS[station.type] ?? { label: station.type, color: "#FFD700" };
  const totalDisplay = elapsed + (team?.total_penalties_minutes ?? 0) * 60;
  const bgEmojis = TYPE_EMOJIS[station.type] ?? TYPE_EMOJIS.route;

  return (
    <div
      className="relative h-dvh flex flex-col overflow-hidden"
      style={{ background: "linear-gradient(160deg, #0a1628 0%, #0d2044 50%, #0a1628 100%)" }}
    >
      {/* Red flash overlay on wrong answer */}
      {redFlash && (
        <div className="absolute inset-0 z-50 pointer-events-none animate-red-flash"
          style={{ background: "rgba(214,40,40,0.18)" }} />
      )}

      {/* Floating type-specific bg emojis */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        {bgEmojis.map((e, i) => (
          <div key={i} className="absolute text-2xl animate-drift-up select-none"
            style={{ top: `${e.top}%`, left: `${e.left}%`, opacity: 0.11, animationDuration: `${e.dur}s`, animationDelay: `${e.delay}s` }}
          >{e.emoji}</div>
        ))}
      </div>

      {/* Envelope tear overlay */}
      {tearing && (
        <div className="absolute inset-0 z-50">
          <EnvelopeTear active={tearing}><div /></EnvelopeTear>
        </div>
      )}

      {/* ── Top accent ── */}
      <div className="h-1 shrink-0 relative z-10" style={{ background: "linear-gradient(90deg,#D62828,#FFD700,#D62828)" }} />

      {/* ── Header bar ── */}
      <header className="shrink-0 px-4 py-3 flex items-center justify-between relative z-10"
        style={{ background: "rgba(0,0,0,0.4)", borderBottom: "1px solid rgba(255,215,0,0.15)" }}
      >
        <div className="flex items-center gap-2">
          <span
            className="text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider"
            style={{ background: typeInfo.color + "22", color: typeInfo.color, border: `1px solid ${typeInfo.color}55` }}
          >
            {typeInfo.label}
          </span>
          <span className="text-white/40 text-xs font-bold">תחנה {orderNum}</span>
        </div>

        {/* Live timer */}
        <div
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full font-mono font-black text-sm"
          style={{ background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,215,0,0.35)", color: "#FFD700" }}
        >
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse-badge shrink-0" />
          <span>⏱</span>
          {formatDuration(totalDisplay)}
          {(team?.total_penalties_minutes ?? 0) > 0 && (
            <span className="text-red-400 text-[10px]">+{team?.total_penalties_minutes}′</span>
          )}
        </div>
      </header>

      {/* ── Scrollable content ── */}
      <div className="flex-1 overflow-y-auto px-4 pb-2 flex flex-col gap-4 relative z-10">

        {/* Station title */}
        <div className="animate-slide-up pt-2">
          <h1
            className="font-black leading-tight"
            style={{
              fontFamily: "'Impact','Arial Black',sans-serif",
              fontSize: "clamp(1.8rem,8vw,2.8rem)",
              background: "linear-gradient(180deg,#FFE566 0%,#FFB800 55%,#CC8800 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              filter: "drop-shadow(0 2px 0 #7A4E00)",
            }}
          >
            {station.title}
          </h1>
        </div>

        {/* Riddle card — classified document */}
        <div
          className="relative rounded-2xl overflow-hidden animate-slide-up scan-lines"
          style={{
            animationDelay: "0.07s",
            background: "linear-gradient(135deg, rgba(255,215,0,0.08) 0%, rgba(255,255,255,0.03) 100%)",
            border: "1px solid rgba(255,215,0,0.3)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.5), 0 0 60px rgba(255,215,0,0.06), inset 0 1px 0 rgba(255,255,255,0.1)",
          }}
        >
          {/* Scan line sweep */}
          <div className="scan-sweep" />

          {/* Corner fold */}
          <div className="absolute top-0 right-0 w-12 h-12 overflow-hidden pointer-events-none">
            <div className="absolute top-0 right-0 w-0 h-0"
              style={{ borderTop: "48px solid rgba(255,215,0,0.18)", borderLeft: "48px solid transparent" }} />
          </div>

          <div className="p-5">
            {/* Top label */}
            <div className="flex items-center gap-2 mb-4">
              <span className="text-base animate-glow-gold">✉️</span>
              <span className="text-[10px] font-black uppercase tracking-[0.25em]" style={{ color: "#FFD700" }}>
                המשימה שלכם
              </span>
              <div className="flex-1 h-px" style={{ background: "linear-gradient(90deg, rgba(255,215,0,0.3), transparent)" }} />
              <span className="text-[9px] font-mono font-bold opacity-25">#{String(orderNum).padStart(2,"0")}</span>
            </div>

            <p className="text-white text-base font-semibold leading-relaxed whitespace-pre-wrap">
              {station.content}
            </p>

            <div className="mt-4 flex items-center gap-2">
              <div className="flex-1 h-px" style={{ background: "linear-gradient(90deg, rgba(255,215,0,0.2), transparent)" }} />
              <span className="text-[9px] font-mono opacity-20 uppercase tracking-widest">classified</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── QR station indicator ── */}
      {station.type === "qr" && (
        <div
          className="shrink-0 px-4 pt-3 pb-5 text-center animate-slide-up relative z-10"
          style={{ animationDelay: "0.18s", background: "linear-gradient(to top, rgba(10,22,40,0.98) 80%, transparent)" }}
        >
          <div className="rounded-2xl py-5 px-4" style={{ background: "rgba(74,154,222,0.1)", border: "1px solid rgba(74,154,222,0.3)" }}>
            <div className="text-4xl mb-2 animate-zoom-pulse">📷</div>
            <p className="font-bold text-white text-sm">לאחר החציה — סרקו את קוד ה-QR</p>
            <p className="text-white/40 text-xs mt-1">הקוד ממתין לכם בצד השני</p>
          </div>
        </div>
      )}

      {/* ── Answer input ── */}
      {station.type !== "qr" && (
        <div
          className="shrink-0 px-4 pt-3 pb-5 animate-slide-up relative z-10"
          style={{ animationDelay: "0.18s", background: "linear-gradient(to top, rgba(10,22,40,0.98) 80%, transparent)" }}
        >
          {wrongMsg && (
            <p className="text-center text-xs font-bold text-red-400 mb-2">{wrongMsg}</p>
          )}
          <form onSubmit={handleSubmit} className="flex flex-col gap-2.5">
            <input
              ref={inputRef}
              type="text"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="הכנס תשובה..."
              autoComplete="off"
              className={["w-full rounded-xl px-4 py-3.5 text-lg font-bold text-white text-center",
                "focus:outline-none transition-all duration-200",
                shake ? "animate-shake" : "",
              ].join(" ")}
              style={{
                background: "rgba(255,255,255,0.07)",
                border: wrongMsg ? "2px solid rgba(214,40,40,0.7)" : "2px solid rgba(255,215,0,0.25)",
                caretColor: "#FFD700",
              }}
            />
            <button
              type="submit"
              disabled={submitting || !answer.trim()}
              className={`relative btn-shimmer w-full rounded-xl py-4 font-black text-lg overflow-hidden transition-all duration-200 ${answer.trim() && !submitting ? "animate-bounce-gentle" : ""}`}
              style={{
                background: answer.trim() && !submitting
                  ? "linear-gradient(180deg,#FFD700 0%,#E8A000 50%,#C47800 100%)"
                  : "rgba(255,255,255,0.06)",
                color: answer.trim() && !submitting ? "#1a0a00" : "rgba(255,255,255,0.2)",
                border: answer.trim() ? "2px solid rgba(255,200,0,0.4)" : "2px solid rgba(255,255,255,0.08)",
                boxShadow: answer.trim() && !submitting ? "0 4px 24px rgba(232,160,0,0.5)" : "none",
                cursor: answer.trim() && !submitting ? "pointer" : "not-allowed",
              }}
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="inline-block w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  בודק...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  ✓ שלח תשובה
                  {answer.trim() && !submitting && (
                    <div className="absolute inset-0 bg-linear-to-b from-white/20 to-transparent pointer-events-none rounded-xl" />
                  )}
                </span>
              )}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
