# Program 1: AI Prompting and Validation Guide

First Stage: Simple Average of Measure Scores, part of the CMS Overall Hospital Quality Star Rating SAS-to-Python migration.

**How to use this guide:** Section 1 comes from the project overview. Section 2 lists what must be read directly from the SAS code before anyone prompts an AI about it. Sections 3 to 10 are the working toolkit. Anything marked **(verify)** is a hypothesis to confirm against the SAS code or log, not a fact.

---

## 1. What we know about Program 1

- Program 1 is `1 - First Stage_Simple Average of Measure Scores_2025Jul.sas`.
- Per the project overview, it turns measure scores into group scores using a **simple average**.
- Its input comes from Program 0 (the standardized measure data). **(verify: likely `std_data_2025jul_analysis`)**
- Its outputs feed Program 2, which needs the domain/group scores. The reference output files that look like Program 1's are the per-group datasets: `outcome_mortality`, `outcome_readmission`, `outcome_safety`, `process`, and `ptexp`. **(verify which datasets Program 1 writes, using the log)**
- Other reference files that may come from this stage or Program 0: `less100_measure`, `measure_average_stddev_2025jul`, `national_average_2025jul`. **(verify)**
- Ground truth available: SAS output datasets in `.sas7bdat` and CSV, `SAS_Log.log`, and the HTML procedure printouts.

Because Program 1 sits between Program 0 and Program 2, an error here shifts every group score and therefore every summary score and star rating.

---

## 2. Read these in the SAS code before prompting

Do not let the AI guess any of these. Answer each from the code and the log, and paste the answers into your prompts.

### Averaging logic

- [ ] How exactly is each group score computed: mean of the non-missing measure scores in the group, or something else?
- [ ] Which SAS function does the averaging (`MEAN()`, `SUM()/N()`, `SUM()/count`, a PROC)? These treat missing values differently.
- [ ] Which measures belong to which group? Where is that mapping defined (arrays, macro variables, a lookup table)?
- [ ] Is there a minimum number of measures required per group, and where is it applied?
- [ ] Are measure counts per group created here (and what are the variable names)?

### Rounding, standardization, and exclusions

- [ ] Is anything rounded, and at which step? SAS rounds half away from zero.
- [ ] Is anything standardized here (z-scores)? If so, is the standard deviation n or n-1?
- [ ] Are any hospitals or measures excluded (for example the measures in `less100_measure`)? What is the exact condition?
- [ ] Is any measure's sign flipped or rescaled before averaging?

### Structure

- [ ] Is the same logic repeated for each group (through a macro, a loop, or copy-pasted blocks)? If it is repeated, translate it once as a parameterized function.
- [ ] Which macros from `Star_Macros.sas` does this program call? Paste their full definitions into the prompts that use them.
- [ ] For each output dataset: name, row count, columns, and sort order, from the log.

---

## 3. Rules for prompting on this program

1. **Spec before code.** The AI first writes a plain-language spec of the block. The translation lead corrects it against the SAS, and only then does translation happen.
2. **Paste real code, never a description.** Include the full definition of any macro the block calls.
3. **Constants come from the code.** Group-to-measure mappings and thresholds are pasted in and must be copied verbatim.
4. **One block per chat.** Start fresh each time with the context header (Section 5.0).
5. **Test each stage on SAS's own intermediate data.** Feed Program 1's code the SAS Program 0 output, not your Python Program 0 output.
6. **Every claim cites a line.** "Matches the SAS" is meaningless without SAS and Python line numbers.
7. **Every output has a QUESTIONS section.**
8. **The AI never edits expected outputs, tests, or tolerances** to make something pass.
9. **Write one function for repeated logic.** If the five groups use the same steps, write one parameterized function and validate it against all five SAS outputs.

---

## 4. Stage map and validation order

Compare intermediate results at each stage. Matching only the final group scores does not prove the middle steps are right.

