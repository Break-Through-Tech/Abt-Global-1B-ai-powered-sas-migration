import { ArrowLeft, Check, ChevronDown, X } from "lucide-react";
import { Term } from "../components/Term";
import { useEffect, useState, type ReactNode } from "react";
import { api, fmt, type HospitalDetail, type RunSummary } from "../api";
import { DivergingBar } from "../components/charts";
import { Notice, PageHeader, Section, Skeleton, Stars, tableHead } from "../components/ui";

/** Full-page view, used on narrow screens and for links opened directly. */
export function HospitalDetailPage({ run, ccn }: { run: RunSummary; ccn: string }) {
  return (
    <>
      <a href="#/hospitals" className="mb-4 inline-flex min-h-11 items-center gap-1.5 text-[15px] font-bold text-abt-red hover:underline">
        <ArrowLeft aria-hidden className="size-4" /> All hospitals
      </a>
      <HospitalDetailView run={run} ccn={ccn} />
    </>
  );
}

/**
 * One hospital's rating, eligibility, score build-up and measures. Layout follows its own width
 * (container queries), so the same view works as a full page or in the side panel beside the list.
 */
export function HospitalDetailView({ run, ccn, onClose }: { run: RunSummary; ccn: string; onClose?: () => void }) {
  const [h, setH] = useState<HospitalDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setH(null);
    setError(null);
    api.hospital(run.id, ccn).then(setH).catch((e: Error) => setError(e.message));
  }, [run.id, ccn]);

  if (error) return <Notice tone="error" title={`No hospital with CCN ${ccn} in this run`}>{error}</Notice>;
  if (!h) return <div aria-busy="true"><Skeleton className="mb-6 h-9 w-64" /><Skeleton className="h-96" /></div>;

  const meta = (
    <span className="flex flex-wrap gap-x-6 gap-y-1">
      <span>CCN {h.id}</span>
      <span>{h.state}</span>
      {h.peer && <span>Peer group: {h.peer} measure groups</span>}
    </span>
  );

  return (
    <div className="@container">
      {onClose ? (
        <header className="mb-6 flex items-start justify-between gap-4 border-b border-line pb-4">
          <div>
            <h2 className="text-[1.5rem] leading-tight text-ink">Hospital {h.id}</h2>
            <div className="tabular mt-1 text-sm font-semibold text-muted">{meta}</div>
          </div>
          <button onClick={onClose} aria-label="Close hospital details" className="inline-flex size-11 shrink-0 items-center justify-center text-ink hover:bg-surface">
            <X aria-hidden className="size-5" />
          </button>
        </header>
      ) : (
        <PageHeader title={`Hospital ${h.id}`} meta={meta} />
      )}

      <div className="grid gap-x-12 gap-y-10 @3xl:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <Section title="Overall rating">
          <div className="flex items-center gap-4">
            <span className="tabular text-[4rem] leading-none font-extrabold text-ink">{h.star ?? "–"}</span>
            <div>
              <Stars value={h.star} size={22} />
              <p className="mt-1 text-sm text-muted">{h.star ? "out of 5 stars" : "Does not meet the reporting thresholds"}</p>
            </div>
          </div>
          <dl className="mt-6 divide-y divide-line-soft border-t border-line-soft text-[15px]">
            <Row label={<Term id="summary-score">Summary score</Term>} value={fmt.score(h.summary)} strong />
            <Row label={<><Term id="peer-group">Peer group</Term> average</>} value={fmt.score(h.peerSummary)} />
            <Row label={<Term id="national-average">National average</Term>} value={fmt.score(h.nationalSummary)} />
          </dl>
        </Section>

        <Section title="Reporting thresholds" description={<>A hospital is rated only when both rules are met. <Term id="thresholds">What are the thresholds?</Term></>}>
          <ul className="divide-y divide-line-soft border-t border-line-soft">
            <Rule ok={h.groupsWithThree >= 3} text="3 or more measure groups have at least 3 measures" detail={`${h.groupsWithThree} of 5 groups qualify`} />
            <Rule ok={h.mortSafeGroups >= 1} text="Mortality or Safety of Care has at least 3 measures" detail={`${h.mortSafeGroups} of these 2 groups qualify`} />
          </ul>
        </Section>
      </div>

      <Section
        className="mt-12"
        title="How the summary score is built"
        description={<>Each <Term id="group-score">group score</Term> is multiplied by its weight. When a group is missing, its weight is shared among the groups that remain.</>}
      >
        <div tabIndex={0} role="region" aria-label="Table, scrolls sideways on small screens" className="relative overflow-x-auto">
          <table className="w-full min-w-[720px] text-[15px]">
            <thead className={tableHead}>
              <tr>
                <th scope="col" className="px-3 py-2">Measure group</th>
                <th scope="col" className="px-3 py-2 text-right">Measures</th>
                <th scope="col" className="px-3 py-2 text-right">Group score</th>
                <th scope="col" className="w-[30%] px-3 py-2">
                  <span className="inline-flex items-center gap-1.5 font-normal">
                    <span aria-hidden className="inline-block h-3 w-0.5 bg-[#8c8c8c]" /> National average
                  </span>
                </th>
                <th scope="col" className="px-3 py-2 text-right">Weight</th>
                <th scope="col" className="px-3 py-2 text-right">Contribution</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line-soft">
              {h.groups.map((g) => (
                <tr key={g.key}>
                  <th scope="row" className="px-3 py-3 text-left font-semibold text-ink">{g.label}</th>
                  <td className="tabular px-3 py-3 text-right">{g.measureCount}</td>
                  <td className="tabular px-3 py-3 text-right font-semibold text-ink">{fmt.score(g.score)}</td>
                  <td className="px-3 py-3"><DivergingBar value={g.score} reference={g.national} label={g.label} /></td>
                  <td className="tabular px-3 py-3 text-right">{g.weight === null ? "–" : fmt.pct(g.weight, 1)}</td>
                  <td className="tabular px-3 py-3 text-right">{fmt.score(g.contribution)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-ink">
                <th scope="row" colSpan={5} className="px-3 py-3 text-left font-bold text-ink">Summary score</th>
                <td className="tabular px-3 py-3 text-right font-bold text-ink">{fmt.score(h.summary)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Section>

      <Section className="mt-12" title="Measures" description={<><Term id="standardized">Standardized scores</Term> for every <Term id="measure">measure</Term>. Higher is better for all of them.</>}>
        <div className="divide-y divide-line-soft border-y border-line-soft">
          {h.groups.map((g) => {
            const reported = g.measures.filter((m) => m.value !== null).length;
            return (
              <details key={g.key} className="group">
                <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-4 px-1 py-2 hover:bg-surface">
                  <span className="font-semibold text-ink">
                    {g.label}
                    <span className="ml-4 font-normal text-muted">{reported} of {g.measures.length} reported</span>
                  </span>
                  <ChevronDown aria-hidden className="size-4 shrink-0 text-muted transition-transform duration-150 group-open:rotate-180" />
                </summary>
                <table className="mb-3 w-full text-[15px]">
                  <caption className="sr-only">{g.label} measures</caption>
                  <tbody>
                    {g.measures.map((m) => (
                      <tr key={m.code} className="align-middle">
                        <th scope="row" className="py-2 pr-4 pl-1 text-left font-normal">
                          <span className="text-ink">{m.label}</span>
                          <span className="tabular ml-2 text-[13px] text-muted">{m.code}</span>
                          {!m.included && <span className="ml-2 text-[13px] text-muted">(dropped for low volume)</span>}
                        </th>
                        <td className="hidden w-[200px] py-2 @xl:table-cell"><DivergingBar value={m.value} range={3} label={m.label} /></td>
                        <td className={`tabular w-28 py-2 pl-4 text-right ${m.value === null ? "text-sm text-muted" : "font-semibold text-ink"}`}>
                          {m.value === null ? "Not reported" : fmt.score(m.value, 2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </details>
            );
          })}
        </div>
      </Section>
    </div>
  );
}

function Row({ label, value, strong }: { label: ReactNode; value: string; strong?: boolean }) {
  return (
    <div className="flex justify-between gap-4 py-2.5">
      <dt className="text-body">{label}</dt>
      <dd className={`tabular ${strong ? "font-bold text-ink" : "font-semibold text-ink"}`}>{value}</dd>
    </div>
  );
}

function Rule({ ok, text, detail }: { ok: boolean; text: string; detail: string }) {
  const Icon = ok ? Check : X;
  return (
    <li className="flex items-start gap-3 py-3">
      <Icon aria-hidden strokeWidth={2.5} className={`mt-0.5 size-5 shrink-0 ${ok ? "text-pass" : "text-abt-red-dark"}`} />
      <div>
        <p className="font-semibold text-ink"><span className="sr-only">{ok ? "Met: " : "Not met: "}</span>{text}</p>
        <p className="text-sm text-muted">{detail}</p>
      </div>
    </li>
  );
}
