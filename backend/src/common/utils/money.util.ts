import { Prisma } from '@prisma/client';

export const ZERO_DECIMAL = new Prisma.Decimal(0);

export function toDecimal(
  value: Prisma.Decimal | string | number | null | undefined,
): Prisma.Decimal {
  if (value instanceof Prisma.Decimal) {
    return value;
  }

  return new Prisma.Decimal(value ?? 0);
}

export function roundCurrency(
  value: Prisma.Decimal | string | number | null | undefined,
): Prisma.Decimal {
  return toDecimal(value).toDecimalPlaces(2);
}

export function decimalToNumber(
  value: Prisma.Decimal | string | number | null | undefined,
): number {
  return Number(roundCurrency(value).toString());
}

export function decimalToString(
  value: Prisma.Decimal | string | number | null | undefined,
): string {
  return roundCurrency(value).toFixed(2);
}

export function decimalAbs(
  value: Prisma.Decimal | string | number | null | undefined,
): Prisma.Decimal {
  return roundCurrency(value).abs();
}

export function maxDecimal(
  left: Prisma.Decimal | string | number | null | undefined,
  right: Prisma.Decimal | string | number | null | undefined,
): Prisma.Decimal {
  const leftDecimal = toDecimal(left);
  const rightDecimal = toDecimal(right);
  return leftDecimal.greaterThan(rightDecimal) ? leftDecimal : rightDecimal;
}
