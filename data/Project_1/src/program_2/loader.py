from pathlib import Path
import pandas as pd

# Folder with the SAS reference CSVs (read-only, we never write here):
# loader.py -> program_2 -> src -> Project_1 -> "SAS Output CSV"
CSV_DIR = Path(__file__).resolve().parents[2] / "SAS Output CSV"

# Our own output folder, with a dedicated subfolder for this program:
# Project_1/Python Output CSV/program_2/
OUT_DIR = Path(__file__).resolve().parents[2] / "Python Output CSV" / "program_2"

# (csv file, new name for its grp_score column)
# Same as the SAS: R.Outcome_mortality(keep=... rename=grp_score=Std_..._score)
DOMAINS = [
    ("OUTCOME_MORTALITY.csv", "Std_Outcomes_Mortality_score"),
    ("OUTCOME_READMISSION.csv", "Std_Outcomes_Readmission_score"),
    ("OUTCOME_SAFETY.csv", "Std_Outcomes_Safety_score"),
    ("PTEXP.csv", "Std_PatientExp_score"),
    ("PROCESS.csv", "Std_Process_score"),
]


def read_scores(filename: str, new_name: str) -> pd.DataFrame:
    """Read one CSV and keep only 2 columns: PROVIDER_ID and its score."""
    # dtype=str keeps IDs like '010001' as text (no lost leading zeros)
    df = pd.read_csv(CSV_DIR / filename, dtype={"PROVIDER_ID": str})
    # keep= in SAS -> pick 2 columns; rename= in SAS -> rename grp_score
    return df[["PROVIDER_ID", "grp_score"]].rename(columns={"grp_score": new_name})


def load_and_merge_domain_data() -> pd.DataFrame:
    """Build one table: one row per PROVIDER_ID, one column per domain score.

    SAS equivalent:  data all; merge <5 tables>; by PROVIDER_ID; run;
    A SAS merge with BY and no IN= flags is a full outer join: a provider is
    kept if it is in ANY table. Missing scores become NaN (SAS '.').
    """
    df = None
    for filename, new_name in DOMAINS:
        scores = read_scores(filename, new_name)
        if df is None:
            # First table gives the starting rows (PROVIDER_ID) + 1 score column
            df = scores
        else:
            # Each merge matches rows on PROVIDER_ID and ADDS one score column.
            # how="outer" keeps providers that are missing from either side.
            df = df.merge(scores, on="PROVIDER_ID", how="outer")

    # SAS output is ordered by PROVIDER_ID (BY statement), so sort the same way
    return df.sort_values("PROVIDER_ID").reset_index(drop=True)

if __name__ == "__main__":
    # Only runs with:  uv run python data/Project_1/src/program_2/loader.py
    # (not on import, not during tests)
    all_df = load_and_merge_domain_data()
    print(f"{all_df.shape[0]} rows, {all_df.shape[1]} columns")

    # parents=True creates "Python Output CSV" too if it doesn't exist yet
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    out_file = OUT_DIR / "merged_scores_from_loader.csv"
    all_df.to_csv(out_file, index=False)
    print(f"Saved to {out_file}")