import { useCallback, useEffect, useMemo, useReducer, useState } from "react";
import {
  buildTrack,
  defaultLaneOffsets,
  emptyDoc,
  starterOval,
  type TrackDoc,
} from "@slotforge/core";
import { loadDoc, saveDoc } from "./storage";

interface State {
  doc: TrackDoc;
  past: TrackDoc[];
}

type Action =
  | { type: "add"; pieceId: string; id: string }
  | { type: "remove"; id: string }
  | { type: "clear" }
  | { type: "undo" }
  | { type: "load"; doc: TrackDoc }
  | { type: "laneCount"; count: number }
  | { type: "table"; table?: { width: number; height: number } }
  | { type: "rename"; name: string };

const HISTORY_LIMIT = 80;

function uid(): string {
  return Math.random().toString(36).slice(2, 9);
}

function commit(state: State, doc: TrackDoc): State {
  return {
    doc,
    past: [...state.past, state.doc].slice(-HISTORY_LIMIT),
  };
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "add":
      return commit(state, {
        ...state.doc,
        pieces: [...state.doc.pieces, { id: action.id, pieceId: action.pieceId }],
      });
    case "remove":
      return commit(state, {
        ...state.doc,
        pieces: state.doc.pieces.filter((piece) => piece.id !== action.id),
      });
    case "clear":
      return commit(state, { ...state.doc, pieces: [] });
    case "undo": {
      const previous = state.past[state.past.length - 1];
      if (!previous) return state;
      return { doc: previous, past: state.past.slice(0, -1) };
    }
    case "load":
      return commit(state, action.doc);
    case "laneCount":
      return commit(state, {
        ...state.doc,
        laneCount: action.count,
        laneOffsets: defaultLaneOffsets(action.count),
      });
    case "table":
      return commit(state, { ...state.doc, table: action.table });
    case "rename":
      return { ...state, doc: { ...state.doc, name: action.name } };
    default:
      return state;
  }
}

export function useTrack() {
  const [state, dispatch] = useReducer(reducer, undefined, () => ({
    doc: loadDoc(),
    past: [],
  }));
  const [selected, setSelected] = useState<string | null>(null);
  const [fitSignal, setFitSignal] = useState(1);

  const built = useMemo(() => buildTrack(state.doc), [state.doc]);

  useEffect(() => {
    saveDoc(state.doc);
  }, [state.doc]);

  const addPiece = useCallback((pieceId: string) => {
    const id = `${pieceId}-${uid()}`;
    dispatch({ type: "add", pieceId, id });
    setSelected(id);
  }, []);

  const removeSelected = useCallback(() => {
    if (!selected) return;
    dispatch({ type: "remove", id: selected });
    setSelected(null);
  }, [selected]);

  const clear = useCallback(() => {
    dispatch({ type: "clear" });
    setSelected(null);
    setFitSignal((value) => value + 1);
  }, []);

  const undo = useCallback(() => {
    dispatch({ type: "undo" });
    setSelected(null);
  }, []);

  const load = useCallback((doc: TrackDoc) => {
    dispatch({ type: "load", doc });
    setSelected(null);
    setFitSignal((value) => value + 1);
  }, []);

  const newTrack = useCallback(() => {
    load(emptyDoc("New track"));
  }, [load]);

  const resetStarter = useCallback(() => {
    load(starterOval());
  }, [load]);

  const setLaneCount = useCallback((count: number) => {
    dispatch({ type: "laneCount", count });
  }, []);

  const setTable = useCallback((width: number, height: number) => {
    dispatch({ type: "table", table: { width, height } });
  }, []);

  const rename = useCallback((name: string) => {
    dispatch({ type: "rename", name });
  }, []);

  const requestFit = useCallback(() => {
    setFitSignal((value) => value + 1);
  }, []);

  return {
    doc: state.doc,
    built,
    selected,
    setSelected,
    addPiece,
    removeSelected,
    clear,
    undo,
    canUndo: state.past.length > 0,
    load,
    newTrack,
    resetStarter,
    setLaneCount,
    setTable,
    rename,
    requestFit,
    fitSignal,
  };
}
