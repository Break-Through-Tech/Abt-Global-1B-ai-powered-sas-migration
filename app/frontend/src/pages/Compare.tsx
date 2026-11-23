import { ArrowDown, ArrowLeftRight, ArrowUp, ChevronLeft, ChevronRight, Minus, Plus } from "lucide-react";
import { Term } from "../components/Term";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { api, fmt, type ChangeStatus, type Comparison, type RatingKey, type RunSummary } from "../api";
import { STATE_NAMES } from "../components/StateMap";
import { Notice, PageHeader, Section, Skeleton, StarLabel, buttonClass, tableHead } from "../components/ui";
import { hashQuery, navigate, useRun } from "../state";

const PAGE_SIZE = 25;
const ORDER: RatingKey[] = ["5", "4", "3", "2", "1", "none"];

const STATUS: Record<Exclude<ChangeStatus, "same" | "unrated">, { label: string; tone: string; icon: ReactNode }> = {
  up: { label: "Moved up", tone: "text-pass", icon: <ArrowUp aria-hidden className="size-4" strokeWidth={2.5} /> },
  down: { label: "Moved down", tone: "text-abt-red-dark", icon: <ArrowDown aria-hidden className="size-4" strokeWidth={2.5} /> },
  newly_rated: { label: "Newly rated", tone: "text-ink", icon: <Plus aria-hidden className="size-4" strokeWidth={2.5} /> },
  no_longer_rated: { label: "No longer rated", tone: "text-ink", icon: <Minus aria-hidden className="size-4" strokeWidth={2.5} /> },
  added: { label: "Only in later run", tone: "text-muted", icon: <Plus aria-hidden className="size-4" /> },
  removed: { label: "Only in earlier run", tone: "text-muted", icon: <Minus aria-hidden className="size-4" /> },
};
type Shown = keyof typeof STATUS;

const runName = (r: Pick<RunSummary, "label" | "createdAt">) =>
  `${r.label}, ${new Date(r.createdAt).toLocaleDateString([], { dateStyle: "medium" })}`;

