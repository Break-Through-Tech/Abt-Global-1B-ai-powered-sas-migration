"""Program 0: translation of
'0 - Data and Measure Standardization_2025Jul.sas' (+ %keep_hos from Star_Macros.sas).

Reads Starrating/alldata_2025jul.csv and builds Std_data_2025Jul_analysis.
Reference answer key: "SAS Output CSV" (read-only). Our output goes to
"Python Output CSV/program_0".
"""
from pathlib import Path

import numpy as np
import pandas as pd

PROJECT_DIR = Path(__file__).resolve().parents[2]
INPUT_CSV = PROJECT_DIR / "Starrating" / "alldata_2025jul.csv"
OUT_DIR = PROJECT_DIR / "Python Output CSV" / "program_0"

THRESHOLD = 100  # measures with <=100 hospitals are excluded

# %LET measure_all (HAI_1-HAI_6 expanded). Order matters: SAS builds the
# included-measure list in this order.
MEASURE_ALL = [
    "MORT_30_AMI", "MORT_30_CABG", "MORT_30_COPD", "MORT_30_HF", "MORT_30_PN",
    "MORT_30_STK", "PSI_4_SURG_COMP", "COMP_HIP_KNEE",
    "HAI_1", "HAI_2", "HAI_3", "HAI_4", "HAI_5", "HAI_6", "PSI_90_SAFETY",
    "EDAC_30_AMI", "EDAC_30_HF", "EDAC_30_PN", "OP_32", "READM_30_CABG",
    "READM_30_COPD", "READM_30_HIP_KNEE", "READM_30_HOSP_WIDE",
    "OP_35_ADM", "OP_35_ED", "OP_36",
    "H_COMP_1_STAR_RATING", "H_COMP_2_STAR_RATING", "H_COMP_3_STAR_RATING",
    "H_COMP_5_STAR_RATING", "H_COMP_6_STAR_RATING", "H_COMP_7_STAR_RATING",
    "H_GLOB_STAR_RATING", "H_INDI_STAR_RATING",
    "HCP_COVID_19", "IMM_3", "OP_10", "OP_13", "OP_18B", "OP_22", "OP_23",
    "OP_29", "OP_8", "PC_01", "SAFE_USE_OF_OPIOIDS", "SEP_1",
]

# Measure groups (the `if measure_in_name in (...)` lists)
OUTCOMES_MORTALITY = ["MORT_30_AMI", "MORT_30_CABG", "MORT_30_COPD", "MORT_30_HF",
                      "MORT_30_PN", "MORT_30_STK", "PSI_4_SURG_COMP"]
OUTCOMES_SAFETY = ["COMP_HIP_KNEE", "HAI_1", "HAI_2", "HAI_3", "HAI_4", "HAI_5",
                   "HAI_6", "PSI_90_SAFETY"]
OUTCOMES_READMISSION = ["EDAC_30_AMI", "EDAC_30_HF", "EDAC_30_PN", "OP_32",
                        "READM_30_CABG", "READM_30_COPD", "READM_30_HIP_KNEE",
                        "READM_30_HOSP_WIDE", "OP_35_ADM", "OP_35_ED", "OP_36"]
PTEXP = ["H_COMP_1_STAR_RATING", "H_COMP_2_STAR_RATING", "H_COMP_3_STAR_RATING",
         "H_COMP_5_STAR_RATING", "H_COMP_6_STAR_RATING", "H_COMP_7_STAR_RATING",
         "H_GLOB_STAR_RATING", "H_INDI_STAR_RATING"]
PROCESS = ["HCP_COVID_19", "IMM_3", "OP_10", "OP_13", "OP_18B", "OP_22", "OP_23",
           "OP_29", "OP_8", "PC_01", "SAFE_USE_OF_OPIOIDS", "SEP_1"]

# Measures flipped in the "RE-DIRECT MEASURES" step (lower raw score = better)
FLIP = (OUTCOMES_MORTALITY + OUTCOMES_SAFETY + OUTCOMES_READMISSION
        + ["OP_22", "PC_01", "OP_18B", "OP_8", "OP_10", "OP_13",
           "SAFE_USE_OF_OPIOIDS"])


def measure_volume(df: pd.DataFrame, measures=MEASURE_ALL) -> pd.Series:
    """PROC TABULATE n: number of non-missing hospitals per measure."""
    return df[measures].notna().sum()


def keep_hos(df: pd.DataFrame, varlist: list[str]) -> pd.DataFrame:
    """%keep_hos: keep hospitals with at least one non-missing included measure.

    As in SAS, the Total_m_cnt column is left on the data (c1-ck and k are dropped).
    """
    df = df.copy()
    df["Total_m_cnt"] = df[varlist].notna().sum(axis=1)
    return df[df["Total_m_cnt"] >= 1]


def run_program_0(alldata: pd.DataFrame) -> dict[str, pd.DataFrame]:
    volume = measure_volume(alldata)

    # less100_measure / include_measure
    less100 = volume[volume <= THRESHOLD]
    include = volume[volume > THRESHOLD]
    measure_in = list(include.index)
    measure_in_std = [f"std_{m}" for m in measure_in]

    # initial_data: drop excluded measures (only if any)
    initial = alldata.drop(columns=list(less100.index))

    # Group lists restricted to included measures (where col1>100)
    groups = {
        name: [m for m in members if m in measure_in]
        for name, members in {
            "outcomes_mortality": OUTCOMES_MORTALITY,
            "outcomes_safety": OUTCOMES_SAFETY,
            "outcomes_readmission": OUTCOMES_READMISSION,
            "ptexp": PTEXP,
            "process": PROCESS,
        }.items()
    }

    # remove hospitals with no included measures
    initial = keep_hos(initial, measure_in)

    # PROC MEANS: N, MIN, MAX, MEAN, STD (std uses n-1)
    desc = initial[measure_in].agg(["count", "min", "max", "mean", "std"])

    # PROC STANDARD mean=0 std=1 (ddof=1; missing stays missing)
    std = initial.copy()
    std[measure_in] = (initial[measure_in] - initial[measure_in].mean()) / initial[measure_in].std(ddof=1)

    # RE-DIRECT: negate measures where lower is better
    flip = [m for m in FLIP if m in measure_in]
    std[flip] = -std[flip]

    # Final: standardized values go to std_<measure>; originals are dropped.
    analysis = std.rename(columns=dict(zip(measure_in, measure_in_std)))
    analysis = analysis[[c for c in initial.columns if c not in measure_in]
                        + measure_in_std]

    return {"less100_measure": less100, "include_measure": include,
            "groups": groups, "measure_average_stddev": desc,
            "analysis": analysis}


def main() -> None:
    alldata = pd.read_csv(INPUT_CSV, dtype={"PROVIDER_ID": str})
    res = run_program_0(alldata)
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    res["analysis"].to_csv(OUT_DIR / "STD_DATA_2025JUL_ANALYSIS.csv", index=False)
    res["measure_average_stddev"].to_csv(OUT_DIR / "MEASURE_AVERAGE_STDDEV_2025JUL.csv")
    print(f"analysis: {res['analysis'].shape}; measures included: {len(res['include_measure'])}; "
          f"excluded: {len(res['less100_measure'])}")


if __name__ == "__main__":
    main()
