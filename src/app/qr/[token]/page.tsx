"use client";
import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { TEAM_SESSION_KEY, TOTAL_STATIONS, QR_TOKENS, FINISH_LINE_TOKEN } from "@/lib/game";
import { Team } from "@/types/supabase";

export default function QRPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "finish" | "error">("loading");
  const [msg, setMsg] = useState("");
  const [nextNum, setNextNum] = useState<number | null>(null);

  useEffect(() => {
    async function confirm() {
      const upperToken = token.toUpperCase();

      // ── Finish line QR (physical pit stop) ──
      if (upperToken === FINISH_LINE_TOKEN) {
        const raw = localStorage.getItem(TEAM_SESSION_KEY);
        if (!raw) { setMsg("לא נמצאה קבוצה — חזרו לדף הכניסה."); setStatus("error"); return; }
        const team: Team = JSON.parse(raw);
        const supabase = createClient();
        await supabase.from("teams").update({ finished_at: new Date().toISOString() }).eq("id", team.id).is("finished_at", null);
        setStatus("finish");
        setTimeout(() => router.push("/finish"), 2200);
        return;
      }

      // 1. Validate station token
      const stationOrderNum = QR_TOKENS[upperToken];
      if (!stationOrderNum) {
        setMsg("קוד QR לא תקין.");
        setStatus("error");
        return;
      }

      // 2. Get team from localStorage
      const raw = localStorage.getItem(TEAM_SESSION_KEY);
      if (!raw) {
        setMsg("לא נמצאה קבוצה — חזרו לדף הכניסה.");
        setStatus("error");
        return;
      }
      const team: Team = JSON.parse(raw);

      // 3. Get the station id for this order_num
      const supabase = createClient();
      const { data: station } = await supabase
        .from("stations")
        .select("id")
        .eq("order_num", stationOrderNum)
        .single();

      if (!station) {
        setMsg("תחנה לא נמצאה.");
        setStatus("error");
        return;
      }

      // 4. Mark station as completed
      await supabase
        .from("team_progress")
        .upsert(
          { team_id: team.id, station_id: station.id, status: "completed", completed_at: new Date().toISOString() },
          { onConflict: "team_id,station_id" }
        );

      const next = stationOrderNum + 1;
      setNextNum(next);
      setStatus("success");

      // 5. Navigate
      setTimeout(() => {
        router.push(next > TOTAL_STATIONS ? "/final-mission" : `/station/${next}`);
      }, 2000);
    }

    confirm();
  }, [token, router]);

  return (
    <div
      className="flex flex-col items-center justify-center min-h-dvh px-6 text-center relative overflow-hidden"
      style={{ background: "linear-gradient(160deg,#0a1628 0%,#0d2044 50%,#0a1628 100%)" }}
    >
      {/* Top accent */}
      <div className="absolute top-0 inset-x-0 h-1" style={{ background: "linear-gradient(90deg,#D62828,#FFD700,#D62828)" }} />

      {/* Loading */}
      {status === "loading" && (
        <div className="flex flex-col items-center gap-5 animate-slide-up">
          <div
            className="w-24 h-24 rounded-full flex items-center justify-center"
            style={{
              background: "radial-gradient(circle,rgba(255,215,0,0.1),transparent 70%)",
              border: "2px solid rgba(255,215,0,0.2)",
              animation: "radarPulse 1.8s ease-in-out infinite",
            }}
          >
            <span className="text-5xl animate-pulse-badge">📡</span>
          </div>
          <div>
            <p className="font-black text-xl" style={{ color: "#FFD700" }}>מאמת סריקה...</p>
            <p className="text-white/40 text-sm mt-1">אנא המתינו</p>
          </div>
        </div>
      )}

      {/* Station success */}
      {status === "success" && (
        <div className="flex flex-col items-center gap-5 animate-slide-up">
          {/* Flash ring */}
          <div className="relative flex items-center justify-center">
            <div
              className="absolute rounded-full"
              style={{
                width: 140, height: 140,
                background: "radial-gradient(circle,rgba(74,222,128,0.2),transparent 70%)",
                animation: "successFlash 0.5s ease-out both",
              }}
            />
            <div
              className="w-28 h-28 rounded-full flex items-center justify-center"
              style={{
                background: "rgba(34,197,94,0.1)",
                border: "2px solid rgba(34,197,94,0.4)",
                boxShadow: "0 0 40px rgba(34,197,94,0.25)",
              }}
            >
              <span className="text-6xl" style={{ animation: "revealStation 0.4s ease-out both" }}>✅</span>
            </div>
          </div>

          <div>
            <h2
              className="font-black text-3xl mb-1"
              style={{
                fontFamily: "'Impact','Arial Black',sans-serif",
                background: "linear-gradient(180deg,#FFE566,#FFB800)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                filter: "drop-shadow(0 2px 0 #7A4E00)",
              }}
            >
              עברתם!
            </h2>
            <p className="text-white/50 text-base">
              {nextNum && nextNum <= TOTAL_STATIONS
                ? `ממשיכים לתחנה ${nextNum}...`
                : "ממשיכים למשימה הסופית..."}
            </p>
          </div>

          {/* Progress dots */}
          <div className="flex gap-1.5 mt-2">
            {[0,1,2].map((i) => (
              <div
                key={i}
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: "#4ade80", animation: `pulse-badge 1s ease-in-out ${i * 0.2}s infinite` }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Finish line success */}
      {status === "finish" && (
        <div className="flex flex-col items-center gap-5 animate-slide-up">
          <div className="relative flex items-center justify-center">
            <div
              className="absolute rounded-full"
              style={{
                width: 160, height: 160,
                background: "radial-gradient(circle,rgba(255,215,0,0.2),transparent 70%)",
                animation: "successFlash 0.5s ease-out both",
              }}
            />
            <div
              className="w-32 h-32 rounded-full flex items-center justify-center"
              style={{
                background: "rgba(255,215,0,0.1)",
                border: "2px solid rgba(255,215,0,0.4)",
                boxShadow: "0 0 60px rgba(255,215,0,0.3)",
              }}
            >
              <span className="text-7xl" style={{ filter: "drop-shadow(0 0 12px rgba(255,215,0,0.8))" }}>🏆</span>
            </div>
          </div>

          <div>
            <h2
              className="font-black text-3xl mb-2"
              style={{
                fontFamily: "'Impact','Arial Black',sans-serif",
                background: "linear-gradient(180deg,#FFE566,#FFB800)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                filter: "drop-shadow(0 2px 0 #7A4E00)",
              }}
            >
              הגעתם לסיום!
            </h2>
            <p className="text-white/50 text-base">השעון עצר — עוברים לתוצאות...</p>
          </div>
        </div>
      )}

      {/* Error */}
      {status === "error" && (
        <div className="flex flex-col items-center gap-5 animate-slide-up">
          <div
            className="w-28 h-28 rounded-full flex items-center justify-center"
            style={{
              background: "rgba(214,40,40,0.1)",
              border: "2px solid rgba(214,40,40,0.3)",
            }}
          >
            <span className="text-6xl">❌</span>
          </div>
          <div>
            <p className="font-black text-xl text-white mb-1">שגיאה</p>
            <p className="font-bold text-base" style={{ color: "#ff6b6b" }}>{msg}</p>
          </div>
          <button
            onClick={() => router.push("/")}
            className="mt-2 px-8 py-3 rounded-2xl font-bold text-sm"
            style={{
              background: "rgba(255,255,255,0.07)",
              color: "rgba(255,255,255,0.6)",
              border: "1px solid rgba(255,255,255,0.15)",
            }}
          >
            חזרה לדף הבית
          </button>
        </div>
      )}

      {/* Inline keyframes */}
      <style>{`
        @keyframes radarPulse {
          0%,100% { opacity:0.8; transform:scale(0.97); }
          50%      { opacity:0.4; transform:scale(1.03); }
        }
        @keyframes successFlash {
          0%   { opacity:0; transform:scale(0.5); }
          60%  { opacity:1; transform:scale(1.1); }
          100% { opacity:1; transform:scale(1); }
        }
      `}</style>
    </div>
  );
}
