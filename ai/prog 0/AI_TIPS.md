# Program 0 — AI Tips

## 1. Treat Program 0 as a Dependency

Program 0 creates the analysis data used by later programs.

A small mistake here can affect everything downstream, so validate Program 0 before relying on Programs 1 or 2.

---

## 2. Watch the `>100` Rule

The program excludes measures with **100 or fewer hospitals**.

The distinction matters:

```text
<= 100 → exclude
> 100 → include
```

Do not let AI accidentally translate this as `>=100`.

---

## 3. Measure Lists Are Dynamic

The final included measures are determined from the data based on hospital counts.

The program also separately defines measure groups:

- Mortality
- Safety
- Readmission
- Patient Experience
- Timely and Effective Care

AI should preserve both the **data-driven inclusion step** and the **explicit measure-group definitions**.

---

## 4. Direction Reversal Is Important

Some measures are reversed after standardization so that:

> **Higher score = better performance**

For example:

```text
MORT_30_AMI = -MORT_30_AMI
```

Do not assume every measure should be reversed. The specific reversal list in the SAS program must be preserved.

Also pay attention to measures that were removed or added for the 2025 data.

---

## 5. Standardization Happens Before Reversal

The general sequence is:

```text
Original measures
      ↓
Exclude measures with <=100 hospitals
      ↓
Keep hospitals with included measures
      ↓
Calculate mean / standard deviation
      ↓
Standardize measures
      ↓
Reverse selected measures
      ↓
Create final analysis dataset
```

Changing this order can change the results.

---

## 6. Be Careful With SAS-Specific Features

Program 0 uses several SAS features that may not have a direct one-line Python equivalent:

- `%LET`
- `%INCLUDE`
- macros
- `PROC TABULATE`
- `PROC TRANSPOSE`
- `PROC SQL`
- `PROC MEANS`
- `PROC STANDARD`
- arrays
- conditional macro logic
- `LIBNAME`

AI should explain how each feature maps to Python rather than blindly replacing it with a guessed equivalent.

---

## 7. Validate Intermediate Results

Do not only compare the final dataset.

When possible, compare:

- Number of measures before/after the `>100` filter
- List of excluded measures
- Final included measure list
- Number of hospitals retained
- Measure group lists
- Means and standard deviations
- Standardized values
- Direction-reversed values
- Final dataset columns and observations

This makes it much easier to identify where a mismatch begins.