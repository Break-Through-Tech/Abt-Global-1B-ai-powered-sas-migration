"""Star Ratings Studio API.

Runs the translated Programs 0-2 and serves the results to the web UI.
Start locally from the repo root:
    uv run --group app uvicorn app.backend.main:app --reload
"""

from __future__ import annotations

import hashlib
import io
import json
import math
import os
import sys
import tempfile
import uuid
import zipfile
from contextlib import asynccontextmanager
from dataclasses import asdict
from datetime import datetime, timezone
from importlib.metadata import version
from pathlib import Path

import pandas as pd
from fastapi import Body, FastAPI, File, Form, HTTPException, UploadFile
from fastapi.responses import FileResponse, Response, StreamingResponse
from fastapi.staticfiles import StaticFiles

REPO_ROOT = Path(__file__).resolve().parents[2]
SRC_DIR = REPO_ROOT / "data" / "Project_1" / "src"
sys.path.insert(0, str(SRC_DIR))

from pipeline import PipelineResult, run_pipeline  # noqa: E402
from pipeline.run import ID_COL, load_raw_input  # noqa: E402
from pipeline.validate import validate_against_sas  # noqa: E402
from program_0.measures import ALL_MEASURES, MEASURE_GROUPS  # noqa: E402

from .compare import compare_runs  # noqa: E402
from .reference import (  # noqa: E402
    COUNT_COLUMNS,
    GROUPS,
    MEASURE_LABELS,
    NATIONAL_COLUMNS,
    state_from_ccn,
)
from .storage import RunStore  # noqa: E402

DATA_DIR = REPO_ROOT / "data" / "Project_1"
STATIC_DIR = Path(os.environ.get("STATIC_DIR", REPO_ROOT / "app" / "frontend" / "dist"))
MAX_UPLOAD_BYTES = 100 * 1024 * 1024
RUNS_DIR = Path(os.environ.get("RUNS_DIR", REPO_ROOT / "app" / "runs"))
REFERENCE_NAME = "alldata_2025jul.csv (July 2025 reference input)"
REFERENCE_LABEL = "July 2025 reference"
PIPELINE_COMMIT = os.environ.get("GIT_SHA", "local")
APP_VERSION = "1.0.0"
# Deployment settings, shown in the UI. Leave unset to hide.
APP_ENVIRONMENT = os.environ.get("APP_ENVIRONMENT", "").strip()      # e.g. "Test" or "Staging"
SUPPORT_EMAIL = os.environ.get("SUPPORT_EMAIL", "").strip()          # where users report problems



store = RunStore(RUNS_DIR)


def clean(value):
    """Converts pandas/numpy scalars to JSON-safe Python values."""
    if value is None or value is pd.NA:
        return None
    if isinstance(value, float) and math.isnan(value):
        return None
    if hasattr(value, "item"):
        value = value.item()
        if isinstance(value, float) and math.isnan(value):
            return None
    return value


def records(df: pd.DataFrame) -> list[dict]:
    return [{k: clean(v) for k, v in row.items()} for row in df.to_dict(orient="records")]


def peer_label(cnt_grp) -> int | None:
    if not isinstance(cnt_grp, str):
        return None
    return int(cnt_grp.split("=")[1].strip())


def star_distribution(star: pd.DataFrame) -> dict:
    rated = star[star["star"].notna()]
    overall = {str(s): int((rated["star"] == s).sum()) for s in range(1, 6)}
    by_peer = {}
    for label, part in rated.groupby(rated["cnt_grp"].map(peer_label)):
        by_peer[str(int(label))] = {str(s): int((part["star"] == s).sum()) for s in range(1, 6)}
    return {"overall": overall, "byPeerGroup": by_peer}


def state_summary(star: pd.DataFrame) -> list[dict]:
    """Hospitals, rated hospitals and rating mix per state (state read from the CCN)."""
    df = pd.DataFrame({"state": star[ID_COL].map(state_from_ccn), "star": star["star"]})
    out = []
    for state, part in df.groupby("state"):
        rated = part["star"].dropna()
        counts = {str(s): int((rated == s).sum()) for s in range(1, 6)}
        out.append({
            "state": state,
            "hospitals": len(part),
            "rated": len(rated),
            "averageStar": clean(rated.mean()) if len(rated) else None,
            "shareHigh": (counts["4"] + counts["5"]) / len(rated) if len(rated) else None,
            "counts": counts,
        })
    return out


