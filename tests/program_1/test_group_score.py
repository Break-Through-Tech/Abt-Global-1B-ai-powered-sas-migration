"""Hand-calculated tests for the %grp_score translation (Star_Macros.sas, lines 28-63)."""

import sys
from pathlib import Path

import numpy as np
import pandas as pd
import pytest

REPO_ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(REPO_ROOT / "data" / "Project_1" / "src"))

from program_1.group_score import grp_score  # noqa: E402

NAN = np.nan
MEASURES = ["std_A", "std_B", "std_C", "std_D"]


def make_data(rows: dict[str, list[float]]) -> pd.DataFrame:
    df = pd.DataFrame.from_dict(rows, orient="index", columns=MEASURES)
    return df.rename_axis("PROVIDER_ID").reset_index()


@pytest.fixture
def result():
    return grp_score(
        make_data({
            "010001": [0.2, NAN, -0.4, 0.5],   # 3 measures: (0.2 - 0.4 + 0.5) / 3 = 0.1
            "010002": [1.0, 1.0, 1.0, 1.0],    # 4 measures: 4 / 4 = 1.0
            "010003": [NAN, NAN, NAN, NAN],    # 0 measures: no score
            "010004": [-0.5, NAN, NAN, NAN],   # 1 measure: -0.5
        }),
        MEASURES,
    )


def test_missing_measures_are_skipped_not_zero(result):
    # Treating the missing measure as 0 would give 0.3 / 4 = 0.075.
    assert result.loc[0, "score_before_std"] == pytest.approx(0.1)
    assert result.loc[0, "total_cnt"] == 3
    assert result.loc[0, "measure_wt"] == pytest.approx(1 / 3)


def test_flags_mark_present_measures(result):
    assert result.loc[0, ["C1", "C2", "C3", "C4"]].tolist() == [1, 0, 1, 1]
    assert result["total_cnt"].tolist() == [3, 4, 0, 1]


def test_hospital_with_no_measures_keeps_its_row_with_missing_scores(result):
    # SAS keeps every input row. When total_cnt = 0, measure_wt and avg are never set.
    row = result.loc[2]
    assert row["PROVIDER_ID"] == "010003"
    assert row[["measure_wt", "score_before_std", "grp_score"]].isna().all()


def test_standardization_uses_sample_std_and_skips_missing(result):
    # Averages 0.1, 1.0, -0.5 (the missing one is left out).
    averages = np.array([0.1, 1.0, -0.5])
    mean, std = averages.mean(), averages.std(ddof=1)
    assert result.loc[0, "Mean"] == pytest.approx(mean)
    assert result.loc[0, "StdDev"] == pytest.approx(std)
    expected = [(0.1 - mean) / std, (1.0 - mean) / std, NAN, (-0.5 - mean) / std]
    np.testing.assert_allclose(result["grp_score"], expected)


def test_mean_and_std_are_the_same_on_every_row(result):
    # The SQL cross join with the one-row PROC MEANS table (lines 56-60).
    assert result["Mean"].nunique() == 1
    assert result["StdDev"].nunique() == 1


def test_columns_match_sas_order(result):
    assert list(result.columns) == [
        "PROVIDER_ID", *MEASURES, "C1", "C2", "C3", "C4",
        "total_cnt", "measure_wt", "score_before_std", "Mean", "StdDev", "grp_score",
    ]


def test_row_order_is_preserved():
    data = make_data({"2": [1.0, NAN, NAN, NAN], "1": [2.0, NAN, NAN, NAN], "3": [3.0, NAN, NAN, NAN]})
    assert grp_score(data, MEASURES)["PROVIDER_ID"].tolist() == ["2", "1", "3"]
