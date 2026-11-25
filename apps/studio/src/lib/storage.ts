import { parseTrackDoc, safeParseTrackDoc, starterOval, type TrackDoc } from "@slotforge/core";

const STORAGE_KEY = "slotforge:studio:v1";

export function loadDoc(): TrackDoc {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return starterOval();
    const parsed = safeParseTrackDoc(JSON.parse(raw));
    return parsed.success ? parsed.data : starterOval();
  } catch {
    return starterOval();
  }
}

export function saveDoc(doc: TrackDoc): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(doc));
  } catch {
    // Storage can be full or blocked. The app still works in memory.
  }
}

export function downloadJson(doc: TrackDoc): void {
  const blob = new Blob([JSON.stringify(doc, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${slug(doc.name)}.afxtrack.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export async function readJsonFile(file: File): Promise<TrackDoc> {
  const text = await file.text();
  return parseTrackDoc(JSON.parse(text));
}

export function slug(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "track"
  );
}
