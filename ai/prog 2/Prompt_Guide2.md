# Program 2: AI Prompting and Validation Guide

Second Stage Weighted Average and Categorize Star, part of the CMS Overall Hospital Quality Star Rating SAS-to-Python migration.

**How to use this guide:** Section 1 comes from the team's notes on the Program 2 code. Section 2 lists what must still be read directly from `Star_Macros.sas` before anyone prompts an AI about those macros. Sections 3 to 10 are the working toolkit. Anything marked **(verify)** is a hypothesis to confirm against the SAS code or log, not a fact.

---

## 1. What we know about Program 2

- Program 2 depends on the domain scores from Program 1 and the standardized measure data from Program 0.
- It combines five domains: Mortality, Safety, Readmission, Patient Experience, and Timely and Effective Care.
- The standard weights are 22%, 22%, 22%, 22%, and 12% in that order.
- When a domain score is missing, the remaining weights are redistributed. A missing score is never treated as zero.
- Reporting eligibility is determined by the `%report` macro. The code comments describe at least three measures per group and at least three qualifying groups, including Safety or Mortality.
- Eligible hospitals are split into peer groups by their number of qualifying measure groups (three, four, or five).
- `%kmeans` is called separately for each of the three-, four-, and five-group peer groups.
- The final output holds hospital summary scores, star ratings, domain scores, measure counts, and reporting information.
- National averages cover overall summary scores, peer-group summary scores, and individual domain scores.

---

## 2. Read these macros before prompting

Do not let the AI guess the internals of these macros, and do not guess them yourself. Open `Star_Macros.sas`, read each definition, and write down the answers below. Those answers go into every prompt for that macro.

### %report (reporting eligibility)

- [ ] What exact conditions make a hospital eligible? Are they all in the macro, or partly elsewhere?
- [ ] Is each threshold comparison `>=` or `>`?
- [ ] What counts as a "reported" measure and a "reported" group when a value is missing?
- [ ] How is the Safety-or-Mortality requirement tested?
- [ ] What variables does it create (indicators, counts), and what are their names and types?

### %kmeans (clustering and stars)

- [ ] Which procedure does it call, and with which options (number of clusters, seeds, replace, iteration limit, convergence, drift)? Which options are defaults rather than written?
- [ ] Which variable(s) are clustered on? Is anything standardized first?
- [ ] How are clusters converted to stars? By ranking cluster centers? In which direction?
- [ ] Does it save seeds, centers, or iteration history? Are those in the log or HTML printout?
- [ ] What happens when a peer group is small?
- [ ] Does the result depend on input row order?

### %nation_avg0, %nation_avg_peer, %nation_avg

- [ ] Which hospitals are included in each average (all hospitals, reported only, one peer group)?
- [ ] Are the averages simple means, and are they computed on scores that were already rounded?
- [ ] What are the output dataset names, columns, and row counts?

---

## 3. Rules for prompting on this program

1. **Spec before code.** The AI first writes a plain-language spec of the stage. The translation lead corrects it against the SAS, and only then does translation happen.
2. **Constants come from the code.** Paste the weights, thresholds, and options into the prompt and require them to be copied verbatim. The AI will otherwise fill in published values from memory.
3. **One stage per chat.** Start fresh each time with the context header (Section 5.0).
4. **Test each stage on SAS's own intermediate data**, never on the output of your previous Python stage. Load from `.sas7bdat` with `pyreadstat` when possible, since CSVs may have lost precision.
5. **Every claim cites a line.** "Matches the SAS" means nothing without the SAS line number and the Python line number.
6. **Every output has a QUESTIONS section.** Without one, the AI guesses and presents the guess as fact.
7. **The AI never edits expected outputs, tests, or tolerances** to make something pass.
8. **Ask for the weakest point.** End review prompts with "what is the single most likely place this is still wrong?"

---

## 4. Stage map and validation order

Compare intermediate SAS and Python results at every stage. Matching final stars alone does not prove the calculations are right.

