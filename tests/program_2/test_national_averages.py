import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(REPO_ROOT / "data" / "Project_1" / "src"))

import pandas as pd
import pytest
from program_2.loader import CSV_DIR, load_and_merge_domain_data
from program_2.national_averages import (
    NATIONAL_DOMAINS,
    compute_national_averages,
    nation_avg,
    nation_avg0,
    nation_avg_peer,
)
from program_2.report import ANALYSIS_CSV_SAS, report
from program_2.summary_score import compute_summary_score

SAS_NAT_CSV = CSV_DIR / "NATIONAL_AVERAGE_2025JUL.csv"
SAS_STAR_CSV = CSV_DIR / "STAR_2025JUL.csv"


@pytest.fixture(scope="module")
def sas_national():
    return pd.read_csv(SAS_NAT_CSV)


def test_full_national_averages_match_sas(sas_national):
    # Run existing Program 2 pipeline pieces (loader + summary_score + report)
    summary_df = compute_summary_score(load_and_merge_domain_data())
    report_df = report(pd.read_csv(ANALYSIS_CSV_SAS, dtype={"PROVIDER_ID": str}))
    merged = summary_df.merge(report_df, on="PROVIDER_ID", how="inner")

    actual = compute_national_averages(merged)

    assert list(actual.columns) == list(sas_national.columns)
    pd.testing.assert_frame_equal(actual, sas_national, rtol=0, atol=1e-6)


@pytest.mark.parametrize("filename,nat_col", NATIONAL_DOMAINS)
def test_nation_avg_per_domain_matches_sas(sas_national, filename, nat_col):
    domain_df = pd.read_csv(CSV_DIR / filename, dtype={"PROVIDER_ID": str})
    assert nation_avg(domain_df) == pytest.approx(sas_national[nat_col].iloc[0], abs=1e-6)


def test_nation_avg0_and_peer_match_sas_star(sas_national):
    star_df = pd.read_csv(SAS_STAR_CSV, dtype={"PROVIDER_ID": str})
    assert nation_avg0(star_df) == pytest.approx(sas_national["Summary_Score_Nat"].iloc[0], abs=1e-6)

    peers = nation_avg_peer(star_df)
    for peer in (3, 4, 5):
        col = f"Summary_Score_Nat_peer{peer}"
        assert peers[col] == pytest.approx(sas_national[col].iloc[0], abs=1e-6)


def test_nation_avg_edge_cases():
    # Only total_cnt >= 3 counts; NaNs are ignored
    df = pd.DataFrame({"total_cnt": [2, 3, 4, 3], "grp_score": [100.0, 2.0, 4.0, float("nan")]})
    assert nation_avg(df) == 3.0

    # Empty eligible set returns NaN
    empty = pd.DataFrame({"total_cnt": [0, 2], "grp_score": [1.0, 2.0]})
    assert pd.isna(nation_avg(empty))


def test_nation_avg0_and_peer_edge_cases():
    df = pd.DataFrame(
        {
            "report_indicator": [0, 1, 1, 1, 1],
            "Total_measure_group_cnt": [3, 3, 3, 5, 5],
            "summary_score": [100.0, 1.0, 3.0, 5.0, float("nan")],
        }
    )
    assert nation_avg0(df) == 3.0

    peers = nation_avg_peer(df)
    assert peers["Summary_Score_Nat_peer3"] == 2.0
    assert pd.isna(peers["Summary_Score_Nat_peer4"])
    assert peers["Summary_Score_Nat_peer5"] == 5.0
