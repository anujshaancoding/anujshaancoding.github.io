// Dependency-free table parser. Accepts CSV, TSV, semicolon/pipe-delimited
// text and JSON arrays — every demo visual consumes the same Table shape.

export type Table = { headers: string[]; rows: string[][] };

const DELIMS = [",", "\t", ";", "|"] as const;

/** Picks the delimiter that appears most consistently across the first rows. */
function detectDelimiter(text: string): string {
  const lines = text
    .split(/\r?\n/)
    .filter((l) => l.trim() !== "")
    .slice(0, 5);
  let best = ",";
  let bestScore = -1;
  for (const d of DELIMS) {
    const counts = lines.map((l) => l.split(d).length - 1);
    const total = counts.reduce((a, b) => a + b, 0);
    const consistent = counts.every((c) => c === counts[0]) ? 2 : 0;
    const score = total + consistent;
    if (total > 0 && score > bestScore) {
      bestScore = score;
      best = d;
    }
  }
  return best;
}

/** RFC-4180-ish parser: handles quoted fields, escaped quotes, CRLF. */
function parseDelimited(text: string, delim: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else quoted = false;
      } else field += c;
      continue;
    }
    if (c === '"') quoted = true;
    else if (c === delim) {
      row.push(field);
      field = "";
    } else if (c === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (c !== "\r") field += c;
  }
  if (field !== "" || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

/** Flattens a JSON array of objects into a Table. */
function parseJson(text: string): Table {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("That JSON could not be parsed — check it is valid.");
  }
  const arr = Array.isArray(data) ? data : [data];
  const headers: string[] = [];
  for (const item of arr) {
    if (item && typeof item === "object" && !Array.isArray(item)) {
      for (const k of Object.keys(item)) {
        if (!headers.includes(k)) headers.push(k);
      }
    }
  }
  if (!headers.length) {
    throw new Error("JSON must be an array of objects with named fields.");
  }
  const rows = arr.map((item) =>
    headers.map((h) => {
      const v = (item as Record<string, unknown>)?.[h];
      return v == null ? "" : String(v);
    }),
  );
  return { headers, rows };
}

/** Parses an uploaded file's text into a normalized Table. */
export function parseTable(fileName: string, text: string): Table {
  const trimmed = text.trim();
  if (!trimmed) throw new Error("That file looks empty.");
  const lower = fileName.toLowerCase();
  if (lower.endsWith(".json") || trimmed[0] === "[" || trimmed[0] === "{") {
    return parseJson(trimmed);
  }
  const delim = lower.endsWith(".tsv") ? "\t" : detectDelimiter(trimmed);
  const raw = parseDelimited(trimmed, delim).filter((r) =>
    r.some((c) => c.trim() !== ""),
  );
  if (raw.length < 2) {
    throw new Error("Need a header row plus at least one data row.");
  }
  const headers = raw[0].map((h, i) => h.trim() || `Column ${i + 1}`);
  const rows = raw
    .slice(1)
    .map((r) => headers.map((_, i) => (r[i] ?? "").trim()));
  return { headers, rows };
}

/** Parses a numeric cell, tolerating thousands separators, %, currency. */
export function toNumber(raw: string): number | null {
  if (raw == null) return null;
  const s = raw
    .replace(/[,\s]/g, "")
    .replace(/^[$€£₹]/, "")
    .replace(/%$/, "");
  if (s === "") return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

/** Index of the first column whose header exactly matches one of `names`. */
export function findColumn(headers: string[], names: string[]): number {
  const low = headers.map((h) => h.trim().toLowerCase());
  for (const nm of names) {
    const i = low.indexOf(nm);
    if (i >= 0) return i;
  }
  return -1;
}

/** Compact human number: 1.2K, 3.4M, 5.6B. */
export function formatNumber(n: number): string {
  if (!Number.isFinite(n)) return "—";
  const abs = Math.abs(n);
  if (abs >= 1e9) return (n / 1e9).toFixed(1).replace(/\.0$/, "") + "B";
  if (abs >= 1e6) return (n / 1e6).toFixed(1).replace(/\.0$/, "") + "M";
  if (abs >= 1e3) return (n / 1e3).toFixed(1).replace(/\.0$/, "") + "K";
  if (Number.isInteger(n)) return String(n);
  return n.toFixed(2).replace(/\.?0+$/, "");
}

/** Formats `part / whole` as a one-decimal percentage. */
export function formatPercent(part: number, whole: number): string {
  if (!whole) return "—";
  return ((part / whole) * 100).toFixed(1) + "%";
}

/** Reads a File to text, rejecting oversized files. */
export function readFileText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (file.size > 6 * 1024 * 1024) {
      reject(new Error("File is over 6 MB — please use a smaller export."));
      return;
    }
    const fr = new FileReader();
    fr.onerror = () => reject(new Error("That file could not be read."));
    fr.onload = () => resolve(String(fr.result ?? ""));
    fr.readAsText(file);
  });
}
