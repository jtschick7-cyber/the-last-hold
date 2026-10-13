// Unit conversions, not game constants: they live outside core/systems so the
// numeric-literal rule there stays strict (technical design §5.1).
export const MS_PER_SECOND = 1000;
export const SECONDS_PER_MINUTE = 60;
export const MS_PER_MINUTE = MS_PER_SECOND * SECONDS_PER_MINUTE;
export const MS_PER_DAY = 24 * 60 * MS_PER_MINUTE;
