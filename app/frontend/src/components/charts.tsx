import type { StarCounts } from "../api";
import { fmt } from "../api";
import { StarLabel } from "./ui";

export const STAR_KEYS = ["5", "4", "3", "2", "1"] as const;

/**
 * Star distribution as labeled horizontal bars, 5 stars on top (the order a reader scans a rating).
 * It is a real table, so screen readers and copy-paste get the numbers.
 */
export function StarDistribution({ counts, caption }: { counts: StarCounts; caption: string }) {
  const total = STAR_KEYS.reduce((s, k) => s + counts[k], 0);
  const max = Math.max(...STAR_KEYS.map((k) => counts[k]), 1);
  return (
    <table className="w-full border-collapse">
      <caption className="sr-only">{caption}</caption>
      <thead className="sr-only">
        <tr><th scope="col">Rating</th><th scope="col">Share</th><th scope="col">Hospitals</th><th scope="col">Percent</th></tr>
      </thead>
      <tbody>
        {STAR_KEYS.map((k) => (
          <tr key={k}>
            <th scope="row" className="w-12 py-2 pr-3 text-left text-[15px] font-bold text-ink">
              <StarLabel n={k} />
            </th>
            <td className="py-2" aria-hidden>
              <div className="h-7 bg-surface">
                <div className="h-7 bg-ink" style={{ width: `${(counts[k] / max) * 100}%` }} />
              </div>
            </td>
            <td className="tabular w-20 py-2 pl-4 text-right text-[17px] font-bold text-ink">{fmt.int(counts[k])}</td>
            <td className="tabular w-14 py-2 pl-2 text-right text-sm text-muted">{total ? fmt.pct(counts[k] / total) : "–"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** One row of a 100% stacked strip: share of hospitals at each rating, 1 to 5 stars left to right. */
export function RatingStrip({ counts, label }: { counts: StarCounts; label: string }) {
  const order = ["1", "2", "3", "4", "5"] as const;
  const total = order.reduce((s, k) => s + counts[k], 0) || 1;
  const shades = { "1": "#d9d9d9", "2": "#a6a6a6", "3": "#737373", "4": "#404040", "5": "#1a1a1a" };
  return (
    <div
      role="img"
      aria-label={`${label}: ${order.map((k) => `${counts[k]} at ${k} stars`).join(", ")}`}
      className="flex h-6 w-full overflow-hidden"
    >
      {order.map((k) => (
        <div
          key={k}
          title={`${k} stars: ${fmt.int(counts[k])} (${fmt.pct(counts[k] / total)})`}
          style={{ width: `${(counts[k] / total) * 100}%`, background: shades[k] }}
          className="border-r border-white last:border-r-0"
        />
      ))}
    </div>
  );
}

export function RatingStripLegend() {
  const shades = ["#d9d9d9", "#a6a6a6", "#737373", "#404040", "#1a1a1a"];
  return (
    <ul className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted" aria-hidden>
      {shades.map((c, i) => (
        <li key={c} className="inline-flex items-center gap-1.5">
          <span className="inline-block size-3" style={{ background: c }} />
          <StarLabel n={i + 1} size={11} />
        </li>
      ))}
    </ul>
  );
}

/** Horizontal bar centered on zero, with an optional reference tick (national average). */
export function DivergingBar({ value, reference, range = 2, label }: {
  value: number | null;
  reference?: number | null;
  range?: number;
  label: string;
}) {
  const clamp = (v: number) => Math.max(-range, Math.min(range, v));
  const pos = (v: number) => ((clamp(v) + range) / (2 * range)) * 100;
  const desc = value === null
    ? `${label}: no score`
    : `${label}: ${fmt.score(value)}${reference != null ? `, national average ${fmt.score(reference)}` : ""}`;
  return (
    <div role="img" aria-label={desc} className="relative h-5 w-full">
      <div className="absolute inset-y-2 right-0 left-0 bg-surface" />
      <div className="absolute inset-y-0 left-1/2 w-px bg-line" />
      {value !== null && (
        <div
          className={`absolute inset-y-1 ${value >= 0 ? "bg-ink" : "bg-abt-red"}`}
          style={{ left: `${Math.min(50, pos(value))}%`, width: `${Math.abs(pos(value) - 50)}%` }}
        />
      )}
      {reference != null && (
        <div className="absolute -inset-y-0.5 w-0.5 bg-[#8c8c8c]" style={{ left: `${pos(reference)}%` }} />
      )}
    </div>
  );
}
