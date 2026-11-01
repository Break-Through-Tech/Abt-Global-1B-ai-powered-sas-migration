# AI Model Guide

## Purpose

This guide gives the team a quick reference for choosing AI models and coding tools during the project.

AI should be used as a **development and review tool, not the source of truth**. The original SAS logic, project requirements, and actual answer-key outputs should always take priority.

---

## Model vs. Tool

**AI Model:** The underlying model that generates or analyzes information.

Examples: GPT, Claude, Gemini, DeepSeek, Qwen, Mistral, Grok, Kimi.

**AI Tool / Coding Agent:** A tool that uses AI models and can add capabilities such as reading a repository, editing files, running code, or working through multi-step coding tasks.

Examples: Codex, Claude Code, GitHub Copilot, Gemini coding/agent tools.

---

## General Model Options

| Model | Best For | Potential Project Use |
|---|---|---|
| **ChatGPT / OpenAI** | General reasoning, coding, debugging | Code generation, explanations, debugging, review |
| **Claude / Anthropic** | Detailed reasoning and code analysis | SAS → Python translation and logic review |
| **Gemini / Google** | Large-context analysis, research, coding | Cross-referencing large SAS/Python sections |
| **DeepSeek** | Coding and technical reasoning | Independent code review / sanity check |
| **Qwen** | Coding, reasoning, and long-context tasks | Independent technical review |
| **Mistral** | General reasoning and coding | Additional independent review |
| **Grok / xAI** | General reasoning, coding, research | Optional secondary review |
| **Kimi** | Long-context reasoning and coding | Large technical comparisons |

Free access and model availability vary by provider and can change over time.

---

## Coding Agents / Development Tools

| Tool | Best For |
|---|---|
| **OpenAI Codex** | Repository-level coding, implementation, debugging, and code review |
| **Claude Code** | Terminal-based development and codebase analysis |
| **GitHub Copilot** | Coding assistance directly in VS Code/GitHub |
| **Gemini coding/agent tools** | Code analysis, research, and multi-step development |
| **DeepSeek Harness** | Longer coding tasks and local file/repository work |

For tasks involving multiple files, existing project structure, debugging, or actually modifying the repository, a coding agent may be more useful than a standard chatbot.

---

## Recommended Use for This Project

### SAS → Python

Use a strong reasoning/coding model such as **Claude, ChatGPT, or Gemini** to translate the logic.

When reviewing the translation, compare:

- Variables
- Filters and exclusions
- Missing values
- Conditions and thresholds
- Dates
- Transformations
- Output

### Independent Cross-Check

Use a **different model or model family** to review important translations.

Give the reviewer:

1. Original SAS
2. Generated Python
3. Relevant requirements
4. A specific question about whether the logic matches

Ask the reviewer to **identify differences or potential issues**, rather than simply asking whether the code is correct.

### Repository-Level Work

Use tools such as **Codex, Claude Code, or GitHub Copilot** when the task involves working directly with the repository, multiple files, debugging, or implementation.

### Extra Review

Models such as **DeepSeek, Qwen, Mistral, Kimi, or Grok** can be useful as additional independent reviewers when needed.

---

## General Workflow

**Generate → Cross-Reference → Investigate Disagreements → Run Code → Compare Against Answer Key → Human Review**

If AI-generated code disagrees with the expected results, go back to the original SAS logic and project requirements before assuming the AI is correct.

### Golden Rule

> **AI agreement is not validation.**