# loader.py
"""Loads the raw Hospital Compare data Program 0 starts from.

Mirrors the SAS step:
    LIBNAME HC "&PATH1";
    DATA All_data_&year.&quarter; SET HC.Alldata_&year.&quarter.; RUN;
"""

from pathlib import Path

import pandas as pd

INPUT_RELATIVE_PATH = "Starrating/alldata_2025jul.csv"


def find_data_dir(start: Path | None = None) -> Path:
    """Locates the data/Project_1 folder, whether run from the repo root or a subfolder."""
    start = start or Path.cwd()
    for candidate in [start, *start.parents]:
        data_dir = candidate / "data" / "Project_1"
        if data_dir.exists():
            return data_dir
    raise FileNotFoundError("Can't locate data/Project_1 — run this inside the repo.")


def load_input_data(data_dir: Path | None = None) -> pd.DataFrame:
    """Loads the raw per-hospital input data (one row per hospital, one column per measure)."""
    data_dir = data_dir or find_data_dir()
    return pd.read_csv(data_dir / INPUT_RELATIVE_PATH)
