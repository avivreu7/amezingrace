import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const { admin_password } = await req.json();
  if (admin_password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const supabase = createServiceClient();
  // Delete all reveal_winner events so teams go back to waiting screen
  await supabase.from("game_events").delete().eq("type", "reveal_winner");
  return NextResponse.json({ ok: true });
}
