"""Hospital-by-hospital comparison of two runs, for example one quarter against the next."""

from __future__ import annotations

import math

import pandas as pd

from pipeline import PipelineResult
from pipeline.run import ID_COL

from .reference import state_from_ccn

STATUSES = ["up", "down", "same", "newly_rated", "no_longer_rated", "added", "removed", "unrated"]
RATINGS = ["1", "2", "3", "4", "5", "none"]


def _num(v):
    if v is None or v is pd.NA or (isinstance(v, float) and math.isnan(v)):
        return None
    return v.item() if hasattr(v, "item") else v


def _frame(result: PipelineResult) -> pd.DataFrame:
    s = result.star
    return pd.DataFrame({
        ID_COL: s[ID_COL],
        "star": s["star"].astype("Float64"),
        "summary": s["summary_score"],
    })


def _status(row) -> str:
    if row["_merge"] == "left_only":
        return "removed"
    if row["_merge"] == "right_only":
        return "added"
    before, after = row["star_base"], row["star_target"]
    if pd.isna(before) and pd.isna(after):
        return "unrated"
    if pd.isna(before):
        return "newly_rated"
    if pd.isna(after):
        return "no_longer_rated"
    if after > before:
        return "up"
    if after < before:
        return "down"
    return "same"


def _rating_key(v) -> str:
    return "none" if pd.isna(v) else str(int(v))


def compare_runs(base: PipelineResult, target: PipelineResult) -> dict:
    merged = _frame(base).merge(_frame(target), on=ID_COL, how="outer",
                                suffixes=("_base", "_target"), indicator=True)
    merged["status"] = merged.apply(_status, axis=1)

    counts = {k: int((merged["status"] == k).sum()) for k in STATUSES}

    both = merged[merged["_merge"] == "both"]
    matrix = {
        b: {t: int(((both["star_base"].map(_rating_key) == b) & (both["star_target"].map(_rating_key) == t)).sum())
            for t in RATINGS}
        for b in RATINGS
    }

    def distribution(col: str) -> dict:
        return {r: int((merged[col] == int(r)).sum()) for r in RATINGS[:-1]}

    changed = merged[~merged["status"].isin(["same", "unrated"])].copy()
    changed["delta"] = changed["summary_target"] - changed["summary_base"]
    order = {"down": 0, "no_longer_rated": 1, "up": 2, "newly_rated": 3, "removed": 4, "added": 5}
    changed = changed.sort_values(by=["status", ID_COL], key=lambda c: c.map(order) if c.name == "status" else c)

    return {
        "counts": counts,
        "matrix": matrix,
        "distribution": {"base": distribution("star_base"), "target": distribution("star_target")},
        "changes": [
            {
                "id": r[ID_COL],
                "state": state_from_ccn(r[ID_COL]),
                "status": r["status"],
                "before": _num(r["star_base"]) and int(r["star_base"]),
                "after": _num(r["star_target"]) and int(r["star_target"]),
                "summaryBefore": _num(r["summary_base"]),
                "summaryAfter": _num(r["summary_target"]),
                "delta": _num(r["delta"]),
            }
            for _, r in changed.iterrows()
        ],
    }
