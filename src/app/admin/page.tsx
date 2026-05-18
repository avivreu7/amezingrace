"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Team, TeamProgress, Station, Player } from "@/types/supabase";
import TeamStatusCard from "@/components/admin/TeamStatusCard";
import { formatDuration, calcElapsedSeconds } from "@/lib/game";

type Tab = "race" | "players" | "teams" | "preview";
type ProgressWithStation = TeamProgress & { station: Station };

function getPw() {
  if (typeof window === "undefined") return "";
  return sessionStorage.getItem("admin_pw") ?? "";
}

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>("race");
  const [teams, setTeams] = useState<Team[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [progressMap, setProgressMap] = useState<Record<string, ProgressWithStation[]>>({});
  const [loading, setLoading] = useState(true);
  const [revealing, setRevealing] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);
  const [lastRefresh, setLastRefresh] = useState(Date.now());

  const loadData = useCallback(async () => {
    const supabase = createClient();
    const [{ data: teamsData }, { data: progressData }, { data: playersData }] = await Promise.all([
      supabase.from("teams").select("*").order("created_at"),
      supabase.from("team_progress").select("*, station:stations(id,order_num,type,title,content,hint,created_at)"),
      supabase.from("players").select("*").order("created_at"),
    ]);
    if (teamsData) setTeams(teamsData);
    if (playersData) setPlayers(playersData);
    if (progressData) {
      const map: Record<string, ProgressWithStation[]> = {};
      for (const p of progressData as ProgressWithStation[]) {
        if (!map[p.team_id]) map[p.team_id] = [];
        map[p.team_id].push(p);
      }
      setProgressMap(map);
    }
    setLoading(false);
    setLastRefresh(Date.now());
  }, []);

  useEffect(() => {
    loadData();
    const supabase = createClient();
    const channel = supabase
      .channel("admin-realtime-v2")
      .on("postgres_changes", { event: "*", schema: "public", table: "teams" }, loadData)
      .on("postgres_changes", { event: "*", schema: "public", table: "team_progress" }, loadData)
      .on("postgres_changes", { event: "*", schema: "public", table: "players" }, loadData)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [loadData]);

  async function api(path: string, body: Record<string, unknown> = {}) {
    const res = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ admin_password: getPw(), ...body }),
    });
    await loadData();
    return res;
  }

  async function handleCreateTeam(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim() || creating) return;
    setCreating(true);
    await api("/api/admin/create-team", { name: newName.trim() });
    setNewName("");
    setCreating(false);
    nameRef.current?.focus();
  }

  async function handleReveal() {
    setRevealing(true);
    await api("/api/admin/reveal-winner");
    setRevealing(false);
    setRevealed(true);
  }

  async function handleCancelReveal() {
    await api("/api/admin/reset-reveal");
    setRevealed(false);
  }

  const startedTeams  = teams.filter((t) => t.started_at && !t.finished_at);
  const finishedTeams = teams.filter((t) => t.finished_at);
  const unlockedTeams = teams.filter((t) => t.unlocked_at && !t.started_at); // on instructions
  const waitingTeams  = teams.filter((t) => !t.unlocked_at);
  const unassignedPlayers = players.filter((p) => !p.team_id);

  return (
    <div
      className="flex flex-col min-h-dvh"
      style={{ background: "linear-gradient(160deg,#0a1628 0%,#0d2044 50%,#0a1628 100%)" }}
    >
      {/* Top accent */}
      <div className="h-1 shrink-0" style={{ background: "linear-gradient(90deg,#D62828,#FFD700,#D62828)" }} />

      {/* ── Header ── */}
      <header className="shrink-0 px-4 pt-4 pb-3" style={{ borderBottom: "1px solid rgba(255,215,0,0.15)" }}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1
              className="font-black leading-none"
              style={{
                fontFamily: "'Impact','Arial Black',sans-serif",
                fontSize: "1.4rem",
                background: "linear-gradient(180deg,#FFE566,#FFB800)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              ניהול מירוץ
            </h1>
            <p className="text-[10px] text-white/30 mt-0.5">
              עודכן {new Date(lastRefresh).toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </p>
          </div>
          <button
            onClick={loadData}
            className="w-9 h-9 rounded-full flex items-center justify-center text-white/40 hover:text-white/80 transition-colors"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
            title="רענן"
          >
            ↻
          </button>
        </div>

        {/* Stats row */}
        <div className="flex gap-2">
          <StatPill label="ממתינות" value={waitingTeams.length} color="rgba(255,255,255,0.15)" />
          {unlockedTeams.length > 0 && <StatPill label="בהוראות" value={unlockedTeams.length} color="rgba(74,154,222,0.25)" blue />}
          <StatPill label="רצות" value={startedTeams.length} color="rgba(255,215,0,0.25)" gold />
          <StatPill label="סיימו" value={finishedTeams.length} color="rgba(34,197,94,0.2)" green />
        </div>
      </header>

      {/* ── Tab bar ── */}
      <div className="flex shrink-0" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <TabBtn active={tab === "race"} onClick={() => setTab("race")}>🏁 מירוץ</TabBtn>
        <TabBtn active={tab === "players"} onClick={() => setTab("players")} badge={unassignedPlayers.length}>
          👥 שחקנים
        </TabBtn>
        <TabBtn active={tab === "teams"} onClick={() => setTab("teams")}>⚙ קבוצות</TabBtn>
        <TabBtn active={tab === "preview"} onClick={() => setTab("preview")}>🔍 דפים</TabBtn>
      </div>

      {/* ── Scrollable content ── */}
      <div className="flex-1 overflow-y-auto px-4 py-4">

        {/* ═══ RACE TAB ═══ */}
        {tab === "race" && (
          loading ? (
            <div className="flex items-center justify-center h-40">
              <p className="font-bold animate-pulse-badge" style={{ color: "#FFD700" }}>טוען...</p>
            </div>
          ) : teams.length === 0 ? (
            <div className="text-center mt-16">
              <p className="text-5xl mb-3">🏁</p>
              <p className="text-white/40 text-sm mb-3">אין קבוצות עדיין.</p>
              <button onClick={() => setTab("teams")} className="text-sm font-bold" style={{ color: "#FFD700" }}>
                הוסף קבוצות ←
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {/* Order: racing → on instructions → waiting → finished */}
              {[...startedTeams, ...unlockedTeams, ...waitingTeams, ...finishedTeams].map((team) => (
                <TeamStatusCard
                  key={team.id}
                  team={team}
                  progress={progressMap[team.id] ?? []}
                  teamPlayers={players.filter((p) => p.team_id === team.id)}
                  onStart={(id) => api("/api/admin/start-team", { team_id: id })}
                  onReset={(id) => api("/api/admin/reset-team", { team_id: id })}
                  onAddPenalty={(id, m) => api("/api/admin/add-penalty", { team_id: id, minutes: m })}
                  onFinish={(id) => api("/api/admin/finish-team", { team_id: id })}
                  onDelete={(id) => api("/api/admin/delete-team", { team_id: id })}
                />
              ))}
            </div>
          )
        )}

        {/* ═══ PLAYERS TAB ═══ */}
        {tab === "players" && (
          <div className="flex flex-col gap-4">
            {/* Unassigned alert */}
            {unassignedPlayers.length > 0 && (
              <div
                className="rounded-xl px-4 py-3 flex items-center gap-3"
                style={{ background: "rgba(214,40,40,0.12)", border: "1px solid rgba(214,40,40,0.3)" }}
              >
                <span className="text-xl">⚠️</span>
                <p className="text-sm font-bold text-white">
                  {unassignedPlayers.length} שחקנים לא משויכים לקבוצה
                </p>
              </div>
            )}

            {players.length === 0 ? (
              <div className="text-center mt-12">
                <p className="text-5xl mb-3">👤</p>
                <p className="text-white/40 text-sm">אין שחקנים רשומים עדיין.</p>
                <p className="text-white/25 text-xs mt-1">שחקנים יופיעו כאן כשיתחברו לאפליקציה.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <p className="text-[11px] font-bold uppercase tracking-widest px-1" style={{ color: "rgba(255,255,255,0.3)" }}>
                  שחקנים ({players.length})
                </p>
                {players.map((player) => (
                  <PlayerRow
                    key={player.id}
                    player={player}
                    teams={teams}
                    onAssign={(pid, tid) => api("/api/admin/assign-player", { player_id: pid, team_id: tid })}
                    onDelete={(pid) => api("/api/admin/delete-player", { player_id: pid })}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ═══ PREVIEW TAB ═══ */}
        {tab === "preview" && (
          <div className="flex flex-col gap-3">
            <p className="text-[11px] font-bold uppercase tracking-widest px-1" style={{ color: "rgba(255,255,255,0.3)" }}>
              דפי המשחק — נפתחים בטאב חדש
            </p>

            <PreviewGroup title="כניסה ולפני המירוץ">
              <PreviewLink href="/" label="דף כניסה" icon="🏠" desc="לוגין עם שם + קוד" />
              <PreviewLink href="/waiting" label="דף המתנה" icon="⏳" desc="ממתין שהאדמין יפתח" />
              <PreviewLink href="/instructions" label="הוראות בטיחות" icon="📋" desc="כללים + כפתור התחלה" />
            </PreviewGroup>

            <PreviewGroup title="תחנות">
              {Array.from({ length: 8 }, (_, i) => (
                <PreviewLink
                  key={i + 1}
                  href={`/station/${i + 1}`}
                  label={`תחנה ${i + 1}`}
                  icon="✉️"
                  desc={i + 1 <= 4 ? "חידת טקסט" : "סריקת QR"}
                />
              ))}
            </PreviewGroup>

            <PreviewGroup title="סיום">
              <PreviewLink href="/final-mission" label="משימה סופית" icon="📡" desc="קואורדינטות + ניווט" />
              <PreviewLink href="/finish" label="דף סיום" icon="🏆" desc="ממתין לחשיפת תוצאות" />
            </PreviewGroup>

            <PreviewGroup title="קודי QR">
              {[
                { token: "YARKON-CROSS-5", label: "תחנה 5 — גשר" },
                { token: "YARKON-GYM-6",   label: "תחנה 6 — חדר כושר" },
                { token: "YARKON-TREE-7",  label: "תחנה 7 — עץ" },
                { token: "YARKON-FINISH-8",label: "תחנה 8 — בתי עץ" },
                { token: "YARKON-PITSTOP", label: "קו סיום פיזי" },
              ].map(({ token, label }) => (
                <PreviewLink
                  key={token}
                  href={`/qr/${token}`}
                  label={label}
                  icon="📷"
                  desc={`/qr/${token}`}
                />
              ))}
            </PreviewGroup>
          </div>
        )}

        {/* ═══ TEAMS TAB ═══ */}
        {tab === "teams" && (
          <div className="flex flex-col gap-4">
            {/* Create team form */}
            <div
              className="rounded-2xl p-4"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,215,0,0.2)" }}
            >
              <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "#FFD700" }}>
                ➕ קבוצה חדשה
              </p>
              <form onSubmit={handleCreateTeam} className="flex gap-2">
                <input
                  ref={nameRef}
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="שם הקבוצה..."
                  dir="rtl"
                  className="flex-1 rounded-xl px-3 py-2.5 text-sm font-bold text-white placeholder:text-white/25 focus:outline-none transition-all"
                  style={{
                    background: "rgba(255,255,255,0.07)",
                    border: "1px solid rgba(255,215,0,0.2)",
                  }}
                  onFocus={(e) => e.target.style.borderColor = "rgba(255,215,0,0.6)"}
                  onBlur={(e) => e.target.style.borderColor = "rgba(255,215,0,0.2)"}
                />
                <button
                  type="submit"
                  disabled={!newName.trim() || creating}
                  className="font-black px-4 py-2.5 rounded-xl text-sm transition-all disabled:opacity-40"
                  style={{ background: "#FFD700", color: "#1a0a00" }}
                >
                  {creating ? "..." : "הוסף"}
                </button>
              </form>
            </div>

            {/* Teams list */}
            {teams.length === 0 ? (
              <p className="text-white/30 text-sm text-center mt-4">אין קבוצות עדיין.</p>
            ) : (
              <div className="flex flex-col gap-2">
                <p className="text-[11px] font-bold uppercase tracking-widest px-1" style={{ color: "rgba(255,255,255,0.3)" }}>
                  קבוצות ({teams.length})
                </p>
                {teams.map((team) => (
                  <TeamRow
                    key={team.id}
                    team={team}
                    playerCount={players.filter((p) => p.team_id === team.id).length}
                    onDelete={(id) => api("/api/admin/delete-team", { team_id: id })}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Footer: Reveal / Cancel ── */}
      <div
        className="shrink-0 px-4 py-4 flex flex-col gap-2"
        style={{ borderTop: "1px solid rgba(255,215,0,0.15)", background: "rgba(0,0,0,0.3)" }}
      >
        {revealed ? (
          <div className="flex flex-col gap-2">
            <div
              className="text-center py-2 rounded-xl font-black text-base"
              style={{ color: "#FFD700" }}
            >
              🏆 תוצאות שודרו לכל הקבוצות!
            </div>
            <button
              onClick={handleCancelReveal}
              className="w-full py-3 rounded-xl font-bold text-sm transition-all"
              style={{
                background: "rgba(214,40,40,0.15)",
                color: "#ff6b6b",
                border: "1px solid rgba(214,40,40,0.3)",
              }}
            >
              ↩ בטל שידור תוצאות
            </button>
          </div>
        ) : (
          <button
            onClick={handleReveal}
            disabled={revealing || finishedTeams.length === 0}
            className="w-full py-4 rounded-2xl font-black text-base transition-all disabled:opacity-40"
            style={{
              background: finishedTeams.length > 0
                ? "linear-gradient(180deg,#FFD700 0%,#E8A000 50%,#C47800 100%)"
                : "rgba(255,255,255,0.08)",
              color: finishedTeams.length > 0 ? "#1a0a00" : "rgba(255,255,255,0.3)",
              border: finishedTeams.length > 0 ? "2px solid rgba(255,200,0,0.4)" : "1px solid rgba(255,255,255,0.1)",
              boxShadow: finishedTeams.length > 0 ? "0 4px 20px rgba(232,160,0,0.3)" : "none",
            }}
          >
            {revealing ? "משדר..." : "🏆 חשוף מנצח לכולם"}
          </button>
        )}
        <p className="text-[10px] text-center" style={{ color: "rgba(255,255,255,0.2)" }}>
          {finishedTeams.length === 0
            ? "ממתין שקבוצה אחת לפחות תסיים"
            : `${finishedTeams.length} קבוצות סיימו`}
        </p>
      </div>
    </div>
  );
}

/* ─── Sub-components ─── */

function PreviewGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-widest mb-1.5 px-1" style={{ color: "rgba(255,215,0,0.4)" }}>
        {title}
      </p>
      <div className="flex flex-col gap-1.5">{children}</div>
    </div>
  );
}

function PreviewLink({ href, label, icon, desc }: { href: string; label: string; icon: string; desc: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all active:scale-98"
      style={{
        background: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(255,255,255,0.09)",
        textDecoration: "none",
      }}
    >
      <span className="text-xl shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-white text-sm">{label}</p>
        <p className="text-[11px] font-mono truncate" style={{ color: "rgba(255,255,255,0.3)" }}>{desc}</p>
      </div>
      <span className="text-white/25 text-sm shrink-0">↗</span>
    </a>
  );
}

function StatPill({ label, value, color, gold, green, red, blue }: {
  label: string; value: number; color: string; gold?: boolean; green?: boolean; red?: boolean; blue?: boolean;
}) {
  const textColor = gold ? "#FFD700" : green ? "#4ade80" : red ? "#ff6b6b" : blue ? "#4a9ade" : "rgba(255,255,255,0.6)";
  return (
    <div
      className="flex-1 rounded-xl px-2 py-2 text-center"
      style={{ background: color, border: `1px solid ${color.replace("0.2", "0.4").replace("0.25", "0.4").replace("0.15", "0.3")}` }}
    >
      <p className="font-black text-lg leading-none" style={{ color: textColor }}>{value}</p>
      <p className="text-[10px] mt-0.5" style={{ color: textColor, opacity: 0.7 }}>{label}</p>
    </div>
  );
}

function TabBtn({ active, onClick, children, badge }: {
  active: boolean; onClick: () => void; children: React.ReactNode; badge?: number;
}) {
  return (
    <button
      onClick={onClick}
      className="relative flex-1 py-3 text-[13px] font-black transition-colors"
      style={{
        color: active ? "#FFD700" : "rgba(255,255,255,0.35)",
        borderBottom: active ? "2px solid #FFD700" : "2px solid transparent",
        background: active ? "rgba(255,215,0,0.05)" : "transparent",
      }}
    >
      {children}
      {!!badge && badge > 0 && (
        <span
          className="absolute top-2 right-3 w-4 h-4 rounded-full text-[10px] font-black flex items-center justify-center"
          style={{ background: "#D62828", color: "white" }}
        >
          {badge}
        </span>
      )}
    </button>
  );
}

function PlayerRow({ player, teams, onAssign, onDelete }: {
  player: Player;
  teams: Team[];
  onAssign: (pid: string, tid: string | null) => Promise<unknown>;
  onDelete: (pid: string) => Promise<unknown>;
}) {
  const [deleting, setDeleting] = useState(false);
  const currentTeam = teams.find((t) => t.id === player.team_id);
  const isUnassigned = !player.team_id;

  return (
    <div
      className="rounded-xl px-4 py-3 flex items-center gap-3"
      style={{
        background: isUnassigned ? "rgba(214,40,40,0.08)" : "rgba(255,255,255,0.05)",
        border: isUnassigned ? "1px solid rgba(214,40,40,0.25)" : "1px solid rgba(255,255,255,0.1)",
      }}
    >
      <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-black text-sm"
        style={{ background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)" }}>
        {player.name[0]?.toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-white text-sm truncate">{player.name}</p>
        <p className="text-[11px]" style={{ color: isUnassigned ? "#ff6b6b" : "rgba(255,255,255,0.4)" }}>
          {isUnassigned ? "לא משויך" : currentTeam?.name}
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <select
          value={player.team_id ?? ""}
          onChange={(e) => onAssign(player.id, e.target.value || null)}
          className="text-xs font-bold rounded-lg px-2 py-1.5 focus:outline-none"
          style={{
            background: "rgba(255,255,255,0.1)",
            color: "rgba(255,255,255,0.8)",
            border: "1px solid rgba(255,255,255,0.15)",
          }}
        >
          <option value="">— לא משויך —</option>
          {teams.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
        <button
          onClick={async () => { setDeleting(true); await onDelete(player.id); setDeleting(false); }}
          disabled={deleting}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-sm disabled:opacity-40"
          style={{ background: "rgba(214,40,40,0.15)", color: "#ff6b6b" }}
        >
          {deleting ? "…" : "✕"}
        </button>
      </div>
    </div>
  );
}

function TeamRow({ team, playerCount, onDelete }: {
  team: Team; playerCount: number; onDelete: (id: string) => Promise<unknown>;
}) {
  const [confirm, setConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Elapsed for display
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (!team.started_at) return;
    setElapsed(calcElapsedSeconds(team.started_at));
    const id = setInterval(() => setElapsed(calcElapsedSeconds(team.started_at!)), 1000);
    return () => clearInterval(id);
  }, [team.started_at]);

  const status = team.finished_at ? "סיים" : team.started_at ? "רץ" : "ממתין";
  const statusColor = team.finished_at ? "#4ade80" : team.started_at ? "#FFD700" : "rgba(255,255,255,0.4)";

  return (
    <div
      className="rounded-xl px-4 py-3 flex items-center gap-3"
      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)" }}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-black text-white text-sm truncate">{team.name}</p>
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: statusColor + "22", color: statusColor }}>
            {status}
          </span>
        </div>
        <div className="flex items-center gap-3 mt-0.5">
          <p className="text-[11px] font-mono" style={{ color: "rgba(255,255,255,0.35)" }}>
            קוד: <span className="font-black text-white/60">{team.access_code}</span>
          </p>
          <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.3)" }}>
            👤 {playerCount}
          </p>
          {team.started_at && (
            <p className="text-[11px] font-mono" style={{ color: statusColor }}>
              ⏱ {formatDuration(elapsed + team.total_penalties_minutes * 60)}
            </p>
          )}
        </div>
      </div>
      {confirm ? (
        <div className="flex gap-1">
          <button
            onClick={async () => { setDeleting(true); await onDelete(team.id); setDeleting(false); setConfirm(false); }}
            disabled={deleting}
            className="text-[11px] font-black px-2 py-1.5 rounded-lg disabled:opacity-40"
            style={{ background: "rgba(214,40,40,0.2)", color: "#ff6b6b", border: "1px solid rgba(214,40,40,0.4)" }}
          >
            {deleting ? "…" : "מחק!"}
          </button>
          <button
            onClick={() => setConfirm(false)}
            className="text-[11px] font-bold px-2 py-1.5 rounded-lg"
            style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.5)" }}
          >
            ביטול
          </button>
        </div>
      ) : (
        <button
          onClick={() => setConfirm(true)}
          className="text-[11px] font-bold px-2.5 py-1.5 rounded-lg"
          style={{ background: "rgba(214,40,40,0.1)", color: "#ff6b6b", border: "1px solid rgba(214,40,40,0.2)" }}
        >
          🗑 מחק
        </button>
      )}
    </div>
  );
}
