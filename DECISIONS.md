# Decision Log

Add an entry when you make a decision or find a place where our Python output differs from SAS. Include the date, what was decided, why, and who decided.

## Documentation and setup (Maria)
- **Sep 29 to Oct 4, 2026:** Set up how the team works in GitHub (milestone, issues, project board, `CONTRIBUTING.md`, `.gitignore`) and chose our environment setup (`requirements.txt` with `uv`, no Docker) after testing it.

## Program 0 translation (Oct 2026)
- **Oct 20, 2026:** Translated Program 0 (`data/Project_1/src/program_0/program_0.py`), including `%keep_hos`. Output matches the SAS answer key (4566 rows x 94 columns, same column order, max abs diff ~4e-9, identical missing values). No measures have <=100 hospitals in 2025Jul, so `less100_measure` is empty, as in SAS. `Total_m_cnt` is kept on the output because SAS leaves it. Standard deviation uses n-1 (same as PROC STANDARD/MEANS).
