# SlotForge Race

Race night control for a home slot car track. Heats, lane rotation, points and
standings, with nothing to install and no account.

```bash
npm run dev:race   # http://localhost:5174
```

## Rules used

- Every driver races once per round.
- The field is split into balanced heats, not a full heat plus a tiny one.
- The starting order rotates by one place each round, so a four-driver,
  four-lane, four-round season gives every driver every lane exactly once.
- Points are 10, 8, 6, 5, 4, 3, 2, 1.
- A driver with no recorded finish counts as a start with zero points (DNF).
- Standings break ties by wins, then podiums, then best finish.

## What it does not do yet

- No track file import. Lane count is set in the setup screen.
- No live timing. Results are entered by clicking drivers in finish order.
- No server. State lives in the browser and is exported as JSON.
- No multi-night series accumulation.

The next step is a small local server with SQLite, SSE and a QR join page, then
IR beam events. The event contract is in `services/vision/README.md` and
`docs/architecture.md`.
