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

export default function StationPage({ params }: { params: Promise<{ order_num: string }> }) {
  const { order_num } = use(params);
  const orderNum = parseInt(order_num, 10);
  const router = useRouter();

  const [team, setTeam]       = useState<Team | null>(null);
  const [station, setStation] = useState<Station | null>(null);
  const [loading, setLoading] = useState(true);
  const [tearing, setTearing] = useState(false);
  const [error, setError]     = useState("");

  // Answer input state
  const [answer, setAnswer]     = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [shake, setShake]       = useState(false);
  const [wrongMsg, setWrongMsg] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Live timer
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
    const t: Team = JSON.parse(raw);
    if (!t.started_at) { router.replace(t.unlocked_at ? "/instructions" : "/waiting"); return; }
    setTeam(t);
    loadStation(t);
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
      await supabase
        .from("team_progress")
        .insert({ team_id: t.id, station_id: st.id, status: "active" });
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
      setTimeout(() => { setShake(false); inputRef.current?.focus(); }, 450);
    }
    setSubmitting(false);
  }

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-dvh" style={{ background: "linear-gradient(160deg,#0a1628,#0d2044)" }}>
        <div className="text-center">
          <div className="text-6xl mb-4 animate-pulse-badge">✉️</div>
          <p className="font-bold text-lg" style={{ color: "#FFD700" }}>טוען תחנה...</p>
        </div>
      </div>
    );
  }

  if (error || !station) {
    return (
      <div className="flex items-center justify-center min-h-dvh px-6" style={{ background: "#0a1628" }}>
        <p className="font-bold text-center text-xl text-red-400">{error || "שגיאה"}</p>
      </div>
    );
  }

  const typeInfo = TYPE_LABELS[station.type] ?? { label: station.type, color: "#FFD700" };
  const totalDisplay = elapsed + (team?.total_penalties_minutes ?? 0) * 60;

  return (
    <div
      className="relative min-h-dvh flex flex-col overflow-hidden"
      style={{ background: "linear-gradient(160deg, #0a1628 0%, #0d2044 50%, #0a1628 100%)" }}
    >
      {/* Envelope tear overlay */}
      {tearing && (
        <div className="absolute inset-0 z-50">
          <EnvelopeTear active={tearing}><div /></EnvelopeTear>
        </div>
      )}

      {/* ── Top accent ── */}
      <div className="h-1 shrink-0" style={{ background: "linear-gradient(90deg,#D62828,#FFD700,#D62828)" }} />

      {/* ── Header bar ── */}
      <header className="shrink-0 px-4 py-3 flex items-center justify-between" style={{ background: "rgba(0,0,0,0.35)", borderBottom: "1px solid rgba(255,215,0,0.15)" }}>
        <div className="flex items-center gap-2">
          {/* Type badge */}
          <span
            className="text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider"
            style={{ background: typeInfo.color + "22", color: typeInfo.color, border: `1px solid ${typeInfo.color}55` }}
          >
            {typeInfo.label}
          </span>
          {/* Station counter */}
          <span className="text-white/40 text-xs font-bold">
            תחנה {orderNum}
          </span>
        </div>

        {/* Timer */}
        <div
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full font-mono font-black text-sm"
          style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,215,0,0.3)", color: "#FFD700" }}
        >
          <span className="animate-pulse-badge text-[10px]">⏱</span>
          {formatDuration(totalDisplay)}
          {(team?.total_penalties_minutes ?? 0) > 0 && (
            <span className="text-red-400 text-[10px]">+{team?.total_penalties_minutes}′</span>
          )}
        </div>
      </header>

      {/* ── Scrollable content ── */}
      <div className="flex-1 overflow-y-auto px-4 pb-2 flex flex-col gap-4">

        {/* Station title */}
        <div className="animate-slide-up">
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

        {/* Riddle card */}
        <div
          className="rounded-2xl p-5 animate-slide-up"
          style={{
            animationDelay: "0.07s",
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,215,0,0.2)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.07)",
          }}
        >
          {/* Decorative top label */}
          <div className="flex items-center gap-2 mb-3">
            <span className="text-base">✉️</span>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: "#FFD700" }}>
              המשימה שלכם
            </span>
            <div className="flex-1 h-px" style={{ background: "rgba(255,215,0,0.2)" }} />
          </div>
          <p className="text-white text-base font-semibold leading-relaxed whitespace-pre-wrap">
            {station.content}
          </p>
        </div>

      </div>

      {/* ── QR station — waiting indicator ── */}
      {station.type === "qr" && (
        <div
          className="shrink-0 px-4 pt-3 pb-5 text-center animate-slide-up"
          style={{ animationDelay: "0.18s", background: "linear-gradient(to top, rgba(10,22,40,0.98) 80%, transparent)" }}
        >
          <div className="rounded-2xl py-5 px-4" style={{ background: "rgba(74,154,222,0.1)", border: "1px solid rgba(74,154,222,0.3)" }}>
            <div className="text-4xl mb-2 animate-pulse-badge">📷</div>
            <p className="font-bold text-white text-sm">לאחר החציה — סרקו את קוד ה-QR</p>
            <p className="text-white/40 text-xs mt-1">הקוד ממתין לכם בצד השני</p>
          </div>
        </div>
      )}

      {/* ── Answer input — pinned bottom (hidden for QR stations) ── */}
      {station.type !== "qr" && <div
        className="shrink-0 px-4 pt-3 pb-5 animate-slide-up"
        style={{
          animationDelay: "0.18s",
          background: "linear-gradient(to top, rgba(10,22,40,0.98) 80%, transparent)",
        }}
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
            className="relative w-full rounded-xl py-4 font-black text-lg overflow-hidden transition-all duration-150"
            style={{
              background: answer.trim() && !submitting
                ? "linear-gradient(180deg,#FFD700 0%,#E8A000 50%,#C47800 100%)"
                : "rgba(255,255,255,0.06)",
              color: answer.trim() && !submitting ? "#1a0a00" : "rgba(255,255,255,0.2)",
              border: answer.trim() ? "2px solid rgba(255,200,0,0.4)" : "2px solid rgba(255,255,255,0.08)",
              boxShadow: answer.trim() && !submitting ? "0 4px 20px rgba(232,160,0,0.45)" : "none",
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
      </div>}
    </div>
  );
}
