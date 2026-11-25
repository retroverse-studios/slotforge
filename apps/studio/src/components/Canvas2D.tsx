import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import type { BuiltTrack, Vec2 } from "@slotforge/core";

interface Props {
  built: BuiltTrack;
  selected: string | null;
  onSelect: (id: string | null) => void;
  fitSignal: number;
}

interface View {
  x: number;
  y: number;
  w: number;
  h: number;
}

const PAD = 4;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function pointList(points: Vec2[]): string {
  return points.map((point) => `${point.x.toFixed(3)},${point.y.toFixed(3)}`).join(" ");
}

export function Canvas2D({ built, selected, onSelect, fitSignal }: Props) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const pan = useRef<{ id: number; start: DOMPoint; view: View } | null>(null);
  const dragged = useRef(false);
  const [view, setView] = useState<View>({ x: 0, y: 0, w: 40, h: 40 });

  const table = built.doc.table;

  const world = useMemo(() => {
    if (built.totalPieces > 0) return built.bounds;
    if (!table) return built.bounds;
    const cx = (built.bounds.minX + built.bounds.maxX) / 2;
    const cy = (built.bounds.minY + built.bounds.maxY) / 2;
    return {
      minX: cx - table.width / 2,
      minY: cy - table.height / 2,
      maxX: cx + table.width / 2,
      maxY: cy + table.height / 2,
      width: table.width,
      height: table.height,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [built.bounds, built.totalPieces, table?.width, table?.height]);

  const contentW = Math.max(20, world.width + PAD * 2);
  const contentH = Math.max(20, world.height + PAD * 2);

  const project = useMemo(() => {
    const minX = world.minX - PAD;
    const maxY = world.maxY + PAD;
    return (point: Vec2): Vec2 => ({ x: point.x - minX, y: maxY - point.y });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [world.minX, world.maxX, world.minY, world.maxY]);

  useEffect(() => {
    setView({ x: 0, y: 0, w: contentW, h: contentH });
  }, [fitSignal, contentW, contentH]);

  const zoomAt = (factor: number, anchor: Vec2) => {
    setView((current) => {
      const nextW = clamp(current.w * factor, 4, contentW * 20);
      const ratio = nextW / current.w;
      const nextH = current.h * ratio;
      return {
        x: anchor.x - (anchor.x - current.x) * ratio,
        y: anchor.y - (anchor.y - current.y) * ratio,
        w: nextW,
        h: nextH,
      };
    });
  };

  const zoomCentre = (factor: number) => {
    zoomAt(factor, { x: view.x + view.w / 2, y: view.y + view.h / 2 });
  };

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const matrix = svg.getScreenCTM();
      if (!matrix) return;
      const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(
        matrix.inverse(),
      );
      zoomAt(event.deltaY > 0 ? 1.12 : 0.89, { x: point.x, y: point.y });
    };
    svg.addEventListener("wheel", onWheel, { passive: false });
    return () => svg.removeEventListener("wheel", onWheel);
  }, [contentW]);

  const onPointerDown = (event: ReactPointerEvent<SVGRectElement>) => {
    if (event.button !== 0) return;
    const svg = svgRef.current;
    const matrix = svg?.getScreenCTM();
    if (!matrix) return;
    const start = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse());
    pan.current = { id: event.pointerId, start, view };
    dragged.current = false;
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: ReactPointerEvent<SVGRectElement>) => {
    if (!pan.current) return;
    const svg = svgRef.current;
    const matrix = svg?.getScreenCTM();
    if (!matrix) return;
    const current = new DOMPoint(event.clientX, event.clientY).matrixTransform(
      matrix.inverse(),
    );
    const dx = current.x - pan.current.start.x;
    const dy = current.y - pan.current.start.y;
    if (Math.hypot(dx, dy) > 1) dragged.current = true;
    setView({
      x: pan.current.view.x - dx,
      y: pan.current.view.y - dy,
      w: pan.current.view.w,
      h: pan.current.view.h,
    });
  };

  const onPointerUp = (event: ReactPointerEvent<SVGRectElement>) => {
    if (pan.current?.id === event.pointerId) {
      pan.current = null;
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const gridLines = useMemo(() => {
    const step = 3;
    const lines: { x1: number; y1: number; x2: number; y2: number }[] = [];
    const startX = Math.floor((world.minX - PAD) / step) * step;
    const startY = Math.floor((world.minY - PAD) / step) * step;
    for (let x = startX; x <= world.maxX + PAD; x += step) {
      const a = project({ x, y: world.minY - PAD });
      const b = project({ x, y: world.maxY + PAD });
      lines.push({ x1: a.x, y1: a.y, x2: b.x, y2: b.y });
    }
    for (let y = startY; y <= world.maxY + PAD; y += step) {
      const a = project({ x: world.minX - PAD, y });
      const b = project({ x: world.maxX + PAD, y });
      lines.push({ x1: a.x, y1: a.y, x2: b.x, y2: b.y });
    }
    return lines;
  }, [project, world.minX, world.maxX, world.minY, world.maxY]);

  const tableRect = table
    ? (() => {
        const cx = (built.bounds.minX + built.bounds.maxX) / 2;
        const cy = (built.bounds.minY + built.bounds.maxY) / 2;
        const topLeft = project({ x: cx - table.width / 2, y: cy + table.height / 2 });
        return { x: topLeft.x, y: topLeft.y, w: table.width, h: table.height };
      })()
    : null;

  const startA = project({ x: -0.25, y: -built.surfaceHalfWidth });
  const startB = project({ x: 0.25, y: built.surfaceHalfWidth });
  const startRect = {
    x: Math.min(startA.x, startB.x),
    y: Math.min(startA.y, startB.y),
    w: Math.abs(startB.x - startA.x),
    h: Math.abs(startB.y - startA.y),
  };

  const end = project({ x: built.closure.end.x, y: built.closure.end.y });
  const origin = project({ x: 0, y: 0 });

  return (
    <div className="canvas-wrap">
      <svg
        ref={svgRef}
        className="canvas"
        viewBox={`${view.x} ${view.y} ${view.w} ${view.h}`}
        preserveAspectRatio="xMidYMid meet"
        role="application"
        aria-label="Track design canvas"
      >
        <defs>
          <pattern
            id="checker"
            width="0.5"
            height="0.5"
            patternUnits="userSpaceOnUse"
          >
            <rect width="0.25" height="0.25" fill="#e5e7eb" />
            <rect x="0.25" y="0.25" width="0.25" height="0.25" fill="#e5e7eb" />
            <rect x="0.25" width="0.25" height="0.25" fill="#111827" />
            <rect y="0.25" width="0.25" height="0.25" fill="#111827" />
          </pattern>
        </defs>

        <rect
          x={view.x}
          y={view.y}
          width={view.w}
          height={view.h}
          fill="#0f1115"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onClick={() => {
            if (!dragged.current) onSelect(null);
          }}
        />

        {gridLines.map((line, index) => (
          <line
            key={index}
            x1={line.x1}
            y1={line.y1}
            x2={line.x2}
            y2={line.y2}
            stroke="#1b1f27"
            strokeWidth={0.035}
          />
        ))}

        {tableRect && (
          <rect
            x={tableRect.x}
            y={tableRect.y}
            width={tableRect.w}
            height={tableRect.h}
            fill="none"
            stroke="#3f4652"
            strokeWidth={0.12}
            strokeDasharray="1 0.6"
          />
        )}

        {built.placed.map((piece) => {
          const isSelected = piece.placement.id === selected;
          return (
            <polygon
              key={piece.placement.id}
              points={pointList(piece.surface.map(project))}
              className={isSelected ? "track-piece selected" : "track-piece"}
              onPointerDown={(event) => event.stopPropagation()}
              onClick={(event) => {
                event.stopPropagation();
                onSelect(piece.placement.id);
              }}
            >
              <title>{piece.spec.label}</title>
            </polygon>
          );
        })}

        {built.lanes.map((lane) => (
          <polyline
            key={lane.lane}
            points={pointList(lane.points.map(project))}
            fill="none"
            stroke="#9ca3af"
            strokeWidth={0.045}
            strokeDasharray="0.6 0.45"
            opacity={0.75}
            pointerEvents="none"
          />
        ))}

        <rect
          x={startRect.x}
          y={startRect.y}
          width={startRect.w}
          height={startRect.h}
          fill="url(#checker)"
          stroke="#f87171"
          strokeWidth={0.05}
          pointerEvents="none"
        />

        <text
          x={project({ x: 0.8, y: -built.surfaceHalfWidth - 1 }).x}
          y={project({ x: 0.8, y: -built.surfaceHalfWidth - 1 }).y}
          fill="#f87171"
          fontSize={1.3}
          fontFamily="ui-monospace, monospace"
        >
          S/F
        </text>

        {!built.closure.closed && built.placed.length > 0 && (
          <g pointerEvents="none">
            <line
              x1={end.x}
              y1={end.y}
              x2={origin.x}
              y2={origin.y}
              stroke="#f87171"
              strokeWidth={0.08}
              strokeDasharray="0.4 0.3"
            />
            <circle cx={end.x} cy={end.y} r={0.35} fill="#f87171" />
            <circle cx={origin.x} cy={origin.y} r={0.35} fill="#f87171" />
          </g>
        )}
      </svg>

      <div className="canvas-tools">
        <button onClick={() => zoomCentre(0.8)} title="Zoom in">
          +
        </button>
        <button onClick={() => zoomCentre(1.25)} title="Zoom out">
          -
        </button>
        <button onClick={() => setView({ x: 0, y: 0, w: contentW, h: contentH })}>
          Fit
        </button>
      </div>

      {built.placed.length === 0 && (
        <div className="canvas-empty">
          <strong>Start a layout</strong>
          <span>Pick a straight from the parts list to place the first piece.</span>
        </div>
      )}
    </div>
  );
}
