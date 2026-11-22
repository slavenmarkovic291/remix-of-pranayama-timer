import { getPractice, type Practice } from "./library";
import { configuredPracticeSession, loadPracticeSettings } from "./practice-settings";
import type { PracticeSession } from "./pranayama-session";

export interface LibrarySession { practice: Practice; session: PracticeSession }
export const librarySequenceKey = "prana.library-sequence.v1";
export function validLibraryOrder(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((id: unknown) => typeof id === "string" && Boolean(getPractice(id)));
}
export function loadLibraryOrder(): string[] {
  try { const value: unknown = JSON.parse(localStorage.getItem(librarySequenceKey) ?? "[]"); return validLibraryOrder(value) ? value : []; } catch { return []; }
}
export function saveLibraryOrder(ids: string[]): boolean {
  if (!validLibraryOrder(ids)) return false;
  try { localStorage.setItem(librarySequenceKey, JSON.stringify(ids)); return true; } catch { return false; }
}
export function prepareLibrarySessions(ids: string[]): LibrarySession[] {
  if (!validLibraryOrder(ids)) throw new Error("Unbekannte Praktik in der Folge");
  return ids.map((id) => { const practice = getPractice(id); if (!practice) throw new Error("Praktik fehlt");
    return { practice, session: configuredPracticeSession(practice, loadPracticeSettings(practice)) }; });
}
export function librarySequenceAt(entries: LibrarySession[], elapsed: number) {
  const totalMs = entries.reduce((sum, entry) => sum + entry.session.totalMs, 0);
  let localElapsed = Math.max(0, Math.min(elapsed, totalMs));
  for (let index = 0; index < entries.length; index++) {
    const entry = entries[index]; if (!entry) continue;
    if (localElapsed < entry.session.totalMs || index === entries.length - 1) return { ...entry, index, localElapsed, totalMs };
    localElapsed -= entry.session.totalMs;
  }
  throw new Error("Eine Folge braucht mindestens eine Praktik");
}