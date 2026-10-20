"""Tests for the Program 0 (measure standardization) translation.

Validates data/Project_1/src/program_0 against the SAS answer-key CSVs in
data/Project_1/SAS Output CSV/, following the same tolerance (1e-6) used
in notebooks/01_data_exploration.ipynb.
"""

import sys
from pathlib import Path

import pandas as pd
import pytest

REPO_ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(REPO_ROOT / "data" / "Project_1" / "src"))

from program_0.loader import load_input_data  # noqa: E402
from program_0.measures import ALL_MEASURES, MIN_MEASURE_VOLUME  # noqa: E402
from program_0.standardize import run_program_0  # noqa: E402

DATA_DIR = REPO_ROOT / "data" / "Project_1"
TOLERANCE = 1e-6


@pytest.fixture(scope="module")
def result():
    raw_data = load_input_data(DATA_DIR)
    return run_program_0(raw_data)


@pytest.fixture(scope="module")
def sas_mean_std():
    path = DATA_DIR / "SAS Output CSV" / "MEASURE_AVERAGE_STDDEV_2025JUL.csv"
    return pd.read_csv(path).set_index("_STAT_")


@pytest.fixture(scope="module")
def sas_analysis():
    path = DATA_DIR / "SAS Output CSV" / "STD_DATA_2025JUL_ANALYSIS.csv"
    return pd.read_csv(path)


@pytest.fixture(scope="module")
def sas_excluded():
    path = DATA_DIR / "SAS Output CSV" / "LESS100_MEASURE.csv"
    return set(pd.read_csv(path)["measure_name"])


def test_no_measures_excluded_this_quarter(result, sas_excluded):
    assert set(result.excluded_measures) == sas_excluded


def test_measure_mean_matches_sas(result, sas_mean_std):
    diff = (result.mean_std.loc["MEAN", result.measure_in] - sas_mean_std.loc["MEAN", result.measure_in]).abs()
    assert diff.max() < TOLERANCE


def test_measure_std_matches_sas(result, sas_mean_std):
    diff = (result.mean_std.loc["STD", result.measure_in] - sas_mean_std.loc["STD", result.measure_in]).abs()
    assert diff.max() < TOLERANCE


def test_row_count_matches_sas(result, sas_analysis):
    assert len(result.analysis_dataset) == len(sas_analysis)


@pytest.mark.parametrize("measure", ALL_MEASURES)
def test_standardized_measure_matches_sas(result, sas_analysis, measure):
    if measure not in result.measure_in:
        pytest.skip(f"{measure} excluded this quarter (volume <= {MIN_MEASURE_VOLUME})")

    col = f"std_{measure}"
    merged = result.analysis_dataset.merge(sas_analysis, on="PROVIDER_ID", suffixes=("_py", "_sas"))
    py_values, sas_values = merged[f"{col}_py"], merged[f"{col}_sas"]

    assert (py_values.isna() == sas_values.isna()).all(), f"{measure}: missing-value pattern differs"
    assert (py_values - sas_values).abs().max() < TOLERANCE, f"{measure}: values diverge beyond tolerance"
