import sys
from pathlib import Path

# Same setup as test_loader.py
REPO_ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(REPO_ROOT / "data" / "Project_1" / "src"))

import pandas as pd
import pytest
from program_2.loader import load_and_merge_domain_data, CSV_DIR
from program_2.summary_score import compute_summary_score, GROUPS

SCORE_COLS = [g[0] for g in GROUPS]    # the 5 score columns
WEIGHT_COLS = [g[2] for g in GROUPS]   # the 5 rescaled weight columns

SAS_STAR_CSV = "STAR_2025JUL.csv"


@pytest.fixture(scope="module")
def result():
    # Real data: loader output -> summary score step
    return compute_summary_score(load_and_merge_domain_data())


def test_same_rows_as_loader(result):
    # This step must not add or drop hospitals
    assert len(result) == len(load_and_merge_domain_data())


def test_weights_add_up_to_one(result):
    # Hospitals with at least one score: the rescaled weights must sum to 1
    has_score = result[SCORE_COLS].notna().any(axis=1)
    totals = result.loc[has_score, WEIGHT_COLS].sum(axis=1)
    assert totals.tolist() == pytest.approx([1.0] * len(totals))


def test_summary_score_matches_sas(result):
    # Read SAS as text so IDs keep leading zeros
    sas = pd.read_csv(CSV_DIR / SAS_STAR_CSV, dtype=str)
    sas.columns = sas.columns.str.lower()
    sas = sas[["provider_id", "summary_score"]].rename(
        columns={"provider_id": "PROVIDER_ID", "summary_score": "sas_score"}
    )
    sas["sas_score"] = pd.to_numeric(sas["sas_score"])

    both = result[["PROVIDER_ID", "summary_score"]].merge(sas, on="PROVIDER_ID", how="outer", indicator=True)

    # Every hospital is on both sides
    assert (both["_merge"] == "both").all()

    # Same score for each hospital
    assert both["summary_score"].tolist() == pytest.approx(both["sas_score"].tolist(), abs=1e-6)