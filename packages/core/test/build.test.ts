import { describe, expect, it } from "vitest";
import {
  buildTrack,
  CLOSURE_TOLERANCE,
  defaultLaneOffsets,
  emptyDoc,
  starterOval,
  type TrackDoc,
} from "../src/index.js";

function doc(partial: Partial<TrackDoc>): TrackDoc {
  return { ...emptyDoc("test"), laneCount: 2, laneOffsets: defaultLaneOffsets(2), ...partial };
}

describe("buildTrack", () => {
  it("closes the starter oval", () => {
    const built = buildTrack(starterOval());
    expect(built.closure.closed).toBe(true);
    expect(built.closure.gap).toBeLessThan(CLOSURE_TOLERANCE);
    expect(built.totalPieces).toBe(10);
    expect(built.laneLengths).toHaveLength(4);
    expect(built.laneLengths[0]).toBeCloseTo(12 + 2 * Math.PI * 5.25, 6);
    expect(built.laneLengths[3]).toBeCloseTo(12 + 2 * Math.PI * 9.75, 6);
  });

  it("produces a bill of materials", () => {
    const built = buildTrack(starterOval());
    const straight = built.bom.find((line) => line.pieceId === "s6");
    const curve = built.bom.find((line) => line.pieceId === "c9-45L");
    expect(straight?.count).toBe(2);
    expect(curve?.count).toBe(8);
  });

  it("fits the starter oval on a 36 x 80 inch door", () => {
    const built = buildTrack(starterOval());
    expect(built.tableFit?.fits).toBe(true);
    expect(built.bounds.width).toBeLessThanOrEqual(36);
    expect(built.bounds.height).toBeLessThanOrEqual(80);
  });

  it("reports an open track", () => {
    const built = buildTrack(doc({ pieces: [{ id: "a", pieceId: "s15" }] }));
    expect(built.closure.closed).toBe(false);
    expect(built.closure.gap).toBeCloseTo(15, 9);
    expect(built.issues.some((issue) => issue.message.includes("open"))).toBe(true);
  });

  it("reports an unknown piece", () => {
    const built = buildTrack(doc({ pieces: [{ id: "a", pieceId: "nope" }] }));
    expect(built.placed).toHaveLength(0);
    expect(built.issues.some((issue) => issue.level === "error")).toBe(true);
  });

  it("warns when the layout overflows the table", () => {
    const built = buildTrack(
      doc({ pieces: [{ id: "a", pieceId: "s15" }], table: { width: 6, height: 6 } }),
    );
    expect(built.tableFit?.fits).toBe(false);
    expect(built.tableFit?.overflowX).toBeGreaterThan(0);
  });

  it("warns about a tight inside lane", () => {
    const built = buildTrack(
      doc({
        laneCount: 4,
        laneOffsets: defaultLaneOffsets(4),
        pieces: [{ id: "a", pieceId: "c6-45L" }],
      }),
    );
    expect(built.issues.some((issue) => issue.message.includes("inside lane"))).toBe(true);
  });

  it("returns an empty track without crashing", () => {
    const built = buildTrack(emptyDoc());
    expect(built.totalPieces).toBe(0);
    expect(built.closure.closed).toBe(false);
    expect(built.bounds.width).toBe(0);
  });
});
