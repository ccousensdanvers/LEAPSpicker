export function parseSymbols(url: URL): string[] {
  const raw = url.searchParams.get('symbols') ?? url.searchParams.get('symbol') ?? '';

  const toks = raw
    .toUpperCase()
    .replace(/[%20+]/g, ' ') // handle sloppy encodes
    .split(/[\s,;]+/) // split on comma/space/semicolon/newline
    .map((s) => s.trim())
    .filter(Boolean)
    .filter((s) => /^[A-Z.\-]{1,10}$/.test(s)); // keep sane ticker chars

  return Array.from(new Set(toks)); // dedupe, preserve order
}
