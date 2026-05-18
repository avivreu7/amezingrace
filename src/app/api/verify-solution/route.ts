import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { normalizeAnswer } from "@/lib/game";

export async function POST(req: NextRequest) {
  const { team_id, station_id, answer } = await req.json();

  if (!team_id || !station_id || !answer) {
    return NextResponse.json({ correct: false }, { status: 400 });
  }

  const supabase = createServiceClient();

  // Fetch solution_code server-side (never exposed to client)
  const { data: station } = await supabase
    .from("stations")
    .select("solution_code, order_num")
    .eq("id", station_id)
    .single();

  if (!station) {
    return NextResponse.json({ correct: false }, { status: 404 });
  }

  const correct =
    normalizeAnswer(answer) === normalizeAnswer(station.solution_code);

  if (correct) {
    const now = new Date().toISOString();

    // Mark this station as completed
    await supabase
      .from("team_progress")
      .update({ status: "completed", completed_at: now })
      .eq("team_id", team_id)
      .eq("station_id", station_id);

    // If this was the last station, set team.finished_at
    if (station.order_num >= 8) {
      await supabase
        .from("teams")
        .update({ finished_at: now })
        .eq("id", team_id);
    }
  }

  return NextResponse.json({ correct });
}
