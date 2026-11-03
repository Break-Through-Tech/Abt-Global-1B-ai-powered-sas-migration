import numpy as np
import pandas as pd

# Define metadata for the 5 hospital quality domains in the exact order 
# matching the original SAS arrays. 
# Format: (Score Column, Standard Weight Col, Rescaled Weight Col, Base Weight Value)
GROUPS = [
    ("Std_PatientExp_score",           "std_weight_PatientExperience", "weight_PatientExperience",    0.22),
    ("Std_Outcomes_Readmission_score", "std_weight_Readmission",       "weight_Outcomes_Readmission", 0.22),
    ("Std_Outcomes_Mortality_score",   "std_weight_Mortality",       "weight_Outcomes_Mortality",   0.22),
    ("Std_Outcomes_Safety_score",      "std_weight_safety",          "weight_Outcomes_Safety",      0.22),
    ("Std_Process_score",              "std_weight_Process",         "weight_Process",              0.12),
]


def compute_summary_score(all_df: pd.DataFrame) -> pd.DataFrame:
    """
    Python equivalent of the SAS DATA step:
    data summary_score (drop=...); set all; ... run;
    
    Calculates CMS weighted summary scores with dynamic weight redistribution 
    when hospital domain scores are missing (NaN).
    """
    df = all_df.copy()

    # -------------------------------------------------------------
    # STEP 1: Assign fixed standard CMS weights to every row
    # (Mirrors the static weight assignments in the SAS DATA step)
    # -------------------------------------------------------------
    for _, std_col, _, weight in GROUPS:
        df[std_col] = weight

    # -------------------------------------------------------------
    # STEPS 2 & 3: Calculate the weight redistribution denominator
    # Denom = 1.0 - sum(Indicator * Weight) for all missing domains
    # -------------------------------------------------------------
    denom = pd.Series(1.0, index=df.index)
    
    for score_col, std_col, _, _ in GROUPS:
        # Check if the domain score is missing (SAS equivalent of: if grp_score = .)
        is_missing = df[score_col].isna().astype(float) # 1.0 if missing, 0.0 if present
        
        # Subtract the missing weight from the baseline 1.0 total
        denom = denom - (is_missing * df[std_col])

    # -------------------------------------------------------------
    # STEPS 4 - 6: Rescale weights, handle missing values, and sum score
    # -------------------------------------------------------------
    summary = pd.Series(0.0, index=df.index)
    
    for score_col, std_col, w_col, _ in GROUPS:
        # Redistribute weight: scale original weight up by dividing by the active denominator.
        # If score is missing, assign NaN to match SAS output behavior.
        df[w_col] = np.where(df[score_col].isna(), np.nan, df[std_col] / denom)
        
        # Multiply active weight by score. Treat missing products as 0.0 and accumulate.
        summary = summary + (df[w_col] * df[score_col]).fillna(0.0)

    # Attach the final accumulated summary score column to the DataFrame
    df["summary_score"] = summary
    return df


if __name__ == "__main__":
    # Imported locally so testing modules can import compute_summary_score 
    # independently without invoking file-loading side effects.
    from loader import OUT_DIR, load_and_merge_domain_data

    # Load merged data, calculate scores, and display dataset dimensions
    summary_df = compute_summary_score(load_and_merge_domain_data())
    print(f"Processed {summary_df.shape[0]} rows and {summary_df.shape[1]} columns.")

    # Define explicitly what columns to keep in the final exported CSV 
    # (drops the redundant static/intermediate weight columns from the file)
    cols_to_keep = [
        "PROVIDER_ID",
        "Std_PatientExp_score",
        "Std_Outcomes_Readmission_score",
        "Std_Outcomes_Mortality_score",
        "Std_Outcomes_Safety_score",
        "Std_Process_score",
        "summary_score"
    ]
    
    # Filter the dataframe to only keep the specified columns (if they exist)
    export_df = summary_df[[col for col in cols_to_keep if col in summary_df.columns]]

    # Ensure output directory exists and save the clean dataset to CSV
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    out_file = OUT_DIR / "summary_score.csv"
    export_df.to_csv(out_file, index=False)
    print(f"Successfully saved clean output to {out_file} ({export_df.shape[1]} columns)")