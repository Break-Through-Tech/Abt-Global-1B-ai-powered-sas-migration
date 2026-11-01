# Program 1 — AI Guide

## Purpose

Program 1 calculates a **group/domain score for each hospital** across the five measure groups.

The five groups are:

1. Mortality
2. Safety of Care
3. Readmission
4. Patient Experience
5. Timely and Effective Care

These five group scores are used by **Program 2** to calculate the hospital star ratings.

## What Program 1 Does

Program 1:

1. Gets the number of measures in each group.
2. Uses the measure lists created in Program 0.
3. Passes the standardized analysis dataset from Program 0 into the `%grp_score` macro.
4. Calculates a group score for each hospital.
5. Creates one output dataset for each group.

## Inputs

The main input is:

`&MEASURE_ANALYSIS`

This is the standardized analysis dataset created by Program 0.

Program 1 also uses the measure groups created in Program 0:

- `Outcomes_mortality`
- `Outcomes_safety`
- `Outcomes_readmission`
- `PtExp`
- `Process`

## Outputs

Program 1 creates:

- `R.Outcome_mortality`
- `R.Outcome_safety`
- `R.Outcome_readmission`
- `R.PtExp`
- `R.Process`

These group scores are passed to Program 2.

## Key Dependency

The `%grp_score` macro is defined outside of Program 1 and is called five times.

When translating Program 1, the macro's actual logic must be understood before assuming what the group score calculation does.