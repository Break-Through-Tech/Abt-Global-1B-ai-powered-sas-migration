import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(REPO_ROOT / "data" / "Project_1" / "src"))

import pandas as pd
import pytest
from program_2.report import ANALYSIS_CSV_SAS, OUTPUT_COLS, load_analysis_data, report

SAS_STAR_CSV = REPO_ROOT / "data" / "Project_1" / "SAS Output CSV" / "STAR_2025JUL.csv"

REPORT_COMPARE_COLS = [c for c in OUTPUT_COLS if c != "PROVIDER_ID"]


@pytest.fixture(scope="module")
def result():
    return report(load_analysis_data(ANALYSIS_CSV_SAS))


@pytest.fixture(scope="module")
def sas_star():
    return pd.read_csv(SAS_STAR_CSV, dtype={"PROVIDER_ID": str})


def test_row_count_and_unique_ids(result, sas_star):
    assert result["PROVIDER_ID"].is_unique
    assert len(result) == len(sas_star)


@pytest.mark.parametrize("col", REPORT_COMPARE_COLS)
def test_report_column_matches_sas(result, sas_star, col):
    merged = result[["PROVIDER_ID", col]].merge(
        sas_star[["PROVIDER_ID", col]],
        on="PROVIDER_ID",
        how="outer",
        suffixes=("_py", "_sas"),
        indicator=True,
    )
    assert (merged["_merge"] == "both").all()
    assert (merged[f"{col}_py"] == merged[f"{col}_sas"]).all()


def test_eligibility_edge_cases():
    # H1: 3 Mort + 3 Readm + 3 Proc -> eligible (1)
    # H2: 3 Readm + 3 PtExp + 3 Proc (0 Mort, 0 Safety) -> ineligible (0)
    # H3: 3 Mort + 2 Safety + 2 Readm -> only 1 qualifying group -> ineligible (0)
    df = pd.DataFrame(
        {
            "PROVIDER_ID": ["000001", "000002", "000003"],
            "std_MORT_30_AMI": [1.0, None, 1.0],
            "std_MORT_30_CABG": [1.0, None, 1.0],
            "std_MORT_30_COPD": [1.0, None, 1.0],
            "std_COMP_HIP_KNEE": [None, None, 1.0],
            "std_HAI_1": [None, None, 1.0],
            "std_EDAC_30_AMI": [1.0, 1.0, 1.0],
            "std_EDAC_30_HF": [1.0, 1.0, 1.0],
            "std_EDAC_30_PN": [1.0, 1.0, None],
            "std_H_COMP_1_STAR_RATING": [None, 1.0, None],
            "std_H_COMP_2_STAR_RATING": [None, 1.0, None],
            "std_H_COMP_3_STAR_RATING": [None, 1.0, None],
            "std_HCP_COVID_19": [1.0, 1.0, None],
            "std_IMM_3": [1.0, 1.0, None],
            "std_OP_10": [1.0, 1.0, None],
        }
    )
    out = report(df).set_index("PROVIDER_ID")
    assert out.loc["000001", "report_indicator"] == 1
    assert out.loc["000002", "report_indicator"] == 0
    assert out.loc["000003", "report_indicator"] == 0
