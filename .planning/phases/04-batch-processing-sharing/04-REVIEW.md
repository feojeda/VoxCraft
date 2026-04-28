---
phase: 04-batch-processing-sharing
reviewed: 2026-04-26T12:00:00Z
depth: standard
files_reviewed: 23
files_reviewed_list:
  - backend/app/models/batch.py
  - backend/app/models/share.py
  - backend/app/schemas/batch.py
  - backend/app/schemas/share.py
  - backend/app/models/job.py
  - backend/app/models/__init__.py
  - backend/app/schemas/__init__.py
  - backend/app/services/batch_service.py
  - backend/app/api/routes/batch.py
  - backend/app/main.py
  - backend/app/services/share_service.py
  - backend/app/api/routes/share.py
  - backend/app/api/routes/audio.py
  - frontend/src/lib/types.ts
  - frontend/src/lib/api-client.ts
  - frontend/src/components/batch-upload.tsx
  - frontend/src/app/batches/page.tsx
  - frontend/src/app/batches/[batchId]/page.tsx
  - frontend/src/components/share-button.tsx
  - frontend/src/app/share/[token]/page.tsx
  - frontend/src/components/top-nav.tsx
  - frontend/src/app/account/page.tsx
  - frontend/src/app/history/page.tsx
findings:
  critical: 0
  warning: 7
  info: 10
  total: 17
status: issues_found
---

# Phase 04: Code Review Report

**Reviewed:** 2026-04-26T12:00:00Z
**Depth:** standard
**Files Reviewed:** 23
**Status:** issues_found

## Summary

Phase 04 introduced batch processing (CSV upload, Celery dispatch, ZIP streaming) and public share links (secure tokens, unauthenticated audio serving) across backend models, services, API routes, and frontend UI components. The code is generally well-structured, follows project conventions, and correctly implements the planned security controls (token generation with `secrets`, auth-protected endpoints, ownership checks).

Key concerns center on **logic errors in the batch state machine**, **missing input validation on query parameters**, **blocking I/O inside async handlers**, and **frontend edge cases** (division by zero, inaccessible downloads for partial batches). No critical security vulnerabilities (injection, auth bypass, hardcoded secrets) were found.

## High Issues

### HR-01: Batch Status Logic Bug — Always "Completed" Regardless of Failures

**File:** `backend/app/services/batch_service.py:321-322`
**Issue:** When all items in a batch finish processing, the status is unconditionally set to `"completed"` even if some items failed. The `else` branch duplicates the `"completed"` string, making it dead code and preventing the state machine from reflecting partial or total failure.
**Fix:**
```python
if completed_count + failed_count == batch_db.total_items:
    batch_db.status = "completed" if failed_count == 0 else "failed"
```
*(Note: if the model should support a `"partial"` status, the `BatchJob` model definition must also be updated.)*

## Medium Issues

### ME-01: CSV Upload Returns 500 for Non-UTF-8 Files

**File:** `backend/app/api/routes/batch.py:41-44`
**Issue:** The endpoint only catches `ValueError` from `parse_csv_rows`. If the uploaded file is not valid UTF-8, `file_content.decode("utf-8-sig")` raises `UnicodeDecodeError`, which propagates as an unhandled 500 error instead of a clean 400 response.
**Fix:**
```python
    try:
        rows = batch_service.parse_csv_rows(content)
    except (ValueError, UnicodeDecodeError) as exc:
        raise HTTPException(status_code=400, detail=f"Invalid file: {exc}")
```

### ME-02: Blocking I/O in Async ZIP Generation

**File:** `backend/app/services/batch_service.py:421,430`
**Issue:** `os.path.exists()` is a blocking system call used inside an async function. With up to 100 files per batch, this can stall the event loop and degrade API responsiveness under load.
**Fix:** Use `aiofiles.os.path.exists` or run the check in a thread pool:
```python
import asyncio
# ...
if job.audio_mp3_path and await asyncio.to_thread(os.path.exists, job.audio_mp3_path):
```

### ME-03: Unvalidated Pagination Parameters in Batch List

**File:** `backend/app/api/routes/batch.py:61-62`
**Issue:** `skip` and `limit` accept any integer. A malicious client can request `limit=9999999`, causing excessive memory use and a potential DoS.
**Fix:** Add FastAPI `Query` constraints:
```python
skip: int = Query(0, ge=0),
limit: int = Query(20, ge=1, le=100),
```

### ME-04: Unvalidated Pagination Parameters in Share List

**File:** `backend/app/api/routes/share.py:63-64`
**Issue:** Same as ME-03 — `skip` and `limit` are unbounded.
**Fix:**
```python
skip: int = Query(0, ge=0),
limit: int = Query(50, ge=1, le=200),
```

### ME-05: Division by Zero in Batch Progress Calculation

**File:** `frontend/src/app/batches/[batchId]/page.tsx:198-200`
**Issue:** If a CSV with only a header row (0 data rows) is uploaded, `total_items` is 0. The progress calculation divides by zero, producing `NaN`, which invalidates the CSS width and breaks the progress bar display.
**Fix:**
```typescript
const progressPercent = batch && batch.total_items > 0
  ? Math.round((batch.completed_count / batch.total_items) * 100)
  : 0;
```

