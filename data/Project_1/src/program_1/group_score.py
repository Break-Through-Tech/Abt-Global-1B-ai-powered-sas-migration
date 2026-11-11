"""Translate the STAR Macro's %grp_score used by Program 1."""

import pandas as pd


def grp_score(analysis_data: pd.DataFrame, measures: list[str]) -> pd.DataFrame:
    """Calculate one domain's group scores from standardized hospital measures.

    Mirrors Star_Macros.sas lines 28-63. Preserve rows with no measures as
    missing scores, and use sample standard deviation across hospital averages.
    """
    values = analysis_data[measures]
    flags = values.notna().astype(int)
    flags.columns = [f"C{i}" for i in range(1, len(measures) + 1)]
    counts = flags.sum(axis=1)
    weights = 1.0 / counts.where(counts.gt(0))
    averages = values.sum(axis=1, min_count=1) * weights
    mean = averages.mean()
    stddev = averages.std(ddof=1)

    result = pd.concat([analysis_data[["PROVIDER_ID", *measures]], flags], axis=1)
    result["total_cnt"] = counts
    result["measure_wt"] = weights
    result["score_before_std"] = averages
    result["Mean"] = mean
    result["StdDev"] = stddev
    result["grp_score"] = (averages - mean) / (float("nan") if stddev == 0 else stddev)
    return result
