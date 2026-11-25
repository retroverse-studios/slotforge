import { useEffect, useMemo, useRef, useState } from "react";
import {
  createSeason,
  nextUnresolvedHeat,
  pointsFor,
  standings,
  type Heat,
  type Season,
} from "./lib/format";
import {
  downloadSeason,
  loadSeason,
  readSeasonFile,
  saveSeason,
} from "./lib/storage";

const DEMO = ["Alex", "Sam", "Jo", "Riley"];

function parseNames(value: string): string[] {
  const seen = new Set<string>();
  return value
    .split(/[\n,]+/)
    .map((name) => name.trim())
    .filter((name) => {
      if (!name) return false;
      const key = name.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

export default function App() {
  const [season, setSeason] = useState<Season | null>(() => loadSeason());
  const [selectedId, setSelectedId] = useState<string | null>(() => {
    const loaded = loadSeason();
    if (!loaded) return null;
    return nextUnresolvedHeat(loaded, null) ?? loaded.heats[0]?.id ?? null;
  });
  const [order, setOrder] = useState<string[]>(() => {
    const loaded = loadSeason();
    if (!loaded) return [];
    const id = nextUnresolvedHeat(loaded, null) ?? loaded.heats[0]?.id;
    return id ? (loaded.results[id] ?? []) : [];
  });

  const [namesText, setNamesText] = useState(DEMO.join("\n"));
  const [lanes, setLanes] = useState(4);
  const [rounds, setRounds] = useState(4);
  const [seasonName, setSeasonName] = useState("Saturday night");
  const fileInput = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (season) saveSeason(season);
  }, [season]);

  const selectedHeat = season?.heats.find((heat) => heat.id === selectedId) ?? null;
  const table = useMemo(() => (season ? standings(season) : []), [season]);

  const driversById = useMemo(() => {
    const map = new Map<string, string>();
    for (const driver of season?.drivers ?? []) map.set(driver.id, driver.name);
    return map;
  }, [season]);

  const roundsList = useMemo(() => {
    const map = new Map<number, Heat[]>();
    for (const heat of season?.heats ?? []) {
      const list = map.get(heat.round) ?? [];
      list.push(heat);
      map.set(heat.round, list);
    }
    return [...map.entries()].sort(([a], [b]) => a - b);
  }, [season]);

  const completed = season
    ? season.heats.filter((heat) => season.results[heat.id]?.length).length
    : 0;
  const totalHeats = season?.heats.length ?? 0;

  const startSeason = () => {
    const names = parseNames(namesText);
    if (names.length < 2) return;
    const safeLanes = [2, 4, 6, 8].includes(lanes) ? lanes : 4;
    const safeRounds = Math.min(20, Math.max(1, Math.floor(rounds) || 1));
    const next = createSeason(seasonName || "Race night", names, safeLanes, safeRounds);
    setSeason(next);
    setSelectedId(next.heats[0]?.id ?? null);
    setOrder([]);
  };

  const demoSeason = () => {
    setNamesText(DEMO.join("\n"));
    const next = createSeason("Saturday night", DEMO, 4, 4);
    setSeason(next);
    setSelectedId(next.heats[0]?.id ?? null);
    setOrder([]);
  };

  const selectHeat = (id: string) => {
    if (!season) return;
    setSelectedId(id);
    setOrder(season.results[id] ?? []);
  };

  const toggleDriver = (driverId: string) => {
    setOrder((current) =>
      current.includes(driverId)
        ? current.filter((id) => id !== driverId)
        : [...current, driverId],
    );
  };

  const saveResult = () => {
    if (!season || !selectedHeat || order.length === 0) return;
    const updated: Season = {
      ...season,
      results: { ...season.results, [selectedHeat.id]: order },
    };
    setSeason(updated);
    const next = nextUnresolvedHeat(updated, selectedHeat.id);
    if (next) {
      setSelectedId(next);
      setOrder(updated.results[next] ?? []);
    }
  };

  const clearResult = () => {
    if (!season || !selectedHeat) return;
    const results = { ...season.results };
    delete results[selectedHeat.id];
    setSeason({ ...season, results });
    setOrder([]);
  };

  const rename = (name: string) => {
    if (!season) return;
    setSeason({ ...season, name });
  };

  const importSeason = async (file: File | undefined) => {
    if (!file) return;
    try {
      const next = await readSeasonFile(file);
      setSeason(next);
      const id = nextUnresolvedHeat(next, null) ?? next.heats[0]?.id ?? null;
      setSelectedId(id);
      setOrder(id ? (next.results[id] ?? []) : []);
    } catch (error) {
      window.alert(`Could not read that season file. ${String(error)}`);
    }
  };

  if (!season) {
    return (
      <div className="setup">
        <div className="setup-card">
          <div className="brand">
            <img src="/icon.svg" alt="" className="brand-mark" />
            <div>
              <strong>SlotForge</strong>
              <span>Race</span>
            </div>
          </div>
          <h1>Race night, organised.</h1>
          <p className="lede">
            Heats, lane rotation, points and a standings table. No account, no
            cloud. Everything stays in this browser until you export it.
          </p>

          <label className="field">
            <span>Season name</span>
            <input
              value={seasonName}
              onChange={(event) => setSeasonName(event.target.value)}
            />
          </label>

          <label className="field">
            <span>Drivers, one per line or comma separated</span>
            <textarea
              rows={5}
              value={namesText}
              onChange={(event) => setNamesText(event.target.value)}
            />
          </label>

          <div className="field-row">
            <label className="field">
              <span>Lanes</span>
              <select
                value={lanes}
                onChange={(event) => setLanes(Number(event.target.value))}
              >
                {[2, 4, 6, 8].map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Rounds</span>
              <input
                type="number"
                min={1}
                max={20}
                value={rounds}
                onChange={(event) => setRounds(Number(event.target.value))}
              />
            </label>
          </div>

          <div className="button-row">
            <button
              className="primary"
              onClick={startSeason}
              disabled={parseNames(namesText).length < 2}
            >
              Generate season
            </button>
            <button onClick={demoSeason}>Load demo</button>
          </div>

          <p className="hint">
            4 drivers, 4 lanes, 4 rounds gives every driver every lane exactly once.
            With more drivers the field splits into heats and rotates each round.
          </p>

          <button
            className="link"
            onClick={() => fileInput.current?.click()}
          >
            Open a saved season
          </button>
          <input
            ref={fileInput}
            type="file"
            accept=".json,application/json"
            hidden
            onChange={(event) => {
              void importSeason(event.target.files?.[0]);
              event.target.value = "";
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <img src="/icon.svg" alt="" className="brand-mark" />
          <div>
            <strong>SlotForge</strong>
            <span>Race</span>
          </div>
        </div>

        <input
          className="season-name"
          value={season.name}
          aria-label="Season name"
          onChange={(event) => rename(event.target.value)}
        />

        <div className="progress-wrap" title={`${completed} of ${totalHeats} heats`}>
          <div className="progress">
            <span style={{ width: `${totalHeats ? (completed / totalHeats) * 100 : 0}%` }} />
          </div>
          <span className="muted">
            {completed}/{totalHeats} heats
          </span>
        </div>

        <div className="actions">
          <button onClick={() => downloadSeason(season)}>Export</button>
          <button onClick={() => fileInput.current?.click()}>Open</button>
          <button
            onClick={() => {
              setSeason(null);
              setSelectedId(null);
              setOrder([]);
            }}
          >
            New season
          </button>
          <input
            ref={fileInput}
            type="file"
            accept=".json,application/json"
            hidden
            onChange={(event) => {
              void importSeason(event.target.files?.[0]);
              event.target.value = "";
            }}
          />
        </div>
      </header>

      <div className="workspace">
        <aside className="panel rounds">
          <div className="panel-head">
            <h2>Heats</h2>
            <span className="muted">{season.drivers.length} drivers</span>
          </div>
          <div className="rounds-scroll">
            {roundsList.map(([round, heats]) => (
              <section key={round} className="round-block">
                <h3>Round {round}</h3>
                <div className="heat-list">
                  {heats.map((heat) => {
                    const done = Boolean(season.results[heat.id]?.length);
                    return (
                      <button
                        key={heat.id}
                        className={`heat-button ${heat.id === selectedId ? "active" : ""} ${done ? "done" : ""}`}
                        onClick={() => selectHeat(heat.id)}
                      >
                        <span>Heat {heat.heat}</span>
                        <span className="heat-meta">
                          {heat.assignments.length} lanes
                        </span>
                        <span className={done ? "status done" : "status"} />
                      </button>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        </aside>

        <main className="race">
          {selectedHeat ? (
            <div className="heat-card">
              <div className="heat-head">
                <div>
                  <span className="eyebrow">
                    Round {selectedHeat.round} · Heat {selectedHeat.heat}
                  </span>
                  <h1>Record the finish</h1>
                </div>
                {season.results[selectedHeat.id]?.length ? (
                  <span className="badge good">saved</span>
                ) : (
                  <span className="badge">in progress</span>
                )}
              </div>

              <p className="lede">
                Click drivers in the order they crossed the line. Click a driver
                again to remove them. Fewer than a full field is a DNF.
              </p>

              <div className="lanes">
                {selectedHeat.assignments.map((assignment) => {
                  const position = order.indexOf(assignment.driverId);
                  return (
                    <button
                      key={assignment.driverId}
                      className={`lane ${position >= 0 ? "picked" : ""}`}
                      onClick={() => toggleDriver(assignment.driverId)}
                    >
                      <span className="lane-no">Lane {assignment.lane + 1}</span>
                      <span className="lane-name">
                        {driversById.get(assignment.driverId) ?? assignment.driverId}
                      </span>
                      <span className="lane-place">
                        {position >= 0 ? `P${position + 1}` : "—"}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="finish">
                <h2>Finish order</h2>
                {order.length === 0 ? (
                  <p className="muted">Nothing recorded yet.</p>
                ) : (
                  <div className="finish-list">
                    {order.map((driverId, index) => (
                      <div key={driverId} className="finish-row">
                        <span className="place">{index + 1}</span>
                        <span>{driversById.get(driverId) ?? driverId}</span>
                        <span className="pts">{pointsFor(index)} pts</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="button-row">
                <button
                  className="primary"
                  onClick={saveResult}
                  disabled={order.length === 0}
                >
                  Save result
                </button>
                <button
                  onClick={clearResult}
                  disabled={!season.results[selectedHeat.id]?.length && order.length === 0}
                >
                  Clear
                </button>
                <button
                  onClick={() => {
                    const next = nextUnresolvedHeat(season, selectedHeat.id);
                    if (next) selectHeat(next);
                  }}
                >
                  Next unresolved
                </button>
              </div>

              {nextUnresolvedHeat(season, selectedHeat.id) === null && (
                <p className="done-note">
                  Every heat has a result. The standings on the right are final
                  until you edit a heat.
                </p>
              )}
            </div>
          ) : (
            <div className="empty">No heat selected.</div>
          )}
        </main>

        <aside className="panel standings">
          <div className="panel-head">
            <h2>Standings</h2>
            <span className="muted">{completed ? "live" : "not started"}</span>
          </div>
          <div className="standings-scroll">
            <table className="data">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Driver</th>
                  <th>Pts</th>
                  <th>W</th>
                  <th>Starts</th>
                  <th>Best</th>
                </tr>
              </thead>
              <tbody>
                {table.map((row, index) => (
                  <tr key={row.driverId} className={index === 0 && row.points > 0 ? "leader" : ""}>
                    <td>{index + 1}</td>
                    <td>{row.name}</td>
                    <td className="strong">{row.points}</td>
                    <td>{row.wins}</td>
                    <td>{row.starts}</td>
                    <td>{row.bestFinish ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {table.length === 0 && <p className="muted">No drivers.</p>}
          </div>
          <div className="panel-foot">
            Local only. Results live in this browser. Export to keep them.
          </div>
        </aside>
      </div>

      <footer className="statusbar">
        <span className="dot good" />
        <span>Local race control</span>
        <span className="sep" />
        <span>{season.drivers.length} drivers</span>
        <span className="sep" />
        <span>{season.laneCount} lanes</span>
        <span className="sep" />
        <span>{season.rounds} rounds</span>
        <span className="grow" />
        <span className="muted">Next: IR beam timing and live phone leaderboard</span>
      </footer>
    </div>
  );
}
