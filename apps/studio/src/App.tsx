import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { Canvas2D } from "./components/Canvas2D";
import { Palette } from "./components/Palette";
import { StatsPanel } from "./components/StatsPanel";
import { BuildPanel } from "./components/BuildPanel";
import { useTrack } from "./lib/useTrack";
import { openPrint } from "./lib/render";
import { downloadJson, readJsonFile } from "./lib/storage";
import { formatInches } from "./lib/format";

type Tab = "design" | "3d" | "build";

const Preview3D = lazy(() =>
  import("./components/Preview3D").then((module) => ({ default: module.Preview3D })),
);

export default function App() {
  const {
    doc,
    built,
    selected,
    setSelected,
    addPiece,
    removeSelected,
    clear,
    undo,
    canUndo,
    load,
    newTrack,
    resetStarter,
    setLaneCount,
    setTable,
    rename,
    requestFit,
    fitSignal,
  } = useTrack();

  const [tab, setTab] = useState<Tab>("design");
  const fileInput = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    document.title = `${doc.name} · SlotForge Studio`;
  }, [doc.name]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement
      ) {
        return;
      }
      if (event.key === "Backspace" || event.key === "Delete") {
        event.preventDefault();
        removeSelected();
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "z") {
        event.preventDefault();
        undo();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [removeSelected, undo]);

  const openFile = async (file: File | undefined) => {
    if (!file) return;
    try {
      const next = await readJsonFile(file);
      load(next);
    } catch (error) {
      window.alert(`Could not read that track file. ${String(error)}`);
    }
  };

  const errors = built.issues.filter((issue) => issue.level === "error").length;
  const warnings = built.issues.filter((issue) => issue.level === "warn").length;

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <img src="/icon.svg" alt="" className="brand-mark" />
          <div>
            <strong>SlotForge</strong>
            <span>Studio</span>
          </div>
        </div>

        <input
          className="track-name"
          value={doc.name}
          aria-label="Track name"
          onChange={(event) => rename(event.target.value)}
        />

        <nav className="tabs" aria-label="View">
          <button
            className={tab === "design" ? "active" : ""}
            onClick={() => setTab("design")}
          >
            Design
          </button>
          <button className={tab === "3d" ? "active" : ""} onClick={() => setTab("3d")}>
            3D
          </button>
          <button
            className={tab === "build" ? "active" : ""}
            onClick={() => setTab("build")}
          >
            Build
          </button>
        </nav>

        <div className="actions">
          <button onClick={undo} disabled={!canUndo} title="Undo (Cmd/Ctrl+Z)">
            Undo
          </button>
          {tab === "design" && <button onClick={requestFit}>Fit</button>}
          <button onClick={() => downloadJson(doc)}>Save</button>
          <button onClick={() => fileInput.current?.click()}>Open</button>
          <button onClick={newTrack}>New</button>
          <button onClick={resetStarter} title="Load the starter oval">
            Starter
          </button>
          <input
            ref={fileInput}
            type="file"
            accept=".json,application/json"
            hidden
            onChange={(event) => {
              void openFile(event.target.files?.[0]);
              event.target.value = "";
            }}
          />
        </div>
      </header>

      <div className={`workspace ${tab === "build" ? "build-mode" : ""}`}>
        {tab !== "build" && <Palette onAdd={addPiece} />}

        <main className="stage">
          {tab === "design" && (
            <Canvas2D
              built={built}
              selected={selected}
              onSelect={setSelected}
              fitSignal={fitSignal}
            />
          )}
          {tab === "3d" && (
            <Suspense fallback={<div className="stage-loading">Loading 3D view…</div>}>
              <Preview3D built={built} />
            </Suspense>
          )}
          {tab === "build" && (
            <BuildPanel built={built} onPrint={(paper) => openPrint(built, paper)} />
          )}
        </main>

        <StatsPanel
          doc={doc}
          built={built}
          selected={selected}
          onRemove={removeSelected}
          onLaneCount={setLaneCount}
          onTable={setTable}
        />
      </div>

      <footer className="statusbar">
        <span className={built.closure.closed ? "dot good" : "dot bad"} />
        <span>{built.closure.closed ? "Closed loop" : "Open loop"}</span>
        <span className="sep" />
        <span>{built.totalPieces} pieces</span>
        <span className="sep" />
        <span>
          {formatInches(built.bounds.width, 1)} × {formatInches(built.bounds.height, 1)}
        </span>
        <span className="sep" />
        <span>{doc.laneCount} lanes</span>
        <span className="sep" />
        <span className={warnings ? "warn-text" : ""}>
          {warnings} warnings
        </span>
        {errors > 0 && <span className="error-text">{errors} errors</span>}
        <span className="grow" />
        <span className="muted">
          {built.tableFit
            ? built.tableFit.fits
              ? "Fits table"
              : "Overflows table"
            : "No table set"}
        </span>
        <button className="link" onClick={clear} disabled={built.totalPieces === 0}>
          Clear track
        </button>
      </footer>
    </div>
  );
}
