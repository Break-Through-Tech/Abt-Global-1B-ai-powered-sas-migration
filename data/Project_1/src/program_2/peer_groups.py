# SAS SOURCE: 2 - Second Stage...sas (lines 103–127)

from pathlib import Path
import numpy as np
import pandas as pd

PROJECT_DIR = Path(__file__).resolve().parents[2]
OUT_DIR = PROJECT_DIR / "Python Output CSV" / "program_2"

PEER_GROUP_LABELS = {
    3: "1) # of groups=3       ",
    4: "2) # of groups=4       ",
    5: "3) # of groups=5       ",
}


def merge_summary_and_report(
    summary_df: pd.DataFrame,
    report_df: pd.DataFrame,
) -> pd.DataFrame:
    """SAS equivalent of lines 104–115 (summary_score21).

    Full outer merge of summary_score and report_indicator on PROVIDER_ID.
    """
    s_sorted = summary_df.sort_values("PROVIDER_ID").reset_index(drop=True)
    r_sorted = report_df.sort_values("PROVIDER_ID").reset_index(drop=True)

    # Avoid duplicate _x/_y columns if any non-key column exists in both tables
    overlap = [c for c in r_sorted.columns if c in s_sorted.columns and c != "PROVIDER_ID"]
    if overlap:
        r_sorted = r_sorted.drop(columns=overlap)

    merged = s_sorted.merge(r_sorted, on="PROVIDER_ID", how="outer")
    return merged.sort_values("PROVIDER_ID").reset_index(drop=True)


def assign_peer_groups(summary_score21: pd.DataFrame) -> pd.DataFrame:
    """SAS equivalent of lines 118–127 (summary_score22).

    Keeps eligible hospitals (report_indicator == 1) and assigns cnt_grp
    based on Total_measure_group_cnt (3, 4, or 5).
    """
    df = summary_score21.loc[summary_score21["report_indicator"] == 1].copy()

    df["total_grp"] = (
        (df["Outcomes_Mortality_cnt"] >= 3).astype(int)
        + (df["Outcomes_safety_cnt"] >= 3).astype(int)
        + (df["Outcomes_Readmission_cnt"] >= 3).astype(int)
        + (df["Patient_Experience_cnt"] >= 3).astype(int)
        + (df["Process_cnt"] >= 3).astype(int)
    )

    df["cnt_grp"] = df["Total_measure_group_cnt"].map(PEER_GROUP_LABELS)
    df["cnt_grp"] = df["cnt_grp"].where(df["cnt_grp"].notna(), np.nan)
    return df.reset_index(drop=True)


if __name__ == "__main__":
    # Reuses your existing loader.py, summary_score.py, and report.py functions
    from loader import load_and_merge_domain_data
    from report import load_analysis_data, report
    from summary_score import compute_summary_score

    summary_df = compute_summary_score(load_and_merge_domain_data())
    report_df = report(load_analysis_data())

    summary_score21 = merge_summary_and_report(summary_df, report_df)
    summary_score22 = assign_peer_groups(summary_score21)

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    out_file = OUT_DIR / "summary_score22.csv"
    summary_score22.to_csv(out_file, index=False)
    print(f"Processed {summary_score22.shape[0]} eligible rows across {summary_score22['cnt_grp'].nunique()} peer groups. Saved to {out_file}")
