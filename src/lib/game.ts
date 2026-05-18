export const TOTAL_STATIONS = 8;
export const HINT_PENALTY_MINUTES = 5;
export const ADMIN_SESSION_KEY = "race_admin";
export const TEAM_SESSION_KEY = "race_team";
export const PLAYER_SESSION_KEY = "race_player";

// QR station tokens — each maps to a station order_num
// The token is embedded in the QR code URL: /qr/[token]
export const QR_TOKENS: Record<string, number> = {
  "YARKON-CROSS-5": 5,
  "YARKON-GYM-6": 6,
  "YARKON-TREE-7": 7,
  "YARKON-FINISH-8": 8,
};

// Special token for the physical finish line — scanned at pit stop, sets finished_at
export const FINISH_LINE_TOKEN = "YARKON-PITSTOP";

export const FINISH_COORDS = {
  lat: 32.09949890287364,
  lng: 34.800080437629795,
};

export function formatDuration(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function calcElapsedSeconds(startedAt: string): number {
  return Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000);
}

export function calcFinalScore(
  startedAt: string,
  finishedAt: string,
  penaltyMinutes: number
): number {
  const raceSeconds = Math.floor(
    (new Date(finishedAt).getTime() - new Date(startedAt).getTime()) / 1000
  );
  return raceSeconds + penaltyMinutes * 60;
}

export function normalizeAnswer(raw: string): string {
  return raw.trim().toLowerCase().replace(/\s+/g, "");
}