| # | Stage | Check against | Tolerance (team to confirm) | Main trap |
|---|---|---|---|---|
| 1 | Merged domain scores | Row count and ID set from the log; domain score columns | Exact IDs, scores about 1e-9 | Merge semantics, ID dtype |
| 2 | Weighted summary scores | Summary score per hospital | About 1e-9 | Weight order, redistribution, missing treated as zero |
| 3 | Reporting eligibility and measure counts | Eligible/ineligible list, counts per hospital | Exact | `>` vs `>=`, missing counts, Safety-or-Mortality rule |
| 4 | Peer-group assignment | Peer group per hospital | Exact | Counting groups with missing scores |
| 5 | K-means and stars | Seeds, then centers, then memberships, then stars | Centers about 1e-6, stars exact | Algorithm and seed differences, arbitrary labels |
| 6 | National averages | Each national average output | About 1e-9 | Wrong hospital set |

Stages 3 and 4 may run in a different order in the SAS code. Follow the code and reorder this table to match.

---

## 5. Prompt toolkit

### 5.0 Context header (paste at the top of every prompt)

```
PROJECT: Translating the CMS Overall Hospital Quality Star Rating SAS pipeline to Python.
THIS TASK: Program 2, stage: [STAGE NAME].
ENVIRONMENT: Python [version], pandas [version], numpy [version], scipy [version], scikit-learn [version]. No other libraries.

GROUND TRUTH: SAS output datasets are the source of truth.
Never modify expected outputs, tests, or tolerances to make something pass.

SAS BEHAVIORS TO HANDLE: missing values (SUM() ignores missing, a + b does not),
rounding (SAS rounds half away from zero), standard deviation denominator,
merge semantics, row order, character IDs with leading zeros.

RULES:
1. Copy every constant (weights, thresholds, options) verbatim from the SAS code.
2. Work on this single stage only.
3. Cite SAS line numbers for every claim about behavior.
4. If anything is ambiguous, do not guess. List it under QUESTIONS.
5. Do not optimize, restructure, or add features.
```

### 5.1 Spec prompt (before any code)

```
[Context header]

Do NOT write Python yet. Write a specification of this SAS stage.

1. INPUTS: each dataset, key variables, expected row count
2. OUTPUTS: each dataset, variables created, expected row count
3. CONSTANTS: every number, threshold, weight, and option, quoted exactly with line numbers
4. LOGIC: numbered plain-language steps
5. MISSING VALUES: what happens to missing values at each step
6. ORDER DEPENDENCE: anything that depends on row or sort order
7. SAS-SPECIFIC BEHAVIOR: anything with no direct pandas equivalent
8. QUESTIONS: everything you are unsure of

SAS code:
[PASTE STAGE, INCLUDING THE FULL MACRO DEFINITION IF A MACRO IS CALLED]

Relevant lines from SAS_Log.log:
[PASTE]
```

The translation lead reads the spec beside the code, corrects it, and answers the QUESTIONS. The corrected spec goes into the translation prompt.

### 5.2 Weighted summary score

```
[Context header]
Approved spec: [PASTE]

Write def compute_summary_score(df: pd.DataFrame) -> pd.DataFrame.

Requirements:
- WEIGHTS as a constant, copied from SAS lines [X-Y], in the same order as the SAS array.
- Domain order must match the SAS array exactly: [paste the array and its order].
- For each hospital: summary = sum(weight_g * score_g over non-missing domains)
  / sum(weight_g over the same non-missing domains).
- Never divide by the total of all weights, and never treat a missing score as zero.
- Do not use DataFrame.mean() or skipna shortcuts without showing they are equivalent.
- Handle all-missing rows the way SAS does (state what SAS returns, citing the line).
- Apply rounding only where SAS rounds, half away from zero.

Your code MUST reproduce this hand calculation (weights 22/22/22/22/12):
  Mortality 0.5, Safety -0.2, Readmission missing, Patient Experience 0.1, Timely and Effective 0.3
  Present weights: 22 + 22 + 22 + 12 = 78
  Numerator: 22*0.5 + 22*(-0.2) + 22*0.1 + 12*0.3 = 12.4
  Summary = 12.4 / 78 = 0.158974
  (Dividing by 100 gives 0.124, which is wrong. Treating the missing score as zero gives the same
  wrong answer.)
Include this as a pytest case. If the SAS weights are stored as fractions, adapt the numbers.

OUTPUT: (1) code, (2) pytest, (3) assumptions, (4) SAS-vs-Python risks, (5) QUESTIONS.

SAS code:
[PASTE]
```

