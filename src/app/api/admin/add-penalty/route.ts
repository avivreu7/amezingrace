import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const { team_id, minutes, admin_password } = await req.json();
  if (admin_password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const supabase = createServiceClient();
  const { data: team } = await supabase
    .from("teams")
    .select("total_penalties_minutes")
    .eq("id", team_id)
    .single();
  if (!team) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const newTotal = Math.max(0, (team.total_penalties_minutes ?? 0) + minutes);
  await supabase.from("teams").update({ total_penalties_minutes: newTotal }).eq("id", team_id);
  return NextResponse.json({ ok: true, total: newTotal });
}
