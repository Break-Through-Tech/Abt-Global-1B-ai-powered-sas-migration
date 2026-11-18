# first_stage.py
"""Python translation of `1 - First stage_Simple Average of Measure Scores_2025Jul.sas`.

The SAS program repeats one block per measure group (lines 27-121):

    PROC SQL; select count(measure_in_name) into: measure_XX_cnt from <group>; QUIT;
    %grp_score(&MEASURE_ANALYSIS, XX, &measure_XX, &measure_XX_cnt, R.<output>);

Here that is one loop over GROUPS. Each group's measure list is built the way
Program 0's SAS builds `&measure_XX` (Program 0 SAS lines 170-282): the group's
measures that survived the volume filter, with the `std_` prefix, in SAS order.
"""

from pathlib import Path

import pandas as pd
import pyreadstat

from program_0.loader import find_data_dir
from program_0.measures import MEASURE_GROUPS

from .group_score import ID_COL, grp_score

# (SAS output dataset / CSV file stem, key in program_0.measures.MEASURE_GROUPS),
# in the order Program 1 runs them (SAS lines 43, 61, 80, 101, 121).
GROUPS: list[tuple[str, str]] = [
    ("OUTCOME_MORTALITY", "mortality"),
    ("OUTCOME_SAFETY", "safety"),
    ("OUTCOME_READMISSION", "readmission"),
    ("PTEXP", "patient_experience"),
    ("PROCESS", "process"),
]

# &MEASURE_ANALYSIS: the standardized analysis dataset Program 0 writes.
ANALYSIS_FILE = "STD_DATA_2025JUL_ANALYSIS"


def load_analysis_data(source: str = "python", data_dir: Path | None = None) -> pd.DataFrame:
    """Loads &MEASURE_ANALYSIS.

    source="python": the Python Program 0 output (the migrated pipeline).
    source="sas": the SAS Program 0 dataset (.sas7bdat, full precision), which
    tests Program 1 on its own, without Program 0's rounding differences.
    """
    data_dir = data_dir or find_data_dir()
    if source == "python":
        path = data_dir / "Python Output CSV" / "program_0" / f"{ANALYSIS_FILE}.csv"
        return pd.read_csv(path, dtype={ID_COL: str})
    if source == "sas":
        path = data_dir / "SAS Output" / f"{ANALYSIS_FILE.lower()}.sas7bdat"
        return pyreadstat.read_sas7bdat(path)[0]
    raise ValueError(f"source must be 'python' or 'sas', not {source!r}")


def group_measures(analysis_data: pd.DataFrame, group: str) -> list[str]:
    """The `std_` measures of one group that are in the analysis dataset (&measure_XX).

    Program 0 only creates `std_` columns for measures with more than 100
    hospitals, so column presence is the same filter SAS applies with
    `where = (col1>100)`.
    """
    return [f"std_{m}" for m in MEASURE_GROUPS[group] if f"std_{m}" in analysis_data.columns]


def run_program_1(analysis_data: pd.DataFrame) -> dict[str, pd.DataFrame]:
    """Runs %grp_score for all five groups. Returns {output name: group score table}."""
    return {
        name: grp_score(analysis_data, group_measures(analysis_data, group))
        for name, group in GROUPS
    }


def write_outputs(results: dict[str, pd.DataFrame], out_dir: Path) -> None:
    """Writes one CSV per group, with the same file names as the SAS answer key."""
    out_dir.mkdir(parents=True, exist_ok=True)
    for name, table in results.items():
        table.to_csv(out_dir / f"{name}.csv", index=False)