### 5.3 Reporting eligibility (%report)

```
[Context header]
Approved spec: [PASTE]

Here is the full %report macro definition and the DATA step or call that uses it: [PASTE BOTH].

Write def apply_reporting_rules(df: pd.DataFrame) -> pd.DataFrame.

Requirements:
- Every threshold as a named constant copied from the SAS code.
- Use >= or > exactly as the SAS code does. Do not "correct" it.
- State whether a missing value counts toward a measure or group, citing the SAS line.
- Reproduce the Safety-or-Mortality requirement exactly as written.
- Create every indicator and count variable the macro creates, with the same names.
- Return ineligible hospitals with a column stating which rule excluded each one.
- Keep Provider ID as str and preserve row order.

Do not rely on the code comments alone. The macro body is the source of truth. If the comments and
the macro disagree, report it under QUESTIONS.

OUTPUT: (1) code, (2) assumptions, (3) risks, (4) QUESTIONS.
```

### 5.4 Peer-group assignment

```
[Context header]
Approved spec: [PASTE]

Write the function that assigns peer groups from the number of qualifying measure groups.
- Use the same count variable the SAS code uses: [name].
- Do not recompute the count a different way. If you think the count should differ, put it under QUESTIONS.
- Return the number of hospitals in each peer group and compare it to the row counts in the SAS log: [paste].
- Include a test where a hospital sits exactly at each group-count boundary.
```

### 5.5 K-means options audit (before any clustering code)

```
[Context header]

Here is the full %kmeans macro definition: [PASTE].

List every option in the clustering procedure call, including options I did NOT write
that have default values affecting the result. For each give:
- the value in effect (written or default; say which)
- what it does in SAS
- the closest scikit-learn equivalent
- verdict: EXACT, APPROXIMATE, or NO EQUIVALENT
- if not exact, how results could differ

If you are not sure of a SAS default, say so and tell me where to look it up.
Do not claim the two tools are equivalent without explaining how each works.
```

### 5.6 K-means deterministic translation

```
[Context header]
Approved spec and options audit: [PASTE]

Write def run_kmeans(X: np.ndarray, init_centers: np.ndarray) -> dict
using KMeans(init=init_centers, n_init=1, algorithm="lloyd").
Set max_iter and tol to reproduce the SAS stopping behavior, and explain where the match is approximate.
Return final centers, labels, iteration count, and inertia.
Do not standardize or transform X unless the SAS code does (cite the line).

Also write a test that supplies SAS's own initial seeds and compares final centers to SAS's
within [tolerance]. SAS seeds and centers are located: [where].

The SAS code calls %kmeans separately for the three-, four-, and five-group peer groups.
Loop over peer groups exactly as the SAS code does and keep each peer group's results separate.
```

### 5.7 Star assignment

```
[Context header]
Write the function that converts clusters to stars, following this SAS logic: [PASTE].
- Rank clusters on [variable and direction from the SAS code], within each peer group.
- Map ranks to stars exactly as SAS does.
- Do not use raw cluster labels as stars.
Include a test that shuffles the cluster labels and confirms the stars do not change,
and a test where two centers are nearly equal, showing how ties are handled.
```

### 5.8 National averages

