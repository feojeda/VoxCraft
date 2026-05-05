# VoxCraft

**Forja mundos con tu voz.**

[Read in English](README.md)

VoxCraft es una aplicacion web de text-to-speech (TTS) que genera audio de alta calidad a partir de texto, usando voces clonadas o predefinidas, con control expresivo de prosodia (emociones, velocidad, instrucciones de estilo). Pensada para creadores de contenido que necesitan narraciones, audios para videos y podcasts.

---

## Funcionalidades

- **Sintesis de voz** — Genera audio a partir de texto con 9 voces predefinidas (ingles, chino, japones, coreano)
- **Clonacion de voz** — Clona cualquier voz a partir de una muestra de 3 segundos
- **Diseno de voz** — Crea voces personalizadas desde descripciones en lenguaje natural ("Masculino, 30s, profunda y calida")
- **Presets de emocion** — Feliz, triste, enojado, neutral, susurro
- **Control de velocidad** — Velocidad ajustable (0.5x a 2.0x)
- **Prosodia personalizada** — Instrucciones de estilo en lenguaje natural ("Habla lentamente con tono melancolico")
- **Diccionario de pronunciacion** — Corrige nombres de marcas y terminos tecnicos mal pronunciados
- **Presets de voz** — Guarda y reutiliza configuraciones de voz + emocion + velocidad
- **Procesamiento por lotes** — Sube archivos CSV para generar cientos de clips de audio a la vez
- **Compartir** — Genera enlaces publicos para compartir clips de audio
- **Cuentas de usuario** — Registro, login, biblioteca de voces personal e historial
- **10 idiomas** — Espanol, ingles, chino, frances, aleman, italiano, japones, coreano, portugues, ruso

---

## Arquitectura

