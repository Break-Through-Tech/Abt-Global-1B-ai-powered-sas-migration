# Program 0 — AI Guide

## Purpose

Program 0 creates the standardized analysis dataset used by Programs 1 and 2.

The main tasks are:

1. Load the quarterly Hospital Compare data.
2. Identify measures with more than 100 hospitals.
3. Exclude measures with hospital volume ≤100.
4. Create the final measure lists and measure groups.
5. Remove hospitals that do not have any final included measures.
6. Calculate measure means and standard deviations.
7. Standardize the included measures.
8. Reverse the direction of measures where a lower original score represents better performance.
9. Create the final `Std_data_2025Jul_analysis` analysis dataset.

## What AI Needs to Preserve

When translating or modifying Program 0, AI should preserve the original:

- Measure inclusion/exclusion logic
- `>100` hospital-volume threshold
- Measure group definitions
- Hospital exclusion logic
- Standardization process
- Direction reversals
- Macro variables and their relationships
- Final output structure

**Do not let AI redesign the methodology.** The goal is to reproduce the SAS program's existing logic in Python, not improve or reinterpret it.

## Key Outputs

The main analysis output is:

`Std_data_2025Jul_analysis`

Other important intermediate outputs include:

- `less100_measure`
- `measure_volume`
- `include_measure`
- `outcomes_mortality`
- `outcomes_safety`
- `outcomes_readmission`
- `PtExp`
- `Process`
- `measure_average_stddev_2025Jul`

## Main Validation

For Program 0, compare the Python results against the original SAS outputs and the provided answer-key files.

Pay special attention to:

**included measures → included hospitals → standardized values → direction-reversed values → final analysis dataset**