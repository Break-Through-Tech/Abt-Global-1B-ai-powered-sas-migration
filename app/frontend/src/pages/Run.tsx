import { Check, FileUp, Loader2, Trash2 } from "lucide-react";
import { Term } from "../components/Term";
import { useEffect, useState, type DragEvent } from "react";
import { api, fmt, type RunSummary } from "../api";
import { Notice, PageHeader, Section, buttonClass, tableHead } from "../components/ui";
import { navigate, useRun } from "../state";

const PROGRAMS = [
  { n: 0, title: "Program 0: standardize measures" },
  { n: 1, title: "Program 1: group scores" },
  { n: 2, title: "Program 2: summary score and stars" },
];

export function RunPage() {
  const { run, setRun } = useRun();
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<RunSummary[]>([]);
  const [dragging, setDragging] = useState(false);
  const [label, setLabel] = useState("");
  const [confirming, setConfirming] = useState<string | null>(null);

  async function remove(id: string) {
    try {
      await api.remove(id);
      setConfirming(null);
      setHistory((h) => h.filter((r) => r.id !== id));
    } catch (e) {
      setError((e as Error).message);
    }
  }

  useEffect(() => {
    api.runs().then(setHistory).catch(() => setHistory([]));
  }, [run?.id]);

  async function start(useFile: boolean) {
    setBusy(true);
    setError(null);
    try {
      setRun(await api.start(useFile && file ? file : undefined, useFile ? label : ""));
      if (useFile) { setFile(null); setLabel(""); }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) setFile(dropped);
  }

  const totalSeconds = run?.steps.reduce((s, x) => s + x.seconds, 0) ?? 0;

  return (
    <>
      <PageHeader title="Run the pipeline">
        Score a reporting period from the raw Hospital Compare measure file. Programs 0, 1 and 2 run in order,
        and every run keeps a record of its input and code version.
      </PageHeader>

      <div className="grid gap-x-16 gap-y-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <Section title="Input">
          <div className="space-y-5">
            <label
              htmlFor="file"
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              className={`flex cursor-pointer items-center gap-4 rounded-control border border-dashed px-5 py-6 transition-colors duration-150 ${
                dragging ? "border-abt-red bg-abt-red-tint" : "border-[#999] hover:border-ink hover:bg-surface"
              }`}
            >
              <FileUp aria-hidden className="size-7 shrink-0 text-ink" strokeWidth={1.5} />
              <span>
                <span className="block font-bold text-ink">{file ? file.name : "Choose a measure file"}</span>
                <span className="block text-sm text-muted">
                  {file ? `${(file.size / 1e6).toFixed(1)} MB, ready to run` : "CSV or SAS dataset with the same columns as alldata_2025jul. Or drag it here."}
                </span>
              </span>
              <input id="file" type="file" accept=".csv,.sas7bdat" className="sr-only" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            </label>
            <div>
              <label htmlFor="label" className="mb-1 block text-sm font-semibold text-ink">Run name <span className="font-normal text-muted">(optional)</span></label>
              <input
                id="label"
                value={label}
                maxLength={80}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="e.g. October 2025 release"
                className="min-h-11 w-full rounded-control border border-[#999] bg-white px-3 focus:border-ink"
              />
              <p className="mt-1 text-sm text-muted">Used in comparisons and reports. Defaults to the file name.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button className={buttonClass.primary} disabled={!file || busy} onClick={() => start(true)}>
                {busy && file ? <Loader2 aria-hidden className="size-4 animate-spin" /> : null}
                Run on this file
              </button>
              <button className={buttonClass.secondary} disabled={busy} onClick={() => start(false)}>
                {busy && !file ? <Loader2 aria-hidden className="size-4 animate-spin" /> : null}
                Rerun July 2025 reference
              </button>
            </div>
            <p className="max-w-[60ch] text-sm text-muted">
              The file is scored on this server. Its results are saved on the server so you can reopen and compare them later. Nothing is sent to outside services.
            </p>
          </div>
        </Section>

        <Section
          title="Steps"
          description={run ? `Run ${run.id.slice(0, 6)} finished in ${fmt.ms(totalSeconds)}` : undefined}
        >
          <div aria-live="polite" aria-busy={busy}>
            {error && <div className="mb-5"><Notice tone="error" title="The run stopped before finishing">{error}</Notice></div>}
            {busy && <p className="mb-4 inline-flex items-center gap-2 font-semibold text-ink"><Loader2 aria-hidden className="size-4 animate-spin" /> Running Programs 0 to 2…</p>}
            <div className="space-y-6">
              {PROGRAMS.map((p) => (
                <div key={p.n}>
                  <h3 className="mb-1 text-[15px] text-heading">{p.title}</h3>
                  <table className="w-full text-[15px]">
                    <tbody className="divide-y divide-line-soft">
                      {(run?.steps ?? []).filter((s) => s.program === p.n).map((s) => (
                        <tr key={s.name} className={busy ? "opacity-50" : undefined}>
                          <td className="w-7 py-2.5 align-top"><Check aria-label="Done" className="mt-0.5 size-4 text-pass" strokeWidth={2.5} /></td>
                          <td className="py-2.5 pr-4">
                            <span className="block font-semibold text-ink">{s.name}</span>
                            <span className="block text-sm text-muted">{s.description}</span>
                          </td>
                          <td className="tabular py-2.5 text-right align-top whitespace-nowrap text-muted">{fmt.int(s.rows)} rows</td>
                          <td className="tabular w-16 py-2.5 text-right align-top text-muted">{fmt.ms(s.seconds)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
            {run && !busy && (
              <div className="mt-8 flex flex-wrap gap-3">
                <button className={buttonClass.dark} onClick={() => navigate("/")}>See the ratings</button>
                {run.isReference && <a className={buttonClass.link} href="#/validation">Compare with SAS</a>}
                {history.length > 1 && <a className={buttonClass.link} href="#/compare">Compare with an earlier run</a>}
              </div>
            )}
          </div>
        </Section>
      </div>

      <Section className="mt-14" title="Saved runs" description="Every run is saved on the server and kept until you delete it.">
        <div tabIndex={0} role="region" aria-label="Table, scrolls sideways on small screens" className="relative overflow-x-auto">
          <table className="w-full min-w-[640px] text-[15px]">
            <thead className={tableHead}>
              <tr>
                <th scope="col" className="px-3 py-2">Started</th>
                <th scope="col" className="px-3 py-2">Name</th>
                <th scope="col" className="px-3 py-2">Input file</th>
                <th scope="col" className="px-3 py-2 text-right">Rated</th>
                <th scope="col" className="px-3 py-2"><Term id="fingerprint">Input fingerprint</Term></th>
                <th scope="col" className="px-3 py-2"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line-soft">
              {history.map((h) => (
                <tr key={h.id} className={h.id === run?.id ? "bg-surface" : undefined}>
                  <td className="tabular px-3 py-2.5 whitespace-nowrap">{new Date(h.createdAt).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}</td>
                  <td className="px-3 py-2.5 font-semibold text-ink">{h.label}</td>
                  <td className="px-3 py-2.5 text-muted">{h.source}</td>
                  <td className="tabular px-3 py-2.5 text-right">{fmt.int(h.kpis.rated)}</td>
                  <td className="tabular px-3 py-2.5 font-mono text-[13px] text-muted">{h.input.sha256.slice(0, 16)}</td>
                  <td className="px-3 py-1 text-right whitespace-nowrap">
                    {confirming === h.id ? (
                      <span className="inline-flex items-center gap-3">
                        <span className="text-sm text-ink">Delete this run?</span>
                        <button className={buttonClass.link} onClick={() => remove(h.id)}>Delete</button>
                        <button className="min-h-11 text-[15px] font-bold text-ink hover:underline" onClick={() => setConfirming(null)}>Cancel</button>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-4">
                        {h.id === run?.id ? (
                          <span className="text-sm font-bold text-muted">Showing</span>
                        ) : (
                          <button className={buttonClass.link} onClick={() => setRun(h)}>Show</button>
                        )}
                        {h.id !== run?.id && (
                          <button
                            aria-label={`Delete ${h.label}`}
                            className="inline-flex min-h-11 min-w-11 items-center justify-center text-muted hover:text-abt-red-dark"
                            onClick={() => setConfirming(h.id)}
                          >
                            <Trash2 aria-hidden className="size-4" />
                          </button>
                        )}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>
    </>
  );
}