export function ComparePage() {
  const { setRun } = useRun();
  const [runs, setRuns] = useState<RunSummary[] | null>(null);
  const [base, setBase] = useState(() => hashQuery().get("base") ?? "");
  const [target, setTarget] = useState(() => hashQuery().get("target") ?? "");
  const [data, setData] = useState<Comparison | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Shown | "">("");
  const [state, setState] = useState("");
  const [page, setPage] = useState(0);

  useEffect(() => {
    api.runs().then((list) => {
      setRuns(list);
      // Default: the newest run against the one before it.
      setTarget((t) => t || list[0]?.id || "");
      setBase((b) => b || list[1]?.id || "");
    }).catch((e: Error) => setError(e.message));
  }, []);

  useEffect(() => {
    if (!base || !target) return;
    history.replaceState(null, "", `#/compare?base=${base}&target=${target}`);
    setData(null);
    setError(null);
    api.compare(base, target).then(setData).catch((e: Error) => setError(e.message));
  }, [base, target]);

  useEffect(() => setPage(0), [filter, state, data]);

  const rows = useMemo(
    () => (data?.changes ?? []).filter((c) => (!filter || c.status === filter) && (!state || c.state === state)),
    [data, filter, state],
  );
  const states = useMemo(() => [...new Set((data?.changes ?? []).map((c) => c.state))].sort(), [data]);
  const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));

  async function openHospital(ccn: string) {
    if (!data) return;
    setRun(await api.run(data.target.id));
    navigate(`/hospitals/${ccn}`);
  }

  if (runs && runs.length < 2) {
    return (
      <>
        <PageHeader title="Compare runs" />
        <Notice tone="info" title="Comparison needs at least two saved runs">
          Score another reporting period on the Run pipeline page, then come back to see which hospitals changed.
          <div className="mt-3"><a className={buttonClass.dark} href="#/run">Go to Run pipeline</a></div>
        </Notice>
      </>
    );
  }

  const c = data?.counts;
  const rated = (s: number) => fmt.int(s);

  return (
    <>
      <PageHeader title="Compare runs">
        See how star ratings changed between two saved <Term id="run">runs</Term>, such as one quarter and the next. Hospitals are
        matched by <Term id="ccn">CCN</Term>.
      </PageHeader>

      <div className="mb-10 flex flex-wrap items-end gap-3 rounded-control bg-surface p-4">
        <RunSelect id="base" label="Earlier run" value={base} runs={runs} onChange={setBase} />
        <button
          className={`${buttonClass.secondary} !px-3`}
          aria-label="Swap earlier and later runs"
          onClick={() => { setBase(target); setTarget(base); }}
        >
          <ArrowLeftRight aria-hidden className="size-4" />
        </button>
        <RunSelect id="target" label="Later run" value={target} runs={runs} onChange={setTarget} />
      </div>

      {error && <Notice tone="error" title="Could not compare these runs">{error}</Notice>}
      {!data && !error && <div aria-busy="true" className="space-y-4"><Skeleton className="h-8 w-2/3" /><Skeleton className="h-64" /></div>}

      {data && c && (
        <>
          {base === target ? (
            <div className="mb-10"><Notice tone="warning" title="You picked the same run twice">Choose two different runs to see changes.</Notice></div>
          ) : data.sameInput ? (
            <div className="mb-10"><Notice tone="info" title="Both runs scored the same input file">Identical input gives identical ratings, so no hospital changed.</Notice></div>
          ) : null}

          <p className="mb-10 max-w-[75ch] text-[17px] leading-relaxed text-body">
            From <strong className="text-ink">{data.base.label}</strong> to <strong className="text-ink">{data.target.label}</strong>,{" "}
            <strong className="text-pass">{rated(c.up)} hospitals moved up</strong>,{" "}
            <strong className="text-abt-red-dark">{rated(c.down)} moved down</strong> and {rated(c.same)} kept the same rating.
            {" "}{rated(c.newly_rated)} became newly rated and {rated(c.no_longer_rated)} are no longer rated.
            {(c.added > 0 || c.removed > 0) && ` ${rated(c.added)} appear only in the later run and ${rated(c.removed)} only in the earlier one.`}
          </p>

          <div className="grid gap-x-16 gap-y-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
            <Section title="Ratings in each run">
              <table className="w-full text-[15px]">
                <thead className={tableHead}>
                  <tr>
                    <th scope="col" className="px-3 py-2">Rating</th>
                    <th scope="col" className="px-3 py-2 text-right">Earlier</th>
                    <th scope="col" className="px-3 py-2 text-right">Later</th>
                    <th scope="col" className="px-3 py-2 text-right">Change</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line-soft">
                  {(["5", "4", "3", "2", "1"] as const).map((k) => {
                    const d = data.distribution.target[k] - data.distribution.base[k];
                    return (
                      <tr key={k}>
                        <th scope="row" className="px-3 py-2.5 text-left font-semibold text-ink"><StarLabel n={k} /></th>
                        <td className="tabular px-3 py-2.5 text-right">{fmt.int(data.distribution.base[k])}</td>
                        <td className="tabular px-3 py-2.5 text-right">{fmt.int(data.distribution.target[k])}</td>
                        <td className={`tabular px-3 py-2.5 text-right font-semibold ${d > 0 ? "text-ink" : d < 0 ? "text-abt-red-dark" : "text-muted"}`}>
                          {d > 0 ? `+${fmt.int(d)}` : d < 0 ? `−${fmt.int(-d)}` : "0"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t border-ink">
                    <th scope="row" className="px-3 py-2.5 text-left font-bold text-ink">Rated</th>
                    <td className="tabular px-3 py-2.5 text-right font-bold text-ink">{fmt.int(data.base.kpis.rated)}</td>
                    <td className="tabular px-3 py-2.5 text-right font-bold text-ink">{fmt.int(data.target.kpis.rated)}</td>
                    <td className="tabular px-3 py-2.5 text-right font-bold text-ink">{fmt.int(data.target.kpis.rated - data.base.kpis.rated)}</td>
                  </tr>
                </tfoot>
              </table>
            </Section>

            <Section title="Where hospitals moved" description="Rows are the earlier rating, columns the later rating. The diagonal kept the same rating.">
              <Matrix data={data} />
            </Section>
          </div>

          <Section className="mt-14" title="Hospitals that changed" description="Select a CCN to open that hospital in the later run.">
            <div className="mb-4 flex flex-wrap items-end gap-3">
              <div className="flex flex-wrap gap-1" role="group" aria-label="Show changes">
                <FilterButton active={filter === ""} onClick={() => setFilter("")}>All {fmt.int(data.changes.length)}</FilterButton>
                {(Object.keys(STATUS) as Shown[]).filter((k) => c[k] > 0).map((k) => (
                  <FilterButton key={k} active={filter === k} onClick={() => setFilter(k)}>
                    <span className={filter === k ? "" : STATUS[k].tone}>{STATUS[k].icon}</span>
                    {STATUS[k].label} {fmt.int(c[k])}
                  </FilterButton>
                ))}
              </div>
              <label className="ml-auto text-sm font-semibold text-ink">
                <span className="sr-only">State</span>
                <select value={state} onChange={(e) => setState(e.target.value)} className="min-h-11 rounded-control border border-[#999] bg-white px-3">
                  <option value="">All states</option>
                  {states.map((s) => <option key={s} value={s}>{STATE_NAMES[s] ?? "No state code"}</option>)}
                </select>
              </label>
            </div>

            <div tabIndex={0} role="region" aria-label="Table, scrolls sideways on small screens" className="relative overflow-x-auto">
              <table className="w-full min-w-[720px] text-[15px]">
                <thead className={tableHead}>
                  <tr>
                    <th scope="col" className="px-3 py-2">CCN</th>
                    <th scope="col" className="px-3 py-2">State</th>
                    <th scope="col" className="px-3 py-2">Change</th>
                    <th scope="col" className="px-3 py-2 text-right">Earlier rating</th>
                    <th scope="col" className="px-3 py-2 text-right">Later rating</th>
                    <th scope="col" className="px-3 py-2 text-right">Summary score, earlier</th>
                    <th scope="col" className="px-3 py-2 text-right">Later</th>
                    <th scope="col" className="px-3 py-2 text-right">Difference</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line-soft">
                  {rows.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE).map((r) => {
                    const s = STATUS[r.status as Shown];
                    return (
                      <tr key={r.id}>
                        <td className="px-3 py-2">
                          <button onClick={() => openHospital(r.id)} className="tabular min-h-9 font-bold text-ink underline decoration-line underline-offset-4 hover:text-abt-red hover:decoration-abt-red">
                            {r.id}
                          </button>
                        </td>
                        <td className="px-3 py-2">{r.state}</td>
                        <td className={`px-3 py-2 font-semibold ${s.tone}`}><span className="inline-flex items-center gap-1.5">{s.icon}{s.label}</span></td>
                        <td className="tabular px-3 py-2 text-right">{r.before ?? "–"}</td>
                        <td className="tabular px-3 py-2 text-right font-semibold text-ink">{r.after ?? "–"}</td>
                        <td className="tabular px-3 py-2 text-right">{fmt.score(r.summaryBefore)}</td>
                        <td className="tabular px-3 py-2 text-right">{fmt.score(r.summaryAfter)}</td>
                        <td className="tabular px-3 py-2 text-right">{fmt.score(r.delta)}</td>
                      </tr>
                    );
                  })}
                  {rows.length === 0 && (
                    <tr><td colSpan={8} className="px-3 py-10 text-center text-muted">No hospitals changed in this view.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <nav aria-label="Pagination" className="flex items-center justify-between border-t border-line-soft py-3 text-sm">
              <span className="tabular text-muted">{fmt.int(rows.length)} hospitals, page {page + 1} of {pages}</span>
              <div className="flex gap-2">
                <button aria-label="Previous page" disabled={page === 0} onClick={() => setPage(page - 1)} className={`${buttonClass.secondary} !px-3`}><ChevronLeft aria-hidden className="size-4" /></button>
                <button aria-label="Next page" disabled={page >= pages - 1} onClick={() => setPage(page + 1)} className={`${buttonClass.secondary} !px-3`}><ChevronRight aria-hidden className="size-4" /></button>
              </div>
            </nav>
          </Section>
        </>
      )}
    </>
  );
}

function RunSelect({ id, label, value, runs, onChange }: {
  id: string;
  label: string;
  value: string;
  runs: RunSummary[] | null;
  onChange: (v: string) => void;
}) {
  return (
    <div className="min-w-64 flex-1">
      <label htmlFor={id} className="mb-1 block text-sm font-semibold text-heading">{label}</label>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)} className="min-h-11 w-full rounded-control border border-[#999] bg-white px-3">
        {!runs && <option>Loading runs…</option>}
        {runs?.map((r) => <option key={r.id} value={r.id}>{runName(r)}</option>)}
      </select>
    </div>
  );
}

function FilterButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      aria-pressed={active}
      onClick={onClick}
      className={`tabular inline-flex min-h-11 items-center gap-1.5 rounded-control border px-3 text-[15px] font-semibold transition-colors duration-150 ${
        active ? "border-ink bg-ink text-white" : "border-[#999] bg-white text-ink hover:border-ink"
      }`}
    >
      {children}
    </button>
  );
}

function Matrix({ data }: { data: Comparison }) {
  const label = (k: RatingKey) => (k === "none" ? "Not rated" : <StarLabel n={k} />);
  const cells = ORDER.flatMap((b) => ORDER.map((t) => (b === "none" && t === "none" ? 0 : data.matrix[b][t])));
  const max = Math.max(1, ...cells);
  return (
    <div tabIndex={0} role="region" aria-label="Table, scrolls sideways on small screens" className="relative overflow-x-auto">
      <table className="w-full min-w-[440px] border-separate border-spacing-[3px] text-[14px]">
        <caption className="sr-only">Hospitals by earlier rating (rows) and later rating (columns)</caption>
        <thead>
          <tr>
            <td className="text-[12px] text-muted">Earlier, later</td>
            {ORDER.map((t) => <th key={t} scope="col" className="pb-1 text-center font-bold text-ink">{label(t)}</th>)}
          </tr>
        </thead>
        <tbody>
          {ORDER.map((b, bi) => (
            <tr key={b}>
              <th scope="row" className="pr-2 text-left font-bold whitespace-nowrap text-ink">{label(b)}</th>
              {ORDER.map((t, ti) => {
                const n = data.matrix[b][t];
                const both = b === "none" && t === "none";
                const same = bi === ti;
                const up = !same && b !== "none" && t !== "none" && ti < bi;
                const down = !same && b !== "none" && t !== "none" && ti > bi;
                const strength = both ? 0 : Math.sqrt(n / max);
                const rgb = same ? "26,26,26" : up ? "23,112,63" : down ? "187,33,39" : "102,102,102";
                const dark = strength > 0.55;
                return (
                  <td
                    key={t}
                    className={`tabular h-11 text-center ${dark ? "text-white" : "text-ink"} ${n === 0 ? "!text-muted" : ""}`}
                    style={{ background: n && !both ? `rgba(${rgb},${0.08 + strength * 0.85})` : "#fafafa" }}
                  >
                    {both ? "–" : fmt.int(n)}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted" aria-hidden>
        <li className="inline-flex items-center gap-1.5"><span className="size-3" style={{ background: "rgba(23,112,63,.6)" }} /> Moved up</li>
        <li className="inline-flex items-center gap-1.5"><span className="size-3" style={{ background: "rgba(187,33,39,.6)" }} /> Moved down</li>
        <li className="inline-flex items-center gap-1.5"><span className="size-3" style={{ background: "rgba(26,26,26,.6)" }} /> Same rating</li>
      </ul>
    </div>
  );
}
