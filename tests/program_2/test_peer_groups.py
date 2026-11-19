import sys
from pathlib import Path

# Same setup as test_loader.py
REPO_ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(REPO_ROOT / "data" / "Project_1" / "src"))

import pandas as pd
import pytest
from program_2.loader import load_and_merge_domain_data, CSV_DIR
from program_2.summary_score import compute_summary_score
from program_2.report import load_analysis_data, report
from program_2.peer_groups import merge_summary_and_report, assign_peer_groups

SAS_STAR_CSV = "STAR_2025JUL.csv"


@pytest.fixture(scope="module")
def pipeline_outputs():
    # Run the real pipeline up through peer group assignment once
    summary_df = compute_summary_score(load_and_merge_domain_data())
    report_df = report(load_analysis_data())

    summary_score21 = merge_summary_and_report(summary_df, report_df)
    summary_score22 = assign_peer_groups(summary_score21)
    return summary_score21, summary_score22


@pytest.fixture(scope="module")
def sas_star():
    sas = pd.read_csv(CSV_DIR / SAS_STAR_CSV, dtype=str)
    sas.columns = sas.columns.str.lower()
    return sas.rename(columns={"provider_id": "PROVIDER_ID"})


def test_merged_has_one_row_per_provider(pipeline_outputs):
    summary_score21, _ = pipeline_outputs
    assert summary_score21["PROVIDER_ID"].is_unique


def test_peer_groups_keep_only_eligible_hospitals(pipeline_outputs):
    summary_score21, summary_score22 = pipeline_outputs

    expected_eligible = int((summary_score21["report_indicator"] == 1).sum())
    assert len(summary_score22) == expected_eligible
    assert (summary_score22["report_indicator"] == 1).all()


def test_peer_group_buckets_are_valid(pipeline_outputs):
    _, summary_score22 = pipeline_outputs

    # Every eligible hospital must have 3, 4, or 5 measure groups and a non-missing label
    assert set(summary_score22["Total_measure_group_cnt"].unique()).issubset({3, 4, 5})
    assert (summary_score22["total_grp"] == summary_score22["Total_measure_group_cnt"]).all()
    assert summary_score22["cnt_grp"].notna().all()


def test_peer_groups_match_sas(pipeline_outputs, sas_star):
    _, summary_score22 = pipeline_outputs

    sas_eligible = sas_star.loc[sas_star["report_indicator"] == "1", ["PROVIDER_ID", "cnt_grp"]].copy()
    sas_eligible = sas_eligible.rename(columns={"cnt_grp": "sas_cnt_grp"})

    both = summary_score22[["PROVIDER_ID", "cnt_grp"]].merge(
        sas_eligible, on="PROVIDER_ID", how="outer", indicator=True
    )

    # Exact same set of eligible hospitals
    assert (both["_merge"] == "both").all()

    # Exact same peer group label for every hospital (strip trailing CSV spaces if any)
    py_grp = both["cnt_grp"].str.strip()
    sas_grp = both["sas_cnt_grp"].str.strip()
    pd.testing.assert_series_equal(py_grp, sas_grp, check_names=False)
