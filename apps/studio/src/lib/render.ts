import type { BuiltTrack, Vec2 } from "@slotforge/core";
import { slug } from "./storage";

type Paper = "a4" | "letter";

interface PaperSpec {
  name: string;
  pageWidth: number;
  pageHeight: number;
  margin: number;
  sheetWidth: number;
  sheetHeight: number;
}

const PAPERS: Record<Paper, PaperSpec> = {
  a4: {
    name: "A4",
    pageWidth: 8.27,
    pageHeight: 11.69,
    margin: 0.25,
    sheetWidth: 7.77,
    sheetHeight: 11.19,
  },
  letter: {
    name: "US Letter",
    pageWidth: 8.5,
    pageHeight: 11,
    margin: 0.25,
    sheetWidth: 8,
    sheetHeight: 10.5,
  },
};

function num(value: number): string {
  return Number(value.toFixed(4)).toString();
}

function pointsAttr(points: Vec2[]): string {
  return points.map((point) => `${num(point.x)},${num(point.y)}`).join(" ");
}

export function exportSvg(built: BuiltTrack): string {
  const pad = 1;
  const minX = built.bounds.minX - pad;
  const maxY = built.bounds.maxY + pad;
  const width = built.bounds.width + pad * 2;
  const height = built.bounds.height + pad * 2;

  const project = (point: Vec2): Vec2 => ({
    x: point.x - minX,
    y: maxY - point.y,
  });

  const surfaces = built.placed
    .map((piece) => {
      const points = piece.surface.map(project);
      return `<polygon points="${pointsAttr(points)}" class="surface" />`;
    })
    .join("\n");

  const laneLines = built.lanes
    .map((lane) => {
      const points = lane.points.map(project);
      return `<polyline points="${pointsAttr(points)}" class="lane" />`;
    })
    .join("\n");

  const startA = project({ x: 0, y: -built.surfaceHalfWidth });
  const startB = project({ x: 0, y: built.surfaceHalfWidth });

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${num(width)}in" height="${num(height)}in" viewBox="0 0 ${num(width)} ${num(height)}">
  <style>
    .surface { fill: #262a31; stroke: #4b5563; stroke-width: 0.03; }
    .lane { fill: none; stroke: #9ca3af; stroke-width: 0.015; stroke-dasharray: 0.18 0.12; }
    .start { stroke: #f87171; stroke-width: 0.12; stroke-dasharray: 0.15 0.15; }
  </style>
  ${surfaces}
  ${laneLines}
  <line x1="${num(startA.x)}" y1="${num(startA.y)}" x2="${num(startB.x)}" y2="${num(startB.y)}" class="start" />
</svg>`;
}

export function downloadSvg(built: BuiltTrack, name: string): void {
  const blob = new Blob([exportSvg(built)], { type: "image/svg+xml" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${slug(name)}.svg`;
  anchor.click();
  URL.revokeObjectURL(url);
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildPrintDocument(built: BuiltTrack, paper: Paper = "a4"): string {
  const spec = PAPERS[paper];
  const inset = 0.5;
  const maxY = built.bounds.maxY;
  const project = (point: Vec2): Vec2 => ({
    x: point.x - built.bounds.minX + inset,
    y: maxY - point.y + inset,
  });

  const contentWidth = built.bounds.width + inset * 2;
  const contentHeight = built.bounds.height + inset * 2;
  const cols = Math.max(1, Math.ceil(contentWidth / spec.sheetWidth));
  const rows = Math.max(1, Math.ceil(contentHeight / spec.sheetHeight));

  const surfaces = built.placed
    .map((piece) => `<polygon points="${pointsAttr(piece.surface.map(project))}" class="cut" />`)
    .join("");
  const lanes = built.lanes
    .map(
      (lane) =>
        `<polyline points="${pointsAttr(lane.points.map(project))}" class="lane" />`,
    )
    .join("");

  const labels = built.placed
    .map((piece, index) => {
      const point = piece.points[Math.floor(piece.points.length / 2)];
      if (!point) return "";
      const label = project(point);
      return `<text x="${num(label.x)}" y="${num(label.y + 0.35)}" class="pieceLabel">${index + 1}</text>`;
    })
    .join("");

  const start = project({ x: 0, y: 0 });

  const tiles: string[] = [];
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const x = col * spec.sheetWidth;
      const y = row * spec.sheetHeight;
      tiles.push(`<section class="page">
  <div class="sheet">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="${num(x)} ${num(y)} ${num(spec.sheetWidth)} ${num(spec.sheetHeight)}" preserveAspectRatio="none">
      <g>${surfaces}${lanes}${labels}</g>
      <line x1="${num(start.x)}" y1="${num(start.y - built.surfaceHalfWidth)}" x2="${num(start.x)}" y2="${num(start.y + built.surfaceHalfWidth)}" class="start" />
      <path d="M0.15 0.5 V0.15 H0.5 M${num(spec.sheetWidth - 0.5)} 0.15 H${num(spec.sheetWidth - 0.15)} V0.5 M${num(spec.sheetWidth - 0.15)} ${num(spec.sheetHeight - 0.5)} V${num(spec.sheetHeight - 0.15)} H${num(spec.sheetWidth - 0.5)} M0.5 ${num(spec.sheetHeight - 0.15)} H0.15 V${num(spec.sheetHeight - 0.5)}" class="reg" />
    </svg>
    <div class="tileLabel">${escapeHtml(built.doc.name)} · tile ${row + 1},${col + 1} of ${rows},${cols} · ${spec.name} · 1:1</div>
  </div>
</section>`);
    }
  }

  const bomRows = built.bom
    .map(
      (line) =>
        `<tr><td>${line.count}</td><td>${escapeHtml(line.label)}</td><td>${line.verified ? "" : "check"}</td></tr>`,
    )
    .join("");

  const orderRows = built.placed
    .map(
      (piece, index) =>
        `<tr><td>${index + 1}</td><td>${escapeHtml(piece.spec.label)}</td><td>${piece.spec.verified ? "" : "unverified"}</td></tr>`,
    )
    .join("");

  const laneRows = built.lanes
    .map(
      (lane) =>
        `<tr><td>${lane.lane + 1}</td><td>${lane.length.toFixed(2)} in</td><td>${(lane.length / 12).toFixed(2)} ft</td></tr>`,
    )
    .join("");

  const issues = built.issues
    .map((issue) => `<li class="${issue.level}">${escapeHtml(issue.message)}</li>`)
    .join("");

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>${escapeHtml(built.doc.name)} · SlotForge build sheet</title>
<style>
  @page { size: ${spec.pageWidth}in ${spec.pageHeight}in; margin: 0; }
  * { box-sizing: border-box; }
  body { margin: 0; background: #e5e7eb; font-family: ui-sans-serif, system-ui, -apple-system, sans-serif; color: #111827; }
  .page { width: ${spec.pageWidth}in; height: ${spec.pageHeight}in; padding: ${spec.margin}in; background: #fff; page-break-after: always; position: relative; overflow: hidden; margin: 0 auto 12px; }
  .page:last-child { page-break-after: auto; }
  .sheet { width: 100%; height: 100%; position: relative; overflow: hidden; }
  .sheet svg { width: 100%; height: 100%; display: block; }
  .cut { fill: none; stroke: #111827; stroke-width: 0.03; }
  .lane { fill: none; stroke: #9ca3af; stroke-width: 0.012; stroke-dasharray: 0.12 0.12; }
  .start { stroke: #dc2626; stroke-width: 0.1; stroke-dasharray: 0.12 0.12; }
  .reg { fill: none; stroke: #9ca3af; stroke-width: 0.01; }
  .pieceLabel { font-size: 0.09px; fill: #6b7280; text-anchor: middle; }
  .tileLabel { position: absolute; right: 0; bottom: 0; font-size: 7px; color: #6b7280; }
  h1 { font-size: 22px; margin: 0 0 4px; }
  h2 { font-size: 13px; margin: 18px 0 6px; text-transform: uppercase; letter-spacing: 0.08em; color: #4b5563; }
  p { font-size: 11px; line-height: 1.5; margin: 0 0 6px; }
  .meta { color: #6b7280; font-size: 10px; }
  .preview { margin: 10px 0; border: 1px solid #d1d5db; background: #0f1115; }
  .preview svg { display: block; width: 100%; height: auto; }
  table { width: 100%; border-collapse: collapse; font-size: 10px; }
  th, td { text-align: left; padding: 3px 4px; border-bottom: 1px solid #e5e7eb; }
  th { color: #6b7280; font-weight: 600; }
  ul { margin: 0; padding-left: 16px; font-size: 10px; }
  li.warn::marker { color: #d97706; }
  li.error::marker { color: #dc2626; }
  li.info::marker { color: #2563eb; }
  .note { background: #fef3c7; border-left: 3px solid #f59e0b; padding: 8px 10px; font-size: 10px; margin: 10px 0; }
  .two { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  @media screen { body { padding: 20px 0; } }
</style>
</head>
<body>
<section class="page">
  <h1>${escapeHtml(built.doc.name)}</h1>
  <p class="meta">SlotForge build sheet · ${built.doc.laneCount} lanes · ${built.totalPieces} pieces · ${built.bounds.width.toFixed(1)} × ${built.bounds.height.toFixed(1)} in · ${spec.name}</p>
  <div class="note"><strong>Print at 100%.</strong> Turn off "fit to page" and browser headers/footers. Check the 1 inch test square with a ruler before cutting. Sheets are tiled with registration marks.</div>
  <div class="preview">${exportSvg(built)}</div>
  <div class="two">
    <div>
      <h2>Bill of materials</h2>
      <table><thead><tr><th>Qty</th><th>Piece</th><th>Check</th></tr></thead><tbody>${bomRows}</tbody></table>
      <h2>Lane lengths</h2>
      <table><thead><tr><th>Lane</th><th>Length</th><th></th></tr></thead><tbody>${laneRows}</tbody></table>
    </div>
    <div>
      <h2>Assembly order</h2>
      <table><thead><tr><th>#</th><th>Piece</th><th>Note</th></tr></thead><tbody>${orderRows}</tbody></table>
    </div>
  </div>
  <h2>Checks</h2>
  <ul>${issues || "<li class=\"info\">No issues found.</li>"}</ul>
  <p class="meta">Closure: ${built.closure.closed ? "closed" : `open by ${built.closure.gap.toFixed(2)} in`} · Lane delta: ${built.laneDelta.toFixed(2)} in · ${built.tableFit ? (built.tableFit.fits ? "fits table" : "overflows table") : "no table set"}</p>
</section>
${tiles.join("\n")}
</body>
</html>`;
}

export function openPrint(built: BuiltTrack, paper: Paper = "a4"): void {
  const html = buildPrintDocument(built, paper);
  const win = window.open("", "_blank");
  if (!win) {
    window.alert("The print window was blocked. Allow pop-ups for this site and try again.");
    return;
  }
  win.document.open();
  win.document.write(html);
  win.document.close();
  win.focus();
  window.setTimeout(() => win.print(), 600);
}
