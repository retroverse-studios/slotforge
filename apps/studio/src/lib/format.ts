export function formatInches(value: number, digits = 2): string {
  return `${value.toFixed(digits)} in`;
}

export function formatLength(inches: number): string {
  if (!Number.isFinite(inches)) return "-";
  if (inches >= 24) return `${(inches / 12).toFixed(2)} ft`;
  return `${inches.toFixed(2)} in`;
}

export function formatDelta(inches: number): string {
  const sign = inches >= 0 ? "+" : "";
  return `${sign}${inches.toFixed(2)} in`;
}

export function formatSpeed(inchesPerSecond: number): string {
  return `${(inchesPerSecond / 12).toFixed(1)} ft/s`;
}
