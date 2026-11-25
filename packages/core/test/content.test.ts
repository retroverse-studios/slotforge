import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { buildTrack, parseTrackDoc } from "../src/index.js";

const contentDir = resolve(process.cwd(), "../../content/tracks");
const files = existsSync(contentDir)
  ? readdirSync(contentDir).filter((file) => file.endsWith(".afxtrack.json"))
  : [];

describe("content layouts", () => {
  it("has at least one layout", () => {
    expect(files.length).toBeGreaterThan(0);
  });

  for (const file of files) {
    it(`parses and closes ${file}`, () => {
      const raw = readFileSync(join(contentDir, file), "utf8");
      const doc = parseTrackDoc(JSON.parse(raw));
      const built = buildTrack(doc);
      expect(built.issues.filter((issue) => issue.level === "error")).toHaveLength(0);
      expect(built.closure.closed).toBe(true);
    });
  }
});
