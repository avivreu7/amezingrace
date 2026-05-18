import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const { team_id, admin_password } = await req.json();
  if (admin_password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const supabase = createServiceClient();
  await supabase.from("team_progress").delete().eq("team_id", team_id);
  await supabase.from("teams").delete().eq("id", team_id);
  return NextResponse.json({ ok: true });
}