```
[Context header]
Here are the full definitions of %nation_avg0, %nation_avg_peer, and %nation_avg and the calls to them: [PASTE].

For each macro state, with line numbers: which hospitals are included, what variable is averaged,
whether rounding happens before or after averaging, and the output columns.
Then write one Python function per macro.
Do not assume the three macros use the same hospital set. Check each.
Tests: row count and values against [dataset name], within [tolerance].
```

### 5.9 Self-review prompt

```
Review your translation against the SAS source. For each item answer MATCHES, DIFFERS, or CANNOT TELL,
citing the SAS line and your Python line.

1. Domain weights and array order identical to SAS?
2. Weight redistribution when a domain is missing
3. Missing scores never treated as zero
4. Eligibility operators identical (> vs >=), and the Safety-or-Mortality rule
5. Count of qualifying groups used for peer assignment
6. Rounding method and where it is applied
7. Row order preserved before clustering
8. Provider ID dtype and leading zeros
9. Clustering options not exactly reproduced
10. Cluster-to-star mapping independent of labels
11. Hospital set used for each national average
12. Output column names, order, and dtypes

Finish with: the single most likely place this translation is still wrong, and how to test for it.
```

### 5.10 Adversarial reviewer (use a different model)

```
You are a skeptical reviewer. A colleague translated this SAS code to Python and says it is equivalent.
Find a counterexample. Do not confirm correctness.

For each problem give the SAS line, the Python line, an input where they disagree, and what each outputs.
Test at least: a missing domain, two missing domains, a hospital exactly at the three-measure and three-group
thresholds, a hospital with Safety missing but Mortality present (and the reverse), values ending in .5,
and a reordered input.
If you find nothing, list the three inputs you tried hardest to break it with.

SAS: [PASTE]
Python: [PASTE]
```

### 5.11 Test-writing prompt

```
[Context header]
Write pytest tests for [function] in three groups.

A. HAND-CALCULATED: small made-up inputs with the arithmetic shown in comments.
   Cover all domains present, each single domain missing, the minimum qualifying domains,
   exactly at each threshold, just below each threshold.
B. PROPERTY: effective weights sum to 1 per hospital; the summary score lies between the minimum and
   maximum domain scores present; peer-group counts add up to the number of eligible hospitals;
   stars do not change when cluster labels are permuted.
C. REGRESSION: load the SAS input and output for this stage with pyreadstat, run the function on the
   SAS input, and compare with datacompy. Check row count, columns, dtypes, ID matches, and numeric
   agreement within [tolerance]. On failure print the mismatch count and the first 20 mismatching rows.

Do not make a test pass by loosening a tolerance or changing expected data.
```

### 5.12 Debug prompt

```
[Context header]
My output differs from SAS in this stage.
SAS code: [PASTE]   My Python: [PASTE]   datacompy report: [PASTE]
Example differing rows with the SAS value and my value: [PASTE]

Diagnose in this order and stop at the first level that fails:
1. Row counts and ID sets
2. Merged domain scores
3. Summary scores. Show a hand calculation for one differing hospital.
4. Eligibility and measure counts
5. Peer-group assignment
6. Clustering seeds, then centers, then memberships
7. Stars
8. National averages

Give the evidence at each level, rank the three most likely causes, and propose ONE fix at a time.
Do not change the expected output or tolerance.
```

---

## 6. K-means: the validation ladder

There are four separate sources of difference: the inputs, the initial seeds, the algorithm's update and stopping rules, and the cluster labels. Test them one rung at a time and stop at the first failure.

1. **Inputs.** Do the values and row order going into clustering match SAS exactly? Feed SAS's own input.
2. **Algorithm.** Give your code SAS's initial seeds. Do the final centers match SAS's? If not, look at the iteration limit, the stopping criterion, and the update rule.
3. **Seeds.** Does your own seed selection reproduce SAS's initial seeds? If rung 2 passes and rung 3 fails, the algorithm is right and only seed selection is wrong.
4. **Memberships.** After matching clusters by center rank, do the assignments agree? Compare memberships, never raw labels.
5. **Stars.** Do they match the SAS output dataset?

