"use client";
import { LeaderboardEntry } from "@/types/supabase";
import { formatDuration } from "@/lib/game";

interface Props {
  entries: LeaderboardEntry[];
  highlightTeamId?: string;
}

const MEDALS = ["🥇", "🥈", "🥉"];

export default function Leaderboard({ entries, highlightTeamId }: Props) {
  return (
    <div className="w-full flex flex-col gap-2">
      <h2 className="text-xl font-extrabold text-charcoal uppercase tracking-wider text-center mb-2">
        לוח תוצאות סופי
      </h2>
      {entries.map((entry, i) => {
        const isMe = entry.team_id === highlightTeamId;
        return (
          <div
            key={entry.team_id}
            className={[
              "flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all",
              isMe
                ? "bg-mustard border-charcoal shadow-[3px_3px_0px_#1A1A1A] scale-105"
                : "bg-white border-charcoal/30",
            ].join(" ")}
          >
            <span className="text-2xl w-8 text-center">
              {i < 3 ? MEDALS[i] : `${i + 1}.`}
            </span>
            <div className="flex-1 min-w-0">
              <p className={`font-extrabold truncate ${isMe ? "text-charcoal" : "text-charcoal"}`}>
                {entry.team_name}
                {isMe && <span className="text-xs mr-2 font-normal">(הקבוצה שלכם)</span>}
              </p>
              {entry.total_penalties_minutes > 0 && (
                <p className="text-xs text-race-red">
                  +{entry.total_penalties_minutes} דק&apos; עונש
                </p>
              )}
            </div>
            <span className="font-mono font-bold text-sm whitespace-nowrap">
              {entry.finished_at ? formatDuration(entry.final_score_seconds) : "—"}
            </span>
          </div>
        );
      })}
    </div>
  );
}
