import { useState } from "react";
import type { BuiltTrack } from "@slotforge/core";
import { downloadSvg } from "../lib/render";
import { downloadJson } from "../lib/storage";

interface Props {
  built: BuiltTrack;
  onPrint: (paper: "a4" | "letter") => void;
}

function check(ok: boolean, label: string, detail: string) {
  return (
    <li className={ok ? "ok" : "warn"}>
      <span>{ok ? "OK" : "CHECK"}</span>
      <div>
        <strong>{label}</strong>
        <p>{detail}</p>
      </div>
    </li>
  );
}

export function BuildPanel({ built, onPrint }: Props) {
  const [paper, setPaper] = useState<"a4" | "letter">("a4");

  const unverified = built.bom.filter((line) => !line.verified);
  const closed = built.closure.closed;
  const fits = built.tableFit?.fits ?? true;
  const balanced = built.laneDelta <= 6;

  return (
    <div className="build-panel">
      <div className="build-grid">
        <section className="card">
          <h2>Build sheet</h2>
          <p>
            Tiled 1:1 templates with registration marks, cut lines, lane lines,
            assembly order and a bill of materials.
          </p>
          <div className="row">
            <label htmlFor="paper">Paper</label>
            <select
              id="paper"
              value={paper}
              onChange={(event) => setPaper(event.target.value as "a4" | "letter")}
            >
              <option value="a4">A4</option>
              <option value="letter">US Letter</option>
            </select>
          </div>
          <div className="button-row">
            <button className="primary" onClick={() => onPrint(paper)}>
              Print 1:1
            </button>
            <button onClick={() => downloadSvg(built, built.doc.name)}>
              Download SVG
            </button>
            <button onClick={() => downloadJson(built.doc)}>Download JSON</button>
          </div>
          <p className="note-text">
            Print at 100%, not "fit to page". Check the 1 inch square on the first
            sheet with a ruler before cutting card.
          </p>
        </section>

        <section className="card">
          <h2>Ready to build</h2>
          <ul className="checklist">
            {check(
              closed,
              "Loop closes",
              closed
                ? "The last piece meets the start within tolerance."
                : `Still open by ${built.closure.gap.toFixed(2)} in. Add or swap pieces.`,
            )}
            {check(
              fits,
              "Fits the table",
              built.tableFit
                ? built.tableFit.fits
                  ? "Track and run-off fit inside the table outline."
                  : `Overflows by ${built.tableFit.overflowX.toFixed(1)} × ${built.tableFit.overflowY.toFixed(1)} in.`
                : "No table size set.",
            )}
            {check(
              balanced,
              "Lane lengths",
              balanced
                ? "Lane lengths are within 6 inches."
                : `Lane delta is ${built.laneDelta.toFixed(1)} in. Add a crossover or accept a handicap.`,
            )}
            {check(
              unverified.length === 0,
              "Verified parts",
              unverified.length === 0
                ? "Every part in the BOM has confirmed dimensions."
                : `${unverified.map((line) => line.label).join(", ")} need checking against your stock.`,
            )}
          </ul>
        </section>
      </div>

      <section className="card">
        <h2>Assembly order</h2>
        <div className="order-list">
          {built.placed.map((piece, index) => (
            <div key={piece.placement.id} className="order-item">
              <span className="order-number">{index + 1}</span>
              <span>{piece.spec.label}</span>
              <span className="muted">
                {piece.spec.verified ? "" : "check dimensions"}
              </span>
            </div>
          ))}
          {built.placed.length === 0 && <p className="muted">No pieces yet.</p>}
        </div>
      </section>

      <section className="card">
        <h2>Before you cut</h2>
        <ol className="steps">
          <li>Lay out the real pieces on the table first. Track joints have tolerance.</li>
          <li>Mark the start/finish and power terminal positions on the base.</li>
          <li>Leave 2 to 3 inches of run-off outside the track for crashes.</li>
          <li>If you print card, use 1.5 mm greyboard under the template for stiffness.</li>
          <li>For a 4-lane build, add a power tap every 15 to 20 ft of lane.</li>
        </ol>
      </section>
    </div>
  );
}
