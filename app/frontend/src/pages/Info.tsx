import { useEffect, type ReactNode } from "react";
import type { AboutInfo } from "../api";
import { PageHeader, Section } from "../components/ui";
import { GLOSSARY } from "../glossary";

const STATEMENT_DATE = "November 23, 2026";

function Contact({ about }: { about: AboutInfo | null }) {
  return about?.supportEmail ? (
    <a className="font-bold text-abt-red underline underline-offset-4" href={`mailto:${about.supportEmail}`}>{about.supportEmail}</a>
  ) : (
    <>your Abt Global project team</>
  );
}

function Prose({ children }: { children: ReactNode }) {
  return <div className="max-w-[68ch] space-y-3 text-[16px] leading-relaxed [&_li]:pl-1 [&_strong]:text-ink [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-5">{children}</div>;
}

/** Scrolls to "#/help#term" anchors after render. */
function useAnchor() {
  useEffect(() => {
    const id = window.location.hash.split("#")[2];
    if (id) document.getElementById(id)?.scrollIntoView({ block: "start" });
  }, []);
}

export function HelpPage({ about }: { about: AboutInfo | null }) {
  useAnchor();
  return (
    <>
      <PageHeader title="Help and glossary">
        How to use Star Ratings Studio and what its terms mean. Underlined terms elsewhere in the app show
        these same definitions when you hover over, focus or tap them.
      </PageHeader>

      <div className="grid gap-x-16 gap-y-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div className="space-y-12">
          <Section title="Common tasks">
            <Prose>
              <ul>
                <li><strong>See this period's ratings:</strong> open Ratings for the distribution, state map and peer groups.</li>
                <li><strong>Look up one hospital:</strong> open Hospitals, type its CCN, then select the row to see how its rating was built.</li>
                <li><strong>Score a new quarter:</strong> open Run pipeline, choose the measure file, give the run a name and select Run on this file.</li>
                <li><strong>See what changed:</strong> open Compare and pick an earlier and a later run.</li>
                <li><strong>Check the translation:</strong> SAS parity compares every output with the SAS package for the July 2025 input.</li>
                <li><strong>Share results:</strong> Report prints a run as a PDF, and Download outputs gives every table as CSV.</li>
              </ul>
            </Prose>
          </Section>

          <Section title="About this tool">
            <Prose>
              <p>
                Star Ratings Studio runs a Python translation of the CMS Overall Hospital Quality Star Rating SAS
                package (Programs 0, 1 and 2) and checks it against the SAS outputs. Ratings shown here are
                reproductions, not official CMS publications.
              </p>
              <p>
                Built by the Break Through Tech AI Studio team for Abt Global. Version {about?.version ?? "–"}
                {about && <>, pipeline commit <span className="tabular font-mono text-[14px]">{about.pipelineCommit.slice(0, 7)}</span></>}.
              </p>
              <p>Questions or problems: <Contact about={about} />.</p>
            </Prose>
          </Section>
        </div>

        <Section title="Glossary">
          <dl className="divide-y divide-line-soft border-t border-line-soft">
            {GLOSSARY.map((g) => (
              <div key={g.id} id={g.id} className="scroll-mt-28 py-3">
                <dt className="font-bold text-ink">{g.term}</dt>
                <dd className="mt-0.5 max-w-[68ch] leading-relaxed">{g.definition}</dd>
              </div>
            ))}
          </dl>
        </Section>
      </div>
    </>
  );
}

