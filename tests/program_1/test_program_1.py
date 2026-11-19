"""Validates the Program 1 translation against the SAS answer key.

Compares all five group tables with the SAS `.sas7bdat` outputs in
data/Project_1/SAS Output/, using two inputs:
  - the SAS Program 0 dataset (tests Program 1 by itself), and
  - the Python Program 0 output (tests Programs 0 and 1 together).
"""

import sys
from pathlib import Path

import pandas as pd
import pytest

REPO_ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(REPO_ROOT / "data" / "Project_1" / "src"))

from program_1.first_stage import GROUPS, group_measures, load_analysis_data, run_program_1  # noqa: E402
from program_1.validate import TOLERANCES, compare_group, load_sas_output  # noqa: E402

DATA_DIR = REPO_ROOT / "data" / "Project_1"
GROUP_NAMES = [name for name, _ in GROUPS]


@pytest.fixture(scope="module", params=list(TOLERANCES))
def source(request):
    return request.param


@pytest.fixture(scope="module")
def results(source):
    return run_program_1(load_analysis_data(source, DATA_DIR))


@pytest.mark.parametrize("name", GROUP_NAMES)
def test_group_table_matches_sas(results, source, name):
    expected = load_sas_output(name, DATA_DIR)
    assert compare_group(results[name], expected, TOLERANCES[source]) == []


@pytest.mark.parametrize("name", GROUP_NAMES)
def test_committed_python_output_is_current(results, source, name):
    # The CSVs in Python Output CSV/program_1 (made by `python -m program_1`
    # from the Python Program 0 output) must match what the code produces now.
    if source != "python":
        pytest.skip("the committed output is made from the Python Program 0 output")
    committed = pd.read_csv(DATA_DIR / "Python Output CSV" / "program_1" / f"{name}.csv", dtype={"PROVIDER_ID": str})
    current = results[name]
    assert list(committed.columns) == list(current.columns)
    pd.testing.assert_frame_equal(committed, current, check_dtype=False, rtol=1e-9)


def test_measure_counts_match_sas_log():
    # SAS_Log.log: R.OUTCOME_MORTALITY has 21 variables, R.OUTCOME_SAFETY 23,
    # R.OUTCOME_READMISSION 29, R.PTEXP 23, R.PROCESS 31. Each table has
    # 2 * n_measures + 7 columns, so the measure counts are 7, 8, 11, 8, 12.
    analysis = load_analysis_data("sas", DATA_DIR)
    counts = {name: len(group_measures(analysis, group)) for name, group in GROUPS}
    assert counts == {
        "OUTCOME_MORTALITY": 7, "OUTCOME_SAFETY": 8, "OUTCOME_READMISSION": 11, "PTEXP": 8, "PROCESS": 12,
    }


def test_measure_missing_from_data_is_left_out_of_its_group():
    # Program 0 drops measures with 100 or fewer hospitals, so they have no std_ column.
    analysis = load_analysis_data("sas", DATA_DIR).drop(columns="std_HAI_4")
    assert "std_HAI_4" not in group_measures(analysis, "safety")
    assert len(group_measures(analysis, "safety")) == 7
