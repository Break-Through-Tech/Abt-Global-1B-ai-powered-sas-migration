# Program 2 Reference

All commands below assume being at the **repo root** using `uv`.

---

## Scripts, Inputs, Outputs & How to Run

### 1. `loader.py` : Merge 5 domain scores
- **Input (SAS Output CSV):** `data/Project_1/SAS Output CSV/`
  - `OUTCOME_MORTALITY.csv`, `OUTCOME_READMISSION.csv`, `OUTCOME_SAFETY.csv`, `PTEXP.csv`, `PROCESS.csv`
- **Output (Python CSV):** `data/Project_1/Python Output CSV/program_2/merged_scores_from_loader.csv`
- **Run:**
  ```bash
  uv run python data/Project_1/src/program_2/loader.py
  ```

### 2. `summary_score.py` : Weighted summary score
- **Input:** Calls `load_and_merge_domain_data()` from `loader.py`.
- **Output (Python CSV):** `data/Project_1/Python Output CSV/program_2/summary_score.csv`
- **Run:**
  ```bash
  uv run python data/Project_1/src/program_2/summary_score.py
  ```

### 3. `report.py` : Reporting eligibility
- **Input (Python Output preferred, SAS fallback):**
  - `data/Project_1/Python Output CSV/program_0/STD_DATA_2025JUL_ANALYSIS.csv`
  - Uses measure group lists from `data/Project_1/src/program_0/measures.py`.
- **Output (Python CSV):** `data/Project_1/Python Output CSV/program_2/report_indicator.csv`
- **Run:**
  ```bash
  uv run python data/Project_1/src/program_2/report.py
  ```

### 4. `peer_groups.py` : Merge & assign peer groups
- **Input:** Calls `loader.py`, `summary_score.py`, and `report.py` to merge scores with eligibility and assign 3/4/5-group peer buckets (`cnt_grp`).
- **Output (Python CSV):** `data/Project_1/Python Output CSV/program_2/summary_score22.csv`
- **Run:**
  ```bash
  uv run python data/Project_1/src/program_2/peer_groups.py
  ```

### 5. `kmeans.py` : K-means star ratings
- **Input:** Chains `loader.py`, `summary_score.py`, `report.py`, and `peer_groups.py`.
- **Output (Python CSV):** `data/Project_1/Python Output CSV/program_2/STAR_2025JUL.csv`
- **Run:**
  ```bash
  uv run python data/Project_1/src/program_2/kmeans.py
  ```

### 6. `national_averages.py` : National average scores
- **Input:** `data/Project_1/Python Output CSV/program_2/STAR_2025JUL.csv` and the 5 domain CSVs in `data/Project_1/SAS Output CSV/`.
- **Output (Python CSV):** `data/Project_1/Python Output CSV/program_2/NATIONAL_AVERAGE_2025JUL.csv`
- **Run:**
  ```bash
  uv run python data/Project_1/src/program_2/national_averages.py
  ```

---

## Tests (Validated Against `data/Project_1/SAS Output CSV/STAR_2025JUL.csv` & Domain CSVs)

- **Run all Program 2 tests:**
  ```bash
  uv run pytest tests/program_2
  ```
- **Run individually:**
  ```bash
  uv run pytest tests/program_2/test_loader.py
  uv run pytest tests/program_2/test_summary_score.py
  uv run pytest tests/program_2/test_report.py
  uv run pytest tests/program_2/test_peer_groups.py
  uv run pytest tests/program_2/test_kmeans.py
  ```

| Test File | Tests | Reference Ground Truth |
|---|---|---|
| `tests/program_2/test_loader.py` | `loader.py` | 5 domain CSVs in `data/Project_1/SAS Output CSV/` |
| `tests/program_2/test_summary_score.py` | `summary_score.py` | `summary_score` in `STAR_2025JUL.csv` |
| `tests/program_2/test_report.py` | `report.py` | Measure counts & `report_indicator` in `STAR_2025JUL.csv` |
| `tests/program_2/test_peer_groups.py` | `peer_groups.py` | Eligible hospitals & `cnt_grp` in `STAR_2025JUL.csv` |
| `tests/program_2/test_kmeans.py` | `kmeans.py` | Final 1-5 `star` ratings in `STAR_2025JUL.csv` |
