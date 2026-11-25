import { describe, expect, it } from "vitest";
import {
  createSeason,
  generateSchedule,
  nextUnresolvedHeat,
  pointsFor,
  standings,
} from "./format";

const drivers = ["a", "b", "c", "d"];

describe("schedule", () => {
  it("gives every driver every lane once over four rounds", () => {
    const heats = generateSchedule(drivers, 4, 4);
    expect(heats).toHaveLength(4);

    const lanesByDriver = new Map<string, number[]>();
    for (const heat of heats) {
      for (const assignment of heat.assignments) {
        const lanes = lanesByDriver.get(assignment.driverId) ?? [];
        lanes.push(assignment.lane);
        lanesByDriver.set(assignment.driverId, lanes);
      }
    }

    for (const driver of drivers) {
      expect([...(lanesByDriver.get(driver) ?? [])].sort()).toEqual([0, 1, 2, 3]);
    }
  });

  it("splits a larger field into heats", () => {
    const field = ["a", "b", "c", "d", "e", "f", "g", "h"];
    const heats = generateSchedule(field, 4, 4);
    expect(heats).toHaveLength(8);
    for (const driver of field) {
      const starts = heats.filter((heat) =>
        heat.assignments.some((assignment) => assignment.driverId === driver),
      );
      expect(starts).toHaveLength(4);
    }
  });

  it("does not duplicate a driver inside a heat", () => {
    const heats = generateSchedule(drivers, 4, 8);
    for (const heat of heats) {
      const ids = heat.assignments.map((assignment) => assignment.driverId);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });
});

describe("points", () => {
  it("scores the top eight", () => {
    expect(pointsFor(0)).toBe(10);
    expect(pointsFor(1)).toBe(8);
    expect(pointsFor(4)).toBe(4);
    expect(pointsFor(9)).toBe(0);
  });
});

describe("standings", () => {
  it("sums points and breaks ties by wins", () => {
    const season = createSeason("Test", ["Alice", "Bob"], 2, 1);
    season.results[season.heats[0]!.id] = ["d2", "d1"];
    const table = standings(season);
    expect(table[0]?.name).toBe("Bob");
    expect(table[0]?.points).toBe(10);
    expect(table[1]?.name).toBe("Alice");
    expect(table[1]?.points).toBe(8);
  });

  it("counts a DNF as a start with no points", () => {
    const season = createSeason("Test", ["Alice", "Bob"], 2, 1);
    season.results[season.heats[0]!.id] = ["d1"];
    const table = standings(season);
    const alice = table.find((row) => row.name === "Alice");
    const bob = table.find((row) => row.name === "Bob");
    expect(alice?.points).toBe(10);
    expect(bob?.points).toBe(0);
    expect(bob?.starts).toBe(1);
  });
});

describe("next heat", () => {
  it("finds the next heat without a result", () => {
    const season = createSeason("Test", ["Alice", "Bob", "Cara", "Dan"], 4, 2);
    const first = season.heats[0]!;
    season.results[first.id] = ["d1", "d2", "d3", "d4"];
    expect(nextUnresolvedHeat(season, first.id)).toBe(season.heats[1]!.id);
  });
});
