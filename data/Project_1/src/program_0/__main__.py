"""Run with: python -m program_0  (from data/Project_1/src)."""
from .loader import find_data_dir, load_input_data
from .standardize import run_program_0, write_outputs

data_dir = find_data_dir()
result = run_program_0(load_input_data(data_dir))
write_outputs(result, data_dir / "Python Output CSV" / "program_0")
print(f"analysis: {result.analysis_dataset.shape}; excluded measures: {len(result.excluded_measures)}")
