"""Calculate Program 2's overall and domain national averages."""

import pandas as pd

from program_0.measures import MEASURE_GROUPS
from program_1.group_score import grp_score

from .loader import DOMAINS, OUT_DIR, merge_domain_scores
from .summary_score import compute_summary_score


NATIONAL_DOMAINS = {
    "OUTCOME_MORTALITY.csv": ("mortality", "Out_Mrt_Grp_Score_Nat"),
    "OUTCOME_SAFETY.csv": ("safety", "Out_Sft_Grp_Score_Nat"),
    "OUTCOME_READMISSION.csv": ("readmission", "Out_Readm_grp_Score_Nat"),
    "PTEXP.csv": ("patient_experience", "Pt_Exp_Grp_Score_Nat"),
    "PROCESS.csv": ("process", "Prc_of_Care_Grp_Score_Nat"),
}


def nation_avg(group_scores: pd.DataFrame) -> float:
    """Match Star_Macros.sas lines 282-296, including total_cnt >= 3."""
    return group_scores.loc[group_scores["total_cnt"].ge(3), "grp_score"].mean()


def nation_avg0(summary_scores: pd.DataFrame) -> float:
    """Match Star_Macros.sas lines 243-257, including report_indicator = 1."""
    return summary_scores.loc[summary_scores["report_indicator"].eq(1), "summary_score"].mean()


def compute_national_averages(analysis_data: pd.DataFrame) -> pd.DataFrame:
    """Compute the six national averages from Program 0's standardized output."""
    national = {}
    score_frames = []
    domain_counts = {}
    score_columns = dict(DOMAINS)
    for filename, (domain, national_column) in NATIONAL_DOMAINS.items():
        measures = [
            f"std_{measure}"
            for measure in MEASURE_GROUPS[domain]
            if f"std_{measure}" in analysis_data.columns
        ]
        scores = grp_score(analysis_data, measures)
        score_frames.append(
            scores[["PROVIDER_ID", "grp_score"]].rename(columns={"grp_score": score_columns[filename]})
        )
        domain_counts[domain] = scores.set_index("PROVIDER_ID")["total_cnt"]
        national[national_column] = nation_avg(scores)

    summary = compute_summary_score(merge_domain_scores(score_frames))
    # Match %report: at least three qualifying domains, including mortality or safety.
    qualifies = pd.DataFrame(domain_counts).ge(3)
    eligible = qualifies.sum(axis=1).ge(3) & qualifies[["mortality", "safety"]].any(axis=1)
    summary["report_indicator"] = summary["PROVIDER_ID"].map(eligible)
    return pd.DataFrame([{"Summary_Score_Nat": nation_avg0(summary), **national}])


if __name__ == "__main__":
    analysis_csv = OUT_DIR.with_name("program_0") / "STD_DATA_2025JUL_ANALYSIS.csv"
    analysis = pd.read_csv(analysis_csv, dtype={"PROVIDER_ID": str})
    print(compute_national_averages(analysis).to_csv(index=False), end="")
