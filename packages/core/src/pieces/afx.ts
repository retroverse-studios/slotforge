import type { PieceSpec, TurnDirection } from "../types.js";

/** One two-lane AFX section is 3 inches wide. */
export const AFX_TRACK_WIDTH = 3;

/** Lane centres are 1.5 inches apart inside one two-lane section. */
export const AFX_LANE_SPACING = 1.5;

/** Lane centre offset from section centre. */
export const AFX_LANE_OFFSET = 0.75;

/** Nominal curve radius is measured on the outside edge. */
export const AFX_OUTSIDE_TO_CENTRE = 1.5;

/** Slot centre to conductor rail. */
export const AFX_RAIL_OFFSET = 9 / 32;

export const AFX_SOURCE = "https://hoslotcarracing.net/Track.php";

export interface PieceLibrary {
  id: string;
  name: string;
  pieces: PieceSpec[];
}

function straight(
  id: string,
  label: string,
  length: number,
  options: Partial<PieceSpec> = {},
): PieceSpec {
  return {
    id,
    label,
    kind: "straight",
    length,
    width: AFX_TRACK_WIDTH,
    verified: true,
    source: AFX_SOURCE,
    tags: ["straight"],
    ...options,
  };
}

function curve(
  id: string,
  label: string,
  radius: number,
  angle: number,
  direction: TurnDirection,
  options: Partial<PieceSpec> = {},
): PieceSpec {
  return {
    id,
    label,
    kind: "curve",
    radius,
    angle,
    direction,
    width: AFX_TRACK_WIDTH,
    verified: true,
    source: AFX_SOURCE,
    tags: ["curve"],
    ...options,
  };
}

function banked(
  id: string,
  label: string,
  radius: number,
  angle: number,
  direction: TurnDirection,
  bank: number,
): PieceSpec {
  return curve(id, label, radius, angle, direction, {
    bank,
    tags: ["curve", "banked"],
    source: "https://www.slotcardepot.com/",
  });
}

export const AFX_PIECES: PieceSpec[] = [
  straight("s3", 'Straight 3"', 3, { tags: ["straight", "common"] }),
  straight("s6", 'Straight 6"', 6, { tags: ["straight", "common"] }),
  straight("s9", 'Straight 9"', 9, { tags: ["straight", "common"] }),
  straight("s12", 'Straight 12"', 12, {
    verified: false,
    note: "Not in the current AFX catalogue. Kept for older stock and custom builds.",
  }),
  straight("s15", 'Straight 15"', 15, { tags: ["straight", "common"] }),
  straight("pw15", 'Power terminal 15"', 15, {
    kind: "power",
    tags: ["power"],
    note: "Straight with a power terminal. One per lane pair.",
  }),

  curve("c6-45L", 'Curve 6" 45° L', 6, 45, "L", { tags: ["curve", "common"] }),
  curve("c6-45R", 'Curve 6" 45° R', 6, 45, "R", { tags: ["curve", "common"] }),

  curve("c9-45L", 'Curve 9" 45° L', 9, 45, "L", { tags: ["curve", "common"] }),
  curve("c9-45R", 'Curve 9" 45° R', 9, 45, "R", { tags: ["curve", "common"] }),
  curve("c9-90L", 'Curve 9" 90° L', 9, 90, "L", { tags: ["curve"] }),
  curve("c9-90R", 'Curve 9" 90° R', 9, 90, "R", { tags: ["curve"] }),

  curve("c12-45L", 'Curve 12" 45° L', 12, 45, "L", { tags: ["curve"] }),
  curve("c12-45R", 'Curve 12" 45° R', 12, 45, "R", { tags: ["curve"] }),
  curve("c12-90L", 'Curve 12" 90° L', 12, 90, "L", {
    verified: false,
    note: "Check your stock. 12 inch 90 degree sections are not in every AFX set.",
  }),
  curve("c12-90R", 'Curve 12" 90° R', 12, 90, "R", {
    verified: false,
    note: "Check your stock. 12 inch 90 degree sections are not in every AFX set.",
  }),

  curve("c15-45L", 'Curve 15" 45° L', 15, 45, "L", { tags: ["curve"] }),
  curve("c15-45R", 'Curve 15" 45° R', 15, 45, "R", { tags: ["curve"] }),

  curve("c18-45L", 'Curve 18" 45° L', 18, 45, "L", {
    verified: false,
    note: "Newer wide radius. Confirm before ordering.",
  }),
  curve("c18-45R", 'Curve 18" 45° R', 18, 45, "R", {
    verified: false,
    note: "Newer wide radius. Confirm before ordering.",
  }),

  banked("bank9-45L", 'Banked 9" 45° L', 9, 45, "L", 30),
  banked("bank9-45R", 'Banked 9" 45° R', 9, 45, "R", 30),
  banked("bank12-45L", 'Banked 12" 45° L', 12, 45, "L", 30),
  banked("bank12-45R", 'Banked 12" 45° R', 12, 45, "R", 30),

  {
    id: "hk3-180L",
    label: 'Hairpin 3" 180° L',
    kind: "hairpin",
    radius: 3,
    angle: 180,
    direction: "L",
    width: AFX_TRACK_WIDTH,
    verified: false,
    experimental: true,
    note: "Lane spacing squeezes through the hairpin. Geometry is approximate.",
    source: "https://brshobbies.com/",
    tags: ["hairpin", "tight"],
  },
  {
    id: "hk3-180R",
    label: 'Hairpin 3" 180° R',
    kind: "hairpin",
    radius: 3,
    angle: 180,
    direction: "R",
    width: AFX_TRACK_WIDTH,
    verified: false,
    experimental: true,
    note: "Lane spacing squeezes through the hairpin. Geometry is approximate.",
    source: "https://brshobbies.com/",
    tags: ["hairpin", "tight"],
  },

  {
    id: "x90",
    label: "Crossing 90°",
    kind: "crossing",
    length: 6,
    width: AFX_TRACK_WIDTH,
    verified: false,
    experimental: true,
    note: "Placeholder for figure-8 layouts. Confirm the exact crossing part before building.",
    tags: ["crossing", "figure-8"],
  },
];

export const AFX_LIBRARY: PieceLibrary = {
  id: "afx",
  name: "AFX / Tomy HO",
  pieces: AFX_PIECES,
};

/** Lane 0 is the leftmost lane when facing the direction of travel. */
export function defaultLaneOffsets(laneCount: number): number[] {
  const pairs = Math.max(1, Math.floor(laneCount / 2));
  const offsets: number[] = [];
  for (let index = 0; index < pairs; index += 1) {
    const centre = (index - (pairs - 1) / 2) * AFX_TRACK_WIDTH;
    offsets.push(centre - AFX_LANE_OFFSET, centre + AFX_LANE_OFFSET);
  }
  return offsets.reverse();
}
