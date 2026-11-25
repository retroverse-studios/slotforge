export interface Driver {
  id: string;
  name: string;
}

export interface HeatAssignment {
  lane: number;
  driverId: string;
}

export interface Heat {
  id: string;
  round: number;
  heat: number;
  assignments: HeatAssignment[];
}

export interface Season {
  schema: "slotforge/season@1";
  id: string;
  name: string;
  laneCount: number;
  rounds: number;
  drivers: Driver[];
  heats: Heat[];
  results: Record<string, string[]>;
  createdAt: string;
}

export interface Standing {
  driverId: string;
  name: string;
  points: number;
  wins: number;
  podiums: number;
  starts: number;
  bestFinish: number | null;
  averageFinish: number | null;
}

export const DEFAULT_POINTS = [10, 8, 6, 5, 4, 3, 2, 1];

export function pointsFor(position: number, table: number[] = DEFAULT_POINTS): number {
  return table[position] ?? 0;
}

export function generateSchedule(
  driverIds: string[],
  laneCount: number,
  rounds: number,
): Heat[] {
  if (driverIds.length === 0) return [];
  const lanes = Math.max(2, Math.floor(laneCount));
  const heats: Heat[] = [];

  for (let round = 0; round < rounds; round += 1) {
    const rotated = driverIds.map(
      (_, index) => driverIds[(index + round) % driverIds.length]!,
    );
    const heatCount = Math.ceil(rotated.length / lanes);
    for (let heat = 0; heat < heatCount; heat += 1) {
      const chunk = rotated.slice(heat * lanes, (heat + 1) * lanes);
      heats.push({
        id: `r${round + 1}-h${heat + 1}`,
        round: round + 1,
        heat: heat + 1,
        assignments: chunk.map((driverId, lane) => ({ lane, driverId })),
      });
    }
  }

  return heats;
}

export function standings(season: Season): Standing[] {
  const rows = new Map<string, Standing>();

  for (const driver of season.drivers) {
    rows.set(driver.id, {
      driverId: driver.id,
      name: driver.name,
      points: 0,
      wins: 0,
      podiums: 0,
      starts: 0,
      bestFinish: null,
      averageFinish: null,
    });
  }

  const finishTotals = new Map<string, { sum: number; count: number }>();

  for (const heat of season.heats) {
    const result = season.results[heat.id];
    if (!result || result.length === 0) continue;
    for (const assignment of heat.assignments) {
      const row = rows.get(assignment.driverId);
      if (!row) continue;
      row.starts += 1;
      const position = result.indexOf(assignment.driverId);
      if (position < 0) continue;
      row.points += pointsFor(position);
      if (position === 0) row.wins += 1;
      if (position < 3) row.podiums += 1;
      if (row.bestFinish === null || position + 1 < row.bestFinish) {
        row.bestFinish = position + 1;
      }
      const totals = finishTotals.get(assignment.driverId) ?? { sum: 0, count: 0 };
      totals.sum += position + 1;
      totals.count += 1;
      finishTotals.set(assignment.driverId, totals);
    }
  }

  return [...rows.values()]
    .map((row) => {
      const totals = finishTotals.get(row.driverId);
      return {
        ...row,
        averageFinish: totals && totals.count > 0 ? totals.sum / totals.count : null,
      };
    })
    .sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.wins !== a.wins) return b.wins - a.wins;
      if (b.podiums !== a.podiums) return b.podiums - a.podiums;
      const aBest = a.bestFinish ?? Infinity;
      const bBest = b.bestFinish ?? Infinity;
      if (aBest !== bBest) return aBest - bBest;
      return a.name.localeCompare(b.name);
    });
}

export function nextUnresolvedHeat(
  season: Season,
  currentId: string | null,
): string | null {
  if (season.heats.length === 0) return null;
  const currentIndex = currentId
    ? season.heats.findIndex((heat) => heat.id === currentId)
    : -1;
  for (let offset = 1; offset <= season.heats.length; offset += 1) {
    const index = (currentIndex + offset + season.heats.length) % season.heats.length;
    const heat = season.heats[index];
    if (heat && !season.results[heat.id]?.length) return heat.id;
  }
  return null;
}

export function createSeason(
  name: string,
  driverNames: string[],
  laneCount: number,
  rounds: number,
): Season {
  const drivers: Driver[] = driverNames.map((driverName, index) => ({
    id: `d${index + 1}`,
    name: driverName,
  }));
  const heats = generateSchedule(
    drivers.map((driver) => driver.id),
    laneCount,
    rounds,
  );

  return {
    schema: "slotforge/season@1",
    id: Math.random().toString(36).slice(2, 9),
    name,
    laneCount,
    rounds,
    drivers,
    heats,
    results: {},
    createdAt: new Date().toISOString(),
  };
}

export function parseSeason(input: unknown): Season {
  if (!input || typeof input !== "object") throw new Error("Not a season file");
  const season = input as Season;
  if (season.schema !== "slotforge/season@1") throw new Error("Unknown season schema");
  if (!Array.isArray(season.drivers) || !Array.isArray(season.heats)) {
    throw new Error("Season is missing drivers or heats");
  }
  if (!season.results || typeof season.results !== "object") {
    throw new Error("Season is missing results");
  }
  return season;
}
