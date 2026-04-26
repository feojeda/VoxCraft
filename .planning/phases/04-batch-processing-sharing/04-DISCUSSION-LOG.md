# Phase 4: Batch Processing & Sharing - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-26
**Phase:** 04-batch-processing-sharing
**Areas discussed:** Batch input format & structure, Batch progress & results display, ZIP download contents & timing, Public share links

---

## Batch Input Format & Structure

| Option | Description | Selected |
|--------|-------------|----------|
| Two-column CSV: text,voice | Each row has its own text and voice identifier. More flexible parsing. | ✓ |
| Single-column CSV: text only | All entries use the same voice selected on the generation page. Simpler. | |

**User's choice:** Two-column CSV: text,voice
**Notes:** Each row specifies its own voice. User wanted flexibility for mixed-voice batches.

---

| Option | Description | Selected |
|--------|-------------|----------|
| Header row required | First row must be 'text,voice'. Parser validates headers. | ✓ |
| No header row, positional only | First column is always text, second is always voice. | |
| Auto-detect headers | Parser tries to detect if first row looks like headers. | |

**User's choice:** Header row required
**Notes:** More forgiving for users exporting from spreadsheets.

---

| Option | Description | Selected |
|--------|-------------|----------|
| 50 entries max | Reasonable limit for short video scripts. | |
| 100 entries max | Good for longer content series or audiobook chapters. | ✓ |
| You decide | Let planner choose based on GPU constraints. | |

**User's choice:** 100 entries max
**Notes:** Good balance for power users doing longer content series.

---

| Option | Description | Selected |
|--------|-------------|----------|
| Reject entire batch with error report | No jobs created. User gets detailed error report. | |
| Accept valid rows, skip invalid ones | Create jobs only for valid rows. Show warning. | |
| Create jobs for all rows, mark invalid as failed | Every row becomes a job; invalid ones immediately fail. | ✓ |

**User's choice:** Create jobs for all rows, mark invalid as failed
**Notes:** Simplest backend logic; batch continues processing.

---

## Batch Progress & Results Display

| Option | Description | Selected |
|--------|-------------|----------|
| Table view with per-row status | Compact, scannable rows with status badges. | |
| Card list (like History page) | Vertical stack of cards. Familiar but takes more space. | |
| Hybrid: table during processing, cards for completed | Table while batch runs; cards for completed items. | ✓ |

**User's choice:** Hybrid: table during processing, cards for completed
**Notes:** Optimized for each state — compact during processing, rich for completed.

---

| Option | Description | Selected |
|--------|-------------|----------|
| Overall batch progress bar + count | Single progress bar showing "34 of 100 completed". | ✓ |
| Per-item status with overall summary | Each row shows its own status plus summary header. | |
| Both: overall bar + per-item status | Most informative but potentially noisy. | |

**User's choice:** Overall batch progress bar + count
**Notes:** Simple, scannable, matches existing inline progress pattern.

---

| Option | Description | Selected |
|--------|-------------|----------|
| Individual replay + download per item | Each completed row has its own play button and download links. | ✓ |
| ZIP download only | No individual playback in batch view. | |
| Individual replay only, ZIP for downloads | Preview individual items but download only via ZIP. | |

**User's choice:** Individual replay + download per item
**Notes:** Most flexible — users can preview before downloading ZIP.

---

| Option | Description | Selected |
|--------|-------------|----------|
| Integrated into History page | Batch jobs appear alongside single generations. | |
| Separate /batches page | Dedicated page for batch jobs. | |
| Both: batch summary in History, detail on /batches | History shows summary card linking to /batches detail. | ✓ |

**User's choice:** Both: batch summary in History, detail on /batches
**Notes:** Most flexible navigation pattern.

---

## ZIP Download Contents & Timing

| Option | Description | Selected |
|--------|-------------|----------|
| Pre-generate when batch completes | ZIP built automatically; instant download. | |
| On-demand when user clicks download | ZIP built only when requested. | ✓ |
| You decide | Planner chooses based on constraints. | |

**User's choice:** On-demand when user clicks download
**Notes:** No extra storage needed; user waits a few seconds.

---

| Option | Description | Selected |
|--------|-------------|----------|
| MP3 only | Smaller files, faster download. | |
| Both MP3 and WAV | Two subfolders inside ZIP. | |
| User chooses at download time | Dropdown before download. | ✓ |

**User's choice:** User chooses at download time
**Notes:** Most flexible; adds one click to the flow.

---

| Option | Description | Selected |
|--------|-------------|----------|
| Index-based: 001.mp3, 002.mp3 | Simple, guaranteed unique. | |
| Text preview: first_20_chars_of_text.mp3 | Self-documenting but may collide. | |
| Both: index prefix + text preview | Preserves order and is self-documenting. | ✓ |

**User's choice:** Both: index prefix + text preview
**Notes:** 001_first_20_chars_of_text.mp3 format.

---

| Option | Description | Selected |
|--------|-------------|----------|
| Include manifest.csv | CSV mapping filenames to original text and voice. | ✓ |
| No manifest — files speak for themselves | ZIP contains only audio files. | |
| Include README.txt with summary only | Simple text file with counts and date. | |

**User's choice:** Include manifest.csv
**Notes:** Helps users track what each audio file contains.

---

## Public Share Links

| Option | Description | Selected |
|--------|-------------|----------|
| Permanent token-based URL | Link works forever unless revoked. | |
| Expiring signed URL | Auto-expires after set period. | |
| Both: permanent link with optional expiration | Default permanent; user can set expiration. | ✓ |

**User's choice:** Both: permanent link with optional expiration
**Notes:** Most flexible; default is permanent.

---

| Option | Description | Selected |
|--------|-------------|----------|
| Audio player only | Minimal page, no info leakage. | |
| Audio player + text + voice name | More context for listeners. | |
| Audio player + text + voice name + app branding | Full share page with CTA for marketing. | ✓ |

**User's choice:** Audio player + text + voice name + app branding
**Notes:** Best for marketing/virality; includes "Generate your own" CTA.

---

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, full revoke control | Users see all shares in Account settings and can revoke. | ✓ |
| No revoke — links are permanent once created | Simpler; must delete generation to stop sharing. | |
| You decide | Planner decides based on complexity. | |

**User's choice:** Yes, full revoke control
**Notes:** Users can manage shares from Account settings.

---

| Option | Description | Selected |
|--------|-------------|----------|
| Any completed generation (single + batch items) | Share button on every completed history/batch card. | ✓ |
| Single generations only, not individual batch items | Batch results are private by default. | |
| Any completed generation + entire batch ZIP | Can share individual audios or whole batch ZIP. | |

**User's choice:** Any completed generation (single + batch items)
**Notes:** Most flexible; share button appears everywhere.

---

## Agent's Discretion

- Exact CSV parsing library and validation logic
- Batch database schema (BatchJob model vs batch_id column)
- ZIP generation implementation (streaming vs temp file)
- Share token generation strategy
- Share page exact layout within dark theme
- Expiration date UI design
- Whether to cache generated ZIP files temporarily
- Batch polling strategy
- Error message wording for failed batch rows
- Manifest.csv exact column ordering

## Deferred Ideas

- Batch scheduling (queue batch for later)
- Batch templates (save and reuse CSV templates)
- Share analytics (view counts, unique listeners)
- Social sharing integrations (Twitter, Facebook)
- Password-protected shares
- Batch result email notifications
- Public batch ZIP sharing
- Share link custom slugs