export function AccessibilityPage({ about }: { about: AboutInfo | null }) {
  return (
    <>
      <PageHeader title="Accessibility" meta={`Statement updated ${STATEMENT_DATE}`}>
        Star Ratings Studio is built to meet the Web Content Accessibility Guidelines (WCAG) 2.2 at level AA,
        the standard referenced by Section 508.
      </PageHeader>

      <div className="grid gap-x-16 gap-y-12 lg:grid-cols-2">
        <Section title="What we have done">
          <Prose>
            <ul>
              <li>Every page works with a keyboard alone, with a visible focus outline and a skip link to the main content.</li>
              <li>Pages use real headings, landmarks, labeled form controls and data tables with header cells.</li>
              <li>Sortable table columns announce their sort order. Toggle buttons announce whether they are pressed.</li>
              <li>Star ratings, charts and the state map have text equivalents, and every chart's numbers are also in a table.</li>
              <li>Color is never the only signal: changes carry words and icons, and thin data is outlined.</li>
              <li>Text and controls meet AA contrast. Buttons, filters and form fields are at least 44 pixels tall, and smaller inline links meet the 24 pixel minimum.</li>
              <li>Pages reflow to phone width without sideways scrolling, except wide data tables, which scroll inside their frame.</li>
              <li>Loading animations stop when the system asks for reduced motion.</li>
            </ul>
          </Prose>
        </Section>

        <Section title="How it is checked">
          <Prose>
            <p>
              This release was scanned page by page with the axe-core automated checker for WCAG 2.2 A and AA rules,
              and tested by hand with a keyboard at desktop and phone widths.
            </p>
            <p>
              <strong>Not yet done:</strong> testing with screen readers by people who use them, and an independent
              audit. A formal Section 508 conformance report (VPAT) has not been produced. Automated scans find only
              part of the possible issues, so this statement does not claim full conformance.
            </p>
          </Prose>
        </Section>

        <Section title="Known limitations">
          <Prose>
            <ul>
              <li>The state map's colors carry the data visually. Its values are also available in each tile's label and in the table below the map.</li>
              <li>The printable report is produced by the browser's print function. Whether the saved PDF is tagged for screen readers depends on the browser.</li>
              <li>Hospital names are not in the input data, so hospitals are identified by CCN only.</li>
            </ul>
          </Prose>
        </Section>

        <Section title="Report a problem">
          <Prose>
            <p>
              If something in the app is hard to use with your assistive technology, contact <Contact about={about} />.
              Please include the page and what you were trying to do.
            </p>
          </Prose>
        </Section>
      </div>
    </>
  );
}

export function PrivacyPage({ about }: { about: AboutInfo | null }) {
  return (
    <>
      <PageHeader title="Data and privacy" meta={`Updated ${STATEMENT_DATE}`}>
        What data Star Ratings Studio handles, where it is kept and who can see it.
      </PageHeader>

      <div className="grid gap-x-16 gap-y-12 lg:grid-cols-2">
        <Section title="What data it uses">
          <Prose>
            <p>
              The input is hospital-level quality measure data in the layout CMS publishes for the star rating
              (for example alldata_2025jul). It contains one row per hospital and no patient-level records. The
              app does not ask for or store personal information about patients or users.
            </p>
            <p>Do not upload files that contain patient-level or other sensitive data. The app is not designed to protect it.</p>
          </Prose>
        </Section>

        <Section title="What is saved">
          <Prose>
            <ul>
              <li><strong>Uploaded files</strong> are read into memory to be scored and are not kept. A SAS dataset is written to a temporary file while it is read, then deleted.</li>
              <li><strong>Results</strong> of each run (output tables, counts, validation results) are saved on the server that hosts the app and kept until someone deletes the run.</li>
              <li><strong>The input file's fingerprint</strong> (SHA-256), size and name are saved with the run, so you can tell which file produced it.</li>
              <li><strong>Server logs</strong> may record the pages and API addresses requested, which can include run IDs and CCNs.</li>
            </ul>
          </Prose>
        </Section>

        <Section title="Who can see it">
          <Prose>
            <p>
              The app has no user accounts yet. Anyone who can reach the server can view, download and delete saved
              runs, so it should be hosted on a network limited to the people who need it.
            </p>
          </Prose>
        </Section>

        <Section title="Third parties">
          <Prose>
            <p>
              The app sets no cookies, uses no analytics or tracking, and makes no requests to outside services.
              Fonts and images are served from the app itself. Data stays on the server where the app is installed.
            </p>
            <p>Questions about data handling: <Contact about={about} />.</p>
          </Prose>
        </Section>
      </div>
    </>
  );
}
