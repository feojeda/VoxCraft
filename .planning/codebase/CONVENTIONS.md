# Coding Conventions

**Analysis Date:** 2026-04-25

## Project Status

**Greenfield project — no source code exists yet.**

The `ttsQwen` repository contains only project scaffolding:
- `.git/` — version control
- `.opencode/` — opencode tooling with graphify plugin
- `.planning/` — GSD planning directory (empty)
- `AGENTS.md` — graphify configuration
- `opencode.json` — opencode configuration referencing `.opencode/plugins/graphify.js`

No source files, configuration files, or dependency manifests were found.

## Naming Patterns

**Not yet established.** No source files exist to infer conventions from.

**Recommendations for a Python TTS/Qwen project:**
- Files: `snake_case.py` (e.g., `tts_engine.py`, `qwen_client.py`)
- Directories: `snake_case` packages (e.g., `models/`, `services/`, `api/`)
- Functions: `snake_case` (e.g., `generate_speech`, `load_model`)
- Classes: `PascalCase` (e.g., `TTSEngine`, `QwenClient`)
- Constants: `UPPER_SNAKE_CASE` (e.g., `MAX_SAMPLE_RATE`, `DEFAULT_MODEL`)
- Variables: `snake_case`

## Code Style

**Formatting:**
- Not yet configured. No `.prettierrc`, `pyproject.toml`, `setup.cfg`, or `.editorconfig` found.
- **Recommendation:** Use `black` for auto-formatting with default settings (88-char line length).
- **Recommendation:** Use `isort` for import ordering.

**Linting:**
- Not yet configured. No `.flake8`, `.pylintrc`, or `ruff` config found.
- **Recommendation:** Use `ruff` for fast linting (replaces flake8 + isort).

## Import Organization

**Not yet established.** No imports to analyze.

**Recommendation (PEP 8 / isort standard):**
1. Standard library imports (`os`, `sys`, `pathlib`, etc.)
2. Third-party imports (`torch`, `transformers`, `fastapi`, etc.)
3. Local/application imports (`from .models import ...`, etc.)

Groups separated by blank lines.

## Error Handling

**Not yet established.** No error handling patterns to observe.

**Recommendations:**
- Use custom exception hierarchy rooted in a base `TTSQwenError`
- Use specific exception types (e.g., `ModelLoadError`, `SynthesisError`, `ConfigError`)
- Prefer explicit exception handling over bare `except:` clauses
- Log errors with context before re-raising

## Logging

**Framework:** Not yet chosen.

**Recommendations:**
- Use Python's `logging` module with structured formatters
- Define log levels consistently: DEBUG for development, INFO for operation milestones, WARNING for recoverable issues, ERROR for failures
- Configure via dict config or `logging.config` (not basicConfig)

## Comments

**Not yet established.** No code to analyze.

**Recommendations:**
- Use docstrings for all public modules, classes, and functions (Google or NumPy style)
- Keep comments focused on "why", not "what"
- Use type hints instead of comment-based type annotations

## Function Design

**Size:** Not yet established.
- **Recommendation:** Functions should do one thing. Target < 50 lines. Extract helpers for complex logic.

**Parameters:** Not yet established.
- **Recommendation:** Use type hints for all parameters and return values.
- **Recommendation:** Use dataclasses or Pydantic models for complex parameter groups.

**Return Values:** Not yet established.
- **Recommendation:** Use typed return values. Prefer explicit return types over `Any`.

## Module Design

**Exports:** Not yet established.
- **Recommendation:** Use `__all__` in `__init__.py` to define public API.
- **Recommendation:** Keep implementation details private (prefix with `_`).

**Barrel Files:** Not yet established.
- **Recommendation:** Use `__init__.py` to re-export public API from submodules.

## Type Annotations

**Not yet established.** No code to analyze.

**Recommendation:**
- Use Python 3.10+ type hint syntax (`list[str]` not `List[str]`, `X | Y` not `Union[X, Y]`)
- Use `Pydantic` for data validation where applicable
- Consider `mypy` or `pyright` for static type checking

---

*Convention analysis: 2026-04-25 — Greenfield project, conventions to be established.*
