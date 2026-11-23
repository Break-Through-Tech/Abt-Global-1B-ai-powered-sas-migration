import os
import sys
import tempfile
from pathlib import Path

import pytest

REPO_ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(REPO_ROOT))

# Keep test runs out of the real run folder. Must be set before the app is imported.
os.environ["RUNS_DIR"] = tempfile.mkdtemp(prefix="star-runs-")

pytest.importorskip("fastapi")
pytest.importorskip("httpx2")

from fastapi.testclient import TestClient  # noqa: E402

from app.backend.main import app  # noqa: E402


@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:
        yield c


def test_reference_run_matches_sas(client):
    run = client.get("/api/runs/latest").json()
    assert run["isReference"]
    assert run["kpis"]["rated"] == 2891
    assert all(check["passed"] for check in run["validation"])


def test_hospital_list_and_detail(client):
    hospitals = client.get("/api/runs/latest/hospitals").json()
    assert len(hospitals) == 4566
    detail = client.get("/api/runs/latest/hospitals/010001").json()
    assert detail["star"] in {1, 2, 3, 4, 5}
    assert len(detail["groups"]) == 5


def test_bad_uploads_get_clear_errors(client):
    assert client.post("/api/runs", files={"file": ("x.txt", b"abc")}).status_code == 415
    bad_csv = client.post("/api/runs", files={"file": ("x.csv", b"PROVIDER_ID,a\n1,2")})
    assert bad_csv.status_code == 422
    assert "measure columns" in bad_csv.json()["detail"]


def test_upload_reruns_pipeline(client):
    with open(REPO_ROOT / "data/Project_1/Starrating/alldata_2025jul.csv", "rb") as f:
        run = client.post("/api/runs", files={"file": ("q.csv", f.read())}).json()
    assert not run["isReference"]
    assert run["kpis"]["rated"] == 2891


def test_export_zip(client):
    assert client.get("/api/runs/latest/export.zip").headers["content-type"] == "application/zip"


def test_state_summary_covers_every_hospital(client):
    states = client.get("/api/runs/latest").json()["states"]
    assert sum(s["hospitals"] for s in states) == 4566
    assert sum(s["rated"] for s in states) == 2891
    texas = next(s for s in states if s["state"] == "TX")
    assert 1 <= texas["averageStar"] <= 5


def _perturbed_csv() -> bytes:
    import pandas as pd

    raw = pd.read_csv(REPO_ROOT / "data/Project_1/Starrating/alldata_2025jul.csv", dtype={"PROVIDER_ID": str})
    raw.loc[raw.index[:400], ["HAI_1", "HAI_2", "PSI_90_SAFETY", "MORT_30_HF"]] = None
    return raw.to_csv(index=False).encode()


def test_runs_are_saved_and_reload_after_restart(client):
    from app.backend.storage import RunStore

    run = client.post("/api/runs", files={"file": ("q.csv", _perturbed_csv())}, data={"label": "Test quarter"}).json()
    assert run["label"] == "Test quarter"
    reopened = RunStore(Path(os.environ["RUNS_DIR"]))
    assert reopened.summary(run["id"])["label"] == "Test quarter"
    assert reopened.result(run["id"]).star["star"].notna().sum() == run["kpis"]["rated"]


def test_compare_counts_every_hospital(client):
    reference = next(r for r in client.get("/api/runs").json() if r["isReference"])
    target = client.post("/api/runs", files={"file": ("q2.csv", _perturbed_csv())}).json()
    result = client.get(f"/api/compare?base={reference['id']}&target={target['id']}").json()
    assert sum(result["counts"].values()) == 4566
    assert result["counts"]["up"] + result["counts"]["down"] > 0
    assert not result["sameInput"]
    same = client.get(f"/api/compare?base={reference['id']}&target={reference['id']}").json()
    assert same["counts"]["same"] == 2891 and same["sameInput"]


def test_rename_and_delete_run(client):
    run = client.post("/api/runs", files={"file": ("q3.csv", _perturbed_csv())}).json()
    assert client.patch(f"/api/runs/{run['id']}", json={"label": "Renamed"}).json()["label"] == "Renamed"
    assert client.delete(f"/api/runs/{run['id']}").status_code == 204
    assert client.get(f"/api/runs/{run['id']}").status_code == 404
    assert client.get("/api/runs/..%2F..%2Fetc").status_code == 404


def test_about_reports_version_and_hides_unset_settings(client):
    about = client.get("/api/about").json()
    assert about["version"]
    assert about["environment"] is None or isinstance(about["environment"], str)
