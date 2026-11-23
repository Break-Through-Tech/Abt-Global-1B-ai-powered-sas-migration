import { Check, Download, Mail, X } from "lucide-react";
import { useEffect } from "react";
import { api, fmt, type RunSummary } from "./api";
import { Notice, Skeleton, buttonClass } from "./components/ui";
import { ComparePage } from "./pages/Compare";
import { AccessibilityPage, HelpPage, PrivacyPage } from "./pages/Info";
import { HospitalDetailPage } from "./pages/HospitalDetail";
import { HospitalsPage } from "./pages/Hospitals";
import { MethodologyPage } from "./pages/Methodology";
import { OverviewPage } from "./pages/Overview";
import { ReportPage } from "./pages/Report";
import { RunPage } from "./pages/Run";
import { ValidationPage } from "./pages/Validation";
import { useRoute, useRun } from "./state";

const NAV = [
  { path: "", label: "Ratings" },
  { path: "hospitals", label: "Hospitals" },
  { path: "run", label: "Run pipeline" },
  { path: "compare", label: "Compare" },
  { path: "validation", label: "SAS parity" },
  { path: "methodology", label: "Methodology" },
  { path: "report", label: "Report" },
  { path: "help", label: "Help" },
];

const INFO_TITLES: Record<string, string> = { accessibility: "Accessibility", privacy: "Data and privacy" };

