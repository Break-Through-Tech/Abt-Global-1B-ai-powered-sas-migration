"""End-to-end Star Ratings pipeline: Program 0 -> Program 1 -> Program 2 in memory."""

from .run import PipelineResult, StepRecord, run_pipeline

__all__ = ["PipelineResult", "StepRecord", "run_pipeline"]
