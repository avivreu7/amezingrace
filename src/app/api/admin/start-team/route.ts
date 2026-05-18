import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const { team_id, admin_password } = await req.json();

  if (admin_password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();

  const { error } = await supabase
    .from("teams")
    .update({ unlocked_at: new Date().toISOString() })
    .eq("id", team_id)
    .is("unlocked_at", null); // Idempotent — only set if not already unlocked

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