export default function App() {
  const route = useRoute();
  const { about, run, error, reload } = useRun();
  const section = route[0] ?? "";

  useEffect(() => {
    const label = route[1] ? `Hospital ${route[1]}` : NAV.find((n) => n.path === section)?.label ?? INFO_TITLES[section] ?? "Not found";
    document.title = `${label} | Star Ratings Studio | Abt Global`;
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
        <Skeleton className="h-11 w-96 max-w-full" />
        <Skeleton className="h-64" />
      </div>
    );
  } else if (section === "") page = <OverviewPage run={run} />;
  else if (section === "run") page = <RunPage />;
  else if (section === "compare") page = <ComparePage />;
  else if (section === "hospitals" && route[1]) page = <HospitalDetailPage run={run} ccn={route[1]} />;
  else if (section === "hospitals") page = <HospitalsPage key={window.location.hash} run={run} />;
  else if (section === "validation") page = <ValidationPage run={run} />;
  else if (section === "methodology") page = <MethodologyPage />;
  else if (section === "report") page = <ReportPage run={run} />;
  else page = <Notice tone="warning" title="This page does not exist"><a className="underline" href="#/">Go to the ratings</a></Notice>;

  return (
    <div className="flex min-h-screen flex-col">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:bg-white focus:px-3 focus:py-2 focus:text-ink">
        Skip to content
      </a>

      <header className="sticky top-0 z-30 bg-charcoal text-white print:hidden">
        <div className="mx-auto flex max-w-[1280px] items-stretch gap-6 px-4 sm:px-8">
          <div className="flex shrink-0 items-center gap-3 py-3">
            <a href="#/" className="flex items-center gap-3">
              <img src="/abt-logo.svg" alt="" className="size-9" />
              <span className="leading-none">
                <span className="block text-[12px] font-semibold tracking-[0.02em] text-shell-text">Abt Global</span>
                <span className="mt-0.5 block text-[19px] font-bold tracking-[-0.01em]">Star Ratings Studio</span>
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
          <nav aria-label="Main" className="-mb-px ml-auto hidden md:flex">
            <NavLinks section={section} />
          </nav>
        </div>
        <nav aria-label="Main" className="overflow-x-auto border-t border-white/10 md:hidden">
          <div className="flex px-2"><NavLinks section={section} /></div>
        </nav>
      </header>

      {run && <RunContext run={run} />}

      <main id="main" className="mx-auto w-full max-w-[1280px] flex-1 px-4 pt-10 pb-20 sm:px-8 print:max-w-none print:p-0">{page}</main>

      <footer className="bg-charcoal text-shell-text print:hidden">
        <div className="mx-auto grid max-w-[1280px] gap-8 px-4 py-10 text-sm sm:px-8 md:grid-cols-[minmax(0,6fr)_minmax(0,3fr)_minmax(0,3fr)]">
          <div className="flex items-start gap-3">
            <img src="/abt-logo.svg" alt="Abt Global" className="size-8 shrink-0" />
            <p className="max-w-[60ch] leading-relaxed">
              Ratings are reproduced from the CMS Overall Hospital Quality Star Rating methodology with a
              Python translation of the SAS package. They are not official CMS publications.
            </p>
          </div>
          <nav aria-label="Footer">
            <ul className="space-y-1">
              {[["help", "Help and glossary"], ["accessibility", "Accessibility"], ["privacy", "Data and privacy"], ["methodology", "Methodology"]].map(([path, text]) => (
                <li key={path}>
                  <a href={`#/${path}`} className="inline-flex min-h-8 items-center text-white underline decoration-white/30 underline-offset-4 hover:decoration-white">{text}</a>
                </li>
              ))}
            </ul>
          </nav>
          <div className="space-y-1 leading-relaxed">
            {about?.supportEmail ? (
              <a href={`mailto:${about.supportEmail}`} className="inline-flex min-h-8 items-center gap-1.5 text-white underline decoration-white/30 underline-offset-4 hover:decoration-white">
                <Mail aria-hidden className="size-4" /> {about.supportEmail}
              </a>
            ) : (
              <p>For support, contact your Abt Global project team.</p>
            )}
            <p className="tabular">
              Version {about?.version ?? "–"}
              {about && <>, pipeline <span className="font-mono">{about.pipelineCommit.slice(0, 7)}</span></>}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

/**
 * Persistent provenance strip: which input every number on screen came from,
 * and whether that run reproduces SAS. This is the product's signature: every
 * view is anchored to an auditable run.
 */
function RunContext({ run }: { run: RunSummary }) {
  const passed = run.validation.filter((c) => c.passed).length;
  const allPass = run.validation.length > 0 && passed === run.validation.length;
  return (
    <div className={`border-b print:hidden ${run.isReference ? "border-line bg-surface" : "border-info/25 bg-info-tint"}`}>
      <div className="tabular mx-auto flex max-w-[1280px] flex-wrap items-center gap-x-6 gap-y-1 px-4 py-2 text-sm sm:px-8">
        <span className="font-bold text-ink">
          {run.label}
        </span>
        <span className="text-muted">{fmt.int(run.kpis.hospitals)} hospitals</span>
        <span className="text-muted">{fmt.int(run.kpis.rated)} rated</span>
        {run.isReference ? (
          <a href="#/validation" className={`inline-flex min-h-6 items-center gap-1 font-bold hover:underline ${allPass ? "text-pass" : "text-abt-red-dark"}`}>
            {allPass ? <Check aria-hidden className="size-4" strokeWidth={2.5} /> : <X aria-hidden className="size-4" strokeWidth={2.5} />}
            {passed} of {run.validation.length} tables match SAS
          </a>
        ) : (
          <span className="text-info">Not compared with SAS: no answer key for this input</span>
        )}
        <span className="text-muted">Run {run.id.slice(0, 6)}</span>
        <span className="text-muted">{new Date(run.createdAt).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}</span>
        <a href={api.zipUrl(run.id)} download className="ml-auto inline-flex min-h-8 items-center gap-1.5 font-bold text-ink hover:text-abt-red">
          <Download aria-hidden className="size-4" /> Download outputs
        </a>
      </div>
    </div>
  );
}

function NavLinks({ section }: { section: string }) {
  return (
    <ul className="flex whitespace-nowrap">
      {NAV.map((item) => {
        const active = section === item.path;
        return (
          <li key={item.path} className="flex">
            <a
              href={`#/${item.path}`}
              aria-current={active ? "page" : undefined}
              className={`flex items-center border-b-[3px] px-3.5 py-3 text-[16px] font-semibold transition-colors duration-150 md:py-0 ${
                active ? "border-abt-red text-white" : "border-transparent text-shell-text hover:text-white"
              }`}
            >
              {item.label}
            </a>
          </li>
        );
      })}
    </ul>
  );
}
