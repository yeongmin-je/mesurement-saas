// Asset code format: {prefix}-{YYYYMMDD}-{seq:04}, e.g. MA-20240315-0023
const DEFAULT_PREFIX = 'MA';

export function buildAssetCode(seq: number, opts: { prefix?: string; date?: Date } = {}): string {
  const prefix = opts.prefix ?? DEFAULT_PREFIX;
  const date = opts.date ?? new Date();
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const seqStr = String(seq).padStart(4, '0');
  return `${prefix}-${y}${m}${d}-${seqStr}`;
}

export function parseAssetCode(
  code: string,
): { prefix: string; date: string; seq: number } | null {
  const match = /^([A-Z0-9]+)-(\d{8})-(\d{4})$/.exec(code);
  if (!match) return null;
  return { prefix: match[1]!, date: match[2]!, seq: Number(match[3]!) };
}
