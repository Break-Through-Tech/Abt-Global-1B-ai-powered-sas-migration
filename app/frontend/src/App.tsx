import {
  BarChart3, BookOpen, Building2, Check, Download, FileText, GitCompare, HelpCircle, Mail, Menu, Play,
  ShieldCheck, X,
} from "lucide-react";
import { useEffect, useRef, useState, type ComponentType } from "react";
import { api, fmt, type RunSummary } from "./api";
import { Notice, Skeleton, buttonClass } from "./components/ui";
import { useMediaQuery } from "./hooks";
import { ComparePage } from "./pages/Compare";
import { HospitalDetailPage } from "./pages/HospitalDetail";
import { HospitalsPage } from "./pages/Hospitals";
import { AccessibilityPage, HelpPage, PrivacyPage } from "./pages/Info";
import { MethodologyPage } from "./pages/Methodology";
import { OverviewPage } from "./pages/Overview";
import { ReportPage } from "./pages/Report";
import { RunPage } from "./pages/Run";
import { ValidationPage } from "./pages/Validation";
import { useRoute, useRun } from "./state";

type NavItem = { path: string; label: string; icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }> };

const NAV_GROUPS: { label: string; items: NavItem[] }[] = [
  {
    label: "Analyze",
    items: [
      { path: "", label: "Ratings", icon: BarChart3 },
      { path: "hospitals", label: "Hospitals", icon: Building2 },
      { path: "compare", label: "Compare runs", icon: GitCompare },
    ],
  },
  {
    label: "Pipeline",
    items: [
      { path: "run", label: "Run pipeline", icon: Play },
      { path: "validation", label: "SAS parity", icon: ShieldCheck },
    ],
  },
  {
    label: "Reference",
    items: [
      { path: "report", label: "Report", icon: FileText },
      { path: "methodology", label: "Methodology", icon: BookOpen },
      { path: "help", label: "Help", icon: HelpCircle },
    ],
  },
];

const TITLES: Record<string, string> = {
  ...Object.fromEntries(NAV_GROUPS.flatMap((g) => g.items.map((i) => [i.path, i.label]))),
  accessibility: "Accessibility",
  privacy: "Data and privacy",
};

export default function App() {
  const route = useRoute();
  const { about, run, error, reload } = useRun();
  const section = route[0] ?? "";
  const wide = useMediaQuery("(min-width: 1280px)");
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const label = route[1] ? `Hospital ${route[1]}` : TITLES[section] ?? "Not found";
    document.title = `${label} | Star Ratings Studio | Abt Global`;
    setMenuOpen(false);
  }, [route, section]);

  let page;
  // Help and policy pages work even when the pipeline service is down.
  if (section === "help") page = <HelpPage about={about} />;
  else if (section === "accessibility") page = <AccessibilityPage about={about} />;
  else if (section === "privacy") page = <PrivacyPage about={about} />;
  else if (error) {
    page = (
      <Notice tone="error" title="The Star Ratings service is not responding">
        <p>{error}</p>
        <button className={`${buttonClass.secondary} mt-3`} onClick={reload}>Try again</button>
      </Notice>
    );
  } else if (!run) {
    page = (
      <div aria-busy="true" aria-label="Loading results" className="space-y-6">
        <Skeleton className="h-9 w-80 max-w-full" />
        <Skeleton className="h-96" />
      </div>
    );
  } else if (section === "") page = <OverviewPage run={run} />;
  else if (section === "run") page = <RunPage />;
  else if (section === "compare") page = <ComparePage />;
  // Wide screens keep the list and show the hospital beside it; narrow screens get a full page.
  else if (section === "hospitals" && route[1] && !wide) page = <HospitalDetailPage run={run} ccn={route[1]} />;
  else if (section === "hospitals") page = <HospitalsPage run={run} selected={route[1] ?? null} />;
  else if (section === "validation") page = <ValidationPage run={run} />;
  else if (section === "methodology") page = <MethodologyPage />;
  else if (section === "report") page = <ReportPage run={run} />;
  else page = <Notice tone="warning" title="This page does not exist"><a className="underline" href="#/">Go to the ratings</a></Notice>;

  return (
    <div className="min-h-screen lg:pl-[264px] print:pl-0">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[60] focus:bg-white focus:px-3 focus:py-2 focus:text-ink">
        Skip to content
      </a>

      {/* Phone and tablet: top bar with a menu button */}
      <header className="sticky top-0 z-30 flex items-center justify-between gap-3 bg-charcoal px-4 text-white lg:hidden print:hidden">
        <Lockup />
        <button
          className="inline-flex min-h-11 items-center gap-2 px-2 text-[15px] font-semibold"
          aria-expanded={menuOpen}
          aria-controls="sidebar"
          onClick={() => setMenuOpen(true)}
        >
          <Menu aria-hidden className="size-5" /> Menu
        </button>
      </header>

      <Sidebar section={section} run={run} open={menuOpen} onClose={() => setMenuOpen(false)} />

      <main id="main" className="px-4 pt-7 pb-16 sm:px-6 lg:px-10 print:p-0">{page}</main>
    </div>
  );
}

