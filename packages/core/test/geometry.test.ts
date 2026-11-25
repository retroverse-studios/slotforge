import { describe, expect, it } from "vitest";
import {
  advance,
  arcPose,
  boundsOf,
  degToRad,
  distance,
  normalizeAngle,
  offsetPolyline,
  polylineLength,
  sampleArc,
} from "../src/index.js";

const close = (a: number, b: number, tolerance = 1e-9) =>
  expect(Math.abs(a - b)).toBeLessThan(tolerance);

describe("pose maths", () => {
  it("advances a straight", () => {
    const end = advance({ x: 0, y: 0, heading: 0 }, 15);
    close(end.x, 15);
    close(end.y, 0);
    close(end.heading, 0);
  });

  it("turns left 90 degrees around the centreline radius", () => {
    const end = arcPose({ x: 0, y: 0, heading: 0 }, 7.5, degToRad(90), 1);
    close(end.x, 7.5);
    close(end.y, 7.5);
    close(end.heading, Math.PI / 2);
  });

  it("turns right 90 degrees around the centreline radius", () => {
    const end = arcPose({ x: 0, y: 0, heading: 0 }, 7.5, degToRad(90), -1);
    close(end.x, 7.5);
    close(end.y, -7.5);
    close(end.heading, -Math.PI / 2);
  });

  it("normalises angles into (-PI, PI]", () => {
    close(normalizeAngle(Math.PI * 2), 0);
    close(normalizeAngle(-Math.PI / 2), -Math.PI / 2);
  });
});

describe("sampling", () => {
  it("samples an arc with the expected length", () => {
    const sampled = sampleArc({ x: 0, y: 0, heading: 0 }, 7.5, Math.PI / 2, 1);
    close(polylineLength(sampled.points), (Math.PI / 2) * 7.5, 0.01);
    close(distance(sampled.points[0]!, { x: 0, y: 0 }), 0);
  });

  it("offsets a polyline to the left of travel", () => {
    const points = [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
    ];
    const offset = offsetPolyline(points, [0, 0], 1.5);
    close(offset[0]!.y, 1.5);
    close(offset[1]!.y, 1.5);
  });

  it("computes bounds", () => {
    const bounds = boundsOf([
      { x: -2, y: 1 },
      { x: 4, y: 8 },
    ]);
    expect(bounds.width).toBe(6);
    expect(bounds.height).toBe(7);
  });
});
