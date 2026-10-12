export type Result<T> = { ok: true; value: T } | { ok: false; error: string };

export const success = <T>(value: T): Result<T> => ({ ok: true, value });
export const failure = <T = never>(error: string): Result<T> => ({ ok: false, error });
