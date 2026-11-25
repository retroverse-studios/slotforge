import { useMemo, useState } from "react";
import { AFX_LIBRARY, type PieceSpec } from "@slotforge/core";

interface Props {
  onAdd: (pieceId: string) => void;
}

function subtitle(spec: PieceSpec): string {
  if (spec.kind === "straight" || spec.kind === "power" || spec.kind === "crossing") {
    return `${spec.length ?? 0} in`;
  }
  const bank = spec.bank ? ` · ${spec.bank}° bank` : "";
  return `R${spec.radius ?? 0} · ${spec.angle ?? 0}° ${spec.direction ?? ""}${bank}`;
}

const GROUPS: { id: string; label: string; match: (spec: PieceSpec) => boolean }[] = [
  {
    id: "straights",
    label: "Straights",
    match: (spec) => spec.kind === "straight",
  },
  {
    id: "curves",
    label: "Curves",
    match: (spec) => spec.kind === "curve" && !spec.bank,
  },
  {
    id: "banked",
    label: "Banked",
    match: (spec) => spec.kind === "curve" && Boolean(spec.bank),
  },
  {
    id: "accessories",
    label: "Power and special",
    match: (spec) => spec.kind === "power" || spec.kind === "crossing" || spec.kind === "hairpin",
  },
];

export function Palette({ onAdd }: Props) {
  const [filter, setFilter] = useState("");
  const query = filter.trim().toLowerCase();

  const groups = useMemo(
    () =>
      GROUPS.map((group) => ({
        ...group,
        pieces: AFX_LIBRARY.pieces.filter(
          (spec) =>
            group.match(spec) &&
            (!query ||
              spec.label.toLowerCase().includes(query) ||
              spec.id.toLowerCase().includes(query)),
        ),
      })).filter((group) => group.pieces.length > 0),
    [query],
  );

  return (
    <aside className="palette panel">
      <div className="panel-head">
        <div>
          <h2>Parts</h2>
          <span className="muted">{AFX_LIBRARY.name}</span>
        </div>
      </div>
      <input
        className="search"
        placeholder="Filter parts"
        value={filter}
        onChange={(event) => setFilter(event.target.value)}
      />
      <div className="palette-scroll">
        {groups.map((group) => (
          <section key={group.id} className="palette-group">
            <h3>{group.label}</h3>
            <div className="piece-list">
              {group.pieces.map((spec) => (
                <button
                  key={spec.id}
                  className="piece-button"
                  onClick={() => onAdd(spec.id)}
                  title={`${spec.label}${spec.note ? `\n${spec.note}` : ""}`}
                >
                  <span className="piece-label">{spec.label}</span>
                  <span className="piece-meta">{subtitle(spec)}</span>
                  {!spec.verified && <span className="flag">check</span>}
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>
    </aside>
  );
}
