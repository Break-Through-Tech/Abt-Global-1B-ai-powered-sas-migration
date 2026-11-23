# Star Ratings Studio

A web app that runs the translated SAS pipeline (Programs 0, 1 and 2) and shows the hospital star ratings.
It ships as one Docker image: a FastAPI backend that runs the Python pipeline, and an Abt Global branded
React frontend.

## Run it

With Docker (no Python or Node needed):

```bash
docker compose up --build
```

Then open http://localhost:8000.

Without Docker, for development (two terminals, from the repo root):

```bash
uv run --group app uvicorn app.backend.main:app --reload
```

```bash
cd app/frontend && npm install && npm run dev
```

The Vite dev server (http://localhost:5173) forwards `/api` calls to the backend on port 8000.

## What it does

The app uses a standard app layout: a sidebar with navigation and a run picker (which saved run every
screen shows, its SAS status and its downloads), and the work area beside it. On phones and tablets the
sidebar opens from a Menu button.

| Page | Purpose |
|---|---|
| Ratings | Dashboard for one run: state map, rating distribution, national averages, peer groups, state rankings. Selecting a state filters the distribution |
| Run pipeline | Run on the July 2025 reference data or upload a new `.csv` / `.sas7bdat` measure file, name it, and manage saved runs |
| Compare | Two saved runs side by side: rating counts, a movement matrix, and every hospital that changed |
| Hospitals | Search by CCN, filter by state, star and peer group, sort any column. On wide screens a selected hospital opens beside the list |
| Hospital detail | Eligibility rules, how each group score feeds the summary score, every measure |
| SAS parity | Cell-by-cell comparison of all nine output tables with the SAS `.sas7bdat` datasets |
| Methodology | Each stage, the SAS program it replaces, and the Python module that does the work |
| Report | A run report laid out for US Letter. Print it or save it as PDF from the browser |

The state map shows the average rating, the share rated 4 or 5 stars, or the number rated, with one
tile per state so small states stay readable. State comes from the first two digits of the CCN. Selecting a
state opens the Hospitals list filtered to it.

Every run can be downloaded as a zip of all output CSVs plus `manifest.json` (input SHA-256, pipeline
commit, package versions, step timings and validation results).

## How it is built

* `data/Project_1/src/pipeline/run.py` chains Programs 0, 1 and 2 in memory with `run_pipeline(raw_df)`.
  It calls each program's own functions, so the app always uses the validated translation.
* `data/Project_1/src/pipeline/validate.py` compares a run with `SAS Output/*.sas7bdat`.
* `app/backend/main.py` is the API (`/api/docs` lists every endpoint).
* `app/backend/storage.py` saves every run to `RUNS_DIR` (default `app/runs/`, which git ignores) as
  `summary.json` plus gzip CSV tables, so runs survive restarts and stay readable without the app. The
  uploaded input file itself is not kept, only its SHA-256 fingerprint and the outputs.
* `app/backend/compare.py` matches two runs by CCN and reports who moved up, moved down, became rated or
  stopped being rated.
* `app/frontend/` is React, TypeScript, Vite and Tailwind. Brand colors, the Sofia Sans typeface and the
  logo come from abtglobal.com. Fonts are bundled, so the app makes no calls to outside services.

## Deployment

`.github/workflows/star-ratings-studio.yml` runs the tests on every pull request. On every merge to
`main` it builds the image and publishes it to GitHub Container Registry as
`ghcr.io/break-through-tech/abt-global-1b-ai-powered-sas-migration/star-ratings-studio:latest`
(and a tag for each commit).

Saved runs live in `/srv/runs` inside the container. `docker compose` mounts a named volume there; with
plain `docker run`, add `-v star-ratings-runs:/srv/runs` or the runs are lost when the container is removed.

Any container host can run that image on port 8000, for example an internal server with
`docker run -p 8000:8000 <image>`, Azure App Service, AWS App Runner or ECS, or Kubernetes.
`/api/health` is the health check.

## Settings

Set these environment variables on the container (or in `docker compose`) to fit the deployment:

| Variable | Effect |
|---|---|
| `APP_ENVIRONMENT` | Shows a tag such as "Test" in the header. Empty or `production` hides it. |
| `SUPPORT_EMAIL` | Support address in the footer, Help, Accessibility and Data and privacy pages. Without it they say to contact the Abt Global project team. |
| `RUNS_DIR` | Where saved runs are stored. Set to `/srv/runs` in the image. |

## Help and policy pages

Help (common tasks and a glossary), Accessibility (the accessibility statement) and Data and privacy are
linked from the footer and work even when the pipeline service is down. Underlined terms across the app
show their glossary definition on hover, focus or tap; the text lives in `app/frontend/src/glossary.ts`.

## Accessibility

Targets WCAG 2.2 AA (Section 508). The November 2026 build scanned clean with axe-core (WCAG 2.2 A and AA
rules) on every page at 1280 and 375 pixels wide. Screen reader testing, an independent audit and a VPAT
are still to do (see the Accessibility page in the app).

Built in: keyboard navigation with visible focus, a skip link, labeled form controls, sortable table
headers announced with `aria-sort`, star ratings with text labels, charts with screen-reader data tables,
keyboard-reachable scrolling tables, and reduced motion support.