| # | Stage (order may differ in the code) | Check against | Tolerance (team to confirm) | Main trap |
|---|---|---|---|---|
| 1 | Load Program 0 output | Row count, column list, dtypes, ID set from the log | Exact | ID dtype, leading zeros, date and missing conversion |
| 2 | Measure-to-group assignment | Which measures land in each group | Exact | Wrong or missing measure in a group |
| 3 | Measure exclusions (for example fewer than 100 hospitals) | Excluded measures list vs `less100_measure` | Exact | Threshold operator, counting rule |
| 4 | Simple average per group | Each group score per hospital | About 1e-9 | Missing treated as zero, wrong denominator |
| 5 | Measure counts and reporting indicators | Counts per hospital per group | Exact | Counting missing values |
| 6 | Each output dataset | `outcome_*`, `process`, `ptexp` reference files | Per column | Column order, names, rounding at write |

---

## 5. Prompt toolkit

### 5.0 Context header (paste at the top of every prompt)

```
PROJECT: Translating the CMS Overall Hospital Quality Star Rating SAS pipeline to Python.
THIS TASK: Program 1 (First Stage: Simple Average of Measure Scores), block: [BLOCK NAME].
ENVIRONMENT: Python [version], pandas [version], numpy [version], scipy [version]. No other libraries.

GROUND TRUTH: SAS output datasets are the source of truth.
Never modify expected outputs, tests, or tolerances to make something pass.

SAS BEHAVIORS TO HANDLE: missing values (MEAN() and SUM() ignore missing, a + b does not),
rounding (SAS rounds half away from zero), standard deviation denominator,
merge semantics, row order, character IDs with leading zeros.

RULES:
1. Copy every constant, measure list, and threshold verbatim from the SAS code.
2. Work on this single block only.
3. Cite SAS line numbers for every claim about behavior.
4. If anything is ambiguous, do not guess. List it under QUESTIONS.
5. Do not optimize, restructure, or add features.
```

### 5.1 Spec prompt (before any code)

```
[Context header]

Do NOT write Python yet. Write a specification of this SAS block.

1. INPUTS: each dataset, key variables, expected row count
2. OUTPUTS: each dataset, variables created, expected row count
3. CONSTANTS: every measure list, threshold, and option, quoted exactly with line numbers
4. LOGIC: numbered plain-language steps
5. MISSING VALUES: what happens to missing values at each step
6. ORDER DEPENDENCE: anything that depends on row or sort order
7. SAS-SPECIFIC BEHAVIOR: anything with no direct pandas equivalent
8. QUESTIONS: everything you are unsure of

SAS code:
[PASTE BLOCK, INCLUDING FULL DEFINITIONS OF ANY MACRO IT CALLS]

Relevant lines from SAS_Log.log:
[PASTE]
```

The translation lead reads the spec beside the code, corrects it, and answers the QUESTIONS. The corrected spec goes into the translation prompt.

### 5.2 Data loading and Program 0 handoff

```
[Context header]
Approved spec: [PASTE]

Write def load_program0_output(path: str) -> pd.DataFrame that reads the standardized dataset.
Requirements:
- Read from .sas7bdat with pyreadstat if available, otherwise from CSV, and tell me which you used.
- Keep Provider ID as str with leading zeros.
- Do not sort or reorder rows.
- Preserve SAS missing values as NaN, and tell me how SAS special missing values (like .A) are handled.
- Print row count, column names, and dtypes.
Include a test comparing the row count and ID set to the SAS log: [paste expected counts].
```

### 5.3 Simple average per group

```
[Context header]
Approved spec: [PASTE]

Write def compute_group_scores(df: pd.DataFrame, measure_map: dict) -> pd.DataFrame.

Requirements:
- measure_map is a constant copied from SAS lines [X-Y]: {group name: [measure columns]}.
- The group score is the mean of the non-missing measure scores in the group, if that is what the
  SAS code does. State exactly which SAS function does this and cite the line.
- Do not treat a missing measure as zero.
- Do not use skipna shortcuts without showing they are equivalent to the SAS function used.
- Handle a group with all measures missing the way SAS does (state what SAS returns).
- Apply any minimum-measure rule exactly as SAS does, with the same operator.
- Apply rounding only where SAS rounds, half away from zero.
- Preserve row order and the Provider ID as str.

Your code MUST reproduce this hand calculation (four measures in a group):
  Measure scores: 0.2, missing, -0.4, 0.5
  Non-missing count: 3. Sum: 0.2 + (-0.4) + 0.5 = 0.3
  Group score = 0.3 / 3 = 0.1
  (Treating the missing measure as zero would give 0.3 / 4 = 0.075, which is wrong.)
Include this as a pytest case.

OUTPUT: (1) code, (2) pytest, (3) assumptions, (4) SAS-vs-Python risks, (5) QUESTIONS.

SAS code:
[PASTE]
```

