"""Compares a pipeline run with the SAS answer key in `SAS Output/*.sas7bdat`.

The `.sas7bdat` files keep full precision (the SAS CSVs round some columns),
so they are the reference. Only rows and columns present in both sides are
compared, matched on PROVIDER_ID where the table has one.
"""

from __future__ import annotations

from dataclasses import asdict, dataclass
from pathlib import Path

import numpy as np
import pandas as pd
import pyreadstat

from program_0.loader import find_data_dir

from .run import ID_COL, PipelineResult

TOLERANCE = 1e-6


@dataclass
class TableCheck:
    table: str
    program: int
    rows_python: int
    rows_sas: int
    columns_compared: int
    max_abs_diff: float
    mismatched_cells: int
    passed: bool

    def to_dict(self) -> dict:
        return asdict(self)


TABLE_PROGRAM = {
    "STD_DATA_2025JUL_ANALYSIS": 0,
    "MEASURE_AVERAGE_STDDEV_2025JUL": 0,
    "OUTCOME_MORTALITY": 1,
    "OUTCOME_SAFETY": 1,
    "OUTCOME_READMISSION": 1,
    "PTEXP": 1,
    "PROCESS": 1,
    "STAR_2025JUL": 2,
    "NATIONAL_AVERAGE_2025JUL": 2,
}


def load_sas_table(name: str, data_dir: Path | None = None) -> pd.DataFrame | None:
    path = (data_dir or find_data_dir()) / "SAS Output" / f"{name.lower()}.sas7bdat"
    if not path.exists():
        return None
    return pyreadstat.read_sas7bdat(path)[0]


def _align(python: pd.DataFrame, sas: pd.DataFrame, name: str) -> tuple[pd.DataFrame, pd.DataFrame]:
    if name == "MEASURE_AVERAGE_STDDEV_2025JUL":
        sas = sas.set_index(sas["_STAT_"].str.strip())
        python = python.set_index(python["_STAT_"].astype(str).str.strip())
        keys = python.index.intersection(sas.index)
        return python.loc[keys], sas.loc[keys]
    if ID_COL in python.columns and ID_COL in sas.columns:
        python = python.assign(**{ID_COL: python[ID_COL].astype(str).str.zfill(6)}).set_index(ID_COL)
        sas = sas.assign(**{ID_COL: sas[ID_COL].astype(str).str.strip().str.zfill(6)}).set_index(ID_COL)
        keys = python.index.intersection(sas.index)
        return python.loc[keys], sas.loc[keys]
    return python.reset_index(drop=True), sas.reset_index(drop=True)


def compare_table(name: str, python: pd.DataFrame, sas: pd.DataFrame) -> TableCheck:
    left, right = _align(python, sas, name)
    lower_right = {c.lower(): c for c in right.columns}
    max_diff, mismatched, compared = 0.0, 0, 0
    for col in left.columns:
        sas_col = lower_right.get(col.lower())
        if sas_col is None or col.upper() in {"_STAT_", "_TYPE_", "_FREQ_"}:
            continue
        a, b = left[col], right[sas_col]
        if pd.api.types.is_numeric_dtype(a) and pd.api.types.is_numeric_dtype(b):
            a, b = a.to_numpy(dtype=float), b.to_numpy(dtype=float)
            both_missing = np.isnan(a) & np.isnan(b)
            one_missing = np.isnan(a) ^ np.isnan(b)
            diff = np.where(both_missing | one_missing, 0.0, np.abs(a - b))
            mismatched += int(one_missing.sum() + (diff > TOLERANCE).sum())
            max_diff = max(max_diff, float(np.nanmax(diff)) if len(diff) else 0.0)
        else:
            sa = a.astype("string").str.strip().fillna("")
            sb = b.astype("string").str.strip().fillna("")
            mismatched += int((sa.to_numpy() != sb.to_numpy()).sum())
        compared += 1
    return TableCheck(
        table=name,
        program=TABLE_PROGRAM.get(name, -1),
        rows_python=len(python),
        rows_sas=len(sas),
        columns_compared=compared,
        max_abs_diff=max_diff,
        mismatched_cells=mismatched,
        passed=mismatched == 0 and len(python) == len(sas),
    )


def validate_against_sas(result: PipelineResult, data_dir: Path | None = None) -> list[TableCheck]:
    checks = []
    for name, table in result.tables().items():
        sas = load_sas_table(name, data_dir)
        if sas is not None:
            checks.append(compare_table(name, table, sas))
    return checks
