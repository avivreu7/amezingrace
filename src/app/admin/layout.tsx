"use client";
import { useEffect, useState } from "react";
import { ADMIN_SESSION_KEY } from "@/lib/game";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const stored = sessionStorage.getItem(ADMIN_SESSION_KEY);
    if (stored === "true") setAuthed(true);
    setChecking(false);
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Verify by hitting the reveal endpoint with a safe probe
    const res = await fetch("/api/admin/start-team", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ team_id: "probe", admin_password: password }),
    });

    // 401 = wrong password, 400/404/500 = right password but bad team_id
    if (res.status === 401) {
      setError("סיסמה שגויה.");
      setLoading(false);
      return;
    }

    sessionStorage.setItem(ADMIN_SESSION_KEY, "true");
    sessionStorage.setItem("admin_pw", password);
    setAuthed(true);
    setLoading(false);
  }

  if (checking) return null;

  if (!authed) {
    return (
      <main className="flex items-center justify-center min-h-dvh bg-charcoal px-6">
        <div className="w-full max-w-sm bg-white rounded-2xl border-2 border-mustard shadow-[4px_4px_0px_#E8B400] p-6">
          <h1 className="text-2xl font-black text-charcoal mb-1">ממשק ניהול</h1>
          <p className="text-sm text-charcoal/60 mb-5">המרוץ למט&quot;מון</p>
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <Input
              type="password"
              label="סיסמת מנהל"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={error}
            />
            <Button type="submit" variant="mustard" size="lg" fullWidth loading={loading}>
              כניסה
            </Button>
          </form>
        </div>
      </main>
    );
  }

  return <>{children}</>;
}
