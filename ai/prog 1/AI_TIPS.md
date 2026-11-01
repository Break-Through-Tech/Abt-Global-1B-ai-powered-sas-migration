# Program 1 — AI Tips

## 1. Program 1 Depends on Program 0

Do not treat Program 1 as a standalone program.

Program 0 already creates:

- The standardized analysis data
- The included measure lists
- The five measure groups
- The measure counts used by Program 1

---

## 2. There Are Five Separate Group Scores

Make sure the Python translation produces a score for each:

```text
Mortality
Safety of Care
Readmission
Patient Experience
Timely and Effective Care
```

Each group has its own measure list and measure count.

---

## 3. `%grp_score` Is the Most Important Part

The actual calculation is inside the `%grp_score` macro.

**Do not guess what the macro does.**

If translating Program 1 and the macro definition is not available, tell AI to flag the missing macro rather than inventing a calculation.

The macro definition should be reviewed separately and then incorporated into the Python translation.

---

## 4. Preserve the Inputs and Outputs

Each call follows the same general structure:

```text
Standardized analysis data
        ↓
Measure group
        ↓
Number of measures
        ↓
%grp_score
        ↓
Hospital-level group score
```

The five outputs are:

```text
Outcome_mortality
Outcome_safety
Outcome_readmission
PtExp
Process
```

---

## 5. Validate Before Moving to Program 2

Before using Program 1's results in Program 2, compare the group scores against the SAS outputs.

If the results do not match, investigate Program 1 and the `%grp_score` macro before continuing downstream.