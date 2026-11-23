import { useState } from "react";
import { fmt, type StateStats } from "../api";

/* Equal-size tile per state so small states (RI, DE, DC) are as readable and clickable as large ones. */
const TILES: Record<string, [col: number, row: number]> = {
  AK: [0, 0], ME: [11, 0],
  WI: [6, 1], VT: [10, 1], NH: [11, 1],
  WA: [1, 2], ID: [2, 2], MT: [3, 2], ND: [4, 2], MN: [5, 2], IL: [6, 2], MI: [7, 2], NY: [9, 2], MA: [10, 2],
  OR: [1, 3], NV: [2, 3], WY: [3, 3], SD: [4, 3], IA: [5, 3], IN: [6, 3], OH: [7, 3], PA: [8, 3], NJ: [9, 3], CT: [10, 3], RI: [11, 3],
  CA: [1, 4], UT: [2, 4], CO: [3, 4], NE: [4, 4], MO: [5, 4], KY: [6, 4], WV: [7, 4], VA: [8, 4], MD: [9, 4], DE: [10, 4],
  AZ: [2, 5], NM: [3, 5], KS: [4, 5], AR: [5, 5], TN: [6, 5], NC: [7, 5], SC: [8, 5], DC: [9, 5],
  OK: [4, 6], LA: [5, 6], MS: [6, 6], AL: [7, 6], GA: [8, 6],
  HI: [0, 7], TX: [4, 7], FL: [9, 7],
  GU: [0, 8], MP: [1, 8], PR: [10, 8], VI: [11, 8],
};

export const STATE_NAMES: Record<string, string> = {
  AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas", CA: "California", CO: "Colorado", CT: "Connecticut",
  DE: "Delaware", DC: "District of Columbia", FL: "Florida", GA: "Georgia", HI: "Hawaii", ID: "Idaho", IL: "Illinois",
  IN: "Indiana", IA: "Iowa", KS: "Kansas", KY: "Kentucky", LA: "Louisiana", ME: "Maine", MD: "Maryland",
  MA: "Massachusetts", MI: "Michigan", MN: "Minnesota", MS: "Mississippi", MO: "Missouri", MT: "Montana",
  NE: "Nebraska", NV: "Nevada", NH: "New Hampshire", NJ: "New Jersey", NM: "New Mexico", NY: "New York",
  NC: "North Carolina", ND: "North Dakota", OH: "Ohio", OK: "Oklahoma", OR: "Oregon", PA: "Pennsylvania",
  RI: "Rhode Island", SC: "South Carolina", SD: "South Dakota", TN: "Tennessee", TX: "Texas", UT: "Utah",
  VT: "Vermont", VA: "Virginia", WA: "Washington", WV: "West Virginia", WI: "Wisconsin", WY: "Wyoming",
  PR: "Puerto Rico", VI: "U.S. Virgin Islands", GU: "Guam", MP: "Northern Mariana Islands",
};

export type MapMetric = "averageStar" | "shareHigh" | "rated";

export const METRICS: Record<MapMetric, { label: string; legend: string; format: (s: StateStats) => string }> = {
  averageStar: {
    label: "Average rating",
    legend: "Average star rating of rated hospitals",
    format: (s) => (s.averageStar === null ? "–" : s.averageStar.toFixed(1)),
  },
  shareHigh: {
    label: "Rated 4 or 5 stars",
    legend: "Share of rated hospitals with 4 or 5 stars",
    format: (s) => (s.shareHigh === null ? "–" : fmt.pct(s.shareHigh)),
  },
  rated: {
    label: "Hospitals rated",
    legend: "Number of hospitals with a star rating",
    format: (s) => fmt.int(s.rated),
  },
};

/* Five-step Abt red ramp, light to dark. Text flips to white from step 3. */
const RAMP = ["#f7e4e5", "#e9b3b6", "#d1676c", "#b0262c", "#6e1418"];
const MIN_RATED = 5;