### 5.4 Measure exclusions and counts

```
[Context header]
Approved spec: [PASTE]

Write the function that [excludes measures / counts measures per group], following this SAS code: [PASTE].

Requirements:
- Every threshold as a named constant copied from the SAS code.
- Use >= or > exactly as SAS does. Do not "correct" it.
- State whether a missing value counts toward a measure, citing the SAS line.
- Create every count or indicator variable the SAS code creates, with the same names and types.
- Return the excluded items in a separate DataFrame with the reason.

Include a test comparing the excluded set to the SAS dataset [name], and a test where an item sits exactly at the threshold.
```

### 5.5 Output datasets

```
[Context header]
Write the function that builds the output dataset [name] from the group scores, following this SAS code: [PASTE].
Requirements:
- Same column names, order, and types as the SAS dataset (here are the SAS columns and dtypes: [paste]).
- Same row order as the SAS dataset.
- Same row count as the log: [paste].
- Apply rounding only where SAS does.
Include a datacompy test against the SAS reference file for this dataset.
```

### 5.6 Self-review prompt

```
Review your translation against the SAS source. For each item answer MATCHES, DIFFERS, or CANNOT TELL,
citing the SAS line and your Python line.

1. Measure-to-group mapping identical to SAS?
2. Averaging function and denominator
3. Missing measures never treated as zero
4. Minimum-measure and exclusion rules, with operators (> vs >=)
5. Standardization, if any, and standard deviation denominator
6. Rounding method and where it is applied
7. Row order preserved
8. Provider ID dtype and leading zeros
9. Output column names, order, and dtypes
10. Anything repeated across groups that is handled differently in your code

Finish with: the single most likely place this translation is still wrong, and how to test for it.
```

### 5.7 Adversarial reviewer (use a different model)

```
You are a skeptical reviewer. A colleague translated this SAS code to Python and says it is equivalent.
Find a counterexample. Do not confirm correctness.

For each problem give the SAS line, the Python line, an input where they disagree, and what each outputs.
Test at least: a group with one missing measure, a group with all measures missing, a group exactly at the
minimum-measure threshold, one below it, a value ending in .5 where rounding applies, and a reordered input.
If you find nothing, list the three inputs you tried hardest to break it with.

SAS: [PASTE]
Python: [PASTE]
```

### 5.8 Test-writing prompt

```
[Context header]
Write pytest tests for [function] in three groups.

A. HAND-CALCULATED: small made-up inputs with the arithmetic shown in comments.
   Cover all measures present, each single measure missing, all missing, the minimum number present,
   and one below the minimum.
B. PROPERTY: each group score lies between the minimum and maximum of its non-missing measure scores;
   adding a missing measure does not change the score; results do not change when row order is shuffled
   (if SAS logic is row-independent).
C. REGRESSION: load the SAS input and output for this stage with pyreadstat, run the function on the
   SAS input, and compare with datacompy. Check row count, columns, dtypes, ID matches, and numeric
   agreement within [tolerance]. On failure print the mismatch count and the first 20 mismatching rows.

Do not make a test pass by loosening a tolerance or changing expected data.
```

### 5.9 Debug prompt

```
[Context header]
My output differs from SAS in this block.
SAS code: [PASTE]   My Python: [PASTE]   datacompy report: [PASTE]
Example differing rows with the SAS value and my value: [PASTE]

Diagnose in this order and stop at the first level that fails:
1. Row counts and ID sets
2. Input values (do they match the SAS input?)
3. Measure-to-group assignment
4. Exclusions and counts
5. Group score. Show a hand calculation for one differing hospital.
6. Rounding and output formatting

Give the evidence at each level, rank the three most likely causes, and propose ONE fix at a time.
Do not change the expected output or tolerance.
```

