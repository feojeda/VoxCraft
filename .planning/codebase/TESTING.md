# Testing Patterns

**Analysis Date:** 2026-04-25

## Project Status

**Greenfield project — no source code or tests exist yet.**

The `ttsQwen` repository contains only project scaffolding (`.git/`, `.opencode/`, `.planning/`, `AGENTS.md`, `opencode.json`). No test files, test frameworks, or test configurations were found.

## Test Framework

**Runner:**
- Not yet chosen. No `pytest.ini`, `pyproject.toml` `[tool.pytest]`, `setup.cfg`, or `conftest.py` found.

**Recommendation:**
- Use `pytest` as the test runner — standard for Python ML/AI projects
- Install as dev dependency: `pip install pytest pytest-cov pytest-asyncio`

**Assertion Library:**
- Use plain `assert` statements (pytest style) — more readable than `unittest` assertions

**Run Commands (recommended):**
```bash
pytest                          # Run all tests
pytest -x                       # Stop on first failure
pytest tests/ -v                # Verbose output
pytest --cov=src tests/         # Coverage report
pytest --cov=src --cov-report=html tests/  # HTML coverage report
pytest -k "test_synthesize"     # Run tests matching pattern
pytest -m "not slow"            # Skip slow tests
```

## Test File Organization

**Location:**
- Not yet established.
- **Recommendation:** Separate `tests/` directory mirroring source structure:

```
ttsQwen/
├── src/
│   └── tts_qwen/
│       ├── __init__.py
│       ├── engine.py
│       └── models.py
└── tests/
    ├── conftest.py              # Shared fixtures
    ├── unit/
    │   ├── test_engine.py
    │   └── test_models.py
    └── integration/
        └── test_synthesis.py
```

**Naming:**
- Test files: `test_<module>.py` (e.g., `test_engine.py`, `test_models.py`)
- Test classes: `Test<Feature>` (e.g., `TestTTSEngine`, `TestModelLoader`)
- Test functions: `test_<behavior>` (e.g., `test_synthesize_returns_audio`, `test_invalid_text_raises_error`)

## Test Structure

**Suite Organization (recommended):**
```python
"""Tests for the TTS engine module."""

import pytest

from tts_qwen.engine import TTSEngine


class TestTTSEngine:
    """Tests for TTSEngine class."""

    @pytest.fixture
    def engine(self):
        """Create a TTSEngine instance for testing."""
        return TTSEngine(model="test-model")

    def test_synthesize_returns_bytes(self, engine):
        """Synthesize should return audio bytes."""
        result = engine.synthesize("Hello world")
        assert isinstance(result, bytes)

    def test_synthesize_empty_text_raises(self, engine):
        """Synthesize should raise on empty text."""
        with pytest.raises(ValueError, match="text cannot be empty"):
            engine.synthesize("")
```

**Patterns:**
- **Setup:** Use `@pytest.fixture` for test setup and dependency injection
- **Teardown:** Use fixture teardown (yield pattern) for cleanup
- **Assertion:** Plain `assert` statements with pytest for rich error messages
- **Parametrize:** Use `@pytest.mark.parametrize` for testing multiple inputs

## Mocking

**Framework:** Not yet chosen.
- **Recommendation:** Use `unittest.mock` (stdlib) — no extra dependency needed
- For complex mocking: consider `pytest-mock` plugin for cleaner `mocker` fixture

**Patterns (recommended):**
```python
from unittest.mock import MagicMock, patch

import pytest


def test_load_model_called_once():
    """Model loading should happen exactly once."""
    with patch("tts_qwen.engine.load_model") as mock_load:
        mock_load.return_value = MagicMock()
        engine = TTSEngine(model="test-model")
        mock_load.assert_called_once_with("test-model")


def test_synthesize_with_mocked_model(mocker):
    """Synthesize should call model's generate method."""
    mock_model = mocker.patch("tts_qwen.engine.load_model")
    engine = TTSEngine(model="test-model")
    engine.synthesize("hello")
    mock_model.return_value.generate.assert_called_once()
```

