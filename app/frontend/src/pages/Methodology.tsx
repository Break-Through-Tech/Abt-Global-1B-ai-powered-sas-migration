import { GROUP_LABELS, GROUP_WEIGHTS, fmt, type GroupKey } from "../api";
import { PageHeader, Section, tableHead } from "../components/ui";

const STAGES = [
  {
    program: "Program 0",
    title: "Standardize measures",
    sas: "0 - Data and Measure Standardization_2025Jul.sas",
    python: "program_0/standardize.py",
    points: [
      "Drops measures reported by 100 or fewer hospitals.",
      "Keeps hospitals with at least one remaining measure.",
      "Converts each measure to a z-score: mean 0, standard deviation 1.",
      "Flips measures where lower is better, so a higher score always means better care.",
    ],
  },
  {
    program: "Program 1",
    title: "Score each measure group",
    sas: "1 - First stage_Simple Average of Measure Scores_2025Jul.sas",
    python: "program_1/group_score.py",
    points: [
      "Averages each hospital's standardized measures within the five groups.",
      "Standardizes each group average across hospitals. The result is the group score.",
    ],
  },
  {
    program: "Program 2",
    title: "Combine groups and assign stars",
    sas: "2 - Second Stage_Weighted Average and Categorize Star_2025Jul.sas",
    python: "program_2/summary_score.py, report.py, peer_groups.py, kmeans.py",
    points: [
      "Weights the five group scores into a summary score. A missing group's weight is shared among the rest.",
      "Rates a hospital only if 3 or more groups have 3 or more measures, including Mortality or Safety of Care.",
      "Splits rated hospitals into peer groups by how many measure groups they report: 3, 4 or 5.",
      "Within each peer group, k-means clustering of summary scores sets the cut points for 1 to 5 stars.",
    ],
  },
];

export function MethodologyPage() {
  return (
    <>
      <PageHeader title="How the rating is calculated">
        The pipeline follows the CMS Overall Hospital Quality Star Rating SAS package for July 2025, step for
        step. Each stage lists the SAS program it replaces and the Python module that does the work.
      </PageHeader>

      <ol className="grid gap-x-12 gap-y-12 lg:grid-cols-3">
        {STAGES.map((s) => (
          <li key={s.program} className="flex flex-col border-t border-ink pt-4">
            <p className="text-[15px] font-bold text-abt-red">{s.program}</p>
            <h2 className="mt-1 text-xl text-heading">{s.title}</h2>
            <ul className="mt-4 flex-1 list-disc space-y-2 pl-5 text-[15px] leading-relaxed marker:text-line">
              {s.points.map((p) => <li key={p}>{p}</li>)}
            </ul>
            <dl className="mt-6 space-y-2 border-t border-line-soft pt-3 text-sm">
              <div><dt className="text-muted">SAS source</dt><dd className="tabular font-mono text-[13px] break-words text-ink">{s.sas}</dd></div>
              <div><dt className="text-muted">Python module</dt><dd className="tabular font-mono text-[13px] break-words text-ink">{s.python}</dd></div>
            </dl>
          </li>
        ))}
      </ol>

      <div className="mt-16 grid gap-x-16 gap-y-12 lg:grid-cols-2">
        <Section title="Group weights" description="Before any redistribution for missing groups">
          <table className="w-full text-[15px]">
            <thead className={tableHead}>
              <tr>
                <th scope="col" className="px-3 py-2">Measure group</th>
                <th scope="col" className="px-3 py-2 text-right">Weight</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line-soft">
              {(Object.keys(GROUP_LABELS) as GroupKey[]).map((k) => (
                <tr key={k}>
                  <th scope="row" className="px-3 py-2.5 text-left font-semibold text-ink">{GROUP_LABELS[k]}</th>
                  <td className="tabular px-3 py-2.5 text-right text-ink">{fmt.pct(GROUP_WEIGHTS[k])}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>
        <Section title="About these results">
          <div className="max-w-[65ch] space-y-3 text-[15px] leading-relaxed">
            <p>
              This tool reproduces the published methodology so analysts can audit, rerun and extend it in Python.
              Results for the July 2025 input are checked against the SAS outputs on every run.
            </p>
            <p>These ratings are not official CMS publications. CMS publishes official ratings on Care Compare.</p>
            <p>
              The input file has no hospital names, so hospitals are listed by CCN. The state comes from the first
              two digits of the CCN.
            </p>
          </div>
        </Section>
      </div>
    </>
  );
}
