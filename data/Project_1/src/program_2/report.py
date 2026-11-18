# SAS SOURCE: 2 - Second Stage...sas (line 99) & Star_Macros.sas (%report, lines 71–151)

from pathlib import Path
import sys
import pandas as pd

PROJECT_DIR = Path(__file__).resolve().parents[2]
SRC_DIR = PROJECT_DIR / "src"
if str(SRC_DIR) not in sys.path:
    sys.path.insert(0, str(SRC_DIR))

from program_0.measures import MEASURE_GROUPS  # noqa: E402

ANALYSIS_CSV_PY = PROJECT_DIR / "Python Output CSV" / "program_0" / "STD_DATA_2025JUL_ANALYSIS.csv"
ANALYSIS_CSV_SAS = PROJECT_DIR / "SAS Output CSV" / "STD_DATA_2025JUL_ANALYSIS.csv"
OUT_DIR = PROJECT_DIR / "Python Output CSV" / "program_2"

OUTPUT_COLS = [
    "PROVIDER_ID",
    "report_indicator",
    "Patient_Experience_cnt",
    "Outcomes_Readmission_cnt",
    "Outcomes_Mortality_cnt",
    "Outcomes_safety_cnt",
    "Process_cnt",
    "Total_measure_group_cnt",
    "MortSafe_Group_cnt",
]


def _resolve_measure_cols(df_columns: pd.Index, measures: list[str]) -> list[str]:
    """Map raw or std_-prefixed measure names to columns present in df."""
    col_set = set(df_columns)
    resolved = []
    for m in measures:
        if m in col_set:
            resolved.append(m)
        elif f"std_{m}" in col_set:
            resolved.append(f"std_{m}")
    return resolved


def load_analysis_data(csv_path: Path | None = None) -> pd.DataFrame:
    """Load Program 0 standardized measure dataset with PROVIDER_ID preserved as str."""
    path = csv_path or (ANALYSIS_CSV_PY if ANALYSIS_CSV_PY.exists() else ANALYSIS_CSV_SAS)
    return pd.read_csv(path, dtype={"PROVIDER_ID": str})


def report(
    indsn: pd.DataFrame,
    measure_OM: list[str] | None = None,
    measure_OS: list[str] | None = None,
    measure_OR: list[str] | None = None,
    measure_PtExp: list[str] | None = None,
    measure_Process: list[str] | None = None,
) -> pd.DataFrame:
    """Python equivalent of SAS %report macro (Star_Macros.sas lines 71–151)."""
    df = indsn.copy()
    if "PROVIDER_ID" not in df.columns and "provider_id" in df.columns:
        df = df.rename(columns={"provider_id": "PROVIDER_ID"})

    om_cols = _resolve_measure_cols(df.columns, measure_OM if measure_OM is not None else MEASURE_GROUPS["mortality"])
    os_cols = _resolve_measure_cols(df.columns, measure_OS if measure_OS is not None else MEASURE_GROUPS["safety"])
    or_cols = _resolve_measure_cols(df.columns, measure_OR if measure_OR is not None else MEASURE_GROUPS["readmission"])
    ptexp_cols = _resolve_measure_cols(
        df.columns, measure_PtExp if measure_PtExp is not None else MEASURE_GROUPS["patient_experience"]
    )
    proc_cols = _resolve_measure_cols(df.columns, measure_Process if measure_Process is not None else MEASURE_GROUPS["process"])

    # SAS Lines 79–133: Count non-missing measures per domain
    df["Outcomes_Mortality_cnt"] = df[om_cols].notna().sum(axis=1)
    df["Outcomes_safety_cnt"] = df[os_cols].notna().sum(axis=1)
    df["Outcomes_Readmission_cnt"] = df[or_cols].notna().sum(axis=1)
    df["Patient_Experience_cnt"] = df[ptexp_cols].notna().sum(axis=1)
    df["Process_cnt"] = df[proc_cols].notna().sum(axis=1)

    # SAS Lines 135–144: Count measure groups with >= 3 available measures
    group_count_cols = [
        "Patient_Experience_cnt",
        "Outcomes_Mortality_cnt",
        "Outcomes_Readmission_cnt",
        "Outcomes_safety_cnt",
        "Process_cnt",
    ]
    df["Total_measure_group_cnt"] = (df[group_count_cols] >= 3).sum(axis=1)

    # SAS Line 146: Count how many of Mortality and Safety have >= 3 measures
    df["MortSafe_Group_cnt"] = (
        (df["Outcomes_Mortality_cnt"] >= 3).astype(int)
        + (df["Outcomes_safety_cnt"] >= 3).astype(int)
    )

    # SAS Line 148: Final reporting eligibility
    df["report_indicator"] = (
        (df["MortSafe_Group_cnt"] >= 1)
        & (df["Total_measure_group_cnt"] >= 3)
    ).astype(int)

    return df[OUTPUT_COLS].copy()


if __name__ == "__main__":
    analysis_df = load_analysis_data()
    report_df = report(analysis_df)

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    out_file = OUT_DIR / "report_indicator.csv"
    report_df.to_csv(out_file, index=False)

    eligible = int(report_df["report_indicator"].sum())
    print(f"Processed {report_df.shape[0]} rows ({eligible} eligible for Star Rating). Saved to {out_file}")

