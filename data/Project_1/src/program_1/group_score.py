# group_score.py
"""Python translation of the `%grp_score` macro (Star_Macros.sas, lines 28-63).

Program 1 calls this macro once per measure group. For one group it:

    1. flags each measure as present (1) or missing (0)       (lines 32-38)
    2. counts the present measures per hospital                (line 39)
    3. averages the present measures: sum * (1 / count)        (lines 41-44)
    4. standardizes the averages to mean 0, std 1              (line 48, PROC STANDARD)
    5. attaches the mean and std of the averages to every row  (lines 51-60, PROC MEANS + SQL join)
    6. renames avg to score_before_std and the z-score to grp_score (line 62)
"""

import pandas as pd

ID_COL = "PROVIDER_ID"


def grp_score(analysis_data: pd.DataFrame, measures: list[str]) -> pd.DataFrame:
    """Calculates one group's scores, with the same columns and row order as the SAS output.

    `measures` is the group's `std_` measure list in SAS order (`&varlist`).
    """
    values = analysis_data[measures]

    # Lines 32-38: C[k] = 1 if the measure is non-missing, else 0.
    flags = values.notna().astype(int)
    flags.columns = [f"C{k}" for k in range(1, len(measures) + 1)]

    # Line 39: total_cnt = sum(of c1-c&nmeasure.)
    total_cnt = flags.sum(axis=1)

    # Lines 41-44: only when total_cnt > 0. Otherwise measure_wt and avg stay missing.
    # SAS sum(of ...) skips missing values, and an all-missing row never gets here.
    # Keep SAS's order of operations (sum times reciprocal, not a mean) so the floats match.
    measure_wt = 1 / total_cnt.where(total_cnt > 0)
    avg = values.sum(axis=1) * measure_wt

    # Lines 48 and 51-54: PROC STANDARD and PROC MEANS both skip missing values
    # and use the sample standard deviation (n - 1), which is the pandas default.
    mean, std_dev = avg.mean(), avg.std()

    # Lines 29 and 62: the columns SAS keeps, in its order. Mean and StdDev come
    # from the cross join with the one-row PROC MEANS table (lines 56-60).
    out = pd.concat([analysis_data[[ID_COL, *measures]], flags], axis=1)
    out["total_cnt"] = total_cnt
    out["measure_wt"] = measure_wt
    out["score_before_std"] = avg
    out["Mean"] = mean
    out["StdDev"] = std_dev
    out["grp_score"] = (avg - mean) / std_dev
    return out
