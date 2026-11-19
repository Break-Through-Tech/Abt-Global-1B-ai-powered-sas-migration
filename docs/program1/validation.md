# Program 1 Validation

Python translation: `data/Project_1/src/program_1/`
SAS source: `1 - First stage_Simple Average of Measure Scores_2025Jul.sas` and `%grp_score` (`Star_Macros.sas`, lines 28-63)

## Results (Nov 17, 2026)

Every column of all five tables was compared with the SAS `.sas7bdat` datasets in
`data/Project_1/SAS Output/`. The `.sas7bdat` files are used instead of the CSVs
because the CSVs round `Mean` and `StdDev` to six decimals.

| Group table | Rows | Columns | Measures | grp_score max diff (SAS input) | grp_score max diff (Python Program 0 input) |
|---|---|---|---|---|---|
| OUTCOME_MORTALITY | 4,566 | 21 | 7 | 2.7e-15 | 3.3e-14 |
| OUTCOME_SAFETY | 4,566 | 23 | 8 | 1.1e-14 | 4.0e-14 |
| OUTCOME_READMISSION | 4,566 | 29 | 11 | 8.9e-15 | 1.8e-13 |
| PTEXP | 4,566 | 23 | 8 | 2.2e-15 | 2.7e-15 |
| PROCESS | 4,566 | 31 | 12 | 8.9e-15 | 2.8e-14 |

For every table:
* Row count, column names, and column order match the SAS log (`SAS_Log.log` lines 1024, 1090, 1158, 1227, 1295).
* `PROVIDER_ID` values and row order match.
* Missing values are in the same rows in every column.
* `C1`-`Cn` flags and `total_cnt` match exactly.
* All other columns match within 1e-10 on SAS input and 1e-6 on Python Program 0 input (actual differences are below 1e-12).

Reproduce with `uv run python -m program_1.validate` (from `data/Project_1/src`) or `uv run pytest tests/program_1`.

## Translation decisions

* **Averaging keeps SAS's arithmetic.** SAS computes `sum(of measures) * (1 / total_cnt)` (macro line 43), not a mean. The Python code does the same, so the results agree to floating-point precision rather than just "close".
* **Hospitals with no measures in a group keep their row.** SAS does not filter them out. `measure_wt`, `score_before_std`, and `grp_score` are missing for those rows (for example, 884 hospitals in mortality and 1,387 in patient experience), and they are left out of `Mean` and `StdDev`.
* **Standard deviation uses n - 1.** This matches `PROC STANDARD` and `PROC MEANS`, and is the pandas default.
* **One function for all five groups.** The SAS program repeats the same block five times; the Python code runs one loop over `GROUPS` in `first_stage.py`.
* **Measure lists are reused from Program 0.** `first_stage.py` uses `program_0/measures.py` and keeps only measures with a `std_` column in the input, which matches the SAS `where = (col1>100)` filter that builds `&measure_XX`.
* **No rounding.** SAS does not round in Program 1. The six-decimal `Mean` and `StdDev` in the SAS CSVs are display formatting only.

## Open questions

* If every hospital in a group had the same average (standard deviation 0), SAS `PROC STANDARD` behavior was not tested, and the Python code would divide by zero. This does not happen in the 2025 July data.
* Program 2's `loader.py` still reads the five group tables from `SAS Output CSV/`. The Python outputs in `Python Output CSV/program_1/` have the same file names and columns, so Program 2 can switch to them for the end-to-end run (Issue #37).
