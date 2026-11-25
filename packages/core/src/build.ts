import type { PieceLibrary } from "./pieces/afx.js";
import {
  AFX_LANE_OFFSET,
  AFX_LIBRARY,
  AFX_OUTSIDE_TO_CENTRE,
  AFX_TRACK_WIDTH,
  defaultLaneOffsets,
} from "./pieces/afx.js";
import {
  advance,
  arcPose,
  boundsOf,
  degToRad,
  distance,
  normalizeAngle,
  offsetPolyline,
  sampleArc,
  sampleStraight,
  unionBounds,
  type Bounds,
  type Pose,
  type Vec2,
} from "./geometry.js";
import type { PieceSpec, Placement, TrackDoc } from "./types.js";

export const CLOSURE_TOLERANCE = 0.125;
export const HEADING_TOLERANCE = (0.5 * Math.PI) / 180;

export type IssueLevel = "error" | "warn" | "info";

export interface Issue {
  level: IssueLevel;
  message: string;
}

export interface LanePath {
  lane: number;
  offset: number;
  points: Vec2[];
  length: number;
}

export interface PlacedPiece {
  index: number;
  placement: Placement;
  spec: PieceSpec;
  entry: Pose;
  exit: Pose;
  points: Vec2[];
  headings: number[];
  surface: Vec2[];
  lanePolylines: Vec2[][];
  laneLengths: number[];
}

export interface BomLine {
  pieceId: string;
  label: string;
  count: number;
  verified: boolean;
}

export interface Closure {
  closed: boolean;
  gap: number;
  headingError: number;
  end: Pose;
}

export interface TableFit {
  fits: boolean;
  overflowX: number;
  overflowY: number;
}

export interface BuiltTrack {
  doc: TrackDoc;
  placed: PlacedPiece[];
  lanes: LanePath[];
  laneLengths: number[];
  laneDelta: number;
  surfaceHalfWidth: number;
  bom: BomLine[];
  bounds: Bounds;
  closure: Closure;
  tableFit?: TableFit;
  issues: Issue[];
  totalPieces: number;
}

function resolveLaneOffsets(doc: TrackDoc): number[] {
  if (doc.laneOffsets && doc.laneOffsets.length > 0) return doc.laneOffsets;
  return defaultLaneOffsets(doc.laneCount);
}

function surfaceHalfWidthFor(offsets: number[]): number {
  const widest = offsets.reduce((max, offset) => Math.max(max, Math.abs(offset)), 0);
  return Math.max(AFX_TRACK_WIDTH / 2, widest + AFX_LANE_OFFSET);
}

function makeSurface(
  points: Vec2[],
  headings: number[],
  halfWidth: number,
): Vec2[] {
  const left = offsetPolyline(points, headings, halfWidth);
  const right = offsetPolyline(points, headings, -halfWidth);
  return [...left, ...right.reverse()];
}

function pieceCentreRadius(spec: PieceSpec): number {
  return (spec.radius ?? 0) - AFX_OUTSIDE_TO_CENTRE;
}

function pieceDirection(spec: PieceSpec): 1 | -1 {
  return spec.direction === "R" ? -1 : 1;
}

