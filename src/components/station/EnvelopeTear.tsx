"use client";
import { useEffect, useState } from "react";

interface Props {
  active: boolean;
  children: React.ReactNode;
}

export default function EnvelopeTear({ active, children }: Props) {
  const [phase, setPhase] = useState<"idle" | "tearing" | "done">("idle");

  useEffect(() => {
    if (active) setPhase("tearing");
  }, [active]);

  useEffect(() => {
    if (phase === "tearing") {
      const t = setTimeout(() => setPhase("done"), 900);
      return () => clearTimeout(t);
    }
  }, [phase]);

  if (phase === "done") {
    return <div className="station-reveal">{children}</div>;
  }

  const GOLD = "#E8A000";
  const DARK = "#0a1628";

  return (
    <div className="relative w-full h-full overflow-hidden" style={{ background: DARK }}>
      {phase === "tearing" && (
        <>
          {/* Top half tears upward */}
          <div
            className="envelope-top absolute inset-0 flex items-end justify-center"
            style={{
              background: `linear-gradient(180deg, #0d2044 0%, #1a3a6a 100%)`,
              border: `2px solid rgba(255,215,0,0.3)`,
            }}
          >
            <div className="mb-10 text-center">
              <span
                className="text-6xl block mb-2"
                style={{ filter: "drop-shadow(0 0 16px rgba(255,215,0,0.8))" }}
              >
                ✅
              </span>
              <p
                className="font-black text-2xl tracking-widest uppercase"
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
              </p>
            </div>
            {/* Tear edge — gold zigzag */}
            <svg
              className="absolute bottom-0 w-full"
              viewBox="0 0 400 24"
              preserveAspectRatio="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M0,0 L20,18 L40,3 L60,20 L80,5 L100,19 L120,3 L140,20 L160,5 L180,19 L200,3 L220,20 L240,5 L260,19 L280,3 L300,20 L320,5 L340,19 L360,3 L380,20 L400,5 L400,24 L0,24 Z"
                fill={DARK}
              />
              <path
                d="M0,0 L20,18 L40,3 L60,20 L80,5 L100,19 L120,3 L140,20 L160,5 L180,19 L200,3 L220,20 L240,5 L260,19 L280,3 L300,20 L320,5 L340,19 L360,3 L380,20 L400,5"
                fill="none"
                stroke={GOLD}
                strokeWidth="1.5"
                opacity="0.6"
              />
            </svg>
          </div>

          {/* Bottom half tears downward */}
          <div
            className="envelope-bottom absolute inset-0 flex items-start justify-center"
            style={{
              background: `linear-gradient(180deg, #1a3a6a 0%, #0d2044 100%)`,
              border: `2px solid rgba(255,215,0,0.3)`,
            }}
          >
            {/* Tear edge — gold zigzag */}
            <svg
              className="absolute top-0 w-full"
              viewBox="0 0 400 24"
              preserveAspectRatio="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M0,24 L20,6 L40,21 L60,4 L80,19 L100,5 L120,21 L140,4 L160,19 L180,5 L200,21 L220,4 L240,19 L260,5 L280,21 L300,4 L320,19 L340,5 L360,21 L380,4 L400,19 L400,0 L0,0 Z"
                fill={DARK}
              />
              <path
                d="M0,24 L20,6 L40,21 L60,4 L80,19 L100,5 L120,21 L140,4 L160,19 L180,5 L200,21 L220,4 L240,19 L260,5 L280,21 L300,4 L320,19 L340,5 L360,21 L380,4 L400,19"
                fill="none"
                stroke={GOLD}
                strokeWidth="1.5"
                opacity="0.6"
              />
            </svg>
            <div className="mt-10 text-center">
              <p
                className="font-black text-lg tracking-widest uppercase"
                style={{ color: "rgba(255,215,0,0.5)" }}
              >
                ממשיכים קדימה...
              </p>
            </div>
          </div>

          {/* Center flash glow */}
          <div
            className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-1"
            style={{
              background: `linear-gradient(90deg, transparent, ${GOLD}, transparent)`,
              boxShadow: `0 0 30px 8px rgba(232,160,0,0.4)`,
            }}
          />
        </>
      )}

      {phase === "idle" && (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center"
          style={{
            background: "linear-gradient(160deg,#0a1628,#0d2044)",
            border: "2px solid rgba(255,215,0,0.2)",
          }}
        >
          <span className="text-6xl mb-3" style={{ filter: "drop-shadow(0 0 12px rgba(255,215,0,0.5))" }}>
            ✉️
          </span>
          <p
            className="font-black text-xl tracking-widest uppercase"
            style={{
              fontFamily: "'Impact','Arial Black',sans-serif",
              color: "#FFD700",
              filter: "drop-shadow(0 2px 0 #7A4E00)",
            }}
          >
            מעטפה חדשה
          </p>
        </div>
      )}
    </div>
  );
}
