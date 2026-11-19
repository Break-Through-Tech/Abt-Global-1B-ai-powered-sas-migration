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
from program_2.kmeans import compute_star_ratings

SAS_STAR_CSV = "STAR_2025JUL.csv"


@pytest.fixture(scope="module")
def result():
    # Run the full Program 2 chain once
    summary_df = compute_summary_score(load_and_merge_domain_data())
    report_df = report(load_analysis_data())

    summary_score21 = merge_summary_and_report(summary_df, report_df)
    summary_score22 = assign_peer_groups(summary_score21)
    return compute_star_ratings(summary_score21, summary_score22)


@pytest.fixture(scope="module")
def sas_star():
    sas = pd.read_csv(CSV_DIR / SAS_STAR_CSV, dtype=str)
    sas.columns = sas.columns.str.lower()
    return sas.rename(columns={"provider_id": "PROVIDER_ID"})


def test_only_eligible_hospitals_receive_stars(result):
    eligible = result["report_indicator"] == 1
    ineligible = ~eligible

    # Eligible hospitals must all have stars 1–5
    assert result.loc[eligible, "star"].notna().all()
    assert set(result.loc[eligible, "star"].unique()) == {1, 2, 3, 4, 5}

    # Ineligible hospitals must have blank star and cnt_grp
    assert result.loc[ineligible, "star"].isna().all()
    assert result.loc[ineligible, "cnt_grp"].isna().all()


def test_higher_stars_have_higher_scores_per_peer_group(result):
    # Within each peer group, 1-star max score <= 2-star min score <= ... <= 5-star
    rated = result.loc[result["star"].notna()]
    for _, grp_df in rated.groupby("cnt_grp"):
        for s in range(1, 5):
            low_max = grp_df.loc[grp_df["star"] == s, "summary_score"].max()
            high_min = grp_df.loc[grp_df["star"] == s + 1, "summary_score"].min()
            assert low_max <= high_min


def test_star_ratings_match_sas(result, sas_star):
    sas = sas_star[["PROVIDER_ID", "star"]].rename(columns={"star": "sas_star"}).copy()
    sas["sas_star"] = pd.to_numeric(sas["sas_star"], errors="coerce").astype("Int64")

    both = result[["PROVIDER_ID", "star"]].merge(
        sas, on="PROVIDER_ID", how="outer", indicator=True
    )

    # Every hospital is present on both sides
    assert (both["_merge"] == "both").all()

    # Exact star rating match for every hospital (including blank/NaN for ineligible ones)
    py_stars = both["star"].astype("Int64")
    pd.testing.assert_series_equal(py_stars, both["sas_star"], check_names=False)
