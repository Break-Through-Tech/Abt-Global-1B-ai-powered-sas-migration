# Program 2: Summary Scores and Star Ratings

## Purpose
Program 2 is the final stage of the hospital star-rating process. It combines the five domain scores from Program 1, calculates a weighted summary score for each hospital, applies reporting eligibility criteria, assigns star ratings using K-means, and calculates national average scores.

## Main Steps
1. **Combine domain scores:** Merge the five domain score datasets from Program 1 using `provider_id`.
2. **Calculate summary scores:** Apply CMS's fixed domain weights and redistribute weights when a hospital is missing a domain score.
3. **Check reporting eligibility:** Call `%report` to determine which hospitals meet the requirements for a star rating.
4. **Create peer groups:** Group eligible hospitals according to the number of measure groups they qualify for.
5. **Assign star ratings:** Call `%kmeans` separately for hospitals in the three-group, four-group, and five-group peer groups.
6. **Create final star-rating output:** Combine the results and apply descriptive variable labels.
7. **Calculate national averages:** Calculate national average summary scores and domain scores, including summary-score averages for each peer group.

## Inputs
- Domain scores from Program 1:
  - `R.Outcome_mortality`
  - `R.Outcome_safety`
  - `R.Outcome_readmission`
  - `R.PtExp`
  - `R.Process`
- Standardized measure data from Program 0, referenced through `&MEASURE_ANALYSIS`.
- Measure counts and macro variables created by earlier stages.

## Outputs
- `&RESULTS`: Final hospital star-rating results.
- `&NATIONAL_MEAN`: National average summary and domain scores.
- Intermediate datasets for summary scores, reporting eligibility, peer groups, and K-means results.
- National average intermediate datasets, including `summary_avg`, `summary_avg_peer`, and the individual domain averages.

## Important Logic to Preserve
- The five standard domain weights are 22% each for Patient Experience, Readmission, Mortality, and Safety, and 12% for Timely and Effective Care.
- Missing domain scores cause the remaining domain weights to be redistributed.
- Reporting eligibility depends on the criteria implemented in `%report`. The program comments specify at least three measures per group and at least three qualifying groups, including Safety or Mortality.
- Hospitals are separated into peer groups before K-means is applied.
- National averages are calculated separately for the overall summary score, peer-group summary scores, and domain scores.

## Important Dependencies
Program 2 calls several macros whose definitions must be reviewed before reproducing their calculations in Python:

- `%report`
- `%kmeans`
- `%nation_avg0`
- `%nation_avg_peer`
- `%nation_avg`

These macros are important for understanding reporting eligibility, star assignment, and national-average calculations. Do not guess their internal logic if the definitions are unavailable.

## Validation Priorities
Compare Python results against SAS outputs at each stage:
- Merged domain scores by hospital.
- Summary scores, including hospitals with missing domains.
- Reporting eligibility and measure counts.
- Peer-group assignments.
- K-means clusters and final star ratings.
- National averages, including peer-group averages.

The final implementation must preserve the original SAS logic and match the expected outputs.