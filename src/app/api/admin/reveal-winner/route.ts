import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { calcFinalScore } from "@/lib/game";
import { LeaderboardEntry } from "@/types/supabase";

export async function POST(req: NextRequest) {
  const { admin_password } = await req.json();

  if (admin_password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();

  const { data: teams } = await supabase
    .from("teams")
    .select("id, name, started_at, finished_at, total_penalties_minutes")
    .not("started_at", "is", null);

  if (!teams) {
    return NextResponse.json({ error: "No teams found" }, { status: 404 });
  }

  const entries: LeaderboardEntry[] = teams
    .map((t) => ({
      team_id: t.id,
      team_name: t.name,
      final_score_seconds:
        t.started_at && t.finished_at
          ? calcFinalScore(t.started_at, t.finished_at, t.total_penalties_minutes)
          : Number.MAX_SAFE_INTEGER,
      total_penalties_minutes: t.total_penalties_minutes,
      finished_at: t.finished_at,
      rank: 0,
    }))
    .sort((a, b) => a.final_score_seconds - b.final_score_seconds)
    .map((e, i) => ({ ...e, rank: i + 1 }));

  // Broadcast to all clients via game_events table
  await supabase.from("game_events").insert({
    type: "reveal_winner",
    payload: { leaderboard: entries },
  });

  return NextResponse.json({ ok: true, leaderboard: entries });
}
