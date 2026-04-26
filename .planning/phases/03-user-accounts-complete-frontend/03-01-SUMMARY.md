---
phase: 03-user-accounts-complete-frontend
plan: 01
status: complete
completed: "2026-04-26"
---

# Plan 03-01 Summary: Backend Authentication Foundation

## What Was Built

The entire backend authentication layer: user model, JWT-based login/registration, password hashing, and enforcement of authentication on all existing API routes. Also added user ownership fields to the Job model so history can be filtered per-user.

## Tasks Completed

### Task 1: Install dependencies and create auth core modules
- Added `passlib[bcrypt]`, `python-jose[cryptography]`, and `email-validator` to `requirements.txt`
- Added `SECRET_KEY` and `ACCESS_TOKEN_EXPIRE_DAYS` to `backend/app/config.py`
- Created `backend/app/core/security.py` with bcrypt password hashing and JWT encode/decode utilities
- Created `backend/app/models/user.py` with SQLAlchemy `User` model (email, password_hash, timestamps)
- Exported `User` from `backend/app/models/__init__.py`
- Created `backend/app/schemas/auth.py` with Pydantic schemas for register, login, and user response

### Task 2: Build auth router with register, login, and me endpoints
- Created `backend/app/api/routes/auth.py` with:
  - `POST /api/auth/register` — creates user, hashes password with bcrypt, auto-sets JWT cookie
  - `POST /api/auth/login` — validates credentials, sets httpOnly `access_token` cookie (7 days, SameSite=Lax)
  - `POST /api/auth/logout` — clears the auth cookie
  - `GET /api/auth/me` — returns current user from decoded JWT cookie
- Wired auth router into `backend/app/main.py` under `/api` prefix

### Task 3: Protect all existing API routes and add user ownership to jobs
- Updated `backend/app/api/deps.py` with `get_current_user` dependency that reads and validates the JWT cookie
- Added `user_id` and `voice_name` columns to `backend/app/models/job.py`
- Updated `backend/app/services/job_manager.py` to accept `user_id` and `voice_name` in `create_job()`
- Protected all API routes:
  - `tts.py` — `create_tts_job` and `get_job_status` require auth; jobs are created with `user_id` and a computed `voice_name`
  - `voices.py` — all voice endpoints (except predefined list) require auth and filter by `current_user.id`
  - `pronunciation.py` — all endpoints require auth and filter by `current_user.id`
  - `audio.py` — both audio serving endpoints require auth and verify `job.user_id == current_user.id`
- Fixed pre-existing dependency-injection bug in `voices.py` and `pronunciation.py` where `db: AsyncSession = get_db()` was used instead of `Depends(get_db)`

## Key Decisions

- **JWT in httpOnly cookie** rather than localStorage — mitigates XSS token theft (threat T-03-07)
- **bcrypt 4.0.1** pinned for passlib compatibility (bcrypt 5.x has breaking API changes)
- **SameSite=Lax, Secure=False** for local development; production should set Secure=True
- **voice_name resolution** — cloned voice names take precedence, then speaker catalog names, then mode labels
- **404 on ownership mismatch** — all endpoints return 404 (not 403) when a resource exists but belongs to another user, preventing information leakage

## Files Created

- `backend/app/core/security.py`
- `backend/app/models/user.py`
- `backend/app/schemas/auth.py`
- `backend/app/api/routes/auth.py`

## Files Modified

- `backend/requirements.txt`
- `backend/app/config.py`
- `backend/app/models/__init__.py`
- `backend/app/models/job.py`
- `backend/app/services/job_manager.py`
- `backend/app/api/deps.py`
- `backend/app/api/routes/tts.py`
- `backend/app/api/routes/voices.py`
- `backend/app/api/routes/pronunciation.py`
- `backend/app/api/routes/audio.py`
- `backend/app/main.py`

## Verification

- Auth utilities import and work correctly (password hash + verify, JWT encode + decode)
- FastAPI app loads all 23 routes without errors
- All protected routes enforce authentication via `get_current_user` dependency

## Self-Check

- [x] All tasks executed
- [x] Each task committed individually
- [x] Auth endpoints exist and are mounted
- [x] No modifications to shared orchestrator artifacts
