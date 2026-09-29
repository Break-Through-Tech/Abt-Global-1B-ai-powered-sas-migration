# K-means notes

This is for how the SAS clustering actually works in Program 2. It uses `proc fastclus` and does it in two steps.

**Step 1:** It puts the `summary_score` into 5 groups. Then it takes the median from each group and uses those as the starting points. It runs a quick clustering with those.

**Step 2:** It takes the new clusters from Step 1 and runs the clustering all over again. But this time, it adds `strict=1`. I'm pretty sure this is just a filter so outliers don't mess up the groups.

Some other quick things I noticed:
*   It only looks at one variable: `summary_score`. 
*   It always forces exactly 5 clusters (`maxc=5`).
*   To give out the stars, it sorts the clusters by their average score. The group with the lowest average gets 1 star, and the highest gets 5 stars.
*   This whole process repeats 3 times (once for each peer group).

**For our Python translation:** 
When we move this to python, we might have to manually calculate those medians and feed them in as custom.