Tips:

- Check the SAS log and HTML printout for initial seeds, cluster means, and iteration history. These are the ground truth for rungs 2 and 3.
- Never use raw cluster labels as stars. Labels are arbitrary.
- scikit-learn defaults to k-means++ with random restarts. Use explicit initial centers and `n_init=1` for reproducibility, and pin the scikit-learn version.
- Do not standardize unless the SAS code does.
- Preserve row order from the SAS dataset, since seed selection may depend on it.
- If you cannot reproduce seed selection yet, use SAS's seeds as a bridge so the rest of the program can be tested while you work on it.
- A small number of hospitals near cluster boundaries can flip from tiny numeric differences. Agree as a team, before testing, how many are acceptable and how they will be documented.
- Do not tune options only until the output matches. Find out why SAS behaves differently.

---

## 7. Common mistakes, with the prompt fix

| Mistake | How it shows up | Prompt fix |
|---|---|---|
| Wrong weights or array order | Every summary score is slightly off | Paste the SAS array and require the same order |
| Missing treated as zero | Incomplete hospitals score wrongly | Include the 12.4 / 78 hand calculation as a required test |
| Wrong redistribution denominator | Only hospitals with missing domains mismatch | State that the denominator is the sum of weights of non-missing domains |
| Trusting the code comments for reporting rules | Wrong hospitals counted as eligible | Paste the `%report` body and say the macro overrides the comments |
| Wrong group count for peer groups | Peer-group sizes differ from the log | Require the same count variable and compare group sizes to the log |
| Treating cluster labels as stars | Stars look plausible but are permuted | Require rank-by-center mapping and a label-shuffle test |
| Checking only final stars | Errors hidden until the end | Follow the validation order in Section 4 |
| Wrong hospital set for national averages | Averages off by a small amount | Ask the AI to state the included hospitals for each macro, with line numbers |
| AI invents macro logic | Plausible code with no basis in the macro | Always paste the full macro definition and forbid guessing |
| AI loosens tests to pass | Green tests, wrong results | State the rule against editing tests and tolerances in every prompt |

---

## 8. Red flags in AI responses

- Says the code is equivalent without citing line numbers
- Uses numbers (weights, thresholds, counts) you did not paste in
- Describes a macro's behavior when you did not paste its definition
- Claims plain `KMeans` is equivalent to the SAS clustering procedure
- Uses k-means++, random seeds, or multiple restarts without being asked
- Treats raw cluster labels as star ratings
- Fixes a mismatch by changing a tolerance, an iteration count, or a random state
- Returns a QUESTIONS section that says "none" on a complicated stage
- Cannot say what it could not match

---

## 9. Pre-send checklist

- [ ] Fresh chat with the context header pasted
- [ ] One stage only
- [ ] Actual SAS code pasted, including the full definition of any macro called
- [ ] Every constant pasted, with "copy verbatim" stated
- [ ] Corrected spec included for translation prompts
- [ ] Output format specified, including QUESTIONS
- [ ] "Do not edit expected outputs or tolerances" stated
- [ ] Real comparison report and example rows attached for debug prompts
- [ ] Tolerances and acceptable mismatch counts agreed with the team in advance

---

## 10. Prompt log (one entry per run)

```
Date / author:
Stage:
Model + version:
Prompt file + version:
Result: PASS / FAIL / PARTIAL
What the AI got wrong:
What changed in the prompt:
Validation numbers (mismatches / total rows):
```

---

## 11. Open items to fill in after reading the code

- [ ] Exact `%report` conditions and variable names
- [ ] Full list of clustering options, written and default
- [ ] How clusters map to stars, and in which direction
- [ ] Output dataset names and expected row counts for each stage, from the log
- [ ] Which hospitals each national average includes
- [ ] Team-agreed tolerances and acceptable boundary mismatches

When the team has these, replace the bracketed placeholders in Section 5 so the prompts are ready to paste.
