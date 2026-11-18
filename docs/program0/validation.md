# Program 0 Validation Results

Written up to close out #34 ("Finalize and test entire SAS Program 0 with
validation"), after re-running every check against the SAS answer-key
files already in the repo. Dated 2026-11-08.

## 1. Automated test suite — `tests/program_0/test_program_0.py`

Three SAS answer-key files from `data/Project_1/SAS Output CSV/` are
loaded as fixtures and compared against the Python pipeline's output
(`program_0.standardize.run_program_0`):

| Test | What it checks |
|---|---|
| `test_no_measures_excluded_this_quarter` | The set of measures the Python volume filter excludes (hospital count ≤100) exactly matches the set in SAS's `LESS100_MEASURE.csv`. |
| `test_measure_mean_matches_sas` | Per-measure mean (SAS `PROC MEANS`) matches the Python-computed mean, diff `< 1e-6`, for every included measure. |
| `test_measure_std_matches_sas` | Same, for standard deviation. |
| `test_row_count_matches_sas` | Final analysis dataset row count matches SAS's `STD_DATA_2025JUL_ANALYSIS.csv` exactly — confirms `keep_hos` drops the same hospitals. |
| `test_standardized_measure_matches_sas` (parametrized over all 46 measures) | Per measure: merges Python/SAS output on `PROVIDER_ID`, checks the missing-value pattern matches exactly, then checks every non-missing standardized value differs by `< 1e-6`. |

Total: 4 fixed tests + 46 per-measure tests = **50 tests**.

Run and confirmed on 2026-11-08:

```
$ python -m pytest tests/program_0 -v
...
============================== 50 passed in 0.26s ==============================
```

## 2. Standalone validator — `src/program_0/validate.py`

A second, independent implementation of the same four checkpoints
(excluded measures → mean/std → row count → standardized values),
meant to be run manually rather than via pytest:

```
$ python -c "from program_0.validate import validate_program_0; validate_program_0()"
PASS excluded measures (0 excluded)
PASS MEAN: max diff 3.70e-09
PASS STD: max diff 3.81e-10
PASS row count: 4566
PASS all 46 standardized measures (tolerance 1e-06)
```

## 3. Full repo test suite

Ran `pytest tests/` (not just `tests/program_0`) to confirm Program 0's
code doesn't break anything in Program 2's tests:

```
$ python -m pytest tests/ -q
60 passed in 0.38s
```

## 4. Manual diff of the committed output files

Compared `data/Project_1/Python Output CSV/program_0/STD_DATA_2025JUL_ANALYSIS.csv`
against `data/Project_1/SAS Output CSV/STD_DATA_2025JUL_ANALYSIS.csv`
directly (the files actually committed to the repo, not just a fresh
in-memory run): both are 4,567 lines (4,566 hospital rows + header)
with identical column headers in the same order.

## Conclusion

All four layers agree: no measure-inclusion mismatches, no row-count
mismatches, and numeric differences on the order of 1e-9 (floating-point
noise, not a translation bug) across all 46 included measures.

Program 0 translation (#18, merged via #27) is validated end to end.
The superseded single-file PR (#26) and the finalization issue (#34)
have both been closed.