### ME-06: ZIP Download Inaccessible for Partially Failed Batches

**File:** `frontend/src/app/batches/[batchId]/page.tsx:273`
**Issue:** The download UI is gated on `isCompleted` (`status === "completed"`). If a batch finishes with some failed items (and the backend status bug HR-01 were fixed), the user would not see the download button even though `generate_zip` on the backend happily serves partial ZIPs as long as `completed_count > 0`.
**Fix:** Show the download section when the batch is no longer actively processing:
```typescript
const isDone = batch?.status === "completed" || batch?.status === "failed";
// ...
{isDone && batch?.completed_count > 0 && (
```

## Low Issues

### LO-01: Unvalidated Audio File Paths (Path Traversal)

**File:** `backend/app/api/routes/audio.py:44-52,65-84,96-122` and `backend/app/services/batch_service.py:421-435`
**Issue:** `job.audio_wav_path` and `job.audio_mp3_path` are read from the database and passed directly to `FileResponse` and `zipfile.ZipFile.write()` without verifying they reside inside the expected audio storage directory. If an attacker can manipulate these paths (e.g., via compromised worker or DB injection), arbitrary filesystem files can be served or bundled into ZIPs.
**Fix:** Validate paths against an allowed base directory before use:
```python
from pathlib import Path
AUDIO_DIR = Path("/app/audio_output")

resolved = Path(job.audio_mp3_path).resolve()
if not str(resolved).startswith(str(AUDIO_DIR)):
    raise HTTPException(status_code=404, detail="Invalid audio path")
```

### LO-02: Deprecated `datetime.utcnow()` Usage

**File:** `backend/app/services/batch_service.py:256,322` and `backend/app/services/share_service.py:94,117`
**Issue:** `datetime.utcnow()` is deprecated in Python 3.12+ (the dev environment runs 3.14.3). It returns a naive datetime, which can cause subtle timezone bugs.
**Fix:** Use timezone-aware datetimes:
```python
from datetime import datetime, timezone
# ...
now = datetime.now(timezone.utc)
```

### LO-03: Weak Type Constraint on Batch Download Format

**File:** `backend/app/schemas/batch.py:59`
**Issue:** The `format` field is typed as `str` with a comment instead of a constrained literal, allowing invalid values to pass schema validation.
**Fix:**
```python
from typing import Literal

class BatchDownloadRequest(BaseModel):
    format: Literal["mp3", "both"] = "mp3"
```

### LO-04: Unvalidated `format` Query Parameter

**File:** `backend/app/api/routes/batch.py:104`
**Issue:** The `format` query parameter accepts any string. While the service defaults safely to MP3-only for unknown values, the API should reject invalid inputs explicitly.
**Fix:** Add validation:
```python
format: Literal["mp3", "both"] = "mp3",
```

### LO-05: Internal Error Detail Leak in ZIP Generation

**File:** `backend/app/api/routes/batch.py:123`
**Issue:** The catch-all exception handler returns `str(exc)` in the 500 response body, which may expose internal file paths or implementation details to the client.
**Fix:** Log the full exception server-side and return a generic message:
```python
    except Exception:
        logger.exception("ZIP generation failed for batch %s", batch_id)
        raise HTTPException(status_code=500, detail="ZIP generation failed")
```

### LO-06: Unprotected `session.refresh` After Conditional Check

**File:** `backend/app/services/batch_service.py:264`
**Issue:** `session.refresh(batch_db)` is called outside the `if batch_db:` guard. If the batch row were deleted by a concurrent process, `batch_db` would be `None` and `refresh()` would raise `AttributeError`.
**Fix:** Move `refresh` inside the guard or add a null check:
```python
            if batch_db:
                # ... updates ...
                await session.commit()
                await session.refresh(batch_db)
            return batch_db
```

## Info Items

### IN-01: Debug Artifact in Production Code

**File:** `frontend/src/app/batches/[batchId]/page.tsx:188`
**Issue:** `console.error("ZIP download failed:", err);` remains in the component. Consider replacing with a structured logging utility or removing it.

### IN-02: Expiration Options Recomputed on Every Render

**File:** `frontend/src/components/share-button.tsx:57-59`
**Issue:** `days7` and `days30` are recalculated on every render using `new Date()`. While harmless, they should be defined as constants outside the component or wrapped in `useMemo` to guarantee stability.

### IN-03: Redundant Type Annotation in Map Callback

**File:** `frontend/src/app/account/page.tsx:71`
**Issue:** `(share: ShareLink)` is unnecessary because `sharesData` is already fully typed; TypeScript infers the element type automatically.

### IN-04: Local Import Inside Function Body

**File:** `backend/app/api/routes/share.py:30`
**Issue:** `from datetime import datetime` is declared inside `_build_share_response`. Move it to the top of the module for consistency.

---

_Reviewed: 2026-04-26T12:00:00Z_
_Reviewer: gsd-code-reviewer_
_Depth: standard_
