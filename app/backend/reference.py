"""Display labels for the UI. None of this changes how scores are calculated."""

# (Program 1 table, MEASURE_GROUPS key, Program 2 score column, rescaled weight column, label)
GROUPS = [
    ("OUTCOME_MORTALITY", "mortality", "Std_Outcomes_Mortality_score", "weight_Outcomes_Mortality", "Mortality"),
    ("OUTCOME_SAFETY", "safety", "Std_Outcomes_Safety_score", "weight_Outcomes_Safety", "Safety of Care"),
    ("OUTCOME_READMISSION", "readmission", "Std_Outcomes_Readmission_score", "weight_Outcomes_Readmission", "Readmission"),
    ("PTEXP", "patient_experience", "Std_PatientExp_score", "weight_PatientExperience", "Patient Experience"),
    ("PROCESS", "process", "Std_Process_score", "weight_Process", "Timely & Effective Care"),
]

# Program 2 report.py count column for each group key
COUNT_COLUMNS = {
    "mortality": "Outcomes_Mortality_cnt",
    "safety": "Outcomes_safety_cnt",
    "readmission": "Outcomes_Readmission_cnt",
    "patient_experience": "Patient_Experience_cnt",
    "process": "Process_cnt",
}

NATIONAL_COLUMNS = {
    "mortality": "Out_Mrt_Grp_Score_Nat",
    "safety": "Out_Sft_Grp_Score_Nat",
    "readmission": "Out_Readm_grp_Score_Nat",
    "patient_experience": "Pt_Exp_Grp_Score_Nat",
    "process": "Prc_of_Care_Grp_Score_Nat",
}

MEASURE_LABELS = {
    "MORT_30_AMI": "Heart attack 30-day mortality",
    "MORT_30_CABG": "CABG surgery 30-day mortality",
    "MORT_30_COPD": "COPD 30-day mortality",
    "MORT_30_HF": "Heart failure 30-day mortality",
    "MORT_30_PN": "Pneumonia 30-day mortality",
    "MORT_30_STK": "Stroke 30-day mortality",
    "PSI_4_SURG_COMP": "Deaths after serious treatable surgical complications",
    "COMP_HIP_KNEE": "Hip and knee replacement complications",
    "HAI_1": "Central line-associated bloodstream infections",
    "HAI_2": "Catheter-associated urinary tract infections",
    "HAI_3": "Surgical site infections, colon surgery",
    "HAI_4": "Surgical site infections, abdominal hysterectomy",
    "HAI_5": "MRSA bloodstream infections",
    "HAI_6": "C. difficile infections",
    "PSI_90_SAFETY": "Patient safety and adverse events composite",
    "EDAC_30_AMI": "Excess days in acute care after heart attack",
    "EDAC_30_HF": "Excess days in acute care after heart failure",
    "EDAC_30_PN": "Excess days in acute care after pneumonia",
    "OP_32": "Unplanned visits after outpatient colonoscopy",
    "READM_30_CABG": "CABG surgery 30-day readmission",
    "READM_30_COPD": "COPD 30-day readmission",
    "READM_30_HIP_KNEE": "Hip and knee replacement 30-day readmission",
    "READM_30_HOSP_WIDE": "Hospital-wide 30-day readmission",
    "OP_35_ADM": "Admissions after outpatient chemotherapy",
    "OP_35_ED": "ED visits after outpatient chemotherapy",
    "OP_36": "Hospital visits after outpatient surgery",
    "H_COMP_1_STAR_RATING": "Communication with nurses",
    "H_COMP_2_STAR_RATING": "Communication with doctors",
    "H_COMP_3_STAR_RATING": "Responsiveness of hospital staff",
    "H_COMP_5_STAR_RATING": "Communication about medicines",
    "H_COMP_6_STAR_RATING": "Discharge information",
    "H_COMP_7_STAR_RATING": "Care transition",
    "H_GLOB_STAR_RATING": "Overall hospital rating and recommendation",
    "H_INDI_STAR_RATING": "Cleanliness and quietness",
    "HCP_COVID_19": "Healthcare personnel COVID-19 vaccination",
    "IMM_3": "Healthcare personnel influenza vaccination",
    "OP_10": "Abdomen CT use of contrast material",
    "OP_13": "Cardiac imaging before low-risk outpatient surgery",
    "OP_18B": "Median time from ED arrival to departure",
    "OP_22": "Left the ED before being seen",
    "OP_23": "Head CT results for stroke within 45 minutes",
    "OP_29": "Appropriate follow-up interval after colonoscopy",
    "OP_8": "MRI lumbar spine for low back pain",
    "PC_01": "Elective delivery before 39 weeks",
    "SAFE_USE_OF_OPIOIDS": "Safe use of opioids",
    "SEP_1": "Severe sepsis and septic shock care",
}

# First two digits of a CMS Certification Number (CCN) are the state code.
CCN_STATES = dict(zip(
    [f"{n:02d}" for n in range(1, 54)],
    "AL AK AZ AR CA CO CT DE DC FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE "
    "NV NH NJ NM NY NC ND OH OK OR PA PR RI SC SD TN TX UT VT VI VA WA WV WI WY".split(),
))
# Codes CMS added after the original 01-53 list
CCN_STATES.update({"65": "GU", "66": "MP", "67": "TX"})


def state_from_ccn(ccn: str) -> str:
    return CCN_STATES.get(str(ccn)[:2], "Other")
