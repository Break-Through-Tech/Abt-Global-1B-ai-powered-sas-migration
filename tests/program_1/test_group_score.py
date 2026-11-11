import sys
from pathlib import Path

import pandas as pd
import pyreadstat
import pytest

REPO_ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(REPO_ROOT / "data" / "Project_1" / "src"))

from program_0.measures import MEASURE_GROUPS
from program_1.group_score import grp_score
from program_2.loader import CSV_DIR
from program_2.national_averages import NATIONAL_DOMAINS


@pytest.fixture(scope="module")
def standardized_measures():
    return pd.read_csv(CSV_DIR / "STD_DATA_2025JUL_ANALYSIS.csv", dtype={"PROVIDER_ID": str})


@pytest.mark.parametrize("filename", NATIONAL_DOMAINS)
def test_group_score_matches_sas(standardized_measures, filename):
    domain, _ = NATIONAL_DOMAINS[filename]
    measures = [f"std_{measure}" for measure in MEASURE_GROUPS[domain]]
    expected = pd.read_csv(CSV_DIR / filename, dtype={"PROVIDER_ID": str})
    actual = grp_score(standardized_measures, measures)

    # SAS displays Mean and StdDev rounded to six decimal places in these CSVs.
    pd.testing.assert_frame_equal(actual, expected, check_exact=False, rtol=0, atol=1e-6)
    pd.testing.assert_series_equal(actual["grp_score"], expected["grp_score"], rtol=0, atol=1e-8)


@pytest.mark.parametrize("filename", NATIONAL_DOMAINS)
def test_group_score_matches_original_sas_dataset(filename):
    sas_dir = CSV_DIR.with_name("SAS Output")
    analysis, _ = pyreadstat.read_sas7bdat(sas_dir / "std_data_2025jul_analysis.sas7bdat")
    expected, _ = pyreadstat.read_sas7bdat(sas_dir / f"{Path(filename).stem.lower()}.sas7bdat")
    domain, _ = NATIONAL_DOMAINS[filename]
    actual = grp_score(analysis, [f"std_{measure}" for measure in MEASURE_GROUPS[domain]])

    # SAS stores the integer flags as numeric doubles. Values and schema match.
    pd.testing.assert_frame_equal(actual, expected, check_dtype=False, rtol=0, atol=1e-10)
