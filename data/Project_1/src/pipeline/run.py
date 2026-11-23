"""Runs Programs 0, 1 and 2 back to back on one raw input table.

Each program's own modules do the work. This file only passes the data
between them in memory, so a run does not depend on the CSVs in
`SAS Output CSV/` or `Python Output CSV/`. That lets the app score a new
quarter's input file without writing anything to disk first.

Program 2's loader reads the five group tables from `SAS Output CSV/`.
Here the same merge is done on Program 1's in-memory tables instead, with
the same keep/rename as `program_2.loader.read_scores`.
"""

from __future__ import annotations

import time
from dataclasses import dataclass, field
from pathlib import Path

import pandas as pd

from program_0.loader import INPUT_RELATIVE_PATH, find_data_dir
from program_0.standardize import run_program_0
from program_1.first_stage import run_program_1
from program_2.kmeans import compute_star_ratings
from program_2.loader import DOMAINS
from program_2.national_averages import compute_national_averages
from program_2.peer_groups import assign_peer_groups, merge_summary_and_report
from program_2.report import report
from program_2.summary_score import compute_summary_score

ID_COL = "PROVIDER_ID"


@dataclass
class StepRecord:
    program: int
    name: str
    description: str
    seconds: float
    rows: int


@dataclass
class PipelineResult:
    analysis_dataset: pd.DataFrame
    mean_std: pd.DataFrame
    excluded_measures: list[str]
    group_tables: dict[str, pd.DataFrame]
    star: pd.DataFrame
    national_average: pd.DataFrame
    steps: list[StepRecord] = field(default_factory=list)

    def tables(self) -> dict[str, pd.DataFrame]:
        """Every output table, keyed by the SAS output file name."""
        return {
            "STD_DATA_2025JUL_ANALYSIS": self.analysis_dataset,
            "MEASURE_AVERAGE_STDDEV_2025JUL": self.mean_std.reset_index(names="_STAT_"),
            **self.group_tables,
            "STAR_2025JUL": self.star,
            "NATIONAL_AVERAGE_2025JUL": self.national_average,
        }


def load_raw_input(path: Path | None = None) -> pd.DataFrame:
    """Reads the raw Hospital Compare input, keeping CCNs like '010001' as text."""
    path = path or find_data_dir() / INPUT_RELATIVE_PATH
    return pd.read_csv(path, dtype={ID_COL: str})


def merge_domain_scores(group_tables: dict[str, pd.DataFrame]) -> pd.DataFrame:
    """Same result as `program_2.loader.load_and_merge_domain_data`, from memory."""
    merged = None
    for filename, new_name in DOMAINS:
        scores = group_tables[Path(filename).stem][[ID_COL, "grp_score"]]
        scores = scores.rename(columns={"grp_score": new_name})
        merged = scores if merged is None else merged.merge(scores, on=ID_COL, how="outer")
    return merged.sort_values(ID_COL).reset_index(drop=True)


def run_pipeline(raw_data: pd.DataFrame) -> PipelineResult:
    """Scores one quarter of hospitals and returns every intermediate output."""
    steps: list[StepRecord] = []

    def timed(program: int, name: str, description: str, fn):
        start = time.perf_counter()
        out = fn()
        rows = len(out) if isinstance(out, pd.DataFrame) else len(raw_data)
        steps.append(StepRecord(program, name, description, time.perf_counter() - start, rows))
        return out

    raw = raw_data.copy()
    raw[ID_COL] = raw[ID_COL].astype(str).str.zfill(6)

    p0 = timed(0, "Standardize measures",
               "Drop low-volume measures, standardize to z-scores, align direction",
               lambda: run_program_0(raw))
    steps[-1].rows = len(p0.analysis_dataset)

    group_tables = timed(1, "Group scores",
                         "Average measures within the five groups and standardize",
                         lambda: run_program_1(p0.analysis_dataset))
    steps[-1].rows = len(next(iter(group_tables.values())))

    summary = timed(2, "Summary score",
                    "Weight the five group scores, redistributing missing weights",
                    lambda: compute_summary_score(merge_domain_scores(group_tables)))
    eligibility = timed(2, "Reporting eligibility",
                        "Count measures per group and apply the reporting thresholds",
                        lambda: report(p0.analysis_dataset))
    summary21 = merge_summary_and_report(summary, eligibility)
    peers = timed(2, "Peer groups",
                  "Assign eligible hospitals to 3, 4 or 5 group peer sets",
                  lambda: assign_peer_groups(summary21))
    star = timed(2, "Star assignment",
                 "Two-pass k-means clustering of summary scores within each peer set",
                 lambda: compute_star_ratings(summary21, peers))
    national = timed(2, "National averages",
                     "Average summary and group scores for eligible hospitals",
                     lambda: compute_national_averages(summary21, {
                         filename: group_tables[Path(filename).stem] for filename, _ in DOMAINS
                     }))

    return PipelineResult(
        analysis_dataset=p0.analysis_dataset,
        mean_std=p0.mean_std,
        excluded_measures=list(p0.excluded_measures),
        group_tables=group_tables,
        star=star,
        national_average=national,
        steps=steps,
    )
