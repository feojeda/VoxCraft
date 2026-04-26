# GSD OpenCode Issue: Skills Path Hardcoded to ~/.claude/

## Problema

`~/.config/opencode/get-shit-done/bin/lib/init.cjs` línea 1605:

```js
const globalSkillsBase = path.join(os.homedir(), '.claude', 'skills');
```

Hardcodea `~/.claude/skills/` como directorio de skills globales para TODOS los runtimes, sin discriminar. Esto causa que:

1. Las skills de GSD se lean desde `~/.claude/skills/` (directorio de Claude Code) incluso cuando el runtime es opencode
2. El path `~/.claude/` se inyecta en el system prompt del agente, confundiendo al modelo
3. El instalador (`install.js`) YA discrimina por runtime para commands y agents (usa path replacement), pero `init.cjs` no lo hace para skills

## Rutas afectadas en init.cjs

- Línea 1605: `globalSkillsBase = ~/.claude/skills`
- Línea 1723-1724: skills discovery local: `.claude/skills`
- Línea 1753-1754: skills discovery global: `~/.claude/skills`
- Línea 1765-1766: GSD skills: `~/.claude/get-shit-done/skills`
- Línea 1772-1773: GSD commands legacy: `~/.claude/commands/gsd`

## Comparación con el instalador

El instalador (`install.js`) SÍ hace lo correcto:
- Commands → `~/.config/opencode/command/gsd-*.md` (flat)
- Agents → `~/.config/opencode/agents/gsd-*.md` (con path replacement de `.claude`)
- get-shit-done → `~/.config/opencode/get-shit-done/` (con path replacement)
- Skills → NO instala para opencode (solo usa `command/`)

Pero `init.cjs` (el runtime) nunca recibe el memo y busca skills en `~/.claude/skills/`.

## Fix esperado

`init.cjs` debería resolver el directorio de skills según el runtime detectado, igual que `install.js` ya hace:

```js
// En vez de:
const globalSkillsBase = path.join(os.homedir(), '.claude', 'skills');

// Debería ser algo como:
const runtime = detectRuntime(); // opencode, claude, codex, etc.
const skillsDirs = {
  claude: path.join(os.homedir(), '.claude', 'skills'),
  opencode: path.join(os.homedir(), '.config', 'opencode', 'skills'),
  kilo: path.join(os.homedir(), '.config', 'kilo', 'skills'),
  // etc.
};
const globalSkillsBase = skillsDirs[runtime] || skillsDirs.claude;
```

## Versión afectada

Confirmado en GSD v1.38.4 (2026-04-25).