function value(s: StateStats, metric: MapMetric): number | null {
  return metric === "rated" ? s.rated : s[metric];
}

/** Quantile breaks so each color step holds about a fifth of the states. */
function breaks(values: number[]): number[] {
  const sorted = [...values].sort((a, b) => a - b);
  return [0.2, 0.4, 0.6, 0.8].map((q) => sorted[Math.floor(q * (sorted.length - 1))]);
}

function step(v: number, cuts: number[]): number {
  let i = 0;
  while (i < cuts.length && v > cuts[i]) i++;
  return i;
}

export function StateMap({ states, metric, compact = false, interactive = true }: {
  states: StateStats[];
  metric: MapMetric;
  compact?: boolean;
  interactive?: boolean;
}) {
  const [hover, setHover] = useState<string | null>(null);
  const byState = Object.fromEntries(states.map((s) => [s.state, s]));
  const eligible = states.filter((s) => TILES[s.state] && s.rated >= MIN_RATED && value(s, metric) !== null);
  const cuts = breaks(eligible.map((s) => value(s, metric)!));
  const fmtCut = (v: number) =>
    metric === "averageStar" ? v.toFixed(1) : metric === "shareHigh" ? fmt.pct(v) : fmt.int(Math.round(v));
  const focus = hover ? byState[hover] : null;
  const other = byState["Other"];

  return (
    <figure>
      <div className="relative">
        <ol
          aria-label={`Map of US states: ${METRICS[metric].legend}`}
          className="grid gap-[3px]"
          style={{ gridTemplateColumns: "repeat(12, minmax(0, 1fr))" }}
        >
          {Object.entries(TILES).map(([code, [col, row]]) => {
            const s = byState[code];
            const v = s ? value(s, metric) : null;
            const thin = !s || s.rated < MIN_RATED;
            const idx = v === null || thin ? -1 : step(v, cuts);
            const bg = idx < 0 ? "#f5f5f5" : RAMP[idx];
            const dark = idx >= 3; // white text only where it keeps 4.5:1 contrast
            // The accessible name starts with the visible text (code, then value) so voice control users can say what they see.
            const shown = s ? (thin ? `n=${s.rated}` : METRICS[metric].format(s)) : "";
            const label = s
              ? `${code} ${compact ? "" : shown}, ${STATE_NAMES[code]}: ${METRICS[metric].format(s)}. ${s.rated} of ${s.hospitals} hospitals rated${thin ? ", too few to compare" : ""}`
              : `${code}, ${STATE_NAMES[code]}: no hospitals in this input`;
            const tileClass = `flex aspect-square flex-col items-center justify-center leading-none transition-[outline-color] duration-150 ${
              dark ? "text-white" : "text-ink"
            } ${thin ? "outline-1 -outline-offset-1 outline-dashed outline-[#a6a6a6]" : ""}`;
            const content = (
              <>
                <span className={`font-bold ${compact ? "text-[10px]" : "text-[13px] sm:text-[15px]"}`}>{code}</span>
                {!compact && s && " "}
                {!compact && s && (
                  <span className={`tabular mt-0.5 hidden text-[11px] sm:block ${dark ? "text-white" : "text-ink"}`}>
                    {shown}
                  </span>
                )}
              </>
            );
            return (
              <li key={code} style={{ gridColumn: col + 1, gridRow: row + 1, background: bg }}>
                {interactive && s ? (
                  <a
                    href={`#/hospitals?state=${code}`}
                    aria-label={`${label}. Show these hospitals`}
                    onMouseEnter={() => setHover(code)}
                    onMouseLeave={() => setHover(null)}
                    onFocus={() => setHover(code)}
                    onBlur={() => setHover(null)}
                    className={`${tileClass} hover:outline-2 hover:outline-ink focus-visible:outline-offset-1`}
                  >
                    {content}
                  </a>
                ) : (
                  <div role="img" aria-label={label} className={tileClass}>{content}</div>
                )}
              </li>
            );
          })}
        </ol>

        {interactive && (
          <div
            aria-hidden
            className="pointer-events-none absolute top-0 left-[8.5%] hidden w-[38%] min-w-60 border border-line bg-white p-3 text-sm shadow-[0_6px_16px_rgba(0,0,0,0.12)] sm:block"
            style={{ visibility: focus ? "visible" : "hidden" }}
          >
            {focus && (
              <>
                <p className="font-bold text-ink">{STATE_NAMES[focus.state]}</p>
                <dl className="tabular mt-1.5 grid grid-cols-[1fr_auto] gap-x-4 gap-y-0.5">
                  <dt className="text-muted">Average rating</dt><dd className="text-right font-semibold text-ink">{METRICS.averageStar.format(focus)}</dd>
                  <dt className="text-muted">Rated 4 or 5 stars</dt><dd className="text-right font-semibold text-ink">{METRICS.shareHigh.format(focus)}</dd>
                  <dt className="text-muted">Hospitals rated</dt><dd className="text-right font-semibold text-ink">{focus.rated} of {focus.hospitals}</dd>
                </dl>
                <p className="mt-2 text-[13px] text-abt-red">Select to see these hospitals</p>
              </>
            )}
          </div>
        )}
      </div>

      <figcaption className={`mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-muted ${compact ? "text-xs" : "text-sm"}`}>
        <span>{METRICS[metric].legend}</span>
        <span className="tabular inline-flex items-center" aria-hidden>
          {RAMP.map((c, i) => (
            <span key={c} className="inline-flex flex-col items-start">
              <span className="block h-3 w-10" style={{ background: c }} />
              <span className="mt-1 h-3 text-[11px]">{i === 0 ? "" : fmtCut(cuts[i - 1])}</span>
            </span>
          ))}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden className="inline-block size-3 bg-surface outline-1 -outline-offset-1 outline-dashed outline-[#a6a6a6]" />
          Fewer than {MIN_RATED} rated hospitals
        </span>
        {other && <span>{other.hospitals} hospitals have a CCN without a state code</span>}
      </figcaption>
    </figure>
  );
}

