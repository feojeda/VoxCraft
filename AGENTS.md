## graphify

This project has a graphify knowledge graph at graphify-out/.

Rules:
- Before answering architecture or codebase questions, read graphify-out/GRAPH_REPORT.md for god nodes and community structure
- If graphify-out/wiki/index.md exists, navigate it instead of reading raw files
- After modifying code files in this session, run `graphify update .` to keep the graph current (AST-only, no API cost)

<!-- GSD:project-start source:PROJECT.md -->
## Project

**VoxCraft**

Aplicación web pública de text-to-speech (TTS) que permite a los usuarios generar audio a partir de texto, usando voces clonadas o predefinidas, con control de prosodia (SSML y emociones). Orientada a creadores de contenido que necesitan narraciones, audios para videos y podcasts.

**Core Value:** Generar audio de alta calidad desde texto con la voz que el usuario elija (propia o predefinida), con control expresivo sobre prosodia y emoción.

### Constraints

- **Stack Frontend**: React/Next.js — ecosistema amplio, buen DX
- **Stack Backend**: Python FastAPI — necesario para ML/PyTorch
- **Workers**: Celery + Redis — procesamiento asíncrono de generación de audio
- **Base de datos**: SQLite para empezar — migrar a PostgreSQL si escala
- **Arquitectura**: Frontend/API/Worker separados — el inference es pesado y no debe bloquear la API
- **GPU**: El motor TTS requiere GPU para inferencia eficiente — considerar costos de infraestructura
<!-- GSD:project-end -->

<!-- GSD:stack-start source:codebase/STACK.md -->
## Technology Stack

## Languages
- Not yet determined — no application source code exists yet
- JavaScript (ES Modules) — used in `.opencode/plugins/graphify.js` for the OpenCode plugin system
## Runtime
- Python 3.14.3 — available on development machine (no project code uses it yet)
- Node.js v25.7.0 — available on development machine (used by `.opencode/` tooling)
- Bun 1.3.11 — available on development machine
- npm — used in `.opencode/` for plugin dependencies
- Lockfile: `.opencode/package-lock.json` present
## Frameworks
- None — project is in pre-development scaffold state
- None
- None
## Key Dependencies
- `@opencode-ai/plugin` 1.14.20 — OpenCode AI editor plugin SDK
- `@opencode-ai/sdk` — OpenCode AI SDK (transitive dependency)
- `effect` — Functional programming library (transitive dependency via OpenCode SDK)
- `msgpackr` / `msgpackr-extract` 3.0.3 — Binary serialization (transitive dependency)
- `uuid` — UUID generation (transitive dependency)
## Configuration
- No `.env` files present
- No environment configuration required yet
- No build configuration files present
- `opencode.json` — OpenCode AI editor configuration; registers the graphify plugin at `.opencode/plugins/graphify.js`
- `.opencode/.gitignore` — Excludes `node_modules`, `package.json`, `package-lock.json`, `bun.lock`, `.gitignore` from git
## Platform Requirements
- macOS (darwin-arm64) — current development platform
- Git — initialized repo, no remote configured
- OpenCode AI editor — configured via `opencode.json`
- Not yet determined
## Project State
- Branch: `main`
- Commits: None (empty repo)
- Remote: None configured
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

