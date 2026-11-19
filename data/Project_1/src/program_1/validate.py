# validate.py
"""Validates the Program 1 translation against the SAS answer key.

Runs Program 1 on two inputs and compares each of the five group tables with
the SAS `.sas7bdat` output (full precision, unlike the rounded CSVs):

    source="sas"     SAS Program 0 output in  -> tests Program 1 by itself
    source="python"  Python Program 0 output in -> tests Programs 0 + 1 together

Run from data/Project_1/src:  python -m program_1.validate
"""

from pathlib import Path

import numpy as np
import pandas as pd
import pyreadstat

from program_0.loader import find_data_dir

from .first_stage import GROUPS, load_analysis_data, run_program_1

# Program 1 by itself should match SAS to floating-point noise. With Python
# Program 0 output as input, it inherits Program 0's ~4e-9 differences, so it
# uses the team's Program 0 tolerance.
TOLERANCES = {"sas": 1e-10, "python": 1e-6}

# Counts and flags must match exactly.
EXACT_COLS = ("total_cnt",)


def load_sas_output(name: str, data_dir: Path | None = None) -> pd.DataFrame:
    data_dir = data_dir or find_data_dir()
    return pyreadstat.read_sas7bdat(data_dir / "SAS Output" / f"{name.lower()}.sas7bdat")[0]


def compare_group(actual: pd.DataFrame, expected: pd.DataFrame, tolerance: float) -> list[str]:
    """Returns a list of problems. An empty list means the table matches SAS."""
    if list(actual.columns) != list(expected.columns):
        return [f"columns differ: {list(actual.columns)} vs {list(expected.columns)}"]
    if len(actual) != len(expected):
        return [f"row count {len(actual)} vs {len(expected)}"]

    problems = []
    if not (actual["PROVIDER_ID"].to_numpy() == expected["PROVIDER_ID"].to_numpy()).all():
        problems.append("PROVIDER_ID values or order differ")

    for col in actual.columns.drop("PROVIDER_ID"):
        a, e = actual[col].to_numpy(float), expected[col].to_numpy(float)
        if not (np.isnan(a) == np.isnan(e)).all():
            problems.append(f"{col}: missing values in different rows")
            continue
        exact = col in EXACT_COLS or (col.startswith("C") and col[1:].isdigit())
        diff = np.nanmax(np.abs(a - e), initial=0.0)
        if diff > (0 if exact else tolerance):
            problems.append(f"{col}: max diff {diff:.2e}")
    return problems


def validate_program_1(data_dir: Path | None = None) -> bool:
    data_dir = data_dir or find_data_dir()
    expected = {name: load_sas_output(name, data_dir) for name, _ in GROUPS}

    all_passed = True
    for source, tolerance in TOLERANCES.items():
        results = run_program_1(load_analysis_data(source, data_dir))
        for name, actual in results.items():
            problems = compare_group(actual, expected[name], tolerance)
            worst = (actual["grp_score"] - expected[name]["grp_score"]).abs().max()
            if problems:
                all_passed = False
                print(f"FAIL [{source} input] {name}: " + "; ".join(problems))
            else:
                print(f"PASS [{source} input] {name}: {len(actual)} rows, grp_score max diff {worst:.1e}")
    return all_passed


if __name__ == "__main__":
    raise SystemExit(0 if validate_program_1() else 1)
