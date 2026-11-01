# Program 0 — Prompt Guide

## 1. SAS → Python Translation

Use this when beginning the translation:

> I am translating a SAS 9.4 program into Python. The goal is to reproduce the existing SAS logic exactly, not redesign or improve the methodology.
>
> Here is the Program 0 SAS code:
>
> [PASTE SAS CODE]
>
> First, explain the program's logic step-by-step. Identify the inputs, intermediate datasets, macro variables, filtering rules, transformations, and final outputs. Then create a Python translation that follows the same logic.
>
> Do not simplify, change thresholds, remove steps, or introduce new methodology unless you explicitly identify the difference and explain why.

---

## 2. Cross-Check a Python Translation

Use a different AI model when possible:

> Compare the original SAS code and the Python translation below.
>
> Original SAS:
> [PASTE SAS]
>
> Python:
> [PASTE PYTHON]
>
> Check the two programs for logical equivalence. Focus specifically on:
>
> - measure inclusion/exclusion
> - the `>100` hospital threshold
> - hospital filtering
> - measure group definitions
> - missing values
> - means and standard deviations
> - standardization
> - direction reversals
> - final output structure
>
> Do not rewrite the code yet. First identify any differences or potential discrepancies and explain how they could affect the results.

---

## 3. Investigate a Difference

Use this when SAS and Python outputs do not match:

> The SAS and Python versions of Program 0 are producing different results.
>
> SAS result:
> [PASTE RESULT]
>
> Python result:
> [PASTE RESULT]
>
> Relevant SAS logic:
> [PASTE RELEVANT SECTION]
>
> Relevant Python logic:
> [PASTE RELEVANT SECTION]
>
> Identify the most likely cause of the difference. Trace the logic step-by-step and explain which implementation is inconsistent with the original SAS program. Do not assume the Python version is correct.

---

## 4. Explain a SAS Step

Use this when the team does not understand a section before translating it:

> Explain the following SAS section in simple terms. I need to understand what it does before translating it to Python.
>
> [PASTE SAS SECTION]
>
> Explain:
> 1. What the code is doing
> 2. What data it creates or changes
> 3. What conditions or thresholds it applies
> 4. What the equivalent Python operation would be
>
> Do not change or optimize the original logic.