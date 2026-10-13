# Program 2: AI Tips

## What to Remember
- Program 2 depends on the domain scores produced by Program 1 and the standardized measure data from Program 0.
- It combines five domains: Mortality, Safety, Readmission, Patient Experience, and Timely and Effective Care.
- The standard weights are 22%, 22%, 22%, 22%, and 12%, respectively.
- Missing domain scores cause the remaining weights to be redistributed. Do not simply treat missing scores as zero.
- Reporting eligibility is determined by `%report`. The comments specify at least three measures per group and at least three qualifying groups, including Safety or Mortality.
- Eligible hospitals are separated into peer groups based on their number of qualifying measure groups.
- `%kmeans` is called separately for the three-, four-, and five-group peer groups.
- The final output contains hospital summary scores, star ratings, domain scores, measure counts, and reporting information.
- National averages include overall summary scores, peer-group summary scores, and individual domain scores.

## Macro Dependencies
Do not guess the internal logic of these macros:
- `%report`: reporting eligibility and related indicators/counts.
- `%kmeans`: clustering and star-rating assignment.
- `%nation_avg0`: overall national summary-score average.
- `%nation_avg_peer`: national summary-score averages by peer group.
- `%nation_avg`: national averages for individual domain scores.

Find and review their definitions in `Star_Macros.sas` before implementing or validating these calculations.

## Common Mistakes to Avoid
- Using the wrong domain weights or array order.
- Treating missing domain scores as zero.
- Redistributing weights incorrectly.
- Assuming the reporting criteria are fully implemented in the visible comments rather than checking `%report`.
- Using the wrong measure-group counts for peer-group assignment.
- Assuming K-means cluster labels directly equal the intended star ratings without checking `%kmeans`.
- Comparing only final star ratings instead of checking intermediate scores and group assignments.
- Calculating national averages over the wrong set of hospitals.

## Recommended Validation Order
1. Merged domain scores.
2. Weighted summary scores.
3. Reporting eligibility and measure counts.
4. Peer-group assignment.
5. K-means results and star ratings.
6. National average outputs.

Always compare intermediate SAS and Python results. Matching final star ratings alone does not prove that the underlying calculations are correct.