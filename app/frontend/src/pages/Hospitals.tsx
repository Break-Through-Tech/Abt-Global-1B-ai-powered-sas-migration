import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, Download, Search, X } from "lucide-react";
import { Term } from "../components/Term";
import { useEffect, useMemo, useState } from "react";
import { api, fmt, GROUP_LABELS, type GroupKey, type HospitalRow, type RunSummary } from "../api";
import { Notice, PageHeader, Skeleton, StarLabel, Stars, buttonClass, tableHead } from "../components/ui";
import { hashQuery, navigate } from "../state";
import { HospitalDetailView } from "./HospitalDetail";
import { STATE_NAMES } from "../components/StateMap";

type SortKey = "id" | "state" | "star" | "summary" | "peer" | GroupKey;
const PAGE_SIZE = 25;
const GROUP_KEYS = Object.keys(GROUP_LABELS) as GroupKey[];
const SHORT: Record<GroupKey, string> = {
  mortality: "Mort.",
  safety: "Safety",
  readmission: "Readm.",
  patient_experience: "Pt. exp.",
  process: "Process",
};

export function HospitalsPage({ run, selected = null }: { run: RunSummary; selected?: string | null }) {
  const panel = selected !== null;
  const [rows, setRows] = useState<HospitalRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [state, setState] = useState(() => hashQuery().get("state") ?? "");
  const [starFilter, setStarFilter] = useState<Set<number>>(new Set());
  const [peer, setPeer] = useState("");
  const [ratedOnly, setRatedOnly] = useState(true);
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: "summary", dir: -1 });
  const [page, setPage] = useState(0);

  useEffect(() => {
    setRows(null);
    api.hospitals(run.id).then(setRows).catch((e: Error) => setError(e.message));
  }, [run.id]);

  const states = useMemo(() => [...new Set((rows ?? []).map((r) => r.state))].sort(), [rows]);

  const filtered = useMemo(() => {
    if (!rows) return [];
    const q = query.trim().toUpperCase();
    const out = rows.filter((r) =>
      (!q || r.id.includes(q)) &&
      (!state || r.state === state) &&
      (!peer || String(r.peer) === peer) &&
      (!ratedOnly || r.star !== null) &&
      (starFilter.size === 0 || (r.star !== null && starFilter.has(r.star))),
    );
    const { key, dir } = sort;
    return out.sort((a, b) => {
      const av = a[key], bv = b[key];
      if (av === null) return 1;
      if (bv === null) return -1;
      return (av < bv ? -1 : av > bv ? 1 : 0) * dir;
    });
  }, [rows, query, state, peer, ratedOnly, starFilter, sort]);

  useEffect(() => setPage(0), [query, state, peer, ratedOnly, starFilter, sort]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const visible = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const hasFilters = query || state || peer || starFilter.size > 0 || !ratedOnly;

  const toggleStar = (n: number) =>
    setStarFilter((prev) => {
      const next = new Set(prev);
      if (next.has(n)) next.delete(n);
      else next.add(n);
      return next;
    });

  const clear = () => {
    setQuery(""); setState(""); setPeer(""); setStarFilter(new Set()); setRatedOnly(true);
  };

  const header = (key: SortKey, label: string, align: "left" | "right" = "left", title?: string) => {
    const active = sort.key === key;
    return (
      <th
        scope="col"
        aria-sort={active ? (sort.dir === 1 ? "ascending" : "descending") : "none"}
        className={`px-3 py-2.5 font-semibold whitespace-nowrap ${align === "right" ? "text-right" : "text-left"}`}
      >
        <button
          title={title}
          className={`inline-flex min-h-6 items-center gap-1 hover:text-abt-red ${active ? "text-ink" : ""}`}
          onClick={() => setSort({ key, dir: active ? (sort.dir === 1 ? -1 : 1) : key === "id" || key === "state" ? 1 : -1 })}
        >
          {label}
          {active && (sort.dir === 1 ? <ArrowUp aria-hidden className="size-3.5" /> : <ArrowDown aria-hidden className="size-3.5" />)}
        </button>
      </th>
    );
  };

  return (
    <>
      <PageHeader
        title="Hospitals"
        actions={
          <a className={buttonClass.secondary} href={api.csvUrl(run.id, "STAR_2025JUL")} download>
            <Download aria-hidden className="size-4" /> Download star table
          </a>
        }
      >
        Find a hospital by its CMS Certification Number (<Term id="ccn">CCN</Term>), or narrow the list. Open any row to see how its rating was built.
      </PageHeader>

      <div className={panel ? "grid items-start gap-x-8 xl:grid-cols-[minmax(0,1fr)_minmax(440px,0.85fr)]" : undefined}>
      <div className="min-w-0">
      <div role="search" aria-label="Filter hospitals" className="mb-6 rounded-control bg-surface p-4">
        <div className="flex flex-wrap items-end gap-4">
          <div className="min-w-48 flex-1">
            <label htmlFor="q" className="mb-1 block text-sm font-semibold text-heading">CCN</label>
            <div className="relative">
              <Search aria-hidden className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" />
              <input
                id="q"
                value={query}
                onChange={(e) => setQuery(e.target.value.replace(/[^0-9a-zA-Z]/g, ""))}
                placeholder="e.g. 010001"
                className="min-h-11 w-full rounded-control border border-[#999] bg-white pr-3 pl-9 focus:border-ink"
              />
            </div>
          </div>
          <div>
            <label htmlFor="state" className="mb-1 block text-sm font-semibold text-heading">State</label>
            <select id="state" value={state} onChange={(e) => setState(e.target.value)} className="min-h-11 rounded-control border border-[#999] bg-white px-3">
              <option value="">All states</option>
              {states.map((s) => <option key={s} value={s}>{STATE_NAMES[s] ?? "No state code"}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="peer" className="mb-1 block text-sm font-semibold text-heading">Peer group</label>
            <select id="peer" value={peer} onChange={(e) => setPeer(e.target.value)} className="min-h-11 rounded-control border border-[#999] bg-white px-3">
              <option value="">All</option>
              {[3, 4, 5].map((p) => <option key={p} value={p}>{p} measure groups</option>)}
            </select>
          </div>
          <fieldset>
            <legend className="mb-1 text-sm font-semibold text-heading">Star rating</legend>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  aria-pressed={starFilter.has(n)}
                  onClick={() => toggleStar(n)}
                  className={`min-h-11 min-w-12 rounded-control border px-2.5 text-[15px] font-bold transition-colors duration-150 ${
                    starFilter.has(n) ? "border-ink bg-ink text-white" : "border-[#999] bg-white text-ink hover:border-ink"
                  }`}
                >
                  <StarLabel n={n} />
                </button>
              ))}
            </div>
          </fieldset>
          <label className="flex min-h-11 items-center gap-2 text-sm font-semibold text-ink">
            <input type="checkbox" checked={ratedOnly} onChange={(e) => setRatedOnly(e.target.checked)} className="size-4 accent-abt-red" />
            Rated only
          </label>
          {hasFilters && (
            <button onClick={clear} className={buttonClass.link}><X aria-hidden className="size-4" /> Clear filters</button>
          )}
        </div>
      </div>

      {error && <Notice tone="error" title="Could not load hospitals">{error}</Notice>}

      <div>
        <div className="flex items-center justify-between border-t border-ink py-3 text-sm">
          <p aria-live="polite" className="text-muted">
            <span className="tabular font-bold text-ink">{fmt.int(filtered.length)}</span> {filtered.length === 1 ? "hospital" : "hospitals"}
          </p>
          <p className={`hidden text-muted ${panel ? "" : "sm:block"}`}><Term id="group-score">Group scores</Term> are <Term id="standardized">standardized</Term>: 0 is the national mean, higher is better</p>
        </div>
        <div tabIndex={0} role="region" aria-label="Table, scrolls sideways on small screens" className="relative overflow-x-auto">
          <table className="w-full text-sm">
            <thead className={tableHead}>
              <tr>
                {header("id", "CCN")}
                {header("state", "State")}
                {header("star", "Rating")}
                {header("summary", "Summary", "right")}
                {header("peer", "Peer", "right", "Number of measure groups")}
                {!panel && GROUP_KEYS.map((k) => header(k, SHORT[k], "right", GROUP_LABELS[k]))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line-soft">
              {!rows && Array.from({ length: 8 }, (_, i) => (
                <tr key={i}><td colSpan={panel ? 5 : 10} className="px-3 py-2"><Skeleton className="h-6" /></td></tr>
              ))}
              {visible.map((r) => (
                <tr
                  key={r.id}
                  onClick={() => navigate(`/hospitals/${r.id}`)}
                  className={`cursor-pointer ${r.id === selected ? "bg-abt-red-tint" : "hover:bg-surface"}`}
                >
                  <td className="px-3 py-2.5">
                    <a
                      href={`#/hospitals/${r.id}`}
                      aria-current={r.id === selected ? "true" : undefined}
                      className="tabular font-bold text-ink underline decoration-line underline-offset-4 hover:text-abt-red hover:decoration-abt-red"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {r.id}
                    </a>
                  </td>
                  <td className="px-3 py-2.5">{r.state}</td>
                  <td className="px-3 py-2.5"><Stars value={r.star} size={15} /></td>
                  <td className="tabular px-3 py-2.5 text-right font-bold text-ink">{fmt.score(r.summary)}</td>
                  <td className="tabular px-3 py-2.5 text-right">{r.peer ?? "–"}</td>
                  {!panel && GROUP_KEYS.map((k) => (
                    <td key={k} className={`tabular px-3 py-2.5 text-right ${fmt.score(r[k], 2).startsWith("−") ? "text-abt-red-dark" : ""}`}>
                      {fmt.score(r[k], 2)}
                    </td>
                  ))}
                </tr>
              ))}
              {rows && visible.length === 0 && (
                <tr><td colSpan={panel ? 5 : 10} className="px-3 py-10 text-center text-muted">No hospitals match these filters. Clear a filter to widen the list.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <nav aria-label="Pagination" className="flex items-center justify-between border-t border-line-soft py-3 text-sm">
          <span className="tabular text-muted">Page {page + 1} of {pages}</span>
          <div className="flex gap-2">
            <button aria-label="Previous page" disabled={page === 0} onClick={() => setPage(page - 1)} className={buttonClass.secondary + " !px-3"}>
              <ChevronLeft aria-hidden className="size-4" />
            </button>
            <button aria-label="Next page" disabled={page >= pages - 1} onClick={() => setPage(page + 1)} className={buttonClass.secondary + " !px-3"}>
              <ChevronRight aria-hidden className="size-4" />
            </button>
          </div>
        </nav>
      </div>
      </div>

      {panel && (
        <aside
          aria-label={`Hospital ${selected} details`}
          className="sticky top-6 max-h-[calc(100vh-3rem)] overflow-y-auto border-l border-line pl-8"
        >
          <HospitalDetailView run={run} ccn={selected} onClose={() => navigate("/hospitals")} />
        </aside>
      )}
      </div>
    </>
  );
}