def build_summary(run_id: str, source: str, label: str, raw: pd.DataFrame, digest: str,
                  result: PipelineResult, is_reference: bool) -> dict:
    star = result.star
    national = result.national_average.iloc[0]
    checks = [c.to_dict() for c in validate_against_sas(result, DATA_DIR)] if is_reference else []
    return {
        "id": run_id,
        "createdAt": datetime.now(timezone.utc).isoformat(),
        "source": source,
        "label": label,
        "isReference": is_reference,
        "input": {"rows": len(raw), "columns": raw.shape[1], "sha256": digest},
        "steps": [asdict(s) for s in result.steps],
        "kpis": {
            "hospitals": len(star),
            "rated": int(star["star"].notna().sum()),
            "notRated": int(star["star"].isna().sum()),
            "measuresUsed": len(ALL_MEASURES) - len(result.excluded_measures),
            "measuresExcluded": len(result.excluded_measures),
            "nationalSummaryScore": clean(national["Summary_Score_Nat"]),
        },
        "excludedMeasures": [
            {"code": m, "label": MEASURE_LABELS.get(m, m)} for m in result.excluded_measures
        ],
        "stars": star_distribution(star),
        "states": state_summary(star),
        "national": {
            "summary": clean(national["Summary_Score_Nat"]),
            "peer": {str(p): clean(national[f"Summary_Score_Nat_peer{p}"]) for p in (3, 4, 5)},
            "groups": [
                {"key": key, "label": label, "value": clean(national[NATIONAL_COLUMNS[key]])}
                for _, key, _, _, label in GROUPS
            ],
        },
        "validation": checks,
        "manifest": {
            "pipelineCommit": PIPELINE_COMMIT,
            "python": sys.version.split()[0],
            "packages": {p: version(p) for p in ("pandas", "numpy", "scikit-learn", "scipy")},
        },
    }


def execute(raw: pd.DataFrame, source: str, label: str, digest: str, is_reference: bool) -> dict:
    if ID_COL not in raw.columns:
        raise HTTPException(422, f"The input file has no {ID_COL} column.")
    present = [m for m in ALL_MEASURES if m in raw.columns]
    if len(present) < 10:
        raise HTTPException(
            422, f"The input file has only {len(present)} of the {len(ALL_MEASURES)} expected "
                 "measure columns. Use the same layout as alldata_2025jul.csv.")
    try:
        result = run_pipeline(raw)
    except Exception as exc:  # surfaced to the user, not swallowed
        raise HTTPException(422, f"The pipeline could not score this file: {exc}") from exc
    run_id = uuid.uuid4().hex[:12]
    summary = build_summary(run_id, source, label, raw, digest, result, is_reference)
    store.add(summary, result)
    return summary


def run_reference() -> dict:
    path = DATA_DIR / "Starrating" / "alldata_2025jul.csv"
    digest = hashlib.sha256(path.read_bytes()).hexdigest()
    return execute(load_raw_input(path), REFERENCE_NAME, REFERENCE_LABEL, digest, is_reference=True)


@asynccontextmanager
async def lifespan(_: FastAPI):
    # Reuse a saved reference run made by this same code version; otherwise score it once now,
    # so the first page load never waits on the pipeline.
    if store.find(isReference=True, manifest__pipelineCommit=PIPELINE_COMMIT) is None:
        run_reference()
    yield


app = FastAPI(title="Star Ratings Studio", docs_url="/api/docs", openapi_url="/api/openapi.json",
              lifespan=lifespan)


@app.get("/api/health")
def health() -> dict:
    return {"status": "ok"}


@app.get("/api/about")
def about() -> dict:
    """Version and deployment settings for the footer, environment tag and help pages."""
    return {
        "version": APP_VERSION,
        "pipelineCommit": PIPELINE_COMMIT,
        "environment": APP_ENVIRONMENT if APP_ENVIRONMENT.lower() not in ("", "production", "prod") else None,
        "supportEmail": SUPPORT_EMAIL or None,
    }


@app.get("/api/runs")
def list_runs() -> list[dict]:
    return store.list()


@app.post("/api/runs")
async def create_run(file: UploadFile | None = File(default=None),
                     label: str = Form(default="")) -> dict:
    if file is None:
        return run_reference()
    data = await file.read(MAX_UPLOAD_BYTES + 1)
    if len(data) > MAX_UPLOAD_BYTES:
        raise HTTPException(413, "The file is larger than 100 MB.")
    name = file.filename or "upload"
    digest = hashlib.sha256(data).hexdigest()
    suffix = Path(name).suffix.lower()
    try:
        if suffix == ".csv":
            raw = pd.read_csv(io.BytesIO(data), dtype={ID_COL: str})
        elif suffix == ".sas7bdat":
            import pyreadstat
            with tempfile.NamedTemporaryFile(suffix=".sas7bdat") as tmp:
                tmp.write(data)
                tmp.flush()
                raw = pyreadstat.read_sas7bdat(tmp.name)[0]
        else:
            raise HTTPException(415, "Upload a .csv or .sas7bdat file.")
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(422, f"Could not read {name}: {exc}") from exc
    return execute(raw, name, label.strip()[:80] or Path(name).stem, digest, is_reference=False)


@app.get("/api/runs/{run_id}")
def get_run(run_id: str) -> dict:
    return store.summary(run_id)


@app.patch("/api/runs/{run_id}")
def rename_run(run_id: str, label: str = Body(embed=True, min_length=1, max_length=80)) -> dict:
    return store.update(run_id, label=label.strip())


@app.delete("/api/runs/{run_id}", status_code=204)
def delete_run(run_id: str) -> Response:
    store.delete(run_id)
    return Response(status_code=204)


