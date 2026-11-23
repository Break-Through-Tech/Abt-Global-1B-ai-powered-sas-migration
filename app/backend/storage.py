"""Saves pipeline runs to disk so they survive restarts and can be compared later.

Layout, one folder per run:
    <RUNS_DIR>/<run id>/summary.json        what the UI shows (counts, validation, manifest)
    <RUNS_DIR>/<run id>/tables/*.csv.gz     every output table, same names as the SAS outputs

Plain gzip CSV keeps the files readable by any tool (Excel, R, SAS) without this app.
"""

from __future__ import annotations

import json
import re
import shutil
import threading
from collections import OrderedDict
from pathlib import Path

import pandas as pd
from fastapi import HTTPException

from pipeline import PipelineResult, StepRecord
from pipeline.run import ID_COL

RUN_ID = re.compile(r"^[0-9a-f]{12}$")
GROUP_TABLES = ["OUTCOME_MORTALITY", "OUTCOME_SAFETY", "OUTCOME_READMISSION", "PTEXP", "PROCESS"]
LOADED_RESULTS_KEPT = 4


def _write_table(df: pd.DataFrame, path: Path) -> None:
    df.to_csv(path, index=False, compression="gzip")


def _read_table(path: Path) -> pd.DataFrame:
    return pd.read_csv(path, dtype={ID_COL: str}, compression="gzip")


def save_result(result: PipelineResult, folder: Path) -> None:
    tables = folder / "tables"
    tables.mkdir(parents=True)
    _write_table(result.analysis_dataset, tables / "STD_DATA_2025JUL_ANALYSIS.csv.gz")
    _write_table(result.mean_std.reset_index(names="_STAT_"), tables / "MEASURE_AVERAGE_STDDEV_2025JUL.csv.gz")
    for name, table in result.group_tables.items():
        _write_table(table, tables / f"{name}.csv.gz")
    _write_table(result.star, tables / "STAR_2025JUL.csv.gz")
    _write_table(result.national_average, tables / "NATIONAL_AVERAGE_2025JUL.csv.gz")


def load_result(folder: Path, summary: dict) -> PipelineResult:
    tables = folder / "tables"
    star = _read_table(tables / "STAR_2025JUL.csv.gz")
    star["star"] = star["star"].astype("Int64")
    return PipelineResult(
        analysis_dataset=_read_table(tables / "STD_DATA_2025JUL_ANALYSIS.csv.gz"),
        mean_std=_read_table(tables / "MEASURE_AVERAGE_STDDEV_2025JUL.csv.gz").set_index("_STAT_"),
        excluded_measures=[m["code"] for m in summary.get("excludedMeasures", [])],
        group_tables={name: _read_table(tables / f"{name}.csv.gz") for name in GROUP_TABLES},
        star=star,
        national_average=_read_table(tables / "NATIONAL_AVERAGE_2025JUL.csv.gz"),
        steps=[StepRecord(**s) for s in summary.get("steps", [])],
    )


class RunStore:
    """Every run on disk, with the most recently used results cached in memory."""

    def __init__(self, root: Path) -> None:
        self.root = root
        self.root.mkdir(parents=True, exist_ok=True)
        self._lock = threading.Lock()
        self._summaries: dict[str, dict] = {}
        self._results: OrderedDict[str, PipelineResult] = OrderedDict()
        for summary_file in self.root.glob("*/summary.json"):
            try:
                summary = json.loads(summary_file.read_text())
            except (OSError, json.JSONDecodeError):
                continue  # a half-written or damaged run is skipped, not fatal
            if RUN_ID.match(summary.get("id", "")):
                self._summaries[summary["id"]] = summary

    def _folder(self, run_id: str) -> Path:
        if not RUN_ID.match(run_id):
            raise HTTPException(404, "Run not found.")
        return self.root / run_id

    def _cache(self, run_id: str, result: PipelineResult) -> None:
        self._results[run_id] = result
        self._results.move_to_end(run_id)
        while len(self._results) > LOADED_RESULTS_KEPT:
            self._results.popitem(last=False)

    def add(self, summary: dict, result: PipelineResult) -> None:
        folder = self._folder(summary["id"])
        staging = self.root / f".{summary['id']}.tmp"
        shutil.rmtree(staging, ignore_errors=True)
        save_result(result, staging)
        (staging / "summary.json").write_text(json.dumps(summary, indent=2))
        staging.rename(folder)  # the run appears only once it is complete
        with self._lock:
            self._summaries[summary["id"]] = summary
            self._cache(summary["id"], result)

    def resolve(self, run_id: str) -> str:
        if run_id == "latest":
            with self._lock:
                if not self._summaries:
                    raise HTTPException(404, "No runs yet.")
                return max(self._summaries.values(), key=lambda s: s["createdAt"])["id"]
        return run_id

    def summary(self, run_id: str) -> dict:
        run_id = self.resolve(run_id)
        with self._lock:
            summary = self._summaries.get(run_id)
        if summary is None:
            raise HTTPException(404, "Run not found. It may have been deleted.")
        return summary

    def result(self, run_id: str) -> PipelineResult:
        summary = self.summary(run_id)
        run_id = summary["id"]
        with self._lock:
            cached = self._results.get(run_id)
            if cached is not None:
                self._results.move_to_end(run_id)
                return cached
        result = load_result(self._folder(run_id), summary)
        with self._lock:
            self._cache(run_id, result)
        return result

    def list(self) -> list[dict]:
        with self._lock:
            return sorted(self._summaries.values(), key=lambda s: s["createdAt"], reverse=True)

    def find(self, **match) -> dict | None:
        for summary in self.list():
            if all(_dig(summary, key) == value for key, value in match.items()):
                return summary
        return None

    def update(self, run_id: str, **fields) -> dict:
        summary = {**self.summary(run_id), **fields}
        (self._folder(summary["id"]) / "summary.json").write_text(json.dumps(summary, indent=2))
        with self._lock:
            self._summaries[summary["id"]] = summary
        return summary

    def delete(self, run_id: str) -> None:
        summary = self.summary(run_id)
        with self._lock:
            self._summaries.pop(summary["id"], None)
            self._results.pop(summary["id"], None)
        shutil.rmtree(self._folder(summary["id"]), ignore_errors=True)


def _dig(summary: dict, dotted: str):
    value = summary
    for part in dotted.split("__"):
        value = value.get(part) if isinstance(value, dict) else None
    return value
