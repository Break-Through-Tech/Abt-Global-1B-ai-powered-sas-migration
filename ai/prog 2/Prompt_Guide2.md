# Program 2: AI Prompt Guide

Use these prompts when analyzing, translating, debugging, or validating Program 2.

## 1. Understand the Program

I am working on Program 2 of a SAS-to-Python hospital star-rating project. Explain this SAS program step by step in beginner-friendly language. Explain how the five domain scores are combined, how summary scores are calculated, how missing domain scores affect weights, how reporting eligibility works, how peer groups are created, how K-means is used, and how national averages are calculated. Identify the inputs, intermediate datasets, outputs, and dependencies on earlier programs. Do not assume the internal logic of any macro whose definition is not provided.

## 2. Translate SAS to Python

Translate this Program 2 SAS code into Python while preserving the original logic. Explain each section and identify the corresponding Python operations. Preserve the five domain weights, missing-score handling, reporting criteria, peer-group assignments, K-means process, final output structure, and national-average calculations. If a required macro definition or dependency is missing, identify the missing information before implementing that part. Do not invent replacement logic.

## 3. Cross-Check SAS and Python

Compare the original SAS code with the Python implementation. Check whether both versions use the same domain scores, merge records by provider ID, calculate weighted summary scores, redistribute weights when domains are missing, apply reporting eligibility criteria, assign peer groups, perform K-means clustering, and calculate national averages. Identify specific mismatches and explain how they could affect the final star ratings.

## 4. Investigate a Discrepancy

A hospital's summary score, reporting eligibility, peer group, star rating, or national average differs between SAS and Python. Help me trace the discrepancy step by step. Identify the earliest stage where the results differ, inspect the relevant records and calculations, and explain the likely cause. Do not assume that either implementation is correct without evidence.

## 5. Understand the Macros

I need to understand one of the macros used by Program 2: `%report`, `%kmeans`, `%nation_avg0`, `%nation_avg_peer`, or `%nation_avg`. Using the macro definition I provide, explain its inputs, calculations, filtering rules, outputs, and Python equivalent. Identify any handling of missing values, ties, eligibility conditions, or clustering details. Do not infer behavior that is not supported by the code.

## 6. Validate Summary-Score Calculations

Check the summary-score calculation against the SAS logic. Confirm the fixed weights are 0.22, 0.22, 0.22, 0.22, and 0.12 for the five domains in the order used by the arrays. Verify that missing domain scores receive no weight and that the remaining weights are divided by the total available weight. Test complete scores and cases with one or more missing domains.

## 7. Validate Final Star Ratings

Help me validate the final star-rating output. Check the reporting indicator, number of qualifying measure groups, peer-group assignment, K-means output, and final star value. Explain which intermediate SAS outputs are needed to identify the cause of any mismatch. Do not assume K-means cluster numbers automatically correspond to the correct star ratings without reviewing the macro implementation.