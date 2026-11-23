import { X } from "lucide-react";
import { useState } from "react";
import { fmt, GROUP_WEIGHTS, type RunSummary, type StateStats } from "../api";
import { RatingStrip, RatingStripLegend, StarDistribution } from "../components/charts";
import { METRICS, STATE_NAMES, StateMap, StateTable, type MapMetric } from "../components/StateMap";
import { Term } from "../components/Term";
import { PageHeader, Section, buttonClass, tableHead } from "../components/ui";

const MIN_RATED = 5;

/**
 * The ratings dashboard: everything for one run on one screen. Selecting a state on the map
 * filters the rating distribution beside it; national figures say so when a state is selected.
 */
export function OverviewPage({ run }: { run: RunSummary }) {
  const { kpis, stars, national } = run;
  const [metric, setMetric] = useState<MapMetric>("averageStar");
  const [selected, setSelected] = useState<string | null>(null);
  const state = selected ? run.states.find((s) => s.state === selected) ?? null : null;
  const peers = Object.keys(stars.byPeerGroup).sort().reverse();

  const ranked = run.states
    .filter((s) => STATE_NAMES[s.state] && s.rated >= MIN_RATED)
    .map((s) => ({ s, v: metric === "rated" ? s.rated : s[metric] ?? 0 }))
    .sort((a, b) => b.v - a.v);

  const nationalNote = state ? <span className="text-muted"> All states, not filtered.</span> : null;

  return (
    <>
      <PageHeader
        title={run.isReference ? "July 2025 star ratings" : `Star ratings: ${run.label}`}
        actions={
          <>
            <a className={buttonClass.secondary} href="#/report">Printable report</a>
            <a className={buttonClass.primary} href="#/hospitals">Open hospitals</a>
          </>
        }
      >
        {fmt.int(kpis.rated)} of {fmt.int(kpis.hospitals)} hospitals ({fmt.pct(kpis.rated / kpis.hospitals)}) are rated.
        {" "}{fmt.int(kpis.notRated)} fell short of the <Term id="thresholds">reporting thresholds</Term>.
        {" "}National <Term id="summary-score">summary score</Term> {fmt.score(national.summary)}.
      </PageHeader>

      <div className="grid gap-x-10 gap-y-10 xl:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
        <Section
          title="Ratings by state"
          description={selected ? undefined : "Select a state to filter the distribution. State comes from each hospital's CCN."}
          action={
            <div role="radiogroup" aria-label="Map shows" className="inline-flex rounded-control border border-[#999] p-0.5">
              {(Object.keys(METRICS) as MapMetric[]).map((m) => (
                <button
                  key={m}
                  role="radio"
                  aria-checked={metric === m}
                  onClick={() => setMetric(m)}
                  className={`min-h-10 rounded-[3px] px-3 text-[14px] font-semibold transition-colors duration-150 ${
                    metric === m ? "bg-ink text-white" : "text-ink hover:bg-surface"
                  }`}
                >
                  {METRICS[m].label}
                </button>
              ))}
            </div>
          }
        >
          <StateMap states={run.states} metric={metric} selected={selected} onSelect={setSelected} />
        </Section>

        <div className="space-y-10">
          <Section
            title={state ? `Distribution in ${STATE_NAMES[state.state]}` : "Distribution of ratings"}
            description={
              <span aria-live="polite">
                {state
                  ? `${fmt.int(state.rated)} of ${fmt.int(state.hospitals)} hospitals rated, average ${METRICS.averageStar.format(state)} stars`
                  : `All ${fmt.int(kpis.rated)} rated hospitals`}
              </span>
            }
            action={state && (
              <button onClick={() => setSelected(null)} className={buttonClass.link}>
                <X aria-hidden className="size-4" /> Clear {state.state}
              </button>
            )}
          >
            <StarDistribution
              counts={state ? state.counts : stars.overall}
              caption={state ? `Star ratings in ${STATE_NAMES[state.state]}` : "Number of hospitals at each star rating"}
            />
            {state && (
              <a href={`#/hospitals?state=${state.state}`} className={`${buttonClass.dark} mt-4`}>
                Open {STATE_NAMES[state.state]} hospitals
              </a>
            )}
          </Section>

          <Section
            title="National averages"
            description={<><Term id="standardized">Standardized</Term> <Term id="group-score">group scores</Term>. 0 is the national mean.{nationalNote}</>}
          >
            <table className="w-full text-[15px]">
              <thead className={tableHead}>
                <tr>
                  <th scope="col" className="px-3 py-2">Measure group</th>
                  <th scope="col" className="px-3 py-2 text-right">Weight</th>
                  <th scope="col" className="px-3 py-2 text-right">Average</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line-soft">
                {national.groups.map((g) => (
                  <tr key={g.key}>
                    <th scope="row" className="px-3 py-2 text-left font-semibold text-ink">{g.label}</th>
                    <td className="tabular px-3 py-2 text-right text-muted">{fmt.pct(GROUP_WEIGHTS[g.key])}</td>
                    <td className="tabular px-3 py-2 text-right font-semibold text-ink">{fmt.score(g.value)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>
        </div>
      </div>

      <div className="mt-12 grid gap-x-10 gap-y-10 xl:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
        <Section
          title="Ratings within each peer group"
          description={<>Stars are assigned within each <Term id="peer-group">peer group</Term>.{nationalNote}</>}
          action={<RatingStripLegend />}
        >
          <div tabIndex={0} role="region" aria-label="Table, scrolls sideways on small screens" className="relative overflow-x-auto">
            <table className="w-full min-w-[560px] text-[15px]">
              <thead className={tableHead}>
                <tr>
                  <th scope="col" className="px-3 py-2">Peer group</th>
                  <th scope="col" className="px-3 py-2 text-right">Hospitals</th>
                  <th scope="col" className="w-[42%] px-3 py-2">Share at each rating</th>
                  <th scope="col" className="px-3 py-2 text-right">Average summary</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line-soft">
                {peers.map((p) => {
                  const counts = stars.byPeerGroup[p];
                  const total = Object.values(counts).reduce((a, b) => a + b, 0);
                  return (
                    <tr key={p}>
                      <th scope="row" className="px-3 py-2.5 text-left font-semibold text-ink">{p} measure groups</th>
                      <td className="tabular px-3 py-2.5 text-right">{fmt.int(total)}</td>
                      <td className="px-3 py-2.5"><RatingStrip counts={counts} label={`${p} measure groups`} /></td>
                      <td className="tabular px-3 py-2.5 text-right font-semibold text-ink">{fmt.score(national.peer[p] ?? null)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Section>

        <Section
          title={`States by ${METRICS[metric].label.toLowerCase()}`}
          description={`States with fewer than ${MIN_RATED} rated hospitals are left out.`}
        >
          <div className="grid gap-6 sm:grid-cols-2">
            <Ranking title="Highest" rows={ranked.slice(0, 5)} metric={metric} onPick={setSelected} />
            <Ranking title="Lowest" rows={ranked.slice(-5).reverse()} metric={metric} onPick={setSelected} />
          </div>
        </Section>
      </div>

      <details className="mt-10 border-y border-line-soft">
        <summary className="flex min-h-12 cursor-pointer items-center font-semibold text-ink hover:bg-surface">
          Every state as a table
        </summary>
        <div tabIndex={0} role="region" aria-label="Table, scrolls sideways on small screens" className="relative overflow-x-auto pb-4">
          <StateTable states={run.states} />
        </div>
      </details>
    </>
  );
}

function Ranking({ title, rows, metric, onPick }: {
  title: string;
  rows: { s: StateStats; v: number }[];
  metric: MapMetric;
  onPick: (state: string) => void;
}) {
  return (
    <div>
      <h3 className="mb-1.5 text-[14px] text-heading">{title}</h3>
      <ol className="divide-y divide-line-soft border-t border-line-soft">
        {rows.map(({ s }) => (
          <li key={s.state}>
            <button
              onClick={() => { onPick(s.state); window.scrollTo({ top: 0, behavior: "smooth" }); }}
              className="flex min-h-10 w-full items-center justify-between gap-3 text-left text-[15px] hover:text-abt-red"
            >
              <span className="font-semibold text-ink">{STATE_NAMES[s.state]}</span>
              <span className="tabular font-semibold text-ink">{METRICS[metric].format(s)}</span>
            </button>
          </li>
        ))}
      </ol>
    </div>
  );
}
