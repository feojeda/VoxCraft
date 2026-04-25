# Architecture

**Analysis Date:** 2026-04-25

## Pattern Overview

**Overall:** Pre-development — tooling infrastructure only

**Key Characteristics:**
- No application code exists yet
- Project initialized with GSD (Getting Stuff Done) workflow tooling
- OpenCode plugin infrastructure in place for AI-assisted development
- Graphify knowledge graph integration configured but no graph generated yet (no source code to analyze)

## Layers

**No application layers exist yet.** The project name `ttsQwen` suggests a planned Text-to-Speech system using Qwen (Alibaba's LLM family), but no implementation code is present.

**Tooling/Infrastructure Layer:**
- Purpose: AI-assisted development environment setup
- Location: `.opencode/`, `opencode.json`
- Contains: OpenCode plugin system with Graphify integration
- Depends on: `@opencode-ai/plugin` (npm package)
- Used by: OpenCode CLI tool

**Agent Instructions Layer:**
- Purpose: Provide AI agents with project-specific context and rules
- Location: `AGENTS.md`
- Contains: Graphify knowledge graph usage rules
- Depends on: Graphify output at `graphify-out/`

## Data Flow

**No application data flow exists yet.**

**Development Tooling Flow:**

1. OpenCode CLI reads `opencode.json` and loads plugins from `.opencode/plugins/`
2. Graphify plugin (`graphify.js`) checks for existence of `graphify-out/graph.json`
3. If graph exists, plugin injects reminder before bash tool calls to read `graphify-out/GRAPH_REPORT.md`
4. AI agents read `AGENTS.md` for project-specific instructions

**State Management:**
- None (no application state)

## Key Abstractions

**OpenCode Plugin (`GraphifyPlugin`):**
- Purpose: Hook into OpenCode's tool execution lifecycle to inject knowledge graph context
- Examples: `.opencode/plugins/graphify.js`
- Pattern: Async factory function returning named hook handlers (`tool.execute.before`)
- Fires only once per session (`reminded` flag) to avoid repeated noise
- Checks for graph existence before injecting reminders

## Entry Points

**No application entry points exist yet.**

**Development Entry Point:**
- Location: `opencode.json`
- Triggers: OpenCode CLI startup
- Responsibilities: Loads Graphify plugin for AI-assisted development

## Error Handling

**Strategy:** Not yet established

**Patterns:**
- Plugin uses graceful existence check (`existsSync`) before acting
- No application error handling patterns defined

## Cross-Cutting Concerns

**Logging:** Not yet established

**Validation:** Not yet established

**Authentication:** Not yet established

## Project Intent (Inferred from Name)

The project name `ttsQwen` suggests:
- **TTS** — Text-to-Speech synthesis
- **Qwen** — Integration with Alibaba's Qwen model family
- Expected to involve AI/ML pipeline for converting text input to speech output
- No implementation exists to confirm this intent

---

*Architecture analysis: 2026-04-25*
