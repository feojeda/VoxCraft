# Codebase Concerns

**Analysis Date:** 2026-04-25

## Tech Debt

**No application source code exists:**
- Issue: The project repository contains only tooling configuration (OpenCode + graphify plugin). Zero application source files, no build system, no dependency manifest for the actual project.
- Files: Root directory (missing `src/`, `app/`, `lib/`, or any source tree)
- Impact: All implementation must be created from scratch. No patterns or conventions have been established yet.
- Fix approach: Initialize the project with a proper scaffold including source directories, dependency manifest (`requirements.txt`, `pyproject.toml`, or `package.json`), and configuration files before starting feature work.

**No git commits:**
- Issue: The repository has been initialized (`git init` completed) but has zero commits. All current files are untracked.
- Files: Entire repository
- Impact: No version history, no rollback capability, no CI/CD possible.
- Fix approach: Create an initial commit with all existing configuration files before beginning development.

**No root-level `.gitignore`:**
- Issue: A `.gitignore` exists inside `.opencode/` but not at the project root. Build artifacts, `node_modules/`, `.env` files, IDE configs, and Python bytecode could accidentally be committed.
- Files: Missing `.gitignore` at project root
- Impact: Risk of committing secrets, build artifacts, or dependency directories.
- Fix approach: Create a root `.gitignore` with entries for `node_modules/`, `.env*`, `__pycache__/`, `.venv/`, `dist/`, `build/`, `.DS_Store`, and IDE-specific directories.

## Known Bugs

**Graphify plugin references non-existent output directory:**
- Symptoms: `AGENTS.md` instructs reading `graphify-out/GRAPH_REPORT.md` and the plugin checks for `graphify-out/graph.json`, but the `graphify-out/` directory does not exist.
- Files: `AGENTS.md:3`, `.opencode/plugins/graphify.js:12`
- Trigger: Any codebase query that follows AGENTS.md instructions will fail to find the referenced files.
- Workaround: The plugin gracefully handles this via `existsSync()` check. No runtime error, but the knowledge graph feature is inert.

## Security Considerations

**No `.env` or secrets management:**
- Risk: Once the project has application code, secrets (API keys, model endpoints, database credentials) will need a home. Currently no `.env.example`, no secrets management pattern, no `.gitignore` entry for `.env`.
- Files: Root directory (missing)
- Current mitigation: None
- Recommendations: Create `.env.example` with placeholder values, add `.env` to `.gitignore`, and document required environment variables before the first feature implementation.

**No dependency vulnerability scanning:**
- Risk: The `.opencode/` directory has a `package-lock.json` with dependencies that are not being audited.
- Files: `.opencode/package-lock.json`
- Current mitigation: None
- Recommendations: Add `npm audit` or similar scanning to CI once a pipeline is established.

## Performance Bottlenecks

**Not applicable yet** — no application code exists to analyze. Performance concerns should be re-evaluated after the first implementation phase.

## Fragile Areas

**Graphify plugin one-shot reminder:**
- Files: `.opencode/plugins/graphify.js:8-19`
- Why fragile: The `reminded` flag is set to `true` after the first bash tool call and never reset. This means the knowledge graph reminder is injected only once per session, regardless of whether the graph content is relevant to subsequent operations. If the first bash call is unrelated to codebase exploration, the reminder is wasted.
- Safe modification: The plugin is small and self-contained. Changes to the reminder logic (e.g., resetting per-file or per-task) would only affect `.opencode/plugins/graphify.js`.
- Test coverage: None (no tests exist for the plugin).

**OpenCode configuration tightly coupled to graphify:**
- Files: `opencode.json:3-5`
- Why fragile: The `plugin` array directly references `.opencode/plugins/graphify.js`. If the plugin file is moved or renamed without updating this config, the entire OpenCode plugin system breaks silently.
- Safe modification: Always update both `opencode.json` and the actual plugin file location simultaneously.

## Scaling Limits

**Not applicable yet** — no application code exists. Scaling concerns should be re-evaluated after architecture decisions are made.

## Dependencies at Risk

**@opencode-ai/plugin:**
- Risk: Pinned to version `1.14.20` in `.opencode/package.json`. This is a tooling dependency for the OpenCode AI assistant plugin system. If the API changes in future versions, the graphify plugin may break.
- Impact: Graphify knowledge graph reminders stop being injected into bash commands.
- Migration plan: Monitor `@opencode-ai/plugin` changelog. The plugin implementation is simple (22 lines) and unlikely to need significant changes.

## Missing Critical Features

**No project definition:**
- Problem: No `PROJECT.md`, no `README.md`, no `ROADMAP.md`. The project intent (TTS with Qwen models) is only inferred from the directory name `ttsQwen`.
- Blocks: Understanding project goals, scope, and technical requirements for anyone joining the project.

**No dependency manifest for the application:**
- Problem: No `requirements.txt`, `pyproject.toml`, `package.json` (at root), or equivalent for the actual application dependencies.
- Blocks: All development work.

**No build/run/test tooling:**
- Problem: No Makefile, no scripts, no CI/CD configuration, no test framework setup.
- Blocks: Iterative development, automated testing, deployment.

**No graphify knowledge graph:**
- Problem: `AGENTS.md` references `graphify-out/` which doesn't exist yet. The graphify tool needs source code to analyze.
- Blocks: Architecture-aware code navigation and querying.

## Test Coverage Gaps

**No tests exist:**
- What's not tested: Everything. Zero test files, zero test configuration, zero test framework.
- Files: Entire project
- Risk: Any code written without tests will have no regression safety net.
- Priority: High — establish test framework and write tests alongside first feature implementation.

---

*Concerns audit: 2026-04-25*
