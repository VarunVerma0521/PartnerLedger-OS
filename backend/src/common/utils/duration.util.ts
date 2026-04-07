const DURATION_FACTORS: Record<string, number> = {
  ms: 1,
  s: 1000,
  m: 60 * 1000,
  h: 60 * 60 * 1000,
  d: 24 * 60 * 60 * 1000,
};

export function parseDurationToMs(value: string): number {
  const trimmedValue = value.trim();

  if (/^\d+$/.test(trimmedValue)) {
    return Number(trimmedValue) * 1000;
  }

  const match = trimmedValue.match(/^(\d+)(ms|s|m|h|d)$/i);

  if (!match) {
    throw new Error(
      `Unsupported duration format "${value}". Use values like 15m, 7d, 30s, or 3600.`,
    );
  }

  const [, amount, unit] = match;

  return Number(amount) * DURATION_FACTORS[unit.toLowerCase()];
}