**What to Mock:**
- External API calls (model inference endpoints)
- File system operations (audio file I/O)
- Network requests
- GPU/model loading (heavy operations)

**What NOT to Mock:**
- Pure logic and data transformations
- Pydantic model validation
- Simple utility functions
- Business logic being directly tested

## Fixtures and Factories

**Test Data (recommended):**
```python
# tests/conftest.py
import pytest


@pytest.fixture
def sample_text():
    """Provide sample text for TTS testing."""
    return "The quick brown fox jumps over the lazy dog."


@pytest.fixture
def sample_audio_bytes():
    """Provide sample audio bytes for testing."""
    return b"\x00\x01\x02\x03" * 100  # Dummy WAV-like data


@pytest.fixture
def mock_model_response():
    """Provide a mock model response."""
    return {"audio": b"mock_audio_data", "sample_rate": 22050}
```

**Location:**
- Shared fixtures: `tests/conftest.py`
- Module-specific fixtures: `tests/unit/conftest.py`
- Test data files: `tests/fixtures/` (e.g., `tests/fixtures/sample.wav`)

## Coverage

**Requirements:** Not yet enforced.
- **Recommendation:** Target ≥ 80% coverage for core logic
- **Recommendation:** Exclude model loading/inference from coverage (hard to test without GPU)

**View Coverage (recommended):**
```bash
pytest --cov=tts_qwen --cov-report=term-missing tests/
pytest --cov=tts_qwen --cov-report=html tests/  # HTML report in htmlcov/
```

**Coverage config (in `pyproject.toml`):**
```toml
[tool.coverage.run]
source = ["tts_qwen"]
omit = ["tests/*", "**/__init__.py"]

[tool.coverage.report]
fail_under = 80
show_missing = true
```

## Test Types

**Unit Tests:**
- Scope: Individual functions, classes, and modules in isolation
- Location: `tests/unit/`
- Approach: Mock external dependencies, test logic and edge cases
- Target: Fast execution (< 1s per test)

**Integration Tests:**
- Scope: Multiple components working together
- Location: `tests/integration/`
- Approach: May use real model loading (with `@pytest.mark.slow`)
- Target: End-to-end TTS pipeline from text input to audio output

**E2E Tests:**
- Not yet established
- **Recommendation:** Consider testing via CLI or API entry points
- Mark with `@pytest.mark.e2e` to allow selective execution

## Test Markers (recommended)

```python
# pytest.ini or pyproject.toml [tool.pytest.ini_options]
[tool.pytest.ini_options]
markers = [
    "slow: marks tests as slow (deselect with '-m \"not slow\"')",
    "gpu: marks tests requiring GPU",
    "integration: marks integration tests",
    "e2e: marks end-to-end tests",
]
```

## Common Patterns

**Async Testing (recommended):**
```python
import pytest

@pytest.mark.asyncio
async def test_async_synthesize():
    """Async synthesis should return audio bytes."""
    engine = TTSEngine(model="test-model")
    result = await engine.synthesize_async("Hello")
    assert isinstance(result, bytes)
```

**Error Testing:**
```python
import pytest

def test_invalid_model_raises():
    """Invalid model name should raise ConfigError."""
    with pytest.raises(ConfigError, match="model not found"):
        TTSEngine(model="nonexistent-model")

def test_synthesize_network_error(engine, mocker):
    """Network errors should be wrapped in SynthesisError."""
    mocker.patch(
        "tts_qwen.engine.infer",
        side_effect=ConnectionError("timeout")
    )
    with pytest.raises(SynthesisError, match="timeout"):
        engine.synthesize("Hello")
```

**Parameterized Tests:**
```python
@pytest.mark.parametrize("text,expected_error", [
    ("", ValueError),
    (None, TypeError),
    ("a" * 10000, ValueError),
])
def test_invalid_inputs(text, expected_error, engine):
    """Invalid inputs should raise appropriate errors."""
    with pytest.raises(expected_error):
        engine.synthesize(text)
```

---

*Testing analysis: 2026-04-25 — Greenfield project, testing patterns to be established.*
