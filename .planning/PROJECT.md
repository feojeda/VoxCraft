# ttsQwen

## What This Is

Aplicación web pública de text-to-speech (TTS) que permite a los usuarios generar audio a partir de texto, usando voces clonadas o predefinidas, con control de prosodia (SSML y emociones). Orientada a creadores de contenido que necesitan narraciones, audios para videos y podcasts.

## Core Value

Generar audio de alta calidad desde texto con la voz que el usuario elija (propia o predefinida), con control expresivo sobre prosodia y emoción.

## Requirements

### Validated

(Ninguno aún — se validará al shippear)

### Active

- [ ] Generar audio desde texto usando motor TTS (motor a definir vía investigación)
- [ ] Clonar voz del usuario a partir de una muestra de audio
- [ ] Catálogo de voces predefinidas para elegir
- [ ] Control de prosodia vía marcado SSML (énfasis, pausas, entonación)
- [ ] Control emocional (feliz, triste, enojado, neutro)
- [ ] Preview/reproducción del audio antes de descargar
- [ ] Descarga directa de archivos de audio (MP3, WAV)
- [ ] Procesamiento batch/bulk de múltiples textos
- [ ] Compartir audio generado via enlace
- [ ] Registro y login de usuarios (app pública)
- [ ] Gestión de voces del usuario (subir, listar, eliminar)

### Out of Scope

- Edición de audio avanzada (waveform editor) — fuera del alcance TTS, usar herramientas externas
- API pública para terceros — enfocarse primero en la app web
- Síntesis en tiempo real/streaming — batch es suficiente para v1
- Multi-idioma en v1 — empezar con español e inglés

## Context

- El nombre del proyecto (ttsQwen) sugiere uso de modelos Qwen, pero el motor TTS está abierto a investigación (Bark, XTTS, ChatTTS, Qwen2-Audio, etc.)
- El ecosistema ML/AI vive en Python (PyTorch), por lo que el backend de inferencia debe ser Python
- El ecosistema de modelos TTS open-source evoluciona rápido — la elección del motor es una decisión arquitectónica clave
- Los usuarios son creadores de contenido que no son expertos técnicos — la UI debe ser intuitiva
- La clonación de voz requiere muestras de audio de calidad — la app debe guiar al usuario

## Constraints

- **Stack Frontend**: React/Next.js — ecosistema amplio, buen DX
- **Stack Backend**: Python FastAPI — necesario para ML/PyTorch
- **Workers**: Celery + Redis — procesamiento asíncrono de generación de audio
- **Base de datos**: SQLite para empezar — migrar a PostgreSQL si escala
- **Arquitectura**: Frontend/API/Worker separados — el inference es pesado y no debe bloquear la API
- **GPU**: El motor TTS requiere GPU para inferencia eficiente — considerar costos de infraestructura

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| React + Python (FastAPI) | Python necesario para ecosistema ML; React para UI moderna | — Pending |
| Celery + Redis para workers | Generación de audio es pesada, necesita colas robustas | — Pending |
| SQLite como DB inicial | Simplicidad para v1, migración a PostgreSQL posible | — Pending |
| Motor TTS abierto a investigación | Ecosistema TTS evoluciona rápido, investigación definirá la mejor opción | — Pending |
| SSML + emociones para prosodia | Permite control expresivo sin requerir conocimiento técnico | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2025-04-25 after initialization*
