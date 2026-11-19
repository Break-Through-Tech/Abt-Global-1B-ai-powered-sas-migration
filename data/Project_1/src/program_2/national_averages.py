# SAS SOURCE: 2 - Second Stage...sas (lines 193–227)
#             & Star_Macros.sas (%nation_avg0, %nation_avg_peer, %nation_avg, lines 240–296)

from pathlib import Path
import sys
import pandas as pd

PROJECT_DIR = Path(__file__).resolve().parents[2]
SRC_DIR = PROJECT_DIR / "src"
if str(SRC_DIR) not in sys.path:
    sys.path.insert(0, str(SRC_DIR))

from program_2.loader import CSV_DIR, OUT_DIR, load_and_merge_domain_data  # noqa: E402
from program_2.report import load_analysis_data, report  # noqa: E402
from program_2.summary_score import compute_summary_score  # noqa: E402

# (SAS domain CSV filename, national average column name in NATIONAL_AVERAGE_2025JUL.csv)
NATIONAL_DOMAINS = [
    ("OUTCOME_MORTALITY.csv", "Out_Mrt_Grp_Score_Nat"),
    ("OUTCOME_SAFETY.csv", "Out_Sft_Grp_Score_Nat"),
    ("OUTCOME_READMISSION.csv", "Out_Readm_grp_Score_Nat"),
    ("PTEXP.csv", "Pt_Exp_Grp_Score_Nat"),
    ("PROCESS.csv", "Prc_of_Care_Grp_Score_Nat"),
]

PEER_GROUPS = (3, 4, 5)


def nation_avg0(summary_scores: pd.DataFrame) -> float:
    """SAS %nation_avg0: mean summary_score for hospitals with report_indicator == 1."""
    eligible = summary_scores["report_indicator"] == 1
    return float(summary_scores.loc[eligible, "summary_score"].mean())


def nation_avg_peer(summary_scores: pd.DataFrame) -> dict[str, float]:
    """SAS %nation_avg_peer: mean summary_score by Total_measure_group_cnt (3, 4, 5) for eligible hospitals."""
    eligible = summary_scores[summary_scores["report_indicator"] == 1]
    means = eligible.groupby("Total_measure_group_cnt")["summary_score"].mean()
    return {
        f"Summary_Score_Nat_peer{peer}": float(means.get(peer, float("nan")))
        for peer in PEER_GROUPS
    }


def nation_avg(group_scores: pd.DataFrame) -> float:
    """SAS %nation_avg: mean grp_score for one domain where hospital has total_cnt >= 3."""
    eligible = group_scores["total_cnt"] >= 3
    return float(group_scores.loc[eligible, "grp_score"].mean())


def load_domain_tables(csv_dir: Path = CSV_DIR) -> dict[str, pd.DataFrame]:
    """Load the 5 domain-score tables (containing total_cnt and grp_score) from CSV."""
    return {
        filename: pd.read_csv(csv_dir / filename, dtype={"PROVIDER_ID": str})
        for filename, _ in NATIONAL_DOMAINS
    }


def compute_national_averages(
    summary_with_report: pd.DataFrame,
    domain_tables: dict[str, pd.DataFrame] | None = None,
) -> pd.DataFrame:
    """Combine %nation_avg0, %nation_avg_peer, and %nation_avg into a 1-row DataFrame."""
    if domain_tables is None:
        domain_tables = load_domain_tables()

    # 1. Overall & peer-group national summary score averages
    row: dict[str, float] = {"Summary_Score_Nat": nation_avg0(summary_with_report)}
    row.update(nation_avg_peer(summary_with_report))

    # 2. National average for each of the 5 domains (hospitals with >= 3 measures in that domain)
    for filename, nat_col in NATIONAL_DOMAINS:
        row[nat_col] = nation_avg(domain_tables[filename])

    return pd.DataFrame([row])


if __name__ == "__main__":
    # Build summary scores + reporting eligibility using existing Program 2 modules
    summary_df = compute_summary_score(load_and_merge_domain_data())
    report_df = report(load_analysis_data())
    merged = summary_df.merge(report_df, on="PROVIDER_ID", how="inner")

    nat_df = compute_national_averages(merged)

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    out_file = OUT_DIR / "NATIONAL_AVERAGE_2025JUL.csv"
    nat_df.to_csv(out_file, index=False)
    print(f"Saved national averages ({nat_df.shape[1]} columns) to {out_file}")
