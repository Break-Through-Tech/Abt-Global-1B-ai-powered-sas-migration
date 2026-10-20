# standardize.py
"""Python translation of Program 0's measure-standardization logic.

Mirrors the SAS sequence (preserve this order — changing it changes the
results, see ai/prog 0/AI_TIPS.md #5):

    all measures
        -> exclude measures with <=100 hospitals          (volume filter)
        -> keep hospitals with >=1 included measure        (%keep_hos)
        -> calculate mean / standard deviation              (PROC MEANS)
        -> standardize measures to mean 0, std 1            (PROC STANDARD)
        -> reverse "lower is better" measures                (direction flip)
        -> build final analysis dataset
"""

from dataclasses import dataclass

import pandas as pd

from .keep_hos import keep_hos
from .measures import ALL_MEASURES, MIN_MEASURE_VOLUME, NEGATIVE_DIRECTION_MEASURES


def compute_measure_volume(df: pd.DataFrame, measures: list[str] = ALL_MEASURES) -> pd.Series:
    """Non-missing hospital count per measure (SAS `PROC TABULATE ... table n*(...)`)."""
    return df[measures].notna().sum()


def split_included_excluded(volume: pd.Series, threshold: int = MIN_MEASURE_VOLUME) -> tuple[list[str], list[str]]:
    """Splits measures into (included, excluded) by hospital-count volume.

    SAS excludes on `col1<=100`, includes on `col1>100` (SAS lines 101-102,
    140) — strictly greater than, not >=.
    """
    included = volume[volume > threshold].index.tolist()
    excluded = volume[volume <= threshold].index.tolist()
    return included, excluded


def compute_mean_std(df: pd.DataFrame, measure_in: list[str]) -> pd.DataFrame:
    """Per-measure N / MIN / MAX / MEAN / STD, matching SAS `PROC MEANS` output
    (and the `_STAT_`-indexed shape of MEASURE_AVERAGE_STDDEV_2025JUL.csv).
    """
    stats = df[measure_in].agg(["count", "min", "max", "mean", "std"])
    stats.index = ["N", "MIN", "MAX", "MEAN", "STD"]
    return stats


def standardize_measures(df: pd.DataFrame, measure_in: list[str]) -> pd.DataFrame:
    """z-scores each measure: (value - mean) / sample std dev.

    `ddof=1` (sample standard deviation, divide by n-1) matches SAS
    `PROC STANDARD`'s default and is also pandas' `.std()` default.
    Missing values stay missing — SAS does not impute them.
    """
    out = df.copy()
    for measure in measure_in:
        col = out[measure]
        out[measure] = (col - col.mean()) / col.std(ddof=1)
    return out


def apply_direction_reversal(
    df: pd.DataFrame,
    measure_in: list[str],
    negative_direction: list[str] = NEGATIVE_DIRECTION_MEASURES,
) -> pd.DataFrame:
    """Flips the sign of standardized "lower is better" measures.

    After this, "higher standardized score" means "better hospital" for
    every included measure. Only flips measures that are both in
    `measure_in` (survived the volume filter) and in the hardcoded
    negative-direction list (SAS lines 319-357).
    """
    out = df.copy()
    for measure in measure_in:
        if measure in negative_direction:
            out[measure] = -out[measure]
    return out


def build_analysis_dataset(standardized_df: pd.DataFrame, measure_in: list[str]) -> pd.DataFrame:
    """Renames standardized measure columns with a `std_` prefix and drops
    the raw measure columns, matching the SAS `DATA &MEASURE_ANALYSIS
    (drop=i &measure_in)` step. All other columns (PROVIDER_ID, `_DEN`
    volume columns, `Total_m_cnt`, etc.) pass through unchanged.
    """
    # SAS creates the std_ columns new, so they land after all other columns.
    others = [c for c in standardized_df.columns if c not in measure_in]
    out = standardized_df.rename(columns={m: f"std_{m}" for m in measure_in})
    return out[others + [f"std_{m}" for m in measure_in]]


@dataclass
class Program0Result:
    analysis_dataset: pd.DataFrame
    mean_std: pd.DataFrame
    measure_in: list[str]
    excluded_measures: list[str]


def run_program_0(raw_data: pd.DataFrame) -> Program0Result:
    """Runs the full Program 0 pipeline on the raw input data."""
    volume = compute_measure_volume(raw_data)
    measure_in, excluded_measures = split_included_excluded(volume)

    initial_data = raw_data.drop(columns=excluded_measures)
    # keep_hos is Christa's translation of %keep_hos (PR #24)
    filtered = keep_hos(initial_data, measure_in, len(measure_in)).reset_index(drop=True)

    mean_std = compute_mean_std(filtered, measure_in)
    standardized = standardize_measures(filtered, measure_in)
    reversed_df = apply_direction_reversal(standardized, measure_in)
    analysis_dataset = build_analysis_dataset(reversed_df, measure_in)

    return Program0Result(
        analysis_dataset=analysis_dataset,
        mean_std=mean_std,
        measure_in=measure_in,
        excluded_measures=excluded_measures,
    )


def write_outputs(result: Program0Result, out_dir) -> None:
    """Writes the Python outputs (same file names as the SAS answer key)."""
    from pathlib import Path

    out_dir = Path(out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    result.analysis_dataset.to_csv(out_dir / "STD_DATA_2025JUL_ANALYSIS.csv", index=False)
    result.mean_std.to_csv(out_dir / "MEASURE_AVERAGE_STDDEV_2025JUL.csv", index_label="_STAT_")
