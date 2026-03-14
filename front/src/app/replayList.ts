/**
 * Persistance de la liste des parties (replays) en localStorage.
 * ROADMAP_V4_MENU §5.1, §5.2
 */
import type { GameRecording } from "../player/infrastructure/replay/GameRecording";

const REPLAYS_KEY = "towerdefense_replays";
const MAX_REPLAYS = 30;

export interface ReplaySummary {
  wave: number;
  timeSeconds: number;
  enemiesKilled: number;
}

export interface SavedReplayEntry {
  id: string;
  savedAt: number;
  seed: number;
  params: GameRecording["params"];
  summary: ReplaySummary;
  recording: GameRecording;
}

function loadReplays(): SavedReplayEntry[] {
  try {
    const raw = localStorage.getItem(REPLAYS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveReplays(entries: SavedReplayEntry[]): void {
  localStorage.setItem(REPLAYS_KEY, JSON.stringify(entries));
}

export function getReplays(): SavedReplayEntry[] {
  return loadReplays();
}

export function saveReplay(
  recording: GameRecording,
  summary: ReplaySummary
): SavedReplayEntry {
  const entries = loadReplays();
  const id = `replay-${recording.seed}-${Date.now()}`;
  const entry: SavedReplayEntry = {
    id,
    savedAt: Date.now(),
    seed: recording.seed,
    params: recording.params,
    summary,
    recording,
  };
  const next = [entry, ...entries].slice(0, MAX_REPLAYS);
  saveReplays(next);
  return entry;
}

export function deleteReplay(id: string): void {
  const entries = loadReplays().filter((e) => e.id !== id);
  saveReplays(entries);
}

export function getReplayById(id: string): SavedReplayEntry | undefined {
  return loadReplays().find((e) => e.id === id);
}