export function buildTrack(
  doc: TrackDoc,
  library: PieceLibrary = AFX_LIBRARY,
): BuiltTrack {
  const piecesById = new Map(library.pieces.map((piece) => [piece.id, piece]));
  const offsets = resolveLaneOffsets(doc);
  const halfWidth = surfaceHalfWidthFor(offsets);
  const issues: Issue[] = [];

  if (offsets.length !== doc.laneCount) {
    issues.push({
      level: "warn",
      message: `Lane count is ${doc.laneCount} but ${offsets.length} lane offsets are defined.`,
    });
  }

  const seenIds = new Set<string>();
  const placed: PlacedPiece[] = [];
  let cursor: Pose = { x: 0, y: 0, heading: 0 };

  doc.pieces.forEach((placement, index) => {
    if (seenIds.has(placement.id)) {
      issues.push({
        level: "warn",
        message: `Duplicate placement id "${placement.id}".`,
      });
    }
    seenIds.add(placement.id);

    const spec = piecesById.get(placement.pieceId);
    if (!spec) {
      issues.push({
        level: "error",
        message: `Unknown piece "${placement.pieceId}".`,
      });
      return;
    }

    const entry = cursor;
    let points: Vec2[];
    let headings: number[];
    let exit: Pose;
    let laneLengths: number[];

    if (spec.kind === "curve" || spec.kind === "hairpin") {
      const centreRadius = pieceCentreRadius(spec);
      const angle = degToRad(spec.angle ?? 0);
      const direction = pieceDirection(spec);
      const sampled = sampleArc(entry, centreRadius, angle, direction);
      points = sampled.points;
      headings = sampled.headings;
      exit = arcPose(entry, centreRadius, angle, direction);
      laneLengths = offsets.map((offset) =>
        Math.max(0.01, (centreRadius - direction * offset) * angle),
      );
    } else {
      const length = spec.length ?? 0;
      const sampled = sampleStraight(entry, length);
      points = sampled.points;
      headings = sampled.headings;
      exit = advance(entry, length);
      laneLengths = offsets.map(() => length);
    }

    const lanePolylines = offsets.map((offset) =>
      offsetPolyline(points, headings, offset),
    );
    const surface = makeSurface(points, headings, halfWidth);

    placed.push({
      index,
      placement,
      spec,
      entry,
      exit,
      points,
      headings,
      surface,
      lanePolylines,
      laneLengths,
    });

    if (spec.kind === "curve" || spec.kind === "hairpin") {
      const direction = pieceDirection(spec);
      const centreRadius = pieceCentreRadius(spec);
      const tightest = offsets.reduce(
        (min, offset) => Math.min(min, centreRadius - direction * offset),
        Infinity,
      );
      if (tightest < 3) {
        issues.push({
          level: "warn",
          message: `${spec.label} leaves the inside lane at ${tightest.toFixed(2)} in radius. Tight for HO cars.`,
        });
      }
    }

    if (spec.experimental) {
      issues.push({
        level: "info",
        message: `${spec.label} is experimental: ${spec.note ?? "geometry not confirmed"}.`,
      });
    }

    cursor = exit;
  });

  const lanes: LanePath[] = offsets.map((offset, lane) => {
    const points: Vec2[] = [];
    let length = 0;
    for (const piece of placed) {
      const polyline = piece.lanePolylines[lane];
      if (polyline) points.push(...polyline);
      length += piece.laneLengths[lane] ?? 0;
    }
    return { lane, offset, points, length };
  });

  const laneLengths = lanes.map((lane) => lane.length);
  const laneDelta =
    laneLengths.length === 0
      ? 0
      : Math.max(...laneLengths) - Math.min(...laneLengths);

  const counts = new Map<string, number>();
  for (const piece of placed) {
    counts.set(piece.placement.pieceId, (counts.get(piece.placement.pieceId) ?? 0) + 1);
  }
  const bom: BomLine[] = [...counts.entries()]
    .map(([pieceId, count]) => {
      const spec = piecesById.get(pieceId);
      return {
        pieceId,
        label: spec?.label ?? pieceId,
        count,
        verified: spec?.verified ?? false,
      };
    })
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));

  let bounds: Bounds | null = null;
  for (const piece of placed) {
    bounds = unionBounds(bounds, boundsOf(piece.surface));
    for (const lane of piece.lanePolylines) {
      bounds = unionBounds(bounds, boundsOf(lane));
    }
  }
  const finalBounds = bounds ?? boundsOf([]);

  const end = placed.length > 0 ? placed[placed.length - 1]!.exit : cursor;
  const gap = distance(end, { x: 0, y: 0 });
  const headingError = normalizeAngle(end.heading);
  const closed =
    placed.length > 0 &&
    gap <= CLOSURE_TOLERANCE &&
    Math.abs(headingError) <= HEADING_TOLERANCE;

  if (placed.length === 0) {
    issues.push({ level: "info", message: "Add pieces from the library to start a layout." });
  } else if (!closed) {
    issues.push({
      level: "warn",
      message: `Track is open: ${gap.toFixed(2)} in gap and ${(Math.abs(headingError) * 180 / Math.PI).toFixed(1)}° heading error.`,
    });
  }

  let tableFit: TableFit | undefined;
  if (doc.table) {
    const overflowX = Math.max(0, finalBounds.width - doc.table.width);
    const overflowY = Math.max(0, finalBounds.height - doc.table.height);
    tableFit = { fits: overflowX === 0 && overflowY === 0, overflowX, overflowY };
    if (!tableFit.fits) {
      issues.push({
        level: "warn",
        message: `Layout is ${finalBounds.width.toFixed(1)} x ${finalBounds.height.toFixed(1)} in and overflows the table by ${overflowX.toFixed(1)} x ${overflowY.toFixed(1)} in.`,
      });
    }
  }

  return {
    doc,
    placed,
    lanes,
    laneLengths,
    laneDelta,
    surfaceHalfWidth: halfWidth,
    bom,
    bounds: finalBounds,
    closure: { closed, gap, headingError, end },
    tableFit,
    issues,
    totalPieces: placed.length,
  };
}

export function emptyDoc(name = "New track"): TrackDoc {
  return {
    schema: "slotforge/track@1",
    name,
    units: "in",
    laneCount: 4,
    laneOffsets: defaultLaneOffsets(4),
    table: { width: 36, height: 80 },
    pieces: [],
  };
}

export function starterOval(): TrackDoc {
  const curves = Array.from({ length: 8 }, (_, index) => ({
    id: `c${index + 1}`,
    pieceId: "c9-45L",
  }));
  return {
    schema: "slotforge/track@1",
    name: "Door oval",
    units: "in",
    laneCount: 4,
    laneOffsets: defaultLaneOffsets(4),
    table: { width: 36, height: 80 },
    pieces: [
      { id: "s1", pieceId: "s6" },
      ...curves.slice(0, 4),
      { id: "s2", pieceId: "s6" },
      ...curves.slice(4),
    ],
  };
}
