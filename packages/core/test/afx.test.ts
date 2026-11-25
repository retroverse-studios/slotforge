import { describe, expect, it } from "vitest";
import {
  AFX_LIBRARY,
  buildTrack,
  defaultLaneOffsets,
  parseTrackDoc,
  starterOval,
  type TrackDoc,
} from "../src/index.js";

function curveDoc(pieceId: string, laneCount = 2): TrackDoc {
  return {
    schema: "slotforge/track@1",
    name: pieceId,
    units: "in",
    laneCount,
    laneOffsets: defaultLaneOffsets(laneCount),
    pieces: [{ id: "a", pieceId }],
  };
}

describe("AFX piece library", () => {
  it("has verified straights and curves", () => {
    const ids = AFX_LIBRARY.pieces.map((piece) => piece.id);
    for (const id of ["s3", "s6", "s9", "s15", "c6-45L", "c9-90R", "bank9-45L"]) {
      expect(ids).toContain(id);
    }
    expect(AFX_LIBRARY.pieces.every((piece) => piece.width === 3)).toBe(true);
  });

  it("matches the published 1/8 turn lane lengths", () => {
    const cases = [
      { id: "c6-45L", inner: 2.945, outer: 4.123 },
      { id: "c9-45L", inner: 5.301, outer: 6.479 },
      { id: "c12-45L", inner: 7.657, outer: 8.835 },
      { id: "c15-45L", inner: 10.013, outer: 11.191 },
      { id: "c18-45L", inner: 12.37, outer: 13.548 },
    ];

    for (const item of cases) {
      const built = buildTrack(curveDoc(item.id));
      expect(built.laneLengths[0]).toBeCloseTo(item.inner, 2);
      expect(built.laneLengths[1]).toBeCloseTo(item.outer, 2);
    }
  });

  it("gives a 4-lane layout four lane offsets", () => {
    expect(defaultLaneOffsets(2)).toEqual([0.75, -0.75]);
    expect(defaultLaneOffsets(4)).toEqual([2.25, 0.75, -0.75, -2.25]);
    expect(defaultLaneOffsets(6)).toHaveLength(6);
  });
});

describe("schemas", () => {
  it("parses the starter layout", () => {
    const parsed = parseTrackDoc(starterOval());
    expect(parsed.pieces).toHaveLength(10);
  });

  it("rejects a bad lane count", () => {
    expect(() =>
      parseTrackDoc({ ...starterOval(), laneCount: 1 }),
    ).toThrow();
  });
});
