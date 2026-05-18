import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const { team_id, admin_password } = await req.json();
  if (admin_password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const supabase = createServiceClient();
  await supabase
    .from("teams")
    .update({ finished_at: new Date().toISOString() })
    .eq("id", team_id)
    .is("finished_at", null);
  return NextResponse.json({ ok: true });
}