@app.get("/api/compare")
def compare(base: str, target: str) -> dict:
    base_summary, target_summary = store.summary(base), store.summary(target)
    result = compare_runs(store.result(base_summary["id"]), store.result(target_summary["id"]))
    pick = ("id", "label", "source", "createdAt", "input", "kpis", "national")
    return {
        "base": {k: base_summary.get(k) for k in pick},
        "target": {k: target_summary.get(k) for k in pick},
        "sameInput": base_summary["input"]["sha256"] == target_summary["input"]["sha256"],
        **result,
    }


@app.get("/api/runs/{run_id}/hospitals")
def hospitals(run_id: str) -> list[dict]:
    star: pd.DataFrame = store.result(run_id).star
    out = pd.DataFrame({
        "id": star[ID_COL],
        "state": star[ID_COL].map(state_from_ccn),
        "star": star["star"],
        "summary": star["summary_score"],
        "peer": star["cnt_grp"].map(peer_label).astype("Int64"),
        "eligible": star["report_indicator"],
        "groups": star["Total_measure_group_cnt"],
    })
    for _, key, score_col, _, _ in GROUPS:
        out[key] = star[score_col]
    return records(out)


@app.get("/api/runs/{run_id}/hospitals/{provider_id}")
def hospital_detail(run_id: str, provider_id: str) -> dict:
    result: PipelineResult = store.result(run_id)
    rows = result.star[result.star[ID_COL] == provider_id]
    if rows.empty:
        raise HTTPException(404, f"No hospital with CCN {provider_id} in this run.")
    row = rows.iloc[0]
    analysis = result.analysis_dataset.set_index(ID_COL)
    measures_row = analysis.loc[provider_id] if provider_id in analysis.index else None
    national = result.national_average.iloc[0]
    peer = peer_label(row["cnt_grp"])

    groups = []
    for _, key, score_col, weight_col, label in GROUPS:
        score, weight = clean(row[score_col]), clean(row[weight_col])
        measures = []
        for m in MEASURE_GROUPS[key]:
            col = f"std_{m}"
            included = col in analysis.columns
            value = clean(measures_row[col]) if included and measures_row is not None else None
            measures.append({"code": m, "label": MEASURE_LABELS.get(m, m),
                             "included": included, "value": value})
        groups.append({
            "key": key, "label": label, "score": score, "weight": weight,
            "contribution": score * weight if score is not None and weight is not None else None,
            "measureCount": clean(row[COUNT_COLUMNS[key]]),
            "national": clean(national[NATIONAL_COLUMNS[key]]),
            "measures": measures,
        })

    return {
        "id": provider_id,
        "state": state_from_ccn(provider_id),
        "star": clean(row["star"]),
        "summary": clean(row["summary_score"]),
        "eligible": bool(row["report_indicator"] == 1),
        "groupsWithThree": clean(row["Total_measure_group_cnt"]),
        "mortSafeGroups": clean(row["MortSafe_Group_cnt"]),
        "peer": peer,
        "nationalSummary": clean(national["Summary_Score_Nat"]),
        "peerSummary": clean(national[f"Summary_Score_Nat_peer{peer}"]) if peer else None,
        "groups": groups,
    }


@app.get("/api/runs/{run_id}/export/{table}.csv")
def export_table(run_id: str, table: str) -> Response:
    tables = store.result(run_id).tables()
    if table not in tables:
        raise HTTPException(404, f"Unknown table {table}.")
    return Response(tables[table].to_csv(index=False), media_type="text/csv",
                    headers={"Content-Disposition": f'attachment; filename="{table}.csv"'})


@app.get("/api/runs/{run_id}/export.zip")
def export_zip(run_id: str) -> StreamingResponse:
    summary = store.summary(run_id)
    run_id = summary["id"]
    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, "w", zipfile.ZIP_DEFLATED) as zf:
        for name, table in store.result(run_id).tables().items():
            zf.writestr(f"{name}.csv", table.to_csv(index=False))
        manifest = {k: summary.get(k) for k in ("id", "label", "createdAt", "source", "input", "manifest",
                                                 "steps", "validation")}
        zf.writestr("manifest.json", json.dumps(manifest, indent=2))
    buffer.seek(0)
    return StreamingResponse(buffer, media_type="application/zip", headers={
        "Content-Disposition": f'attachment; filename="star-ratings-{run_id}.zip"'})


if STATIC_DIR.exists():
    app.mount("/assets", StaticFiles(directory=STATIC_DIR / "assets"), name="assets")

    @app.get("/{path:path}", include_in_schema=False)
    def spa(path: str) -> FileResponse:
        if path == "api" or path.startswith("api/"):
            raise HTTPException(404, "Unknown API endpoint.")  # never answer an API call with the web page
        file = STATIC_DIR / path
        if path and file.is_file() and STATIC_DIR in file.resolve().parents:
            return FileResponse(file)
        return FileResponse(STATIC_DIR / "index.html")
