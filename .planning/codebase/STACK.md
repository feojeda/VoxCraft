# Technology Stack

**Analysis Date:** 2026-04-25

## Languages

**Primary:**
- Not yet determined — no application source code exists yet

**Secondary:**
- JavaScript (ES Modules) — used in `.opencode/plugins/graphify.js` for the OpenCode plugin system

## Runtime

**Environment:**
- Python 3.14.3 — available on development machine (no project code uses it yet)
- Node.js v25.7.0 — available on development machine (used by `.opencode/` tooling)
- Bun 1.3.11 — available on development machine

**Package Manager:**
- npm — used in `.opencode/` for plugin dependencies
- Lockfile: `.opencode/package-lock.json` present

## Frameworks

**Core:**
- None — project is in pre-development scaffold state

**Testing:**
- None

**Build/Dev:**
- None

## Key Dependencies

**Tooling Infrastructure (`.opencode/`):**
- `@opencode-ai/plugin` 1.14.20 — OpenCode AI editor plugin SDK
- `@opencode-ai/sdk` — OpenCode AI SDK (transitive dependency)
- `effect` — Functional programming library (transitive dependency via OpenCode SDK)
- `msgpackr` / `msgpackr-extract` 3.0.3 — Binary serialization (transitive dependency)
- `uuid` — UUID generation (transitive dependency)

## Configuration

**Environment:**
- No `.env` files present
- No environment configuration required yet

**Build:**
- No build configuration files present

**Editor/Tooling:**
- `opencode.json` — OpenCode AI editor configuration; registers the graphify plugin at `.opencode/plugins/graphify.js`
- `.opencode/.gitignore` — Excludes `node_modules`, `package.json`, `package-lock.json`, `bun.lock`, `.gitignore` from git

## Platform Requirements

**Development:**
- macOS (darwin-arm64) — current development platform
- Git — initialized repo, no remote configured
- OpenCode AI editor — configured via `opencode.json`

**Production:**
- Not yet determined

## Project State

**Status:** Pre-development scaffold

The repository contains only tooling infrastructure (OpenCode AI plugin system with graphify knowledge graph integration). No application source code, no package manifests for the application itself, no build configuration, and no dependencies beyond the OpenCode tooling.

The project name `ttsQwen` suggests a Text-to-Speech application using Qwen (Alibaba's LLM family), but no implementation code exists yet.

**Git:**
- Branch: `main`
- Commits: None (empty repo)
- Remote: None configured

---

*Stack analysis: 2026-04-25*
