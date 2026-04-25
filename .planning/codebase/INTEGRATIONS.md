# External Integrations

**Analysis Date:** 2026-04-25

## APIs & External Services

**None configured yet.**

The project is in pre-development scaffold state. No application code exists that integrates with external APIs or services. Based on the project name `ttsQwen`, the following integrations are likely to be added during development:

- **Qwen / Alibaba Cloud APIs** — For LLM inference (text generation, chat)
- **Text-to-Speech API** — For audio synthesis (specific provider TBD)

## Data Storage

**Databases:**
- None configured

**File Storage:**
- Local filesystem only (no cloud storage integration)

**Caching:**
- None

## Authentication & Identity

**Auth Provider:**
- None configured

## Monitoring & Observability

**Error Tracking:**
- None

**Logs:**
- None

## CI/CD & Deployment

**Hosting:**
- Not determined — no deployment configuration

**CI Pipeline:**
- None — no `.github/`, `.gitlab-ci.yml`, or similar CI configuration

## Environment Configuration

**Required env vars:**
- None — no `.env` files or configuration files present

**Secrets location:**
- Not configured

## Webhooks & Callbacks

**Incoming:**
- None

**Outgoing:**
- None

## Tooling Integrations

**OpenCode AI Editor:**
- Plugin: `graphify` at `.opencode/plugins/graphify.js`
- Purpose: Injects knowledge graph reminders before bash tool calls in the OpenCode AI editor
- Config: `opencode.json` registers the plugin
- Trigger: When `graphify-out/graph.json` exists, prepends a reminder to read `graphify-out/GRAPH_REPORT.md`

**Graphify Knowledge Graph:**
- Expected output directory: `graphify-out/`
- Status: Not generated yet (directory does not exist)
- Purpose: Codebase analysis via AST parsing, producing clustered community structure

---

*Integration audit: 2026-04-25*
