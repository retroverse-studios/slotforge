import { parseSeason, type Season } from "./format";

const STORAGE_KEY = "slotforge:race:v1";

export function loadSeason(): Season | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return parseSeason(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function saveSeason(season: Season): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(season));
  } catch {
    // Keep the app usable when storage is blocked.
  }
}

export function downloadSeason(season: Season): void {
  const blob = new Blob([JSON.stringify(season, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${season.name.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "season"}.season.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export async function readSeasonFile(file: File): Promise<Season> {
  const text = await file.text();
  return parseSeason(JSON.parse(text));
}
