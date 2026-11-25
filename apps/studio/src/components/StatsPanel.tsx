import { useEffect, useState } from "react";
import type { BuiltTrack, TrackDoc } from "@slotforge/core";
import { formatDelta, formatInches, formatLength } from "../lib/format";

interface Props {
  doc: TrackDoc;
  built: BuiltTrack;
  selected: string | null;
  onRemove: () => void;
  onLaneCount: (count: number) => void;
  onTable: (width: number, height: number) => void;
}

const PRESETS = [
  { id: "door", label: "36 × 80 in door", width: 36, height: 80 },
  { id: "4x8", label: "4 × 8 ft table", width: 48, height: 96 },
  { id: "5x9", label: "5 × 9 ft table", width: 60, height: 108 },
  { id: "8x12", label: "8 × 12 ft room", width: 96, height: 144 },
];

function matchPreset(width: number, height: number): string {
  return (
    PRESETS.find((preset) => preset.width === width && preset.height === height)?.id ??
    "custom"
  );
}

export function StatsPanel({
  doc,
  built,
  selected,
  onRemove,
  onLaneCount,
  onTable,
}: Props) {
  const [width, setWidth] = useState(doc.table?.width ?? 36);
  const [height, setHeight] = useState(doc.table?.height ?? 80);

  useEffect(() => {
    setWidth(doc.table?.width ?? 36);
    setHeight(doc.table?.height ?? 80);
  }, [doc.table?.width, doc.table?.height]);

  const preset = matchPreset(width, height);
  const selectedPiece = built.placed.find(
    (piece) => piece.placement.id === selected,
  );

  const commitTable = (nextWidth: number, nextHeight: number) => {
    if (nextWidth > 0 && nextHeight > 0) onTable(nextWidth, nextHeight);
  };

  return (
    <aside className="inspector panel">
      <div className="panel-head">
        <div>
          <h2>Layout</h2>
          <span className="muted">{built.totalPieces} pieces</span>
        </div>
        <span className={built.closure.closed ? "badge good" : "badge bad"}>
          {built.closure.closed ? "closed" : "open"}
        </span>
      </div>

      <div className="inspector-scroll">
        <section className="block">
          <div className="row">
            <label htmlFor="lanes">Lanes</label>
            <select
              id="lanes"
              value={doc.laneCount}
              onChange={(event) => onLaneCount(Number(event.target.value))}
            >
              {[2, 4, 6, 8].map((count) => (
                <option key={count} value={count}>
                  {count}
                </option>
              ))}
            </select>
          </div>
          <div className="row">
            <label htmlFor="preset">Space</label>
            <select
              id="preset"
              value={preset}
              onChange={(event) => {
                const next = PRESETS.find((item) => item.id === event.target.value);
                if (next) {
                  setWidth(next.width);
                  setHeight(next.height);
                  commitTable(next.width, next.height);
                }
              }}
            >
              {PRESETS.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
              <option value="custom">Custom</option>
            </select>
          </div>
          <div className="row two-inputs">
            <label htmlFor="table-width">Width</label>
            <input
              id="table-width"
              type="number"
              min={6}
              step={1}
              value={width}
              onChange={(event) => setWidth(Number(event.target.value))}
              onBlur={() => commitTable(width, height)}
              onKeyDown={(event) => {
                if (event.key === "Enter") commitTable(width, height);
              }}
            />
            <input
              aria-label="Table height"
              type="number"
              min={6}
              step={1}
              value={height}
              onChange={(event) => setHeight(Number(event.target.value))}
              onBlur={() => commitTable(width, height)}
              onKeyDown={(event) => {
                if (event.key === "Enter") commitTable(width, height);
              }}
            />
          </div>
        </section>

        <section className="block stats">
          <div>
            <span>Footprint</span>
            <strong>
              {formatInches(built.bounds.width, 1)} × {formatInches(built.bounds.height, 1)}
            </strong>
          </div>
          <div>
            <span>Table</span>
            <strong className={built.tableFit && !built.tableFit.fits ? "warn-text" : ""}>
              {built.tableFit
                ? built.tableFit.fits
                  ? "fits"
                  : `over by ${built.tableFit.overflowX.toFixed(1)} × ${built.tableFit.overflowY.toFixed(1)} in`
                : "not set"}
            </strong>
          </div>
          <div>
            <span>Closure gap</span>
            <strong>{formatInches(built.closure.gap, 2)}</strong>
          </div>
          <div>
            <span>Lane delta</span>
            <strong className={built.laneDelta > 6 ? "warn-text" : ""}>
              {formatDelta(built.laneDelta)}
            </strong>
          </div>
        </section>

        <section className="block">
          <h3>Lane lengths</h3>
          <table className="data">
            <thead>
              <tr>
                <th>Lane</th>
                <th>Offset</th>
                <th>Length</th>
              </tr>
            </thead>
            <tbody>
              {built.lanes.map((lane) => (
                <tr key={lane.lane}>
                  <td>{lane.lane + 1}</td>
                  <td>{lane.offset.toFixed(2)} in</td>
                  <td title={`${lane.length.toFixed(2)} in`}>
                    {formatLength(lane.length)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="block">
          <h3>Bill of materials</h3>
          <table className="data">
            <thead>
              <tr>
                <th>Qty</th>
                <th>Piece</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {built.bom.map((line) => (
                <tr key={line.pieceId}>
                  <td>{line.count}</td>
                  <td>{line.label}</td>
                  <td className="check">{line.verified ? "" : "check"}</td>
                </tr>
              ))}
              {built.bom.length === 0 && (
                <tr>
                  <td colSpan={3} className="muted">
                    No pieces yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>

        {selectedPiece && (
          <section className="block selected-piece">
            <h3>Selected</h3>
            <p className="strong">{selectedPiece.spec.label}</p>
            <p className="muted">
              #{selectedPiece.index + 1} · {selectedPiece.spec.kind}
              {selectedPiece.spec.verified ? "" : " · unverified"}
            </p>
            {selectedPiece.spec.note && (
              <p className="note-text">{selectedPiece.spec.note}</p>
            )}
            <button className="danger" onClick={onRemove}>
              Remove piece
            </button>
          </section>
        )}

        <section className="block">
          <h3>Checks</h3>
          <ul className="issues">
            {built.issues.map((issue, index) => (
              <li key={index} className={issue.level}>
                {issue.message}
              </li>
            ))}
            {built.issues.length === 0 && <li className="ok">No issues found.</li>}
          </ul>
        </section>
      </div>
    </aside>
  );
}
