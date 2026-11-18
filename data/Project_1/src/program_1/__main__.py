"""Run with: python -m program_1  (from data/Project_1/src, after running Program 0)."""
from program_0.loader import find_data_dir

from .first_stage import load_analysis_data, run_program_1, write_outputs

data_dir = find_data_dir()
results = run_program_1(load_analysis_data("python", data_dir))
write_outputs(results, data_dir / "Python Output CSV" / "program_1")
for name, table in results.items():
    print(f"{name}: {table.shape}")