function Lockup() {
  const { about } = useRun();
  return (
    <div className="flex items-center gap-3 py-3">
      <a href="#/" className="flex items-center gap-3">
        <img src="/abt-logo.svg" alt="" className="size-9" />
        <span className="leading-none">
          <span className="block text-[12px] font-semibold tracking-[0.02em] text-shell-text">Abt Global</span>
          <span className="mt-0.5 block text-[18px] font-bold tracking-[-0.01em]">Star Ratings Studio</span>
        </span>
      </a>
      {about?.environment && (
        <span
          title={`This is the ${about.environment} environment, not production`}
          className="rounded-[3px] border border-[#f0b429] px-1.5 py-0.5 text-[11px] font-bold tracking-[0.06em] text-[#f0b429] uppercase"
        >
          {about.environment}
        </span>
      )}
    </div>
  );
}

/** Persistent navigation with the run every screen is showing. On small screens it opens as a drawer. */
function Sidebar({ section, run, open, onClose }: {
  section: string;
  run: RunSummary | null;
  open: boolean;
  onClose: () => void;
}) {
  const { about } = useRun();
  const closeRef = useRef<HTMLButtonElement>(null);
  const desktop = useMediaQuery("(min-width: 1024px)");

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <>
      {open && <div aria-hidden className="fixed inset-0 z-40 bg-black/45 lg:hidden" onClick={onClose} />}
      <aside
        id="sidebar"
        aria-label="Navigation"
        inert={!open && !desktop}
        className={`fixed inset-y-0 left-0 z-50 flex w-[264px] flex-col overflow-y-auto bg-charcoal text-white transition-transform duration-200 lg:translate-x-0 print:hidden ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-start justify-between px-5 pt-2">
          <Lockup />
          <button ref={closeRef} onClick={onClose} aria-label="Close menu" className="mt-3 inline-flex size-11 items-center justify-center lg:hidden">
            <X aria-hidden className="size-5" />
          </button>
        </div>

        {run && <RunPicker run={run} />}

        <nav aria-label="Main" className="mt-4 flex-1 px-3">
          {NAV_GROUPS.map((group) => (
            <div key={group.label} className="mb-5">
              <p className="px-3 pb-1.5 text-[12px] font-semibold text-shell-text">{group.label}</p>
              <ul>
                {group.items.map(({ path, label, icon: Icon }) => {
                  const active = section === path;
                  return (
                    <li key={path}>
                      <a
                        href={`#/${path}`}
                        aria-current={active ? "page" : undefined}
                        className={`flex min-h-10 items-center gap-3 rounded-control px-3 text-[15px] font-semibold transition-colors duration-150 ${
                          active ? "bg-white/10 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]" : "text-[#d4d4d4] hover:bg-white/5 hover:text-white"
                        }`}
                      >
                        <Icon aria-hidden className={`size-[18px] ${active ? "text-[#ff6b70]" : "text-shell-text"}`} />
                        {label}
                      </a>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="space-y-3 border-t border-white/10 px-6 py-5 text-[13px] leading-relaxed text-shell-text">
          <p>Reproduced ratings. Not official CMS publications.</p>
          <ul className="space-y-0.5">
            <li><a href="#/accessibility" className="inline-flex min-h-6 items-center text-white underline decoration-white/30 underline-offset-4 hover:decoration-white">Accessibility</a></li>
            <li><a href="#/privacy" className="inline-flex min-h-6 items-center text-white underline decoration-white/30 underline-offset-4 hover:decoration-white">Data and privacy</a></li>
          </ul>
          {about?.supportEmail ? (
            <a href={`mailto:${about.supportEmail}`} className="inline-flex min-h-6 items-center gap-1.5 text-white underline decoration-white/30 underline-offset-4 hover:decoration-white">
              <Mail aria-hidden className="size-4" /> {about.supportEmail}
            </a>
          ) : (
            <p>Support: your Abt Global project team</p>
          )}
          <p className="tabular">
            Version {about?.version ?? "–"}
            {about && <span className="block font-mono text-[12px]">pipeline {about.pipelineCommit.slice(0, 7)}</span>}
          </p>
        </div>
      </aside>
    </>
  );
}

