import sys
from pathlib import Path

import pandas as pd
import pyreadstat
import pytest

REPO_ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(REPO_ROOT / "data" / "Project_1" / "src"))

from program_0.loader import load_input_data
from program_0.standardize import run_program_0
from program_2.loader import CSV_DIR
from program_2.national_averages import (
    NATIONAL_DOMAINS,
    compute_national_averages,
    nation_avg,
    nation_avg0,
)


def test_national_averages_match_sas_from_raw_input():
    analysis = run_program_0(load_input_data()).analysis_dataset
    expected = pd.read_csv(CSV_DIR / "NATIONAL_AVERAGE_2025JUL.csv")
    expected = expected.drop(columns=[f"Summary_Score_Nat_peer{count}" for count in (3, 4, 5)])
    actual = compute_national_averages(analysis)

    pd.testing.assert_frame_equal(actual, expected, rtol=0, atol=1e-8)


@pytest.mark.parametrize("filename", NATIONAL_DOMAINS)
def test_nation_avg_matches_original_sas_dataset(filename):
    sas_dir = CSV_DIR.with_name("SAS Output")
    scores, _ = pyreadstat.read_sas7bdat(sas_dir / f"{Path(filename).stem.lower()}.sas7bdat")
    expected, _ = pyreadstat.read_sas7bdat(sas_dir / "national_average_2025jul.sas7bdat")
    _, column = NATIONAL_DOMAINS[filename]

    assert nation_avg(scores) == pytest.approx(expected[column].iloc[0], rel=0, abs=1e-10)


def test_nation_avg0_matches_original_sas_dataset():
    sas_dir = CSV_DIR.with_name("SAS Output")
    scores, _ = pyreadstat.read_sas7bdat(sas_dir / "star_2025jul.sas7bdat")
    expected, _ = pyreadstat.read_sas7bdat(sas_dir / "national_average_2025jul.sas7bdat")

    assert nation_avg0(scores) == pytest.approx(expected["Summary_Score_Nat"].iloc[0], rel=0, abs=1e-10)


def test_national_averages_from_original_sas_analysis():
    sas_dir = CSV_DIR.with_name("SAS Output")
    analysis, _ = pyreadstat.read_sas7bdat(sas_dir / "std_data_2025jul_analysis.sas7bdat")
    expected, _ = pyreadstat.read_sas7bdat(sas_dir / "national_average_2025jul.sas7bdat")
    actual = compute_national_averages(analysis)

    pd.testing.assert_frame_equal(actual, expected[actual.columns], rtol=0, atol=1e-10)


def test_nation_avg_includes_three_measures_and_ignores_missing_scores():
    scores = pd.DataFrame({
        "total_cnt": [2, 3, 4, 3],
        "grp_score": [100.0, 2.0, 4.0, float("nan")],
    })
    assert nation_avg(scores) == 3.0


def test_nation_avg0_includes_only_reportable_hospitals():
    scores = pd.DataFrame({
        "report_indicator": [0, 1, 1, 1],
        "summary_score": [100.0, 2.0, 4.0, float("nan")],
    })
    assert nation_avg0(scores) == 3.0


@pytest.mark.parametrize(
    "helper,filter_column",
    [(nation_avg, "total_cnt"), (nation_avg0, "report_indicator")],
)
def test_national_average_is_missing_without_eligible_hospitals(helper, filter_column):
    scores = pd.DataFrame({filter_column: [0], "grp_score": [2.0], "summary_score": [2.0]})
    assert pd.isna(helper(scores))
