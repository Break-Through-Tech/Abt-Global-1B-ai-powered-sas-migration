import type { ReactNode } from "react";
import { Term } from "../components/Term";
import { api, fmt, type RunSummary } from "../api";
import { Notice, PageHeader, Section, StatusBadge, tableHead } from "../components/ui";

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

export function ValidationPage({ run }: { run: RunSummary }) {
  const checks = run.validation;
  const passed = checks.filter((c) => c.passed).length;
  const worst = Math.max(0, ...checks.map((c) => c.max_abs_diff));
  const cells = checks.reduce((s, c) => s + c.rows_python * c.columns_compared, 0);

  return (
    <>
      <PageHeader title="Parity with the SAS package">
        Each output table from the Python pipeline is compared value by value with the SAS output datasets, at
        full precision, matched on <Term id="ccn">CCN</Term>. Any difference larger than 0.000001 counts as a mismatch.
      </PageHeader>

      {!run.isReference ? (
        <Notice tone="info" title="SAS comparison needs the July 2025 reference input">
          SAS outputs exist only for that input. <a className="font-bold underline" href="#/run">Rerun the reference</a> to compare.
        </Notice>
      ) : (
        <>
          <div className="mb-12">
            {passed === checks.length ? (
              <Notice tone="success" title={`All ${checks.length} tables match SAS, including every hospital's star rating`}>
                {fmt.int(cells)} values compared. The largest difference is {fmt.diff(worst)}, which is floating-point rounding.
              </Notice>
            ) : (
              <Notice tone="error" title={`${checks.length - passed} of ${checks.length} tables differ from SAS`}>
                Check the tables marked Differs before relying on these results.
              </Notice>
            )}
          </div>

          <Section title="Table by table">
            <div tabIndex={0} role="region" aria-label="Table, scrolls sideways on small screens" className="relative overflow-x-auto">
              <table className="w-full min-w-[760px] text-[15px]">
                <thead className={tableHead}>
                  <tr>
                    <th scope="col" className="px-3 py-2">Output table</th>
                    <th scope="col" className="px-3 py-2 text-right">Program</th>
                    <th scope="col" className="px-3 py-2 text-right">Rows, Python / SAS</th>
                    <th scope="col" className="px-3 py-2 text-right">Columns</th>
                    <th scope="col" className="px-3 py-2 text-right">Largest difference</th>
                    <th scope="col" className="px-3 py-2 text-right">Mismatches</th>
                    <th scope="col" className="px-3 py-2">Result</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line-soft">
                  {checks.map((c) => (
                    <tr key={c.table}>
                      <th scope="row" className="px-3 py-2.5 text-left font-normal">
                        <span className="block font-semibold text-ink">{TABLE_LABELS[c.table] ?? c.table}</span>
                        <a href={api.csvUrl(run.id, c.table)} download className="tabular text-[13px] text-muted underline decoration-line hover:text-abt-red">
                          {c.table}.csv
                        </a>
                      </th>
                      <td className="tabular px-3 py-2.5 text-right">{c.program}</td>
                      <td className="tabular px-3 py-2.5 text-right">{fmt.int(c.rows_python)} / {fmt.int(c.rows_sas)}</td>
                      <td className="tabular px-3 py-2.5 text-right">{c.columns_compared}</td>
                      <td className="tabular px-3 py-2.5 text-right">{fmt.diff(c.max_abs_diff)}</td>
                      <td className="tabular px-3 py-2.5 text-right">{fmt.int(c.mismatched_cells)}</td>
                      <td className="px-3 py-2.5"><StatusBadge passed={c.passed} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>
        </>
      )}

      <Section className="mt-14" title="Run record" description="The same record is saved as manifest.json in every download.">
        <dl className="grid gap-x-12 text-[15px] sm:grid-cols-2">
          <Item label="Run" value={run.id} mono />
          <Item label="Started" value={new Date(run.createdAt).toLocaleString([], { dateStyle: "medium", timeStyle: "medium" })} />
          <Item label="Input" value={run.source} />
          <Item label="Input size" value={`${fmt.int(run.input.rows)} rows, ${run.input.columns} columns`} />
          <Item label={<Term id="fingerprint">Input fingerprint (SHA-256)</Term>} value={run.input.sha256} mono />
          <Item label="Pipeline commit" value={run.manifest.pipelineCommit} mono />
          <Item label="Python" value={run.manifest.python} />
          <Item label="Packages" value={Object.entries(run.manifest.packages).map(([k, v]) => `${k} ${v}`).join(", ")} />
        </dl>
      </Section>
    </>
  );
}

function Item({ label, value, mono }: { label: ReactNode; value: string; mono?: boolean }) {
  return (
    <div className="min-w-0 border-b border-line-soft py-2.5">
      <dt className="text-sm text-muted">{label}</dt>
      <dd className={`break-all text-ink ${mono ? "tabular font-mono text-[13px]" : ""}`}>{value}</dd>
    </div>
  );
}