/** Which run every number on screen comes from, switchable from anywhere, with its SAS status. */
function RunPicker({ run }: { run: RunSummary }) {
  const { setRun } = useRun();
  const [runs, setRuns] = useState<RunSummary[]>([]);

  useEffect(() => {
    api.runs().then(setRuns).catch(() => setRuns([]));
  }, [run.id]);

  const passed = run.validation.filter((c) => c.passed).length;
  const allPass = run.validation.length > 0 && passed === run.validation.length;
  const options = runs.some((r) => r.id === run.id) ? runs : [run, ...runs];

  return (
    <div className="mx-3 mt-3 rounded-control bg-white/[0.06] p-3">
      <label htmlFor="run-picker" className="block px-0.5 pb-1 text-[12px] font-semibold text-shell-text">Viewing run</label>
      <select
        id="run-picker"
        value={run.id}
        onChange={(e) => { const next = options.find((r) => r.id === e.target.value); if (next) setRun(next); }}
        className="min-h-10 w-full rounded-control border border-white/20 bg-charcoal px-2 text-[14px] font-semibold text-white"
      >
        {options.map((r) => (
          <option key={r.id} value={r.id}>
            {r.label} ({new Date(r.createdAt).toLocaleDateString([], { dateStyle: "medium" })})
          </option>
        ))}
      </select>
      <dl className="tabular mt-2.5 grid grid-cols-2 gap-x-3 px-0.5 text-[13px]">
        <dt className="text-shell-text">Hospitals</dt><dd className="text-right text-white">{fmt.int(run.kpis.hospitals)}</dd>
        <dt className="text-shell-text">Rated</dt><dd className="text-right text-white">{fmt.int(run.kpis.rated)}</dd>
      </dl>
      <div className="mt-2 flex flex-col gap-0.5 px-0.5 text-[13px]">
        {run.isReference ? (
          <a href="#/validation" className={`inline-flex min-h-6 items-center gap-1 font-semibold hover:underline ${allPass ? "text-[#7ee2a8]" : "text-[#ff8a8e]"}`}>
            {allPass ? <Check aria-hidden className="size-4" strokeWidth={2.5} /> : <X aria-hidden className="size-4" strokeWidth={2.5} />}
            {passed} of {run.validation.length} tables match SAS
          </a>
        ) : (
          <span className="text-[#9cc7ef]">No SAS answer key for this input</span>
        )}
        <a href={api.zipUrl(run.id)} download className="inline-flex min-h-6 items-center gap-1.5 font-semibold text-white hover:underline">
          <Download aria-hidden className="size-4" /> Download outputs
        </a>
      </div>
    </div>
  );
}