/** The same data as a sortable-free plain table, for screen readers and for print. */
export function sortedStates(states: StateStats[]) {
  return states
    .filter((s) => STATE_NAMES[s.state])
    .sort((a, b) => STATE_NAMES[a.state].localeCompare(STATE_NAMES[b.state]));
}

export function StateTable({ states, dense = false }: { states: StateStats[]; dense?: boolean }) {
  const rows = sortedStates(states);
  const cell = dense ? "px-2 py-[2px]" : "px-3 py-1.5";
  return (
    <table className={`w-full ${dense ? "text-[12.5px] leading-snug" : "text-[14px]"}`}>
      <thead className="bg-surface text-left text-[13px] font-bold whitespace-nowrap text-muted">
        <tr>
          <th scope="col" className="px-3 py-2">State</th>
          <th scope="col" className="px-3 py-2 text-right">Hospitals</th>
          <th scope="col" className="px-3 py-2 text-right">Rated</th>
          <th scope="col" className="px-3 py-2 text-right">{dense ? "Average" : "Average rating"}</th>
          <th scope="col" className="px-3 py-2 text-right">{dense ? "4 or 5 stars" : "Rated 4 or 5 stars"}</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-line-soft">
        {rows.map((s) => (
          <tr key={s.state} className="break-inside-avoid">
            <th scope="row" className={`${cell} text-left font-semibold text-ink`}>{STATE_NAMES[s.state]}</th>
            <td className={`tabular ${cell} text-right`}>{fmt.int(s.hospitals)}</td>
            <td className={`tabular ${cell} text-right`}>{fmt.int(s.rated)}</td>
            <td className={`tabular ${cell} text-right`}>{METRICS.averageStar.format(s)}</td>
            <td className={`tabular ${cell} text-right`}>{METRICS.shareHigh.format(s)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
