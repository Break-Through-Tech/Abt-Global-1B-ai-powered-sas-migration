# Program 1: First Stage (Simple Average of Measure Scores)

Python translation of `1 - First stage_Simple Average of Measure Scores_2025Jul.sas`
and the `%grp_score` macro it calls (`Star_Macros.sas`, lines 28-63).

For each of the five measure groups, Program 1 averages each hospital's
standardized measure scores (skipping missing measures), then standardizes
those averages across hospitals to get the group score Program 2 uses.

## Files

| File | What it does | SAS source |
|---|---|---|
| `group_score.py` | `grp_score()`: one group's scores | `Star_Macros.sas` lines 28-63 |
| `first_stage.py` | Group list, input loading, runs `grp_score()` for all five groups, writes CSVs | Program 1 lines 27-121 |
| `validate.py` | Compares all five tables with the SAS `.sas7bdat` answer key | |
| `__main__.py` | Runs Program 1 on the Python Program 0 output | |

Measure lists come from `program_0/measures.py` (`MEASURE_GROUPS`), so there is
one hand-maintained copy for the whole pipeline. When a quarter's measures
change, update that file as described in `program_0/README.md`.

## Inputs and outputs

* **Input:** `&MEASURE_ANALYSIS`, the standardized analysis dataset from Program 0.
  * Default: `data/Project_1/Python Output CSV/program_0/STD_DATA_2025JUL_ANALYSIS.csv`
  * For validation only: `data/Project_1/SAS Output/std_data_2025jul_analysis.sas7bdat`
* **Output:** `data/Project_1/Python Output CSV/program_1/`, one CSV per group with the
  same name and columns as the SAS output: `OUTCOME_MORTALITY.csv`, `OUTCOME_SAFETY.csv`,
  `OUTCOME_READMISSION.csv`, `PTEXP.csv`, `PROCESS.csv`.

## How to run

From the repo root, after `uv sync`:

```bash
cd data/Project_1/src
uv run python -m program_1             # writes the five CSVs
uv run python -m program_1.validate    # compares them with the SAS answer key
cd ../../..
uv run pytest tests/program_1
```

Run Program 0 first (`uv run python -m program_0` from the same folder) if its output has changed.

See `docs/program1/validation.md` for the validation results and translation decisions.
