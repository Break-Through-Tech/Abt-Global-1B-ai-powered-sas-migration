# SAS SOURCE: Lines 71–151

import pandas as pd

def report(indsn, measure_OM, measure_OS, measure_OR,
           measure_PtExp, measure_Process):

    # SAS Lines 73–77: Creating a copy of the input hospital dataset.
    df = indsn.copy()

    # SAS Lines 79–88: Creating arrays for Mortality measures and indicators of whether each measure is available.
    df["Outcomes_Mortality_cnt"] = (
        df[measure_OM].notna().sum(axis=1)
    )

    # SAS Lines 90–99: Creating arrays for Safety measures and indicators of whether each measure is available.
    df["Outcomes_safety_cnt"] = (
        df[measure_OS].notna().sum(axis=1)
    )

    # SAS Lines 101–110: Creating arrays for Readmission measures and indicators of whether each measure is available.
    df["Outcomes_Readmission_cnt"] = (
        df[measure_OR].notna().sum(axis=1)
    )
             
    # SAS Lines 112–121: Creating arrays for Patient Experience measures and indicators of whether each measure is available.
    df["Patient_Experience_cnt"] = (
        df[measure_PtExp].notna().sum(axis=1)
    )

    # SAS Lines 124–133: Creating arrays for Process measures and indicators of whether each measure is available.
    df["Process_cnt"] = (
        df[measure_Process].notna().sum(axis=1)
    )

    # SAS Lines 135–144: Counting qualifying measure groups by summing across columns. 
    group_count_cols = [
        "Patient_Experience_cnt",
        "Outcomes_Mortality_cnt",
        "Outcomes_Readmission_cnt",
        "Outcomes_safety_cnt",
        "Process_cnt"
    ]
             
    df["Total_measure_group_cnt"] = (
        (df[group_count_cols] >= 3).sum(axis=1)
    )

    # SAS Line 146: Counting how many of the Morality and Safety groups have at least 3 available measures.
    df["MortSafe_Group_cnt"] = (
        (df["Outcomes_Mortality_cnt"] >= 3).astype(int)
        + (df["Outcomes_safety_cnt"] >= 3).astype(int)
    )
             
    # SAS Line 148: Determining final reporting eligibility.
    df["report_indicator"] = (
        (df["MortSafe_Group_cnt"] >= 1)
        & (df["Total_measure_group_cnt"] >= 3)
    ).astype(int)

    # SAS Lines 73–75 and 150–151: Returning output dataset.
    output_cols = [
        "provider_id",
        "report_indicator",
        "Patient_Experience_cnt",
        "Outcomes_Readmission_cnt",
        "Outcomes_Mortality_cnt",
        "Outcomes_safety_cnt",
        "Process_cnt",
        "Total_measure_group_cnt",
        "MortSafe_Group_cnt"
    ]

    return df[output_cols].copy()