VoxCraft **no ejecuta** el modelo TTS por si mismo. Funciona como una capa de frontend + API que redirige las peticiones de inferencia a un servidor TTS externo que ejecuta [Qwen3-TTS](https://github.com/qwenlm/qwen3-tts).

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│                  │     │                  │     │                 │
│   Frontend       │────▶│   Backend API    │────▶│  Servidor TTS   │
│   Next.js        │     │   FastAPI        │     │  Qwen3-TTS      │
│   puerto 3005    │     │   puerto 8001    │     │  puerto 8000    │
│                  │     │                  │     │  (requiere GPU) │
└─────────────────┘     └──────┬───────────┘     └─────────────────┘
                               │
                               ▼
                        ┌──────────────┐
                        │    Redis     │
                        │  (broker     │
                        │   Celery)    │
                        │  puerto 6379 │
                        └──────────────┘
```

| Componente | Tecnologia | Funcion |
|-----------|-----------|---------|
| Frontend | Next.js 15 + React 19 + Tailwind CSS | Interfaz web |
| Backend API | FastAPI (Python 3.12) | API REST, gestion de usuarios, orquestacion de jobs |
| Celery Worker | Celery + Redis | Procesamiento asincrono de jobs TTS |
| Servidor TTS | Qwen3-TTS (externo) | Motor de inferencia en GPU |
| Base de datos | SQLite (dev) / PostgreSQL (prod) | Usuarios, jobs, voces, presets |

### Como funciona la inferencia

1. El usuario envia texto + configuracion de voz desde la interfaz web
2. El frontend llama al Backend API (`POST /api/generate`)
3. La API crea un job en la base de datos y lo encola en Celery via Redis
4. El Celery worker toma el job y envia una peticion HTTP al servidor TTS externo
5. El servidor TTS ejecuta la inferencia de Qwen3-TTS en GPU y devuelve audio WAV
6. El worker guarda el archivo WAV y lo convierte a MP3 via FFmpeg
7. El frontend consulta el estado del job y muestra el reproductor de audio

### Endpoints del servidor TTS

El servidor TTS externo debe exponer una API compatible con OpenAI con estos endpoints:

| Endpoint | Modelo | Funcion |
|----------|-------|---------|
| `POST /v1/audio/speech` | `Qwen/Qwen3-TTS-12Hz-1.7B-CustomVoice` | Sintesis con voz predefinida + emocion |
| `POST /v1/audio/voice-design` | `Qwen/Qwen3-TTS-12Hz-1.7B-VoiceDesign` | Crear voz desde descripcion de texto |
| `POST /v1/audio/voice-clone` | `Qwen/Qwen3-TTS-12Hz-1.7B-Base` | Clonar voz desde audio de referencia |
| `POST /v1/audio/voice-clone/prompt` | `Qwen/Qwen3-TTS-12Hz-1.7B-Base` | Pre-computar prompt de clonacion para reutilizar |
| `POST /v1/audio/voice-clone/generate` | `Qwen/Qwen3-TTS-12Hz-1.7B-Base` | Sintetizar usando prompt de clonacion pre-computado |

---

## Requisitos

- **Python 3.12+** con el gestor de paquetes [`uv`](https://docs.astral.sh/uv/)
- **Node.js 20+** con [`pnpm`](https://pnpm.io/)
- **Redis** — `redis-server` nativo o via gestor de paquetes
- **FFmpeg** — para conversion de formatos de audio
- **Un servidor TTS corriendo** — Qwen3-TTS con API compatible OpenAI (ver [Configuracion del servidor TTS](#configuracion-del-servidor-tts))

---

## Inicio Rapido

### Linux (Ubuntu/Debian)

```bash
# 1. Clonar el repositorio
git clone https://github.com/feojeda/VoxCraft.git
cd VoxCraft

# 2. Ejecutar setup (instala todas las dependencias, crea .env)
./scripts/setup.sh

# 3. Editar .env y apuntar al servidor TTS
#    TTS_SERVER_URL=http://127.0.0.1:8000
#    TTS_SERVER_API_KEY=dummy

# 4. Iniciar todos los servicios
./scripts/start-dev.sh

# 5. Abrir en el navegador
#    http://localhost:3005
```

### Instalacion manual (cualquier SO)

```bash
# 1. Clonar el repositorio
git clone https://github.com/feojeda/VoxCraft.git
cd VoxCraft

# 2. Copiar configuracion de entorno
cp .env.example .env
```

#### Backend

```bash
cd backend

# Crear entorno virtual e instalar dependencias
uv venv .venv --python 3.12
uv pip install -r requirements.txt --python .venv/bin/python

# Iniciar servidor API (puerto 8001)
.venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload

# En otra terminal — iniciar Celery worker
.venv/bin/celery -A workers.celery_app worker --loglevel=info --queues=tts --concurrency=1
```

#### Frontend

```bash
cd frontend

# Instalar dependencias
pnpm install

# Iniciar servidor de desarrollo (puerto 3005)
pnpm dev
```

#### Redis

**Linux:**
```bash
sudo apt-get install -y redis-server
sudo systemctl start redis-server
```

**macOS:**
```bash
brew install redis
brew services start redis
```

**Windows:** Ver [Instalacion en Windows](#instalacion-en-windows) mas abajo.

---

## Instalacion en Windows

Windows requiere pasos adicionales ya que el proyecto fue disennado para sistemas Unix.

### 1. Instalar dependencias

- **Python 3.12**: Descargar desde [python.org](https://www.python.org/downloads/)
- **Node.js 20+**: Descargar desde [nodejs.org](https://nodejs.org/)
- **pnpm**: `npm install -g pnpm`
- **uv**: `pip install uv` o seguir la [documentacion de uv](https://docs.astral.sh/uv/getting-started/installation/)
- **Redis**: Usar [Memurai](https://www.memurai.com/) o ejecutar Redis via WSL

**Opcion A: WSL (recomendado)**

La forma mas facil en Windows es usar WSL (Windows Subsystem for Linux):

```bash
wsl --install
# Luego seguir las instrucciones de Inicio Rapido para Linux dentro de WSL
```

**Opcion B: Windows nativo**

```powershell
# Alternativa de Redis: instalar Memurai o usar WSL para Redis

# Backend
cd backend
uv venv .venv --python 3.12
uv pip install -r requirements.txt --python .venv\Scripts\python.exe

# Iniciar API
.venv\Scripts\uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload

# Iniciar worker (otra terminal)
.venv\Scripts\celery -A workers.celery_app worker --loglevel=info --queues=tts --concurrency=1

# Frontend (otra terminal)
cd frontend
pnpm install
pnpm dev
```

> **Nota:** Los scripts de shell (`scripts/*.sh`) estan disennados para bash. En Windows, usa WSL, Git Bash, o ejecuta cada servicio manualmente como se muestra arriba.

### 2. FFmpeg en Windows

Descargar desde [ffmpeg.org](https://ffmpeg.org/download.html) y agregar al PATH. Necesario para la conversion WAV a MP3.

---

## Configuracion

Toda la configuracion se hace via el archivo `.env` (copiar de `.env.example`).

### Variables principales

| Variable | Default | Descripcion |
|----------|---------|-------------|
| `TTS_SERVER_URL` | `http://127.0.0.1:8000` | **URL de tu servidor Qwen3-TTS** |
| `TTS_SERVER_API_KEY` | `dummy` | API key para el servidor TTS |
| `DATABASE_URL` | `sqlite+aiosqlite:///./voxcraft.db` | String de conexion a la base de datos |
| `REDIS_URL` | `redis://localhost:6379/0` | URL del broker Redis |
| `CELERY_BROKER_URL` | `redis://localhost:6379/0` | Broker de mensajes de Celery |
| `CELERY_RESULT_BACKEND` | `redis://localhost:6379/1` | Almacenamiento de resultados de Celery |
| `CORS_ORIGINS` | `["http://localhost:3005"]` | Origines permitidos del frontend |
| `SECRET_KEY` | `change-me-in-production` | Clave de firma JWT |
| `AUDIO_OUTPUT_DIR` | `./audio_output` | Directorio donde se guarda el audio generado |

### Apuntar a un servidor TTS diferente

Editar `.env` y cambiar `TTS_SERVER_URL`:

```env
# Servidor local
TTS_SERVER_URL=http://127.0.0.1:8000

# Servidor remoto
TTS_SERVER_URL=http://192.168.1.100:8000

# Servidor con API key
TTS_SERVER_URL=https://tts-api.ejemplo.com
TTS_SERVER_API_KEY=sk-tu-clave-aqui
```

Luego reiniciar el Celery worker (la API se recarga automaticamente):

```bash
./scripts/stop-dev.sh
./scripts/start-dev.sh
```

---

## Configuracion del servidor TTS

VoxCraft requiere un servidor TTS externo ejecutando los modelos Qwen3-TTS. Este **no esta incluido** en este repositorio — es un servicio separado.

### Que necesitas

- Una maquina con una **GPU NVIDIA** (recomendado: 6+ GB VRAM)
- Python 3.12+
- El paquete `qwen-tts` o un framework de serving como vLLM/SGLang

### Instalacion rapida

```bash
# Instalar Qwen3-TTS
pip install qwen-tts
pip install flash-attn --no-build-isolation

# Iniciar el servidor compatible con OpenAI (ejemplo — ajusta segun tu configuracion)
# El servidor debe escuchar en el puerto configurado en TTS_SERVER_URL
python -m qwen_tts.server --host 0.0.0.0 --port 8000
```

Consulta la [documentacion de Qwen3-TTS](https://github.com/qwenlm/qwen3-tts) para instrucciones detalladas de instalacion y requisitos de GPU.

### Verificar que el servidor TTS esta corriendo

```bash
# Health check
curl http://127.0.0.1:8000/health

# Listar modelos disponibles
curl http://127.0.0.1:8000/v1/models

# Probar sintesis
curl -X POST http://127.0.0.1:8000/v1/audio/speech \
  -H "Content-Type: application/json" \
  -d '{"model":"Qwen/Qwen3-TTS-12Hz-1.7B-CustomVoice","input":"Hola mundo","voice":"ryan","response_format":"wav"}' \
  -o test.wav
```

---

## Referencia de API

Una vez corriendo, la documentacion interactiva completa esta disponible en:

- **Swagger UI**: http://localhost:8001/docs
- **ReDoc**: http://localhost:8001/redoc

### Endpoints principales

| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| `POST` | `/api/auth/register` | Crear cuenta |
| `POST` | `/api/auth/login` | Login (establece cookie JWT) |
| `POST` | `/api/auth/logout` | Cerrar sesion |
| `GET` | `/api/auth/me` | Perfil del usuario actual |
| `POST` | `/api/generate` | Crear job de TTS |
| `GET` | `/api/jobs/{id}` | Consultar estado del job |
| `GET` | `/api/voices/predefined` | Listar voces predefinidas |
| `POST` | `/api/voices` | Subir voz clonada |
| `GET` | `/api/voices` | Listar voces clonadas del usuario |
| `PATCH` | `/api/voices/{id}` | Renombrar voz clonada |
| `DELETE` | `/api/voices/{id}` | Eliminar voz clonada |
| `GET` | `/api/audio/{id}/wav` | Descargar audio WAV |
| `GET` | `/api/audio/{id}/mp3` | Descargar audio MP3 |
| `GET` | `/api/history` | Listar historial de generacion |
| `DELETE` | `/api/history/{id}` | Eliminar item del historial |
| `GET` | `/api/presets` | Listar presets de voz |
| `POST` | `/api/presets` | Crear preset de voz |
| `DELETE` | `/api/presets/{id}` | Eliminar preset |
| `GET` | `/api/pronunciation` | Listar entradas de pronunciacion |
| `POST` | `/api/pronunciation` | Agregar regla de pronunciacion |
| `DELETE` | `/api/pronunciation/{id}` | Eliminar regla |
| `POST` | `/api/batches` | Subir CSV para procesamiento por lotes |
| `GET` | `/api/batches/{id}` | Obtener estado del lote |
| `GET` | `/api/batches/{id}/download` | Descargar lote como ZIP |
| `POST` | `/api/shares` | Crear enlace de compartir |
| `GET` | `/api/shares/public/{token}` | Pagina publica de compartir |
| `DELETE` | `/api/shares/{id}` | Revocar enlace de compartir |

---

## Voces predefinidas

| Voz | Idioma | Genero | Estilo |
|-----|--------|--------|--------|
| Vivian | Chino | Femenino | Calida y expresiva |
| Serena | Ingles | Femenino | Clara y natural |
| Ryan | Ingles | Masculino | Profesional y calido |
| Aiden | Ingles | Masculino | Joven y energico |
| Dylan | Ingles | Masculino | Profundo y resonante |
| Eric | Ingles | Masculino | Calmo y autoritario |
| Anna | Japones | Femenino | Suave y precisa |
| Sohee | Coreano | Femenino | Brillante y amigable |
| Uncle Fu | Chino | Masculino | Sabio y experimentado |

---

## Desarrollo

### Scripts

| Script | Descripcion |
|--------|-------------|
| `./scripts/setup.sh` | Setup inicial: instala todas las dependencias, crea `.env` |
| `./scripts/start-dev.sh` | Inicia todos los servicios (Redis + API + Worker + Frontend) |
| `./scripts/start-dev.sh backend` | Inicia solo Redis + API + Worker |
| `./scripts/start-dev.sh frontend` | Inicia solo el Frontend |
| `./scripts/stop-dev.sh` | Detiene todos los servicios |
| `./scripts/stop-dev.sh keep` | Detiene procesos pero mantiene Redis corriendo |
| `./scripts/test-pipeline.sh` | Test de integracion end-to-end del pipeline |

### Puertos

| Servicio | Puerto |
|----------|--------|
| Frontend | 3005 |
| Backend API | 8001 |
| Servidor TTS | 8000 (externo) |
| Redis | 6379 |

### Logs

```bash
tail -f .dev-logs/api.log       # Backend API
tail -f .dev-logs/worker.log    # Celery worker
tail -f .dev-logs/frontend.log  # Next.js dev server
```

---

## Stack Tecnologico

| Capa | Tecnologia |
|------|-----------|
| Frontend | Next.js 15, React 19, TypeScript, Tailwind CSS 4, Zustand, TanStack Query, WaveSurfer.js |
| Backend | FastAPI, SQLAlchemy 2.0 (async), Pydantic, Celery, Redis |
| Auth | Cookies JWT, hashing de contrasenas con bcrypt |
| Base de datos | SQLite (dev) / PostgreSQL (prod) via migraciones Alembic |
| Audio | FFmpeg (WAV a MP3), soundfile |
| Motor TTS | Qwen3-TTS (externo, requiere GPU) |

---

## Licencia

Este proyecto esta licenciado bajo la licencia Apache 2.0. El motor TTS (Qwen3-TTS) tambien es Apache 2.0.
