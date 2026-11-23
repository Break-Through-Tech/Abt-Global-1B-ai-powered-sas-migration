import { ArrowLeft, Printer } from "lucide-react";
import type { ReactNode } from "react";
import { fmt, GROUP_WEIGHTS, type RunSummary } from "../api";
import { STAR_KEYS } from "../components/charts";
import { StateMap, StateTable, sortedStates } from "../components/StateMap";
import { StarLabel, buttonClass, tableHead } from "../components/ui";

const TABLE_LABELS: Record<string, string> = {
  STD_DATA_2025JUL_ANALYSIS: "Standardized analysis dataset",
  MEASURE_AVERAGE_STDDEV_2025JUL: "Measure means and standard deviations",
  OUTCOME_MORTALITY: "Mortality group scores",
  OUTCOME_SAFETY: "Safety of Care group scores",
  OUTCOME_READMISSION: "Readmission group scores",
  PTEXP: "Patient Experience group scores",
  PROCESS: "Timely & Effective Care group scores",
  STAR_2025JUL: "Summary scores and star ratings",
  NATIONAL_AVERAGE_2025JUL: "National averages",
};

/**
 * One document per run, laid out for US Letter. On screen it previews the printed pages;
 * the browser's print dialog saves it as PDF.
 */
export function ReportPage({ run }: { run: RunSummary }) {
  const { kpis, stars, national, validation } = run;
  const total = STAR_KEYS.reduce((s, k) => s + stars.overall[k], 0);
  const passed = validation.filter((c) => c.passed).length;
  const peers = Object.keys(stars.byPeerGroup).sort().reverse();
  const created = new Date(run.createdAt);
  const stateRows = sortedStates(run.states);
  const half = Math.ceil(stateRows.length / 2);
  const title = run.isReference ? "July 2025 reporting period" : run.source;

  return (
    <>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4 print:hidden">
        <a href="#/" className="inline-flex min-h-11 items-center gap-1.5 text-[15px] font-bold text-abt-red hover:underline">
          <ArrowLeft aria-hidden className="size-4" /> Back to ratings
        </a>
        <button className={buttonClass.primary} onClick={() => window.print()}>
          <Printer aria-hidden className="size-4" /> Print or save as PDF
        </button>
      </div>

      <article className="mx-auto max-w-[8.5in] bg-white text-[15px] text-body shadow-[0_2px_12px_rgba(0,0,0,0.10)] ring-1 ring-line-soft print:max-w-none print:text-[12px] print:shadow-none print:ring-0">
        <div className="px-[0.75in] py-[0.7in] print:p-0">
          <header className="flex items-start justify-between gap-6 border-b-2 border-ink pb-5">
            <div>
              <p className="text-[15px] font-bold text-abt-red">Overall Hospital Quality Star Rating</p>
              <h1 className="mt-1 text-[2rem] leading-tight text-ink">Run report: {title}</h1>
              <p className="tabular mt-2 text-sm text-muted">
                Generated {created.toLocaleString([], { dateStyle: "long", timeStyle: "short" })}, run {run.id}
              </p>
            </div>
            <img src="/abt-logo.svg" alt="Abt Global" className="size-14 shrink-0" />
          </header>

          <Block title="Summary">
            <p className="max-w-[70ch] leading-relaxed">
              The Python translation of the CMS star rating SAS package scored {fmt.int(kpis.hospitals)} hospitals
              using {kpis.measuresUsed} measures. {fmt.int(kpis.rated)} hospitals ({fmt.pct(kpis.rated / kpis.hospitals)})
              met the reporting thresholds and received a star rating, and {fmt.int(kpis.notRated)} did not. The national
              average summary score of rated hospitals is {fmt.score(national.summary)}.
              {run.isReference && (
                passed === validation.length
                  ? ` All ${validation.length} output tables match the SAS outputs, including every hospital's star rating.`
                  : ` ${validation.length - passed} of ${validation.length} output tables differ from the SAS outputs.`
              )}
            </p>
          </Block>

          <div className="grid gap-x-10 sm:grid-cols-2 print:grid-cols-2">
            <Block title="Star ratings">
              <table className="w-full">
                <thead className={tableHead}>
                  <tr><th scope="col" className="px-2 py-1.5">Rating</th><th scope="col" className="px-2 py-1.5 text-right">Hospitals</th><th scope="col" className="px-2 py-1.5 text-right">Share</th></tr>
                </thead>
                <tbody className="divide-y divide-line-soft">
                  {STAR_KEYS.map((k) => (
                    <tr key={k}>
                      <th scope="row" className="px-2 py-1.5 text-left font-semibold text-ink"><StarLabel n={k} /></th>
                      <td className="tabular px-2 py-1.5 text-right">{fmt.int(stars.overall[k])}</td>
                      <td className="tabular px-2 py-1.5 text-right">{fmt.pct(stars.overall[k] / total, 1)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot><tr className="border-t border-ink"><th scope="row" className="px-2 py-1.5 text-left text-ink">Rated</th><td className="tabular px-2 py-1.5 text-right font-bold text-ink">{fmt.int(total)}</td><td /></tr></tfoot>
              </table>
            </Block>

            <Block title="National averages">
              <table className="w-full">
                <thead className={tableHead}>
                  <tr><th scope="col" className="px-2 py-1.5">Measure group</th><th scope="col" className="px-2 py-1.5 text-right">Weight</th><th scope="col" className="px-2 py-1.5 text-right">Average</th></tr>
                </thead>
                <tbody className="divide-y divide-line-soft">
                  {national.groups.map((g) => (
                    <tr key={g.key}>
                      <th scope="row" className="px-2 py-1.5 text-left font-semibold text-ink">{g.label}</th>
                      <td className="tabular px-2 py-1.5 text-right">{fmt.pct(GROUP_WEIGHTS[g.key])}</td>
                      <td className="tabular px-2 py-1.5 text-right">{fmt.score(g.value)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot><tr className="border-t border-ink"><th scope="row" colSpan={2} className="px-2 py-1.5 text-left text-ink">Summary score</th><td className="tabular px-2 py-1.5 text-right font-bold text-ink">{fmt.score(national.summary)}</td></tr></tfoot>
              </table>
            </Block>
          </div>

          <Block title="Peer groups" note="Stars are assigned separately within each peer group.">
            <table className="w-full">
              <thead className={tableHead}>
                <tr>
                  <th scope="col" className="px-2 py-1.5">Peer group</th>
                  <th scope="col" className="px-2 py-1.5 text-right">Hospitals</th>
                  {["1", "2", "3", "4", "5"].map((k) => <th key={k} scope="col" className="px-2 py-1.5 text-right"><StarLabel n={k} size={10} /></th>)}
                  <th scope="col" className="px-2 py-1.5 text-right">Average summary</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line-soft">
                {peers.map((p) => {
                  const c = stars.byPeerGroup[p];
                  const n = Object.values(c).reduce((a, b) => a + b, 0);
                  return (
                    <tr key={p}>
                      <th scope="row" className="px-2 py-1.5 text-left font-semibold text-ink">{p} measure groups</th>
                      <td className="tabular px-2 py-1.5 text-right">{fmt.int(n)}</td>
                      {(["1", "2", "3", "4", "5"] as const).map((k) => <td key={k} className="tabular px-2 py-1.5 text-right">{fmt.int(c[k])}</td>)}
                      <td className="tabular px-2 py-1.5 text-right">{fmt.score(national.peer[p] ?? null)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Block>

          <Block title="Average rating by state" className="print-break" note="State comes from the first two digits of the CCN. States with fewer than 5 rated hospitals are outlined and left uncolored.">
            <div className="mx-auto max-w-[7in] pt-2">
              <StateMap states={run.states} metric="averageStar" interactive={false} />
            </div>
          </Block>

          <Block title="State detail" className="print-break">
            <div className="grid gap-x-6 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] print:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
              <StateTable dense states={stateRows.slice(0, half)} />
              <StateTable dense states={stateRows.slice(half)} />
            </div>
          </Block>

          {run.isReference && (
            <Block title="Parity with the SAS package" className="print-break" note="Each table is compared value by value with the SAS output datasets at full precision, matched on CCN. Tolerance 0.000001.">
              <table className="w-full">
                <thead className={tableHead}>
                  <tr>
                    <th scope="col" className="px-2 py-1.5">Output table</th>
                    <th scope="col" className="px-2 py-1.5 text-right">Rows, Python / SAS</th>
                    <th scope="col" className="px-2 py-1.5 text-right">Largest difference</th>
                    <th scope="col" className="px-2 py-1.5 text-right">Mismatches</th>
                    <th scope="col" className="px-2 py-1.5">Result</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line-soft">
                  {validation.map((c) => (
                    <tr key={c.table}>
                      <th scope="row" className="px-2 py-1.5 text-left font-semibold text-ink">{TABLE_LABELS[c.table] ?? c.table}</th>
                      <td className="tabular px-2 py-1.5 text-right">{fmt.int(c.rows_python)} / {fmt.int(c.rows_sas)}</td>
                      <td className="tabular px-2 py-1.5 text-right">{fmt.diff(c.max_abs_diff)}</td>
                      <td className="tabular px-2 py-1.5 text-right">{fmt.int(c.mismatched_cells)}</td>
                      <td className={`px-2 py-1.5 font-bold ${c.passed ? "text-pass" : "text-abt-red-dark"}`}>{c.passed ? "Match" : "Differs"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Block>
          )}

          <Block title="Run record">
            <dl className="grid gap-x-10 sm:grid-cols-2 print:grid-cols-2">
              <Item label="Input" value={run.source} />
              <Item label="Input size" value={`${fmt.int(run.input.rows)} rows, ${run.input.columns} columns`} />
              <Item label="Input fingerprint (SHA-256)" value={run.input.sha256} mono />
              <Item label="Pipeline commit" value={run.manifest.pipelineCommit} mono />
              <Item label="Python" value={run.manifest.python} />
              <Item label="Packages" value={Object.entries(run.manifest.packages).map(([k, v]) => `${k} ${v}`).join(", ")} />
            </dl>
          </Block>

          <footer className="mt-10 border-t border-line pt-4 text-[13px] leading-relaxed text-muted">
            Ratings in this report are reproduced from the CMS Overall Hospital Quality Star Rating methodology with a
            Python translation of the SAS package. They are not official CMS publications. Prepared with Star Ratings
            Studio, Abt Global.
          </footer>
        </div>
      </article>
    </>
  );
}

function Block({ title, note, children, className = "" }: {
  title: string;
  note?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`print-keep mt-8 ${className}`}>
      <h2 className="text-[17px] text-heading">{title}</h2>
      {note && <p className="mt-0.5 text-[13px] text-muted">{note}</p>}
      <div className="mt-3">{children}</div>
    </section>
  );
}

function Item({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="min-w-0 border-b border-line-soft py-1.5">
      <dt className="text-[13px] text-muted">{label}</dt>
      <dd className={`break-all text-ink ${mono ? "tabular font-mono text-[12px]" : ""}`}>{value}</dd>
    </div>
  );
}
