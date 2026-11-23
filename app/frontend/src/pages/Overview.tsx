import { fmt, GROUP_WEIGHTS, type RunSummary } from "../api";
import { Term } from "../components/Term";
import { RatingStrip, RatingStripLegend, StarDistribution } from "../components/charts";
import { StatesSection } from "../components/StatesSection";
import { PageHeader, Section, buttonClass, tableHead } from "../components/ui";

export function OverviewPage({ run }: { run: RunSummary }) {
  const { kpis, stars, national } = run;
  const peers = Object.keys(stars.byPeerGroup).sort().reverse();
  const share = kpis.rated / kpis.hospitals;

  return (
    <>
      <PageHeader
        title={run.isReference ? "July 2025 star ratings" : "Star ratings"}
        actions={
          <>
            <a className={buttonClass.secondary} href="#/report">Printable report</a>
            <a className={buttonClass.primary} href="#/hospitals">Look up a hospital</a>
          </>
        }
      >
        {fmt.int(kpis.rated)} of {fmt.int(kpis.hospitals)} hospitals ({fmt.pct(share)}) reported enough measures
        to receive a rating. The other {fmt.int(kpis.notRated)} fell short of the <Term id="thresholds">reporting thresholds</Term>.
      </PageHeader>

      <div className="grid gap-x-16 gap-y-12 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
        <Section title="Distribution of ratings" description={`${fmt.int(kpis.rated)} rated hospitals`}>
          <StarDistribution counts={stars.overall} caption="Number of hospitals at each star rating" />
        </Section>

        <Section title="National averages" description={<><Term id="standardized">Standardized</Term> <Term id="group-score">group scores</Term>. 0 is the national mean of all hospitals.</>}>
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
                  <th scope="row" className="px-3 py-2.5 text-left font-semibold text-ink">{g.label}</th>
                  <td className="tabular px-3 py-2.5 text-right text-muted">{fmt.pct(GROUP_WEIGHTS[g.key])}</td>
                  <td className="tabular px-3 py-2.5 text-right font-semibold text-ink">{fmt.score(g.value)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-ink">
                <th scope="row" colSpan={2} className="px-3 py-2.5 text-left font-bold text-ink">Summary score, rated hospitals</th>
                <td className="tabular px-3 py-2.5 text-right font-bold text-ink">{fmt.score(national.summary)}</td>
              </tr>
            </tfoot>
          </table>
        </Section>
      </div>

      <StatesSection states={run.states} />

      <Section
        className="mt-14"
        title="Ratings within each peer group"
        description={<>Stars are assigned separately within each <Term id="peer-group">peer group</Term>, so hospitals are only compared with hospitals reporting the same number of <Term id="measure-group">measure groups</Term>.</>}
        action={<RatingStripLegend />}
      >
        <div tabIndex={0} role="region" aria-label="Table, scrolls sideways on small screens" className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-[15px]">
            <thead className={tableHead}>
              <tr>
                <th scope="col" className="px-3 py-2">Peer group</th>
                <th scope="col" className="px-3 py-2 text-right">Hospitals</th>
                <th scope="col" className="w-[45%] px-3 py-2">Share at each rating</th>
                <th scope="col" className="px-3 py-2 text-right">Average summary score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line-soft">
              {peers.map((p) => {
                const counts = stars.byPeerGroup[p];
                const total = Object.values(counts).reduce((a, b) => a + b, 0);
                return (
                  <tr key={p}>
                    <th scope="row" className="px-3 py-3 text-left font-semibold text-ink">{p} measure groups</th>
                    <td className="tabular px-3 py-3 text-right">{fmt.int(total)}</td>
                    <td className="px-3 py-3"><RatingStrip counts={counts} label={`${p} measure groups`} /></td>
                    <td className="tabular px-3 py-3 text-right font-semibold text-ink">{fmt.score(national.peer[p] ?? null)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Section>
    </>
  );
}
