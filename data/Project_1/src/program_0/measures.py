# measures.py
"""Measure definitions transcribed from
`0 - Data and Measure Standardization_2025Jul.sas`.

These lists are hand-maintained in the SAS program and must be updated by
hand for each quarter if CMS adds, removes, or re-classifies a measure.
Do not derive them — copy them straight from the SAS source so they stay
auditable against it. See lines 37-41 (MEASURE_GROUPS), lines 170-282
(group membership), and lines 319-357 (NEGATIVE_DIRECTION_MEASURES).
"""

# All measures on Hospital Compare in 2025Jul, after excluding retired,
# non-directional, structural, and voluntary measures. (SAS lines 37-41)
MEASURE_GROUPS: dict[str, list[str]] = {
    "mortality": [
        "MORT_30_AMI", "MORT_30_CABG", "MORT_30_COPD", "MORT_30_HF",
        "MORT_30_PN", "MORT_30_STK", "PSI_4_SURG_COMP",
    ],
    "safety": [
        "COMP_HIP_KNEE", "HAI_1", "HAI_2", "HAI_3", "HAI_4", "HAI_5", "HAI_6",
        "PSI_90_SAFETY",
    ],
    "readmission": [
        "EDAC_30_AMI", "EDAC_30_HF", "EDAC_30_PN", "OP_32", "READM_30_CABG",
        "READM_30_COPD", "READM_30_HIP_KNEE", "READM_30_HOSP_WIDE",
        "OP_35_ADM", "OP_35_ED", "OP_36",
    ],
    "patient_experience": [
        "H_COMP_1_STAR_RATING", "H_COMP_2_STAR_RATING", "H_COMP_3_STAR_RATING",
        "H_COMP_5_STAR_RATING", "H_COMP_6_STAR_RATING", "H_COMP_7_STAR_RATING",
        "H_GLOB_STAR_RATING", "H_INDI_STAR_RATING",
    ],
    # NOTE: the SAS comment above this list still says "ALL 13 Process
    # measures" (line 269) but only lists 12 — that comment is stale,
    # left over from before OP_2 and OP_3B were removed for 2025 (SAS
    # line 42). The actual list below (12 measures) is what SAS executes.
    "process": [
        "HCP_COVID_19", "IMM_3", "OP_10", "OP_13", "OP_18B", "OP_22",
        "OP_23", "OP_29", "OP_8", "PC_01", "SAFE_USE_OF_OPIOIDS", "SEP_1",
    ],
}

# Flattened, in the same order SAS declares/outputs them (mortality ->
# safety -> readmission -> patient_experience -> process). This order
# matches the column order in STD_DATA_2025JUL_ANALYSIS.csv exactly.
ALL_MEASURES: list[str] = [
    measure
    for group_measures in MEASURE_GROUPS.values()
    for measure in group_measures
]

# Measures where a LOWER raw value is the better outcome. After
# standardizing, these get sign-flipped so "higher standardized score"
# always means "better hospital", consistently across every measure.
# (SAS lines 319-357 — one assignment per measure, transcribed in the
# same order.)
NEGATIVE_DIRECTION_MEASURES: list[str] = [
    "MORT_30_AMI", "MORT_30_CABG", "MORT_30_COPD", "MORT_30_HF",
    "MORT_30_PN", "MORT_30_STK", "PSI_4_SURG_COMP",
    "COMP_HIP_KNEE", "HAI_1", "HAI_2", "HAI_3", "HAI_4", "HAI_5", "HAI_6",
    "PSI_90_SAFETY",
    "EDAC_30_AMI", "EDAC_30_HF", "EDAC_30_PN", "OP_32", "READM_30_CABG",
    "READM_30_COPD", "READM_30_HIP_KNEE", "READM_30_HOSP_WIDE",
    "OP_35_ADM", "OP_35_ED", "OP_36",
    "OP_22", "PC_01",
    "OP_18B",
    "OP_8", "OP_10", "OP_13", "SAFE_USE_OF_OPIOIDS",
]

# Volume threshold from SAS: a measure is EXCLUDED when its hospital
# count is <= this value, INCLUDED when strictly greater. Do not change
# to >= — SAS line 102 uses `col1<=100` for exclusion.
MIN_MEASURE_VOLUME = 100