---

## 6. SAS-vs-Python traps likely to matter here

| SAS behavior | Python trap |
|---|---|
| `MEAN()` and `SUM()` ignore missing values | `a + b` returns missing in SAS, and in pandas arithmetic NaN propagates; `skipna` defaults can hide the difference |
| `N()` and `NMISS()` count non-missing and missing | `count()` and `isna().sum()` behave similarly, but check how your code treats empty strings |
| Missing sorts lowest and is less than any number in comparisons | NaN comparisons return False |
| `ROUND()` rounds half away from zero | Python and numpy round half to even |
| `PROC MEANS` and `STD` use n-1 | `numpy.std` uses n by default |
| Character IDs with leading zeros | Reading as numbers drops the zeros |
| Special missing values (`.A`, `.B`) | May load as plain NaN or as a different value |
| Arrays and macro loops over measures | Need an explicit, ordered measure list in Python |
| Same logic for five groups via macro | Easy to hard-code four of them and miss one |
| Dataset column order | pandas operations can reorder columns |

---

## 7. Common mistakes, with the prompt fix

| Mistake | How it shows up | Prompt fix |
|---|---|---|
| Missing measure treated as zero | Groups with gaps score too low or too high | Include the 0.3 / 3 = 0.1 hand calculation as a required test |
| Wrong measure in a group | One group's scores are off for every hospital | Paste the SAS mapping and require a test that prints it |
| Wrong denominator | Only hospitals with missing measures mismatch | State that the denominator is the count of non-missing measures |
| Exclusion rule off by one | A few measures or hospitals differ | Require same operator and a threshold-boundary test |
| Rounding applied at the wrong step | Tiny differences that break exact matches | State where SAS rounds and require half-away-from-zero |
| Checking only the final output | Errors in the middle hide until Program 2 | Follow the validation order in Section 4 |
| Hard-coding one group | Works for mortality, fails for the others | Require one parameterized function validated on all five outputs |
| AI invents macro logic | Plausible code with no basis | Paste the full macro definition and forbid guessing |
| AI loosens tests to pass | Green tests, wrong results | State the rule against editing tests and tolerances in every prompt |

---

## 8. Red flags in AI responses

- Says the code is equivalent without citing line numbers
- Uses measure names, thresholds, or counts you did not paste in
- Describes a macro's behavior when you did not paste its definition
- Uses `.mean()` and calls it equivalent to the SAS function without explanation
- Fills missing values with zero or the column mean
- Sorts or reorders rows without being asked
- Fixes a mismatch by changing a tolerance
- Returns a QUESTIONS section that says "none" on a complicated block
- Cannot say what it could not match

---

## 9. Pre-send checklist

- [ ] Fresh chat with the context header pasted
- [ ] One block only
- [ ] Actual SAS code pasted, including full definitions of any macro called
- [ ] Measure lists and thresholds pasted, with "copy verbatim" stated
- [ ] Corrected spec included for translation prompts
- [ ] Output format specified, including QUESTIONS
- [ ] "Do not edit expected outputs or tolerances" stated
- [ ] Real comparison report and example rows attached for debug prompts
- [ ] Tolerances agreed with the team in advance

---

## 10. Prompt log (one entry per run)

```
Date / author:
Block:
Model + version:
Prompt file + version:
Result: PASS / FAIL / PARTIAL
What the AI got wrong:
What changed in the prompt:
Validation numbers (mismatches / total rows):
```

---

## 11. Open items to fill in after reading the code

- [ ] Exact averaging function and how it treats missing values
- [ ] Measure-to-group mapping for all five groups
- [ ] Minimum-measure and exclusion rules, with operators and variable names
- [ ] Whether anything is standardized or rounded here, and where
- [ ] Which macros are called, and their definitions
- [ ] Output dataset names and expected row counts, from the log
- [ ] Team-agreed tolerances

When the team has these, replace the bracketed placeholders in Section 5 so the prompts are ready to paste.
