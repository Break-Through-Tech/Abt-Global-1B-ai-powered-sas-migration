import sys
from pathlib import Path

import numpy as np
import pandas as pd
import pytest

PROJECT_DIR = Path(__file__).resolve().parents[2] / "data" / "Project_1"
sys.path.insert(0, str(PROJECT_DIR / "src"))

from program_0.program_0 import INPUT_CSV, run_program_0  # noqa: E402

SAS_DIR = PROJECT_DIR / "SAS Output CSV"


@pytest.fixture(scope="module")
def result():
    return run_program_0(pd.read_csv(INPUT_CSV, dtype={"PROVIDER_ID": str}))


@pytest.fixture(scope="module")
def sas():
    return pd.read_csv(SAS_DIR / "STD_DATA_2025JUL_ANALYSIS.csv", dtype={"PROVIDER_ID": str})


def test_no_measures_excluded(result):
    # SAS less100_measure output is empty for 2025Jul
    assert len(result["less100_measure"]) == 0
    assert len(pd.read_csv(SAS_DIR / "LESS100_MEASURE.csv")) == 0


def test_shape_columns_and_ids(result, sas):
    out = result["analysis"]
    assert out.shape == sas.shape
    assert list(out.columns) == list(sas.columns)
    assert (out["PROVIDER_ID"].values == sas["PROVIDER_ID"].values).all()


def test_values_and_missingness(result, sas):
    out = result["analysis"]
    cols = [c for c in sas.columns if c != "PROVIDER_ID"]
    assert (out[cols].isna().values == sas[cols].isna().values).all()
    np.testing.assert_allclose(out[cols].astype(float).values,
                               sas[cols].astype(float).values, atol=1e-6, equal_nan=True)


def test_mean_and_std(result):
    ref = pd.read_csv(SAS_DIR / "MEASURE_AVERAGE_STDDEV_2025JUL.csv")
    desc = result["measure_average_stddev"]
    for stat, key in [("MEAN", "mean"), ("STD", "std"), ("N", "count")]:
        np.testing.assert_allclose(ref[ref["_STAT_"] == stat][desc.columns].astype(float).values[0],
                                   desc.loc[key].values, atol=1e-6)
