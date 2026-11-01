# validate.py
"""Validates the Python Program 0 translation against the SAS answer-key
CSVs, following the checkpoints in ai/prog 0/README.md:

    included measures -> included hospitals -> standardized values
    -> direction-reversed values -> final analysis dataset

Run directly with `python -m data.Project_1.src.program_0.validate` from
the repo root (after `uv sync`), or import `validate_program_0()`.
"""

from pathlib import Path

import pandas as pd

from .loader import find_data_dir, load_input_data
from .standardize import run_program_0

TOLERANCE = 1e-6


def _sas_output(data_dir: Path, filename: str) -> pd.DataFrame:
    return pd.read_csv(data_dir / "SAS Output CSV" / filename)


def validate_program_0(data_dir: Path | None = None) -> bool:
    data_dir = data_dir or find_data_dir()
    raw_data = load_input_data(data_dir)
    result = run_program_0(raw_data)

    all_passed = True

    # Checkpoint 1: excluded-measure list matches SAS's LESS100_MEASURE.csv.
    sas_excluded = _sas_output(data_dir, "LESS100_MEASURE.csv")
    sas_excluded_names = set(sas_excluded.get("measure_name", pd.Series(dtype=str)))
    if set(result.excluded_measures) != sas_excluded_names:
        print(f"FAIL excluded measures: ours={result.excluded_measures} sas={sas_excluded_names}")
        all_passed = False
    else:
        print(f"PASS excluded measures ({len(result.excluded_measures)} excluded)")

    # Checkpoint 2: mean/std per measure matches MEASURE_AVERAGE_STDDEV_2025JUL.csv.
    sas_mean_std = _sas_output(data_dir, "MEASURE_AVERAGE_STDDEV_2025JUL.csv").set_index("_STAT_")
    for stat in ["MEAN", "STD"]:
        diff = (result.mean_std.loc[stat, result.measure_in] - sas_mean_std.loc[stat, result.measure_in]).abs()
        if diff.max() >= TOLERANCE:
            print(f"FAIL {stat}: max diff {diff.max():.2e} on {diff.idxmax()}")
            all_passed = False
        else:
            print(f"PASS {stat}: max diff {diff.max():.2e}")

    # Checkpoint 3 & 4 (standardized + direction-reversed) & 5 (final dataset):
    # compare every std_ column, row by row, against STD_DATA_2025JUL_ANALYSIS.csv.
    sas_analysis = _sas_output(data_dir, "STD_DATA_2025JUL_ANALYSIS.csv")

    if len(result.analysis_dataset) != len(sas_analysis):
        print(f"FAIL row count: ours={len(result.analysis_dataset)} sas={len(sas_analysis)}")
        all_passed = False
    else:
        print(f"PASS row count: {len(result.analysis_dataset)}")

    merged = result.analysis_dataset.merge(sas_analysis, on="PROVIDER_ID", suffixes=("_py", "_sas"))
    for measure in result.measure_in:
        col = f"std_{measure}"
        a, b = merged[f"{col}_py"], merged[f"{col}_sas"]
        diff = (a - b).abs()
        missing_match = (a.isna() == b.isna()).all()
        if diff.max() >= TOLERANCE or not missing_match:
            print(f"FAIL {col}: max diff {diff.max():.2e}, missing_match={missing_match}")
            all_passed = False

    if all_passed:
        print(f"PASS all {len(result.measure_in)} standardized measures (tolerance {TOLERANCE:.0e})")

    return all_passed


if __name__ == "__main__":
    passed = validate_program_0()
    raise SystemExit(0 if passed else 1)
