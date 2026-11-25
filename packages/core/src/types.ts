import { z } from "zod";

export type Unit = "in" | "mm";

export type PieceKind = "straight" | "curve" | "hairpin" | "crossing" | "power";

export type TurnDirection = "L" | "R";

export interface PieceSpec {
  id: string;
  label: string;
  kind: PieceKind;
  /** Straight length in inches. */
  length?: number;
  /** Nominal outside radius in inches, the AFX catalogue convention. */
  radius?: number;
  /** Sweep angle in degrees. */
  angle?: number;
  direction?: TurnDirection;
  /** Nominal track width of one two-lane section, inches. */
  width: number;
  /** Bank angle in degrees. */
  bank?: number;
  /** True when the dimensions are confirmed against a catalogue or a measurement. */
  verified: boolean;
  /** True for pieces that are modelled but not released. */
  experimental?: boolean;
  note?: string;
  source?: string;
  tags?: string[];
}

export interface Placement {
  id: string;
  pieceId: string;
}

export interface TableSpec {
  width: number;
  height: number;
}

export const trackDocSchema = z.object({
  schema: z.literal("slotforge/track@1"),
  name: z.string().min(1),
  units: z.enum(["in", "mm"]),
  laneCount: z.number().int().min(2).max(8),
  laneOffsets: z.array(z.number()).min(1).optional(),
  table: z
    .object({
      width: z.number().positive(),
      height: z.number().positive(),
    })
    .optional(),
  pieces: z.array(
    z.object({
      id: z.string().min(1),
      pieceId: z.string().min(1),
    }),
  ),
});

export type TrackDoc = z.infer<typeof trackDocSchema>;

export function parseTrackDoc(input: unknown): TrackDoc {
  return trackDocSchema.parse(input);
}

export function safeParseTrackDoc(input: unknown) {
  return trackDocSchema.safeParse(input);
}
