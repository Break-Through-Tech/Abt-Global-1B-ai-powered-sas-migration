# Program 0 — Manual Steps Required Each Quarter

The code in this folder (`measures.py` especially) was hand-transcribed from
`0 - Data and Measure Standardization_2025Jul.sas` and validated against
that quarter's SAS output. **It will go stale** the moment CMS adds,
removes, or reclassifies a measure in a future quarter — nothing in this
code can detect that automatically. This is the "manual process" piece of
Program 0: a person has to re-check the lists by hand, the same way a SAS
analyst would.

## What to do when a new quarter's SAS program arrives

1. **Open the new SAS file** (e.g. `0 - Data and Measure Standardization_2025Oct.sas`).

2. **Search it for the comment flags SAS uses to mark manual decision points.** The original authors already tell you exactly where to look — search for these strings:
   - `MUST BE CHANGED` — file paths (`PATH1`, `PATH2`, `PATH3`) and the `%LET year=` / `%LET quarter=` values. Not measure-related, but still manual per quarter.
   - `MUST CHANGE WHEN NEW MEASURE ADDED/REMOVED` and `MUST CHECK NEXT LINE AND UPDATE FOR EACH QUARTER DATA IF NEW MEASURE ADDED/REMOVED` — appears once per measure group (mortality, safety, readmission, patient experience, process). Compare each group's hardcoded list against `MEASURE_GROUPS` in [measures.py](measures.py).
   - `MUST CHECK AND UPDATE IF MEASURES ARE REMOVED, OR MEASURES ARE ADDED AND NEED TO BE FLIPPED IN NEW QUARTERS` — the direction-reversal block. Compare against `NEGATIVE_DIRECTION_MEASURES` in [measures.py](measures.py).
   - Also skim for a one-off comment near the top (e.g. `*OP_2 and OP_3b are removed for year 2025;*SAFE_USE_OF_OPIOIDS is added for year 2025;`) — new quarters tend to add a similar note when a measure changes. That note is often the *only* place a change is documented.

3. **Update `measures.py` to match.** For each difference you find:
   - Add/remove the measure from the matching entry in `MEASURE_GROUPS`.
   - Add/remove it from `NEGATIVE_DIRECTION_MEASURES` if its direction changed.
   - Leave a one-line comment citing the SAS comment you based the change on, same as the existing code does.

4. **Update the loader if filenames changed.** `loader.py`'s `INPUT_RELATIVE_PATH` and the `MIN_MEASURE_VOLUME` threshold (should stay 100 unless SAS changes its own threshold) may need a look too.

5. **Re-run validation against the new quarter's SAS output** before trusting the translation:
   ```bash
   python -c "import sys; sys.path.insert(0, 'data/Project_1/src'); from program_0.validate import validate_program_0; validate_program_0()"
   ```
   and the test suite:
   ```bash
   pytest tests/program_0
   ```
   Every measure should still match SAS within `1e-6` — if one doesn't, it's almost always because step 2 or 3 above was missed for that specific measure.

6. **Log it.** Per `CONTRIBUTING.md`, record what changed and why in `DECISIONS.md` — e.g. "2025Oct: CMS added measure X to the Safety group, removed measure Y from Process — updated measures.py to match SAS comment on line N."

## Why this isn't automated

The SAS program doesn't derive these lists from the data either — a human
decided them when the program was written, and a human updates them when
CMS's methodology changes. Automating "which clinical measure belongs in
which group, and which direction is clinically better" would mean
guessing at domain knowledge the SAS code doesn't actually contain; the
safer and more honest translation is to keep this as an explicit,
reviewable, hand-maintained list — same as the original.
