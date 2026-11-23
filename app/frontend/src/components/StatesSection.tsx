import { useState } from "react";
import type { StateStats } from "../api";
import { METRICS, STATE_NAMES, StateMap, StateTable, type MapMetric } from "./StateMap";
import { Section } from "./ui";

const MIN_RATED = 5;

export function StatesSection({ states }: { states: StateStats[] }) {
  const [metric, setMetric] = useState<MapMetric>("averageStar");
  const ranked = states
    .filter((s) => STATE_NAMES[s.state] && s.rated >= MIN_RATED)
    .map((s) => ({ s, v: metric === "rated" ? s.rated : s[metric] ?? 0 }))
    .sort((a, b) => b.v - a.v);
  const top = ranked.slice(0, 5);
  const bottom = ranked.slice(-5).reverse();

  return (
    <Section
      className="mt-14"
      title="Ratings by state"
      description="State comes from the first two digits of each hospital's CCN. Select a state to see its hospitals."
      action={
        <div role="radiogroup" aria-label="Map shows" className="inline-flex rounded-control border border-[#999] p-0.5">
          {(Object.keys(METRICS) as MapMetric[]).map((m) => (
            <button
              key={m}
              role="radio"
              aria-checked={metric === m}
              onClick={() => setMetric(m)}
              className={`min-h-10 rounded-[3px] px-3 text-[15px] font-semibold transition-colors duration-150 ${
                metric === m ? "bg-ink text-white" : "text-ink hover:bg-surface"
              }`}
            >
              {METRICS[m].label}
            </button>
          ))}
        </div>
      }
    >
      <div className="grid gap-x-16 gap-y-10 lg:grid-cols-[minmax(0,8fr)_minmax(0,4fr)]">
        <StateMap states={states} metric={metric} />
        <div className="grid content-start gap-8 sm:grid-cols-2 lg:grid-cols-1">
          <Ranking title="Highest" rows={top} metric={metric} />
          <Ranking title="Lowest" rows={bottom} metric={metric} />
          <p className="text-sm text-muted sm:col-span-2 lg:col-span-1">
            States with fewer than {MIN_RATED} rated hospitals are left out of the rankings and the color scale.
          </p>
        </div>
      </div>
      <details className="mt-8 border-y border-line-soft">
        <summary className="flex min-h-12 cursor-pointer items-center font-semibold text-ink hover:bg-surface">
          Show every state as a table
        </summary>
        <div tabIndex={0} role="region" aria-label="Table, scrolls sideways on small screens" className="overflow-x-auto pb-4"><StateTable states={states} /></div>
      </details>
    </Section>
  );
}

function Ranking({ title, rows, metric }: {
  title: string;
  rows: { s: StateStats; v: number }[];
  metric: MapMetric;
}) {
  return (
    <div>
      <h3 className="mb-2 text-[15px] text-heading">{title}: {METRICS[metric].label.toLowerCase()}</h3>
      <ol className="divide-y divide-line-soft border-t border-line-soft">
        {rows.map(({ s }) => (
          <li key={s.state}>
            <a href={`#/hospitals?state=${s.state}`} className="flex min-h-10 items-center justify-between gap-4 text-[15px] hover:text-abt-red">
              <span className="font-semibold text-ink">{STATE_NAMES[s.state]}</span>
              <span className="tabular text-right">
                <span className="font-semibold text-ink">{METRICS[metric].format(s)}</span>
                {metric !== "rated" && <span className="ml-3 text-sm text-muted">{s.rated} rated</span>}
              </span>
            </a>
          </li>
        ))}
      </ol>
    </div>
  );
}
