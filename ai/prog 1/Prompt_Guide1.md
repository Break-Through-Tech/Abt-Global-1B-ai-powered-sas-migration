# Program 1 — Prompt Guide

## 1. Understand the Program

Use this before translating Program 1:

> I am translating a SAS program into Python. The goal is to reproduce the existing SAS logic exactly, not redesign the methodology.
>
> Here is Program 1:
>
> [PASTE SAS CODE]
>
> Explain the program step-by-step. Identify:
> - the inputs
> - the five measure groups
> - how the number of measures in each group is determined
> - how `%grp_score` is being used
> - the five output datasets
> - how Program 1 connects to Program 2
>
> Do not assume what `%grp_score` does without seeing its definition.

---

## 2. Translate Program 1

> Translate this SAS Program 1 into Python while preserving the existing logic exactly.
>
> [PASTE SAS CODE]
>
> Program 0 has already created the standardized analysis data and the five measure groups.
>
> The `%grp_score` macro is used to calculate each group's score. If the macro definition is not provided, identify that as missing information rather than guessing its calculation.
>
> Preserve the five groups, their measure lists, measure counts, inputs, and outputs.

---

## 3. Cross-Check the Translation

> Compare the original SAS Program 1 with this Python translation:
>
> SAS:
> [PASTE SAS]
>
> Python:
> [PASTE PYTHON]
>
> Check whether the Python version preserves:
> - all five measure groups
> - the correct measure lists
> - measure counts
> - the standardized analysis input
> - the `%grp_score` calculation
> - the five output datasets
>
> Identify any differences or assumptions. Do not rewrite the code yet.

---

## 4. Understand `%grp_score`

> Here is the SAS `%grp_score` macro:
>
> [PASTE MACRO]
>
> Explain exactly how the macro calculates a group score for each hospital.
>
> Identify:
> - inputs
> - calculations
> - handling of missing values
> - number of measures required
> - output variables
> - any conditions or exclusions
>
> Then explain how to reproduce the macro's logic in Python without changing its methodology.