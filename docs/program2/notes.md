# Program 2 notes

**Step 1:** Merges the 5 group score files by `provider_id`.

**Step 2:** Calculates weighted scores. Default weights as in doc: patient exp (.22), readmission (.22), mortality (.22), safety (.22), process (.12). If a hospital is missing a group, it drops that weight and scales the rest up to equal 1. `summary_score` is sum of (score * weight).

**Step 3 (`%report` macro):** Checks reporting rules. Needs at least 3 valid measures to count a group, and 3 valid groups total. 

**Step 4:** Assigns a peer group of some value based on how many groups they reported. Only applies to hospitals that passed Step 3.

**Step 5 (`%kmeans` macro):** Runs clustering 3 separate times.