## Project Status
- `.git/` — version control
- `.opencode/` — opencode tooling with graphify plugin
- `.planning/` — GSD planning directory (empty)
- `AGENTS.md` — graphify configuration
- `opencode.json` — opencode configuration referencing `.opencode/plugins/graphify.js`
## Naming Patterns
- Files: `snake_case.py` (e.g., `tts_engine.py`, `qwen_client.py`)
- Directories: `snake_case` packages (e.g., `models/`, `services/`, `api/`)
- Functions: `snake_case` (e.g., `generate_speech`, `load_model`)
- Classes: `PascalCase` (e.g., `TTSEngine`, `QwenClient`)
- Constants: `UPPER_SNAKE_CASE` (e.g., `MAX_SAMPLE_RATE`, `DEFAULT_MODEL`)
- Variables: `snake_case`
## Code Style
- Not yet configured. No `.prettierrc`, `pyproject.toml`, `setup.cfg`, or `.editorconfig` found.
- **Recommendation:** Use `black` for auto-formatting with default settings (88-char line length).
- **Recommendation:** Use `isort` for import ordering.
- Not yet configured. No `.flake8`, `.pylintrc`, or `ruff` config found.
- **Recommendation:** Use `ruff` for fast linting (replaces flake8 + isort).
## Import Organization
## Error Handling
- Use custom exception hierarchy rooted in a base `VoxCraftError`
- Use specific exception types (e.g., `ModelLoadError`, `SynthesisError`, `ConfigError`)
- Prefer explicit exception handling over bare `except:` clauses
- Log errors with context before re-raising
## Logging
- Use Python's `logging` module with structured formatters
- Define log levels consistently: DEBUG for development, INFO for operation milestones, WARNING for recoverable issues, ERROR for failures
- Configure via dict config or `logging.config` (not basicConfig)
## Comments
- Use docstrings for all public modules, classes, and functions (Google or NumPy style)
- Keep comments focused on "why", not "what"
- Use type hints instead of comment-based type annotations
## Function Design
- **Recommendation:** Functions should do one thing. Target < 50 lines. Extract helpers for complex logic.
- **Recommendation:** Use type hints for all parameters and return values.
- **Recommendation:** Use dataclasses or Pydantic models for complex parameter groups.
- **Recommendation:** Use typed return values. Prefer explicit return types over `Any`.
## Module Design
- **Recommendation:** Use `__all__` in `__init__.py` to define public API.
- **Recommendation:** Keep implementation details private (prefix with `_`).
- **Recommendation:** Use `__init__.py` to re-export public API from submodules.
## Type Annotations
- Use Python 3.10+ type hint syntax (`list[str]` not `List[str]`, `X | Y` not `Union[X, Y]`)
- Use `Pydantic` for data validation where applicable
- Consider `mypy` or `pyright` for static type checking
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

## Pattern Overview
- No application code exists yet
- Project initialized with GSD (Getting Stuff Done) workflow tooling
- OpenCode plugin infrastructure in place for AI-assisted development
- Graphify knowledge graph integration configured but no graph generated yet (no source code to analyze)
## Layers
- Purpose: AI-assisted development environment setup
- Location: `.opencode/`, `opencode.json`
- Contains: OpenCode plugin system with Graphify integration
- Depends on: `@opencode-ai/plugin` (npm package)
- Used by: OpenCode CLI tool
- Purpose: Provide AI agents with project-specific context and rules
- Location: `AGENTS.md`
- Contains: Graphify knowledge graph usage rules
- Depends on: Graphify output at `graphify-out/`
## Data Flow
- None (no application state)
## Key Abstractions
- Purpose: Hook into OpenCode's tool execution lifecycle to inject knowledge graph context
- Examples: `.opencode/plugins/graphify.js`
- Pattern: Async factory function returning named hook handlers (`tool.execute.before`)
- Fires only once per session (`reminded` flag) to avoid repeated noise
- Checks for graph existence before injecting reminders
## Entry Points
- Location: `opencode.json`
- Triggers: OpenCode CLI startup
- Responsibilities: Loads Graphify plugin for AI-assisted development
## Error Handling
- Plugin uses graceful existence check (`existsSync`) before acting
- No application error handling patterns defined
## Cross-Cutting Concerns
## Project Intent (Inferred from Name)
- **Vox** — Voice, speech, sound
- **Craft** — Artesanía, construcción, diseño con cuidado y detalle
- A tool for forging worlds with voice: not just spoken text, but acoustically designing characters, environments, and emotions
- An immersive audio studio or fiction podcasting tool where voice is the hammer and anvil
- TTS with soul, not robotic: "craft" implies care, detail, craftsmanship
- Visual palette: sound palettes, waves turning into landscapes, voices woven like threads
<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->
## Project Skills

No project skills found. Add skills to any of: `.claude/skills/`, `.agents/skills/`, `.cursor/skills/`, or `.github/skills/` with a `SKILL.md` index file.
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->

<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
