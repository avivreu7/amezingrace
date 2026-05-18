export type StationType = "route" | "detour" | "roadblock" | "qr";
export type ProgressStatus = "active" | "completed";
export type GameEventType = "race_started" | "reveal_winner";

export interface Team {
  id: string;
  name: string;
  access_code: string;
  unlocked_at: string | null;   // admin pressed "start" → team can proceed to instructions
  started_at: string | null;    // team clicked "let's go" on instructions → timer starts
  finished_at: string | null;
  total_penalties_minutes: number;
  created_at: string;
}

export interface Station {
  id: string;
  order_num: number;
  type: StationType;
  title: string;
  content: string;
  hint: string;
  created_at: string;
  // solution_code is intentionally omitted — validated server-side only
}

export interface TeamProgress {
  id: string;
  team_id: string;
  station_id: string;
  status: ProgressStatus;
  completed_at: string | null;
  hints_used: number;
  created_at: string;
  station?: Station;
}

export interface GameEvent {
  id: string;
  type: GameEventType;
  payload: Record<string, unknown> | null;
  created_at: string;
}

export interface Player {
  id: string;
  name: string;
  team_id: string | null;
  created_at: string;
}

export interface LeaderboardEntry {
  team_id: string;
  team_name: string;
  final_score_seconds: number;
  total_penalties_minutes: number;
  finished_at: string | null;
  rank: number;
}
